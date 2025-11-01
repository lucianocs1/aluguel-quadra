import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { differenceInSeconds, format, isBefore, parseISO, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Copy,
  Info,
  QrCode,
  Ticket,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { CriarReservaDto, HorarioDisponivelDto, Quadra, ReservaPagamentoDto } from "@/types/api";

interface ScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quadra: Quadra | null;
}

const guidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});

const ScheduleDialog = ({ open, onOpenChange, quadra }: ScheduleDialogProps) => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<HorarioDisponivelDto | null>(null);
  const [usuarioId, setUsuarioId] = useState("");
  const [reservaEmPagamento, setReservaEmPagamento] = useState<ReservaPagamentoDto | null>(null);
  const [tempoRestanteSegundos, setTempoRestanteSegundos] = useState(0);
  const [copiouPix, setCopiouPix] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { usuario } = useAuth();

  useEffect(() => {
    if (usuario?.id) {
      setUsuarioId(usuario.id);
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    const saved = window.localStorage.getItem("usuarioId");
    if (saved) {
      setUsuarioId(saved);
    }
  }, [usuario?.id]);

  useEffect(() => {
    const expiraIso = reservaEmPagamento?.pix?.expiraEm ?? reservaEmPagamento?.pagamentoExpiraEm ?? null;
    if (!expiraIso) {
      setTempoRestanteSegundos(0);
      return;
    }

    const expirationDate = new Date(expiraIso);
    if (Number.isNaN(expirationDate.getTime())) {
      setTempoRestanteSegundos(0);
      return;
    }

    const atualizar = () => {
      const restante = Math.max(0, differenceInSeconds(expirationDate, new Date()));
      setTempoRestanteSegundos(restante);
    };

    atualizar();
    const intervalId = window.setInterval(atualizar, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [reservaEmPagamento?.pix?.expiraEm, reservaEmPagamento?.pagamentoExpiraEm]);

  useEffect(() => {
    if (open) {
      setDate(new Date());
      setSelectedSlot(null);
      setReservaEmPagamento(null);
      setTempoRestanteSegundos(0);
      setCopiouPix(false);
    } else {
      setSelectedSlot(null);
      setReservaEmPagamento(null);
      setTempoRestanteSegundos(0);
      setCopiouPix(false);
    }
  }, [open, quadra?.id]);

  const today = startOfDay(new Date());
  const dataConsulta = date ? format(date, "yyyy-MM-dd") : undefined;
  const usuarioIdTrim = usuarioId.trim();
  const usuarioIdValido = useMemo(() => guidRegex.test(usuarioIdTrim), [usuarioIdTrim]);
  const selectedInicioDate = useMemo(
    () => (selectedSlot ? parseISO(selectedSlot.dataHoraInicio) : null),
    [selectedSlot],
  );
  const selectedFimDate = useMemo(
    () => (selectedSlot ? parseISO(selectedSlot.dataHoraFim) : null),
    [selectedSlot],
  );
  const precoEstimado = useMemo(
    () => (quadra ? currencyFormatter.format(quadra.precoPorHora) : null),
    [quadra],
  );

  const {
    data: horarios = [],
    isLoading: isLoadingHorarios,
    isError: isErroHorarios,
    error: erroHorarios,
    refetch: refetchHorarios,
  } = useQuery<HorarioDisponivelDto[], Error>({
    queryKey: ["horarios-disponiveis", quadra?.id, dataConsulta],
    queryFn: () => api.getHorariosDisponiveis(quadra!.id, dataConsulta!),
    enabled: open && Boolean(quadra?.id) && Boolean(dataConsulta),
    staleTime: 5 * 60 * 1000,
  });

  const sortedHorarios = useMemo(() => {
    const agora = new Date();
    return [...horarios]
      .filter((slot) => new Date(slot.dataHoraFim).getTime() > agora.getTime())
      .sort((a, b) => new Date(a.dataHoraInicio).getTime() - new Date(b.dataHoraInicio).getTime());
  }, [horarios]);

  const mutation = useMutation<ReservaPagamentoDto, Error, CriarReservaDto>({
    mutationFn: (payload: CriarReservaDto) => api.criarReserva(payload),
    onSuccess: (reserva) => {
      setReservaEmPagamento(reserva);
      setSelectedSlot(null);
      setCopiouPix(false);

      if (quadra) {
        queryClient.invalidateQueries({ queryKey: ["horarios-disponiveis", quadra.id] });
      }

      toast({
        title: "Pagamento pendente",
        description: "Escaneie o QR Code PIX em até 10 minutos para garantir o horário escolhido.",
      });
    },
    onError: (error) => {
      toast({
        title: "Não foi possível gerar o QR Code",
        description: error.message,
        variant: "destructive",
      });
      setReservaEmPagamento(null);
      setTempoRestanteSegundos(0);
    },
  });

  const verificarPagamentoMutation = useMutation({
    mutationFn: (reservaId: string) => api.verificarStatusPagamentoReserva(reservaId),
    onSuccess: (status) => {
      if (status.pago) {
        toast({
          title: "Pagamento aprovado!",
          description: "Sua reserva foi confirmada.",
        });

        if (quadra) {
          queryClient.invalidateQueries({ queryKey: ["horarios-disponiveis", quadra.id] });
        }

        setReservaEmPagamento(null);
        setTempoRestanteSegundos(0);
        setSelectedSlot(null);
        onOpenChange(false);
      } else if (status.expirado) {
        toast({
          title: "Pagamento expirado",
          description: "O QR Code venceu. Escolha um novo horário para gerar outro pagamento.",
          variant: "destructive",
        });
        setReservaEmPagamento(null);
        setTempoRestanteSegundos(0);
        setSelectedSlot(null);
        if (quadra) {
          queryClient.invalidateQueries({ queryKey: ["horarios-disponiveis", quadra.id] });
        }
      } else {
        toast({
          title: "Pagamento ainda pendente",
          description: "Finalize o pagamento pelo app do seu banco e depois clique em verificar novamente.",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Não foi possível consultar o pagamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleInternalOpenChange = (state: boolean) => {
    if (!state) {
      setSelectedSlot(null);
      setReservaEmPagamento(null);
      setTempoRestanteSegundos(0);
      setCopiouPix(false);
    }
    onOpenChange(state);
  };

  const handleSchedule = () => {
    if (mutation.isPending || !quadra) {
      return;
    }

    if (reservaEmPagamento && tempoRestanteSegundos > 0) {
      toast({
        title: "Pagamento pendente",
        description: "Finalize o pagamento do QR Code atual ou aguarde o vencimento para gerar outro.",
        variant: "destructive",
      });
      return;
    }

    const usuarioIdNormalizado = usuarioIdTrim;

    if (!usuarioIdNormalizado) {
      toast({
        title: "Faça login para agendar",
        description: "Entre com sua conta para concluir a reserva antes de gerar o QR Code.",
        variant: "destructive",
      });
      return;
    }

    if (!usuarioIdValido) {
      toast({
        title: "Não foi possível identificar o usuário",
        description: "Saia e faça login novamente antes de tentar agendar de novo.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedSlot) {
      toast({
        title: "Selecione um horário",
        description: "Escolha um intervalo disponível para prosseguir.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedSlot.disponivel) {
      toast({
        title: "Horário indisponível",
        description: "Selecione um intervalo marcado como disponível.",
        variant: "destructive",
      });
      return;
    }

    mutation.mutate({
      usuarioId: usuarioIdNormalizado,
      quadraId: quadra.id,
      dataHoraInicio: selectedSlot.dataHoraInicio,
    });
  };

  const disabledConfirmButton =
    mutation.isPending ||
    !quadra ||
    !selectedSlot ||
    !selectedSlot.disponivel ||
    !usuarioIdValido ||
    (reservaEmPagamento !== null && tempoRestanteSegundos > 0);

  return (
    <Dialog open={open} onOpenChange={handleInternalOpenChange}>
      <DialogContent className="sm:max-w-[720px] overflow-hidden p-0">
        <ScrollArea className="max-h-[85vh]">
          <div className="space-y-6 px-6 py-6">
            <DialogHeader className="space-y-2">
              <DialogTitle>{quadra ? `Agendar ${quadra.nome}` : "Agendar quadra"}</DialogTitle>
              <DialogDescription>
                {!quadra
                  ? "Escolha uma quadra para visualizar a disponibilidade."
                  : reservaEmPagamento
                    ? "Finalize o pagamento PIX para confirmar o agendamento."
                    : "Selecione a data e o horário desejados para registrar sua reserva."}
              </DialogDescription>
            </DialogHeader>

            {!quadra ? (
              <p className="text-sm text-muted-foreground">
                Selecione uma quadra na página principal para iniciar um agendamento.
              </p>
            ) : reservaEmPagamento ? (
              <PagamentoPixView
                quadra={quadra}
                reserva={reservaEmPagamento}
                tempoRestanteSegundos={tempoRestanteSegundos}
                copiouPix={copiouPix}
                onCopiarPix={async () => {
                  if (!reservaEmPagamento.pix?.qrCode) {
                    return;
                  }

                  if (typeof navigator === "undefined" || !navigator.clipboard) {
                    toast({
                      title: "Copie manualmente",
                      description: "Seu navegador não permite copiar automaticamente. Utilize o código exibido abaixo.",
                      variant: "destructive",
                    });
                    return;
                  }

                  try {
                    await navigator.clipboard.writeText(reservaEmPagamento.pix.qrCode);
                    setCopiouPix(true);
                    toast({ title: "Código copiado", description: "Cole o código no aplicativo do seu banco." });
                    window.setTimeout(() => setCopiouPix(false), 4000);
                  } catch (error) {
                    toast({
                      title: "Não foi possível copiar",
                      description: "Copie o código manualmente através do botão ver código PIX.",
                      variant: "destructive",
                    });
                  }
                }}
                onVerificarPagamento={() => {
                  if (!reservaEmPagamento?.id) {
                    return;
                  }
                  verificarPagamentoMutation.mutate(reservaEmPagamento.id);
                }}
                verificandoPagamento={verificarPagamentoMutation.isPending}
                onGerarNovo={() => {
                  setReservaEmPagamento(null);
                  setTempoRestanteSegundos(0);
                  setSelectedSlot(null);
                }}
              />
            ) : (
              <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
                <section className="space-y-4">
                  <div className="rounded-3xl border border-border/60 bg-background/95 p-4 shadow-sm">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(value) => {
                        setDate(value ?? new Date());
                        setSelectedSlot(null);
                      }}
                      disabled={(currentDate) => isBefore(startOfDay(currentDate), today)}
                      className="mx-auto rounded-2xl border border-border/70 bg-background p-2"
                      locale={ptBR}
                    />
                  </div>

                  <div className="rounded-3xl border border-border/60 bg-background/95 p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                      <CalendarDays className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Resumo do agendamento</p>
                        <h3 className="text-lg font-semibold text-foreground">
                          {selectedInicioDate
                            ? `${format(selectedInicioDate, "dd 'de' MMMM", { locale: ptBR })}`
                            : "Selecione um horário"}
                        </h3>
                      </div>
                    </div>
                    <Separator className="my-4" />
                    {selectedInicioDate && selectedFimDate ? (
                      <div className="space-y-3 text-sm text-muted-foreground">
                        <p className="flex items-center gap-2">
                          <Clock3 className="h-4 w-4 text-primary" />
                          {format(selectedInicioDate, "HH:mm", { locale: ptBR })} - {format(selectedFimDate, "HH'h'", { locale: ptBR })}
                        </p>
                        {precoEstimado ? (
                          <p className="flex items-center gap-2">
                            <Ticket className="h-4 w-4 text-primary" />
                            Valor estimado: <span className="font-semibold text-foreground">{precoEstimado}</span>
                          </p>
                        ) : null}
                        <p className="flex items-start gap-2">
                          <Info className="mt-0.5 h-4 w-4 text-muted-foreground" />
                          Os horários reservados permanecem bloqueados enquanto o QR Code estiver ativo.
                        </p>
                        {usuario?.nome ? (
                          <p className="text-xs text-muted-foreground/80">
                            Reserva vinculada a {usuario.nome}.
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Escolha um horário disponível para visualizar os detalhes da reserva.
                      </p>
                    )}
                  </div>
                </section>

                <section className="flex flex-col gap-4">
                  {!usuarioIdValido ? (
                    <Alert className="border-primary/50 bg-primary/10">
                      <AlertTitle>Faça login para reservar</AlertTitle>
                      <AlertDescription>
                        Entre na sua conta para que possamos concluir o agendamento em seu nome.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="rounded-3xl border border-border/60 bg-background/95 p-5 shadow-sm">
                      <h3 className="text-base font-semibold text-foreground">Tudo pronto para agendar</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {usuario?.nome
                          ? `A reserva será associada ao usuário ${usuario.nome}.`
                          : "Estamos usando o usuário autenticado para concluir o agendamento."}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Caso tenha problemas, encerre a sessão e entre novamente antes de tentar agendar.
                      </p>
                    </div>
                  )}

                  <div className="rounded-3xl border border-border/60 bg-background/95 p-5 shadow-sm">
                    <div className="flex flex-wrap items-start gap-2">
                      <div>
                        <h3 className="text-base font-semibold text-foreground">Horários disponíveis</h3>
                        <p className="text-sm text-muted-foreground">
                          Reservas de 60 minutos entre 08h e 20h (horário local).
                        </p>
                      </div>
                    </div>
                    <Separator className="my-4" />

                    {isLoadingHorarios ? (
                      <div className="flex min-h-[160px] items-center justify-center text-sm text-muted-foreground">
                        Carregando horários...
                      </div>
                    ) : null}

                    {isErroHorarios ? (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Erro ao carregar horários</AlertTitle>
                        <AlertDescription className="mt-2 space-y-2">
                          <p>{erroHorarios?.message ?? "Tente novamente em instantes."}</p>
                          <Button size="sm" variant="outline" onClick={() => refetchHorarios()}>
                            Tentar novamente
                          </Button>
                        </AlertDescription>
                      </Alert>
                    ) : null}

                    {!isLoadingHorarios && !isErroHorarios && sortedHorarios.length === 0 ? (
                      <div className="flex min-h-[160px] items-center justify-center text-sm text-muted-foreground">
                        Não existem horários cadastrados para a data selecionada.
                      </div>
                    ) : null}

                    {!isLoadingHorarios && !isErroHorarios && sortedHorarios.length > 0 ? (
                      <ScrollArea className="max-h-[320px] pr-1">
                        <ScrollArea className="max-h-[320px] pr-1">
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                            {sortedHorarios.map((slot) => {
                              const inicio = parseISO(slot.dataHoraInicio);
                              const fim = parseISO(slot.dataHoraFim);
                              const faixaLabel = `${format(inicio, "HH:mm", { locale: ptBR })} - ${format(fim, "HH'h'", { locale: ptBR })}`;
                              const isSelected = selectedSlot?.dataHoraInicio === slot.dataHoraInicio;

                              return (
                                <Button
                                  key={slot.dataHoraInicio}
                                  variant={isSelected ? "default" : "outline"}
                                  onClick={() => slot.disponivel && setSelectedSlot(slot)}
                                  disabled={!slot.disponivel || mutation.isPending}
                                  className={!slot.disponivel ? "opacity-60" : undefined}
                                >
                                  {faixaLabel}
                                </Button>
                              );
                            })}
                          </div>
                        </ScrollArea>
                      </ScrollArea>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Button
                      onClick={handleSchedule}
                      className="w-full rounded-full bg-accent text-accent-foreground hover:bg-accent/90"
                      size="lg"
                      disabled={disabledConfirmButton}
                    >
                      {mutation.isPending ? "Gerando QR Code..." : "Confirmar e gerar QR Code PIX"}
                    </Button>
                    <p className="text-center text-xs text-muted-foreground">
                      O QR Code expira em 10 minutos após a geração. Conclua o pagamento para bloquear o horário.
                    </p>
                  </div>
                </section>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

type PagamentoPixViewProps = {
  quadra: Quadra;
  reserva: ReservaPagamentoDto;
  tempoRestanteSegundos: number;
  copiouPix: boolean;
  onCopiarPix: () => void | Promise<void>;
  verificandoPagamento: boolean;
  onVerificarPagamento: () => void;
  onGerarNovo: () => void;
};

const PagamentoPixView = ({
  quadra,
  reserva,
  tempoRestanteSegundos,
  copiouPix,
  onCopiarPix,
  verificandoPagamento,
  onVerificarPagamento,
  onGerarNovo,
}: PagamentoPixViewProps) => {
  const pixInfo = reserva.pix;
  const pagamentoExpirado = tempoRestanteSegundos <= 0;
  const tempoRestanteFormatado = pagamentoExpirado
    ? "00:00"
    : `${Math.floor(tempoRestanteSegundos / 60)
        .toString()
        .padStart(2, "0")}:${(tempoRestanteSegundos % 60).toString().padStart(2, "0")}`;

  const inicio = parseISO(reserva.dataHoraInicio);
  const fim = parseISO(reserva.dataHoraFim);
  const valorFormatado = currencyFormatter.format(reserva.precoTotal ?? 0);
  const linkPix = pixInfo?.ticketUrl ?? reserva.pixTicketUrl ?? null;

  return (
    <div className="grid gap-6 py-4">
      <div className="rounded-3xl border border-border/60 bg-muted/10 p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Quadra selecionada</p>
            <h3 className="text-xl font-semibold text-foreground">{quadra.nome}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {format(inicio, "dd 'de' MMMM", { locale: ptBR })} • {format(inicio, "HH:mm", { locale: ptBR })} - {format(fim, "HH'h'", { locale: ptBR })}
            </p>
          </div>
          <div
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${
              pagamentoExpirado
                ? "border-destructive/50 bg-destructive/10 text-destructive"
                : "border-primary/40 bg-primary/10 text-primary"
            }`}
          >
            <Clock3 className="h-4 w-4" />
            {pagamentoExpirado ? "Tempo esgotado" : `Expira em ${tempoRestanteFormatado}`}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div className="rounded-3xl border border-border/60 bg-background/95 p-4 text-center shadow-sm">
            {pixInfo?.qrCodeBase64 ? (
              <img
                src={`data:image/png;base64,${pixInfo.qrCodeBase64}`}
                alt="QR Code PIX"
                className="mx-auto h-64 w-64 object-contain"
                loading="lazy"
              />
            ) : (
              <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
                <QrCode className="h-10 w-10" />
                <p>QR Code indisponível. Utilize o botão de copiar código PIX.</p>
              </div>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              Aponte a câmera do aplicativo do seu banco para este QR Code para pagar com PIX.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              variant="secondary"
              className="rounded-full"
              onClick={onCopiarPix}
              disabled={!pixInfo?.qrCode || verificandoPagamento}
            >
              {copiouPix ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              {copiouPix ? "Código PIX copiado" : "Copiar código PIX"}
            </Button>

            {pixInfo?.qrCode ? (
              <details className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-3 text-xs text-muted-foreground">
                <summary className="cursor-pointer text-sm font-semibold text-foreground">Ver código PIX completo</summary>
                <p className="mt-2 break-all text-muted-foreground/90">{pixInfo.qrCode}</p>
              </details>
            ) : null}

            {linkPix ? (
              <Button asChild variant="outline" className="rounded-full">
                <a href={linkPix} target="_blank" rel="noreferrer">
                  Abrir link no app do banco
                </a>
              </Button>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-3xl border border-border/60 bg-muted/20 p-5 shadow-sm">
            <h4 className="text-sm font-semibold text-foreground">Resumo do pagamento</h4>
            <div className="mt-3 space-y-2 text-sm text-muted-foreground">
              <p>
                Valor total: <span className="font-semibold text-foreground">{valorFormatado}</span>
              </p>
              <p>Código da reserva: {reserva.id.split("-")[0]}</p>
              <p>Status atual: {reserva.pagamentoStatus ?? "pendente"}</p>
            </div>
          </div>

          <div className="rounded-3xl border border-border/60 bg-background/95 p-5 shadow-sm">
            <h4 className="text-sm font-semibold text-foreground">Próximos passos</h4>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>Abra o aplicativo do seu banco e escolha pagar com PIX.</li>
              <li>Escaneie o QR Code ou cole o código copiado.</li>
              <li>Conclua o pagamento antes do tempo expirar.</li>
              <li>Clique em "Verificar pagamento" para confirmar a reserva.</li>
            </ul>

            <div className="mt-4 flex flex-col gap-2">
              <Button
                className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={verificandoPagamento || pagamentoExpirado}
                onClick={onVerificarPagamento}
              >
                {verificandoPagamento ? "Verificando..." : "Verificar pagamento"}
              </Button>
              <Button
                variant="ghost"
                className="rounded-full"
                onClick={onGerarNovo}
                disabled={verificandoPagamento}
              >
                Escolher outro horário
              </Button>
              {pagamentoExpirado ? (
                <p className="text-xs text-destructive">
                  O QR Code expirou. Gere um novo selecionando novamente data e horário.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Assim que o pagamento for aprovado o horário será confirmado automaticamente.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleDialog;

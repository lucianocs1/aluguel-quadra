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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { format, isBefore, parseISO, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertCircle } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import type { CriarReservaDto, HorarioDisponivelDto, Quadra } from "@/types/api";

interface ScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quadra: Quadra | null;
}

const guidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

const ScheduleDialog = ({ open, onOpenChange, quadra }: ScheduleDialogProps) => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<HorarioDisponivelDto | null>(null);
  const [usuarioId, setUsuarioId] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const saved = window.localStorage.getItem("usuarioId");
    if (saved) {
      setUsuarioId(saved);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setDate(new Date());
      setSelectedSlot(null);
    } else {
      setSelectedSlot(null);
    }
  }, [open, quadra?.id]);

  const today = startOfDay(new Date());
  const dataConsulta = date ? format(date, "yyyy-MM-dd") : undefined;

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

  const sortedHorarios = useMemo(
    () =>
      [...horarios].sort(
        (a, b) => new Date(a.dataHoraInicio).getTime() - new Date(b.dataHoraInicio).getTime(),
      ),
    [horarios],
  );

  const mutation = useMutation({
    mutationFn: (payload: CriarReservaDto) => api.criarReserva(payload),
    onSuccess: (reserva) => {
      if (typeof window !== "undefined") {
        window.localStorage.setItem("usuarioId", reserva.usuarioId);
        const nomeCompleto = `${reserva.usuarioNome} ${reserva.usuarioSobrenome}`.trim();
        window.localStorage.setItem("usuarioNome", nomeCompleto);
      }

      if (quadra) {
        const inicio = parseISO(reserva.dataHoraInicio);
        toast({
          title: "Reserva confirmada!",
          description: `${quadra.nome} reservada para ${format(inicio, "dd/MM/yyyy", { locale: ptBR })} às ${format(inicio, "HH:mm", { locale: ptBR })}`,
        });
      }

      setSelectedSlot(null);
      if (quadra) {
        queryClient.invalidateQueries({ queryKey: ["horarios-disponiveis", quadra.id] });
      }
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Não foi possível concluir a reserva",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleInternalOpenChange = (state: boolean) => {
    if (!state) {
      setSelectedSlot(null);
    }
    onOpenChange(state);
  };

  const handleSchedule = () => {
    if (mutation.isPending || !quadra) {
      return;
    }

    const usuarioIdTrim = usuarioId.trim();

    if (!usuarioIdTrim) {
      toast({
        title: "Informe o identificador do usuário",
        description: "Digite o GUID do usuário cadastrado antes de confirmar.",
        variant: "destructive",
      });
      return;
    }

    if (!guidRegex.test(usuarioIdTrim)) {
      toast({
        title: "Identificador inválido",
        description: "O identificador do usuário deve estar no formato de GUID.",
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

    setUsuarioId(usuarioIdTrim);

    mutation.mutate({
      usuarioId: usuarioIdTrim,
      quadraId: quadra.id,
      dataHoraInicio: selectedSlot.dataHoraInicio,
    });
  };

  const disabledConfirmButton =
    mutation.isPending ||
    !quadra ||
    !selectedSlot ||
    !selectedSlot.disponivel ||
    !guidRegex.test(usuarioId.trim());

  return (
    <Dialog open={open} onOpenChange={handleInternalOpenChange}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>{quadra ? `Agendar ${quadra.nome}` : "Agendar quadra"}</DialogTitle>
          <DialogDescription>
            {quadra
              ? "Selecione a data e o horário desejados para registrar sua reserva."
              : "Escolha uma quadra para visualizar a disponibilidade."}
          </DialogDescription>
        </DialogHeader>

        {!quadra ? (
          <p className="text-sm text-muted-foreground">
            Selecione uma quadra na página principal para iniciar um agendamento.
          </p>
        ) : (
          <div className="grid gap-6 py-4">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="flex justify-center md:w-1/2">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(value) => {
                    setDate(value ?? new Date());
                    setSelectedSlot(null);
                  }}
                  disabled={(currentDate) => isBefore(startOfDay(currentDate), today)}
                  className="rounded-md border"
                  locale={ptBR}
                />
              </div>

              <div className="flex flex-1 flex-col gap-4">
                <div>
                  <Label htmlFor="usuario-id" className="mb-2 block">
                    Identificador do usuário (GUID)
                  </Label>
                  <Input
                    id="usuario-id"
                    placeholder="00000000-0000-0000-0000-000000000000"
                    value={usuarioId}
                    onChange={(event) => setUsuarioId(event.target.value)}
                    autoComplete="off"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Utilize o identificador cadastrado no backend para concluir a reserva.
                  </p>
                </div>

                <div>
                  <h3 className="mb-3 font-semibold">Horários disponíveis:</h3>

                  {isLoadingHorarios ? (
                    <p className="text-sm text-muted-foreground">Carregando horários...</p>
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
                    <p className="text-sm text-muted-foreground">
                      Não existem horários cadastrados para a data selecionada.
                    </p>
                  ) : null}

                  {!isLoadingHorarios && !isErroHorarios && sortedHorarios.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {sortedHorarios.map((slot) => {
                        const inicio = parseISO(slot.dataHoraInicio);
                        const fim = parseISO(slot.dataHoraFim);
                        const label = `${format(inicio, "HH:mm", { locale: ptBR })} - ${format(fim, "HH:mm", { locale: ptBR })}`;
                        const isSelected = selectedSlot?.dataHoraInicio === slot.dataHoraInicio;

                        return (
                          <Button
                            key={slot.dataHoraInicio}
                            variant={isSelected ? "default" : "outline"}
                            onClick={() => slot.disponivel && setSelectedSlot(slot)}
                            disabled={!slot.disponivel || mutation.isPending}
                            className={!slot.disponivel ? "opacity-60" : undefined}
                          >
                            {label}
                          </Button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <Button
              onClick={handleSchedule}
              className="w-full bg-accent hover:bg-accent/90"
              size="lg"
              disabled={disabledConfirmButton}
            >
              {mutation.isPending ? "Agendando..." : "Confirmar reserva"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleDialog;

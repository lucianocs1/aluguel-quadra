import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, CalendarDays, CalendarCheck, Clock3, ShieldCheck, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import QuadraCard from "@/components/QuadraCard";
import ScheduleDialog from "@/components/ScheduleDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";
import type { Quadra } from "@/types/api";

const Index = () => {
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [selectedQuadra, setSelectedQuadra] = useState<Quadra | null>(null);

  const { data: quadras, isLoading, isError, error, refetch } = useQuery<Quadra[], Error>({
    queryKey: ["quadras"],
    queryFn: () => api.getQuadras(),
  });

  const quadrasDisponiveis = useMemo(() => quadras ?? [], [quadras]);

  const featureHighlights = [
    {
      icon: CalendarDays,
      title: "Calendário inteligente",
      description: "Visualize as quadras disponíveis por data e horário em poucos cliques.",
    },
    {
      icon: Clock3,
      title: "Reserva instantânea",
      description: "Garanta o horário desejado em menos de um minuto, sem complicações.",
    },
    {
      icon: ShieldCheck,
      title: "Gestão confiável",
      description: "Suas informações e reservas ficam protegidas em um painel seguro.",
    },
  ];

  const handleScheduleClick = (quadra: Quadra) => {
    setSelectedQuadra(quadra);
    setScheduleOpen(true);
  };

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      setSelectedQuadra(null);
    }
    setScheduleOpen(open);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-12">
        <section className="relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-primary/10 via-background to-background shadow-lg">
          <span className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/30 blur-3xl" />
          <span className="pointer-events-none absolute -bottom-16 left-10 h-56 w-56 rounded-full bg-accent/30 blur-3xl" />
          <div className="relative z-10 flex flex-col gap-8 px-6 py-12 sm:px-12 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl space-y-6 text-center lg:text-left">
              <span className="inline-flex items-center gap-2 rounded-full bg-background/80 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                <CalendarCheck className="h-3.5 w-3.5" /> agende em poucos cliques
              </span>
              <h1 className="text-4xl font-bold leading-tight text-foreground sm:text-5xl">
                Escolha seu horário preferido e marque sua próxima partida na areia
              </h1>
              <p className="text-base text-muted-foreground sm:text-lg">
                Navegue pelas quadras disponíveis, visualize os horários em tempo real e confirme a reserva que melhor encaixa com seu time. Tudo digital, intuitivo e rápido.
              </p>
              <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-start">
                <Button size="lg" className="w-full rounded-full sm:w-auto" asChild>
                  <a href="#quadras-disponiveis" className="flex items-center justify-center gap-2">
                    Ver quadras disponíveis
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
                {quadrasDisponiveis.length > 0 ? (
                  <Button
                    variant="ghost"
                    size="lg"
                    className="w-full rounded-full border border-border/60 sm:w-auto"
                    onClick={() => {
                      setSelectedQuadra(quadrasDisponiveis[0]);
                      setScheduleOpen(true);
                    }}
                  >
                    Agendar agora
                  </Button>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-muted-foreground lg:justify-start">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary" /> reservas atualizadas em tempo real
                </div>
                <div className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-primary" /> confirme em até 10 minutos
                </div>
              </div>
            </div>

            <div className="grid w-full max-w-md gap-4 rounded-3xl border border-border/60 bg-background/80 p-6 shadow-xl backdrop-blur">
              <div className="flex items-center gap-3 border-b border-border/40 pb-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <CalendarCheck className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-foreground">Fluxo de agendamento simplificado</span>
                  <span className="text-xs text-muted-foreground">Selecione a quadra, escolha o horário e confirme.</span>
                </div>
              </div>
              {featureHighlights.map(({ icon: Icon, title, description }) => (
                <div key={title} className="flex items-start gap-3 rounded-2xl border border-border/40 bg-muted/20 p-4">
                  <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                    <p className="text-xs text-muted-foreground">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-16">
          <header className="mb-10 text-center">
            <span className="text-xs font-semibold uppercase tracking-wide text-primary">Quadras disponíveis</span>
            <h2 className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">Escolha onde jogar e veja os horários abertos</h2>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              Acesse a lista completa de quadras atualizada e encontre rapidamente o melhor momento para sua próxima partida.
            </p>
          </header>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="space-y-4">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        ) : null}

        {isError ? (
          <div className="mx-auto max-w-xl">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Não foi possível carregar as quadras</AlertTitle>
              <AlertDescription className="mt-2 space-y-4">
                <p>{error?.message ?? "Ocorreu um erro inesperado."}</p>
                <Button variant="outline" onClick={() => refetch()}>
                  Tentar novamente
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        ) : null}

        {!isLoading && !isError && quadrasDisponiveis.length === 0 ? (
          <div className="mx-auto max-w-md rounded-2xl border border-dashed border-border/60 bg-muted/20 p-10 text-center">
            <CalendarDays className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-foreground">Nenhuma quadra cadastrada ainda</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Assim que novas quadras forem adicionadas, seus horários disponíveis aparecerão aqui para agendamento.
            </p>
          </div>
        ) : null}

        {!isLoading && !isError && quadrasDisponiveis.length ? (
          <div id="quadras-disponiveis" className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {quadrasDisponiveis.map((quadra) => (
              <QuadraCard key={quadra.id} quadra={quadra} onSchedule={() => handleScheduleClick(quadra)} />
            ))}
          </div>
        ) : null}
        </section>
      </main>

      <ScheduleDialog open={scheduleOpen} onOpenChange={handleDialogChange} quadra={selectedQuadra} />
    </div>
  );
};

export default Index;

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
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
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">Nossas Quadras de Areia</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Reserve seu horário e aproveite as melhores quadras de areia da região. Escolha a quadra ideal para seu jogo!
          </p>
        </div>

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

        {!isLoading && !isError && quadras?.length === 0 ? (
          <p className="text-center text-muted-foreground">Nenhuma quadra cadastrada até o momento.</p>
        ) : null}

        {!isLoading && !isError && quadras?.length ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {quadras.map((quadra) => (
              <QuadraCard key={quadra.id} quadra={quadra} onSchedule={() => handleScheduleClick(quadra)} />
            ))}
          </div>
        ) : null}
      </main>

      <ScheduleDialog open={scheduleOpen} onOpenChange={handleDialogChange} quadra={selectedQuadra} />
    </div>
  );
};

export default Index;

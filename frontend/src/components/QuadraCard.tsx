import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Quadra } from "@/types/api";

interface QuadraCardProps {
  quadra: Quadra;
  onSchedule: () => void;
}

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});

const QuadraCard = ({ quadra, onSchedule }: QuadraCardProps) => {
  const precoFormatado = currencyFormatter.format(quadra.precoPorHora);

  return (
    <Card className="overflow-hidden transition-shadow duration-300 hover:shadow-lg">
      <div className="relative h-48 bg-gradient-to-br from-primary/80 to-primary">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute left-4 top-4 rounded-full bg-background/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-foreground shadow">
          {quadra.modalidadePrincipal}
        </div>
        <div className="relative z-10 flex h-full w-full items-center justify-center px-4 text-center text-2xl font-semibold text-primary-foreground drop-shadow">
          {quadra.nome}
        </div>
      </div>

      <CardContent className="space-y-4 pt-6">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted-foreground">Valor da hora</span>
          <span className="text-lg font-bold text-primary">{precoFormatado}</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Consulte os horários disponíveis e garanta sua próxima partida.
        </p>
      </CardContent>

      <CardFooter>
        <Button className="w-full bg-accent hover:bg-accent/90" onClick={onSchedule}>
          Ver horários
        </Button>
      </CardFooter>
    </Card>
  );
};

export default QuadraCard;

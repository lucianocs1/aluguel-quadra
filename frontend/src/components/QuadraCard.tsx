import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { resolveQuadraImage } from "@/lib/images";
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

  const quadraImagemUrl = resolveQuadraImage(quadra.imagemUrl);
  const hasImagem = Boolean(quadraImagemUrl);

  return (
  <Card className="overflow-hidden border-border/50 bg-card/95 shadow-sm">
      <div className="relative">
        <div className="relative h-48 overflow-hidden">
          {hasImagem ? (
            <img
              src={quadraImagemUrl ?? undefined}
              alt={quadra.nome}
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary via-primary/80 to-primary/60 text-3xl font-bold text-primary-foreground">
              {quadra.nome.slice(0, 1)}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/60 to-transparent" />
        </div>

        <div className="absolute inset-x-0 bottom-0 px-5 pb-5">
          <h3 className="text-2xl font-semibold text-foreground drop-shadow-sm">{quadra.nome}</h3>
        </div>
      </div>

      <CardContent className="space-y-4 pt-6">
        <div className="flex items-baseline justify-between rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">Valor da hora</span>
            <span className="text-lg font-bold text-primary">{precoFormatado}</span>
          </div>
          <div className="text-right text-xs text-muted-foreground">Agende online de forma rápida</div>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Confira os horários disponíveis e garanta o melhor momento para sua partida na areia.
        </p>
      </CardContent>

      <CardFooter>
        <Button className="w-full rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90" onClick={onSchedule}>
          Ver horários disponíveis
        </Button>
      </CardFooter>
    </Card>
  );
};

export default QuadraCard;

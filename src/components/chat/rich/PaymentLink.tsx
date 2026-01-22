import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, ExternalLink } from 'lucide-react';
import { PaymentLinkData } from '@/types/database';

interface PaymentLinkProps {
  data: PaymentLinkData;
}

export function PaymentLink({ data }: PaymentLinkProps) {
  return (
    <Card className="glass-card border-primary/30 my-4 glow">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2 text-primary">
          <CreditCard className="h-4 w-4" />
          Pagamento Seguro (Stripe)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-muted-foreground">
          <p>
            Reserva: <span className="font-mono text-foreground/90">{data.bookingId}</span>
          </p>
          <p>
            Valor: <span className="text-primary font-semibold">{formatBRL(data.amount)}</span>
          </p>
          {data.note && <p className="mt-2">{data.note}</p>}
        </div>

        <Button asChild className="w-full gradient-button">
          <a href={data.url} target="_blank" rel="noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            Abrir Checkout
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}

function formatBRL(amount: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
}

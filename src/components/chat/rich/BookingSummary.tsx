import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Ship, Calendar, Users, CreditCard, Check } from 'lucide-react';
import { BookingSummaryData } from '@/types/database';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BookingSummaryProps {
  data: BookingSummaryData;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export function BookingSummary({ data, onConfirm, onCancel }: BookingSummaryProps) {
  const { booking } = data;
  const parsedDate = parseISO(booking.date);

  return (
    <Card className="glass-card border-primary/30 my-4 glow">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2 text-primary">
          <CreditCard className="h-4 w-4" />
          Resumo da Reserva
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Boat Info */}
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <div className="p-2 rounded-lg bg-primary/20">
            <Ship className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{booking.boatName}</p>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{format(parsedDate, "dd 'de' MMMM, yyyy", { locale: ptBR })}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{booking.passengers} passageiros</span>
          </div>
        </div>

        <Separator className="bg-border/30" />

        {/* Price Breakdown */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Valor base</span>
            <span>
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(booking.basePrice)}
            </span>
          </div>
          {booking.depositAmount && booking.depositAmount > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Sinal para reserva</span>
              <span>
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(booking.depositAmount)}
              </span>
            </div>
          )}
          <Separator className="bg-border/30" />
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="text-primary">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(booking.totalPrice)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={onCancel}>
            Cancelar
          </Button>
          <Button className="flex-1 gradient-button" onClick={onConfirm}>
            <Check className="h-4 w-4 mr-1" />
            Confirmar Reserva
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

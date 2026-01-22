import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, Check } from 'lucide-react';
import { BookingCalendarData } from '@/types/database';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BookingCalendarProps {
  data: BookingCalendarData;
  onSelectDate?: (boatId: string, date: string) => void;
}

export function BookingCalendar({ data, onSelectDate }: BookingCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    data.selectedDate ? parseISO(data.selectedDate) : undefined
  );

  const availableDates = new Set(data.availableDates);
  const blockedDates = new Set(data.blockedDates);

  const handleSelect = (date: Date | undefined) => {
    if (!date) return;
    const dateStr = format(date, 'yyyy-MM-dd');
    if (blockedDates.has(dateStr)) return;
    
    setSelectedDate(date);
    onSelectDate?.(data.boatId, dateStr);
  };

  const modifiers = {
    available: (date: Date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      return availableDates.has(dateStr) && !blockedDates.has(dateStr);
    },
    blocked: (date: Date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      return blockedDates.has(dateStr);
    },
  };

  const modifiersStyles = {
    available: {
      backgroundColor: 'hsl(var(--success) / 0.2)',
      color: 'hsl(var(--success))',
    },
    blocked: {
      backgroundColor: 'hsl(var(--muted))',
      color: 'hsl(var(--muted-foreground))',
      textDecoration: 'line-through',
      opacity: 0.5,
    },
  };

  return (
    <Card className="glass-card border-border/30 my-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          Disponibilidade: {data.boatName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          modifiers={modifiers}
          modifiersStyles={modifiersStyles}
          locale={ptBR}
          disabled={(date) => {
            const dateStr = format(date, 'yyyy-MM-dd');
            return date < new Date() || blockedDates.has(dateStr);
          }}
          className="rounded-md border-0"
        />

        {selectedDate && (
          <div className="mt-4 p-3 bg-primary/10 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span className="text-sm">
                Data selecionada:{' '}
                <strong>
                  {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                </strong>
              </span>
            </div>
            <Button
              size="sm"
              className="gradient-button"
              onClick={() => {
                const dateStr = format(selectedDate, 'yyyy-MM-dd');
                onSelectDate?.(data.boatId, dateStr);
              }}
            >
              Continuar
            </Button>
          </div>
        )}

        <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsl(var(--success) / 0.2)' }} />
            <span>Disponível</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-muted" />
            <span>Indisponível</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

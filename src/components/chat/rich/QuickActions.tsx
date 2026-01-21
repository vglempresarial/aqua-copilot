import { Button } from '@/components/ui/button';
import { QuickActionsData } from '@/types/database';
import { cn } from '@/lib/utils';

interface QuickActionsProps {
  data: QuickActionsData;
  onAction?: (action: string) => void;
}

export function QuickActions({ data, onAction }: QuickActionsProps) {
  return (
    <div className="flex flex-wrap gap-2 my-3">
      {data.actions.map((action, index) => (
        <Button
          key={index}
          variant={action.variant === 'primary' ? 'default' : action.variant === 'outline' ? 'outline' : 'secondary'}
          size="sm"
          onClick={() => onAction?.(action.action)}
          className={cn(
            "transition-all hover:scale-105",
            action.variant === 'primary' && "gradient-button"
          )}
        >
          {action.label}
        </Button>
      ))}
    </div>
  );
}

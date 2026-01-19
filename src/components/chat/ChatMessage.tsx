import { User, Sparkles } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '@/types/database';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'flex gap-3 md:gap-4 p-4 rounded-2xl animate-fade-in',
        isUser ? 'chat-message-user' : 'chat-message-assistant'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser
            ? 'bg-primary/20 border border-primary/30'
            : 'bg-accent/20 border border-accent/30'
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 text-primary" />
        ) : (
          <Sparkles className="w-4 h-4 text-accent" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span
            className={cn(
              'text-xs font-medium',
              isUser ? 'text-primary' : 'text-accent'
            )}
          >
            {isUser ? 'Você' : 'Assistente'}
          </span>
          <span className="text-xs text-muted-foreground">
            {new Date(message.created_at).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
        <div className="prose prose-invert prose-sm max-w-none">
          <div className="whitespace-pre-wrap text-foreground/90 leading-relaxed">
            {formatMessage(message.content)}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatMessage(content: string) {
  // Simple markdown-like formatting
  const parts = content.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
  
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="text-primary font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
      return (
        <em key={i} className="text-accent">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="bg-muted px-1.5 py-0.5 rounded text-primary text-xs">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Anchor, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useChat } from '@/hooks/useChat';
import { ChatMessage } from './ChatMessage';
import { cn } from '@/lib/utils';

interface ChatInterfaceProps {
  ownerId?: string;
  className?: string;
}

const WELCOME_MESSAGE = `Olá! 👋 Bem-vindo ao **NauticaMarket**, seu marketplace premium de experiências náuticas.

Sou seu assistente virtual e estou aqui para ajudá-lo a encontrar a embarcação perfeita para sua próxima aventura no mar.

Como posso ajudá-lo hoje? Você pode me perguntar sobre:
- 🚤 Tipos de embarcações disponíveis
- 📅 Disponibilidade e reservas
- 💰 Preços e pacotes
- 🗺️ Roteiros e destinos
- ⭐ Recomendações personalizadas`;

const SUGGESTIONS = [
  'Quero alugar um iate para 10 pessoas no próximo sábado',
  'Quais embarcações têm tripulação inclusa?',
  'Me mostre lanchas disponíveis em Angra dos Reis',
  'Quanto custa um passeio de catamarã?',
];

export function ChatInterface({ ownerId, className }: ChatInterfaceProps) {
  const { messages, isLoading, error, sendMessage } = useChat({ ownerId });
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput('');
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {/* Welcome Message */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full space-y-8 animate-fade-in">
            {/* Logo & Title */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 glow">
                <Anchor className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-3xl md:text-4xl font-display font-bold gradient-text">
                NauticaMarket
              </h1>
              <p className="text-muted-foreground max-w-md mx-auto">
                Seu marketplace premium de experiências náuticas
              </p>
            </div>

            {/* Welcome Card */}
            <div className="glass-card p-6 rounded-2xl max-w-2xl w-full">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-accent" />
                </div>
                <div className="prose prose-invert prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-foreground/90 leading-relaxed">
                    {WELCOME_MESSAGE.split('**').map((part, i) => 
                      i % 2 === 1 ? <strong key={i} className="text-primary">{part}</strong> : part
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Suggestions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl w-full">
              {SUGGESTIONS.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="glass-card p-4 rounded-xl text-left text-sm text-foreground/80 hover:text-foreground hover:border-primary/40 transition-all duration-300 group"
                >
                  <span className="text-primary mr-2">→</span>
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat Messages */}
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} onSendMessage={sendMessage} />
        ))}

        {/* Loading Indicator */}
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex items-center gap-3 p-4">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center pulse-glow">
              <Loader2 className="w-4 h-4 text-accent animate-spin" />
            </div>
            <span className="text-muted-foreground text-sm">Pensando...</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="glass-card p-4 rounded-xl border-destructive/50 bg-destructive/10">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-border/50 p-4 bg-background/50 backdrop-blur-xl">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="relative glass-card rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-primary/50 transition-all duration-300">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua mensagem..."
              className="min-h-[56px] max-h-[200px] resize-none border-0 bg-transparent focus-visible:ring-0 pr-14 py-4 text-foreground placeholder:text-muted-foreground"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 bottom-2 h-10 w-10 rounded-xl gradient-button border-0 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Pressione Enter para enviar • Shift+Enter para nova linha
          </p>
        </form>
      </div>
    </div>
  );
}

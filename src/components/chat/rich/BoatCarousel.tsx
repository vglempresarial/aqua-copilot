import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BoatCard } from './BoatCard';
import { BoatCarouselData } from '@/types/database';
import { cn } from '@/lib/utils';

interface BoatCarouselProps {
  data: BoatCarouselData;
  onBook?: (boatId: string) => void;
  onFavorite?: (boatId: string) => void;
}

export function BoatCarousel({ data, onBook, onFavorite }: BoatCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const cardWidth = 300; // approximate card width + gap
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -cardWidth : cardWidth,
      behavior: 'smooth',
    });
  };

  if (!data.boats || data.boats.length === 0) {
    return null;
  }

  return (
    <div className="my-4 -mx-2">
      {data.title && (
        <h4 className="text-sm font-medium text-muted-foreground mb-3 px-2">
          {data.title}
        </h4>
      )}

      <div className="relative group">
        {/* Scroll Buttons */}
        {data.boats.length > 2 && (
          <>
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll('left')}
              className={cn(
                "absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full bg-background/80 backdrop-blur-sm shadow-lg opacity-0 group-hover:opacity-100 transition-opacity",
                !canScrollLeft && "hidden"
              )}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll('right')}
              className={cn(
                "absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full bg-background/80 backdrop-blur-sm shadow-lg opacity-0 group-hover:opacity-100 transition-opacity",
                !canScrollRight && "hidden"
              )}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Cards Container */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-4 overflow-x-auto pb-4 px-2 no-scrollbar scroll-smooth snap-x snap-mandatory"
        >
          {data.boats.map((boat) => (
            <div key={boat.id} className="snap-start flex-shrink-0">
              <BoatCard
                boat={boat}
                onBook={onBook}
                onFavorite={onFavorite}
                compact
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

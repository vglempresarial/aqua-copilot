import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Ruler, Heart, Calendar, ChevronLeft, ChevronRight, Anchor } from 'lucide-react';
import { BoatCardData } from '@/types/database';
import { cn } from '@/lib/utils';

interface BoatCardProps {
  boat: BoatCardData['boat'];
  onBook?: (boatId: string) => void;
  onFavorite?: (boatId: string) => void;
  compact?: boolean;
}

const boatTypeLabels: Record<string, string> = {
  leisure_boat: 'Barco de Passeio',
  jet_ski: 'Jet Ski',
  yacht: 'Iate',
  sailboat: 'Veleiro',
  speedboat: 'Lancha',
  fishing_boat: 'Barco de Pesca',
  pontoon: 'Pontão',
  catamaran: 'Catamarã',
};

const boatTypeBadgeClass: Record<string, string> = {
  yacht: 'badge-yacht',
  jet_ski: 'badge-jetski',
  sailboat: 'badge-sailboat',
};

export function BoatCard({ boat, onBook, onFavorite, compact = false }: BoatCardProps) {
  const navigate = useNavigate();
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);

  const photos = boat.photos?.length > 0 ? boat.photos : [];
  const primaryPhotoIndex = photos.findIndex(p => p.is_primary);
  const sortedPhotos = primaryPhotoIndex > 0 
    ? [photos[primaryPhotoIndex], ...photos.filter((_, i) => i !== primaryPhotoIndex)]
    : photos;

  const currentPhoto = sortedPhotos[currentPhotoIndex]?.url;

  const nextPhoto = () => {
    if (sortedPhotos.length > 1) {
      setCurrentPhotoIndex((prev) => (prev + 1) % sortedPhotos.length);
    }
  };

  const prevPhoto = () => {
    if (sortedPhotos.length > 1) {
      setCurrentPhotoIndex((prev) => (prev - 1 + sortedPhotos.length) % sortedPhotos.length);
    }
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorited(!isFavorited);
    onFavorite?.(boat.id);
  };

  const handleBook = (e: React.MouseEvent) => {
    e.stopPropagation();
    onBook?.(boat.id);
  };

  return (
    <Card 
      className={cn(
        "glass-card border-border/30 rich-card overflow-hidden cursor-pointer group",
        compact ? "w-72" : "w-full max-w-sm"
      )}
    >
      {/* Photo Carousel */}
      <div className={cn("relative bg-muted", compact ? "h-40" : "h-48")}>
        {currentPhoto ? (
          <img
            src={currentPhoto}
            alt={boat.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Anchor className="h-12 w-12 text-muted-foreground" />
          </div>
        )}

        {/* Photo Navigation */}
        {sortedPhotos.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-background/60 backdrop-blur-sm text-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background/80"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-background/60 backdrop-blur-sm text-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background/80"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            {/* Dots Indicator */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {sortedPhotos.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setCurrentPhotoIndex(i); }}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all",
                    i === currentPhotoIndex
                      ? "bg-primary w-3"
                      : "bg-foreground/40 hover:bg-foreground/60"
                  )}
                />
              ))}
            </div>
          </>
        )}

        {/* Favorite Button */}
        <button
          onClick={handleFavorite}
          className="absolute top-2 right-2 p-2 rounded-full bg-background/60 backdrop-blur-sm transition-colors hover:bg-background/80"
        >
          <Heart
            className={cn(
              "h-4 w-4 transition-colors",
              isFavorited ? "fill-destructive text-destructive" : "text-foreground"
            )}
          />
        </button>

        {/* Type Badge */}
        <Badge
          className={cn(
            "absolute top-2 left-2",
            boatTypeBadgeClass[boat.type] || "bg-secondary/80"
          )}
        >
          {boatTypeLabels[boat.type] || boat.type}
        </Badge>
      </div>

      <CardContent className={cn("p-4", compact && "p-3")}>
        {/* Title & Location */}
        <h3 className={cn("font-semibold truncate", compact ? "text-base" : "text-lg")}>
          {boat.name}
        </h3>
        {boat.owner && (
          <p className="text-sm text-muted-foreground truncate">
            {boat.owner.marina_name}
            {boat.owner.city && ` • ${boat.owner.city}`}
          </p>
        )}

        {/* Specs */}
        <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {boat.capacity}
          </span>
          {boat.length_meters && (
            <span className="flex items-center gap-1">
              <Ruler className="h-3.5 w-3.5" />
              {boat.length_meters}m
            </span>
          )}
          {boat.has_crew && (
            <Badge variant="outline" className="text-xs py-0">
              Com tripulação
            </Badge>
          )}
        </div>

        {/* Price & Actions */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
          <div>
            <span className="text-lg font-bold text-primary">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(boat.base_price)}
            </span>
            <span className="text-xs text-muted-foreground">/dia</span>
          </div>
          <Button
            size={compact ? "sm" : "default"}
            onClick={handleBook}
            className="gradient-button"
          >
            <Calendar className="h-4 w-4 mr-1" />
            Reservar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Custom types for the Nautical Marketplace

export type AppRole = 'admin' | 'owner' | 'renter';
export type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'refunded';
export type PaymentStatus = 'pending' | 'held' | 'released' | 'refunded' | 'failed';
export type BoatType = 'leisure_boat' | 'jet_ski' | 'yacht' | 'sailboat' | 'speedboat' | 'fishing_boat' | 'pontoon' | 'catamaran';
export type PricingType = 'weekday' | 'weekend' | 'holiday' | 'high_season' | 'low_season' | 'special';
export type LoyaltyLevel = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  loyalty_level: LoyaltyLevel;
  total_rentals: number;
  loyalty_points: number;
  created_at: string;
  updated_at: string;
}

export interface Owner {
  id: string;
  user_id: string;
  marina_name: string;
  slug: string;
  logo_url: string | null;
  cover_image_url: string | null;
  description: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  google_calendar_id: string | null;
  google_refresh_token: string | null;
  commission_rate: number;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Boat {
  id: string;
  owner_id: string;
  name: string;
  type: BoatType;
  description: string | null;
  capacity: number;
  length_meters: number | null;
  has_crew: boolean;
  crew_included: boolean;
  amenities: string[];
  rules: string | null;
  deposit_amount: number;
  base_price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  owner?: Owner;
  photos?: BoatPhoto[];
  itineraries?: Itinerary[];
}

export interface BoatPhoto {
  id: string;
  boat_id: string;
  url: string;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
}

export interface Itinerary {
  id: string;
  boat_id: string;
  name: string;
  description: string | null;
  duration_hours: number;
  departure_location: string | null;
  stops: string[];
  included_items: string[];
  price_modifier: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  user_id: string | null;
  boat_id: string;
  itinerary_id: string | null;
  booking_date: string;
  start_time: string | null;
  end_time: string | null;
  passengers: number;
  base_price: number;
  discount_amount: number;
  platform_fee: number;
  total_price: number;
  deposit_amount: number;
  status: BookingStatus;
  customer_notes: string | null;
  owner_notes: string | null;
  check_in_at: string | null;
  check_out_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  boat?: Boat;
  itinerary?: Itinerary;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  richContent?: RichContent;
  created_at: string;
}

// Rich Content Types
export type RichContentType = 
  | 'boat_card'
  | 'boat_carousel'
  | 'booking_calendar'
  | 'booking_summary'
  | 'quick_actions'
  | 'payment_link';

export interface RichContent {
  type: RichContentType;
  data: RichContentData;
}

export type RichContentData = 
  | BoatCardData
  | BoatCarouselData
  | BookingCalendarData
  | BookingSummaryData
  | QuickActionsData
  | PaymentLinkData;

export interface BoatCardData {
  type: 'boat_card';
  boat: {
    id: string;
    name: string;
    type: string;
    description?: string;
    capacity: number;
    base_price: number;
    length_meters?: number;
    has_crew?: boolean;
    photos: Array<{ url: string; is_primary?: boolean }>;
    owner?: {
      marina_name: string;
      city?: string;
      state?: string;
    };
  };
}

export interface BoatCarouselData {
  type: 'boat_carousel';
  title?: string;
  boats: BoatCardData['boat'][];
}

export interface BookingCalendarData {
  type: 'booking_calendar';
  boatId: string;
  boatName: string;
  availableDates: string[];
  blockedDates: string[];
  selectedDate?: string;
}

export interface BookingSummaryData {
  type: 'booking_summary';
  booking: {
    boatId: string;
    boatName: string;
    date: string;
    passengers: number;
    basePrice: number;
    totalPrice: number;
    depositAmount?: number;
  };
}

export interface QuickActionsData {
  type: 'quick_actions';
  actions: Array<{
    label: string;
    action: string;
    variant?: 'primary' | 'secondary' | 'outline';
  }>;
}

export interface PaymentLinkData {
  type: 'payment_link';
  bookingId: string;
  url: string;
  amount: number;
  note?: string;
}

export const BOAT_TYPE_LABELS: Record<BoatType, string> = {
  leisure_boat: 'Barco de Passeio',
  jet_ski: 'Jet Ski',
  yacht: 'Iate',
  sailboat: 'Veleiro',
  speedboat: 'Lancha',
  fishing_boat: 'Barco de Pesca',
  pontoon: 'Pontão',
  catamaran: 'Catamarã',
};

export const LOYALTY_LEVEL_LABELS: Record<LoyaltyLevel, string> = {
  bronze: 'Bronze',
  silver: 'Prata',
  gold: 'Ouro',
  platinum: 'Platina',
};

export const LOYALTY_DISCOUNTS: Record<LoyaltyLevel, number> = {
  bronze: 0,
  silver: 5,
  gold: 10,
  platinum: 15,
};

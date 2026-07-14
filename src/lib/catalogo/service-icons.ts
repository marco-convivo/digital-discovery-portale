import {
  Monitor,
  Video,
  Camera,
  ShoppingBag,
  Share2,
  Megaphone,
  Palette,
  MapPin,
  MessageCircle,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

// Mappa chiave servizio → icona lucide (a linea sottile). La chiave è stabile
// (da catalog.ts / service_catalog); condivisa tra catalogo, carosello e lavori.
export const SERVICE_ICONS: Record<string, LucideIcon> = {
  sito: Monitor,
  video: Video,
  shooting: Camera,
  ecommerce: ShoppingBag,
  social: Share2,
  ads: Megaphone,
  brand: Palette,
  google: MapPin,
  whatsapp: MessageCircle,
};

export function iconForChiave(chiave: string | null | undefined): LucideIcon {
  return (chiave && SERVICE_ICONS[chiave]) || Sparkles;
}

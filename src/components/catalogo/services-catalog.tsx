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
import { ServiceCard } from "@/components/catalogo/service-card";
import { EmptyState } from "@/components/ui/empty-state";
import type { VetrinaServizio } from "@/lib/catalogo/types";

// Mappa chiave servizio → icona lucide (a linea sottile). La chiave è stabile
// (da catalog.ts / service_catalog); i titoli arrivano dal catalogo.
const ICONS: Record<string, LucideIcon> = {
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

export function ServicesCatalog({
  servizi,
  basePath,
  ctaLabel,
}: {
  servizi: VetrinaServizio[];
  basePath: string;
  ctaLabel?: string;
}) {
  if (servizi.length === 0) {
    return (
      <EmptyState
        title="Catalogo in aggiornamento"
        hint="I servizi saranno disponibili a breve."
      />
    );
  }
  return (
    <div className="grid grid-cols-1 gap-[26px] lg:grid-cols-3">
      {servizi.map((v) => (
        <ServiceCard
          key={v.row.id}
          icon={ICONS[v.row.chiave] ?? Sparkles}
          title={v.row.titolo}
          description={v.row.sottotitolo ?? v.row.descrizione ?? ""}
          href={`${basePath}/${v.row.chiave}`}
          ctaLabel={ctaLabel}
        />
      ))}
    </div>
  );
}

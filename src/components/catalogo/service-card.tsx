import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DARK_CARD_STYLE,
  DARK_SPOTLIGHT_STYLE,
  ICON_GLOW,
} from "@/components/catalogo/card-style";

// Scheda scura su sfondo chiaro — riferimento: docs/catalogo-servizi-A-minimal.html.
// Riusabile come link (vetrina) o come selettore (builder preventivi, via onClick).

export interface ServiceCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  href?: string;
  onClick?: () => void;
  ctaLabel?: string;
  selected?: boolean;
  className?: string;
}

export function ServiceCard({
  icon: Icon,
  title,
  description,
  href,
  onClick,
  ctaLabel = "Scopri",
  selected = false,
  className,
}: ServiceCardProps) {
  const wrapper = cn(
    "group relative isolate block w-full overflow-hidden rounded-[26px] px-7 pb-[30px] pt-[38px] text-center",
    "transition-[transform,box-shadow] duration-200 ease-out",
    (href || onClick) && "cursor-pointer hover:-translate-y-1",
    selected && "ring-2 ring-[#a28ef9]",
    className,
  );

  const content = (
    <>
      {/* spotlight viola dall'alto */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ ...DARK_SPOTLIGHT_STYLE, zIndex: 0 }}
      />
      <span className="relative z-10 block">
        <span className="mx-auto mb-6 mt-1.5 block leading-none text-white" style={ICON_GLOW}>
          <Icon size={46} strokeWidth={1.4} className="mx-auto" aria-hidden />
        </span>
        <span className="block text-[21px] font-bold tracking-[-0.01em] text-white">
          {title}
        </span>
        <span className="mx-auto mb-6 mt-2.5 block max-w-[34ch] text-[13.5px] leading-[1.5] text-[#a7abbd]">
          {description}
        </span>
        <span className="flex w-full items-center justify-between gap-3.5 rounded-[15px] bg-white px-5 py-3.5 text-[14.5px] font-bold text-[#111] transition-transform duration-200 group-hover:scale-[1.01]">
          {ctaLabel}
          <ArrowRight size={17} strokeWidth={2.4} aria-hidden />
        </span>
      </span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={wrapper} style={DARK_CARD_STYLE} aria-label={title}>
        {content}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={selected}
        className={wrapper}
        style={DARK_CARD_STYLE}
      >
        {content}
      </button>
    );
  }
  return (
    <div className={wrapper} style={DARK_CARD_STYLE}>
      {content}
    </div>
  );
}

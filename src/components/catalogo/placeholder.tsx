import { TONE_PLACEHOLDER, type Tone } from "@/lib/catalogo/ui";
import { cn } from "@/lib/utils";

// Placeholder di vetrina quando manca l'immagine: pannello (tinto per categoria)
// col monogramma del servizio. Colorato e riconoscibile — mai "immagine rotta".
export function ImgPlaceholder({
  label,
  tone = "neutral",
}: {
  label?: string;
  tone?: Tone;
}) {
  const initial = (label ?? "").trim().charAt(0).toUpperCase() || "•";
  return (
    <div
      aria-hidden="true"
      className={cn("grid h-full w-full place-items-center", TONE_PLACEHOLDER[tone])}
    >
      <span className="select-none font-extrabold leading-none tracking-[-0.04em] text-[clamp(3rem,9vw,6rem)]">
        {initial}
      </span>
    </div>
  );
}

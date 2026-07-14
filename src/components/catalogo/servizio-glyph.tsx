import { GLYPHS } from "@/lib/catalogo/glyphs";
import { cn } from "@/lib/utils";

// Icona 3D lucida in gradiente blu→teal (stile "glossy") su tema chiaro.
// Il glyph è per servizio (fallback: sito).
export function ServizioGlyph({
  chiave,
  className,
}: {
  chiave: string;
  className?: string;
}) {
  const d = GLYPHS[chiave] ?? GLYPHS.sito;
  return (
    <div className={cn("relative grid aspect-square place-items-center", className)}>
      {/* alone luminoso */}
      <div
        aria-hidden
        className="absolute inset-[14%] rounded-full blur-2xl"
        style={{ background: "radial-gradient(circle, rgba(56,132,255,0.55), transparent 70%)" }}
      />
      {/* tile con gradiente + rilievo 3D */}
      <div
        className="relative grid size-[64%] place-items-center rounded-[28%]"
        style={{
          background: "linear-gradient(155deg, #8fd0ff 0%, #3f82ff 46%, #1e40af 100%)",
          boxShadow:
            "inset 0 2px 5px rgba(255,255,255,0.65), inset 0 -10px 20px rgba(8,18,70,0.35), 0 16px 34px rgba(37,99,235,0.4)",
        }}
      >
        {/* riflesso lucido in alto */}
        <div
          aria-hidden
          className="absolute inset-x-[14%] top-[8%] h-[34%] rounded-full bg-white/40 blur-md"
        />
        <svg
          viewBox="0 0 48 48"
          fill="none"
          stroke="#ffffff"
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="relative w-[52%]"
          style={{ filter: "drop-shadow(0 2px 3px rgba(4,16,70,0.4))" }}
        >
          <path d={d} />
        </svg>
      </div>
    </div>
  );
}

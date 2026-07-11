// Placeholder di vetrina quando manca l'immagine: pannello salvia con il
// monogramma del servizio. Calmo e riconoscibile — mai "immagine rotta" —
// e differenzia le tessere già prima che vengano caricate le foto reali.
export function ImgPlaceholder({ label }: { label?: string }) {
  const initial = (label ?? "").trim().charAt(0).toUpperCase() || "•";
  return (
    <div
      aria-hidden="true"
      className="grid h-full w-full place-items-center bg-card-2"
    >
      <span className="select-none font-extrabold leading-none tracking-[-0.04em] text-ink/10 text-[clamp(3rem,9vw,6rem)]">
        {initial}
      </span>
    </div>
  );
}

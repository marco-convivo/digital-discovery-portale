import Link from "next/link";

/**
 * Blocco assistenza scuro (3a) — speculare al blocco denaro: sfondo inchiostro,
 * nome della persona che segue il cliente, WhatsApp primario in menta. Se il
 * numero non è configurato (NEXT_PUBLIC_ASSISTENZA_WHATSAPP) ripiega sul modulo.
 */
export function AssistenzaBlock({
  referente,
  whatsapp,
  ragioneSociale,
}: {
  referente: string | null;
  whatsapp: string | null;
  ragioneSociale?: string | null;
}) {
  const numero = (whatsapp ?? "").replace(/\D/g, "");
  const testo = encodeURIComponent(
    `Ciao! Sono ${ragioneSociale ?? "un cliente"} dal portale Digital Discovery.`,
  );
  const waHref = numero ? `https://wa.me/${numero}?text=${testo}` : null;

  return (
    <div className="rounded-card border border-[#2c2e31] bg-ink p-5 text-on-ink sm:p-6">
      <div className="text-[12px] font-semibold uppercase tracking-wide text-on-ink/55">
        Assistenza
      </div>
      <h2 className="mt-1.5 text-[17px] font-bold tracking-[-0.01em]">
        {referente ? `${referente} segue il tuo account` : "Hai un contatto dedicato"}
      </h2>
      <p className="mt-1.5 text-[13.5px] leading-relaxed text-on-ink/70">
        Modifiche, nuove idee o domande: siamo un messaggio di distanza.
      </p>

      {waHref ? (
        <a
          href={waHref}
          target="_blank"
          rel="noopener"
          className="mt-4 inline-flex items-center gap-2 rounded-pill bg-mint px-5 py-3 text-[14.5px] font-bold text-on-mint transition-opacity hover:opacity-90"
        >
          <WhatsAppIcon />
          Scrivici su WhatsApp
        </a>
      ) : (
        <Link
          href="/portale/assistenza"
          className="mt-4 inline-flex items-center gap-2 rounded-pill bg-mint px-5 py-3 text-[14.5px] font-bold text-on-mint transition-opacity hover:opacity-90"
        >
          Scrivici
        </Link>
      )}

      <p className="mt-3 text-[12.5px] text-on-ink/55">
        oppure{" "}
        <a
          href="mailto:info@digital-discovery.it"
          className="font-semibold text-on-ink/80 underline"
        >
          info@digital-discovery.it
        </a>
      </p>
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-[18px]" fill="currentColor" aria-hidden>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.004c5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2Zm5.8 14.06c-.24.68-1.4 1.3-1.94 1.34-.5.05-1.13.24-3.66-.77-3.08-1.24-5.06-4.37-5.22-4.58-.15-.2-1.25-1.66-1.25-3.17 0-1.5.79-2.24 1.07-2.55.28-.3.61-.38.81-.38.2 0 .41 0 .58.01.19.01.44-.07.68.52.24.58.83 2.02.9 2.17.07.15.12.32.02.52-.1.2-.15.32-.3.5-.15.17-.31.39-.44.52-.15.15-.3.31-.13.6.17.3.76 1.25 1.63 2.02 1.12 1 2.06 1.31 2.36 1.46.3.15.47.13.64-.08.17-.2.74-.86.94-1.16.2-.3.4-.25.67-.15.28.1 1.75.83 2.05.98.3.15.5.22.57.35.07.12.07.72-.17 1.4Z" />
    </svg>
  );
}

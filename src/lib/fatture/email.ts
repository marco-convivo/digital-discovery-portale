import "server-only";
import { sendEmail } from "@/lib/email/send";
import { emailBrand } from "@/lib/email/templates";
import { generaMagicLink } from "@/lib/portale/magic-link";

const SITE =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://clienti.digital-discovery.it";

/**
 * Avvisa il cliente che è disponibile una nuova fattura e lo porta alla sezione
 * Fatture del portale (magic link). Best-effort: un errore non deve bloccare il
 * salvataggio della fattura.
 */
export async function inviaAvvisoFattura(opts: {
  email: string | null | undefined;
  ragioneSociale: string;
  numero: string | null;
}): Promise<void> {
  if (!opts.email) return;
  try {
    const url =
      (await generaMagicLink(opts.email, "/portale/fatture")) ?? `${SITE}/accedi`;
    const rif = opts.numero ? ` n. <b>${opts.numero}</b>` : "";

    const html = emailBrand({
      heading: "Nuova fattura disponibile",
      paragraphs: [
        `Gentile <b>${opts.ragioneSociale}</b>, è disponibile una nuova fattura${rif} nella tua area riservata.`,
        "Accedi al portale per consultarla e scaricarla in PDF.",
      ],
      cta: { label: "Vedi la fattura", url },
      footerNote:
        "Il link ti porta direttamente alle tue fatture. Se scade, puoi accedere da clienti.digital-discovery.it.",
    });

    await sendEmail({
      to: opts.email,
      subject: "Nuova fattura disponibile — Digital Discovery",
      html,
    });
  } catch {
    // best-effort
  }
}

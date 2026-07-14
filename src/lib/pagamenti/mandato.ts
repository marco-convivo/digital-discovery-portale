import "server-only";
import { sendEmail } from "@/lib/email/send";
import { emailBrand } from "@/lib/email/templates";
import { euro } from "@/lib/format";

// Email di conferma del mandato SEPA dopo il setup. Best-effort.
export async function inviaConfermaMandato(input: {
  email: string | null | undefined;
  ragioneSociale: string;
  rataLorda: number; // importo mensile che verrà addebitato (IVA inclusa)
  rateNum: number;
  descriptor: string | null;
}): Promise<void> {
  if (!input.email) return;
  try {
    const desc = input.descriptor
      ? ` che apparirà come «<b>${input.descriptor}</b>»`
      : "";
    const html = emailBrand({
      heading: "Mandato SEPA attivato",
      paragraphs: [
        `Gentile <b>${input.ragioneSociale}</b>, il mandato di addebito SEPA è attivo. Verranno addebitati <b>${euro(input.rataLorda)}/mese</b> (IVA inclusa) per ${input.rateNum} mesi, con addebito ricorrente${desc}.`,
        `<b>Importante:</b> comunica alla tua banca di autorizzare questo addebito. Se non preavvisata, molte banche rifiutano il primo addebito e questo ritarda l'attivazione. Il primo addebito si conferma in 2–5 giorni lavorativi.`,
      ],
      footerNote:
        "Puoi revocare il mandato in ogni momento. L'IBAN è gestito da Stripe: Digital Discovery non lo vede né lo conserva.",
    });
    await sendEmail({
      to: input.email,
      subject: "Mandato SEPA attivato — Digital Discovery",
      html,
    });
  } catch {
    // best-effort
  }
}

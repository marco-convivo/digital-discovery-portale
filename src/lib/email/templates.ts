// Layout email brandizzato Digital Discovery: tabelle + stili inline (email-safe),
// monogramma DD, pulsante charcoal, footer. Usato da recupero insoluti e alert.

const SITE_LABEL = "clienti.digital-discovery.it";
const SITE_URL = "https://clienti.digital-discovery.it";

export interface EmailLayout {
  heading: string;
  paragraphs: string[]; // HTML consentito (già sanificato dai chiamanti)
  cta?: { label: string; url: string };
  fallbackUrl?: string; // mostrato come link testuale sotto la CTA
  footerNote?: string; // riga extra nel footer (es. nota sicurezza)
}

export function emailBrand(opts: EmailLayout): string {
  const { heading, paragraphs, cta, fallbackUrl, footerNote } = opts;
  const body = paragraphs
    .map(
      (p) =>
        `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#55555e">${p}</p>`,
    )
    .join("");

  const button = cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0"><tr>
         <td align="center" bgcolor="#222222" style="background:#222222;border-radius:999px">
           <a href="${cta.url}" target="_blank" style="display:inline-block;padding:14px 30px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px">${cta.label}</a>
         </td></tr></table>`
    : "";

  const fallback = fallbackUrl
    ? `<p style="margin:20px 0 0;font-size:12.5px;line-height:1.6;color:#8a8a93">
         Se il pulsante non funziona, copia e incolla questo link:<br>
         <a href="${fallbackUrl}" target="_blank" style="color:#7c6cf0;word-break:break-all">${fallbackUrl}</a>
       </p>`
    : "";

  const note = footerNote
    ? `<tr><td style="padding:18px 32px 0">
         <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
           <td style="border-top:1px solid #e1e4dd;padding-top:16px">
             <p style="margin:0;font-size:12px;line-height:1.6;color:#8a8a93">${footerNote}</p>
           </td></tr></table></td></tr>`
    : "";

  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#e9ece6;margin:0;padding:32px 12px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border:1px solid #e1e4dd;border-radius:16px;overflow:hidden">
      <tr><td style="padding:28px 32px 4px">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td width="40" height="40" align="center" valign="middle" style="width:40px;height:40px;background:#222222;border-radius:10px;color:#ffffff;font-size:15px;font-weight:800">DD</td>
          <td style="padding-left:12px;font-size:17px;font-weight:700;color:#1e1e22">Digital Discovery</td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:18px 32px 4px">
        <h1 style="margin:0 0 10px;font-size:22px;line-height:1.25;font-weight:800;letter-spacing:-0.02em;color:#1e1e22">${heading}</h1>
        ${body}
        ${button}
        ${fallback}
      </td></tr>
      ${note}
      <tr><td style="padding:20px 32px 28px">
        <p style="margin:0;font-size:12px;line-height:1.7;color:#8a8a93">
          Digital Discovery S.r.l. · Piazzale Sant'Antonio 7, L'Aquila<br>
          <a href="${SITE_URL}" target="_blank" style="color:#8a8a93;text-decoration:none">${SITE_LABEL}</a>
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>`;
}

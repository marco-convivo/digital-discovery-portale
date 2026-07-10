import "server-only";

// Wrapper minimale dell'API DocuSeal (X-Auth-Token). Solo server.
const BASE = () => process.env.DOCUSEAL_BASE_URL ?? "https://api.docuseal.com";

async function ds<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE()}${path}`, {
    ...init,
    headers: {
      "X-Auth-Token": process.env.DOCUSEAL_API_TOKEN!,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`DocuSeal ${path} → ${res.status}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

export interface DsSubmitter {
  id: number;
  slug: string;
  submission_id: number;
  status: string;
  embed_src: string;
  role: string;
}

export interface PrefillField {
  name: string;
  default_value: string;
}

/** Crea una submission dal template per un solo firmatario. Il `role` deve
 *  corrispondere a quello definito nel template (vedi getTemplateFields). */
export async function createSubmission(input: {
  templateId: number;
  role: string;
  name: string;
  email: string;
  fields: PrefillField[];
}): Promise<DsSubmitter> {
  const submitters = await ds<DsSubmitter[]>("/submissions", {
    method: "POST",
    body: JSON.stringify({
      template_id: input.templateId,
      send_email: false, // niente email: firma nel nostro canvas, completamento via API
      submitters: [
        {
          role: input.role,
          name: input.name,
          email: input.email,
          fields: input.fields,
        },
      ],
    }),
  });
  return submitters[0];
}

interface DsSubmission {
  id: number;
  status: string;
  submitters: DsSubmitter[];
  documents?: { name: string; url: string }[];
  audit_log_url?: string | null;
}

export async function getSubmission(id: number): Promise<DsSubmission> {
  return ds<DsSubmission>(`/submissions/${id}`);
}

/** Campi del template: nomi (per filtrare i prefill — DocuSeal dà 422 sui
 *  campi sconosciuti) e nomi dei campi firma (da valorizzare al completamento). */
export async function getTemplateFields(
  id: number,
): Promise<{ allowed: Set<string>; signatureNames: string[]; role: string }> {
  const t = await ds<{
    fields: { name: string; type: string }[];
    submitters?: { name: string }[];
  }>(`/templates/${id}`);
  const fields = t.fields ?? [];
  return {
    allowed: new Set(fields.map((f) => f.name)),
    signatureNames: fields.filter((f) => f.type === "signature").map((f) => f.name),
    role: t.submitters?.[0]?.name ?? "Cliente",
  };
}

/** Completa la firma via API (il cliente firma nel nostro canvas): imposta i
 *  valori firma + metadata di audit e chiude il submitter. */
export async function completeSubmitter(
  submitterId: number,
  values: Record<string, string>,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await ds(`/submitters/${submitterId}`, {
    method: "PUT",
    body: JSON.stringify({ completed: true, values, metadata }),
  });
}

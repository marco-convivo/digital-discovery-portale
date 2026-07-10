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

/** Crea una submission dal template per un solo firmatario (Cliente), embedded. */
export async function createSubmission(input: {
  templateId: number;
  name: string;
  email: string;
  fields: PrefillField[];
}): Promise<DsSubmitter> {
  const submitters = await ds<DsSubmitter[]>("/submissions", {
    method: "POST",
    body: JSON.stringify({
      template_id: input.templateId,
      send_email: false, // firma embedded, niente email
      submitters: [
        {
          role: "Cliente",
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
}

export async function getSubmission(id: number): Promise<DsSubmission> {
  return ds<DsSubmission>(`/submissions/${id}`);
}

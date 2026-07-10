import { NextResponse, type NextRequest } from "next/server";
import { handleContractSigned } from "@/lib/docuseal/contract";

// Webhook DocuSeal. DocuSeal non firma HMAC in modo standard: proteggiamo con
// un secret condiviso in query (?secret=…) se configurato.
export async function POST(req: NextRequest) {
  const secret = process.env.DOCUSEAL_WEBHOOK_SECRET;
  if (secret && req.nextUrl.searchParams.get("secret") !== secret) {
    return NextResponse.json({ error: "secret" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "body" }, { status: 400 });

  try {
    if (body.event_type === "form.completed" || body.event_type === "submission.completed") {
      const data = body.data ?? {};
      const submissionId = String(data.submission_id ?? data.id ?? "");
      const signedUrl =
        data.documents?.[0]?.url ?? data.audit_log_url ?? null;
      await handleContractSigned(submissionId, signedUrl);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "errore handler";
    console.error("[docuseal webhook]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

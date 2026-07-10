"use server";

import { headers } from "next/headers";
import {
  signContract,
  type DatiCliente,
  type SignResult,
} from "@/lib/docuseal/contract";

export async function firma(
  token: string,
  dati: DatiCliente,
  signaturePng: string,
): Promise<SignResult> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const userAgent = h.get("user-agent") ?? "unknown";
  return signContract(token, dati, signaturePng, {
    ip,
    userAgent,
    consensoAt: new Date().toISOString(),
  });
}

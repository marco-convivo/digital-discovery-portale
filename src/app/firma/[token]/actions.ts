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
  approvaVessatorie: boolean,
): Promise<SignResult> {
  if (!approvaVessatorie) {
    return {
      ok: false,
      error: "Devi approvare specificamente le clausole ex artt. 1341/1342 c.c.",
    };
  }
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const userAgent = h.get("user-agent") ?? "unknown";
  const now = new Date().toISOString();
  return signContract(token, dati, signaturePng, {
    ip,
    userAgent,
    consensoAt: now,
    vessatorieAt: now,
  });
}

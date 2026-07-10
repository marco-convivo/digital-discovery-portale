"use server";

import { acceptQuote, type AcceptResult } from "@/lib/quotes/public";

export async function accept(token: string): Promise<AcceptResult> {
  return acceptQuote(token);
}

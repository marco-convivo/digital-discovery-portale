"use server";

import {
  submitDatiAndCreateContract,
  type DatiCliente,
  type SubmitResult,
} from "@/lib/docuseal/contract";

export async function submitDati(
  token: string,
  dati: DatiCliente,
): Promise<SubmitResult> {
  return submitDatiAndCreateContract(token, dati);
}

"use client";

import { useState, useTransition } from "react";
import { inviaAccessoCliente } from "@/lib/clienti/manual";
import { Button } from "@/components/ui/button";

export function InviaAccessoButton({ clientId }: { clientId: string }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function invia() {
    setMsg(null);
    setError(null);
    start(async () => {
      const res = await inviaAccessoCliente(clientId);
      if (res.ok) setMsg("Email di accesso inviata.");
      else setError(res.error);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button size="sm" variant="outline" onClick={invia} disabled={pending}>
        {pending ? "Invio…" : "Invia accesso portale"}
      </Button>
      {msg && <span className="text-[12px] font-medium text-on-mint">{msg}</span>}
      {error && <span className="text-[12px] font-medium text-fail-tx">{error}</span>}
    </div>
  );
}

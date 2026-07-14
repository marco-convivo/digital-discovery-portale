"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AccediPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback?next=/portale`,
        shouldCreateUser: true,
      },
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <AuthShell variant="cliente">
      <h1 className="text-2xl font-extrabold tracking-[-0.02em] text-text">
        Accedi
      </h1>
      <p className="mt-1.5 text-[15px] text-text-2">
        Area clienti · accesso con link via email
      </p>

      {sent ? (
        <div className="mt-7 rounded-card bg-mint-soft p-5">
          <p className="font-bold text-on-mint">Controlla la tua email 📧</p>
          <p className="mt-1 text-sm text-text-2">
            Ti abbiamo inviato un link per accedere a <b>{email}</b>. Aprilo dallo
            stesso dispositivo.
          </p>
        </div>
      ) : (
        <form onSubmit={sendLink} className="mt-7 flex flex-col gap-3">
          <Input
            type="email"
            required
            placeholder="La tua email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {error && (
            <p className="rounded-sm bg-fail-bg px-3 py-2 text-[13px] text-fail-tx">
              {error}
            </p>
          )}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Invio…" : "Ricevi il link di accesso"}
          </Button>
        </form>
      )}

      <p className="mt-4 text-[12.5px] leading-relaxed text-text-3">
        Nessuna password: ricevi un link sicuro via email a ogni accesso.
      </p>
    </AuthShell>
  );
}

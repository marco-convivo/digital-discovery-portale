"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
    <main className="grid min-h-dvh place-items-center px-6">
      <Card className="w-full max-w-sm p-8 text-center">
        <Logo className="mx-auto mb-5 size-12 rounded-[14px]" />
        <h1 className="text-xl font-extrabold tracking-[-0.01em] text-text">
          Area clienti
        </h1>
        <p className="mt-1 text-sm text-text-2">
          Digital Discovery — accesso con link via email
        </p>

        {sent ? (
          <div className="mt-6 rounded-md bg-mint-soft p-4">
            <p className="font-bold text-on-mint">Controlla la tua email 📧</p>
            <p className="mt-1 text-sm text-text-2">
              Ti abbiamo inviato un link per accedere a <b>{email}</b>.
            </p>
          </div>
        ) : (
          <form onSubmit={sendLink} className="mt-6 flex flex-col gap-3">
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
      </Card>
    </main>
  );
}

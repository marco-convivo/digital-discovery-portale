import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatusPill, type Tone } from "@/components/ui/status-pill";

const TONES: { tone: Tone; label: string }[] = [
  { tone: "paid", label: "Pagata" },
  { tone: "info", label: "Inviato" },
  { tone: "wait", label: "In attesa" },
  { tone: "fail", label: "Fallita" },
  { tone: "draft", label: "Bozza" },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-[13px] font-semibold uppercase tracking-wide text-text-3">
        Digital Discovery
      </p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-[-0.02em] text-text">
        Design system v0.3
      </h1>

      <div className="mt-8 flex flex-col gap-5">
        <Card>
          <CardHeader>
            <CardTitle>Bottoni</CardTitle>
          </CardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <Button>Aggiungi lead</Button>
            <Button variant="outline">Secondario</Button>
            <Button variant="ghost">Ghost</Button>
            <Button size="sm">Piccolo</Button>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Linguaggio di stato</CardTitle>
          </CardHeader>
          <div className="flex flex-wrap gap-2.5">
            {TONES.map((t) => (
              <StatusPill key={t.tone} tone={t.tone}>
                {t.label}
              </StatusPill>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Campo</CardTitle>
          </CardHeader>
          <Input label="Ragione sociale" placeholder="Es. Rossi S.r.l." />
        </Card>
      </div>
    </main>
  );
}

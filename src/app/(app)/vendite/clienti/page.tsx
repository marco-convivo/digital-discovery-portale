import { EmptyState } from "@/components/ui/empty-state";

// Pannello destro quando nessun cliente è selezionato. Su mobile è nascosto:
// lì si vede solo la lista (fornita dal layout).
export default function ClientiIndex() {
  return (
    <div className="hidden min-h-[60vh] place-items-center rounded-card border border-dashed border-line lg:grid">
      <EmptyState
        title="Seleziona un cliente"
        hint="Scegli un cliente dalla lista a sinistra per vederne la scheda completa qui."
      />
    </div>
  );
}

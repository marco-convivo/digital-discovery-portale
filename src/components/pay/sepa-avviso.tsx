// Avviso di prevenzione mostrato quando il cliente sceglie l'addebito SEPA.
// Riduce i rifiuti del primo addebito invitando a preavvisare la banca.
export function SepaAvviso({ descrittore }: { descrittore: string | null }) {
  return (
    <div className="mt-4 rounded-md border border-wait-tx/25 bg-wait-bg/60 p-4">
      <p className="text-[13.5px] font-bold text-wait-tx">
        Importante per l&apos;addebito SEPA
      </p>
      <ul className="mt-1.5 flex flex-col gap-1.5 text-[12.5px] leading-relaxed text-text-2">
        <li className="flex gap-2">
          <span aria-hidden>•</span>
          <span>
            Comunica alla tua banca di <b>autorizzare l&apos;addebito</b>
            {descrittore ? (
              <>
                {" "}che apparirà come «<b>{descrittore}</b>»
              </>
            ) : null}
            . Se non preavvisata, molte banche <b>rifiutano il primo addebito</b>.
          </span>
        </li>
        <li className="flex gap-2">
          <span aria-hidden>•</span>
          <span>
            L&apos;addebito SEPA si conferma in <b>2–5 giorni lavorativi</b>: è
            normale non vederlo subito.
          </span>
        </li>
      </ul>
    </div>
  );
}

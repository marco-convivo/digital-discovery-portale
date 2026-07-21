// Layout dell'area Vendite con uno slot parallelo `@drawer`: le schede aperte
// da una card (es. cliente) vengono "intercettate" e mostrate in un pannello a
// destra, senza lasciare la pagina. Aprendo/ricaricando l'URL diretto si vede
// invece la pagina intera (fallback naturale delle intercepting routes).
export default function VenditeLayout({
  children,
  drawer,
}: {
  children: React.ReactNode;
  drawer: React.ReactNode;
}) {
  return (
    <>
      {children}
      {drawer}
    </>
  );
}

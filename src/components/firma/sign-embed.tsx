"use client";

import { DocusealForm } from "@docuseal/react";

// Firma embedded DocuSeal. Al completamento porta alla conferma.
export function SignEmbed({ src, token }: { src: string; token: string }) {
  return (
    <DocusealForm
      src={src}
      withTitle={false}
      withDownloadButton={false}
      onComplete={() => {
        window.location.href = `/firma/${token}/ok`;
      }}
    />
  );
}

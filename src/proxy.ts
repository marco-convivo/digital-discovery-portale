import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Next 16 ha rinominato la convenzione "middleware" in "proxy" (stessa runtime).
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Tutto tranne asset statici e immagini.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

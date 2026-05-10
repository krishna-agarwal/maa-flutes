"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signOut() {
  const supabase = await createClient();
  // scope: "local" skips the network call to revoke the refresh token —
  // cookies are still cleared, which is what matters for the session.
  await supabase.auth.signOut({ scope: "local" });
  redirect("/");
}

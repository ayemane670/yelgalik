import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function SplashPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  redirect(user ? "/home" : "/onboarding");
}

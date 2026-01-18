import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Check if onboarding is complete
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("onboarding_completed, agency_id")
          .eq("id", user.id)
          .single();
        
        // If profile doesn't exist or has error, or onboarding not completed - redirect to onboarding
        if (profileError || !profile || !profile.onboarding_completed) {
          return NextResponse.redirect(`${origin}/onboarding`);
        }
      }
      
      // If next is an auth route, override to dashboard
      const safeNext = (next === "/login" || next === "/signup") ? "/dashboard" : next;
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }

  // Return the user to login page with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}

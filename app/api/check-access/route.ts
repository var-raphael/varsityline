import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ unlocked: false, message: "Email required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("search_access")
    .select("*")
    .eq("email", email.toLowerCase().trim())
    .gt("expires_at", new Date().toISOString())
    .single();

  if (error || !data) {
    return NextResponse.json({ unlocked: false });
  }

  return NextResponse.json({ unlocked: true, expiresAt: data.expires_at });
}
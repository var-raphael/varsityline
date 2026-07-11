import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { reference } = await req.json();
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });
  const data = await res.json();

  if (!data.status || data.data.status !== "success") {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  const email = data.data.customer.email.toLowerCase().trim();
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 3);

  const { error } = await supabase.from("search_access").upsert({
    email,
    paystack_reference: reference,
    expires_at: expiresAt.toISOString(),
  });

  if (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, email, expiresAt: expiresAt.toISOString() });
}
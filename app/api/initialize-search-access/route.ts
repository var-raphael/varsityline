import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ success: false, message: "Email required" }, { status: 400 });
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      amount: 50000, // ₦500 in kobo — adjust as needed
      metadata: { purpose: "search_access" },
    }),
  });

  const data = await res.json();
  if (!data.status) {
    return NextResponse.json({ success: false, message: data.message }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    accessCode: data.data.access_code,
    reference: data.data.reference,
  });
}
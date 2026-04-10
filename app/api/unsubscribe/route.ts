export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { db } from "@/lib/db";

function makeToken(email: string): string {
  const secret = process.env.NEXTAUTH_SECRET ?? "proofsignal-unsub-secret";
  return createHmac("sha256", secret).update(email.toLowerCase()).digest("hex");
}

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email") ?? "";
  const token = req.nextUrl.searchParams.get("token") ?? "";

  if (!email || !token || token !== makeToken(email)) {
    return new NextResponse(
      html("Invalid unsubscribe link", "This link is invalid or has already been used."),
      { status: 400, headers: { "Content-Type": "text/html" } }
    );
  }

  // Add to suppression list
  await db.suppressionRecord.upsert({
    where: { email: email.toLowerCase() },
    update: { reason: "unsubscribed", suppressedAt: new Date() },
    create: { email: email.toLowerCase(), reason: "unsubscribed" },
  }).catch(() => null);

  return new NextResponse(
    html("Unsubscribed", "You have been removed from our mailing list. You will not receive further emails from ProofSignal Labs."),
    { status: 200, headers: { "Content-Type": "text/html" } }
  );
}

function html(title: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | ProofSignal Labs</title>
  <style>
    body { font-family: Georgia, serif; background: #f9f9f7; color: #18182B; margin: 0; padding: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .card { background: white; border: 1px solid #e5e5e0; border-radius: 8px; padding: 48px 40px; max-width: 480px; text-align: center; }
    h1 { font-size: 22px; margin: 0 0 12px; }
    p { font-size: 15px; color: #5a5a72; line-height: 1.6; margin: 0 0 24px; }
    a { font-size: 13px; color: #1E7B7E; text-decoration: none; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="https://proofsignallabs.com">proofsignallabs.com</a>
  </div>
</body>
</html>`;
}

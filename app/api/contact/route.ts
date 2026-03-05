import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export async function POST(req: Request) {
  try {
    const { email, subject, message, type, honeypot } = await req.json();
    // Anti-spam check
    if (honeypot) {
    return NextResponse.json({ success: true });
}

    if (!email || !subject || !message) {
  return NextResponse.json(
    { error: "Missing fields" },
    { status: 400 }
  );
}

if (!isValidEmail(email)) {
  return NextResponse.json(
    { error: "Invalid email format" },
    { status: 400 }
  );
}

    await resend.emails.send({
      from: "Make Your Board <contact@makeyourboard.com>",
      to: process.env.CONTACT_EMAIL as string,
      subject: `[${type}] ${subject}`,
      replyTo: email,
      html: `
        <p><strong>Type:</strong> ${type}</p>
        <p><strong>From:</strong> ${email}</p>
        <hr/>
        <p>${message.replace(/\n/g, "<br/>")}</p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
  console.error("CONTACT ERROR:", error);

  return NextResponse.json(
    { error: "Server error" },
    { status: 500 }
    );
  }
}
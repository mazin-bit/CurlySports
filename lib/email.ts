import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify SMTP connectivity on startup (non-blocking)
if (process.env.SMTP_HOST) {
  transporter.verify().then(
    () => console.log("[INF] SMTP transporter verified", process.env.SMTP_HOST),
    (err) => console.error("[ERR] SMTP transporter verification failed:", String(err)),
  );
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const smtpFrom = process.env.SMTP_FROM;
  if (!smtpFrom) throw new Error("SMTP_FROM environment variable is not set");

  return transporter.sendMail({
    from: `"${process.env.SMTP_FROM_NAME ?? "Curly Sports"}" <${smtpFrom}>`,
    to,
    subject,
    html,
    text,
  });
}

import nodemailer from "nodemailer";

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

function transporter() {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  const port = Number(SMTP_PORT) || 587;
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465, // 465 = implicit TLS, 587 = STARTTLS
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

export async function sendOtpEmail(email: string, otp: string) {
  const t = transporter();
  if (!t) {
    // Dev fallback so the flow is testable without SMTP configured.
    console.log(
      `\n[tierlistrr] Code de connexion pour ${email} : ${otp}\n` +
        `(Configure SMTP_HOST/SMTP_USER/SMTP_PASS pour envoyer un vrai email.)\n`,
    );
    return;
  }
  await t.sendMail({
    from: SMTP_FROM || SMTP_USER,
    to: email,
    subject: "Ton code de connexion · tierlistrr",
    text: `Ton code de connexion : ${otp}\n\nIl expire dans 10 minutes.\nSi tu n'as rien demandé, ignore cet email.`,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:420px;margin:auto;color:#1a1614">
        <p style="text-transform:uppercase;letter-spacing:.14em;font-size:11px;color:#8a8076;font-weight:700">tierlistrr</p>
        <p style="font-size:15px">Ton code de connexion :</p>
        <p style="font-size:34px;font-weight:700;letter-spacing:.2em;color:#d85b3d;margin:8px 0">${otp}</p>
        <p style="font-size:13px;color:#4a4340">Il expire dans 10 minutes. Si tu n'as rien demandé, ignore cet email.</p>
      </div>`,
  });
}

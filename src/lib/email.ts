import nodemailer from "nodemailer";
import type { BookingDoc } from "./db";
import { getExperience, inr } from "./experiences";
import { formatDate } from "./time";

function transport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  const port = Number(SMTP_PORT || 465);
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

async function send(to: string, subject: string, html: string) {
  const t = transport();
  if (!t) {
    console.info(`[email skipped: SMTP not configured] to=${to} subject="${subject}"`);
    return false;
  }
  await t.sendMail({ from: process.env.MAIL_FROM || process.env.SMTP_USER, to, subject, html });
  return true;
}

function frame(body: string) {
  return `<div style="font-family:Arial,sans-serif;max-width:520px;color:#1E2327">
  <div style="height:8px;background:repeating-linear-gradient(90deg,#C4122F 0 24px,#fff 24px 48px)"></div>
  <div style="padding:20px 4px">${body}</div>
  <p style="color:#6B7780;font-size:12px">Ridgeline Motor Park is a fictional venue built as a portfolio demo.</p></div>`;
}

export async function sendConfirmation(b: BookingDoc, passUrl: string) {
  const exp = getExperience(b.experienceId);
  if (!b.driver) return false;
  return send(
    b.driver.email,
    `Booked: ${exp?.name} on ${formatDate(b.date)} at ${b.time}`,
    frame(`<h2 style="margin:0 0 8px">You're on the sheet, ${b.driver.name.split(" ")[0]}.</h2>
      <p>${exp?.name}, ${formatDate(b.date)} at ${b.time}. Arrive 45 minutes early for the briefing and the car check.</p>
      <p>Pass code: <b>${b.code}</b><br>Paid: ${inr(b.price)}</p>
      <p><a href="${passUrl}" style="color:#C4122F">Open your entry pass</a> and show the QR code at the gate.</p>`),
  );
}

export async function sendReminder(b: BookingDoc, passUrl: string) {
  const exp = getExperience(b.experienceId);
  if (!b.driver) return false;
  return send(
    b.driver.email,
    `Tomorrow: ${exp?.name} at ${b.time}`,
    frame(`<h2 style="margin:0 0 8px">See you tomorrow.</h2>
      <p>${exp?.name} at ${b.time}. Bring your driving licence and the car you registered (${b.car?.make} ${b.car?.model}, ${b.car?.registration}).</p>
      <p>Before you leave home: tyres at road pressure, no loose items in the cabin, at least half a tank.</p>
      <p><a href="${passUrl}" style="color:#C4122F">Your entry pass</a></p>`),
  );
}

import { randomBytes } from "node:crypto";

export interface MessageInput {
  from: string;
  to: string;
  subject: string;
  text?: string;
  html?: string;
  date?: Date;
}

const CRLF = "\r\n";

function isAscii(value: string): boolean {
  return /^[\x00-\x7F]*$/.test(value);
}

/** RFC 2047 encoded-word for non-ASCII header values. */
function encodeWord(value: string): string {
  if (isAscii(value)) return value;
  return `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;
}

/** Encode a header that may contain a display name: `名前 <addr>`. */
function encodeHeader(value: string): string {
  if (isAscii(value)) return value;
  const match = value.match(/^(.*?)\s*<([^>]+)>\s*$/);
  if (match) return `${encodeWord(match[1])} <${match[2]}>`;
  return encodeWord(value);
}

/** Base64-encode a body and wrap at 76 columns per RFC 2045. */
function base64Body(content: string): string {
  const encoded = Buffer.from(content, "utf8").toString("base64");
  return (encoded.match(/.{1,76}/g) ?? [encoded]).join(CRLF);
}

function rfc2822Date(date: Date): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${days[date.getUTCDay()]}, ${pad(date.getUTCDate())} ${months[date.getUTCMonth()]} ` +
    `${date.getUTCFullYear()} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())} +0000`
  );
}

function domainOf(address: string): string {
  const match = address.match(/@([^>\s]+)/);
  return match ? match[1] : "localhost";
}

function mimePart(contentType: string, content: string): string {
  return [
    `Content-Type: ${contentType}; charset=UTF-8`,
    "Content-Transfer-Encoding: base64",
    "",
    base64Body(content),
  ].join(CRLF);
}

/**
 * Build an RFC 5322 message ready to hand to IMAP APPEND.
 * Zero dependencies — UTF-8 safe via base64 bodies and encoded-word headers.
 */
export function buildMessage(input: MessageInput): string {
  const date = input.date ?? new Date();
  const messageId = `<${randomBytes(16).toString("hex")}@${domainOf(input.from)}>`;

  const headers = [
    `From: ${encodeHeader(input.from)}`,
    `To: ${encodeHeader(input.to)}`,
    `Subject: ${encodeWord(input.subject)}`,
    `Date: ${rfc2822Date(date)}`,
    `Message-ID: ${messageId}`,
    "MIME-Version: 1.0",
  ];

  let body: string;
  if (input.html && input.text) {
    const boundary = `inbox_beam_${randomBytes(12).toString("hex")}`;
    headers.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
    body = [
      `--${boundary}`,
      mimePart("text/plain", input.text),
      `--${boundary}`,
      mimePart("text/html", input.html),
      `--${boundary}--`,
      "",
    ].join(CRLF);
  } else if (input.html) {
    headers.push("Content-Type: text/html; charset=UTF-8", "Content-Transfer-Encoding: base64");
    body = base64Body(input.html);
  } else {
    headers.push("Content-Type: text/plain; charset=UTF-8", "Content-Transfer-Encoding: base64");
    body = base64Body(input.text ?? "");
  }

  return (headers.join(CRLF) + CRLF + CRLF + body).replace(/\r\n|\r|\n/g, CRLF);
}

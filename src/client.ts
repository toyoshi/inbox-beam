import { ImapFlow, type ImapFlowOptions } from "imapflow";
import { buildMessage } from "./message.js";

export interface InboxBeamOptions {
  /** IMAP host, e.g. "imap.gmail.com". */
  host: string;
  /** IMAP port. Defaults to 993. */
  port?: number;
  /** Use TLS. Defaults to true. */
  secure?: boolean;
  /** IMAP credentials. For Gmail use an app password or OAuth2. */
  auth: { user: string; pass?: string; accessToken?: string };
  /** Target mailbox / label. Defaults to "INBOX". */
  mailbox?: string;
  /** Default From address. Defaults to auth.user. */
  from?: string;
  /** Default To address. Defaults to auth.user. */
  to?: string;
  /** Leave messages unread (no \Seen flag). Defaults to true. */
  unread?: boolean;
  /** Prepend this string to every subject, e.g. "[App]". */
  subjectPrefix?: string;
}

export interface BeamInput {
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  to?: string;
  mailbox?: string;
  unread?: boolean;
  date?: Date;
}

export interface BeamResult {
  mailbox: string;
  uid?: number;
  uidValidity?: number;
}

/**
 * InboxBeam writes a message directly into your own mailbox using IMAP APPEND.
 *
 * This is NOT email delivery. Nothing is sent over SMTP and no message leaves
 * for another server — it is appended straight into the target mailbox. Use it
 * to land your own app notifications in your own inbox without SPF/DKIM/DMARC.
 */
export class InboxBeam {
  constructor(private readonly options: InboxBeamOptions) {}

  /** Append one message to the mailbox. Returns the assigned UID when available. */
  async beam(input: BeamInput): Promise<BeamResult> {
    const to = input.to ?? this.options.to ?? this.options.auth.user;
    const from = input.from ?? this.options.from ?? to;
    const mailbox = input.mailbox ?? this.options.mailbox ?? "INBOX";
    const unread = input.unread ?? this.options.unread ?? true;
    const subject = this.options.subjectPrefix
      ? `${this.options.subjectPrefix} ${input.subject}`
      : input.subject;

    const raw = buildMessage({ from, to, subject, text: input.text, html: input.html, date: input.date });
    const flags = unread ? [] : ["\\Seen"];

    const client = this.createClient();
    await client.connect();
    try {
      const response = await client.append(mailbox, raw, flags);
      return {
        mailbox,
        uid: response ? response.uid : undefined,
        uidValidity: response ? Number(response.uidValidity) : undefined,
      };
    } finally {
      await client.logout();
    }
  }

  /** Overridable for testing — returns the underlying ImapFlow client. */
  protected createClient(): ImapFlow {
    const opts: ImapFlowOptions = {
      host: this.options.host,
      port: this.options.port ?? 993,
      secure: this.options.secure ?? true,
      auth: this.options.auth,
      logger: false,
    };
    return new ImapFlow(opts);
  }
}

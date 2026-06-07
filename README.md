# inbox-beam

**Beam app notifications straight into your own mailbox — without sending email.**

You just want a notification to land in your inbox: a contact-form submission, a cron failure, a "someone signed up" ping. But to *send* an email properly you end up configuring a sending domain, SPF, DKIM, DMARC, and a delivery provider (SES / SendGrid / Resend) — none of which you actually needed. You weren't trying to reach a stranger's inbox. You were trying to reach your own.

`inbox-beam` skips all of that. It uses the IMAP `APPEND` command to write a message **directly into your mailbox**. No SMTP. No sending domain. No deliverability. Just your message, in your inbox.

```ts
import { InboxBeam } from "inbox-beam";

const beam = new InboxBeam({
  host: "imap.gmail.com",
  auth: { user: "you@example.com", pass: process.env.IMAP_APP_PASSWORD },
});

await beam.beam({
  subject: "New contact form submission",
  text: "山田太郎 <yamada@example.com>\n資料請求したいです。",
});
```

That message now sits in your inbox, unread, searchable — and nothing was ever sent.

---

## This is NOT email delivery

Read this before using it, so you don't reach for the wrong tool.

`inbox-beam` does **not** send mail. It writes a message into a mailbox you already control via IMAP `APPEND`. That means:

- ✅ **No SPF / DKIM / DMARC.** Nothing is delivered, so domain authentication is irrelevant.
- ✅ **No deliverability problems.** It either appended or it didn't.
- ✅ **One secret to manage** — your IMAP credentials.
- ❌ **It cannot reach anyone else.** It writes to *your* mailbox only. To email a user or customer, use real SMTP / a delivery API.
- ❌ **No sending record, no audit trail.** The date is whatever the client says. Don't use it where a tamper-resistant send log matters.

Think of it as `console.log()` for your inbox, not as a mailer.

## Install

From npm:

```sh
npm install inbox-beam
```

Or straight from GitHub (builds on install via the `prepare` script):

```sh
npm install github:toyoshi/inbox-beam
```

Requires Node.js ≥ 18.

## Quick start

```ts
import { InboxBeam } from "inbox-beam";

const beam = new InboxBeam({
  host: "imap.gmail.com",          // your IMAP host
  auth: {
    user: "you@example.com",
    pass: process.env.IMAP_APP_PASSWORD,
  },
  mailbox: "INBOX",                // or a label/folder like "App Notifications"
  subjectPrefix: "[my-app]",       // optional, prepended to every subject
});

await beam.beam({
  subject: "Cron job failed",
  text: "nightly-export exited with code 1",
});
```

### HTML + plain text

Pass both and you get a `multipart/alternative` message:

```ts
await beam.beam({
  subject: "Weekly report",
  text: "Signups: 42\nRevenue: ¥120,000",
  html: "<h1>Weekly report</h1><ul><li>Signups: 42</li><li>Revenue: ¥120,000</li></ul>",
});
```

### Beam to a specific label / folder

Safer than dumping into INBOX — create the label in your mail client first, then:

```ts
await beam.beam({
  subject: "New signup",
  text: "...",
  mailbox: "App Notifications",   // overrides the constructor default per-call
});
```

## Gmail setup

1. Enable IMAP in Gmail settings (Settings → Forwarding and POP/IMAP).
2. Turn on 2-Step Verification, then create an **App Password** (16 characters): https://myaccount.google.com/apppasswords
3. Use that as `auth.pass`.

> Google Workspace admins can disable app passwords. If so, you'll need OAuth2 — pass `auth: { user, accessToken }` instead of `pass`.

A dedicated account (e.g. `notify@yourdomain.com`) that you forward to yourself is safer than putting your primary account's credentials on a server.

## API

### `new InboxBeam(options)`

| Option          | Type                          | Default       | Description                                            |
| --------------- | ----------------------------- | ------------- | ------------------------------------------------------ |
| `host`          | `string`                      | —             | IMAP host, e.g. `imap.gmail.com`.                      |
| `auth`          | `{ user, pass?, accessToken? }` | —           | IMAP credentials. App password or OAuth2 access token. |
| `port`          | `number`                      | `993`         | IMAP port.                                             |
| `secure`        | `boolean`                     | `true`        | Use TLS.                                               |
| `mailbox`       | `string`                      | `"INBOX"`     | Default target mailbox / label.                        |
| `from`          | `string`                      | `auth.user`   | Default From address.                                  |
| `to`            | `string`                      | `auth.user`   | Default To address.                                    |
| `unread`        | `boolean`                     | `true`        | Leave appended messages unread (omit `\Seen`).         |
| `subjectPrefix` | `string`                      | —             | Prepended to every subject.                            |

### `beam.beam(input) => Promise<BeamResult>`

| Field     | Type      | Description                                            |
| --------- | --------- | ----------------------------------------------------- |
| `subject` | `string`  | Required.                                              |
| `text`    | `string`  | Plain-text body.                                       |
| `html`    | `string`  | HTML body. With `text`, becomes `multipart/alternative`. |
| `from`    | `string`  | Overrides the default From.                            |
| `to`      | `string`  | Overrides the default To.                              |
| `mailbox` | `string`  | Overrides the target mailbox for this call.            |
| `unread`  | `boolean` | Overrides the unread default for this call.            |

Returns `{ mailbox, uid?, uidValidity? }` — the `uid` is assigned by the server (`APPENDUID`).

### `buildMessage(input) => string`

The RFC 5322 message builder is exported separately if you want the raw message without the IMAP connection (zero dependencies, UTF-8 safe):

```ts
import { buildMessage } from "inbox-beam";
const raw = buildMessage({ from: "a@x.com", to: "b@x.com", subject: "件名", text: "本文" });
```

## When to use it

**Good fit**

- Personal / internal notifications only you (or your team) read
- Contact-form copies, error alerts, job-completion logs
- Small tools where you don't want to stand up a sending domain
- You'd rather search your mail than scroll a Slack channel

**Wrong tool**

- Emailing third parties (users, customers) → use SMTP / a delivery API
- Anything needing an audit trail, bounce handling, or delivery receipts

## How it works

IMAP's `APPEND` command (RFC 9051 §6.3.12) adds a message to the end of a mailbox. It's the same command your mail client uses to save sent copies and drafts — `inbox-beam` just uses it to drop notifications you composed yourself. Under the hood it builds an RFC 5322 message and appends it over a TLS IMAP connection (via [imapflow](https://imapflow.com)).

## License

MIT © toyoshi

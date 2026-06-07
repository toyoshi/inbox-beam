# inbox-beam

Put notifications into your own mailbox without sending email.

To send yourself a contact-form alert or a cron failure, you normally set up a
sending domain, SPF, DKIM, DMARC, and a provider like SES or SendGrid. None of
that is needed to reach your *own* inbox.

inbox-beam uses the IMAP `APPEND` command to write a message directly into your
mailbox. No SMTP, no sending domain, no deliverability.

```ts
import { InboxBeam } from "inbox-beam";

const beam = new InboxBeam({
  host: "imap.gmail.com",
  auth: { user: "you@example.com", pass: process.env.IMAP_APP_PASSWORD },
});

await beam.beam({ subject: "New contact", text: "someone submitted the form" });
```

The message lands in your inbox, unread and searchable. Nothing was sent.

## This is not email delivery

inbox-beam appends to a mailbox you already control. It does not send mail and
cannot reach anyone else. To email a user or customer, use SMTP or a delivery
API. It also keeps no send log and the date is set by the client, so don't use
it where an audit trail matters. It's for your own notifications.

## Install

```sh
npm install inbox-beam
```

Or from GitHub (builds on install):

```sh
npm install github:toyoshi/inbox-beam
```

Node.js >= 18.

## Usage

```ts
import { InboxBeam } from "inbox-beam";

const beam = new InboxBeam({
  host: "imap.gmail.com",
  auth: { user: "you@example.com", pass: process.env.IMAP_APP_PASSWORD },
  mailbox: "INBOX",            // or a label/folder
  subjectPrefix: "[my-app]",   // optional
});

await beam.beam({ subject: "Cron failed", text: "nightly-export exited 1" });
```

HTML plus text produces a `multipart/alternative` message:

```ts
await beam.beam({
  subject: "Weekly report",
  text: "Signups: 42",
  html: "<h1>Weekly report</h1><p>Signups: 42</p>",
});
```

Override the target mailbox per call:

```ts
await beam.beam({ subject: "New signup", text: "...", mailbox: "App Notifications" });
```

## Gmail setup

1. Enable IMAP in Gmail settings.
2. Turn on 2-Step Verification and create an [App Password](https://myaccount.google.com/apppasswords).
3. Use it as `auth.pass`.

Workspace admins can disable app passwords. In that case pass an OAuth2 token as
`auth.accessToken` instead of `pass`. A dedicated `notify@` account that
forwards to you is safer than your primary account's credentials on a server.

## API

### `new InboxBeam(options)`

| Option | Type | Default | Notes |
| --- | --- | --- | --- |
| `host` | `string` | — | IMAP host, e.g. `imap.gmail.com`. |
| `auth` | `{ user, pass?, accessToken? }` | — | App password or OAuth2 token. |
| `port` | `number` | `993` | |
| `secure` | `boolean` | `true` | Use TLS. |
| `mailbox` | `string` | `"INBOX"` | Target mailbox or label. |
| `from` | `string` | `auth.user` | Default From. |
| `to` | `string` | `auth.user` | Default To. |
| `unread` | `boolean` | `true` | Leave appended messages unread. |
| `subjectPrefix` | `string` | — | Prepended to every subject. |

### `beam.beam(input)`

`input`: `subject` (required), `text`, `html`, `from`, `to`, `mailbox`,
`unread`. Per-call fields override the constructor defaults.

Returns `{ mailbox, uid?, uidValidity? }`. The `uid` comes from the server's
`APPENDUID` response.

### `buildMessage(input)`

The RFC 5322 builder is exported on its own if you want the raw message without
the IMAP connection. Zero dependencies, UTF-8 safe.

```ts
import { buildMessage } from "inbox-beam";
const raw = buildMessage({ from: "a@x.com", to: "b@x.com", subject: "Hi", text: "Body" });
```

## When to use it

Use it for notifications only you or your team read: contact-form copies, error
alerts, job logs, small tools where standing up email sending isn't worth it.

Don't use it to email third parties, or where you need delivery receipts, bounce
handling, or an audit trail.

## How it works

IMAP's `APPEND` command (RFC 9051 §6.3.12) adds a message to the end of a
mailbox. It's the same command mail clients use to save sent copies and drafts.
inbox-beam builds an RFC 5322 message and appends it over a TLS IMAP connection
using [imapflow](https://imapflow.com).

## License

MIT

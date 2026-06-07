# Reddit 宣伝メモ（inbox-beam）

> 注意: Reddit はセルフプロモに厳しい。「ライブラリ作りました」ではなく
> 「この不満、自分だけ？ → こう解決した」という体験談の枠で出すと通る。
> 各サブの self-promotion ルールを必ず投稿前に確認（特に r/javascript）。

## どこに出すか（優先順）

| サブレディット | 相性 | メモ |
| --- | --- | --- |
| **r/SideProject** | ◎ | 個人開発のお披露目に最も寛容。最初の一発はここ。批判より反応が欲しいなら最適。 |
| **r/selfhosted** | ◎ | 思想がドンピシャ（SES/SendGridに頼らず自分のメールボックスで完結）。「own your inbox」で刺さる。ただしデプロイ型アプリ志向なので、ライブラリだと弱い→「使い方」を具体的に。 |
| **r/node** | ○ | npm パッケージとして本命。実用的なら歓迎されやすい。コード例を厚めに。 |
| **r/webdev** | ○ | 大きい。ただし平日の直リンク投稿は消されがち→ **Showoff Saturday** スレに乗せる。 |
| **r/javascript** | △ | ルール厳格。プロジェクト直投稿は基本NG。毎週の **Showoff Saturday** 限定で。 |
| **r/coolgithubprojects / r/opensource** | ○ | リポジトリ共有OK。淡々と機能紹介でよい。 |
| **r/rails, r/ruby** | （後で） | Ruby gem を出したら。Action Mailer delivery method の角度で刺さる。 |

おすすめ順序: **r/SideProject で出す → 反応・FB を見て文面を直す → r/node と r/selfhosted → 週末に r/webdev Showoff Saturday**。
同じ文面の連投はスパム判定される。サブごとに書き分ける。

最大レバレッジは Reddit より **Hacker News の Show HN** かもしれない（"Show HN: Inbox-beam – get app notifications in your own inbox without sending email"）。Reddit で文面を磨いてから HN、が安全。

## 刺さるフレーミング（共通の軸）

技術名（IMAP APPEND）を主役にしない。**痛み**を主役に。

> 自分宛の通知が欲しいだけなのに、なぜ送信ドメイン・SPF・DKIM・DMARC・SendGrid を設定するのか。
> 届けたいのは他人の受信箱じゃなくて、自分の受信箱なのに。

ワンライナー候補:
- "Send email to yourself — without sending email."
- "console.log() for your inbox."
- "Stop configuring SPF/DKIM just to email yourself."

---

## ドラフト①: r/SideProject

**Title:** I got tired of setting up SendGrid just to email myself, so I put notifications straight into my inbox (IMAP APPEND)

**Body:**

Every small app I build wants to ping me: a contact-form submission, a cron failure, "someone signed up." And every time, to *send* that email properly, I end up configuring a sending domain, SPF, DKIM, DMARC, and some delivery provider — none of which I actually needed. I wasn't trying to reach anyone else's inbox. Just my own.

So I made **inbox-beam**. Instead of sending, it uses IMAP `APPEND` to write the message **directly into your mailbox**. No SMTP, no sending domain, no deliverability.

```ts
const beam = new InboxBeam({
  host: "imap.gmail.com",
  auth: { user: "you@example.com", pass: process.env.IMAP_APP_PASSWORD },
});

await beam.beam({ subject: "New contact", text: "someone submitted the form" });
```

It shows up unread and searchable in your inbox, and nothing was ever sent.

To be clear: this is **not** email delivery — it only writes to a mailbox you already control, so it can't reach anyone else. It's `console.log()` for your inbox, not a mailer. For emailing actual users you still want real SMTP.

MIT, TypeScript, installable from npm or straight from GitHub. Ruby gem coming next. Would love feedback on the API and whether this is useful to anyone else or just me.

GitHub: <link>

---

## ドラフト②: r/selfhosted

**Title:** Get app notifications in your own mailbox without SES/SendGrid — using IMAP APPEND instead of sending email

**Body:**

If you self-host small apps, you probably want them to notify you — but standing up a sending domain (SPF/DKIM/DMARC) or paying for SES/SendGrid just to email *yourself* is overkill.

**inbox-beam** skips sending entirely. It uses the IMAP `APPEND` command to drop a message straight into a mailbox you already own. Point it at your own IMAP server (Dovecot, Gmail, Fastmail, whatever), give it credentials, and your notifications land in a folder/label you choose.

- No SMTP, no sending domain, no deliverability headaches
- One secret to manage (IMAP creds — ideally a dedicated `notify@` account)
- Lands in any label/folder, unread + searchable
- MIT, zero-dependency message builder, imapflow for the connection

It's a library (TS, Ruby next), not a deployable app — but it slots into whatever you're already running. Honest caveat: it writes to *your* mailbox only and keeps no send/audit trail, so it's for personal notifications, not user-facing mail.

GitHub: <link>

---

## ドラフト③: r/node

**Title:** inbox-beam — write notifications into your own inbox via IMAP APPEND (no SMTP/SPF/DKIM)

**Body:**

Small TS library for a small problem: getting app notifications into *your own* inbox without setting up email sending.

Instead of SMTP, it uses IMAP `APPEND` to append the message directly to your mailbox. So there's no sending domain, no SPF/DKIM/DMARC, no deliverability — it either appended or it didn't.

```ts
import { InboxBeam } from "inbox-beam";

const beam = new InboxBeam({
  host: "imap.gmail.com",
  auth: { user: "you@example.com", pass: process.env.IMAP_APP_PASSWORD },
  mailbox: "App Notifications",
});

await beam.beam({
  subject: "Cron failed",
  text: "nightly-export exited 1",
  html: "<b>nightly-export</b> exited 1",  // text+html → multipart/alternative
});
```

- Built on imapflow; zero-dep, UTF-8-safe RFC 5322 builder is exported too
- npm or `npm i github:toyoshi/inbox-beam` (builds on install)
- Node ≥ 18, MIT

Not a replacement for a real mailer — it writes to your mailbox only. Feedback on the API welcome.

GitHub: <link> / npm: <link>

---

## 予想される反論と返し（コメント用カンペ）

**「Slack/Discord の webhook でよくない？」**
> メールは検索・永続・既存のフィルタ/ラベルにそのまま乗る。新しいアプリを開かなくていいし、後から "あの問い合わせ" を全文検索で掘り起こせる。通知をメールの受信箱に集約したい人向け。

**「IMAP APPEND の乱用/ハックでは？」**
> APPEND は仕様（RFC 9051 §6.3.12）の正規コマンドで、メールクライアントが送信済み保存・下書き保存に日常的に使ってるのと同じもの。新規メールの受信処理とは別物だと README にも明記してる。

**「SPF/DKIM 通らないじゃん」**
> 通す必要がない。配送が発生しないので。他人に送るなら普通に SMTP を使うべき、というのが README の最初の but。

**「サーバーに IMAP 認証情報を置くのが怖い」**
> その通り。本アカウントではなく `notify@` の専用アカウントを作ってそこに APPEND → 自分に転送、を推奨してる。権限を絞れる。

**「Gmail だと新着扱いされず通知が鳴らない」**
> 事実。APPEND はフォルダに直接置く操作なので、SMTP 受信時のフィルタ/プッシュ通知とは挙動が違う。未読にはできる。そこを隠さず README に書いてある。

## 投稿チェックリスト

- [ ] GitHub に push、README のリンク（npm / GitHub）を確定
- [ ] npm publish 済み（`npm i inbox-beam` が通る状態）だと信頼される
- [ ] リポジトリに Topics / description / ライセンス表示
- [ ] スクショ or 30秒 GIF（受信箱に届いた様子）があると伸びる
- [ ] 各サブの self-promo ルールを再確認（特に r/javascript は Showoff Saturday のみ）
- [ ] 最初の数コメントに丁寧に即レス（初動の反応がアルゴリズム的に効く）
- [ ] 同一文面を連投しない／サブごとに書き分ける

# Changelog

## 0.1.0

- Initial release.
- `InboxBeam` client: append messages to a mailbox via IMAP `APPEND` (imapflow).
- `buildMessage`: dependency-free, UTF-8-safe RFC 5322 message builder (encoded-word headers, base64 bodies, `multipart/alternative` for html + text).
- Options: `mailbox`, `from`, `to`, `unread`, `subjectPrefix`, per-call overrides.
- Installable from npm or directly from GitHub (`prepare` build).

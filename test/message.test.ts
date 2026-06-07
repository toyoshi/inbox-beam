import { test } from "node:test";
import assert from "node:assert/strict";
import { buildMessage } from "../src/message.ts";

test("ascii subject stays plain and headers are present", () => {
  const raw = buildMessage({ from: "app@example.com", to: "me@example.com", subject: "Hello", text: "Hi" });
  assert.match(raw, /^From: app@example\.com$/m);
  assert.match(raw, /^To: me@example\.com$/m);
  assert.match(raw, /^Subject: Hello$/m);
  assert.match(raw, /^MIME-Version: 1\.0$/m);
});

test("uses CRLF line endings", () => {
  const raw = buildMessage({ from: "a@x.com", to: "b@x.com", subject: "s", text: "t" });
  assert.ok(raw.includes("\r\n"));
  assert.ok(!/[^\r]\n/.test(raw), "no bare LF should remain");
});

test("non-ascii subject becomes an RFC 2047 encoded-word", () => {
  const raw = buildMessage({ from: "a@x.com", to: "b@x.com", subject: "問い合わせがありました", text: "x" });
  const line = raw.split("\r\n").find((l) => l.startsWith("Subject:"))!;
  assert.match(line, /^Subject: =\?UTF-8\?B\?[A-Za-z0-9+/=]+\?=$/);
  const b64 = line.match(/\?B\?([^?]+)\?=/)![1];
  assert.equal(Buffer.from(b64, "base64").toString("utf8"), "問い合わせがありました");
});

test("plain text body round-trips through base64 (UTF-8 safe)", () => {
  const raw = buildMessage({ from: "a@x.com", to: "b@x.com", subject: "s", text: "日本語の本文です" });
  const body = raw.split("\r\n\r\n")[1].replace(/\r\n/g, "");
  assert.equal(Buffer.from(body, "base64").toString("utf8"), "日本語の本文です");
});

test("html + text produces multipart/alternative", () => {
  const raw = buildMessage({ from: "a@x.com", to: "b@x.com", subject: "s", text: "plain", html: "<p>rich</p>" });
  assert.match(raw, /Content-Type: multipart\/alternative; boundary="inbox_beam_[0-9a-f]+"/);
  assert.match(raw, /Content-Type: text\/plain; charset=UTF-8/);
  assert.match(raw, /Content-Type: text\/html; charset=UTF-8/);
});

test("html-only message sets text/html content type", () => {
  const raw = buildMessage({ from: "a@x.com", to: "b@x.com", subject: "s", html: "<b>hi</b>" });
  assert.match(raw, /Content-Type: text\/html; charset=UTF-8/);
  assert.ok(!raw.includes("multipart/alternative"));
});

test("Message-ID uses the From domain", () => {
  const raw = buildMessage({ from: "app@tokuiten.jp", to: "me@example.com", subject: "s", text: "t" });
  assert.match(raw, /^Message-ID: <[0-9a-f]+@tokuiten\.jp>$/m);
});

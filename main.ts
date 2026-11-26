// Entry for the make.fun competition "Texts From Your Future Self".
// Writes one text message from your future self (under 200 characters,
// no trailing newline) to $MAKEFUN_OUTPUT_DIR/entry.txt, then verifies
// the file by reading it back and printing its sha256.

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const MAX_CHARS = 200;

function futureSelfText(): string {
  return "it's you from 2037. stop texting 'five minutes away' from your couch. your friends have a group chat called 'five minutes' now. you're not in it.";
}

function validateLine(line: string): void {
  if (line.length === 0) {
    throw new Error("entry line must not be empty");
  }
  if (line.length >= MAX_CHARS) {
    throw new Error(
      `entry line must be under ${MAX_CHARS} characters, got ${line.length}`,
    );
  }
  if (line.includes("\n") || line.includes("\r")) {
    throw new Error("entry line must be a single line with no newline");
  }
  if (line !== line.trim()) {
    throw new Error("entry line must not have leading or trailing whitespace");
  }
  // Reject control characters (anything below U+0020, plus DEL) so the
  // entry is always a clean, printable text message.
  for (const ch of line) {
    const code = ch.codePointAt(0) ?? 0;
    if (code < 0x20 || code === 0x7f) {
      throw new Error("entry line must not contain control characters");
    }
  }
  // The message must actually come from the future: it has to name a
  // year after the present one.
  const yearMatch = line.match(/\b(20\d{2})\b/);
  if (!yearMatch || Number(yearMatch[1]) <= new Date().getFullYear()) {
    throw new Error("entry line must be dated from a future year");
  }
}

function main(): void {
  const line = futureSelfText();
  validateLine(line);

  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "out";
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "entry.txt");
  writeFileSync(outPath, line, "utf8");

  const readBack = readFileSync(outPath, "utf8");
  if (readBack !== line) {
    throw new Error("read-back verification failed: file content mismatch");
  }
  if (readBack.endsWith("\n")) {
    throw new Error("read-back verification failed: trailing newline present");
  }

  const sha256 = createHash("sha256").update(readBack, "utf8").digest("hex");
  console.log(`entry.txt written: ${readBack.length} chars, sha256=${sha256}`);
}

main();

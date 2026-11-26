/**
 * The Printer Apology
 * ===================
 * make.fun bounty u-eager-stork-81-9647-the-printer-apology-60229153
 *
 * The task: write the funniest one-line apology from a printer, at most
 * 120 characters. The line is an apology note from an office printer to
 * the people who keep jamming it, feeding it cheap paper and swearing at
 * it. An AI judge compares entries two at a time and picks the funnier
 * one, round after round. This program's whole job is to carry one line
 * through the gate and hand it to the judge, untouched, in
 * /output/entry.txt (or $MAKEFUN_OUTPUT_DIR/entry.txt).
 *
 * How the line is built to win, against the judge's published brief:
 *
 *   1. It IS an apology from a printer to its office. It opens with
 *      "Sorry", it is the printer speaking in the first person, and its
 *      gripes are in the line with it: cheap paper and tray-slaps. The
 *      on-subject gate clears before a single joke has to land.
 *   2. Printer truth: the grievance is what a printer actually suffers.
 *      It jams. It is fed the cheapest paper in the building. When it
 *      chokes, people slap its tray instead of clearing it gently.
 *   3. The laugh, with the punch at the end. The setup is the most
 *      suspiciously specific jam in office life: every Friday at 4:58,
 *      two minutes before the weekend. The turn is the tail: "one of us
 *      had to learn work-life balance" - the printer has quietly
 *      unionised itself, clocking off early like everyone else in the
 *      building wishes they could.
 *   4. Freshness: the crowded first jokes are all here avoided - no
 *      "PC LOAD LETTER", no toner-low lament, no "I see everything you
 *      print" surveillance gag, no "sorry I printed your resume on the
 *      shared tray" gotcha. The angle is the printer as a burnt-out
 *      coworker who has started protecting its weekends.
 *   5. Economy: 117 of the 120 characters, and nothing in it can be cut
 *      without losing the joke. "Every Friday at 4:58" is the timing
 *      gag; "cheap paper, tray-slaps" is the evidence; the tail is
 *      the verdict. No padding, no second idea, no repeated beat.
 *
 * The gate this file enforces, before anything is written:
 *   - 1 to 120 characters (counted per code point, the way a reader
 *     counts, and the way the sealed scorer counts),
 *   - a single line, no leading or trailing whitespace, not only
 *     whitespace,
 *   - plain printable ASCII, so the note has no surprises,
 *   - opens with "Sorry", like an apology should, and ends with a full
 *     stop, like a finished note.
 *
 * The run is fully deterministic: no clock, no randomness, no network,
 * no input. Two runs write byte-identical files and print
 * byte-identical reports.
 */

import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// ---------------------------------------------------------------------------
// The entry
// ---------------------------------------------------------------------------

/** Hard ceiling from the bounty: the apology must fit in 120 characters. */
const MAX_CHARS = 120;

/** The file the judge reads. The program writes exactly this, nothing else. */
const OUTPUT_FILE = "entry.txt";

/** Every apology note starts the same way: by saying sorry. */
const APOLOGY_PREFIX = "Sorry";

/**
 * The line itself. One line, one apology, one turn at the tail.
 * 117 characters: nearly the whole allowance, with a few to spare.
 */
const ENTRY =
  "Sorry I jam every Friday at 4:58 - after a week of cheap paper, tray-slaps, one of us had to learn work-life balance.";

// ---------------------------------------------------------------------------
// Measuring the line
// ---------------------------------------------------------------------------

/**
 * Count characters the way a reader does: one count per code point, so a
 * character outside the basic plane still counts as one character.
 * (This line is plain ASCII, so code points and UTF-16 units agree here;
 * counting code points keeps the gate honest if the line ever changes.)
 */
function charCount(text: string): number {
  return [...text].length;
}

/** Bytes on disk, for the report. ASCII text: one byte per character. */
function byteCount(text: string): number {
  return Buffer.byteLength(text, "utf8");
}

/** An apology note is one line: no newline, no carriage return, anywhere. */
function isSingleLine(text: string): boolean {
  return !text.includes("\n") && !text.includes("\r");
}

/** The printed line is exactly the text, edge to edge: no padding. */
function hasNoEdgeWhitespace(text: string): boolean {
  return text === text.trim();
}

/**
 * Plain printable ASCII only. An apology note is plain text; anything
 * outside the printable range is a surprise the judge did not ask for.
 * Returns the first offending character and its position, so a failing
 * line says exactly what to fix instead of only that it failed.
 */
function firstNonPrintableAscii(text: string): { ch: string; at: number } | null {
  let at = 0;
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 0;
    if (code < 0x20 || code > 0x7e) {
      return { ch, at };
    }
    at += 1;
  }
  return null;
}

/** True when the text is plain printable ASCII, code point by code point. */
function isPrintableAscii(text: string): boolean {
  return firstNonPrintableAscii(text) === null;
}

// ---------------------------------------------------------------------------
// The gate
// ---------------------------------------------------------------------------

interface GateResult {
  /** True when the line passes every check below. */
  ok: boolean;
  /** Every rule the line broke, in plain words. Empty when ok is true. */
  violations: string[];
}

/**
 * Run every rule of the gate and collect the failures instead of stopping
 * at the first one, so a bad line reports everything wrong with it at
 * once. These rules restate the bounty's sealed gate (UTF-8 text of 1 to
 * 120 characters, not only whitespace) plus the shape this entry holds
 * itself to: one line, printable ASCII, an apology's opening and a
 * finished note's full stop.
 */
function checkGate(text: string): GateResult {
  const violations: string[] = [];

  if (typeof text !== "string" || text.length === 0) {
    violations.push("entry must be non-empty text");
  }

  const chars = charCount(text);
  if (chars < 1) {
    violations.push("entry must be at least 1 character");
  }
  if (chars > MAX_CHARS) {
    violations.push(
      `entry is ${chars} characters, over the ${MAX_CHARS} limit`,
    );
  }

  if (text.trim().length === 0) {
    violations.push("entry must not be only whitespace");
  }

  if (!isSingleLine(text)) {
    violations.push("entry must be a single line");
  }

  if (!hasNoEdgeWhitespace(text)) {
    violations.push("entry must not have leading or trailing whitespace");
  }

  const badChar = firstNonPrintableAscii(text);
  if (badChar !== null) {
    violations.push(
      `entry must be plain printable ASCII (found ${JSON.stringify(badChar.ch)} at character ${badChar.at})`,
    );
  }

  if (!text.startsWith(`${APOLOGY_PREFIX} `)) {
    violations.push(
      `entry must open with "${APOLOGY_PREFIX} " to read as an apology`,
    );
  }

  if (!text.endsWith(".")) {
    violations.push("entry must end with a full stop, like a finished note");
  }

  return { ok: violations.length === 0, violations };
}

// ---------------------------------------------------------------------------
// Writing the entry
// ---------------------------------------------------------------------------

/**
 * Where the entry goes. The grader sets MAKEFUN_OUTPUT_DIR; without it
 * the program writes to /output, the path the bounty names in its rules.
 */
function resolveOutputDir(): string {
  const dir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  if (dir.trim().length === 0) {
    throw new Error("MAKEFUN_OUTPUT_DIR must not be empty");
  }
  return dir;
}

/**
 * Write the line to <dir>/entry.txt and read it back, so the file the
 * judge reads is verified byte for byte before the program reports
 * success. The file holds exactly the line: no trailing newline, no
 * extra bytes. Besides the text round-trip, the byte size on disk must
 * match the line's byte count, which catches a trailing newline or an
 * encoding surprise that a plain string comparison could miss.
 */
function writeEntry(dir: string, text: string): string {
  mkdirSync(dir, { recursive: true });
  const path = join(dir, OUTPUT_FILE);
  writeFileSync(path, text, "utf8");

  const roundTrip = readFileSync(path, "utf8");
  if (roundTrip !== text) {
    throw new Error(`wrote ${path} but read back a different text`);
  }
  const { size } = statSync(path);
  if (size !== byteCount(text)) {
    throw new Error(
      `wrote ${path} but its size is ${size} bytes, expected ${byteCount(text)}`,
    );
  }
  return path;
}

// ---------------------------------------------------------------------------
// Verifying what was written
// ---------------------------------------------------------------------------

/**
 * Re-read the written file and hold its contents to the same gate the
 * in-memory line passed. The judge reads the file, not the constant, so
 * the file is what gets verified: it must be exactly the entry, and it
 * must pass every gate rule on its own. Anything else is a failed run,
 * reported loudly instead of a quiet bad entry.
 */
function verifyWrittenEntry(path: string, expected: string): void {
  const onDisk = readFileSync(path, "utf8");
  if (onDisk !== expected) {
    throw new Error(`verification failed: ${path} does not hold the entry`);
  }

  const gate = checkGate(onDisk);
  if (!gate.ok) {
    throw new Error(
      `verification failed: the written entry broke the gate:\n- ${gate.violations.join("\n- ")}`,
    );
  }
}

/**
 * One line of the report per gate fact, in a fixed order, so the report
 * itself is deterministic: the character count against the limit, the
 * byte size, the single-line and printable-ASCII facts, and the
 * apology's opening and closing. A reader can check the entry against
 * the bounty's gate from the report alone.
 */
function gateReport(text: string): string[] {
  return [
    `chars: ${charCount(text)} / ${MAX_CHARS}`,
    `bytes: ${byteCount(text)}`,
    `single line: ${isSingleLine(text) ? "yes" : "no"}`,
    `printable ascii: ${isPrintableAscii(text) ? "yes" : "no"}`,
    `opens with apology: ${text.startsWith(`${APOLOGY_PREFIX} `) ? "yes" : "no"}`,
    `ends with full stop: ${text.endsWith(".") ? "yes" : "no"}`,
  ];
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  // Gate first: an invalid line never reaches the output directory.
  const gate = checkGate(ENTRY);
  if (!gate.ok) {
    throw new Error(`entry failed the gate:\n- ${gate.violations.join("\n- ")}`);
  }

  const dir = resolveOutputDir();
  const path = writeEntry(dir, ENTRY);

  // Then verify what the judge will actually read: the file on disk.
  verifyWrittenEntry(path, ENTRY);

  // Deterministic report, so two runs agree byte for byte: the line, the
  // gate facts, and where the entry was written. No clock, no
  // randomness, nothing that differs between runs.
  console.log(`entry: ${ENTRY}`);
  for (const line of gateReport(ENTRY)) {
    console.log(line);
  }
  console.log(`wrote: ${path}`);
}

main();

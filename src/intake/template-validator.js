"use strict";

const fs = require("fs");
const path = require("path");

const TEMPLATE_WITH_NOTE = new Set([
  "DETERMINATION: ELIGIBLE FOR DESKTOP TECHNICAL RECORD BUILD / MOBILE BASELINE: CONSTRAINED",
  "DETERMINATION: ELIGIBLE FOR MOBILE TECHNICAL RECORD BUILD / DESKTOP BASELINE: CONSTRAINED",
]);

const LOCKED_DETERMINATIONS = Object.freeze([
  "DETERMINATION: ELIGIBLE FOR DESKTOP AND MOBILE TECHNICAL RECORD BUILD",
  "DETERMINATION: ELIGIBLE FOR DESKTOP TECHNICAL RECORD BUILD",
  "DETERMINATION: ELIGIBLE FOR DESKTOP TECHNICAL RECORD BUILD / MOBILE BASELINE: CONSTRAINED",
  "DETERMINATION: ELIGIBLE FOR MOBILE TECHNICAL RECORD BUILD",
  "DETERMINATION: ELIGIBLE FOR MOBILE TECHNICAL RECORD BUILD / DESKTOP BASELINE: CONSTRAINED",
  "DETERMINATION: NOT ELIGIBLE FOR FORENSIC EXECUTION",
  "DETERMINATION: NOT ELIGIBLE FOR FORENSIC EXECUTION - CONSTRAINTS (BOTMITIGATION)",
  "DETERMINATION: NOT ELIGIBLE FOR FORENSIC EXECUTION - CONSTRAINTS (OTHER)",
]);

function getTemplateSpecPath() {
  return path.join(process.cwd(), "spec", "AFintaketemplates1-8.md");
}

function loadTemplateSpec() {
  return fs.readFileSync(getTemplateSpecPath(), "utf8").replace(/^\uFEFF/, "");
}

function validateTemplateSpec(specTextInput) {
  const specText = String(specTextInput || "").replace(/\r\n/g, "\n");

  const hasLockedNoteHeading =
    specText.includes("LOCKED NOTE RULE") ||
    specText.includes("Internal implementation rule, not externally emitted:");

  const hasMatterLevelNoteRule =
    specText.includes("{{MATTER_LEVEL_NOTE}} may appear only in Template 3 or Template 5") &&
    specText.includes("When present, it must be exactly one mechanical sentence stating the blocking condition only.") &&
    specText.includes("If not authorized, omit it entirely.");

  if (!hasLockedNoteHeading || !hasMatterLevelNoteRule) {
    throw new Error("TEMPLATE_SPEC_MISSING_INTERNAL_NOTE_RULE");
  }

  for (const determination of LOCKED_DETERMINATIONS) {
    if (!specText.includes(determination)) {
      throw new Error(`TEMPLATE_SPEC_MISSING_LOCKED_DETERMINATION: ${determination}`);
    }
  }

  return {
    valid: true,
    templateCount: LOCKED_DETERMINATIONS.length,
  };
}

function assertSingleMechanicalSentence(note) {
  const safe = String(note || "").trim();
  if (!safe) {
    throw new Error("MATTER_LEVEL_NOTE_REQUIRED");
  }

  const sentenceMatches = safe.match(/[.!?]+/g) || [];
  if (sentenceMatches.length !== 1) {
    throw new Error("MATTER_LEVEL_NOTE_MUST_BE_ONE_SENTENCE");
  }

  return safe;
}

function renderIntakeDetermination(args) {
  const input = args || {};
  const matterId = String(input.matterId || "").trim();
  const determination = String(input.determination || "").trim();
  const matterLevelNote = String(input.matterLevelNote || "").trim();

  if (!matterId) {
    throw new Error("MATTER_ID_REQUIRED");
  }

  if (!LOCKED_DETERMINATIONS.includes(determination)) {
    throw new Error(`INVALID_DETERMINATION_TEMPLATE: ${determination}`);
  }

  if (matterLevelNote) {
    if (!TEMPLATE_WITH_NOTE.has(determination)) {
      throw new Error("MATTER_LEVEL_NOTE_NOT_ALLOWED_FOR_TEMPLATE");
    }
    assertSingleMechanicalSentence(matterLevelNote);
  }

  const lines = [
    "ACCESS FORENSICS",
    "INTAKE DETERMINATION",
    `MATTER ID: ${matterId}`,
    "",
    determination,
  ];

  if (matterLevelNote) {
    lines.push("", matterLevelNote);
  }

  return lines.join("\n");
}

module.exports = Object.freeze({
  LOCKED_DETERMINATIONS,
  loadTemplateSpec,
  validateTemplateSpec,
  renderIntakeDetermination,
});
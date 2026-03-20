"use strict";

const fs = require("fs");
const path = require("path");

const TEMPLATE_STRINGS = Object.freeze({
  TEMPLATE_1: "DETERMINATION: ELIGIBLE FOR DESKTOP AND MOBILE TECHNICAL RECORD BUILD",
  TEMPLATE_2: "DETERMINATION: ELIGIBLE FOR DESKTOP TECHNICAL RECORD BUILD",
  TEMPLATE_3: "DETERMINATION: ELIGIBLE FOR DESKTOP TECHNICAL RECORD BUILD / MOBILE BASELINE: CONSTRAINED",
  TEMPLATE_4: "DETERMINATION: ELIGIBLE FOR MOBILE TECHNICAL RECORD BUILD",
  TEMPLATE_5: "DETERMINATION: ELIGIBLE FOR MOBILE TECHNICAL RECORD BUILD / DESKTOP BASELINE: CONSTRAINED",
  TEMPLATE_6: "DETERMINATION: NOT ELIGIBLE FOR FORENSIC EXECUTION",
  TEMPLATE_7: "DETERMINATION: NOT ELIGIBLE FOR FORENSIC EXECUTION - CONSTRAINTS (BOTMITIGATION)",
  TEMPLATE_8: "DETERMINATION: NOT ELIGIBLE FOR FORENSIC EXECUTION - CONSTRAINTS (OTHER)",
});

const LOCKED_DETERMINATIONS = Object.freeze(Object.values(TEMPLATE_STRINGS));
const TEMPLATE_WITH_NOTE = new Set([
  TEMPLATE_STRINGS.TEMPLATE_3,
  TEMPLATE_STRINGS.TEMPLATE_5,
]);

function getTemplateSpecPath() {
  return path.join(process.cwd(), "spec", "AFintaketemplates1-8.md");
}

function loadTemplateSpec() {
  return fs.readFileSync(getTemplateSpecPath(), "utf8").replace(/^\uFEFF/, "");
}

function validateTemplateSpec(specTextInput) {
  const specText = String(specTextInput || "").replace(/\r\n/g, "\n");

  const hasNoteRule =
    /\{\{MATTER_LEVEL_NOTE\}\}/.test(specText) &&
    /Template 3 or Template 5/i.test(specText) &&
    /one mechanical sentence/i.test(specText) &&
    /omit it entirely|omit entirely/i.test(specText);

  if (!hasNoteRule) {
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
    throw new Error("MATTER_LEVEL_NOTE_MUST_BE_ONE_MECHANICAL_SENTENCE");
  }

  return safe;
}

function renderIntakeDetermination(args) {
  const input = args || {};
  const matterId = String(input.matterId || "").trim();
  const determination = String(input.template || input.determination || "").trim();
  const matterLevelNote = String(input.matterLevelNote || "").trim();

  if (!matterId) {
    throw new Error("MATTER_ID_REQUIRED");
  }

  if (!LOCKED_DETERMINATIONS.includes(determination)) {
    throw new Error(`INVALID_DETERMINATION_TEMPLATE: ${determination}`);
  }

  if (matterLevelNote) {
    if (!TEMPLATE_WITH_NOTE.has(determination)) {
      throw new Error("NOTE_NOT_ALLOWED_FOR_TEMPLATE");
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
  TEMPLATE_STRINGS,
  LOCKED_DETERMINATIONS,
  loadTemplateSpec,
  validateTemplateSpec,
  renderIntakeDetermination,
});
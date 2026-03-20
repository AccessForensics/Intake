"use strict";

const fs = require("fs");
const path = require("path");
const {
  DETERMINATION_TEMPLATE,
  TEMPLATE_VALUES,
  NOTE_ALLOWED_TEMPLATES,
} = require("./enums.js");

function getSpecTemplatePath(repoRoot = process.cwd()) {
  return path.join(repoRoot, "spec", "AFintaketemplates1-8.md");
}

function loadTemplateSpec(repoRoot = process.cwd()) {
  const target = getSpecTemplatePath(repoRoot);
  return fs.readFileSync(target, "utf8").replace(/^\uFEFF/, "");
}

function validateTemplateSpec(text) {
  const body = String(text || "");

  const internalRule = "Internal implementation rule, not externally emitted:";
  if (!body.includes(internalRule)) {
    throw new Error("TEMPLATE_SPEC_MISSING_INTERNAL_NOTE_RULE");
  }

  const noteRule = "{{MATTER_LEVEL_NOTE}} may appear only in Template 3 or Template 5";
  if (!body.includes(noteRule)) {
    throw new Error("TEMPLATE_SPEC_MISSING_LOCKED_NOTE_GATE");
  }

  const templateHeadings = [
    "## TEMPLATE 1:",
    "## TEMPLATE 2:",
    "## TEMPLATE 3:",
    "## TEMPLATE 4:",
    "## TEMPLATE 5:",
    "## TEMPLATE 6:",
    "## TEMPLATE 7:",
    "## TEMPLATE 8:",
  ];

  for (const heading of templateHeadings) {
    if (!body.includes(heading)) {
      throw new Error(`TEMPLATE_SPEC_MISSING_HEADING: ${heading}`);
    }
  }

  for (const line of TEMPLATE_VALUES) {
    if (!body.includes(line)) {
      throw new Error(`TEMPLATE_SPEC_MISSING_DETERMINATION: ${line}`);
    }
  }

  const forbiddenLegacy = /NEXT STEPS|WHAT IS REQUIRED TO REOPEN INTAKE|COUNSEL ACTION OPTION|REASON:/i;
  if (forbiddenLegacy.test(body)) {
    throw new Error("TEMPLATE_SPEC_CONTAINS_LEGACY_VERBOSE_SECTIONS");
  }

  return true;
}

function renderTemplate(templateValue, matterId, matterLevelNote = "") {
  if (!TEMPLATE_VALUES.includes(templateValue)) {
    throw new Error(`INVALID_TEMPLATE: ${templateValue}`);
  }

  const safeMatterId = String(matterId || "").trim();
  if (!safeMatterId) {
    throw new Error("MATTER_ID_REQUIRED");
  }

  const safeNote = String(matterLevelNote || "").trim();
  const noteAllowed = NOTE_ALLOWED_TEMPLATES.has(templateValue);

  if (!noteAllowed && safeNote) {
    throw new Error("NOTE_NOT_ALLOWED_FOR_TEMPLATE");
  }

  if (noteAllowed && safeNote) {
    const sentenceCount = safeNote
      .split(/[.!?]+/)
      .map((part) => part.trim())
      .filter(Boolean).length;

    if (sentenceCount !== 1) {
      throw new Error("MATTER_LEVEL_NOTE_MUST_BE_ONE_MECHANICAL_SENTENCE");
    }
  }

  const lines = [
    "ACCESS FORENSICS",
    "INTAKE DETERMINATION",
    `MATTER ID: ${safeMatterId}`,
    "",
    templateValue,
  ];

  if (noteAllowed && safeNote) {
    lines.push("", safeNote);
  }

  return lines.join("\n");
}

module.exports = Object.freeze({
  loadTemplateSpec,
  validateTemplateSpec,
  renderTemplate,
  getSpecTemplatePath,
  DETERMINATION_TEMPLATE,
});
"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  loadTemplateSpec,
  validateTemplateSpec,
  renderTemplate,
  DETERMINATION_TEMPLATE,
} = require("../src/intake/template-validator.js");

test("template spec loads and validates", () => {
  const body = loadTemplateSpec(process.cwd());
  assert.equal(validateTemplateSpec(body), true);
});

test("template renderer accepts non-note template without note", () => {
  const out = renderTemplate(
    DETERMINATION_TEMPLATE.TEMPLATE_1,
    "AF-2026-0001"
  );

  assert.match(out, /MATTER ID: AF-2026-0001/);
  assert.match(out, /DETERMINATION: ELIGIBLE FOR DESKTOP AND MOBILE TECHNICAL RECORD BUILD/);
  assert.doesNotMatch(out, /\{\{MATTER_LEVEL_NOTE\}\}/);
});

test("template renderer accepts note for template 3", () => {
  const out = renderTemplate(
    DETERMINATION_TEMPLATE.TEMPLATE_3,
    "AF-2026-0002",
    "AUTHWALL blocked bounded Mobile baseline access."
  );

  assert.match(out, /MOBILE BASELINE: CONSTRAINED/);
  assert.match(out, /AUTHWALL blocked bounded Mobile baseline access\./);
});

test("template renderer rejects note for template 2", () => {
  assert.throws(
    () => renderTemplate(
      DETERMINATION_TEMPLATE.TEMPLATE_2,
      "AF-2026-0003",
      "This should not appear."
    ),
    /NOTE_NOT_ALLOWED_FOR_TEMPLATE/
  );
});

test("template renderer rejects multi-sentence note for template 5", () => {
  assert.throws(
    () => renderTemplate(
      DETERMINATION_TEMPLATE.TEMPLATE_5,
      "AF-2026-0004",
      "GEOBLOCK blocked bounded Desktop baseline access. Another sentence."
    ),
    /MATTER_LEVEL_NOTE_MUST_BE_ONE_MECHANICAL_SENTENCE/
  );
});

test("template renderer requires matter id", () => {
  assert.throws(
    () => renderTemplate(
      DETERMINATION_TEMPLATE.TEMPLATE_6,
      ""
    ),
    /MATTER_ID_REQUIRED/
  );
});
"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { DETERMINATION_TEMPLATE } = require("../src/intake/enums.js");
const {
  SPEC_VERSION,
  createExternalOutputValidationRecord,
  assertExternalOutputMayBeReleased,
} = require("../src/intake/external-output-validator.js");

function makeDetermination(template, note = "") {
  return {
    matter_id: "AF-2026-0001",
    determination_template: template,
    generated_at_local: "2026-03-19T12:00:00-04:00",
    generated_at_epoch_ms: 5000,
    matter_level_note: note,
  };
}

test("valid minimal determination output passes automated checks", () => {
  const record = createExternalOutputValidationRecord({
    matter_id: "AF-2026-0001",
    spec_version: SPEC_VERSION,
    determination_record: makeDetermination(DETERMINATION_TEMPLATE.TEMPLATE_1),
    output_text: "ACCESS FORENSICS\nINTAKE DETERMINATION\nMATTER ID: AF-2026-0001\n\nDETERMINATION: ELIGIBLE FOR DESKTOP AND MOBILE TECHNICAL RECORD BUILD",
  });

  assert.equal(record.determination_template_used, DETERMINATION_TEMPLATE.TEMPLATE_1);
  assert.equal(record.forbidden_disclosure_check_passed, true);
  assert.equal(record.forbidden_language_check_passed, true);
  assert.equal(record.mandatory_term_check_passed, true);
  assert.equal(record.per_run_context_leakage_check_passed, true);
  assert.equal(record.indirect_signaling_check_passed, true);

  assert.doesNotThrow(() => assertExternalOutputMayBeReleased(record));
});

test("forbidden disclosure fails validation", () => {
  const record = createExternalOutputValidationRecord({
    matter_id: "AF-2026-0001",
    determination_record: makeDetermination(DETERMINATION_TEMPLATE.TEMPLATE_2),
    output_text: "DETERMINATION: ELIGIBLE FOR DESKTOP TECHNICAL RECORD BUILD\nNumber of runs performed: 2",
  });

  assert.equal(record.forbidden_disclosure_check_passed, false);
  assert.throws(() => assertExternalOutputMayBeReleased(record), /EXTERNAL_OUTPUT_VALIDATION_FAILED/);
});

test("forbidden language fails validation", () => {
  const record = createExternalOutputValidationRecord({
    matter_id: "AF-2026-0001",
    determination_record: makeDetermination(DETERMINATION_TEMPLATE.TEMPLATE_6),
    output_text: "DETERMINATION: NOT ELIGIBLE FOR FORENSIC EXECUTION\nThis audit found issues.",
  });

  assert.equal(record.forbidden_language_check_passed, false);
});

test("mandatory exact terms are required when scope and context are described", () => {
  const record = createExternalOutputValidationRecord({
    matter_id: "AF-2026-0001",
    determination_record: makeDetermination(DETERMINATION_TEMPLATE.TEMPLATE_1),
    output_text: "DETERMINATION: ELIGIBLE FOR DESKTOP AND MOBILE TECHNICAL RECORD BUILD\nReplicated Desktop Browser Context was in scope.",
  });

  assert.equal(record.mandatory_term_check_passed, false);
});

test("matter-level context disclosure rejects paraphrase", () => {
  const record = createExternalOutputValidationRecord({
    matter_id: "AF-2026-0001",
    determination_record: makeDetermination(DETERMINATION_TEMPLATE.TEMPLATE_1),
    output_text: "DETERMINATION: ELIGIBLE FOR DESKTOP AND MOBILE TECHNICAL RECORD BUILD\nThe defined desktop browser context was used.",
  });

  assert.equal(record.matter_level_context_disclosure_check_passed, false);
});

test("per-run context leakage fails validation", () => {
  const record = createExternalOutputValidationRecord({
    matter_id: "AF-2026-0001",
    determination_record: makeDetermination(DETERMINATION_TEMPLATE.TEMPLATE_3, "AUTHWALL blocked bounded Mobile baseline access."),
    output_text: "DETERMINATION: ELIGIBLE FOR DESKTOP TECHNICAL RECORD BUILD / MOBILE BASELINE: CONSTRAINED\nDesktop then Mobile run sequence was used.",
  });

  assert.equal(record.per_run_context_leakage_check_passed, false);
});

test("exact indirect-signaling phrase fails validation", () => {
  const record = createExternalOutputValidationRecord({
    matter_id: "AF-2026-0001",
    determination_record: makeDetermination(DETERMINATION_TEMPLATE.TEMPLATE_4),
    output_text: "DETERMINATION: ELIGIBLE FOR MOBILE TECHNICAL RECORD BUILD\nExtensive testing was completed.",
  });

  assert.equal(record.indirect_signaling_check_passed, false);
});

test("functional-equivalent signaling requires reviewer clearance", () => {
  const record = createExternalOutputValidationRecord({
    matter_id: "AF-2026-0001",
    determination_record: makeDetermination(DETERMINATION_TEMPLATE.TEMPLATE_2),
    output_text: "DETERMINATION: ELIGIBLE FOR DESKTOP TECHNICAL RECORD BUILD\nA thorough review was completed.",
  });

  assert.equal(record.functional_equivalent_review_flagged, true);
  assert.throws(
    () => assertExternalOutputMayBeReleased(record),
    /FUNCTIONAL_EQUIVALENT_REVIEW_CLEARANCE_REQUIRED/
  );
});

test("anti-hedging risk requires reviewer clearance", () => {
  const record = createExternalOutputValidationRecord({
    matter_id: "AF-2026-0001",
    determination_record: makeDetermination(DETERMINATION_TEMPLATE.TEMPLATE_2),
    output_text: "DETERMINATION: ELIGIBLE FOR DESKTOP TECHNICAL RECORD BUILD\nThis likely applies.",
  });

  assert.equal(record.anti_hedging_review_flagged, true);
  assert.throws(
    () => assertExternalOutputMayBeReleased(record),
    /ANTI_HEDGING_REVIEW_CLEARANCE_REQUIRED/
  );
});

test("matter-level note compliance fails if note is not one sentence", () => {
  const record = createExternalOutputValidationRecord({
    matter_id: "AF-2026-0001",
    determination_record: makeDetermination(
      DETERMINATION_TEMPLATE.TEMPLATE_5,
      "GEOBLOCK blocked bounded Desktop baseline access. Another sentence."
    ),
    output_text: "DETERMINATION: ELIGIBLE FOR MOBILE TECHNICAL RECORD BUILD / DESKTOP BASELINE: CONSTRAINED",
  });

  assert.equal(record.matter_level_note_compliance_check_passed, false);
  assert.throws(() => assertExternalOutputMayBeReleased(record), /EXTERNAL_OUTPUT_VALIDATION_FAILED/);
});
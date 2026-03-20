"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const { buildSequencingPlan } = require("../src/intake/sequencing.js");
const { createRunRecord } = require("../src/intake/run-record.js");
const { createMechanicalNoteRuleRecord } = require("../src/intake/mechanical-note-rule.js");
const { classifyIsolationFailure } = require("../src/intake/state-isolation.js");
const { createExternalOutputValidationRecord, assertExternalOutputMayBeReleased } = require("../src/intake/external-output-validator.js");

function loadFixture(name) {
  const target = path.join(process.cwd(), "fixtures", "intake", "appendix-d", name);
  return JSON.parse(fs.readFileSync(target, "utf8"));
}

function assertSequenceMatches(actual, expected) {
  const normalize = (items) => items.map((item) => ({
    run_unit_id: item.run_unit_id || item.rununitid,
    context_id: item.context_id || item.contextid
  }));

  if (JSON.stringify(normalize(actual)) !== JSON.stringify(normalize(expected))) {
    throw new Error("SEQUENCING_MISMATCH");
  }
}

test("D.9 note-gated constrained run fixture passes through run record and note rule creation", () => {
  const fixture = loadFixture("d9_note_gated_constrained_run.json");

  const runRecord = createRunRecord(fixture.run_record_input);
  assert.equal(runRecord.run_id, "RUN-001");
  assert.equal(runRecord.mechanical_note, "AUTHWALL blocked bounded Mobile baseline access.");

  const noteRule = createMechanicalNoteRuleRecord(fixture.note_rule_input);
  assert.equal(noteRule.note_rule_id, "MNR-001");
  assert.equal(noteRule.note_basis, "outcome_constrained");
});

test("D.10 invalid note on observed run fixture fails as expected", () => {
  const fixture = loadFixture("d10_invalid_note_on_observed_run.json");

  assert.throws(
    () => createRunRecord(fixture.run_record_input),
    new RegExp(fixture.expected_error)
  );
});

test("D.11 non-alternating sequencing fixture detects mismatch", () => {
  const fixture = loadFixture("d11_non_alternating_sequencing_failure.json");

  const actualSequence = buildSequencingPlan(fixture.run_units, fixture.matter_scope);

  assert.throws(
    () => assertSequenceMatches(actualSequence, fixture.invalid_observed_sequence),
    new RegExp(fixture.expected_error)
  );
});

test("D.12 state persistence failure fixture produces isolation failure classification", () => {
  const fixture = loadFixture("d12_state_persistence_failure.json");

  const result = classifyIsolationFailure(fixture.classification_input);

  assert.equal(result.stateIsolationRecord.state_isolation_id, fixture.expected_state_isolation_id);
  assert.equal(result.stateIsolationRecord.fresh_browser_context, false);
  assert.equal(result.stateIsolationRecord.storage_state_persisted, true);
  assert.equal(result.runOutcomeUpdate.outcome_label, fixture.expected_outcome_label);
});

test("D.13 indirect signaling output fixture blocks release", () => {
  const fixture = loadFixture("d13_indirect_signaling_output_failure.json");

  const validationRecord = createExternalOutputValidationRecord({
    matter_id: fixture.determination_record.matter_id,
    determination_record: fixture.determination_record,
    output_text: fixture.output_text
  });

  assert.equal(validationRecord.indirect_signaling_check_passed, false);
  assert.throws(
    () => assertExternalOutputMayBeReleased(validationRecord),
    /EXTERNAL_OUTPUT_VALIDATION_FAILED/
  );
});
"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  NOTE_BASIS,
  OUTCOME_LABEL,
  createMechanicalNoteRuleRecord,
} = require("../src/intake/mechanical-note-rule.js");

const {
  CONSTRAINT_CLASS,
  createStateIsolationRecord,
  classifyIsolationFailure,
} = require("../src/intake/state-isolation.js");

test("createMechanicalNoteRuleRecord accepts constrained run note with locked note_basis", () => {
  const record = createMechanicalNoteRuleRecord({
    note_rule_index: 1,
    run_id: "RUN-001",
    outcome_label: OUTCOME_LABEL.CONSTRAINED,
    note_basis: NOTE_BASIS.OUTCOME_CONSTRAINED,
    mechanical_note: "AUTHWALL blocked bounded Desktop baseline access.",
  });

  assert.deepEqual(record, {
    note_rule_id: "MNR-001",
    run_id: "RUN-001",
    note_permitted: true,
    note_basis: "outcome_constrained",
    mechanical_note: "AUTHWALL blocked bounded Desktop baseline access.",
  });
});

test("createMechanicalNoteRuleRecord accepts insufficiently specified run note with locked note_basis", () => {
  const record = createMechanicalNoteRuleRecord({
    note_rule_index: 2,
    run_id: "RUN-002",
    outcome_label: OUTCOME_LABEL.INSUFFICIENT,
    note_basis: NOTE_BASIS.OUTCOME_INSUFFICIENTLY_SPECIFIED,
    mechanical_note: "Missing bounded path to trigger the asserted condition.",
  });

  assert.equal(record.note_rule_id, "MNR-002");
  assert.equal(record.note_basis, "outcome_insufficiently_specified");
});

test("createMechanicalNoteRuleRecord rejects note on observed outcome", () => {
  assert.throws(
    () => createMechanicalNoteRuleRecord({
      note_rule_index: 3,
      run_id: "RUN-003",
      outcome_label: "Observed as asserted",
      note_basis: NOTE_BASIS.OUTCOME_CONSTRAINED,
      mechanical_note: "This should not be allowed.",
    }),
    /NOTE_NOT_ALLOWED_FOR_OUTCOME/
  );
});

test("createMechanicalNoteRuleRecord rejects wrong note_basis for constrained run", () => {
  assert.throws(
    () => createMechanicalNoteRuleRecord({
      note_rule_index: 4,
      run_id: "RUN-004",
      outcome_label: OUTCOME_LABEL.CONSTRAINED,
      note_basis: NOTE_BASIS.OUTCOME_INSUFFICIENTLY_SPECIFIED,
      mechanical_note: "AUTHWALL blocked bounded Mobile baseline access.",
    }),
    /CONSTRAINED_RUN_REQUIRES_OUTCOME_CONSTRAINED_NOTE_BASIS/
  );
});

test("createStateIsolationRecord records explicit failure metadata", () => {
  const record = createStateIsolationRecord({
    isolation_index: 1,
    run_id: "RUN-010",
    fresh_browser_context: false,
    storage_state_persisted: true,
  });

  assert.deepEqual(record, {
    state_isolation_id: "SIR-001",
    run_id: "RUN-010",
    fresh_browser_context: false,
    storage_state_persisted: true,
  });
});

test("classifyIsolationFailure maps locked blocker to constrained outcome", () => {
  const result = classifyIsolationFailure({
    isolation_index: 2,
    run_id: "RUN-011",
    mapped_constraint_class: CONSTRAINT_CLASS.BOTMITIGATION,
  });

  assert.equal(result.stateIsolationRecord.fresh_browser_context, false);
  assert.equal(result.stateIsolationRecord.storage_state_persisted, true);
  assert.equal(result.runOutcomeUpdate.outcome_label, "Constrained");
  assert.equal(result.runOutcomeUpdate.constraint_class, "BOTMITIGATION");
});

test("classifyIsolationFailure maps unmapped blocker to insufficiently specified outcome", () => {
  const result = classifyIsolationFailure({
    isolation_index: 3,
    run_id: "RUN-012",
    missing_bounded_path_or_trigger: "Missing bounded path to re-establish clean-state isolation.",
  });

  assert.equal(result.runOutcomeUpdate.outcome_label, "Insufficiently specified for bounded execution");
  assert.equal(result.runOutcomeUpdate.constraint_class, "");
  assert.equal(
    result.runOutcomeUpdate.mechanical_note,
    "Missing bounded path to re-establish clean-state isolation."
  );
});

test("classifyIsolationFailure rejects invalid mapped constraint class", () => {
  assert.throws(
    () => classifyIsolationFailure({
      isolation_index: 4,
      run_id: "RUN-013",
      mapped_constraint_class: "OTHER",
    }),
    /INVALID_LOCKED_CONSTRAINT_CLASS/
  );
});
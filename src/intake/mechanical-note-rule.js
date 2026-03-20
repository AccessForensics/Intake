"use strict";

const NOTE_BASIS = Object.freeze({
  OUTCOME_CONSTRAINED: "outcome_constrained",
  OUTCOME_INSUFFICIENTLY_SPECIFIED: "outcome_insufficiently_specified",
  DETERMINATION_DESKTOP_ELIGIBLE_MOBILE_CONSTRAINED: "determination_desktop_eligible_mobile_constrained",
  DETERMINATION_MOBILE_ELIGIBLE_DESKTOP_CONSTRAINED: "determination_mobile_eligible_desktop_constrained",
});

const OUTCOME_LABEL = Object.freeze({
  OBSERVED: "Observed as asserted",
  NOT_OBSERVED: "Not observed as asserted",
  CONSTRAINED: "Constrained",
  INSUFFICIENT: "Insufficiently specified for bounded execution",
});

const NOTE_BASIS_VALUES = Object.freeze(Object.values(NOTE_BASIS));
const PER_RUN_NOTE_ALLOWED_OUTCOMES = Object.freeze(
  new Set([OUTCOME_LABEL.CONSTRAINED, OUTCOME_LABEL.INSUFFICIENT])
);

function pad3(value) {
  return String(value).padStart(3, "0");
}

function assertNoteBasis(value) {
  const safe = String(value || "").trim();
  if (!NOTE_BASIS_VALUES.includes(safe)) {
    throw new Error(`INVALID_NOTE_BASIS: ${value}`);
  }
  return safe;
}

function assertMechanicalSentence(note) {
  const safe = String(note || "").trim();
  if (!safe) {
    throw new Error("MECHANICAL_NOTE_REQUIRED");
  }

  const sentenceCount = safe
    .split(/[.!?]+/)
    .map((part) => part.trim())
    .filter(Boolean).length;

  if (sentenceCount !== 1) {
    throw new Error("MECHANICAL_NOTE_MUST_BE_ONE_SENTENCE");
  }

  return safe;
}

function createMechanicalNoteRuleRecord(input) {
  const note_rule_index = Number(input.note_rule_index);
  if (!Number.isInteger(note_rule_index) || note_rule_index <= 0) {
    throw new Error("NOTE_RULE_INDEX_POSITIVE_INTEGER_REQUIRED");
  }

  const run_id = String(input.run_id || "").trim();
  if (!run_id) {
    throw new Error("RUN_ID_REQUIRED");
  }

  const outcome_label = String(input.outcome_label || "").trim();
  const note_basis = assertNoteBasis(input.note_basis);
  const mechanical_note = assertMechanicalSentence(input.mechanical_note);

  if (!PER_RUN_NOTE_ALLOWED_OUTCOMES.has(outcome_label)) {
    throw new Error("NOTE_NOT_ALLOWED_FOR_OUTCOME");
  }

  if (
    outcome_label === OUTCOME_LABEL.CONSTRAINED &&
    note_basis !== NOTE_BASIS.OUTCOME_CONSTRAINED
  ) {
    throw new Error("CONSTRAINED_RUN_REQUIRES_OUTCOME_CONSTRAINED_NOTE_BASIS");
  }

  if (
    outcome_label === OUTCOME_LABEL.INSUFFICIENT &&
    note_basis !== NOTE_BASIS.OUTCOME_INSUFFICIENTLY_SPECIFIED
  ) {
    throw new Error("INSUFFICIENT_RUN_REQUIRES_OUTCOME_INSUFFICIENTLY_SPECIFIED_NOTE_BASIS");
  }

  return Object.freeze({
    note_rule_id: `MNR-${pad3(note_rule_index)}`,
    run_id,
    note_permitted: true,
    note_basis,
    mechanical_note,
  });
}

module.exports = Object.freeze({
  NOTE_BASIS,
  NOTE_BASIS_VALUES,
  OUTCOME_LABEL,
  createMechanicalNoteRuleRecord,
});
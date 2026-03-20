"use strict";

const OUTCOME_LABEL = Object.freeze({
  OBSERVED: "Observed as asserted",
  NOT_OBSERVED: "Not observed as asserted",
  CONSTRAINED: "Constrained",
  INSUFFICIENT: "Insufficiently specified for bounded execution",
});

const CONTEXT_ID = Object.freeze({
  DESKTOP_BASELINE: "desktop_baseline",
  MOBILE_BASELINE: "mobile_baseline",
});

const CONSTRAINT_CLASS = Object.freeze({
  AUTHWALL: "AUTHWALL",
  BOTMITIGATION: "BOTMITIGATION",
  GEOBLOCK: "GEOBLOCK",
  HARDCRASH: "HARDCRASH",
  NAVIMPEDIMENT: "NAVIMPEDIMENT",
});

const OUTCOME_VALUES = Object.freeze(Object.values(OUTCOME_LABEL));
const CONTEXT_VALUES = Object.freeze(Object.values(CONTEXT_ID));
const CONSTRAINT_VALUES = Object.freeze(Object.values(CONSTRAINT_CLASS));
const NOTE_ALLOWED_OUTCOMES = Object.freeze(
  new Set([OUTCOME_LABEL.CONSTRAINED, OUTCOME_LABEL.INSUFFICIENT])
);

function pad3(value) {
  return String(value).padStart(3, "0");
}

function assertNonEmptyString(value, fieldName) {
  const safe = String(value || "").trim();
  if (!safe) {
    throw new Error(`${fieldName}_REQUIRED`);
  }
  return safe;
}

function assertOutcomeLabel(value) {
  const safe = String(value || "").trim();
  if (!OUTCOME_VALUES.includes(safe)) {
    throw new Error(`INVALID_OUTCOME_LABEL: ${value}`);
  }
  return safe;
}

function assertContextId(value) {
  const safe = String(value || "").trim();
  if (!CONTEXT_VALUES.includes(safe)) {
    throw new Error(`INVALID_CONTEXT_ID: ${value}`);
  }
  return safe;
}

function assertConstraintClass(value, outcomeLabel) {
  const safe = String(value || "").trim();

  if (outcomeLabel === OUTCOME_LABEL.CONSTRAINED) {
    if (!CONSTRAINT_VALUES.includes(safe)) {
      throw new Error(`CONSTRAINT_CLASS_REQUIRED_FOR_CONSTRAINED_OUTCOME: ${value}`);
    }
    return safe;
  }

  if (safe) {
    throw new Error("CONSTRAINT_CLASS_NOT_ALLOWED_FOR_NON_CONSTRAINED_OUTCOME");
  }

  return "";
}

function assertMechanicalNote(note, outcomeLabel) {
  const safe = String(note || "").trim();

  if (!safe) {
    return "";
  }

  if (!NOTE_ALLOWED_OUTCOMES.has(outcomeLabel)) {
    throw new Error("NOTE_NOT_ALLOWED_FOR_OUTCOME");
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

function createRunRecord(input) {
  const runIndex = Number(input.runIndex);
  if (!Number.isInteger(runIndex) || runIndex <= 0) {
    throw new Error("RUN_INDEX_POSITIVE_INTEGER_REQUIRED");
  }

  const matter_id = assertNonEmptyString(input.matter_id, "MATTER_ID");
  const complaint_group_anchor_id = assertNonEmptyString(
    input.complaint_group_anchor_id,
    "COMPLAINT_GROUP_ANCHOR_ID"
  );
  const run_unit_id = assertNonEmptyString(input.run_unit_id, "RUN_UNIT_ID");
  const context_id = assertContextId(input.context_id);
  const outcome_label = assertOutcomeLabel(input.outcome_label);
  const constraint_class = assertConstraintClass(input.constraint_class, outcome_label);
  const mechanical_note = assertMechanicalNote(input.mechanical_note, outcome_label);

  const run_start_local = assertNonEmptyString(input.run_start_local, "RUN_START_LOCAL");
  const run_start_epoch_ms = Number(input.run_start_epoch_ms);
  if (!Number.isInteger(run_start_epoch_ms) || run_start_epoch_ms < 0) {
    throw new Error("RUN_START_EPOCH_MS_NONNEGATIVE_INTEGER_REQUIRED");
  }

  const run_end_local = assertNonEmptyString(input.run_end_local, "RUN_END_LOCAL");
  const run_end_epoch_ms = Number(input.run_end_epoch_ms);
  if (!Number.isInteger(run_end_epoch_ms) || run_end_epoch_ms < 0) {
    throw new Error("RUN_END_EPOCH_MS_NONNEGATIVE_INTEGER_REQUIRED");
  }

  if (run_end_epoch_ms < run_start_epoch_ms) {
    throw new Error("RUN_END_MUST_NOT_PRECEDE_RUN_START");
  }

  return Object.freeze({
    matter_id,
    run_id: `RUN-${pad3(runIndex)}`,
    complaint_group_anchor_id,
    run_unit_id,
    context_id,
    outcome_label,
    constraint_class,
    mechanical_note,
    run_start_local,
    run_start_epoch_ms,
    run_end_local,
    run_end_epoch_ms,
  });
}

module.exports = Object.freeze({
  OUTCOME_LABEL,
  CONTEXT_ID,
  CONSTRAINT_CLASS,
  OUTCOME_VALUES,
  CONTEXT_VALUES,
  CONSTRAINT_VALUES,
  createRunRecord,
});
"use strict";

const OUTCOME_LABEL = Object.freeze({
  CONSTRAINED: "Constrained",
  INSUFFICIENT: "Insufficiently specified for bounded execution",
});

const CONSTRAINT_CLASS = Object.freeze({
  AUTHWALL: "AUTHWALL",
  BOTMITIGATION: "BOTMITIGATION",
  GEOBLOCK: "GEOBLOCK",
  HARDCRASH: "HARDCRASH",
  NAVIMPEDIMENT: "NAVIMPEDIMENT",
});

const CONSTRAINT_VALUES = Object.freeze(Object.values(CONSTRAINT_CLASS));

function pad3(value) {
  return String(value).padStart(3, "0");
}

function assertMappedConstraintClass(value) {
  const safe = String(value || "").trim();
  if (!CONSTRAINT_VALUES.includes(safe)) {
    throw new Error(`INVALID_LOCKED_CONSTRAINT_CLASS: ${value}`);
  }
  return safe;
}

function createStateIsolationRecord(input) {
  const isolation_index = Number(input.isolation_index);
  if (!Number.isInteger(isolation_index) || isolation_index <= 0) {
    throw new Error("ISOLATION_INDEX_POSITIVE_INTEGER_REQUIRED");
  }

  const run_id = String(input.run_id || "").trim();
  if (!run_id) {
    throw new Error("RUN_ID_REQUIRED");
  }

  const fresh_browser_context = input.fresh_browser_context === true;
  const storage_state_persisted = input.storage_state_persisted === true;

  return Object.freeze({
    state_isolation_id: `SIR-${pad3(isolation_index)}`,
    run_id,
    fresh_browser_context,
    storage_state_persisted,
  });
}

function classifyIsolationFailure(input) {
  const run_id = String(input.run_id || "").trim();
  if (!run_id) {
    throw new Error("RUN_ID_REQUIRED");
  }

  const mappedConstraintClass = String(input.mapped_constraint_class || "").trim();
  const missingBoundedPathOrTrigger = String(input.missing_bounded_path_or_trigger || "").trim();

  const stateIsolationRecord = createStateIsolationRecord({
    isolation_index: input.isolation_index,
    run_id,
    fresh_browser_context: false,
    storage_state_persisted: true,
  });

  if (mappedConstraintClass) {
    return Object.freeze({
      stateIsolationRecord,
      runOutcomeUpdate: Object.freeze({
        run_id,
        outcome_label: OUTCOME_LABEL.CONSTRAINED,
        constraint_class: assertMappedConstraintClass(mappedConstraintClass),
        mechanical_note: "Clean-state isolation failed under a mapped technical blocker.",
      }),
    });
  }

  if (!missingBoundedPathOrTrigger) {
    throw new Error("MISSING_BOUNDED_PATH_OR_TRIGGER_REQUIRED_FOR_UNMAPPED_ISOLATION_FAILURE");
  }

  return Object.freeze({
    stateIsolationRecord,
    runOutcomeUpdate: Object.freeze({
      run_id,
      outcome_label: OUTCOME_LABEL.INSUFFICIENT,
      constraint_class: "",
      mechanical_note: missingBoundedPathOrTrigger,
    }),
  });
}

module.exports = Object.freeze({
  CONSTRAINT_CLASS,
  createStateIsolationRecord,
  classifyIsolationFailure,
});
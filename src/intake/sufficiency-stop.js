"use strict";

const OUTCOME_LABEL = Object.freeze({
  OBSERVED: "Observed as asserted",
  NOT_OBSERVED: "Not observed as asserted",
  CONSTRAINED: "Constrained",
  INSUFFICIENT: "Insufficiently specified for bounded execution",
});

const STOP_BASIS = Object.freeze({
  SUFFICIENCY_REACHED: "sufficiency_reached",
  RUN_CAP_REACHED: "run_cap_reached",
  NOT_STOPPED: "",
});

const RUN_CAP = 10;
const SUFFICIENCY_THRESHOLD = 2;

const QUALIFYING_OUTCOMES = Object.freeze(
  new Set([
    OUTCOME_LABEL.OBSERVED,
    OUTCOME_LABEL.NOT_OBSERVED,
  ])
);

function assertRunRecordsArray(runRecords) {
  if (!Array.isArray(runRecords)) {
    throw new Error("RUN_RECORDS_ARRAY_REQUIRED");
  }
}

function assertDistinctRunIds(runRecords) {
  const seen = new Set();

  for (const record of runRecords) {
    const runId = String(record.run_id || "").trim();
    if (!runId) {
      throw new Error("RUN_ID_REQUIRED");
    }

    if (seen.has(runId)) {
      throw new Error(`DUPLICATE_RUN_ID: ${runId}`);
    }

    seen.add(runId);
  }
}

function countQualifyingConfirmations(runRecords) {
  let count = 0;

  for (const record of runRecords) {
    const outcomeLabel = String(record.outcome_label || "").trim();
    if (QUALIFYING_OUTCOMES.has(outcomeLabel)) {
      count += 1;
    }
  }

  return count;
}

function evaluateMatterProgress(runRecords) {
  assertRunRecordsArray(runRecords);
  assertDistinctRunIds(runRecords);

  const run_count = runRecords.length;
  const qualifying_confirmation_count = countQualifyingConfirmations(runRecords);
  const sufficiency_reached = qualifying_confirmation_count >= SUFFICIENCY_THRESHOLD;
  const run_cap_reached = run_count >= RUN_CAP;

  let stop_basis = STOP_BASIS.NOT_STOPPED;

  if (sufficiency_reached) {
    stop_basis = STOP_BASIS.SUFFICIENCY_REACHED;
  } else if (run_cap_reached) {
    stop_basis = STOP_BASIS.RUN_CAP_REACHED;
  }

  const intake_closed = stop_basis !== STOP_BASIS.NOT_STOPPED;

  return Object.freeze({
    run_cap: RUN_CAP,
    run_count,
    qualifying_confirmation_count,
    sufficiency_threshold: SUFFICIENCY_THRESHOLD,
    sufficiency_reached,
    run_cap_reached,
    stop_basis,
    intake_closed,
  });
}

function assertRunMayBeAppended(existingRunRecords) {
  const progress = evaluateMatterProgress(existingRunRecords);

  if (progress.intake_closed) {
    throw new Error(`NO_POST_STOP_EXECUTION_ALLOWED: ${progress.stop_basis}`);
  }

  return true;
}

function appendRunIfPermitted(existingRunRecords, nextRunRecord) {
  assertRunRecordsArray(existingRunRecords);
  assertRunMayBeAppended(existingRunRecords);

  const safeNext = nextRunRecord;
  if (!safeNext || typeof safeNext !== "object") {
    throw new Error("NEXT_RUN_RECORD_REQUIRED");
  }

  const nextRunId = String(safeNext.run_id || "").trim();
  if (!nextRunId) {
    throw new Error("NEXT_RUN_RECORD_RUN_ID_REQUIRED");
  }

  const next = existingRunRecords.concat([safeNext]);
  const progress = evaluateMatterProgress(next);

  return Object.freeze({
    run_records: next,
    progress,
  });
}

module.exports = Object.freeze({
  OUTCOME_LABEL,
  STOP_BASIS,
  RUN_CAP,
  SUFFICIENCY_THRESHOLD,
  evaluateMatterProgress,
  assertRunMayBeAppended,
  appendRunIfPermitted,
});
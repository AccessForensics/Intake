"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  OUTCOME_LABEL,
  STOP_BASIS,
  RUN_CAP,
  SUFFICIENCY_THRESHOLD,
  evaluateMatterProgress,
  assertRunMayBeAppended,
  appendRunIfPermitted,
} = require("../src/intake/sufficiency-stop.js");

function makeRun(run_id, outcome_label, run_unit_id = "RU-001", context_id = "desktop_baseline") {
  return {
    matter_id: "AF-2026-0001",
    run_id,
    complaint_group_anchor_id: "CGA-001",
    run_unit_id,
    context_id,
    outcome_label,
    constraint_class: "",
    mechanical_note: "",
    run_start_local: "2026-03-19T10:00:00-04:00",
    run_start_epoch_ms: 1000,
    run_end_local: "2026-03-19T10:00:01-04:00",
    run_end_epoch_ms: 2000,
  };
}

test("locked constants are correct", () => {
  assert.equal(RUN_CAP, 10);
  assert.equal(SUFFICIENCY_THRESHOLD, 2);
});

test("only observed and not observed count as qualifying confirmations", () => {
  const progress = evaluateMatterProgress([
    makeRun("RUN-001", OUTCOME_LABEL.OBSERVED),
    makeRun("RUN-002", OUTCOME_LABEL.NOT_OBSERVED),
    makeRun("RUN-003", OUTCOME_LABEL.CONSTRAINED),
    makeRun("RUN-004", OUTCOME_LABEL.INSUFFICIENT),
  ]);

  assert.equal(progress.run_count, 4);
  assert.equal(progress.qualifying_confirmation_count, 2);
  assert.equal(progress.sufficiency_reached, true);
  assert.equal(progress.stop_basis, STOP_BASIS.SUFFICIENCY_REACHED);
  assert.equal(progress.intake_closed, true);
});

test("same run_unit_id across distinct runs still satisfies sufficiency", () => {
  const progress = evaluateMatterProgress([
    makeRun("RUN-001", OUTCOME_LABEL.OBSERVED, "RU-001"),
    makeRun("RUN-002", OUTCOME_LABEL.NOT_OBSERVED, "RU-001"),
  ]);

  assert.equal(progress.qualifying_confirmation_count, 2);
  assert.equal(progress.sufficiency_reached, true);
  assert.equal(progress.stop_basis, STOP_BASIS.SUFFICIENCY_REACHED);
});

test("run cap reached without sufficiency stops on run_cap_reached", () => {
  const runs = [];
  for (let i = 1; i <= 10; i += 1) {
    const runId = `RUN-${String(i).padStart(3, "0")}`;
    runs.push(makeRun(runId, OUTCOME_LABEL.CONSTRAINED, `RU-${String(i).padStart(3, "0")}`));
  }

  const progress = evaluateMatterProgress(runs);

  assert.equal(progress.run_count, 10);
  assert.equal(progress.qualifying_confirmation_count, 0);
  assert.equal(progress.run_cap_reached, true);
  assert.equal(progress.stop_basis, STOP_BASIS.RUN_CAP_REACHED);
  assert.equal(progress.intake_closed, true);
});

test("if sufficiency is reached on the 10th run, stop_basis is sufficiency_reached", () => {
  const runs = [];
  for (let i = 1; i <= 8; i += 1) {
    const runId = `RUN-${String(i).padStart(3, "0")}`;
    runs.push(makeRun(runId, OUTCOME_LABEL.CONSTRAINED, `RU-${String(i).padStart(3, "0")}`));
  }

  runs.push(makeRun("RUN-009", OUTCOME_LABEL.OBSERVED, "RU-100"));
  runs.push(makeRun("RUN-010", OUTCOME_LABEL.NOT_OBSERVED, "RU-101", "mobile_baseline"));

  const progress = evaluateMatterProgress(runs);

  assert.equal(progress.run_count, 10);
  assert.equal(progress.qualifying_confirmation_count, 2);
  assert.equal(progress.sufficiency_reached, true);
  assert.equal(progress.run_cap_reached, true);
  assert.equal(progress.stop_basis, STOP_BASIS.SUFFICIENCY_REACHED);
});

test("no post-stop execution is allowed after sufficiency", () => {
  const runs = [
    makeRun("RUN-001", OUTCOME_LABEL.OBSERVED),
    makeRun("RUN-002", OUTCOME_LABEL.NOT_OBSERVED),
  ];

  assert.throws(
    () => assertRunMayBeAppended(runs),
    /NO_POST_STOP_EXECUTION_ALLOWED: sufficiency_reached/
  );
});

test("appendRunIfPermitted allows append before stop and returns updated progress", () => {
  const result = appendRunIfPermitted(
    [makeRun("RUN-001", OUTCOME_LABEL.CONSTRAINED)],
    makeRun("RUN-002", OUTCOME_LABEL.OBSERVED)
  );

  assert.equal(result.run_records.length, 2);
  assert.equal(result.progress.run_count, 2);
  assert.equal(result.progress.qualifying_confirmation_count, 1);
  assert.equal(result.progress.stop_basis, "");
  assert.equal(result.progress.intake_closed, false);
});

test("duplicate run ids are rejected", () => {
  assert.throws(
    () => evaluateMatterProgress([
      makeRun("RUN-001", OUTCOME_LABEL.OBSERVED),
      makeRun("RUN-001", OUTCOME_LABEL.NOT_OBSERVED),
    ]),
    /DUPLICATE_RUN_ID/
  );
});
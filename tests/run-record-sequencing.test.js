"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  OUTCOME_LABEL,
  CONTEXT_ID,
  CONSTRAINT_CLASS,
  OUTCOME_VALUES,
  CONTEXT_VALUES,
  createRunRecord,
} = require("../src/intake/run-record.js");

const {
  MATTER_SCOPE,
  buildSequencingPlan,
} = require("../src/intake/sequencing.js");

test("run record exposes the four locked outcomes and two locked context ids", () => {
  assert.deepEqual(OUTCOME_VALUES, [
    OUTCOME_LABEL.OBSERVED,
    OUTCOME_LABEL.NOT_OBSERVED,
    OUTCOME_LABEL.CONSTRAINED,
    OUTCOME_LABEL.INSUFFICIENT,
  ]);

  assert.deepEqual(CONTEXT_VALUES, [
    CONTEXT_ID.DESKTOP_BASELINE,
    CONTEXT_ID.MOBILE_BASELINE,
  ]);
});

test("createRunRecord accepts a valid observed desktop run with internal timing fields", () => {
  const record = createRunRecord({
    runIndex: 1,
    matter_id: "AF-2026-0001",
    complaint_group_anchor_id: "CGA-001",
    run_unit_id: "RU-001",
    context_id: "desktop_baseline",
    outcome_label: OUTCOME_LABEL.OBSERVED,
    constraint_class: "",
    mechanical_note: "",
    run_start_local: "2026-03-19T10:00:00-04:00",
    run_start_epoch_ms: 1000,
    run_end_local: "2026-03-19T10:00:01-04:00",
    run_end_epoch_ms: 2000,
  });

  assert.deepEqual(record, {
    matter_id: "AF-2026-0001",
    run_id: "RUN-001",
    complaint_group_anchor_id: "CGA-001",
    run_unit_id: "RU-001",
    context_id: "desktop_baseline",
    outcome_label: "Observed as asserted",
    constraint_class: "",
    mechanical_note: "",
    run_start_local: "2026-03-19T10:00:00-04:00",
    run_start_epoch_ms: 1000,
    run_end_local: "2026-03-19T10:00:01-04:00",
    run_end_epoch_ms: 2000,
  });
});

test("createRunRecord accepts a constrained run only with locked constraint_class and one mechanical sentence note", () => {
  const record = createRunRecord({
    runIndex: 2,
    matter_id: "AF-2026-0002",
    complaint_group_anchor_id: "CGA-002",
    run_unit_id: "RU-002",
    context_id: "mobile_baseline",
    outcome_label: OUTCOME_LABEL.CONSTRAINED,
    constraint_class: CONSTRAINT_CLASS.AUTHWALL,
    mechanical_note: "AUTHWALL blocked bounded Mobile baseline access.",
    run_start_local: "2026-03-19T10:00:00-04:00",
    run_start_epoch_ms: 3000,
    run_end_local: "2026-03-19T10:00:01-04:00",
    run_end_epoch_ms: 4000,
  });

  assert.equal(record.run_id, "RUN-002");
  assert.equal(record.constraint_class, "AUTHWALL");
  assert.equal(record.mechanical_note, "AUTHWALL blocked bounded Mobile baseline access.");
});

test("createRunRecord rejects note on observed outcome", () => {
  assert.throws(
    () => createRunRecord({
      runIndex: 3,
      matter_id: "AF-2026-0003",
      complaint_group_anchor_id: "CGA-003",
      run_unit_id: "RU-003",
      context_id: "desktop_baseline",
      outcome_label: OUTCOME_LABEL.OBSERVED,
      constraint_class: "",
      mechanical_note: "This should not be allowed.",
      run_start_local: "2026-03-19T10:00:00-04:00",
      run_start_epoch_ms: 5000,
      run_end_local: "2026-03-19T10:00:01-04:00",
      run_end_epoch_ms: 6000,
    }),
    /NOTE_NOT_ALLOWED_FOR_OUTCOME/
  );
});

test("createRunRecord rejects constrained outcome without locked constraint_class", () => {
  assert.throws(
    () => createRunRecord({
      runIndex: 4,
      matter_id: "AF-2026-0004",
      complaint_group_anchor_id: "CGA-004",
      run_unit_id: "RU-004",
      context_id: "desktop_baseline",
      outcome_label: OUTCOME_LABEL.CONSTRAINED,
      constraint_class: "",
      mechanical_note: "Blocked by something.",
      run_start_local: "2026-03-19T10:00:00-04:00",
      run_start_epoch_ms: 7000,
      run_end_local: "2026-03-19T10:00:01-04:00",
      run_end_epoch_ms: 8000,
    }),
    /CONSTRAINT_CLASS_REQUIRED_FOR_CONSTRAINED_OUTCOME/
  );
});

test("createRunRecord rejects invalid outcome label", () => {
  assert.throws(
    () => createRunRecord({
      runIndex: 5,
      matter_id: "AF-2026-0005",
      complaint_group_anchor_id: "CGA-005",
      run_unit_id: "RU-005",
      context_id: "desktop_baseline",
      outcome_label: "Pass",
      constraint_class: "",
      mechanical_note: "",
      run_start_local: "2026-03-19T10:00:00-04:00",
      run_start_epoch_ms: 9000,
      run_end_local: "2026-03-19T10:00:01-04:00",
      run_end_epoch_ms: 10000,
    }),
    /INVALID_OUTCOME_LABEL/
  );
});

test("buildSequencingPlan alternates Desktop then Mobile for dual-scope matters", () => {
  const sequence = buildSequencingPlan(
    [
      { rununitid: "RU-001", desktopinscope: true, mobileinscope: true },
      { rununitid: "RU-002", desktopinscope: true, mobileinscope: true },
    ],
    MATTER_SCOPE.DUAL
  );

  assert.deepEqual(sequence, [
    { run_unit_id: "RU-001", context_id: "desktop_baseline" },
    { run_unit_id: "RU-001", context_id: "mobile_baseline" },
    { run_unit_id: "RU-002", context_id: "desktop_baseline" },
    { run_unit_id: "RU-002", context_id: "mobile_baseline" },
  ]);
});

test("buildSequencingPlan preserves desktop-only sequencing with no interleaving", () => {
  const sequence = buildSequencingPlan(
    [
      { rununitid: "RU-010", desktopinscope: true, mobileinscope: false },
      { rununitid: "RU-011", desktopinscope: true, mobileinscope: false },
    ],
    MATTER_SCOPE.DESKTOP_ONLY
  );

  assert.deepEqual(sequence, [
    { run_unit_id: "RU-010", context_id: "desktop_baseline" },
    { run_unit_id: "RU-011", context_id: "desktop_baseline" },
  ]);
});

test("buildSequencingPlan preserves mobile-only sequencing with no interleaving", () => {
  const sequence = buildSequencingPlan(
    [
      { rununitid: "RU-020", desktopinscope: false, mobileinscope: true },
      { rununitid: "RU-021", desktopinscope: false, mobileinscope: true },
    ],
    MATTER_SCOPE.MOBILE_ONLY
  );

  assert.deepEqual(sequence, [
    { run_unit_id: "RU-020", context_id: "mobile_baseline" },
    { run_unit_id: "RU-021", context_id: "mobile_baseline" },
  ]);
});

test("buildSequencingPlan rejects non-alternating dual-scope inputs where a run unit is missing one baseline", () => {
  assert.throws(
    () => buildSequencingPlan(
      [
        { rununitid: "RU-030", desktopinscope: true, mobileinscope: true },
        { rununitid: "RU-031", desktopinscope: true, mobileinscope: false },
      ],
      MATTER_SCOPE.DUAL
    ),
    /DUAL_SCOPE_RUNUNIT_MUST_HAVE_BOTH_BASELINES_IN_SCOPE/
  );
});
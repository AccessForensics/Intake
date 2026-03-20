"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { DETERMINATION_TEMPLATE } = require("../src/intake/enums.js");
const { OUTCOME_LABEL } = require("../src/intake/run-record.js");
const { MATTER_SCOPE, routeDetermination } = require("../src/intake/determination-router.js");

function makeRun(run_id, context_id, outcome_label, constraint_class = "", mechanical_note = "") {
  return {
    matter_id: "AF-2026-0001",
    run_id,
    complaint_group_anchor_id: "CGA-001",
    run_unit_id: "RU-001",
    context_id,
    outcome_label,
    constraint_class,
    mechanical_note,
    run_start_local: "2026-03-19T10:00:00-04:00",
    run_start_epoch_ms: 1000,
    run_end_local: "2026-03-19T10:00:01-04:00",
    run_end_epoch_ms: 2000,
  };
}

function route(input) {
  return routeDetermination({
    matter_id: "AF-2026-0001",
    generated_at_local: "2026-03-19T12:00:00-04:00",
    generated_at_epoch_ms: 5000,
    ...input,
  });
}

test("routes Template 1 for dual-scope eligible matter", () => {
  const result = route({
    matter_scope: MATTER_SCOPE.DUAL,
    run_records: [
      makeRun("RUN-001", "desktop_baseline", OUTCOME_LABEL.OBSERVED),
      makeRun("RUN-002", "mobile_baseline", OUTCOME_LABEL.NOT_OBSERVED),
    ],
  });

  assert.equal(result.determination_template, DETERMINATION_TEMPLATE.TEMPLATE_1);
  assert.equal(result.matter_level_note, "");
});

test("routes Template 2 for desktop-only eligible matter", () => {
  const result = route({
    matter_scope: MATTER_SCOPE.DESKTOP_ONLY,
    run_records: [
      makeRun("RUN-001", "desktop_baseline", OUTCOME_LABEL.OBSERVED),
      makeRun("RUN-002", "desktop_baseline", OUTCOME_LABEL.NOT_OBSERVED),
    ],
  });

  assert.equal(result.determination_template, DETERMINATION_TEMPLATE.TEMPLATE_2);
});

test("routes Template 3 for desktop-eligible mobile-constrained matter", () => {
  const result = route({
    matter_scope: MATTER_SCOPE.DUAL,
    run_records: [
      makeRun("RUN-001", "desktop_baseline", OUTCOME_LABEL.OBSERVED),
      makeRun("RUN-002", "desktop_baseline", OUTCOME_LABEL.NOT_OBSERVED),
      makeRun(
        "RUN-003",
        "mobile_baseline",
        OUTCOME_LABEL.CONSTRAINED,
        "AUTHWALL",
        "AUTHWALL blocked bounded Mobile baseline access."
      ),
    ],
  });

  assert.equal(result.determination_template, DETERMINATION_TEMPLATE.TEMPLATE_3);
  assert.equal(result.matter_level_note, "AUTHWALL blocked bounded Mobile baseline access.");
});

test("routes Template 4 for mobile-only eligible matter", () => {
  const result = route({
    matter_scope: MATTER_SCOPE.MOBILE_ONLY,
    run_records: [
      makeRun("RUN-001", "mobile_baseline", OUTCOME_LABEL.OBSERVED),
      makeRun("RUN-002", "mobile_baseline", OUTCOME_LABEL.NOT_OBSERVED),
    ],
  });

  assert.equal(result.determination_template, DETERMINATION_TEMPLATE.TEMPLATE_4);
});

test("routes Template 5 for mobile-eligible desktop-constrained matter", () => {
  const result = route({
    matter_scope: MATTER_SCOPE.DUAL,
    run_records: [
      makeRun("RUN-001", "mobile_baseline", OUTCOME_LABEL.OBSERVED),
      makeRun("RUN-002", "mobile_baseline", OUTCOME_LABEL.NOT_OBSERVED),
      makeRun(
        "RUN-003",
        "desktop_baseline",
        OUTCOME_LABEL.CONSTRAINED,
        "GEOBLOCK",
        "GEOBLOCK blocked bounded Desktop baseline access."
      ),
    ],
  });

  assert.equal(result.determination_template, DETERMINATION_TEMPLATE.TEMPLATE_5);
  assert.equal(result.matter_level_note, "GEOBLOCK blocked bounded Desktop baseline access.");
});

test("routes Template 6 for non-constraint generic ineligibility", () => {
  const result = route({
    matter_scope: MATTER_SCOPE.DUAL,
    run_records: [
      makeRun("RUN-001", "desktop_baseline", OUTCOME_LABEL.INSUFFICIENT, "", "Missing bounded trigger."),
      makeRun("RUN-002", "mobile_baseline", OUTCOME_LABEL.INSUFFICIENT, "", "Missing bounded trigger."),
    ],
  });

  assert.equal(result.determination_template, DETERMINATION_TEMPLATE.TEMPLATE_6);
  assert.equal(result.matter_level_note, "");
});

test("routes Template 7 for BOTMITIGATION-driven ineligibility", () => {
  const result = route({
    matter_scope: MATTER_SCOPE.DUAL,
    run_records: [
      makeRun("RUN-001", "desktop_baseline", OUTCOME_LABEL.CONSTRAINED, "BOTMITIGATION", "BOTMITIGATION blocked access."),
    ],
  });

  assert.equal(result.determination_template, DETERMINATION_TEMPLATE.TEMPLATE_7);
});

test("routes Template 8 for non-BOT constraint-driven ineligibility", () => {
  const result = route({
    matter_scope: MATTER_SCOPE.DUAL,
    run_records: [
      makeRun("RUN-001", "mobile_baseline", OUTCOME_LABEL.CONSTRAINED, "AUTHWALL", "AUTHWALL blocked access."),
    ],
  });

  assert.equal(result.determination_template, DETERMINATION_TEMPLATE.TEMPLATE_8);
});

test("rejects mixed BOTMITIGATION and non-BOT constraint-driven ineligibility in this slice", () => {
  assert.throws(
    () => route({
      matter_scope: MATTER_SCOPE.DUAL,
      run_records: [
        makeRun("RUN-001", "desktop_baseline", OUTCOME_LABEL.CONSTRAINED, "BOTMITIGATION", "BOTMITIGATION blocked access."),
        makeRun("RUN-002", "mobile_baseline", OUTCOME_LABEL.CONSTRAINED, "AUTHWALL", "AUTHWALL blocked access."),
      ],
    }),
    /MIXED_CONSTRAINT_INELIGIBILITY_BASIS_UNRESOLVED/
  );
});

test("rejects matter-level note on non-Template-3-or-5 determination creation", () => {
  const { createIntakeDeterminationRecord } = require("../src/intake/determination-router.js");

  assert.throws(
    () => createIntakeDeterminationRecord({
      matter_id: "AF-2026-0001",
      determination_template: DETERMINATION_TEMPLATE.TEMPLATE_1,
      generated_at_local: "2026-03-19T12:00:00-04:00",
      generated_at_epoch_ms: 5000,
      matter_level_note: "This should not be allowed.",
    }),
    /MATTER_LEVEL_NOTE_NOT_ALLOWED_FOR_TEMPLATE/
  );
});
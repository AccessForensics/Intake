"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const { normalizeComplaintAnchors } = require("../src/intake/complaint-normalizer.js");
const { buildRunUnitsFromAnchors } = require("../src/intake/rununit-builder.js");
const { buildSequencingPlan } = require("../src/intake/sequencing.js");
const { createRunRecord } = require("../src/intake/run-record.js");
const { evaluateMatterProgress } = require("../src/intake/sufficiency-stop.js");
const { routeDetermination } = require("../src/intake/determination-router.js");
const { createExternalOutputValidationRecord, assertExternalOutputMayBeReleased } = require("../src/intake/external-output-validator.js");
const { createIntakeManifestRecord } = require("../src/intake/intake-manifest.js");

function loadFixture(name) {
  const target = path.join(process.cwd(), "fixtures", "intake", "appendix-d", name);
  return JSON.parse(fs.readFileSync(target, "utf8"));
}

function buildScopeOptions(matterScope, createdContextBasis) {
  if (matterScope === "desktop_only") {
    return {
      desktopInScope: true,
      mobileInScope: false,
      createdContextBasis,
    };
  }

  if (matterScope === "mobile_only") {
    return {
      desktopInScope: false,
      mobileInScope: true,
      createdContextBasis,
    };
  }

  return {
    desktopInScope: true,
    mobileInScope: true,
    createdContextBasis,
  };
}

function toManifestAnchors(matterId, normalizedAnchors) {
  return normalizedAnchors.map((anchor) => ({
    matter_id: matterId,
    complaint_group_anchor_id: anchor.complaintgroupanchorid,
  }));
}

function toManifestRunUnits(matterId, runUnits) {
  return runUnits.map((runUnit) => ({
    matter_id: matterId,
    run_unit_id: runUnit.rununitid,
    complaint_group_anchor_id: runUnit.complaintgroupanchorid,
  }));
}

function makeOutputText(determinationRecord) {
  const lines = [
    "ACCESS FORENSICS",
    "INTAKE DETERMINATION",
    `MATTER ID: ${determinationRecord.matter_id}`,
    "",
    determinationRecord.determination_template
  ];

  if (determinationRecord.matter_level_note) {
    lines.push("", determinationRecord.matter_level_note);
  }

  return lines.join("\n");
}

function runFixture(fixture) {
  const normalizedAnchors = normalizeComplaintAnchors(fixture.complaint_anchors);

  const runUnits = buildRunUnitsFromAnchors(
    normalizedAnchors,
    buildScopeOptions(fixture.matter_scope, fixture.created_context_basis)
  );

  const sequence = buildSequencingPlan(runUnits, fixture.matter_scope);

  const expectedSequence = fixture.expected_sequence.map((item) => ({
    run_unit_id: item.run_unit_id,
    context_id: item.context_id,
  }));

  assert.deepEqual(sequence, expectedSequence);

  const runRecords = fixture.run_execution_plan.map((plan, index) => {
    const runUnit = runUnits[plan.run_unit_index];
    if (!runUnit) {
      throw new Error(`RUN_UNIT_INDEX_OUT_OF_RANGE: ${plan.run_unit_index}`);
    }

    return createRunRecord({
      runIndex: index + 1,
      matter_id: fixture.matter_id,
      complaint_group_anchor_id: runUnit.complaintgroupanchorid,
      run_unit_id: runUnit.rununitid,
      context_id: plan.context_id,
      outcome_label: plan.outcome_label,
      constraint_class: plan.constraint_class,
      mechanical_note: plan.mechanical_note,
      run_start_local: plan.run_start_local,
      run_start_epoch_ms: plan.run_start_epoch_ms,
      run_end_local: plan.run_end_local,
      run_end_epoch_ms: plan.run_end_epoch_ms
    });
  });

  const progress = evaluateMatterProgress(runRecords);
  assert.equal(progress.stop_basis, fixture.expected_stop_basis);
  assert.equal(progress.intake_closed, true);

  const determinationRecord = routeDetermination({
    matter_id: fixture.matter_id,
    matter_scope: fixture.matter_scope,
    run_records: runRecords,
    generated_at_local: fixture.generated_at_local,
    generated_at_epoch_ms: fixture.generated_at_epoch_ms
  });

  assert.equal(determinationRecord.determination_template, fixture.expected_determination_template);

  const outputText = makeOutputText(determinationRecord);

  const validationRecord = createExternalOutputValidationRecord({
    matter_id: fixture.matter_id,
    determination_record: determinationRecord,
    output_text: outputText
  });

  assert.doesNotThrow(() => assertExternalOutputMayBeReleased(validationRecord));

  const manifest = createIntakeManifestRecord({
    matter_id: fixture.matter_id,
    scope_anchor_reference: fixture.scope_anchor_reference,
    intake_runs: runRecords,
    run_units: toManifestRunUnits(fixture.matter_id, runUnits),
    complaint_group_anchors: toManifestAnchors(fixture.matter_id, normalizedAnchors),
    determination_record: determinationRecord,
    internal_timing_metadata: {
      run_order: runRecords.map((record) => record.run_id),
      run_timings: Object.fromEntries(
        runRecords.map((record) => [
          record.run_id,
          {
            start_epoch_ms: record.run_start_epoch_ms,
            end_epoch_ms: record.run_end_epoch_ms
          }
        ])
      )
    }
  });

  assert.equal(manifest.matter_id, fixture.matter_id);
  assert.equal(manifest.determination_record, fixture.expected_determination_template);
}

test("D.6 generic ineligible fixture passes end-to-end", () => {
  runFixture(loadFixture("d6_not_eligible_generic.json"));
});

test("D.7 botmitigation ineligible fixture passes end-to-end", () => {
  runFixture(loadFixture("d7_not_eligible_botmitigation.json"));
});

test("D.8 constraints-other ineligible fixture passes end-to-end", () => {
  runFixture(loadFixture("d8_not_eligible_constraints_other.json"));
});
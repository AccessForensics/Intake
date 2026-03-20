"use strict";

const { SPEC_VERSION } = require("./context-profiles.js");

function assertNonEmptyString(value, fieldName) {
  const safe = String(value || "").trim();
  if (!safe) {
    throw new Error(`${fieldName}_REQUIRED`);
  }
  return safe;
}

function buildIdSet(records, fieldName) {
  const set = new Set();

  for (const record of records) {
    const value = assertNonEmptyString(record[fieldName], fieldName.toUpperCase());
    if (set.has(value)) {
      throw new Error(`DUPLICATE_${fieldName.toUpperCase()}: ${value}`);
    }
    set.add(value);
  }

  return set;
}

function assertArray(value, fieldName) {
  if (!Array.isArray(value)) {
    throw new Error(`${fieldName}_ARRAY_REQUIRED`);
  }
}

function createIntakeManifestRecord(input) {
  const matter_id = assertNonEmptyString(input.matter_id, "MATTER_ID");
  const scope_anchor_reference = assertNonEmptyString(input.scope_anchor_reference, "SCOPE_ANCHOR_REFERENCE");

  assertArray(input.intake_runs, "INTAKE_RUNS");
  assertArray(input.run_units, "RUN_UNITS");
  assertArray(input.complaint_group_anchors, "COMPLAINT_GROUP_ANCHORS");

  const determination_record = input.determination_record;
  if (!determination_record || typeof determination_record !== "object") {
    throw new Error("DETERMINATION_RECORD_REQUIRED");
  }

  const runRecords = input.intake_runs;
  const runUnits = input.run_units;
  const complaintGroupAnchors = input.complaint_group_anchors;

  const runIdSet = buildIdSet(runRecords, "run_id");
  const runUnitIdSet = buildIdSet(runUnits, "run_unit_id");
  const anchorIdSet = buildIdSet(complaintGroupAnchors, "complaint_group_anchor_id");

  for (const run of runRecords) {
    if (String(run.matter_id || "").trim() !== matter_id) {
      throw new Error(`RUN_RECORD_MATTER_ID_MISMATCH: ${run.run_id}`);
    }

    const runUnitId = assertNonEmptyString(run.run_unit_id, "RUN_UNIT_ID");
    const anchorId = assertNonEmptyString(run.complaint_group_anchor_id, "COMPLAINT_GROUP_ANCHOR_ID");

    if (!runUnitIdSet.has(runUnitId)) {
      throw new Error(`UNRESOLVED_RUN_UNIT_REFERENCE: ${runUnitId}`);
    }

    if (!anchorIdSet.has(anchorId)) {
      throw new Error(`UNRESOLVED_COMPLAINT_GROUP_ANCHOR_REFERENCE: ${anchorId}`);
    }
  }

  for (const runUnit of runUnits) {
    if (String(runUnit.matter_id || "").trim() !== matter_id) {
      throw new Error(`RUN_UNIT_MATTER_ID_MISMATCH: ${runUnit.run_unit_id}`);
    }

    const anchorId = assertNonEmptyString(runUnit.complaint_group_anchor_id, "COMPLAINT_GROUP_ANCHOR_ID");
    if (!anchorIdSet.has(anchorId)) {
      throw new Error(`UNRESOLVED_RUN_UNIT_ANCHOR_REFERENCE: ${anchorId}`);
    }
  }

  for (const anchor of complaintGroupAnchors) {
    if (String(anchor.matter_id || "").trim() !== matter_id) {
      throw new Error(`COMPLAINT_GROUP_ANCHOR_MATTER_ID_MISMATCH: ${anchor.complaint_group_anchor_id}`);
    }
  }

  if (String(determination_record.matter_id || "").trim() !== matter_id) {
    throw new Error("DETERMINATION_RECORD_MATTER_ID_MISMATCH");
  }

  const internal_timing_metadata = input.internal_timing_metadata;
  if (!internal_timing_metadata || typeof internal_timing_metadata !== "object" || Array.isArray(internal_timing_metadata)) {
    throw new Error("INTERNAL_TIMING_METADATA_OBJECT_REQUIRED");
  }

  return Object.freeze({
    matter_id,
    spec_version: SPEC_VERSION,
    scope_anchor_reference,
    intake_runs: runRecords.map((record) => record.run_id),
    run_units: runUnits.map((record) => record.run_unit_id),
    complaint_group_anchors: complaintGroupAnchors.map((record) => record.complaint_group_anchor_id),
    determination_record: assertNonEmptyString(determination_record.determination_template, "DETERMINATION_TEMPLATE"),
    internal_timing_metadata,
  });
}

module.exports = Object.freeze({
  createIntakeManifestRecord,
});
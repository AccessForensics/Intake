"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  SPEC_VERSION,
  CONTEXT_ID,
  getContextProfile,
} = require("../src/intake/context-profiles.js");

const { createIntakeManifestRecord } = require("../src/intake/intake-manifest.js");

test("locked context profiles match baseline and reflow values", () => {
  const desktop = getContextProfile(CONTEXT_ID.DESKTOP_BASELINE);
  const mobile = getContextProfile(CONTEXT_ID.MOBILE_BASELINE);
  const reflowPrimary = getContextProfile(CONTEXT_ID.REFLOW_PRIMARY);
  const reflowSupplemental = getContextProfile(CONTEXT_ID.REFLOW_SUPPLEMENTAL);

  assert.deepEqual(desktop, {
    context_id: "desktop_baseline",
    viewport_width: 1366,
    viewport_height: 900,
    orientation: "landscape",
    zoom: 100,
    device_scale_factor: 1,
    is_mobile: false,
    has_touch: false,
  });

  assert.deepEqual(mobile, {
    context_id: "mobile_baseline",
    viewport_width: 393,
    viewport_height: 852,
    orientation: "portrait",
    zoom: 100,
    device_scale_factor: 1,
    is_mobile: true,
    has_touch: true,
  });

  assert.equal(reflowPrimary.viewport_width, 320);
  assert.equal(reflowPrimary.viewport_height, null);
  assert.equal(reflowSupplemental.viewport_width, 1280);
  assert.equal(reflowSupplemental.zoom, 400);
});

test("manifest creation resolves run, run-unit, anchor, and determination references", () => {
  const manifest = createIntakeManifestRecord({
    matter_id: "AF-2026-0001",
    scope_anchor_reference: "Complaint PDF dated 2026-03-19, pp. 3-7",
    intake_runs: [
      {
        matter_id: "AF-2026-0001",
        run_id: "RUN-001",
        complaint_group_anchor_id: "CGA-001",
        run_unit_id: "RU-001",
      },
      {
        matter_id: "AF-2026-0001",
        run_id: "RUN-002",
        complaint_group_anchor_id: "CGA-001",
        run_unit_id: "RU-002",
      },
    ],
    run_units: [
      {
        matter_id: "AF-2026-0001",
        run_unit_id: "RU-001",
        complaint_group_anchor_id: "CGA-001",
      },
      {
        matter_id: "AF-2026-0001",
        run_unit_id: "RU-002",
        complaint_group_anchor_id: "CGA-001",
      },
      {
        matter_id: "AF-2026-0001",
        run_unit_id: "RU-003",
        complaint_group_anchor_id: "CGA-002",
      },
    ],
    complaint_group_anchors: [
      {
        matter_id: "AF-2026-0001",
        complaint_group_anchor_id: "CGA-001",
      },
      {
        matter_id: "AF-2026-0001",
        complaint_group_anchor_id: "CGA-002",
      },
    ],
    determination_record: {
      matter_id: "AF-2026-0001",
      determination_template: "DETERMINATION: ELIGIBLE FOR DESKTOP TECHNICAL RECORD BUILD",
    },
    internal_timing_metadata: {
      run_order: ["RUN-001", "RUN-002"],
      run_timings: {
        "RUN-001": { start: 1000, end: 2000 },
        "RUN-002": { start: 3000, end: 4000 },
      },
    },
  });

  assert.equal(manifest.spec_version, SPEC_VERSION);
  assert.deepEqual(manifest.intake_runs, ["RUN-001", "RUN-002"]);
  assert.deepEqual(manifest.run_units, ["RU-001", "RU-002", "RU-003"]);
  assert.deepEqual(manifest.complaint_group_anchors, ["CGA-001", "CGA-002"]);
  assert.equal(manifest.determination_record, "DETERMINATION: ELIGIBLE FOR DESKTOP TECHNICAL RECORD BUILD");
});

test("manifest rejects unresolved run-unit references", () => {
  assert.throws(
    () => createIntakeManifestRecord({
      matter_id: "AF-2026-0002",
      scope_anchor_reference: "Complaint PDF dated 2026-03-19, pp. 3-7",
      intake_runs: [
        {
          matter_id: "AF-2026-0002",
          run_id: "RUN-001",
          complaint_group_anchor_id: "CGA-001",
          run_unit_id: "RU-999",
        },
      ],
      run_units: [],
      complaint_group_anchors: [
        {
          matter_id: "AF-2026-0002",
          complaint_group_anchor_id: "CGA-001",
        },
      ],
      determination_record: {
        matter_id: "AF-2026-0002",
        determination_template: "DETERMINATION: NOT ELIGIBLE FOR FORENSIC EXECUTION",
      },
      internal_timing_metadata: {
        run_order: [],
      },
    }),
    /UNRESOLVED_RUN_UNIT_REFERENCE/
  );
});

test("manifest rejects unresolved determination matter mismatch", () => {
  assert.throws(
    () => createIntakeManifestRecord({
      matter_id: "AF-2026-0003",
      scope_anchor_reference: "Complaint PDF dated 2026-03-19, pp. 3-7",
      intake_runs: [],
      run_units: [],
      complaint_group_anchors: [],
      determination_record: {
        matter_id: "AF-OTHER",
        determination_template: "DETERMINATION: NOT ELIGIBLE FOR FORENSIC EXECUTION",
      },
      internal_timing_metadata: {
        run_order: [],
      },
    }),
    /DETERMINATION_RECORD_MATTER_ID_MISMATCH/
  );
});

test("manifest requires structured internal timing metadata", () => {
  assert.throws(
    () => createIntakeManifestRecord({
      matter_id: "AF-2026-0004",
      scope_anchor_reference: "Complaint PDF dated 2026-03-19, pp. 3-7",
      intake_runs: [],
      run_units: [],
      complaint_group_anchors: [],
      determination_record: {
        matter_id: "AF-2026-0004",
        determination_template: "DETERMINATION: NOT ELIGIBLE FOR FORENSIC EXECUTION",
      },
      internal_timing_metadata: "timing",
    }),
    /INTERNAL_TIMING_METADATA_OBJECT_REQUIRED/
  );
});
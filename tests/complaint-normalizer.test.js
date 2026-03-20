"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { normalizeComplaintAnchors } = require("../src/intake/complaint-normalizer.js");
const { buildRunUnitsFromAnchors } = require("../src/intake/rununit-builder.js");

test("normalizeComplaintAnchors normalizes paragraph and bullet anchors", () => {
  const anchors = normalizeComplaintAnchors([
    {
      anchorType: "pageparagraphrange",
      pageParagraphRange: "3:1-3",
      anchorText: "The website denies keyboard access.",
    },
    {
      anchorType: "pagebulletrange",
      pageBulletRange: "4:2-4",
      anchorText: "- Missing form labels",
    },
  ]);

  assert.equal(anchors.length, 2);
  assert.deepEqual(anchors[0], {
    complaintgroupanchorid: "CGA-001",
    anchortype: "pageparagraphrange",
    anchorreference: "3:1-3",
    anchortext: "The website denies keyboard access.",
  });

  assert.deepEqual(anchors[1], {
    complaintgroupanchorid: "CGA-002",
    anchortype: "pagebulletrange",
    anchorreference: "4:2-4",
    anchortext: "- Missing form labels",
  });
});

test("buildRunUnitsFromAnchors creates one RUNUNIT per semicolon-separated asserted condition", () => {
  const anchors = normalizeComplaintAnchors([
    {
      anchorType: "pageparagraphrange",
      pageParagraphRange: "5:1-2",
      anchorText: "Missing alt text; inaccessible form labels",
    },
  ]);

  const runUnits = buildRunUnitsFromAnchors(anchors, {
    desktopInScope: true,
    mobileInScope: true,
    createdContextBasis: "generic_accessibility_allegation",
  });

  assert.equal(runUnits.length, 2);

  assert.deepEqual(runUnits[0], {
    rununitid: "RU-001",
    complaintgroupanchorid: "CGA-001",
    assertedconditiontext: "Missing alt text",
    desktopinscope: true,
    mobileinscope: true,
    createdcontextbasis: "generic_accessibility_allegation",
  });

  assert.deepEqual(runUnits[1], {
    rununitid: "RU-002",
    complaintgroupanchorid: "CGA-001",
    assertedconditiontext: "inaccessible form labels",
    desktopinscope: true,
    mobileinscope: true,
    createdcontextbasis: "generic_accessibility_allegation",
  });
});

test("buildRunUnitsFromAnchors creates one RUNUNIT per bullet-line asserted condition", () => {
  const anchors = normalizeComplaintAnchors([
    {
      anchorType: "pagebulletrange",
      pageBulletRange: "7:1-3",
      anchorText: "- Missing skip link`n- Missing form labels`n- Focus indicator absent",
    },
  ]);

  const runUnits = buildRunUnitsFromAnchors(anchors, {
    desktopInScope: true,
    mobileInScope: false,
    createdContextBasis: "materials_cabined_desktop_only",
  });

  assert.equal(runUnits.length, 3);
  assert.equal(runUnits[0].assertedconditiontext, "Missing skip link");
  assert.equal(runUnits[1].assertedconditiontext, "Missing form labels");
  assert.equal(runUnits[2].assertedconditiontext, "Focus indicator absent");
  assert.equal(runUnits[0].mobileinscope, false);
  assert.equal(runUnits[0].createdcontextbasis, "materials_cabined_desktop_only");
});

test("buildRunUnitsFromAnchors rejects obvious blended asserted conditions that remain unsplit", () => {
  const anchors = normalizeComplaintAnchors([
    {
      anchorType: "pageparagraphrange",
      pageParagraphRange: "8:1-2",
      anchorText: "Missing alt text and inaccessible form labels",
    },
  ]);

  assert.throws(
    () => buildRunUnitsFromAnchors(anchors, {
      desktopInScope: true,
      mobileInScope: true,
      createdContextBasis: "generic_accessibility_allegation",
    }),
    /NON_ATOMIC_ASSERTED_CONDITION/
  );
});

test("normalizeComplaintAnchors rejects missing anchor reference", () => {
  assert.throws(
    () => normalizeComplaintAnchors([
      {
        anchorType: "pageparagraphrange",
        anchorText: "Missing alt text",
      },
    ]),
    /MISSING_PAGE_PARAGRAPH_RANGE/
  );
});
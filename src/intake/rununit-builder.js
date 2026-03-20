"use strict";

const CREATED_CONTEXT_BASIS = Object.freeze({
  GENERIC_ACCESSIBILITY_ALLEGATION: "generic_accessibility_allegation",
  MATERIALS_CABINED_DESKTOP_ONLY: "materials_cabined_desktop_only",
  MATERIALS_CABINED_MOBILE_ONLY: "materials_cabined_mobile_only",
  CONSTRAINED_PEER_BASELINE: "constrained_peer_baseline",
});

function toRunUnitId(index) {
  return `RU-${String(index).padStart(3, "0")}`;
}

function normalizeCreatedContextBasis(value) {
  const allowed = new Set(Object.values(CREATED_CONTEXT_BASIS));
  if (!allowed.has(value)) {
    throw new Error(`INVALID_CREATED_CONTEXT_BASIS: ${value}`);
  }
  return value;
}

function normalizeScope(scopeOptions) {
  if (!scopeOptions || typeof scopeOptions !== "object") {
    throw new Error("RUN_UNIT_SCOPE_OPTIONS_REQUIRED");
  }

  const desktopInScope = scopeOptions.desktopInScope === true;
  const mobileInScope = scopeOptions.mobileInScope === true;

  if (!desktopInScope && !mobileInScope) {
    throw new Error("RUN_UNIT_SCOPE_INVALID");
  }

  return {
    desktopinscope: desktopInScope,
    mobileinscope: mobileInScope,
    createdcontextbasis: normalizeCreatedContextBasis(scopeOptions.createdContextBasis),
  };
}

function normalizeAnchorType(value) {
  const safe = String(value || "").trim().toLowerCase();
  if (safe === "page_bullet_range" || safe === "pagebulletrange") {
    return "page_bullet_range";
  }
  if (safe === "page_paragraph_range" || safe === "pageparagraphrange") {
    return "page_paragraph_range";
  }
  throw new Error(`INVALID_COMPLAINT_GROUP_ANCHOR_TYPE: ${value}`);
}

function splitAssertedConditions(anchor) {
  const anchorType = normalizeAnchorType(anchor.anchortype);
  const rawText = String(anchor.anchortext || "").replace(/\r\n/g, "\n").trim();

  if (!rawText) {
    throw new Error("ASSERTED_CONDITION_TEXT_REQUIRED");
  }

  if (anchorType === "page_paragraph_range") {
    return [rawText];
  }

  const lines = rawText
    .split("\n")
    .map((line) => line.replace(/^\s*[-*•]+\s*/, "").trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    throw new Error("ASSERTED_CONDITION_TEXT_REQUIRED");
  }

  return lines;
}

function buildRunUnitsFromAnchors(anchorsInput, scopeOptions) {
  if (!Array.isArray(anchorsInput) || anchorsInput.length === 0) {
    throw new Error("COMPLAINT_GROUP_ANCHORS_REQUIRED");
  }

  const scope = normalizeScope(scopeOptions);
  const runUnits = [];
  let runUnitIndex = 1;

  for (const anchor of anchorsInput) {
    const complaintGroupAnchorId = String(anchor.complaintgroupanchorid || "").trim();
    if (!complaintGroupAnchorId) {
      throw new Error("COMPLAINT_GROUP_ANCHOR_ID_REQUIRED");
    }

    const assertedConditions = splitAssertedConditions(anchor);

    for (const assertedConditionText of assertedConditions) {
      runUnits.push({
        rununitid: toRunUnitId(runUnitIndex),
        complaintgroupanchorid: complaintGroupAnchorId,
        assertedconditiontext: assertedConditionText,
        desktopinscope: scope.desktopinscope,
        mobileinscope: scope.mobileinscope,
        createdcontextbasis: scope.createdcontextbasis,
      });
      runUnitIndex += 1;
    }
  }

  return runUnits;
}

module.exports = Object.freeze({
  CREATED_CONTEXT_BASIS,
  buildRunUnitsFromAnchors,
});
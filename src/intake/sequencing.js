"use strict";

const { CONTEXT_ID } = require("./run-record.js");

const MATTER_SCOPE = Object.freeze({
  DUAL: "dual",
  DESKTOP_ONLY: "desktop_only",
  MOBILE_ONLY: "mobile_only",
});

function assertMatterScope(value) {
  const safe = String(value || "").trim();
  if (!Object.values(MATTER_SCOPE).includes(safe)) {
    throw new Error(`INVALID_MATTER_SCOPE: ${value}`);
  }
  return safe;
}

function assertRunUnitsArray(runUnits) {
  if (!Array.isArray(runUnits)) {
    throw new Error("RUNUNITS_ARRAY_REQUIRED");
  }

  if (runUnits.length === 0) {
    throw new Error("RUNUNITS_ARRAY_MUST_NOT_BE_EMPTY");
  }
}

function validateRunUnitForScope(runUnit, matterScope) {
  const run_unit_id = String(runUnit.rununitid || runUnit.run_unit_id || "").trim();
  if (!run_unit_id) {
    throw new Error("RUN_UNIT_ID_REQUIRED_FOR_SEQUENCING");
  }

  const desktopInScope = runUnit.desktopinscope === true || runUnit.desktop_in_scope === true;
  const mobileInScope = runUnit.mobileinscope === true || runUnit.mobile_in_scope === true;

  if (!desktopInScope && !mobileInScope) {
    throw new Error(`RUNUNIT_HAS_NO_IN_SCOPE_BASELINE: ${run_unit_id}`);
  }

  if (matterScope === MATTER_SCOPE.DUAL) {
    if (!(desktopInScope && mobileInScope)) {
      throw new Error(`DUAL_SCOPE_RUNUNIT_MUST_HAVE_BOTH_BASELINES_IN_SCOPE: ${run_unit_id}`);
    }
  }

  if (matterScope === MATTER_SCOPE.DESKTOP_ONLY && mobileInScope) {
    throw new Error(`DESKTOP_ONLY_SCOPE_REJECTS_MOBILE_IN_SCOPE_RUNUNIT: ${run_unit_id}`);
  }

  if (matterScope === MATTER_SCOPE.MOBILE_ONLY && desktopInScope) {
    throw new Error(`MOBILE_ONLY_SCOPE_REJECTS_DESKTOP_IN_SCOPE_RUNUNIT: ${run_unit_id}`);
  }

  return run_unit_id;
}

function buildSequencingPlan(runUnits, matterScopeInput) {
  assertRunUnitsArray(runUnits);
  const matterScope = assertMatterScope(matterScopeInput);

  const sequence = [];

  if (matterScope === MATTER_SCOPE.DUAL) {
    for (const runUnit of runUnits) {
      const run_unit_id = validateRunUnitForScope(runUnit, matterScope);
      sequence.push(Object.freeze({ run_unit_id, context_id: CONTEXT_ID.DESKTOP_BASELINE }));
      sequence.push(Object.freeze({ run_unit_id, context_id: CONTEXT_ID.MOBILE_BASELINE }));
    }
    return sequence;
  }

  if (matterScope === MATTER_SCOPE.DESKTOP_ONLY) {
    for (const runUnit of runUnits) {
      const run_unit_id = validateRunUnitForScope(runUnit, matterScope);
      sequence.push(Object.freeze({ run_unit_id, context_id: CONTEXT_ID.DESKTOP_BASELINE }));
    }
    return sequence;
  }

  for (const runUnit of runUnits) {
    const run_unit_id = validateRunUnitForScope(runUnit, matterScope);
    sequence.push(Object.freeze({ run_unit_id, context_id: CONTEXT_ID.MOBILE_BASELINE }));
  }

  return sequence;
}

module.exports = Object.freeze({
  MATTER_SCOPE,
  buildSequencingPlan,
});
"use strict";

const {
  DETERMINATION_TEMPLATE,
} = require("./enums.js");

const {
  evaluateMatterProgress,
} = require("./sufficiency-stop.js");

const OUTCOME_LABEL = Object.freeze({
  OBSERVED: "Observed as asserted",
  NOT_OBSERVED: "Not observed as asserted",
  CONSTRAINED: "Constrained",
  INSUFFICIENT: "Insufficiently specified for bounded execution",
});

const MATTER_SCOPE = Object.freeze({
  DUAL: "dual",
  DESKTOP_ONLY: "desktop_only",
  MOBILE_ONLY: "mobile_only",
});

const CONSTRAINT_CLASS = Object.freeze({
  AUTHWALL: "AUTHWALL",
  BOTMITIGATION: "BOTMITIGATION",
  GEOBLOCK: "GEOBLOCK",
  HARDCRASH: "HARDCRASH",
  NAVIMPEDIMENT: "NAVIMPEDIMENT",
});

function assertMatterScope(value) {
  const safe = String(value || "").trim();
  if (!Object.values(MATTER_SCOPE).includes(safe)) {
    throw new Error(`INVALID_MATTER_SCOPE: ${value}`);
  }
  return safe;
}

function assertGeneratedFields(input) {
  const generated_at_local = String(input.generated_at_local || "").trim();
  if (!generated_at_local) {
    throw new Error("GENERATED_AT_LOCAL_REQUIRED");
  }

  const generated_at_epoch_ms = Number(input.generated_at_epoch_ms);
  if (!Number.isInteger(generated_at_epoch_ms) || generated_at_epoch_ms < 0) {
    throw new Error("GENERATED_AT_EPOCH_MS_NONNEGATIVE_INTEGER_REQUIRED");
  }

  return { generated_at_local, generated_at_epoch_ms };
}

function countQualifyingByContext(runRecords, contextId) {
  return runRecords.filter((record) => {
    const outcome = String(record.outcome_label || "").trim();
    const context = String(record.context_id || "").trim();
    return (
      context === contextId &&
      (outcome === OUTCOME_LABEL.OBSERVED || outcome === OUTCOME_LABEL.NOT_OBSERVED)
    );
  }).length;
}

function getConstrainedRunsByContext(runRecords, contextId) {
  return runRecords.filter((record) => {
    const outcome = String(record.outcome_label || "").trim();
    const context = String(record.context_id || "").trim();
    const constraintClass = String(record.constraint_class || "").trim();
    return (
      context === contextId &&
      outcome === OUTCOME_LABEL.CONSTRAINED &&
      Object.values(CONSTRAINT_CLASS).includes(constraintClass)
    );
  });
}

function firstMechanicalNote(records) {
  for (const record of records) {
    const note = String(record.mechanical_note || "").trim();
    if (note) {
      return note;
    }
  }
  return "";
}

function collectConstraintClasses(runRecords) {
  const values = new Set();

  for (const record of runRecords) {
    const outcome = String(record.outcome_label || "").trim();
    const constraintClass = String(record.constraint_class || "").trim();

    if (outcome === OUTCOME_LABEL.CONSTRAINED && constraintClass) {
      values.add(constraintClass);
    }
  }

  return values;
}

function createIntakeDeterminationRecord(input) {
  const matter_id = String(input.matter_id || "").trim();
  if (!matter_id) {
    throw new Error("MATTER_ID_REQUIRED");
  }

  const determination_template = String(input.determination_template || "").trim();
  if (!Object.values(DETERMINATION_TEMPLATE).includes(determination_template)) {
    throw new Error(`INVALID_DETERMINATION_TEMPLATE: ${determination_template}`);
  }

  const generated = assertGeneratedFields(input);
  const matter_level_note = String(input.matter_level_note || "").trim();

  const noteAllowed =
    determination_template === DETERMINATION_TEMPLATE.TEMPLATE_3 ||
    determination_template === DETERMINATION_TEMPLATE.TEMPLATE_5;

  if (!noteAllowed && matter_level_note) {
    throw new Error("MATTER_LEVEL_NOTE_NOT_ALLOWED_FOR_TEMPLATE");
  }

  if (noteAllowed && matter_level_note) {
    const sentenceCount = matter_level_note
      .split(/[.!?]+/)
      .map((part) => part.trim())
      .filter(Boolean).length;

    if (sentenceCount !== 1) {
      throw new Error("MATTER_LEVEL_NOTE_MUST_BE_ONE_SENTENCE");
    }
  }

  return Object.freeze({
    matter_id,
    determination_template,
    generated_at_local: generated.generated_at_local,
    generated_at_epoch_ms: generated.generated_at_epoch_ms,
    matter_level_note,
  });
}

function routeDetermination(input) {
  const matter_id = String(input.matter_id || "").trim();
  if (!matter_id) {
    throw new Error("MATTER_ID_REQUIRED");
  }

  const runRecords = Array.isArray(input.run_records) ? input.run_records : [];
  const matterScope = assertMatterScope(input.matter_scope);
  const generated = assertGeneratedFields(input);

  const progress = evaluateMatterProgress(runRecords);

  const desktopQualifying = countQualifyingByContext(runRecords, "desktop_baseline");
  const mobileQualifying = countQualifyingByContext(runRecords, "mobile_baseline");

  const desktopConstrainedRuns = getConstrainedRunsByContext(runRecords, "desktop_baseline");
  const mobileConstrainedRuns = getConstrainedRunsByContext(runRecords, "mobile_baseline");

  const desktopConstrained = desktopConstrainedRuns.length > 0;
  const mobileConstrained = mobileConstrainedRuns.length > 0;

  if (progress.sufficiency_reached) {
    if (matterScope === MATTER_SCOPE.DESKTOP_ONLY) {
      return createIntakeDeterminationRecord({
        matter_id,
        determination_template: DETERMINATION_TEMPLATE.TEMPLATE_2,
        generated_at_local: generated.generated_at_local,
        generated_at_epoch_ms: generated.generated_at_epoch_ms,
        matter_level_note: "",
      });
    }

    if (matterScope === MATTER_SCOPE.MOBILE_ONLY) {
      return createIntakeDeterminationRecord({
        matter_id,
        determination_template: DETERMINATION_TEMPLATE.TEMPLATE_4,
        generated_at_local: generated.generated_at_local,
        generated_at_epoch_ms: generated.generated_at_epoch_ms,
        matter_level_note: "",
      });
    }

    if (desktopQualifying > 0 && mobileConstrained && mobileQualifying === 0) {
      return createIntakeDeterminationRecord({
        matter_id,
        determination_template: DETERMINATION_TEMPLATE.TEMPLATE_3,
        generated_at_local: generated.generated_at_local,
        generated_at_epoch_ms: generated.generated_at_epoch_ms,
        matter_level_note: firstMechanicalNote(mobileConstrainedRuns),
      });
    }

    if (mobileQualifying > 0 && desktopConstrained && desktopQualifying === 0) {
      return createIntakeDeterminationRecord({
        matter_id,
        determination_template: DETERMINATION_TEMPLATE.TEMPLATE_5,
        generated_at_local: generated.generated_at_local,
        generated_at_epoch_ms: generated.generated_at_epoch_ms,
        matter_level_note: firstMechanicalNote(desktopConstrainedRuns),
      });
    }

    return createIntakeDeterminationRecord({
      matter_id,
      determination_template: DETERMINATION_TEMPLATE.TEMPLATE_1,
      generated_at_local: generated.generated_at_local,
      generated_at_epoch_ms: generated.generated_at_epoch_ms,
      matter_level_note: "",
    });
  }

  const constraintClasses = collectConstraintClasses(runRecords);

  if (constraintClasses.size === 0) {
    return createIntakeDeterminationRecord({
      matter_id,
      determination_template: DETERMINATION_TEMPLATE.TEMPLATE_6,
      generated_at_local: generated.generated_at_local,
      generated_at_epoch_ms: generated.generated_at_epoch_ms,
      matter_level_note: "",
    });
  }

  const hasBot = constraintClasses.has(CONSTRAINT_CLASS.BOTMITIGATION);
  const hasOther = [...constraintClasses].some((value) => value !== CONSTRAINT_CLASS.BOTMITIGATION);

  if (hasBot && hasOther) {
    throw new Error("MIXED_CONSTRAINT_INELIGIBILITY_BASIS_UNRESOLVED");
  }

  if (hasBot) {
    return createIntakeDeterminationRecord({
      matter_id,
      determination_template: DETERMINATION_TEMPLATE.TEMPLATE_7,
      generated_at_local: generated.generated_at_local,
      generated_at_epoch_ms: generated.generated_at_epoch_ms,
      matter_level_note: "",
    });
  }

  return createIntakeDeterminationRecord({
    matter_id,
    determination_template: DETERMINATION_TEMPLATE.TEMPLATE_8,
    generated_at_local: generated.generated_at_local,
    generated_at_epoch_ms: generated.generated_at_epoch_ms,
    matter_level_note: "",
  });
}

module.exports = Object.freeze({
  MATTER_SCOPE,
  createIntakeDeterminationRecord,
  routeDetermination,
});
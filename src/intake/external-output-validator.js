"use strict";

const { DETERMINATION_TEMPLATE, TEMPLATE_VALUES } = require("./enums.js");

const SPEC_VERSION = "L3-v8";

const EXACT_SCOPE_TERMS = Object.freeze([
  "complaint or demand materials provided",
  "specific website conditions asserted in those materials",
  "bounded execution parameters",
  "Replicated Desktop Browser Context",
  "Replicated Mobile Browser Context",
]);

const FORBIDDEN_LANGUAGE_TERMS = Object.freeze([
  "pass",
  "fail",
  "compliant",
  "non-compliant",
  "violation",
  "audit",
  "remediation",
  "certification",
  "guarantee",
]);

const INDIRECT_SIGNALING_EXACT_PHRASES = Object.freeze([
  "extensive testing",
  "limited testing",
  "we checked everything",
  "we checked only a few items",
]);

const HEDGING_TERMS = Object.freeze([
  "provisionally",
  "appears",
  "strongly",
  "weakly",
  "likely",
  "unlikely",
]);

function assertNonEmptyString(value, fieldName) {
  const safe = String(value || "").trim();
  if (!safe) {
    throw new Error(`${fieldName}_REQUIRED`);
  }
  return safe;
}

function getDeterminationLine(outputText) {
  const lines = String(outputText || "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.find((line) => line.startsWith("DETERMINATION:")) || "";
}

function assertLockedDeterminationTemplate(line) {
  if (!TEMPLATE_VALUES.includes(line)) {
    throw new Error(`INVALID_DETERMINATION_TEMPLATE_USED: ${line}`);
  }
  return line;
}

function getBodyWithoutDeterminationLine(outputText) {
  const lines = String(outputText || "")
    .replace(/\r\n/g, "\n")
    .split("\n");

  return lines
    .filter((line) => !String(line).trim().startsWith("DETERMINATION:"))
    .join("\n");
}

function containsCaseInsensitive(text, needle) {
  return String(text || "").toLowerCase().includes(String(needle || "").toLowerCase());
}

function hasForbiddenDisclosure(body) {
  const disclosurePatterns = [
    /\bnumber of runs\b/i,
    /\bconfirmations reached\b/i,
    /\bobserved\/not[- ]observed counts\b/i,
    /\bcap reached\b/i,
    /\bselected or attempted\b/i,
    /\bper-run sequencing\b/i,
    /\bper-run\b/i,
    /\bper-asserted-condition\b/i,
    /\bRUN-\d+/i,
  ];

  return disclosurePatterns.some((pattern) => pattern.test(body));
}

function hasForbiddenLanguage(body) {
  return FORBIDDEN_LANGUAGE_TERMS.some((term) => containsCaseInsensitive(body, term));
}

function hasIndirectSignalingExactPhrase(body) {
  return INDIRECT_SIGNALING_EXACT_PHRASES.some((phrase) => containsCaseInsensitive(body, phrase));
}

function requiresFunctionalEquivalentReview(body) {
  const riskPhrases = [
    "thorough review",
    "comprehensive review",
    "in-depth review",
    "broad review",
    "very limited review",
  ];

  return riskPhrases.some((phrase) => containsCaseInsensitive(body, phrase));
}

function requiresAntiHedgingReview(body) {
  return HEDGING_TERMS.some((term) => containsCaseInsensitive(body, term));
}

function bodyDescribesScopeOrContext(body) {
  const signals = [
    "complaint",
    "demand materials",
    "bounded execution",
    "Replicated Desktop Browser Context",
    "Replicated Mobile Browser Context",
    "Desktop Browser Context",
    "Mobile Browser Context",
    "scope",
    "context",
  ];

  return signals.some((signal) => containsCaseInsensitive(body, signal));
}

function mandatoryTermCheck(body) {
  if (!bodyDescribesScopeOrContext(body)) {
    return true;
  }

  return EXACT_SCOPE_TERMS.every((term) => body.includes(term));
}

function matterLevelContextDisclosureCheck(body) {
  const mentionsDesktop = containsCaseInsensitive(body, "Desktop Browser Context");
  const mentionsMobile = containsCaseInsensitive(body, "Mobile Browser Context");

  if (!mentionsDesktop && !mentionsMobile) {
    return true;
  }

  const exactDesktop = body.includes("Replicated Desktop Browser Context");
  const exactMobile = body.includes("Replicated Mobile Browser Context");

  const invalidParaphrase =
    containsCaseInsensitive(body, "defined desktop browser context") ||
    containsCaseInsensitive(body, "defined mobile browser context") ||
    containsCaseInsensitive(body, "desktop context only") ||
    containsCaseInsensitive(body, "mobile context only");

  return !invalidParaphrase && (!mentionsDesktop || exactDesktop) && (!mentionsMobile || exactMobile);
}

function perRunContextLeakageCheck(body) {
  const leakagePatterns = [
    /\brun sequence\b/i,
    /\bdesktop then mobile\b/i,
    /\bmobile then desktop\b/i,
    /\bper-run\b/i,
    /\bselected asserted conditions\b/i,
    /\bcontext assignment\b/i,
    /\bRUN-\d+/i,
  ];

  return !leakagePatterns.some((pattern) => pattern.test(body));
}

function matterLevelNoteComplianceCheck(determinationRecord) {
  const note = String(determinationRecord.matter_level_note || "").trim();
  if (!note) {
    return true;
  }

  const sentenceCount = note
    .split(/[.!?]+/)
    .map((part) => part.trim())
    .filter(Boolean).length;

  return sentenceCount === 1;
}

function createExternalOutputValidationRecord(input) {
  const matter_id = assertNonEmptyString(input.matter_id, "MATTER_ID");
  const spec_version = String(input.spec_version || SPEC_VERSION).trim();
  const determinationRecord = input.determination_record || {};
  const output_text = assertNonEmptyString(input.output_text, "OUTPUT_TEXT");

  const determinationLine = assertLockedDeterminationTemplate(getDeterminationLine(output_text));
  const body = getBodyWithoutDeterminationLine(output_text);

  const forbidden_disclosure_check_passed = !hasForbiddenDisclosure(body);
  const forbidden_language_check_passed = !hasForbiddenLanguage(body);
  const mandatory_term_check_passed = mandatoryTermCheck(body);
  const matter_level_context_disclosure_check_passed = matterLevelContextDisclosureCheck(body);
  const per_run_context_leakage_check_passed = perRunContextLeakageCheck(body);
  const indirect_signaling_check_passed = !hasIndirectSignalingExactPhrase(body);

  const functional_equivalent_review_flagged = requiresFunctionalEquivalentReview(body);
  const functional_equivalent_review_cleared = false;

  const anti_hedging_review_flagged = requiresAntiHedgingReview(body);
  const anti_hedging_review_cleared = false;

  const matter_level_note_compliance_check_passed = matterLevelNoteComplianceCheck(determinationRecord);

  return Object.freeze({
    matter_id,
    matter_level_note_compliance_check_passed,
    spec_version,
    determination_template_used: determinationLine,
    forbidden_disclosure_check_passed,
    forbidden_language_check_passed,
    mandatory_term_check_passed,
    matter_level_context_disclosure_check_passed,
    per_run_context_leakage_check_passed,
    indirect_signaling_check_passed,
    functional_equivalent_review_flagged,
    functional_equivalent_review_cleared,
    anti_hedging_review_flagged,
    anti_hedging_review_cleared,
  });
}

function assertExternalOutputMayBeReleased(validationRecord) {
  const automatedChecks = [
    validationRecord.matter_level_note_compliance_check_passed,
    validationRecord.forbidden_disclosure_check_passed,
    validationRecord.forbidden_language_check_passed,
    validationRecord.mandatory_term_check_passed,
    validationRecord.matter_level_context_disclosure_check_passed,
    validationRecord.per_run_context_leakage_check_passed,
    validationRecord.indirect_signaling_check_passed,
  ];

  if (!automatedChecks.every(Boolean)) {
    throw new Error("EXTERNAL_OUTPUT_VALIDATION_FAILED");
  }

  if (
    validationRecord.functional_equivalent_review_flagged &&
    validationRecord.functional_equivalent_review_cleared !== true
  ) {
    throw new Error("FUNCTIONAL_EQUIVALENT_REVIEW_CLEARANCE_REQUIRED");
  }

  if (
    validationRecord.anti_hedging_review_flagged &&
    validationRecord.anti_hedging_review_cleared !== true
  ) {
    throw new Error("ANTI_HEDGING_REVIEW_CLEARANCE_REQUIRED");
  }

  return true;
}

module.exports = Object.freeze({
  SPEC_VERSION,
  createExternalOutputValidationRecord,
  assertExternalOutputMayBeReleased,
});
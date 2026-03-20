"use strict";

function pad3(value) {
  return String(value).padStart(3, "0");
}

function normalizeCandidateText(text) {
  return String(text || "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[-*]\s+/, "").replace(/^\d+[.)]\s+/, ""))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitAnchorTextIntoCandidates(anchorText) {
  const raw = String(anchorText || "").replace(/\r\n/g, "\n");

  const linePieces = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const firstPass = [];
  for (const piece of linePieces) {
    const semicolonSplit = piece
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean);

    for (const part of semicolonSplit) {
      firstPass.push(part);
    }
  }

  return firstPass
    .map((part) => normalizeCandidateText(part))
    .filter(Boolean);
}

function assertAtomicCandidate(candidateText) {
  const obviousBlend = /;\s*|\s+\/\s+|\s+\band\b\s+/i;
  if (obviousBlend.test(candidateText)) {
    throw new Error(`NON_ATOMIC_ASSERTED_CONDITION: ${candidateText}`);
  }
}

function buildRunUnitsFromAnchors(anchors, options = {}) {
  if (!Array.isArray(anchors)) {
    throw new Error("NORMALIZED_ANCHORS_ARRAY_REQUIRED");
  }

  const desktopInScope = options.desktopInScope !== false;
  const mobileInScope = options.mobileInScope === true;
  const createdContextBasis = String(
    options.createdContextBasis || "generic_accessibility_allegation"
  ).trim();

  const runUnits = [];
  let counter = 0;

  for (const anchor of anchors) {
    const anchorId = String(anchor.complaintgroupanchorid || "").trim();
    const anchorText = String(anchor.anchortext || "").trim();

    if (!anchorId) {
      throw new Error("NORMALIZED_ANCHOR_MISSING_ID");
    }

    if (!anchorText) {
      throw new Error(`NORMALIZED_ANCHOR_MISSING_TEXT: ${anchorId}`);
    }

    const candidates = splitAnchorTextIntoCandidates(anchorText);
    if (candidates.length === 0) {
      throw new Error(`NO_ASSERTED_CONDITION_CANDIDATES: ${anchorId}`);
    }

    for (const candidate of candidates) {
      assertAtomicCandidate(candidate);
      counter += 1;

      runUnits.push(
        Object.freeze({
          rununitid: `RU-${pad3(counter)}`,
          complaintgroupanchorid: anchorId,
          assertedconditiontext: candidate,
          desktopinscope: desktopInScope,
          mobileinscope: mobileInScope,
          createdcontextbasis: createdContextBasis,
        })
      );
    }
  }

  return runUnits;
}

module.exports = Object.freeze({
  buildRunUnitsFromAnchors,
  splitAnchorTextIntoCandidates,
});
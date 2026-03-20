"use strict";

function pad3(value) {
  return String(value).padStart(3, "0");
}

function normalizeAnchorType(anchor) {
  const raw = String(anchor.anchorType || "").trim().toLowerCase();

  if (raw === "pageparagraphrange" || raw === "paragraph" || raw === "page_paragraph_range") {
    return "pageparagraphrange";
  }

  if (raw === "pagebulletrange" || raw === "bullet" || raw === "page_bullet_range") {
    return "pagebulletrange";
  }

  throw new Error(`INVALID_ANCHOR_TYPE: ${anchor.anchorType}`);
}

function resolveAnchorReference(anchor, normalizedType) {
  if (normalizedType === "pageparagraphrange") {
    const value = String(anchor.pageParagraphRange || anchor.anchorReference || "").trim();
    if (!value) {
      throw new Error("MISSING_PAGE_PARAGRAPH_RANGE");
    }
    return value;
  }

  const value = String(anchor.pageBulletRange || anchor.anchorReference || "").trim();
  if (!value) {
    throw new Error("MISSING_PAGE_BULLET_RANGE");
  }
  return value;
}

function normalizeAnchorText(value) {
  const text = String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/\u2022/g, "-")
    .trim();

  if (!text) {
    throw new Error("ANCHOR_TEXT_REQUIRED");
  }

  return text;
}

function normalizeComplaintAnchors(input) {
  if (!Array.isArray(input)) {
    throw new Error("COMPLAINT_ANCHORS_ARRAY_REQUIRED");
  }

  return input.map((anchor, index) => {
    const normalizedType = normalizeAnchorType(anchor);
    const anchorReference = resolveAnchorReference(anchor, normalizedType);
    const anchorText = normalizeAnchorText(anchor.anchorText);

    return Object.freeze({
      complaintgroupanchorid: `CGA-${pad3(index + 1)}`,
      anchortype: normalizedType,
      anchorreference: anchorReference,
      anchortext: anchorText,
    });
  });
}

module.exports = Object.freeze({
  normalizeComplaintAnchors,
});
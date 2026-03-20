"use strict";

const CONTEXT_ID = Object.freeze({
  DESKTOP_BASELINE: "desktop_baseline",
  MOBILE_BASELINE: "mobile_baseline",
  REFLOW_PRIMARY: "reflow_primary",
  REFLOW_SUPPLEMENTAL: "reflow_supplemental",
});

const SPEC_VERSION = "L3-v8";

const CONTEXT_PROFILES = Object.freeze({
  [CONTEXT_ID.DESKTOP_BASELINE]: Object.freeze({
    context_id: CONTEXT_ID.DESKTOP_BASELINE,
    viewport_width: 1366,
    viewport_height: 900,
    orientation: "landscape",
    zoom: 100,
    device_scale_factor: 1,
    is_mobile: false,
    has_touch: false,
  }),
  [CONTEXT_ID.MOBILE_BASELINE]: Object.freeze({
    context_id: CONTEXT_ID.MOBILE_BASELINE,
    viewport_width: 393,
    viewport_height: 852,
    orientation: "portrait",
    zoom: 100,
    device_scale_factor: 1,
    is_mobile: true,
    has_touch: true,
  }),
  [CONTEXT_ID.REFLOW_PRIMARY]: Object.freeze({
    context_id: CONTEXT_ID.REFLOW_PRIMARY,
    viewport_width: 320,
    viewport_height: null,
    orientation: "portrait",
    zoom: 100,
    device_scale_factor: 1,
    is_mobile: false,
    has_touch: false,
  }),
  [CONTEXT_ID.REFLOW_SUPPLEMENTAL]: Object.freeze({
    context_id: CONTEXT_ID.REFLOW_SUPPLEMENTAL,
    viewport_width: 1280,
    viewport_height: null,
    orientation: "landscape",
    zoom: 400,
    device_scale_factor: 1,
    is_mobile: false,
    has_touch: false,
  }),
});

function getContextProfile(contextId) {
  const safe = String(contextId || "").trim();
  const profile = CONTEXT_PROFILES[safe];
  if (!profile) {
    throw new Error(`INVALID_CONTEXT_PROFILE_ID: ${contextId}`);
  }
  return profile;
}

module.exports = Object.freeze({
  SPEC_VERSION,
  CONTEXT_ID,
  CONTEXT_PROFILES,
  getContextProfile,
});
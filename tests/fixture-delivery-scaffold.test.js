"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

function readJson(relativePath) {
  const target = path.join(process.cwd(), relativePath);
  return JSON.parse(fs.readFileSync(target, "utf8"));
}

test("fixture scaffold JSON exists and contains all 13 Appendix D fixtures", () => {
  const data = readJson("fixtures/intake/appendix-d-fixtures.json");
  assert.equal(data.spec_version, "L3-v8");
  assert.equal(Array.isArray(data.fixtures), true);
  assert.equal(data.fixtures.length, 13);
});

test("delivery scaffold files exist", () => {
  const requiredFiles = [
    "delivery_artifacts/intake/change_inventory.md",
    "delivery_artifacts/intake/implementation_inventory.md",
    "delivery_artifacts/intake/test_inventory.md",
    "delivery_artifacts/intake/fixture_inventory.md",
    "delivery_artifacts/intake/golden_artifact_verification.md",
    "delivery_artifacts/intake/traceability_matrix.csv",
    "delivery_artifacts/intake/pr_ready_summary.md",
    "delivery_artifacts/intake/limitations_appendix_f.md"
  ];

  for (const file of requiredFiles) {
    const target = path.join(process.cwd(), file);
    assert.equal(fs.existsSync(target), true, file);
  }
});

test("first eight Appendix D fixtures are implemented and the remaining fixtures stay scaffolded", () => {
  const data = readJson("fixtures/intake/appendix-d-fixtures.json");

  const implementedIds = data.fixtures
    .filter((fixture) => fixture.status === "implemented")
    .map((fixture) => fixture.fixture_id);

  assert.deepEqual(implementedIds, [
    "fixture_1_desktop_only_eligible",
    "fixture_2_desktop_and_mobile_eligible",
    "fixture_3_desktop_eligible_mobile_constrained",
    "fixture_4_mobile_only_eligible",
    "fixture_5_mobile_eligible_desktop_constrained",
    "fixture_6_not_eligible_generic",
    "fixture_7_not_eligible_botmitigation",
    "fixture_8_not_eligible_constraints_other"
  ]);

  const scaffoldedIds = data.fixtures
    .filter((fixture) => fixture.status === "not_implemented_yet")
    .map((fixture) => fixture.fixture_id);

  assert.equal(scaffoldedIds.length, 5);
});
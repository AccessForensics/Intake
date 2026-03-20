# Test Inventory

Status: evidence_snapshot_only

## Tests present

- tests/appendix-d-first-fixtures.test.js
- tests/appendix-d-ineligible-fixtures.test.js
- tests/appendix-d-negative-fixtures.test.js
- tests/appendix-d-second-fixtures.test.js
- tests/complaint-normalizer.test.js
- tests/context-profiles-manifest.test.js
- tests/determination-router.test.js
- tests/external-output-validator.test.js
- tests/fixture-delivery-scaffold.test.js
- tests/intake-template-validator.test.js
- tests/mechanical-note-isolation.test.js
- tests/run-record-sequencing.test.js
- tests/sufficiency-stop.test.js

## Evidence of passing results

- command: "node --test "tests/appendix-d-first-fixtures.test.js" "tests/appendix-d-ineligible-fixtures.test.js" "tests/appendix-d-negative-fixtures.test.js" "tests/appendix-d-second-fixtures.test.js" "tests/complaint-normalizer.test.js" "tests/context-profiles-manifest.test.js" "tests/determination-router.test.js" "tests/external-output-validator.test.js" "tests/fixture-delivery-scaffold.test.js" "tests/intake-template-validator.test.js" "tests/mechanical-note-isolation.test.js" "tests/run-record-sequencing.test.js" "tests/sufficiency-stop.test.js""
- evidence file: `delivery_artifacts/intake/evidence/node-test-output.txt`
- status: fail

## Named CI gates

- local_node_test_suite

## Gate status

- local_node_test_suite: fail
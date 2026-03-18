# AFDM Intake Clean Room

Internal use only.

This repository is a clean-room implementation target for **AF Sections 1 to 10 intake feasibility gating**.

Its purpose is narrow and locked:

- implement intake as a **bounded feasibility gate**
- determine whether a matter qualifies for full forensic execution under controlled browser contexts
- use only the **complaint or demand materials provided** as the scope anchor
- produce exactly one governed intake determination per matter
- enforce the locked machine rules, tests, fixtures, and validation surfaces required by the intake layer set

This repository is **not** a compliance audit tool, defect inventory, remediation guide, certification system, legal-opinion engine, or full-execution repo.

## Controlling Authority

This repo is governed only by the current intake authority set:

1. `1-10 Layer Instructions.pdf`
2. `1-10 Layer 1 - Authority and Doctrine.pdf`
3. `1-10 Layer 2 - Jules.pdf`
4. `1-10 Layer 3 - Machine-Bindable Specs.pdf`
5. `AFintaketemplates1-8.md`

No older intake doctrine, no stale template file, no legacy enum surface, and no prior intake implementation may override these sources.

If any conflict, ambiguity, or drift is found:
- do not invent fields, labels, procedures, or output forms
- do not patch conflicts by assumption
- surface the issue explicitly and fail closed where required

## What This Repo Must Build

This repo exists to implement the intake system defined by the controlling authority, including:

- complaint-group anchor normalization
- atomic run-unit creation
- scope and context assignment
- intake run records
- sequencing rules
- clean-state isolation
- sufficiency, stop, and cap rules
- intake determination resolution
- governed template rendering
- external output validation
- record schemas and validators
- required fixtures
- required tests
- delivery artifacts
- doctrine-to-code traceability
- Appendix F fail-closed limitation disclosures when needed

## Locked Intake Boundary

Intake outputs **eligibility only**.

External-facing intake output must not disclose or imply:
- number of runs performed
- number of confirmations reached
- observed or not observed counts
- cap-reached status
- selected asserted conditions
- per-run sequencing details
- per-run or per-condition context assignment

External-facing intake output must remain mechanically neutral.

Banned framing includes, but is not limited to:
- pass
- fail
- compliant
- non-compliant
- violation
- audit, as intake purpose
- remediation, as intake purpose
- certification
- guarantee
- blame posture
- adversarial posture

When external output describes scope and context, it must use the exact locked terms:
- `complaint or demand materials provided`
- `specific website conditions asserted in those materials`
- `bounded execution parameters`
- `Replicated Desktop Browser Context`
- `Replicated Mobile Browser Context`

## Locked Determination Templates

Each matter must resolve to exactly one of these eight templates, with no paraphrase, no alternate labels, and no added explanatory leakage:

1. `DETERMINATION: ELIGIBLE FOR DESKTOP AND MOBILE TECHNICAL RECORD BUILD`
2. `DETERMINATION: ELIGIBLE FOR DESKTOP TECHNICAL RECORD BUILD`
3. `DETERMINATION: ELIGIBLE FOR DESKTOP TECHNICAL RECORD BUILD / MOBILE BASELINE: CONSTRAINED`
4. `DETERMINATION: ELIGIBLE FOR MOBILE TECHNICAL RECORD BUILD`
5. `DETERMINATION: ELIGIBLE FOR MOBILE TECHNICAL RECORD BUILD / DESKTOP BASELINE: CONSTRAINED`
6. `DETERMINATION: NOT ELIGIBLE FOR FORENSIC EXECUTION`
7. `DETERMINATION: NOT ELIGIBLE FOR FORENSIC EXECUTION - CONSTRAINTS (BOTMITIGATION)`
8. `DETERMINATION: NOT ELIGIBLE FOR FORENSIC EXECUTION - CONSTRAINTS (OTHER)`

## Locked Operational Rules

The implementation must enforce, at minimum:

- maximum of 10 intake runs per matter
- one run equals one asserted condition under one context producing one locked outcome
- only qualifying confirmation outcomes count toward sufficiency
- immediate stop once sufficiency is reached
- alternating Desktop and Mobile sequencing when both baselines are in scope
- fresh isolated browser context for every run
- no storage persistence across runs
- no note on observed or not observed runs
- no blended run units
- no peer-baseline reduction unless a locked constraint path justifies it
- no external output release before external output validation passes

## Required Record Surfaces

Implementation must satisfy the locked record contracts for:

- `IntakeRunRecord`
- `ComplaintGroupAnchorRecord`
- `RunUnitRecord`
- `IntakeDeterminationRecord`
- `IntakeManifestRecord`
- `MechanicalNoteRuleRecord`
- `ContextProfileRecord`
- `SequencingRecord`
- `StateIsolationRecord`
- `ExternalOutputValidationRecord`

These are not optional documentation objects. They are build obligations.

## Required Fixtures

This repo is not complete without the required fixture matrix, including at minimum:

- Desktop-only eligible matter
- Desktop and Mobile eligible matter
- Desktop eligible with Mobile constrained
- Mobile-only eligible matter
- Mobile eligible with Desktop constrained
- Not eligible, generic
- Not eligible, botmitigation
- Not eligible, constraints other
- Note-gated constrained run
- Invalid note on observed run
- Non-alternating sequencing failure
- State persistence failure
- Indirect-signaling output failure

## Required Tests

This repo is not complete without the required test matrix, including at minimum:

- locked determination template enforcement
- mandatory term enforcement
- banned framing rejection
- nondisclosure enforcement
- schema validation for required records
- stop logic
- sufficiency logic
- sequencing validation
- clean-state isolation validation
- note-permission enforcement
- constraint validation
- external output validation behavior
- negative tests for prohibited leakage and invalid reductions

## Completion Standard

No one may claim this repo is complete unless all of the following are true:

- every locked rule is implemented, or explicitly disclosed in Appendix F format
- all required tests are present and passing
- all required fixtures are present and valid
- required delivery artifacts are present
- doctrine-to-code traceability is complete
- no unresolved `blocks_completion = true` limitation remains

Partial implementation, prose-only compliance, or implied behavior does not count as completion.

## Suggested Repository Layout

```text
docs/
  intake/
    1-10 Layer Instructions.pdf
    1-10 Layer 1 - Authority and Doctrine.pdf
    1-10 Layer 2 - Jules.pdf
    1-10 Layer 3 - Machine-Bindable Specs.pdf
    AFintaketemplates1-8.md

src/
  intake/

tests/
  intake/

fixtures/
  intake/

delivery_artifacts/
  intake/

  ## Status

Current status: scaffold / clean-room intake implementation target.

Nothing in this repository should be treated as production-complete until the locked completion standard above has been satisfied.

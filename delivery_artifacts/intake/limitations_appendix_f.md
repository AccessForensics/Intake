# Appendix F Limitations

## LIM-001
- limitation_id: LIM-001
- doctrine_section: Appendix E.6 and Appendix F
- requirement_summary: doctrine-to-code traceability matrix must have one row per locked requirement
- current_state: partially implemented
- why_not_enforced: current matrix is a seeded evidence matrix, not yet one row per locked requirement
- risk_if_unaddressed: completion claim would overstate coverage and traceability
- temporary_controls: seeded rows identify implemented areas and evidence locations
- tests_missing_or_partial: traceability completeness is not machine-enforced yet
- fixtures_missing_or_partial: none specific
- expected_failure_mode: delivery package remains incomplete for final completion claim
- blocks_completion: true
- planned_followup: expand matrix to one row per locked requirement

## LIM-002
- limitation_id: LIM-002
- doctrine_section: Appendix E.5
- requirement_summary: golden artifact verification must show named cases with expected state, validation result, and reference resolution result
- current_state: partially implemented
- why_not_enforced: current file is an evidence snapshot, not a fully curated golden verification report
- risk_if_unaddressed: final package would lack a complete minimum-case verification summary
- temporary_controls: implemented fixtures and local Node evidence file are referenced
- tests_missing_or_partial: golden verification summarization is not automated yet
- fixtures_missing_or_partial: none specific
- expected_failure_mode: delivery package remains incomplete for final completion claim
- blocks_completion: true
- planned_followup: populate per-case golden verification rows from implemented fixtures

## LIM-003
- limitation_id: LIM-003
- doctrine_section: Appendix E.1 to E.7
- requirement_summary: delivery package must be complete before completion may be claimed
- current_state: partially implemented
- why_not_enforced: this slice creates a package snapshot, not a final completion package
- risk_if_unaddressed: false completion signaling
- temporary_controls: PR-ready summary explicitly states no completion claim
- tests_missing_or_partial: none
- fixtures_missing_or_partial: none
- expected_failure_mode: completion claim blocked
- blocks_completion: true
- planned_followup: finish traceability, golden verification, and any remaining manual evidence fields
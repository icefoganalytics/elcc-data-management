# Plans

This directory contains implementation planning documents for the ELCC Data Management system.

## Available Plans

See this directory for available plans. Plans are created as needed for complex implementation work and follow the naming convention: `Type, Title, Date.md`.

## Using Plans

Plans are created when implementation requires analysis, multiple options, or cross-team decisions.

**Example:**
```
Create a plan for implementing hot meal feature and save it to agents/plans/
```

See parent [agents/README.md](../README.md) for general AI workflow documentation.

---

## Plan Structure

All plans follow this template:

```markdown
# Plan: [Descriptive Title]

## Problem Statement
[Clear description of the problem or opportunity]

## Current State Analysis
**Current Implementation:**
- [Bullet points about current state]

**[Related System] Pattern:**
- [Bullet points about patterns from other systems]

## Key Findings
1. [Finding 1 with code examples if relevant]
2. [Finding 2 with code examples if relevant]

## Recommended Solution(s)

### Option 1: [Solution Name] (Recommended)
**Rationale:** [Why this is the preferred approach]
**Implementation:**
- [Implementation steps]
**Benefits:**
- [List of benefits]

### Option 2: [Alternative Solution]
**Rationale:** [Alternative approach rationale]
**Implementation:**
- [Implementation steps]
**Benefits:**
- [List of benefits]

## Decision Factors
1. [Factor 1]
2. [Factor 2]

## Recommended Action
[Specific recommendation with next steps]

## Files to Review
1. `path/to/file1` - [What to check]
2. `path/to/file2` - [What to check]

---

## Files Changed
| File | Change |
|------|--------|
| `path/to/file1` | [Description of change] |

---

## Related Issues
- [Related ticket numbers or issues]
```

---

## File Naming Convention

**Format:** `Type, Title, Date.md`

**Components:**
- **Type:** Category of work (e.g., "Backend Refactoring", "Frontend Feature", "Infrastructure", "Plan")
- **Title:** Descriptive name of the plan
- **Date:** YYYY-MM-DD format

**Examples:**
- `Plan, Hot Meal Feature Implementation Approaches, 2026-04-15.md`
- `Backend Refactoring, Rails-like Model Scopes, 2025-12-22.md`
- `Frontend Feature, User Profile Enhancement, 2025-12-24.md`

**Rules:**
- Use commas to separate the three components
- No brackets or special characters in the actual filename
- Date must be in ISO format (YYYY-MM-DD)
- Type should be a clear category that helps organize plans
- "Plan" can be used as a valid Type when the work doesn't fit a more specific category

---

## Current Plans

Search this directory for available plans. Plans follow the naming convention: `Type, Title, Date.md`.

---

**Last Updated:** 2026-04-17

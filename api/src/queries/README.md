# Queries

This directory contains reusable raw SQL query builders.

Use a query module when:

- the SQL is substantial enough that keeping it inline would make a model, service, or controller harder to read
- the SQL is reused in more than one place, or is likely to be reused
- the SQL should be tested directly as its own unit

Keep queries focused:

- return a single SQL fragment or subquery
- keep the SQL readable and explicit
- prefer dedicated query files over overly generic helpers when the callers are still model-specific

Typical usage patterns:

- models consume query builders from scopes
- services or other queries consume them when composing larger SQL expressions

Tests should mirror source structure:

- `api/src/queries/funding-periods/build-active-periods-query.ts`
- `api/tests/queries/funding-periods/build-active-periods-query.test.ts`

If a SQL fragment is only used once and is still easy to read inline, it does not need to move here.

## Example Structure

```typescript
// api/src/queries/funding-periods/build-active-periods-query.ts
import { sql } from "@sequelize/core"

export function buildActivePeriodsQuery(currentDate: string) {
  return sql`
    SELECT id, name, startDate, endDate
    FROM funding_periods
    WHERE startDate <= ${currentDate}
      AND endDate >= ${currentDate}
      AND deletedAt IS NULL
    ORDER BY startDate DESC
  `
}
```

## Usage in Models

```typescript
// api/src/models/funding-submission.ts
import { buildActivePeriodsQuery } from "@/queries/funding-periods"

export class FundingSubmission extends BaseModel {
  static scopes = {
    activePeriod: {
      where: {
        id: {
          [Op.in]: sql`(${buildActivePeriodsQuery(new Date().toISOString().split('T')[0])})`
        }
      }
    }
  }
}
```

## Conventions

- Use sql template literals from @sequelize/core
- Parameterize all user input to prevent SQL injection
- Return SQL fragments that can be composed
- Include comprehensive tests for complex queries
- Use descriptive function names that indicate what the query does
- Keep queries focused on a single responsibility

import type { Knex } from "knex"
import knex from "knex"
import { isUndefined } from "lodash"

import { buildKnexConfig } from "@/db/db-migration-client"
import { up as createAdministrationCostCategories } from "@/db/migrations/20261020180000_create-administration-cost-categories-table"
import { up as createAdministrationCosts } from "@/db/migrations/20261020180001_create-administration-costs-table"

export async function withLegacyAdministrationSchema(
  scenario: (transaction: Knex.Transaction) => Promise<void>
): Promise<void> {
  const transactionClient = knex(buildKnexConfig())
  const rollback = new Error("Roll back historical Administration migration fixture schema")

  try {
    try {
      await transactionClient.transaction(async (transaction) => {
        await transaction.schema.dropTableIfExists("administration_costs")
        await transaction.schema.dropTableIfExists("administration_cost_categories")
        await createAdministrationCostCategories(transaction)
        await createAdministrationCosts(transaction)
        await scenario(transaction)
        await transaction.rollback(rollback)
      })
    } catch (error) {
      if (error !== rollback) {
        throw error
      }
    }
  } finally {
    await transactionClient.destroy()
  }
}

export const FISCAL_YEAR = "2147-2148"
export const LEGACY_FISCAL_YEAR = "2147/48"
export const APRIL_START = new Date("2147-04-01T00:00:00Z")
export const APRIL_END = new Date("2147-04-30T23:59:59Z")
export const FUNDING_PERIOD_END = new Date("2148-03-31T23:59:59Z")
export const ADMINISTRATION_SECTION_NAME = "Administration (10% of Spaces)"

type IdRow = { id: number }
type AdministrationValue = {
  submissionLineId: number
  sectionName: string
  lineName: string
  monthlyAmount: string
  estimatedChildOccupancyRate: string
  actualChildOccupancyRate: string
  estimatedComputedTotal?: string
  actualComputedTotal?: string
  childCareSpaceCategoryId?: number | null
}

export async function insertRow(
  transaction: Knex.Transaction,
  tableName: string,
  attributes: Record<string, unknown>
): Promise<number> {
  const [row] = await transaction(tableName).insert(attributes).returning<IdRow[]>("id")
  if (isUndefined(row)) {
    throw new Error(`Unable to insert fixture row into ${tableName}.`)
  }

  return row.id
}

export async function createCentre(transaction: Knex.Transaction): Promise<number> {
  const fundingRegionId = await insertRow(transaction, "funding_regions", {
    region: "Administration Migration Fixture",
    subsidy_rate: "0.5000",
  })
  return insertRow(transaction, "centres", {
    funding_region_id: fundingRegionId,
    name: "Administration Migration Fixture Centre",
    community: "Whitehorse",
    status: "Active",
    is_first_nation_program: false,
  })
}

export async function createFundingPeriod(transaction: Knex.Transaction): Promise<number> {
  return insertRow(transaction, "funding_periods", {
    fiscal_year: FISCAL_YEAR,
    from_date: APRIL_START,
    to_date: FUNDING_PERIOD_END,
    title: "Administration Migration Fixture Funding Period",
  })
}

export async function createAprilFiscalPeriod(
  transaction: Knex.Transaction,
  fundingPeriodId: number
): Promise<number> {
  return insertRow(transaction, "fiscal_periods", {
    funding_period_id: fundingPeriodId,
    fiscal_year: "2147-48",
    month: "April",
    date_start: APRIL_START,
    date_end: APRIL_END,
  })
}

export async function createChildCareSpaceCategory(
  transaction: Knex.Transaction,
  fundingPeriodId: number,
  categoryName: string
): Promise<number> {
  return insertRow(transaction, "child_care_space_categories", {
    funding_period_id: fundingPeriodId,
    category_name: categoryName,
    monthly_amount: "100.0000",
  })
}

export async function createFundingSubmissionLine(
  transaction: Knex.Transaction,
  attributes: {
    sectionName?: string
    fiscalYear?: string
    lineName?: string
    fromAge?: number | null
    toAge?: number | null
    monthlyAmount?: string
    childCareSpaceCategoryId?: number | null
    deletedAt?: Date | null
  } = {}
): Promise<number> {
  return insertRow(transaction, "funding_submission_lines", {
    fiscal_year: attributes.fiscalYear ?? LEGACY_FISCAL_YEAR,
    section_name: attributes.sectionName ?? ADMINISTRATION_SECTION_NAME,
    line_name: attributes.lineName ?? "Infants",
    from_age: attributes.fromAge ?? 0,
    to_age: attributes.toAge ?? 1,
    monthly_amount: attributes.monthlyAmount ?? "70.0000",
    child_care_space_category_id: attributes.childCareSpaceCategoryId ?? null,
    deleted_at: attributes.deletedAt ?? null,
  })
}

export async function createWorksheet(
  transaction: Knex.Transaction,
  centreId: number,
  values: string,
  fiscalYear = LEGACY_FISCAL_YEAR,
  monthName = "April"
): Promise<number> {
  return insertRow(transaction, "funding_submission_line_jsons", {
    centre_id: centreId,
    fiscal_year: fiscalYear,
    date_name: monthName,
    date_start: APRIL_START,
    date_end: APRIL_END,
    values,
  })
}

export function administrationValue(
  submissionLineId: number,
  overrides: Partial<AdministrationValue> = {}
): AdministrationValue {
  return {
    submissionLineId,
    sectionName: ADMINISTRATION_SECTION_NAME,
    lineName: "Infants",
    monthlyAmount: "12.5500",
    estimatedChildOccupancyRate: "0.4000",
    actualChildOccupancyRate: "0.2000",
    estimatedComputedTotal: "5.0200",
    actualComputedTotal: "2.5100",
    ...overrides,
  }
}

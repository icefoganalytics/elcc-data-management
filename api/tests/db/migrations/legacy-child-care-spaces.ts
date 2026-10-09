import Big from "big.js"
import knex, { type Knex } from "knex"

import { buildKnexConfig } from "@/db/db-migration-client"
import { up as createLegacyChildCareSpaces } from "@/db/migrations/20261007174312_create-child-care-spaces-table"

export type LegacyChildCareSpaceAttributes = {
  centreId: number
  fiscalPeriodId: number
  fundingSubmissionLineId: number
  lineName: string
  monthlyAmount: string
  estimatedChildOccupancyRate: string
  actualChildOccupancyRate: string
}

export type LegacyChildCareSpaceRow = LegacyChildCareSpaceAttributes & {
  id: number
  categoryId: number | null
  estimatedComputedTotal: string
  actualComputedTotal: string
}

export async function withLegacyChildCareSpaceSchema(
  scenario: (transaction: Knex.Transaction) => Promise<void>
): Promise<void> {
  const transactionClient = knex(buildKnexConfig())
  const rollback = new Error("Roll back historical migration fixture schema")

  try {
    try {
      await transactionClient.transaction(async (transaction) => {
        await transaction.schema.dropTable("child_care_spaces")
        await createLegacyChildCareSpaces(transaction)
        await transaction.schema.alterTable("child_care_space_categories", (table) => {
          table.integer("source_funding_submission_line_id").nullable()
        })
        await scenario(transaction)
        await transaction.rollback(rollback)
      })
    } catch (error) {
      if (error !== rollback) throw error
    }
  } finally {
    await transactionClient.destroy()
  }
}

export async function createLegacyChildCareSpace(
  transaction: Knex.Transaction,
  attributes: LegacyChildCareSpaceAttributes
): Promise<{ id: number }> {
  const estimatedComputedTotal = Big(attributes.monthlyAmount)
    .mul(attributes.estimatedChildOccupancyRate)
    .toFixed(4)
  const actualComputedTotal = Big(attributes.monthlyAmount)
    .mul(attributes.actualChildOccupancyRate)
    .toFixed(4)
  const [row] = await transaction("child_care_spaces")
    .insert({
      centre_id: attributes.centreId,
      fiscal_period_id: attributes.fiscalPeriodId,
      funding_submission_line_id: attributes.fundingSubmissionLineId,
      line_name: attributes.lineName,
      monthly_amount: attributes.monthlyAmount,
      estimated_child_occupancy_rate: attributes.estimatedChildOccupancyRate,
      actual_child_occupancy_rate: attributes.actualChildOccupancyRate,
      estimated_computed_total: estimatedComputedTotal,
      actual_computed_total: actualComputedTotal,
    })
    .returning<{ id: number }[]>("id")
  if (row === undefined) throw new Error("Historical ledger fixture was not inserted.")

  return { id: row.id }
}

export async function findLegacyChildCareSpaces(
  transaction: Knex.Transaction
): Promise<Omit<LegacyChildCareSpaceRow, "categoryId">[]> {
  const rows = await transaction("child_care_spaces")
    .select(
      "id",
      { centreId: "centre_id" },
      { fiscalPeriodId: "fiscal_period_id" },
      { fundingSubmissionLineId: "funding_submission_line_id" },
      { lineName: "line_name" },
      { monthlyAmount: "monthly_amount" },
      { estimatedChildOccupancyRate: "estimated_child_occupancy_rate" },
      { actualChildOccupancyRate: "actual_child_occupancy_rate" },
      { estimatedComputedTotal: "estimated_computed_total" },
      { actualComputedTotal: "actual_computed_total" }
    )
    .orderBy("funding_submission_line_id")
    .orderBy("id")
  return rows.map((row) => ({
    ...row,
    monthlyAmount: Big(row.monthlyAmount).toString(),
    estimatedChildOccupancyRate: Big(row.estimatedChildOccupancyRate).toString(),
    actualChildOccupancyRate: Big(row.actualChildOccupancyRate).toString(),
    estimatedComputedTotal: Big(row.estimatedComputedTotal).toString(),
    actualComputedTotal: Big(row.actualComputedTotal).toString(),
  }))
}

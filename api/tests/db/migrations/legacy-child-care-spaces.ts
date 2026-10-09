import { DataTypes, QueryTypes, sql } from "@sequelize/core"
import Big from "big.js"

import db from "@/models"
import { up as createLegacyChildCareSpaces } from "@/db/migrations/2026.10.07T17.43.12.create-child-care-spaces-table"
import { type Migration } from "@/db/umzug"

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

export async function withLegacyChildCareSpaceSchema(scenario: () => Promise<void>): Promise<void> {
  const rollback = new Error("Roll back historical migration fixture schema")
  const migration = { context: db.queryInterface } as Migration

  try {
    await db.transaction(async () => {
      await db.queryInterface.dropTable("child_care_spaces")
      await createLegacyChildCareSpaces(migration)
      await db.queryInterface.addColumn(
        "child_care_space_categories",
        "source_funding_submission_line_id",
        {
          type: DataTypes.INTEGER,
          allowNull: true,
        }
      )
      await scenario()
      throw rollback
    })
  } catch (error) {
    if (error !== rollback) throw error
  }
}

export async function createLegacyChildCareSpace(attributes: LegacyChildCareSpaceAttributes) {
  const estimatedComputedTotal = Big(attributes.monthlyAmount)
    .mul(attributes.estimatedChildOccupancyRate)
    .toFixed(4)
  const actualComputedTotal = Big(attributes.monthlyAmount)
    .mul(attributes.actualChildOccupancyRate)
    .toFixed(4)
  const [row] = await db.query<{ id: number }>(
    sql`
      DECLARE @inserted_child_care_spaces
      TABLE (id INTEGER);

      INSERT INTO
        child_care_spaces (
          centre_id,
          fiscal_period_id,
          funding_submission_line_id,
          line_name,
          monthly_amount,
          estimated_child_occupancy_rate,
          actual_child_occupancy_rate,
          estimated_computed_total,
          actual_computed_total
        ) OUTPUT INSERTED.id
      INTO
        @inserted_child_care_spaces
      VALUES
        (
          :centreId,
          :fiscalPeriodId,
          :fundingSubmissionLineId,
          :lineName,
          :monthlyAmount,
          :estimatedChildOccupancyRate,
          :actualChildOccupancyRate,
          :estimatedComputedTotal,
          :actualComputedTotal
        )
      SELECT
        id
      FROM
        @inserted_child_care_spaces;
    `,
    {
      type: QueryTypes.SELECT,
      replacements: { ...attributes, estimatedComputedTotal, actualComputedTotal },
    }
  )
  if (row === undefined) throw new Error("Historical ledger fixture was not inserted.")

  return row
}

export async function findLegacyChildCareSpaces(): Promise<
  Omit<LegacyChildCareSpaceRow, "categoryId">[]
> {
  const rows = await db.query<Omit<LegacyChildCareSpaceRow, "categoryId">>(
    sql`
      SELECT
        id,
        centre_id AS centreId,
        fiscal_period_id AS fiscalPeriodId,
        funding_submission_line_id AS fundingSubmissionLineId,
        line_name AS lineName,
        monthly_amount AS monthlyAmount,
        estimated_child_occupancy_rate AS estimatedChildOccupancyRate,
        actual_child_occupancy_rate AS actualChildOccupancyRate,
        estimated_computed_total AS estimatedComputedTotal,
        actual_computed_total AS actualComputedTotal
      FROM
        child_care_spaces
      ORDER BY
        funding_submission_line_id,
        id
    `,
    { type: QueryTypes.SELECT }
  )
  return rows.map((row) => ({
    ...row,
    monthlyAmount: Big(row.monthlyAmount).toString(),
    estimatedChildOccupancyRate: Big(row.estimatedChildOccupancyRate).toString(),
    actualChildOccupancyRate: Big(row.actualChildOccupancyRate).toString(),
    estimatedComputedTotal: Big(row.estimatedComputedTotal).toString(),
    actualComputedTotal: Big(row.actualComputedTotal).toString(),
  }))
}

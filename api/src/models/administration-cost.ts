import {
  DataTypes,
  Op,
  sql,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
  type NonAttribute,
} from "@sequelize/core"
import {
  Attribute,
  AutoIncrement,
  BeforeSave,
  BelongsTo,
  Default,
  NotNull,
  PrimaryKey,
  Table,
} from "@sequelize/core/decorators-legacy"
import Big from "big.js"

import { AdministrationCostsCentreIdFiscalPeriodIdCategoryIdUniqueIndex } from "@/models/indexes"

import BaseModel from "@/models/base-model"
import AdministrationCostCategory from "@/models/administration-cost-category"
import Centre from "@/models/centre"
import ChildCareSpaceCategory from "@/models/child-care-space-category"
import FiscalPeriod from "@/models/fiscal-period"

const ADMINISTRATION_COSTS_SECTION_NAME = "Administration (10% of Spaces)"

@Table({
  tableName: "administration_costs",
})
export class AdministrationCost extends BaseModel<
  InferAttributes<AdministrationCost>,
  InferCreationAttributes<AdministrationCost>
> {
  static readonly SECTION_NAME = ADMINISTRATION_COSTS_SECTION_NAME

  @Attribute(DataTypes.INTEGER)
  @PrimaryKey
  @AutoIncrement
  declare id: CreationOptional<number>

  @Attribute(DataTypes.INTEGER)
  @NotNull
  @AdministrationCostsCentreIdFiscalPeriodIdCategoryIdUniqueIndex
  declare centreId: number

  @Attribute(DataTypes.INTEGER)
  @NotNull
  @AdministrationCostsCentreIdFiscalPeriodIdCategoryIdUniqueIndex
  declare fiscalPeriodId: number

  @Attribute(DataTypes.INTEGER)
  @NotNull
  @AdministrationCostsCentreIdFiscalPeriodIdCategoryIdUniqueIndex
  declare categoryId: number

  @Attribute(DataTypes.INTEGER)
  declare childCareSpaceCategoryId: number | null

  @Attribute(DataTypes.STRING(200))
  @NotNull
  declare lineName: string

  /** Historical monthly rate in Canadian dollars (CAD), not cents. */
  @Attribute(DataTypes.DECIMAL(15, 4))
  @NotNull
  declare monthlyAmount: string

  @Attribute(DataTypes.DECIMAL(15, 4))
  @NotNull
  declare estimatedChildOccupancyRate: string

  @Attribute(DataTypes.DECIMAL(15, 4))
  @NotNull
  declare actualChildOccupancyRate: string

  /** Estimated monthly total in Canadian dollars (CAD), not cents. */
  @Attribute(DataTypes.DECIMAL(15, 4))
  @NotNull
  declare estimatedComputedTotal: string

  /** Actual monthly total in Canadian dollars (CAD), not cents. */
  @Attribute(DataTypes.DECIMAL(15, 4))
  @NotNull
  declare actualComputedTotal: string

  @Attribute(DataTypes.DATE)
  @NotNull
  @Default(sql.fn("getutcdate"))
  declare createdAt: CreationOptional<Date>

  @Attribute(DataTypes.DATE)
  @NotNull
  @Default(sql.fn("getutcdate"))
  declare updatedAt: CreationOptional<Date>

  @Attribute(DataTypes.DATE)
  declare deletedAt: Date | null

  // Hooks
  @BeforeSave
  static updateComputedTotals(administrationCost: AdministrationCost) {
    const monthlyAmount = new Big(administrationCost.monthlyAmount)
    const estimatedChildOccupancyRate = new Big(administrationCost.estimatedChildOccupancyRate)
    const actualChildOccupancyRate = new Big(administrationCost.actualChildOccupancyRate)
    if (
      !monthlyAmount.eq(monthlyAmount.toFixed(4)) ||
      !estimatedChildOccupancyRate.eq(estimatedChildOccupancyRate.toFixed(4)) ||
      !actualChildOccupancyRate.eq(actualChildOccupancyRate.toFixed(4))
    ) {
      throw new Error("Administration costs support at most four decimal places")
    }

    administrationCost.estimatedComputedTotal = monthlyAmount
      .mul(estimatedChildOccupancyRate)
      .toFixed(4)
    administrationCost.actualComputedTotal = monthlyAmount.mul(actualChildOccupancyRate).toFixed(4)
  }

  // Associations
  @BelongsTo(() => Centre, {
    foreignKey: "centreId",
    inverse: { as: "administrationCosts", type: "hasMany" },
  })
  declare centre?: NonAttribute<Centre>

  @BelongsTo(() => FiscalPeriod, {
    foreignKey: "fiscalPeriodId",
    inverse: { as: "administrationCosts", type: "hasMany" },
  })
  declare fiscalPeriod?: NonAttribute<FiscalPeriod>

  @BelongsTo(() => AdministrationCostCategory, {
    foreignKey: "categoryId",
    inverse: { as: "administrationCosts", type: "hasMany" },
  })
  declare category?: NonAttribute<AdministrationCostCategory>

  @BelongsTo(() => ChildCareSpaceCategory, {
    foreignKey: "childCareSpaceCategoryId",
  })
  declare childCareSpaceCategory?: NonAttribute<ChildCareSpaceCategory>

  // Scopes
  static establishScopes() {
    this.addScope("byFundingPeriod", (fundingPeriodId: number) => ({
      where: {
        fiscalPeriodId: {
          [Op.in]: sql`
            (
              SELECT
                id
              FROM
                fiscal_periods
              WHERE
                fiscal_periods.funding_period_id = ${fundingPeriodId}
                AND fiscal_periods.deleted_at IS NULL
            )
          `,
        },
      },
    }))

    this.addScope("byFiscalYear", (fiscalYear: string) => ({
      include: [
        {
          association: "fiscalPeriod",
          where: { fiscalYear },
        },
      ],
    }))
  }
}

export default AdministrationCost

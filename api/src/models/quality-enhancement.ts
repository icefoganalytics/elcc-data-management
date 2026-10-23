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

import QualityEnhancementsCentreIdFiscalPeriodIdCategoryIdUniqueIndex from "@/models/indexes/quality-enhancements-centre-id-fiscal-period-id-category-id-unique-index"

import BaseModel from "@/models/base-model"
import Centre from "@/models/centre"
import ChildCareSpaceCategory from "@/models/child-care-space-category"
import FiscalPeriod from "@/models/fiscal-period"
import QualityEnhancementCategory from "@/models/quality-enhancement-category"

const QUALITY_ENHANCEMENT_SECTION_NAME = "Quality Enhancement Program"

@Table({ tableName: "quality_enhancements" })
export class QualityEnhancement extends BaseModel<
  InferAttributes<QualityEnhancement>,
  InferCreationAttributes<QualityEnhancement>
> {
  static readonly SECTION_NAME = QUALITY_ENHANCEMENT_SECTION_NAME

  @Attribute(DataTypes.INTEGER)
  @PrimaryKey
  @AutoIncrement
  declare id: CreationOptional<number>

  @Attribute(DataTypes.INTEGER)
  @NotNull
  @QualityEnhancementsCentreIdFiscalPeriodIdCategoryIdUniqueIndex
  declare centreId: number

  @Attribute(DataTypes.INTEGER)
  @NotNull
  @QualityEnhancementsCentreIdFiscalPeriodIdCategoryIdUniqueIndex
  declare fiscalPeriodId: number

  @Attribute(DataTypes.INTEGER)
  @NotNull
  @QualityEnhancementsCentreIdFiscalPeriodIdCategoryIdUniqueIndex
  declare categoryId: number

  @Attribute(DataTypes.INTEGER)
  declare childCareSpaceCategoryId: number | null

  @Attribute(DataTypes.STRING(200))
  @NotNull
  declare lineName: string

  @Attribute(DataTypes.DECIMAL(15, 4))
  @NotNull
  declare baseMonthlyAmount: string

  @Attribute(DataTypes.DECIMAL(15, 4))
  @NotNull
  declare hotMealIncrementAmount: string

  @Attribute(DataTypes.DATE)
  declare hotMealAppliedAt: Date | null

  @Attribute(DataTypes.DECIMAL(15, 4))
  @NotNull
  declare monthlyAmount: string

  @Attribute(DataTypes.DECIMAL(15, 4))
  @NotNull
  declare estimatedChildOccupancyRate: string

  @Attribute(DataTypes.DECIMAL(15, 4))
  @NotNull
  declare actualChildOccupancyRate: string

  @Attribute(DataTypes.DECIMAL(15, 4))
  @NotNull
  declare estimatedComputedTotal: string

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

  @BeforeSave
  static updateAmountsAndComputedTotals(enhancement: QualityEnhancement) {
    const baseMonthlyAmount = checkedFourDecimals(
      new Big(enhancement.baseMonthlyAmount),
      "base monthly amount"
    )
    const hotMealIncrementAmount = checkedFourDecimals(
      new Big(enhancement.hotMealIncrementAmount),
      "hot meal increment amount"
    )
    const monthlyAmount = new Big(baseMonthlyAmount).plus(hotMealIncrementAmount)
    enhancement.monthlyAmount = checkedFourDecimals(monthlyAmount, "monthly amount")

    const estimatedRate = checkedFourDecimals(
      new Big(enhancement.estimatedChildOccupancyRate),
      "estimated occupancy rate"
    )
    const actualRate = checkedFourDecimals(
      new Big(enhancement.actualChildOccupancyRate),
      "actual occupancy rate"
    )
    enhancement.estimatedChildOccupancyRate = estimatedRate
    enhancement.actualChildOccupancyRate = actualRate
    enhancement.estimatedComputedTotal = monthlyAmount.mul(estimatedRate).toFixed(4)
    enhancement.actualComputedTotal = monthlyAmount.mul(actualRate).toFixed(4)
  }

  @BelongsTo(() => Centre, {
    foreignKey: "centreId",
    inverse: { as: "qualityEnhancements", type: "hasMany" },
  })
  declare centre?: NonAttribute<Centre>

  @BelongsTo(() => FiscalPeriod, {
    foreignKey: "fiscalPeriodId",
    inverse: { as: "qualityEnhancements", type: "hasMany" },
  })
  declare fiscalPeriod?: NonAttribute<FiscalPeriod>

  @BelongsTo(() => QualityEnhancementCategory, {
    foreignKey: "categoryId",
    inverse: { as: "qualityEnhancements", type: "hasMany" },
  })
  declare category?: NonAttribute<QualityEnhancementCategory>

  @BelongsTo(() => ChildCareSpaceCategory, { foreignKey: "childCareSpaceCategoryId" })
  declare childCareSpaceCategory?: NonAttribute<ChildCareSpaceCategory>

  static establishScopes() {
    this.addScope("byFundingPeriod", (fundingPeriodId: number) => ({
      where: {
        fiscalPeriodId: {
          [Op.in]: sql`(SELECT id FROM fiscal_periods WHERE funding_period_id = ${fundingPeriodId} AND deleted_at IS NULL)`,
        },
      },
    }))
    this.addScope("byFiscalYear", (fiscalYear: string) => ({
      include: [{ association: "fiscalPeriod", where: { fiscalYear } }],
    }))
  }
}

function checkedFourDecimals(value: Big, label: string): string {
  if (!value.eq(value.toFixed(4))) {
    throw new Error(`Quality Enhancement ${label} supports at most four decimal places`)
  }

  return value.toFixed(4)
}

export default QualityEnhancement

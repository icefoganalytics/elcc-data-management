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
  NotNull,
  PrimaryKey,
  Table,
} from "@sequelize/core/decorators-legacy"
import Big from "big.js"

import { DiverseNeedsCentreIdFiscalPeriodIdCategoryIdUniqueIndex } from "@/models/indexes"

import BaseModel from "@/models/base-model"
import Centre from "@/models/centre"
import DiverseNeedCategory from "@/models/diverse-need-category"
import FiscalPeriod from "@/models/fiscal-period"

@Table({ tableName: "diverse_needs" })
export class DiverseNeed extends BaseModel<
  InferAttributes<DiverseNeed>,
  InferCreationAttributes<DiverseNeed>
> {
  // Fields
  @Attribute(DataTypes.INTEGER)
  @PrimaryKey
  @AutoIncrement
  declare id: CreationOptional<number>

  @Attribute(DataTypes.INTEGER)
  @NotNull
  @DiverseNeedsCentreIdFiscalPeriodIdCategoryIdUniqueIndex
  declare centreId: number

  @Attribute(DataTypes.INTEGER)
  @NotNull
  @DiverseNeedsCentreIdFiscalPeriodIdCategoryIdUniqueIndex
  declare fiscalPeriodId: number

  @Attribute(DataTypes.INTEGER)
  @NotNull
  @DiverseNeedsCentreIdFiscalPeriodIdCategoryIdUniqueIndex
  declare categoryId: number

  @Attribute(DataTypes.STRING(200))
  @NotNull
  declare lineName: string

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
  declare createdAt: CreationOptional<Date>

  @Attribute(DataTypes.DATE)
  @NotNull
  declare updatedAt: CreationOptional<Date>

  @Attribute(DataTypes.DATE)
  declare deletedAt: Date | null

  // Hooks
  @BeforeSave
  static updateComputedTotals(need: DiverseNeed) {
    const amount = checkedFourDecimals(new Big(need.monthlyAmount), "monthly amount")
    const estimatedRate = checkedFourDecimals(
      new Big(need.estimatedChildOccupancyRate),
      "estimated occupancy rate"
    )
    const actualRate = checkedFourDecimals(
      new Big(need.actualChildOccupancyRate),
      "actual occupancy rate"
    )
    need.monthlyAmount = amount
    need.estimatedChildOccupancyRate = estimatedRate
    need.actualChildOccupancyRate = actualRate
    need.estimatedComputedTotal = new Big(amount).mul(estimatedRate).toFixed(4)
    need.actualComputedTotal = new Big(amount).mul(actualRate).toFixed(4)
  }

  // Associations
  @BelongsTo(() => Centre, {
    foreignKey: "centreId",
    inverse: { as: "diverseNeeds", type: "hasMany" },
  })
  declare centre?: NonAttribute<Centre>

  @BelongsTo(() => FiscalPeriod, {
    foreignKey: "fiscalPeriodId",
    inverse: { as: "diverseNeeds", type: "hasMany" },
  })
  declare fiscalPeriod?: NonAttribute<FiscalPeriod>

  @BelongsTo(() => DiverseNeedCategory, {
    foreignKey: "categoryId",
    inverse: { as: "diverseNeeds", type: "hasMany" },
  })
  declare category?: NonAttribute<DiverseNeedCategory>

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
                funding_period_id = ${fundingPeriodId}
                AND deleted_at IS NULL
            )
          `,
        },
      },
    }))
    this.addScope("byFiscalYear", (fiscalYear: string) => ({
      include: [{ association: "fiscalPeriod", where: { fiscalYear } }],
    }))
  }
}

function checkedFourDecimals(value: Big, label: string): string {
  if (!value.eq(value.toFixed(4)))
    throw new Error(`Diverse Need ${label} supports at most four decimal places`)
  return value.toFixed(4)
}

export default DiverseNeed

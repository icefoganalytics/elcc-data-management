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

import { ChildrenWithDiverseNeedsFundingRecordsCentreIdFiscalPeriodIdCategoryIdUniqueIndex } from "@/models/indexes"

import BaseModel from "@/models/base-model"
import Centre from "@/models/centre"
import ChildrenWithDiverseNeedsFundingCategory from "@/models/children-with-diverse-needs-funding-category"
import FiscalPeriod from "@/models/fiscal-period"

@Table({ tableName: "children_with_diverse_needs_funding_records" })
export class ChildrenWithDiverseNeedsFundingRecord extends BaseModel<
  InferAttributes<ChildrenWithDiverseNeedsFundingRecord>,
  InferCreationAttributes<ChildrenWithDiverseNeedsFundingRecord>
> {
  // Fields
  @Attribute(DataTypes.INTEGER)
  @PrimaryKey
  @AutoIncrement
  declare id: CreationOptional<number>

  @Attribute(DataTypes.INTEGER)
  @NotNull
  @ChildrenWithDiverseNeedsFundingRecordsCentreIdFiscalPeriodIdCategoryIdUniqueIndex
  declare centreId: number

  @Attribute(DataTypes.INTEGER)
  @NotNull
  @ChildrenWithDiverseNeedsFundingRecordsCentreIdFiscalPeriodIdCategoryIdUniqueIndex
  declare fiscalPeriodId: number

  @Attribute(DataTypes.INTEGER)
  @NotNull
  @ChildrenWithDiverseNeedsFundingRecordsCentreIdFiscalPeriodIdCategoryIdUniqueIndex
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
  static updateComputedTotals(need: ChildrenWithDiverseNeedsFundingRecord) {
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
    inverse: { as: "childrenWithDiverseNeedsFundingRecords", type: "hasMany" },
  })
  declare centre?: NonAttribute<Centre>

  @BelongsTo(() => FiscalPeriod, {
    foreignKey: "fiscalPeriodId",
    inverse: { as: "childrenWithDiverseNeedsFundingRecords", type: "hasMany" },
  })
  declare fiscalPeriod?: NonAttribute<FiscalPeriod>

  @BelongsTo(() => ChildrenWithDiverseNeedsFundingCategory, {
    foreignKey: "categoryId",
    inverse: { as: "childrenWithDiverseNeedsFundingRecords", type: "hasMany" },
  })
  declare category?: NonAttribute<ChildrenWithDiverseNeedsFundingCategory>

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

export default ChildrenWithDiverseNeedsFundingRecord

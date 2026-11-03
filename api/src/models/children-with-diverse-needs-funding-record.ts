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
  ValidateAttribute,
} from "@sequelize/core/decorators-legacy"
import Big from "big.js"

import { ChildrenWithDiverseNeedsFundingRecordCentreIdFiscalPeriodIdCategoryIdUniqueIndex } from "@/models/indexes"

import BaseModel from "@/models/base-model"
import Centre from "@/models/centre"
import ChildrenWithDiverseNeedsFundingCategory from "@/models/children-with-diverse-needs-funding-category"
import FiscalPeriod from "@/models/fiscal-period"

@Table({
  tableName: "children_with_diverse_needs_funding_records",
})
export class ChildrenWithDiverseNeedsFundingRecord extends BaseModel<
  InferAttributes<ChildrenWithDiverseNeedsFundingRecord>,
  InferCreationAttributes<ChildrenWithDiverseNeedsFundingRecord>
> {
  @Attribute(DataTypes.INTEGER)
  @PrimaryKey
  @AutoIncrement
  declare id: CreationOptional<number>

  @Attribute(DataTypes.INTEGER)
  @NotNull
  @ChildrenWithDiverseNeedsFundingRecordCentreIdFiscalPeriodIdCategoryIdUniqueIndex
  declare centreId: number

  @Attribute(DataTypes.INTEGER)
  @NotNull
  @ChildrenWithDiverseNeedsFundingRecordCentreIdFiscalPeriodIdCategoryIdUniqueIndex
  declare fiscalPeriodId: number

  @Attribute(DataTypes.INTEGER)
  @NotNull
  @ChildrenWithDiverseNeedsFundingRecordCentreIdFiscalPeriodIdCategoryIdUniqueIndex
  declare categoryId: number

  @Attribute(DataTypes.STRING(200))
  @NotNull
  declare lineName: string

  @Attribute(DataTypes.DECIMAL(15, 4))
  @NotNull
  @ValidateAttribute({
    supportsFourDecimalPlaces(value: string) {
      const amount = new Big(value)
      if (!amount.eq(amount.toFixed(4))) {
        throw new Error(
          "Children with Diverse Needs monthly amount supports at most four decimal places"
        )
      }
    },
  })
  declare monthlyAmount: string

  @Attribute(DataTypes.DECIMAL(15, 4))
  @NotNull
  @ValidateAttribute({
    supportsFourDecimalPlaces(value: string) {
      const rate = new Big(value)
      if (!rate.eq(rate.toFixed(4))) {
        throw new Error(
          "Children with Diverse Needs estimated occupancy rate supports at most four decimal places"
        )
      }
    },
  })
  declare estimatedChildOccupancyRate: string

  @Attribute(DataTypes.DECIMAL(15, 4))
  @NotNull
  @ValidateAttribute({
    supportsFourDecimalPlaces(value: string) {
      const rate = new Big(value)
      if (!rate.eq(rate.toFixed(4))) {
        throw new Error(
          "Children with Diverse Needs actual occupancy rate supports at most four decimal places"
        )
      }
    },
  })
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
    const amount = new Big(need.monthlyAmount)
    const estimatedRate = new Big(need.estimatedChildOccupancyRate)
    const actualRate = new Big(need.actualChildOccupancyRate)

    need.monthlyAmount = amount.toFixed(4)
    need.estimatedChildOccupancyRate = estimatedRate.toFixed(4)
    need.actualChildOccupancyRate = actualRate.toFixed(4)
    need.estimatedComputedTotal = amount.mul(estimatedRate).toFixed(4)
    need.actualComputedTotal = amount.mul(actualRate).toFixed(4)
  }

  // Associations
  @BelongsTo(() => Centre, {
    foreignKey: "centreId",
    inverse: {
      as: "childrenWithDiverseNeedsFundingRecords",
      type: "hasMany",
    },
  })
  declare centre?: NonAttribute<Centre>

  @BelongsTo(() => FiscalPeriod, {
    foreignKey: "fiscalPeriodId",
    inverse: {
      as: "childrenWithDiverseNeedsFundingRecords",
      type: "hasMany",
    },
  })
  declare fiscalPeriod?: NonAttribute<FiscalPeriod>

  @BelongsTo(() => ChildrenWithDiverseNeedsFundingCategory, {
    foreignKey: "categoryId",
    inverse: {
      as: "childrenWithDiverseNeedsFundingRecords",
      type: "hasMany",
    },
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
      include: [
        {
          association: "fiscalPeriod",
          where: {
            fiscalYear,
          },
        },
      ],
    }))
  }
}

export default ChildrenWithDiverseNeedsFundingRecord

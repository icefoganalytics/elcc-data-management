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

import { ChildCareSpacesCentreIdFiscalPeriodIdCategoryIdUniqueIndex } from "@/models/indexes"

import BaseModel from "@/models/base-model"
import ChildCareSpaceCategory from "@/models/child-care-space-category"
import Centre from "@/models/centre"
import FiscalPeriod from "@/models/fiscal-period"

const CHILD_CARE_SPACES_SECTION_NAME = "Child Care Spaces"

@Table({
  tableName: "child_care_spaces",
})
export class ChildCareSpace extends BaseModel<
  InferAttributes<ChildCareSpace>,
  InferCreationAttributes<ChildCareSpace>
> {
  static readonly SECTION_NAME = CHILD_CARE_SPACES_SECTION_NAME

  @Attribute(DataTypes.INTEGER)
  @PrimaryKey
  @AutoIncrement
  declare id: CreationOptional<number>

  @Attribute(DataTypes.INTEGER)
  @NotNull
  @ChildCareSpacesCentreIdFiscalPeriodIdCategoryIdUniqueIndex
  declare centreId: number

  @Attribute(DataTypes.INTEGER)
  @NotNull
  @ChildCareSpacesCentreIdFiscalPeriodIdCategoryIdUniqueIndex
  declare fiscalPeriodId: number

  @Attribute(DataTypes.INTEGER)
  @NotNull
  @ChildCareSpacesCentreIdFiscalPeriodIdCategoryIdUniqueIndex
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
  @Default(sql.fn("getutcdate"))
  declare createdAt: CreationOptional<Date>

  @Attribute(DataTypes.DATE)
  @NotNull
  @Default(sql.fn("getutcdate"))
  declare updatedAt: CreationOptional<Date>

  @Attribute(DataTypes.DATE)
  declare deletedAt: Date | null

  @BeforeSave
  static updateComputedTotals(childCareSpace: ChildCareSpace) {
    const monthlyAmount = new Big(childCareSpace.monthlyAmount)
    const estimatedChildOccupancyRate = new Big(childCareSpace.estimatedChildOccupancyRate)
    const actualChildOccupancyRate = new Big(childCareSpace.actualChildOccupancyRate)
    if (
      !estimatedChildOccupancyRate.eq(estimatedChildOccupancyRate.toFixed(4)) ||
      !actualChildOccupancyRate.eq(actualChildOccupancyRate.toFixed(4))
    ) {
      throw new Error("Child Care Spaces occupancy rates support at most four decimal places")
    }

    childCareSpace.estimatedComputedTotal = monthlyAmount
      .mul(estimatedChildOccupancyRate)
      .toFixed(4)
    childCareSpace.actualComputedTotal = monthlyAmount.mul(actualChildOccupancyRate).toFixed(4)
  }

  @BelongsTo(() => Centre, {
    foreignKey: "centreId",
    inverse: {
      as: "childCareSpaces",
      type: "hasMany",
    },
  })
  declare centre?: NonAttribute<Centre>

  @BelongsTo(() => FiscalPeriod, {
    foreignKey: "fiscalPeriodId",
    inverse: {
      as: "childCareSpaces",
      type: "hasMany",
    },
  })
  declare fiscalPeriod?: NonAttribute<FiscalPeriod>

  @BelongsTo(() => ChildCareSpaceCategory, {
    foreignKey: "categoryId",
    inverse: {
      as: "childCareSpaces",
      type: "hasMany",
    },
  })
  declare category?: NonAttribute<ChildCareSpaceCategory>

  static establishScopes() {
    this.addScope("byFundingPeriod", (fundingPeriodId: number) => {
      const fiscalPeriodIdsByFundingPeriodIdQuery = sql`
        (
          SELECT
            id
          FROM
            fiscal_periods
          WHERE
            fiscal_periods.funding_period_id = ${fundingPeriodId}
            AND fiscal_periods.deleted_at IS NULL
        )
      `
      return {
        where: {
          fiscalPeriodId: {
            [Op.in]: fiscalPeriodIdsByFundingPeriodIdQuery,
          },
        },
      }
    })

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

export default ChildCareSpace

import {
  DataTypes,
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

import { ChildCareSpacesCentreIdFiscalPeriodIdFundingSubmissionLineIdUniqueIndex } from "@/models/indexes"

import BaseModel from "@/models/base-model"
import Centre from "@/models/centre"
import FiscalPeriod from "@/models/fiscal-period"
import FundingSubmissionLine from "@/models/funding-submission-line"

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
  @ChildCareSpacesCentreIdFiscalPeriodIdFundingSubmissionLineIdUniqueIndex
  declare centreId: number

  @Attribute(DataTypes.INTEGER)
  @NotNull
  @ChildCareSpacesCentreIdFiscalPeriodIdFundingSubmissionLineIdUniqueIndex
  declare fiscalPeriodId: number

  @Attribute(DataTypes.INTEGER)
  @NotNull
  @ChildCareSpacesCentreIdFiscalPeriodIdFundingSubmissionLineIdUniqueIndex
  declare fundingSubmissionLineId: number

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

    childCareSpace.estimatedComputedTotal = monthlyAmount
      .mul(childCareSpace.estimatedChildOccupancyRate)
      .toFixed(4)
    childCareSpace.actualComputedTotal = monthlyAmount
      .mul(childCareSpace.actualChildOccupancyRate)
      .toFixed(4)
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

  @BelongsTo(() => FundingSubmissionLine, {
    foreignKey: "fundingSubmissionLineId",
    inverse: {
      as: "childCareSpaces",
      type: "hasMany",
    },
  })
  declare fundingSubmissionLine?: NonAttribute<FundingSubmissionLine>

  static establishScopes() {
    this.addScope("byFundingPeriod", (fundingPeriodId: number) => ({
      include: [
        {
          association: "fiscalPeriod",
          where: {
            fundingPeriodId,
          },
        },
      ],
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

export default ChildCareSpace

import {
  DataTypes,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
  type NonAttribute,
} from "@sequelize/core"
import {
  Attribute,
  AutoIncrement,
  BelongsTo,
  HasMany,
  NotNull,
  PrimaryKey,
  Table,
  ValidateAttribute,
} from "@sequelize/core/decorators-legacy"
import Big from "big.js"

import { ChildrenWithDiverseNeedsFundingCategoriesFundingPeriodIdCategoryNameUniqueIndex } from "@/models/indexes"

import BaseModel from "@/models/base-model"
import ChildrenWithDiverseNeedsFundingRecord from "@/models/children-with-diverse-needs-funding-record"
import FundingPeriod from "@/models/funding-period"

export const CHILDREN_WITH_DIVERSE_NEEDS_FUNDING_CATEGORY_DEFAULTS = Object.freeze([
  { categoryName: "Toddlers", fromAge: 2, toAge: 3, monthlyAmount: "54.9600" },
  { categoryName: "Preschool", fromAge: 4, toAge: 5, monthlyAmount: "91.6000" },
  { categoryName: "Kindergarten", fromAge: 5, toAge: 6, monthlyAmount: "91.6000" },
  { categoryName: "School Age", fromAge: 5, toAge: 6, monthlyAmount: "114.5000" },
])

@Table({
  tableName: "children_with_diverse_needs_funding_categories",
})
export class ChildrenWithDiverseNeedsFundingCategory extends BaseModel<
  InferAttributes<ChildrenWithDiverseNeedsFundingCategory>,
  InferCreationAttributes<ChildrenWithDiverseNeedsFundingCategory>
> {
  static readonly DEFAULTS = CHILDREN_WITH_DIVERSE_NEEDS_FUNDING_CATEGORY_DEFAULTS

  @Attribute(DataTypes.INTEGER)
  @PrimaryKey
  @AutoIncrement
  declare id: CreationOptional<number>

  @Attribute(DataTypes.INTEGER)
  @NotNull
  @ChildrenWithDiverseNeedsFundingCategoriesFundingPeriodIdCategoryNameUniqueIndex
  declare fundingPeriodId: number

  @Attribute(DataTypes.STRING(200))
  @NotNull
  @ChildrenWithDiverseNeedsFundingCategoriesFundingPeriodIdCategoryNameUniqueIndex
  declare categoryName: string

  @Attribute(DataTypes.INTEGER)
  declare fromAge: number | null

  @Attribute(DataTypes.INTEGER)
  declare toAge: number | null

  @Attribute(DataTypes.DECIMAL(15, 4))
  @NotNull
  @ValidateAttribute({
    supportsFourDecimalPlaces(value: string) {
      const monthlyAmount = Big(value)
      if (!monthlyAmount.eq(monthlyAmount.toFixed(4))) {
        throw new Error(
          "Children with Diverse Needs category monthly amounts support at most four decimal places"
        )
      }
    },
  })
  declare monthlyAmount: string

  @Attribute(DataTypes.DATE)
  @NotNull
  declare createdAt: CreationOptional<Date>

  @Attribute(DataTypes.DATE)
  @NotNull
  declare updatedAt: CreationOptional<Date>

  @Attribute(DataTypes.DATE)
  declare deletedAt: Date | null

  // Associations
  @BelongsTo(() => FundingPeriod, {
    foreignKey: "fundingPeriodId",
    inverse: {
      as: "childrenWithDiverseNeedsFundingCategories",
      type: "hasMany",
    },
  })
  declare fundingPeriod?: NonAttribute<FundingPeriod>

  @HasMany(() => ChildrenWithDiverseNeedsFundingRecord, {
    foreignKey: "categoryId",
    inverse: {
      as: "category",
    },
  })
  declare childrenWithChildrenWithDiverseNeedsFundingRecordsRecords?: NonAttribute<ChildrenWithDiverseNeedsFundingRecord[]>

  // Scopes
  static establishScopes() {
    this.addSearchScope(["categoryName"])
  }
}

export default ChildrenWithDiverseNeedsFundingCategory

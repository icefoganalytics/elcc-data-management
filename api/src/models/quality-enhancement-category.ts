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
  BelongsTo,
  Default,
  NotNull,
  PrimaryKey,
  ValidateAttribute,
} from "@sequelize/core/decorators-legacy"
import Big from "big.js"

import QualityEnhancementCategoriesFundingPeriodIdCategoryNameUniqueIndex from "@/models/indexes/quality-enhancement-categories-funding-period-id-category-name-unique-index"

import BaseModel from "@/models/base-model"
import ChildCareSpaceCategory from "@/models/child-care-space-category"
import FundingPeriod from "@/models/funding-period"

export const QUALITY_ENHANCEMENT_CATEGORY_DEFAULTS = Object.freeze([
  { categoryName: "Infants", fromAge: 0, toAge: 1, monthlyAmount: "206.1" },
  { categoryName: "Toddlers", fromAge: 2, toAge: 3, monthlyAmount: "154.58" },
  { categoryName: "Preschool", fromAge: 4, toAge: 5, monthlyAmount: "114.5" },
  { categoryName: "Kindergarten (PT)", fromAge: 5, toAge: 6, monthlyAmount: "114.5" },
  { categoryName: "Kindergarten (FT)", fromAge: 5, toAge: 6, monthlyAmount: "114.5" },
  { categoryName: "School Age (PT)", fromAge: 5, toAge: 6, monthlyAmount: "97.33" },
  { categoryName: "School Age (FT)", fromAge: 5, toAge: 6, monthlyAmount: "97.33" },
])

export class QualityEnhancementCategory extends BaseModel<
  InferAttributes<QualityEnhancementCategory>,
  InferCreationAttributes<QualityEnhancementCategory>
> {
  static readonly DEFAULTS = QUALITY_ENHANCEMENT_CATEGORY_DEFAULTS

  @Attribute(DataTypes.INTEGER)
  @PrimaryKey
  @AutoIncrement
  declare id: CreationOptional<number>

  @Attribute(DataTypes.INTEGER)
  @NotNull
  @QualityEnhancementCategoriesFundingPeriodIdCategoryNameUniqueIndex
  declare fundingPeriodId: number

  @Attribute(DataTypes.STRING(200))
  @NotNull
  @QualityEnhancementCategoriesFundingPeriodIdCategoryNameUniqueIndex
  declare categoryName: string

  @Attribute(DataTypes.INTEGER)
  declare fromAge: number | null

  @Attribute(DataTypes.INTEGER)
  declare toAge: number | null

  @Attribute(DataTypes.DECIMAL(15, 4))
  @NotNull
  @ValidateAttribute({
    supportsFourDecimalPlaces(value: string) {
      const amount = new Big(value)
      if (!amount.eq(amount.toFixed(4))) {
        throw new Error(
          "Quality Enhancement category monthly amounts support at most four decimal places"
        )
      }
    },
  })
  declare monthlyAmount: string

  @Attribute(DataTypes.INTEGER)
  declare childCareSpaceCategoryId: number | null

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

  @BelongsTo(() => FundingPeriod, {
    foreignKey: "fundingPeriodId",
    inverse: { as: "qualityEnhancementCategories", type: "hasMany" },
  })
  declare fundingPeriod?: NonAttribute<FundingPeriod>

  @BelongsTo(() => ChildCareSpaceCategory, { foreignKey: "childCareSpaceCategoryId" })
  declare childCareSpaceCategory?: NonAttribute<ChildCareSpaceCategory>

  static establishScopes() {
    this.addSearchScope(["categoryName"])
  }
}

export default QualityEnhancementCategory

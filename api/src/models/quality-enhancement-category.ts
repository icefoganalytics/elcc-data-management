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
  BelongsTo,
  Default,
  NotNull,
  PrimaryKey,
  ValidateAttribute,
  ModelValidator,
} from "@sequelize/core/decorators-legacy"
import Big from "big.js"
import arrayWrap from "@/utils/array-wrap"

import { QualityEnhancementCategoriesFundingPeriodIdChildCareCategoryIdUniqueIndex } from "@/models/indexes"

import BaseModel from "@/models/base-model"
import ChildCareCategory from "@/models/child-care-category"
import FundingPeriod from "@/models/funding-period"

export const QUALITY_ENHANCEMENT_CATEGORY_DEFAULTS = Object.freeze([
  { categoryName: "Infants", monthlyAmount: "206.1" },
  { categoryName: "Toddlers", monthlyAmount: "154.58" },
  { categoryName: "Preschool", monthlyAmount: "114.5" },
  { categoryName: "Kindergarten (PT)", monthlyAmount: "114.5" },
  { categoryName: "Kindergarten (FT)", monthlyAmount: "114.5" },
  { categoryName: "School Age (PT)", monthlyAmount: "97.33" },
  { categoryName: "School Age (FT)", monthlyAmount: "97.33" },
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
  @QualityEnhancementCategoriesFundingPeriodIdChildCareCategoryIdUniqueIndex
  declare fundingPeriodId: number

  @Attribute(DataTypes.INTEGER)
  @NotNull
  @QualityEnhancementCategoriesFundingPeriodIdChildCareCategoryIdUniqueIndex
  declare childCareCategoryId: number

  get categoryName(): NonAttribute<string> {
    if (!this.childCareCategory) throw new Error("Child Care category must be loaded")
    return this.childCareCategory.categoryName
  }

  get fromAge(): NonAttribute<number | null> {
    if (!this.childCareCategory) throw new Error("Child Care category must be loaded")
    return this.childCareCategory.fromAge
  }

  get toAge(): NonAttribute<number | null> {
    if (!this.childCareCategory) throw new Error("Child Care category must be loaded")
    return this.childCareCategory.toAge
  }

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

  @ModelValidator
  async validateSharedCategory(): Promise<void> {
    if (
      !this.isNewRecord &&
      (this.changed("childCareCategoryId") || this.changed("fundingPeriodId"))
    ) {
      throw new Error("Child Care category and funding period cannot be changed")
    }

    const childCareCategory = await ChildCareCategory.findOne({
      where: { id: this.childCareCategoryId, fundingPeriodId: this.fundingPeriodId },
      attributes: ["id"],
    })
    if (!childCareCategory) {
      throw new Error("Child Care category must be active in the same funding period")
    }
  }

  @BelongsTo(() => ChildCareCategory, { foreignKey: "childCareCategoryId" })
  declare childCareCategory?: NonAttribute<ChildCareCategory>

  static establishScopes() {
    this.addScope("defaultScope", { include: ["childCareCategory"] }, { override: true })
    this.addScope("search", (terms: string | string[]) => ({
      include: ["childCareCategory"],
      where: {
        [Op.and]: arrayWrap(terms)
          .filter((term) => term.length > 0)
          .map((term) =>
            sql.where(
              sql.fn("LOWER", sql.col("childCareCategory.category_name")),
              Op.like,
              `%${term.toLowerCase()}%`
            )
          ),
      },
    }))
  }
}

export default QualityEnhancementCategory

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
  HasMany,
  NotNull,
  PrimaryKey,
  ValidateAttribute,
  ModelValidator,
} from "@sequelize/core/decorators-legacy"
import Big from "big.js"
import arrayWrap from "@/utils/array-wrap"

import { ChildCareSpaceCategoriesFundingPeriodIdChildCareCategoryIdUniqueIndex } from "@/models/indexes"

import BaseModel from "@/models/base-model"
import ChildCareCategory from "@/models/child-care-category"
import ChildCareSpace from "@/models/child-care-space"
import FundingPeriod from "@/models/funding-period"
export const CHILD_CARE_SPACE_CATEGORY_DEFAULTS = Object.freeze([
  { categoryName: "Infants", monthlyAmount: "700.0" },
  { categoryName: "Toddlers", monthlyAmount: "700.0" },
  { categoryName: "Preschool", monthlyAmount: "700.0" },
  { categoryName: "Kindergarten (PT)", monthlyAmount: "350.0" },
  { categoryName: "Kindergarten (FT)", monthlyAmount: "700.0" },
  { categoryName: "School Age (PT)", monthlyAmount: "300.0" },
  { categoryName: "School Age (FT)", monthlyAmount: "500.0" },
])

export class ChildCareSpaceCategory extends BaseModel<
  InferAttributes<ChildCareSpaceCategory>,
  InferCreationAttributes<ChildCareSpaceCategory>
> {
  static readonly DEFAULTS = CHILD_CARE_SPACE_CATEGORY_DEFAULTS

  @Attribute(DataTypes.INTEGER)
  @PrimaryKey
  @AutoIncrement
  declare id: CreationOptional<number>

  @Attribute(DataTypes.INTEGER)
  @NotNull
  @ChildCareSpaceCategoriesFundingPeriodIdChildCareCategoryIdUniqueIndex
  declare fundingPeriodId: number

  @Attribute(DataTypes.INTEGER)
  @NotNull
  @ChildCareSpaceCategoriesFundingPeriodIdChildCareCategoryIdUniqueIndex
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
      const monthlyAmount = new Big(value)
      if (!monthlyAmount.eq(monthlyAmount.toFixed(4))) {
        throw new Error(
          "Child Care Space category monthly amounts support at most four decimal places"
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

  @BelongsTo(() => ChildCareCategory, { foreignKey: "childCareCategoryId" })
  declare childCareCategory?: NonAttribute<ChildCareCategory>

  @Attribute(DataTypes.DATE)
  declare deletedAt: Date | null

  @BelongsTo(() => FundingPeriod, {
    foreignKey: "fundingPeriodId",
    inverse: { as: "childCareSpaceCategories", type: "hasMany" },
  })
  declare fundingPeriod?: NonAttribute<FundingPeriod>

  @HasMany(() => ChildCareSpace, {
    foreignKey: "categoryId",
    inverse: { as: "category" },
  })
  declare childCareSpaces?: NonAttribute<ChildCareSpace[]>

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

export default ChildCareSpaceCategory

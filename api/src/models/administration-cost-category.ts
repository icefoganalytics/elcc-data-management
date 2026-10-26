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
  HasMany,
  ModelValidator,
  NotNull,
  PrimaryKey,
  Table,
  ValidateAttribute,
} from "@sequelize/core/decorators-legacy"
import Big from "big.js"
import { isNil } from "lodash"

import { AdministrationCostCategoriesFundingPeriodIdCategoryNameUniqueIndex } from "@/models/indexes"

import BaseModel from "@/models/base-model"
import AdministrationCost from "@/models/administration-cost"
import ChildCareSpaceCategory from "@/models/child-care-space-category"
import FundingPeriod from "@/models/funding-period"

export const ADMINISTRATION_COST_CATEGORY_DEFAULTS = Object.freeze([
  { categoryName: "Infants", fromAge: 0, toAge: 1, monthlyAmount: "70.0" },
  { categoryName: "Toddlers", fromAge: 2, toAge: 3, monthlyAmount: "70.0" },
  { categoryName: "Preschool", fromAge: 4, toAge: 5, monthlyAmount: "70.0" },
  { categoryName: "Kindergarten (PT)", fromAge: 5, toAge: 6, monthlyAmount: "35.0" },
  { categoryName: "Kindergarten (FT)", fromAge: 5, toAge: 6, monthlyAmount: "70.0" },
  { categoryName: "School Age (PT)", fromAge: 5, toAge: 6, monthlyAmount: "30.0" },
  { categoryName: "School Age (FT)", fromAge: 5, toAge: 6, monthlyAmount: "50.0" },
])

@Table({
  tableName: "administration_cost_categories",
})
export class AdministrationCostCategory extends BaseModel<
  InferAttributes<AdministrationCostCategory>,
  InferCreationAttributes<AdministrationCostCategory>
> {
  static readonly DEFAULTS = ADMINISTRATION_COST_CATEGORY_DEFAULTS

  @Attribute(DataTypes.INTEGER)
  @PrimaryKey
  @AutoIncrement
  declare id: CreationOptional<number>

  @Attribute(DataTypes.INTEGER)
  @NotNull
  @AdministrationCostCategoriesFundingPeriodIdCategoryNameUniqueIndex
  declare fundingPeriodId: number

  @Attribute(DataTypes.INTEGER)
  declare childCareSpaceCategoryId: number | null

  @Attribute(DataTypes.STRING(200))
  @NotNull
  @AdministrationCostCategoriesFundingPeriodIdCategoryNameUniqueIndex
  declare categoryName: string

  @Attribute(DataTypes.INTEGER)
  declare fromAge: number | null

  @Attribute(DataTypes.INTEGER)
  declare toAge: number | null

  @Attribute(DataTypes.DECIMAL(15, 4))
  @NotNull
  @ValidateAttribute({
    supportsFourDecimalPlaces(value: string) {
      const monthlyAmount = new Big(value)
      if (!monthlyAmount.eq(monthlyAmount.toFixed(4))) {
        throw new Error(
          "Administration cost category monthly amounts support at most four decimal places"
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

  // Validators
  @ModelValidator
  async validateChildCareSpaceCategory(): Promise<void> {
    if (isNil(this.childCareSpaceCategoryId)) return

    const childCareSpaceCategory = await ChildCareSpaceCategory.findOne({
      where: {
        id: this.childCareSpaceCategoryId,
        fundingPeriodId: this.fundingPeriodId,
      },
      attributes: ["id"],
    })
    if (isNil(childCareSpaceCategory)) {
      throw new Error("Linked Child Care Space category must be active in the same funding period")
    }
  }

  // Associations
  @BelongsTo(() => FundingPeriod, {
    foreignKey: "fundingPeriodId",
    inverse: { as: "administrationCostCategories", type: "hasMany" },
  })
  declare fundingPeriod?: NonAttribute<FundingPeriod>

  @BelongsTo(() => ChildCareSpaceCategory, {
    foreignKey: "childCareSpaceCategoryId",
  })
  declare childCareSpaceCategory?: NonAttribute<ChildCareSpaceCategory>

  @HasMany(() => AdministrationCost, {
    foreignKey: "categoryId",
    inverse: { as: "category" },
  })
  declare administrationCosts?: NonAttribute<AdministrationCost[]>

  // Scopes
  static establishScopes() {
    this.addSearchScope(["categoryName"])
  }
}

export default AdministrationCostCategory

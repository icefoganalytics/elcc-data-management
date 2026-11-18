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
  ModelValidator,
  NotNull,
  PrimaryKey,
} from "@sequelize/core/decorators-legacy"

import { ChildCareCategoriesFundingPeriodIdCategoryNameUniqueIndex } from "@/models/indexes"

import BaseModel from "@/models/base-model"
import FundingPeriod from "@/models/funding-period"

export const CHILD_CARE_CATEGORY_DEFAULTS = Object.freeze([
  { categoryName: "Infants", fromAge: 0, toAge: 18 },
  { categoryName: "Toddlers", fromAge: 19, toAge: 36 },
  { categoryName: "Preschool", fromAge: 4, toAge: 5 },
  { categoryName: "Kindergarten (PT)", fromAge: 5, toAge: 6 },
  { categoryName: "Kindergarten (FT)", fromAge: 5, toAge: 6 },
  { categoryName: "School Age (PT)", fromAge: 5, toAge: 6 },
  { categoryName: "School Age (FT)", fromAge: 5, toAge: 6 },
])

export class ChildCareCategory extends BaseModel<
  InferAttributes<ChildCareCategory>,
  InferCreationAttributes<ChildCareCategory>
> {
  static readonly DEFAULTS = CHILD_CARE_CATEGORY_DEFAULTS

  @Attribute(DataTypes.INTEGER)
  @PrimaryKey
  @AutoIncrement
  declare id: CreationOptional<number>

  @Attribute(DataTypes.INTEGER)
  @NotNull
  @ChildCareCategoriesFundingPeriodIdCategoryNameUniqueIndex
  declare fundingPeriodId: number

  @Attribute(DataTypes.STRING(200))
  @NotNull
  @ChildCareCategoriesFundingPeriodIdCategoryNameUniqueIndex
  declare categoryName: string

  @Attribute(DataTypes.INTEGER)
  declare fromAge: number | null

  @Attribute(DataTypes.INTEGER)
  declare toAge: number | null

  @Attribute(DataTypes.DATE)
  @NotNull
  declare createdAt: CreationOptional<Date>

  @Attribute(DataTypes.DATE)
  @NotNull
  declare updatedAt: CreationOptional<Date>

  @Attribute(DataTypes.DATE)
  declare deletedAt: Date | null

  @ModelValidator
  validateFundingPeriodIdentity(): void {
    if (!this.isNewRecord && this.changed("fundingPeriodId")) {
      throw new Error("Funding period cannot be changed")
    }
  }

  @BelongsTo(() => FundingPeriod, {
    foreignKey: "fundingPeriodId",
    inverse: { as: "childCareCategories", type: "hasMany" },
  })
  declare fundingPeriod?: NonAttribute<FundingPeriod>

  static establishScopes() {
    this.addSearchScope(["categoryName"])
  }
}

export default ChildCareCategory

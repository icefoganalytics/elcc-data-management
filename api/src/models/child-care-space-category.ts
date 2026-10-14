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
  NotNull,
  PrimaryKey,
} from "@sequelize/core/decorators-legacy"

import { ChildCareSpaceCategoriesFundingPeriodIdCategoryNameUniqueIndex } from "@/models/indexes"

import BaseModel from "@/models/base-model"
import ChildCareSpace from "@/models/child-care-space"
import FundingPeriod from "@/models/funding-period"
export const CHILD_CARE_SPACE_CATEGORY_DEFAULTS = Object.freeze([
  { categoryName: "Infants", fromAge: 0, toAge: 18, monthlyAmount: "700.0" },
  { categoryName: "Toddlers", fromAge: 19, toAge: 36, monthlyAmount: "700.0" },
  { categoryName: "Preschool", fromAge: 4, toAge: 5, monthlyAmount: "700.0" },
  { categoryName: "Kindergarten (PT)", fromAge: 5, toAge: 6, monthlyAmount: "350.0" },
  { categoryName: "Kindergarten (FT)", fromAge: 5, toAge: 6, monthlyAmount: "700.0" },
  { categoryName: "School Age (PT)", fromAge: 5, toAge: 6, monthlyAmount: "300.0" },
  { categoryName: "School Age (FT)", fromAge: 5, toAge: 6, monthlyAmount: "500.0" },
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
  @ChildCareSpaceCategoriesFundingPeriodIdCategoryNameUniqueIndex
  declare fundingPeriodId: number

  @Attribute(DataTypes.STRING(200))
  @NotNull
  @ChildCareSpaceCategoriesFundingPeriodIdCategoryNameUniqueIndex
  declare categoryName: string

  @Attribute(DataTypes.INTEGER)
  declare fromAge: number | null

  @Attribute(DataTypes.INTEGER)
  declare toAge: number | null

  @Attribute(DataTypes.DECIMAL(15, 4))
  @NotNull
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
    inverse: { as: "childCareSpaceCategories", type: "hasMany" },
  })
  declare fundingPeriod?: NonAttribute<FundingPeriod>

  @HasMany(() => ChildCareSpace, {
    foreignKey: "categoryId",
    inverse: { as: "category" },
  })
  declare childCareSpaces?: NonAttribute<ChildCareSpace[]>

  static establishScopes() {
    this.addSearchScope(["categoryName"])
  }
}

export default ChildCareSpaceCategory

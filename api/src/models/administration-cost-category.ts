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
  HasMany,
  NotNull,
  PrimaryKey,
  Table,
  ValidateAttribute,
  ModelValidator,
} from "@sequelize/core/decorators-legacy"
import Big from "big.js"
import arrayWrap from "@/utils/array-wrap"

import AdministrationCost from "@/models/administration-cost"
import { AdministrationCostCategoriesFundingPeriodIdChildCareCategoryIdUniqueIndex } from "@/models/indexes"

import BaseModel from "@/models/base-model"
import ChildCareCategory from "@/models/child-care-category"
import FundingPeriod from "@/models/funding-period"

export const ADMINISTRATION_COST_CATEGORY_DEFAULTS = Object.freeze([
  {
    categoryName: "Infants",
    monthlyAmount: "70.0",
  },
  {
    categoryName: "Toddlers",
    monthlyAmount: "70.0",
  },
  {
    categoryName: "Preschool",
    monthlyAmount: "70.0",
  },
  {
    categoryName: "Kindergarten (PT)",
    monthlyAmount: "35.0",
  },
  {
    categoryName: "Kindergarten (FT)",
    monthlyAmount: "70.0",
  },
  {
    categoryName: "School Age (PT)",
    monthlyAmount: "30.0",
  },
  {
    categoryName: "School Age (FT)",
    monthlyAmount: "50.0",
  },
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
  @AdministrationCostCategoriesFundingPeriodIdChildCareCategoryIdUniqueIndex
  declare fundingPeriodId: number

  @Attribute(DataTypes.INTEGER)
  @NotNull
  @AdministrationCostCategoriesFundingPeriodIdChildCareCategoryIdUniqueIndex
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

  /** Monthly category rate in Canadian dollars (CAD). */
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
      as: "administrationCostCategories",
      type: "hasMany",
    },
  })
  declare fundingPeriod?: NonAttribute<FundingPeriod>

  @HasMany(() => AdministrationCost, {
    foreignKey: "categoryId",
    inverse: {
      as: "category",
    },
  })
  declare administrationCosts?: NonAttribute<AdministrationCost[]>

  // Validators
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

export default AdministrationCostCategory

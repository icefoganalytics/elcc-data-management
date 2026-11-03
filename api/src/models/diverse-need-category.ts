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

import DiverseNeedCategoriesFundingPeriodIdCategoryNameUniqueIndex from "@/models/indexes/diverse-need-categories-funding-period-id-category-name-unique-index"
import DiverseNeed from "@/models/diverse-need"
import BaseModel from "@/models/base-model"
import FundingPeriod from "@/models/funding-period"

@Table({ tableName: "diverse_need_categories" })
export class DiverseNeedCategory extends BaseModel<
  InferAttributes<DiverseNeedCategory>,
  InferCreationAttributes<DiverseNeedCategory>
> {
  @Attribute(DataTypes.INTEGER)
  @PrimaryKey
  @AutoIncrement
  declare id: CreationOptional<number>

  @Attribute(DataTypes.INTEGER)
  @NotNull
  @DiverseNeedCategoriesFundingPeriodIdCategoryNameUniqueIndex
  declare fundingPeriodId: number

  @Attribute(DataTypes.STRING(200))
  @NotNull
  @DiverseNeedCategoriesFundingPeriodIdCategoryNameUniqueIndex
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
        throw new Error("Diverse Need category monthly amounts support at most four decimal places")
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

  @BelongsTo(() => FundingPeriod, {
    foreignKey: "fundingPeriodId",
    inverse: { as: "diverseNeedCategories", type: "hasMany" },
  })
  declare fundingPeriod?: NonAttribute<FundingPeriod>
  @HasMany(() => DiverseNeed, {
    foreignKey: "categoryId",
    inverse: { as: "category" },
  })
  declare diverseNeeds?: NonAttribute<DiverseNeed[]>

  static establishScopes() {
    this.addSearchScope(["categoryName"])
  }
}

export default DiverseNeedCategory

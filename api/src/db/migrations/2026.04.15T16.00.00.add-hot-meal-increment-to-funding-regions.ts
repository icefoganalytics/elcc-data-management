import { DataTypes } from "@sequelize/core"
import { type Migration } from "@/db/umzug"

export async function up({ context: queryInterface }: Migration) {
  await queryInterface.addColumn("funding_regions", "hot_meal_increment_amount", {
    type: DataTypes.DECIMAL(10, 4),
    allowNull: false,
    defaultValue: "0.0000",
  })
}

export async function down({ context: queryInterface }: Migration) {
  await queryInterface.removeColumn("funding_regions", "hot_meal_increment_amount")
}

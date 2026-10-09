import { DataTypes } from "@sequelize/core"

import { type Migration } from "@/db/umzug"
import { removeConstraint } from "@/db/utils/mssql-remove-constraint"

export async function up({ context: queryInterface }: Migration) {
  await queryInterface.addColumn("child_care_spaces", "category_id", {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { table: "child_care_space_categories", key: "id" },
  })
}

export async function down({ context: queryInterface }: Migration) {
  await removeConstraint(queryInterface, "child_care_spaces", {
    fields: ["category_id"],
    type: "FOREIGN KEY",
  })
  await queryInterface.removeColumn("child_care_spaces", "category_id")
}

import { DataTypes } from "@sequelize/core"

import { type Migration } from "@/db/umzug"
import { removeConstraint } from "@/db/utils/mssql-remove-constraint"

export async function up({ context: queryInterface }: Migration) {
  await queryInterface.changeColumn("child_care_spaces", "category_id", {
    type: DataTypes.INTEGER,
    allowNull: false,
  })
  await queryInterface.removeIndex(
    "child_care_spaces",
    "unique_child_care_spaces_on_centre_id_fiscal_period_id_funding_submission_line_id"
  )
  await removeConstraint(queryInterface, "child_care_spaces", {
    fields: ["funding_submission_line_id"],
    type: "FOREIGN KEY",
  })
  await queryInterface.removeColumn("child_care_spaces", "funding_submission_line_id")
  await queryInterface.addIndex(
    "child_care_spaces",
    ["centre_id", "fiscal_period_id", "category_id"],
    {
      name: "unique_child_care_spaces_on_centre_id_fiscal_period_id_category_id",
      unique: true,
      where: { deleted_at: null },
    }
  )
}

export async function down({ context: _context }: Migration) {
  throw new Error("Restoring legacy Child Care Spaces configuration requires the original data.")
}

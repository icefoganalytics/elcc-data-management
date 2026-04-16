import { DataTypes } from "@sequelize/core"

import { type Migration } from "@/db/umzug"
import { removeConstraint } from "@/db/utils/mssql-remove-constraint"

export async function up({ context: queryInterface }: Migration) {
  await queryInterface.sequelize.query(/* sql */ `
    UPDATE centres
    SET
      hot_meal = 0
    WHERE
      hot_meal IS NULL
  `)

  await queryInterface.changeColumn("centres", "hot_meal", {
    type: DataTypes.BOOLEAN,
    allowNull: false,
  })

  await queryInterface.addConstraint("centres", {
    type: "DEFAULT",
    fields: ["hot_meal"],
    defaultValue: false,
  })
}

export async function down({ context: queryInterface }: Migration) {
  await removeConstraint(queryInterface, "centres", {
    type: "DEFAULT",
    fields: ["hot_meal"],
  })

  await queryInterface.changeColumn("centres", "hot_meal", {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  })
}

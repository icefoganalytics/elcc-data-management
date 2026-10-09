import { DataTypes, sql } from "@sequelize/core"

import { type Migration } from "@/db/umzug"

export async function up({ context: queryInterface }: Migration) {
  await queryInterface.createTable("child_care_space_categories", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    funding_period_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { table: "funding_periods", key: "id" },
    },
    source_funding_submission_line_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    category_name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    from_age: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    to_age: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    monthly_amount: {
      type: DataTypes.DECIMAL(15, 4),
      allowNull: false,
    },
    created_at: {
      type: "datetime2",
      allowNull: false,
      defaultValue: sql.fn("getutcdate"),
    },
    updated_at: {
      type: "datetime2",
      allowNull: false,
      defaultValue: sql.fn("getutcdate"),
    },
    deleted_at: {
      type: "datetime2",
      allowNull: true,
    },
  })

  await queryInterface.addIndex(
    "child_care_space_categories",
    ["funding_period_id", "category_name"],
    {
      name: "unique_child_care_space_categories_on_funding_period_id_category_name",
      unique: true,
      where: { deleted_at: null },
    }
  )
}

export async function down({ context: queryInterface }: Migration) {
  await queryInterface.dropTable("child_care_space_categories")
}

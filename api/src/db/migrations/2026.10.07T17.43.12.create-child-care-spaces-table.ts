import { DataTypes, sql } from "@sequelize/core"

import { type Migration } from "@/db/umzug"

export async function up({ context: queryInterface }: Migration) {
  await queryInterface.createTable("child_care_spaces", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    centre_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        table: "centres",
        key: "id",
      },
    },
    fiscal_period_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        table: "fiscal_periods",
        key: "id",
      },
    },
    funding_submission_line_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        table: "funding_submission_lines",
        key: "id",
      },
    },
    line_name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    monthly_amount: {
      type: DataTypes.DECIMAL(15, 4),
      allowNull: false,
    },
    estimated_child_occupancy_rate: {
      type: DataTypes.DECIMAL(15, 4),
      allowNull: false,
    },
    actual_child_occupancy_rate: {
      type: DataTypes.DECIMAL(15, 4),
      allowNull: false,
    },
    estimated_computed_total: {
      type: DataTypes.DECIMAL(15, 4),
      allowNull: false,
    },
    actual_computed_total: {
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
    "child_care_spaces",
    ["centre_id", "fiscal_period_id", "funding_submission_line_id"],
    {
      name: "unique_child_care_spaces_on_centre_id_fiscal_period_id_funding_submission_line_id",
      unique: true,
      where: {
        deleted_at: null,
      },
    }
  )
}

export async function down({ context: queryInterface }: Migration) {
  await queryInterface.dropTable("child_care_spaces")
}

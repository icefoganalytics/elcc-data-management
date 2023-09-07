import { DataTypes } from "sequelize"

import type { Migration } from "@/db/umzug"
import { MssqlDataTypes } from "@/db/mssql-data-types"

export const up: Migration = async ({ context: queryInterface }) => {
  await queryInterface.createTable("funding_period", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    fiscal_year: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    from_date: {
      type: MssqlDataTypes.DATETIME2(0),
      allowNull: false,
    },
    to_date: {
      type: MssqlDataTypes.DATETIME2(0),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    is_fiscal_year: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    is_school_month: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  })

  await queryInterface.createTable("centre_funding_period", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    centreId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "centres",
        key: "id",
      },
    },
    fiscalPeriodId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  })

  await queryInterface.createTable("funding_submission_line", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    fiscal_year: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    section_name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    line_name: {
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
      type: DataTypes.FLOAT,
      allowNull: false,
    },
  })

  await queryInterface.createTable("funding_submission_line_value", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    centre_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "centres",
        key: "id",
      },
    },
    submission_line_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "funding_submission_line",
        key: "id",
      },
    },
    fiscal_year: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    section_name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    line_name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    monthly_amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    date_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    date_start: {
      type: MssqlDataTypes.DATETIME2(0),
      allowNull: false,
    },
    date_end: {
      type: MssqlDataTypes.DATETIME2(0),
      allowNull: false,
    },
    child_count: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    computed_total: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    is_actual: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  })
}

export const down: Migration = async ({ context: queryInterface }) => {
  await queryInterface.dropTable("funding_submission_line_value")
  await queryInterface.dropTable("funding_submission_line")
  await queryInterface.dropTable("centre_funding_period")
  await queryInterface.dropTable("funding_period")
}

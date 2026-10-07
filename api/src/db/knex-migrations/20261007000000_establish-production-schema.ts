import type { Knex } from "knex"

const finalLegacyMigrationNames = [
  "2026.04.16T16.00.00.make-hot-meal-not-nullable.ts",
  "2026.04.16T16.00.00.make-hot-meal-not-nullable.js",
]

type ColumnDefinition = {
  name: string
  type: string
  nullable: boolean
  identity: boolean
  defaultValue: string | null
}

type TableDefinition = {
  name: string
  columns: ColumnDefinition[]
}

type UniqueIndex = {
  name: string
  table: string
  columns: string[]
}

type ForeignKey = {
  name: string
  table: string
  columns: string[]
  referencedTable: string
  referencedColumns: string[]
  onDelete: string
  onUpdate: string
}

const productionSchema: TableDefinition[] = [
  {
    "name": "funding_periods",
    "columns": [
      {
        "name": "id",
        "type": "int",
        "nullable": false,
        "identity": true,
        "defaultValue": null
      },
      {
        "name": "fiscal_year",
        "type": "nvarchar(10) COLLATE SQL_Latin1_General_CP1_CI_AS",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "from_date",
        "type": "datetime2(0)",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "to_date",
        "type": "datetime2(0)",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "title",
        "type": "nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "created_at",
        "type": "datetime2",
        "nullable": false,
        "identity": false,
        "defaultValue": "getutcdate()"
      },
      {
        "name": "updated_at",
        "type": "datetime2",
        "nullable": false,
        "identity": false,
        "defaultValue": "getutcdate()"
      },
      {
        "name": "deleted_at",
        "type": "datetimeoffset",
        "nullable": true,
        "identity": false,
        "defaultValue": null
      }
    ]
  },
  {
    "name": "funding_regions",
    "columns": [
      {
        "name": "id",
        "type": "int",
        "nullable": false,
        "identity": true,
        "defaultValue": null
      },
      {
        "name": "region",
        "type": "nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "subsidy_rate",
        "type": "decimal(5, 4)",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "created_at",
        "type": "datetime2",
        "nullable": false,
        "identity": false,
        "defaultValue": "getutcdate()"
      },
      {
        "name": "updated_at",
        "type": "datetime2",
        "nullable": false,
        "identity": false,
        "defaultValue": "getutcdate()"
      },
      {
        "name": "deleted_at",
        "type": "datetime2",
        "nullable": true,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "hot_meal_increment_amount",
        "type": "decimal(10, 4)",
        "nullable": false,
        "identity": false,
        "defaultValue": "0.0000"
      }
    ]
  },
  {
    "name": "funding_submission_lines",
    "columns": [
      {
        "name": "id",
        "type": "int",
        "nullable": false,
        "identity": true,
        "defaultValue": null
      },
      {
        "name": "fiscal_year",
        "type": "nvarchar(10) COLLATE SQL_Latin1_General_CP1_CI_AS",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "section_name",
        "type": "nvarchar(200) COLLATE SQL_Latin1_General_CP1_CI_AS",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "line_name",
        "type": "nvarchar(200) COLLATE SQL_Latin1_General_CP1_CI_AS",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "from_age",
        "type": "int",
        "nullable": true,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "to_age",
        "type": "int",
        "nullable": true,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "monthly_amount",
        "type": "decimal(15, 4)",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "created_at",
        "type": "datetime2",
        "nullable": false,
        "identity": false,
        "defaultValue": "getutcdate()"
      },
      {
        "name": "updated_at",
        "type": "datetime2",
        "nullable": false,
        "identity": false,
        "defaultValue": "getutcdate()"
      },
      {
        "name": "deleted_at",
        "type": "datetimeoffset",
        "nullable": true,
        "identity": false,
        "defaultValue": null
      }
    ]
  },
  {
    "name": "logs",
    "columns": [
      {
        "name": "id",
        "type": "int",
        "nullable": false,
        "identity": true,
        "defaultValue": null
      },
      {
        "name": "table_name",
        "type": "nvarchar(200) COLLATE SQL_Latin1_General_CP1_CI_AS",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "operation",
        "type": "nvarchar(200) COLLATE SQL_Latin1_General_CP1_CI_AS",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "user_email",
        "type": "nvarchar(200) COLLATE SQL_Latin1_General_CP1_CI_AS",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "data",
        "type": "nvarchar(2000) COLLATE SQL_Latin1_General_CP1_CI_AS",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "created_at",
        "type": "datetime2",
        "nullable": false,
        "identity": false,
        "defaultValue": "getutcdate()"
      },
      {
        "name": "updated_at",
        "type": "datetime2",
        "nullable": false,
        "identity": false,
        "defaultValue": "getutcdate()"
      },
      {
        "name": "deleted_at",
        "type": "datetimeoffset",
        "nullable": true,
        "identity": false,
        "defaultValue": null
      }
    ]
  },
  {
    "name": "users",
    "columns": [
      {
        "name": "email",
        "type": "nvarchar(200) COLLATE SQL_Latin1_General_CP1_CI_AS",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "sub",
        "type": "nvarchar(200) COLLATE SQL_Latin1_General_CP1_CI_AS",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "first_name",
        "type": "nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "last_name",
        "type": "nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "status",
        "type": "nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "is_admin",
        "type": "bit",
        "nullable": false,
        "identity": false,
        "defaultValue": "0"
      },
      {
        "name": "ynet_id",
        "type": "nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS",
        "nullable": true,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "directory_id",
        "type": "nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS",
        "nullable": true,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "id",
        "type": "int",
        "nullable": false,
        "identity": true,
        "defaultValue": null
      },
      {
        "name": "created_at",
        "type": "datetime2",
        "nullable": false,
        "identity": false,
        "defaultValue": "getutcdate()"
      },
      {
        "name": "updated_at",
        "type": "datetime2",
        "nullable": false,
        "identity": false,
        "defaultValue": "getutcdate()"
      },
      {
        "name": "roles",
        "type": "nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS",
        "nullable": false,
        "identity": false,
        "defaultValue": "N'user'"
      },
      {
        "name": "deleted_at",
        "type": "datetimeoffset",
        "nullable": true,
        "identity": false,
        "defaultValue": null
      }
    ]
  },
  {
    "name": "building_expense_categories",
    "columns": [
      {
        "name": "id",
        "type": "int",
        "nullable": false,
        "identity": true,
        "defaultValue": null
      },
      {
        "name": "funding_region_id",
        "type": "int",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "category_name",
        "type": "nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "subsidy_rate",
        "type": "decimal(5, 4)",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "created_at",
        "type": "datetime2",
        "nullable": false,
        "identity": false,
        "defaultValue": "getutcdate()"
      },
      {
        "name": "updated_at",
        "type": "datetime2",
        "nullable": false,
        "identity": false,
        "defaultValue": "getutcdate()"
      },
      {
        "name": "deleted_at",
        "type": "datetime2",
        "nullable": true,
        "identity": false,
        "defaultValue": null
      }
    ]
  },
  {
    "name": "centres",
    "columns": [
      {
        "name": "id",
        "type": "int",
        "nullable": false,
        "identity": true,
        "defaultValue": null
      },
      {
        "name": "name",
        "type": "nvarchar(200) COLLATE SQL_Latin1_General_CP1_CI_AS",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "license",
        "type": "nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS",
        "nullable": true,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "community",
        "type": "nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "status",
        "type": "nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "hot_meal",
        "type": "bit",
        "nullable": false,
        "identity": false,
        "defaultValue": "0"
      },
      {
        "name": "licensed_for",
        "type": "int",
        "nullable": true,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "last_submission",
        "type": "date",
        "nullable": true,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "created_at",
        "type": "datetime2",
        "nullable": false,
        "identity": false,
        "defaultValue": "getutcdate()"
      },
      {
        "name": "updated_at",
        "type": "datetime2",
        "nullable": false,
        "identity": false,
        "defaultValue": "getutcdate()"
      },
      {
        "name": "license_holder_name",
        "type": "nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS",
        "nullable": true,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "contact_name",
        "type": "nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS",
        "nullable": true,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "physical_address",
        "type": "nvarchar(250) COLLATE SQL_Latin1_General_CP1_CI_AS",
        "nullable": true,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "mailing_address",
        "type": "nvarchar(250) COLLATE SQL_Latin1_General_CP1_CI_AS",
        "nullable": true,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "email",
        "type": "nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS",
        "nullable": true,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "alt_email",
        "type": "nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS",
        "nullable": true,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "phone_number",
        "type": "nvarchar(20) COLLATE SQL_Latin1_General_CP1_CI_AS",
        "nullable": true,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "alt_phone_number",
        "type": "nvarchar(20) COLLATE SQL_Latin1_General_CP1_CI_AS",
        "nullable": true,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "fax_number",
        "type": "nvarchar(20) COLLATE SQL_Latin1_General_CP1_CI_AS",
        "nullable": true,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "vendor_identifier",
        "type": "nvarchar(20) COLLATE SQL_Latin1_General_CP1_CI_AS",
        "nullable": true,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "is_first_nation_program",
        "type": "bit",
        "nullable": false,
        "identity": false,
        "defaultValue": "0"
      },
      {
        "name": "inspector_name",
        "type": "nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS",
        "nullable": true,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "neighborhood",
        "type": "nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS",
        "nullable": true,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "building_usage_percent",
        "type": "decimal(5, 2)",
        "nullable": false,
        "identity": false,
        "defaultValue": "100"
      },
      {
        "name": "funding_region_id",
        "type": "int",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "deleted_at",
        "type": "datetimeoffset",
        "nullable": true,
        "identity": false,
        "defaultValue": null
      }
    ]
  },
  {
    "name": "fiscal_periods",
    "columns": [
      {
        "name": "id",
        "type": "int",
        "nullable": false,
        "identity": true,
        "defaultValue": null
      },
      {
        "name": "fiscal_year",
        "type": "nvarchar(10) COLLATE SQL_Latin1_General_CP1_CI_AS",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "month",
        "type": "nvarchar(10) COLLATE SQL_Latin1_General_CP1_CI_AS",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "date_start",
        "type": "datetime2(0)",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "date_end",
        "type": "datetime2(0)",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "created_at",
        "type": "datetime2",
        "nullable": false,
        "identity": false,
        "defaultValue": "getutcdate()"
      },
      {
        "name": "updated_at",
        "type": "datetime2",
        "nullable": false,
        "identity": false,
        "defaultValue": "getutcdate()"
      },
      {
        "name": "funding_period_id",
        "type": "int",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "deleted_at",
        "type": "datetimeoffset",
        "nullable": true,
        "identity": false,
        "defaultValue": null
      }
    ]
  },
  {
    "name": "funding_reconciliations",
    "columns": [
      {
        "name": "id",
        "type": "int",
        "nullable": false,
        "identity": true,
        "defaultValue": null
      },
      {
        "name": "centre_id",
        "type": "int",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "funding_period_id",
        "type": "int",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "status",
        "type": "nvarchar(20) COLLATE SQL_Latin1_General_CP1_CI_AS",
        "nullable": false,
        "identity": false,
        "defaultValue": "N'draft'"
      },
      {
        "name": "funding_received_total_amount",
        "type": "decimal(15, 4)",
        "nullable": false,
        "identity": false,
        "defaultValue": "0"
      },
      {
        "name": "eligible_expenses_total_amount",
        "type": "decimal(15, 4)",
        "nullable": false,
        "identity": false,
        "defaultValue": "0"
      },
      {
        "name": "payroll_adjustments_total_amount",
        "type": "decimal(15, 4)",
        "nullable": false,
        "identity": false,
        "defaultValue": "0"
      },
      {
        "name": "final_balance_amount",
        "type": "decimal(15, 4)",
        "nullable": false,
        "identity": false,
        "defaultValue": "0"
      },
      {
        "name": "notes",
        "type": "nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS",
        "nullable": true,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "finalized_at",
        "type": "datetime2",
        "nullable": true,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "finalized_by_id",
        "type": "int",
        "nullable": true,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "created_at",
        "type": "datetime2",
        "nullable": false,
        "identity": false,
        "defaultValue": "getutcdate()"
      },
      {
        "name": "updated_at",
        "type": "datetime2",
        "nullable": false,
        "identity": false,
        "defaultValue": "getutcdate()"
      },
      {
        "name": "deleted_at",
        "type": "datetime2",
        "nullable": true,
        "identity": false,
        "defaultValue": null
      }
    ]
  },
  {
    "name": "funding_submission_line_jsons",
    "columns": [
      {
        "name": "id",
        "type": "int",
        "nullable": false,
        "identity": true,
        "defaultValue": null
      },
      {
        "name": "centre_id",
        "type": "int",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "fiscal_year",
        "type": "nvarchar(10) COLLATE SQL_Latin1_General_CP1_CI_AS",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "date_name",
        "type": "nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "date_start",
        "type": "datetime2(0)",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "date_end",
        "type": "datetime2(0)",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "values",
        "type": "nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "created_at",
        "type": "datetime2",
        "nullable": false,
        "identity": false,
        "defaultValue": "getutcdate()"
      },
      {
        "name": "updated_at",
        "type": "datetime2",
        "nullable": false,
        "identity": false,
        "defaultValue": "getutcdate()"
      },
      {
        "name": "deleted_at",
        "type": "datetimeoffset",
        "nullable": true,
        "identity": false,
        "defaultValue": null
      }
    ]
  },
  {
    "name": "payments",
    "columns": [
      {
        "name": "id",
        "type": "int",
        "nullable": false,
        "identity": true,
        "defaultValue": null
      },
      {
        "name": "centre_id",
        "type": "int",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "fiscal_year",
        "type": "nvarchar(10) COLLATE SQL_Latin1_General_CP1_CI_AS",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "paid_on",
        "type": "date",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "name",
        "type": "nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "created_at",
        "type": "datetime2",
        "nullable": false,
        "identity": false,
        "defaultValue": "getutcdate()"
      },
      {
        "name": "updated_at",
        "type": "datetime2",
        "nullable": false,
        "identity": false,
        "defaultValue": "getutcdate()"
      },
      {
        "name": "fiscal_period_id",
        "type": "int",
        "nullable": true,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "amount",
        "type": "decimal(15, 4)",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "deleted_at",
        "type": "datetimeoffset",
        "nullable": true,
        "identity": false,
        "defaultValue": null
      }
    ]
  },
  {
    "name": "building_expenses",
    "columns": [
      {
        "name": "id",
        "type": "int",
        "nullable": false,
        "identity": true,
        "defaultValue": null
      },
      {
        "name": "category_id",
        "type": "int",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "centre_id",
        "type": "int",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "fiscal_period_id",
        "type": "int",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "subsidy_rate",
        "type": "decimal(5, 4)",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "building_usage_percent",
        "type": "decimal(5, 2)",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "estimated_cost",
        "type": "decimal(15, 4)",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "actual_cost",
        "type": "decimal(15, 4)",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "total_cost",
        "type": "decimal(15, 4)",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "notes",
        "type": "nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS",
        "nullable": true,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "created_at",
        "type": "datetime2",
        "nullable": false,
        "identity": false,
        "defaultValue": "getutcdate()"
      },
      {
        "name": "updated_at",
        "type": "datetime2",
        "nullable": false,
        "identity": false,
        "defaultValue": "getutcdate()"
      },
      {
        "name": "deleted_at",
        "type": "datetime2",
        "nullable": true,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "funding_region_snapshot",
        "type": "nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      }
    ]
  },
  {
    "name": "employee_benefits",
    "columns": [
      {
        "name": "id",
        "type": "int",
        "nullable": false,
        "identity": true,
        "defaultValue": null
      },
      {
        "name": "centre_id",
        "type": "int",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "fiscal_period_id",
        "type": "int",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "gross_payroll_monthly_actual",
        "type": "decimal(15, 4)",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "gross_payroll_monthly_estimated",
        "type": "decimal(15, 4)",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "cost_cap_percentage",
        "type": "decimal(5, 2)",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "employee_cost_actual",
        "type": "decimal(15, 4)",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "employee_cost_estimated",
        "type": "decimal(15, 4)",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "employer_cost_actual",
        "type": "decimal(15, 4)",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "employer_cost_estimated",
        "type": "decimal(15, 4)",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "created_at",
        "type": "datetime2",
        "nullable": false,
        "identity": false,
        "defaultValue": "getutcdate()"
      },
      {
        "name": "updated_at",
        "type": "datetime2",
        "nullable": false,
        "identity": false,
        "defaultValue": "getutcdate()"
      },
      {
        "name": "deleted_at",
        "type": "datetimeoffset",
        "nullable": true,
        "identity": false,
        "defaultValue": null
      }
    ]
  },
  {
    "name": "employee_wage_tiers",
    "columns": [
      {
        "name": "id",
        "type": "int",
        "nullable": false,
        "identity": true,
        "defaultValue": null
      },
      {
        "name": "fiscal_period_id",
        "type": "int",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "tier_level",
        "type": "int",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "tier_label",
        "type": "nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "wage_rate_per_hour",
        "type": "decimal(10, 4)",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "created_at",
        "type": "datetime2",
        "nullable": false,
        "identity": false,
        "defaultValue": "getutcdate()"
      },
      {
        "name": "updated_at",
        "type": "datetime2",
        "nullable": false,
        "identity": false,
        "defaultValue": "getutcdate()"
      },
      {
        "name": "deleted_at",
        "type": "datetimeoffset",
        "nullable": true,
        "identity": false,
        "defaultValue": null
      }
    ]
  },
  {
    "name": "funding_reconciliation_adjustments",
    "columns": [
      {
        "name": "id",
        "type": "int",
        "nullable": false,
        "identity": true,
        "defaultValue": null
      },
      {
        "name": "funding_reconciliation_id",
        "type": "int",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "fiscal_period_id",
        "type": "int",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "funding_received_period_amount",
        "type": "decimal(15, 4)",
        "nullable": false,
        "identity": false,
        "defaultValue": "0"
      },
      {
        "name": "eligible_expenses_period_amount",
        "type": "decimal(15, 4)",
        "nullable": false,
        "identity": false,
        "defaultValue": "0"
      },
      {
        "name": "payroll_adjustments_period_amount",
        "type": "decimal(15, 4)",
        "nullable": false,
        "identity": false,
        "defaultValue": "0"
      },
      {
        "name": "cumulative_balance_amount",
        "type": "decimal(15, 4)",
        "nullable": false,
        "identity": false,
        "defaultValue": "0"
      },
      {
        "name": "created_at",
        "type": "datetime2",
        "nullable": false,
        "identity": false,
        "defaultValue": "getutcdate()"
      },
      {
        "name": "updated_at",
        "type": "datetime2",
        "nullable": false,
        "identity": false,
        "defaultValue": "getutcdate()"
      },
      {
        "name": "deleted_at",
        "type": "datetime2",
        "nullable": true,
        "identity": false,
        "defaultValue": null
      }
    ]
  },
  {
    "name": "wage_enhancements",
    "columns": [
      {
        "name": "id",
        "type": "int",
        "nullable": false,
        "identity": true,
        "defaultValue": null
      },
      {
        "name": "centre_id",
        "type": "int",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "employee_wage_tier_id",
        "type": "int",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "employee_name",
        "type": "nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "hours_estimated",
        "type": "decimal(10, 2)",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "hours_actual",
        "type": "decimal(10, 2)",
        "nullable": false,
        "identity": false,
        "defaultValue": null
      },
      {
        "name": "created_at",
        "type": "datetime2",
        "nullable": false,
        "identity": false,
        "defaultValue": "getutcdate()"
      },
      {
        "name": "updated_at",
        "type": "datetime2",
        "nullable": false,
        "identity": false,
        "defaultValue": "getutcdate()"
      },
      {
        "name": "deleted_at",
        "type": "datetimeoffset",
        "nullable": true,
        "identity": false,
        "defaultValue": null
      }
    ]
  }
]

const applicationTableNames = productionSchema.map(({ name }) => name)

const uniqueIndexes: UniqueIndex[] = [
  {
    "name": "unique_funding_regions_on_region",
    "table": "funding_regions",
    "columns": [
      "region"
    ]
  },
  {
    "name": "users_on_email_unique",
    "table": "users",
    "columns": [
      "email"
    ]
  },
  {
    "name": "unique_building_expense_categories_on_funding_region_id_category_name",
    "table": "building_expense_categories",
    "columns": [
      "funding_region_id",
      "category_name"
    ]
  },
  {
    "name": "fiscal_periods_fiscal_year_month_unique",
    "table": "fiscal_periods",
    "columns": [
      "fiscal_year",
      "month"
    ]
  },
  {
    "name": "fiscal_periods_funding_period_id_fiscal_year_month_unique",
    "table": "fiscal_periods",
    "columns": [
      "funding_period_id",
      "fiscal_year",
      "month"
    ]
  },
  {
    "name": "unique_funding_reconciliations_on_centre_id_funding_period_id",
    "table": "funding_reconciliations",
    "columns": [
      "centre_id",
      "funding_period_id"
    ]
  },
  {
    "name": "unique_building_expenses_on_centre_id_fiscal_period_id_category_id",
    "table": "building_expenses",
    "columns": [
      "centre_id",
      "fiscal_period_id",
      "category_id"
    ]
  },
  {
    "name": "employee_benefits_centre_id_fiscal_period_id_unique",
    "table": "employee_benefits",
    "columns": [
      "centre_id",
      "fiscal_period_id"
    ]
  },
  {
    "name": "employee_wage_tiers_on_fiscal_period_id_tier_level_unique",
    "table": "employee_wage_tiers",
    "columns": [
      "fiscal_period_id",
      "tier_level"
    ]
  },
  {
    "name": "unique_funding_reconciliation_adjustments_on_funding_reconciliation_id_fiscal_period_id",
    "table": "funding_reconciliation_adjustments",
    "columns": [
      "funding_reconciliation_id",
      "fiscal_period_id"
    ]
  }
]

const foreignKeys: ForeignKey[] = [
  {
    "name": "FK__building___fundi__53D770D6",
    "table": "building_expense_categories",
    "columns": [
      "funding_region_id"
    ],
    "referencedTable": "funding_regions",
    "referencedColumns": [
      "id"
    ],
    "onDelete": "NO_ACTION",
    "onUpdate": "NO_ACTION"
  },
  {
    "name": "centres_funding_region_id_funding_regions_fk",
    "table": "centres",
    "columns": [
      "funding_region_id"
    ],
    "referencedTable": "funding_regions",
    "referencedColumns": [
      "id"
    ],
    "onDelete": "NO_ACTION",
    "onUpdate": "NO_ACTION"
  },
  {
    "name": "fiscal_periods_funding_period_id_funding_periods_fk",
    "table": "fiscal_periods",
    "columns": [
      "funding_period_id"
    ],
    "referencedTable": "funding_periods",
    "referencedColumns": [
      "id"
    ],
    "onDelete": "CASCADE",
    "onUpdate": "CASCADE"
  },
  {
    "name": "FK__funding_r__centr__3DE82FB7",
    "table": "funding_reconciliations",
    "columns": [
      "centre_id"
    ],
    "referencedTable": "centres",
    "referencedColumns": [
      "id"
    ],
    "onDelete": "NO_ACTION",
    "onUpdate": "NO_ACTION"
  },
  {
    "name": "FK__funding_r__final__3FD07829",
    "table": "funding_reconciliations",
    "columns": [
      "finalized_by_id"
    ],
    "referencedTable": "users",
    "referencedColumns": [
      "id"
    ],
    "onDelete": "NO_ACTION",
    "onUpdate": "NO_ACTION"
  },
  {
    "name": "FK__funding_r__fundi__3EDC53F0",
    "table": "funding_reconciliations",
    "columns": [
      "funding_period_id"
    ],
    "referencedTable": "funding_periods",
    "referencedColumns": [
      "id"
    ],
    "onDelete": "NO_ACTION",
    "onUpdate": "NO_ACTION"
  },
  {
    "name": "FK__funding_s__centr__7EF6D905",
    "table": "funding_submission_line_jsons",
    "columns": [
      "centre_id"
    ],
    "referencedTable": "centres",
    "referencedColumns": [
      "id"
    ],
    "onDelete": "NO_ACTION",
    "onUpdate": "NO_ACTION"
  },
  {
    "name": "FK__payments__centre__1B9317B3",
    "table": "payments",
    "columns": [
      "centre_id"
    ],
    "referencedTable": "centres",
    "referencedColumns": [
      "id"
    ],
    "onDelete": "NO_ACTION",
    "onUpdate": "NO_ACTION"
  },
  {
    "name": "FK__payments__fiscal__32767D0B",
    "table": "payments",
    "columns": [
      "fiscal_period_id"
    ],
    "referencedTable": "fiscal_periods",
    "referencedColumns": [
      "id"
    ],
    "onDelete": "NO_ACTION",
    "onUpdate": "NO_ACTION"
  },
  {
    "name": "FK__payments__fiscal__336AA144",
    "table": "payments",
    "columns": [
      "fiscal_period_id"
    ],
    "referencedTable": "fiscal_periods",
    "referencedColumns": [
      "id"
    ],
    "onDelete": "NO_ACTION",
    "onUpdate": "NO_ACTION"
  },
  {
    "name": "FK__building___build__589C25F3",
    "table": "building_expenses",
    "columns": [
      "category_id"
    ],
    "referencedTable": "building_expense_categories",
    "referencedColumns": [
      "id"
    ],
    "onDelete": "NO_ACTION",
    "onUpdate": "NO_ACTION"
  },
  {
    "name": "FK__building___centr__59904A2C",
    "table": "building_expenses",
    "columns": [
      "centre_id"
    ],
    "referencedTable": "centres",
    "referencedColumns": [
      "id"
    ],
    "onDelete": "NO_ACTION",
    "onUpdate": "NO_ACTION"
  },
  {
    "name": "FK__building___fisca__5A846E65",
    "table": "building_expenses",
    "columns": [
      "fiscal_period_id"
    ],
    "referencedTable": "fiscal_periods",
    "referencedColumns": [
      "id"
    ],
    "onDelete": "NO_ACTION",
    "onUpdate": "NO_ACTION"
  },
  {
    "name": "FK__employee___centr__24285DB4",
    "table": "employee_benefits",
    "columns": [
      "centre_id"
    ],
    "referencedTable": "centres",
    "referencedColumns": [
      "id"
    ],
    "onDelete": "NO_ACTION",
    "onUpdate": "NO_ACTION"
  },
  {
    "name": "employee_benefits_fiscal_period_id_fiscal_periods_fk",
    "table": "employee_benefits",
    "columns": [
      "fiscal_period_id"
    ],
    "referencedTable": "fiscal_periods",
    "referencedColumns": [
      "id"
    ],
    "onDelete": "NO_ACTION",
    "onUpdate": "NO_ACTION"
  },
  {
    "name": "FK__employee___fisca__2AD55B43",
    "table": "employee_wage_tiers",
    "columns": [
      "fiscal_period_id"
    ],
    "referencedTable": "fiscal_periods",
    "referencedColumns": [
      "id"
    ],
    "onDelete": "NO_ACTION",
    "onUpdate": "NO_ACTION"
  },
  {
    "name": "FK__funding_r__fisca__4959E263",
    "table": "funding_reconciliation_adjustments",
    "columns": [
      "fiscal_period_id"
    ],
    "referencedTable": "fiscal_periods",
    "referencedColumns": [
      "id"
    ],
    "onDelete": "NO_ACTION",
    "onUpdate": "NO_ACTION"
  },
  {
    "name": "FK__funding_r__fundi__4865BE2A",
    "table": "funding_reconciliation_adjustments",
    "columns": [
      "funding_reconciliation_id"
    ],
    "referencedTable": "funding_reconciliations",
    "referencedColumns": [
      "id"
    ],
    "onDelete": "CASCADE",
    "onUpdate": "NO_ACTION"
  },
  {
    "name": "FK__wage_enha__centr__2F9A1060",
    "table": "wage_enhancements",
    "columns": [
      "centre_id"
    ],
    "referencedTable": "centres",
    "referencedColumns": [
      "id"
    ],
    "onDelete": "NO_ACTION",
    "onUpdate": "NO_ACTION"
  },
  {
    "name": "FK__wage_enha__emplo__308E3499",
    "table": "wage_enhancements",
    "columns": [
      "employee_wage_tier_id"
    ],
    "referencedTable": "employee_wage_tiers",
    "referencedColumns": [
      "id"
    ],
    "onDelete": "NO_ACTION",
    "onUpdate": "NO_ACTION"
  }
]

async function hasCompletedLegacyMigrations(knex: Knex): Promise<boolean> {
  if (!(await knex.schema.hasTable("SequelizeMeta"))) return false

  const completedLegacyMigration = await knex("SequelizeMeta")
    .whereIn("name", finalLegacyMigrationNames)
    .first("name")

  if (completedLegacyMigration) return true

  throw new Error("The historical migration ledger is incomplete.")
}

async function assertEmptyApplicationSchema(knex: Knex): Promise<void> {
  for (const tableName of applicationTableNames) {
    if (await knex.schema.hasTable(tableName)) {
      throw new Error(
        `Cannot establish production schema: ${tableName} exists without a historical migration ledger.`
      )
    }
  }
}

function createColumns(table: Knex.CreateTableBuilder, columns: ColumnDefinition[], knex: Knex): void {
  for (const column of columns) {
    const columnBuilder = column.identity
      ? table.increments(column.name)
      : table.specificType(column.name, column.type)

    if (!column.nullable) columnBuilder.notNullable()
    if (column.defaultValue) columnBuilder.defaultTo(knex.raw(column.defaultValue))
  }
}

async function createProductionSchema(knex: Knex): Promise<void> {
  for (const tableDefinition of productionSchema) {
    await knex.schema.createTable(tableDefinition.name, (table) => {
      createColumns(table, tableDefinition.columns, knex)
    })
  }

  for (const foreignKey of foreignKeys) {
    await knex.schema.alterTable(foreignKey.table, (table) => {
      const foreignKeyBuilder = table
        .foreign(foreignKey.columns, foreignKey.name)
        .references(foreignKey.referencedColumns)
        .inTable(foreignKey.referencedTable)

      if (foreignKey.onDelete !== "NO_ACTION") foreignKeyBuilder.onDelete(foreignKey.onDelete)
      if (foreignKey.onUpdate !== "NO_ACTION") foreignKeyBuilder.onUpdate(foreignKey.onUpdate)
    })
  }

  for (const uniqueIndex of uniqueIndexes) {
    const columns = uniqueIndex.columns.map((column) => "[" + column + "]").join(", ")
    const createIndex = "CREATE UNIQUE INDEX [" + uniqueIndex.name + "] ON [" + uniqueIndex.table + "] (" + columns + ") WHERE [deleted_at] IS NULL"
    await knex.raw(createIndex)
  }
}

export async function up(knex: Knex): Promise<void> {
  if (await hasCompletedLegacyMigrations(knex)) return

  await assertEmptyApplicationSchema(knex)
  await createProductionSchema(knex)
}

export async function down(_knex: Knex): Promise<void> {
  throw new Error("The established production schema cannot be rolled back.")
}

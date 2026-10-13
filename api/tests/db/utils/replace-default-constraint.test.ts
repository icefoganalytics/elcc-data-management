import dbMigrationClient from "@/db/db-migration-client"

import { replaceDefaultConstraint } from "@/db/utils/replace-default-constraint"

type DefaultConstraintRecord = {
  object_id: number
  name: string
  definition: string
}

async function findDefaultConstraint(
  tableName: string,
  columnName: string
): Promise<DefaultConstraintRecord | undefined> {
  return dbMigrationClient<DefaultConstraintRecord>("sys.default_constraints")
    .join("sys.columns", "sys.columns.default_object_id", "sys.default_constraints.object_id")
    .where("sys.columns.object_id", dbMigrationClient.raw("OBJECT_ID(?)", [`dbo.${tableName}`]))
    .where("sys.columns.name", columnName)
    .select(
      "sys.default_constraints.object_id",
      "sys.default_constraints.name",
      "sys.default_constraints.definition"
    )
    .first()
}

describe("api/src/db/utils/replace-default-constraint.ts", () => {
  describe("replaceDefaultConstraint", () => {
    test("when the default definition is canonical, preserves its existing constraint object", async () => {
      // Arrange
      const tableName = "replace_default_canonical_test"
      try {
        await dbMigrationClient.raw(`
        CREATE TABLE [dbo].[${tableName}] (
          [is_enabled] INT NOT NULL CONSTRAINT [canonical_is_enabled_default] DEFAULT (0)
        )
      `)
        const originalConstraint = await findDefaultConstraint(tableName, "is_enabled")
        if (originalConstraint === undefined) {
          throw new Error("Expected the fixture's default constraint to exist")
        }

        // Act
        await replaceDefaultConstraint(dbMigrationClient, tableName, "is_enabled", "0", "((0))")

        // Assert
        const currentConstraint = await findDefaultConstraint(tableName, "is_enabled")
        expect(currentConstraint).toEqual(originalConstraint)
      } finally {
        await dbMigrationClient.raw(`DROP TABLE IF EXISTS [dbo].[${tableName}]`)
      }
    })

    test("when a named default is noncanonical, replaces its expression and retains its escaped name", async () => {
      // Arrange
      const tableName = "replace_default_named_test"
      const customConstraintName = "custom] named default"
      try {
        await dbMigrationClient.raw(`
        CREATE TABLE [dbo].[${tableName}] (
          [is_enabled] INT NOT NULL CONSTRAINT [custom]] named default] DEFAULT (1)
        )
      `)
        // Act
        await replaceDefaultConstraint(dbMigrationClient, tableName, "is_enabled", "0", "((0))")

        // Assert
        const currentConstraint = await findDefaultConstraint(tableName, "is_enabled")
        expect(currentConstraint).toEqual(
          expect.objectContaining({
            name: customConstraintName,
            definition: "((0))",
          })
        )
      } finally {
        await dbMigrationClient.raw(`DROP TABLE IF EXISTS [dbo].[${tableName}]`)
      }
    })

    test("when the column has no default, adds one used by inserts that omit the column", async () => {
      // Arrange
      const tableName = "replace_default_missing_test"
      try {
        await dbMigrationClient.raw(`
        CREATE TABLE [dbo].[${tableName}] (
          [id] INT IDENTITY(1, 1) NOT NULL,
          [status] NVARCHAR(20) NOT NULL
        )
      `)
        // Act
        await replaceDefaultConstraint(
          dbMigrationClient,
          tableName,
          "status",
          "N'draft'",
          "(N'draft')"
        )
        await dbMigrationClient.raw(`INSERT INTO [dbo].[${tableName}] DEFAULT VALUES`)

        // Assert
        const insertedRecord = await dbMigrationClient<{ status: string }>(tableName)
          .select("status")
          .first()
        expect(insertedRecord).toEqual({ status: "draft" })
      } finally {
        await dbMigrationClient.raw(`DROP TABLE IF EXISTS [dbo].[${tableName}]`)
      }
    })

    test("when replacing a decimal default, preserves an existing nonzero decimal value exactly", async () => {
      // Arrange
      const tableName = "replace_default_decimal_test"
      try {
        await dbMigrationClient.raw(`
        CREATE TABLE [dbo].[${tableName}] (
          [amount] DECIMAL(19, 4) NOT NULL CONSTRAINT [amount_old_default] DEFAULT (1.0000)
        )
        INSERT INTO [dbo].[${tableName}] ([amount]) VALUES ('1234567890123.4567')
      `)
        // Act
        await replaceDefaultConstraint(dbMigrationClient, tableName, "amount", "0", "((0))")

        // Assert
        const persistedAmount = await dbMigrationClient<{ amount: string }>(tableName)
          .select(dbMigrationClient.raw("CONVERT(VARCHAR(40), ??) AS ??", ["amount", "amount"]))
          .first()
        expect(persistedAmount).toEqual({ amount: "1234567890123.4567" })
      } finally {
        await dbMigrationClient.raw(`DROP TABLE IF EXISTS [dbo].[${tableName}]`)
      }
    })

    test("when a unique index depends on the column, replaces its default without changing indexed data", async () => {
      // Arrange
      const tableName = "replace_default_unique_index_test"
      try {
        await dbMigrationClient.raw(`
        CREATE TABLE [dbo].[${tableName}] (
          [code] INT NOT NULL CONSTRAINT [code_old_default] DEFAULT (1)
        )
        CREATE UNIQUE INDEX [replace_default_unique_code_index] ON [dbo].[${tableName}] ([code])
        INSERT INTO [dbo].[${tableName}] DEFAULT VALUES
      `)
        // Act
        await replaceDefaultConstraint(dbMigrationClient, tableName, "code", "0", "((0))")
        await dbMigrationClient.raw(`INSERT INTO [dbo].[${tableName}] DEFAULT VALUES`)

        // Assert
        const records = await dbMigrationClient<{ code: number }>(tableName)
          .select("code")
          .orderBy("code")
        expect(records).toEqual([{ code: 0 }, { code: 1 }])
      } finally {
        await dbMigrationClient.raw(`DROP TABLE IF EXISTS [dbo].[${tableName}]`)
      }
    })

    test("when a schema-bound view and computed column depend on the column, replaces its default", async () => {
      // Arrange
      const tableName = "replace_default_schema_bound_test"
      const viewName = "replace_default_schema_bound_view_test"
      try {
        await dbMigrationClient.raw(`
        CREATE TABLE [dbo].[${tableName}] (
          [status] INT NOT NULL CONSTRAINT [status_old_default] DEFAULT (1),
          [status_next] AS ([status] + 1) PERSISTED
        )
        EXEC(N'CREATE VIEW [dbo].[${viewName}] WITH SCHEMABINDING AS
          SELECT [status], [status_next] FROM [dbo].[${tableName}]')
      `)
        // Act
        await replaceDefaultConstraint(dbMigrationClient, tableName, "status", "0", "((0))")
        await dbMigrationClient.raw(`INSERT INTO [dbo].[${tableName}] DEFAULT VALUES`)

        // Assert
        const viewRecord = await dbMigrationClient<{ status: number; status_next: number }>(
          viewName
        )
          .select("status", "status_next")
          .first()
        expect(viewRecord).toEqual({ status: 0, status_next: 1 })
      } finally {
        await dbMigrationClient.raw(`DROP VIEW IF EXISTS [dbo].[${viewName}]`)
        await dbMigrationClient.raw(`DROP TABLE IF EXISTS [dbo].[${tableName}]`)
      }
    })
  })
})

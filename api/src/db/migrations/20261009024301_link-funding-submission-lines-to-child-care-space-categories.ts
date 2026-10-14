import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  // Keep category identity separate from editable names. SQL Server assigns the foreign-key name.
  // Use a separate batch so subsequent SQL can reference the newly added column.
  await knex.raw(`
    ALTER TABLE funding_submission_lines
    ADD child_care_space_category_id INT NULL
      REFERENCES child_care_space_categories(id) ON DELETE SET NULL;
  `)

  await knex.raw(`
    DECLARE @linked_sections TABLE (section_name NVARCHAR(200));
    INSERT INTO @linked_sections VALUES
      (N'Administration (10% of Spaces)'),
      (N'Quality Enhancement Program');

    DECLARE @category_matches TABLE (
      submission_line_id INT,
      category_id INT
    );

    -- First use active category names within the configuration's fiscal year.
    -- Also recover renamed or retired categories from historical worksheet/ledger snapshots.
    -- UNION removes duplicate evidence for the same configuration/category pair.
    INSERT INTO @category_matches (submission_line_id, category_id)
    SELECT funding_submission_lines.id, child_care_space_categories.id
    FROM funding_submission_lines
    INNER JOIN @linked_sections AS linked_sections
      ON funding_submission_lines.section_name COLLATE Latin1_General_100_BIN2
        = linked_sections.section_name COLLATE Latin1_General_100_BIN2
    INNER JOIN funding_periods
      ON funding_submission_lines.fiscal_year
        = LEFT(funding_periods.fiscal_year, 4) + '/' + RIGHT(funding_periods.fiscal_year, 2)
    INNER JOIN child_care_space_categories
      ON child_care_space_categories.funding_period_id = funding_periods.id
      AND child_care_space_categories.category_name COLLATE Latin1_General_100_BIN2
        = funding_submission_lines.line_name COLLATE Latin1_General_100_BIN2
    WHERE funding_submission_lines.deleted_at IS NULL
      AND child_care_space_categories.deleted_at IS NULL

    UNION

    SELECT funding_submission_lines.id, child_care_spaces.category_id
    FROM funding_submission_line_jsons
    CROSS APPLY OPENJSON(funding_submission_line_jsons.[values]) AS worksheet_lines
    INNER JOIN funding_submission_lines
      ON funding_submission_lines.id
        = TRY_CONVERT(INT, JSON_VALUE(worksheet_lines.value, '$.submissionLineId'))
      AND funding_submission_lines.fiscal_year = funding_submission_line_jsons.fiscal_year
      AND funding_submission_lines.section_name COLLATE Latin1_General_100_BIN2
        = JSON_VALUE(worksheet_lines.value, '$.sectionName') COLLATE Latin1_General_100_BIN2
    INNER JOIN @linked_sections AS linked_sections
      ON funding_submission_lines.section_name COLLATE Latin1_General_100_BIN2
        = linked_sections.section_name COLLATE Latin1_General_100_BIN2
    INNER JOIN funding_periods
      ON LEFT(funding_periods.fiscal_year, 4) + '/' + RIGHT(funding_periods.fiscal_year, 2)
        = funding_submission_line_jsons.fiscal_year
    INNER JOIN fiscal_periods
      ON fiscal_periods.funding_period_id = funding_periods.id
      AND LOWER(fiscal_periods.month) = LOWER(funding_submission_line_jsons.date_name)
    INNER JOIN child_care_spaces
      ON child_care_spaces.centre_id = funding_submission_line_jsons.centre_id
      AND child_care_spaces.fiscal_period_id = fiscal_periods.id
      AND child_care_spaces.line_name COLLATE Latin1_General_100_BIN2
        = JSON_VALUE(worksheet_lines.value, '$.lineName') COLLATE Latin1_General_100_BIN2
    INNER JOIN child_care_space_categories
      ON child_care_space_categories.id = child_care_spaces.category_id
      AND child_care_space_categories.funding_period_id = funding_periods.id
    WHERE funding_submission_line_jsons.deleted_at IS NULL
      AND child_care_spaces.deleted_at IS NULL
      AND child_care_spaces.category_id IS NOT NULL;

    -- Never choose an arbitrary category: conflicting current/historical matches abort
    -- the migration, and Knex rolls back this migration's schema and data changes.
    IF EXISTS (
      SELECT submission_line_id
      FROM @category_matches
      GROUP BY submission_line_id
      HAVING COUNT(DISTINCT category_id) > 1
    )
    BEGIN
      THROW 50000, 'Funding submission lines have ambiguous or conflicting child care space category matches.', 1;
    END;

    UPDATE funding_submission_lines
    SET child_care_space_category_id = category_matches.category_id
    FROM funding_submission_lines
    INNER JOIN @category_matches AS category_matches
      ON category_matches.submission_line_id = funding_submission_lines.id;

    -- A worksheet gets linkage metadata only when its own centre/month contains
    -- the linked category. Do not invent links for unrelated months or centres.
    DECLARE @worksheet_links TABLE (
      worksheet_id INT,
      line_index INT,
      category_id INT,
      PRIMARY KEY (worksheet_id, line_index)
    );

    -- JSON IDs must be numbers, not strings or nulls. FLOAT accepts decimal/exponent
    -- number forms while keeping integer configuration IDs exact.
    -- Binary comparison plus byte length also rejects differently cased/padded
    -- property names and section labels that JavaScript would not match.

    INSERT INTO @worksheet_links (worksheet_id, line_index, category_id)
    SELECT DISTINCT
      funding_submission_line_jsons.id,
      TRY_CONVERT(INT, worksheet_lines.[key]),
      category_matches.category_id
    FROM funding_submission_line_jsons
    CROSS APPLY OPENJSON(funding_submission_line_jsons.[values]) AS worksheet_lines
    CROSS APPLY OPENJSON(
      CASE WHEN worksheet_lines.type = 5 THEN worksheet_lines.value ELSE N'{}' END
    ) AS line_properties
    INNER JOIN @category_matches AS category_matches
      ON category_matches.submission_line_id = TRY_CONVERT(FLOAT, line_properties.value)
    INNER JOIN @linked_sections AS linked_sections
      ON JSON_VALUE(
        CASE WHEN worksheet_lines.type = 5 THEN worksheet_lines.value ELSE N'{}' END,
        '$.sectionName'
      ) COLLATE Latin1_General_100_BIN2 = linked_sections.section_name COLLATE Latin1_General_100_BIN2
      AND DATALENGTH(JSON_VALUE(
        CASE WHEN worksheet_lines.type = 5 THEN worksheet_lines.value ELSE N'{}' END,
        '$.sectionName'
      )) = DATALENGTH(linked_sections.section_name)
    WHERE funding_submission_line_jsons.deleted_at IS NULL
      AND line_properties.[key] COLLATE Latin1_General_100_BIN2 = N'submissionLineId'
      AND DATALENGTH(line_properties.[key]) = DATALENGTH(N'submissionLineId')
      AND line_properties.type = 2
      AND TRY_CONVERT(INT, worksheet_lines.[key]) IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM child_care_spaces
        INNER JOIN fiscal_periods ON fiscal_periods.id = child_care_spaces.fiscal_period_id
        INNER JOIN funding_periods ON funding_periods.id = fiscal_periods.funding_period_id
        WHERE child_care_spaces.centre_id = funding_submission_line_jsons.centre_id
          AND child_care_spaces.category_id = category_matches.category_id
          AND LEFT(funding_periods.fiscal_year, 4) + '/' + RIGHT(funding_periods.fiscal_year, 2)
            = funding_submission_line_jsons.fiscal_year
          AND LOWER(fiscal_periods.month) = LOWER(funding_submission_line_jsons.date_name)
          AND child_care_spaces.deleted_at IS NULL
      );

    -- JSON_MODIFY changes just the category ID, preserving array order and every
    -- historical label, amount, occupancy, total and unknown property.
    -- A joined UPDATE would pick one array element per worksheet; apply every path in order.
    DECLARE @worksheet_id INT, @line_index INT, @category_id INT;
    WHILE EXISTS (SELECT 1 FROM @worksheet_links)
    BEGIN
      SELECT TOP 1
        @worksheet_id = worksheet_id,
        @line_index = line_index,
        @category_id = category_id
      FROM @worksheet_links
      ORDER BY worksheet_id, line_index;

      UPDATE funding_submission_line_jsons
      SET [values] = JSON_MODIFY(
        [values],
        '$[' + CONVERT(VARCHAR(20), @line_index) + '].childCareSpaceCategoryId',
        @category_id
      )
      WHERE id = @worksheet_id;

      DELETE FROM @worksheet_links
      WHERE worksheet_id = @worksheet_id AND line_index = @line_index;
    END;
  `)
}

export async function down(knex: Knex): Promise<void> {
  // Constraint names can differ between Knex-created and SQL-created installations.
  // Remove this column's foreign key, then the column; leave historical JSON/ledger facts intact.
  await knex.raw(`
    DECLARE @foreign_key_name SYSNAME;
    SELECT @foreign_key_name = foreign_keys.name
    FROM sys.foreign_keys AS foreign_keys
    INNER JOIN sys.foreign_key_columns AS foreign_key_columns
      ON foreign_key_columns.constraint_object_id = foreign_keys.object_id
    INNER JOIN sys.columns AS columns
      ON columns.object_id = foreign_key_columns.parent_object_id
      AND columns.column_id = foreign_key_columns.parent_column_id
    WHERE foreign_keys.parent_object_id = OBJECT_ID(N'funding_submission_lines')
      AND foreign_keys.referenced_object_id = OBJECT_ID(N'child_care_space_categories')
      AND columns.name = N'child_care_space_category_id';

    IF @foreign_key_name IS NOT NULL
    BEGIN
      DECLARE @drop_foreign_key NVARCHAR(MAX) =
        N'ALTER TABLE funding_submission_lines DROP CONSTRAINT ' + QUOTENAME(@foreign_key_name);
      EXEC sp_executesql @drop_foreign_key;
    END;

    ALTER TABLE funding_submission_lines DROP COLUMN child_care_space_category_id;
  `)
}

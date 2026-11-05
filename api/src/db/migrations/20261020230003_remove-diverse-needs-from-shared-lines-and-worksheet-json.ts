import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  await removeChildrenWithDiverseNeedsFundingRecordsJson(knex)
  await retireConfigurations(knex)
}

export async function down(_knex: Knex): Promise<void> {
  throw new Error(
    "Restoring Diverse Needs configuration and worksheet JSON requires the original data."
  )
}

async function removeChildrenWithDiverseNeedsFundingRecordsJson(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    UPDATE worksheets
    SET
      [values] = CASE
        WHEN retained.remainingValues IS NULL THEN N'[]'
        ELSE N'[' + retained.remainingValues + N']'
      END
    FROM
      funding_submission_line_jsons worksheets
      CROSS APPLY (
        SELECT
          STRING_AGG(
            CONVERT(
              NVARCHAR(MAX),
              CASE
                WHEN lines.type = 0 THEN N'null'
                WHEN lines.type = 1 THEN N'"' + STRING_ESCAPE(lines.value, 'json') + N'"'
                ELSE lines.value
              END
            ),
            N','
          ) WITHIN GROUP (
            ORDER BY
              TRY_CONVERT(INT, lines.[key])
          ) AS remainingValues
        FROM
          OPENJSON (
            CASE
              WHEN ISJSON(worksheets.[values]) = 1 THEN worksheets.[values]
              ELSE N'[]'
            END
          ) lines
        WHERE
          NOT EXISTS (
            SELECT
              1
            FROM
              OPENJSON (
                CASE
                  WHEN lines.type = 5 THEN lines.value
                  ELSE N'{}'
                END
              ) p
            WHERE
              p.[key]
            COLLATE Latin1_General_100_BIN2 = N'sectionName'
            AND DATALENGTH(p.[key]) = DATALENGTH(N'sectionName')
            AND p.type = 1
            AND p.value
            COLLATE Latin1_General_100_BIN2 = N'Children with Diverse Needs'
            AND DATALENGTH(p.value) = DATALENGTH(N'Children with Diverse Needs')
          )
      ) retained
    WHERE
      EXISTS (
        SELECT
          1
        FROM
          OPENJSON (
            CASE
              WHEN ISJSON(worksheets.[values]) = 1 THEN worksheets.[values]
              ELSE N'[]'
            END
          ) lines
        WHERE
          EXISTS (
            SELECT
              1
            FROM
              OPENJSON (
                CASE
                  WHEN lines.type = 5 THEN lines.value
                  ELSE N'{}'
                END
              ) p
            WHERE
              p.[key]
            COLLATE Latin1_General_100_BIN2 = N'sectionName'
            AND DATALENGTH(p.[key]) = DATALENGTH(N'sectionName')
            AND p.type = 1
            AND p.value
            COLLATE Latin1_General_100_BIN2 = N'Children with Diverse Needs'
            AND DATALENGTH(p.value) = DATALENGTH(N'Children with Diverse Needs')
          )
      )
  `)
}

async function retireConfigurations(knex: Knex): Promise<void> {
  await knex("funding_submission_lines")
    .whereRaw(
      "section_name COLLATE Latin1_General_100_BIN2 = N'Children with Diverse Needs' AND DATALENGTH(section_name) = DATALENGTH(N'Children with Diverse Needs')"
    )
    .del()
}

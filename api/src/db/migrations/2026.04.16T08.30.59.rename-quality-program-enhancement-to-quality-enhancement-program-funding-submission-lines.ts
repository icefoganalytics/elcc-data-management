import { QueryTypes, sql } from "@sequelize/core"
import { type Migration } from "@/db/umzug"

export async function up({ context: { sequelize } }: Migration) {
  await sequelize.query(
    sql`
      UPDATE funding_submission_lines
      SET
        section_name = 'Quality Enhancement Program'
      WHERE
        section_name = 'Quality Program Enhancement'
    `,
    { type: QueryTypes.UPDATE }
  )
}

export async function down({ context: _queryInterface }: Migration) {
  // No down migration - we don't want to revert this backfill because we cannot
  // reliably determine if the data had been edited after the fact
}

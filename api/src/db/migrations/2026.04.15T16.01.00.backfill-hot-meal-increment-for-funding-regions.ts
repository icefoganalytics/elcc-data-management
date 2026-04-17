import { QueryTypes, sql } from "@sequelize/core"

import { type Migration } from "@/db/umzug"

export async function up({ context: { sequelize } }: Migration) {
  await sequelize.query(
    sql`
      UPDATE funding_regions
      SET
        hot_meal_increment_amount = '32.0600'
      WHERE
        hot_meal_increment_amount = '0.0000'
    `,
    { type: QueryTypes.UPDATE }
  )
}

export async function down({ context: _queryInterface }: Migration) {
  // No down migration - we don't want to remove the backfilled data
}

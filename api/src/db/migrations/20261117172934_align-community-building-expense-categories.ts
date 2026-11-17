import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    UPDATE funding_regions
    SET subsidy_rate = 0.4300, updated_at = GETUTCDATE()
    WHERE region = N'Communities'
      AND deleted_at IS NULL
      AND subsidy_rate <> 0.4300
  `)

  await knex.raw(/* sql */ `
    UPDATE building_expense_categories
    SET subsidy_rate = 0.4300, updated_at = GETUTCDATE()
    FROM building_expense_categories
    INNER JOIN funding_regions
      ON funding_regions.id = building_expense_categories.funding_region_id
    WHERE funding_regions.region = N'Communities'
      AND funding_regions.deleted_at IS NULL
      AND building_expense_categories.deleted_at IS NULL
      AND building_expense_categories.subsidy_rate <> 0.4300
  `)

  await knex.raw(/* sql */ `
    INSERT INTO building_expense_categories (
      funding_region_id,
      category_name,
      subsidy_rate
    )
    SELECT
      communities.id,
      whitehorse_categories.category_name,
      0.4300
    FROM building_expense_categories AS whitehorse_categories
    INNER JOIN funding_regions AS whitehorse
      ON whitehorse.id = whitehorse_categories.funding_region_id
    CROSS JOIN funding_regions AS communities
    WHERE whitehorse.region = N'Whitehorse'
      AND whitehorse.deleted_at IS NULL
      AND whitehorse_categories.deleted_at IS NULL
      AND communities.region = N'Communities'
      AND communities.deleted_at IS NULL
      AND NOT EXISTS (
        SELECT 1
        FROM building_expense_categories AS existing_category
        WHERE existing_category.funding_region_id = communities.id
          AND existing_category.category_name = whitehorse_categories.category_name
          AND existing_category.deleted_at IS NULL
      )
  `)
}

export async function down(_knex: Knex): Promise<void> {
  console.warn(
    "Community building expense catalogue alignment is irreversible; restore a backup to recover prior catalogue rates and categories."
  )
}

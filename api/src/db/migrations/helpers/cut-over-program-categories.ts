import type { Knex } from "knex"

type ProgramCategoryTable =
  | "child_care_space_categories"
  | "administration_cost_categories"
  | "quality_enhancement_categories"
type CategorySource = {
  id: number
  fundingPeriodId: number
  childCareCategoryId: number | null
  childCareSpaceCategoryId: number | null
  categoryName: string
  fromAge: number | null
  toAge: number | null
  deletedAt: Date | null
}
type SharedCategory = {
  id: number
  fundingPeriodId: number
  categoryName: string
  fromAge: number | null
  toAge: number | null
  deletedAt: Date | null
}

export async function backfillProgramCategories(
  knex: Knex,
  tableName: ProgramCategoryTable
): Promise<void> {
  let lastId: number | undefined
  for (;;) {
    const query = knex(tableName)
      .select<CategorySource[]>([
        "id",
        "funding_period_id as fundingPeriodId",
        "child_care_category_id as childCareCategoryId",
        tableName === "child_care_space_categories"
          ? knex.raw("NULL AS childCareSpaceCategoryId")
          : "child_care_space_category_id as childCareSpaceCategoryId",
        "category_name as categoryName",
        "from_age as fromAge",
        "to_age as toAge",
        "deleted_at as deletedAt",
      ])
      .orderBy("id")
      .limit(100)
    if (lastId !== undefined) query.where("id", ">", lastId)
    const categories = await query
    if (categories.length === 0) break

    for (const category of categories) {
      await backfillCategory(knex, tableName, category)
      lastId = category.id
    }
  }
}

async function backfillCategory(
  knex: Knex,
  tableName: ProgramCategoryTable,
  category: CategorySource
): Promise<void> {
  let sharedCategoryId = category.childCareCategoryId
  if (category.childCareSpaceCategoryId !== null) {
    const linkedSpacesCategory = await knex("child_care_space_categories")
      .where("id", category.childCareSpaceCategoryId)
      .first<{
        fundingPeriodId: number
        childCareCategoryId: number | null
      }>(["funding_period_id as fundingPeriodId", "child_care_category_id as childCareCategoryId"])
    if (
      !linkedSpacesCategory ||
      linkedSpacesCategory.fundingPeriodId !== category.fundingPeriodId ||
      linkedSpacesCategory.childCareCategoryId === null
    ) {
      throw new Error(
        `Invalid Spaces category link on ${tableName} ${category.id}: ${category.childCareSpaceCategoryId}`
      )
    }
    if (
      sharedCategoryId !== null &&
      sharedCategoryId !== linkedSpacesCategory.childCareCategoryId
    ) {
      throw new Error(`Conflicting shared category identity on ${tableName} ${category.id}`)
    }
    sharedCategoryId = linkedSpacesCategory.childCareCategoryId
  }

  if (sharedCategoryId === null) {
    const existingCategory =
      category.deletedAt === null
        ? await sharedCategories(knex)
            .where({
              funding_period_id: category.fundingPeriodId,
              category_name: category.categoryName,
            })
            .whereNull("deleted_at")
            .first()
        : undefined
    if (existingCategory) {
      if (
        existingCategory.categoryName !== category.categoryName ||
        existingCategory.fromAge !== category.fromAge ||
        existingCategory.toAge !== category.toAge
      ) {
        throw new Error(
          `Ambiguous category metadata on ${tableName} ${category.id}: shared category ${existingCategory.id} has different names or ages`
        )
      }
      sharedCategoryId = existingCategory.id
    } else {
      const [insertedCategory] = await knex.raw<{ id: number }[]>(
        /* sql */ `
          INSERT INTO
            child_care_categories (
              funding_period_id,
              category_name,
              from_age,
              to_age,
              created_at,
              updated_at,
              deleted_at
            )
          OUTPUT
            inserted.id
          SELECT
            funding_period_id,
            category_name,
            from_age,
            to_age,
            created_at,
            updated_at,
            deleted_at
          FROM
            ??
          WHERE
            id = ?
        `,
        [tableName, category.id]
      )
      if (!insertedCategory) {
        throw new Error(`Could not preserve category identity for ${tableName} ${category.id}`)
      }
      sharedCategoryId = insertedCategory.id
    }
  }

  const sharedCategory = await sharedCategories(knex).where("id", sharedCategoryId).first()
  if (!sharedCategory || sharedCategory.fundingPeriodId !== category.fundingPeriodId) {
    throw new Error(
      `Shared category belongs to another funding period: ${tableName} ${category.id}`
    )
  }
  if (category.deletedAt === null) {
    const duplicateProgramCategory = await knex(tableName)
      .where({
        funding_period_id: category.fundingPeriodId,
        child_care_category_id: sharedCategoryId,
      })
      .whereNull("deleted_at")
      .whereNot("id", category.id)
      .first<{ id: number }>("id")
    if (duplicateProgramCategory) {
      throw new Error(
        `Duplicate active ${tableName} ${duplicateProgramCategory.id} and ${category.id} reference shared category ${sharedCategoryId}`
      )
    }
    if (sharedCategory.deletedAt !== null) {
      const activeNamesake = await sharedCategories(knex)
        .where({
          funding_period_id: category.fundingPeriodId,
          category_name: sharedCategory.categoryName,
        })
        .whereNull("deleted_at")
        .first()
      if (activeNamesake) {
        throw new Error(
          `Cannot activate shared category ${sharedCategoryId} for ${tableName} ${category.id}: active category ${activeNamesake.id} has the same name`
        )
      }
      await knex("child_care_categories").where("id", sharedCategoryId).update({ deleted_at: null })
    }
  }
  await knex(tableName)
    .where("id", category.id)
    .update({ child_care_category_id: sharedCategoryId })
}

function sharedCategories(knex: Knex) {
  return knex("child_care_categories").select<SharedCategory[]>([
    "id",
    "funding_period_id as fundingPeriodId",
    "category_name as categoryName",
    "from_age as fromAge",
    "to_age as toAge",
    "deleted_at as deletedAt",
  ])
}

export async function removeDuplicatedMetadata(
  knex: Knex,
  tableName: ProgramCategoryTable
): Promise<void> {
  const unresolvedCategory = await knex(tableName)
    .whereNull("child_care_category_id")
    .first<{ id: number }>("id")
  if (unresolvedCategory) {
    throw new Error(
      `Shared category identity is missing for ${tableName} ${unresolvedCategory.id}`
    )
  }

  await knex.schema.alterTable(tableName, (table) => {
    table.dropUnique(
      ["funding_period_id", "category_name"],
      `unique_${tableName}_on_funding_period_id_category_name`
    )
    if (tableName !== "child_care_space_categories") {
      table.dropForeign("child_care_space_category_id")
      table.dropColumn("child_care_space_category_id")
    }
    table.dropColumns("category_name", "from_age", "to_age")
    table.integer("child_care_category_id").notNullable().alter()
    table.unique(["funding_period_id", "child_care_category_id"], {
      indexName: `unique_${tableName}_on_funding_period_id_child_care_category_id`,
      predicate: knex.whereNull("deleted_at"),
    })
  })
}

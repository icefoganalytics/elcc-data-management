import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("centres", (table) => {
    table.increments("id").notNullable().primary()
    table.string("name", 100).notNullable()
    table.string("license", 100).notNullable()
    table.string("community", 100).notNullable()
    table.string("region", 100)
    table.string("status", 100).notNullable()
    table.boolean("hot_meal").notNullable()
    table.string("license_holder_name", 100)
    table.string("contact_name", 100)
    table.string("physical_address", 100)
    table.string("mailing_address", 100)
    table.string("email", 100)
    table.string("alt_email", 100)
    table.string("phone_number", 100)
    table.string("alt_phone_number", 100)
    table.string("fax_number", 100)
    table.string("vendor_identifier", 100)
    table.string("inspector", 100)
    table.string("neighborhood", 100)
    table.string("last_submission", 100)
    table.integer("licensed_for")
    table.integer("funding_region_id").references("id").inTable("funding_regions")
    table
      .specificType("created_at", "DATETIME2(0)")
      .notNullable()
      .defaultTo(knex.raw("GETUTCDATE()"))
    table
      .specificType("updated_at", "DATETIME2(0)")
      .notNullable()
      .defaultTo(knex.raw("GETUTCDATE()"))
    table.specificType("deleted_at", "DATETIMEOFFSET")
  })

  await knex.raw(
    "CREATE UNIQUE INDEX idx_centres_name_unique ON centres (name) WHERE deleted_at IS NULL"
  )
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("centres")
}

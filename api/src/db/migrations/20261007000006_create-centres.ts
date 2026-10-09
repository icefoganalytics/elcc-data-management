import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  if (await knex.schema.hasTable("centres")) return

  await knex.schema.createTable("centres", (table) => {
    table.increments("id").notNullable().primary()
    table.string("name", 200).notNullable()
    table.string("license", 255)
    table.string("community", 255).notNullable()
    table.string("status", 255).notNullable()
    table.boolean("hot_meal").notNullable().defaultTo(0)
    table.integer("licensed_for")
    table.date("last_submission")
    table.specificType("created_at", "DATETIME2").notNullable().defaultTo(knex.raw("GETUTCDATE()"))
    table.specificType("updated_at", "DATETIME2").notNullable().defaultTo(knex.raw("GETUTCDATE()"))
    table.string("license_holder_name", 100)
    table.string("contact_name", 100)
    table.string("physical_address", 250)
    table.string("mailing_address", 250)
    table.string("email", 100)
    table.string("alt_email", 100)
    table.string("phone_number", 20)
    table.string("alt_phone_number", 20)
    table.string("fax_number", 20)
    table.string("vendor_identifier", 20)
    table.boolean("is_first_nation_program").notNullable().defaultTo(0)
    table.string("inspector_name", 100)
    table.string("neighborhood", 100)
    table.decimal("building_usage_percent", 5, 2).notNullable().defaultTo(100)
    table.integer("funding_region_id").notNullable()
    table.specificType("deleted_at", "DATETIMEOFFSET")

    table
      .foreign("funding_region_id", "centres_funding_region_id_funding_regions_fk")
      .references("funding_regions.id")
  })
}

export async function down(_knex: Knex): Promise<void> {
  throw new Error("The centres baseline cannot be rolled back.")
}

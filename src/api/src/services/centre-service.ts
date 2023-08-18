import { db } from "../data"
import { type Centre } from "../data/models"
import { type GenericService } from "./generic-service"

const SCHEMA = "dbo"
const TABLE = "centres"

export class CentreService implements GenericService<Centre> {
  async getAll(): Promise<Centre[]> {
    return await db.withSchema(SCHEMA).from(TABLE)
  }

  async create(item: Centre): Promise<any> {
    const result = await db(TABLE).withSchema(SCHEMA).insert(item).returning("*")
    return result[0]
  }

  async update(id: number, item: Centre): Promise<any> {
    const result = await db(TABLE)
      .withSchema(SCHEMA)
      .where({ id })
      .update(cleanForUpdate(item))
      .returning("*")
    return result[0]
  }

  async updateDate(id: number, date: Date): Promise<any> {
    return await db(TABLE)
      .withSchema(SCHEMA)
      .where({ id })
      .update({ last_submission: date })
      .returning("*")
  }

  async delete(id: number): Promise<any> {
    return await db(TABLE).withSchema(SCHEMA).where({ id }).del()
  }

  async get(id: number): Promise<Centre> {
    return await db(TABLE).withSchema(SCHEMA).where({ id }).first()
  }
}

function cleanForUpdate(i: any) {
  return {
    name: i.name,
    license: i.license,
    community: i.community,
    status: i.status,
    hot_meal: i.hot_meal,
    licensed_for: i.licensed_for,
    last_submission: i.last_submission,
  }
}

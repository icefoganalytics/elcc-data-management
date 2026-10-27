import FactoryShark from "factory-shark"
import { faker } from "@faker-js/faker"

import { User } from "@/models"
import { UserStatus } from "@/models/user"

export const userFactory = FactoryShark.define<User>(User, ({ sequence }) => {
  const email = `${faker.internet.email()}-${sequence}`
  const sub = faker.string.uuid()
  const firstName = faker.person.firstName()
  const lastName = faker.person.lastName()
  const status = faker.helpers.objectValue(UserStatus)

  return {
    email,
    sub,
    firstName,
    lastName,
    status,
  }
})

export default userFactory

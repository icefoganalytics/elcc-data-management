import FactoryShark, { type GeneratorFn } from "factory-shark"
import { faker } from "@faker-js/faker"

import { User } from "@/models"
import { UserStatus } from "@/models/user"

class UserFactory extends FactoryShark<User> {
  constructor(generator: GeneratorFn<User>) {
    super(User, generator, {})
  }

  asSystemAdministrator() {
    return this.params({ roles: [User.Roles.SYSTEM_ADMINISTRATOR] })
  }
}

export const userFactory = new UserFactory(({ sequence }) => {
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

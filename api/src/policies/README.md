# Policies

→ **Copy-paste template:** [`agents/templates/backend/policy.md`](../../../agents/templates/backend/policy.md)

## Conventions

- **Modern pattern:** extend `PolicyFactory(ModelClass)` and implement `policyScope()` for new/updated policies.
- **Legacy pattern:** manual `applyScope()` (being phased out).
- Use `ALL_RECORDS_SCOPE` constant for admin users with early returns.
- Use `permittedAttributes()` — not `permittedAttributesForUpdate()`.
- Role checks: use `user.isSystemAdmin` directly.
- Compose scopes by storing parent policy scope in a variable and spreading.

---

Policies are used to control access to data in a controller, before it is returned to the client.
Polices can be used in the following ways:

1. Build a policy instance and check the controller action matching boolean function.
   Controller#update -> Policy#update

   ```ts
   export class CentresController extends BaseController {
     async update() {
       const centre = await this.loadCentre()
       if (isNil(centre)) {
         return this.response.status(404).json({ message: "Centre not found." })
       }

       const policy = this.buildPolicy(centre)
       if (!policy.update()) {
         return this.response
           .status(403)
           .json({ message: "You are not authorized to update this centre." })
       }

       const permittedAttributes = policy.permitAttributesForUpdate(this.request.body)
       try {
         const updatedCentre = await UpdateService.perform(
           centre,
           permittedAttributes,
           this.currentUser
         )
         return this.response.status(200).json({ centre: updatedCentre })
       } catch (error) {
         return this.response.status(422).json({ message: `Centre update failed: ${error}` })
       }
     }

     private async loadCentre(): Promise<Centre | null> {
       return Centre.findByPk(this.params.centreId)
     }

     private buildPolicy(centre: Centre) {
       return new CentrePolicy(this.currentUser, centre)
     }
   }
   ```

2. The previous example also demonstrates a second way of using policies. The "permitted attributes" pattern. A policy can also be used to provide an "allow list" of attributes that a user is allowed to submit for a given controller action.

   ```ts
   export class CentrePolicy extends BasePolicy<Centre> {
     permittedAttributes(): Path[] {
       return ["name", "fundingRegionId", "hotMeal"]
     }
   }
   ```

3. Policies can also be used to restrict the results of an "index" or list action in a controller.
   In this case a bunch of scoping conditions are built up, and then passed to the "apply scope" function. This produces a query that, when executed, will only return the records that the current user is allowed to see.

   ```ts
   export class CentresController extends BaseController<Centre> {
     async index() {
       const where = this.buildWhere()
       const scopes = this.buildFilterScopes()
       const scopedCentres = CentrePolicy.applyScope(scopes, this.currentUser)

       const totalCount = await scopedCentres.count({ where })
       const centres = await scopedCentres.findAll({
         where,
         limit: this.pagination.limit,
         offset: this.pagination.offset,
       })

       return this.response.json({ centres, totalCount })
     }
   }
   ```

## Policy#policyScope

The `policyScope` method is used to add a scope to the given model. This scope is permanently added to the model, though it likely shouldn't be used outside of the policy.

i.e.

```ts
export class CentrePolicy extends PolicyFactory(Centre) {
  static policyScope(user: User): FindOptions<Attributes<Centre>> {
    if (user.isSystemAdmin || user.isBusinessAnalyst) {
      return {}
    }

    if (user.isDataOwner) {
      return {
        include: [
          {
            association: "fundingRegion",
            where: {
              ownerId: user.id,
            },
          },
        ],
      }
    }

    return {
      where: {
        requestorId: user.id,
      },
    }
  }
}
```

can be considered equivalent to

```ts
Centre.addScope("policyScope", (user: User) => {
  if (user.isSystemAdmin || user.isBusinessAnalyst) {
    return {}
  }

  if (user.isDataOwner) {
    return {
      include: [
        {
          association: "fundingRegion",
          where: {
            ownerId: user.id,
          },
        },
      ],
    }
  }

  return {
    where: {
      requestorId: user.id,
    },
  }
})
```

# Full Example

Here is a simple example of a controller using a policy to control access to a resource.
The full cases might be more complex, but the "policy" pattern leaves space for that complexity to exist without cluttering the controller.

```ts
export class CentresController extends BaseController<Centre> {
  async index() {
    const where = this.buildWhere()
    const scopes = this.buildFilterScopes()
    const scopedCentres = CentrePolicy.applyScope(scopes, this.currentUser)

    const totalCount = await scopedCentres.count({ where })
    const centres = await scopedCentres.findAll({
      where,
      limit: this.pagination.limit,
      offset: this.pagination.offset,
    })

    return this.response.json({ centres, totalCount })
  }

  async create() {
    const centre = await this.buildCentre()
    if (isNil(centre)) {
      return this.response.status(404).json({ message: "Funding region not found." })
    }

    const policy = this.buildPolicy(centre)
    if (!policy.create()) {
      return this.response
        .status(403)
        .json({ message: "You are not authorized to create centres for this funding region." })
    }

    const permittedAttributes = policy.permitAttributesForCreate(this.request.body)
    try {
      const centre = await CreateService.perform(permittedAttributes, this.currentUser)
      return this.response.status(201).json({ centre })
    } catch (error) {
      return this.response.status(422).json({ message: `Centre creation failed: ${error}` })
    }
  }

  async update() {
    const centre = await this.loadCentre()
    if (isNil(centre)) {
      return this.response.status(404).json({ message: "Centre not found." })
    }

    const policy = this.buildPolicy(centre)
    if (!policy.update()) {
      return this.response
        .status(403)
        .json({ message: "You are not authorized to update this centre." })
    }

    const permittedAttributes = policy.permitAttributesForUpdate(this.request.body)
    try {
      const updatedCentre = await UpdateService.perform(
        centre,
        permittedAttributes,
        this.currentUser
      )
      return this.response.status(200).json({ centre: updatedCentre })
    } catch (error) {
      return this.response.status(422).json({ message: `Centre update failed: ${error}` })
    }
  }

  private async buildCentre(): Promise<Centre> {
    return Centre.build(this.request.body)
  }

  private async loadCentre(): Promise<Centre | null> {
    return Centre.findByPk(this.params.centreId)
  }

  private buildPolicy(centre: Centre) {
    return new CentrePolicy(this.currentUser, centre)
  }
}
```

and the policy

```ts
export class CentrePolicy extends BasePolicy<Centre> {
  create(): boolean {
    // some code that might returns true
    return false
  }

  update(): boolean {
    // some code that might returns true
    return false
  }

  destroy(): boolean {
    // some code that might returns true
    return false
  }

  permittedAttributes(): Path[] {
    return ["name", "fundingRegionId", "hotMeal"]
  }

  permittedAttributesForCreate(): Path[] {
    return ["fundingRegionId", ...this.permittedAttributes()]
  }
}
```

# Model Template

**Location:** `api/src/models/{resource-name}.ts`

## Template

```typescript
import {
  DataTypes,
  Op,
  sql,
  where,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from "@sequelize/core"
import {
  Attribute,
  AutoIncrement,
  Default,
  NotNull,
  PrimaryKey,
} from "@sequelize/core/decorators-legacy"

import BaseModel from "@/models/base-model"

export class ResourceName extends BaseModel<
  InferAttributes<ResourceName>,
  InferCreationAttributes<ResourceName>
> {
  @Attribute(DataTypes.INTEGER)
  @PrimaryKey
  @AutoIncrement
  declare id: CreationOptional<number>

  @Attribute(DataTypes.STRING(200))
  @NotNull
  declare name: string

  @Attribute(DataTypes.TEXT)
  @NotNull
  declare description: string

  @Attribute(DataTypes.DECIMAL(10, 2))
  @NotNull
  declare amount: string

  @Attribute(DataTypes.BOOLEAN)
  @Default(false)
  declare isActive: CreationOptional<boolean>

  // Timestamps
  declare createdAt: CreationOptional<Date>
  declare updatedAt: CreationOptional<Date>
  declare deletedAt: CreationOptional<Date>

  // Associations
  // Add relationship decorators and declarations for this model.

  // Scopes
  static establishScopes() {
    this.addSearchScope(["name"])

    this.addScope("active", {
      where: {
        isActive: true,
      },
    })

    this.addScope("byName", (name: string) => {
      const namePattern = `%${name}%`

      return {
        where: where(sql.fn("LOWER", sql.attribute("name")), Op.like, namePattern),
      }
    })
  }

  // Getters
  get displayName(): string {
    return `${this.name} - ${this.amount}`
  }

  // Instance methods
  activate(): void {
    this.isActive = true
  }

  deactivate(): void {
    this.isActive = false
  }

  // Static methods
  static async findActiveByName(name: string): Promise<ResourceName | null> {
    return this.findOne({
      where: {
        name,
        isActive: true,
      },
    })
  }
}

export default ResourceName
```

## Integration

1. Import the model in `api/src/models/index.ts`:

   ```typescript
   import ResourceName from "@/models/resource-name"
   ```

2. Add `ResourceName` to the existing `db.addModels([...])` list.

3. Call `ResourceName.establishScopes()` after that list.

4. Export the model:

   ```typescript
   export { ResourceName }
   ```

5. Create migration:

   ```bash
   ./bin/dev migrate make create-resource-names
   ```

6. Add associations in related models.

## Verification Checklist

- [ ] Extends BaseModel with proper generics
- [ ] All required fields have @NotNull decorator
- [ ] Optional fields use CreationOptional type
- [ ] Proper DataTypes for all fields (DECIMAL for financial values)
- [ ] Timestamps and paranoid mode inherited from BaseModel
- [ ] Required associations use appropriate decorators
- [ ] Scopes defined in `static establishScopes()`
- [ ] Getters for computed properties
- [ ] Instance methods for business logic
- [ ] Static methods for common queries
- [ ] Proper imports and exports

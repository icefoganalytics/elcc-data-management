# Model Template

**Location:** `api/src/models/{resource-name}.ts`

## Template

```typescript
import {
  DataTypes,
  Op,
  sql,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
  type NonAttribute,
} from "@sequelize/core"
import {
  Attribute,
  AutoIncrement,
  Default,
  HasMany,
  Index,
  NotNull,
  PrimaryKey,
} from "@sequelize/core/decorators-legacy"

import { arrayWrap } from "@/utils/array-wrap"

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
  @HasMany(() => RelatedModel, "resourceNameId")
  declare relatedModels: NonAttribute<RelatedModel[]>

  // Scopes
  static scopes = {
    active: {
      where: {
        isActive: true,
      },
    },
    byName(name: string) {
      return {
        where: {
          name: {
            [Op.iLike]: `%${name}%`,
          },
        },
      }
    },
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

  static async findWithRelated(id: number): Promise<ResourceName | null> {
    return this.findByPk(id, {
      include: [
        {
          association: "relatedModels",
        },
      ],
    })
  }
}
```

## Integration

1. Add to `api/src/models/index.ts`:
   ```typescript
   export { ResourceName } from "./resource-name"
   ```

2. Create migration:
   ```bash
   dev migrate make create-resource-names-table
   ```

3. Add associations in related models.

## Verification Checklist

- [ ] Extends BaseModel with proper generics
- [ ] All required fields have @NotNull decorator
- [ ] Optional fields use CreationOptional type
- [ ] Proper DataTypes for all fields (DECIMAL for financial values)
- [ ] Timestamps and paranoid mode inherited from BaseModel
- [ ] Associations properly decorated with @HasMany/@BelongsTo
- [ ] Scopes defined in static scopes object
- [ ] Getters for computed properties
- [ ] Instance methods for business logic
- [ ] Static methods for common queries
- [ ] Proper imports and exports

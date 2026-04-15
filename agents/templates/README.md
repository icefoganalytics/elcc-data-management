# Templates

Reusable code templates for the ELCC Data Management system.

## Intent

Templates provide copy-paste-ready code patterns that multiple workflows can reference. They are not standalone workflows but building blocks.

## Structure

```
templates/
  backend/
    model.md                    # Sequelize model with scopes
    controller.md               # CRUD controller with error handling
    policy.md                   # Authorization with PolicyFactory
    services.md                 # Create, Update, Destroy services
    serializers.md              # Index, Show, Reference serializers
  frontend/
    api-client.md               # Type-safe HTTP client
    composables.md              # Reactive data fetching (list/single)
    components.md               # DataTable, Forms, UniqueTextField
    pages.md                    # List, New, Edit pages
    searchable-autocomplete.md  # Debounced search with pagination
  filter-searchable-autocomplete.md  # Dashboard filter autocomplete wrapper
```

## Usage

Templates are referenced by workflows. See:
- [create-admin-ui](../workflows/create-admin-ui/) - Full CRUD admin interface

Each template file contains:
1. Location path for the new file
2. Complete, copy-paste-ready code
3. Integration instructions (exports, routes, etc.)
4. Checklist for verification

## Naming Conventions

Replace these placeholders in templates:

| Placeholder | Example | Notes |
|-------------|---------|-------|
| `ResourceName` | `FundingRegion` | PascalCase singular |
| `resourceName` | `fundingRegion` | camelCase singular |
| `ResourceNames` | `FundingRegions` | PascalCase plural |
| `resourceNames` | `fundingRegions` | camelCase plural |
| `resource-name` | `funding-region` | kebab-case singular |
| `resource-names` | `funding-regions` | kebab-case plural |

---

**Reference Implementation:** Funding Regions and Centres

**Last Updated:** 2026-04-15

# Controllers

Controllers adapt authenticated HTTP requests to application operations:

```text
Route -> Controller -> Policy -> Service -> Model -> Serializer -> Response
```

Use the [Express Light Rail workflow](skill://express-light-rail/workflow.md) for shared backend feature guidance. This README records the ELCC-specific controller boundary.

## ELCC conventions

- Extend `BaseController<Model>` for model-backed controllers and implement instance action methods.
- Build list-query filters, scopes, ordering, and pagination in the controller; apply the resource policy scope and authorization checks there before calling services.
- Construct policies in a private `buildPolicy` helper and call it from actions.
- Use serializers to shape response bodies. Keep persistence and multi-step business logic in services.
- Prefer namespaced CRUD-style controllers over custom action methods on large resource controllers, such as `Forms.Estimates.GenerateController.create` rather than `FormsController.generateEstimates`.

These conventions reflect `BaseController` and the existing resource controllers. The shared workflow remains the source for other backend feature decisions.

# Technical Specification

## Summary

[Briefly describe the technical approach for the solution. Summarize the main architectural decisions and implementation strategy in one or two paragraphs.]

## System architecture

### Component overview

[Briefly describe the main components and list every new or modified component:

- Component names and primary responsibilities
- Main relationships between components
- High-level data flow]

## Implementation design

### Primary interfaces

[If applicable, define the main service interfaces, following the project's conventions and language, with no more than 20 lines per example:

```
ServiceName
  methodName(input) -> output
```

]

### Data models

If applicable, document **each** entity or contract using the model below: its own subsection, a field table, and a representative example in the format used by the project. Variants, degradations, error envelopes, mappings, and fixed parameters must have their own blocks, as shown.

If there are JSON contracts between the backend and UI, they must be ready for display. [Complete the context specific to the feature. Fields missing at the source must be normalized to `null` when that is the project convention.]

#### `[TypeName]` - [short description]

| Field     | Type     | Required | Description   |
| --------- | -------- | -------- | ------------- |
| `[field]` | `[type]` | yes/no   | [Description] |

```text
{
  "[field]": "[realistic value]"
}
```

[Repeat the pattern above for every primary entity or contract: aggregate payload, input types, error types, and so on.]

> **[Variant/degradation, if applicable]:** [Explain when it occurs and its impact on the payload.]

```text
{
  "[affected_section]": null
}
```

#### `[ErrorName]` - error envelope (if applicable)

| Code     | HTTP       | Meaning      |
| -------- | ---------- | ------------ |
| `[code]` | `[status]` | [Description] |

```text
{
  "error": {
    "code": "[code]",
    "message": "[message in English or the project's standard language]"
  }
}
```

#### [External source] to contract mapping (if applicable)

| Source ([API/source]) | Destination (contract) |
| --------------------- | ---------------------- |
| `[source_field]`      | `[destination_field]`  |

#### Fixed parameters at the source (if applicable)

| API               | Main parameters                 |
| ----------------- | ------------------------------- |
| **[API name]**    | `[param1=value]`, `[param2=value]` |

[If applicable, document database schemas using the same pattern: subsection, table, and JSON or SQL example.]

### API endpoints (if applicable)

If the feature exposes or consumes an API, document **each** endpoint using the model below and cover all relevant scenarios: success, empty list, validation error, source error, and partial degradation. Record non-obvious behavior in a blockquote (`>`). For payloads already documented under Data models, reference the existing example instead of duplicating it.

#### Overview

| Method           | Route           | Description         |
| ---------------- | --------------- | ------------------- |
| `[GET/POST/...]` | `[/api/...]`    | [Brief description] |

---

#### `[METHOD] [/api/route]`

[Brief description of the endpoint's purpose.]

**Query parameters** (or **body** for POST/PUT/PATCH)

| Parameter | Type     | Default           | Rules                |
| --------- | -------- | ----------------- | -------------------- |
| `[param]` | `[type]` | `[default or -]`  | [Validations and rules] |

**Responses**

| Status  | Body            | When                          |
| ------- | --------------- | ----------------------------- |
| `[200]` | `[ResponseType]` | [Success condition]           |
| `[400]` | `[ErrorType]`    | [Validation error condition]  |
| `[502]` | `[ErrorType]`    | [Source failure condition]    |

**Example - success**

```http
[METHOD] /api/route?param=value
```

```text
{
  "[field]": "[realistic value]"
}
```

**Example - [alternative scenario, for example, no matches]**

```http
[METHOD] /api/route?param=value
```

```text
{
  "[body]": []
}
```

> [Note about frontend/client behavior, if applicable.]

**Example - [error scenario]**

```http
[METHOD] /api/route
```

```text
{
  "error": {
    "code": "[code]",
    "message": "[message]"
  }
}
```

[Repeat the pattern above for every endpoint, separating them with `---`.]

---

## Integration points

[Include only if the feature requires external integrations:

- External services or APIs
- Authentication requirements
- Error-handling strategy]

## Testing approach

Define the testing strategy applicable to the feature and give each case a stable identifier. Use `UT-*` for unit tests, `IT-*` for integration tests, and `E2E-*` for E2E tests. Associate each case with the acceptance criteria (`AC-*`) it verifies. Record any layer that does not apply as not applicable.

### Unit tests (if applicable)

| ID     | Test case name        | Acceptance criteria | Expected result     |
| ------ | --------------------- | ------------------- | ------------------- |
| UT-01  | [test case name]      | [AC-01]             | [expected result]   |

[Detail the unit testing strategy:

- Main components to test
- Use mocks only for external services
- Critical test scenarios]

### Integration tests (if applicable)

| ID     | Test case name        | Acceptance criteria | Expected result     |
| ------ | --------------------- | ------------------- | ------------------- |
| IT-01  | [test case name]      | [AC-01]             | [expected result]   |

[If necessary, detail:

- Components to test together
- Test data requirements]

### E2E tests (if applicable)

| ID     | Test case name        | Acceptance criteria | Expected result     |
| ------ | --------------------- | ------------------- | ------------------- |
| E2E-01 | [test case name]      | [AC-01]             | [expected result]   |

[If necessary, describe how to test the UI together with the involved services using the browser tool available in the environment.]

## Development sequencing

### Build order

[Describe the implementation sequence:

1. First component/feature (why first)
2. Second component/feature (dependencies)
3. Remaining components
4. Integration and testing]

### Technical dependencies

[List blockers and technical dependencies:

- Required infrastructure
- Availability of external services]

## Monitoring and observability

[Describe the monitoring approach using the project's existing infrastructure:

- Metrics or health checks to expose
- Main events to log and their levels]

## Technical considerations

### Key decisions

[Record the key technical decisions:

- Chosen approach and rationale
- Considered trade-offs
- Rejected alternatives and reasons]

### Known risks

[List technical risks:

- Potential challenges
- Mitigation approaches
- Areas requiring research]

### Compliance with AGENTS.md and the rules

[Confirm that `AGENTS.md` and every rule in `.agents/rules/` were read. Record the constraints and relevant decisions for this specification.]

### Skill compliance

[List only the project skills (`.agents/skills`) applicable to this specification.]

### Relevant and dependent files

[List relevant and dependent files.]

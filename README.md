# Credit Rule Engine — Challenge

## Summary

This repository contains a configurable credit decision rule engine designed to let domain experts define, test, and evolve credit rules without writing code. The system supports:
- CRUD for Facts, Rules, and Outcomes
- A visual builder to compose rule conditions
- A test-run engine that evaluates rules against test cases and records actual outputs and engine errors
- Import/export flows for rules, facts, and test-cases to aid migrations and QA

The project is organized as a Next.js app with server-side API routes that persist domain objects to a Postgres database. The core rule execution logic lives in `src/lib/rule-engine.ts` and supporting utilities under `src/lib/`.

## Schema setup and run guide (Supabase SQL editor)

If you use Supabase, you can create the schema directly in the Supabase SQL editor without running Postgres locally.

1. Open your Supabase project and go to the **SQL Editor**.
2. Create a new query and paste the contents of `supabase/schema.sql` into the editor.
3. Run the query to create the database schema.

Notes:
- The SQL editor runs the DDL directly against your Supabase Postgres instance, so there is no local DB setup required.
- Ensure you are connected to the correct project and have sufficient privileges before running schema or seed scripts.

## Tech stack

- Frontend: Next.js (app dir), React, TypeScript
- Styling: Tailwind CSS and PostCSS
- Backend: Next.js server routes for API endpoints
- Database: Postgres (SQL schema in `supabase/schema.sql`)
- Dev tooling: npm

## Design choices, assumptions, and limitations

- Design choices:
  - Use Next.js server routes for API endpoints to keep frontend/backend in a single repo and simplify deployment.
  - Keep domain logic (rule execution) in `src/lib/rule-engine.ts` so it is reusable from the API and potential background workers.
  - Represent dynamic facts as functions that can be resolved at runtime (`src/lib/dynamic-facts.ts`) to allow external lookups (e.g., FX rates, holidays).
  - Use simple JSON shapes for `test_cases.actual_output` to persist engine outputs and errors for debugging and historical analysis.

- Assumptions:
  - Consumers will run Postgres locally or use a hosted DB; credentials are not hard-coded.
  - The visual builder stores rule condition trees in a JSON-friendly structure that the engine can traverse deterministically.
  - Dynamic facts may require network calls; the current design expects those functions to be synchronous or wrapped to return promise-compatible values.

- Limitations:
  - This prototype focuses on clarity and developer ergonomics, not production hardening (no RBAC, rate-limiting, or multi-tenant isolation built-in).
  - Concurrency and long-running executions are not optimized; large rule-sets may need background worker support.
  - No automatic migrations system included; schema updates require manual SQL changes.

## Facts module — usage guide and features

The Facts module is the single source of truth for all input data used by the rule engine. Facts can be static values, derived from other facts, or resolved dynamically at runtime via functions.

How to use the Facts UI:
- **List view**: Browse existing facts, search by name, and filter by type (static, derived, dynamic).
- **Create new fact**: Click **New Fact**, fill the form fields (name, type, data type, description), provide a default value or expression, and save.
- **Edit fact**: From the list view or fact detail page, click **Edit** to change its definition or default value.
- **Delete fact**: Use the delete action on a fact to remove it; rules referencing the fact will not be automatically updated.
- **Import/Export**: Use the import/export flows to migrate facts between environments.

Fact types and behavior:
- **Static fact**: A value stored directly in the database and returned as-is during engine execution.
- **Derived fact**: Defined by an expression or formula that references other facts; evaluated by the engine at run-time.
- **Dynamic fact**: Resolved by a runtime function (see `src/lib/dynamic-facts.ts`) which can perform external lookups (e.g., FX rates, holidays). Dynamic facts may be asynchronous.

Features available in the Facts module:
- Create, read, update, delete (CRUD) facts
- Search and filtering in the facts list
- Import/Export facts via CSV/JSON
- Support for static, derived, and dynamic facts
- Field-level validation (type checking and required fields) in the `FactForm` component
- Inline usage hints and descriptions for each fact to aid rule authors
- Versioning note: Facts are not versioned in this prototype; changing a fact immediately affects subsequent rule runs
 
## Rules module — usage guide and features

Rules are the business logic that map facts to outcomes. The Rules module supports authoring, testing, and organizing rule sets using both a visual builder and a JSON representation.

How to use the Rules UI:
- **List view**: Browse rules, filter by status or outcome, and search by name or tag.
- **Create rule**: Click **New Rule**, provide metadata (name, description, priority, active flag), then define conditions using the visual builder or JSON editor.
- **Edit rule**: Update metadata, adjust conditions, or change outcomes. Edits are saved immediately to the database.
- **Duplicate / Version**: Use duplication to create rule variants; the system does not auto-version rules on edit.
- **Enable/Disable**: Toggle a rule's `active` flag to include/exclude it from execution without deleting it.

Rule condition types and behavior:
- **Simple condition**: Compare a fact to a constant using operators (==, !=, >, <, in, not in, etc.).
- **Composite condition**: Combine conditions with logical operators (AND, OR, NOT) to form a tree that the engine evaluates.
- **Condition actions**: Assign outcomes or set derived facts when conditions match.

Features available in the Rules module:
- Create, read, update, delete (CRUD) rules
- Visual rule builder (`src/components/builder/RuleConditionBuilder.tsx`) for building condition trees
- JSON editor view for advanced authors who prefer direct JSON rule definitions
- Rule prioritization and activation toggles
- Import/Export of rules for migration and bulk edits
- Inline test-run integration to validate a rule against selected test-cases or facts

## Outcomes module — usage guide and features

Outcomes represent decisions or actions that result from rule evaluation (e.g., Approve, Review, Reject, SetLimit). The Outcomes module centralizes these results and allows mapping of rules to outcomes.

How to use the Outcomes UI:
- **List view**: View existing outcomes, search by name, and filter by category.
- **Create outcome**: Click **New Outcome**, provide a name, description, and optional metadata (priority, color tag), then save.
- **Edit outcome**: Update outcome metadata or associated labels.
- **Delete outcome**: Remove an outcome; rules referencing removed outcomes will show invalid references and should be updated.

Outcome behavior and usage:
- Outcomes are lightweight objects used by rules to communicate decisions to downstream systems.
- Outcomes may carry metadata used for UI display, reporting, or downstream integration (e.g., code, category, weighting).

Features available in the Outcomes module:
- Create, read, update, delete (CRUD) outcomes
- Search and filtering in the outcomes list
- Metadata fields for display and downstream integration
- Import/Export outcomes via CSV/JSON
- Simple validation to ensure unique outcome identifiers

## Builder / Visual Editor — usage guide and features

The visual builder is a drag-and-drop and form-driven interface for composing rule condition trees. It is useful for non-technical domain experts to create readable, testable rule logic without writing JSON.

How to use the Builder UI:
- **Open builder**: From a rule's edit page, click the visual builder to launch the canvas.
- **Add condition nodes**: Add comparison nodes (fact/operator/value)
- **Switch to JSON**: Use the JSON editor toggle to inspect or copy the underlying rule representation.
- **Preview & test**: Run test-cases to validate the condition tree.

Features available in the Builder:
- Drag-and-drop condition node creation and reordering
- Support for all operator types defined in `src/lib/operators.ts`
- Inline validation to ensure node completeness and type-correctness
- Persist condition trees as JSON that the engine can evaluate deterministically
- Accessibility considerations: keyboard navigation between nodes and explicit focus styles

## Test Cases module — usage guide and features

The Test Cases module allows authors to define concrete input sets and expected outcomes to validate rule behavior and regression test the engine.

How to use the Test Cases UI:
- **List view**: Browse test-cases, filter by status (passing/failed), and search by name.
- **Create test case**: Click **New Test Case**, provide a name, description, define input facts (overrides), and specify expected outcomes or assertions.
- **Run test case**: Execute a single test case or run a suite; results show actual outputs, resolved facts, and any engine errors.
- **Bulk run**: Run multiple test-cases and export a consolidated report.
- **Import/Export**: Import test-cases from JSON/CSV and export results for CI or analysis.

Test case structure and behavior:
- **Input facts**: Provide explicit values or overrides for facts the engine should use during the run.
- **Expected outcomes**: Define the expected outcome(s) or assertions for the run; the engine compares these to actual outputs.
- **Actual output**: Stored as structured JSON in `test_cases.actual_output` and includes resolved facts, chosen outcomes, and engine errors.

Features available in the Test Cases module:
- Create, read, update, delete (CRUD) test-cases
- Execute single or batch runs and view detailed results
- Persist run history with timestamps and actual outputs for auditing and debugging
- Export run results for CI integration or manual review
- Integration with the inline rule test-run for targeted debugging

### Test Cases — Errors page

There is a dedicated errors view (`/test-cases/errors`) that surfaces historical engine failures captured during test runs. Use it to triage rule execution issues and inspect resolved dynamic facts.

What the errors page shows:
- **Test case reference**: Link to the test-case that produced the error
- **Timestamp and run id**: When the run occurred and a unique identifier for the execution
- **Engine error details**: Structured error messages and stack traces when available
- **Resolved facts snapshot**: The values used during the failing run, including resolved dynamic facts
- **Actual outcomes**: Outcomes chosen by the engine during the failing run

How to use the errors view:
- Filter by rule, test-case, date range, or error type to narrow results
- Click a row to open a detailed modal that shows the full `actual_output` JSON and replay inputs
- Use the resolved facts to reproduce the failure locally or in a CI job
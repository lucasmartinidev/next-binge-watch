# Testing Rules

These rules apply to the frontend, backend, and project E2E tests.

## Required Coverage

<critical>**All code must be covered by automated tests. This is a critical rule and must not be ignored.**</critical>

The minimum required coverage is 80%. Coverage percentage is not the only quality criterion: tests must validate relevant behavior, requirements, and scenarios with meaningful assertions or expects.

Prioritize code with the highest business risk. For example, checkout is more critical than creating a product category and should receive deeper testing, including success, failure, boundary, and recovery scenarios.

Do not increase coverage solely to reach the minimum percentage. Code without meaningful behavior should not receive artificial tests, and critical code must not remain untested just because overall coverage has already reached the threshold.

## FIRST Principle

Tests should follow the FIRST principle. The Timely aspect may be ignored in this project.

### Fast

Tests should run quickly. Prioritize unit tests and avoid slow external dependencies such as networks, real databases, queues, and third-party services.

Use stubs to replace dependencies whose execution is not relevant to the behavior under test.

```ts
const paymentGateway = {
  authorize: async () => ({ authorized: true }),
};

const result = await checkoutService.checkout(order, paymentGateway);

expect(result.status).toBe('approved');
```

### Independent

Each test must be independent of the others. A test must not rely on execution order, state created by another test, or shared data that can be changed.

Prepare required data inside each test or in isolated setup. If one test fails, the others must still be able to report their own results.

```ts
it('calculates shipping for a valid order', () => {
  const order = makeOrder({ total: 100 });

  expect(calculateShipping(order)).toBe(10);
});
```

### Repeatable

Repeated test runs must always produce the same results. Do not depend on the current time, random numbers, external calls, or mutable data.

Use mocks to control the clock, random generators, and responses from external APIs.

```ts
vi.setSystemTime(new Date('2026-01-15T12:00:00.000Z'));

expect(createExpirationDate()).toEqual(new Date('2026-01-16T12:00:00.000Z'));
```

Restore mocks and spies after each test to prevent state from leaking between cases.

### Self-validated

Each test must detect behavioral failures. Tests that only execute code, check coverage, or lack meaningful assertions are not sufficient.

Validate the return value, final state, side effects, and relevant interactions with dependencies. An assertion must represent a requirement of the behavior under test.

```ts
it('rejects checkout when the order has no items', async () => {
  const result = await checkoutService.checkout({ items: [] });

  expect(result).toEqual({
    status: 'rejected',
    reason: 'ORDER_EMPTY',
  });
});
```

## Test Structure

Use one of these structures and keep each test clear and focused:

- Given/When/Then: context, action, and expected result.
- AAA (Arrange/Act/Assert): setup, execution, and verification.

Each test should verify one concept or behavior. Do not combine different requirements in the same case. Prefer several small, expressive tests over one test with many possible reasons to fail.

```ts
it('returns an error when the email is invalid', () => {
  const input = { email: 'invalid' };

  const result = validateUser(input);

  expect(result).toEqual({ valid: false, error: 'INVALID_EMAIL' });
});
```

Test names should describe the observed requirement, including the condition and expected result. Avoid generic names such as `should work` or `service test`.

## Test Creation Order

For efficient results, create tests in this order:

1. Identify requirements and rank flows by business risk and impact.
2. Start with critical backend and frontend business rules, beginning with unit tests.
3. Add unit tests for validation, error states, boundaries, and data transformations.
4. Create integration tests for HTTP contracts, persistence, and collaboration between modules.
5. Finish with a small number of E2E tests for complete critical flows such as login, checkout, and order confirmation.
6. Run the suite, analyze failures and coverage gaps, and only then add less critical scenarios.

This order shortens initial feedback loops, favors fast tests, and avoids using E2E tests to discover issues that unit tests could have caught.

## Testing Pyramid

Distribute tests according to the testing pyramid:

1. A broad base of fast, isolated unit tests for business rules, components, and functions.
2. A smaller number of integration tests verifying collaboration between modules, adapters, routes, and persistence.
3. A limited number of E2E tests covering complete critical flows from the user's perspective.

Do not use E2E tests to replace unit or integration tests. For example, checkout calculation and validation rules should be unit tested, payment integration should be integration tested, and the essential flow should be covered by an E2E test.

## Tools and Organization

Use Vitest for unit and integration tests in the frontend and backend. Configure coverage through Vitest and ensure test runs fail when the 80% minimum coverage is not met.

Prefer Playwright for E2E tests. E2E tests must live in the `e2e/` directory, outside `frontend/` and `backend/`.

```text
.
├── frontend/
│   └── src/
│       └── **/*.test.tsx
├── backend/
│   └── src/
│       └── **/*.test.ts
└── e2e/
    └── checkout.spec.ts
```

Frontend tests should validate visible behavior and relevant interactions without unnecessary coupling to internal implementation or styling structure. Backend tests should validate business rules, HTTP contracts, status codes, payloads, errors, and relevant side effects.

Use mocks, stubs, and fakes intentionally: replace external or slow dependencies, but do not hide the integration that a test is meant to verify. In integration tests, prefer controlled dependencies and isolated environments.

Example of an E2E test with Playwright:

```ts
import { expect, test } from '@playwright/test';

test('customer completes checkout with an approved payment', async ({ page }) => {
  await page.goto('/checkout');
  await page.getByRole('button', { name: 'Place order' }).click();

  await expect(page.getByText('Order confirmed')).toBeVisible();
});
```

Before completing a change, run tests and coverage checks for the affected applications. A change is complete only when tests pass, minimum coverage is met, and critical scenarios are protected.

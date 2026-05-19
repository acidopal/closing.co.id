---
inclusion: always
---

# Scalebiz — Testing Best Practices

- Runtime: Bun test runner (`bun test`)
- Test files: colocate as `*.test.ts` or in `__tests__/` directory
- Minimal verbosity: don't log to console in tests unless debugging
- Test business logic in service classes, not route handlers directly
- Mock Prisma client for unit tests, use test database for integration
- Descriptive names: `it('should return 400 when app_id is missing')`
- Test tenant isolation: verify queries always filter by app_id
- Frontend: test component behavior not implementation details
- Keep tests fast — mock external services (S3, Redis, Meta API)

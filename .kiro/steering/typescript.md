---
inclusion: always
---

# Scalebiz — TypeScript Best Practices

- Strict mode everywhere, no `any` — use Prisma generated types, `z.infer<>`, or `t.Static<>`
- Prefer `const` over `let`, never `var`
- Use `satisfies` for type narrowing where helpful
- Prefer discriminated unions over optional fields for state variants
- Use `as const` for literal types (already used in model.ts files)
- Avoid type assertions (`as`) — prefer type guards
- Use `unknown` over `any` for untyped data, then narrow
- Prefer `interface` for extensible object shapes, `type` for unions/intersections
- Error handling: typed error returns `{ error: string }` — don't throw in route handlers
- Use `import type` when only used for type checking

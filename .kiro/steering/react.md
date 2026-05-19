---
inclusion: always
---

# Scalebiz — React Best Practices

## Components
- PascalCase files, functional components only
- Use shadcn/ui primitives from `components/ui/` — don't reinvent Button, Dialog, etc.
- Modals: separate `*Modal.tsx` files, use Dialog from shadcn/ui
- Icons: Lucide React only
- Styling: TailwindCSS utility classes, avoid inline styles
- Route components in `routes/` should be thin — delegate to components

## Accessibility
- All interactive elements need proper aria labels, keyboard navigation, focus management
- Use semantic HTML (`<nav>`, `<main>`, `<section>`) over generic `<div>`
- Images need alt text, decorative images use `alt=""`
- Forms: `<label>` with `htmlFor`, error messages linked via `aria-describedby`

## Patterns
- Extract complex logic into custom hooks in `hooks/`
- Server state: TanStack Query — local UI state: useState/useReducer
- Avoid prop drilling — use composition or context for deeply nested data
- Only use `useMemo`/`useCallback` when there's a measured perf issue
- Event handlers: prefix with `handle` (e.g., `handleSubmit`, `handleClose`)

---
inclusion: always
---

# Scalebiz — Git Best Practices

- Conventional commits: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `style:`, `perf:`, `test:`
- Scope when relevant: `feat(inbox): add advanced filter`
- Keep commits atomic — one logical change per commit
- Branch naming: `feat/description`, `fix/description`, `refactor/description`
- Never commit `.env`, `node_modules`, generated files (`dist/`, `apps/backend/src/generated/`)
- Meaningful commit messages — describe WHY not just WHAT
- Squash WIP commits before merging
- Keep PRs focused and reviewable (< 400 lines when possible)

# Decisions

Short notes on choices that shape how this repo works, and why. One file per decision; add a new one rather than rewriting an old one when a choice changes.

| Decision                                  | Summary                                                                             | Since         |
| ----------------------------------------- | ----------------------------------------------------------------------------------- | ------------- |
| [Local database first](local-database.md) | Develop against the local Supabase stack; migrations in the repo are the schema.    | Sprint 0      |
| [Release flow](release-flow.md)           | `chore/*` → `preview`; `main` untouched for now; push only non-breaking migrations. | Sprint 0      |
| [Seed data](seed-data.md)                 | Fake users only; catalog tables copied from the hosted database.                    | Sprint 0      |
| [Test flag](test-flag.md)                 | Keep `for_testing` and `GET_TEST_RECORDS`.                                          | Sprint 0      |
| [Planning docs](planning-docs.md)         | The claude.ai Project is the source of truth; `docs/sprints/` is a copy.            | Sprint 0      |
| [Supabase clients](supabase-clients.md)   | `locals.supabase` by default; admin client only for rig endpoints.                  | Sprint 0 (C3) |

## Agent skills

`.claude/skills/shadcn-svelte/` comes from [huntabyte/shadcn-svelte](https://github.com/huntabyte/shadcn-svelte) (`skills/shadcn-svelte`). Only the files Claude Code uses are kept (`SKILL.md`, `cli.md`, `customization.md`, `rules/`). To update it, copy those files again from the upstream repo.

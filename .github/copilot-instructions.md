# Copilot / AI Agent Instructions for DA-LHE

This repository is a SvelteKit web app (frontend) that uses Paraglide for i18n and Supabase as a backend (via the Supabase JS client). Keep instructions short and actionable so an AI agent can be productive quickly.

Key facts (quick):
- Framework: SvelteKit (v2). Entry points: `src/routes/**` for pages and `src/lib/**` for shared components and utilities.
- Build: Vite. Primary scripts: `pnpm dev` (vite dev --host), `pnpm build`, `pnpm preview`.
- i18n: `@inlang/paraglide-js` + Vite plugin. Generated runtime/messages live under `src/lib/paraglide` (configured in `vite.config.js`).
- Styling: TailwindCSS with shadCN-style components. Utility `cn()` in `src/lib/utils.ts` merges clsx + tailwind-merge.
- Types: TypeScript is enabled; many files are JS/TS/Svelte mixed. Keep `strict` assumptions in mind (see `tsconfig.json`).

Architecture & conventions (what to know):
- Pages: `src/routes` follows SvelteKit routing. Use +page.svelte and optional +page.server.ts for server-side logic.
- Components: `src/lib/components/*`. UI primitives follow the shadcn/tailwind approach (Button, Card, Table, etc.). Prefer these when composing UI.
- Stores: `src/lib/store.js` holds app-level Svelte stores (e.g., `title`). Update stores to change top-level state.
- Paraglide/i18n: translations are generated into `src/lib/paraglide`. Use `m` from `src/lib/paraglide/messages.js` and runtime helpers `getLocale()`/`setLocale()` from `runtime.js` (see `src/routes/+layout.svelte` for example).
- Forms and validation: zod schemas (example `src/routes/new/schema.ts`) and `sveltekit-superforms` are present as dev tools; follow the existing simple pattern: export schema and type.

Developer workflows & commands:
- Local dev: `pnpm install` then `pnpm dev` (runs `vite dev --host`).
- Build: `pnpm build` (vite build) then `pnpm preview` to run the production preview.
- Code style: `pnpm run format` (prettier). Lint check: `pnpm run lint` (prettier --check).
- i18n regeneration: Paraglide is configured as a Vite plugin and runs automatically during dev/build to output to `src/lib/paraglide`. If editing `project.inlang` or plugin config, restart dev server.

Patterns & idioms (examples to reuse):
- Language toggle: `src/routes/+layout.svelte` uses `getLocale()`/`setLocale()` and a small `ModeWatcher` component — follow this for global locale changes.
- Utility `cn(...)`: use `src/lib/utils.ts` for conditional class merging instead of manual string concat.
- Table/data-grid: `src/lib/components/ui/data-table/` contains table helper code and `render-helpers.ts` — prefer those for tabular displays and actions.
- Image/assets: place public static images in `static/` or import small images from `src/lib/` (logo example in `+layout.svelte`).

Integration points & external deps:
- Supabase: `@supabase/supabase-js` is a runtime dependency — look for usage across `src/routes` or `src/lib` when implementing data features.
- Paraglide: Vite plugin configured in `vite.config.js` writes generated files to `src/lib/paraglide`. Rely on these generated modules for messages and runtime helpers.

When editing code:
- Keep changes small and follow existing file patterns (Svelte single-file components, TS types next to zod schemas, `cn()` for classes).
- Run `pnpm dev` after changes. If TypeScript errors appear, inspect `tsconfig.json` (project is strict) and prefer adding explicit types rather than disabling rules.

Files to inspect first for context:
- `package.json`, `vite.config.js`, `svelte.config.js`
- `src/routes/+layout.svelte`, `src/lib/store.js`, `src/lib/utils.ts`
- `src/lib/paraglide/*` (generated messages and runtime)
- `src/lib/components/ui/**` (shadCN-styled primitives and tables)

If you need guidance beyond this file, ask for a specific task (e.g., "add a new page that posts to Supabase" or "fix TS error in data-table.svelte").

---
If this merges with an existing `.github/copilot-instructions.md`, preserve the above facts and append any local historical notes from the previous file. Ask the maintainer if unsure about permission to modify CI/deploy behavior.

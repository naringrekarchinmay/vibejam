# Supabase

## Migrations

Numbered SQL files in `migrations/`, applied in filename order.

Never edit a migration that has already been applied to a shared environment —
add a new one instead (§9). Each development phase adds its own migration for
the tables that phase needs, rather than one migration creating the whole schema
up front.

| Migration | Adds |
| --- | --- |
| `0001_init_users.sql` | `public.users`, the `set_updated_at` trigger helper, the `handle_new_user` auth sync trigger, and RLS policies on `users` |

## Applying migrations

Requires the Supabase CLI, and Docker for the local stack.

```bash
npx supabase start
```

```bash
npx supabase db reset
```

`db reset` re-applies every migration from scratch against the local database.

Against a hosted project:

```bash
npx supabase link --project-ref <ref>
```

```bash
npx supabase db push
```

## Regenerating types

`types/database.ts` is hand-written during Phase 1 because no project exists
yet. Once one does, generate it instead and stop editing it by hand:

```bash
npx supabase gen types typescript --local > types/database.ts
```

Re-run this after every schema change. A stale type file is worse than none —
it type-checks against a database that no longer exists.

## Verification status

`0001_init_users.sql` has **not** been applied to a real database. Neither
Docker nor `psql` is available on the development machine, so the local stack
could not be started.

What was verified: the file parses cleanly against PostgreSQL's own grammar via
`libpg_query`, producing the 9 expected statements (2 functions, 1 table, 1
index, 2 triggers, 1 `alter table`, 2 policies).

What that does **not** prove, and what Phase 2 must confirm on a real project:

- that `auth.users` exists and the foreign key resolves
- that the `plpgsql` function bodies are valid — the outer parser treats them as
  string literals and never looks inside
- that the trigger on `auth.users` can be created with the project's privileges
- that the RLS policies actually admit and deny the rows intended

Treat this migration as unapplied until someone runs `db reset` against it.

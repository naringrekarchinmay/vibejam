/**
 * Hand-written for now. Phase 2 replaces this file with generated output once
 * a real Supabase project exists:
 *
 *   npx supabase gen types typescript --local > types/database.ts
 *
 * Only the tables that exist in a migration belong here. Later phases add
 * their own rows alongside their own migrations (§9).
 */
export type UserRow = {
  id: string;
  github_id: string;
  github_username: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      users: {
        Row: UserRow;
        // Nullable columns are optional on insert, matching the database:
        // display_name and avatar_url have no NOT NULL constraint.
        Insert: Pick<UserRow, "id" | "github_id" | "github_username"> &
          Partial<Omit<UserRow, "id" | "github_id" | "github_username">>;
        Update: Partial<UserRow>;
        // Required by postgrest-js's GenericTable constraint. Without it the
        // table does not satisfy the constraint and every query's row type
        // silently collapses to `never` — which reads like a schema bug rather
        // than a missing field. `supabase gen types` emits this too.
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
  };
};

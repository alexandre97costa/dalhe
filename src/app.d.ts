// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// and what to do when importing types
import { SupabaseClient, Session } from '@supabase/supabase-js'
import type { QueryResult, QueryData, QueryError } from '@supabase/supabase-js'

declare global {
    namespace App {
        // interface Error {}

        interface Locals {
            supabase: SupabaseClient;
            safeGetSession: () => Promise<{
                session: Session | null;
                user?: Session["user"] | null;
            }>;
        }
        interface PageData {
            session: Session | null
            user?: Session["user"] | null
        }
        // interface PageState {}
        // interface Platform {}

        interface FormQuery {
            key: string,
            from: string,
            select: string | null,
        }
        type FormDataRecord = Record<string, QueryData<any> | null>;
    }
}

export { FormQuery, FormDataRecord };
import { supabase } from '@/integrations/supabase/client';

export async function createUniqueSlug(base: string) {
  const norm = base.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  let attempt = norm;
  let i = 1;
  
  while (true) {
    const { data, error } = await supabase
      .from("cowork_sessions")
      .select("id")
      .eq("invite_code", attempt)
      .maybeSingle();

    if (!data && !error) return attempt;
    attempt = `${norm}-${i++}`;
  }
}

export function generateSessionUrl(slug: string): string {
  return `${window.location.origin}/sessions/${slug}`;
}
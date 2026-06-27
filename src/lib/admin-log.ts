import { supabase } from "@/integrations/supabase/client";

export async function logAdminAction(
  action: string,
  entity?: string,
  entity_id?: string,
  details: Record<string, unknown> = {},
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("admin_logs").insert({
      actor_id: user.id,
      action,
      entity: entity ?? null,
      entity_id: entity_id ?? null,
      details: details as never,
    });
  } catch (e) {
    console.error("admin log failed", e);
  }
}
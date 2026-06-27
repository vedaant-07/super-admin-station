import { createServerFn } from "@tanstack/react-start";

const DEMO_EMAIL = "demo-admin@example.com";
const DEMO_PASSWORD = "DemoAdmin!2026";

export const ensureDemoAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // Find existing user
  const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listErr) throw listErr;
  let user = list.users.find((u) => u.email?.toLowerCase() === DEMO_EMAIL);

  if (!user) {
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: "Demo Admin", source: "admin" },
    });
    if (createErr) throw createErr;
    user = created.user!;
  } else {
    // Reset password in case it drifted
    await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: DEMO_PASSWORD,
      email_confirm: true,
    });
  }

  // Ensure super_admin role
  await supabaseAdmin
    .from("user_roles")
    .upsert({ user_id: user.id, role: "super_admin" }, { onConflict: "user_id,role" });

  return { email: DEMO_EMAIL, password: DEMO_PASSWORD };
});
import { withSupabase } from "@supabase/server";

// Borra la cuenta dueña de la sesión. No recibe ningún id: nadie puede borrar una cuenta ajena.
// Su perfil, sus accesos y su constancia de los términos se borran en cascada con ella.
export default {
  fetch: withSupabase({ auth: "user" }, async (_req, ctx) => {
    await ctx.supabaseAdmin.auth.admin.deleteUser(ctx.userClaims!.id);
    return new Response(null, { status: 204 });
  }),
};

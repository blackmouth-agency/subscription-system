import { withSupabase } from "@supabase/server";

export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    const project = new URL(req.url).searchParams.get("project")!;

    const { data } = await ctx.supabase
      .from("entitlements")
      .select("project_id, projects!inner(slug)")
      .eq("projects.slug", project);

    if (!data?.length) {
      return Response.json({ error: "No tienes acceso a conoce-mas" }, {
        status: 403,
      });
    }

    return Response.json({ content: "Bienvenido a conoce-mas" });
  }),
};

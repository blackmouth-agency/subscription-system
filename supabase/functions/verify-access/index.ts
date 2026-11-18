import { withSupabase } from "@supabase/server";
import { z } from "zod";

const Query = z.object({ project: z.string().min(1) });

export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    const query = Query.safeParse(
      Object.fromEntries(new URL(req.url).searchParams),
    );
    if (!query.success) {
      return Response.json({ error: "Falta el proyecto" }, { status: 400 });
    }
    const { project } = query.data;

    const { data, error } = await ctx.supabase
      .from("entitlements")
      .select("project_id, projects!inner(slug)")
      .eq("projects.slug", project);

    if (error) {
      console.error("verify-access: falló la consulta de accesos", error);
      return Response.json({ error: "No se pudo verificar el acceso" }, {
        status: 500,
      });
    }

    if (!data.length) {
      return Response.json({ error: `No tienes acceso a ${project}` }, {
        status: 403,
      });
    }

    return Response.json({ content: "Bienvenido a conoce-mas" });
  }),
};

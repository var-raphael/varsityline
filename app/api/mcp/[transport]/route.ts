import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const handler = createMcpHandler(
  async (server) => {
    // ============================================================
    // UNIVERSITIES
    // ============================================================
    server.tool(
      "create_university",
      "Create a new university record",
      {
        slug: z.string(),
        name: z.string(),
        state: z.string(),
        type: z.enum(["Federal", "State", "Private"]),
        jamb_cutoff: z.number(),
        admission_status: z.enum(["open", "closed", "upcoming"]),
      },
      async (input) => {
        const { data, error } = await supabase
          .from("universities")
          .insert(input)
          .select()
          .single();

        if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
        return { content: [{ type: "text", text: JSON.stringify(data) }] };
      }
    );

    server.tool(
      "bulk_create_universities",
      "Create multiple university records in one call. Atomic: if any row is invalid, none are inserted.",
      {
        universities: z.array(
          z.object({
            slug: z.string(),
            name: z.string(),
            state: z.string(),
            type: z.enum(["Federal", "State", "Private"]),
            jamb_cutoff: z.number(),
            admission_status: z.enum(["open", "closed", "upcoming"]),
          })
        ),
      },
      async ({ universities }) => {
        const { data, error } = await supabase
          .from("universities")
          .insert(universities)
          .select();

        if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
        return { content: [{ type: "text", text: JSON.stringify(data) }] };
      }
    );

    server.tool(
      "get_university",
      "Get a university by slug, including its courses and links",
      { slug: z.string() },
      async ({ slug }) => {
        const { data, error } = await supabase
          .from("universities")
          .select("*, courses(*), links(*)")
          .eq("slug", slug)
          .single();

        if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
        return { content: [{ type: "text", text: JSON.stringify(data) }] };
      }
    );

    server.tool(
      "list_universities",
      "List universities, optionally filtered by state, type, or admission status",
      {
        state: z.string().optional(),
        type: z.enum(["Federal", "State", "Private"]).optional(),
        admission_status: z.enum(["open", "closed", "upcoming"]).optional(),
      },
      async (filters) => {
        let query = supabase.from("universities").select("*");
        if (filters.state) query = query.eq("state", filters.state);
        if (filters.type) query = query.eq("type", filters.type);
        if (filters.admission_status) query = query.eq("admission_status", filters.admission_status);

        const { data, error } = await query;
        if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
        return { content: [{ type: "text", text: JSON.stringify(data) }] };
      }
    );

    server.tool(
      "update_university",
      "Update fields on an existing university (does NOT touch last_verified_at)",
      {
        slug: z.string(),
        fields: z.record(z.string(), z.any()),
      },
      async ({ slug, fields }) => {
        const { data, error } = await supabase
          .from("universities")
          .update(fields)
          .eq("slug", slug)
          .select()
          .single();

        if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
        return { content: [{ type: "text", text: JSON.stringify(data) }] };
      }
    );

    server.tool(
      "bulk_update_universities",
      "Update multiple universities by id in one call, each with its own fields. Atomic: runs in a single transaction via RPC — if any id is missing or invalid, none are updated.",
      {
        updates: z.array(
          z.object({
            id: z.string(),
            fields: z.record(z.string(), z.any()),
          })
        ),
      },
      async ({ updates }) => {
        const { data, error } = await supabase.rpc("bulk_update_universities", {
          updates,
        });

        if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
        return { content: [{ type: "text", text: JSON.stringify(data) }] };
      }
    );

    server.tool(
      "mark_verified",
      "Explicitly mark a university as freshly verified against its source",
      { slug: z.string() },
      async ({ slug }) => {
        const { data, error } = await supabase
          .from("universities")
          .update({ last_verified_at: new Date().toISOString() })
          .eq("slug", slug)
          .select()
          .single();

        if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
        return { content: [{ type: "text", text: JSON.stringify(data) }] };
      }
    );

    server.tool(
      "delete_university",
      "Delete a university by slug",
      { slug: z.string() },
      async ({ slug }) => {
        const { error } = await supabase.from("universities").delete().eq("slug", slug);
        if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
        return { content: [{ type: "text", text: `Deleted ${slug}` }] };
      }
    );

    server.tool(
      "bulk_delete_universities",
      "Delete multiple universities by id in one call. Atomic: single DELETE statement, all-or-nothing.",
      { ids: z.array(z.string()) },
      async ({ ids }) => {
        const { data, error } = await supabase
          .from("universities")
          .delete()
          .in("id", ids)
          .select();

        if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
        return { content: [{ type: "text", text: `Deleted ${data?.length ?? 0} universities` }] };
      }
    );

    // ============================================================
    // COURSES
    // ============================================================
    server.tool(
      "create_course",
      "Create a course under a university",
      {
        university_id: z.string(),
        name: z.string(),
        faculty: z.string().optional(),
        cutoff_mark: z.number(),
        subject_combo: z.string().optional(),
        source_url: z.string().optional(),
        de_eligible: z.boolean().default(false),
        de_cutoff_mark: z.number().optional(),
        aggregate: z.number().optional(),
        notes: z.string().optional(),
        duration_years: z.number().optional(),
      },
      async (input) => {
        const { data, error } = await supabase.from("courses").insert(input).select().single();
        if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
        return { content: [{ type: "text", text: JSON.stringify(data) }] };
      }
    );

    server.tool(
      "bulk_create_courses",
      "Create multiple courses in one call. Atomic: if any row is invalid, none are inserted.",
      {
        courses: z.array(
          z.object({
            university_id: z.string(),
            name: z.string(),
            faculty: z.string().optional(),
            cutoff_mark: z.number(),
            subject_combo: z.string().optional(),
            source_url: z.string().optional(),
            de_eligible: z.boolean().default(false),
            de_cutoff_mark: z.number().optional(),
            aggregate: z.number().optional(),
            notes: z.string().optional(),
            duration_years: z.number().optional(),
          })
        ),
      },
      async ({ courses }) => {
        const { data, error } = await supabase.from("courses").insert(courses).select();
        if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
        return { content: [{ type: "text", text: JSON.stringify(data) }] };
      }
    );

    server.tool(
      "list_courses",
      "List courses, optionally filtered by university_id or name",
      {
        university_id: z.string().optional(),
        name: z.string().optional(),
      },
      async (filters) => {
        let query = supabase.from("courses").select("*, universities(name, slug, state, type)");
        if (filters.university_id) query = query.eq("university_id", filters.university_id);
        if (filters.name) query = query.ilike("name", `%${filters.name}%`);

        const { data, error } = await query;
        if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
        return { content: [{ type: "text", text: JSON.stringify(data) }] };
      }
    );

    server.tool(
      "update_course",
      "Update fields on an existing course",
      {
        course_id: z.string(),
        fields: z.record(z.string(), z.any()),
      },
      async ({ course_id, fields }) => {
        const { data, error } = await supabase
          .from("courses")
          .update(fields)
          .eq("id", course_id)
          .select()
          .single();

        if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
        return { content: [{ type: "text", text: JSON.stringify(data) }] };
      }
    );

    server.tool(
      "bulk_update_courses",
      "Update multiple courses by id in one call, each with its own fields. Atomic: runs in a single transaction via RPC — if any id is missing or invalid, none are updated.",
      {
        updates: z.array(
          z.object({
            id: z.string(),
            fields: z.record(z.string(), z.any()),
          })
        ),
      },
      async ({ updates }) => {
        const { data, error } = await supabase.rpc("bulk_update_courses", { updates });
        if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
        return { content: [{ type: "text", text: JSON.stringify(data) }] };
      }
    );

    server.tool(
      "delete_course",
      "Delete a course by id",
      { course_id: z.string() },
      async ({ course_id }) => {
        const { error } = await supabase.from("courses").delete().eq("id", course_id);
        if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
        return { content: [{ type: "text", text: `Deleted course ${course_id}` }] };
      }
    );

    server.tool(
      "bulk_delete_courses",
      "Delete multiple courses by id in one call. Atomic: single DELETE statement, all-or-nothing.",
      { course_ids: z.array(z.string()) },
      async ({ course_ids }) => {
        const { data, error } = await supabase
          .from("courses")
          .delete()
          .in("id", course_ids)
          .select();

        if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
        return { content: [{ type: "text", text: `Deleted ${data?.length ?? 0} courses` }] };
      }
    );

    // ============================================================
    // SUBSCRIPTIONS
    // ============================================================
    server.tool(
      "create_subscription",
      "Create a subscription record after a Paystack payment is verified",
      {
        email: z.string(),
        channel: z.enum(["email", "telegram"]),
        telegram_handle: z.string().optional(),
        university_ids: z.array(z.string()),
        tier_price: z.number(),
        paystack_reference: z.string(),
        expires_at: z.string(), // ISO date string, e.g. now + 3 months
      },
      async (input) => {
        const { data, error } = await supabase
          .from("subscriptions")
          .insert(input)
          .select()
          .single();

        if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
        return { content: [{ type: "text", text: JSON.stringify(data) }] };
      }
    );

    server.tool(
      "bulk_create_subscriptions",
      "Create multiple subscription records in one call. Atomic: if any row is invalid, none are inserted.",
      {
        subscriptions: z.array(
          z.object({
            email: z.string(),
            channel: z.enum(["email", "telegram"]),
            telegram_handle: z.string().optional(),
            university_ids: z.array(z.string()),
            tier_price: z.number(),
            paystack_reference: z.string(),
            expires_at: z.string(),
          })
        ),
      },
      async ({ subscriptions }) => {
        const { data, error } = await supabase
          .from("subscriptions")
          .insert(subscriptions)
          .select();

        if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
        return { content: [{ type: "text", text: JSON.stringify(data) }] };
      }
    );

    server.tool(
      "get_subscription",
      "Get a subscription by id, email, or Paystack reference",
      {
        id: z.string().optional(),
        email: z.string().optional(),
        paystack_reference: z.string().optional(),
      },
      async (filters) => {
        let query = supabase.from("subscriptions").select("*");
        if (filters.id) query = query.eq("id", filters.id);
        if (filters.email) query = query.eq("email", filters.email);
        if (filters.paystack_reference) query = query.eq("paystack_reference", filters.paystack_reference);

        const { data, error } = await query.single();
        if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
        return { content: [{ type: "text", text: JSON.stringify(data) }] };
      }
    );

    server.tool(
      "list_subscriptions",
      "List subscriptions, optionally filtered by university_id (active subscribers to notify) or expiry",
      {
        university_id: z.string().optional(),
        active_only: z.boolean().default(false),
      },
      async (filters) => {
        let query = supabase.from("subscriptions").select("*");
        if (filters.university_id) query = query.contains("university_ids", [filters.university_id]);
        if (filters.active_only) query = query.gt("expires_at", new Date().toISOString());

        const { data, error } = await query;
        if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
        return { content: [{ type: "text", text: JSON.stringify(data) }] };
      }
    );

    server.tool(
      "bulk_update_subscriptions",
      "Update multiple subscriptions by id in one call, each with its own fields. Atomic: runs in a single transaction via RPC — if any id is missing or invalid, none are updated.",
      {
        updates: z.array(
          z.object({
            id: z.string(),
            fields: z.record(z.string(), z.any()),
          })
        ),
      },
      async ({ updates }) => {
        const { data, error } = await supabase.rpc("bulk_update_subscriptions", { updates });
        if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
        return { content: [{ type: "text", text: JSON.stringify(data) }] };
      }
    );

    server.tool(
      "delete_subscription",
      "Delete a subscription by id",
      { id: z.string() },
      async ({ id }) => {
        const { error } = await supabase.from("subscriptions").delete().eq("id", id);
        if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
        return { content: [{ type: "text", text: `Deleted subscription ${id}` }] };
      }
    );

    server.tool(
      "bulk_delete_subscriptions",
      "Delete multiple subscriptions by id in one call. Atomic: single DELETE statement, all-or-nothing.",
      { ids: z.array(z.string()) },
      async ({ ids }) => {
        const { data, error } = await supabase
          .from("subscriptions")
          .delete()
          .in("id", ids)
          .select();

        if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
        return { content: [{ type: "text", text: `Deleted ${data?.length ?? 0} subscriptions` }] };
      }
    );
  },
  {},
  { basePath: "/api/mcp" }
);

// ============================================================
// Secret-key gate — checked before any tool call is allowed through.
// The key is passed as a query parameter (?key=...) rather than a
// path segment, because the [transport] dynamic segment here is
// reserved by mcp-handler for the transport type (e.g. "mcp", "sse")
// and cannot double as our own auth token.
// ============================================================
async function checkAuthAndHandle(
  req: NextRequest,
  context: { params: Promise<{ transport: string }> }
) {
  const key = req.nextUrl.searchParams.get("key");

  if (!key || key !== process.env.MCP_SECRET_KEY) {
    return new Response("Not found", { status: 404 });
  }

  return handler(req);
}

export {
  checkAuthAndHandle as GET,
  checkAuthAndHandle as POST,
  checkAuthAndHandle as DELETE,
};

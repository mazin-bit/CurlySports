// @ts-ignore: Deno environment
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore: Deno environment
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
// @ts-ignore: Deno environment
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// @ts-ignore: Deno environment
serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            // @ts-ignore: Deno environment
            Deno.env.get("SUPABASE_URL") ?? "",
            // @ts-ignore: Deno environment
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        const { to, subject, templateId, placeholders, htmlOverride } = await req.json();

        let htmlContent = htmlOverride;

        if (!htmlContent) {
            // 1. Fetch templates from DB
            const { data: config, error: configError } = await supabaseClient
                .from("app_config")
                .select("email_templates")
                .eq("id", "app")
                .single();

            if (configError || !config) {
                throw new Error(`Failed to fetch email templates: ${configError?.message}`);
            }

            const templates = (config.email_templates || {}) as Record<string, string>;
            htmlContent = templates[templateId];

            if (!htmlContent) {
                throw new Error(`Template '${templateId}' not found in database.`);
            }
        }

        // 2. Replace placeholders
        // Handles both {{ .Var }} (Supabase style) and {{Var}} (simple style)
        if (placeholders) {
            Object.entries(placeholders).forEach(([key, value]) => {
                const valStr = String(value);
                htmlContent = htmlContent.replace(new RegExp(`{{\\s*\\.?${key}\\s*}}`, "g"), valStr);
            });
        }

        // 3. Connect to SMTP
        const client = new SmtpClient();
        await client.connect({
            // @ts-ignore: Deno environment
            hostname: Deno.env.get("SMTP_HOST") || "",
            // @ts-ignore: Deno environment
            port: parseInt(Deno.env.get("SMTP_PORT") || "587"),
            // @ts-ignore: Deno environment
            username: Deno.env.get("SMTP_USER") || "",
            // @ts-ignore: Deno environment
            password: Deno.env.get("SMTP_PASS") || "",
        });

        // 4. Send Email
        await client.send({
            // @ts-ignore: Deno environment
            from: `"${Deno.env.get("SMTP_FROM_NAME")}" <${Deno.env.get("SMTP_FROM")}>`,
            to,
            subject: subject || "Curly Sports Update",
            content: htmlContent,
            html: htmlContent,
        });

        await client.close();

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});

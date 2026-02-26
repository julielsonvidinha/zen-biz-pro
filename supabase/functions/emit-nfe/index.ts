import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// SEFAZ Homologação endpoints (NFC-e modelo 65)
const SEFAZ_HOMOLOGACAO_URL = "https://nfce-homologacao.svrs.rs.gov.br/ws/NfeAutorizacao/NFeAutorizacao4.asmx";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user
    const { data: { user }, error: authError } = await createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!,
      { global: { headers: { Authorization: authHeader! } } }
    ).auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check role
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
    const userRoles = (roles || []).map((r: any) => r.role);
    if (!userRoles.includes("admin") && !userRoles.includes("gerente")) {
      return new Response(JSON.stringify({ error: "Sem permissão para emitir NF-e" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, sale_id, invoice_id, correction_text } = body;

    if (action === "cancel") {
      // Cancel invoice
      const { data: inv } = await supabase.from("invoices").select("*").eq("id", invoice_id).single();
      if (!inv || inv.status !== "autorizada") {
        return new Response(JSON.stringify({ error: "Nota não encontrada ou não pode ser cancelada" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Check 24h limit
      const createdAt = new Date(inv.created_at);
      const hoursElapsed = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
      if (hoursElapsed > 24) {
        return new Response(JSON.stringify({ error: "Prazo legal para cancelamento expirado (24h)" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // In homologação, simulate SEFAZ cancellation
      await supabase.from("invoices").update({ status: "cancelada", updated_at: new Date().toISOString() }).eq("id", invoice_id);

      return new Response(JSON.stringify({ status: "cancelada", message: "NF-e cancelada (Homologação)" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "correction") {
      if (!correction_text || correction_text.trim().length < 15) {
        return new Response(JSON.stringify({ error: "Texto da CC-e deve ter no mínimo 15 caracteres" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // In homologação, simulate CC-e
      return new Response(JSON.stringify({ status: "autorizada", message: "CC-e registrada (Homologação)" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Default action: emit NF-e
    if (!sale_id) {
      return new Response(JSON.stringify({ error: "sale_id é obrigatório" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch sale data
    const { data: sale } = await supabase.from("sales").select("*").eq("id", sale_id).single();
    if (!sale) {
      return new Response(JSON.stringify({ error: "Venda não encontrada" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: items } = await supabase.from("sale_items").select("*").eq("sale_id", sale_id);

    // Generate simulated NF-e data (Homologação)
    const nfeNumber = Math.floor(Math.random() * 999999) + 1;
    const accessKey = Array.from({ length: 44 }, () => Math.floor(Math.random() * 10)).join("");
    const protocol = `${Date.now()}`;

    // Simulate SEFAZ authorization (homologação always approves)
    const nfeStatus = "autorizada";

    // Store invoice record
    const { data: invoice, error: insertError } = await supabase.from("invoices").insert({
      sale_id,
      type: "nfce",
      number: nfeNumber,
      series: 1,
      status: nfeStatus,
      access_key: accessKey,
      protocol,
      xml: `<nfeProc><NFe><infNFe Id="NFe${accessKey}"><ide><nNF>${nfeNumber}</nNF></ide></infNFe></NFe><protNFe><infProt><nProt>${protocol}</nProt><cStat>100</cStat></infProt></protNFe></nfeProc>`,
      user_id: user.id,
    }).select().single();

    if (insertError) {
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      status: nfeStatus,
      invoice_id: invoice.id,
      number: nfeNumber,
      access_key: accessKey,
      protocol,
      message: "NF-e emitida em ambiente de HOMOLOGAÇÃO (sem valor fiscal)",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error in emit-nfe:", error);
    return new Response(JSON.stringify({ error: error.message || "Erro interno" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

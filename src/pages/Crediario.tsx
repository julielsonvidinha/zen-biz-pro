import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Loader2, CheckCircle, AlertTriangle, DollarSign } from "lucide-react";

interface AR {
  id: string;
  description: string;
  amount: number;
  due_date: string;
  paid_date: string | null;
  status: string;
  customer_id: string | null;
  customer_name?: string;
}

const Crediario = () => {
  const { toast } = useToast();
  const { hasRole } = useAuth();
  const [items, setItems] = useState<AR[]>([]);
  const [loading, setLoading] = useState(true);

  const canWrite = hasRole("admin") || hasRole("gerente");

  const fetchData = async () => {
    setLoading(true);
    // Fetch crediário entries (description starts with "Crediário")
    const { data } = await supabase
      .from("accounts_receivable")
      .select("*, customers(name)")
      .ilike("description", "Crediário%")
      .order("due_date");

    const mapped = (data || []).map((r: any) => ({
      ...r,
      customer_name: r.customers?.name || null,
    }));
    setItems(mapped);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const markPaid = async (id: string) => {
    await supabase.from("accounts_receivable").update({
      status: "recebido",
      paid_date: new Date().toISOString().split("T")[0],
    }).eq("id", id);
    toast({ title: "✅ Parcela marcada como recebida!" });
    fetchData();
  };

  const pending = items.filter(i => i.status === "pendente");
  const overdue = pending.filter(i => new Date(i.due_date) < new Date());
  const paid = items.filter(i => i.status === "recebido");
  const totalPending = pending.reduce((s, i) => s + Number(i.amount), 0);
  const totalOverdue = overdue.reduce((s, i) => s + Number(i.amount), 0);
  const totalPaid = paid.reduce((s, i) => s + Number(i.amount), 0);

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><FileText className="w-5 h-5 text-primary" /></div>
        <div className="flex-1"><h1 className="text-xl font-bold">Crediário</h1><p className="text-sm text-muted-foreground">Carnês e parcelas dos clientes — gerados pelo PDV</p></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1"><DollarSign className="w-4 h-4 text-warning" /><p className="text-sm text-muted-foreground">Pendentes</p></div>
            <p className="text-2xl font-bold font-mono">{pending.length}</p>
            <p className="text-sm font-mono text-muted-foreground">{fmt(totalPending)}</p>
          </CardContent>
        </Card>
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1"><AlertTriangle className="w-4 h-4 text-destructive" /><p className="text-sm text-destructive font-medium">Em Atraso</p></div>
            <p className="text-2xl font-bold font-mono">{overdue.length}</p>
            <p className="text-sm font-mono text-muted-foreground">{fmt(totalOverdue)}</p>
          </CardContent>
        </Card>
        <Card className="border-success/30 bg-success/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1"><CheckCircle className="w-4 h-4 text-success" /><p className="text-sm text-success font-medium">Recebidos</p></div>
            <p className="text-2xl font-bold font-mono">{paid.length}</p>
            <p className="text-sm font-mono text-muted-foreground">{fmt(totalPaid)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-0">
          {loading ? <div className="flex items-center justify-center p-12"><Loader2 className="w-6 h-6 animate-spin" /></div> : (
            <table className="w-full">
              <thead><tr className="border-b border-border/50 bg-muted/50">
                <th className="text-left p-3 text-xs font-medium text-muted-foreground">Descrição</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground">Cliente</th>
                <th className="text-right p-3 text-xs font-medium text-muted-foreground w-28">Valor</th>
                <th className="text-center p-3 text-xs font-medium text-muted-foreground w-28">Vencimento</th>
                <th className="text-center p-3 text-xs font-medium text-muted-foreground w-24">Status</th>
                <th className="p-3 w-16"></th>
              </tr></thead>
              <tbody>
                {items.map(a => (
                  <tr key={a.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                    <td className="p-3 text-sm">{a.description}</td>
                    <td className="p-3 text-sm text-muted-foreground">{a.customer_name || "—"}</td>
                    <td className="p-3 text-right text-sm font-mono">{fmt(Number(a.amount))}</td>
                    <td className="p-3 text-center text-sm">{new Date(a.due_date + "T12:00:00").toLocaleDateString("pt-BR")}</td>
                    <td className="p-3 text-center">
                      <Badge variant={a.status === "recebido" ? "default" : new Date(a.due_date) < new Date() ? "destructive" : "secondary"} className="text-xs">
                        {a.status === "recebido" ? "Pago" : new Date(a.due_date) < new Date() ? "Atrasado" : "Pendente"}
                      </Badge>
                    </td>
                    <td className="p-3">
                      {a.status !== "recebido" && canWrite && (
                        <Button variant="ghost" size="icon" onClick={() => markPaid(a.id)}><CheckCircle className="w-4 h-4 text-success" /></Button>
                      )}
                    </td>
                  </tr>
                ))}
                {items.length === 0 && <tr><td colSpan={6} className="p-12 text-center text-muted-foreground text-sm">Nenhum crediário encontrado. Finalize uma venda com pagamento "Crediário" no PDV.</td></tr>}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Crediario;

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Loader2 } from "lucide-react";

const Crediario = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("accounts_receivable").select("*").order("due_date");
      setItems(data || []);
      setLoading(false);
    })();
  }, []);

  const pending = items.filter(i => i.status === "pendente");
  const overdue = pending.filter(i => new Date(i.due_date) < new Date());

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><FileText className="w-5 h-5 text-primary" /></div>
        <div className="flex-1"><h1 className="text-xl font-bold">Crediário</h1><p className="text-sm text-muted-foreground">Carnês e parcelas dos clientes</p></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-border/50"><CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Parcelas pendentes</p>
          <p className="text-2xl font-bold font-mono mt-1">{pending.length}</p>
          <p className="text-sm font-mono text-muted-foreground">R$ {pending.reduce((s, i) => s + Number(i.amount), 0).toFixed(2)}</p>
        </CardContent></Card>
        <Card className="border-warning/50 bg-warning/5"><CardContent className="p-4">
          <p className="text-sm text-warning font-medium">Em atraso</p>
          <p className="text-2xl font-bold font-mono mt-1">{overdue.length}</p>
          <p className="text-sm font-mono text-muted-foreground">R$ {overdue.reduce((s, i) => s + Number(i.amount), 0).toFixed(2)}</p>
        </CardContent></Card>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-0">
          {loading ? <div className="flex items-center justify-center p-12"><Loader2 className="w-6 h-6 animate-spin" /></div> : (
            <table className="w-full">
              <thead><tr className="border-b border-border/50 bg-muted/50">
                <th className="text-left p-3 text-xs font-medium text-muted-foreground">Descrição</th>
                <th className="text-right p-3 text-xs font-medium text-muted-foreground w-28">Valor</th>
                <th className="text-center p-3 text-xs font-medium text-muted-foreground w-28">Vencimento</th>
                <th className="text-center p-3 text-xs font-medium text-muted-foreground w-24">Status</th>
              </tr></thead>
              <tbody>
                {items.map(a => (
                  <tr key={a.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                    <td className="p-3 text-sm">{a.description}</td>
                    <td className="p-3 text-right text-sm font-mono">R$ {Number(a.amount).toFixed(2)}</td>
                    <td className="p-3 text-center text-sm">{new Date(a.due_date + "T12:00:00").toLocaleDateString("pt-BR")}</td>
                    <td className="p-3 text-center">
                      <Badge variant={a.status === "recebido" ? "default" : new Date(a.due_date) < new Date() ? "destructive" : "secondary"} className="text-xs">
                        {a.status === "recebido" ? "Pago" : new Date(a.due_date) < new Date() ? "Atrasado" : "Pendente"}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && <tr><td colSpan={4} className="p-12 text-center text-muted-foreground text-sm">Nenhum registro</td></tr>}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Crediario;

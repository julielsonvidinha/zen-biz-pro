import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Landmark, Loader2, ArrowUpCircle, ArrowDownCircle, DollarSign } from "lucide-react";

interface FM { id: string; type: string; amount: number; description: string; payment_method: string | null; created_at: string; }

const Financeiro = () => {
  const { toast } = useToast();
  const [movements, setMovements] = useState<FM[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("financial_movements").select("*").order("created_at", { ascending: false }).limit(100);
      if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
      else setMovements((data as FM[]) || []);
      setLoading(false);
    })();
  }, []);

  const totalIn = movements.filter(m => m.type === "entrada").reduce((s, m) => s + Number(m.amount), 0);
  const totalOut = movements.filter(m => m.type === "saida").reduce((s, m) => s + Number(m.amount), 0);

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Landmark className="w-5 h-5 text-primary" /></div>
        <div className="flex-1"><h1 className="text-xl font-bold">Financeiro</h1><p className="text-sm text-muted-foreground">Fluxo de caixa e movimentações</p></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/50"><CardContent className="p-4">
          <div className="flex items-center gap-2 text-success"><ArrowUpCircle className="w-5 h-5" /><span className="text-sm font-medium">Entradas</span></div>
          <p className="text-2xl font-bold font-mono mt-2">R$ {totalIn.toFixed(2)}</p>
        </CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-4">
          <div className="flex items-center gap-2 text-destructive"><ArrowDownCircle className="w-5 h-5" /><span className="text-sm font-medium">Saídas</span></div>
          <p className="text-2xl font-bold font-mono mt-2">R$ {totalOut.toFixed(2)}</p>
        </CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-4">
          <div className="flex items-center gap-2 text-primary"><DollarSign className="w-5 h-5" /><span className="text-sm font-medium">Saldo</span></div>
          <p className="text-2xl font-bold font-mono mt-2">R$ {(totalIn - totalOut).toFixed(2)}</p>
        </CardContent></Card>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-0">
          {loading ? <div className="flex items-center justify-center p-12"><Loader2 className="w-6 h-6 animate-spin" /></div> : (
            <table className="w-full">
              <thead><tr className="border-b border-border/50 bg-muted/50">
                <th className="text-left p-3 text-xs font-medium text-muted-foreground w-10"></th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground">Descrição</th>
                <th className="text-right p-3 text-xs font-medium text-muted-foreground w-28">Valor</th>
                <th className="text-center p-3 text-xs font-medium text-muted-foreground w-28">Pagamento</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground w-28">Data</th>
              </tr></thead>
              <tbody>
                {movements.map(m => (
                  <tr key={m.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                    <td className="p-3">{m.type === "entrada" ? <ArrowUpCircle className="w-4 h-4 text-success" /> : <ArrowDownCircle className="w-4 h-4 text-destructive" />}</td>
                    <td className="p-3 text-sm">{m.description}</td>
                    <td className="p-3 text-right text-sm font-mono font-semibold">R$ {Number(m.amount).toFixed(2)}</td>
                    <td className="p-3 text-center"><Badge variant="outline" className="text-xs">{m.payment_method || "—"}</Badge></td>
                    <td className="p-3 text-sm text-muted-foreground">{new Date(m.created_at).toLocaleDateString("pt-BR")}</td>
                  </tr>
                ))}
                {movements.length === 0 && <tr><td colSpan={5} className="p-12 text-center text-muted-foreground text-sm">Nenhuma movimentação</td></tr>}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Financeiro;

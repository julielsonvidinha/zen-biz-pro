import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Receipt, Search, Loader2, Download } from "lucide-react";
import { generateSaleFullPDF } from "@/lib/pdf-generator";

interface Sale {
  id: string; sale_number: number; customer_name: string | null; total: number;
  subtotal: number; discount: number; payment_method: string; status: string; created_at: string;
}

const Vendas = () => {
  const { toast } = useToast();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("sales").select("*").order("created_at", { ascending: false }).limit(100);
      if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
      else setSales((data as Sale[]) || []);
      setLoading(false);
    })();
  }, []);

  const downloadPdf = async (sale: Sale) => {
    const { data: items } = await supabase.from("sale_items").select("*").eq("sale_id", sale.id);
    const doc = generateSaleFullPDF({ ...sale, items: items || [] });
    doc.save(`venda-${sale.sale_number}.pdf`);
  };

  const filtered = sales.filter(s => 
    String(s.sale_number).includes(search) || (s.customer_name && s.customer_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Receipt className="w-5 h-5 text-primary" /></div>
        <div className="flex-1"><h1 className="text-xl font-bold">Vendas</h1><p className="text-sm text-muted-foreground">Histórico de vendas realizadas</p></div>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar por número ou cliente..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>
      <Card className="border-border/50">
        <CardContent className="p-0">
          {loading ? <div className="flex items-center justify-center p-12"><Loader2 className="w-6 h-6 animate-spin" /></div> : (
            <table className="w-full">
              <thead><tr className="border-b border-border/50 bg-muted/50">
                <th className="text-left p-3 text-xs font-medium text-muted-foreground w-20">#</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground">Cliente</th>
                <th className="text-right p-3 text-xs font-medium text-muted-foreground w-28">Total</th>
                <th className="text-center p-3 text-xs font-medium text-muted-foreground w-28">Pagamento</th>
                <th className="text-center p-3 text-xs font-medium text-muted-foreground w-28">Status</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground w-28">Data</th>
                <th className="p-3 w-16"></th>
              </tr></thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                    <td className="p-3 text-sm font-mono font-medium">{s.sale_number}</td>
                    <td className="p-3 text-sm">{s.customer_name || "Não identificado"}</td>
                    <td className="p-3 text-right text-sm font-mono font-semibold">R$ {Number(s.total).toFixed(2)}</td>
                    <td className="p-3 text-center"><Badge variant="outline" className="text-xs">{s.payment_method}</Badge></td>
                    <td className="p-3 text-center"><Badge variant={s.status === "finalizada" ? "default" : "secondary"} className="text-xs">{s.status}</Badge></td>
                    <td className="p-3 text-sm text-muted-foreground">{new Date(s.created_at).toLocaleDateString("pt-BR")}</td>
                    <td className="p-3"><Button variant="ghost" size="icon" onClick={() => downloadPdf(s)}><Download className="w-4 h-4" /></Button></td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={7} className="p-12 text-center text-muted-foreground text-sm">Nenhuma venda encontrada</td></tr>}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Vendas;

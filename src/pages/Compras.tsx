import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingBag, Plus, Loader2 } from "lucide-react";

const Compras = () => {
  const { toast } = useToast();
  const { user, hasRole } = useAuth();
  const canWrite = hasRole("admin") || hasRole("gerente");
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ supplier_id: "", product_id: "", qty: 1, unit_cost: 0 });
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [s, p, m] = await Promise.all([
        supabase.from("suppliers").select("id, name").order("name"),
        supabase.from("products").select("id, name, cost_price").eq("active", true).order("name"),
        supabase.from("stock_movements").select("*").eq("type", "entrada").order("created_at", { ascending: false }).limit(50),
      ]);
      setSuppliers(s.data || []);
      setProducts(p.data || []);
      setMovements(m.data || []);
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    if (!form.product_id || form.qty <= 0) {
      toast({ title: "Preencha produto e quantidade", variant: "destructive" }); return;
    }
    setSaving(true);
    const sup = suppliers.find(s => s.id === form.supplier_id);
    const prod = products.find(p => p.id === form.product_id);

    // Register stock entry
    await supabase.from("stock_movements").insert({
      product_id: form.product_id, type: "entrada", qty: form.qty,
      reason: `Compra${sup ? " - " + sup.name : ""}`, user_id: user!.id,
    });
    // Update stock
    const currentQty = prod?.stock_qty || 0;
    await supabase.from("products").update({ stock_qty: currentQty + form.qty }).eq("id", form.product_id);
    // Register financial movement (saída)
    const totalCost = form.qty * (form.unit_cost || Number(prod?.cost_price || 0));
    if (totalCost > 0) {
      await supabase.from("financial_movements").insert({
        type: "saida", amount: totalCost, description: `Compra: ${prod?.name}`,
        payment_method: "dinheiro", user_id: user!.id,
      });
    }

    toast({ title: "Compra registrada!" });
    setDialogOpen(false);
    // Refresh
    const { data } = await supabase.from("stock_movements").select("*").eq("type", "entrada").order("created_at", { ascending: false }).limit(50);
    setMovements(data || []);
    setSaving(false);
  };

  const prodName = (id: string) => products.find(p => p.id === id)?.name || id;

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><ShoppingBag className="w-5 h-5 text-primary" /></div>
        <div className="flex-1"><h1 className="text-xl font-bold">Compras</h1><p className="text-sm text-muted-foreground">Registro de compras e entradas</p></div>
        {canWrite && <Button onClick={() => { setForm({ supplier_id: "", product_id: "", qty: 1, unit_cost: 0 }); setDialogOpen(true); }} className="gap-2"><Plus className="w-4 h-4" /> Nova Compra</Button>}
      </div>
      <Card className="border-border/50">
        <CardContent className="p-0">
          {loading ? <div className="flex items-center justify-center p-12"><Loader2 className="w-6 h-6 animate-spin" /></div> : (
            <table className="w-full">
              <thead><tr className="border-b border-border/50 bg-muted/50">
                <th className="text-left p-3 text-xs font-medium text-muted-foreground">Produto</th>
                <th className="text-right p-3 text-xs font-medium text-muted-foreground w-20">Qtd</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground">Motivo</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground w-28">Data</th>
              </tr></thead>
              <tbody>
                {movements.map(m => (
                  <tr key={m.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                    <td className="p-3 text-sm font-medium">{prodName(m.product_id)}</td>
                    <td className="p-3 text-right text-sm font-mono">{Number(m.qty)}</td>
                    <td className="p-3 text-sm text-muted-foreground">{m.reason || "—"}</td>
                    <td className="p-3 text-sm text-muted-foreground">{new Date(m.created_at).toLocaleDateString("pt-BR")}</td>
                  </tr>
                ))}
                {movements.length === 0 && <tr><td colSpan={4} className="p-12 text-center text-muted-foreground text-sm">Nenhuma compra registrada</td></tr>}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent><DialogHeader><DialogTitle>Nova Compra</DialogTitle><DialogDescription>Registre entrada de mercadoria</DialogDescription></DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Fornecedor</Label>
              <Select value={form.supplier_id} onValueChange={v => setForm(f => ({ ...f, supplier_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
                <SelectContent>{suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Produto *</Label>
              <Select value={form.product_id} onValueChange={v => setForm(f => ({ ...f, product_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Quantidade *</Label><Input type="number" min={1} value={form.qty} onChange={e => setForm(f => ({ ...f, qty: parseInt(e.target.value) || 0 }))} /></div>
              <div><Label>Custo Unitário</Label><Input type="number" step="0.01" value={form.unit_cost} onChange={e => setForm(f => ({ ...f, unit_cost: parseFloat(e.target.value) || 0 }))} /></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button><Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Registrar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Compras;

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Search, Plus, Warehouse, Loader2, ArrowUpCircle, ArrowDownCircle } from "lucide-react";

interface StockMov { id: string; product_id: string; type: string; qty: number; reason: string | null; created_at: string; }
interface Product { id: string; name: string; stock_qty: number; min_stock: number; }

const Estoque = () => {
  const { toast } = useToast();
  const { user, hasRole } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMov[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ product_id: "", type: "entrada", qty: 1, reason: "" });

  const canWrite = hasRole("admin") || hasRole("gerente");

  const fetchData = async () => {
    setLoading(true);
    const [p, m] = await Promise.all([
      supabase.from("products").select("id, name, stock_qty, min_stock").eq("active", true).order("name"),
      supabase.from("stock_movements").select("*").order("created_at", { ascending: false }).limit(50),
    ]);
    if (p.data) setProducts(p.data as Product[]);
    if (m.data) setMovements(m.data as StockMov[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    if (!form.product_id || form.qty <= 0) {
      toast({ title: "Preencha produto e quantidade", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error: moveErr } = await supabase.from("stock_movements").insert({
      product_id: form.product_id, type: form.type, qty: form.qty,
      reason: form.reason || null, user_id: user!.id,
    });
    if (moveErr) { toast({ title: "Erro", description: moveErr.message, variant: "destructive" }); setSaving(false); return; }

    const delta = form.type === "entrada" ? form.qty : -form.qty;
    await supabase.from("products").update({ stock_qty: (products.find(p => p.id === form.product_id)?.stock_qty || 0) + delta }).eq("id", form.product_id);
    
    toast({ title: `Movimentação de ${form.type} registrada!` });
    setDialogOpen(false);
    fetchData();
    setSaving(false);
  };

  const prodName = (id: string) => products.find(p => p.id === id)?.name || id;
  const lowStock = products.filter(p => Number(p.stock_qty) <= Number(p.min_stock));
  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Warehouse className="w-5 h-5 text-primary" /></div>
        <div className="flex-1"><h1 className="text-xl font-bold">Estoque</h1><p className="text-sm text-muted-foreground">Controle de estoque e movimentações</p></div>
        {canWrite && <Button onClick={() => { setForm({ product_id: "", type: "entrada", qty: 1, reason: "" }); setDialogOpen(true); }} className="gap-2"><Plus className="w-4 h-4" /> Nova Movimentação</Button>}
      </div>

      {lowStock.length > 0 && (
        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="p-3">
            <p className="text-sm font-medium text-warning">⚠ {lowStock.length} produto(s) abaixo do estoque mínimo</p>
            <p className="text-xs text-muted-foreground mt-1">{lowStock.map(p => p.name).join(", ")}</p>
          </CardContent>
        </Card>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar produto..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-0">
            <div className="p-3 border-b border-border/50 bg-muted/50"><p className="text-xs font-medium text-muted-foreground">Posição de Estoque</p></div>
            {loading ? <div className="flex items-center justify-center p-12"><Loader2 className="w-6 h-6 animate-spin" /></div> : (
              <div className="max-h-[400px] overflow-auto">
                {filtered.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 border-b border-border/50 last:border-0">
                    <span className="text-sm">{p.name}</span>
                    <Badge variant={Number(p.stock_qty) <= Number(p.min_stock) ? "destructive" : "default"} className="font-mono">{Number(p.stock_qty)}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-0">
            <div className="p-3 border-b border-border/50 bg-muted/50"><p className="text-xs font-medium text-muted-foreground">Últimas Movimentações</p></div>
            <div className="max-h-[400px] overflow-auto">
              {movements.map(m => (
                <div key={m.id} className="flex items-center gap-3 p-3 border-b border-border/50 last:border-0">
                  {m.type === "entrada" ? <ArrowUpCircle className="w-4 h-4 text-success shrink-0" /> : <ArrowDownCircle className="w-4 h-4 text-destructive shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{prodName(m.product_id)}</p>
                    <p className="text-xs text-muted-foreground">{m.reason || m.type} • {new Date(m.created_at).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <Badge variant={m.type === "entrada" ? "default" : "secondary"} className="font-mono">{m.type === "entrada" ? "+" : "-"}{Number(m.qty)}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Movimentação de Estoque</DialogTitle><DialogDescription>Registre entrada ou saída de produtos</DialogDescription></DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Produto *</Label>
              <Select value={form.product_id} onValueChange={v => setForm(f => ({ ...f, product_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="saida">Saída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Quantidade *</Label><Input type="number" min={1} value={form.qty} onChange={e => setForm(f => ({ ...f, qty: parseInt(e.target.value) || 0 }))} /></div>
            </div>
            <div><Label>Motivo</Label><Input value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} placeholder="Ex: Compra, Ajuste, Devolução..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Estoque;

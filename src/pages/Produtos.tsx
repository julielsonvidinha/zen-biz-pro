import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Search, Plus, Pencil, Trash2, Package, Loader2 } from "lucide-react";

interface Product {
  id: string;
  name: string;
  barcode: string | null;
  sku: string | null;
  description: string | null;
  price: number;
  cost_price: number;
  stock_qty: number;
  min_stock: number;
  unit: string;
  ncm: string | null;
  cfop: string | null;
  cst: string | null;
  category: string | null;
  active: boolean;
}

const emptyProduct = {
  name: "", barcode: "", sku: "", description: "", price: 0, cost_price: 0,
  stock_qty: 0, min_stock: 0, unit: "UN", ncm: "", cfop: "5102", cst: "00", category: "", active: true,
};

const Produtos = () => {
  const { toast } = useToast();
  const { hasRole } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyProduct);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const canWrite = hasRole("admin") || hasRole("gerente");
  const canDelete = hasRole("admin");

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("products").select("*").order("name");
    if (error) {
      toast({ title: "Erro ao carregar produtos", description: error.message, variant: "destructive" });
    } else {
      setProducts(data as Product[]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Nome é obrigatório";
    if (form.price <= 0) e.price = "Preço deve ser maior que zero";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const openCreate = () => {
    setEditingProduct(null);
    setForm(emptyProduct);
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setForm({
      name: p.name, barcode: p.barcode || "", sku: p.sku || "", description: p.description || "",
      price: p.price, cost_price: p.cost_price, stock_qty: p.stock_qty, min_stock: p.min_stock,
      unit: p.unit, ncm: p.ncm || "", cfop: p.cfop || "5102", cst: p.cst || "00",
      category: p.category || "", active: p.active,
    });
    setErrors({});
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      barcode: form.barcode || null,
      sku: form.sku || null,
      description: form.description || null,
      price: Number(form.price),
      cost_price: Number(form.cost_price),
      stock_qty: Number(form.stock_qty),
      min_stock: Number(form.min_stock),
      unit: form.unit,
      ncm: form.ncm || null,
      cfop: form.cfop || null,
      cst: form.cst || null,
      category: form.category || null,
      active: form.active,
    };

    let error;
    if (editingProduct) {
      ({ error } = await supabase.from("products").update(payload).eq("id", editingProduct.id));
    } else {
      ({ error } = await supabase.from("products").insert(payload));
    }

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editingProduct ? "Produto atualizado!" : "Produto criado!" });
      setDialogOpen(false);
      fetchProducts();
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from("products").delete().eq("id", deleteTarget.id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Produto excluído!" });
      fetchProducts();
    }
    setDeleting(false);
    setDeleteDialogOpen(false);
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.barcode && p.barcode.includes(search)) ||
    (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Package className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Produtos</h1>
          <p className="text-sm text-muted-foreground">Cadastro e gestão de produtos</p>
        </div>
        {canWrite && (
          <Button onClick={openCreate} className="gap-2">
            <Plus className="w-4 h-4" /> Novo Produto
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar por nome, código ou código de barras..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      <Card className="border-border/50">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 bg-muted/50">
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Nome</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground w-28">Código</th>
                  <th className="text-right p-3 text-xs font-medium text-muted-foreground w-24">Preço</th>
                  <th className="text-right p-3 text-xs font-medium text-muted-foreground w-24">Estoque</th>
                  <th className="text-center p-3 text-xs font-medium text-muted-foreground w-20">Status</th>
                  {canWrite && <th className="p-3 w-24"></th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                    <td className="p-3 text-sm font-medium">{p.name}</td>
                    <td className="p-3 text-sm text-muted-foreground font-mono">{p.barcode || p.sku || "—"}</td>
                    <td className="p-3 text-right text-sm font-mono">R$ {Number(p.price).toFixed(2)}</td>
                    <td className="p-3 text-right text-sm font-mono">
                      <span className={Number(p.stock_qty) <= Number(p.min_stock) ? "text-destructive font-semibold" : ""}>
                        {Number(p.stock_qty).toFixed(0)}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <Badge variant={p.active ? "default" : "secondary"} className="text-xs">
                        {p.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </td>
                    {canWrite && (
                      <td className="p-3 flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="w-4 h-4" /></Button>
                        {canDelete && (
                          <Button variant="ghost" size="icon" onClick={() => { setDeleteTarget(p); setDeleteDialogOpen(true); }}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={canWrite ? 6 : 5} className="p-12 text-center text-muted-foreground text-sm">Nenhum produto encontrado</td></tr>
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Editar Produto" : "Novo Produto"}</DialogTitle>
            <DialogDescription>Preencha os campos obrigatórios (*)</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Nome *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Código de Barras</Label><Input value={form.barcode} onChange={e => setForm(f => ({ ...f, barcode: e.target.value }))} /></div>
              <div><Label>SKU</Label><Input value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Preço de Venda *</Label>
                <Input type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))} />
                {errors.price && <p className="text-xs text-destructive mt-1">{errors.price}</p>}
              </div>
              <div><Label>Preço de Custo</Label><Input type="number" step="0.01" value={form.cost_price} onChange={e => setForm(f => ({ ...f, cost_price: parseFloat(e.target.value) || 0 }))} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Estoque</Label><Input type="number" value={form.stock_qty} onChange={e => setForm(f => ({ ...f, stock_qty: parseFloat(e.target.value) || 0 }))} /></div>
              <div><Label>Estoque Mín.</Label><Input type="number" value={form.min_stock} onChange={e => setForm(f => ({ ...f, min_stock: parseFloat(e.target.value) || 0 }))} /></div>
              <div><Label>Unidade</Label><Input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>NCM</Label><Input value={form.ncm} onChange={e => setForm(f => ({ ...f, ncm: e.target.value }))} /></div>
              <div><Label>CFOP</Label><Input value={form.cfop} onChange={e => setForm(f => ({ ...f, cfop: e.target.value }))} /></div>
              <div><Label>CST</Label><Input value={form.cst} onChange={e => setForm(f => ({ ...f, cst: e.target.value }))} /></div>
            </div>
            <div><Label>Categoria</Label><Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} /></div>
            <div><Label>Descrição</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editingProduct ? "Salvar Alterações" : "Criar Produto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{deleteTarget?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Produtos;

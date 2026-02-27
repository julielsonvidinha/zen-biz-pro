import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Search, Plus, Pencil, Trash2, Users, Loader2 } from "lucide-react";

interface Customer {
  id: string; name: string; cpf_cnpj: string; phone: string; email: string;
  address: string; city: string; state: string; notes: string; active: boolean;
}

const empty = { name: "", cpf_cnpj: "", phone: "", email: "", address: "", city: "", state: "", notes: "" };

const Clientes = () => {
  const { toast } = useToast();
  const { hasRole } = useAuth();
  const [items, setItems] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const canWrite = hasRole("admin") || hasRole("gerente");
  const canDelete = hasRole("admin");

  const fetch_ = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("customers").select("*").order("name");
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else setItems((data as Customer[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetch_(); }, []);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Nome é obrigatório";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const openCreate = () => { setEditing(null); setForm(empty); setErrors({}); setDialogOpen(true); };
  const openEdit = (c: Customer) => {
    setEditing(c);
    setForm({ name: c.name, cpf_cnpj: c.cpf_cnpj || "", phone: c.phone || "", email: c.email || "", address: c.address || "", city: c.city || "", state: c.state || "", notes: c.notes || "" });
    setErrors({});
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    const payload = { name: form.name.trim(), cpf_cnpj: form.cpf_cnpj || null, phone: form.phone || null, email: form.email || null, address: form.address || null, city: form.city || null, state: form.state || null, notes: form.notes || null };
    let error;
    if (editing) {
      ({ error } = await supabase.from("customers").update(payload).eq("id", editing.id));
    } else {
      ({ error } = await supabase.from("customers").insert(payload));
    }
    if (error) toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    else { toast({ title: editing ? "Cliente atualizado!" : "Cliente criado!" }); setDialogOpen(false); fetch_(); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from("customers").delete().eq("id", deleteTarget.id);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else { toast({ title: "Cliente excluído!" }); fetch_(); }
    setDeleteOpen(false);
  };

  const filtered = items.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || (c.cpf_cnpj && c.cpf_cnpj.includes(search)));

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Users className="w-5 h-5 text-primary" /></div>
        <div className="flex-1"><h1 className="text-xl font-bold">Clientes</h1><p className="text-sm text-muted-foreground">Cadastro e gestão de clientes</p></div>
        <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Novo Cliente</Button>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar por nome ou CPF/CNPJ..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>
      <Card className="border-border/50">
        <CardContent className="p-0">
          {loading ? <div className="flex items-center justify-center p-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div> : (
            <table className="w-full">
              <thead><tr className="border-b border-border/50 bg-muted/50">
                <th className="text-left p-3 text-xs font-medium text-muted-foreground">Nome</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground w-36">CPF/CNPJ</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground w-32">Telefone</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground w-32">Cidade</th>
                <th className="p-3 w-24"></th>
              </tr></thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                    <td className="p-3 text-sm font-medium">{c.name}</td>
                    <td className="p-3 text-sm text-muted-foreground font-mono">{c.cpf_cnpj || "—"}</td>
                    <td className="p-3 text-sm text-muted-foreground">{c.phone || "—"}</td>
                    <td className="p-3 text-sm text-muted-foreground">{c.city || "—"}</td>
                    <td className="p-3 flex gap-1 justify-end">
                      {canWrite && <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="w-4 h-4" /></Button>}
                      {canDelete && <Button variant="ghost" size="icon" onClick={() => { setDeleteTarget(c); setDeleteOpen(true); }}><Trash2 className="w-4 h-4 text-destructive" /></Button>}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={5} className="p-12 text-center text-muted-foreground text-sm">Nenhum cliente encontrado</td></tr>}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Editar Cliente" : "Novo Cliente"}</DialogTitle><DialogDescription>Preencha os campos (*obrigatórios)</DialogDescription></DialogHeader>
          <div className="grid gap-3">
            <div><Label>Nome *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />{errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}</div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>CPF/CNPJ</Label><Input value={form.cpf_cnpj} onChange={e => setForm(f => ({ ...f, cpf_cnpj: e.target.value }))} /></div>
              <div><Label>Telefone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
            </div>
            <div><Label>E-mail</Label><Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div><Label>Endereço</Label><Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Cidade</Label><Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} /></div>
              <div><Label>UF</Label><Input value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} /></div>
            </div>
            <div><Label>Observações</Label><Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}{editing ? "Salvar" : "Criar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir cliente?</AlertDialogTitle><AlertDialogDescription>Tem certeza que deseja excluir "{deleteTarget?.name}"?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Clientes;

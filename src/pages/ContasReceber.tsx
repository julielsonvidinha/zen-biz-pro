import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Wallet, Loader2, CheckCircle } from "lucide-react";

interface AR { id: string; description: string; amount: number; due_date: string; paid_date: string | null; status: string; }

const ContasReceber = () => {
  const { toast } = useToast();
  const { user, hasRole } = useAuth();
  const [items, setItems] = useState<AR[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ description: "", amount: 0, due_date: "" });

  const canWrite = hasRole("admin") || hasRole("gerente");

  const fetch_ = async () => {
    setLoading(true);
    const { data } = await supabase.from("accounts_receivable").select("*").order("due_date");
    setItems((data as AR[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetch_(); }, []);

  const handleSave = async () => {
    if (!form.description.trim() || !form.due_date || form.amount <= 0) {
      toast({ title: "Preencha todos os campos", variant: "destructive" }); return;
    }
    setSaving(true);
    const { error } = await supabase.from("accounts_receivable").insert({
      description: form.description, amount: form.amount, due_date: form.due_date, user_id: user!.id,
    });
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else { toast({ title: "Conta criada!" }); setDialogOpen(false); fetch_(); }
    setSaving(false);
  };

  const markPaid = async (id: string) => {
    await supabase.from("accounts_receivable").update({ status: "recebido", paid_date: new Date().toISOString().split("T")[0] }).eq("id", id);
    toast({ title: "Conta marcada como recebida!" });
    fetch_();
  };

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Wallet className="w-5 h-5 text-primary" /></div>
        <div className="flex-1"><h1 className="text-xl font-bold">Contas a Receber</h1><p className="text-sm text-muted-foreground">Controle de recebíveis</p></div>
        {canWrite && <Button onClick={() => { setForm({ description: "", amount: 0, due_date: "" }); setDialogOpen(true); }} className="gap-2"><Plus className="w-4 h-4" /> Novo</Button>}
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
                <th className="p-3 w-16"></th>
              </tr></thead>
              <tbody>
                {items.map(a => (
                  <tr key={a.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                    <td className="p-3 text-sm">{a.description}</td>
                    <td className="p-3 text-right text-sm font-mono">R$ {Number(a.amount).toFixed(2)}</td>
                    <td className="p-3 text-center text-sm">{new Date(a.due_date + "T12:00:00").toLocaleDateString("pt-BR")}</td>
                    <td className="p-3 text-center"><Badge variant={a.status === "recebido" ? "default" : "secondary"} className="text-xs">{a.status}</Badge></td>
                    <td className="p-3">{a.status !== "recebido" && canWrite && <Button variant="ghost" size="icon" onClick={() => markPaid(a.id)}><CheckCircle className="w-4 h-4 text-success" /></Button>}</td>
                  </tr>
                ))}
                {items.length === 0 && <tr><td colSpan={5} className="p-12 text-center text-muted-foreground text-sm">Nenhuma conta</td></tr>}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent><DialogHeader><DialogTitle>Novo Recebível</DialogTitle><DialogDescription>Preencha os dados</DialogDescription></DialogHeader>
          <div className="grid gap-3">
            <div><Label>Descrição *</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Valor *</Label><Input type="number" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} /></div>
              <div><Label>Vencimento *</Label><Input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button><Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Criar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContasReceber;

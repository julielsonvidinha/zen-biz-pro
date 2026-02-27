import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Settings, Save, Loader2, Building2 } from "lucide-react";

const Configuracoes = () => {
  const { toast } = useToast();
  const { user, hasRole } = useAuth();
  const canEdit = hasRole("admin");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    company_name: "", trade_name: "", cnpj: "", ie: "", im: "",
    phone: "", email: "",
    address_street: "", address_number: "", address_complement: "",
    address_neighborhood: "", address_city: "", address_state: "", address_zip: "",
  });

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("company_settings").select("*").limit(1).maybeSingle();
      if (data) {
        setExistingId(data.id);
        setForm({
          company_name: data.company_name || "",
          trade_name: data.trade_name || "",
          cnpj: data.cnpj || "",
          ie: data.ie || "",
          im: data.im || "",
          phone: data.phone || "",
          email: data.email || "",
          address_street: data.address_street || "",
          address_number: data.address_number || "",
          address_complement: data.address_complement || "",
          address_neighborhood: data.address_neighborhood || "",
          address_city: data.address_city || "",
          address_state: data.address_state || "",
          address_zip: data.address_zip || "",
        });
      }
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    if (!form.company_name.trim()) {
      toast({ title: "Razão Social é obrigatória", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = { ...form, user_id: user!.id };
    let error;
    if (existingId) {
      ({ error } = await supabase.from("company_settings").update(payload).eq("id", existingId));
    } else {
      const { data, error: e } = await supabase.from("company_settings").insert(payload).select("id").single();
      error = e;
      if (data) setExistingId(data.id);
    }
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Configurações salvas com sucesso!" });
    }
    setSaving(false);
  };

  const f = (key: keyof typeof form, label: string) => (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} disabled={!canEdit} className="h-9 text-sm" />
    </div>
  );

  if (loading) return <div className="flex items-center justify-center p-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="animate-fade-in space-y-4 max-w-3xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Settings className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Configurações</h1>
          <p className="text-sm text-muted-foreground">Dados da empresa e parâmetros do sistema</p>
        </div>
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="w-4 h-4" /> Dados da Empresa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {f("company_name", "Razão Social *")}
            {f("trade_name", "Nome Fantasia")}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {f("cnpj", "CNPJ")}
            {f("ie", "Inscrição Estadual")}
            {f("im", "Inscrição Municipal")}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {f("phone", "Telefone")}
            {f("email", "E-mail")}
          </div>

          <div className="border-t border-border/50 pt-4">
            <p className="text-sm font-medium mb-3">Endereço</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">{f("address_street", "Logradouro")}</div>
              {f("address_number", "Número")}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              {f("address_complement", "Complemento")}
              {f("address_neighborhood", "Bairro")}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
              {f("address_city", "Cidade")}
              {f("address_state", "UF")}
              {f("address_zip", "CEP")}
            </div>
          </div>

          {canEdit && (
            <div className="pt-4 border-t border-border/50 flex justify-end">
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Salvar Configurações
              </Button>
            </div>
          )}
          {!canEdit && (
            <p className="text-xs text-muted-foreground text-center pt-2">
              Apenas administradores podem editar as configurações.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Configuracoes;

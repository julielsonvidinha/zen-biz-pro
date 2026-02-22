import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSign, ShoppingCart, Users, Package, TrendingUp, TrendingDown,
  AlertTriangle, Calendar
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const stats = [
  { label: "Vendas Hoje", value: "R$ 12.450,00", icon: DollarSign, change: "+12%", positive: true },
  { label: "Pedidos", value: "48", icon: ShoppingCart, change: "+8%", positive: true },
  { label: "Clientes Ativos", value: "1.247", icon: Users, change: "+3%", positive: true },
  { label: "Produtos em Estoque", value: "3.891", icon: Package, change: "-2%", positive: false },
];

const alerts = [
  { text: "23 produtos abaixo do estoque mínimo", type: "warning" as const },
  { text: "8 contas a pagar vencem hoje", type: "destructive" as const },
  { text: "5 medicamentos próximos do vencimento", type: "warning" as const },
  { text: "12 clientes com parcelas em atraso", type: "destructive" as const },
];

const Dashboard = () => {
  const { profile } = useAuth();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">
          Olá, {profile?.full_name || "Usuário"} 👋
        </h1>
        <p className="text-muted-foreground text-sm">
          Confira o resumo do seu negócio hoje
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <s.icon className="w-5 h-5 text-primary" />
                </div>
                <span
                  className={`flex items-center gap-1 text-xs font-medium ${
                    s.positive ? "text-success" : "text-destructive"
                  }`}
                >
                  {s.positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {s.change}
                </span>
              </div>
              <p className="text-2xl font-bold font-mono">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Alerts */}
        <Card className="lg:col-span-1 border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              Alertas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.map((a, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 p-3 rounded-lg text-sm ${
                  a.type === "warning"
                    ? "bg-warning/10 text-warning"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                {a.text}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Sales */}
        <Card className="lg:col-span-2 border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Últimas Vendas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { client: "Maria Silva", value: "R$ 245,90", time: "há 5 min", items: 3 },
                { client: "João Santos", value: "R$ 89,50", time: "há 12 min", items: 1 },
                { client: "Ana Costa", value: "R$ 567,00", time: "há 25 min", items: 7 },
                { client: "Pedro Oliveira", value: "R$ 134,80", time: "há 40 min", items: 2 },
                { client: "Carla Mendes", value: "R$ 312,40", time: "há 1h", items: 4 },
              ].map((sale, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{sale.client}</p>
                    <p className="text-xs text-muted-foreground">{sale.items} {sale.items === 1 ? "item" : "itens"} • {sale.time}</p>
                  </div>
                  <span className="font-mono text-sm font-semibold text-success">{sale.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;

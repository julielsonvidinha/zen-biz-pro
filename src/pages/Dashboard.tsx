import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign, ShoppingCart, Users, Package, TrendingUp, TrendingDown,
  AlertTriangle, Calendar, FileText, Truck, BarChart3, Wallet,
  ArrowUpRight, ArrowDownRight, CheckCircle2, Clock, ShoppingBag,
  Receipt, Printer, FileDown
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar
} from "recharts";

interface DashboardData {
  dailyRevenue: number;
  monthlyRevenue: number;
  totalCustomers: number;
  lowStockCount: number;
  recentSales: { id: string; sale_number: number; total: number; created_at: string; customer_name: string | null; status: string }[];
  topProducts: { name: string; qty: number }[];
  pendingPayables: { description: string; amount: number }[];
  pendingInvoices: number;
  cashIn: number;
  cashOut: number;
}

const COLORS = [
  "hsl(224, 76%, 40%)",
  "hsl(142, 71%, 35%)",
  "hsl(38, 92%, 50%)",
  "hsl(262, 52%, 47%)",
  "hsl(0, 72%, 51%)",
];

const mockChartData = [
  { name: "Sem 1", vendas: 4200, faturamento: 5100 },
  { name: "Sem 2", vendas: 5800, faturamento: 6200 },
  { name: "Sem 3", vendas: 4900, faturamento: 5500 },
  { name: "Sem 4", vendas: 7200, faturamento: 8100 },
];

const abcData = [
  { name: "A", value: 210, color: "hsl(38, 92%, 50%)" },
  { name: "B", value: 540, color: "hsl(224, 76%, 40%)" },
  { name: "C", value: 125, color: "hsl(142, 71%, 35%)" },
];

const Dashboard = () => {
  const { profile, user, roles } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData>({
    dailyRevenue: 0, monthlyRevenue: 0, totalCustomers: 0, lowStockCount: 0,
    recentSales: [], topProducts: [], pendingPayables: [], pendingInvoices: 0,
    cashIn: 0, cashOut: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

      const [salesToday, salesMonth, customers, lowStock, recentSales, payables, invoices, movIn, movOut] = await Promise.all([
        supabase.from("sales").select("total").gte("created_at", startOfDay).eq("status", "finalizada"),
        supabase.from("sales").select("total").gte("created_at", startOfMonth).eq("status", "finalizada"),
        supabase.from("customers").select("id", { count: "exact", head: true }),
        supabase.from("products").select("id", { count: "exact", head: true }).lt("stock_qty", 10).eq("active", true),
        supabase.from("sales").select("id, sale_number, total, created_at, customer_name, status").order("created_at", { ascending: false }).limit(5),
        supabase.from("accounts_payable").select("description, amount").eq("status", "pendente").order("due_date").limit(5),
        supabase.from("invoices").select("id", { count: "exact", head: true }).eq("status", "pendente"),
        supabase.from("financial_movements").select("amount").eq("type", "entrada").gte("created_at", startOfDay),
        supabase.from("financial_movements").select("amount").eq("type", "saida").gte("created_at", startOfDay),
      ]);

      // Top products from sale_items
      const { data: topProds } = await supabase.from("sale_items").select("product_name, qty").order("qty", { ascending: false }).limit(5);

      const aggregate = (rows: any[] | null) => (rows || []).reduce((s, r) => s + (r.total || r.amount || 0), 0);

      setData({
        dailyRevenue: aggregate(salesToday.data),
        monthlyRevenue: aggregate(salesMonth.data),
        totalCustomers: customers.count || 0,
        lowStockCount: lowStock.count || 0,
        recentSales: (recentSales.data as any[]) || [],
        topProducts: (topProds || []).reduce((acc: { name: string; qty: number }[], item: any) => {
          const existing = acc.find(p => p.name === item.product_name);
          if (existing) existing.qty += item.qty;
          else acc.push({ name: item.product_name, qty: item.qty });
          return acc;
        }, []).sort((a: any, b: any) => b.qty - a.qty).slice(0, 5),
        pendingPayables: (payables.data as any[]) || [],
        pendingInvoices: invoices.count || 0,
        cashIn: aggregate(movIn.data),
        cashOut: aggregate(movOut.data),
      });
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const quickActions = [
    { label: "Produtos", sub: "Cadastrar Produto", icon: Package, color: "bg-primary", path: "/produtos" },
    { label: "Vendas", sub: "Registrar Venda", icon: ShoppingCart, color: "bg-primary", path: "/pdv" },
    { label: "Clientes", sub: "Cadastrar Cliente", icon: Users, color: "bg-[hsl(142,71%,35%)]", path: "/clientes" },
    { label: "Fornecedores", sub: "Cadastrar Fornecedor", icon: Truck, color: "bg-[hsl(142,71%,35%)]", path: "/fornecedores" },
    { label: "Estoque", sub: "Controle de Estoque", icon: Package, color: "bg-[hsl(38,92%,50%)]", path: "/estoque" },
    { label: "Relatórios", sub: "Gerar Relatórios", icon: BarChart3, color: "bg-[hsl(38,92%,50%)]", path: "/relatorios" },
    { label: "Fiscal", sub: "Nota Fiscal", icon: FileText, color: "bg-primary", path: "/fiscal" },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Olá, {profile?.full_name || "Usuário"} 👋
          </h1>
          <p className="text-muted-foreground text-sm">
            Confira o resumo do seu negócio hoje • {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <Badge variant="outline" className="text-xs">{roles[0] || "usuário"}</Badge>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {quickActions.map((a) => (
          <Card
            key={a.label}
            className="cursor-pointer hover:shadow-md transition-shadow border-border/50 group"
            onClick={() => navigate(a.path)}
          >
            <CardContent className="p-3 flex flex-col items-center text-center gap-2">
              <div className={`w-12 h-12 rounded-xl ${a.color} flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}>
                <a.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xs font-semibold">{a.label}</span>
              <Button variant="default" size="sm" className="text-[10px] h-6 px-2 w-full">
                {a.sub}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="bg-primary text-primary-foreground border-0">
          <CardContent className="p-4">
            <p className="text-xs opacity-80">Faturamento Diário</p>
            <p className="text-2xl font-bold font-mono mt-1">{fmt(data.dailyRevenue)}</p>
          </CardContent>
        </Card>
        <Card className="bg-[hsl(224,76%,30%)] text-primary-foreground border-0">
          <CardContent className="p-4">
            <p className="text-xs opacity-80">Faturamento Mensal</p>
            <p className="text-2xl font-bold font-mono mt-1">{fmt(data.monthlyRevenue)}</p>
          </CardContent>
        </Card>
        <Card className="bg-destructive text-destructive-foreground border-0">
          <CardContent className="p-4">
            <p className="text-xs opacity-80">Lucro Líquido</p>
            <p className="text-2xl font-bold font-mono mt-1">{fmt(data.monthlyRevenue * 0.35)}</p>
          </CardContent>
        </Card>
        <Card className="bg-[hsl(38,92%,50%)] text-primary-foreground border-0">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs opacity-80">Estoque Baixo</p>
              <p className="text-2xl font-bold font-mono mt-1">{data.lowStockCount} Produtos</p>
            </div>
            <AlertTriangle className="w-8 h-8 opacity-60" />
          </CardContent>
        </Card>
      </div>

      {/* Middle Section: Products + Chart + Sales/Fiscal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column */}
        <div className="space-y-4">
          {/* Top Products */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-primary" />
                Produtos Mais Vendidos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.topProducts.length === 0 && <p className="text-xs text-muted-foreground">Nenhum dado</p>}
              {data.topProducts.map((p, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="truncate max-w-[140px]">{p.name}</span>
                  </div>
                  <span className="font-mono font-semibold">{p.qty}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Pending Payables */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Wallet className="w-4 h-4 text-destructive" />
                Contas a Pagar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.pendingPayables.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma conta pendente</p>}
              {data.pendingPayables.map((p, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="truncate max-w-[140px]">{p.description}</span>
                  <span className="font-mono text-destructive font-semibold">{fmt(p.amount)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Center Column: Charts */}
        <div className="space-y-4">
          {/* Area Chart - Vendas e Faturamento */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Vendas e Faturamento</CardTitle>
              <div className="flex gap-3 text-[10px]">
                <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded-full bg-primary inline-block" /> Vendas</span>
                <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded-full bg-destructive inline-block" /> Faturamento</span>
              </div>
            </CardHeader>
            <CardContent className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <RechartsTooltip />
                  <Area type="monotone" dataKey="vendas" stroke="hsl(224, 76%, 40%)" fill="hsl(224, 76%, 40%, 0.2)" />
                  <Area type="monotone" dataKey="faturamento" stroke="hsl(0, 72%, 51%)" fill="hsl(0, 72%, 51%, 0.1)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Pie Chart - Curva ABC */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Curva ABC de Vendas</CardTitle>
            </CardHeader>
            <CardContent className="h-[180px] flex items-center">
              <ResponsiveContainer width="50%" height="100%">
                <PieChart>
                  <Pie data={abcData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value" label={false}>
                    {abcData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2 text-sm">
                {abcData.map((d, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded" style={{ backgroundColor: d.color }} />
                    <span className="font-semibold">{d.name}</span>
                    <span className="font-mono ml-auto">{fmt(d.value)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Cash Flow */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                Fluxo de Caixa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Entradas:</span>
                <span className="font-mono font-semibold text-[hsl(var(--success))]">{fmt(data.cashIn)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Saídas:</span>
                <span className="font-mono font-semibold text-destructive">{fmt(data.cashOut)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Fiscal Alerts */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Alertas Fiscais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <FileText className="w-4 h-4 text-warning" />
                <span>{data.pendingInvoices} NF-e Pendentes</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>Declaração Pendente</span>
              </div>
            </CardContent>
          </Card>

          {/* Recent Sales */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Últimas Vendas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.recentSales.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma venda</p>}
              {data.recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium">Venda #{sale.sale_number}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {new Date(sale.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-[hsl(var(--success))]" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Button
          size="lg"
          className="bg-[hsl(142,71%,35%)] hover:bg-[hsl(142,71%,30%)] text-primary-foreground gap-2 h-12"
          onClick={() => navigate("/vendas")}
        >
          <Receipt className="w-5 h-5" />
          Gerar Comprovante
        </Button>
        <Button
          size="lg"
          className="bg-destructive hover:bg-destructive/90 text-destructive-foreground gap-2 h-12"
          onClick={() => navigate("/vendas")}
        >
          <FileDown className="w-5 h-5" />
          Gerar PDF
        </Button>
        <Button
          size="lg"
          className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 h-12"
          onClick={() => navigate("/fiscal")}
        >
          <FileText className="w-5 h-5" />
          Emitir NF-e
        </Button>
      </div>
    </div>
  );
};

export default Dashboard;

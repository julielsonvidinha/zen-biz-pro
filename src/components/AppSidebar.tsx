import {
  LayoutDashboard, ShoppingCart, Users, Truck, Package, Warehouse,
  ShoppingBag, Receipt, CreditCard, Wallet, Landmark, FileText,
  BarChart3, UserCog, Settings, Shield, Pill, Scissors, ChevronLeft, ChevronRight, LogOut
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

const modules = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "PDV", icon: ShoppingCart, path: "/pdv" },
  { label: "Clientes", icon: Users, path: "/clientes" },
  { label: "Fornecedores", icon: Truck, path: "/fornecedores" },
  { label: "Produtos", icon: Package, path: "/produtos" },
  { label: "Estoque", icon: Warehouse, path: "/estoque" },
  { label: "Compras", icon: ShoppingBag, path: "/compras" },
  { label: "Vendas", icon: Receipt, path: "/vendas" },
  { label: "Contas a Pagar", icon: CreditCard, path: "/contas-pagar" },
  { label: "Contas a Receber", icon: Wallet, path: "/contas-receber" },
  { label: "Crediário", icon: FileText, path: "/crediario" },
  { label: "Financeiro", icon: Landmark, path: "/financeiro" },
  { label: "Fiscal", icon: FileText, path: "/fiscal" },
  { label: "Relatórios", icon: BarChart3, path: "/relatorios" },
  { label: "Farmácia", icon: Pill, path: "/farmacia" },
  { label: "Armarinho", icon: Scissors, path: "/armarinho" },
  { label: "Funcionários", icon: UserCog, path: "/funcionarios" },
  { label: "Configurações", icon: Settings, path: "/configuracoes" },
  { label: "Controle de Acesso", icon: Shield, path: "/controle-acesso" },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { profile, signOut, roles } = useAuth();

  return (
    <aside
      className={`${
        collapsed ? "w-16" : "w-60"
      } min-h-screen bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-200 border-r border-sidebar-border`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground shrink-0">
          <Package className="w-5 h-5" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h2 className="text-sm font-bold truncate">NexaERP</h2>
            <p className="text-[10px] text-sidebar-muted truncate">
              {roles[0] === "admin" ? "Administrador" : roles[0] === "gerente" ? "Gerente" : roles[0] === "operador_caixa" ? "Operador" : "Vendedor"}
            </p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto text-sidebar-muted hover:text-sidebar-foreground shrink-0"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-2 overflow-y-auto scrollbar-thin">
        <ul className="space-y-0.5 px-2">
          {modules.map((m) => (
            <li key={m.path}>
              <NavLink
                to={m.path}
                end={m.path === "/"}
                className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
              >
                <m.icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span className="truncate">{m.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3">
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-sidebar-muted hover:text-destructive hover:bg-sidebar-accent transition-colors w-full"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
}

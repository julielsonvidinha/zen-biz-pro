import type { StatusNFe, ResumoStatus } from '@/types/nfe';
import { FileText, Search, CheckCircle2, XCircle } from 'lucide-react';

const cardConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  PENDENTE: { label: 'Pendentes', color: '#F59E0B', icon: FileText },
  CIENCIA: { label: 'Em Análise', color: '#6366F1', icon: Search },
  APROVADA: { label: 'Aprovadas', color: '#10B981', icon: CheckCircle2 },
  REJEITADA: { label: 'Rejeitadas', color: '#EF4444', icon: XCircle },
};

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

interface Props {
  resumos: ResumoStatus[];
  filtroAtivo: StatusNFe | null;
  onFiltro: (s: StatusNFe) => void;
}

export function ResumoCards({ resumos, filtroAtivo, onFiltro }: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {resumos.map(r => {
        const cfg = cardConfig[r.status];
        if (!cfg) return null;
        const Icon = cfg.icon;
        const ativo = filtroAtivo === r.status;
        return (
          <button
            key={r.status}
            onClick={() => onFiltro(r.status)}
            className={`relative overflow-hidden rounded-xl border transition-all text-left p-4 ${
              ativo
                ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/40'
                : 'border-slate-700 bg-[#1E293B] hover:border-slate-600'
            }`}
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" style={{ backgroundColor: cfg.color }} />
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400">{cfg.label}</span>
              <Icon className="h-4 w-4" style={{ color: cfg.color }} />
            </div>
            <p className="text-2xl font-bold text-white">{r.total}</p>
            <p className="text-xs text-slate-500 mt-1">{fmt(r.valorTotal)}</p>
          </button>
        );
      })}
    </div>
  );
}

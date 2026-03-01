import type { StatusNFe } from '@/types/nfe';

const config: Record<StatusNFe, { label: string; bg: string; text: string }> = {
  PENDENTE: { label: 'Pendente', bg: 'bg-amber-500/20', text: 'text-amber-400' },
  CIENCIA: { label: 'Em Análise', bg: 'bg-indigo-500/20', text: 'text-indigo-400' },
  APROVADA: { label: 'Aprovada', bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
  REJEITADA: { label: 'Rejeitada', bg: 'bg-red-500/20', text: 'text-red-400' },
  DESCONHECIDA: { label: 'Desconhecida', bg: 'bg-gray-500/20', text: 'text-gray-400' },
};

export function BadgeStatus({ status }: { status: StatusNFe }) {
  const c = config[status] ?? config.DESCONHECIDA;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${c.bg} ${c.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.text.replace('text-', 'bg-')}`} />
      {c.label}
    </span>
  );
}

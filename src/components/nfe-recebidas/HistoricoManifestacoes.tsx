import { format } from 'date-fns';
import type { Manifestacao } from '@/types/nfe';
import { EVENTO_SEFAZ } from '@/types/nfe';

export function HistoricoManifestacoes({ items }: { items: Manifestacao[] }) {
  if (!items.length) {
    return <p className="text-xs text-slate-500 italic">Nenhuma manifestação registrada.</p>;
  }

  return (
    <div className="space-y-0">
      {items.map((m, i) => {
        const ev = EVENTO_SEFAZ[m.tipoEvento];
        return (
          <div key={i} className="flex gap-3 relative">
            {i < items.length - 1 && (
              <div className="absolute left-[7px] top-5 bottom-0 w-px bg-slate-700" />
            )}
            <div className="relative z-10 mt-1 h-4 w-4 rounded-full border-2 shrink-0" style={{ borderColor: ev?.color ?? '#6B7280', backgroundColor: `${ev?.color ?? '#6B7280'}33` }} />
            <div className="pb-4">
              <p className="text-sm font-medium text-white">{ev?.label ?? m.descricaoEvento}</p>
              <p className="text-xs text-slate-500">{format(new Date(m.dhRegEvento), 'dd/MM/yyyy HH:mm')}</p>
              {m.nProt && <p className="text-xs text-slate-600 font-mono mt-0.5">Prot: {m.nProt}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

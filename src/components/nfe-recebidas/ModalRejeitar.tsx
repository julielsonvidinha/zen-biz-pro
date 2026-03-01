import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Loader2 } from 'lucide-react';
import type { MotivoRejeicao } from '@/types/nfe';
import { MOTIVOS_REJEICAO } from '@/types/nfe';

interface Props {
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onConfirm: (motivo: MotivoRejeicao, mensagem: string) => void;
}

export function ModalRejeitar({ open, loading, onClose, onConfirm }: Props) {
  const [motivo, setMotivo] = useState<MotivoRejeicao | ''>('');
  const [msg, setMsg] = useState('');

  const handleConfirm = () => {
    if (!motivo) return;
    onConfirm(motivo, msg);
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="bg-[#1E293B] border-slate-700 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="h-5 w-5" /> Rejeitar NF-e
          </DialogTitle>
        </DialogHeader>

        <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-300">
          Isso manifestará "Operação não Realizada" na SEFAZ e notificará o fornecedor por e-mail.
        </div>

        <div className="space-y-3 mt-2">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Motivo da Rejeição</label>
            <Select value={motivo} onValueChange={v => setMotivo(v as MotivoRejeicao)}>
              <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                <SelectValue placeholder="Selecione o motivo..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600 text-white">
                {Object.entries(MOTIVOS_REJEICAO).map(([k, v]) => (
                  <SelectItem key={k} value={k} className="focus:bg-slate-700 focus:text-white">{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Mensagem para o Fornecedor</label>
            <Textarea
              value={msg}
              onChange={e => setMsg(e.target.value)}
              placeholder="Descreva o motivo da rejeição..."
              className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 min-h-[80px]"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 mt-2">
          <Button variant="ghost" onClick={onClose} className="text-slate-400 hover:text-white hover:bg-slate-700">Cancelar</Button>
          <Button
            onClick={handleConfirm}
            disabled={!motivo || loading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            Confirmar Rejeição
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

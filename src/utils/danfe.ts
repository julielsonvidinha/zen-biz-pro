export const formatarCNPJ = (cnpj: string) =>
  cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');

export const formatarCPF = (cpf: string) =>
  cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');

export const formatarCEP = (cep: string) =>
  cep.replace(/^(\d{5})(\d{3})$/, '$1-$2');

export const formatarChave = (chave: string) =>
  chave.replace(/(\d{4})/g, '$1 ').trim();

export const formatarMoeda = (valor: number) =>
  valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const formatarData = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR');
};

export const formatarDataHora = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString('pt-BR');
};

export const formatarFone = (fone?: string) => {
  if (!fone) return '';
  const n = fone.replace(/\D/g, '');
  if (n.length === 11) return n.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  return n.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
};

export const descricaoFrete = (cod: number) => ({
  0: '0 - Emitente',
  1: '1 - Destinatário',
  2: '2 - Terceiros',
  9: '9 - Sem Frete',
}[cod] || '');

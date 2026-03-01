import { useState, useMemo, useCallback } from 'react';
import type { NFeRecebida, StatusNFe, ResumoStatus, MotivoRejeicao } from '@/types/nfe';

const mockNotas: NFeRecebida[] = [
  {
    id: '1',
    chaveAcesso: '35250312345678000195550010000001231234567890',
    numero: 1023, serie: 1,
    fornecedorNome: 'Distribuidora Norte Ltda',
    fornecedorCnpj: '12345678000195',
    fornecedorEmail: 'fiscal@distribuidoranorte.com.br',
    dataEmissao: '2026-02-27T10:30:00Z',
    valorProdutos: 17500.00, valorTotal: 18750.00, valorIcms: 2250.00,
    status: 'PENDENTE',
    itens: [
      { numeroItem: 1, descricao: 'Parafuso Sextavado 6x30mm', ncm: '73181500', cfop: '1102', unidade: 'UN', quantidade: 1000, valorUnitario: 0.85, valorTotal: 850.00, valorIcms: 102.00 },
      { numeroItem: 2, descricao: 'Porca Sextavada M6', ncm: '73182900', cfop: '1102', unidade: 'UN', quantidade: 1000, valorUnitario: 0.45, valorTotal: 450.00, valorIcms: 54.00 },
      { numeroItem: 3, descricao: 'Chapa Aço 3mm 1000x2000', ncm: '72104900', cfop: '1102', unidade: 'PC', quantidade: 10, valorUnitario: 285.00, valorTotal: 2850.00, valorIcms: 342.00 },
    ],
    manifestacoes: [
      { tipoEvento: '210210', descricaoEvento: 'Ciência da Operação', nProt: '135260000001234', dhRegEvento: '2026-02-27T10:35:00Z' }
    ]
  },
  {
    id: '2',
    chaveAcesso: '35250398765432000188550010000004561987654321',
    numero: 4056, serie: 1,
    fornecedorNome: 'Indústria Sul Componentes',
    fornecedorCnpj: '98765432000188',
    fornecedorEmail: 'nfe@industriasul.com.br',
    dataEmissao: '2026-02-27T08:15:00Z',
    valorProdutos: 5100.00, valorTotal: 5280.50, valorIcms: 630.00,
    status: 'PENDENTE',
    itens: [
      { numeroItem: 1, descricao: 'Rolamento 6205 ZZ', ncm: '84822000', cfop: '1102', unidade: 'UN', quantidade: 50, valorUnitario: 18.52, valorTotal: 926.00, valorIcms: 111.12 },
      { numeroItem: 2, descricao: 'Correia Dentada HTD 5M', ncm: '40103900', cfop: '1102', unidade: 'UN', quantidade: 20, valorUnitario: 48.00, valorTotal: 960.00, valorIcms: 115.20 },
    ],
    manifestacoes: []
  },
  {
    id: '3',
    chaveAcesso: '35250311111111000111550010000007891111111111',
    numero: 789, serie: 2,
    fornecedorNome: 'TechParts Brasil S.A.',
    fornecedorCnpj: '11111111000111',
    dataEmissao: '2026-02-26T16:45:00Z',
    valorProdutos: 90000.00, valorTotal: 92400.00, valorIcms: 11088.00,
    status: 'APROVADA',
    itens: [],
    manifestacoes: [
      { tipoEvento: '210210', descricaoEvento: 'Ciência da Operação', dhRegEvento: '2026-02-26T16:50:00Z' },
      { tipoEvento: '210200', descricaoEvento: 'Confirmação da Operação', nProt: '135260000005678', dhRegEvento: '2026-02-26T17:30:00Z' }
    ]
  },
  {
    id: '4',
    chaveAcesso: '35250322222222000122550010000002342222222222',
    numero: 234, serie: 1,
    fornecedorNome: 'Fornecedor Leste ME',
    fornecedorCnpj: '22222222000122',
    dataEmissao: '2026-02-26T14:00:00Z',
    valorProdutos: 3000.00, valorTotal: 3100.00, valorIcms: 360.00,
    status: 'REJEITADA',
    itens: [],
    manifestacoes: [
      { tipoEvento: '210240', descricaoEvento: 'Operação não Realizada', nProt: '135260000009999', dhRegEvento: '2026-02-26T15:00:00Z' }
    ]
  },
  {
    id: '5',
    chaveAcesso: '35250333333333000133550010000005673333333333',
    numero: 567, serie: 1,
    fornecedorNome: 'Comercial Oeste Ltda',
    fornecedorCnpj: '33333333000133',
    dataEmissao: '2026-02-25T09:00:00Z',
    valorProdutos: 46500.00, valorTotal: 47800.00, valorIcms: 5736.00,
    status: 'CIENCIA',
    itens: [],
    manifestacoes: [
      { tipoEvento: '210210', descricaoEvento: 'Ciência da Operação', dhRegEvento: '2026-02-25T09:05:00Z' }
    ]
  }
];

export function useNfeRecebidas() {
  const [notas, setNotas] = useState<NFeRecebida[]>(mockNotas);
  const [filtroStatus, setFiltroStatus] = useState<StatusNFe | null>(null);
  const [busca, setBusca] = useState('');
  const [notaSelecionada, setNotaSelecionada] = useState<NFeRecebida | null>(null);
  const [loading, setLoading] = useState(false);

  const resumos = useMemo<ResumoStatus[]>(() => {
    const map: Record<string, ResumoStatus> = {};
    for (const s of ['PENDENTE', 'CIENCIA', 'APROVADA', 'REJEITADA'] as StatusNFe[]) {
      map[s] = { status: s, total: 0, valorTotal: 0 };
    }
    notas.forEach(n => {
      if (map[n.status]) {
        map[n.status].total++;
        map[n.status].valorTotal += n.valorTotal;
      }
    });
    return Object.values(map);
  }, [notas]);

  const notasFiltradas = useMemo(() => {
    let result = notas;
    if (filtroStatus) result = result.filter(n => n.status === filtroStatus);
    if (busca.trim()) {
      const q = busca.toLowerCase();
      result = result.filter(n =>
        n.fornecedorNome.toLowerCase().includes(q) ||
        n.fornecedorCnpj.includes(q) ||
        String(n.numero).includes(q)
      );
    }
    return result;
  }, [notas, filtroStatus, busca]);

  const toggleFiltro = useCallback((status: StatusNFe) => {
    setFiltroStatus(prev => prev === status ? null : status);
  }, []);

  const aprovar = useCallback(async (id: string) => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setNotas(prev => prev.map(n => n.id === id ? {
      ...n, status: 'APROVADA' as StatusNFe,
      manifestacoes: [...n.manifestacoes, {
        tipoEvento: '210200' as const,
        descricaoEvento: 'Confirmação da Operação',
        nProt: `1352600000${Math.floor(Math.random() * 99999).toString().padStart(5, '0')}`,
        dhRegEvento: new Date().toISOString(),
      }]
    } : n));
    setNotaSelecionada(null);
    setLoading(false);
  }, []);

  const rejeitar = useCallback(async (id: string, _motivo: MotivoRejeicao, _msg: string) => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setNotas(prev => prev.map(n => n.id === id ? {
      ...n, status: 'REJEITADA' as StatusNFe,
      manifestacoes: [...n.manifestacoes, {
        tipoEvento: '210240' as const,
        descricaoEvento: 'Operação não Realizada',
        nProt: `1352600000${Math.floor(Math.random() * 99999).toString().padStart(5, '0')}`,
        dhRegEvento: new Date().toISOString(),
      }]
    } : n));
    setNotaSelecionada(null);
    setLoading(false);
  }, []);

  return {
    notas: notasFiltradas, resumos, filtroStatus, busca, notaSelecionada, loading,
    setBusca, toggleFiltro, setNotaSelecionada, aprovar, rejeitar,
  };
}

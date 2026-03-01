import { Document, Page, View, Text, StyleSheet, Font } from '@react-pdf/renderer';
import type { DadosDANFE } from '@/types/danfe';
import { formatarCNPJ, formatarCPF, formatarCEP, formatarChave, formatarMoeda, formatarData, formatarDataHora, formatarFone, descricaoFrete } from '@/utils/danfe';

const s = StyleSheet.create({
  page: { padding: 28, fontSize: 7.5, fontFamily: 'Helvetica', color: '#000' },
  border: { border: '0.5pt solid #000' },
  row: { flexDirection: 'row' },
  sectionHeader: { backgroundColor: '#E8E8E8', padding: 2, fontSize: 7, fontWeight: 'bold' },
  label: { fontSize: 6, color: '#555', textTransform: 'uppercase', marginBottom: 1 },
  value: { fontSize: 7.5, color: '#000' },
  valueBold: { fontSize: 7.5, color: '#000', fontWeight: 'bold' },
  cell: { border: '0.5pt solid #000', padding: 3, justifyContent: 'center' },
  mono: { fontFamily: 'Courier', fontSize: 7.5, fontWeight: 'bold' },
});

function Cell({ label, value, width, bold, big }: { label: string; value: string; width?: string | number; bold?: boolean; big?: boolean }) {
  return (
    <View style={[s.cell, width ? { width } : { flex: 1 }]}>
      <Text style={s.label}>{label}</Text>
      <Text style={[s.value, bold && { fontWeight: 'bold' }, big && { fontSize: 9, fontWeight: 'bold' }]}>{value}</Text>
    </View>
  );
}

function SimulatedBarcode() {
  const widths = [2,1,3,1,2,1,1,3,2,1,3,1,2,1,1,2,3,1,2,1,1,3,1,2,1,3,2,1,1,3,2,1,2,1,3,1,2,1,1,2,3,1,2,1,3,1,1,2,3,1,2,1,1,3,2,1,2,1,3,1];
  return (
    <View style={[s.row, { height: 28, justifyContent: 'center', alignItems: 'center', marginVertical: 2 }]}>
      {widths.map((w, i) => (
        <View key={i} style={{ width: w, height: 28, backgroundColor: i % 2 === 0 ? '#000' : '#FFF' }} />
      ))}
    </View>
  );
}

function BlocoCabecalho({ d }: { d: DadosDANFE }) {
  return (
    <View style={[s.row, s.border]}>
      {/* Emitente */}
      <View style={[s.cell, { width: '25%' }]}>
        <Text style={{ fontSize: 10, fontWeight: 'bold', textAlign: 'center', marginBottom: 2 }}>{d.emitente.razaoSocial}</Text>
        <Text style={{ fontSize: 7, textAlign: 'center' }}>{d.emitente.logradouro}, {d.emitente.numero}{d.emitente.complemento ? ` - ${d.emitente.complemento}` : ''}</Text>
        <Text style={{ fontSize: 7, textAlign: 'center' }}>{d.emitente.bairro} - {d.emitente.municipio}/{d.emitente.uf}</Text>
        <Text style={{ fontSize: 7, textAlign: 'center' }}>CNPJ: {formatarCNPJ(d.emitente.cnpj)} / IE: {d.emitente.ie}</Text>
      </View>
      {/* Centro */}
      <View style={[s.cell, { width: '30%', alignItems: 'center' }]}>
        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>DANFE</Text>
        <Text style={{ fontSize: 7, textAlign: 'center' }}>Documento Auxiliar da Nota Fiscal Eletrônica</Text>
        <Text style={{ fontSize: 7 }}>0 - ENTRADA / 1 - SAÍDA</Text>
        <View style={{ border: '1pt solid #000', width: 24, height: 24, alignItems: 'center', justifyContent: 'center', marginVertical: 2 }}>
          <Text style={{ fontSize: 14, fontWeight: 'bold' }}>{d.tipoOperacao}</Text>
        </View>
        <Text style={{ fontSize: 9 }}>Nº {String(d.numero).padStart(9, '0')}</Text>
        <Text style={{ fontSize: 9 }}>SÉRIE {d.serie}</Text>
        <Text style={{ fontSize: 7 }}>FOLHA 1/1</Text>
      </View>
      {/* Chave */}
      <View style={[s.cell, { width: '45%' }]}>
        <Text style={s.label}>CHAVE DE ACESSO</Text>
        <Text style={s.mono}>{formatarChave(d.chaveAcesso)}</Text>
        <SimulatedBarcode />
        <Text style={{ fontSize: 6, textAlign: 'center' }}>Consulta de autenticidade em nfe.fazenda.gov.br</Text>
      </View>
    </View>
  );
}

function BlocoNatureza({ d }: { d: DadosDANFE }) {
  return (
    <View style={s.row}>
      <Cell label="NATUREZA DA OPERAÇÃO" value={d.naturezaOperacao} width="40%" />
      <Cell label="PROTOCOLO DE AUTORIZAÇÃO" value={d.protocolo || ''} width="30%" />
      <Cell label="DATA/HORA AUTORIZAÇÃO" value={d.dataProtocolo ? formatarDataHora(d.dataProtocolo) : ''} width="30%" />
    </View>
  );
}

function BlocoPessoa({ titulo, p, dataEmissao, dataES, horaES }: { titulo: string; p: DadosDANFE['emitente'] | DadosDANFE['destinatario']; dataEmissao?: string; dataES?: string; horaES?: string }) {
  const doc = 'cnpj' in p && (p as any).cnpj ? formatarCNPJ((p as any).cnpj) : ('cpf' in p && (p as any).cpf ? formatarCPF((p as any).cpf) : '');
  return (
    <View>
      <Text style={s.sectionHeader}>{titulo}</Text>
      <View style={s.row}>
        <Cell label="RAZÃO SOCIAL" value={p.razaoSocial} />
        <Cell label="CNPJ/CPF" value={doc} width="22%" />
        {dataEmissao && <Cell label="DATA DE EMISSÃO" value={formatarData(dataEmissao)} width="16%" />}
      </View>
      <View style={s.row}>
        <Cell label="ENDEREÇO" value={`${p.logradouro}, ${p.numero}${p.complemento ? ` - ${p.complemento}` : ''}`} />
        <Cell label={titulo.includes('DEST') ? 'IE DO DESTINATÁRIO' : 'IE'} value={'ie' in p ? (p as any).ie || '' : ''} width="22%" />
        {dataES !== undefined && <Cell label="DATA ENT/SAÍDA" value={dataES || ''} width="16%" />}
      </View>
      <View style={s.row}>
        <Cell label="BAIRRO / DISTRITO" value={p.bairro} />
        <Cell label="CEP" value={formatarCEP(p.cep)} width="14%" />
        {horaES !== undefined && <Cell label="HORA DA SAÍDA" value={horaES || ''} width="16%" />}
      </View>
      <View style={s.row}>
        <Cell label="MUNICÍPIO" value={p.municipio} />
        <Cell label="FONE/FAX" value={formatarFone(p.fone)} width="18%" />
        <Cell label="UF" value={p.uf} width="6%" />
        <Cell label="PAÍS" value={p.pais || 'BRASIL'} width="14%" />
      </View>
    </View>
  );
}

function BlocoFatura({ dups }: { dups?: DadosDANFE['duplicatas'] }) {
  if (!dups || !dups.length) return null;
  return (
    <View>
      <Text style={s.sectionHeader}>FATURA</Text>
      <View style={s.row}>
        <View style={[s.cell, { width: '20%' }]}><Text style={s.label}>Nº</Text></View>
        <View style={[s.cell, { width: '40%' }]}><Text style={s.label}>VENCIMENTO</Text></View>
        <View style={[s.cell, { width: '40%' }]}><Text style={s.label}>VALOR</Text></View>
      </View>
      {dups.map((dup, i) => (
        <View key={i} style={s.row}>
          <View style={[s.cell, { width: '20%' }]}><Text style={s.value}>{dup.numero}</Text></View>
          <View style={[s.cell, { width: '40%' }]}><Text style={s.value}>{formatarData(dup.vencimento)}</Text></View>
          <View style={[s.cell, { width: '40%' }]}><Text style={s.value}>R$ {formatarMoeda(dup.valor)}</Text></View>
        </View>
      ))}
    </View>
  );
}

const colWidths = ['6%','22%','6%','4%','4%','4%','5%','7%','7%','6%','5%','5%','5%','4%','5%','4%','5%'] as const;
const colHeaders = ['CÓD.','DESCRIÇÃO','NCM/SH','CST','CFOP','UN.','QTD.','VL. UNIT.','VL. TOTAL','BC ICMS','AL. ICMS','VL. ICMS','VL. IPI','AL. PIS','VL. PIS','AL. COF','VL. COF'];

function BlocoItens({ itens }: { itens: DadosDANFE['itens'] }) {
  return (
    <View>
      <Text style={s.sectionHeader}>DADOS DOS PRODUTOS / SERVIÇOS</Text>
      <View style={[s.row, { backgroundColor: '#E8E8E8' }]}>
        {colHeaders.map((h, i) => (
          <View key={i} style={[s.cell, { width: colWidths[i] }]}>
            <Text style={{ fontSize: 6, fontWeight: 'bold', textAlign: 'center' }}>{h}</Text>
          </View>
        ))}
      </View>
      {itens.map((it, idx) => {
        const vals = [
          it.codigo, it.descricao, it.ncm, it.cst, it.cfop, it.unidade,
          formatarMoeda(it.quantidade), formatarMoeda(it.valorUnitario), formatarMoeda(it.valorTotal),
          formatarMoeda(it.bcIcms ?? 0), it.aliqIcms != null ? formatarMoeda(it.aliqIcms) : '',
          formatarMoeda(it.valorIcms ?? 0), formatarMoeda(it.valorIpi ?? 0),
          it.aliqPis != null ? formatarMoeda(it.aliqPis) : '', formatarMoeda(it.valorPis ?? 0),
          it.aliqCofins != null ? formatarMoeda(it.aliqCofins) : '', formatarMoeda(it.valorCofins ?? 0),
        ];
        return (
          <View key={idx} style={[s.row, { backgroundColor: idx % 2 === 0 ? '#FFF' : '#F8F8F8', minHeight: 14 }]}>
            {vals.map((v, i) => (
              <View key={i} style={[s.cell, { width: colWidths[i], padding: 1.5 }]}>
                <Text style={{ fontSize: 6.5, textAlign: i >= 6 ? 'right' : 'left' }}>{v}</Text>
              </View>
            ))}
          </View>
        );
      })}
    </View>
  );
}

function BlocoTotais({ t }: { t: DadosDANFE['totais'] }) {
  return (
    <View>
      <Text style={s.sectionHeader}>CÁLCULO DO IMPOSTO</Text>
      <View style={s.row}>
        <Cell label="BASE CÁLC. ICMS" value={`R$ ${formatarMoeda(t.bcIcms)}`} />
        <Cell label="VALOR ICMS" value={`R$ ${formatarMoeda(t.valorIcms)}`} />
        <Cell label="BC ICMS ST" value={`R$ ${formatarMoeda(t.bcIcmsSt ?? 0)}`} />
        <Cell label="VALOR ICMS ST" value={`R$ ${formatarMoeda(t.valorIcmsSt ?? 0)}`} />
        <Cell label="VALOR IPI" value={`R$ ${formatarMoeda(t.valorIpi ?? 0)}`} />
        <Cell label="VALOR PIS" value={`R$ ${formatarMoeda(t.valorPis ?? 0)}`} />
        <Cell label="VALOR COFINS" value={`R$ ${formatarMoeda(t.valorCofins ?? 0)}`} />
        <Cell label="OUTRAS DESP." value={`R$ ${formatarMoeda(t.outrasDespesas ?? 0)}`} />
      </View>
      <View style={s.row}>
        <Cell label="DESCONTO" value={`R$ ${formatarMoeda(t.desconto ?? 0)}`} />
        <Cell label="VALOR FRETE" value={`R$ ${formatarMoeda(t.valorFrete ?? 0)}`} />
        <Cell label="VALOR SEGURO" value={`R$ ${formatarMoeda(t.valorSeguro ?? 0)}`} />
        <Cell label="VL. TOTAL PRODUTOS" value={`R$ ${formatarMoeda(t.valorProdutos)}`} />
        <Cell label="VALOR TOTAL DA NOTA" value={`R$ ${formatarMoeda(t.valorNota)}`} bold big />
      </View>
    </View>
  );
}

function BlocoTransporte({ tr }: { tr?: DadosDANFE['transporte'] }) {
  return (
    <View>
      <Text style={s.sectionHeader}>TRANSPORTADOR / VOLUMES TRANSPORTADOS</Text>
      <View style={s.row}>
        <Cell label="RAZÃO SOCIAL" value={tr?.transportadoraNome ?? ''} />
        <Cell label="FRETE POR CONTA" value={tr ? descricaoFrete(tr.modalidadeFrete) : ''} width="16%" />
        <Cell label="PLACA VEÍCULO" value={tr?.placa ?? ''} width="12%" />
        <Cell label="UF" value={tr?.ufVeiculo ?? ''} width="6%" />
        <Cell label="CNPJ/CPF" value={tr?.transportadoraCnpj ? formatarCNPJ(tr.transportadoraCnpj) : ''} width="20%" />
      </View>
    </View>
  );
}

function BlocoDadosAdicionais({ info }: { info?: string }) {
  return (
    <View>
      <Text style={s.sectionHeader}>DADOS ADICIONAIS</Text>
      <View style={s.row}>
        <View style={[s.cell, { width: '70%', minHeight: 40 }]}>
          <Text style={s.label}>INFORMAÇÕES COMPLEMENTARES</Text>
          <Text style={{ fontSize: 6.5 }}>{info || ''}</Text>
        </View>
        <View style={[s.cell, { width: '30%', minHeight: 40 }]}>
          <Text style={s.label}>RESERVADO AO FISCO</Text>
        </View>
      </View>
    </View>
  );
}

export function DocumentoDANFE({ dados }: { dados: DadosDANFE }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <BlocoCabecalho d={dados} />
        <BlocoNatureza d={dados} />
        <BlocoPessoa titulo="EMITENTE" p={dados.emitente} />
        <BlocoPessoa titulo="DESTINATÁRIO / REMETENTE" p={dados.destinatario} dataEmissao={dados.dataEmissao} dataES={dados.dataEntradaSaida} horaES={dados.horaEntradaSaida} />
        <BlocoFatura dups={dados.duplicatas} />
        <BlocoItens itens={dados.itens} />
        <BlocoTotais t={dados.totais} />
        <BlocoTransporte tr={dados.transporte} />
        <BlocoDadosAdicionais info={dados.informacoesComplementares} />
      </Page>
    </Document>
  );
}

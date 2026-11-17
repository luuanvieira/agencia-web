// Lê o relatório semanal (PDF ou CSV) e devolve uma lista de linhas padronizadas:
// { idPlataforma, nome, diamantes, horas, diasValidos, salarioUsd, classificacao }

// ID  Nome (pode ter espaços)  Diamantes  Horas  Dias  Salário  Classificação
const LINHA = /^(\d{5,})\s+(.+?)\s+(\d[\d.,]*)\s+([\d.,]+\s*h|0)\s+(\d+)\s+([\d.,]+)\s+(\S.*?)\s*$/i;

/** '23.73 h' -> 23.73 | '1.379.962' -> 1379962 | '23,73' -> 23.73 | '' -> 0 */
export function numero(valor) {
  if (valor === null || valor === undefined) return 0;
  if (typeof valor === 'number') return valor;
  let s = String(valor).toLowerCase().replace('h', '').trim();
  if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replaceAll('.', ''); // milhar com ponto
  const n = Number(s.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

function montarLinha([id, nome, diamantes, horas, dias, salario, classificacao]) {
  return {
    idPlataforma: String(id).trim(),
    nome: String(nome).trim(),
    diamantes: Math.round(numero(diamantes)),
    horas: numero(horas),
    diasValidos: Math.round(numero(dias)),
    salarioUsd: numero(salario),
    classificacao: String(classificacao ?? '').trim() || null,
  };
}

/** Extrai as linhas de texto do PDF, agrupando os pedaços pela altura (y) na página. */
async function linhasDoPdf(buffer) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const tarefa = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    disableFontFace: true,
    useSystemFonts: true,
    verbosity: 0,
  });
  const doc = await tarefa.promise;

  const linhas = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const pagina = await doc.getPage(p);
    const { items } = await pagina.getTextContent();
    const grupos = []; // { y, itens: [{x, texto}] }
    for (const item of items) {
      const texto = item.str?.trim();
      if (!texto) continue;
      const [, , , , x, y] = item.transform;
      let grupo = grupos.find((g) => Math.abs(g.y - y) < 3);
      if (!grupo) grupos.push((grupo = { y, itens: [] }));
      grupo.itens.push({ x, texto });
    }
    grupos
      .sort((a, b) => b.y - a.y) // de cima para baixo
      .forEach((g) => linhas.push(g.itens.sort((a, b) => a.x - b.x).map((i) => i.texto).join(' ')));
  }
  await tarefa.destroy();
  return linhas;
}

export async function lerPdf(buffer) {
  const linhas = await linhasDoPdf(buffer);
  const resultado = [];
  for (const linha of linhas) {
    const m = LINHA.exec(linha.replace(/\s+/g, ' ').trim());
    if (m) resultado.push(montarLinha(m.slice(1)));
  }
  if (!resultado.length) {
    throw new Error(
      'Não encontrei linhas de hosts no PDF. Se o PDF for uma imagem escaneada, ele não tem texto para ler.'
    );
  }
  return resultado;
}

const normalizar = (t) =>
  String(t).normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

const COLUNAS = [
  ['id', 0], ['nome', 1], ['diamantes', 2], ['horas', 3],
  ['dias validos', 4], ['salario', 5], ['classificacao', 6],
];

export function lerCsv(texto) {
  const linhas = texto.replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim());
  if (linhas.length < 2) throw new Error('CSV vazio.');
  const sep = (linhas[0].match(/;/g) || []).length >= (linhas[0].match(/,/g) || []).length ? ';' : ',';
  const cab = linhas[0].split(sep).map(normalizar);
  const indices = COLUNAS.map(([chave]) => {
    const i = cab.findIndex((c) => c.startsWith(chave));
    if (i < 0) throw new Error(`Coluna "${chave}" não encontrada no CSV.`);
    return i;
  });
  return linhas
    .slice(1)
    .map((l) => l.split(sep))
    .filter((c) => /^\d{5,}$/.test((c[indices[0]] || '').trim()))
    .map((c) => montarLinha(indices.map((i) => c[i])));
}

export async function lerRelatorio(buffer, nomeArquivo) {
  const ext = nomeArquivo.toLowerCase().split('.').pop();
  if (ext === 'pdf') return lerPdf(buffer);
  if (ext === 'csv') return lerCsv(buffer.toString('utf-8'));
  throw new Error('Formato não suportado. Envie o relatório em PDF ou CSV.');
}

/** "Planilha de Pagamento Semana 19-10 a 25-10 (43).pdf" -> "2026-10-19" (ano atual) */
export function semanaDoNomeArquivo(nome, hoje = new Date()) {
  const m = /(\d{1,2})[-_.](\d{1,2})\s*a\s*\d{1,2}[-_.]\d{1,2}/i.exec(nome);
  if (!m) return null;
  const [dia, mes] = [Number(m[1]), Number(m[2])];
  let ano = hoje.getFullYear();
  if (mes > hoje.getMonth() + 2) ano -= 1; // relatório de dezembro importado em janeiro
  return `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

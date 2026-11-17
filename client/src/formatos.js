const inteiro = new Intl.NumberFormat('pt-BR');
const decimal = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const compacto = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 });

export const fmt = (n) => (n === null || n === undefined ? '—' : inteiro.format(n));
export const fmtDec = (n) => (n === null || n === undefined ? '—' : decimal.format(n));
export const fmtCompacto = (n) => (n === null || n === undefined ? '—' : compacto.format(n));
export const fmtUsd = (n) => (n === null || n === undefined ? '—' : `US$ ${decimal.format(n)}`);

/** "2026-10-19" -> "19/10 a 25/10/2026" */
export function fmtSemana(inicio) {
  if (!inicio) return '';
  const [a, m, d] = inicio.split('-').map(Number);
  const fim = new Date(Date.UTC(a, m - 1, d + 6));
  const dd = (n) => String(n).padStart(2, '0');
  return `${dd(d)}/${dd(m)} a ${dd(fim.getUTCDate())}/${dd(fim.getUTCMonth() + 1)}/${fim.getUTCFullYear()}`;
}

export const fmtSemanaCurta = (inicio) => (inicio ? inicio.slice(8, 10) + '/' + inicio.slice(5, 7) : '');

/** "Planilha de Pagamento Semana 19-10 a 25-10 (43).pdf" -> "2026-10-19" */
export function semanaDoNomeArquivo(nome, hoje = new Date()) {
  const m = /(\d{1,2})[-_.](\d{1,2})\s*a\s*\d{1,2}[-_.]\d{1,2}/i.exec(nome);
  if (!m) return '';
  const [dia, mes] = [Number(m[1]), Number(m[2])];
  let ano = hoje.getFullYear();
  if (mes > hoje.getMonth() + 2) ano -= 1;
  return `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

export const CORES_CLASSE = {
  Diamante: 'var(--diamante)',
  Ouro: 'var(--ouro)',
  Prata: 'var(--prata)',
  Bronze: 'var(--bronze)',
};
export const corDaClasse = (c) => CORES_CLASSE[c] || 'var(--texto-fraco)';

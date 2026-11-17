// Cálculos puros (sem banco): resumo, ranking, evolução e alertas da semana.
import { FAIXAS, DIAS_PARA_SALARIO, QUEDA_ALERTA_PCT, USD_POR_DIAMANTE } from './config.js';

const ordemDe = (classe) => FAIXAS.find((f) => f.nome === classe)?.ordem ?? 99;
const soma = (lista, campo) => lista.reduce((t, r) => t + (r[campo] || 0), 0);
const arred = (n, casas = 2) => Math.round(n * 10 ** casas) / 10 ** casas;

/** Valor dos diamantes em dólar (800 diamantes = US$ 1). */
export const valorUsd = (diamantes) => arred(diamantes * USD_POR_DIAMANTE);

export function classificacaoPelaRegra(diamantes) {
  return FAIXAS.find((f) => diamantes >= f.minimo)?.nome ?? null;
}

export function resumo(linhas) {
  const total = soma(linhas, 'diamantes');
  const salario = arred(soma(linhas, 'salarioUsd'));
  return {
    valorDiamantesUsd: valorUsd(total),
    hosts: linhas.length,
    hostsComLive: linhas.filter((r) => r.diasValidos > 0).length,
    hostsSemLive: linhas.filter((r) => r.diasValidos === 0).length,
    totalDiamantes: total,
    mediaDiamantes: linhas.length ? Math.round(total / linhas.length) : 0,
    totalHoras: arred(soma(linhas, 'horas')),
    totalSalarioUsd: salario,
    hostsComSalario: linhas.filter((r) => r.salarioUsd > 0).length,
  };
}

export function porClassificacao(linhas) {
  const grupos = new Map();
  for (const r of linhas) {
    const c = r.classificacao || 'Sem classificação';
    const g = grupos.get(c) || { classificacao: c, hosts: 0, totalDiamantes: 0, totalSalarioUsd: 0 };
    g.hosts += 1;
    g.totalDiamantes += r.diamantes;
    g.totalSalarioUsd = arred(g.totalSalarioUsd + r.salarioUsd);
    grupos.set(c, g);
  }
  return [...grupos.values()]
    .map((g) => ({ ...g, valorUsd: valorUsd(g.totalDiamantes) }))
    .sort((a, b) => ordemDe(a.classificacao) - ordemDe(b.classificacao));
}

/** Ranking da semana + comparação com a semana anterior (se houver). */
export function ranking(linhas, anteriores = []) {
  const ant = new Map(anteriores.map((r) => [r.idPlataforma, r]));
  const ordenadas = [...linhas].sort((a, b) => b.diamantes - a.diamantes);
  let posicao = 0;
  return ordenadas.map((r, i) => {
    if (i === 0 || r.diamantes !== ordenadas[i - 1].diamantes) posicao = i + 1;
    const a = ant.get(r.idPlataforma);
    const variacao = a ? r.diamantes - a.diamantes : null;
    return {
      ...r,
      posicao,
      valorUsd: valorUsd(r.diamantes),
      diamantesPorHora: r.horas > 0 ? Math.round(r.diamantes / r.horas) : null,
      diamantesAnterior: a?.diamantes ?? null,
      classificacaoAnterior: a?.classificacao ?? null,
      variacao,
      variacaoPct: a && a.diamantes > 0 ? arred((100 * variacao) / a.diamantes, 1) : null,
    };
  });
}

/** Recebe as linhas já passadas por ranking(). */
export function alertas(linhasRanking) {
  const lista = [];
  const add = (r, tipo, texto, gravidade) =>
    lista.push({
      idPlataforma: r.idPlataforma, nome: r.nome, tipo, texto, gravidade,
      diamantes: r.diamantes, horas: r.horas, diasValidos: r.diasValidos, salarioUsd: r.salarioUsd,
    });

  for (const r of linhasRanking) {
    if (r.diasValidos === 0) add(r, 'sem_live', 'Nenhum dia válido na semana', 'alta');
    else if (r.diasValidos < DIAS_PARA_SALARIO)
      add(r, 'dias_insuficientes', `Só ${r.diasValidos} dia(s) válido(s) — perdeu o salário`, 'media');

    if (r.diasValidos >= DIAS_PARA_SALARIO && r.salarioUsd === 0)
      add(r, 'conferir_salario', `${r.diasValidos} dias válidos mas salário 0 — conferir pagamento`, 'alta');
    if (r.horas === 0 && r.diamantes > 0)
      add(r, 'conferir_horas', 'Tem diamantes mas nenhuma hora de live — conferir', 'media');

    if (r.classificacaoAnterior && ordemDe(r.classificacao) > ordemDe(r.classificacaoAnterior))
      add(r, 'caiu_classe', `Caiu de classificação (${r.classificacaoAnterior} → ${r.classificacao})`, 'media');
    if (r.variacaoPct !== null && r.variacaoPct <= -QUEDA_ALERTA_PCT)
      add(r, 'queda', `Queda de ${Math.abs(r.variacaoPct)}% nos diamantes`, 'media');
  }
  const peso = { alta: 0, media: 1 };
  return lista.sort((a, b) => peso[a.gravidade] - peso[b.gravidade] || b.diamantes - a.diamantes);
}

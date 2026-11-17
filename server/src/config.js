// Faixas de classificação por diamantes, conferidas com o relatório real da semana
// 19/10 a 25/10. "ordem": 1 = melhor.
export const FAIXAS = [
  { nome: 'Diamante', minimo: 500_000, ordem: 1 },
  { nome: 'Ouro', minimo: 120_000, ordem: 2 },
  { nome: 'Prata', minimo: 50_000, ordem: 3 },
  { nome: 'Bronze', minimo: 0, ordem: 4 },
];

// Dias válidos necessários para receber o salário semanal
export const DIAS_PARA_SALARIO = 6;

// Queda (%) nos diamantes, em relação à semana anterior, que gera alerta
export const QUEDA_ALERTA_PCT = 30;

export const PLATAFORMAS = ['alii', 'tiktok'];

// Conversão: 1 diamante = 750 pontos; 12.000.000 de pontos = US$ 20
export const PONTOS_POR_DIAMANTE = 750;
export const PONTOS_POR_LOTE = 12_000_000;
export const USD_POR_LOTE = 20;
export const USD_POR_DIAMANTE = (PONTOS_POR_DIAMANTE * USD_POR_LOTE) / PONTOS_POR_LOTE; // 0,00125 → 800 diamantes = US$ 1

// Teste rápido do leitor de relatório e dos cálculos (não precisa do MongoDB)
// Uso: npm test   (ou: node test/teste.mjs caminho/do/relatorio.pdf)
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lerRelatorio, semanaDoNomeArquivo } from '../src/parser.js';
import { resumo, porClassificacao, ranking, alertas } from '../src/calculos.js';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const arquivo = process.argv[2] || path.join(aqui, 'exemplo_semana.csv');
const linhas = await lerRelatorio(readFileSync(arquivo), arquivo);

console.log(`Arquivo: ${path.basename(arquivo)}`);
console.log(`Semana pelo nome do arquivo: ${semanaDoNomeArquivo(path.basename(arquivo)) ?? '(não identificada)'}`);
console.log('Primeiras linhas lidas:', linhas.slice(0, 3));
console.log('Resumo:', resumo(linhas));
console.table(porClassificacao(linhas));
const r = ranking(linhas);
console.log(`Alertas: ${alertas(r).length}`);
console.table(alertas(r).slice(0, 15).map(({ nome, texto }) => ({ nome, texto })));

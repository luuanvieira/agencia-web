import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { conectar, Desempenho, Host, Importacao } from './db.js';
import { lerRelatorio } from './parser.js';
import { resumo, porClassificacao, ranking, alertas, classificacaoPelaRegra } from './calculos.js';
import { PLATAFORMAS, FAIXAS, USD_POR_DIAMANTE, PONTOS_POR_DIAMANTE, PONTOS_POR_LOTE, USD_POR_LOTE } from './config.js';

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });
app.use(express.json());

const CAMPOS = '-_id idPlataforma nome diamantes horas diasValidos salarioUsd classificacao';
const DATA = /^\d{4}-\d{2}-\d{2}$/;

// Erros em rotas async viram resposta JSON
const rota = (fn) => (req, res, next) => fn(req, res, next).catch(next);

function validar(plataforma, semana) {
  if (!PLATAFORMAS.includes(plataforma)) throw Object.assign(new Error('Plataforma inválida.'), { status: 400 });
  if (semana !== undefined && !DATA.test(semana))
    throw Object.assign(new Error('Semana deve estar no formato AAAA-MM-DD.'), { status: 400 });
}

/** Linhas da semana + semana anterior importada (para comparação). */
async function dadosDaSemana(plataforma, semana) {
  validar(plataforma, semana);
  const linhas = await Desempenho.find({ plataforma, semana }).select(CAMPOS).lean();
  const anterior = await Importacao.findOne({ plataforma, semana: { $lt: semana } })
    .sort({ semana: -1 })
    .lean();
  const anteriores = anterior
    ? await Desempenho.find({ plataforma, semana: anterior.semana }).select(CAMPOS).lean()
    : [];
  return { linhas, ranking: ranking(linhas, anteriores), semanaAnterior: anterior?.semana ?? null };
}

// ---------------------------------------------------------------- rotas
app.get('/api/config', (_req, res) => res.json({ plataformas: PLATAFORMAS, faixas: FAIXAS }));

app.get('/api/conversao', (_req, res) =>
  res.json({
    usdPorDiamante: USD_POR_DIAMANTE, pontosPorDiamante: PONTOS_POR_DIAMANTE,
    pontosPorLote: PONTOS_POR_LOTE, usdPorLote: USD_POR_LOTE,
  })
);

app.get('/api/semanas', rota(async (req, res) => {
  const filtro = req.query.plataforma ? { plataforma: req.query.plataforma } : {};
  res.json(await Importacao.find(filtro).sort({ semana: -1 }).lean());
}));

app.get('/api/painel', rota(async (req, res) => {
  const { plataforma, semana } = req.query;
  const d = await dadosDaSemana(plataforma, semana);
  const atual = resumo(d.linhas);
  let anterior = null;
  if (d.semanaAnterior) {
    const linhasAnt = await Desempenho.find({ plataforma, semana: d.semanaAnterior }).select(CAMPOS).lean();
    anterior = resumo(linhasAnt);
  }
  // Evolução das últimas 12 semanas importadas
  const historico = await Desempenho.aggregate([
    { $match: { plataforma } },
    { $group: { _id: '$semana', totalDiamantes: { $sum: '$diamantes' }, hosts: { $sum: 1 } } },
    { $sort: { _id: -1 } },
    { $limit: 12 },
    { $project: { _id: 0, semana: '$_id', totalDiamantes: 1, hosts: 1 } },
    { $sort: { semana: 1 } },
  ]);
  res.json({
    resumo: atual,
    resumoAnterior: anterior,
    semanaAnterior: d.semanaAnterior,
    porClassificacao: porClassificacao(d.linhas),
    top10: d.ranking.slice(0, 10),
    totalAlertas: alertas(d.ranking).length,
    historico,
  });
}));

app.get('/api/ranking', rota(async (req, res) => {
  const d = await dadosDaSemana(req.query.plataforma, req.query.semana);
  res.json(d.ranking.map((r) => ({ ...r, classificacaoPelaRegra: classificacaoPelaRegra(r.diamantes) })));
}));

app.get('/api/alertas', rota(async (req, res) => {
  const d = await dadosDaSemana(req.query.plataforma, req.query.semana);
  res.json(alertas(d.ranking));
}));

app.get('/api/hosts/:plataforma/:id', rota(async (req, res) => {
  const { plataforma, id } = req.params;
  validar(plataforma);
  const historico = await Desempenho.find({ plataforma, idPlataforma: id })
    .sort({ semana: 1 })
    .select('-_id semana diamantes horas diasValidos salarioUsd classificacao nome')
    .lean();
  const host = await Host.findOne({ plataforma, idPlataforma: id }).select('-_id -__v').lean();
  if (!host) return res.status(404).json({ erro: 'Host não encontrado.' });
  res.json({ host, historico });
}));

app.patch('/api/hosts/:plataforma/:id', rota(async (req, res) => {
  const { plataforma, id } = req.params;
  validar(plataforma);
  const { whatsapp = '', observacoes = '' } = req.body || {};
  const host = await Host.findOneAndUpdate(
    { plataforma, idPlataforma: id },
    { whatsapp: String(whatsapp).slice(0, 40), observacoes: String(observacoes).slice(0, 2000) },
    { new: true }
  ).select('-_id -__v').lean();
  if (!host) return res.status(404).json({ erro: 'Host não encontrado.' });
  res.json(host);
}));

app.post('/api/importar', upload.single('arquivo'), rota(async (req, res) => {
  const { plataforma, semana } = req.body || {};
  if (!req.file) return res.status(400).json({ erro: 'Envie o arquivo do relatório.' });
  validar(plataforma, semana);
  if (!semana) return res.status(400).json({ erro: 'Informe a data de início da semana.' });

  const nomeArquivo = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
  const linhas = await lerRelatorio(req.file.buffer, nomeArquivo);

  // Reimportar a mesma semana substitui os dados dela (não duplica)
  await Desempenho.deleteMany({ plataforma, semana });
  await Desempenho.insertMany(linhas.map((l) => ({ ...l, plataforma, semana })));
  await Host.bulkWrite(
    linhas.map((l) => ({
      updateOne: {
        filter: { plataforma, idPlataforma: l.idPlataforma },
        update: { $set: { nome: l.nome }, $setOnInsert: { plataforma, idPlataforma: l.idPlataforma } },
        upsert: true,
      },
    }))
  );
  const r = resumo(linhas);
  await Importacao.findOneAndUpdate(
    { plataforma, semana },
    { arquivo: nomeArquivo, hosts: r.hosts, totalDiamantes: r.totalDiamantes },
    { upsert: true }
  );
  res.json({ plataforma, semana, ...r });
}));

app.delete('/api/semanas/:plataforma/:semana', rota(async (req, res) => {
  const { plataforma, semana } = req.params;
  validar(plataforma, semana);
  const { deletedCount } = await Desempenho.deleteMany({ plataforma, semana });
  await Importacao.deleteOne({ plataforma, semana });
  res.json({ removidos: deletedCount });
}));

// Em produção (npm run build + npm start), o próprio servidor entrega o site
const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');
if (existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use((erro, _req, res, _next) => {
  if (!erro.status) console.error(erro);
  res.status(erro.status || 400).json({ erro: erro.message || 'Erro inesperado.' });
});

const PORTA = Number(process.env.PORT) || 3001;
await conectar(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/agencia');
app.listen(PORTA, () => console.log(`API rodando em http://localhost:${PORTA}`));

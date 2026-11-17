import mongoose from 'mongoose';

// Uma linha do relatório: um host em uma semana
const desempenhoSchema = new mongoose.Schema(
  {
    plataforma: { type: String, required: true, enum: ['alii', 'tiktok'] },
    semana: { type: String, required: true }, // início da semana, AAAA-MM-DD
    idPlataforma: { type: String, required: true },
    nome: { type: String, required: true },
    diamantes: { type: Number, default: 0 },
    horas: { type: Number, default: 0 },
    diasValidos: { type: Number, default: 0 },
    salarioUsd: { type: Number, default: 0 },
    classificacao: { type: String, default: null },
  },
  { timestamps: true, collection: 'desempenhos' }
);
desempenhoSchema.index({ plataforma: 1, semana: 1, idPlataforma: 1 }, { unique: true });
desempenhoSchema.index({ plataforma: 1, idPlataforma: 1, semana: -1 });

// Cadastro do host (dados que não vêm no relatório: WhatsApp, observações)
const hostSchema = new mongoose.Schema(
  {
    plataforma: { type: String, required: true },
    idPlataforma: { type: String, required: true },
    nome: { type: String, required: true },
    whatsapp: { type: String, default: '' },
    observacoes: { type: String, default: '' },
  },
  { timestamps: true, collection: 'hosts' }
);
hostSchema.index({ plataforma: 1, idPlataforma: 1 }, { unique: true });

// Histórico de cada relatório importado
const importacaoSchema = new mongoose.Schema(
  {
    plataforma: { type: String, required: true },
    semana: { type: String, required: true },
    arquivo: String,
    hosts: Number,
    totalDiamantes: Number,
  },
  { timestamps: true, collection: 'importacoes' }
);
importacaoSchema.index({ plataforma: 1, semana: 1 }, { unique: true });

export const Desempenho = mongoose.model('Desempenho', desempenhoSchema);
export const Host = mongoose.model('Host', hostSchema);
export const Importacao = mongoose.model('Importacao', importacaoSchema);

/** Esconde usuário e senha do endereço antes de mostrar no terminal ou nos logs. */
const semSenha = (uri) => uri.replace(/\/\/[^@/]+@/, '//***:***@');

export async function conectar(uri) {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log(`MongoDB conectado: ${semSenha(uri)}`);
  } catch (erro) {
    console.error(
      `\nNão consegui conectar ao MongoDB em ${semSenha(uri)}.\n` +
        'Verifique se o MongoDB está instalado e rodando (no Windows: serviço "MongoDB Server"),\n' +
        'ou ajuste MONGODB_URI no arquivo server/.env.\n'
    );
    throw erro;
  }
}

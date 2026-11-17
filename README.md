# Painel da Agência — Node + React + MongoDB

Site para importar o relatório semanal de pagamento (PDF) dos hosts e ver tudo de forma visual:

- **Painel**: total de diamantes, horas, salários e hosts ativos, com comparação com a semana anterior e gráficos
- **Hosts**: ranking completo com busca, filtro por classe, ordenação, diamantes por hora e variação; exporta CSV
- **Página do host**: evolução semana a semana, WhatsApp (com botão para abrir a conversa) e anotações
- **Alertas**: quem não fez live, quem perdeu o salário, pagamentos para conferir, quem caiu de classe ou teve queda forte
- **Importar**: arraste o PDF; a semana é preenchida pelo nome do arquivo ("Semana 19-10 a 25-10")

## Estrutura

```
agencia-web/
├── server/   API em Node + Express + Mongoose (porta 3001)
│   └── src/  index.js (rotas) · db.js (coleções) · parser.js (lê o PDF) · calculos.js · config.js (faixas)
└── client/   Site em React + Vite + Recharts (porta 5173)
```

Coleções no MongoDB (banco `agencia`): `desempenhos` (um host em uma semana), `hosts` (cadastro, WhatsApp,
observações) e `importacoes` (cada relatório importado).

## Instalação no Windows (só na primeira vez)

1. **Node.js 22 LTS**: baixe em https://nodejs.org (botão "LTS") e instale com as opções padrão.
2. **MongoDB Community Server**: baixe em https://www.mongodb.com/try/download/community, instale com
   "Complete" e deixe marcado **"Install MongoD as a Service"** e **"Install MongoDB Compass"**.
   O MongoDB passa a rodar sozinho em segundo plano, e o Compass é o programa para ver os dados.
3. Descompacte este projeto, abra o terminal na pasta `agencia-web` e rode:

   ```
   npm run setup
   ```

## Para usar

Na pasta `agencia-web`:

```
npm run dev
```

O site abre sozinho em http://localhost:5173. Vá em **Importar**, arraste o PDF e clique em Importar.
Para parar, aperte `Ctrl + C` no terminal.

## Ver os dados no MongoDB Compass

Abra o Compass, clique em **Connect** (endereço `mongodb://localhost:27017`) e abra o banco **agencia**.

## Testar a leitura de um PDF sem abrir o site

```
cd server
node test/teste.mjs "C:\caminho\Planilha de Pagamento Semana 19-10 a 25-10 (43).pdf"
```

Mostra quantos hosts foram lidos, os totais e os alertas. Não precisa do MongoDB.

## Ajustes

- Faixas de classificação, dias para receber salário e % de queda que gera alerta: `server/src/config.js`
  (as faixas Diamante a partir de 500 mil e Ouro a partir de 120 mil foram deduzidas do relatório; confirme a regra oficial).
- Endereço do banco (ex.: MongoDB Atlas na nuvem): `server/.env`, variável `MONGODB_URI`.

## Versão "produção" (um processo só)

```
npm run build
npm start
```

O site fica em http://localhost:3001.

## Dados de demonstração

A pasta `dados-ficticios/` tem 4 relatórios semanais em PDF (19/10 a 15/11) com 30 hosts inventados, no mesmo
formato do relatório real. Importe os quatro, em qualquer ordem, na plataforma Alii para ver o painel completo:
ranking, evolução semana a semana e alertas (quem não fez live, quem perdeu o salário, queda forte etc.).
Para gerar outros números: `python dados-ficticios/gerar_pdfs.py` (precisa do pacote `reportlab`).

## Dados

O relatório tem dados pessoais e de pagamento dos hosts. Mantenha o banco local ou com acesso restrito,
não suba `.env` nem PDFs para o GitHub (o `.gitignore` já exclui) e use dados fictícios no portfólio.

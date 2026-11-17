import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useSemana } from '../contexto.jsx';
import { corDaClasse, fmt, fmtDec, fmtUsd } from '../formatos.js';
import { Avatar, Badge, Estado, Painel, SemDados, useDados, Variacao } from '../components/ui.jsx';
import { IconeBaixar, IconeBusca } from '../components/icones.jsx';

const COLUNAS = [
  { campo: 'posicao', rotulo: '#', num: true },
  { campo: 'nome', rotulo: 'Host' },
  { campo: 'diamantes', rotulo: 'Diamantes', num: true },
  { campo: 'valorUsd', rotulo: 'Valor (US$)', num: true },
  { campo: 'horas', rotulo: 'Horas', num: true },
  { campo: 'diasValidos', rotulo: 'Dias válidos', num: true },
  { campo: 'salarioUsd', rotulo: 'Salário', num: true },
  { campo: 'classificacao', rotulo: 'Classe' },
  { campo: 'diamantesPorHora', rotulo: 'Diamantes/h', num: true },
  { campo: 'variacaoPct', rotulo: 'Variação', num: true },
];

const semAcento = (t) => String(t).normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase();

function exportarCsv(linhas, semana) {
  const cab = ['Posição', 'ID', 'Nome', 'Diamantes', 'Valor (US$)', 'Horas', 'Dias válidos', 'Salário (USD)', 'Classificação', 'Diamantes/h', 'Variação %'];
  const corpo = linhas.map((r) => [
    r.posicao, r.idPlataforma, `"${r.nome.replaceAll('"', '""')}"`, r.diamantes,
    String(r.valorUsd ?? '').replace('.', ','),
    String(r.horas).replace('.', ','), r.diasValidos, String(r.salarioUsd).replace('.', ','),
    r.classificacao ?? '', r.diamantesPorHora ?? '', r.variacaoPct ?? '',
  ].join(';'));
  const blob = new Blob(['﻿' + [cab.join(';'), ...corpo].join('\n')], { type: 'text/csv;charset=utf-8' });
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(blob),
    download: `ranking_${semana}.csv`,
  });
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function PaginaRanking() {
  const { plataforma, semana, carregando: carregandoSemanas } = useSemana();
  const navegar = useNavigate();
  const [busca, setBusca] = useState('');
  const [classe, setClasse] = useState('Todas');
  const [ordem, setOrdem] = useState({ campo: 'posicao', asc: true });
  const { dados, carregando, erro } = useDados(
    () => (semana ? api.ranking(plataforma, semana) : Promise.resolve([])),
    [plataforma, semana]
  );

  const classes = useMemo(
    () => ['Todas', ...new Set((dados || []).map((r) => r.classificacao).filter(Boolean))],
    [dados]
  );

  const linhas = useMemo(() => {
    const termo = semAcento(busca.trim());
    const filtradas = (dados || []).filter(
      (r) =>
        (classe === 'Todas' || r.classificacao === classe) &&
        (!termo || semAcento(r.nome).includes(termo) || r.idPlataforma.includes(termo))
    );
    const { campo, asc } = ordem;
    return [...filtradas].sort((a, b) => {
      const va = a[campo], vb = b[campo];
      if (va === null || va === undefined) return 1;
      if (vb === null || vb === undefined) return -1;
      const c = typeof va === 'string' ? va.localeCompare(vb, 'pt-BR') : va - vb;
      return asc ? c : -c;
    });
  }, [dados, busca, classe, ordem]);

  const temComparacao = (dados || []).some((r) => r.diamantesAnterior !== null);

  const ordenar = (campo) =>
    setOrdem((o) => ({ campo, asc: o.campo === campo ? !o.asc : campo === 'posicao' || campo === 'nome' }));

  if (!carregandoSemanas && !semana) return <SemDados />;

  const maior = Math.max(1, ...(dados || []).map((r) => r.diamantes));
  const MEDALHAS = ['ouro', 'prata', 'bronze'];

  return (
    <div className="pagina">
      <div className="titulo-pagina">
        <h1>Hosts da semana</h1>
        <p className="fraco">Clique em um host para ver o histórico e anotar o contato.</p>
      </div>
      <Painel
        acoes={
          <div className="filtros">
            <label className="busca">
              <IconeBusca tamanho={17} />
              <input
                type="search"
                placeholder="Buscar por nome ou ID…"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </label>
            <div className="chips">
              {classes.map((c) => (
                <button
                  key={c}
                  className={classe === c ? 'ativo' : ''}
                  style={c !== 'Todas' ? { '--cor': corDaClasse(c) } : undefined}
                  onClick={() => setClasse(c)}
                >
                  {c !== 'Todas' && <i className="chips__ponto" aria-hidden="true" />}
                  {c}
                </button>
              ))}
            </div>
            <button className="botao botao--secundario filtros__csv" onClick={() => exportarCsv(linhas, semana)} disabled={!linhas.length}>
              <IconeBaixar tamanho={17} /> Baixar CSV
            </button>
          </div>
        }
      >
        <Estado carregando={carregando} erro={erro} vazio={dados && !linhas.length && 'Nenhum host encontrado.'}>
          <p className="fraco contagem">{fmt(linhas.length)} hosts</p>
          <div className="tabela-rolagem">
            <table className="tabela">
              <thead>
                <tr>
                  {COLUNAS.map((c) => (
                    <th key={c.campo} className={c.num ? 'num' : ''} onClick={() => ordenar(c.campo)}>
                      {c.rotulo}
                      {ordem.campo === c.campo && <span className="seta">{ordem.asc ? ' ↑' : ' ↓'}</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {linhas.map((r) => (
                  <tr key={r.idPlataforma} onClick={() => navegar(`/hosts/${plataforma}/${r.idPlataforma}`)}>
                    <td className="num">
                      <span className={`posicao ${r.posicao <= 3 ? `posicao--${MEDALHAS[r.posicao - 1]}` : ''}`}>{r.posicao}</span>
                    </td>
                    <td>
                      <div className="host">
                        <Avatar nome={r.nome} tamanho={34} />
                        <div>
                          <strong>{r.nome}</strong>
                          <small>{r.idPlataforma}</small>
                        </div>
                      </div>
                    </td>
                    <td className="num">
                      <div className="celula-diamantes">
                        <strong>{fmt(r.diamantes)}</strong>
                        <div className="barra barra--fina" style={{ '--cor': corDaClasse(r.classificacao) }}>
                          <span style={{ width: `${(r.diamantes / maior) * 100}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="num">{fmtUsd(r.valorUsd)}</td>
                    <td className="num">{fmtDec(r.horas)}</td>
                    <td className="num"><span className={`dias ${r.diasValidos === 0 ? 'dias--zero' : r.diasValidos < 6 ? 'dias--poucos' : ''}`}>{r.diasValidos}</span></td>
                    <td className="num">{r.salarioUsd ? fmtUsd(r.salarioUsd) : <span className="fraco">—</span>}</td>
                    <td>
                      <Badge classe={r.classificacao} />
                      {r.classificacaoPelaRegra && r.classificacao && r.classificacaoPelaRegra !== r.classificacao && (
                        <span className="aviso" title={`Pelas faixas cadastradas seria ${r.classificacaoPelaRegra}`}> ⚠</span>
                      )}
                    </td>
                    <td className="num">{fmt(r.diamantesPorHora)}</td>
                    <td className="num"><Variacao pct={r.variacaoPct} temComparacao={temComparacao} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Estado>
      </Painel>
    </div>
  );
}

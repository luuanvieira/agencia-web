import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { corDaClasse } from '../formatos.js';
import { IconeDiamante, IconeImportar } from './icones.jsx';

/** Busca dados e refaz quando as dependências mudam. */
export function useDados(buscar, deps) {
  const [estado, setEstado] = useState({ dados: null, carregando: true, erro: '' });
  useEffect(() => {
    let ativo = true;
    setEstado((e) => ({ ...e, carregando: true, erro: '' }));
    buscar()
      .then((dados) => ativo && setEstado({ dados, carregando: false, erro: '' }))
      .catch((e) => ativo && setEstado({ dados: null, carregando: false, erro: e.message }));
    return () => { ativo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return estado;
}

export function Kpi({ rotulo, valor, detalhe, variacao, destaque, icone: Icone, tom = 'rosa' }) {
  return (
    <div className={`kpi ${destaque ? 'kpi--destaque' : ''}`} data-tom={tom}>
      <div className="kpi__cabeca">
        {Icone && <span className="kpi__icone"><Icone tamanho={18} /></span>}
        <span className="kpi__rotulo">{rotulo}</span>
      </div>
      <strong className="kpi__valor">{valor}</strong>
      <span className="kpi__detalhe">
        {variacao !== undefined && variacao !== null && <Tendencia pct={variacao} />} {detalhe}
      </span>
    </div>
  );
}

export function Tendencia({ pct }) {
  if (pct === null || pct === undefined) return null;
  const cls = pct > 0 ? 'positivo' : pct < 0 ? 'negativo' : 'neutro';
  return (
    <span className={`tendencia tendencia--${cls}`}>
      {pct > 0 ? '▲' : pct < 0 ? '▼' : '•'} {Math.abs(pct).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%
    </span>
  );
}

export function Badge({ classe }) {
  if (!classe) return <span className="badge">—</span>;
  return (
    <span className="badge" style={{ '--cor': corDaClasse(classe) }}>
      <i aria-hidden="true" /> {classe}
    </span>
  );
}

export function Variacao({ pct, temComparacao = true }) {
  if (!temComparacao) return <span className="fraco">—</span>;
  if (pct === null || pct === undefined) return <span className="etiqueta etiqueta--novo">novo</span>;
  const cls = pct > 0 ? 'positivo' : pct < 0 ? 'negativo' : 'fraco';
  return <span className={cls}>{pct > 0 ? '+' : ''}{pct.toLocaleString('pt-BR')}%</span>;
}

const GRADIENTES = [
  ['#ff3d81', '#ff8a3d'], ['#7c5cff', '#ff3d81'], ['#22d3ee', '#7c5cff'], ['#ff8a3d', '#ffc857'],
  ['#34d399', '#22d3ee'], ['#f472b6', '#a78bfa'], ['#5ad1ff', '#34d399'], ['#ffc857', '#ff3d81'],
];

/** Avatar com as iniciais do host e um gradiente fixo por nome. */
export function Avatar({ nome = '', tamanho = 36, anel }) {
  const iniciais = nome.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase() || '?';
  let h = 0;
  for (const c of nome) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const [a, b] = GRADIENTES[h % GRADIENTES.length];
  return (
    <span
      className={`avatar ${anel ? 'avatar--anel' : ''}`}
      style={{ width: tamanho, height: tamanho, fontSize: tamanho * 0.38, background: `linear-gradient(135deg, ${a}, ${b})`, '--anel': anel }}
      aria-hidden="true"
    >
      {iniciais}
    </span>
  );
}

export function Painel({ titulo, subtitulo, children, acoes, className = '' }) {
  return (
    <section className={`painel ${className}`}>
      {(titulo || acoes) && (
        <header className="painel__topo">
          <div>
            {titulo && <h2>{titulo}</h2>}
            {subtitulo && <p className="fraco painel__sub">{subtitulo}</p>}
          </div>
          {acoes}
        </header>
      )}
      {children}
    </section>
  );
}

export function Estado({ carregando, erro, vazio, children }) {
  if (carregando) return <div className="estado"><span className="girando" /> Carregando…</div>;
  if (erro) return <div className="estado estado--erro">⚠ {erro}</div>;
  if (vazio) return <div className="estado">{vazio}</div>;
  return children;
}

export function SemDados() {
  return (
    <div className="vazio">
      <div className="vazio__icone"><IconeDiamante tamanho={40} /></div>
      <h2>Nenhum relatório importado ainda</h2>
      <p>Importe o PDF da semana para ver os diamantes, o ranking e os alertas.</p>
      <Link className="botao" to="/importar"><IconeImportar tamanho={18} /> Importar relatório</Link>
    </div>
  );
}

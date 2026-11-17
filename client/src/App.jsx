import { NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { ProvedorSemana, useSemana } from './contexto.jsx';
import { fmtSemana } from './formatos.js';
import PaginaPainel from './pages/PaginaPainel.jsx';
import PaginaRanking from './pages/PaginaRanking.jsx';
import PaginaHost from './pages/PaginaHost.jsx';
import PaginaAlertas from './pages/PaginaAlertas.jsx';
import PaginaImportar from './pages/PaginaImportar.jsx';
import {
  IconeAlerta, IconeCalendario, IconeDiamante, IconeHosts, IconeImportar, IconePainel,
} from './components/icones.jsx';

const MENU = [
  { to: '/', rotulo: 'Painel', icone: IconePainel, end: true },
  { to: '/ranking', rotulo: 'Hosts', icone: IconeHosts },
  { to: '/alertas', rotulo: 'Alertas', icone: IconeAlerta },
  { to: '/importar', rotulo: 'Importar', icone: IconeImportar },
];

const TITULOS = { '/': 'Visão geral', '/ranking': 'Ranking de hosts', '/alertas': 'Alertas', '/importar': 'Importar relatório' };

function BarraTopo() {
  const { plataforma, setPlataforma, semana, setSemana, semanas } = useSemana();
  const { pathname } = useLocation();
  const titulo = TITULOS[pathname] || 'Perfil do host';
  return (
    <header className="topo">
      <div className="topo__titulo">
        <span className="fraco">Agência</span>
        <span className="topo__sep">/</span>
        <strong>{titulo}</strong>
      </div>
      <div className="topo__acoes">
        <div className="alternador" role="group" aria-label="Plataforma">
          {['alii', 'tiktok'].map((p) => (
            <button key={p} className={plataforma === p ? 'ativo' : ''} onClick={() => setPlataforma(p)}>
              <i className={`ponto ponto--${p}`} aria-hidden="true" />
              {p === 'alii' ? 'Alii' : 'TikTok'}
            </button>
          ))}
        </div>
        {semanas.length > 0 && (
          <label className="seletor">
            <IconeCalendario tamanho={17} />
            <select value={semana} onChange={(e) => setSemana(e.target.value)} aria-label="Semana">
              {semanas.map((s) => (
                <option key={s.semana} value={s.semana}>{fmtSemana(s.semana)}</option>
              ))}
            </select>
          </label>
        )}
      </div>
    </header>
  );
}

function Lateral() {
  const { conversao } = useSemana();
  return (
    <aside className="lateral">
      <div className="marca">
        <span className="marca__icone"><IconeDiamante tamanho={22} strokeWidth={2} /></span>
        <div>
          <strong>Agência</strong>
          <small>painel de hosts</small>
        </div>
      </div>
      <nav>
        {MENU.map(({ to, rotulo, icone: Icone, end }) => (
          <NavLink key={to} to={to} end={end}>
            <Icone /> <span>{rotulo}</span>
          </NavLink>
        ))}
      </nav>
      <div className="cotacao" title="1 diamante = 750 pontos · 12 milhões de pontos = US$ 20">
        <span className="cotacao__rotulo">Cotação</span>
        <strong>{Math.round(1 / conversao.usdPorDiamante)} <IconeDiamante tamanho={15} /> = US$ 1</strong>
        <small>1 diamante = 750 pontos</small>
      </div>
    </aside>
  );
}

function Conteudo() {
  const { erro } = useSemana();
  return (
    <div className="app">
      <Lateral />
      <main className="principal">
        <BarraTopo />
        {erro ? (
          <div className="estado estado--erro">
            ⚠ Não consegui falar com a API ({erro}). Confira se o servidor e o MongoDB estão rodando.
          </div>
        ) : (
          <Routes>
            <Route path="/" element={<PaginaPainel />} />
            <Route path="/ranking" element={<PaginaRanking />} />
            <Route path="/hosts/:plataforma/:id" element={<PaginaHost />} />
            <Route path="/alertas" element={<PaginaAlertas />} />
            <Route path="/importar" element={<PaginaImportar />} />
          </Routes>
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ProvedorSemana>
      <Conteudo />
    </ProvedorSemana>
  );
}

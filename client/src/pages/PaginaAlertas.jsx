import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useSemana } from '../contexto.jsx';
import { fmt, fmtDec, fmtSemana } from '../formatos.js';
import { Avatar, Estado, SemDados, useDados } from '../components/ui.jsx';
import { IconeAlerta, IconeCalendario, IconeCarteira, IconeDiamante, IconeQueda, IconeRelogio, IconeSemLive } from '../components/icones.jsx';

const ICONES = {
  sem_live: IconeSemLive,
  dias_insuficientes: IconeCalendario,
  conferir_salario: IconeCarteira,
  conferir_horas: IconeRelogio,
  caiu_classe: IconeQueda,
  queda: IconeQueda,
};

const TIPOS = {
  sem_live: 'Sem dias válidos',
  dias_insuficientes: 'Perdeu o salário',
  conferir_salario: 'Conferir pagamento',
  conferir_horas: 'Conferir horas',
  caiu_classe: 'Caiu de classe',
  queda: 'Queda nos diamantes',
};

export default function PaginaAlertas() {
  const { plataforma, semana, carregando: carregandoSemanas } = useSemana();
  const [tipo, setTipo] = useState('todos');
  const { dados, carregando, erro } = useDados(
    () => (semana ? api.alertas(plataforma, semana) : Promise.resolve([])),
    [plataforma, semana]
  );

  const contagem = useMemo(() => {
    const c = {};
    for (const a of dados || []) c[a.tipo] = (c[a.tipo] || 0) + 1;
    return c;
  }, [dados]);
  const lista = (dados || []).filter((a) => tipo === 'todos' || a.tipo === tipo);

  if (!carregandoSemanas && !semana) return <SemDados />;

  return (
    <div className="pagina">
      <div className="titulo-pagina">
        <h1>Alertas</h1>
        <p className="fraco">Semana {fmtSemana(semana)} — quem precisa de atenção ou de conferência.</p>
      </div>
      <div className="resumo-alertas">
        <div className="resumo-alertas__total">
          <span className="resumo-alertas__icone"><IconeAlerta tamanho={22} /></span>
          <div>
            <strong>{fmt((dados || []).length)}</strong>
            <small>alertas na semana</small>
          </div>
        </div>
        <div className="chips chips--grandes">
          <button className={tipo === 'todos' ? 'ativo' : ''} onClick={() => setTipo('todos')}>
            Todos <b>{fmt((dados || []).length)}</b>
          </button>
          {Object.entries(TIPOS).filter(([t]) => contagem[t]).map(([t, rotulo]) => (
            <button key={t} className={tipo === t ? 'ativo' : ''} onClick={() => setTipo(t)}>
              {rotulo} <b>{contagem[t]}</b>
            </button>
          ))}
        </div>
      </div>
      <Estado carregando={carregando} erro={erro} vazio={dados && !lista.length && 'Nenhum alerta nesta semana. 🎉'}>
        <div className="alertas">
          {lista.map((a, i) => {
            const Icone = ICONES[a.tipo] || IconeAlerta;
            return (
              <Link
                key={`${a.idPlataforma}-${a.tipo}-${i}`}
                to={`/hosts/${plataforma}/${a.idPlataforma}`}
                className={`alerta alerta--${a.gravidade}`}
              >
                <div className="alerta__topo">
                  <span className="alerta__icone"><Icone tamanho={18} /></span>
                  <span className="etiqueta">{TIPOS[a.tipo]}</span>
                  {a.gravidade === 'alta' && <span className="etiqueta etiqueta--urgente">urgente</span>}
                </div>
                <div className="alerta__host">
                  <Avatar nome={a.nome} tamanho={32} />
                  <strong>{a.nome}</strong>
                </div>
                <p>{a.texto}</p>
                <div className="alerta__numeros fraco">
                  <span><IconeDiamante tamanho={14} /> {fmt(a.diamantes)}</span>
                  <span><IconeRelogio tamanho={14} /> {fmtDec(a.horas)} h</span>
                  <span><IconeCalendario tamanho={14} /> {a.diasValidos} dias</span>
                </div>
              </Link>
            );
          })}
        </div>
      </Estado>
    </div>
  );
}

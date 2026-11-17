import { Link } from 'react-router-dom';
import {
  Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { api } from '../api.js';
import { useSemana } from '../contexto.jsx';
import { corDaClasse, fmt, fmtCompacto, fmtDec, fmtSemana, fmtSemanaCurta, fmtUsd } from '../formatos.js';
import { Avatar, Badge, Estado, Kpi, Painel, SemDados, Tendencia, useDados } from '../components/ui.jsx';
import {
  IconeAlerta, IconeCarteira, IconeDiamante, IconeLive, IconeRelogio, IconeSeta, IconeTrofeu,
} from '../components/icones.jsx';

const pct = (atual, anterior) => (anterior ? ((atual - anterior) / anterior) * 100 : null);
const eixo = { fill: 'var(--texto-fraco)', fontSize: 12 };

function DicaGrafico({ active, payload, label, formato = fmt, formatoRotulo = (l) => l }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="dica">
      <strong>{formatoRotulo(label ?? payload[0]?.name)}</strong>
      {payload.map((p) => (
        <div key={p.dataKey ?? p.name}>{p.name}: {formato(p.value)}</div>
      ))}
    </div>
  );
}

const MEDALHAS = ['ouro', 'prata', 'bronze'];

function Podio({ top3, plataforma }) {
  // ordem visual: 2º, 1º, 3º
  const ordem = [top3[1], top3[0], top3[2]].filter(Boolean);
  return (
    <div className="podio">
      {ordem.map((h) => {
        const lugar = top3.indexOf(h);
        return (
          <Link key={h.idPlataforma} to={`/hosts/${plataforma}/${h.idPlataforma}`} className={`podio__lugar podio__lugar--${lugar + 1}`}>
            <div className="podio__avatar">
              <Avatar nome={h.nome} tamanho={lugar === 0 ? 64 : 52} anel={`var(--medalha-${MEDALHAS[lugar]})`} />
              <span className={`medalha medalha--${MEDALHAS[lugar]}`}>{lugar + 1}</span>
            </div>
            <strong className="podio__nome">{h.nome}</strong>
            <span className="podio__valor"><IconeDiamante tamanho={13} /> {fmtCompacto(h.diamantes)}</span>
            <div className="podio__base">{lugar + 1}º</div>
          </Link>
        );
      })}
    </div>
  );
}

export default function PaginaPainel() {
  const { plataforma, semana, carregando: carregandoSemanas } = useSemana();
  const { dados, carregando, erro } = useDados(
    () => (semana ? api.painel(plataforma, semana) : Promise.resolve(null)),
    [plataforma, semana]
  );

  if (!carregandoSemanas && !semana) return <SemDados />;

  return (
    <Estado carregando={carregando || carregandoSemanas} erro={erro}>
      {dados && (
        <div className="pagina">
          <section className="hero">
            <div className="hero__texto">
              <span className="hero__selo"><span className="pulso" /> Semana {fmtSemana(semana)}</span>
              <span className="hero__rotulo">Diamantes na semana</span>
              <div className="hero__numero">
                <IconeDiamante tamanho={34} strokeWidth={1.6} />
                <strong>{fmt(dados.resumo.totalDiamantes)}</strong>
              </div>
              <div className="hero__linha">
                <Tendencia pct={pct(dados.resumo.totalDiamantes, dados.resumoAnterior?.totalDiamantes)} />
                <span>
                  {dados.semanaAnterior ? `vs. ${fmtSemana(dados.semanaAnterior)}` : 'primeira semana importada'}
                </span>
              </div>
              <div className="hero__extras">
                <div>
                  <small>Valor em dólar</small>
                  <b>{fmtUsd(dados.resumo.valorDiamantesUsd)}</b>
                </div>
                <div>
                  <small>Média por host</small>
                  <b>{fmt(dados.resumo.mediaDiamantes)}</b>
                </div>
                <div>
                  <small>Hosts ativos</small>
                  <b>{fmt(dados.resumo.hostsComLive)} / {fmt(dados.resumo.hosts)}</b>
                </div>
              </div>
              {dados.historico.length >= 2 && (
                <div className="hero__grafico">
                  <ResponsiveContainer width="100%" height={70}>
                    <AreaChart data={dados.historico} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#fff" stopOpacity={0.45} />
                          <stop offset="100%" stopColor="#fff" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="totalDiamantes" stroke="#fff" strokeWidth={2} fill="url(#heroGrad)" isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
            <div className="hero__podio">
              <span className="hero__rotulo"><IconeTrofeu tamanho={16} /> Destaques da semana</span>
              <Podio top3={dados.top10.slice(0, 3)} plataforma={plataforma} />
            </div>
          </section>

          <div className="grade-kpi">
            <Kpi
              icone={IconeLive}
              tom="ciano"
              rotulo="Hosts que fizeram live"
              valor={`${fmt(dados.resumo.hostsComLive)} / ${fmt(dados.resumo.hosts)}`}
              detalhe={`${fmt(dados.resumo.hostsSemLive)} sem nenhum dia válido`}
            />
            <Kpi
              icone={IconeRelogio}
              tom="roxo"
              rotulo="Horas de live"
              valor={fmtDec(dados.resumo.totalHoras)}
              variacao={pct(dados.resumo.totalHoras, dados.resumoAnterior?.totalHoras)}
              detalhe="somando todos os hosts"
            />
            <Kpi
              icone={IconeCarteira}
              tom="verde"
              rotulo="Salários da semana"
              valor={fmtUsd(dados.resumo.totalSalarioUsd)}
              detalhe={`${fmt(dados.resumo.hostsComSalario)} hosts recebem`}
            />
            <Link to="/alertas" className="kpi kpi--alerta" data-tom="vermelho">
              <div className="kpi__cabeca">
                <span className="kpi__icone"><IconeAlerta tamanho={18} /></span>
                <span className="kpi__rotulo">Alertas</span>
              </div>
              <strong className="kpi__valor">{fmt(dados.totalAlertas)}</strong>
              <span className="kpi__detalhe">ver quem precisa de atenção <IconeSeta tamanho={14} /></span>
            </Link>
          </div>

          <div className="grade-2">
            <Painel titulo="Por classificação" subtitulo="Diamantes e salários de cada faixa">
              <div className="classes-grafico">
                <div className="rosca">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={dados.porClassificacao}
                        dataKey="totalDiamantes"
                        nameKey="classificacao"
                        innerRadius={62}
                        outerRadius={92}
                        paddingAngle={3}
                        stroke="none"
                        isAnimationActive={false}
                      >
                        {dados.porClassificacao.map((c) => (
                          <Cell key={c.classificacao} fill={corDaClasse(c.classificacao)} />
                        ))}
                      </Pie>
                      <Tooltip content={<DicaGrafico />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="rosca__centro">
                    <strong>{fmt(dados.resumo.hosts)}</strong>
                    <small>hosts</small>
                  </div>
                </div>
                <ul className="classes">
                  {dados.porClassificacao.map((c) => {
                    const parte = dados.resumo.totalDiamantes ? (c.totalDiamantes / dados.resumo.totalDiamantes) * 100 : 0;
                    return (
                      <li key={c.classificacao} style={{ '--cor': corDaClasse(c.classificacao) }}>
                        <div className="classes__topo">
                          <Badge classe={c.classificacao} />
                          <span className="fraco">{fmt(c.hosts)} hosts</span>
                          <strong>{fmtCompacto(c.totalDiamantes)}</strong>
                        </div>
                        <div className="barra"><span style={{ width: `${Math.max(parte, 1.5)}%` }} /></div>
                        <div className="classes__rodape fraco">
                          <span>{fmtUsd(c.valorUsd)}</span>
                          <span>{fmtUsd(c.totalSalarioUsd)} em salários</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </Painel>

            <Painel titulo="Diamantes por semana" subtitulo="Evolução das últimas semanas importadas">
              {dados.historico.length < 2 ? (
                <p className="fraco espaco">
                  O gráfico de evolução aparece a partir da segunda semana importada.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={290}>
                  <AreaChart data={dados.historico} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradiente" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--rosa)" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="var(--rosa)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="traco" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="var(--rosa)" />
                        <stop offset="100%" stopColor="var(--laranja)" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="var(--linha)" strokeDasharray="4 6" />
                    <XAxis dataKey="semana" tickFormatter={fmtSemanaCurta} tick={eixo} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={fmtCompacto} tick={eixo} axisLine={false} tickLine={false} width={48} />
                    <Tooltip content={<DicaGrafico formatoRotulo={fmtSemana} />} cursor={{ stroke: 'var(--linha-forte)' }} />
                    <Area
                      type="monotone"
                      dataKey="totalDiamantes"
                      name="Diamantes"
                      stroke="url(#traco)"
                      strokeWidth={3}
                      fill="url(#gradiente)"
                      dot={{ r: 4, fill: 'var(--fundo)', stroke: 'var(--rosa)', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: 'var(--rosa)' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </Painel>
          </div>

          <Painel
            titulo="Top 10 da semana"
            subtitulo="Clique em um host para abrir o perfil"
            acoes={<Link to="/ranking" className="link">Ranking completo <IconeSeta tamanho={15} /></Link>}
          >
            <ol className="top10">
              {dados.top10.map((h) => (
                <li key={h.idPlataforma}>
                  <Link to={`/hosts/${plataforma}/${h.idPlataforma}`}>
                    <span className={`top10__pos ${h.posicao <= 3 ? `top10__pos--${MEDALHAS[h.posicao - 1]}` : ''}`}>{h.posicao}</span>
                    <Avatar nome={h.nome} tamanho={34} />
                    <div className="top10__nome">
                      <strong>{h.nome}</strong>
                      <Badge classe={h.classificacao} />
                    </div>
                    <div className="top10__barra">
                      <div className="barra barra--grande" style={{ '--cor': corDaClasse(h.classificacao) }}>
                        <span style={{ width: `${(h.diamantes / dados.top10[0].diamantes) * 100}%` }} />
                      </div>
                    </div>
                    <div className="top10__valor">
                      <strong>{fmt(h.diamantes)}</strong>
                      <small className="fraco">{fmtUsd(h.valorUsd)}</small>
                    </div>
                  </Link>
                </li>
              ))}
            </ol>
          </Painel>
        </div>
      )}
    </Estado>
  );
}

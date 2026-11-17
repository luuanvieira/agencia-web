import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../api.js';
import { fmt, fmtCompacto, fmtDec, fmtSemana, fmtSemanaCurta, fmtUsd } from '../formatos.js';
import { useSemana } from '../contexto.jsx';
import { Avatar, Badge, Estado, Kpi, Painel, useDados } from '../components/ui.jsx';
import { IconeCarteira, IconeDiamante, IconeDolar, IconeRelogio, IconeTrofeu, IconeVoltar, IconeWhats } from '../components/icones.jsx';

function linkWhatsapp(numero) {
  const digitos = numero.replace(/\D/g, '');
  if (!digitos) return null;
  return `https://wa.me/${digitos.length <= 11 ? '55' + digitos : digitos}`;
}

export default function PaginaHost() {
  const { plataforma, id } = useParams();
  const { conversao } = useSemana();
  const emDolar = (diamantes) => diamantes * conversao.usdPorDiamante;
  const { dados, carregando, erro } = useDados(() => api.host(plataforma, id), [plataforma, id]);
  const [form, setForm] = useState({ whatsapp: '', observacoes: '' });
  const [salvo, setSalvo] = useState('');

  useEffect(() => {
    if (dados?.host) setForm({ whatsapp: dados.host.whatsapp || '', observacoes: dados.host.observacoes || '' });
  }, [dados]);

  async function salvar(e) {
    e.preventDefault();
    setSalvo('Salvando…');
    try {
      await api.salvarHost(plataforma, id, form);
      setSalvo('Salvo ✓');
    } catch (err) {
      setSalvo(`Erro: ${err.message}`);
    }
    setTimeout(() => setSalvo(''), 2500);
  }

  const historico = dados?.historico || [];
  const ultima = historico[historico.length - 1];
  const penultima = historico[historico.length - 2];
  const totalDiamantes = historico.reduce((t, h) => t + h.diamantes, 0);
  const wa = linkWhatsapp(form.whatsapp);

  return (
    <Estado carregando={carregando} erro={erro}>
      {dados && (
        <div className="pagina">
          <Link to="/ranking" className="link link--voltar"><IconeVoltar tamanho={16} /> Voltar para os hosts</Link>
          <section className="perfil">
            <Avatar nome={dados.host.nome} tamanho={84} anel="rgba(255,255,255,0.35)" />
            <div className="perfil__info">
              <div className="perfil__nome">
                <h1>{dados.host.nome}</h1>
                {ultima && <Badge classe={ultima.classificacao} />}
              </div>
              <p>ID {dados.host.idPlataforma} · {plataforma === 'alii' ? 'Alii' : 'TikTok'} · {historico.length} semana(s) no histórico</p>
            </div>
            {wa && (
              <a className="botao botao--whats" href={wa} target="_blank" rel="noreferrer">
                <IconeWhats tamanho={18} /> Chamar no WhatsApp
              </a>
            )}
          </section>

          {ultima && (
            <div className="grade-kpi grade-kpi--5">
              <Kpi
                destaque
                icone={IconeDiamante}
                rotulo={`Diamantes (${fmtSemana(ultima.semana)})`}
                valor={fmt(ultima.diamantes)}
                variacao={penultima?.diamantes ? ((ultima.diamantes - penultima.diamantes) / penultima.diamantes) * 100 : null}
                detalhe={penultima ? 'vs. semana anterior' : ''}
              />
              <Kpi
                icone={IconeDolar}
                tom="verde"
                rotulo="Valor dos diamantes"
                valor={fmtUsd(emDolar(ultima.diamantes))}
                detalhe="800 diamantes = US$ 1"
              />
              <Kpi icone={IconeRelogio} tom="roxo" rotulo="Horas na semana" valor={fmtDec(ultima.horas)} detalhe={`${ultima.diasValidos} dias válidos`} />
              <Kpi
                icone={IconeCarteira}
                tom="ciano"
                rotulo="Salário na semana"
                valor={fmtUsd(ultima.salarioUsd)}
              />
              <Kpi
                icone={IconeTrofeu}
                tom="laranja"
                rotulo="Total no período"
                valor={fmt(totalDiamantes)}
                detalhe={`${fmtUsd(emDolar(totalDiamantes))} · ${historico.length} semana(s)`}
              />
            </div>
          )}

          <div className="grade-2 grade-2--larga">
            <Painel titulo="Evolução semanal" subtitulo="Diamantes (barras) e horas de live (linha)">
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={historico} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barraHost" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--rosa)" />
                      <stop offset="100%" stopColor="var(--laranja)" stopOpacity={0.75} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="var(--linha)" strokeDasharray="4 6" />
                  <XAxis dataKey="semana" tickFormatter={fmtSemanaCurta} tick={{ fill: 'var(--texto-fraco)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="d" tickFormatter={fmtCompacto} tick={{ fill: 'var(--texto-fraco)', fontSize: 12 }} axisLine={false} tickLine={false} width={48} />
                  <YAxis yAxisId="h" orientation="right" tick={{ fill: 'var(--texto-fraco)', fontSize: 12 }} axisLine={false} tickLine={false} width={36} />
                  <Tooltip
                    labelFormatter={fmtSemana}
                    formatter={(v, nome) => (nome === 'Horas' ? fmtDec(v) : fmt(v))}
                    contentStyle={{ background: 'var(--superficie-2)', border: '1px solid var(--linha)', borderRadius: 12, color: 'var(--texto)' }}
                    cursor={{ fill: 'var(--hover)' }}
                  />
                  <Bar yAxisId="d" dataKey="diamantes" name="Diamantes" fill="url(#barraHost)" radius={[8, 8, 0, 0]} maxBarSize={44} />
                  <Line yAxisId="h" dataKey="horas" name="Horas" stroke="var(--ciano)" strokeWidth={2.5} dot={{ r: 4, fill: "var(--fundo)", stroke: "var(--ciano)", strokeWidth: 2 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </Painel>

            <Painel titulo="Contato e anotações">
              <form className="formulario" onSubmit={salvar}>
                <label>
                  WhatsApp
                  <div className="linha-campo">
                    <input
                      value={form.whatsapp}
                      onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                      placeholder="(51) 99999-9999"
                    />
                    {wa && <a className="botao botao--secundario" href={wa} target="_blank" rel="noreferrer"><IconeWhats tamanho={16} /> Abrir conversa</a>}
                  </div>
                </label>
                <label>
                  Observações
                  <textarea
                    rows={5}
                    value={form.observacoes}
                    onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                    placeholder="Horário que costuma fazer live, combinados, metas…"
                  />
                </label>
                <div className="linha-campo">
                  <button className="botao" type="submit">Salvar</button>
                  <span className="fraco">{salvo}</span>
                </div>
              </form>
            </Painel>
          </div>

          <Painel titulo="Histórico">
            <div className="tabela-rolagem">
              <table className="tabela">
                <thead>
                  <tr>
                    <th>Semana</th><th className="num">Diamantes</th><th className="num">Valor (US$)</th><th className="num">Horas</th>
                    <th className="num">Dias válidos</th><th className="num">Salário</th><th>Classe</th>
                  </tr>
                </thead>
                <tbody>
                  {[...historico].reverse().map((h) => (
                    <tr key={h.semana} className="sem-clique">
                      <td>{fmtSemana(h.semana)}</td>
                      <td className="num forte">{fmt(h.diamantes)}</td>
                      <td className="num">{fmtUsd(emDolar(h.diamantes))}</td>
                      <td className="num">{fmtDec(h.horas)}</td>
                      <td className="num">{h.diasValidos}</td>
                      <td className="num">{fmtUsd(h.salarioUsd)}</td>
                      <td><Badge classe={h.classificacao} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Painel>
        </div>
      )}
    </Estado>
  );
}

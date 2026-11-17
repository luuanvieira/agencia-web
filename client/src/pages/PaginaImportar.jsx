import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useSemana } from '../contexto.jsx';
import { fmt, fmtDec, fmtSemana, fmtUsd, semanaDoNomeArquivo } from '../formatos.js';
import { Painel } from '../components/ui.jsx';
import { IconeArquivo, IconeCheck, IconeImportar, IconeLixeira, IconeSeta } from '../components/icones.jsx';

export default function PaginaImportar() {
  const { plataforma, setPlataforma, semanas, recarregar } = useSemana();
  const navegar = useNavigate();
  const entrada = useRef(null);
  const [arquivo, setArquivo] = useState(null);
  const [semana, setSemana] = useState('');
  const [arrastando, setArrastando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState('');

  function escolher(f) {
    if (!f) return;
    setArquivo(f);
    setResultado(null);
    setErro('');
    const sugerida = semanaDoNomeArquivo(f.name);
    if (sugerida) setSemana(sugerida);
  }

  async function enviar(e) {
    e.preventDefault();
    if (!arquivo || !semana) return;
    const jaExiste = semanas.some((s) => s.semana === semana);
    if (jaExiste && !window.confirm(`A semana ${fmtSemana(semana)} já foi importada. Substituir pelos dados deste arquivo?`)) return;
    setEnviando(true);
    setErro('');
    try {
      const fd = new FormData();
      fd.append('plataforma', plataforma);
      fd.append('semana', semana);
      fd.append('arquivo', arquivo);
      const r = await api.importar(fd);
      setResultado(r);
      await recarregar(semana);
    } catch (err) {
      setErro(err.message);
    } finally {
      setEnviando(false);
    }
  }

  async function remover(s) {
    if (!window.confirm(`Remover todos os dados da semana ${fmtSemana(s)}?`)) return;
    try {
      await api.removerSemana(plataforma, s);
      await recarregar();
    } catch (err) {
      setErro(err.message);
    }
  }

  return (
    <div className="pagina">
      <div className="titulo-pagina">
        <h1>Importar relatório</h1>
        <p className="fraco">Envie o PDF de pagamento da semana. As somas e os alertas são calculados na hora.</p>
      </div>

      <div className="grade-2 grade-2--larga">
        <Painel titulo="Novo relatório" subtitulo="A semana é preenchida pelo nome do arquivo">
          <form className="formulario" onSubmit={enviar}>
            <div
              className={`soltar ${arrastando ? 'soltar--ativo' : ''} ${arquivo ? 'soltar--ok' : ''}`}
              onClick={() => entrada.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setArrastando(true); }}
              onDragLeave={() => setArrastando(false)}
              onDrop={(e) => { e.preventDefault(); setArrastando(false); escolher(e.dataTransfer.files[0]); }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && entrada.current?.click()}
            >
              <input
                ref={entrada}
                type="file"
                accept=".pdf,.csv"
                hidden
                onChange={(e) => escolher(e.target.files[0])}
              />
              <span className="soltar__icone">{arquivo ? <IconeCheck tamanho={30} /> : <IconeImportar tamanho={30} />}</span>
              {arquivo ? (
                <>
                  <strong>{arquivo.name}</strong>
                  <span className="fraco">clique para trocar</span>
                </>
              ) : (
                <>
                  <strong>Arraste o PDF aqui</strong>
                  <span className="fraco">ou clique para escolher (PDF ou CSV)</span>
                </>
              )}
            </div>

            <div className="linha-campo">
              <label>
                Plataforma
                <select value={plataforma} onChange={(e) => setPlataforma(e.target.value)}>
                  <option value="alii">Alii</option>
                  <option value="tiktok">TikTok</option>
                </select>
              </label>
              <label>
                Início da semana
                <input type="date" value={semana} onChange={(e) => setSemana(e.target.value)} required />
              </label>
            </div>
            {semana && <p className="fraco">Semana de {fmtSemana(semana)}</p>}

            <button className="botao" type="submit" disabled={!arquivo || !semana || enviando}>
              <IconeImportar tamanho={17} /> {enviando ? 'Importando…' : 'Importar'}
            </button>
            {erro && <div className="estado estado--erro">⚠ {erro}</div>}
          </form>

          {resultado && (
            <div className="resultado">
              <h3><IconeCheck tamanho={18} /> Importado com sucesso</h3>
              <ul>
                <li><b>{fmt(resultado.hosts)}</b> hosts</li>
                <li><b>{fmt(resultado.totalDiamantes)}</b> diamantes</li>
                <li><b>{fmtDec(resultado.totalHoras)}</b> horas de live</li>
                <li><b>{fmtUsd(resultado.totalSalarioUsd)}</b> em salários</li>
              </ul>
              <button className="botao" onClick={() => navegar('/')}>Ver o painel <IconeSeta tamanho={16} /></button>
            </div>
          )}
        </Painel>

        <Painel titulo="Semanas importadas" subtitulo={`${semanas.length} semana(s) na plataforma ${plataforma === 'alii' ? 'Alii' : 'TikTok'}`}>
          {semanas.length === 0 ? (
            <p className="fraco espaco">Nenhuma semana importada para {plataforma === 'alii' ? 'Alii' : 'TikTok'}.</p>
          ) : (
            <ul className="lista-semanas">
              {semanas.map((s) => (
                <li key={s.semana}>
                  <span className="lista-semanas__icone"><IconeArquivo tamanho={18} /></span>
                  <div>
                    <strong>{fmtSemana(s.semana)}</strong>
                    <small className="fraco">{fmt(s.hosts)} hosts · {fmt(s.totalDiamantes)} diamantes</small>
                  </div>
                  <button className="botao-icone" title="Remover semana" onClick={() => remover(s.semana)}><IconeLixeira tamanho={16} /></button>
                </li>
              ))}
            </ul>
          )}
        </Painel>
      </div>
    </div>
  );
}

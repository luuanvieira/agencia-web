import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from './api.js';

const Contexto = createContext(null);

const ler = (chave, padrao) => {
  try { return localStorage.getItem(chave) || padrao; } catch { return padrao; }
};
const gravar = (chave, valor) => {
  try { localStorage.setItem(chave, valor); } catch { /* sem armazenamento */ }
};

export function ProvedorSemana({ children }) {
  const [plataforma, setPlataformaState] = useState(() => ler('plataforma', 'alii'));
  const [semanas, setSemanas] = useState([]);
  const [semana, setSemana] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [conversao, setConversao] = useState({ usdPorDiamante: 0.00125 });

  useEffect(() => { api.conversao().then(setConversao).catch(() => {}); }, []);

  const recarregar = useCallback(async (selecionar) => {
    setCarregando(true);
    try {
      const lista = await api.semanas(plataforma);
      setSemanas(lista);
      setErro('');
      setSemana((atual) => {
        if (selecionar) return selecionar;
        if (lista.some((s) => s.semana === atual)) return atual;
        return lista[0]?.semana || '';
      });
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }, [plataforma]);

  useEffect(() => { recarregar(); }, [recarregar]);

  const setPlataforma = (p) => { gravar('plataforma', p); setSemana(''); setPlataformaState(p); };

  return (
    <Contexto.Provider
      value={{ plataforma, setPlataforma, semana, setSemana, semanas, recarregar, carregando, erro, conversao }}
    >
      {children}
    </Contexto.Provider>
  );
}

export const useSemana = () => useContext(Contexto);

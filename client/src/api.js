async function pedir(url, opcoes) {
  const resp = await fetch(url, opcoes);
  const dados = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(dados.erro || `Erro ${resp.status}`);
  return dados;
}

const qs = (params) => new URLSearchParams(params).toString();

export const api = {
  conversao: () => pedir('/api/conversao'),
  semanas: (plataforma) => pedir(`/api/semanas?${qs({ plataforma })}`),
  painel: (plataforma, semana) => pedir(`/api/painel?${qs({ plataforma, semana })}`),
  ranking: (plataforma, semana) => pedir(`/api/ranking?${qs({ plataforma, semana })}`),
  alertas: (plataforma, semana) => pedir(`/api/alertas?${qs({ plataforma, semana })}`),
  host: (plataforma, id) => pedir(`/api/hosts/${plataforma}/${encodeURIComponent(id)}`),
  salvarHost: (plataforma, id, dados) =>
    pedir(`/api/hosts/${plataforma}/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    }),
  importar: (formData) => pedir('/api/importar', { method: 'POST', body: formData }),
  removerSemana: (plataforma, semana) =>
    pedir(`/api/semanas/${plataforma}/${semana}`, { method: 'DELETE' }),
};

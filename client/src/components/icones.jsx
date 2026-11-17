// Ícones em SVG (traço), no estilo de linha fina
const base = {
  width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
  strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true,
};

const criar = (caminhos) => function Icone({ tamanho = 20, ...props }) {
  return <svg {...base} width={tamanho} height={tamanho} {...props}>{caminhos}</svg>;
};

export const IconePainel = criar(<><rect x="3" y="3" width="7" height="9" rx="2" /><rect x="14" y="3" width="7" height="5" rx="2" /><rect x="14" y="12" width="7" height="9" rx="2" /><rect x="3" y="16" width="7" height="5" rx="2" /></>);
export const IconeHosts = criar(<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18.5 14.5A6.5 6.5 0 0 1 21.5 20" /></>);
export const IconeAlerta = criar(<><path d="M12 3 2.5 19.5h19L12 3z" /><path d="M12 10v4M12 17h.01" /></>);
export const IconeImportar = criar(<><path d="M12 15V3M7 8l5-5 5 5" /><path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" /></>);
export const IconeDiamante = criar(<><path d="M6 3h12l3 6-9 12L3 9l3-6z" /><path d="M3 9h18M9 3l3 18M15 3l-3 18" /></>);
export const IconeRelogio = criar(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>);
export const IconeDolar = criar(<><circle cx="12" cy="12" r="9" /><path d="M15 9.5c-.5-1-1.6-1.5-3-1.5-1.7 0-3 .8-3 2s1.3 1.7 3 2 3 .8 3 2-1.3 2-3 2c-1.4 0-2.5-.5-3-1.5M12 6.5v11" /></>);
export const IconeLive = criar(<><circle cx="12" cy="12" r="2.5" /><path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 7.8a6 6 0 0 1 0 8.4M5 5a10 10 0 0 0 0 14M19 5a10 10 0 0 1 0 14" /></>);
export const IconeCarteira = criar(<><rect x="3" y="6" width="18" height="14" rx="3" /><path d="M3 10h18M16 15h2" /><path d="M6 6V5a2 2 0 0 1 2-2h9" /></>);
export const IconeTrofeu = criar(<><path d="M8 4h8v5a4 4 0 0 1-8 0V4z" /><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 21h8M9 17h6" /></>);
export const IconeSeta = criar(<path d="M5 12h14M13 6l6 6-6 6" />);
export const IconeVoltar = criar(<path d="M19 12H5M11 18l-6-6 6-6" />);
export const IconeBusca = criar(<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>);
export const IconeBaixar = criar(<><path d="M12 3v12M7 10l5 5 5-5" /><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></>);
export const IconeWhats = criar(<><path d="M3.5 20.5 5 16a8.5 8.5 0 1 1 3 3l-4.5 1.5z" /><path d="M9 9.5c0 2.5 2.5 5 5 5l1.2-1.2-2-1-1 .8a4 4 0 0 1-2-2l.8-1-1-2L9 9.5z" /></>);
export const IconeLixeira = criar(<><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></>);
export const IconeCalendario = criar(<><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4" /></>);
export const IconeCheck = criar(<path d="m5 12.5 4.5 4.5L19 7.5" />);
export const IconeArquivo = criar(<><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z" /><path d="M14 3v5h5M9 13h6M9 17h4" /></>);
export const IconeQueda = criar(<><path d="m3 7 6 6 4-4 8 8" /><path d="M21 11v6h-6" /></>);
export const IconeSemLive = criar(<><circle cx="12" cy="12" r="9" /><path d="m5.6 5.6 12.8 12.8" /></>);

import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/*
  Ao mudar de página, começa sempre no topo.
  - Link com #secção (ex.: /envios-devolucoes#perguntas): vai direto a essa secção.
  - Botão "voltar" do navegador: o navegador repõe a posição onde estavas.
  - Mudar só os filtros da loja (?size=M) não sobe a página.
  - Clicar num link para a página onde já estás também volta ao topo.
*/
const ScrollToTop = () => {
  const { hash, key, state } = useLocation();
  const navType = useNavigationType();

  useEffect(() => {
    if (navType === 'POP') return;
    // Os filtros da loja pedem para ficar onde está ({ state: { keepScroll: true } })
    if (state?.keepScroll) return;
    if (hash) {
      // espera que a página nova desenhe a secção
      const id = decodeURIComponent(hash.slice(1));
      let tries = 0;
      const go = () => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ block: 'start' });
        else if (tries++ < 20) setTimeout(go, 50);
      };
      go();
      return;
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [key]);

  return null;
};

export default ScrollToTop;

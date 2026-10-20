import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Header from '../../assets/components/header/Header';
import TopHeader from '../../assets/components/topheader/TopHeader';
import Footer from '../../assets/components/footer/footer';
import { LEGAL_ATUALIZADO } from '../../config/loja';

// Valor da configuração da loja: destaca a amarelo os campos ainda por preencher
export const V = ({ children }) =>
  String(children).startsWith('[') ? (
    <mark className="bg-yellow-200 px-1 rounded not-italic">{children}</mark>
  ) : (
    <>{children}</>
  );

export const H2 = ({ id, children }) => (
  <h2 id={id} className="scroll-mt-32 text-lg sm:text-xl font-bold mt-10 mb-3">{children}</h2>
);

const LegalLayout = ({ title, intro, sections, children, eyebrow = 'Informação legal', showUpdated = true }) => {
  const { hash } = useLocation();
  useEffect(() => {
    document.title = `${title} — Trina`;
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
    else window.scrollTo(0, 0);
    return () => { document.title = 'Trina.ao — Liberta a tua essência'; };
  }, [title, hash]);

  return (
    <>
      <TopHeader />
      <Header />
      <main className="mt-[110px] bg-white">
        <div className="container-site max-w-3xl py-8 sm:py-12">
          <p className="text-xs uppercase tracking-wider text-zinc-500">{eyebrow}</p>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1">{title}</h1>
          {showUpdated && <p className="text-sm text-zinc-500 mt-2">Última atualização: {LEGAL_ATUALIZADO}</p>}
          {intro && <p className="mt-5 text-zinc-700 leading-relaxed">{intro}</p>}

          {sections?.length > 0 && (
            <nav aria-label="Índice" className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm font-bold mb-2">Nesta página</p>
              <ol className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm list-decimal pl-5">
                {sections.map(([id, label]) => (
                  <li key={id}><a href={`#${id}`} className="text-red-800 hover:underline">{label}</a></li>
                ))}
              </ol>
            </nav>
          )}

          <div className="legal-text text-[15px] text-zinc-700 leading-relaxed">{children}</div>

          <p className="mt-12 text-sm text-zinc-500 border-t border-zinc-200 pt-6">
            Ver também: <Link to="/privacidade" className="text-red-800 hover:underline">Política de Privacidade</Link> ·{' '}
            <Link to="/termos" className="text-red-800 hover:underline">Termos e Condições</Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default LegalLayout;

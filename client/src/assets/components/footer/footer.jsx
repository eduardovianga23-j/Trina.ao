import { Link } from "react-router-dom";
import PaymentMethods from "./PaymentMethods";
import { LOJA } from "../../../config/loja";

// to = página do site · href = site externo · sem link = ainda por fazer
const COLUNAS = [
  { title: "Informação legal", items: [
    { label: "Política de privacidade", to: "/privacidade" },
    { label: "Termos e condições", to: "/termos" },
    { label: "Envios e entregas", to: "/envios-devolucoes#envios" },
    { label: "Devoluções (14 dias)", to: "/envios-devolucoes#devolucoes" },
    { label: "Garantia", to: "/termos#garantia" },
    { label: "Cookies", to: "/privacidade#cookies" },
  ]},
  { title: "Trina", items: [
    { label: "Loja", to: "/shop" },
    { label: "Ofertas", to: "/shop?promo=1" },
    { label: "Sobre nós", to: "/contactos#sobre" },
    { label: "Contacte-nos", to: "/contactos" },
    { label: "#novidades", to: "/shop?sort=newest" },
  ]},
  { title: "Ajuda", items: [
    { label: "Trocas e devoluções", to: "/envios-devolucoes#trocas" },
    { label: "Perguntas frequentes", to: "/envios-devolucoes#perguntas" },
    { label: "Reclamações", to: "/termos#reclamacoes" },
    { label: "Carrinho", to: "/cart" },
    { label: "Minha conta", to: "/conta" },
  ]},
  { title: "Redes sociais", items: [
    { label: "Instagram", href: LOJA.redes.instagram },
    { label: "Facebook", href: LOJA.redes.facebook },
    { label: "Tik Tok", href: LOJA.redes.tiktok },
    { label: "Twitter", href: LOJA.redes.twitter },
    ...(LOJA.whatsapp ? [{ label: "WhatsApp", href: `https://wa.me/${LOJA.whatsapp}` }] : []),
  ]},
];

const itemCls = "text-xs sm:text-sm py-1 inline-block hover:text-red-800";

const Footer = () => (
  <>
    <section className='w-full h-max justify-center flex items-center bg-zinc-300'>
      <div className="container-site">
        <div className="w-full grid grid-cols-2 md:grid-cols-4 mt-5 py-8 md:p-12 gap-x-4 gap-y-8">
          {COLUNAS.map(({ title, items }) => (
            <ul key={title} className='text-center text-black'>
              <li className="font-bold mb-2 text-sm">{title}</li>
              {items.map(({ label, to, href }) => (
                <li key={label}>
                  {to ? <Link to={to} className={itemCls}>{label}</Link>
                    : href ? <a href={href} target="_blank" rel="noreferrer" className={itemCls}>{label}</a>
                    : <span className={`${itemCls} cursor-default`}>{label}</span>}
                </li>
              ))}
            </ul>
          ))}
        </div>
        <PaymentMethods />
      </div>
    </section>
    <div className="bg-black w-full py-4 px-4 flex flex-col sm:flex-row gap-3 justify-center items-center">
      <p className='text-center text-xs text-zinc-400'>Copyright © {new Date().getFullYear()} Trina. Todos os direitos reservados.</p>
      {/* Obrigatório em Portugal para lojas online (DL 156/2005, Livro de Reclamações Eletrónico) */}
      <a href="https://www.livroreclamacoes.pt" target="_blank" rel="noreferrer"
        className="text-xs font-semibold text-white border border-zinc-600 rounded px-2.5 py-1 hover:border-white">
        Livro de Reclamações
      </a>
    </div>
  </>
);
export default Footer;

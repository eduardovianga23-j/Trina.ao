import { Link } from "react-router-dom";
import PaymentMethods from "./PaymentMethods";

// to = página do site · href = site externo · sem link = ainda por fazer
const COLUNAS = [
  { title: "Informação legal", items: [
    { label: "Política de privacidade", to: "/privacidade" },
    { label: "Termos e condições", to: "/termos" },
    { label: "Envios e entregas", to: "/termos#envios" },
    { label: "Devoluções (14 dias)", to: "/termos#devolucoes" },
    { label: "Garantia", to: "/termos#garantia" },
    { label: "Cookies", to: "/privacidade#cookies" },
  ]},
  { title: "Trina", items: [
    { label: "Loja", to: "/shop" },
    { label: "Ofertas" },
    { label: "Sobre nós" },
    { label: "Contacte-nos" },
    { label: "#novidades" },
  ]},
  { title: "Ajuda", items: [
    { label: "Trocas e devoluções", to: "/termos#trocas" },
    { label: "Reclamações", to: "/termos#reclamacoes" },
    { label: "Carrinho", to: "/cart" },
    { label: "Minha conta", to: "/login" },
  ]},
  { title: "Redes sociais", items: [
    { label: "Facebook" }, { label: "Instagram" }, { label: "WhatsApp" }, { label: "Tik Tok" }, { label: "Twitter" },
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

import PaymentMethods from "./PaymentMethods";

const Footer = () => (
  <>
    <section className='w-full h-max justify-center flex items-center bg-zinc-300'>
      <div className="container-site">
        <div className="w-full grid grid-cols-2 md:grid-cols-4 mt-5 py-8 md:p-12 gap-x-4 gap-y-8">
          {[
            { title: "Políticas de uso", items: ["Políticas de privacidade","Políticas de cancelamento","Políticas de envios","Segurança e privacidade","Termos de conduções","Cookies"] },
            { title: "Trina.ao", items: ["Mercado","Ofertas","Sobre nós","Contate-nos","#novidades"] },
            { title: "Ajuda", items: ["Trocas e devoluções","Entregas rápidas","Cancelamentos","Meus pedidos","Minha conta"] },
            { title: "Redes sociais", items: ["Facebook","Instagram","WhatsApp","Tik Tok","Twitter"] },
          ].map(({ title, items }) => (
            <ul key={title} className='text-center text-black'>
              <li className="font-bold mb-2 text-sm">{title}</li>
              {items.map(i => <li key={i} className='text-xs sm:text-sm py-1 cursor-pointer hover:text-red-800'>{i}</li>)}
            </ul>
          ))}
        </div>
        <PaymentMethods />
      </div>
    </section>
    <div className="bg-black w-full py-4 px-4 flex justify-center items-center">
      <p className='text-center text-xs text-zinc-400'>Copyright © {new Date().getFullYear()} Trina.ao. Todos os direitos reservados.</p>
    </div>
  </>
);
export default Footer;

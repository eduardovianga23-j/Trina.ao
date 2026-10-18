const Footer = () => (
  <>
    <section className='w-full h-max justify-center flex items-center bg-zinc-300'>
      <div className="w-11/12 items-center flex-col justify-center">
        <div className="w-full grid grid-cols-1 md:grid-cols-4 h-max mt-5 p-12 gap-8">
          {[
            { title: "Políticas de uso", items: ["Políticas de privacidade","Políticas de cancelamento","Políticas de envios","Segurança e privacidade","Termos de conduções","Cookies"] },
            { title: "Trina.ao", items: ["Mercado","Ofertas","Sobre nós","Contate-nos","#novidades"] },
            { title: "Ajuda", items: ["Trocas e devoluções","Entregas rápidas","Cancelamentos","Meus pedidos","Minha conta"] },
            { title: "Redes sociais", items: ["Facebook","Instagram","WhatsApp","Tik Tok","Twitter"] },
          ].map(({ title, items }) => (
            <ul key={title} className='text-center text-black'>
              <li className="font-bold mb-2 text-sm">{title}</li>
              {items.map(i => <li key={i} className='text-sm cursor-pointer hover:text-red-800'>{i}</li>)}
            </ul>
          ))}
        </div>
        <div className="w-full py-8 text-center">
          <h1 className='mb-4 font-bold text-sm'>Pagamentos seguros</h1>
          <div className="flex flex-wrap justify-center gap-3">
            {["WISE","PayPal","VISA","Paypay","Express","BAI"].map(p => (
              <span key={p} className="h-9 px-4 flex items-center justify-center bg-white rounded-sm text-xs font-bold border">{p}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
    <div className="bg-black w-full h-[8vh] flex justify-center items-center">
      <h1 className='text-center text-xs text-zinc-400'>Copyright © 2024 Todos os direitos reservados.</h1>
    </div>
  </>
);
export default Footer;

const imgs = [
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&q=80",
  "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=500&q=80",
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500&q=80",
];

const Banner = () => (
  <section className="flex items-center justify-center mt-10 mb-10">
    <section className="w-full grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-1">
      {[
        { text: <>NÃO PROCURE MAIS, VOCÊ ACABA<br className="hidden lg:inline"/>  DE ENCONTRAR <span className='font-bold'>O LUGAR CERTO</span></>, btn: "LIBERTA-TE" },
        { text: <>FAÇA A SUA ENCOMENDA<br className="hidden lg:inline"/>  ATRAVÉS DO <span className='font-bold'>WHATSAPP</span></>, btn: "ESTAMOS AQUI" },
        { text: <><span className='font-bold'>JUNTE-SE Á NOS, GANHA E</span><br className="hidden lg:inline"/> RECEBA OFERTAS EXCLUSIVAS</>, btn: "ASSINANTE" },
      ].map((item, i) => (
        <div key={i} className="w-full relative overflow-hidden">
          <img src={imgs[i]} loading="lazy" className='w-full h-[360px] sm:h-[420px] md:h-[450px] lg:h-[570px] object-cover brightness-75' alt=""/>
          <div className="absolute inset-x-6 bottom-10 sm:bottom-16 md:inset-x-4 lg:inset-x-10 lg:bottom-32">
            <h2 className='mb-6 sm:mb-10 lg:mb-14 text-white text-lg sm:text-xl md:text-sm lg:text-xl leading-snug'>{item.text}</h2>
            <span className="inline-block px-8 sm:px-10 py-2 text-sm border-2 border-black font-bold bg-white cursor-pointer hover:bg-zinc-300 transition">{item.btn}</span>
          </div>
        </div>
      ))}
    </section>
  </section>
);
export default Banner;

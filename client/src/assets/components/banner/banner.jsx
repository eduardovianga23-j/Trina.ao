const imgs = [
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&q=80",
  "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=500&q=80",
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500&q=80",
];

const Banner = () => (
  <section className="flex items-center justify-center h-full mt-10 mb-10">
    <section className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-1">
      {[
        { text: <>NÃO PROCURE MAIS, VOCÊ ACABA<br/> DE ENCONTRAR <span className='font-bold'>O LUGAR CERTO</span></>, btn: "LIBERTA-TE" },
        { text: <>FAÇA A SUA ENCOMENDA<br/> ATRAVÉS DO <span className='font-bold'>WHATSAPP</span></>, btn: "ESTAMOS AQUI" },
        { text: <><span className='font-bold'>JUNTE-SE Á NOS, GANHA E</span><br/>RECEBA OFERTAS EXCLUSIVAS</>, btn: "ASSINANTE" },
      ].map((item, i) => (
        <div key={i} className="w-full relative">
          <img src={imgs[i]} className='h-[570px] w-[447px] md:h-[450px] md:w-[320px] lg:h-[570px] lg:w-[447px] brightness-75' alt=""/>
          <div className="absolute bottom-44 left-10 md:left-4 lg:left-10">
            <h1 className='mb-14 text-white text-xl md:text-sm lg:text-xl'>{item.text}</h1>
            <span className="px-10 py-2 text-sm border-2 border-black font-bold bg-white cursor-pointer hover:bg-zinc-300 transition">{item.btn}</span>
          </div>
        </div>
      ))}
    </section>
  </section>
);
export default Banner;

import BestProdCard from "./BestProdCards";

const imgs = [
  "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&q=80",
  "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&q=80",
  "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&q=80",
];

// Montra de estilos: cada cartão leva à loja já filtrada pela categoria
const BestData = [
  { img1: imgs[1], img2: imgs[2], img3: imgs[0], label: "Roupas", category: "roupas" },
  { img1: imgs[0], img2: imgs[1], img3: imgs[2], label: "Sapatos", category: "sapatos" },
  { img1: imgs[2], img2: imgs[0], img3: imgs[1], label: "Acessórios", category: "acessórios" },
];

const BestProd = () => (
  <div data-aos="fade-up" className='h-full bg-white items-center flex justify-center mt-10 mb-10'>
    <section className='container-site'>
      <h1 className='text-sm md:text-lg lg:text-xl font-semibold mb-8 md:mb-12 text-center px-2'>CONHEÇA OS NOSSOS ESTILOS, E LIBERTE A ESSÊNCIA QUE HÁ EM TI</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-8 sm:gap-x-5 lg:gap-x-6 lg:gap-y-12">
        {BestData.map((item, i) => <BestProdCard key={i} {...item}/>)}
      </div>
    </section>
  </div>
);
export default BestProd;

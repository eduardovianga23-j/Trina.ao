import BestProdCard from "./BestProdCards";

const imgs = [
  "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&q=80",
  "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&q=80",
  "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&q=80",
];

const BestData = [
  { img1: imgs[0], img2: imgs[1], img3: imgs[2], category: "CALÇAS", price: "15.540" },
  { img1: imgs[1], img2: imgs[2], img3: imgs[0], category: "Macacões", price: "20.220" },
  { img1: imgs[2], img2: imgs[0], img3: imgs[1], category: "SALTOS", price: "29.066" },
  { img1: imgs[1], img2: imgs[2], img3: imgs[0], category: "CALÇAS", price: "15.540" },
  { img1: imgs[2], img2: imgs[0], img3: imgs[1], category: "Fatos", price: "20.220" },
  { img1: imgs[0], img2: imgs[1], img3: imgs[2], category: "SALTOS", price: "29.066" },
];

const BestProd = () => (
  <div data-aos="fade-up" className='h-full bg-white items-center flex justify-center mt-10 mb-10'>
    <section className='w-10/12 items-center flex-col justify-center'>
      <h1 className='text-sm md:text-lg lg:text-xl font-semibold mb-12 text-center'>CONHEÇA OS NOSSOS ESTILOS, E LIBERTE A ESSÊNCIA QUE HÁ EM TI</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-8 md:gap-2 lg:gap-6">
        {BestData.map((item, i) => <BestProdCard key={i} {...item}/>)}
      </div>
    </section>
  </div>
);
export default BestProd;

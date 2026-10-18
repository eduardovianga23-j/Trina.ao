import PromoDataCard from "./PromoDataCard";

const PromoData = [
  { img: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&q=80", nomeProduto: "Salto Azalea", detalhesProduto1: "Salto grosso tom", detalhesProduto2: "Camisola de manga comprida com estampado leopardo para senhora.", tamanhos: "36, 38, 39", percentagem: -24, precoAnterior: "25.050", precoActual: "15.000" },
  { img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80", nomeProduto: "Calça Your", detalhesProduto1: "Your rules jeans two tone", detalhesProduto2: "Camisola de manga comprida com estampado leopardo para senhora.", tamanhos: "35, 36, 37, 38, 39", percentagem: 0, precoAnterior: "35.050", precoActual: "25.030" },
  { img: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&q=80", nomeProduto: "Óculos Sol", detalhesProduto1: "Desert Rider", detalhesProduto2: "Óculos de sol estilo deserto.", tamanhos: "", percentagem: -4, precoAnterior: "19.056", precoActual: "11.065" },
  { img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80", nomeProduto: "Ténis Mariella Strass", detalhesProduto1: "Mariella Strass", detalhesProduto2: "Ténis com strass brilhante.", tamanhos: "37, 38, 39", percentagem: -10, precoAnterior: "24.044", precoActual: "15.230" },
];

const Promo = () => {
  return (
    <div className='h-full items-center flex bg-gray-100 flex-col justify-center'>
      <section className='w-full h-10 sm:h-14 bg-red-800'></section>
      <section className="w-full flex items-center justify-center my-6 md:my-10">
        <div className="container-site grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
          {PromoData.map((item, index) => <PromoDataCard key={index} {...item}/>)}
        </div>
      </section>
    </div>
  );
};
export default Promo;

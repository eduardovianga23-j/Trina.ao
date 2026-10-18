import Header from "../../assets/components/header/Header";
import TopHeader from "../../assets/components/topheader/TopHeader";
import Footer from "../../assets/components/footer/footer";
import ShopDataCard from "../../assets/components/shopCard/ShopDataCard";

const products = [
  { img: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&q=80", nomeProduto: "Salto Azalea", detalhesProduto1: "Salto grosso tom", percentagem: -24, precoAnterior: "25.050", precoActual: "15.000" },
  { img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80", nomeProduto: "Calça Your", detalhesProduto1: "Your rules jeans two tone", percentagem: 0, precoAnterior: "35.050", precoActual: "25.030" },
  { img: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&q=80", nomeProduto: "Óculos Sol", detalhesProduto1: "Desert Rider", percentagem: -4, precoAnterior: "19.056", precoActual: "11.065" },
  { img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80", nomeProduto: "Ténis Mariella Strass", detalhesProduto1: "Mariella Strass", percentagem: -10, precoAnterior: "24.044", precoActual: "15.230" },
  { img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80", nomeProduto: "Vestido Midi", detalhesProduto1: "Vestido elegante", percentagem: -15, precoAnterior: "30.000", precoActual: "25.500" },
  { img: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&q=80", nomeProduto: "Conjunto Desportivo", detalhesProduto1: "Roupa desportiva", percentagem: -5, precoAnterior: "20.000", precoActual: "19.000" },
];

const Shop = () => {
  return (
    <>
      <TopHeader />
      <Header />
      <div className="mt-[110px] min-h-screen">
        <div className="container-site">
          <h1 className="text-xl sm:text-2xl font-bold mb-5 sm:mb-8 mt-6">Todos os Produtos</h1>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6 mb-16">
            {products.map((p, i) => <ShopDataCard key={i} {...p} />)}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};
export default Shop;

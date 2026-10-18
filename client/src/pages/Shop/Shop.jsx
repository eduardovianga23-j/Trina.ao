import Header from "../../assets/components/header/Header";
import TopHeader from "../../assets/components/topheader/TopHeader";
import Footer from "../../assets/components/footer/footer";
import { faHeart } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useNavigate } from "react-router-dom";

const products = [
  { img: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&q=80", nomeProduto: "Salto Azalea", detalhesProduto1: "Salto grosso tom", percentagem: -24, precoAnterior: "25.050", precoActual: "15.000" },
  { img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80", nomeProduto: "Calça Your", detalhesProduto1: "Your rules jeans two tone", percentagem: 0, precoAnterior: "35.050", precoActual: "25.030" },
  { img: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&q=80", nomeProduto: "Óculos Sol", detalhesProduto1: "Desert Rider", percentagem: -4, precoAnterior: "19.056", precoActual: "11.065" },
  { img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80", nomeProduto: "Ténis Mariella Strass", detalhesProduto1: "Mariella Strass", percentagem: -10, precoAnterior: "24.044", precoActual: "15.230" },
  { img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80", nomeProduto: "Vestido Midi", detalhesProduto1: "Vestido elegante", percentagem: -15, precoAnterior: "30.000", precoActual: "25.500" },
  { img: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&q=80", nomeProduto: "Conjunto Desportivo", detalhesProduto1: "Roupa desportiva", percentagem: -5, precoAnterior: "20.000", precoActual: "19.000" },
];

const Shop = () => {
  const navigate = useNavigate();
  return (
    <>
      <TopHeader />
      <Header />
      <div className="mt-28 min-h-screen">
        <div className="w-11/12 mx-auto">
          <h1 className="text-2xl font-bold mb-8 mt-4">Todos os Produtos</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {products.map((p, i) => (
              <div key={i} className="shadow-lg rounded-lg bg-white cursor-pointer relative">
                <FontAwesomeIcon className="bg-white text-neutral-900 p-3 rounded-3xl absolute top-5 right-4 hover:bg-yellow-400 z-10" icon={faHeart}/>
                <div className="overflow-hidden relative">
                  <img src={p.img} alt={p.nomeProduto} className="mx-auto h-[300px] w-full object-cover hover:scale-110 transition duration-700"/>
                  <span className="text-sm absolute top-5 flex text-red-700 pr-1 pl-1 bg-white">SUPER<span className="font-bold">PREÇO</span></span>
                  <span className="text-xs absolute top-12 text-black p-1 pl-3 pr-2 bg-yellow-400">{p.percentagem}%</span>
                  <span className="text-xs absolute top-20 text-white p-1 bg-black">NOVIDADE EM</span>
                </div>
                <div className="space-y-2 p-3 bg-white">
                  <h1 className="font-bold text-sm">{p.nomeProduto}</h1>
                  <h1 className="text-xs text-zinc-600">{p.detalhesProduto1}</h1>
                  <div className="flex items-center justify-between border-t-2 py-3">
                    <div>
                      <p className="text-xs line-through text-red-900 font-bold">{p.precoAnterior} Akz</p>
                      <p className="text-base font-bold">{p.precoActual} Akz</p>
                    </div>
                    <span onClick={() => navigate("/products", { state: p })} className="cursor-pointer py-2 px-6 bg-black text-xs text-white rounded-sm hover:bg-zinc-800">Confira</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};
export default Shop;

import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import Header from "../../assets/components/header/Header";
import TopHeader from "../../assets/components/topheader/TopHeader";
import Footer from "../../assets/components/footer/footer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleRight } from "@fortawesome/free-solid-svg-icons";
import { FaExpand, FaChevronLeft, FaChevronRight, FaTimes } from "react-icons/fa";
import ShopDataCard from "../../assets/components/shopCard/ShopDataCard";

const otherImgs = [
  "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&q=80",
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80",
  "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&q=80",
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80",
];
const OtherData = [
  { img: otherImgs[0], nomeProduto: "Salto Azalea", detalhesProduto: "Salto grosso tom", percentagem: -24, precoAnterior: "25.050", precoActual: "15.000" },
  { img: otherImgs[1], nomeProduto: "Calça Your", detalhesProduto: "Your rules jeans two tone", percentagem: 0, precoAnterior: "35.050", precoActual: "25.030" },
  { img: otherImgs[2], nomeProduto: "Óculos de Sol", detalhesProduto: "Desert Rider", percentagem: -4, precoAnterior: "19.056", precoActual: "11.065" },
  { img: otherImgs[3], nomeProduto: "Ténis Mariella Strass", detalhesProduto: "Mariella Strass", percentagem: -10, precoAnterior: "24.044", precoActual: "15.230" },
];

const Products = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // Se a página for aberta sem escolher um produto, mostra o primeiro como exemplo
  const { img, nomeProduto, percentagem, detalhesProduto2, precoAnterior, precoActual } = location.state || OtherData[0];
  const galleryImages = [img || otherImgs[0], otherImgs[1], otherImgs[2], otherImgs[3]];
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedOption, setSelectedOption] = useState("");
  const [productCount, setProductCount] = useState(1);
  const [selectedColor, setSelectedColor] = useState("vermelho");
  const colors = [{ name: "vermelho", colorCode: "#BB0320" }, { name: "Lilás", colorCode: "#BB0390" }, { name: "Marrom", colorCode: "#8B4513" }, { name: "Rosa", colorCode: "#FF69B4" }];

  return (
    <>
      <TopHeader />
      <Header />
      <div className="container-site mt-[110px] pt-4 sm:pt-8 mb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[60%_40%] gap-8 md:gap-8 lg:gap-0">
          {/* Galeria: no telemóvel a imagem principal fica em cima e as miniaturas por baixo */}
          <div className="w-full flex flex-col-reverse sm:flex-row items-start gap-3 lg:pr-10">
            <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-20 lg:w-[110px] shrink-0 overflow-x-auto">
              {galleryImages.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`Miniatura ${index + 1}`}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`w-16 h-20 sm:w-full sm:h-auto sm:aspect-[4/5] shrink-0 object-cover cursor-pointer rounded-md border-2 ${selectedImageIndex === index ? "border-blue-500" : "border-gray-300"}`}
                />
              ))}
            </div>
            <div className="relative w-full flex-1">
              <img
                src={galleryImages[selectedImageIndex]}
                alt={nomeProduto || "Produto"}
                className="w-full aspect-[4/5] max-h-[560px] object-cover rounded-lg shadow-lg"
              />
              <button aria-label="Ampliar imagem" className="absolute top-3 left-3 bg-white w-10 h-10 flex items-center justify-center rounded-full shadow" onClick={() => setIsExpanded(true)}>
                <FaExpand className="text-gray-700"/>
              </button>
            </div>
          </div>

          <div className="w-full">
            <h1 className="text-2xl sm:text-3xl font-semibold">{nomeProduto || "Produto"}</h1>
            <span className="text-sm font-bold">Referência: <span className="font-normal ml-2">3336HSAUJ7</span></span>
            <p className="text-sm mt-3 leading-relaxed">{detalhesProduto2 || "Produto de qualidade superior da Trina.ao."}</p>
            <div className="mt-5"><span className="text-xs font-semibold"><FontAwesomeIcon className="mr-1" icon={faAngleRight}/>Recomendamos seu tamanho habitual</span></div>

            <div className="mt-3 flex flex-col w-full max-w-[200px]">
              <label htmlFor="tamanho" className="font-semibold text-sm">Tamanhos</label>
              <select id="tamanho" value={selectedOption} onChange={(e) => setSelectedOption(e.target.value)} className="px-4 py-2.5 mt-2 border text-base sm:text-sm rounded-sm bg-zinc-100 outline-none">
                <option value="" disabled>Selecione...</option>
                {["36","37","38","39"].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            <div className="mt-5">
              <h2 className="text-sm font-semibold">Cores</h2>
              <div className="mt-2 flex gap-2">
                {colors.map(color => (
                  <button key={color.name} onClick={() => setSelectedColor(color.name)} aria-label={color.name}
                    className={`w-9 h-9 rounded-full border-2 flex items-center justify-center ${selectedColor === color.name ? "border-black" : "border-transparent"}`}
                    style={{ backgroundColor: color.colorCode }}>
                    {selectedColor === color.name && <span className="text-white text-xs">✔</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <span className="text-sm font-semibold">Quantidade</span>
              <div className="flex items-center mt-2">
                <button aria-label="Diminuir" className="w-10 h-10 bg-black text-white rounded-sm text-lg" onClick={() => setProductCount(p => Math.max(1, p-1))}>-</button>
                <span className="w-12 text-center">{productCount}</span>
                <button aria-label="Aumentar" className="w-10 h-10 bg-black text-white rounded-sm text-lg" onClick={() => setProductCount(p => p+1)}>+</button>
              </div>
            </div>

            <div className="mt-6">
              {precoAnterior && <p className="text-base sm:text-lg line-through text-red-900 font-bold">{precoAnterior} Akz</p>}
              <div className="flex items-center gap-4">
                <p className="text-2xl font-bold">{precoActual} Akz</p>
                {percentagem !== 0 && percentagem !== undefined && <span className="text-sm bg-yellow-400 px-1.5 rounded-sm">{percentagem}%</span>}
              </div>
            </div>
            <button onClick={() => navigate("/cart")} className="mt-6 w-full sm:w-auto py-3 px-10 bg-black hover:bg-zinc-800 text-white text-sm font-semibold rounded-sm">
              Adicionar ao carrinho
            </button>
          </div>
        </div>
      </div>

      <section className="w-full mt-12 sm:mt-20 mb-16 sm:mb-20">
        <h2 className="font-semibold text-black text-lg sm:text-xl text-center px-4">Você também pode comprar</h2>
        <section className="flex items-center justify-center my-6">
          <div className="container-site grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
            {OtherData.map((item, i) => <ShopDataCard key={i} {...item} />)}
          </div>
        </section>
      </section>

      {isExpanded && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/90 z-[70]" onClick={() => setIsExpanded(false)}>
          <button aria-label="Fechar" className="absolute top-4 right-4 w-11 h-11 flex items-center justify-center text-white text-2xl"><FaTimes/></button>
          <button aria-label="Anterior" onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(i => (i-1+galleryImages.length)%galleryImages.length); }} className="absolute left-1 sm:left-10 w-11 h-11 flex items-center justify-center text-white text-3xl sm:text-4xl z-10"><FaChevronLeft/></button>
          <img src={galleryImages[selectedImageIndex]} alt="Expandido" onClick={(e) => e.stopPropagation()} className="max-w-[90%] max-h-[85vh] object-contain rounded-lg"/>
          <button aria-label="Seguinte" onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(i => (i+1)%galleryImages.length); }} className="absolute right-1 sm:right-10 w-11 h-11 flex items-center justify-center text-white text-3xl sm:text-4xl z-10"><FaChevronRight/></button>
        </div>
      )}
      <Footer />
    </>
  );
};
export default Products;

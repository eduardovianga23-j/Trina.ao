import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import Header from "../../assets/components/header/Header";
import TopHeader from "../../assets/components/topheader/TopHeader";
import Footer from "../../assets/components/footer/footer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleRight } from "@fortawesome/free-solid-svg-icons";
import { faHeart } from "@fortawesome/free-regular-svg-icons";
import { FaExpand, FaChevronLeft, FaChevronRight } from "react-icons/fa";

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
  const { img, nomeProduto, percentagem, detalhesProduto2, precoAnterior, precoActual } = location.state || {};
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
      <div className="flex items-center mt-28 mb-10 h-5/6 p-2">
        <div className="w-[94%] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[60%_40%] gap-14 md:gap-8 p-2">
          <div className="w-full h-full flex flex-row items-start">
            <div className="flex flex-col gap-2 h-full max-h-[526px] w-20 sm:w-24 lg:w-[133px] p-2">
              {galleryImages.map((image, index) => (
                <img key={index} src={image} alt={`Thumb ${index+1}`} className={`w-full h-auto object-cover cursor-pointer rounded-md border-2 ${selectedImageIndex === index ? "border-blue-500" : "border-gray-300"}`} onClick={() => setSelectedImageIndex(index)}/>
              ))}
            </div>
            <div className="relative flex-1 flex items-center justify-center h-full max-h-[524px]">
              <img src={galleryImages[selectedImageIndex]} alt="Produto" className="w-full max-w-[570px] h-full object-cover rounded-lg shadow-lg"/>
              <button className="absolute top-2 left-1 ml-6 bg-white p-2 rounded-full shadow" onClick={() => setIsExpanded(true)}>
                <FaExpand className="text-gray-700"/>
              </button>
            </div>
          </div>

          <div className="w-full ml-2 md:ml-5 p-4">
            <h1 className="text-3xl font-semibold">{nomeProduto || "Produto"}</h1>
            <span className="text-sm font-bold">Referência: <span className="font-normal ml-2">3336HSAUJ7</span></span>
            <p className="text-xs mt-3 text-justify">{detalhesProduto2 || "Produto de qualidade superior da Trina.ao."}</p>
            <div className="mt-5"><span className="text-xs font-semibold"><FontAwesomeIcon className="mr-1" icon={faAngleRight}/>Recomendamos seu tamanho habitual</span></div>
            <div className="mt-1 w-[26%] flex flex-col">
              <label className="font-semibold text-sm">Tamanhos</label>
              <select value={selectedOption} onChange={(e) => setSelectedOption(e.target.value)} className="px-4 py-1 mt-2 border text-sm rounded-sm bg-zinc-100 outline-none">
                <option value="" disabled>Selecione...</option>
                {["36","37","38","39"].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div className="mt-4">
              <h1 className="text-sm font-semibold">Núcleos</h1>
              <div className="mt-2 flex gap-1 mb-6">
                {colors.map(color => (
                  <button key={color.name} onClick={() => setSelectedColor(color.name)}
                    className={`w-6 h-6 rounded-full border-2 ${selectedColor === color.name ? "border-black" : "border-transparent"}`}
                    style={{ backgroundColor: color.colorCode }}>
                    {selectedColor === color.name && <span className="text-white text-xs">✔</span>}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-6 mb-6 w-[24%]">
              <span className="text-sm font-semibold">quantidade</span>
              <div className="flex items-center mt-2">
                <button className="px-4 bg-black text-white rounded-sm" onClick={() => setProductCount(p => Math.max(1, p-1))}>-</button>
                <span className="px-3">{productCount}</span>
                <button className="px-4 bg-black text-white rounded-sm" onClick={() => setProductCount(p => p+1)}>+</button>
              </div>
            </div>
            <h1 className="text-lg line-through text-red-900 font-bold">{precoAnterior} Akz</h1>
            <div className="flex items-center justify-between mb-4 w-[68%] md:w-[45%]">
              <h1 className="text-2xl font-bold">{precoActual} Akz</h1>
              <span className="text-sm bg-yellow-400 px-1 rounded-sm">{percentagem} %</span>
            </div>
            <button onClick={() => navigate("/cart")} className="mt-4 py-2 px-4 bg-black text-white rounded-sm">ao carrinho</button>
          </div>
        </div>
      </div>

      <section className="w-full mt-20 mb-20">
        <h1 className="font-semibold text-black text-xl text-center">Você também pode comprar</h1>
        <section className="flex items-center justify-center my-6">
          <div className="w-11/12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-14 md:gap-8 lg:gap-4">
            {OtherData.map((item, i) => (
              <div key={i} className="shadow-lg rounded-lg bg-white cursor-pointer relative">
                <FontAwesomeIcon className="bg-white text-neutral-900 p-3 rounded-3xl absolute top-5 right-4 hover:bg-yellow-400 z-10" icon={faHeart}/>
                <div className="overflow-hidden relative">
                  <img src={item.img} alt={item.nomeProduto} className="mx-auto h-[300px] w-full object-cover hover:scale-110 transition duration-700"/>
                  <span className="text-sm absolute top-5 text-red-700 pr-1 pl-1 bg-white">SUPER<span className="font-bold">PREÇO</span></span>
                  <span className="text-xs absolute top-12 text-black p-1 pl-3 pr-2 bg-yellow-400">{item.percentagem}%</span>
                  <span className="text-xs absolute top-20 text-white p-1 bg-black">NOVIDADE EM</span>
                </div>
                <div className="space-y-2 p-3">
                  <h1 className="font-bold text-sm">{item.nomeProduto}</h1>
                  <h1 className="text-xs text-black">{item.detalhesProduto}</h1>
                  <div className="flex items-center justify-between border-t-2 py-3">
                    <div>
                      <p className="text-xs line-through text-red-900 font-bold">{item.precoAnterior} Akz</p>
                      <p className="text-base font-bold">{item.precoActual} Akz</p>
                    </div>
                    <span onClick={() => navigate("/products", { state: item })} className="cursor-pointer py-2 px-6 bg-black text-xs text-white rounded-sm">;</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </section>

      {isExpanded && (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-80 z-50" onClick={() => setIsExpanded(false)}>
          <button onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(i => (i-1+galleryImages.length)%galleryImages.length); }} className="absolute left-10 text-white text-4xl"><FaChevronLeft/></button>
          <img src={galleryImages[selectedImageIndex]} alt="Expandido" className="max-w-[90%] max-h-[90%] object-cover rounded-lg"/>
          <button onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(i => (i+1)%galleryImages.length); }} className="absolute right-10 text-white text-4xl"><FaChevronRight/></button>
        </div>
      )}
      <Footer />
    </>
  );
};
export default Products;

import { useState, useEffect } from "react";
const BestProdCard = ({ img1, img2, img3, category, price }) => {
  const images = [img1, img2, img3];
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i+1) % images.length), 2000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex flex-col items-center">
      <div className="overflow-hidden w-full aspect-[4/5] rounded-sm bg-zinc-100">
        <img src={images[idx]} alt={category} loading="lazy" className="w-full h-full object-cover cursor-pointer sm:transition sm:duration-700 sm:hover:scale-110"/>
      </div>
      <div className="flex flex-wrap justify-center gap-x-1.5 sm:gap-x-2 py-3 sm:py-4 text-center">
        <h1 className="font-extrabold text-xs lg:text-sm text-black">{category}</h1>
        <h1 className="text-xs lg:text-sm text-black">a partir de</h1>
        <h1 className="font-extrabold text-xs lg:text-sm text-black">{price} Akz</h1>
      </div>
      <span className="cursor-pointer py-2 px-5 sm:px-7 rounded-sm text-xs lg:text-sm flex bg-black text-white hover:bg-zinc-800">Ver mais</span>
    </div>
  );
};
export default BestProdCard;

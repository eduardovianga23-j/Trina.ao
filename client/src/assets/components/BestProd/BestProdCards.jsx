import { useState, useEffect } from "react";
const BestProdCard = ({ img1, img2, img3, category, price }) => {
  const images = [img1, img2, img3];
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i+1) % images.length), 2000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="transition-all flex flex-col items-center justify-center duration-500 mb-10 md:mb-16">
      <div className="overflow-hidden">
        <img src={images[idx]} alt={category} className="mx-auto h-[360px] w-[340px] md:h-[220px] md:w-[210px] lg:h-[350px] lg:w-[400px] cursor-pointer rounded-sm sm:transition sm:duration-700 sm:hover:scale-110"/>
      </div>
      <div className="flex gap-2 py-4">
        <h1 className="font-extrabold text-xs lg:text-sm text-black">{category}</h1>
        <h1 className="text-xs lg:text-sm text-black">a partir de</h1>
        <h1 className="font-extrabold text-xs lg:text-sm text-black">{price} Akz</h1>
      </div>
      <span className="cursor-pointer py-2 px-7 rounded-sm text-xs lg:text-sm flex bg-black text-white">;</span>
    </div>
  );
};
export default BestProdCard;

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { imgUrl } from '../../../utils/img';

const BestProdCard = ({ img1, img2, img3, label, category }) => {
  const images = [img1, img2, img3];
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i+1) % images.length), 2000);
    return () => clearInterval(t);
  }, []);
  const to = `/shop?category=${encodeURIComponent(category)}`;
  return (
    <div className="flex flex-col items-center">
      <Link to={to} className="overflow-hidden w-full aspect-[4/5] rounded-sm bg-zinc-100">
        <img src={imgUrl(images[idx], 500)} alt={label} loading="lazy" decoding="async" className="w-full h-full object-cover sm:transition sm:duration-700 sm:hover:scale-110"/>
      </Link>
      <h2 className="font-extrabold text-xs lg:text-sm text-black uppercase py-3 sm:py-4">{label}</h2>
      <Link to={to} className="py-2 px-5 sm:px-7 rounded-sm text-xs lg:text-sm flex bg-black text-white hover:bg-zinc-800">Ver mais</Link>
    </div>
  );
};
export default BestProdCard;

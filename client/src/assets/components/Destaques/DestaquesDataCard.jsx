const DestaquesDataCard = ({img,}) => {
    return (
    <div className="relative flex flex-col items-center justify-center">
      <div className="overflow-hidden w-full">
        <img src={img} 
          alt="No image"
          className="w-full aspect-[4/5] cursor-pointer rounded-sm  object-cover transition duration-700 hover:skew-x-2 hover:scale-110"/>
      </div>

       <span className="btn cursor-pointer pl-5 pr-5 py-1 sm:pl-10 sm:pr-10 sm:py-1 absolute bottom-3 rounded-sm text-xs sm:text-sm items-center justify-center flex bg-black text-white">Confira</span>
    </div>  
  );
};
export default DestaquesDataCard;

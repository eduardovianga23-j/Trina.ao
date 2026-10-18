const DestaquesDataCard = ({img,}) => {
    return (
    <div className="transition-all  flex flex-col items-center justify-center duration-500  dark:text-white">
      <div className="overflow-hidden">
        <img src={img} 
          alt="No image"
          className="mx-auto md:h-[240px] md:w-[280px] lg:h-[240px] lg:w-[280px]  w-[240px] h-[180px] cursor-pointer rounded-sm  object-cover transition duration-700 hover:skew-x-2 hover:scale-110"/>
      </div>

       <span className="btn cursor-pointer pl-5 pr-5 py-1 sm:pl-10 sm:pr-10 sm:py-1 absolute mt-40 sm:mt-60 rounded-sm text-xs sm:text-sm items-center justify-center flex bg-black text-white">Confira</span>
    </div>  
  );
};
export default DestaquesDataCard;

import "./HomeBack.css";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay, EffectFade } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/effect-fade";

const slides = [
  { id: 1, image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400&q=80" },
  { id: 2, image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1400&q=80" },
];

const HomeBack = () => {
  return (
    <div className="w-full h-[60vh] min-h-[340px] max-h-[520px] md:h-[480px] md:max-h-none lg:h-[570px] mt-[110px] relative">
      <div className="hidden md:block h-full w-full">
        <Swiper
          modules={[Navigation, Pagination, Autoplay, EffectFade]}
          effect="fade" loop={true}
          autoplay={{ delay: 3000, disableOnInteraction: false }}
          speed={900} navigation={true}
          pagination={{ clickable: true }}
          className="h-full w-full"
        >
          {slides.map((slide) => (
            <SwiperSlide key={slide.id}>
              <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${slide.image})`, filter: "brightness(85%)" }}/>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
      <div className="block md:hidden w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${slides[0].image})`, filter:"brightness(85%)" }}/>
      <style>{`
        .swiper-button-prev, .swiper-button-next { color: rgba(255,255,255,0.9); }
        .swiper-pagination-bullet { background: rgba(255,255,255,0.8); width:10px; height:10px; }
        .swiper-pagination-bullet-active { background: rgba(255,255,255,1); opacity:1; }
      `}</style>
    </div>
  );
};

export default HomeBack;

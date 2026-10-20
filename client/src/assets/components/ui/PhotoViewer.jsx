import { useEffect } from 'react';
import { FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

// Mostra uma foto em grande (fecha com Esc, clique fora ou no X; setas para mudar)
const PhotoViewer = ({ photos, index, onClose, onChange }) => {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onChange((index + 1) % photos.length);
      if (e.key === 'ArrowLeft') onChange((index - 1 + photos.length) % photos.length);
    };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = overflow; };
  }, [index, photos.length]);

  if (index == null) return null;
  const btn = 'absolute w-11 h-11 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/30 text-white';
  return (
    <div role="dialog" aria-modal="true" aria-label="Foto da avaliação" className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4" onClick={onClose}>
      <img src={photos[index]} alt="" className="max-w-full max-h-full object-contain rounded" onClick={(e) => e.stopPropagation()} />
      <button type="button" onClick={onClose} className={`${btn} top-4 right-4`} aria-label="Fechar"><FaTimes /></button>
      {photos.length > 1 && (
        <>
          <button type="button" onClick={(e) => { e.stopPropagation(); onChange((index - 1 + photos.length) % photos.length); }} className={`${btn} left-3 top-1/2 -translate-y-1/2`} aria-label="Foto anterior"><FaChevronLeft /></button>
          <button type="button" onClick={(e) => { e.stopPropagation(); onChange((index + 1) % photos.length); }} className={`${btn} right-3 top-1/2 -translate-y-1/2`} aria-label="Foto seguinte"><FaChevronRight /></button>
        </>
      )}
    </div>
  );
};

export default PhotoViewer;

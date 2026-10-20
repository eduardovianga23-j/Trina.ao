import { useRef, useState } from 'react';
import { FaCamera, FaTimes, FaCheckCircle } from 'react-icons/fa';
import { StarInput, Stars } from '../../assets/components/ui/Stars';
import { reviewAPI, apiError } from '../../services/api';
import { imgUrl } from '../../utils/img';

const MAX_PHOTOS = 3;
const MAX_MB = 5;
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];

/*
  Avaliar um produto da encomenda: estrelas, comentário e até 3 fotos.
  Aparece depois de o cliente confirmar que recebeu a encomenda.
*/
const ReviewForm = ({ order, item, review, onSaved }) => {
  const [editing, setEditing] = useState(!review);
  const [rating, setRating] = useState(review?.rating || 0);
  const [comment, setComment] = useState(review?.comment || '');
  const [photos, setPhotos] = useState(review?.photos || []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileInput = useRef(null);
  const labelId = `rate-${item.product}`;

  const addPhotos = async (fileList) => {
    setError('');
    const room = MAX_PHOTOS - photos.length;
    let files = Array.from(fileList || []);
    if (files.some((f) => !ACCEPTED.includes(f.type))) return setError('Usa fotos JPG, PNG ou WEBP.');
    if (files.some((f) => f.size > MAX_MB * 1024 * 1024)) return setError(`Cada foto pode ter no máximo ${MAX_MB} MB.`);
    if (files.length > room) setError(`Só podes juntar ${MAX_PHOTOS} fotos.`);
    files = files.slice(0, room);
    if (!files.length) return;
    setUploading(true);
    try {
      const { data } = await reviewAPI.uploadPhotos(files);
      setPhotos((p) => [...p, ...data.urls].slice(0, MAX_PHOTOS));
    } catch (err) {
      setError(apiError(err, 'Não foi possível enviar as fotos.'));
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!rating) return setError('Escolhe de 1 a 5 estrelas.');
    setSaving(true);
    setError('');
    try {
      const { data } = await reviewAPI.save({ orderId: order._id, productId: item.product, rating, comment: comment.trim(), photos });
      onSaved(data);
      setEditing(false);
    } catch (err) {
      setError(apiError(err, 'Não foi possível guardar a avaliação.'));
    } finally {
      setSaving(false);
    }
  };

  const header = (
    <div className="flex gap-3">
      <img src={imgUrl(item.image, 160)} alt="" className="w-12 h-14 object-cover rounded-md bg-zinc-100 shrink-0" />
      <div className="min-w-0">
        <p className="text-sm font-semibold">{item.name}</p>
        <p className="text-xs text-zinc-500">{[item.size && `Tamanho ${item.size}`, item.color?.name].filter(Boolean).join(' · ')}</p>
      </div>
    </div>
  );

  if (!editing && review) {
    return (
      <div className="rounded-lg border border-zinc-200 p-4">
        {header}
        <div className="mt-3 flex items-center gap-2 text-sm text-green-700 font-semibold">
          <FaCheckCircle aria-hidden="true" /> Avaliado <Stars value={review.rating} />
        </div>
        {review.comment && <p className="mt-2 text-sm text-zinc-700">{review.comment}</p>}
        {review.photos?.length > 0 && (
          <div className="mt-2 flex gap-2">{review.photos.map((p) => <img key={p} src={p} alt="" className="w-16 h-16 object-cover rounded-md" />)}</div>
        )}
        <button type="button" onClick={() => setEditing(true)} className="mt-3 text-sm font-semibold text-red-800 hover:underline">Editar avaliação</button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-lg border border-zinc-200 p-4 grid gap-3">
      {header}
      <div>
        <p id={labelId} className="text-sm font-semibold mb-1">A tua nota</p>
        <StarInput id={labelId} value={rating} onChange={setRating} />
      </div>
      <div>
        <label htmlFor={`c-${item.product}`} className="text-sm font-semibold">Comentário <span className="font-normal text-zinc-400">(opcional)</span></label>
        <textarea id={`c-${item.product}`} rows={3} maxLength={1000} value={comment} onChange={(e) => setComment(e.target.value)}
          placeholder="O que achaste? O tamanho serviu bem? A cor é igual à foto?"
          className="mt-1 w-full border border-zinc-300 rounded-md px-3 py-2.5 text-base sm:text-sm outline-none focus:border-black" />
      </div>
      <div>
        <p className="text-sm font-semibold">Fotos <span className="font-normal text-zinc-400">(até {MAX_PHOTOS}, opcional)</span></p>
        <p className="text-xs text-zinc-500">Uma foto a usar a peça ajuda muito quem está a pensar comprar.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {photos.map((p) => (
            <span key={p} className="relative">
              <img src={p} alt="Foto da avaliação" className="w-20 h-20 object-cover rounded-md" />
              <button type="button" onClick={() => setPhotos((ph) => ph.filter((x) => x !== p))} aria-label="Remover foto"
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs"><FaTimes /></button>
            </span>
          ))}
          {photos.length < MAX_PHOTOS && (
            <button type="button" onClick={() => fileInput.current?.click()} disabled={uploading}
              className="w-20 h-20 rounded-md border-2 border-dashed border-zinc-300 hover:border-black flex flex-col items-center justify-center gap-1 text-xs text-zinc-500 disabled:opacity-50">
              <FaCamera className="text-lg" aria-hidden="true" />
              {uploading ? 'A enviar...' : 'Juntar foto'}
            </button>
          )}
          <input ref={fileInput} type="file" accept={ACCEPTED.join(',')} multiple className="hidden" onChange={(e) => addPhotos(e.target.files)} />
        </div>
      </div>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <div className="flex gap-2">
        <button disabled={saving || uploading} className="py-2.5 px-5 bg-black hover:bg-zinc-800 disabled:opacity-50 text-white text-sm font-semibold rounded-md">
          {saving ? 'A guardar...' : 'Publicar avaliação'}
        </button>
        {review && <button type="button" onClick={() => setEditing(false)} className="py-2.5 px-4 text-sm font-semibold border border-zinc-300 rounded-md">Cancelar</button>}
      </div>
    </form>
  );
};

export default ReviewForm;

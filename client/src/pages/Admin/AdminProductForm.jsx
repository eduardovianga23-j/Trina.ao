import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import { productAPI, uploadAPI, apiError } from '../../services/api';
import { CATEGORIES, categoryLabel, formatEUR } from '../../utils/format';

/*
  /admin/novo  e  /admin/editar/:id
  Regras (também confirmadas pelo servidor):
  - Fotos: mínimo 2, máximo 4. A primeira é a principal.
  - Cores: só aparecem se "Este produto tem várias cores?" estiver ligado.
  - Tamanhos: escolhe os disponíveis; sem nenhum = tamanho único.
  - "Combina com": até 4 produtos sugeridos na página do produto.
*/
const MIN_IMAGES = 2;
const MAX_IMAGES = 4;
const MAX_RELATED = 4;
const MAX_FILE_MB = 5;
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];

const SIZE_PRESETS = {
  Roupa: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  Calçado: ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45'],
};
const suggestedPreset = (category) => (category === 'sapatos' ? 'Calçado' : 'Roupa');

const EMPTY = {
  name: '', description: '', category: '', price: '', originalPrice: '',
  images: [], sizes: [], hasColors: false, colors: [], related: [], featured: false, active: true,
};

const toNumber = (v) => (v === '' || v == null ? NaN : Number(String(v).replace(',', '.')));

const Section = ({ title, hint, children }) => (
  <section className="bg-white rounded-lg border border-zinc-200 p-4 sm:p-6">
    <h2 className="font-bold">{title}</h2>
    {hint && <p className="text-xs text-zinc-500 mt-1">{hint}</p>}
    <div className="mt-4">{children}</div>
  </section>
);

const Label = ({ htmlFor, children, optional }) => (
  <label htmlFor={htmlFor} className="block text-sm font-semibold mb-1.5">
    {children} {optional && <span className="font-normal text-zinc-400">(opcional)</span>}
  </label>
);

const inputCls = 'w-full border border-zinc-300 rounded-md px-3 py-2.5 text-base sm:text-sm bg-white outline-none focus:border-black';

const Toggle = ({ checked, onChange, label, description, id }) => (
  <label htmlFor={id} className="flex items-start gap-3 cursor-pointer select-none">
    <span className="relative mt-0.5 shrink-0">
      <input id={id} type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="block w-11 h-6 rounded-full bg-zinc-300 peer-checked:bg-red-800 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-black" />
      <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
    </span>
    <span>
      <span className="block text-sm font-semibold">{label}</span>
      {description && <span className="block text-xs text-zinc-500">{description}</span>}
    </span>
  </label>
);

const AdminProductForm = () => {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const fileInput = useRef(null);
  const topRef = useRef(null);

  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState([]);
  const [uploading, setUploading] = useState(0); // fotos a enviar
  const [progress, setProgress] = useState(0);
  const [photoMsg, setPhotoMsg] = useState('');
  const [customSize, setCustomSize] = useState('');
  const [allProducts, setAllProducts] = useState([]);
  const [relatedSearch, setRelatedSearch] = useState('');
  // Fotos enviadas nesta edição e ainda não guardadas (para limpar se não forem usadas)
  const newUploads = useRef([]);
  const savedImages = useRef([]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    productAPI.getAllAdmin().then(({ data }) => setAllProducts(data)).catch(() => {});
    if (!editing) return;
    productAPI
      .getById(id)
      .then(({ data }) => {
        savedImages.current = data.images;
        setForm({
          name: data.name, description: data.description, category: data.category,
          price: String(data.price), originalPrice: data.originalPrice ? String(data.originalPrice) : '',
          images: data.images, sizes: data.sizes, hasColors: data.hasColors, colors: data.colors,
          related: data.related.map(String), featured: data.featured, active: data.active,
        });
      })
      .catch((err) => setErrors([apiError(err, 'Produto não encontrado.')]))
      .finally(() => setLoading(false));
  }, [id]);

  // ---------- Fotos ----------
  const remaining = MAX_IMAGES - form.images.length - uploading;

  const onFiles = async (fileList) => {
    setPhotoMsg('');
    let files = Array.from(fileList || []);
    if (!files.length) return;

    const wrongType = files.filter((f) => !ACCEPTED.includes(f.type));
    const tooBig = files.filter((f) => f.size > MAX_FILE_MB * 1024 * 1024);
    files = files.filter((f) => ACCEPTED.includes(f.type) && f.size <= MAX_FILE_MB * 1024 * 1024);
    const msgs = [];
    if (wrongType.length) msgs.push(`${wrongType.length} ficheiro(s) ignorado(s): use JPG, PNG ou WEBP.`);
    if (tooBig.length) msgs.push(`${tooBig.length} foto(s) com mais de ${MAX_FILE_MB} MB ignorada(s).`);
    if (files.length > remaining) {
      msgs.push(`Só cabem mais ${remaining} foto(s) (máximo ${MAX_IMAGES}). As restantes foram ignoradas.`);
      files = files.slice(0, Math.max(0, remaining));
    }
    setPhotoMsg(msgs.join(' '));
    if (!files.length) return;

    setUploading(files.length);
    setProgress(0);
    try {
      const { data } = await uploadAPI.images(files, setProgress);
      newUploads.current.push(...data.urls);
      setForm((f) => ({ ...f, images: [...f.images, ...data.urls].slice(0, MAX_IMAGES) }));
    } catch (err) {
      setPhotoMsg(apiError(err, 'Não foi possível enviar as fotos.'));
    } finally {
      setUploading(0);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const removeImage = (url) => {
    set('images', form.images.filter((u) => u !== url));
    // Foto acabada de enviar e ainda não guardada: apaga-a já do servidor
    if (newUploads.current.includes(url)) {
      newUploads.current = newUploads.current.filter((u) => u !== url);
      uploadAPI.discard([url]);
    }
  };

  // Ao sair sem guardar (Cancelar, Voltar, fechar a página): limpa as fotos novas não usadas
  const discardUnsaved = () => {
    uploadAPI.discard(newUploads.current.filter((u) => !savedImages.current.includes(u)));
    newUploads.current = [];
  };
  useEffect(() => () => discardUnsaved(), []);
  const makeMain = (url) => set('images', [url, ...form.images.filter((u) => u !== url)]);

  // ---------- Tamanhos ----------
  const toggleSize = (s) => set('sizes', form.sizes.includes(s) ? form.sizes.filter((x) => x !== s) : [...form.sizes, s]);
  const addCustomSize = () => {
    const s = customSize.trim().toUpperCase().slice(0, 10);
    if (s && !form.sizes.includes(s)) set('sizes', [...form.sizes, s]);
    setCustomSize('');
  };
  const presetName = suggestedPreset(form.category);
  const extraSizes = form.sizes.filter((s) => !SIZE_PRESETS[presetName].includes(s));

  // ---------- Cores ----------
  const setHasColors = (on) =>
    setForm((f) => ({ ...f, hasColors: on, colors: on && f.colors.length === 0 ? [{ name: '', hex: '#111111' }] : f.colors }));
  const updateColor = (i, key, value) => set('colors', form.colors.map((c, idx) => (idx === i ? { ...c, [key]: value } : c)));
  const addColor = () => form.colors.length < 12 && set('colors', [...form.colors, { name: '', hex: '#BB0320' }]);
  const removeColor = (i) => set('colors', form.colors.filter((_, idx) => idx !== i));

  // ---------- Combina com ----------
  const candidates = useMemo(() => {
    const q = relatedSearch.trim().toLowerCase();
    return allProducts.filter((p) => p._id !== id && (!q || p.name.toLowerCase().includes(q)));
  }, [allProducts, relatedSearch, id]);
  const toggleRelated = (pid) => {
    if (form.related.includes(pid)) set('related', form.related.filter((x) => x !== pid));
    else if (form.related.length < MAX_RELATED) set('related', [...form.related, pid]);
  };

  // ---------- Guardar ----------
  const validate = () => {
    const e = [];
    const price = toNumber(form.price);
    const original = toNumber(form.originalPrice);
    if (!form.name.trim()) e.push('Escreve o nome do produto.');
    if (!form.category) e.push('Escolhe uma categoria.');
    if (!form.description.trim()) e.push('Escreve uma descrição.');
    if (!(price > 0)) e.push('Indica um preço válido (ex.: 24,90).');
    if (form.originalPrice !== '' && !(original > price)) e.push('O preço anterior tem de ser maior que o preço atual.');
    if (form.images.length < MIN_IMAGES) e.push(`Adiciona pelo menos ${MIN_IMAGES} fotos (tens ${form.images.length}).`);
    if (form.images.length > MAX_IMAGES) e.push(`No máximo ${MAX_IMAGES} fotos.`);
    if (form.hasColors) {
      if (form.colors.length === 0) e.push('Adiciona pelo menos uma cor, ou desliga "várias cores".');
      if (form.colors.some((c) => !c.name.trim())) e.push('Dá um nome a cada cor (ex.: "Preto").');
      const names = form.colors.map((c) => c.name.trim().toLowerCase());
      if (new Set(names).size !== names.length) e.push('Há cores com o mesmo nome.');
    }
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (e.length) return topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category,
      price: toNumber(form.price),
      originalPrice: form.originalPrice === '' ? null : toNumber(form.originalPrice),
      images: form.images,
      sizes: form.sizes,
      hasColors: form.hasColors,
      colors: form.hasColors ? form.colors.map((c) => ({ name: c.name.trim(), hex: c.hex })) : [],
      related: form.related,
      featured: form.featured,
      active: form.active,
    };

    setSaving(true);
    try {
      if (editing) await productAPI.update(id, payload);
      else await productAPI.create(payload);
      newUploads.current = []; // ficaram guardadas no produto
      navigate('/admin', { state: { notice: editing ? `"${payload.name}" foi atualizado.` : `"${payload.name}" foi criado.` } });
    } catch (err) {
      setErrors(err.response?.data?.errors || [apiError(err, 'Não foi possível guardar.')]);
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <AdminLayout title={editing ? 'Editar produto' : 'Novo produto'}><p className="text-sm text-zinc-500">A carregar...</p></AdminLayout>;
  }

  const price = toNumber(form.price);
  const original = toNumber(form.originalPrice);
  const discount = price > 0 && original > price ? Math.round(((original - price) / original) * 100) : 0;

  return (
    <AdminLayout
      title={editing ? 'Editar produto' : 'Novo produto'}
      actions={<Link to="/admin" className="text-sm font-semibold hover:underline">← Voltar à lista</Link>}
    >
      <div ref={topRef} className="scroll-mt-20" />
      {errors.length > 0 && (
        <div role="alert" className="mb-5 text-sm text-red-800 bg-red-50 border border-red-200 rounded-md px-4 py-3">
          <p className="font-bold mb-1">Falta corrigir:</p>
          <ul className="list-disc pl-5 space-y-0.5">{errors.map((e) => <li key={e}>{e}</li>)}</ul>
        </div>
      )}

      <form onSubmit={submit} className="grid gap-5 lg:grid-cols-[1fr_340px] items-start" noValidate>
        <div className="grid gap-5">
          {/* FOTOS */}
          <Section title={`Fotos (${form.images.length}/${MAX_IMAGES})`} hint={`Mínimo ${MIN_IMAGES}, máximo ${MAX_IMAGES}. A primeira é a foto principal. JPG, PNG ou WEBP até ${MAX_FILE_MB} MB.`}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {form.images.map((url, i) => (
                <div key={url} className="relative aspect-[4/5] rounded-md overflow-hidden bg-zinc-100 border border-zinc-200 group">
                  <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                  {i === 0 ? (
                    <span className="absolute top-1.5 left-1.5 text-[10px] font-bold uppercase bg-black text-white px-1.5 py-0.5 rounded">Principal</span>
                  ) : (
                    <button type="button" onClick={() => makeMain(url)} className="absolute top-1.5 left-1.5 text-[10px] font-semibold bg-white/90 px-1.5 py-0.5 rounded hover:bg-white">
                      Tornar principal
                    </button>
                  )}
                  <button type="button" onClick={() => removeImage(url)} aria-label={`Remover foto ${i + 1}`}
                    className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-white/90 hover:bg-white text-red-800 font-bold shadow">
                    ×
                  </button>
                </div>
              ))}

              {Array.from({ length: uploading }, (_, i) => (
                <div key={`up${i}`} className="aspect-[4/5] rounded-md bg-zinc-100 border border-dashed border-zinc-300 flex flex-col items-center justify-center text-xs text-zinc-500">
                  <span className="w-6 h-6 border-2 border-zinc-300 border-t-red-800 rounded-full animate-spin mb-2" />
                  {progress}%
                </div>
              ))}

              {remaining > 0 && (
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}
                  className="aspect-[4/5] rounded-md border-2 border-dashed border-zinc-300 hover:border-red-800 hover:bg-red-50/40 flex flex-col items-center justify-center text-center p-2 transition-colors"
                >
                  <span className="text-2xl text-zinc-400">+</span>
                  <span className="text-xs font-semibold mt-1">Adicionar foto</span>
                  <span className="text-[11px] text-zinc-500">ainda cabem {remaining}</span>
                </button>
              )}
            </div>
            <input ref={fileInput} type="file" accept={ACCEPTED.join(',')} multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            {form.images.length < MIN_IMAGES && (
              <p className="text-xs text-amber-700 mt-3">Faltam {MIN_IMAGES - form.images.length} foto(s) para poder guardar.</p>
            )}
            {photoMsg && <p className="text-xs text-red-700 mt-2">{photoMsg}</p>}
          </Section>

          {/* INFORMAÇÃO */}
          <Section title="Informação">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="name">Nome</Label>
                <input id="name" className={inputCls} value={form.name} maxLength={120} onChange={(e) => set('name', e.target.value)} placeholder="Ex.: Vestido Capulana Luanda" />
              </div>
              <div>
                <Label htmlFor="category">Categoria</Label>
                <select id="category" className={inputCls} value={form.category} onChange={(e) => set('category', e.target.value)}>
                  <option value="" disabled>Escolhe uma categoria...</option>
                  {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <textarea id="description" rows={5} className={inputCls} value={form.description} maxLength={3000}
                  onChange={(e) => set('description', e.target.value)} placeholder="Tecido, corte, como fica, cuidados de lavagem..." />
                <p className="text-[11px] text-zinc-400 text-right">{form.description.length}/3000</p>
              </div>
            </div>
          </Section>

          {/* TAMANHOS */}
          <Section title="Tamanhos" hint="Carrega nos tamanhos que tens. Se não escolheres nenhum, o produto aparece como tamanho único.">
            <p className="text-xs font-semibold text-zinc-500 mb-2">{presetName}</p>
            <div className="flex flex-wrap gap-2">
              {[...SIZE_PRESETS[presetName], ...extraSizes].map((s) => {
                const on = form.sizes.includes(s);
                return (
                  <button type="button" key={s} onClick={() => toggleSize(s)} aria-pressed={on}
                    className={`min-w-[44px] h-10 px-3 text-sm border rounded-md transition-colors ${on ? 'bg-black text-white border-black' : 'bg-white border-zinc-300 hover:border-black'}`}>
                    {s}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2 mt-3 max-w-xs">
              <input className={inputCls} value={customSize} maxLength={10} onChange={(e) => setCustomSize(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomSize(); } }}
                placeholder="Outro (ex.: 2XL, Único)" aria-label="Outro tamanho" />
              <button type="button" onClick={addCustomSize} className="px-4 text-sm font-semibold border border-zinc-300 rounded-md hover:border-black">Adicionar</button>
            </div>
            <p className="text-xs text-zinc-500 mt-3">
              {form.sizes.length ? `Selecionados: ${form.sizes.join(', ')}` : 'Nenhum selecionado: tamanho único.'}
            </p>
          </Section>

          {/* CORES */}
          <Section title="Cores">
            <Toggle id="hasColors" checked={form.hasColors} onChange={setHasColors}
              label="Este produto tem várias cores?"
              description="Se estiver desligado, a escolha de cor não aparece na loja." />
            {form.hasColors && (
              <div className="mt-4 grid gap-2">
                {form.colors.map((c, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input type="color" value={c.hex} onChange={(e) => updateColor(i, 'hex', e.target.value)} aria-label={`Cor ${i + 1}`}
                      className="w-11 h-11 rounded-md border border-zinc-300 p-1 bg-white cursor-pointer shrink-0" />
                    <input className={inputCls} value={c.name} maxLength={40} onChange={(e) => updateColor(i, 'name', e.target.value)}
                      placeholder="Nome da cor (ex.: Preto)" aria-label={`Nome da cor ${i + 1}`} />
                    <button type="button" onClick={() => removeColor(i)} aria-label={`Remover cor ${i + 1}`}
                      className="w-11 h-11 shrink-0 rounded-md border border-zinc-300 text-red-800 font-bold hover:bg-red-50">×</button>
                  </div>
                ))}
                {form.colors.length < 12 && (
                  <button type="button" onClick={addColor} className="justify-self-start mt-1 text-sm font-semibold text-red-800 hover:underline">+ Adicionar cor</button>
                )}
              </div>
            )}
          </Section>

          {/* COMBINA COM */}
          <Section title={`Combina com (${form.related.length}/${MAX_RELATED})`}
            hint='Aparecem primeiro em "Você também pode comprar". Se não escolheres, o site sugere produtos da mesma categoria.'>
            {allProducts.length <= (editing ? 1 : 0) ? (
              <p className="text-sm text-zinc-500">Ainda não há outros produtos para sugerir.</p>
            ) : (
              <>
                <input type="search" className={`${inputCls} mb-3`} value={relatedSearch} onChange={(e) => setRelatedSearch(e.target.value)}
                  placeholder="Procurar produto..." aria-label="Procurar produto para sugerir" />
                <ul className="grid sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                  {candidates.map((p) => {
                    const on = form.related.includes(p._id);
                    const full = !on && form.related.length >= MAX_RELATED;
                    return (
                      <li key={p._id}>
                        <button type="button" onClick={() => toggleRelated(p._id)} disabled={full} aria-pressed={on}
                          className={`w-full flex items-center gap-2 p-2 rounded-md border text-left transition-colors ${
                            on ? 'border-black bg-zinc-50' : 'border-zinc-200 hover:border-zinc-400'} ${full ? 'opacity-40 cursor-not-allowed' : ''}`}>
                          <img src={p.images[0]} alt="" className="w-10 h-12 object-cover rounded bg-zinc-100 shrink-0" />
                          <span className="flex-1 min-w-0">
                            <span className="block text-sm font-semibold truncate">{p.name}</span>
                            <span className="block text-xs text-zinc-500">{categoryLabel(p.category)}</span>
                          </span>
                          <span className={`w-5 h-5 rounded border flex items-center justify-center text-xs shrink-0 ${on ? 'bg-black border-black text-white' : 'border-zinc-300'}`}>
                            {on ? '✓' : ''}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </Section>
        </div>

        {/* COLUNA LATERAL: preço, visibilidade e guardar */}
        <div className="grid gap-5 lg:sticky lg:top-20">
          <Section title="Preço">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="price">Preço (€)</Label>
                <input id="price" inputMode="decimal" className={inputCls} value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="24,90" />
              </div>
              <div>
                <Label htmlFor="originalPrice" optional>Preço anterior (€)</Label>
                <input id="originalPrice" inputMode="decimal" className={inputCls} value={form.originalPrice} onChange={(e) => set('originalPrice', e.target.value)} placeholder="Para mostrar desconto" />
              </div>
              {price > 0 && (
                <p className="text-sm">
                  Na loja: <strong>{formatEUR(price)}</strong>
                  {discount > 0 && <> <span className="line-through text-zinc-400 ml-1">{formatEUR(original)}</span> <span className="bg-yellow-400 text-xs px-1 rounded ml-1">-{discount}%</span></>}
                </p>
              )}
            </div>
          </Section>

          <Section title="Visibilidade">
            <div className="grid gap-4">
              <Toggle id="active" checked={form.active} onChange={(v) => set('active', v)} label="Visível na loja" description="Desliga para esconder sem apagar." />
              <Toggle id="featured" checked={form.featured} onChange={(v) => set('featured', v)} label="Destaque" description="Aparece na página inicial." />
            </div>
          </Section>

          <div className="grid gap-2">
            <button type="submit" disabled={saving || uploading > 0}
              className="w-full py-3 bg-red-800 hover:bg-red-900 disabled:opacity-60 text-white text-sm font-semibold rounded-md">
              {saving ? 'A guardar...' : uploading > 0 ? 'A enviar fotos...' : editing ? 'Guardar alterações' : 'Criar produto'}
            </button>
            <Link to="/admin" className="w-full py-3 text-center text-sm font-semibold border border-zinc-300 rounded-md bg-white hover:border-black">Cancelar</Link>
          </div>
        </div>
      </form>
    </AdminLayout>
  );
};

export default AdminProductForm;

import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FaSlidersH, FaTimes, FaSearch } from "react-icons/fa";
import Header from "../../assets/components/header/Header";
import TopHeader from "../../assets/components/topheader/TopHeader";
import Footer from "../../assets/components/footer/footer";
import { ProductGrid } from "../../assets/components/shopCard/ShopDataCard";
import { productAPI, apiError } from "../../services/api";
import { CATEGORIES, categoryLabel, formatEUR } from "../../utils/format";

/*
  Loja com pesquisa e filtros. Tudo fica no endereço (ex.: /shop?category=roupas&size=M&maxPrice=50),
  por isso dá para partilhar uma pesquisa ou voltar atrás no navegador.
*/
const SORTS = [
  { value: "newest", label: "Mais recentes" },
  { value: "best", label: "Mais vendidos" },
  { value: "rating", label: "Melhor avaliados" },
  { value: "price_asc", label: "Preço: mais baixo" },
  { value: "price_desc", label: "Preço: mais alto" },
];
const PRICE_PRESETS = [
  { label: "Até 20 €", max: "20" },
  { label: "20 € a 50 €", min: "20", max: "50" },
  { label: "50 € a 100 €", min: "50", max: "100" },
  { label: "Mais de 100 €", min: "100" },
];
const FILTER_KEYS = ["search", "category", "minPrice", "maxPrice", "size", "color", "inStock", "promo"];
const PAGE_SIZE = 12;

const Group = ({ title, children }) => (
  <fieldset className="border-t border-zinc-200 pt-4 mt-4 first:border-0 first:pt-0 first:mt-0">
    <legend className="text-sm font-bold mb-3 float-left w-full">{title}</legend>
    <div className="clear-both">{children}</div>
  </fieldset>
);

const Check = ({ checked, onChange, children }) => (
  <label className="flex items-center gap-2.5 text-sm cursor-pointer py-1">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="w-4 h-4 accent-red-800" />
    {children}
  </label>
);

const Shop = () => {
  const [params, setParams] = useSearchParams();
  const f = Object.fromEntries(FILTER_KEYS.map((k) => [k, params.get(k) || ""]));
  const sort = params.get("sort") || "newest";

  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState(f.search);
  const [options, setOptions] = useState({ sizes: [], colors: [], price: { min: 0, max: 0 } });
  const [price, setPrice] = useState({ min: f.minPrice, max: f.maxPrice });
  const [drawer, setDrawer] = useState(false);

  useEffect(() => { productAPI.filters().then(({ data }) => setOptions(data)).catch(() => {}); }, []);
  useEffect(() => { setQuery(f.search); }, [f.search]);
  useEffect(() => { setPrice({ min: f.minPrice, max: f.maxPrice }); }, [f.minPrice, f.maxPrice]);

  // Com a gaveta de filtros aberta (telemóvel), a página não faz scroll
  useEffect(() => {
    document.body.style.overflow = drawer ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawer]);

  const apiParams = (p) => ({
    ...Object.fromEntries(FILTER_KEYS.filter((k) => f[k]).map((k) => [k, f[k]])),
    sort, page: p, limit: PAGE_SIZE,
  });
  const key = params.toString();

  // Filtros mudaram: recomeça na página 1
  useEffect(() => {
    let cancel = false;
    setLoading(true);
    setError("");
    setPage(1);
    productAPI
      .getAll(apiParams(1))
      .then(({ data }) => { if (!cancel) { setProducts(data.products); setTotal(data.total); } })
      .catch((err) => !cancel && setError(apiError(err)))
      .finally(() => !cancel && setLoading(false));
    return () => { cancel = true; };
  }, [key]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const { data } = await productAPI.getAll(apiParams(page + 1));
      setProducts((prev) => [...prev, ...data.products]);
      setPage((p) => p + 1);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoadingMore(false);
    }
  };

  const update = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setParams(next, { state: { keepScroll: true } }); // mudar filtros não sobe a página
  };
  const clearAll = () => {
    const next = new URLSearchParams();
    if (sort !== "newest") next.set("sort", sort);
    setParams(next);
  };

  const applyPrice = (e) => {
    e?.preventDefault();
    const clean = (v) => String(v).replace(",", ".").replace(/[^\d.]/g, "");
    update({ minPrice: clean(price.min), maxPrice: clean(price.max) });
  };

  // Etiquetas dos filtros ativos (com X para tirar)
  const active = [
    f.search && { k: "search", label: `"${f.search}"` },
    f.category && { k: "category", label: categoryLabel(f.category) },
    (f.minPrice || f.maxPrice) && {
      k: ["minPrice", "maxPrice"],
      label: f.minPrice && f.maxPrice ? `${formatEUR(f.minPrice)} – ${formatEUR(f.maxPrice)}` : f.maxPrice ? `Até ${formatEUR(f.maxPrice)}` : `Desde ${formatEUR(f.minPrice)}`,
    },
    f.size && { k: "size", label: `Tamanho ${f.size}` },
    f.color && { k: "color", label: `Cor ${f.color}` },
    f.inStock && { k: "inStock", label: "Com stock" },
    f.promo && { k: "promo", label: "Em promoção" },
  ].filter(Boolean);
  const removeFilter = (k) => update(Object.fromEntries([].concat(k).map((x) => [x, ""])));

  const title = f.search ? `Resultados para "${f.search}"` : f.promo ? "Ofertas" : f.category ? categoryLabel(f.category) : sort === "newest" && params.get("sort") ? "Novidades" : "Todos os produtos";

  const chip = (on) =>
    `px-3 py-1.5 text-xs sm:text-sm border rounded-full transition-colors ${on ? "bg-black text-white border-black" : "bg-white text-zinc-700 border-zinc-300 hover:border-black"}`;

  const filtersPanel = (
    <div>
      <Group title="Categoria">
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => update({ category: "" })} className={chip(!f.category)} aria-pressed={!f.category}>Todas</button>
          {CATEGORIES.map((c) => (
            <button type="button" key={c.value} onClick={() => update({ category: f.category === c.value ? "" : c.value })} className={chip(f.category === c.value)} aria-pressed={f.category === c.value}>
              {c.label}
            </button>
          ))}
        </div>
      </Group>

      <Group title="Preço">
        <div className="flex flex-wrap gap-2 mb-3">
          {PRICE_PRESETS.map((p) => {
            const on = f.minPrice === (p.min || "") && f.maxPrice === (p.max || "");
            return (
              <button type="button" key={p.label} onClick={() => update(on ? { minPrice: "", maxPrice: "" } : { minPrice: p.min || "", maxPrice: p.max || "" })} className={chip(on)} aria-pressed={on}>
                {p.label}
              </button>
            );
          })}
        </div>
        <form onSubmit={applyPrice} className="flex items-center gap-2">
          <label className="sr-only" htmlFor="pmin">Preço mínimo</label>
          <input id="pmin" inputMode="decimal" placeholder={`${options.price.min || 0} €`} value={price.min} onChange={(e) => setPrice((p) => ({ ...p, min: e.target.value }))}
            className="w-full min-w-0 border border-zinc-300 rounded-md px-2.5 py-2 text-base sm:text-sm outline-none focus:border-black" />
          <span className="text-zinc-400">–</span>
          <label className="sr-only" htmlFor="pmax">Preço máximo</label>
          <input id="pmax" inputMode="decimal" placeholder={`${options.price.max || ""} €`} value={price.max} onChange={(e) => setPrice((p) => ({ ...p, max: e.target.value }))}
            className="w-full min-w-0 border border-zinc-300 rounded-md px-2.5 py-2 text-base sm:text-sm outline-none focus:border-black" />
          <button className="shrink-0 px-3 py-2 text-sm font-semibold bg-black text-white rounded-md hover:bg-zinc-800">OK</button>
        </form>
      </Group>

      {options.sizes.length > 0 && (
        <Group title="Tamanho">
          <div className="flex flex-wrap gap-2">
            {options.sizes.map((s) => (
              <button type="button" key={s} onClick={() => update({ size: f.size === s ? "" : s })} aria-pressed={f.size === s}
                className={`min-w-[42px] h-9 px-2.5 border text-sm rounded-sm transition-colors ${f.size === s ? "bg-black text-white border-black" : "border-zinc-300 hover:border-black bg-white"}`}>
                {s}
              </button>
            ))}
          </div>
        </Group>
      )}

      {options.colors.length > 0 && (
        <Group title="Cor">
          <div className="flex flex-wrap gap-2.5">
            {options.colors.map((c) => (
              <button type="button" key={c.name} onClick={() => update({ color: f.color === c.name ? "" : c.name })} aria-pressed={f.color === c.name}
                title={c.name} aria-label={c.name}
                className={`w-8 h-8 rounded-full border-2 p-0.5 ${f.color === c.name ? "border-black" : "border-transparent hover:border-zinc-300"}`}>
                <span className="block w-full h-full rounded-full border border-black/10" style={{ backgroundColor: c.hex }} />
              </button>
            ))}
          </div>
          {f.color && <p className="text-xs text-zinc-500 mt-2">Cor: <strong>{f.color}</strong></p>}
        </Group>
      )}

      <Group title="Disponibilidade">
        <Check checked={Boolean(f.inStock)} onChange={(v) => update({ inStock: v ? "1" : "" })}>Só produtos com stock</Check>
        <Check checked={Boolean(f.promo)} onChange={(v) => update({ promo: v ? "1" : "" })}>Só em promoção</Check>
      </Group>
    </div>
  );

  return (
    <>
      <TopHeader />
      <Header />
      <div className="mt-[110px] min-h-screen">
        <div className="container-site">
          <h1 className="text-xl sm:text-2xl font-bold pt-6 sm:pt-8 mb-4">{title}</h1>

          <form onSubmit={(e) => { e.preventDefault(); update({ search: query.trim() }); }} className="flex gap-2 mb-4 max-w-xl" role="search">
            <div className="relative flex-1 min-w-0">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm" aria-hidden="true" />
              <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Pesquisar produtos..." aria-label="Pesquisar produtos" maxLength={60}
                className="w-full border border-zinc-300 rounded-sm pl-9 pr-3 py-2.5 text-base sm:text-sm outline-none focus:border-black" />
            </div>
            <button className="px-4 bg-black text-white text-sm rounded-sm hover:bg-zinc-800">Pesquisar</button>
          </form>

          <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-10 items-start">
            {/* Filtros: barra lateral no computador */}
            <aside className="hidden lg:block sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2 pb-6" aria-label="Filtros">
              {filtersPanel}
            </aside>

            <div>
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setDrawer(true)} className="lg:hidden inline-flex items-center gap-2 px-3 py-2 border border-zinc-300 rounded-sm text-sm font-semibold bg-white">
                    <FaSlidersH aria-hidden="true" /> Filtros{active.length ? ` (${active.length})` : ""}
                  </button>
                  <p className="text-sm text-zinc-500">{loading ? "A carregar..." : `${total} ${total === 1 ? "produto" : "produtos"}`}</p>
                </div>
                <select value={sort} onChange={(e) => update({ sort: e.target.value === "newest" ? "" : e.target.value })} aria-label="Ordenar"
                  className="border border-zinc-300 bg-white px-2 py-2 text-sm rounded-sm outline-none focus:border-black">
                  {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>

              {active.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  {active.map((a) => (
                    <button key={[].concat(a.k).join()} type="button" onClick={() => removeFilter(a.k)}
                      className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1 text-xs font-semibold rounded-full bg-zinc-100 hover:bg-zinc-200" aria-label={`Tirar filtro ${a.label}`}>
                      {a.label} <FaTimes className="text-[10px] text-zinc-500" aria-hidden="true" />
                    </button>
                  ))}
                  <button type="button" onClick={clearAll} className="text-xs font-semibold text-red-800 hover:underline ml-1">Limpar tudo</button>
                </div>
              )}

              <ProductGrid
                className="lg:!grid-cols-3 xl:!grid-cols-4"
                products={products}
                loading={loading}
                error={error}
                skeletons={8}
                empty={active.length ? "Nenhum produto encontrado com estes filtros." : "Ainda não há produtos."}
              />
              {!loading && !error && products.length === 0 && active.length > 0 && (
                <p className="text-center -mt-4"><button type="button" onClick={clearAll} className="text-sm font-semibold text-red-800 hover:underline">Limpar os filtros</button></p>
              )}

              <div className="flex justify-center my-10 sm:my-16">
                {!loading && products.length < total && (
                  <button onClick={loadMore} disabled={loadingMore}
                    className="py-3 px-8 border-2 border-black text-sm font-semibold rounded-sm hover:bg-black hover:text-white disabled:opacity-50">
                    {loadingMore ? "A carregar..." : `Ver mais produtos (${total - products.length})`}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros: gaveta no telemóvel */}
      <div className={`lg:hidden fixed inset-0 z-[70] ${drawer ? "" : "pointer-events-none"}`} aria-hidden={!drawer}>
        <div className={`absolute inset-0 bg-black/40 transition-opacity ${drawer ? "opacity-100" : "opacity-0"}`} onClick={() => setDrawer(false)} />
        <div role="dialog" aria-modal="true" aria-label="Filtros"
          className={`absolute bottom-0 inset-x-0 max-h-[85vh] flex flex-col bg-white rounded-t-2xl transition-transform duration-300 ${drawer ? "translate-y-0" : "translate-y-full"}`}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200">
            <h2 className="font-bold">Filtros</h2>
            <button type="button" onClick={() => setDrawer(false)} aria-label="Fechar filtros" className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-zinc-100"><FaTimes /></button>
          </div>
          <div className="overflow-y-auto px-5 py-4 flex-1">{drawer && filtersPanel}</div>
          <div className="flex gap-3 px-5 py-4 border-t border-zinc-200">
            <button type="button" onClick={clearAll} className="flex-1 py-3 text-sm font-semibold border border-zinc-300 rounded-md">Limpar</button>
            <button type="button" onClick={() => setDrawer(false)} className="flex-[2] py-3 text-sm font-semibold bg-black text-white rounded-md">
              {loading ? "A carregar..." : `Ver ${total} ${total === 1 ? "produto" : "produtos"}`}
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};
export default Shop;

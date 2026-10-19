import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "../../assets/components/header/Header";
import TopHeader from "../../assets/components/topheader/TopHeader";
import Footer from "../../assets/components/footer/footer";
import { ProductGrid } from "../../assets/components/shopCard/ShopDataCard";
import { productAPI, apiError } from "../../services/api";
import { CATEGORIES, categoryLabel } from "../../utils/format";

const SORTS = [
  { value: "newest", label: "Mais recentes" },
  { value: "price_asc", label: "Preço: mais baixo" },
  { value: "price_desc", label: "Preço: mais alto" },
];
const PAGE_SIZE = 12;

const Shop = () => {
  const [params, setParams] = useSearchParams();
  const category = params.get("category") || "";
  const sort = params.get("sort") || "newest";
  const search = params.get("search") || "";

  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState(search);

  // Filtros mudaram: recomeça na página 1
  useEffect(() => {
    let cancel = false;
    setLoading(true);
    setError("");
    setPage(1);
    productAPI
      .getAll({ category: category || undefined, sort, search: search || undefined, page: 1, limit: PAGE_SIZE })
      .then(({ data }) => { if (!cancel) { setProducts(data.products); setTotal(data.total); } })
      .catch((err) => !cancel && setError(apiError(err)))
      .finally(() => !cancel && setLoading(false));
    return () => { cancel = true; };
  }, [category, sort, search]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const { data } = await productAPI.getAll({ category: category || undefined, sort, search: search || undefined, page: page + 1, limit: PAGE_SIZE });
      setProducts((prev) => [...prev, ...data.products]);
      setPage((p) => p + 1);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoadingMore(false);
    }
  };

  const update = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next);
  };

  const chip = (active) =>
    `shrink-0 px-4 py-2 text-xs sm:text-sm border rounded-full transition-colors ${
      active ? "bg-black text-white border-black" : "bg-white text-zinc-700 border-zinc-300 hover:border-black"
    }`;

  return (
    <>
      <TopHeader />
      <Header />
      <div className="mt-[110px] min-h-screen">
        <div className="container-site">
          <h1 className="text-xl sm:text-2xl font-bold mt-6 mb-4">
            {search ? `Resultados para "${search}"` : category ? categoryLabel(category) : "Todos os Produtos"}
          </h1>

          <form
            onSubmit={(e) => { e.preventDefault(); update("search", query.trim()); }}
            className="flex gap-2 mb-4 max-w-md"
            role="search"
          >
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pesquisar produtos..."
              aria-label="Pesquisar produtos"
              className="flex-1 min-w-0 border border-zinc-300 rounded-sm px-3 py-2 text-base sm:text-sm outline-none focus:border-black"
            />
            <button className="px-4 bg-black text-white text-sm rounded-sm hover:bg-zinc-800">Pesquisar</button>
          </form>

          <div className="flex gap-2 overflow-x-auto -mx-[4%] px-[4%] sm:mx-0 sm:px-0 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button onClick={() => update("category", "")} className={chip(!category)}>Todos</button>
            {CATEGORIES.map((c) => (
              <button key={c.value} onClick={() => update("category", c.value)} className={chip(category === c.value)}>
                {c.label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between gap-3 my-4">
            <p className="text-sm text-zinc-500">{loading ? "A carregar..." : `${total} ${total === 1 ? "produto" : "produtos"}`}</p>
            <select
              value={sort}
              onChange={(e) => update("sort", e.target.value)}
              aria-label="Ordenar"
              className="border border-zinc-300 bg-white px-2 py-2 text-sm rounded-sm outline-none focus:border-black"
            >
              {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          <ProductGrid
            products={products}
            loading={loading}
            error={error}
            skeletons={8}
            empty={search ? "Nenhum produto encontrado com essa pesquisa." : "Ainda não há produtos nesta categoria."}
          />

          <div className="flex justify-center my-10 sm:my-16">
            {!loading && products.length < total && (
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="py-3 px-8 border-2 border-black text-sm font-semibold rounded-sm hover:bg-black hover:text-white disabled:opacity-50"
              >
                {loadingMore ? "A carregar..." : "Ver mais produtos"}
              </button>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};
export default Shop;

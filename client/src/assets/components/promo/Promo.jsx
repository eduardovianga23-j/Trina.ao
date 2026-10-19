import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { productAPI, apiError } from "../../../services/api";
import { ProductGrid } from "../shopCard/ShopDataCard";

// Destaques da página inicial: produtos marcados como "destaque" no painel de admin
const Promo = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    productAPI
      .getFeatured()
      .then(({ data }) => setProducts(data.slice(0, 4)))
      .catch((err) => setError(apiError(err)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="h-full items-center flex bg-gray-100 flex-col justify-center">
      <section className="w-full h-10 sm:h-14 bg-red-800"></section>
      <section className="w-full flex flex-col items-center justify-center my-6 md:my-10">
        <ProductGrid className="container-site" products={products} loading={loading} error={error} />
        {!loading && !error && products.length > 0 && (
          <Link to="/shop" className="mt-6 md:mt-8 text-sm font-semibold underline underline-offset-4 hover:text-red-800">
            Ver todos os produtos
          </Link>
        )}
      </section>
    </div>
  );
};
export default Promo;

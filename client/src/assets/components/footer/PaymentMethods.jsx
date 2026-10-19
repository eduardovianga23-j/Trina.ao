import { SiVisa, SiPaypal, SiApplepay, SiGooglepay, SiKlarna } from "react-icons/si";
import { FaLock } from "react-icons/fa";
import { MastercardIcon } from "react-svg-credit-card-payment-icons";

/*
  Métodos de pagamento aceites na Europa.

  Logótipos oficiais próprios (MB WAY, Multibanco ou qualquer outro):
  coloca o ficheiro em  src/img/pagamentos/  com o nome indicado em "ficheiro"
  (por exemplo  mbway.svg  ou  multibanco.png ). Aparece sozinho, sem mexer no código.
  Enquanto o ficheiro não existir, mostra o nome do método.
  Logótipos oficiais: kit de comerciante da SIBS ou do teu fornecedor de pagamentos (ifthenpay, EuPago...).
*/
const imagensLocais = import.meta.glob("../../../img/pagamentos/*.{svg,png,webp,jpg}", { eager: true, import: "default" });
const imagem = (nome) => {
  const chave = Object.keys(imagensLocais).find((k) => k.split("/").pop().split(".")[0].toLowerCase() === nome);
  return chave ? imagensLocais[chave] : null;
};

const METODOS = [
  { nome: "Visa", ficheiro: "visa", render: () => <SiVisa size={34} color="#1A1F71" /> },
  { nome: "Mastercard", ficheiro: "mastercard", render: () => <MastercardIcon format="logo" width={44} /> },
  { nome: "PayPal", ficheiro: "paypal", render: () => <SiPaypal size={22} color="#003087" /> },
  { nome: "Apple Pay", ficheiro: "applepay", render: () => <SiApplepay size={38} color="#000" /> },
  { nome: "Google Pay", ficheiro: "googlepay", render: () => <SiGooglepay size={38} color="#3C4043" /> },
  { nome: "Klarna", ficheiro: "klarna", render: () => <SiKlarna size={18} color="#17120F" />, fundo: "#FFB3C7" },
  { nome: "MB WAY", ficheiro: "mbway" },
  { nome: "Multibanco", ficheiro: "multibanco", alturaImg: "h-10 sm:h-11" },
];

const PaymentMethods = () => (
  <div className="w-full py-8 md:py-10 text-center border-t border-zinc-400/40">
    <h2 className="flex items-center justify-center gap-2 font-bold text-sm mb-1">
      <FaLock className="text-red-800 text-xs" aria-hidden="true" />
      Pagamentos seguros
    </h2>
    <p className="text-xs text-zinc-600 mb-5">Paga como preferires</p>

    {/* Sempre em grelha: 4 + 4 no telemóvel e tablet, 8 numa linha a partir de 768px. Nunca fica um sozinho. */}
    <ul className="grid grid-cols-4 md:grid-cols-8 gap-2 sm:gap-3 max-w-md md:max-w-3xl mx-auto">
      {METODOS.map(({ nome, ficheiro, render, fundo, alturaImg }) => {
        const src = imagem(ficheiro);
        return (
          <li
            key={nome}
            title={nome}
            className="h-11 sm:h-12 flex items-center justify-center rounded-md border border-zinc-200 px-1.5
                       shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md"
            style={{ backgroundColor: src ? "#fff" : fundo || "#fff" }}
          >
            {src ? (
              <img src={src} alt={nome} className={`${alturaImg || "max-h-7"} max-w-full object-contain`} />
            ) : render ? (
              <>
                <span aria-hidden="true" className="flex items-center">{render()}</span>
                <span className="sr-only">{nome}</span>
              </>
            ) : (
              <span className="text-[11px] font-extrabold tracking-tight text-zinc-800 leading-none">{nome}</span>
            )}
          </li>
        );
      })}
    </ul>
  </div>
);

export default PaymentMethods;

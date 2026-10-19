import { SiVisa, SiMastercard, SiPaypal, SiApplepay, SiGooglepay, SiKlarna } from "react-icons/si";
import { FaLock } from "react-icons/fa";

/*
  Métodos de pagamento aceites na Europa.
  - Os logótipos vêm da biblioteca react-icons (Simple Icons), já instalada no projeto.
  - MB WAY e Multibanco não existem na biblioteca: aparecem com o nome.
    Para usar os logótipos oficiais, coloca os ficheiros em src/img/pagamentos/
    e troca o campo "texto" por: imagem: mbwayLogo (importado no topo do ficheiro).
*/
const METODOS = [
  { nome: "Visa", Icon: SiVisa, cor: "#1A1F71", tamanho: 34 },
  { nome: "Mastercard", Icon: SiMastercard, cor: "#EB001B", tamanho: 28 },
  { nome: "PayPal", Icon: SiPaypal, cor: "#003087", tamanho: 22 },
  { nome: "Apple Pay", Icon: SiApplepay, cor: "#000000", tamanho: 38 },
  { nome: "Google Pay", Icon: SiGooglepay, cor: "#3C4043", tamanho: 38 },
  { nome: "Klarna", Icon: SiKlarna, cor: "#17120F", tamanho: 18, fundo: "#FFB3C7" },
  { nome: "MB WAY", texto: true },
  { nome: "Multibanco", texto: true },
];

const PaymentMethods = () => (
  <div className="w-full py-8 md:py-10 text-center border-t border-zinc-400/40">
    <h2 className="flex items-center justify-center gap-2 font-bold text-sm mb-1">
      <FaLock className="text-red-800 text-xs" aria-hidden="true" />
      Pagamentos seguros
    </h2>
    <p className="text-xs text-zinc-600 mb-5">Paga como preferires</p>

    <ul className="grid grid-cols-4 sm:flex sm:flex-wrap sm:justify-center gap-2 sm:gap-3 max-w-md sm:max-w-none mx-auto">
      {METODOS.map(({ nome, Icon, cor, tamanho, fundo, texto }) => (
        <li
          key={nome}
          title={nome}
          className="h-11 sm:w-[76px] flex items-center justify-center rounded-md border border-zinc-200
                     shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md"
          style={{ backgroundColor: fundo || "#fff" }}
        >
          {texto ? (
            <span className="text-[11px] font-extrabold tracking-tight text-zinc-800 leading-none px-1">{nome}</span>
          ) : (
            <>
              <Icon size={tamanho} color={cor} aria-hidden="true" />
              <span className="sr-only">{nome}</span>
            </>
          )}
        </li>
      ))}
    </ul>
  </div>
);

export default PaymentMethods;

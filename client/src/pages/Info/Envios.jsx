import { Link } from 'react-router-dom';
import LegalLayout, { H2, V } from '../Legal/LegalLayout';
import { LOJA } from '../../config/loja';
import { formatEUR } from '../../utils/format';
import { useShipping } from '../../utils/orders';

/*
  /envios-devolucoes — explicação simples para clientes.
  Os prazos vêm de src/config/loja.js e os portes do servidor (SHIPPING_COST e FREE_SHIPPING_FROM no .env).
*/
const SECTIONS = [
  ['envios', 'Envios e prazos'],
  ['portes', 'Portes de envio'],
  ['acompanhar', 'Acompanhar a encomenda'],
  ['devolucoes', 'Devoluções (14 dias)'],
  ['trocas', 'Trocas de tamanho ou cor'],
  ['defeitos', 'Produto com defeito'],
  ['perguntas', 'Perguntas frequentes'],
];

const Step = ({ n, title, children }) => (
  <li className="flex gap-3 !ml-0 list-none">
    <span className="w-7 h-7 shrink-0 rounded-full bg-red-800 text-white text-sm font-bold flex items-center justify-center">{n}</span>
    <span><strong>{title}</strong><br />{children}</span>
  </li>
);

const Envios = () => {
  const shipping = useShipping();
  const portes = shipping?.cost == null ? null : shipping.cost === 0 ? 'Grátis' : formatEUR(shipping.cost);

  return (
    <LegalLayout
      eyebrow="Ajuda"
      showUpdated={false}
      title="Envios e Devoluções"
      intro="Tudo o que precisas de saber sobre a entrega das tuas encomendas, trocas e devoluções. Se ficar alguma dúvida, fala connosco."
      sections={SECTIONS}
    >
      <H2 id="envios">Envios e prazos</H2>
      <ul>
        <li>Enviamos para <strong>todo o Portugal</strong>: continente, Açores e Madeira.</li>
        <li>Prazo habitual: <strong><V>{LOJA.prazoEntrega}</V></strong>, e <V>{LOJA.prazoIlhas}</V>.</li>
        <li>Os prazos contam a partir da confirmação do pagamento. Se pagares por Multibanco, a encomenda só é preparada depois de o pagamento chegar.</li>
        <li>As encomendas são entregues pela <V>{LOJA.transportadora}</V> na morada que indicares.</li>
      </ul>

      <H2 id="portes">Portes de envio</H2>
      {shipping?.cost == null ? (
        <p>Os portes são calculados no carrinho, antes de pagares.</p>
      ) : (
        <ul>
          <li>
            <strong>Portugal continental:</strong> {portes}
            {shipping.cost > 0 && shipping.freeFrom > 0 && <> · <strong>grátis</strong> a partir de <strong>{formatEUR(shipping.freeFrom)}</strong></>}.
          </li>
          {shipping.islands && (
            <li>
              <strong>Açores e Madeira:</strong> {shipping.islands.cost === 0 ? 'Grátis' : formatEUR(shipping.islands.cost)}
              {shipping.islands.cost > 0 && shipping.islands.freeFrom > 0 && <> · <strong>grátis</strong> a partir de <strong>{formatEUR(shipping.islands.freeFrom)}</strong></>}.
            </li>
          )}
          <li>A zona é escolhida pelo código postal da morada (começados por 9 = ilhas). Vês sempre o valor certo no checkout, antes de pagar.</li>
        </ul>
      )}

      <H2 id="acompanhar">Acompanhar a encomenda</H2>
      <ol className="!pl-0 grid gap-3">
        <Step n="1" title="Pagamento confirmado">Recebes um email com o resumo da encomenda.</Step>
        <Step n="2" title="A caminho">Quando enviamos, recebes outro email com o número de seguimento.</Step>
        <Step n="3" title="Entregue">Quando chegar, confirma no site que a recebeste. Depois podes avaliar os produtos.</Step>
      </ol>
      <p>
        Podes ver o estado de todas as tuas encomendas em{' '}
        <Link to="/conta/encomendas">A minha conta → Encomendas</Link>.
      </p>

      <H2 id="devolucoes">Devoluções (14 dias)</H2>
      <p>
        Tens <strong>14 dias</strong> a contar do dia em que recebes a encomenda para a devolver, <strong>sem teres de explicar porquê</strong>.
      </p>
      <ol className="!pl-0 grid gap-3">
        <Step n="1" title="Avisa-nos">
          Preenche o <Link to="/contactos?assunto=devolucao">formulário de contacto</Link> (escolhe "Trocas e devoluções") ou escreve para{' '}
          <a href={`mailto:${LOJA.email}`}>{LOJA.email}</a>, com o número da encomenda (ex.: #177931).
        </Step>
        <Step n="2" title="Envia os produtos">
          Devolve as peças nos 14 dias seguintes, em bom estado, com as etiquetas e, se possível, na embalagem original.
        </Step>
        <Step n="3" title="Recebe o reembolso">
          Devolvemos o valor pago, incluindo os portes normais de envio, pelo mesmo meio de pagamento, no máximo em 14 dias.
        </Step>
      </ol>
      <ul>
        <li>Os portes da devolução são pagos por ti, exceto se o produto tiver defeito ou se tivermos enviado o produto errado.</li>
        <li>
          Por higiene, não aceitamos a devolução de <strong>roupa interior, fatos de banho, biquínis e brincos</strong> se o selo
          ou a proteção tiverem sido retirados.
        </li>
      </ul>

      <H2 id="trocas">Trocas de tamanho ou cor</H2>
      <p>
        O tamanho não serviu ou preferias outra cor? Dentro dos 14 dias, <Link to="/contactos?assunto=devolucao">fala connosco</Link> e
        trocamos, desde que o produto esteja em bom estado e haja stock. Se o tamanho que queres esgotou, devolvemos o dinheiro.
      </p>

      <H2 id="defeitos">Produto com defeito</H2>
      <p>
        Todos os produtos têm <strong>3 anos de garantia</strong>. Se algo chegar com defeito ou estragado, envia-nos uma foto pelo{' '}
        <Link to="/contactos?assunto=encomenda">formulário de contacto</Link>. Reparamos, trocamos ou devolvemos o dinheiro, e os portes ficam por nossa conta.
      </p>

      <H2 id="perguntas">Perguntas frequentes</H2>
      <div className="grid gap-2 not-prose">
        {[
          ['A encomenda está atrasada. O que faço?', 'Vê o número de seguimento no email "Está a caminho" ou em A minha conta. Se passarem mais de 2 dias úteis do prazo, fala connosco.'],
          ['Posso mudar a morada depois de pagar?', 'Sim, se a encomenda ainda não tiver sido enviada. Fala connosco o mais depressa possível.'],
          ['Não estava em casa quando o estafeta passou.', `A ${LOJA.transportadora} deixa um aviso e normalmente tenta de novo ou deixa a encomenda num ponto de recolha perto de ti.`],
          ['Quanto tempo demora o reembolso?', 'Até 14 dias depois de recebermos o teu aviso. Pode demorar mais uns dias a aparecer na conta, conforme o banco.'],
        ].map(([q, a]) => (
          <details key={q} className="group rounded-lg border border-zinc-200 px-4 py-3">
            <summary className="cursor-pointer font-semibold text-zinc-900 list-none flex justify-between gap-3">
              {q}<span className="text-zinc-400 group-open:rotate-45 transition-transform">+</span>
            </summary>
            <p className="mt-2 !mb-0">{a}</p>
          </details>
        ))}
      </div>
    </LegalLayout>
  );
};

export default Envios;

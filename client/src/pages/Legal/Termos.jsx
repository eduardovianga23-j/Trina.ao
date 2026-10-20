import { Link } from 'react-router-dom';
import LegalLayout, { H2, V } from './LegalLayout';
import { LOJA } from '../../config/loja';

/*
  Termos e Condições de venda online em Portugal.
  Base legal principal:
  - Decreto-Lei n.º 24/2014 (contratos à distância: informação, prazo de entrega, livre resolução de 14 dias)
  - Decreto-Lei n.º 84/2021 (garantia de conformidade de 3 anos)
  - Lei n.º 144/2015 (resolução alternativa de litígios) e Livro de Reclamações Eletrónico
  Ajusta prazos, portes e regras de trocas à realidade da loja.
*/
const SECTIONS = [
  ['identificacao', 'Quem somos'],
  ['conta', 'Conta de cliente'],
  ['produtos', 'Produtos e preços'],
  ['encomendas', 'Encomendas'],
  ['pagamento', 'Pagamento'],
  ['envios', 'Envios e entregas'],
  ['devolucoes', 'Direito de devolução (14 dias)'],
  ['trocas', 'Trocas'],
  ['garantia', 'Garantia'],
  ['reclamacoes', 'Reclamações e litígios'],
  ['lei', 'Lei aplicável'],
];

const Termos = () => (
  <LegalLayout
    title="Termos e Condições"
    intro={`Estes termos explicam as regras de compra na loja online ${LOJA.marca}. Ao fazeres uma encomenda, aceitas estes termos. Lê também a nossa Política de Privacidade.`}
    sections={SECTIONS}
  >
    <H2 id="identificacao">1. Quem somos</H2>
    <ul>
      <li><strong>Empresa:</strong> <V>{LOJA.empresa}</V></li>
      <li><strong>NIF:</strong> <V>{LOJA.nif}</V></li>
      <li><strong>Morada:</strong> <V>{LOJA.morada}</V></li>
      <li><strong>Email:</strong> <a href={`mailto:${LOJA.email}`}>{LOJA.email}</a> · <strong>Telefone:</strong> <V>{LOJA.telefone}</V></li>
    </ul>

    <H2 id="conta">2. Conta de cliente</H2>
    <p>
      Podes comprar sem conta (usamos o teu email para a confirmação, a fatura e o link da encomenda) ou criar conta com email e senha, ou com a tua conta Google. És responsável por manter a tua senha em segredo e
      por nos dares dados verdadeiros. Podemos suspender contas usadas de forma fraudulenta ou abusiva.
    </p>
    <p>
      Depois de confirmares que recebeste uma encomenda, podes avaliar os produtos com estrelas, um comentário e fotos.
      As avaliações são públicas (com o teu primeiro nome e a inicial do apelido) e têm de ser verdadeiras e respeitosas.
      Podemos remover avaliações ofensivas, falsas ou com fotos inadequadas.
    </p>

    <H2 id="produtos">3. Produtos e preços</H2>
    <ul>
      <li>Os preços estão em <strong>euros (€)</strong> e já incluem <strong>IVA</strong> à taxa em vigor.</li>
      <li>Os custos de envio não estão incluídos no preço do produto. São indicados antes de confirmares a encomenda.</li>
      <li>As fotografias são ilustrativas. As cores podem variar ligeiramente consoante o ecrã.</li>
      <li>Os preços e as promoções podem mudar a qualquer momento, mas aplica-se sempre o preço em vigor no momento da encomenda.</li>
      <li>Em caso de erro evidente no preço, contactamos-te antes de enviar, e podes cancelar sem custos.</li>
    </ul>

    <H2 id="encomendas">4. Encomendas</H2>
    <p>
      Antes de pagares, vês um resumo com os produtos, o preço total e os portes. A encomenda fica concluída quando o
      pagamento é confirmado, e podes acompanhar o seu estado em <Link to="/conta/encomendas">A minha conta → Encomendas</Link>.
      Se um produto ficar indisponível, avisamos-te e devolvemos o valor que já tenhas pago.
    </p>

    <H2 id="pagamento">5. Pagamento</H2>
    <p>
      Aceitamos MB WAY, Multibanco, cartão (Visa, Mastercard) e, quando disponíveis, Apple Pay, Google Pay e outros métodos
      indicados na página de pagamento. O pagamento é feito numa página segura da <strong>Stripe</strong>, e nós não temos
      acesso aos dados do teu cartão. Se escolheres Multibanco, a encomenda só é preparada depois de o pagamento chegar, e a
      referência tem um prazo para ser paga. A fatura é enviada por email.
    </p>

    <H2 id="envios">6. Envios e entregas</H2>
    <ul>
      <li>Prazo habitual: <strong><V>{LOJA.prazoEntrega}</V></strong>, a contar da confirmação do pagamento.</li>
      <li>Salvo indicação em contrário, a entrega é feita no prazo máximo de <strong>30 dias</strong>. Se não conseguirmos cumprir, podes cancelar e receber o reembolso.</li>
      <li>Ao receber, verifica a embalagem. Se estiver danificada, indica-o à transportadora e contacta-nos.</li>
    </ul>

    <H2 id="devolucoes">7. Direito de devolução (14 dias)</H2>
    <p>
      Tens <strong>14 dias</strong>, a contar do dia em que recebes a encomenda, para desistir da compra <strong>sem teres de
      dar qualquer justificação</strong>. Para isso:
    </p>
    <ol>
      <li>Envia-nos um email para <a href={`mailto:${LOJA.email}`}>{LOJA.email}</a> com o número da encomenda e a indicação de que queres devolver.</li>
      <li>Devolve os produtos no prazo de 14 dias após nos avisares, em bom estado e, se possível, na embalagem original.</li>
    </ol>
    <ul>
      <li>Reembolsamos o valor pago, incluindo os portes de envio normais, no prazo de <strong>14 dias</strong> após recebermos o teu aviso. Podemos aguardar a receção dos produtos antes de reembolsar.</li>
      <li>O reembolso é feito pelo mesmo meio de pagamento que usaste, salvo acordo em contrário.</li>
      <li>Os custos de devolução são suportados por ti, salvo indicação em contrário ou se o produto tiver defeito.</li>
      <li>Podes experimentar os produtos como farias numa loja, mas és responsável por uma eventual perda de valor causada por uso além do necessário para os experimentar.</li>
    </ul>
    <p>
      <strong>Exceções:</strong> por razões de higiene, não aceitamos a devolução de <strong>roupa interior, fatos de banho e
      biquínis</strong> nem de <strong>brincos</strong>, se o selo ou a proteção tiverem sido retirados depois da entrega. Também
      não aceitamos a devolução de produtos personalizados à tua medida.
    </p>

    <H2 id="trocas">8. Trocas</H2>
    <p>
      Se o tamanho ou a cor não forem os certos, podes pedir a troca dentro do prazo de 14 dias, desde que o produto esteja
      em bom estado e haja stock. Contacta-nos por email para combinarmos a troca.
    </p>

    <H2 id="garantia">9. Garantia</H2>
    <p>
      Todos os produtos têm a <strong>garantia legal de conformidade de 3 anos</strong> a contar da entrega. Se um produto tiver
      um defeito, contacta-nos: tens direito à reparação ou substituição e, em certos casos, à redução do preço ou à
      devolução do dinheiro. O desgaste normal resultante do uso e os danos causados por mau uso não são cobertos.
    </p>

    <H2 id="reclamacoes">10. Reclamações e litígios</H2>
    <p>
      Se não estiveres satisfeito, contacta-nos primeiro por email, e faremos o possível para resolver. Podes também
      apresentar reclamação no{' '}
      <a href="https://www.livroreclamacoes.pt" target="_blank" rel="noreferrer">Livro de Reclamações Eletrónico</a>.
    </p>
    <p>
      Em caso de litígio de consumo, podes recorrer a uma entidade de Resolução Alternativa de Litígios (RAL), como o{' '}
      <a href="https://www.cniacc.pt" target="_blank" rel="noreferrer">CNIACC — Centro Nacional de Informação e Arbitragem de Conflitos de Consumo</a>.
      A lista completa de entidades RAL está no{' '}
      <a href="https://www.consumidor.gov.pt" target="_blank" rel="noreferrer">Portal do Consumidor</a>.
    </p>

    <H2 id="lei">11. Lei aplicável</H2>
    <p>
      Estes termos regem-se pela lei portuguesa. Nada nestes termos limita os direitos que a lei te dá enquanto
      consumidor. Para mais informações sobre os teus dados, consulta a <Link to="/privacidade">Política de Privacidade</Link>.
    </p>
  </LegalLayout>
);

export default Termos;

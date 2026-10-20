import LegalLayout, { H2, V } from './LegalLayout';
import { LOJA } from '../../config/loja';

/*
  Política de Privacidade (RGPD — Regulamento (UE) 2016/679 e Lei n.º 58/2019).
  Descreve o que o site faz realmente: conta, login com Google, carrinho, encomendas e fotos.
  Se acrescentares ferramentas novas (ex.: Google Analytics, newsletter), atualiza esta página.
*/
const SECTIONS = [
  ['responsavel', 'Quem é responsável pelos teus dados'],
  ['dados', 'Que dados recolhemos'],
  ['finalidades', 'Para que usamos os dados'],
  ['partilha', 'Com quem partilhamos'],
  ['conservacao', 'Durante quanto tempo guardamos'],
  ['direitos', 'Os teus direitos'],
  ['seguranca', 'Segurança'],
  ['cookies', 'Cookies e armazenamento no navegador'],
  ['menores', 'Menores'],
  ['alteracoes', 'Alterações a esta política'],
];

const Privacidade = () => (
  <LegalLayout
    title="Política de Privacidade"
    intro={`Na ${LOJA.marca} levamos a tua privacidade a sério. Esta página explica, de forma simples, que dados pessoais recolhemos quando usas o nosso site, para quê, com quem os partilhamos e como podes controlá-los.`}
    sections={SECTIONS}
  >
    <H2 id="responsavel">1. Quem é responsável pelos teus dados</H2>
    <p>O responsável pelo tratamento dos dados é:</p>
    <ul>
      <li><strong>Empresa:</strong> <V>{LOJA.empresa}</V></li>
      <li><strong>NIF:</strong> <V>{LOJA.nif}</V></li>
      <li><strong>Morada:</strong> <V>{LOJA.morada}</V></li>
      <li><strong>Email:</strong> <a href={`mailto:${LOJA.email}`}>{LOJA.email}</a></li>
    </ul>
    <p>Para qualquer questão sobre os teus dados ou para exercer os teus direitos, escreve-nos para este email.</p>

    <H2 id="dados">2. Que dados recolhemos</H2>
    <ul>
      <li><strong>Conta:</strong> nome, email e senha. A senha é guardada cifrada, e nem nós a conseguimos ler.</li>
      <li><strong>Entrar com o Google:</strong> se escolheres esta opção, a Google partilha connosco o teu nome, email, foto de perfil e um identificador da tua conta Google. Não recebemos a tua senha do Google.</li>
      <li><strong>Encomendas:</strong> produtos comprados, tamanhos, cores, morada de entrega, contacto e dados de faturação (como o NIF, se o indicares).</li>
      <li><strong>Pagamentos:</strong> são processados pela Stripe (MB WAY, Multibanco, cartão e outros). <strong>Não guardamos os dados do teu cartão.</strong></li>
      <li><strong>No teu navegador:</strong> o conteúdo do carrinho e a sessão iniciada ficam guardados no teu próprio dispositivo (ver <a href="#cookies">cookies</a>).</li>
      <li><strong>Favoritos:</strong> os produtos que guardas com o coração, associados à tua conta.</li>
      <li><strong>Avaliações:</strong> a nota, o comentário e as fotos que publicares sobre um produto. Aparecem na página do produto com o teu primeiro nome e a inicial do apelido.</li>
      <li><strong>Comunicações:</strong> o que nos escreveres quando nos contactas.</li>
    </ul>

    <H2 id="finalidades">3. Para que usamos os dados</H2>
    <ul>
      <li><strong>Criar e gerir a tua conta e as tuas encomendas</strong>: preparar, enviar, faturar e dar apoio. Fundamento: execução do contrato contigo.</li>
      <li><strong>Cumprir obrigações legais</strong>: faturação e contabilidade. Fundamento: obrigação legal.</li>
      <li><strong>Manter o site seguro</strong> e evitar fraudes e abusos. Fundamento: interesse legítimo.</li>
      <li><strong>Enviar novidades e promoções</strong>, só se nos deres autorização, que podes retirar quando quiseres. Fundamento: consentimento.</li>
    </ul>
    <p>Não vendemos os teus dados, nem tomamos decisões automáticas que te afetem de forma significativa.</p>

    <H2 id="partilha">4. Com quem partilhamos</H2>
    <p>Só partilhamos os dados necessários com empresas que nos prestam serviços e que estão obrigadas a protegê-los:</p>
    <ul>
      <li><strong>Alojamento e base de dados</strong>: MongoDB Atlas, servidores na União Europeia.</li>
      <li><strong>Imagens do site</strong>: Cloudinary, quando utilizado.</li>
      <li><strong>Início de sessão</strong>: Google, se escolheres entrar com o Google.</li>
      <li><strong>Pagamentos</strong>: Stripe, que recebe o teu email e o valor da encomenda e trata os dados de pagamento (MB WAY, Multibanco, cartão...).</li>
      <li><strong>Faturação</strong>: InvoiceXpress, programa de faturação certificado pela Autoridade Tributária, que recebe o nome, o NIF (se o indicares), a morada e o email para emitir a fatura.</li>
      <li><strong>Envio de emails</strong>: Google (Gmail), para te enviarmos os emails sobre as tuas encomendas.</li>
      <li><strong>Entregas</strong>: a transportadora, que recebe o teu nome, a morada e o contacto.</li>
      <li><strong>Autoridades</strong>, quando a lei o exigir.</li>
    </ul>
    <p>
      Alguns destes fornecedores podem tratar dados fora do Espaço Económico Europeu. Nesse caso, a transferência é feita
      com as garantias previstas no RGPD, como as cláusulas contratuais-tipo aprovadas pela Comissão Europeia.
    </p>

    <H2 id="conservacao">5. Durante quanto tempo guardamos</H2>
    <ul>
      <li><strong>Conta:</strong> enquanto a mantiveres ativa. Podes pedir para a apagar a qualquer momento.</li>
      <li><strong>Encomendas e faturas:</strong> durante o prazo exigido pela lei fiscal (em regra, 10 anos).</li>
      <li><strong>Pedidos de contacto:</strong> o tempo necessário para te responder e resolver o assunto.</li>
    </ul>

    <H2 id="direitos">6. Os teus direitos</H2>
    <p>A qualquer momento podes pedir-nos para:</p>
    <ul>
      <li><strong>Aceder</strong> aos teus dados e receber uma cópia;</li>
      <li><strong>Corrigir</strong> dados errados ou incompletos;</li>
      <li><strong>Apagar</strong> os teus dados, exceto os que a lei nos obriga a guardar;</li>
      <li><strong>Limitar</strong> ou <strong>opor-te</strong> a certos usos;</li>
      <li><strong>Receber</strong> os teus dados num formato que possas levar para outro serviço (portabilidade);</li>
      <li><strong>Retirar o consentimento</strong> que nos tenhas dado, como para receber novidades.</li>
    </ul>
    <p>
      Envia o pedido para <a href={`mailto:${LOJA.email}`}>{LOJA.email}</a>. Respondemos no prazo máximo de um mês.
      Se achares que os teus direitos não foram respeitados, podes apresentar queixa à{' '}
      <a href="https://www.cnpd.pt" target="_blank" rel="noreferrer">Comissão Nacional de Proteção de Dados (CNPD)</a>.
    </p>
    <p>
      Se entraste com o Google, também podes retirar o acesso da {LOJA.marca} à tua conta Google em{' '}
      <a href="https://myaccount.google.com/connections" target="_blank" rel="noreferrer">myaccount.google.com/connections</a>.
    </p>

    <H2 id="seguranca">7. Segurança</H2>
    <p>
      Usamos ligações cifradas (https), as senhas são guardadas cifradas, e o acesso aos dados está limitado às pessoas da
      equipa que precisam dele para o seu trabalho. Nenhum sistema é 100% seguro, mas fazemos o possível para proteger a tua informação.
    </p>

    <H2 id="cookies">8. Cookies e armazenamento no navegador</H2>
    <p>O site guarda no teu navegador apenas o que é <strong>necessário para funcionar</strong>:</p>
    <ul>
      <li><strong>Carrinho</strong>: os produtos que adicionaste, para não se perderem ao recarregar a página.</li>
      <li><strong>Sessão</strong>: para te manteres com a sessão iniciada.</li>
      <li><strong>Favoritos</strong>: se ainda não entraste na conta, os produtos que marcaste com o coração. Quando entras, passam para a tua conta.</li>
    </ul>
    <p>
      Nas páginas de início de sessão e de registo, o botão "Continuar com o Google" é fornecido pela Google, que pode
      usar os seus próprios cookies para esse fim. Consulta a{' '}
      <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">Política de Privacidade da Google</a>.
    </p>
    <p>
      Neste momento não usamos cookies de publicidade nem de estatísticas. Se isso mudar, pediremos primeiro a tua
      autorização. Podes apagar estes dados a qualquer momento nas definições do teu navegador.
    </p>

    <H2 id="menores">9. Menores</H2>
    <p>
      Para criar conta é preciso ter pelo menos 13 anos. Abaixo dessa idade, é necessária a autorização dos pais ou do
      representante legal.
    </p>

    <H2 id="alteracoes">10. Alterações a esta política</H2>
    <p>
      Podemos atualizar esta política, por exemplo quando acrescentarmos novos serviços. A data da última atualização está
      no topo da página. Se as alterações forem importantes, avisamos no site ou por email.
    </p>
  </LegalLayout>
);

export default Privacidade;

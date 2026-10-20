# Pôr a loja Trina online — guia passo a passo

Este guia explica como publicar o site. O mesmo servidor mostra o site **e** a API, por isso só precisas de **um** alojamento.
Faz os passos por ordem. No fim há uma lista de verificação.

> ⏱️ Tempo estimado: 2 a 3 horas na primeira vez (a maior parte é criar contas e esperar por confirmações).

---

## 0. Antes de começar

- [ ] Preenche os dados da empresa em `client/src/config/loja.js` (nome, NIF, morada, telefone, email, redes sociais, texto "Sobre nós").
      Os campos que ainda começam por `[` aparecem destacados a amarelo nas páginas legais.
- [ ] Revê a **Política de Privacidade** e os **Termos** (de preferência com um jurista ou o teu contabilista).
- [ ] Faz o merge de todos os pull requests e confirma que tudo funciona no teu PC.

---

## 1. Base de dados (MongoDB Atlas)

Usa a mesma conta do Atlas que já tens, mas **uma base de dados separada** para a loja a sério (assim as encomendas de teste não aparecem):

1. Em **Database Access**, cria um utilizador novo só para a loja (ex.: `trina-loja`) com uma senha forte. **Guarda a senha.**
2. Em **Network Access → Add IP Address**, escolhe **Allow access from anywhere** (`0.0.0.0/0`). O alojamento muda de IP e precisa disto. A senha forte protege a base de dados.
3. Em **Connect → Drivers**, copia o endereço e muda o nome da base de dados no fim para `trina_loja`:
   ```
   mongodb+srv://trina-loja:A_SENHA@o-teu-cluster.mongodb.net/trina_loja?retryWrites=true&w=majority
   ```
   Este é o teu `MONGO_URI` de produção.

---

## 2. Fotos (Cloudinary)

No alojamento, as fotos guardadas no disco **perdem-se** a cada atualização. Por isso usamos o Cloudinary (tem plano grátis):

1. Cria conta em https://cloudinary.com
2. No painel (**Dashboard**), copia o **API environment variable** (começa por `cloudinary://`).
   Este é o teu `CLOUDINARY_URL`.

> As fotos que carregaste no teu PC ficam no teu PC. Depois de pôr online, volta a carregar as fotos dos produtos no painel.

---

## 3. Alojamento (Render)

Recomendo o **Render** (https://render.com): liga-se ao GitHub e atualiza o site sozinho sempre que fazes merge.

> 💶 O plano grátis "adormece" o site quando ninguém o visita (a primeira visita demora ~1 minuto). Para uma loja, usa o plano pago mais barato (**Starter**, cerca de 7 $/mês), que está sempre ligado.

1. Cria conta no Render com o teu GitHub.
2. **New → Web Service** → escolhe o repositório **Trina.ao**.
3. Preenche:
   | Campo | Valor |
   |---|---|
   | Root Directory | *(deixa vazio)* |
   | Runtime | Node |
   | Build Command | `npm run build` |
   | Start Command | `npm start` |
   | Health Check Path | `/api/health` |
4. Em **Environment**, junta as variáveis (ver a tabela no passo 9). No mínimo:
   `NODE_ENV=production`, `NODE_VERSION=22`, `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`, `CLOUDINARY_URL`.
5. Carrega em **Create Web Service** e espera pelo primeiro "Live". O Render dá-te um endereço tipo `https://trina.onrender.com`.

> 🔑 Gera um `JWT_SECRET` **novo** para a produção (não uses o do teu PC):
> ```
> node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
> ```

---

## 4. Domínio (ex.: trina.pt)

1. Compra o domínio (para `.pt`: num registador como a PTisp, Amen ou Dominios.pt).
2. No Render: **Settings → Custom Domains → Add** e escreve `trina.pt` e `www.trina.pt`.
3. O Render mostra os registos DNS a criar. Cria-os no painel do registador. Pode demorar até 24 horas.
4. O certificado de segurança (https 🔒) é criado sozinho.
5. Muda a variável `CLIENT_URL` para `https://trina.pt` e atualiza `site` em `client/src/config/loja.js`.

---

## 5. Entrar com o Google

Em https://console.cloud.google.com/apis/credentials, abre o teu **ID do cliente OAuth**:

1. Em **Origens JavaScript autorizadas**, junta `https://trina.pt` (e `https://www.trina.pt` e o endereço do Render, se quiseres).
2. Em **Ecrã de consentimento OAuth**, carrega em **Publicar app** para qualquer pessoa poder entrar (enquanto está em "Teste", só os emails da lista conseguem).
3. Põe `GOOGLE_CLIENT_ID` nas variáveis do Render.

---

## 6. Pagamentos reais (Stripe)

1. No Stripe, **ativa a conta** (dados da empresa, NIF, IBAN para receberes o dinheiro).
2. Desliga o **modo de teste** e copia a **chave secreta real** (começa por `sk_live_`) → `STRIPE_SECRET_KEY`.
3. Em **Definições → Métodos de pagamento** (modo real), ativa **MB WAY** e **Multibanco**.
4. **Webhook:** em **Programadores → Webhooks → Adicionar endpoint**:
   - URL: `https://trina.pt/api/payments/webhook`
   - Eventos: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`
   - Copia o **segredo de assinatura** (começa por `whsec_`) → `STRIPE_WEBHOOK_SECRET`.
5. Em **Definições → Emails ao cliente**, liga os **recibos de pagamentos bem-sucedidos**.

---

## 7. Emails e faturas

- **Emails:** põe `SMTP_USER`, `SMTP_PASS` (palavra-passe de app do Gmail) e `STORE_EMAIL`. Mais tarde podes usar um email com o teu domínio (ex.: `info@trina.pt`).
- **Faturas:** põe `INVOICEXPRESS_ACCOUNT` e `INVOICEXPRESS_API_KEY`. Com a chave `sk_live_` do Stripe, cada encomenda paga passa a emitir fatura-recibo sozinha.

---

## 8. Criar o administrador na loja a sério

A base de dados `trina_loja` começa vazia. No teu PC, na pasta `server`, no PowerShell:

```powershell
$env:MONGO_URI="mongodb+srv://trina-loja:A_SENHA@o-teu-cluster.mongodb.net/trina_loja?retryWrites=true&w=majority"
npm run create-admin
```

Fecha o terminal no fim (para o PC voltar a usar a base de dados de testes).
Depois entra no site com essa conta, abre **/admin** e cria os produtos (com as fotos).

---

## 9. Todas as variáveis (Render → Environment)

| Variável | Obrigatória | Para quê |
|---|---|---|
| `NODE_ENV` | ✅ | `production` |
| `NODE_VERSION` | ✅ | `22` |
| `MONGO_URI` | ✅ | Base de dados (passo 1) |
| `JWT_SECRET` | ✅ | Sessões (gera um novo) |
| `CLIENT_URL` | ✅ | `https://trina.pt` (links dos emails e pagamentos) |
| `CLOUDINARY_URL` | ✅ | Fotos (passo 2) |
| `GOOGLE_CLIENT_ID` | recomendado | Entrar com o Google (passo 5) |
| `STRIPE_SECRET_KEY` | ✅ para vender | Pagamentos (passo 6) |
| `STRIPE_WEBHOOK_SECRET` | ✅ para vender | Confirma pagamentos Multibanco (passo 6) |
| `SMTP_USER` / `SMTP_PASS` | recomendado | Emails automáticos |
| `STORE_EMAIL` | opcional | Quem recebe os avisos de encomendas novas |
| `INVOICEXPRESS_ACCOUNT` / `INVOICEXPRESS_API_KEY` | obrigatório por lei para vender | Faturas certificadas |
| `INVOICE_VAT_RATE` | opcional | Taxa de IVA (23 por defeito) |
| `SHIPPING_COST` / `FREE_SHIPPING_FROM` | opcional | Portes |

> 🔒 Estas chaves são secretas. Nunca as escrevas no código nem as mostres em prints.

---

## 10. Lista de verificação final

- [ ] `https://trina.pt` abre com o cadeado 🔒
- [ ] `https://trina.pt/api/health` mostra `"ok": true`
- [ ] Criar conta, entrar com email e com o Google, recuperar a senha (o email chega?)
- [ ] Produtos com fotos, stock e preços certos
- [ ] Compra real pequena com cartão → email de confirmação, aviso na loja, **fatura emitida**
- [ ] Compra com MB WAY e com Multibanco (paga a referência e confirma que passa a "Pago")
- [ ] Reembolsa as compras de teste no Stripe (e faz as notas de crédito no InvoiceXpress)
- [ ] Páginas legais sem campos amarelos por preencher

Depois disto, cada merge no GitHub atualiza o site sozinho em poucos minutos. 🎉

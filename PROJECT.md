# Ecommerce Template — Documentazione Tecnica Completa

## Stack Tecnologico

| Layer | Tecnologia |
|-------|-----------|
| Frontend | React 18, Vite 5, Tailwind CSS v3, Framer Motion |
| State Management | Zustand (persistito in localStorage) |
| HTTP Client | Axios (con interceptor JWT) |
| i18n | i18next (IT + EN) |
| Backend | Node.js + Express.js |
| ORM | Sequelize + mysql2 |
| Database | MySQL 8.0 |
| Auth | JWT (7 giorni) + bcryptjs (salt 12) |
| Pagamenti | Stripe PaymentIntents + PayPal REST |
| Email | Nodemailer (SMTP) |
| Upload immagini | Multer + Sharp → WebP |
| Toast | react-hot-toast |

---

## Struttura Directory

```
ecommerce-template/
├── .env                        # Variabili d'ambiente (da .env.example)
├── .env.example
├── database/
│   ├── schema.sql              # Schema MySQL completo (16 tabelle)
│   └── seed.sql                # 50 prodotti + utenti + dati sample
├── backend/
│   ├── server.js               # Entry point Express
│   ├── config/
│   │   ├── database.js         # Sequelize + auto-create DB
│   │   ├── email.js            # Nodemailer + template email
│   │   └── stripe.js           # Istanza Stripe
│   ├── middleware/
│   │   ├── auth.js             # JWT guards
│   │   └── errorHandler.js     # Error middleware globale
│   ├── routes/
│   │   ├── auth.js             # Register / Login / Reset / Verify
│   │   ├── products.js         # Catalogo prodotti
│   │   ├── categories.js       # Categorie
│   │   ├── orders.js           # Ordini utente
│   │   ├── payments.js         # Stripe + PayPal
│   │   ├── cart.js             # Carrello server-side
│   │   ├── wishlist.js         # Lista desideri
│   │   ├── reviews.js          # Recensioni prodotto
│   │   ├── coupons.js          # Validazione coupon
│   │   ├── users.js            # Profilo + indirizzi
│   │   ├── shipping.js         # Metodi di spedizione
│   │   ├── inventory.js        # Stock magazzino
│   │   ├── contact.js          # Form contatto
│   │   ├── newsletter.js       # Iscrizione newsletter
│   │   └── admin.js            # Admin CRUD completo
│   ├── uploads/
│   │   └── products/           # Immagini caricate (WebP)
│   └── scripts/
│       └── setup.js            # Auto-setup DB + seed
└── frontend/
    ├── index.html              # Entry HTML + Google Fonts
    ├── vite.config.js
    ├── tailwind.config.js      # Brand colors + font + animazioni
    ├── postcss.config.js
    └── src/
        ├── main.jsx            # ReactDOM + BrowserRouter + i18n
        ├── App.jsx             # Routes + layout
        ├── index.css           # Design tokens + component classes
        ├── i18n/
        │   └── i18n.js         # Traduzioni IT/EN
        ├── store/
        │   └── useStore.js     # Zustand stores
        ├── utils/
        │   ├── api.js          # Axios instance
        │   ├── animations.js   # Framer Motion variants
        │   └── formatters.js   # Prezzo, data, stock
        ├── components/
        │   ├── Header.jsx
        │   ├── Footer.jsx
        │   ├── ProductCard.jsx
        │   ├── Cart/
        │   │   └── CartSidebar.jsx
        │   └── UI/
        │       └── PageLoader.jsx
        └── pages/
            ├── Home.jsx
            ├── Catalog.jsx
            ├── ProductDetail.jsx
            ├── Cart.jsx
            ├── Checkout.jsx
            ├── Profile.jsx
            ├── OrderSuccess.jsx
            ├── NotFound.jsx
            ├── Auth/
            │   ├── Login.jsx
            │   ├── Register.jsx
            │   ├── ForgotPassword.jsx
            │   ├── ResetPassword.jsx
            │   └── VerifyEmail.jsx
            ├── Info/
            │   ├── About.jsx
            │   ├── Contact.jsx
            │   ├── FAQ.jsx
            │   ├── Privacy.jsx
            │   ├── Terms.jsx
            │   └── Shipping.jsx
            └── Admin/
                └── AdminDashboard.jsx
```

---

## Database Schema (16 tabelle)

### `users`
| Campo | Tipo | Note |
|-------|------|------|
| id | INT PK | |
| email | VARCHAR(255) UNIQUE | |
| password | VARCHAR(255) | bcrypt hash |
| first_name, last_name | VARCHAR(100) | |
| phone | VARCHAR(20) | |
| avatar_url | VARCHAR(500) | |
| role | ENUM | `customer` / `admin` / `moderator` |
| is_active | BOOLEAN | soft disable |
| is_verified | BOOLEAN | verifica email |
| email_verify_token | VARCHAR(255) | UUID |
| reset_password_token | VARCHAR(255) | UUID, 1h scadenza |
| last_login | TIMESTAMP | |

### `products`
| Campo | Tipo | Note |
|-------|------|------|
| id | INT PK | |
| name / name_en | VARCHAR(255) | bilingue |
| slug | VARCHAR(300) UNIQUE | URL-friendly |
| description / description_en | LONGTEXT | bilingue |
| short_description / short_description_en | TEXT | |
| price | DECIMAL(10,2) | |
| compare_price | DECIMAL(10,2) | prezzo barrato |
| cost_price | DECIMAL(10,2) | margine admin |
| sku | VARCHAR(100) UNIQUE | |
| category_id | INT FK | |
| image_url | VARCHAR(500) | |
| gallery_images | JSON | array URL |
| tags | JSON | array string |
| is_featured / is_active / is_digital | BOOLEAN | |
| weight | DECIMAL(10,3) | |
| dimensions | JSON | `{l,w,h}` |
| total_sold | INT | denormalizzato |
| avg_rating | DECIMAL(3,2) | denormalizzato |
| review_count | INT | denormalizzato |
| FULLTEXT | name, description | ricerca full-text |

### `product_variants`
Varianti (taglia, colore, ecc.) con `price_adjustment` e `sku` proprio.

### `inventory`
Stock per `(product_id, variant_id, warehouse_id)`. Campi `quantity` e `reserved` per gestire prenotazioni.

### `warehouses`
Magazzini con indirizzo e contatti.

### `orders`
| Campo chiave | Note |
|-------------|------|
| order_number | VARCHAR UNIQUE (es. `ORD-20240101-XXXX`) |
| status | `pending → processing → shipped → delivered / cancelled / refunded` |
| payment_status | `pending / paid / failed / refunded` |
| stripe_payment_intent_id | riferimento Stripe |
| paypal_order_id | riferimento PayPal |
| shipping_address / billing_address | JSON snapshot |
| coupon_id / coupon_code | sconto applicato |
| tracking_number / tracking_url | spedizione |

### `order_items`
Snapshot prodotto al momento dell'acquisto in `product_snapshot` (JSON).

### `coupons`
Sconti `percentage` o `fixed`, con `minimum_order`, `maximum_discount`, `max_uses`, `max_uses_per_user`, `valid_until`.

### `reviews`
Una recensione per `(product_id, user_id)`. Flag `is_verified` (acquisto verificato) e `is_approved`.

### `user_addresses`
Indirizzi multipli per utente con flag `is_default`.

### `wishlist`
`UNIQUE (user_id, product_id)`.

### `shipping_methods`
Prezzo fisso con soglia `free_above` e range giorni stimati.

### `newsletter_subscribers`, `contact_messages`, `settings`
Tabelle di supporto per newsletter, messaggi contatto, configurazioni key/value.

---

## Backend — API Routes

**Base URL:** `http://localhost:5000/api`

### Auth (`/api/auth`)
| Method | Endpoint | Auth | Descrizione |
|--------|----------|------|-------------|
| POST | `/register` | — | Registrazione + email verifica |
| POST | `/login` | — | Login → JWT 7d |
| GET | `/me` | JWT | Utente corrente |
| POST | `/forgot-password` | — | Invia email reset |
| POST | `/reset-password` | — | Reset con token (1h) |
| GET | `/verify-email?token=` | — | Verifica email |

**Validazione register:** email valida, password min 8 chars + uppercase + lowercase + digit, first/last name non vuoti.

### Products (`/api/products`)
- `GET /` — lista paginata con filtri (categoria, prezzo, tag, featured, ricerca full-text)
- `GET /:slug` — dettaglio prodotto con varianti e recensioni

### Categories (`/api/categories`)
- `GET /` — albero categorie

### Orders (`/api/orders`)
- `GET /` — ordini dell'utente autenticato
- `POST /` — crea ordine (richiede JWT)
- `GET /:id` — dettaglio ordine

### Payments (`/api/payments`)
- `POST /stripe/create-intent` — crea PaymentIntent Stripe
- `POST /stripe/webhook` — webhook Stripe (firma verificata)
- `POST /paypal/create-order` — crea ordine PayPal
- `POST /paypal/capture/:orderId` — cattura pagamento PayPal

### Cart (`/api/cart`)
Carrello server-side per utenti autenticati (sync con store locale).

### Wishlist (`/api/wishlist`)
- `GET /` — lista desideri utente
- `POST /:productId` — aggiungi/rimuovi toggle

### Reviews (`/api/reviews`)
- `GET /product/:id` — recensioni prodotto
- `POST /` — crea recensione (JWT)
- `DELETE /:id` — elimina propria recensione

### Coupons (`/api/coupons`)
- `POST /validate` — verifica coupon (codice + importo ordine)

### Users (`/api/users`)
- `GET /profile` — profilo utente
- `PUT /profile` — aggiorna profilo
- `GET /addresses` — lista indirizzi
- `POST /addresses` — aggiungi indirizzo
- `PUT /addresses/:id` — aggiorna indirizzo
- `DELETE /addresses/:id` — elimina indirizzo

### Shipping (`/api/shipping`)
- `GET /methods` — metodi disponibili con calcolo gratuità

### Inventory (`/api/inventory`)
- `GET /product/:id` — stock prodotto

### Contact (`/api/contact`)
- `POST /` — invia messaggio contatto (email notifica admin)

### Newsletter (`/api/newsletter`)
- `POST /subscribe` — iscrizione
- `POST /unsubscribe` — disiscrizione

### Admin (`/api/admin`) — richiede `admin` o `moderator`
| Endpoint | Descrizione |
|----------|-------------|
| `GET /dashboard` | KPI: revenue oggi/mese/anno, ordini, utenti, prodotti low-stock, grafico 12 mesi, top prodotti |
| `GET/POST /products` | Lista + crea prodotto (upload immagine → WebP via Sharp) |
| `GET/PUT/DELETE /products/:id` | CRUD prodotto |
| `GET/POST /categories` | CRUD categorie |
| `GET /orders` | Lista ordini con filtri |
| `PUT /orders/:id` | Aggiorna status/tracking ordine |
| `GET /users` | Lista utenti |
| `PUT /users/:id` | Aggiorna utente (ruolo, stato) |
| `GET/POST /coupons` | CRUD coupon |
| `GET/POST /shipping` | CRUD metodi spedizione |
| `GET /inventory` | Vista stock magazzino |
| `PUT /inventory/:id` | Aggiorna quantità |
| `GET /contact-messages` | Messaggi contatto |
| `PUT /contact-messages/:id/read` | Segna letto |
| `GET /newsletter` | Lista iscritti |
| `GET /settings` | Impostazioni store |
| `PUT /settings` | Aggiorna impostazioni |

---

## Frontend — State Management (Zustand)

### `useCartStore` (persistito)
```js
{
  items: [],          // { id, product_id, variant_id, product_name, price, quantity, stock, ... }
  isOpen: false,
  addItem(product, variant, quantity),
  removeItem(itemId),
  updateQuantity(itemId, quantity),
  clearCart(),
  setOpen(bool),
  get subtotal(),     // computed
  get totalItems()    // computed
}
```
Chiave localStorage: `ecommerce-cart`.

### `useAuthStore` (persistito)
```js
{
  user: null,
  token: null,
  isAuthenticated: false,
  login(user, token),
  logout(),
  updateUser(userData),
  isAdmin()           // role admin | moderator
}
```
Chiave localStorage: `ecommerce-auth`. Duplica token anche in `localStorage['token']` per Axios.

### `useWishlistStore` (persistito)
```js
{ ids: [], toggle(id), has(id) }
```

### `useUIStore` (non persistito)
```js
{ searchOpen, mobileMenuOpen, setSearchOpen, setMobileMenuOpen, addToWishlistLocal, removeFromWishlistLocal }
```

---

## Frontend — Routing

Route doppie IT/EN per ogni pagina principale:

| Path IT | Path EN | Componente |
|---------|---------|-----------|
| `/` | — | `Home` |
| `/catalogo` | `/catalog` | `Catalog` |
| `/prodotti/:slug` | `/products/:slug` | `ProductDetail` |
| `/carrello` | `/cart` | `Cart` |
| `/checkout` | — | `Checkout` (ProtectedRoute) |
| `/ordine-confermato/:id` | `/order-success/:id` | `OrderSuccess` (ProtectedRoute) |
| `/profilo/*` | `/profile/*` | `Profile` (ProtectedRoute) |
| `/auth/login` | — | `Login` (PublicOnly) |
| `/auth/register` | — | `Register` (PublicOnly) |
| `/auth/forgot-password` | — | `ForgotPassword` (PublicOnly) |
| `/auth/reset-password` | — | `ResetPassword` |
| `/auth/verify-email` | — | `VerifyEmail` |
| `/chi-siamo` | `/about` | `About` |
| `/contatti` | `/contact` | `Contact` |
| `/faq` | — | `FAQ` |
| `/privacy` | — | `Privacy` |
| `/termini` | `/terms` | `Terms` |
| `/spedizioni` | `/shipping` | `Shipping` |
| `/admin/*` | — | `AdminDashboard` (AdminRoute) |

**Guards:**
- `ProtectedRoute` — redirect `/auth/login` se non autenticato
- `AdminRoute` — redirect `/` se ruolo non è `admin`/`moderator`
- `PublicOnly` — redirect `/profile` se già autenticato

**Layout:**
- `MainLayout` — Header + main + Footer + CartSidebar
- `AdminLayout` — solo `bg-gray-50`, niente header/footer pubblico

Lazy loading su tutti i componenti page con `React.lazy` + `Suspense` → `PageLoader`.

---

## Frontend — HTTP Client (Axios)

```js
baseURL: VITE_API_URL || '/api'
timeout: 15000ms
```

**Request interceptor:** inietta `Authorization: Bearer <token>` da localStorage.

**Response interceptor:**
- Successo → ritorna `response.data` direttamente
- 401 → cancella token + redirect `/auth/login`
- Errore → rigetta `response.data` o `{ message: 'Errore di rete' }`

---

## Auth Flow

```
Register → bcrypt(pwd, 12) → INSERT user → sendEmail(verifyToken) → JWT 7d
Login → bcrypt.compare → UPDATE last_login → JWT 7d
ForgotPassword → UUID token → UPDATE reset_token (scade 1h) → sendEmail
ResetPassword → verifica token + scadenza → bcrypt nuovo pwd → NULL token
VerifyEmail → verifica token → SET is_verified=1
```

**JWT payload:** `{ id, role }`

**Middleware chain:** `authenticate` → verifica JWT → query DB utente → `req.user`

---

## Pagamenti

### Stripe
1. Frontend richiede `POST /api/payments/stripe/create-intent` con importo
2. Backend crea `PaymentIntent` → ritorna `client_secret`
3. Frontend completa con Stripe.js
4. Webhook `payment_intent.succeeded` → aggiorna `payment_status = 'paid'`

### PayPal
1. Frontend richiede `POST /api/payments/paypal/create-order`
2. Backend crea ordine PayPal → ritorna `order_id`
3. Frontend mostra PayPal button
4. `POST /api/payments/paypal/capture/:orderId` → cattura e aggiorna ordine

---

## Upload Immagini (Admin)

- Multer: `diskStorage` → `backend/uploads/products/`
- Filtro MIME: solo `image/*`
- Limite: 5MB
- Sharp processa → WebP ottimizzato
- Serviti come statici da Express: `GET /uploads/products/:filename`

---

## Design System

### Colori (tailwind.config.js)
| Token | Valore default | Uso |
|-------|---------------|-----|
| `brand.DEFAULT` | `#D8125B` | CTA, accenti primari |
| `brand.50–900` | scala rosa-rosso | varianti brand |
| `dark.DEFAULT` | `#2C2E39` | testo principale |
| `dark.50–900` | scala grigio-blu scuro | UI dark |

### Variabili CSS (index.css)
```css
--color-brand: #D8125B
--color-dark: #2C2E39
--border: rgba(0,0,0,0.08)
--shadow-sm / --shadow-md / --shadow-lg
--transition: 200ms ease
--radius / --radius-lg / --radius-xl
```

### Component Classes (`@layer components`)
- `.btn` — base button (min-height 44px, transition)
- `.btn-primary` — brand fill
- `.btn-outline` — border brand
- `.btn-ghost` — trasparente, hover bg dark 8% opacity
- `.btn-sm / .btn-lg / .btn-icon` — size variants
- `.card` — white, border, shadow, hover lift
- `.input` — form input standardizzato
- `.badge` — pill colorato

---

## Variabili d'Ambiente (.env)

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=ecommerce_template

# Server
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# JWT
JWT_SECRET=<stringa casuale 64 chars>
JWT_EXPIRE=7d

# Stripe [CUSTOMIZE]
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# PayPal [CUSTOMIZE]
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...

# Email SMTP [CUSTOMIZE]
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your_app_password
SMTP_FROM="Store Name <your@email.com>"
```

Frontend (`frontend/.env`):
```env
VITE_API_URL=http://localhost:5000/api
VITE_STRIPE_PUBLIC_KEY=pk_test_...
VITE_PAYPAL_CLIENT_ID=...
```

---

## Setup & Avvio

```bash
# 1. Copia env
cp .env.example .env
# Edita .env con credenziali DB, Stripe, PayPal, SMTP

# 2. Backend deps + DB setup
cd backend
npm install
node scripts/setup.js    # crea DB, schema, seed (50 prodotti + admin)

# 3. Avvia backend
npm run dev              # http://localhost:5000

# 4. Frontend
cd ../frontend
npm install
npm run dev              # http://localhost:3000
```

### Credenziali admin (seed)
```
Email:    admin@example.com
Password: Admin@123456
```

---

## Checklist Personalizzazione `[CUSTOMIZE]`

- [ ] Brand name / logo → `Header.jsx`, `Footer.jsx`, `AdminDashboard.jsx`
- [ ] Colore brand → `--color-brand` in `index.css` + `tailwind.config.js`
- [ ] Font → Google Fonts in `index.html`
- [ ] Stripe keys → `.env`
- [ ] PayPal keys → `.env`
- [ ] SMTP email → `.env`
- [ ] Info legali → `Privacy.jsx`, `Terms.jsx`
- [ ] Contatti → `Contact.jsx`
- [ ] Social links → `Footer.jsx`
- [ ] SEO meta → `index.html`

---

## Porte di Default

| Servizio | Porta |
|---------|-------|
| Frontend (Vite) | 3000 |
| Backend (Express) | 5000 |
| MySQL (Laragon) | 3306 |

> **Nota:** README indica porta 3001 per il backend, ma `server.js` usa `PORT=5000`. Allineare `VITE_API_URL` di conseguenza.

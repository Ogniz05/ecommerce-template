# Design System — Ecommerce Template

> Ricognizione del codice sorgente attuale (`frontend/src/index.css`, `tailwind.config.js`, componenti in `frontend/src/components`, route in `backend/routes`). Non è una proposta: documenta ciò che il progetto già fa, incluse le incoerenze note. `PROJECT.md` descrive un'iterazione precedente (colori `dark` diversi, nessuna menzione di gift card / loyalty / gate beta) — questo file è la fonte aggiornata sul lato design + funzionalità.

---

## 1. Filosofia

Il codice stesso dichiara i suoi vincoli, in commenti sopra i token in `index.css`:

> *"Accent is deliberately scarce: primary CTA, active nav, sale price, focus ring. Everything else is neutral. If a new component 'needs' the accent to read as important, the hierarchy is wrong somewhere else."*

> *"One shadow family. Neutral only — coloured glows were the loudest tell."*

> *"Motion budget: one curve, three durations, nothing that loops forever."*

Tre principi che guidano ogni scelta sotto:
1. **Un solo accento** (`--brand`, rosa-magenta `#D8125B`) usato con parsimonia — mai gradienti, mai glow colorati.
2. **Grigi caldi**, non neutri puri — leggono meno "default Bootstrap".
3. **Motion misurato**: una curva easing, tre durate, rispetto sistematico di `prefers-reduced-motion`.

---

## 2. Colore

### Token primari (`index.css` → `:root`)

| Token | Valore | Uso |
|---|---|---|
| `--brand` | `#D8125B` | CTA primaria, nav attiva, prezzo scontato, focus ring |
| `--brand-hover` | `#B10E4A` | hover su elementi brand |
| `--brand-press` | `#8E0B3B` | active/pressed |
| `--brand-tint` | `#FDF1F5` | sfondo tenue (badge, highlight) |
| `--ink` | `#17171B` | testo principale, titoli |
| `--ink-body` | `#3E3E46` | body copy |
| `--ink-muted` | `#6E6E7A` | testo secondario |
| `--ink-faint` | `#A0A0AC` | placeholder, testo disabilitato |
| `--surface` | `#FFFFFF` | sfondo pagina/card |
| `--surface-sunken` | `#F6F6F7` | sfondo incassato (hover, skeleton) |
| `--surface-inverse` | `#17171B` | sezioni a sfondo scuro |
| `--line` | `#E5E5E9` | bordi/hairline standard |
| `--line-strong` | `#D2D2D9` | bordi input, focus outline scuro |

Scala `brand` completa in Tailwind (50→900) esiste per hover/tint — **non per costruire gradienti**: il commento nel config lo dice esplicitamente.

### Rimozione dei gradienti

`backgroundImage` in `tailwind.config.js` ridefinisce ogni classe `gradient-*` legacy come **fill piatto**:
```js
'gradient-brand': 'linear-gradient(#D8125B, #D8125B)',   // stesso colore ripetuto
'gradient-hero':  'linear-gradient(#17171B, #17171B)',
```
Segno di una migrazione deliberata via da hero/testo a effetto gradiente — le classi restano per compatibilità con schermate non ancora aggiornate, ma non producono più un vero gradiente. Stesso trattamento per `.text-gradient-brand` in `index.css`, ora colore piatto.

### Errore corretto in Tailwind: `surface`

Commento diretto nel config:
> *"`surface` was referenced across the auth pages, GiftCards and the shared UI primitives but never declared here, so every `bg-surface` silently produced no background at all."*

Vale come promemoria: se manca un token referenziato, il fallimento è **silenzioso** (nessun colore, non un errore) — verificare sempre che ogni `bg-*`/`text-*` usato nei componenti abbia un token dichiarato.

---

## 3. Tipografia

| Ruolo | Font | Fallback | Classe |
|---|---|---|---|
| Display (titoli hero/sezione) | **Fraunces** (serif, optical sizing) | Georgia, Times New Roman | `.font-display` |
| Heading / UI (nav, bottoni, label) | **Instrument Sans** | system-ui | `.font-heading` |
| Body | **Instrument Sans** | system-ui | `.font-body` (default su `<body>`) |
| Dati/codice | **JetBrains Mono** | ui-monospace | `.font-mono` |

Il display face porta `letter-spacing: -0.015em` e `font-optical-sizing: auto` — a corpo grande vuole tracking più stretto di quanto il browser scelga di default.

### Scala tipografica

| Classe | font-size | Uso |
|---|---|---|
| `.display-xl` | `clamp(2.75rem, 7vw, 5rem)` | Hero |
| `.display-lg` | `clamp(2.25rem, 4.5vw, 3.25rem)` | Titoli pagina |
| `.section-title` | `clamp(1.75rem, 3vw, 2.5rem)` | Titolo sezione |
| `.section-subtitle` | `17px` | Sottotitolo, max `60ch` |
| `.eyebrow` | `11px`, uppercase, `letter-spacing: 0.12em` | Etichetta sopra i titoli — **senza colore proprio**, per non scavalcare `text-white/70` al call site |

`h1`–`h6` hanno `text-wrap: balance`, i paragrafi `text-wrap: pretty`. Numeri tabellari (`.tnum`, `.price`) forzano `font-variant-numeric: tabular-nums` — prezzi e quantità allineati in colonna.

---

## 4. Spaziatura, forma, ombre

- **Container**: `.container-app`, max-width `1280px`, padding `20px` (→ `32px` da `768px`).
- **Ritmo verticale**: `.section-wrapper` — `80px` mobile, `112px` da `768px`. "Mai ad-hoc", per citare il commento.
- **Border-radius**: solo due valori reali, `4px` (sm) e `8px` (md/default/lg/xl…) — tutte le scale Tailwind oltre `8px` sono rimappate a `8px` o `12px` (`3xl`+). Commento: *"Anything rounder starts to look like a toy."*
- **Ombre**: famiglia neutra a 3 livelli, nessun colore:
  - `--shadow-1` `0 1px 2px rgba(23,23,27,.06)`
  - `--shadow-2` `0 4px 14px rgba(23,23,27,.08)`
  - `--shadow-3` `0 16px 40px rgba(23,23,27,.12)`
- **Breakpoint custom**: `xs: 375px`, `3xl: 1920px` oltre agli standard Tailwind.
- **`max-w-prose`**: `68ch`, per testo lungo (Privacy, Termini, FAQ).

---

## 5. Motion

Un'unica curva, tre durate — dichiarate come "budget", non come opzioni:

```css
--ease: cubic-bezier(0.32, 0.72, 0, 1);
--dur-fast: 120ms;
--dur: 180ms;
--dur-slow: 320ms;
```

`utils/animations.js` aggiunge le varianti Framer Motion riusabili sopra questo budget: `fadeInUp`, `fadeIn`, `scaleIn`, `slideInLeft/Right`, `staggerContainer/Item`, `cardHover` (lift `-6px` + ombra), `drawerVariants`/`modalVariants` (spring, damping 28), `toastVariants`, `heroLineVariant` (con `skewY`), `heartPop`/`badgeBounce` (micro-feedback su wishlist/badge).

**Rispetto sistematico di `prefers-reduced-motion`**: ogni componente con animazione non banale lo controlla esplicitamente (`Preloader`, `PageTransition`, `HeroParticles`, `ScrambleText`, `SmoothScroll`) oltre al blocco globale in `index.css` che azzera tutte le transizioni/animazioni a `0.01ms`.

### Componenti di movimento firmati

| Componente | Effetto |
|---|---|
| `Preloader.jsx` | Splash una volta a sessione (`sessionStorage`): logo + contatore percentuale 0→100 in 1100ms, poi pannelli che si aprono. |
| `PageTransition.jsx` | Tendina a 3 pannelli colorati che scorre ad ogni cambio rotta, `ease-in` `[0.76,0,0.24,1]`, stagger `0.07s`. ⚠️ usa ancora i colori vecchi (`#D8125B`, `#2C2E39`, `#0e1016`) non allineati ai token correnti — vedi §8. |
| `SmoothScroll.jsx` | Scroll inerziale via **Lenis**, easing esponenziale custom; jump immediato in cima ad ogni cambio rotta. |
| `HeroParticles.jsx` | Costellazione di particelle su `<canvas>` puro (no libreria), tinte brand, collegate da linee quando vicine, attratte dal cursore; cap 60 particelle. |
| `Magnetic.jsx` | Wrapper che attira i figli verso il cursore in hover (spring `stiffness:180, damping:16`), forza configurabile `0–1`. |
| `ScrambleText.jsx` | Testo che si "decripta" in hover: caratteri random che si assestano da sinistra, 12 frame × 26ms. |
| `RollingCounter.jsx` | Numero "slot machine": ogni cifra è una colonna 0–9 che scorre in vista, trigger via `useInView` (once). |
| `ScrollProgress.jsx` | Barra di avanzamento pagina. |

---

## 6. Componenti base (`@layer components`)

| Classe | Descrizione |
|---|---|
| `.btn` + varianti (`-primary`, `-secondary`, `-outline`, `-ghost`) + size (`-sm`, `-lg`, `-icon`) | Fill piatto, transizione solo su colore/bordo — **niente** scale/glow simultanei: il commento nota che la versione precedente sommava glow CSS + scale Framer + wrapper magnetico sullo stesso bottone, "which is why every CTA felt like it was vibrating". `min-height: 44px` (target touch). |
| `.card` | Superficie bianca, bordo hairline, **niente ombra di default** — "A hairline does the work a drop shadow used to do." |
| `.input` / `.label` / `.input-error` / `.error-message` | Focus ring brand (`box-shadow` 3px, 12% opacità), min-height 44px. |
| `.badge`, `.badge-new`, `.badge-sale`, `.badge-quiet` | Pillole 10px uppercase, `letter-spacing: 0.06em`. |
| `.skeleton` | Shimmer via `::after` con gradiente che scorre, 1.4s loop (disattivato da reduced-motion). |
| `.skip-link` | Accessibilità: posizionato fuori schermo, rientra al focus — mai `display:none` per restare raggiungibile da tastiera. |

Override di terze parti centralizzati a fine file: `swiper`, `react-image-gallery`, `recharts` tinti con `--brand`/`--ink` invece dei default della libreria.

---

## 7. Stack tecnico

| Layer | Tecnologia |
|---|---|
| Frontend | React 18 · Vite 5 · Tailwind 3 |
| Animazione | Framer Motion 10 · GSAP · Lenis (smooth scroll) · split-type |
| State | Zustand 4 (persistito in `localStorage` dove serve) |
| Form | react-hook-form |
| i18n | i18next / react-i18next (IT + EN) |
| Data viz | Recharts (dashboard admin) |
| UI kit | Headless UI, react-icons, react-select, react-datepicker, react-image-gallery, swiper, react-parallax-tilt |
| Monitoring | Sentry (`@sentry/react`) |
| Backend | Node.js + Express |
| ORM | Sequelize + mysql2 (MySQL 8) |
| Auth | JWT (7g) + bcryptjs (salt 12) + Passport (Google OAuth) |
| Pagamenti | Stripe PaymentIntents · PayPal REST |
| Email | Nodemailer (template HTML) |
| Immagini | Multer → Sharp (conversione WebP) |
| PDF | pdfkit (fatture/documenti ordine) |
| Job schedulati | node-cron |
| Sicurezza HTTP | Helmet, express-rate-limit, CORS |

---

## 8. Note di coerenza (letto dal codice, non presunto)

Cose da conoscere prima di toccare tema/brand:

- **`PageTransition.jsx`** usa colori hardcoded (`#D8125B`, `#2C2E39`, `#0e1016`) che non corrispondono più ai token attuali (`--ink: #17171B` sostituisce `#2C2E39`). Cambiare `--brand` in `index.css` **non** aggiorna questa transizione — va editata a mano.
- **`PROJECT.md`** (doc storica) riporta ancora `dark.DEFAULT: #2C2E39` e non menziona gift card, loyalty, resi, stock alert, gate beta, login Google, sitemap SEO, webhook AfterShip: tutte funzionalità presenti nel codice attuale (`backend/routes/*`). Considerarlo un documento di partenza, non la verità corrente.
- Diversi nomi di token sono mantenuti "per compatibilità" (`--text-primary`, `--dark`, `--surface-2`, `--border` in `index.css`; `dark.*` in `tailwind.config.js`) mentre il sistema attivo usa `--ink`/`--surface`/`--line`. Nuovo codice dovrebbe usare i nomi correnti, non i legacy.

---

## 9. Architettura funzionale — Frontend

### Routing (`react-router-dom`), doppio IT/EN sulle pagine principali

| Path IT | Path EN | Pagina |
|---|---|---|
| `/` | — | Home |
| `/catalogo` | `/catalog` | Catalog (filtri categoria/prezzo/tag/ricerca full-text) |
| `/prodotti/:slug` | `/products/:slug` | ProductDetail |
| `/carrello` | `/cart` | Cart |
| `/checkout` | — | Checkout *(ProtectedRoute)* |
| `/ordine-confermato/:id` | `/order-success/:id` | OrderSuccess *(ProtectedRoute)* |
| `/profilo/*` | `/profile/*` | Profile *(ProtectedRoute)* — include ordini, indirizzi, wishlist, loyalty |
| `/auth/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email` | — | Auth *(PublicOnly dove applicabile)* |
| `/gift-cards` | — | GiftCards (acquisto + riscatto) |
| `/chi-siamo`, `/contatti`, `/faq`, `/privacy`, `/termini`, `/spedizioni` | `/about`, `/contact`, …, `/terms`, `/shipping` | Pagine info |
| `/admin/*` | — | AdminDashboard *(AdminRoute)* |

Guard: `ProtectedRoute` (richiede auth), `AdminRoute` (richiede `admin`/`moderator`), `PublicOnly` (redirect se già loggato). Tutte le pagine sono lazy-loaded (`React.lazy` + `Suspense` → `PageLoader`).

### State — 4 store Zustand

| Store | Persistito | Contenuto |
|---|---|---|
| `useCartStore` | sì (`ecommerce-cart`) | items, subtotal/totalItems come **selettori** (non getter — Zustand `set()` congelerebbe un getter come valore statico), tracking analytics su add/remove |
| `useAuthStore` | sì (`ecommerce-auth`) | user, token, `isAdmin()` |
| `useWishlistStore` | sì (`ecommerce-wishlist`) | id locali per UI istantanea anche da ospite; se loggato, mirror ottimistico verso `POST /wishlist/:id` con rollback su errore |
| `useUIStore` | no | stato UI transiente (search/menu aperti) |

### Onboarding & retention UX

- **`Onboarding.jsx`** — 3 pannelli mostrati una volta dopo la registrazione, per rendere visibili loyalty/wishlist/resi gratuiti che altrimenti restano inutilizzati perché nessuno li menziona mai.
- **`VerificationBanner.jsx`** — promemoria non bloccante per email non verificata (bloccare il checkout perderebbe vendite reali).
- **`CookieConsent.jsx`** — banner conforme: "Rifiuta" ha lo stesso peso visivo di "Accetta", nessun toggle preselezionato, gestibile da tastiera (focus trap + Escape rifiuta).
- **`BetaFeedback.jsx`** — widget di segnalazione per i tester beta, allega automaticamente pagina e viewport correnti; attivabile via `VITE_BETA_FEEDBACK=on`.
- **`OfflineBanner.jsx`** — avviso connessione assente (hook `useOnline`).
- **`EmptyState` / `ErrorState` / `ErrorBoundary` / `Skeleton`** — stati vuoti/errore/loading standardizzati invece di schermate bianche.

---

## 10. Architettura funzionale — Backend

**Base URL:** `http://localhost:5000/api`

### Autenticazione
```
Register → bcrypt(pwd,12) → INSERT user → email verifica → JWT 7g
Login → bcrypt.compare → UPDATE last_login → JWT 7g
Google OAuth (Passport) → match/crea utente via email o google_id → JWT
ForgotPassword → token UUID (scade 1h) → email
ResetPassword → verifica token → bcrypt nuova pwd
```
JWT payload: `{ id, role }`. Middleware `authenticate` (obbligatorio) / `optionalAuth` (utente se presente, altrimenti prosegue come ospite) usati in modo estensivo per funzionalità miste ospite/loggato (wishlist, stock alert, gift card).

### Pagamenti
- **Stripe**: `create-intent` → `client_secret` → conferma client-side → webhook `payment_intent.succeeded` aggiorna `payment_status`.
- **PayPal**: `create-order` → bottone client → `capture/:orderId`.

### Funzionalità e-commerce complete
Catalogo (ricerca full-text, varianti, categorie ad albero), carrello server-side, wishlist, recensioni (una per utente/prodotto, flag verificato/approvato), coupon (percentuale/fisso, soglie, limiti d'uso), spedizioni (soglia gratuità), inventario per magazzino, **gift card** (importi fissi 10/25/50/100/150€, codice `GIFT-XXXX-XXXX`), **loyalty** (1 punto/€ speso, 100 punti = 1€, riscatto minimo 100 punti), **resi** (5 motivi tipizzati, richiesta su ordine), **stock alert** (iscrizione email a rientro disponibilità), newsletter, contatti.

### Accesso riservato (beta gate)
`middleware/accessGate.js` + `routes/gate.js` — pagina HTML di accesso indipendente dal frontend React, protegge l'intero sito dietro un cookie httpOnly (7gg, `sameSite: strict`) finché non si inserisce un codice invito valido; distingue inviti "tester" (traccia visite) da altri tipi di codice.

### SEO & integrazioni
- `routes/seo.js` — `sitemap.xml` generata da prodotti attivi + pagine statiche pesate per priorità.
- `routes/webhooks.js` — riceve eventi tracking da **AfterShip**, mappa stati corriere → stato ordine interno, invia email al cliente sui passaggi rilevanti (spedito/consegnato).
- Job schedulati (`node-cron`) in `services/`: `abandonedOrders.js` (recupero carrelli/ordini abbandonati), `accountDeletion.js`, `notificationPrefs.js`, `orderPayment.js`.

### Admin
Dashboard con KPI (revenue oggi/mese/anno, grafico 12 mesi, top prodotti, low-stock), CRUD completo su prodotti (upload immagine → WebP), categorie, coupon, spedizioni, inventario; gestione ordini/utenti/messaggi/iscritti newsletter/impostazioni.

### Database — 20 tabelle (`database/schema.sql`)
`categories`, `users`, `user_addresses`, `products`, `product_variants`, `warehouses`, `inventory`, `coupons`, `orders`, `order_items`, `wishlist`, `reviews`, `newsletter_subscribers`, `contact_messages`, `shipping_methods`, `settings`, `return_requests`, `stock_alerts`, `loyalty_transactions`, `gift_cards`.

Bilingue a livello di riga (`name`/`name_en`, `description`/`description_en`) invece di tabelle di traduzione separate. Snapshot immutabili dove serve storicità: `order_items.product_snapshot` (JSON) congela il prodotto al momento dell'acquisto, `orders.shipping_address`/`billing_address` (JSON) congelano l'indirizzo.

---

## 11. Sicurezza & qualità applicate

- `helmet` + `express-rate-limit` + CORS su tutte le route.
- Password: bcrypt salt 12, requisiti min 8 caratteri + maiuscola + minuscola + cifra (validati con `express-validator`).
- Cookie del gate beta: `httpOnly`, `secure` in produzione, `sameSite: strict`.
- Focus trap su modali/drawer (`useFocusTrap`), `:focus-visible` con outline brand + offset, skip-link reale.
- `prefers-reduced-motion` rispettato ovunque ci sia animazione non decorativa.
- Sentry per error tracking frontend; `ErrorBoundary` React per fallback controllato invece di schermata bianca.

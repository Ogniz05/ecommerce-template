import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  it: {
    translation: {
      nav: {
        home: 'Home', catalog: 'Catalogo', about: 'Chi Siamo', contact: 'Contatti',
        faq: 'FAQ', login: 'Accedi', register: 'Registrati', profile: 'Profilo',
        orders: 'I Miei Ordini', wishlist: 'Preferiti', logout: 'Esci',
        search: 'Cerca prodotti...', cart: 'Carrello', admin: 'Admin'
      },
      hero: {
        badge: 'Nuova Collezione',
        title: 'Qualità che',
        titleHighlight: 'Fa la Differenza',
        subtitle: 'Scopri i nostri prodotti selezionati con cura, pensati per chi non scende a compromessi sulla qualità.',
        cta: 'Scopri i Prodotti',
        ctaSecondary: 'Chi Siamo',
        stats: { products: 'Prodotti', customers: 'Clienti Soddisfatti', years: 'Anni di Esperienza' }
      },
      products: {
        addToCart: 'Aggiungi al Carrello', addedToCart: 'Aggiunto!',
        outOfStock: 'Non Disponibile', lastItems: 'Ultimi pezzi',
        details: 'Dettagli', reviews: 'Recensioni', specifications: 'Specifiche',
        related: 'Prodotti Correlati', newArrivals: 'Nuovi Arrivi',
        featured: 'In Evidenza', saleProducts: 'Offerte',
        addToWishlist: 'Aggiungi ai Preferiti', removeFromWishlist: 'Rimuovi dai Preferiti',
        noProducts: 'Nessun prodotto trovato',
        filterBy: 'Filtra per', sortBy: 'Ordina per',
        price_asc: 'Prezzo: Crescente', price_desc: 'Prezzo: Decrescente',
        newest: 'Più Recenti', popular: 'Più Popolari', rating: 'Migliori Recensioni',
        search: 'Cerca prodotti', allCategories: 'Tutte le Categorie',
        from: 'Da', to: 'A', apply: 'Applica',
        quickView: 'Vista Rapida', share: 'Condividi',
        sizeGuide: 'Guida alle Taglie', shipping: 'Spedizioni e Resi'
      },
      cart: {
        title: 'Il Tuo Carrello', empty: 'Il carrello è vuoto',
        emptyMessage: 'Esplora il catalogo e aggiungi i tuoi prodotti preferiti.',
        continueShopping: 'Continua gli Acquisti', checkout: 'Vai al Checkout',
        subtotal: 'Subtotale', total: 'Totale', discount: 'Sconto',
        shipping: 'Spedizione', free: 'Gratuita', tax: 'IVA inclusa',
        coupon: 'Codice Sconto', applyCoupon: 'Applica', removeCoupon: 'Rimuovi',
        couponApplied: 'Codice applicato!', couponInvalid: 'Codice non valido',
        qty: 'Qtà', remove: 'Rimuovi', update: 'Aggiorna',
        saving: 'Stai risparmiando',
        itemAdded: 'Aggiunto al carrello!', itemRemoved: 'Rimosso dal carrello'
      },
      checkout: {
        title: 'Checkout',
        step1: 'Indirizzo', step2: 'Spedizione', step3: 'Pagamento', step4: 'Conferma',
        firstName: 'Nome', lastName: 'Cognome', email: 'Email', phone: 'Telefono',
        address: 'Indirizzo', address2: 'Interno/Piano', city: 'Città',
        state: 'Provincia', postal: 'CAP', country: 'Paese',
        continueToShipping: 'Continua alla Spedizione', continueToPayment: 'Continua al Pagamento',
        placeOrder: 'Conferma Ordine', back: 'Indietro',
        orderSummary: 'Riepilogo Ordine', payWith: 'Paga con',
        cardDetails: 'Dati Carta', payWithPaypal: 'Paga con PayPal',
        orderConfirmed: 'Ordine Confermato!',
        orderNumber: 'Numero Ordine', thankYou: 'Grazie per il tuo acquisto!',
        confirmationEmail: 'Ti abbiamo inviato una conferma via email.',
        trackOrder: 'Traccia il Tuo Ordine',
        sameAsBilling: 'Uguale all\'indirizzo di spedizione'
      },
      auth: {
        login: 'Accedi', register: 'Registrati', email: 'Email', password: 'Password',
        firstName: 'Nome', lastName: 'Cognome', phone: 'Telefono (opzionale)',
        forgotPassword: 'Hai dimenticato la password?', resetPassword: 'Reimposta Password',
        noAccount: 'Non hai un account?', hasAccount: 'Hai già un account?',
        loginSuccess: 'Bentornato!', registerSuccess: 'Registrazione completata!',
        emailVerification: 'Controlla la tua email per verificare l\'account.',
        passwordStrength: { weak: 'Debole', fair: 'Discreta', good: 'Buona', strong: 'Forte' },
        showPassword: 'Mostra Password', hidePassword: 'Nascondi Password',
        terms: 'Accettando ti dichiari di aver letto la nostra', privacyPolicy: 'Privacy Policy',
        and: 'e i', termsConditions: 'Termini e Condizioni'
      },
      profile: {
        title: 'Il Mio Profilo', personalInfo: 'Dati Personali', addresses: 'Indirizzi',
        orders: 'I Miei Ordini', wishlist: 'Preferiti', security: 'Sicurezza',
        notifications: 'Notifiche', savedCards: 'Carte Salvate',
        editProfile: 'Modifica Profilo', changePassword: 'Cambia Password',
        addAddress: 'Aggiungi Indirizzo', defaultAddress: 'Predefinito',
        orderStatus: {
          pending: 'In Attesa', processing: 'In Lavorazione',
          shipped: 'Spedito', delivered: 'Consegnato', cancelled: 'Annullato'
        },
        noOrders: 'Nessun ordine ancora', viewOrder: 'Visualizza Ordine'
      },
      footer: {
        newsletter: 'Iscriviti alla Newsletter', newsletterSub: 'Ricevi offerte esclusive e novità',
        subscribe: 'Iscriviti', copyright: '© 2026 YOUR NAME. Tutti i diritti riservati.',
        shop: 'Shop', info: 'Informazioni', support: 'Supporto',
        followUs: 'Seguici', paymentsMethods: 'Metodi di Pagamento'
      },
      common: {
        loading: 'Caricamento...', error: 'Errore', retry: 'Riprova',
        save: 'Salva', cancel: 'Annulla', confirm: 'Conferma', delete: 'Elimina',
        edit: 'Modifica', close: 'Chiudi', back: 'Indietro', next: 'Avanti',
        search: 'Cerca', filter: 'Filtra', sort: 'Ordina', reset: 'Reset',
        viewAll: 'Vedi Tutti', showMore: 'Mostra Altro', showLess: 'Mostra Meno',
        yes: 'Sì', no: 'No', or: 'oppure', and: 'e',
        required: 'Obbligatorio', optional: 'Opzionale',
        noResults: 'Nessun risultato trovato',
        currency: '€', currencyCode: 'EUR', language: 'it'
      },
      about: {
        title: 'Chi Siamo', // [CUSTOMIZE] Customize this section with your brand story
        subtitle: 'La nostra storia e i nostri valori',
        mission: 'La Nostra Missione', values: 'I Nostri Valori', team: 'Il Nostro Team'
      },
      contact: {
        title: 'Contattaci', subtitle: 'Siamo qui per aiutarti',
        name: 'Nome', email: 'Email', subject: 'Oggetto', message: 'Messaggio',
        send: 'Invia Messaggio', success: 'Messaggio inviato! Ti risponderemo presto.',
        info: 'Informazioni di Contatto', hours: 'Orari di Apertura',
        followUs: 'Seguici sui Social'
      },
      faq: { title: 'Domande Frequenti', search: 'Cerca nelle FAQ', noResults: 'Nessun risultato' }
    }
  },
  en: {
    translation: {
      nav: {
        home: 'Home', catalog: 'Catalog', about: 'About Us', contact: 'Contact',
        faq: 'FAQ', login: 'Login', register: 'Register', profile: 'Profile',
        orders: 'My Orders', wishlist: 'Wishlist', logout: 'Logout',
        search: 'Search products...', cart: 'Cart', admin: 'Admin'
      },
      hero: {
        badge: 'New Collection',
        title: 'Quality that',
        titleHighlight: 'Makes a Difference',
        subtitle: 'Discover our carefully selected products, designed for those who don\'t compromise on quality.',
        cta: 'Discover Products',
        ctaSecondary: 'About Us',
        stats: { products: 'Products', customers: 'Happy Customers', years: 'Years of Experience' }
      },
      products: {
        addToCart: 'Add to Cart', addedToCart: 'Added!',
        outOfStock: 'Out of Stock', lastItems: 'Last items',
        details: 'Details', reviews: 'Reviews', specifications: 'Specs',
        related: 'Related Products', newArrivals: 'New Arrivals',
        featured: 'Featured', saleProducts: 'On Sale',
        addToWishlist: 'Add to Wishlist', removeFromWishlist: 'Remove from Wishlist',
        noProducts: 'No products found',
        filterBy: 'Filter by', sortBy: 'Sort by',
        price_asc: 'Price: Low to High', price_desc: 'Price: High to Low',
        newest: 'Newest', popular: 'Most Popular', rating: 'Best Rated',
        search: 'Search products', allCategories: 'All Categories',
        from: 'From', to: 'To', apply: 'Apply',
        quickView: 'Quick View', share: 'Share',
        sizeGuide: 'Size Guide', shipping: 'Shipping & Returns'
      },
      cart: {
        title: 'Your Cart', empty: 'Your cart is empty',
        emptyMessage: 'Browse the catalog and add your favorite products.',
        continueShopping: 'Continue Shopping', checkout: 'Go to Checkout',
        subtotal: 'Subtotal', total: 'Total', discount: 'Discount',
        shipping: 'Shipping', free: 'Free', tax: 'VAT included',
        coupon: 'Discount Code', applyCoupon: 'Apply', removeCoupon: 'Remove',
        couponApplied: 'Code applied!', couponInvalid: 'Invalid code',
        qty: 'Qty', remove: 'Remove', update: 'Update',
        saving: 'You\'re saving',
        itemAdded: 'Added to cart!', itemRemoved: 'Removed from cart'
      },
      checkout: {
        title: 'Checkout',
        step1: 'Address', step2: 'Shipping', step3: 'Payment', step4: 'Confirm',
        firstName: 'First Name', lastName: 'Last Name', email: 'Email', phone: 'Phone',
        address: 'Address', address2: 'Apt/Floor', city: 'City',
        state: 'State/Province', postal: 'ZIP Code', country: 'Country',
        continueToShipping: 'Continue to Shipping', continueToPayment: 'Continue to Payment',
        placeOrder: 'Place Order', back: 'Back',
        orderSummary: 'Order Summary', payWith: 'Pay with',
        cardDetails: 'Card Details', payWithPaypal: 'Pay with PayPal',
        orderConfirmed: 'Order Confirmed!',
        orderNumber: 'Order Number', thankYou: 'Thank you for your purchase!',
        confirmationEmail: 'We\'ve sent a confirmation to your email.',
        trackOrder: 'Track Your Order',
        sameAsBilling: 'Same as shipping address'
      },
      auth: {
        login: 'Login', register: 'Register', email: 'Email', password: 'Password',
        firstName: 'First Name', lastName: 'Last Name', phone: 'Phone (optional)',
        forgotPassword: 'Forgot your password?', resetPassword: 'Reset Password',
        noAccount: 'Don\'t have an account?', hasAccount: 'Already have an account?',
        loginSuccess: 'Welcome back!', registerSuccess: 'Registration complete!',
        emailVerification: 'Check your email to verify your account.',
        passwordStrength: { weak: 'Weak', fair: 'Fair', good: 'Good', strong: 'Strong' },
        showPassword: 'Show Password', hidePassword: 'Hide Password',
        terms: 'By registering you agree to our', privacyPolicy: 'Privacy Policy',
        and: 'and', termsConditions: 'Terms & Conditions'
      },
      profile: {
        title: 'My Profile', personalInfo: 'Personal Info', addresses: 'Addresses',
        orders: 'My Orders', wishlist: 'Wishlist', security: 'Security',
        notifications: 'Notifications', savedCards: 'Saved Cards',
        editProfile: 'Edit Profile', changePassword: 'Change Password',
        addAddress: 'Add Address', defaultAddress: 'Default',
        orderStatus: {
          pending: 'Pending', processing: 'Processing',
          shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled'
        },
        noOrders: 'No orders yet', viewOrder: 'View Order'
      },
      footer: {
        newsletter: 'Newsletter', newsletterSub: 'Get exclusive offers and news',
        subscribe: 'Subscribe', copyright: '© 2026 YOUR NAME. All rights reserved.',
        shop: 'Shop', info: 'Information', support: 'Support',
        followUs: 'Follow Us', paymentsMethods: 'Payment Methods'
      },
      common: {
        loading: 'Loading...', error: 'Error', retry: 'Retry',
        save: 'Save', cancel: 'Cancel', confirm: 'Confirm', delete: 'Delete',
        edit: 'Edit', close: 'Close', back: 'Back', next: 'Next',
        search: 'Search', filter: 'Filter', sort: 'Sort', reset: 'Reset',
        viewAll: 'View All', showMore: 'Show More', showLess: 'Show Less',
        yes: 'Yes', no: 'No', or: 'or', and: 'and',
        required: 'Required', optional: 'Optional',
        noResults: 'No results found',
        currency: '€', currencyCode: 'EUR', language: 'en'
      },
      about: {
        title: 'About Us',
        subtitle: 'Our story and values',
        mission: 'Our Mission', values: 'Our Values', team: 'Our Team'
      },
      contact: {
        title: 'Contact Us', subtitle: 'We\'re here to help',
        name: 'Name', email: 'Email', subject: 'Subject', message: 'Message',
        send: 'Send Message', success: 'Message sent! We\'ll get back to you soon.',
        info: 'Contact Information', hours: 'Business Hours',
        followUs: 'Follow Us'
      },
      faq: { title: 'FAQ', search: 'Search FAQs', noResults: 'No results' }
    }
  }
};

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem('language') || 'it',
  fallbackLng: 'it',
  interpolation: { escapeValue: false }
});

export default i18n;

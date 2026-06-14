export const formatPrice = (price, currency = 'EUR', locale = 'it-IT') =>
  new Intl.NumberFormat(locale, { style: 'currency', currency }).format(price);

export const formatDate = (date, locale = 'it-IT', options = {}) =>
  new Date(date).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric', ...options });

export const formatRelativeDate = (date) => {
  const now = new Date();
  const diff = now - new Date(date);
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Oggi';
  if (days === 1) return 'Ieri';
  if (days < 7) return `${days} giorni fa`;
  return formatDate(date);
};

export const truncate = (str, length = 120) =>
  str?.length > length ? str.slice(0, length).trimEnd() + '…' : str;

export const slugToTitle = (slug) =>
  slug?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

export const calcDiscount = (original, current) => {
  if (!original || original <= current) return 0;
  return Math.round(((original - current) / original) * 100);
};

export const formatStock = (stock) => {
  if (stock === 0) return { label: 'Esaurito', color: 'text-red-500', bg: 'bg-red-50' };
  if (stock <= 5) return { label: `Ultimi ${stock} pezzi`, color: 'text-orange-500', bg: 'bg-orange-50' };
  return { label: 'Disponibile', color: 'text-green-600', bg: 'bg-green-50' };
};

export const getOrderStatusStyle = (status) => {
  const styles = {
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'In Attesa' },
    processing: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'In Lavorazione' },
    shipped: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Spedito' },
    delivered: { bg: 'bg-green-100', text: 'text-green-800', label: 'Consegnato' },
    cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Annullato' },
    refunded: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Rimborsato' },
  };
  return styles[status] || styles.pending;
};

export const generateStars = (rating) => {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return { full, half, empty };
};

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiInstagram, FiFacebook, FiTwitter, FiYoutube, FiLinkedin, FiMail, FiPhone, FiMapPin, FiCheck } from 'react-icons/fi';
import { SiVisa, SiMastercard, SiPaypal, SiStripe } from 'react-icons/si';
import toast from 'react-hot-toast';
import api from '../utils/api';

// [CUSTOMIZE] Point these at your own profiles.
const SOCIALS = [
  { icon: <FiInstagram size={16} />, href: '#', label: 'Instagram' },
  { icon: <FiFacebook size={16} />, href: '#', label: 'Facebook' },
  { icon: <FiTwitter size={16} />, href: '#', label: 'Twitter' },
  { icon: <FiYoutube size={16} />, href: '#', label: 'YouTube' },
  { icon: <FiLinkedin size={16} />, href: '#', label: 'LinkedIn' },
];

const SHOP_LINKS = [
  { label: 'Catalogo', path: '/catalogo' },
  { label: 'Nuovi arrivi', path: '/catalogo?sort=newest' },
  { label: 'Offerte', path: '/catalogo?sale=true' },
  { label: 'In evidenza', path: '/catalogo?featured=true' },
  { label: 'Gift card', path: '/gift-card' },
];

const INFO_LINKS = [
  { label: 'Chi siamo', path: '/chi-siamo' },
  { label: 'FAQ', path: '/faq' },
  { label: 'Spedizioni e resi', path: '/spedizioni' },
  { label: 'Privacy policy', path: '/privacy' },
  { label: 'Termini e condizioni', path: '/termini' },
];

const SUPPORT_LINKS = [
  { label: 'Contattaci', path: '/contatti' },
  { label: 'I miei ordini', path: '/profilo/ordini' },
  { label: 'Traccia ordine', path: '/profilo/ordini' },
  { label: 'Resi', path: '/spedizioni#resi' },
];

export default function Footer() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [subLoading, setSubLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return toast.error('Inserisci un indirizzo email valido');
    setSubLoading(true);
    try {
      await api.post('/newsletter/subscribe', { email });
      setSubscribed(true);
      setEmail('');
    } catch {
      toast.error('Iscrizione non riuscita. Riprova.');
    } finally { setSubLoading(false); }
  };

  const linkCls = 'text-white/55 hover:text-white text-sm transition-colors';

  return (
    <footer className="bg-ink text-white mt-auto">

      <div className="border-b border-white/10">
        <div className="container-app py-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <p className="font-heading font-semibold text-lg">{t('footer.newsletter')}</p>
            <p className="text-white/55 text-sm mt-1">{t('footer.newsletterSub')}</p>
          </div>

          {subscribed ? (
            <p className="flex items-center gap-2 text-sm text-white/80">
              <FiCheck size={16} /> Iscrizione confermata. Controlla la tua casella.
            </p>
          ) : (
            <form onSubmit={handleSubscribe} className="flex gap-2 w-full lg:w-auto">
              <label htmlFor="footer-newsletter" className="sr-only">Indirizzo email</label>
              <input
                id="footer-newsletter"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="La tua email"
                className="flex-1 lg:w-72 bg-white/5 border border-white/20 rounded-md px-3.5 h-11
                           text-white placeholder:text-white/35 font-body text-sm
                           focus:outline-none focus:border-white/50 transition-colors"
              />
              <button
                type="submit"
                disabled={subLoading}
                className="btn bg-white text-ink hover:bg-white/90 shrink-0 disabled:opacity-50"
              >
                {subLoading ? 'Invio…' : t('footer.subscribe')}
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="container-app py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-8 gap-y-10">

          <div className="col-span-2 md:col-span-4 lg:col-span-2">
            {/* [CUSTOMIZE] Replace with your company name or logo */}
            <p className="font-display text-2xl">Corso</p>
            {/* [CUSTOMIZE] Your brand description */}
            <p className="text-white/55 text-sm leading-relaxed max-w-xs mt-3">
              Selezione di abbigliamento, accessori e oggetti per la casa.
              Spediamo in 48 ore in tutta Italia.
            </p>

            <div className="space-y-2 mt-6">
              {/* [CUSTOMIZE] Your contact details */}
              <a href="mailto:info@corso.example" className={`flex items-center gap-2.5 ${linkCls}`}>
                <FiMail size={14} className="text-white/35" /> info@corso.example
              </a>
              <a href="tel:+390212345678" className={`flex items-center gap-2.5 ${linkCls}`}>
                <FiPhone size={14} className="text-white/35" /> +39 02 1234 5678
              </a>
              <p className="flex items-center gap-2.5 text-white/55 text-sm">
                <FiMapPin size={14} className="text-white/35 shrink-0" /> Via Roma 1, 20100 Milano
              </p>
            </div>
          </div>

          {[
            { title: t('footer.shop'), links: SHOP_LINKS },
            { title: t('footer.info'), links: INFO_LINKS },
            { title: t('footer.support'), links: SUPPORT_LINKS },
          ].map(({ title, links }) => (
            <nav key={title} aria-label={title}>
              <h4 className="font-heading font-semibold text-white text-[13px] mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {links.map(({ label, path }) => (
                  <li key={label}>
                    <Link to={path} className={linkCls}>{label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-app py-6 flex flex-col-reverse md:flex-row items-center justify-between gap-5">
          {/* [CUSTOMIZE] Copyright line */}
          <p className="text-white/40 text-xs">{t('footer.copyright')}</p>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 text-white/45">
              {[
                { icon: <SiVisa size={26} />, label: 'Visa' },
                { icon: <SiMastercard size={20} />, label: 'Mastercard' },
                { icon: <SiPaypal size={18} />, label: 'PayPal' },
                { icon: <SiStripe size={22} />, label: 'Stripe' },
              ].map(({ icon, label }) => (
                <span key={label} aria-label={label} title={label}>{icon}</span>
              ))}
            </div>

            <div className="flex items-center gap-1">
              {SOCIALS.map(({ icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-8 h-8 flex items-center justify-center rounded-md text-white/45
                             hover:text-white hover:bg-white/10 transition-colors"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

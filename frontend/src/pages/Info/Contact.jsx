import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiMail, FiPhone, FiMapPin, FiClock, FiCheck } from 'react-icons/fi';
import SEO from '../../components/SEO';
import api from '../../utils/api';
import toast from 'react-hot-toast';

// [CUSTOMIZE] Your real contact details.
const INFO = [
  { icon: FiMail, title: 'Email', value: 'info@corso.example', sub: 'Rispondiamo entro 24 ore' },
  { icon: FiPhone, title: 'Telefono', value: '+39 02 1234 567', sub: 'Lun–Ven, 9:00–18:00' },
  { icon: FiMapPin, title: 'Sede', value: 'Via Roma 1, Milano', sub: 'Italia' },
  { icon: FiClock, title: 'Orari', value: 'Lun–Ven 9:00–18:00', sub: 'Sab 10:00–14:00' },
];

export default function Contact() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      return toast.error('Compila i campi obbligatori');
    }
    setLoading(true);
    try {
      await api.post('/contact', form);
      setSent(true);
      toast.success('Messaggio inviato');
    } catch {
      toast.error('Invio non riuscito. Riprova.');
    } finally { setLoading(false); }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="page-wrapper">
      <SEO
        title="Contatti"
        description="Scrivici: rispondiamo entro 24 ore nei giorni lavorativi."
      />

      <header className="container-app pt-12 pb-10 md:pt-16 md:pb-14 max-w-3xl">
        <p className="eyebrow text-muted">Contatti</p>
        <h1 className="display-lg mt-2">{t('contact.title')}</h1>
        <p className="section-subtitle mt-4">
          Per ordini, resi o domande sui prodotti. Rispondiamo entro un giorno
          lavorativo, sempre da una persona.
        </p>
      </header>

      <div className="container-app pb-24">
        <div className="grid lg:grid-cols-[300px_1fr] gap-10 lg:gap-16 items-start">

          <aside>
            <h2 className="eyebrow text-muted">{t('contact.info')}</h2>
            <dl className="mt-4">
              {INFO.map(({ icon: Icon, title, value, sub }) => (
                <div key={title} className="flex gap-3.5 py-4 border-t border-line">
                  <Icon size={16} className="text-muted shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <dt className="text-muted text-xs">{title}</dt>
                    <dd className="font-heading font-semibold text-ink text-sm mt-0.5 break-words">{value}</dd>
                    <dd className="text-muted text-xs mt-0.5">{sub}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </aside>

          <div className="border border-line rounded-md p-6 md:p-8">
            {sent ? (
              <div className="py-10 text-center">
                <div className="w-12 h-12 rounded-full bg-ink text-white flex items-center justify-center mx-auto">
                  <FiCheck size={20} />
                </div>
                <h2 className="font-heading font-semibold text-ink text-lg mt-5">
                  Messaggio inviato
                </h2>
                <p className="text-muted text-sm mt-2 max-w-sm mx-auto">
                  {t('contact.success')}
                </p>
                <button
                  onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', message: '' }); }}
                  className="btn btn-outline btn-sm mt-6"
                >
                  Scrivi un altro messaggio
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <h2 className="font-heading font-semibold text-ink text-lg">
                  {t('contact.formTitle')}
                </h2>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label" htmlFor="c-name">
                      {t('contact.name')} <span className="text-muted font-normal">*</span>
                    </label>
                    <input id="c-name" className="input" value={form.name} onChange={set('name')} required />
                  </div>
                  <div>
                    <label className="label" htmlFor="c-email">
                      {t('contact.email')} <span className="text-muted font-normal">*</span>
                    </label>
                    <input id="c-email" type="email" className="input" value={form.email} onChange={set('email')} required />
                  </div>
                </div>

                <div>
                  <label className="label" htmlFor="c-subject">{t('contact.subject')}</label>
                  <input id="c-subject" className="input" value={form.subject} onChange={set('subject')} />
                </div>

                <div>
                  <label className="label" htmlFor="c-message">
                    {t('contact.message')} <span className="text-muted font-normal">*</span>
                  </label>
                  <textarea
                    id="c-message"
                    rows={6}
                    className="input resize-none"
                    value={form.message}
                    onChange={set('message')}
                    required
                  />
                </div>

                <button type="submit" disabled={loading} className="btn btn-primary">
                  {loading ? 'Invio…' : t('contact.submit')}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

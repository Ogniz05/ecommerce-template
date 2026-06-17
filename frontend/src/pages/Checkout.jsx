import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FiCheck, FiChevronRight, FiLock, FiUser, FiGift, FiAward, FiX } from 'react-icons/fi';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useCartStore, useAuthStore, selectSubtotal } from '../store/useStore';
import { formatPrice } from '../utils/formatters';
import api from '../utils/api';
import toast from 'react-hot-toast';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_placeholder');

const STEPS = ['address', 'shipping', 'payment', 'confirm'];

// Defined outside AddressStep: an inline component would be recreated on every
// keystroke, remounting the input and dropping focus.
function AddressField({ name, label, req = false, type = 'text', form, errors, onFieldChange }) {
  return (
    <div className="col-span-2 md:col-span-1">
      <label className="label">{label}{req && <span className="text-brand ml-1">*</span>}</label>
      <input
        type={type}
        value={form[name] || ''}
        onChange={e => onFieldChange(name, e.target.value)}
        className={`input ${errors[name] ? 'input-error' : ''}`}
      />
      {errors[name] && <p className="error-message">{errors[name]}</p>}
    </div>
  );
}

function AddressStep({ data, onChange, onNext }) {
  const { t } = useTranslation();
  const [form, setForm] = useState(data || {});
  const [errors, setErrors] = useState({});

  const required = ['first_name', 'last_name', 'email', 'address_line1', 'city', 'postal_code', 'country'];
  const validate = () => {
    const e = {};
    required.forEach(f => { if (!form[f]?.trim()) e[f] = 'Obbligatorio'; });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (validate()) { onChange(form); onNext(); }
  };

  const onFieldChange = (name, value) => setForm(f => ({ ...f, [name]: value }));
  const fieldProps = { form, errors, onFieldChange };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <h2 className="font-heading font-bold text-xl text-dark mb-6">{t('checkout.step1')}</h2>
      <div className="grid grid-cols-2 gap-4">
        <AddressField name="first_name" label={t('checkout.firstName')} req {...fieldProps} />
        <AddressField name="last_name" label={t('checkout.lastName')} req {...fieldProps} />
        <div className="col-span-2">
          <AddressField name="email" label={t('checkout.email')} type="email" req {...fieldProps} />
        </div>
        <div className="col-span-2">
          <AddressField name="phone" label={t('checkout.phone')} {...fieldProps} />
        </div>
        <div className="col-span-2">
          <AddressField name="address_line1" label={t('checkout.address')} req {...fieldProps} />
        </div>
        <AddressField name="address_line2" label={t('checkout.address2')} {...fieldProps} />
        <AddressField name="city" label={t('checkout.city')} req {...fieldProps} />
        <AddressField name="state" label={t('checkout.state')} {...fieldProps} />
        <AddressField name="postal_code" label={t('checkout.postal')} req {...fieldProps} />
        <div>
          <label className="label">{t('checkout.country')} <span className="text-brand">*</span></label>
          <select value={form.country || 'IT'} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} className="input">
            <option value="IT">Italia</option>
            <option value="DE">Germania</option>
            <option value="FR">Francia</option>
            <option value="ES">Spagna</option>
            <option value="GB">Regno Unito</option>
            <option value="US">Stati Uniti</option>
          </select>
        </div>
      </div>
      <motion.button
        onClick={handleNext}
        className="btn btn-primary w-full mt-8 py-3.5 flex items-center justify-center gap-2"
        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
      >
        {t('checkout.continueToShipping')} <FiChevronRight size={17} />
      </motion.button>
    </motion.div>
  );
}

function ShippingStep({ subtotal, selected, onSelect, onNext, onBack }) {
  const { t } = useTranslation();
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/shipping?subtotal=${subtotal}&lang=${localStorage.getItem('language') || 'it'}`)
      .then(d => setMethods(d.methods || []))
      .finally(() => setLoading(false));
  }, [subtotal]);

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <h2 className="font-heading font-bold text-xl text-dark mb-6">{t('checkout.step2')}</h2>
      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 skeleton rounded-xl" />)}</div>
      ) : (
        <div className="space-y-3">
          {methods.map(method => (
            <motion.div
              key={method.id}
              onClick={() => onSelect(method)}
              className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all
                ${selected?.id === method.id ? 'border-brand bg-brand/5' : 'border-gray-200 hover:border-brand/50'}`}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
                  ${selected?.id === method.id ? 'border-brand' : 'border-gray-300'}`}>
                  {selected?.id === method.id && (
                    <motion.div className="w-2.5 h-2.5 rounded-full bg-brand" initial={{ scale: 0 }} animate={{ scale: 1 }} />
                  )}
                </div>
                <div>
                  <p className="font-heading font-semibold text-dark text-sm">{method.display_name || method.name}</p>
                  <p className="text-text-secondary text-xs">{method.estimated_days_min}–{method.estimated_days_max} giorni lavorativi</p>
                </div>
              </div>
              <span className={`font-heading font-bold text-sm ${method.is_free ? 'text-green-600' : 'text-dark'}`}>
                {method.is_free ? t('cart.free') : formatPrice(method.price)}
              </span>
            </motion.div>
          ))}
        </div>
      )}
      <div className="flex gap-3 mt-8">
        <button onClick={onBack} className="btn btn-ghost px-6 py-3.5 text-sm">{t('checkout.back')}</button>
        <motion.button
          onClick={onNext}
          disabled={!selected}
          className="btn btn-primary flex-1 py-3.5 flex items-center justify-center gap-2"
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
        >
          {t('checkout.continueToPayment')} <FiChevronRight size={17} />
        </motion.button>
      </div>
    </motion.div>
  );
}

function StripePaymentForm({ orderId, totalAmount, onSuccess, onBack }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setLoading(true);
    try {
      const { clientSecret } = await api.post('/payments/stripe/create-intent', { orderId });
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: elements.getElement(CardElement) }
      });

      if (error) throw new Error(error.message);
      if (paymentIntent.status === 'succeeded') {
        await api.post('/payments/stripe/confirm', { paymentIntentId: paymentIntent.id, orderId });
        onSuccess();
      }
    } catch (err) {
      toast.error(err.message || 'Pagamento fallito');
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-5">
      <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
        <CardElement options={{
          style: {
            base: { fontFamily: "'DM Sans', sans-serif", fontSize: '15px', color: '#2C2E39', '::placeholder': { color: '#9ca3af' } }
          }
        }} />
      </div>
      <div className="flex gap-3">
        <button onClick={onBack} className="btn btn-ghost px-6 py-3.5 text-sm">{t('checkout.back')}</button>
        <motion.button
          onClick={handlePay}
          disabled={loading || !stripe}
          className="btn btn-primary flex-1 py-3.5 flex items-center justify-center gap-2"
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
        >
          {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (
            <><FiLock size={15} /> Paga {formatPrice(totalAmount)}</>
          )}
        </motion.button>
      </div>
    </div>
  );
}

function PaymentStep({ orderId, totalAmount, onSuccess, onBack }) {
  const { t } = useTranslation();
  const [method, setMethod] = useState('stripe');

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <h2 className="font-heading font-bold text-xl text-dark mb-6">{t('checkout.step3')}</h2>
      <div className="flex gap-3 mb-6">
        {['stripe', 'paypal'].map(m => (
          <button
            key={m}
            onClick={() => setMethod(m)}
            className={`flex-1 py-3 rounded-xl border-2 font-heading font-semibold text-sm transition-all capitalize
              ${method === m ? 'border-brand bg-brand/5 text-brand' : 'border-gray-200 text-dark hover:border-brand/50'}`}
          >
            {m === 'stripe' ? '💳 Carta di Credito' : '🅿️ PayPal'}
          </button>
        ))}
      </div>
      <Elements stripe={stripePromise}>
        {method === 'stripe' ? (
          <StripePaymentForm orderId={orderId} totalAmount={totalAmount} onSuccess={onSuccess} onBack={onBack} />
        ) : (
          <div className="space-y-4">
            <p className="text-text-secondary text-sm">Sarai reindirizzato su PayPal per completare il pagamento.</p>
            <div className="flex gap-3">
              <button onClick={onBack} className="btn btn-ghost px-6 py-3.5 text-sm">{t('checkout.back')}</button>
              <button className="btn btn-primary flex-1 py-3.5">Paga con PayPal</button>
            </div>
          </div>
        )}
      </Elements>
    </motion.div>
  );
}

function SuccessStep({ orderId, orderNumber, isGuest }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <motion.div
      className="text-center py-8"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', damping: 20 }}
    >
      <motion.div
        className="w-20 h-20 rounded-3xl bg-green-100 flex items-center justify-center mx-auto mb-6"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.2 }}
      >
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4, type: 'spring', stiffness: 300 }}>
          <FiCheck size={32} className="text-green-500" />
        </motion.div>
      </motion.div>
      <h2 className="font-display font-bold text-3xl text-dark mb-3">{t('checkout.orderConfirmed')}</h2>
      <p className="text-text-secondary mb-2">{t('checkout.thankYou')}</p>
      <p className="text-text-secondary text-sm mb-1">{t('checkout.orderNumber')}: <strong className="text-dark font-mono">{orderNumber}</strong></p>
      <p className="text-text-secondary text-sm mb-8">
        {isGuest ? 'Riceverai una email di conferma con i dettagli del tuo ordine.' : t('checkout.confirmationEmail')}
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {!isGuest && (
          <button onClick={() => navigate(`/profilo/ordini/${orderId}`)} className="btn btn-primary px-8 py-3">
            {t('checkout.trackOrder')}
          </button>
        )}
        {isGuest && (
          <button onClick={() => navigate('/auth/register')} className="btn btn-primary px-8 py-3">
            Crea Account per Tracciare l&apos;Ordine
          </button>
        )}
        <button onClick={() => navigate('/catalogo')} className="btn btn-outline px-8 py-3">
          Continua gli Acquisti
        </button>
      </div>
    </motion.div>
  );
}

export default function Checkout() {
  const { t } = useTranslation();
  const { items, clearCart } = useCartStore();
  const subtotal = useCartStore(selectSubtotal);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [address, setAddress] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    country: 'IT'
  });
  const [shippingMethod, setShippingMethod] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [orderNumber, setOrderNumber] = useState(null);
  const [creatingOrder, setCreatingOrder] = useState(false);

  // Loyalty + gift card
  const [loyalty, setLoyalty] = useState(null);        // { points, value, config }
  const [usePoints, setUsePoints] = useState(false);
  const [giftCode, setGiftCode] = useState('');
  const [giftCard, setGiftCard] = useState(null);      // { code, balance }
  const [giftLoading, setGiftLoading] = useState(false);

  useEffect(() => {
    if (items.length === 0 && step < 3) navigate('/catalogo');
  }, [items, step, navigate]);

  useEffect(() => {
    if (user) api.get('/loyalty').then(setLoyalty).catch(() => {});
  }, [user]);

  const validateGiftCard = async () => {
    if (!giftCode.trim()) return;
    setGiftLoading(true);
    try {
      const d = await api.post('/gift-cards/validate', { code: giftCode });
      setGiftCard({ code: d.code, balance: d.balance });
      toast.success(`Gift card valida: saldo ${formatPrice(d.balance)}`);
    } catch (err) {
      toast.error(err.message || 'Gift card non valida');
      setGiftCard(null);
    } finally { setGiftLoading(false); }
  };

  const createOrder = async () => {
    setCreatingOrder(true);
    try {
      const orderItems = items.map(i => ({
        product_id: i.product_id,
        variant_id: i.variant_id,
        quantity: i.quantity
      }));

      const data = await api.post('/orders', {
        items: orderItems,
        shipping_address: address,
        billing_address: address,
        shipping_method: shippingMethod?.id || 1,
        points_to_redeem: pointsToRedeem,
        gift_card_code: giftCard?.code || null
      });

      setOrderId(data.orderId);
      setOrderNumber(data.orderNumber);
      setStep(2);
    } catch (err) {
      toast.error(err.message || 'Errore creazione ordine');
    } finally { setCreatingOrder(false); }
  };

  const handlePaymentSuccess = () => {
    clearCart();
    setStep(3);
  };

  const shippingCost = shippingMethod
    ? (shippingMethod.is_free ? 0 : parseFloat(shippingMethod.price || 0))
    : 4.99;
  const grossTotal = subtotal + shippingCost + subtotal * 0.22;

  const minRedeem = loyalty?.config?.min_redeem || 100;
  const redeemRate = loyalty?.config?.redeem_rate || 100;
  const pointsToRedeem = usePoints && loyalty?.points >= minRedeem ? loyalty.points : 0;
  const pointsDiscount = Math.min(pointsToRedeem / redeemRate, grossTotal);
  const afterPoints = grossTotal - pointsDiscount;
  const giftDiscount = giftCard ? Math.min(giftCard.balance, afterPoints) : 0;
  const total = Math.max(0, afterPoints - giftDiscount);

  return (
    <div className="page-wrapper">
      <div className="container-app py-10">
        <h1 className="font-display font-bold text-3xl text-dark mb-10">{t('checkout.title')}</h1>

        {step < 3 && (
          <div className="flex items-center justify-center mb-10">
            {STEPS.slice(0, 3).map((s, i) => (
              <React.Fragment key={s}>
                <div className={`flex items-center gap-2 transition-all ${i <= step ? 'text-brand' : 'text-gray-300'}`}>
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-heading font-bold transition-all
                    ${i < step ? 'bg-brand border-brand text-white' : i === step ? 'border-brand text-brand' : 'border-gray-300 text-gray-300'}`}>
                    {i < step ? <FiCheck size={14} /> : i + 1}
                  </div>
                  <span className="font-heading font-medium text-sm hidden sm:block">
                    {t(`checkout.step${i + 1}`)}
                  </span>
                </div>
                {i < 2 && (
                  <motion.div
                    className={`flex-1 h-0.5 mx-3 rounded-full transition-all ${i < step ? 'bg-brand' : 'bg-gray-200'}`}
                    animate={{ scaleX: i < step ? 1 : 0 }}
                    style={{ originX: 0 }}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Guest banner — shown only when not logged in and before payment */}
        {!user && step < 2 && (
          <motion.div
            className="mb-6 p-4 rounded-2xl border border-brand/20 bg-brand/5 flex flex-wrap items-center gap-3"
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          >
            <FiUser size={16} className="text-brand flex-shrink-0" />
            <p className="text-sm text-dark flex-1">Hai già un account? <a href="/auth/login" className="text-brand font-semibold hover:underline">Accedi</a> per salvare l&apos;ordine nel tuo profilo.</p>
            <span className="text-xs text-text-secondary">oppure continua come ospite qui sotto</span>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main */}
          <div className="lg:col-span-2">
            <div className="card p-6 md:p-8">
              <AnimatePresence mode="wait">
                {step === 0 && <AddressStep key="addr" data={address} onChange={setAddress} onNext={() => setStep(1)} />}
                {step === 1 && (
                  <ShippingStep
                    key="ship"
                    subtotal={subtotal}
                    selected={shippingMethod}
                    onSelect={setShippingMethod}
                    onNext={createOrder}
                    onBack={() => setStep(0)}
                  />
                )}
                {step === 2 && orderId && (
                  <PaymentStep
                    key="pay"
                    orderId={orderId}
                    totalAmount={total}
                    onSuccess={handlePaymentSuccess}
                    onBack={() => setStep(1)}
                  />
                )}
                {step === 3 && <SuccessStep key="done" orderId={orderId} orderNumber={orderNumber} isGuest={!user} />}
              </AnimatePresence>
              {creatingOrder && (
                <div className="flex items-center justify-center gap-3 py-4">
                  <span className="w-5 h-5 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
                  <span className="text-text-secondary text-sm">Creazione ordine...</span>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          {step < 3 && (
            <motion.div
              className="card p-6 h-fit sticky top-24"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            >
              <h3 className="font-heading font-bold text-dark text-base mb-4">{t('checkout.orderSummary')}</h3>
              <div className="space-y-3 mb-5">
                {items.map(item => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                      <img src={item.image_url || 'https://picsum.photos/seed/cart/100/100'} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm text-dark font-medium truncate">{item.product_name}</p>
                      <p className="text-text-secondary text-xs">Qtà: {item.quantity}</p>
                    </div>
                    <span className="font-heading font-semibold text-dark text-sm flex-shrink-0">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              {/* ── Redemption: loyalty points + gift card ── */}
              {step < 2 && (
                <div className="border-t border-gray-100 pt-4 space-y-3 mb-1">
                  {/* Loyalty points */}
                  {user && loyalty && loyalty.points >= minRedeem && (
                    <label className="flex items-start gap-2.5 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={usePoints}
                        onChange={e => setUsePoints(e.target.checked)}
                        className="mt-0.5 accent-brand w-4 h-4"
                      />
                      <span className="text-sm">
                        <span className="font-heading font-semibold text-dark flex items-center gap-1.5">
                          <FiAward size={13} className="text-brand" /> Usa {loyalty.points} punti
                        </span>
                        <span className="text-text-secondary text-xs">
                          Risparmi {formatPrice(loyalty.value)}
                        </span>
                      </span>
                    </label>
                  )}

                  {/* Gift card */}
                  {giftCard ? (
                    <div className="flex items-center justify-between bg-purple-50 rounded-xl p-2.5">
                      <span className="text-sm flex items-center gap-1.5 text-purple-700 font-heading font-semibold">
                        <FiGift size={13} /> {giftCard.code}
                      </span>
                      <button
                        onClick={() => { setGiftCard(null); setGiftCode(''); }}
                        className="text-purple-500 hover:text-red-500 transition-colors"
                      >
                        <FiX size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={giftCode}
                        onChange={e => setGiftCode(e.target.value.toUpperCase())}
                        placeholder="Gift card"
                        className="input flex-1 text-sm py-2 font-mono"
                        onKeyDown={e => e.key === 'Enter' && validateGiftCard()}
                      />
                      <button
                        onClick={validateGiftCard}
                        disabled={giftLoading || !giftCode.trim()}
                        className="btn btn-outline px-3 py-2 text-xs disabled:opacity-50"
                      >
                        {giftLoading ? '...' : 'Usa'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="border-t border-gray-100 pt-4 space-y-2">
                <div className="flex justify-between text-sm text-text-secondary">
                  <span>{t('cart.subtotal')}</span><span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-text-secondary">
                  <span>{t('cart.shipping')}</span>
                  <span>{shippingMethod?.is_free ? <span className="text-green-600">{t('cart.free')}</span> : formatPrice(shippingMethod?.price || 4.99)}</span>
                </div>
                <div className="flex justify-between text-sm text-text-secondary">
                  <span>IVA (22%)</span><span>{formatPrice(subtotal * 0.22)}</span>
                </div>
                {pointsDiscount > 0 && (
                  <div className="flex justify-between text-sm text-brand">
                    <span className="flex items-center gap-1"><FiAward size={11} /> Punti fedeltà</span>
                    <span>-{formatPrice(pointsDiscount)}</span>
                  </div>
                )}
                {giftDiscount > 0 && (
                  <div className="flex justify-between text-sm text-purple-600">
                    <span className="flex items-center gap-1"><FiGift size={11} /> Gift card</span>
                    <span>-{formatPrice(giftDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-heading font-bold text-dark border-t border-gray-100 pt-2 mt-2">
                  <span>{t('cart.total')}</span>
                  <span className="text-brand text-lg">{formatPrice(total)}</span>
                </div>
                {loyalty && total > 0 && (
                  <p className="text-text-secondary text-[11px] flex items-center gap-1 pt-1">
                    <FiAward size={10} className="text-brand" /> Guadagnerai {Math.floor(total)} punti con questo ordine
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

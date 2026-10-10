import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Storefront, { cartTotal, money } from './techgear/Storefront.jsx';
import { CheckoutLayout, Step, PayPanel, Busy, Alert, Receipt } from './techgear/Checkout.jsx';
import DevDrawer from './techgear/DevDrawer.jsx';
import { load, save, tracked, upsertCall } from './techgear/store.js';

// Hosted Checkout — Payment Page demo in the TechGear storefront.
//
// Flow: the backend creates a checkout session for the cart (INITIATE_CHECKOUT),
// checkout.min.js redirects the shopper to the gateway-hosted Payment Page, and the
// gateway sends them back to /ReceiptPage with a resultIndicator. The payment
// succeeded only if that resultIndicator equals the successIndicator returned when
// the session was created. The Payment Page's Back link uses the cancelUrl
// ("/?cancelled=1"), which reopens checkout with the order still in place.

const API_URL = (process.env.REACT_APP_API_BASE || 'https://hosted-checkout-backend-payment-pag.vercel.app').replace(/\/+$/, '') + '/';
const CHECKOUT_JS = 'https://mtf.gateway.mastercard.com/static/checkout/checkout.min.js';
const CURRENCY = 'USD';

// sessionStorage keys — the page is left for the gateway and reloaded on return.
const CART_KEY = 'tg.cart';
const ORDER_KEY = 'tg.order';   // snapshot of the order being paid
const CALLS_KEY = 'tg.calls';   // API log for the Developer view

const DEMO = {
  steps: ['Pick a product', 'Add it to your cart', 'Pay on the Mastercard Payment Page'],
  hint: 'Test card 5123 4500 0000 0008 · 01/39 · CVV 100',
};
const CTA = { mark: '→', title: 'Proceed to Checkout', sub: 'Pay on a secure Mastercard-hosted page' };

const FLOW = [
  { title: 'Create a checkout session', body: 'The merchant backend calls INITIATE_CHECKOUT with the order (items, amount, currency) and a returnUrl. The gateway returns a session id and a successIndicator.' },
  { title: 'Redirect to the Payment Page', body: 'The browser loads checkout.min.js, calls Checkout.configure({ session }) and then Checkout.showPaymentPage(), which sends the shopper to the gateway-hosted page.' },
  { title: 'Shopper pays', body: 'The shopper picks a payment method and pays. Card payments may go through 3-D Secure; in MTF the ACS emulator appears instead of a real bank.' },
  { title: 'Return and verify', body: 'The gateway redirects to the returnUrl with a resultIndicator. The merchant compares it with the successIndicator: a match means the payment succeeded.' },
];

// Load checkout.min.js fresh for each attempt so a previous session's
// configuration can't linger in window.Checkout.
function loadCheckoutJs() {
  return new Promise((resolve, reject) => {
    document.querySelectorAll(`script[src="${CHECKOUT_JS}"]`).forEach((s) => s.remove());
    delete window.Checkout;
    const s = document.createElement('script');
    s.src = CHECKOUT_JS;
    s.async = true;
    s.onload = () => (window.Checkout ? resolve() : reject(new Error('Checkout not defined after loading checkout.min.js')));
    s.onerror = () => reject(new Error('Could not load checkout.min.js'));
    document.head.appendChild(s);
  });
}

export default function PaymentPageDemo() {
  const location = useLocation();
  const navigate = useNavigate();
  const onReceipt = location.pathname.toLowerCase() === '/receiptpage';
  const cancelled = new URLSearchParams(location.search).has('cancelled');

  const [view, setView] = useState(() =>
    cancelled && load(ORDER_KEY, null) ? { page: 'checkout' } : { page: 'home' });
  const [cart, setCart] = useState(() => load(CART_KEY, []));
  const [order, setOrder] = useState(() => load(ORDER_KEY, null));
  const [calls, setCalls] = useState(() => load(CALLS_KEY, []));
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const [devOpen, setDevOpen] = useState(false);
  const [notice, setNotice] = useState(cancelled ? 'Payment cancelled. Your order is still here, so you can try again.' : null);

  // Drop ?cancelled=1 from the address bar once it has been read.
  useEffect(() => { if (cancelled) navigate('/', { replace: true }); }, [cancelled, navigate]);

  useEffect(() => save(CART_KEY, cart), [cart]);
  useEffect(() => save(CALLS_KEY, calls), [calls]);

  const record = (call) => setCalls((c) => upsertCall(c, call));

  function go(next) {
    if (onReceipt) navigate('/');
    setError(null);
    setNotice(null);
    setBusy(null);
    setView(next);
    window.scrollTo({ top: 0 });
  }

  function startCheckout() {
    const lines = cart.map((l) => ({ ...l }));
    setOrder({ lines, amount: cartTotal(cart).toFixed(2) });
    setCalls([]);
    setError(null);
    setNotice(null);
    setView({ page: 'checkout' });
    window.scrollTo({ top: 0 });
  }

  async function payOnPaymentPage() {
    setError(null);
    setNotice(null);
    try {
      setBusy('Creating checkout session…');
      const request = {
        items: order.lines.map(({ id, qty }) => ({ id, qty })),
        returnUrl: `${window.location.origin}/ReceiptPage`,
        cancelUrl: `${window.location.origin}/?cancelled=1`,
        responseFormat: 'json',
      };
      const res = await tracked(record, { method: 'POST', url: API_URL, label: 'Create checkout session (INITIATE_CHECKOUT)', request }, async () => {
        const r = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request) });
        const text = await r.text();
        let body;
        try { body = JSON.parse(text); } catch { body = { sessionId: text.trim() }; }  // older backend: bare session id
        if (!r.ok) throw Object.assign(new Error(body.error || `HTTP ${r.status}`), { status: r.status });
        return { status: r.status, body };
      });

      // Snapshot what the receipt needs before leaving the site.
      const placed = { ...order, ...res, amount: res.amount || order.amount };
      setOrder(placed);
      save(ORDER_KEY, placed);

      setBusy('Opening the Mastercard Payment Page…');
      await loadCheckoutJs();
      const config = { session: { id: res.sessionId } };
      window.Checkout.configure(config);
      record({ id: `js-${Date.now()}`, method: 'JS', url: 'checkout.min.js', label: 'Checkout.configure() → showPaymentPage()', request: config, status: 200, response: { redirect: 'gateway-hosted Payment Page' } });
      window.Checkout.showPaymentPage();
    } catch (e) {
      console.error(e);
      setBusy(null);
      setError(e.message);
    }
  }

  // ── Receipt (gateway redirected back) ──
  let page = null;
  if (onReceipt) {
    const params = new URLSearchParams(location.search);
    const resultIndicator = params.get('resultIndicator') || '';
    const placed = order || { lines: [], amount: null };
    // Without a stored successIndicator (e.g. storage blocked) fall back to the
    // presence of a resultIndicator, as the original demo did.
    const ok = placed.successIndicator ? resultIndicator === placed.successIndicator : Boolean(resultIndicator);
    page = (
      <Receipt
        ok={ok}
        message={ok
          ? 'Your payment was completed on the Mastercard Payment Page.'
          : 'The Payment Page did not report a successful payment. Your cart is still saved, so you can try again.'}
        details={[
          ['Order number', placed.orderId && <span className="tg-mono">{placed.orderId}</span>],
          ['Date', new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })],
          ['Payment', 'Hosted Checkout · Payment Page'],
          ['Result', <span className="tg-pill">{ok ? 'SUCCESS' : 'NOT VERIFIED'}</span>],
          ['Result indicator', resultIndicator && <span className="tg-mono">{resultIndicator}</span>],
        ]}
        lines={placed.lines}
        amount={placed.amount}
        currency={placed.currency || CURRENCY}
        onContinue={() => go({ page: 'home' })}
        onRetry={() => {
          // Put the unpaid items back if the cart was emptied in the meantime.
          if (!cart.length && placed.lines.length) setCart(placed.lines);
          go({ page: 'cart' });
        }}
        onOpenDev={() => setDevOpen(true)}
      />
    );
  } else if (view.page === 'checkout' && order) {
    page = (
      <CheckoutLayout lines={order.lines} amount={order.amount} currency={CURRENCY} onBack={() => go({ page: 'cart' })}>
        <Step num="01" title="Payment">
          <PayPanel mark="→" title="Mastercard Hosted Checkout" sub="Payment Page — pay on a secure Mastercard-hosted page" brands="Cards · Wallets · 3-D Secure">
            <div className="tg-c2p-body">
              {busy ? <Busy label={busy} /> : (
                <>
                  {notice && <div className="tg-notice">{notice}</div>}
                  <p className="tg-help">
                    You'll be taken to the Mastercard Payment Page to pay {money(Number(order.amount), CURRENCY)}, then brought back here for your confirmation.
                  </p>
                  <div className="tg-testcard">
                    <span className="tg-label">MTF test card</span>
                    <span className="tg-mono">5123 4500 0000 0008 · 01/39 · CVV 100</span>
                  </div>
                  <button className="tg-btn tg-btn--block" onClick={payOnPaymentPage}>Continue to secure payment</button>
                </>
              )}
              {error && <Alert title="We couldn't open the Payment Page." detail={error} onOpenDev={() => setDevOpen(true)} />}
            </div>
          </PayPanel>
        </Step>
      </CheckoutLayout>
    );
  }

  // Clear the cart once a verified payment lands on the receipt.
  const receiptOk = onReceipt && order?.successIndicator &&
    new URLSearchParams(location.search).get('resultIndicator') === order.successIndicator;
  useEffect(() => { if (receiptOk) setCart([]); }, [receiptOk]);

  const showDev = onReceipt || view.page === 'checkout';

  return (
    <Storefront
      view={onReceipt ? { page: 'receipt' } : view}
      go={go}
      cart={cart}
      setCart={setCart}
      currency={CURRENCY}
      onCheckout={startCheckout}
      demo={DEMO}
      checkoutCta={CTA}
    >
      {page && (
        <>
          {page}
          {showDev && (
            <DevDrawer
              open={devOpen}
              setOpen={setDevOpen}
              calls={calls}
              flow={FLOW}
              onClear={() => setCalls([])}
              info={[
                ['Amount', order?.amount && money(Number(order.amount), order.currency || CURRENCY)],
                ['Integration', 'Hosted Checkout · Payment Page'],
                ['Order ID', order?.orderId],
                ['Session ID', order?.sessionId],
              ]}
            />
          )}
        </>
      )}
    </Storefront>
  );
}

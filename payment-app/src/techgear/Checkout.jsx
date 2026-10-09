import React from 'react';
import { findProduct, money, Icon } from './Storefront.jsx';

// TechGear checkout + receipt building blocks, shared by the demo apps. Each demo
// supplies its own payment step; these components only handle layout.

export function Progress({ step }) {
  const steps = ['Cart', 'Checkout', 'Confirmation'];
  return (
    <ol className="tg-progress">
      {steps.map((label, i) => (
        <li key={label} className={i < step ? 'is-done' : i === step ? 'is-current' : ''}>
          <span className="tg-progress-num">{i < step ? <Icon name="check" /> : i + 1}</span>
          {label}
        </li>
      ))}
    </ol>
  );
}

export function OrderLines({ lines, currency }) {
  return (
    <ul className="tg-mini-lines">
      {lines.map((line) => {
        const p = findProduct(line.id);
        if (!p) return null;
        return (
          <li key={line.id}>
            <span className="tg-mini-img" style={{ backgroundImage: `url(${p.image})` }}>
              <span className="tg-mini-qty">{line.qty}</span>
            </span>
            <span className="tg-mini-name">{p.name}</span>
            <span className="tg-mini-price">{money(p.price * line.qty, currency)}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function Totals({ amount, currency }) {
  const total = Number(amount) || 0;
  return (
    <>
      <div className="tg-summary-row"><span>Subtotal</span><span>{money(total, currency)}</span></div>
      <div className="tg-summary-row"><span>Shipping</span><span className="tg-accent">Free</span></div>
      <div className="tg-summary-row tg-summary-row--total"><span>Total</span><span>{money(total, currency)}</span></div>
    </>
  );
}

export function Step({ num, title, children }) {
  return (
    <div className="tg-step">
      <div className="tg-step-head">
        <span className="tg-step-num">{num}</span>
        <h2>{title}</h2>
      </div>
      {children}
    </div>
  );
}

// Payment panel inside a step: branded header + body.
export function PayPanel({ mark, title, sub, brands, children }) {
  return (
    <div className="tg-c2p-panel">
      <div className="tg-c2p-head">
        <span className="tg-ctp-mark">{mark}</span>
        <div>
          <strong>{title}</strong>
          <small>{sub}</small>
        </div>
        {brands && <span className="tg-c2p-brands">{brands}</span>}
      </div>
      {children}
    </div>
  );
}

export function Busy({ label }) {
  return <div className="tg-busy"><span className="tg-spinner" /> {label}</div>;
}

export function Alert({ title, detail, onOpenDev }) {
  return (
    <div className="tg-alert">
      <strong>{title}</strong>
      {detail && <span className="tg-alert-detail">{detail}</span>}
      {onOpenDev && <button className="tg-link" onClick={onOpenDev}>See API calls <Icon name="north_east" /></button>}
    </div>
  );
}

// Checkout page shell: progress, title, the demo's steps (children), order summary.
export function CheckoutLayout({ lines, amount, currency, onBack, children }) {
  return (
    <section className="tg-wrap tg-checkout">
      <Progress step={1} />
      <div className="tg-checkout-grid">
        <div className="tg-checkout-main">
          <h1 className="tg-page-title">Checkout</h1>
          {children}
        </div>
        <aside className="tg-summary">
          <h3>Order Summary</h3>
          <OrderLines lines={lines} currency={currency} />
          <Totals amount={amount} currency={currency} />
          <button className="tg-link tg-summary-back" onClick={onBack}>
            <Icon name="arrow_back" /> Back to cart
          </button>
          <p className="tg-secure"><Icon name="lock" /> Secure checkout · Mastercard Gateway</p>
        </aside>
      </div>
    </section>
  );
}

// Receipt page. `details` is a list of [label, value] rows; `ok` picks the
// approved / not-approved variant.
export function Receipt({ ok, message, details, lines, amount, currency, onContinue, onRetry, onOpenDev }) {
  return (
    <section className="tg-wrap tg-receipt">
      <Progress step={ok ? 3 : 2} />

      <div className="tg-receipt-hero">
        <span className={`tg-receipt-icon ${ok ? '' : 'is-failed'}`}><Icon name={ok ? 'check' : 'close'} /></span>
        <span className="tg-eyebrow"><span className="tg-dot" />{ok ? 'Order confirmed' : 'Payment not completed'}</span>
        {ok
          ? <h1>Thank you for <em>your order</em></h1>
          : <h1>Your payment <em>didn't go through</em></h1>}
        <p className="tg-muted">{message}</p>
      </div>

      <div className="tg-receipt-grid">
        <div className="tg-receipt-card">
          <h3>Order Details</h3>
          <dl className="tg-specs">
            {details.filter(([, v]) => v).map(([k, v]) => (
              <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
            ))}
          </dl>
        </div>
        {lines.length > 0 && (
          <div className="tg-receipt-card">
            <h3>Items</h3>
            <OrderLines lines={lines} currency={currency} />
            <Totals amount={amount} currency={currency} />
          </div>
        )}
      </div>

      <div className="tg-receipt-actions">
        {!ok && onRetry && <button className="tg-btn" onClick={onRetry}>Back to cart</button>}
        <button className={`tg-btn ${ok ? '' : 'tg-btn--outline'}`} onClick={onContinue}>Continue Shopping</button>
        {onOpenDev && (
          <button className="tg-btn tg-btn--outline" onClick={onOpenDev}>
            <Icon name="code" /> View API calls
          </button>
        )}
      </div>
    </section>
  );
}

import React, { useState } from 'react';
import { Icon } from './Storefront.jsx';

// "Developer view" — slide-out drawer with the API calls behind the checkout and a
// short description of the flow. Shared by the demo apps.
//   calls — [{ id, method, url, status, ms, request, response, label }]
//   info  — [[label, value], ...] shown as a grid at the top (empty values hidden)
//   flow  — [{ title, body }] numbered steps for the "How it works" tab
//   extraTab — optional { label, content } for demo-specific tools (e.g. webhooks)

function CallRow({ call }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('request');
  const ok = call.status >= 200 && call.status < 300;
  const pending = call.status == null;
  return (
    <div className={`tg-call ${pending ? 'is-pending' : ok ? 'is-ok' : 'is-err'}`}>
      <button className="tg-call-head" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="tg-call-method">{call.method}</span>
        <span className="tg-call-url">
          {call.label && <strong>{call.label}</strong>}
          <span>{call.url}</span>
        </span>
        <span className="tg-call-status">{pending ? '…' : call.status}</span>
        {call.ms != null && <span className="tg-call-ms">{call.ms}ms</span>}
        <Icon name={open ? 'expand_less' : 'expand_more'} />
      </button>
      {open && (
        <div className="tg-call-body">
          <div className="tg-call-tabs">
            <button className={tab === 'request' ? 'is-on' : ''} onClick={() => setTab('request')}>Request</button>
            <button className={tab === 'response' ? 'is-on' : ''} onClick={() => setTab('response')}>Response</button>
          </div>
          <pre>{JSON.stringify(tab === 'request' ? call.request : call.response, null, 2) ?? '(no body)'}</pre>
        </div>
      )}
    </div>
  );
}

export default function DevDrawer({ open, setOpen, calls, info = [], flow = [], extraTab, onClear }) {
  const [tab, setTab] = useState('network');

  return (
    <>
      <button className="tg-devtab" onClick={() => setOpen(true)} aria-label="Open developer view">
        <Icon name="code" /> <span className="tg-devtab-label">Developer view</span>
        {calls.length > 0 && <span className="tg-devtab-count">{calls.length}</span>}
      </button>
      <div className={`tg-drawer-backdrop ${open ? 'is-open' : ''}`} onClick={() => setOpen(false)} />
      <aside className={`tg-drawer ${open ? 'is-open' : ''}`} aria-hidden={!open} aria-label="Developer view">
        <div className="tg-drawer-head">
          <div>
            <span className="tg-label">Developer view</span>
            <h3>Behind the checkout</h3>
          </div>
          <button className="tg-icon-btn" onClick={() => setOpen(false)} aria-label="Close developer view">
            <Icon name="close" />
          </button>
        </div>
        {info.some(([, v]) => v) && (
          <dl className="tg-drawer-meta">
            {info.filter(([, v]) => v).map(([k, v]) => (
              <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
            ))}
          </dl>
        )}
        <div className="tg-drawer-tabs" role="tablist">
          <button role="tab" aria-selected={tab === 'network'} className={tab === 'network' ? 'is-on' : ''} onClick={() => setTab('network')}>
            Network calls
          </button>
          {flow.length > 0 && (
            <button role="tab" aria-selected={tab === 'flow'} className={tab === 'flow' ? 'is-on' : ''} onClick={() => setTab('flow')}>
              How it works
            </button>
          )}
          {extraTab && (
            <button role="tab" aria-selected={tab === 'extra'} className={tab === 'extra' ? 'is-on' : ''} onClick={() => setTab('extra')}>
              {extraTab.label}
            </button>
          )}
        </div>
        <div className="tg-drawer-body">
          {tab === 'network' && (
            <div className="tg-calls">
              {calls.length === 0
                ? <p className="tg-calls-empty">No API calls yet. They appear here once checkout starts.</p>
                : calls.map((c) => <CallRow key={c.id} call={c} />)}
              {calls.length > 0 && onClear && (
                <button className="tg-link tg-calls-clear" onClick={onClear}>Clear log</button>
              )}
            </div>
          )}
          {tab === 'flow' && (
            <ol className="tg-flow">
              {flow.map((f, i) => (
                <li key={f.title}>
                  <span className="tg-flow-num">{String(i + 1).padStart(2, '0')}</span>
                  <div><strong>{f.title}</strong><p>{f.body}</p></div>
                </li>
              ))}
            </ol>
          )}
          {tab === 'extra' && extraTab && <div className="tg-drawer-extra">{extraTab.content}</div>}
        </div>
      </aside>
    </>
  );
}

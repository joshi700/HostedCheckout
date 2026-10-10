import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PaymentPageDemo from './PaymentPageDemo.jsx';
import './techgear/storefront.css';

// "/" is the TechGear store and checkout; the gateway returns the shopper to
// "/ReceiptPage" (the returnUrl) after paying on the hosted Payment Page.
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/ReceiptPage" element={<PaymentPageDemo />} />
        <Route path="*" element={<PaymentPageDemo />} />
      </Routes>
    </Router>
  );
}

export default App;

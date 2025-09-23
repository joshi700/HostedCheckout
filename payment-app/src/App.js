import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentSession, setPaymentSession] = useState(null);
  const [isCheckoutReady, setIsCheckoutReady] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [error, setError] = useState(null);
  const [scriptKey, setScriptKey] = useState(0); // Force script reload

  // Load/reload Mastercard Checkout script - reload for each new session
  useEffect(() => {
    // Remove any existing checkout script first
    const existingScript = document.querySelector('script[src*="checkout.min.js"]');
    if (existingScript) {
      existingScript.remove();
      console.log('Removed existing checkout script');
      // Clear the global Checkout object
      delete window.Checkout;
    }

    const script = document.createElement('script');
    script.src = 'https://mtf.gateway.mastercard.com/static/checkout/checkout.min.js';
    script.async = true;
    script.onload = () => {
      console.log('Checkout script loaded successfully');
      setIsCheckoutReady(true);
    };
    script.onerror = () => {
      console.error('Failed to load checkout script');
      setError('Failed to load payment system. Please refresh and try again.');
    };
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [scriptKey]); // Depend on scriptKey to force reload

  // Configure checkout when script is loaded and session is available
  useEffect(() => {
    if (isCheckoutReady && window.Checkout && paymentSession && showCheckout) {
      console.log('Configuring checkout with session:', paymentSession);
      console.log('Session length:', paymentSession.length);
      console.log('Session starts with SESSION:', paymentSession.startsWith('SESSION'));
      
      try {
        // IMPORTANT: Add delay to ensure script is fully ready
        setTimeout(() => {
          // Clear any existing checkout configuration first
          if (window.Checkout.configure) {
            console.log('Clearing previous checkout configuration...');
          }
          
          // Configure Checkout - version 67+ only allows session object
          const config = {
            session: {
              id: paymentSession
            }
          };
          
          console.log('Configuration object:', config);
          window.Checkout.configure(config);
          console.log('Configuration completed successfully with session:', paymentSession);
        }, 100); // Small delay to ensure fresh script state
        
      } catch (configError) {
        console.error('Error configuring checkout:', configError);
        setError('Failed to configure payment system: ' + configError.message);
      }
    }
  }, [isCheckoutReady, paymentSession, showCheckout]);

  // Handle showing embedded page when checkout page is displayed
  useEffect(() => {
    if (showCheckout && isCheckoutReady && window.Checkout && paymentSession) {
      console.log('Checkout page shown - displaying embedded checkout form');
      
      setTimeout(() => {
        try {
          console.log('About to call showEmbeddedPage with session:', paymentSession);
          console.log('Checkout object available:', !!window.Checkout);
          console.log('Element #hco-embedded exists:', !!document.getElementById('hco-embedded'));
          
          // Try the showEmbeddedPage call with error handling
          window.Checkout.showEmbeddedPage('#hco-embedded', {
            error: function(error) {
              console.error('showEmbeddedPage error:', error);
              setError('Checkout form error: ' + (error || 'Invalid request'));
            },
            success: function() {
              console.log('Checkout form loaded successfully');
            }
          });
        } catch (showError) {
          console.error('Exception showing embedded page:', showError);
          setError('Failed to display payment form: ' + showError.message);
        }
      }, 500); // Increased delay to ensure configuration is complete
    }
  }, [showCheckout, isCheckoutReady, paymentSession]);

  // Function to call the API and get session ID
  const getSessionId = async () => {
    setIsLoadingSession(true);
    setError(null);
    
    try {
      const response = await fetch('https://hosted-checkout-backend-jo7a.vercel.app', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.text();
      console.log('Session ID received:', data);
      
      return data;
    } catch (error) {
      console.error('Error fetching session ID:', error);
      setError('Failed to get session ID. Please try again.');
      throw error;
    } finally {
      setIsLoadingSession(false);
    }
  };

  const openCheckoutPage = async () => {
    try {
      // STEP 1: Clear all previous state first
      console.log('Clearing all previous checkout state...');
      setPaymentSession(null);
      setError(null);
      setShowCheckout(false);
      setIsCheckoutReady(false);
      
      // STEP 2: Clear sessionStorage and any cached data
      if (typeof(Storage) !== "undefined") {
        sessionStorage.clear();
      }
      
      // STEP 3: Remove any existing embedded content
      const embeddedElement = document.getElementById('hco-embedded');
      if (embeddedElement) {
        embeddedElement.innerHTML = '';
      }
      
      // STEP 4: Force complete script reload with new key
      setScriptKey(prev => prev + 1);
      
      // STEP 5: Wait a moment for cleanup to complete
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // STEP 6: Get new session ID from API
      const sessionId = await getSessionId();
      
      // STEP 7: Set the new session ID and show checkout
      const trimmedSessionId = sessionId.trim();
      console.log('Setting NEW session ID:', trimmedSessionId);
      setPaymentSession(trimmedSessionId);
      setShowCheckout(true);
      
    } catch (error) {
      console.error('Failed to open checkout page:', error);
    }
  };

  const closeCheckoutPage = () => {
    console.log('Checkout page closing - clearing session storage');
    
    // Clear sessionStorage as per integration guide
    if (typeof(Storage) !== "undefined") {
      sessionStorage.clear();
    }
    
    // Clear any cached checkout configuration
    if (window.Checkout) {
      try {
        // Force cleanup of the checkout instance
        console.log('Attempting to reset checkout configuration...');
        
        // Remove any existing embedded content
        const embeddedElement = document.getElementById('hco-embedded');
        if (embeddedElement) {
          embeddedElement.innerHTML = '';
        }
      } catch (cleanupError) {
        console.log('Cleanup error (non-critical):', cleanupError);
      }
    }
    
    setShowCheckout(false);
    setPaymentSession(null);
    setError(null);
  };

  // If showing checkout, render full-page checkout
  if (showCheckout) {
    return (
      <div className="checkout-fullpage">
        <div className="checkout-header">
          <div className="checkout-header-content">
            <h1>Complete Your Payment</h1>
            <button onClick={closeCheckoutPage} className="back-button">
              ← Back to Home
            </button>
          </div>
        </div>
        
        {error && (
          <div className="error-message">
            <p>⚠️ {error}</p>
          </div>
        )}

        <div className="checkout-container-fullpage">
          <div id="hco-embedded" className="checkout-embedded">
            {(!paymentSession || !isCheckoutReady) && (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading payment form...</p>
                {paymentSession && (
                  <p className="session-info">Session: {paymentSession}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default home page view
  return (
    <div className="App">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <h1>Payment App</h1>
          <div className="security-badge">
            <span>🔒 Secure Payments</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        <div className="hero-section">
          <h2>Secure Payment Processing</h2>
          <p>Experience seamless and secure transactions with Mastercard's advanced payment gateway</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <p>⚠️ {error}</p>
          </div>
        )}

        {/* Payment Card */}
        <div className="payment-card">
          <div className="payment-header">
            <div>
              <h3>Premium Service</h3>
              <p>Complete your purchase securely</p>
            </div>
            <div className="price-section">
              <div className="price">$99.99</div>
              <div className="price-subtitle">One-time payment</div>
            </div>
          </div>

          <div className="features-grid">
            <div className="features-list">
              <div className="feature-item">
                <span className="checkmark">✓</span>
                <span>SSL Encrypted</span>
              </div>
              <div className="feature-item">
                <span className="checkmark">✓</span>
                <span>PCI Compliant</span>
              </div>
              <div className="feature-item">
                <span className="checkmark">✓</span>
                <span>Instant Processing</span>
              </div>
            </div>
            <div className="mastercard-logo">
              <div className="logo-card">Mastercard</div>
            </div>
          </div>

          <button 
            onClick={openCheckoutPage} 
            className="payment-button"
            disabled={isLoadingSession}
          >
            {isLoadingSession ? (
              <>
                <div className="button-spinner"></div>
                <span>Getting Session...</span>
              </>
            ) : (
              <>
                💳 <span>Proceed to Checkout</span>
              </>
            )}
          </button>

          {/* Debug information */}
          {paymentSession && (
            <div style={{marginTop: '10px', fontSize: '12px', color: '#666'}}>
              <strong>Debug:</strong> Session loaded: {paymentSession}
            </div>
          )}
        </div>

        {/* Features */}
        <div className="features-section">
          <div className="feature-column">
            <div className="feature-icon">🛡️</div>
            <h4>Bank-Level Security</h4>
            <p>Your data is protected with enterprise-grade encryption</p>
          </div>
          <div className="feature-column">
            <div className="feature-icon">⚡</div>
            <h4>Lightning Fast</h4>
            <p>Process payments in seconds, not minutes</p>
          </div>
          <div className="feature-column">
            <div className="feature-icon">🌍</div>
            <h4>Global Acceptance</h4>
            <p>Accepted worldwide with multiple currency support</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;

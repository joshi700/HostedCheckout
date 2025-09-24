import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
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
    if (isCheckoutReady && window.Checkout && paymentSession) {
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
  }, [isCheckoutReady, paymentSession]);

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
      setIsCheckoutReady(false);
      
      // STEP 2: Clear sessionStorage and any cached data
      if (typeof(Storage) !== "undefined") {
        sessionStorage.clear();
      }
      
      // STEP 3: Force complete script reload with new key
      setScriptKey(prev => prev + 1);
      
      // STEP 4: Wait a moment for cleanup to complete
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // STEP 5: Get new session ID from API
      const sessionId = await getSessionId();
      
      // STEP 6: Set the new session ID - this will trigger configuration
      const trimmedSessionId = sessionId.trim();
      console.log('Setting NEW session ID:', trimmedSessionId);
      setPaymentSession(trimmedSessionId);
      
      // STEP 7: Wait for configuration to complete, then show payment page
      setTimeout(() => {
        if (window.Checkout && isCheckoutReady) {
          try {
            console.log('About to call showPaymentPage with session:', trimmedSessionId);
            console.log('Checkout object available:', !!window.Checkout);
            
            // Show the payment page (opens in new window/popup)
            window.Checkout.showPaymentPage();
            console.log('Payment page opened successfully');
            
          } catch (showError) {
            console.error('Exception showing payment page:', showError);
            setError('Failed to display payment page: ' + showError.message);
          }
        } else {
          setError('Checkout system not ready. Please try again.');
        }
      }, 600); // Wait for configuration to complete
      
    } catch (error) {
      console.error('Failed to open checkout page:', error);
    }
  };

  // Default home page view - no more embedded checkout
  return (
    <div className="App">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <h1>Hosted Checkout</h1>
          <div className="security-badge">
            <span>🔒 Secure Payments</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">


        {/* Error Message */}
        {error && (
          <div className="error-message">
            <p>⚠️ {error}</p>
          </div>
        )}

        {/* Payment Card */}
        <div className="payment-card">
          <div className="payment-header">
            <div className="price-section">
              <div className="price">Demo Payment of Hosted Checkout Product - $99.99</div>
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


      </main>
    </div>
  );
}

export default App;

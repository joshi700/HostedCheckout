import React, { useState, useEffect } from 'react';

function ReceiptPage() {
  const [receiptData, setReceiptData] = useState({
    resultIndicator: '',
    sessionVersion: '',
    checkoutVersion: '',
    orderAmount: '$99.99', // Default amount from your main app
    orderId: '',
    transactionStatus: '',
    transactionId: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Parse URL parameters when component mounts
    const urlParams = new URLSearchParams(window.location.search);
    
    const resultIndicator = urlParams.get('resultIndicator') || '';
    const sessionVersion = urlParams.get('sessionVersion') || '';
    const checkoutVersion = urlParams.get('checkoutVersion') || '';
    const orderId = urlParams.get('orderId') || 'ORDERtesting4'; // Default from your config
    
    // Update state with parsed parameters
    setReceiptData(prev => ({
      ...prev,
      resultIndicator,
      sessionVersion,
      checkoutVersion,
      orderId
    }));

    // Simulate transaction status based on resultIndicator
    // In real implementation, you'd verify this with your backend
    if (resultIndicator) {
      // Simple status determination - you should verify this server-side
      const isSuccess = resultIndicator.includes('SUCCESS') || resultIndicator.length > 0;
      setReceiptData(prev => ({
        ...prev,
        transactionStatus: isSuccess ? 'SUCCESS' : 'FAILED',
        transactionId: `TXN_${Date.now()}_${resultIndicator.substring(0, 8)}`
      }));
    }

    setLoading(false);
  }, []);

  const handleReturnHome = () => {
    // Navigate back to main app or reload
    window.location.href = '/';
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #3498db',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            animation: 'spin 2s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p>Processing receipt...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      maxWidth: '600px',
      margin: '0 auto',
      padding: '20px',
      backgroundColor: '#f8f9fa',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: '48px',
          marginBottom: '10px'
        }}>
          {receiptData.transactionStatus === 'SUCCESS' ? '✅' : '❌'}
        </div>
        <h1 style={{
          color: receiptData.transactionStatus === 'SUCCESS' ? '#28a745' : '#dc3545',
          margin: '0 0 10px 0'
        }}>
          Payment {receiptData.transactionStatus === 'SUCCESS' ? 'Successful' : 'Failed'}
        </h1>
        <p style={{ color: '#666', margin: 0 }}>
          {receiptData.transactionStatus === 'SUCCESS' 
            ? 'Your transaction has been processed successfully'
            : 'There was an issue processing your payment'
          }
        </p>
      </div>

      {/* Receipt Details */}
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <h2 style={{ 
          borderBottom: '2px solid #eee', 
          paddingBottom: '10px',
          marginTop: 0,
          color: '#333'
        }}>
          Receipt Details
        </h2>
        
        <div style={{ marginBottom: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontWeight: 'bold' }}>Amount:</span>
            <span style={{ fontSize: '18px', color: '#28a745', fontWeight: 'bold' }}>
              {receiptData.orderAmount}
            </span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontWeight: 'bold' }}>Order ID:</span>
            <span>{receiptData.orderId}</span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontWeight: 'bold' }}>Transaction ID:</span>
            <span>{receiptData.transactionId}</span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontWeight: 'bold' }}>Date:</span>
            <span>{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontWeight: 'bold' }}>Status:</span>
            <span style={{ 
              color: receiptData.transactionStatus === 'SUCCESS' ? '#28a745' : '#dc3545',
              fontWeight: 'bold'
            }}>
              {receiptData.transactionStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Technical Details (for debugging) */}
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <h3 style={{ 
          borderBottom: '1px solid #eee', 
          paddingBottom: '10px',
          marginTop: 0,
          color: '#666',
          fontSize: '16px'
        }}>
          Technical Details
        </h3>
        
        <div style={{ fontSize: '14px', color: '#666' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Result Indicator:</span>
            <span style={{ fontFamily: 'monospace', backgroundColor: '#f8f9fa', padding: '2px 6px', borderRadius: '3px' }}>
              {receiptData.resultIndicator || 'N/A'}
            </span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Session Version:</span>
            <span style={{ fontFamily: 'monospace', backgroundColor: '#f8f9fa', padding: '2px 6px', borderRadius: '3px' }}>
              {receiptData.sessionVersion || 'N/A'}
            </span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Checkout Version:</span>
            <span style={{ fontFamily: 'monospace', backgroundColor: '#f8f9fa', padding: '2px 6px', borderRadius: '3px' }}>
              {receiptData.checkoutVersion || 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: '15px',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={handlePrintReceipt}
          style={{
            flex: 1,
            padding: '15px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            fontSize: '16px',
            cursor: 'pointer',
            transition: 'background-color 0.3s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#0056b3'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#007bff'}
        >
          🖨️ Print Receipt
        </button>
        
        <button
          onClick={handleReturnHome}
          style={{
            flex: 1,
            padding: '15px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            fontSize: '16px',
            cursor: 'pointer',
            transition: 'background-color 0.3s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#1e7e34'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#28a745'}
        >
          🏠 Return to Home
        </button>
      </div>

      {/* Security Notice */}
      <div style={{
        marginTop: '30px',
        padding: '20px',
        backgroundColor: '#e9ecef',
        borderRadius: '5px',
        fontSize: '14px',
        color: '#666',
        textAlign: 'center'
      }}>
        🔒 This transaction was processed securely through Mastercard's encrypted payment gateway. 
        Please keep this receipt for your records.
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media print {
          body { margin: 0; }
          button { display: none !important; }
        }
        
        @media (max-width: 600px) {
          div[style*="flex"] button {
            flex: none !important;
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}

export default ReceiptPage;

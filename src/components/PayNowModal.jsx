import React, { useState, useEffect } from 'react';

export default function PayNowModal({ open, onClose, onSubmit, fee }) {
  const [payMethod, setPayMethod] = useState('UPI');
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState('');

  useEffect(() => {
    if (fee) {
      setAmount(fee.dueAmount !== undefined ? fee.dueAmount : fee.amount || '');
    } else {
      setAmount('800');
    }
    setPaymentDate(new Date().toISOString().split('T')[0]);
  }, [fee, open]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(payMethod, amount, paymentDate);
  };

  const displayMonthYear = fee ? `${fee.month}/${fee.year}` : 'Current Month';

  return (
    <div className={`modal-overlay ${open ? 'open' : ''}`} onClick={(e) => { if(e.target.classList.contains('modal-overlay')) onClose(); }}>
      <div className="modal-card" style={{ maxWidth: '420px' }}>
        <div className="modal-head">
          <div>
            <h3 className="modal-title">Pay subscription</h3>
            <div className="modal-sub">{displayMonthYear} · Sunrise Reading Room</div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="field">
              <label>Amount to Pay (₹)</label>
              <input 
                type="number" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                required 
                style={{ fontWeight: 600 }} 
              />
            </div>
            
            <div className="field">
              <label>Pay using</label>
              <div className="ob-check-row" style={{ marginBottom: 0, flexWrap: 'wrap', gap: '8px' }}>
                {['UPI', 'Card', 'Netbanking', 'Cash'].map((method) => (
                  <label className="ob-check" key={method} style={{ margin: 0 }}>
                    <input
                      type="radio"
                      name="pay-method"
                      value={method}
                      checked={payMethod === method}
                      onChange={() => setPayMethod(method)}
                    />
                    <span>{method}</span>
                  </label>
                ))}
              </div>
            </div>

            {payMethod === 'Cash' && (
              <div className="field">
                <label>Payment Date</label>
                <input 
                  type="date" 
                  value={paymentDate} 
                  onChange={(e) => setPaymentDate(e.target.value)} 
                  required 
                />
              </div>
            )}
          </div>
          <div className="modal-foot">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Pay ₹{amount}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

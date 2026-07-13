import React, { useState, useEffect } from 'react';

export default function PayNowModal({ open, onClose, onSubmit, fee }) {
  const [payMethod, setPayMethod] = useState('UPI');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (fee) {
      setAmount(fee.dueAmount !== undefined ? fee.dueAmount : fee.amount || '');
    } else {
      setAmount('800');
    }
  }, [fee, open]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(payMethod, amount);
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
          <div className="modal-body">
            <div className="field span-2" style={{ marginBottom: '20px' }}>
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
              <div className="ob-check-row" style={{ marginBottom: 0 }}>
                {['UPI', 'Card', 'Netbanking'].map((method) => (
                  <label className="ob-check" key={method}>
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

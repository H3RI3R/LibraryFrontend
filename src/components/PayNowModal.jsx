import React, { useState } from 'react';

export default function PayNowModal({ open, onClose, onSubmit }) {
  const [payMethod, setPayMethod] = useState('UPI');

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(payMethod);
  };

  return (
    <div className={`modal-overlay ${open ? 'open' : ''}`} onClick={(e) => { if(e.target.classList.contains('modal-overlay')) onClose(); }}>
      <div className="modal-card" style={{ maxWidth: '420px' }}>
        <div className="modal-head">
          <div>
            <h3 className="modal-title">Pay subscription</h3>
            <div className="modal-sub">July 2026 · Sunrise Reading Room</div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="field span-2" style={{ marginBottom: '20px' }}>
              <label>Amount</label>
              <input type="text" value="₹800" disabled style={{ background: 'var(--paper-deep)', fontWeight: 600 }} />
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
            <button type="submit" className="btn btn-primary">Pay ₹800</button>
          </div>
        </form>
      </div>
    </div>
  );
}

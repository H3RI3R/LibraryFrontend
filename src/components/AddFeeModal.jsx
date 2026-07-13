import React, { useState, useEffect } from 'react';

export default function AddFeeModal({ open, onClose, onSubmit, students }) {
  const [studentId, setStudentId] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [amount, setAmount] = useState(800);
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (open) {
      if (students && students.length > 0) {
        setStudentId(students[0].id);
      }
      setMonth(new Date().getMonth() + 1);
      setYear(new Date().getFullYear());
      setAmount(800);
      setDueDate(new Date().toISOString().slice(0, 10));
    }
  }, [open, students]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!studentId) {
      alert('Please select a student.');
      return;
    }
    onSubmit({
      studentId,
      month,
      year,
      amount,
      dueDate
    });
  };

  return (
    <div className={`modal-overlay ${open ? 'open' : ''}`} onClick={(e) => { if (e.target.classList.contains('modal-overlay')) onClose(); }}>
      <div className="modal-card" style={{ maxWidth: '480px' }}>
        <div className="modal-head">
          <div>
            <h3 className="modal-title">Create Fee Record</h3>
            <div className="modal-sub">Generate a manual monthly fee invoice for a student.</div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ padding: '20px' }}>
            <div className="form-grid" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div className="field">
                <label>Select Student</label>
                <select value={studentId} onChange={(e) => setStudentId(e.target.value)}>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.mobile})</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="field">
                  <label>Month (1-12)</label>
                  <input type="number" min="1" max="12" value={month} onChange={(e) => setMonth(parseInt(e.target.value))} required />
                </div>
                <div className="field">
                  <label>Year</label>
                  <input type="number" min="2020" max="2100" value={year} onChange={(e) => setYear(parseInt(e.target.value))} required />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="field">
                  <label>Amount (₹)</label>
                  <input type="number" min="0" value={amount} onChange={(e) => setAmount(parseFloat(e.target.value))} required />
                </div>
                <div className="field">
                  <label>Due Date</label>
                  <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
                </div>
              </div>
            </div>
          </div>
          <div className="modal-foot">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Invoice</button>
          </div>
        </form>
      </div>
    </div>
  );
}

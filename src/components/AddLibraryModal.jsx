import React, { useState, useEffect } from 'react';

export default function AddLibraryModal({ open, onClose, onSubmit }) {
  const [libraryName, setLibraryName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  
  const [shifts, setShifts] = useState({
    Morning: true,
    Afternoon: false,
    Evening: false,
    'Full day': false
  });
  
  const shiftTimings = {
    Morning: '07:00 – 14:00',
    Afternoon: '12:00 – 18:00',
    Evening: '14:00 – 21:00',
    'Full day': '07:00 – 21:00'
  };

  const [workingDays, setWorkingDays] = useState({
    Monday: true,
    Tuesday: true,
    Wednesday: true,
    Thursday: true,
    Friday: true,
    Saturday: true,
    Sunday: true
  });

  const [totalSeats, setTotalSeats] = useState(60);
  const [monthlyFee, setMonthlyFee] = useState(800);
  const [dueDay, setDueDay] = useState(5);

  useEffect(() => {
    if (open) {
      setLibraryName('');
      setAddress('');
      setCity('');
      setState('');
      setShifts({ Morning: true, Afternoon: false, Evening: false, 'Full day': false });
      setWorkingDays({ Monday: true, Tuesday: true, Wednesday: true, Thursday: true, Friday: true, Saturday: true, Sunday: true });
      setTotalSeats(60);
      setMonthlyFee(800);
      setDueDay(5);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!libraryName || !address || !city || !state) {
      alert('Please fill in all required fields.');
      return;
    }
    
    // Format shifts: e.g. "Morning (07:00 – 14:00),Afternoon (12:00 – 18:00)"
    const shiftsStr = Object.keys(shifts)
      .filter(k => shifts[k])
      .map(k => `${k} (${shiftTimings[k]})`)
      .join(',');

    if (!shiftsStr) {
      alert('Please select at least one shift.');
      return;
    }

    // Format working days: e.g. "Monday,Tuesday,Wednesday"
    const workingDaysStr = Object.keys(workingDays)
      .filter(k => workingDays[k])
      .join(',');

    if (!workingDaysStr) {
      alert('Please select at least one working day.');
      return;
    }

    onSubmit({
      libraryName,
      address,
      city,
      state,
      shifts: shiftsStr,
      workingDays: workingDaysStr,
      totalSeats,
      monthlyFee,
      dueDay
    });
  };

  const handleShiftChange = (key) => {
    setShifts(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDayChange = (key) => {
    setWorkingDays(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className={`modal-overlay ${open ? 'open' : ''}`} onClick={(e) => { if (e.target.classList.contains('modal-overlay')) onClose(); }}>
      <div className="modal-card" style={{ maxWidth: '580px', width: '90%' }}>
        <div className="modal-head">
          <div>
            <h3 className="modal-title">Add New Library</h3>
            <div className="modal-sub">Create another library branch under your ongoing active subscription plan.</div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ padding: '20px', maxHeight: '70vh', overflowY: 'auto' }}>
            <div className="form-grid" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              
              <div className="field">
                <label>Library Name *</label>
                <input type="text" value={libraryName} onChange={(e) => setLibraryName(e.target.value)} placeholder="e.g. Oxford Study Center" required />
              </div>

              <div className="field">
                <label>Address *</label>
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. 1st Floor, Metro Plaza" required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="field">
                  <label>City *</label>
                  <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. New Delhi" required />
                </div>
                <div className="field">
                  <label>State *</label>
                  <input type="text" value={state} onChange={(e) => setState(e.target.value)} placeholder="e.g. Delhi" required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                <div className="field">
                  <label>Total Seats *</label>
                  <input type="number" min="1" value={totalSeats} onChange={(e) => setTotalSeats(parseInt(e.target.value))} required />
                </div>
                <div className="field">
                  <label>Monthly Fee (₹) *</label>
                  <input type="number" min="0" value={monthlyFee} onChange={(e) => setMonthlyFee(parseFloat(e.target.value))} required />
                </div>
                <div className="field">
                  <label>Fee Due Day (1-28) *</label>
                  <input type="number" min="1" max="28" value={dueDay} onChange={(e) => setDueDay(parseInt(e.target.value))} required />
                </div>
              </div>

              <div className="field">
                <label style={{ marginBottom: '8px', display: 'block' }}>Operating Shifts *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {Object.keys(shifts).map(key => (
                    <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'normal', fontSize: '13px' }}>
                      <input type="checkbox" checked={shifts[key]} onChange={() => handleShiftChange(key)} />
                      <span>{key} <span style={{ color: 'var(--muted)', fontSize: '11px' }}>({shiftTimings[key]})</span></span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="field">
                <label style={{ marginBottom: '8px', display: 'block' }}>Working Days *</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  {Object.keys(workingDays).map(day => (
                    <label key={day} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 'normal', fontSize: '12px' }}>
                      <input type="checkbox" checked={workingDays[day]} onChange={() => handleDayChange(day)} />
                      <span>{day.substring(0, 3)}</span>
                    </label>
                  ))}
                </div>
              </div>

            </div>
          </div>
          <div className="modal-foot">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Library</button>
          </div>
        </form>
      </div>
    </div>
  );
}

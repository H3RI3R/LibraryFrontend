import React, { useState, useEffect } from 'react';

export default function AddStudentModal({ open, onClose, onSubmit, vacantSeats }) {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [joined, setJoined] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentMobile, setParentMobile] = useState('');
  const [address, setAddress] = useState('');
  const [shift, setShift] = useState('Morning');
  const [seat, setSeat] = useState('');
  const [status, setStatus] = useState('active');

  useEffect(() => {
    if (open) {
      setName('');
      setMobile('');
      setJoined(new Date().toISOString().slice(0, 10));
      setParentName('');
      setParentMobile('');
      setAddress('');
      setShift('Morning');
      setStatus('active');
    }
  }, [open]);

  useEffect(() => {
    if (vacantSeats && vacantSeats.length > 0) {
      setSeat(vacantSeats[0].label);
    } else {
      setSeat('');
    }
  }, [vacantSeats]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !seat) {
      alert('Please add a name and pick a seat before saving.');
      return;
    }
    onSubmit({
      name,
      mobile: mobile || '—',
      shift,
      seat,
      status,
      joinedRaw: joined,
      parentName,
      parentMobile,
      address,
    });
  };

  return (
    <div className={`modal-overlay ${open ? 'open' : ''}`} onClick={(e) => { if (e.target.classList.contains('modal-overlay')) onClose(); }}>
      <div className="modal-card">
        <div className="modal-head">
          <div>
            <h3 className="modal-title">Add student</h3>
            <div className="modal-sub">New entry will be added to the register and assigned a seat.</div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="field span-2">
                <label>Student name</label>
                <input type="text" placeholder="e.g. Kavya Nair" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="field">
                <label>Mobile number</label>
                <input type="tel" placeholder="98110 22341" value={mobile} onChange={(e) => setMobile(e.target.value)} required />
              </div>
              <div className="field">
                <label>Joining date</label>
                <input type="date" value={joined} onChange={(e) => setJoined(e.target.value)} required />
              </div>
              <div className="field">
                <label>Parent name</label>
                <input type="text" placeholder="e.g. Suresh Nair" value={parentName} onChange={(e) => setParentName(e.target.value)} />
              </div>
              <div className="field">
                <label>Parent mobile</label>
                <input type="tel" placeholder="98110 00000" value={parentMobile} onChange={(e) => setParentMobile(e.target.value)} />
              </div>
              <div className="field span-2">
                <label>Address</label>
                <textarea rows="2" placeholder="House no., street, area" value={address} onChange={(e) => setAddress(e.target.value)}></textarea>
              </div>
              <div className="field">
                <label>Shift</label>
                <select value={shift} onChange={(e) => setShift(e.target.value)}>
                  <option>Morning</option>
                  <option>Evening</option>
                  <option>Full day</option>
                </select>
              </div>
              <div className="field">
                <label>Assign seat</label>
                <select value={seat} onChange={(e) => setSeat(e.target.value)}>
                  {vacantSeats.map(s => (
                    <option key={s.label} value={s.label}>{s.label}</option>
                  ))}
                </select>
                <div className="field-hint">{vacantSeats.length} seats currently vacant</div>
              </div>
              <div className="field span-2">
                <label>Membership status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>
          <div className="modal-foot">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save student</button>
          </div>
        </form>
      </div>
    </div>
  );
}

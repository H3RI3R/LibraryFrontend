import React from 'react';

export default function ViewStudentModal({ open, onClose, student }) {
  if (!open || !student) return null;

  return (
    <div className={`modal-overlay ${open ? 'open' : ''}`} onClick={(e) => { if (e.target.classList.contains('modal-overlay')) onClose(); }}>
      <div className="modal-card">
        <div className="modal-head">
          <div>
            <h3 className="modal-title">Student Profile</h3>
            <div className="modal-sub">Viewing details for {student.name}</div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color, #eee)' }}>
            <span className="avatar" style={{ width: '64px', height: '64px', fontSize: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', backgroundColor: 'var(--accent-tint, #e0f2fe)', color: 'var(--accent, #0284c7)' }}>
              {student.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
            </span>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>{student.name}</h2>
              <span className={`pill ${student.status}`} style={{ marginTop: '4px', display: 'inline-block' }}>
                {student.status.toUpperCase()}
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted, #666)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mobile Number</label>
              <div style={{ fontWeight: '500', marginTop: '4px' }}>{student.mobile}</div>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted, #666)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</label>
              <div style={{ fontWeight: '500', marginTop: '4px' }}>{student.email || '—'}</div>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted, #666)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assigned Seat</label>
              <div style={{ fontWeight: '500', marginTop: '4px' }}>{student.seat || 'None'}</div>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted, #666)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Shift</label>
              <div style={{ fontWeight: '500', marginTop: '4px' }}>{student.shift}</div>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted, #666)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Joining Date</label>
              <div style={{ fontWeight: '500', marginTop: '4px' }}>{student.joined}</div>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted, #666)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Age / Gender</label>
              <div style={{ fontWeight: '500', marginTop: '4px' }}>{student.age ? `${student.age} yrs` : '—'} / {student.gender || '—'}</div>
            </div>

            <div style={{ gridColumn: 'span 2', height: '1px', backgroundColor: 'var(--border-color, #eee)', margin: '8px 0' }} />

            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted, #666)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Parent Name</label>
              <div style={{ fontWeight: '500', marginTop: '4px' }}>{student.parentName || '—'}</div>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted, #666)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Parent Mobile</label>
              <div style={{ fontWeight: '500', marginTop: '4px' }}>{student.parentMobile || '—'}</div>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted, #666)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Address</label>
              <div style={{ fontWeight: '500', marginTop: '4px' }}>{student.address || '—'}</div>
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={onClose}>Close Profile</button>
        </div>
      </div>
    </div>
  );
}

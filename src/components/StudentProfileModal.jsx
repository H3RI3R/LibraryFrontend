import React, { useState, useEffect } from 'react';

export default function StudentProfileModal({ open, onClose, studentData, onUpdate }) {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentMobile, setParentMobile] = useState('');
  const [address, setAddress] = useState('');
  const [profileImage, setProfileImage] = useState('');

  useEffect(() => {
    if (open && studentData) {
      setName(studentData.studentName || '');
      setMobile(studentData.mobileNumber || '');
      setParentName(studentData.parentName || '');
      setParentMobile(studentData.parentMobile || '');
      setAddress(studentData.address || '');
      setProfileImage(studentData.profileImage || '');
    }
  }, [open, studentData]);

  if (!open) return null;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate({
      studentName: name,
      mobileNumber: mobile,
      parentName,
      parentMobile,
      address,
      profileImage
    });
  };

  return (
    <div className={`modal-overlay ${open ? 'open' : ''}`} onClick={(e) => { if(e.target.classList.contains('modal-overlay')) onClose(); }}>
      <div className="modal-card" style={{ maxWidth: '520px' }}>
        <div className="modal-head">
          <div>
            <h3 className="modal-title">Your Profile</h3>
            <div className="modal-sub">Edit your general details</div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid">
              
              <div className="field span-2" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                <label style={{ alignSelf: 'flex-start' }}>Profile Image</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', width: '100%' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'var(--paper-deep, #eee)', border: '1px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {profileImage ? (
                      <img src={profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '20px', color: '#888' }}>👤</span>
                    )}
                  </div>
                  <input type="file" accept="image/*" onChange={handleImageChange} style={{ fontSize: '14px' }} />
                </div>
              </div>

              <div className="field">
                <label>Student name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>

              <div className="field">
                <label>Mobile number</label>
                <input type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} required />
              </div>

              <div className="field">
                <label>Parent name</label>
                <input type="text" value={parentName} onChange={(e) => setParentName(e.target.value)} />
              </div>

              <div className="field">
                <label>Parent mobile</label>
                <input type="tel" value={parentMobile} onChange={(e) => setParentMobile(e.target.value)} />
              </div>

              <div className="field span-2">
                <label>Address</label>
                <textarea rows="2" value={address} onChange={(e) => setAddress(e.target.value)}></textarea>
              </div>
            </div>
          </div>
          <div className="modal-foot">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Profile</button>
          </div>
        </form>
      </div>
    </div>
  );
}

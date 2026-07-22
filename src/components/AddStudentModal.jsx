import React, { useState, useEffect } from 'react';

export default function AddStudentModal({ open, onClose, onSubmit, fullSeats = [], studentsList = [], studentToEdit, selectedSeatLabel = '', defaultShift = 'Morning', allowedShifts = ['Morning', 'Evening', 'Full day'] }) {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [joined, setJoined] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentMobile, setParentMobile] = useState('');
  const [address, setAddress] = useState('');
  const [shift, setShift] = useState('Morning');
  const [seat, setSeat] = useState('');
  const [status, setStatus] = useState('active');
  const [monthlyFee, setMonthlyFee] = useState(800);
  const [profileImage, setProfileImage] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('Male');
  const [age, setAge] = useState(20);

  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    if (open) {
      setImageFile(null);
      if (studentToEdit) {
        setName(studentToEdit.name || '');
        setMobile(studentToEdit.mobile || '');
        // Convert joined date back to YYYY-MM-DD
        let rawDate = studentToEdit.joinedRaw || '';
        if (rawDate && rawDate.includes('/')) {
          const parts = rawDate.split('/');
          if (parts.length === 3) {
            rawDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
          }
        }
        if (!rawDate && studentToEdit.joined) {
          // If joined is "12 Feb 2026", try parsing or just default
          rawDate = new Date(studentToEdit.joined).toISOString().slice(0, 10);
        }
        setJoined(rawDate || new Date().toISOString().slice(0, 10));
        setParentName(studentToEdit.parentName || '');
        setParentMobile(studentToEdit.parentMobile || '');
        setAddress(studentToEdit.address || '');
        setShift(studentToEdit.shift || (allowedShifts[0] || 'Morning'));
        setSeat(studentToEdit.seat || '');
        setStatus(studentToEdit.status || 'active');
        setMonthlyFee(studentToEdit.monthlyFee || 800);
        setProfileImage(studentToEdit.profileImage || '');
        setEmail(studentToEdit.email || '');
        setGender(studentToEdit.gender || 'Male');
        setAge(studentToEdit.age || 20);
      } else {
        setName('');
        setMobile('');
        setJoined(new Date().toISOString().slice(0, 10));
        setParentName('');
        setParentMobile('');
        setAddress('');
        const initialShift = allowedShifts.includes(defaultShift) ? defaultShift : (allowedShifts[0] || 'Morning');
        setShift(initialShift);
        setSeat(selectedSeatLabel || '');
        setStatus('active');
        setMonthlyFee(800);
        setProfileImage('');
        setEmail('');
        setGender('Male');
        setAge(20);
      }
    }
  }, [open, studentToEdit, defaultShift, selectedSeatLabel, allowedShifts]);

  const getVacantSeatsForShift = () => {
    return fullSeats.filter(seat => {
      if (seat.status === 'uncreated') return false;
      
      const assigned = studentsList.filter(st => st.seat === seat.label);
      const activeAssigned = studentToEdit 
        ? assigned.filter(st => st.id !== studentToEdit.id)
        : assigned;

      if (shift === 'Morning') {
        const isBlocked = activeAssigned.some(st => {
          const stShift = (st.shift || '').toLowerCase().replace('_', ' ');
          return stShift === 'morning' || stShift === 'full day';
        });
        return !isBlocked;
      } else if (shift === 'Evening') {
        const isBlocked = activeAssigned.some(st => {
          const stShift = (st.shift || '').toLowerCase().replace('_', ' ');
          return stShift === 'evening' || stShift === 'full day';
        });
        return !isBlocked;
      } else if (shift === 'Full day') {
        return activeAssigned.length === 0;
      }
      return true;
    });
  };

  const dynamicVacantSeats = getVacantSeatsForShift();

  useEffect(() => {
    if (open && !studentToEdit && dynamicVacantSeats.length > 0) {
      if (selectedSeatLabel && dynamicVacantSeats.some(s => s.label === selectedSeatLabel)) {
        setSeat(selectedSeatLabel);
      } else if (!dynamicVacantSeats.some(s => s.label === seat)) {
        setSeat(dynamicVacantSeats[0].label);
      }
    }
  }, [shift, open, studentToEdit, dynamicVacantSeats, selectedSeatLabel]);

  if (!open) return null;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name) {
      alert('Please add a name.');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      alert('Please enter a valid email address.');
      return;
    }

    const cleanMobile = String(mobile).replace(/\D/g, '');
    if (cleanMobile.length < 10) {
      alert('Please enter a valid mobile number (at least 10 digits).');
      return;
    }

    if (parentMobile) {
      const cleanParentMobile = String(parentMobile).replace(/\D/g, '');
      if (cleanParentMobile.length < 10) {
        alert('Please enter a valid parent mobile number (at least 10 digits).');
        return;
      }
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
      monthlyFee,
      profileImage,
      imageFile,
      email,
      gender,
      age
    });
  };

  return (
    <div className={`modal-overlay ${open ? 'open' : ''}`} onClick={(e) => { if (e.target.classList.contains('modal-overlay')) onClose(); }}>
      <div className="modal-card">
        <div className="modal-head">
          <div>
            <h3 className="modal-title">{studentToEdit ? 'Edit student' : 'Add student'}</h3>
            <div className="modal-sub">{studentToEdit ? 'Modify student profile and configurations.' : 'New entry will be added to the register and assigned a seat.'}</div>
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

              <div className="field span-2">
                <label>Student name</label>
                <input type="text" placeholder="e.g. Kavya Nair" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="field">
                <label>Email Address</label>
                <input type="email" placeholder="e.g. kavya@test.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="field">
                <label>Age</label>
                <input type="number" placeholder="20" value={age} onChange={(e) => setAge(Number(e.target.value))} required />
              </div>
              <div className="field">
                <label>Gender</label>
                <select value={gender} onChange={(e) => setGender(e.target.value)}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="field">
                <label>Mobile number</label>
                <input type="tel" placeholder="9811022341" maxLength={10} value={mobile} onChange={(e) => setMobile(e.target.value)} required />
              </div>
              <div className="field">
                <label>Joining date</label>
                <input type="date" value={joined} onChange={(e) => setJoined(e.target.value)} required />
              </div>
              <div className="field">
                <label>Monthly Fee Amount</label>
                <input type="number" placeholder="800" value={monthlyFee} onChange={(e) => setMonthlyFee(Number(e.target.value))} required />
              </div>
              <div className="field">
                <label>Membership status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="field">
                <label>Shift</label>
                <select value={shift} onChange={(e) => setShift(e.target.value)}>
                  {allowedShifts.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Assign seat</label>
                <select value={seat} onChange={(e) => setSeat(e.target.value)}>
                  {studentToEdit && <option value={studentToEdit.seat}>{studentToEdit.seat} (Current)</option>}
                  {dynamicVacantSeats.map(s => (
                    <option key={s.label} value={s.label}>{s.label}</option>
                  ))}
                  <option value="">No Seat</option>
                </select>
              </div>
              
              <div style={{ gridColumn: 'span 2', height: '1px', backgroundColor: '#eee', margin: '10px 0' }} />
 
              <div className="field">
                <label>Parent name</label>
                <input type="text" placeholder="e.g. Suresh Nair" value={parentName} onChange={(e) => setParentName(e.target.value)} />
              </div>
              <div className="field">
                <label>Parent mobile</label>
                <input type="tel" placeholder="9811000000" maxLength={10} value={parentMobile} onChange={(e) => setParentMobile(e.target.value)} />
              </div>
              <div className="field span-2">
                <label>Address</label>
                <textarea rows="2" placeholder="House no., street, area" value={address} onChange={(e) => setAddress(e.target.value)}></textarea>
              </div>
            </div>
          </div>
          <div className="modal-foot">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">{studentToEdit ? 'Save Changes' : 'Save Student'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import Toast from './components/Toast';
import PayNowModal from './components/PayNowModal';
import AddStudentModal from './components/AddStudentModal';

// --- Default Data & Helper Functions ---
const names = ["Priya S.", "Rohit K.", "Anjali V.", "Kavya N.", "Sahil M.", "Neha J.", "Aman G.", "Vikram R.", "Divya P.", "Karan S.", "Meera T.", "Yash B."];

function buildSeats(count) {
  const seats = [];
  for (let i = 1; i <= count; i++) {
    const r = Math.random();
    let status = 'available';
    if (r < 0.55) status = 'occupied';
    else if (r < 0.68) status = 'due';
    const row = String.fromCharCode(65 + Math.floor((i - 1) / 12));
    const label = row + String((i - 1) % 12 + 1).padStart(2, '0');
    const student = status !== 'available' ? names[Math.floor(Math.random() * names.length)] : null;
    seats.push({ label, status, student });
  }
  return seats;
}

function buildEmptySeats(count) {
  const seats = [];
  for (let i = 1; i <= count; i++) {
    const row = String.fromCharCode(65 + Math.floor((i - 1) / 12));
    const label = row + String((i - 1) % 12 + 1).padStart(2, '0');
    seats.push({ label, status: 'available', student: null });
  }
  return seats;
}

const initialStudents = [
  { name: "Priya Sharma", mobile: "98110 22341", shift: "Morning", seat: "A14", joined: "12 Feb 2026", status: "active" },
  { name: "Rohit Kumar", mobile: "99991 20984", shift: "Full day", seat: "A07", joined: "03 Jan 2026", status: "active" },
  { name: "Anjali Verma", mobile: "97112 44556", shift: "Evening", seat: "B03", joined: "20 Mar 2026", status: "active" },
  { name: "Kavya Nair", mobile: "90123 88771", shift: "Morning", seat: "C09", joined: "04 Jul 2026", status: "active" },
  { name: "Sahil Mehta", mobile: "88990 11223", shift: "Evening", seat: "D02", joined: "15 Dec 2025", status: "inactive" },
  { name: "Neha Joshi", mobile: "96001 55667", shift: "Full day", seat: "B11", joined: "28 Jan 2026", status: "active" },
  { name: "Aman Gupta", mobile: "91234 90087", shift: "Morning", seat: "E05", joined: "09 Apr 2026", status: "inactive" },
  { name: "Vikram Rana", mobile: "93456 77812", shift: "Evening", seat: "A03", joined: "17 May 2026", status: "active" },
];

export default function App() {
  // --- Screen Navigation ---
  // Screens: 'login', 'onboarding', 'app-shell', 'student-shell'
  const [currentScreen, setCurrentScreen] = useState('login');

  // --- Login State ---
  const [loginRole, setLoginRole] = useState('owner'); // 'owner' or 'student'
  const [loginTab, setLoginTab] = useState('mobile'); // 'mobile' or 'email'
  const [ownerMobile, setOwnerMobile] = useState('98110 22341');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('••••••••');
  
  const [studentMobile, setStudentMobile] = useState('97112 44556');
  const [studentLoginStep, setStudentLoginStep] = useState(1); // 1: mobile input, 2: OTP input
  const [otpInputs, setOtpInputs] = useState(['4', '2', '8', '1', '9', '5']);

  // --- Onboarding Wizard State ---
  const [obStep, setObStep] = useState(1);
  const [obOwnerName, setObOwnerName] = useState('');
  const [obOwnerMobile, setObOwnerMobile] = useState('');
  const [obOwnerEmail, setObOwnerEmail] = useState('');
  const [obOwnerPassword, setObOwnerPassword] = useState('');
  const [obOwnerPassword2, setObOwnerPassword2] = useState('');
  const [obLibName, setObLibName] = useState('');
  const [obLibCity, setObLibCity] = useState('');
  const [obLibState, setObLibState] = useState('');
  const [obLibAddress, setObLibAddress] = useState('');
  const [obShifts, setObShifts] = useState({ Morning: true, Evening: true, 'Full day': false });
  const [obTotalSeats, setObTotalSeats] = useState(60);
  const [obFeeAmount, setObFeeAmount] = useState(800);
  const [obDueDay, setObDueDay] = useState(5);
  const [obPayMethods, setObPayMethods] = useState({ Cash: true, UPI: true, 'Bank Transfer': false });

  // --- Global Library Configuration & State ---
  const [libraryName, setLibraryName] = useState('Sunrise Reading Room');
  const [libraryCity, setLibraryCity] = useState('Sector 12, Dadri');
  const [ownerName, setOwnerName] = useState('Ritik');
  const [totalSeats, setTotalSeats] = useState(120);

  // --- Seats Caching ---
  const [dashSeats, setDashSeats] = useState([]);
  const [fullSeats, setFullSeats] = useState([]);
  const [selectedSeatIndex, setSelectedSeatIndex] = useState(null);
  
  // Seat filter (seats view)
  const [seatFilter, setSeatFilter] = useState('All shifts');

  // Initialize seats once on mount
  useEffect(() => {
    setDashSeats(buildSeats(36));
    setFullSeats(buildSeats(120));
  }, []);

  // --- Students Caching ---
  const [studentsList, setStudentsList] = useState(initialStudents);
  const [studentSearch, setStudentSearch] = useState('');

  // --- Owner Dashboard views navigation ---
  // Views: 'dashboard', 'students', 'seats', 'fees', 'attendance', 'reports', 'settings'
  const [activeView, setActiveView] = useState('dashboard');

  // --- Student Portal view navigation ---
  // Views: 'overview', 'payments', 'attendance'
  const [studentView, setStudentView] = useState('overview');

  // --- Modals State ---
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [payNowOpen, setPayNowOpen] = useState(false);

  // --- Toast State ---
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  
  // --- Student Subscription payment state ---
  const [isSubPaid, setIsSubPaid] = useState(false);
  const [studentPaymentHistory, setStudentPaymentHistory] = useState([
    { month: 'June 2026', amount: '₹800', method: 'UPI', date: '02 Jun', status: 'Paid' },
    { month: 'May 2026', amount: '₹800', method: 'Cash', date: '03 May', status: 'Paid' },
    { month: 'April 2026', amount: '₹800', method: 'UPI', date: '04 Apr', status: 'Paid' },
  ]);

  // --- Activity Feed state ---
  const [activityFeed, setActivityFeed] = useState([
    { time: '09:12', dotColor: 'teal', text: '<b>Priya Sharma</b> checked in — Seat A14' },
    { time: '09:04', dotColor: 'mustard', text: '₹800 fee collected from <b>Rohit Kumar</b> (UPI)' },
    { time: '08:55', dotColor: 'teal', text: '<b>Anjali Verma</b> checked in — Seat B03' },
    { time: '08:40', dotColor: 'terracotta', text: '<b>Sahil Mehta</b>\'s fee is 4 days overdue' },
    { time: '08:30', dotColor: 'teal', text: 'New student <b>Kavya Nair</b> registered — Seat C09' },
  ]);

  // --- Stats variables ---
  const occupiedCount = fullSeats.filter(s => s.status === 'occupied' || s.status === 'due').length;
  const feesDueSum = fullSeats.filter(s => s.status === 'due').length * 800; // Mock calculation based on due count

  const showToast = (html) => {
    setToastMessage(html);
    setToastVisible(true);
  };

  useEffect(() => {
    if (toastVisible) {
      const timer = setTimeout(() => {
        setToastVisible(false);
      }, 3200);
      return () => clearTimeout(timer);
    }
  }, [toastVisible]);

  // --- Actions ---
  const handleOwnerLogin = (e) => {
    e.preventDefault();
    setCurrentScreen('app-shell');
  };

  const handleSendStudentOtp = () => {
    setStudentLoginStep(2);
    showToast(`OTP sent to <b>${studentMobile}</b> (demo code pre-filled).`);
  };

  const handleVerifyStudentOtp = () => {
    setCurrentScreen('student-shell');
    showToast('Welcome back, <b>Anjali</b>!');
  };

  const handleStudentLogout = () => {
    setCurrentScreen('login');
    setLoginRole('student');
    setStudentLoginStep(1);
  };

  const handlePayNowSubmit = (method) => {
    setIsSubPaid(true);
    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    setStudentPaymentHistory([
      { month: 'July 2026', amount: '₹800', method: method, date: today, status: 'Paid' },
      ...studentPaymentHistory
    ]);
    setPayNowOpen(false);
    showToast('Payment successful — thank you, Anjali!');
  };

  const handleAddStudentSubmit = (studentData) => {
    const formattedJoined = new Date(studentData.joinedRaw).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    
    // Add to students list
    const newStudent = {
      name: studentData.name,
      mobile: studentData.mobile,
      shift: studentData.shift,
      seat: studentData.seat,
      joined: formattedJoined,
      status: studentData.status
    };
    setStudentsList([newStudent, ...studentsList]);

    // Update Seat Status
    setFullSeats(fullSeats.map(s => {
      if (s.label === studentData.seat) {
        return { ...s, status: 'occupied', student: studentData.name };
      }
      return s;
    }));

    setAddStudentOpen(false);
    showToast(`<b>${studentData.name}</b> registered — seat ${studentData.seat}, ${studentData.shift} shift.`);
  };

  // --- Onboarding Logic ---
  const handleObNext = () => {
    // Validate current step
    if (obStep === 1) {
      if (!obOwnerName.trim() || !obOwnerMobile.trim() || !obOwnerPassword) {
        showToast('Please fill in your name, mobile number and a password.');
        return;
      }
      if (obOwnerPassword !== obOwnerPassword2) {
        showToast('Passwords do not match — please re-check.');
        return;
      }
    }
    if (obStep === 2) {
      if (!obLibName.trim() || !obLibCity.trim()) {
        showToast('Please add your library name and city.');
        return;
      }
    }
    if (obStep === 3) {
      if (!obTotalSeats || obTotalSeats < 1) {
        showToast('Enter how many seats your library has.');
        return;
      }
      if (obFeeAmount === '') {
        showToast('Enter your monthly fee amount.');
        return;
      }
    }

    if (obStep < 4) {
      setObStep(obStep + 1);
    } else {
      // Finish onboarding
      setOwnerName(obOwnerName.trim());
      setLibraryName(obLibName.trim());
      setLibraryCity(obLibCity.trim());
      setTotalSeats(obTotalSeats);

      // Reset seat map to fully vacant matching configured total
      setFullSeats(buildEmptySeats(obTotalSeats));
      setDashSeats(buildEmptySeats(Math.min(36, obTotalSeats)));
      
      // Reset variables to blank/zero values for a fresh account
      setStudentsList([]);
      setActivityFeed([]);
      
      setCurrentScreen('app-shell');
      setObStep(1);
      showToast(`Welcome, <b>${obOwnerName.split(' ')[0]}</b>! ${obLibName} is ready — add your first student to get started.`);
    }
  };

  const handleObBack = () => {
    if (obStep > 1) {
      setObStep(obStep - 1);
    }
  };

  // Filter students based on search string
  const filteredStudents = studentsList.filter(s => 
    s.name.toLowerCase().includes(studentSearch.toLowerCase()) || 
    s.mobile.replace(/\s/g, '').includes(studentSearch.replace(/\s/g, ''))
  );

  return (
    <React.Fragment>
      {/* ============ TOAST ============ */}
      <Toast message={toastMessage} visible={toastVisible} />

      {/* ============ LOGIN SCREEN ============ */}
      {currentScreen === 'login' && (
        <div id="login-screen">
          <div className="login-brand">
            <div className="login-brand-top">
              <div className="brand">
                <div className="brand-mark">S</div>
                <div>
                  <div className="brand-name">StudySpace</div>
                  <div className="brand-sub">Register &amp; Desk</div>
                </div>
              </div>
            </div>
            <div>
              <div className="login-quote">“Every seat filled, every fee tracked — the whole register, in one place.”</div>
              <div className="login-quote-attr">Built for Indian study libraries &amp; reading rooms</div>
            </div>
            <div className="login-foot">© 2026 StudySpace · Sunrise Reading Room</div>
            <div className="login-stamp-deco"><span>VERIFIED</span></div>
          </div>

          <div className="login-form-wrap">
            <div className="login-card">
              <div className="role-toggle">
                <div className={`role-tab ${loginRole === 'owner' ? 'active' : ''}`} onClick={() => setLoginRole('owner')}>Library Owner / Staff</div>
                <div className={`role-tab ${loginRole === 'student' ? 'active' : ''}`} onClick={() => setLoginRole('student')}>Student</div>
              </div>

              {/* ============ OWNER / STAFF LOGIN ============ */}
              {loginRole === 'owner' && (
                <div>
                  <div className="login-eyebrow">Welcome back</div>
                  <h1 className="login-title">Log in to your desk</h1>
                  <div className="login-sub">Enter your registered mobile number or email to access the dashboard.</div>

                  <div className="login-tabs">
                    <div className={`login-tab ${loginTab === 'mobile' ? 'active' : ''}`} onClick={() => setLoginTab('mobile')}>Mobile number</div>
                    <div className={`login-tab ${loginTab === 'email' ? 'active' : ''}`} onClick={() => setLoginTab('email')}>Email</div>
                  </div>

                  <form onSubmit={handleOwnerLogin}>
                    {loginTab === 'mobile' ? (
                      <div className="field">
                        <label>Mobile number</label>
                        <input type="tel" placeholder="98110 22341" value={ownerMobile} onChange={(e) => setOwnerMobile(e.target.value)} />
                      </div>
                    ) : (
                      <div className="field">
                        <label>Email address</label>
                        <input type="email" placeholder="ritik@sunrisereading.in" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} />
                      </div>
                    )}
                    <div className="field">
                      <label>Password</label>
                      <input type="password" placeholder="••••••••" value={ownerPassword} onChange={(e) => setOwnerPassword(e.target.value)} />
                    </div>
                    <div className="field-row">
                      <label className="remember"><input type="checkbox" defaultChecked style={{ width: 'auto' }} /> Keep me logged in</label>
                      <a href="#">Forgot password?</a>
                    </div>
                    <button type="submit" className="btn btn-primary login-btn">Log in</button>
                  </form>

                  <div className="login-divider">or</div>
                  <button className="btn btn-ghost login-btn" onClick={() => setCurrentScreen('app-shell')}>Send OTP instead</button>
                  <div className="login-note" style={{ marginTop: '20px' }}>
                    New library on StudySpace? <a href="#" onClick={(e) => { e.preventDefault(); setCurrentScreen('onboarding'); }}>Set up your account</a>
                  </div>
                </div>
              )}

              {/* ============ STUDENT LOGIN ============ */}
              {loginRole === 'student' && (
                <div>
                  <div className="login-eyebrow">Student access</div>
                  <h1 className="login-title">Check your subscription</h1>
                  <div className="login-sub">Log in with your registered mobile number — no password needed, we'll send a one-time code.</div>

                  {studentLoginStep === 1 ? (
                    <div>
                      <div className="field">
                        <label>Mobile number</label>
                        <input type="tel" placeholder="98110 22341" value={studentMobile} onChange={(e) => setStudentMobile(e.target.value)} />
                      </div>
                      <div className="field-hint" style={{ marginBottom: '18px' }}>Use the mobile number your library owner has on file for you.</div>
                      <button className="btn btn-primary login-btn" onClick={handleSendStudentOtp}>Send OTP</button>
                    </div>
                  ) : (
                    <div>
                      <div className="field">
                        <label>Enter the 6-digit code sent to <span>{studentMobile}</span></label>
                        <div className="otp-row">
                          {otpInputs.map((val, idx) => (
                            <input
                              key={idx}
                              className="otp-box"
                              maxLength={1}
                              inputMode="numeric"
                              value={val}
                              onChange={(e) => {
                                const newOtp = [...otpInputs];
                                newOtp[idx] = e.target.value;
                                setOtpInputs(newOtp);
                                // Focus next input
                                if (e.target.value && e.target.nextSibling) {
                                  e.target.nextSibling.focus();
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Backspace' && !val && e.target.previousSibling) {
                                  e.target.previousSibling.focus();
                                }
                              }}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="field-row" style={{ marginBottom: '18px' }}>
                        <a href="#" onClick={(e) => { e.preventDefault(); setStudentLoginStep(1); }}>Change number</a>
                        <a href="#" onClick={(e) => { e.preventDefault(); showToast('A new OTP has been sent.'); }}>Resend OTP</a>
                      </div>
                      <button className="btn btn-primary login-btn" onClick={handleVerifyStudentOtp}>Verify &amp; continue</button>
                    </div>
                  )}
                  <div className="login-note" style={{ marginTop: '20px' }}>Don't have a seat yet? Ask your library desk to register you.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============ ONBOARDING WIZARD ============ */}
      {currentScreen === 'onboarding' && (
        <div id="onboarding-screen" className="open">
          <div className="onboarding-top">
            <div className="brand">
              <div className="brand-mark">S</div>
              <div>
                <div className="brand-name">StudySpace</div>
                <div className="brand-sub">Set up your library</div>
              </div>
            </div>
            <a href="#" id="back-to-login" onClick={(e) => { e.preventDefault(); setCurrentScreen('login'); }}>Already have an account? Log in</a>
          </div>

          <div className="onboarding-wrap">
            <div className="onboarding-card">
              <div className="ob-progress">
                <div className={`ob-step-item ${obStep > 1 ? 'done' : ''} ${obStep === 1 ? 'active' : ''}`}>
                  <div className="ob-step-circle">1</div><div className="ob-step-label">Account</div>
                </div>
                <div className={`ob-step-line ${obStep > 1 ? 'done' : ''}`}></div>
                <div className={`ob-step-item ${obStep > 2 ? 'done' : ''} ${obStep === 2 ? 'active' : ''}`}>
                  <div className="ob-step-circle">2</div><div className="ob-step-label">Library</div>
                </div>
                <div className={`ob-step-line ${obStep > 2 ? 'done' : ''}`}></div>
                <div className={`ob-step-item ${obStep > 3 ? 'done' : ''} ${obStep === 3 ? 'active' : ''}`}>
                  <div className="ob-step-circle">3</div><div className="ob-step-label">Seats &amp; fees</div>
                </div>
                <div className={`ob-step-line ${obStep > 3 ? 'done' : ''}`}></div>
                <div className={`ob-step-item ${obStep === 4 ? 'active' : ''}`}>
                  <div className="ob-step-circle">4</div><div className="ob-step-label">Done</div>
                </div>
              </div>

              <div className="ob-panel">
                {/* STEP 1 — Owner account */}
                {obStep === 1 && (
                  <div className="ob-step-content active">
                    <div className="ob-step-eyebrow">Step 1 of 4</div>
                    <h2 className="ob-step-title">Create your account</h2>
                    <div className="ob-step-sub">You'll use this mobile number and password to log in as the library owner.</div>
                    <div className="form-grid">
                      <div className="field span-2">
                        <label>Your full name</label>
                        <input type="text" placeholder="e.g. Ritik Sharma" value={obOwnerName} onChange={(e) => setObOwnerName(e.target.value)} required />
                      </div>
                      <div className="field">
                        <label>Mobile number</label>
                        <input type="tel" placeholder="98110 22341" value={obOwnerMobile} onChange={(e) => setObOwnerMobile(e.target.value)} required />
                      </div>
                      <div className="field">
                        <label>Email (optional)</label>
                        <input type="email" placeholder="you@library.in" value={obOwnerEmail} onChange={(e) => setObOwnerEmail(e.target.value)} />
                      </div>
                      <div className="field">
                        <label>Password</label>
                        <input type="password" placeholder="Create a password" value={obOwnerPassword} onChange={(e) => setObOwnerPassword(e.target.value)} required />
                      </div>
                      <div className="field">
                        <label>Confirm password</label>
                        <input type="password" placeholder="Re-enter password" value={obOwnerPassword2} onChange={(e) => setObOwnerPassword2(e.target.value)} required />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2 — Library details */}
                {obStep === 2 && (
                  <div className="ob-step-content active">
                    <div className="ob-step-eyebrow">Step 2 of 4</div>
                    <h2 className="ob-step-title">Tell us about your library</h2>
                    <div className="ob-step-sub">This appears on receipts and reports your students will see.</div>
                    <div className="form-grid">
                      <div className="field span-2">
                        <label>Library name</label>
                        <input type="text" placeholder="e.g. Sunrise Reading Room" value={obLibName} onChange={(e) => setObLibName(e.target.value)} required />
                      </div>
                      <div className="field">
                        <label>City / area</label>
                        <input type="text" placeholder="e.g. Sector 12, Dadri" value={obLibCity} onChange={(e) => setObLibCity(e.target.value)} required />
                      </div>
                      <div className="field">
                        <label>State</label>
                        <input type="text" placeholder="e.g. Uttar Pradesh" value={obLibState} onChange={(e) => setObLibState(e.target.value)} />
                      </div>
                      <div className="field span-2">
                        <label>Full address</label>
                        <textarea rows="2" placeholder="Building, street, landmark" value={obLibAddress} onChange={(e) => setObLibAddress(e.target.value)}></textarea>
                      </div>
                      <div className="field span-2">
                        <label>Which shifts do you run?</label>
                        <div className="ob-check-row">
                          {['Morning', 'Evening', 'Full day'].map((shiftName) => (
                            <label className="ob-check" key={shiftName}>
                              <input
                                type="checkbox"
                                checked={obShifts[shiftName]}
                                onChange={(e) => setObShifts({ ...obShifts, [shiftName]: e.target.checked })}
                              />
                              <span>
                                {shiftName}
                                <span className="ob-check-time">
                                  {shiftName === 'Morning' && '7 AM – 2 PM'}
                                  {shiftName === 'Evening' && '2 PM – 9 PM'}
                                  {shiftName === 'Full day' && '7 AM – 9 PM'}
                                </span>
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3 — Seats & fees */}
                {obStep === 3 && (
                  <div className="ob-step-content active">
                    <div className="ob-step-eyebrow">Step 3 of 4</div>
                    <h2 className="ob-step-title">Set up seats &amp; fees</h2>
                    <div className="ob-step-sub">You can change these anytime from Settings once you're in.</div>
                    <div className="form-grid">
                      <div className="field">
                        <label>Total seats</label>
                        <input type="number" placeholder="e.g. 60" min="1" value={obTotalSeats} onChange={(e) => setObTotalSeats(parseInt(e.target.value, 10))} required />
                      </div>
                      <div className="field">
                        <label>Monthly fee per seat (₹)</label>
                        <input type="number" placeholder="e.g. 800" min="0" value={obFeeAmount} onChange={(e) => setObFeeAmount(parseInt(e.target.value, 10))} required />
                      </div>
                      <div className="field">
                        <label>Fee due day of month</label>
                        <select value={obDueDay} onChange={(e) => setObDueDay(parseInt(e.target.value, 10))}>
                          {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                            <option key={d} value={d}>
                              {d}{d === 1 ? 'st' : d === 2 ? 'nd' : d === 3 ? 'rd' : 'th'} of the month
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="field">
                        <label>Accepted payment methods</label>
                        <div className="ob-check-row" style={{ marginTop: '2px' }}>
                          {['Cash', 'UPI', 'Bank Transfer'].map((method) => (
                            <label className="ob-check" key={method}>
                              <input
                                type="checkbox"
                                checked={obPayMethods[method]}
                                onChange={(e) => setObPayMethods({ ...obPayMethods, [method]: e.target.checked })}
                              />
                              <span>{method}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4 — Confirmation */}
                {obStep === 4 && (
                  <div className="ob-step-content active">
                    <div className="ob-done-wrap">
                      <div className="ob-done-stamp">SET UP<br />COMPLETE</div>
                      <h2 className="ob-step-title">You're all set, {obOwnerName.split(' ')[0]}</h2>
                      <div className="ob-step-sub">Your library register is ready. Here's what we've set up:</div>
                    </div>
                    <div className="ob-summary">
                      <div className="ob-summary-row"><span>Library name</span><b>{obLibName || '—'}</b></div>
                      <div className="ob-summary-row"><span>Location</span><b>{obLibCity || '—'}</b></div>
                      <div className="ob-summary-row"><span>Total seats</span><b>{obTotalSeats} seats</b></div>
                      <div className="ob-summary-row"><span>Monthly fee</span><b>₹{Number(obFeeAmount).toLocaleString('en-IN')} / month</b></div>
                      <div className="ob-summary-row">
                        <span>Shifts</span>
                        <b>{Object.keys(obShifts).filter(k => obShifts[k]).join(', ') || 'None'}</b>
                      </div>
                    </div>
                  </div>
                )}

                <div className="ob-actions">
                  <button className="btn btn-ghost" style={{ visibility: obStep === 1 ? 'hidden' : 'visible' }} onClick={handleObBack}>Back</button>
                  <button className="btn btn-primary" onClick={handleObNext}>
                    {obStep === 4 ? 'Go to dashboard' : (obStep === 3 ? 'Create my library' : 'Continue')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ OWNER APP SHELL ============ */}
      {currentScreen === 'app-shell' && (
        <div className="app">
          {/* ============ SIDEBAR ============ */}
          <nav className="sidebar">
            <div className="brand" onClick={() => setCurrentScreen('login')} style={{ cursor: 'pointer' }}>
              <div className="brand-mark">S</div>
              <div>
                <div className="brand-name">StudySpace</div>
                <div className="brand-sub">Register &amp; Desk</div>
              </div>
            </div>
            <ul className="navlist">
              {[
                { id: 'dashboard', label: 'Dashboard' },
                { id: 'students', label: 'Students' },
                { id: 'seats', label: 'Seats' },
                { id: 'fees', label: 'Fees' },
                { id: 'attendance', label: 'Attendance' },
                { id: 'reports', label: 'Reports' },
                { id: 'settings', label: 'Settings' }
              ].map((view) => (
                <li
                  key={view.id}
                  className={`navitem ${activeView === view.id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveView(view.id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <span className="dot"></span>
                  {view.label}
                </li>
              ))}
              <li
                className="navitem"
                style={{ marginTop: '10px', borderTop: '1px solid rgba(239,232,214,0.15)', paddingTop: '12px' }}
                onClick={() => {
                  setCurrentScreen('login');
                  setLoginRole('owner');
                  setStudentLoginStep(1);
                }}
              >
                <span className="dot"></span>
                Log out
              </li>
            </ul>
            <div className="sidebar-foot">
              {libraryName}<br />
              {libraryCity} &middot; {totalSeats} seats
            </div>
          </nav>

          {/* ============ MAIN CONTENT ============ */}
          <main className="content">

            {/* ================= DASHBOARD ================= */}
            {activeView === 'dashboard' && (
              <section className="view active">
                <div className="topbar">
                  <div>
                    <div className="page-eyebrow">Saturday, 4 July</div>
                    <h1 className="page-title">Good morning, {ownerName.split(' ')[0]}</h1>
                  </div>
                  <div className="topbar-actions">
                    <button className="btn btn-ghost" onClick={() => setActiveView('attendance')}>Today's register</button>
                    <button className="btn btn-primary" onClick={() => setAddStudentOpen(true)}>+ Add Student</button>
                  </div>
                </div>

                <div className="stat-strip">
                  <div className="stat-card" style={{ '--stat-color': 'var(--teal)' }}>
                    <div className="stat-label">Total Seats</div>
                    <div className="stat-value">{totalSeats}</div>
                  </div>
                  <div className="stat-card" style={{ '--stat-color': 'var(--sage)' }}>
                    <div className="stat-label">Occupied</div>
                    <div className="stat-value">
                      {occupiedCount} <span className="stat-suffix">/ {totalSeats}</span>
                    </div>
                  </div>
                  <div className="stat-card" style={{ '--stat-color': 'var(--mustard)' }}>
                    <div className="stat-label">Total Students</div>
                    <div className="stat-value">{studentsList.length}</div>
                  </div>
                  <div className="stat-card" style={{ '--stat-color': 'var(--terracotta)' }}>
                    <div className="stat-label">Fees Due</div>
                    <div className="stat-value">₹{Number(feesDueSum).toLocaleString('en-IN')}</div>
                  </div>
                  <div className="stat-card" style={{ '--stat-color': 'var(--ink)' }}>
                    <div className="stat-label">Today's Attendance</div>
                    <div className="stat-value">{studentsList.length > 0 ? 62 : 0}</div>
                  </div>
                </div>

                <div className="grid-2">
                  <div className="panel">
                    <div className="panel-head">
                      <h3 className="panel-title">Seat map {obStep === 1 ? '— Morning shift' : ''}</h3>
                      <span className="panel-link" onClick={() => setActiveView('seats')}>Open full map →</span>
                    </div>
                    <div className="seat-legend">
                      <span><i className="legend-chip" style={{ background: 'var(--sage-tint)', border: '1px solid #C9D7BE' }}></i>Available</span>
                      <span><i className="legend-chip" style={{ background: 'var(--teal-tint)', border: '1px solid #BFD4CC' }}></i>Occupied</span>
                      <span><i className="legend-chip" style={{ background: 'var(--terracotta-tint)', border: '1px solid #E3BBAC' }}></i>Fee due</span>
                    </div>
                    <div className="seat-grid">
                      {dashSeats.map((s, idx) => (
                        <div key={idx} className={`seat ${s.status}`} title={s.student ? `${s.student} — ${s.status}` : 'Available'}>
                          {s.label}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="panel">
                    <div className="panel-head"><h3 class="panel-title">Today's activity</h3></div>
                    <div className="feed">
                      {activityFeed.length > 0 ? (
                        activityFeed.map((item, idx) => (
                          <div className="feed-item" key={idx}>
                            <div className="feed-time">{item.time}</div>
                            <div className={`feed-dot ${item.dotColor !== 'teal' ? item.dotColor : ''}`}></div>
                            <div className="feed-text" dangerouslySetInnerHTML={{ __html: item.text }}></div>
                          </div>
                        ))
                      ) : (
                        <div style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.6 }}>
                          No activity yet. Once students check in or pay fees, you'll see it here first.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid-2">
                  <div className="panel">
                    <div className="panel-head"><h3 class="panel-title">Monthly revenue</h3></div>
                    {studentsList.length > 0 ? (
                      <div className="bars">
                        <div className="bar-col"><div className="bar" style={{ height: '52%' }}></div><div className="bar-label">Feb</div></div>
                        <div className="bar-col"><div className="bar" style={{ height: '61%' }}></div><div className="bar-label">Mar</div></div>
                        <div className="bar-col"><div className="bar" style={{ height: '58%' }}></div><div className="bar-label">Apr</div></div>
                        <div className="bar-col"><div className="bar" style={{ height: '70%' }}></div><div className="bar-label">May</div></div>
                        <div className="bar-col"><div className="bar" style={{ height: '66%' }}></div><div className="bar-label">Jun</div></div>
                        <div className="bar-col"><div className="bar current" style={{ height: '81%' }}></div><div className="bar-label">Jul</div></div>
                      </div>
                    ) : (
                      <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
                        Revenue will appear here after your first month of collections.
                      </div>
                    )}
                  </div>
                  <div className="panel">
                    <div className="panel-head">
                      <h3 className="panel-title">Due fees</h3>
                      <span className="panel-link" onClick={() => setActiveView('fees')}>View all →</span>
                    </div>
                    {studentsList.length > 0 ? (
                      <table className="ledger">
                        <tbody>
                          <tr><td className="cell-name">Sahil Mehta</td><td className="cell-amount">₹1,200</td><td><span className="stamp due">Due</span></td></tr>
                          <tr><td className="cell-name">Neha Joshi</td><td className="cell-amount">₹800</td><td><span className="stamp due">Due</span></td></tr>
                          <tr><td className="cell-name">Aman Gupta</td><td className="cell-amount">₹1,500</td><td><span className="stamp due">Due</span></td></tr>
                        </tbody>
                      </table>
                    ) : (
                      <table className="ledger">
                        <tbody>
                          <tr>
                            <td style={{ color: 'var(--muted)', fontSize: '13px', padding: '14px 10px' }}>
                              No dues yet — nothing to collect until your first student joins.
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* ================= STUDENTS ================= */}
            {activeView === 'students' && (
              <section className="view active">
                <div className="topbar">
                  <div>
                    <div className="page-eyebrow">Register</div>
                    <h1 className="page-title">Students</h1>
                  </div>
                  <div className="topbar-actions">
                    <div className="search">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
                      <input placeholder="Search by name or mobile" value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} />
                    </div>
                    <button className="btn btn-primary" onClick={() => setAddStudentOpen(true)}>+ Add Student</button>
                  </div>
                </div>

                <div className="panel">
                  <table className="ledger">
                    <thead>
                      <tr><th>Student</th><th>Mobile</th><th>Shift</th><th>Seat</th><th>Joined</th><th>Membership</th><th></th></tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((s, idx) => (
                        <tr key={idx}>
                          <td className="name-cell">
                            <span className="avatar">
                              {s.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                            </span>
                            <span className="cell-name">{s.name}</span>
                          </td>
                          <td className="mono">{s.mobile}</td>
                          <td>{s.shift}</td>
                          <td>{s.seat}</td>
                          <td>{s.joined}</td>
                          <td>
                            <span className={`pill ${s.status}`}>
                              {s.status === 'active' ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td><span className="panel-link">View</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="note">
                  Showing <span>{filteredStudents.length}</span> of {studentsList.length} students. Search narrows the list instantly — try “rohit” or “98”.
                </div>
              </section>
            )}

            {/* ================= SEATS ================= */}
            {activeView === 'seats' && (
              <section className="view active">
                <div className="topbar">
                  <div>
                    <div className="page-eyebrow">Floor plan</div>
                    <h1 className="page-title">Seats</h1>
                  </div>
                  <div className="topbar-actions">
                    <button className="btn btn-ghost">+ Create Seats</button>
                  </div>
                </div>

                <div className="toolbar">
                  <div className="filter-chips">
                    {['All shifts', 'Morning (7–2)', 'Evening (2–9)', 'Full day'].map((chip) => (
                      <div
                        key={chip}
                        className={`chip ${seatFilter === chip ? 'active' : ''}`}
                        onClick={() => setSeatFilter(chip)}
                      >
                        {chip}
                      </div>
                    ))}
                  </div>
                  <div className="seat-legend" style={{ margin: 0 }}>
                    <span><i className="legend-chip" style={{ background: 'var(--sage-tint)', border: '1px solid #C9D7BE' }}></i>Available</span>
                    <span><i className="legend-chip" style={{ background: 'var(--teal-tint)', border: '1px solid #BFD4CC' }}></i>Occupied</span>
                    <span><i className="legend-chip" style={{ background: 'var(--terracotta-tint)', border: '1px solid #E3BBAC' }}></i>Fee due</span>
                  </div>
                </div>

                <div className="grid-2" style={{ gridTemplateColumns: '1.7fr 1fr' }}>
                  <div className="panel">
                    <div className="seat-grid">
                      {fullSeats.map((s, idx) => (
                        <div
                          key={idx}
                          className={`seat ${s.status} ${selectedSeatIndex === idx ? 'selected' : ''}`}
                          title={s.student ? `${s.student} — ${s.status}` : 'Available'}
                          onClick={() => setSelectedSeatIndex(idx)}
                        >
                          {s.label}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="panel seat-side">
                    <div className="panel-head"><h3 className="panel-title">Seat detail</h3></div>
                    {selectedSeatIndex !== null ? (
                      fullSeats[selectedSeatIndex].status === 'available' ? (
                        <div className="seat-detail">
                          Seat <b>{fullSeats[selectedSeatIndex].label}</b> is available.<br /><br />
                          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setAddStudentOpen(true)}>Assign this seat</button>
                        </div>
                      ) : (
                        <div className="seat-detail filled">
                          <div className="seat-detail-name">{fullSeats[selectedSeatIndex].student}</div>
                          <span className={`stamp ${fullSeats[selectedSeatIndex].status === 'due' ? 'due' : 'paid'}`}>
                            {fullSeats[selectedSeatIndex].status === 'due' ? 'Due' : 'Paid'}
                          </span>
                          <div className="seat-detail-row"><span>Seat</span><b>{fullSeats[selectedSeatIndex].label}</b></div>
                          <div className="seat-detail-row"><span>Shift</span><b>Morning</b></div>
                          <div className="seat-detail-row"><span>Member since</span><b>Feb 2026</b></div>
                        </div>
                      )
                    ) : (
                      <div className="seat-detail">Click any seat to view or assign it</div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* ================= FEES ================= */}
            {activeView === 'fees' && (
              <section className="view active">
                <div className="topbar">
                  <div>
                    <div className="page-eyebrow">Ledger</div>
                    <h1 className="page-title">Fees</h1>
                  </div>
                  <div className="topbar-actions">
                    <button className="btn btn-ghost">Due list</button>
                    <button className="btn btn-primary">+ Collect Fee</button>
                  </div>
                </div>

                <div className="stat-strip" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: '20px' }}>
                  <div className="stat-card" style={{ '--stat-color': 'var(--teal)' }}>
                    <div className="stat-label">Collected this month</div>
                    <div className="stat-value">₹64,800</div>
                  </div>
                  <div className="stat-card" style={{ '--stat-color': 'var(--terracotta)' }}>
                    <div className="stat-label">Total due</div>
                    <div className="stat-value">₹12,400</div>
                  </div>
                  <div className="stat-card" style={{ '--stat-color': 'var(--mustard)' }}>
                    <div className="stat-label">Students overdue</div>
                    <div className="stat-value">7</div>
                  </div>
                </div>

                <div className="panel">
                  <div className="panel-head"><h3 className="panel-title">Payment history</h3></div>
                  <table className="ledger">
                    <thead>
                      <tr><th>Student</th><th>Amount</th><th>Method</th><th>Date</th><th>Status</th><th></th></tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="name-cell"><span className="avatar">RK</span><span className="cell-name">Rohit Kumar</span></td>
                        <td className="cell-amount">₹800</td><td>UPI</td><td>03 Jul</td>
                        <td><span className="stamp paid">Paid</span></td>
                        <td><span className="panel-link">Receipt</span></td>
                      </tr>
                      <tr>
                        <td className="name-cell"><span className="avatar">PS</span><span className="cell-name">Priya Sharma</span></td>
                        <td className="cell-amount">₹1,200</td><td>Cash</td><td>02 Jul</td>
                        <td><span className="stamp paid">Paid</span></td>
                        <td><span className="panel-link">Receipt</span></td>
                      </tr>
                      <tr>
                        <td className="name-cell"><span className="avatar">SM</span><span className="cell-name">Sahil Mehta</span></td>
                        <td className="cell-amount">₹1,200</td><td>—</td><td>Due 28 Jun</td>
                        <td><span className="stamp due">Due</span></td>
                        <td><span className="panel-link">Collect</span></td>
                      </tr>
                      <tr>
                        <td className="name-cell"><span className="avatar">AV</span><span className="cell-name">Anjali Verma</span></td>
                        <td className="cell-amount">₹800</td><td>Bank Transfer</td><td>01 Jul</td>
                        <td><span className="stamp paid">Paid</span></td>
                        <td><span className="panel-link">Receipt</span></td>
                      </tr>
                      <tr>
                        <td className="name-cell"><span className="avatar">NJ</span><span className="cell-name">Neha Joshi</span></td>
                        <td className="cell-amount">₹800</td><td>—</td><td>Due 30 Jun</td>
                        <td><span className="stamp due">Due</span></td>
                        <td><span className="panel-link">Collect</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* ================= ATTENDANCE ================= */}
            {activeView === 'attendance' && (
              <section className="view active">
                <div className="topbar">
                  <div>
                    <div className="page-eyebrow">Today · 4 July</div>
                    <h1 className="page-title">Attendance</h1>
                  </div>
                  <div className="topbar-actions">
                    <div className="search">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
                      <input placeholder="Check in by name or seat" />
                    </div>
                  </div>
                </div>

                <div className="stat-strip" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: '20px' }}>
                  <div className="stat-card" style={{ '--stat-color': 'var(--teal)' }}><div className="stat-label">Checked in</div><div className="stat-value">{studentsList.length > 0 ? 62 : 0}</div></div>
                  <div className="stat-card" style={{ '--stat-color': 'var(--muted)' }}><div className="stat-label">Checked out</div><div className="stat-value">{studentsList.length > 0 ? 18 : 0}</div></div>
                  <div className="stat-card" style={{ '--stat-color': 'var(--mustard)' }}><div className="stat-label">Not yet arrived</div><div className="stat-value">{studentsList.length > 0 ? 34 : 0}</div></div>
                </div>

                <div className="panel">
                  <div className="panel-head"><h3 className="panel-title">Daily attendance list</h3></div>
                  <table className="ledger">
                    <thead>
                      <tr><th>Student</th><th>Seat</th><th>Check-in</th><th>Check-out</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {studentsList.length > 0 ? (
                        <React.Fragment>
                          <tr><td className="cell-name">Priya Sharma</td><td>A14</td><td className="mono">09:12 AM</td><td>—</td><td><span className="pill active">Present</span></td></tr>
                          <tr><td className="cell-name">Anjali Verma</td><td>B03</td><td className="mono">08:55 AM</td><td>—</td><td><span className="pill active">Present</span></td></tr>
                          <tr><td className="cell-name">Rohit Kumar</td><td>A07</td><td className="mono">08:20 AM</td><td className="mono">12:10 PM</td><td><span className="pill inactive">Left</span></td></tr>
                          <tr><td className="cell-name">Kavya Nair</td><td>C09</td><td className="mono">08:30 AM</td><td>—</td><td><span className="pill active">Present</span></td></tr>
                        </React.Fragment>
                      ) : (
                        <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--muted)' }}>No student attendance data found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* ================= REPORTS ================= */}
            {activeView === 'reports' && (
              <section className="view active">
                <div className="topbar">
                  <div>
                    <div className="page-eyebrow">Export</div>
                    <h1 className="page-title">Reports</h1>
                  </div>
                  <div className="topbar-actions">
                    <div className="chip" style={{ cursor: 'default' }}>This month ▾</div>
                  </div>
                </div>

                <div className="report-grid">
                  <div className="report-card">
                    <div className="report-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg></div>
                    <div className="report-name">Active students</div>
                    <div className="report-desc">Full roster of currently active members with seat and shift.</div>
                    <div className="report-actions"><button className="btn btn-ghost">Excel</button><button className="btn btn-ghost">PDF</button></div>
                  </div>
                  <div className="report-card">
                    <div className="report-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg></div>
                    <div className="report-name">Vacant seats</div>
                    <div className="report-desc">Available seats by shift, updated in real time.</div>
                    <div className="report-actions"><button className="btn btn-ghost">Excel</button><button className="btn btn-ghost">PDF</button></div>
                  </div>
                  <div className="report-card">
                    <div className="report-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg></div>
                    <div className="report-name">Fee collection</div>
                    <div className="report-desc">All payments recorded this month, grouped by method.</div>
                    <div className="report-actions"><button className="btn btn-ghost">Excel</button><button className="btn btn-ghost">PDF</button></div>
                  </div>
                  <div className="report-card">
                    <div className="report-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg></div>
                    <div className="report-name">Pending fees</div>
                    <div className="report-desc">Students with fees overdue, sorted by days pending.</div>
                    <div className="report-actions"><button className="btn btn-ghost">Excel</button><button className="btn btn-ghost">PDF</button></div>
                  </div>
                  <div className="report-card">
                    <div className="report-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18" /><path d="M7 13l4-4 3 3 5-6" /></svg></div>
                    <div className="report-name">Attendance summary</div>
                    <div className="report-desc">Daily check-in trends across the selected date range.</div>
                    <div className="report-actions"><button className="btn btn-ghost">Excel</button><button className="btn btn-ghost">PDF</button></div>
                  </div>
                </div>
              </section>
            )}

            {/* ================= SETTINGS ================= */}
            {activeView === 'settings' && (
              <section className="view active">
                <div className="topbar">
                  <div>
                    <div className="page-eyebrow">Configuration</div>
                    <h1 className="page-title">Settings</h1>
                  </div>
                </div>
                <div className="panel">
                  <div className="panel-head"><h3 className="panel-title">Library details</h3></div>
                  <p style={{ color: 'var(--muted)', fontSize: '13.5px' }}>
                    Library name, shift timings, fee structure, backup schedule, and staff accounts will live here in the full build.
                  </p>
                </div>
              </section>
            )}

          </main>
        </div>
      )}

      {/* ============ STUDENT PORTAL SHELL ============ */}
      {currentScreen === 'student-shell' && (
        <div className="student-shell">
          <header className="student-header">
            <div className="brand" onClick={() => setCurrentScreen('login')} style={{ cursor: 'pointer' }}>
              <div className="brand-mark">S</div>
              <div>
                <div className="brand-name" style={{ color: 'var(--ink)' }}>StudySpace</div>
                <div className="brand-sub" style={{ color: 'var(--muted)' }}>Sunrise Reading Room</div>
              </div>
            </div>
            <div className="student-header-right">
              <div className="student-avatar-name">
                <span className="avatar">AV</span>
                <span>Anjali Verma</span>
              </div>
              <button className="btn btn-ghost" onClick={handleStudentLogout}>Log out</button>
            </div>
          </header>

          <nav className="student-tabs">
            <div className={`student-tab ${studentView === 'overview' ? 'active' : ''}`} onClick={() => setStudentView('overview')}>Overview</div>
            <div className={`student-tab ${studentView === 'payments' ? 'active' : ''}`} onClick={() => setStudentView('payments')}>Payments</div>
            <div className={`student-tab ${studentView === 'attendance' ? 'active' : ''}`} onClick={() => setStudentView('attendance')}>Attendance</div>
          </nav>

          <main className="student-content">
            {/* ================= STUDENT: OVERVIEW ================= */}
            {studentView === 'overview' && (
              <section className="sview active">
                <div className="page-eyebrow">Saturday, 4 July</div>
                <h1 className="page-title" style={{ marginBottom: '22px' }}>Hi, Anjali</h1>

                <div className={`sub-card ${isSubPaid ? 'paid' : ''}`}>
                  <div className="sub-card-top">
                    <div>
                      <div className="sub-card-label">This month's subscription</div>
                      <div className="sub-card-amount">₹800</div>
                      <div className="sub-card-due">
                        {isSubPaid ? 'Paid for July ✓' : <span>Due on <b>10 July</b></span>}
                      </div>
                    </div>
                    <span className={`stamp ${isSubPaid ? 'paid' : 'due'}`}>{isSubPaid ? 'Paid' : 'Due'}</span>
                  </div>
                  {!isSubPaid && (
                    <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '16px' }} onClick={() => setPayNowOpen(true)}>Pay ₹800 now</button>
                  )}
                </div>

                <div className="stat-strip" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginTop: '20px' }}>
                  <div className="stat-card" style={{ '--stat-color': 'var(--teal)' }}>
                    <div className="stat-label">Your seat</div>
                    <div className="stat-value" style={{ fontSize: '20px' }}>B03</div>
                  </div>
                  <div className="stat-card" style={{ '--stat-color': 'var(--mustard)' }}>
                    <div className="stat-label">Shift</div>
                    <div className="stat-value" style={{ fontSize: '20px' }}>Evening</div>
                  </div>
                  <div className="stat-card" style={{ '--stat-color': 'var(--sage)' }}>
                    <div className="stat-label">Attendance this month</div>
                    <div className="stat-value" style={{ fontSize: '20px' }}>21 days</div>
                  </div>
                </div>

                <div className="panel" style={{ marginTop: '20px' }}>
                  <div className="panel-head"><h3 className="panel-title">Membership details</h3></div>
                  <div className="seat-detail-row"><span>Member since</span><b>20 Mar 2026</b></div>
                  <div className="seat-detail-row"><span>Parent / guardian</span><b>Suresh Verma</b></div>
                  <div className="seat-detail-row"><span>Registered mobile</span><b>97112 44556</b></div>
                  <div className="seat-detail-row"><span>Membership status</span><b>Active</b></div>
                </div>
              </section>
            )}

            {/* ================= STUDENT: PAYMENTS ================= */}
            {studentView === 'payments' && (
              <section className="sview active">
                <div className="page-eyebrow">Ledger</div>
                <h1 className="page-title" style={{ marginBottom: '22px' }}>Your payments</h1>
                <div className="panel">
                  <div className="panel-head"><h3 className="panel-title">Payment history</h3></div>
                  <table className="ledger">
                    <thead>
                      <tr><th>Month</th><th>Amount</th><th>Method</th><th>Date</th><th>Status</th><th></th></tr>
                    </thead>
                    <tbody>
                      {studentPaymentHistory.map((item, idx) => (
                        <tr key={idx}>
                          <td className="cell-name">{item.month}</td>
                          <td className="cell-amount">{item.amount}</td>
                          <td>{item.method}</td>
                          <td>{item.date}</td>
                          <td><span className="stamp paid">{item.status}</span></td>
                          <td><span className="panel-link">Receipt</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* ================= STUDENT: ATTENDANCE ================= */}
            {studentView === 'attendance' && (
              <section className="sview active">
                <div className="page-eyebrow">This month</div>
                <h1 className="page-title" style={{ marginBottom: '22px' }}>Your attendance</h1>
                <div className="panel">
                  <div className="panel-head"><h3 className="panel-title">Recent check-ins</h3></div>
                  <table className="ledger">
                    <thead>
                      <tr><th>Date</th><th>Check-in</th><th>Check-out</th></tr>
                    </thead>
                    <tbody>
                      <tr><td className="cell-name">04 Jul</td><td className="mono">02:05 PM</td><td>—</td></tr>
                      <tr><td className="cell-name">03 Jul</td><td className="mono">02:10 PM</td><td className="mono">08:55 PM</td></tr>
                      <tr><td className="cell-name">02 Jul</td><td className="mono">02:00 PM</td><td className="mono">09:02 PM</td></tr>
                      <tr><td className="cell-name">01 Jul</td><td className="mono">02:15 PM</td><td className="mono">08:40 PM</td></tr>
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </main>
        </div>
      )}

      {/* ============ MODALS ============ */}
      <PayNowModal
        open={payNowOpen}
        onClose={() => setPayNowOpen(false)}
        onSubmit={handlePayNowSubmit}
      />

      <AddStudentModal
        open={addStudentOpen}
        onClose={() => setAddStudentOpen(false)}
        onSubmit={handleAddStudentSubmit}
        vacantSeats={fullSeats.filter(s => s.status === 'available')}
      />
    </React.Fragment>
  );
}

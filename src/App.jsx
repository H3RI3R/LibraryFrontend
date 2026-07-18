import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Toast from './components/Toast';
import PayNowModal from './components/PayNowModal';
import AddStudentModal from './components/AddStudentModal';
import ViewStudentModal from './components/ViewStudentModal';
import StudentProfileModal from './components/StudentProfileModal';
import AddFeeModal from './components/AddFeeModal';
import api, { API_BASE_URL } from './api';

const originalFetch = window.fetch;
window.fetch = async function (...args) {
  try {
    const response = await originalFetch(...args);
    let shouldRedirect = false;

    if (response.status === 401) {
      shouldRedirect = true;
    } else {
      try {
        const clone = response.clone();
        const json = await clone.json();
        if (json && (json.message === 'Expired Token' || json.message === 'Unauthorized token' || json.statusCode === 401)) {
          shouldRedirect = true;
        }
      } catch (ignored) { }
    }

    if (shouldRedirect) {
      const hadToken = !!localStorage.getItem('token');
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      if (hadToken) {
        localStorage.setItem('session_expired_toast', 'true');
        window.location.href = '/';
      }
    }

    return response;
  } catch (error) {
    throw error;
  }
};

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

function parseDateDMY(dateStr) {
  if (!dateStr) return null;
  if (typeof dateStr !== 'string') return new Date(dateStr);
  if (dateStr.includes('-')) {
    return new Date(dateStr);
  }
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }
  return new Date(dateStr);
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
  // --- Routing Navigation ---
  const navigate = useNavigate();
  const location = useLocation();

  // --- Login State ---
  const [loginRole, setLoginRole] = useState('owner'); // 'owner' or 'student'
  const [loginTab, setLoginTab] = useState('email'); // 'mobile' or 'email'
  const [ownerMobile, setOwnerMobile] = useState('98110 22341');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('••••••••');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);

  const [studentMobile, setStudentMobile] = useState('97112 44556');
  const [studentLoginStep, setStudentLoginStep] = useState(1); // 1: mobile input, 2: OTP input
  const [otpInputs, setOtpInputs] = useState(['4', '2', '8', '1', '9', '5']);

  // --- OTP Login State ---
  const [showOtpView, setShowOtpView] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [timer, setTimer] = useState(0);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // --- Onboarding Wizard State (Persistent when moving back/forth) ---
  const [obStep, setObStep] = useState(1);
  const [obOwnerName, setObOwnerName] = useState('Ritik Soni');
  const [obOwnerMobile, setObOwnerMobile] = useState('08890846567');
  const [obOwnerEmail, setObOwnerEmail] = useState('staff@gmail.com');
  const [obOwnerPassword, setObOwnerPassword] = useState('123456');
  const [obOwnerPassword2, setObOwnerPassword2] = useState('123456');
  const [obLibName, setObLibName] = useState('Sunrise Reading Room');
  const [obLibCity, setObLibCity] = useState('Sector 12, Dadri');
  const [obLibState, setObLibState] = useState('Uttar Pradesh');
  const [obLibAddress, setObLibAddress] = useState('Building, street, landmark');
  const [obShifts, setObShifts] = useState({ Morning: true, Evening: true, 'Full day': false });
  const [obShiftTimings, setObShiftTimings] = useState({
    Morning: '7 AM – 2 PM',
    Evening: '2 PM – 9 PM',
    'Full day': '7 AM – 9 PM'
  });
  const [studentShiftFilter, setStudentShiftFilter] = useState('All shifts');
  const [obTotalSeats, setObTotalSeats] = useState(60);
  const [obFeeAmount, setObFeeAmount] = useState(800);
  const [obDueDay, setObDueDay] = useState(5);
  const [obPayMethods, setObPayMethods] = useState({ Cash: true, UPI: true, 'Bank Transfer': false });

  // Onboarding verification states
  const [obEmailVerified, setObEmailVerified] = useState(false);
  const [obOtpSent, setObOtpSent] = useState(false);
  const [obOtpValue, setObOtpValue] = useState('');
  const [obVerificationToken, setObVerificationToken] = useState('');
  const [plansList, setPlansList] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);

  // --- Global Library Configuration & State ---
  const [libraryName, setLibraryName] = useState('Sunrise Reading Room');
  const [libraryCity, setLibraryCity] = useState('Sector 12, Dadri');
  const [ownerName, setOwnerName] = useState('Ritik');
  const [totalSeats, setTotalSeats] = useState(120);
  const [isTrialExpired, setIsTrialExpired] = useState(false);
  const [settingsData, setSettingsData] = useState({
    libraryName: '',
    address: '',
    city: '',
    state: '',
    planName: '',
    planStatus: '',
    endDate: ''
  });
  const [settingsLoading, setSettingsLoading] = useState(false);

  // --- Seats Caching ---
  const [dashSeats, setDashSeats] = useState([]);
  const [fullSeats, setFullSeats] = useState([]);
  const [selectedSeatIndex, setSelectedSeatIndex] = useState(null);

  // Seat filter (seats view)
  const [seatFilter, setSeatFilter] = useState('All shifts');

  // Initialize seats once on mount
  useEffect(() => {
    fetchSeats();

    // Load Razorpay script dynamically
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (localStorage.getItem('session_expired_toast') === 'true') {
      localStorage.removeItem('session_expired_toast');
      showToast('Session expired. Please log in again.');
    }
  }, []);

  // Global Route Guard to redirect if token is missing
  useEffect(() => {
    const token = localStorage.getItem('token');
    if ((location.pathname === '/dashboard' || location.pathname === '/student') && !token) {
      navigate('/login');
    }
  }, [location.pathname, navigate]);

  // Synchronize logout across multiple tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'token' && !e.newValue) {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        window.location.href = '/';
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Fetch plans from backend on wizard activation
  useEffect(() => {
    if (location.pathname === '/onboarding') {
      fetch(`${API_BASE_URL}/api/plans`)
        .then(res => res.json())
        .then(data => {
          setPlansList(data);
          if (data && data.length > 0) {
            setSelectedPlanId(data[0].id);
          }
        })
        .catch(err => {
          console.error("Error loading plans:", err);
          // Fallback static list
          const fallback = [
            { id: 1, planName: 'Starter', monthlyPrice: 499, description: 'Up to 100 seats · core modules' },
            { id: 2, planName: 'Growth', monthlyPrice: 999, description: 'Up to 300 seats · student panel included' },
            { id: 3, planName: 'Pro', monthlyPrice: 1499, description: 'Unlimited seats · priority support' }
          ];
          setPlansList(fallback);
          setSelectedPlanId(1);
        });
    }
  }, [location.pathname]);

  // Load students from backend when dashboard is loaded
  useEffect(() => {
    if (location.pathname === '/dashboard') {
      const token = localStorage.getItem('token');
      if (token) {
        fetch(`${API_BASE_URL}/api/student/all`, {
          headers: {
            'Authorization': token
          }
        })
          .then(res => res.json())
          .then(resData => {
            if ((resData.success || resData.status === 'success') && Array.isArray(resData.data)) {
              const mapped = resData.data.map(s => ({
                id: s.id,
                name: s.studentName,
                mobile: s.mobileNumber,
                shift: s.shift,
                seat: s.assignedSeat,
                joined: s.joiningDate ? parseDateDMY(s.joiningDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
                status: s.membershipStatus ? s.membershipStatus.toLowerCase() : 'active',
                profileImage: s.profileImage,
                email: s.email,
                gender: s.gender,
                age: s.age,
                parentName: s.parentName,
                parentMobile: s.parentMobile,
                address: s.address,
                monthlyFee: s.monthlyFee,
                joinedRaw: s.joiningDate
              }));
              setStudentsList(mapped);
            }
          })
          .catch(err => console.error("Error fetching students:", err));

        fetchDashboardData();
        fetchSettingsData();
      }
    } else if (location.pathname === '/student') {
      fetchStudentDashboard();
    }
  }, [location.pathname]);



  // --- Students Caching ---
  const [studentsList, setStudentsList] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');

  // --- Owner Dashboard views navigation ---
  // Views: 'dashboard', 'students', 'seats', 'fees', 'attendance', 'reports', 'settings'
  const [activeView, setActiveView] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // --- Student Portal view navigation ---
  // Views: 'overview', 'payments', 'attendance', 'leave'
  const [studentView, setStudentView] = useState('overview');

  // --- Leaving Requests State ---
  const [leavingRequests, setLeavingRequests] = useState([]);
  const [leavingRequestsLoading, setLeavingRequestsLoading] = useState(false);
  const [leavingForm, setLeavingForm] = useState({ leavingDate: '', reason: '', rating: 5 });
  const [leavingSubmitting, setLeavingSubmitting] = useState(false);
  const [leavingResult, setLeavingResult] = useState(null);
  const [leavingStep, setLeavingStep] = useState('form'); // 'form' | 'preview' | 'confirmed'
  const [leavingPreviewData, setLeavingPreviewData] = useState(null);
  const [settleRefundOpen, setSettleRefundOpen] = useState(false);
  const [settleRefundData, setSettleRefundData] = useState(null);
  const [settleRefundForm, setSettleRefundForm] = useState({ mode: 'CASH', screenshot: '' });
  const [settleRefundSubmitting, setSettleRefundSubmitting] = useState(false);

  // --- Modals State ---
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [payNowOpen, setPayNowOpen] = useState(false);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState(null);
  const [viewStudentOpen, setViewStudentOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentToEdit, setStudentToEdit] = useState(null);
  const [seatModalOpen, setSeatModalOpen] = useState(false);
  const [editingSeatId, setEditingSeatId] = useState(null);
  const [seatForm, setSeatForm] = useState({ seatNumber: '', floor: '', section: '' });
  const [attendanceList, setAttendanceList] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({ checkedIn: 0, checkedOut: 0, notYetArrived: 0 });
  const [attendanceSearch, setAttendanceSearch] = useState('');
  const [editAttendanceOpen, setEditAttendanceOpen] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState(null);
  const [attendanceForm, setAttendanceForm] = useState({ status: 'PRESENT', checkIn: '', checkOut: '' });
  const [selectedFeeForPayment, setSelectedFeeForPayment] = useState(null);
  const [feeStats, setFeeStats] = useState({ collectedThisMonth: 0, totalDue: 0, studentsOverdue: 0 });
  const [feeHistoryList, setFeeHistoryList] = useState([]);
  const [feeFilter, setFeeFilter] = useState('all');
  const [addFeeOpen, setAddFeeOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [studentDashboardData, setStudentDashboardData] = useState(null);
  const [studentProfileOpen, setStudentProfileOpen] = useState(false);

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

  const fetchDashboardData = () => {
    const token = localStorage.getItem('token');
    if (token) {
      api.dashboardApi.get()
        .then(res => {
          if ((res.success || res.status === 'success') && res.data) {
            setDashboardData(res.data);

            // Map seats to match UI format
            if (Array.isArray(res.data.seats)) {
              const mappedSeats = res.data.seats.map(s => {
                const foundStudent = studentsList.find(st => st.id === s.studentId);
                return {
                  id: s.id,
                  label: s.seatNumber,
                  floor: s.floor,
                  section: s.section,
                  status: s.status === 'AVAILABLE' ? 'available' : s.status === 'OCCUPIED' ? 'occupied' : 'due',
                  student: foundStudent ? foundStudent.name : (s.studentId ? 'Occupied' : null)
                };
              });
              setDashSeats(mappedSeats.slice(0, 36));
              setFullSeats(mappedSeats);
            }

            // Sync stats
            setTotalSeats(res.data.totalSeats || 0);
            if (res.data.activities) {
              setActivityFeed(res.data.activities);
            }
          }
        })
        .catch(console.error);
    }
  };

  const fetchStudentDashboard = () => {
    const token = localStorage.getItem('token');
    if (token) {
      api.dashboardApi.get()
        .then(res => {
          if ((res.success || res.status === 'success') && res.data) {
            setStudentDashboardData(res.data);
          }
        })
        .catch(console.error);
    }
  };

  const handleStudentCheckIn = () => {
    const token = localStorage.getItem('token');
    fetch(`${API_BASE_URL}/api/attendance/check-in`, {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        studentId: studentDashboardData.studentId,
        seatNumber: studentDashboardData.assignedSeat
      })
    })
      .then(res => res.json())
      .then(resData => {
        if (resData.success || resData.status === 'success') {
          showToast('Checked in successfully!');
          fetchStudentDashboard();
        } else {
          showToast(`Check-in failed: ${resData.message}`);
        }
      })
      .catch(err => {
        console.error("Check-in error:", err);
        showToast('An error occurred during check-in.');
      });
  };

  const handleStudentCheckOut = () => {
    const token = localStorage.getItem('token');
    fetch(`${API_BASE_URL}/api/attendance/check-out/${studentDashboardData.studentId}`, {
      method: 'PUT',
      headers: {
        'Authorization': token
      }
    })
      .then(res => res.json())
      .then(resData => {
        if (resData.success || resData.status === 'success') {
          showToast('Checked out successfully!');
          fetchStudentDashboard();
        } else {
          showToast(`Check-out failed: ${resData.message}`);
        }
      })
      .catch(err => {
        console.error("Check-out error:", err);
        showToast('An error occurred during check-out.');
      });
  };

  const fetchSettingsData = () => {
    setSettingsLoading(true);
    api.libraryApi.getSettings()
      .then(res => {
        if ((res.success || res.status === 'success') && res.data) {
          setSettingsData(res.data);
          setLibraryName(res.data.libraryName);
          setLibraryCity(res.data.city);
        }
      })
      .catch(console.error)
      .finally(() => setSettingsLoading(false));
  };

  const handleUpdateSettings = (e) => {
    e.preventDefault();
    setSettingsLoading(true);
    api.libraryApi.updateSettings({
      libraryName: settingsData.libraryName,
      address: settingsData.address,
      city: settingsData.city,
      state: settingsData.state
    })
      .then(res => {
        if (res.success || res.status === 'success') {
          showToast('Settings updated successfully!');
          fetchSettingsData();
        } else {
          showToast(res.message || 'Failed to update settings');
        }
      })
      .catch(() => showToast('Error updating settings'))
      .finally(() => setSettingsLoading(false));
  };

  const fetchLeavingRequests = () => {
    setLeavingRequestsLoading(true);
    const token = localStorage.getItem('token');
    fetch(`${API_BASE_URL}/api/leaving/admin/list`, { headers: { Authorization: token } })
      .then(r => r.json())
      .then(d => { if (d.data) setLeavingRequests(d.data); })
      .catch(console.error)
      .finally(() => setLeavingRequestsLoading(false));
  };

  useEffect(() => {
    if (activeView === 'dashboard') {
      fetchDashboardData();
      fetchSeats();
    }
    if (activeView === 'attendance' || activeView === 'seats') {
      fetchAttendanceData();
    }
    if (activeView === 'seats' || activeView === 'students') {
      fetchSeats();
    }
    if (activeView === 'fees') {
      fetchFeeData();
    }
    if (activeView === 'settings') {
      fetchSettingsData();
    }
    if (activeView === 'leaving-requests') {
      fetchLeavingRequests();
    }
  }, [activeView, feeFilter]);

  const getParsedShiftsList = () => {
    const rawShifts = settingsData.shifts || 'Morning (7 AM – 2 PM),Evening (2 PM – 9 PM),Full day (7 AM – 9 PM)';
    const parsed = rawShifts.split(',').map(s => s.trim());
    return ['All shifts', ...parsed];
  };

  const getDisplaySeats = () => {
    let activeShift = null;
    const lowerFilter = seatFilter.toLowerCase();
    if (lowerFilter.includes('morning')) {
      activeShift = 'morning';
    } else if (lowerFilter.includes('evening')) {
      activeShift = 'evening';
    } else if (lowerFilter.includes('full')) {
      activeShift = 'full day';
    }

    return fullSeats.map(seat => {
      if (seat.status === 'uncreated') return seat;

      const assignedStudents = studentsList.filter(st => st.seat === seat.label);

      let matchedStudent = null;
      if (activeShift) {
        matchedStudent = assignedStudents.find(st => {
          const stShift = (st.shift || '').toLowerCase().replace('_', ' ');
          return stShift === activeShift;
        });
      } else {
        matchedStudent = assignedStudents[0];
      }

      if (matchedStudent) {
        return {
          ...seat,
          status: matchedStudent.status === 'due' ? 'due' : 'occupied',
          student: matchedStudent.name
        };
      } else {
        return {
          ...seat,
          status: 'available',
          student: null
        };
      }
    });
  };

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

  const fetchSeats = () => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch(`${API_BASE_URL}/api/seats`, { headers: { 'Authorization': token } })
        .then(res => res.json())
        .then(resData => {
          if ((resData.success || resData.status === 'success') && Array.isArray(resData.data)) {
            const mappedSeats = resData.data.map(s => ({
              id: s.id,
              label: s.seatNumber,
              floor: s.floor,
              section: s.section,
              status: s.status === 'AVAILABLE' ? 'available' : s.status === 'OCCUPIED' ? 'occupied' : 'reserved',
              student: null
            }));

            const mergedSeats = [...mappedSeats];
            const limit = totalSeats || 60;

            while (mergedSeats.length < limit) {
              mergedSeats.push({
                label: '',
                status: 'uncreated',
                student: null
              });
            }

            setDashSeats(mergedSeats.slice(0, 36));
            setFullSeats(mergedSeats);
          }
        })
        .catch(console.error);
    }
  };

  const fetchAttendanceData = () => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch(`${API_BASE_URL}/api/attendance/today`, { headers: { 'Authorization': token } })
        .then(res => res.json())
        .then(resData => {
          if ((resData.success || resData.status === 'success') && Array.isArray(resData.data)) {
            setAttendanceList(resData.data);
          }
        })
        .catch(console.error);

      fetch(`${API_BASE_URL}/api/attendance/dashboard`, { headers: { 'Authorization': token } })
        .then(res => res.json())
        .then(resData => {
          if ((resData.success || resData.status === 'success') && resData.data) {
            setAttendanceStats({
              checkedIn: resData.data.checkedIn || 0,
              checkedOut: resData.data.checkedOut || 0,
              notYetArrived: resData.data.notYetArrived || 0
            });
          }
        })
        .catch(console.error);
    }
  };

  const fetchFeeData = () => {
    const token = localStorage.getItem('token');
    if (token) {
      api.feeApi.dashboard()
        .then(res => {
          if ((res.success || res.status === 'success') && res.data) {
            setFeeStats({
              collectedThisMonth: res.data.collectedThisMonth || 0,
              totalDue: res.data.totalDue || 0,
              studentsOverdue: res.data.studentsOverdue || 0
            });
          }
        })
        .catch(console.error);

      let apiCall;
      if (feeFilter === 'paid') {
        apiCall = api.feeApi.paymentHistory();
      } else if (feeFilter === 'due') {
        apiCall = api.feeApi.dueList();
      } else {
        apiCall = api.feeApi.getAll();
      }

      apiCall
        .then(res => {
          if ((res.success || res.status === 'success') && Array.isArray(res.data)) {
            setFeeHistoryList(res.data);
          } else {
            setFeeHistoryList([]);
          }
        })
        .catch(err => {
          console.error("Error loading fees:", err);
          setFeeHistoryList([]);
        });
    }
  };

  const handleExportReport = (reportType, format) => {
    let apiCall;
    let filename = reportType;
    let headers = [];
    let mapRow = () => { };

    if (reportType === 'active-students') {
      apiCall = api.reportApi.getActiveStudents();
      headers = ['Student ID', 'Name', 'Mobile', 'Parent Name', 'Seat', 'Shift', 'Status'];
      mapRow = (s) => [s.studentId, s.studentName, s.mobileNumber, s.parentName, s.assignedSeat || '—', s.shift, s.membershipStatus];
    } else if (reportType === 'vacant-seats') {
      apiCall = api.reportApi.getVacantSeats();
      headers = ['Seat ID', 'Seat Number', 'Floor', 'Section', 'Status'];
      mapRow = (s) => [s.seatId, s.seatNumber, s.floor, s.section, s.status];
    } else if (reportType === 'pending-fees') {
      apiCall = api.reportApi.getPendingFees();
      headers = ['Student ID', 'Student Name', 'Seat Number', 'Pending Amount', 'Due Date'];
      mapRow = (f) => [f.studentId, f.studentName, f.seatNumber, f.pendingAmount, f.dueDate];
    } else if (reportType === 'attendance-log') {
      const token = localStorage.getItem('token');
      apiCall = fetch(`${API_BASE_URL}/api/attendance/today`, { headers: { 'Authorization': token } }).then(res => res.json());
      headers = ['Date', 'Student Name', 'Seat Number', 'Check-in', 'Check-out', 'Status'];
      mapRow = (a) => [a.attendanceDate, a.studentName, a.seatNumber, a.checkIn || '—', a.checkOut || '—', a.status];
    } else if (reportType === 'fee-collection') {
      apiCall = api.reportApi.getFeeCollection();
    }

    if (apiCall) {
      apiCall.then(res => {
        if ((res.success || res.status === 'success') && reportType === 'fee-collection') {
          if (format === 'excel') {
            const csvContent = "data:text/csv;charset=utf-8,\uFEFF"
              + ["Month,Year,Total Collection"].join(",") + "\n"
              + [res.data.month, res.data.year, res.data.totalCollection || 0].join(",");
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `fee-collection-summary.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          } else {
            alert(`Current Month Collection Summary:\nMonth: ${res.data.month}\nYear: ${res.data.year}\nTotal Collection: ₹${res.data.totalCollection || 0}`);
          }
          return;
        }

        if ((res.success || res.status === 'success') && Array.isArray(res.data)) {
          const rows = res.data.map(mapRow);
          if (format === 'excel') {
            const csvContent = "data:text/csv;charset=utf-8,\uFEFF"
              + [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `${filename}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast(`${filename} exported to Excel/CSV`);
          } else {
            const printWindow = window.open('', '_blank');
            const htmlContent = `
              <html>
                <head>
                  <title>${filename.toUpperCase()} REPORT</title>
                  <style>
                    body { font-family: system-ui, sans-serif; padding: 24px; color: #333; }
                    h1 { font-size: 24px; margin-bottom: 20px; text-transform: uppercase; color: #0284c7; }
                    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 14px; }
                    th { background-color: #f3f4f6; font-weight: 600; }
                    tr:nth-child(even) { background-color: #f9fafb; }
                  </style>
                </head>
                <body>
                  <h1>${filename.replace(/-/g, ' ')} report</h1>
                  <p>Generated on: ${new Date().toLocaleDateString('en-GB')}</p>
                  <table>
                    <thead>
                      <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
                    </thead>
                    <tbody>
                      ${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
                    </tbody>
                  </table>
                  <script>
                    window.onload = function() { window.print(); window.close(); }
                  </script>
                </body>
              </html>
            `;
            printWindow.document.write(htmlContent);
            printWindow.document.close();
          }
        } else {
          alert("No data found to export.");
        }
      }).catch(err => {
        console.error("Export error:", err);
        alert("Failed to export report data.");
      });
    }
  };

  const handlePayNowSubmit = (method, amount, paymentDate) => {
    if (!selectedFeeForPayment) {
      showToast('Error: No fee record selected.');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      showToast('Session expired. Please log in again.');
      return;
    }

    // Close the modal first
    setPayNowOpen(false);

    if (method === 'Cash') {
      api.feeApi.pay({
        feeId: selectedFeeForPayment.id,
        paidAmount: amount,
        paymentMode: 'Cash',
        paymentDate: paymentDate || new Date().toISOString().split('T')[0]
      })
      .then(res => {
        if (res.status === 'success' || res.success) {
          showToast('✅ Cash payment recorded successfully!');
          setSelectedFeeForPayment(null);
          const role = localStorage.getItem('role');
          if (role === 'STUDENT') {
            fetchStudentDashboard();
          } else {
            fetchFeeData();
            fetchDashboardData();
          }
        } else {
          showToast(res.message || '❌ Failed to record cash payment.');
        }
      })
      .catch(err => {
        console.error(err);
        showToast('❌ Error recording cash payment.');
      });
      return;
    }

    // Step 1: Create Razorpay order from backend
    api.feeApi.razorpayCreateOrder(selectedFeeForPayment.id)
      .then(orderData => {
        if (!orderData || orderData.status !== 'success') {
          showToast('❌ Failed to initiate payment. Please try again.');
          return;
        }

        // Load Razorpay script if not already loaded
        const loadRazorpay = () => new Promise((resolve) => {
          if (window.Razorpay) { resolve(true); return; }
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          document.body.appendChild(script);
        });

        loadRazorpay().then(loaded => {
          if (!loaded) {
            showToast('❌ Razorpay SDK failed to load. Check your internet connection.');
            return;
          }

          const options = {
            key: orderData.keyId,
            amount: orderData.amount,
            currency: orderData.currency || 'INR',
            name: 'StudySpace Library',
            description: `Fee for ${selectedFeeForPayment.month}/${selectedFeeForPayment.year}`,
            order_id: orderData.orderId,
            prefill: {},
            theme: { color: '#6366f1' },

            // ✅ SUCCESS: signature received → verify on backend → mark PAID
            handler: function (response) {
              api.feeApi.razorpayVerify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                feeId: String(selectedFeeForPayment.id),
                paymentMode: 'RAZORPAY',
                paidAmount: String(selectedFeeForPayment.dueAmount)
              }).then(res => {
                if (res.status === 'success' || res.success) {
                  showToast('✅ Payment successful! Fee marked as paid.');
                  setSelectedFeeForPayment(null);
                  const role = localStorage.getItem('role');
                  if (role === 'STUDENT') {
                    fetchStudentDashboard();
                  } else {
                    fetchFeeData();
                  }
                } else {
                  showToast('⚠️ Payment received but verification failed. Please contact support.');
                }
              }).catch(() => {
                showToast('⚠️ Verification error. Please contact support.');
              });
            },

            // ❌ DISMISSED / GO BACK: do NOT collect fee
            modal: {
              ondismiss: function () {
                showToast('🚫 Payment cancelled. No fees were collected.');
                setSelectedFeeForPayment(null);
              }
            }
          };

          const rzp = new window.Razorpay(options);

          // Also handle payment failure (card declined, etc.)
          rzp.on('payment.failed', function (response) {
            showToast(`❌ Payment failed: ${response.error.description || 'Unknown error'}`);
            setSelectedFeeForPayment(null);
          });

          rzp.open();
        });
      })
      .catch(err => {
        console.error('Razorpay order creation error:', err);
        showToast('❌ Could not connect to payment server.');
      });
  };

  const handleAddFeeSubmit = (feeData) => {

    const token = localStorage.getItem('token');
    if (!token) {
      showToast('Session expired. Please log in again.');
      return;
    }

    api.feeApi.create({
      studentId: feeData.studentId,
      month: feeData.month,
      year: feeData.year,
      amount: feeData.amount,
      dueDate: feeData.dueDate
    })
      .then(res => {
        if (res.success || res.status === 'success') {
          showToast('Fee invoice created successfully.');
          setAddFeeOpen(false);
          fetchFeeData();
        } else {
          alert(res.message || 'Failed to create fee record.');
        }
      })
      .catch(err => {
        console.error("Error creating fee invoice:", err);
        showToast('Error creating fee record.');
      });
  };

  // --- Actions ---
  const handleOwnerLogin = (e) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(ownerEmail)) {
      showToast('Please enter a valid email address.');
      return;
    }
    const emailToCheck = loginTab === 'email' ? ownerEmail : ownerMobile;

    fetch(`${API_BASE_URL}/login/all`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: emailToCheck,
        password: ownerPassword,
        rememberMe: rememberMe
      })
    })
      .then(res => res.json())
      .then(loginData => {
        if (loginData.status === 'success') {
          localStorage.setItem('token', loginData.token);
          localStorage.setItem('role', loginData.role);

          if (loginData.role === 'STUDENT') {
            navigate('/student');
            showToast('Logged in successfully.');
            return;
          }

          // Now fetch status/details
          fetch(`${API_BASE_URL}/signup/status?email=${encodeURIComponent(emailToCheck)}`)
            .then(res => res.json())
            .then(resData => {
              if (resData.status === 'success') {
                setIsTrialExpired(resData.data.isExpired);
                setLibraryName(resData.data.library.name);
                setLibraryCity(resData.data.library.city);
                setTotalSeats(resData.data.library.totalSeats);
              }
              navigate('/dashboard');
              showToast('Logged in successfully.');
            })
            .catch(err => {
              console.error("Error verifying trial status:", err);
              navigate('/dashboard');
            });
        } else {
          showToast(`Login failed: ${loginData.message}`);
        }
      })
      .catch(err => {
        console.error("Login API error:", err);
        showToast('Failed to connect to login API.');
      });
  };

  const handleSendOtpLogin = (e) => {
    if (e) e.preventDefault();
    if (!otpEmail) {
      showToast('Please enter your email.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(otpEmail)) {
      showToast('Please enter a valid email address.');
      return;
    }
    fetch(`${API_BASE_URL}/login/getOtp?email=${encodeURIComponent(otpEmail)}`, {
      method: 'POST'
    })
      .then(res => res.json())
      .then(resData => {
        if (resData.status === 'success') {
          showToast('OTP sent successfully.');
          setOtpSent(true);
          setTimer(10);
        } else {
          if (resData.message && resData.message.includes('User not found')) {
            showToast('There is no registration, please register first.');
          } else {
            showToast(resData.message || 'Failed to send OTP.');
          }
        }
      })
      .catch(err => {
        console.error("OTP send error:", err);
        showToast('Failed to connect to server.');
      });
  };

  const handleVerifyOtpLogin = (e) => {
    if (e) e.preventDefault();
    if (!otpCode) {
      showToast('Please enter the OTP.');
      return;
    }
    fetch(`${API_BASE_URL}/login/verify-otp-login?email=${encodeURIComponent(otpEmail)}&otp=${encodeURIComponent(otpCode)}&rememberMe=${rememberMe}`, {
      method: 'POST'
    })
      .then(res => res.json())
      .then(loginData => {
        if (loginData.status === 'success') {
          localStorage.setItem('token', loginData.token);
          localStorage.setItem('role', loginData.role);

          if (loginData.role === 'STUDENT') {
            navigate('/student');
            showToast('Logged in successfully.');
            return;
          }

          // Fetch status/details
          fetch(`${API_BASE_URL}/signup/status?email=${encodeURIComponent(otpEmail)}`)
            .then(res => res.json())
            .then(resData => {
              if (resData.status === 'success') {
                setIsTrialExpired(resData.data.isExpired);
                setLibraryName(resData.data.library.name);
                setLibraryCity(resData.data.library.city);
                setTotalSeats(resData.data.library.totalSeats);
              }
              navigate('/dashboard');
              showToast('Logged in successfully.');
            })
            .catch(err => {
              console.error("Error verifying trial status:", err);
              navigate('/dashboard');
            });
        } else {
          showToast(loginData.message || 'OTP verification failed.');
        }
      })
      .catch(err => {
        console.error("OTP Verification error:", err);
        showToast('Failed to verify OTP.');
      });
  };

  const handleLogout = () => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch(`${API_BASE_URL}/login/logout`, {
        method: 'DELETE',
        headers: {
          'Authorization': token
        }
      }).catch(err => console.error("Logout API error:", err));
    }
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
    setLoginRole('owner');
    setStudentLoginStep(1);
    showToast('Logged out successfully.');
  };

  const handleSendStudentOtp = () => {
    setStudentLoginStep(2);
    showToast(`OTP sent to <b>${studentMobile}</b> (demo code pre-filled).`);
  };

  const handleVerifyStudentOtp = () => {
    navigate('/student');
    showToast('Welcome back, <b>Anjali</b>!');
  };

  const handleStudentLogout = () => {
    handleLogout();
  };

  const handleStudentProfileUpdate = (updatedData) => {
    if (!studentDashboardData || !studentDashboardData.studentId) return;

    const formData = new FormData();
    formData.append('studentName', updatedData.studentName);
    formData.append('mobileNumber', updatedData.mobileNumber);
    formData.append('parentName', updatedData.parentName || '');
    formData.append('parentMobile', updatedData.parentMobile || '');
    formData.append('address', updatedData.address || '');
    formData.append('age', studentDashboardData.age || 20);
    formData.append('gender', studentDashboardData.gender || 'MALE');
    formData.append('joiningDate', studentDashboardData.joiningDate || '');
    formData.append('assignedSeat', studentDashboardData.assignedSeat || '');
    formData.append('shift', studentDashboardData.shift === 'Full day' ? 'FULL_DAY' : (studentDashboardData.shift ? studentDashboardData.shift.toUpperCase() : 'FULL_DAY'));
    formData.append('membershipStatus', studentDashboardData.membershipStatus || 'ACTIVE');
    formData.append('monthlyFee', studentDashboardData.monthlyFee || 800);

    if (updatedData.imageFile) {
      formData.append('imageFile', updatedData.imageFile);
    } else if (updatedData.profileImage) {
      formData.append('profileImage', updatedData.profileImage);
    }

    api.studentApi.update(studentDashboardData.studentId, formData)
      .then(res => {
        if (res.success || res.status === 'success') {
          showToast('Profile updated successfully.');
          setStudentProfileOpen(false);
          fetchStudentDashboard();
        } else {
          showToast(`Failed to update profile: ${res.message}`);
        }
      })
      .catch(err => {
        console.error("Error updating student profile:", err);
        showToast('Error updating profile.');
      });
  };

  const handleAddStudentSubmit = (studentData) => {
    const token = localStorage.getItem('token');
    if (!token) {
      showToast('Session expired. Please log in again.');
      return;
    }

    const formData = new FormData();
    formData.append('studentName', studentData.name);
    formData.append('mobileNumber', studentData.mobile);
    formData.append('parentName', studentData.parentName || 'Parent Name');
    formData.append('parentMobile', studentData.parentMobile || '9999999999');
    formData.append('address', studentData.address || 'Address');
    formData.append('joiningDate', studentData.joinedRaw || new Date().toISOString().split('T')[0]);
    formData.append('assignedSeat', studentData.seat);
    formData.append('shift', studentData.shift === 'Full day' ? 'FULL_DAY' : studentData.shift.toUpperCase());
    formData.append('membershipStatus', studentData.status ? studentData.status.toUpperCase() : 'ACTIVE');
    formData.append('email', studentData.email);
    formData.append('gender', studentData.gender ? studentData.gender.toUpperCase() : 'MALE');
    formData.append('age', studentData.age || 20);
    formData.append('monthlyFee', studentData.monthlyFee || 800);

    if (studentData.imageFile) {
      formData.append('imageFile', studentData.imageFile);
    } else if (studentData.profileImage) {
      formData.append('profileImage', studentData.profileImage);
    }

    const isEdit = !!studentToEdit;
    const url = isEdit ? `${API_BASE_URL}/api/student/${studentToEdit.id}` : `${API_BASE_URL}/api/student`;
    const method = isEdit ? 'PUT' : 'POST';

    fetch(url, {
      method: method,
      headers: {
        'Authorization': token
      },
      body: formData
    })
      .then(res => res.json())
      .then(resData => {
        if (resData.success || resData.status === 'success') {
          const s = resData.data;
          const newStudent = {
            id: s.id,
            name: s.studentName,
            mobile: s.mobileNumber,
            shift: s.shift,
            seat: s.assignedSeat,
            joined: s.joiningDate ? parseDateDMY(s.joiningDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
            status: s.membershipStatus ? s.membershipStatus.toLowerCase() : 'active',
            profileImage: s.profileImage,
            email: s.email,
            gender: s.gender,
            age: s.age,
            parentName: s.parentName,
            parentMobile: s.parentMobile,
            address: s.address,
            monthlyFee: s.monthlyFee,
            joinedRaw: s.joiningDate
          };
          
          if (isEdit) {
            setStudentsList(studentsList.map(st => st.id === newStudent.id ? newStudent : st));
          } else {
            setStudentsList([newStudent, ...studentsList]);
          }

          // Update Seat Status
          setFullSeats(fullSeats.map(seat => {
            if (seat.label === studentData.seat) {
              return { ...seat, status: 'occupied', student: studentData.name };
            }
            return seat;
          }));
          fetchSeats();

          setAddStudentOpen(false);
          setStudentToEdit(null);
          showToast(`<b>${studentData.name}</b> ${isEdit ? 'updated' : 'registered'} — seat ${studentData.seat}, ${studentData.shift} shift.`);
        } else {
          showToast(`Failed to register student: ${resData.message}`);
        }
      })
      .catch(err => {
        console.error("Error adding student:", err);
        showToast('Error registering student.');
      });
  };

  // --- Email Verification Flow in Onboarding Wizard ---
  const handleSendOnboardingOtp = () => {
    fetch(`${API_BASE_URL}/signup/send-otp?email=${encodeURIComponent(obOwnerEmail)}`, {
      method: 'POST'
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setObVerificationToken(data.token);
          setObOtpSent(true);
          showToast('Verification OTP sent successfully!');
        } else {
          showToast(`Error: ${data.message}`);
        }
      })
      .catch(err => {
        console.error("API error:", err);
        showToast('Failed to connect to send-otp API.');
      });
  };

  const handleVerifyOnboardingOtp = () => {
    fetch(`${API_BASE_URL}/signup/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${obVerificationToken}`
      },
      body: JSON.stringify({ otp: parseInt(obOtpValue, 10) })
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setObEmailVerified(true);
          showToast('Email verified successfully!');
        } else {
          showToast(`Verification Failed: ${data.message}`);
        }
      })
      .catch(err => {
        console.error("API error:", err);
        showToast('Failed to connect to verify-otp API.');
      });
  };

  // Onboarding registration submission
  const handleOnboardingRegisterSubmit = (isSkipTrial, paymentTxnId = null) => {
    const payload = {
      fullName: obOwnerName,
      mobileNumber: obOwnerMobile,
      email: obOwnerEmail,
      password: obOwnerPassword,
      libraryName: obLibName,
      city: obLibCity,
      state: obLibState,
      address: obLibAddress,
      shifts: Object.keys(obShifts).filter(k => obShifts[k]).map(k => `${k} (${obShiftTimings[k]})`).join(','),
      totalSeats: obTotalSeats,
      monthlyFee: obFeeAmount,
      dueDay: obDueDay,
      paymentMethods: Object.keys(obPayMethods).filter(k => obPayMethods[k]).join(','),
      planId: isSkipTrial ? 0 : selectedPlanId,
      isFreeTrial: isSkipTrial,
      paymentTxnId: paymentTxnId
    };

    fetch(`${API_BASE_URL}/signup/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          localStorage.setItem('token', data.token);
          localStorage.setItem('role', data.role);

          setOwnerName(obOwnerName.trim());
          setLibraryName(obLibName.trim());
          setLibraryCity(obLibCity.trim());
          setTotalSeats(obTotalSeats);

          // Reset seat maps matching configured total
          setFullSeats(buildEmptySeats(obTotalSeats));
          setDashSeats(buildEmptySeats(Math.min(36, obTotalSeats)));

          setStudentsList([]);
          setActivityFeed([]);
          setIsTrialExpired(false);

          if (data.role === 'ADMIN') {
            navigate('/dashboard');
          } else if (data.role === 'STUDENT') {
            navigate('/student');
          } else {
            navigate('/dashboard');
          }
          setObStep(1);
          showToast(`Welcome, <b>${obOwnerName.split(' ')[0]}</b>! ${obLibName} is ready.`);
        } else {
          showToast(`Registration failed: ${data.message}`);
        }
      })
      .catch(err => {
        console.error("API error:", err);
        showToast('Failed to connect to register API.');
      });
  };

  const handlePaidCheckout = () => {
    const selectedPlan = plansList.find(p => p.id === selectedPlanId) || { monthlyPrice: 499 };
    const price = selectedPlan.monthlyPrice;

    fetch(`${API_BASE_URL}/signup/create-order?amount=${price}&email=${encodeURIComponent(obOwnerEmail)}`, {
      method: 'POST'
    })
      .then(res => res.json())
      .then(resData => {
        if (resData.status === 'success') {
          const order = resData.order;
          const options = {
            key: 'rzp_test_SmOJPEFc2boWol',
            amount: order.amount,
            currency: 'INR',
            name: obLibName || 'StudySpace Library',
            description: 'Onboarding Plan Subscription',
            order_id: order.orderId,
            handler: function (response) {
              fetch(`${API_BASE_URL}/signup/verify-payment`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature
                })
              })
                .then(vRes => vRes.json())
                .then(verifyData => {
                  if (verifyData.status === 'success') {
                    handleOnboardingRegisterSubmit(false, response.razorpay_payment_id);
                  } else {
                    showToast('Payment verification failed.');
                  }
                })
                .catch(err => {
                  console.error('Verify payment error:', err);
                  showToast('Error verifying payment.');
                });
            },
            prefill: {
              name: obOwnerName,
              email: obOwnerEmail,
              contact: obOwnerMobile
            },
            theme: {
              color: '#1e3831'
            }
          };

          const rzp = new window.Razorpay(options);
          rzp.open();
        } else {
          showToast(`Failed to create order: ${resData.message}`);
        }
      })
      .catch(err => {
        console.error('Create order error:', err);
        showToast('Failed to initialize payment.');
      });
  };

  const handleUpgradeAccount = (planId) => {
    fetch(`${API_BASE_URL}/signup/upgrade?email=${encodeURIComponent(ownerEmail || ownerMobile)}&planId=${planId}`, {
      method: 'POST'
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setIsTrialExpired(false);
          showToast('Account upgraded successfully! Dashboard activated.');
        } else {
          showToast(`Upgrade failed: ${data.message}`);
        }
      })
      .catch(err => {
        console.error("API error:", err);
        showToast('Failed to connect to upgrade API.');
      });
  };

  // --- Onboarding Logic ---
  const handleObNext = () => {
    // Validate current step
    if (obStep === 1) {
      if (!obOwnerName.trim() || !obOwnerPassword) {
        showToast('Please fill in your name and a password.');
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(obOwnerEmail)) {
        showToast('Please enter a valid email address.');
        return;
      }
      const phoneRegex = /^[0-9]{10}$/;
      const cleanMobile = obOwnerMobile ? obOwnerMobile.replace(/[\s-]/g, '') : '';
      if (cleanMobile && !phoneRegex.test(cleanMobile)) {
        showToast('Please enter a valid 10-digit mobile number.');
        return;
      }
      if (obOwnerPassword !== obOwnerPassword2) {
        showToast('Passwords do not match — please re-check.');
        return;
      }
      if (!obEmailVerified) {
        showToast('Please verify your email address first.');
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
    }
  };

  const handleObBack = () => {
    if (obStep > 1) {
      setObStep(obStep - 1);
    }
  };

  // Filter students based on search string and active shift filter
  const filteredStudents = studentsList.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.mobile.replace(/\s/g, '').includes(studentSearch.replace(/\s/g, ''));
    if (!matchesSearch) return false;

    if (studentShiftFilter === 'All shifts') return true;

    let activeShift = '';
    const lowerFilter = studentShiftFilter.toLowerCase();
    if (lowerFilter.includes('morning')) {
      activeShift = 'morning';
    } else if (lowerFilter.includes('evening')) {
      activeShift = 'evening';
    } else if (lowerFilter.includes('full')) {
      activeShift = 'full day';
    }

    const stShift = (s.shift || '').toLowerCase().replace('_', ' ');
    return stShift === activeShift;
  });

  const isEmailValid = obOwnerEmail.includes('@') && obOwnerEmail.includes('.');

  return (
    <React.Fragment>
      {/* ============ TOAST ============ */}
      <Toast message={toastMessage} visible={toastVisible} />

      <Routes>
        <Route path="/login" element={
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
                {!showOtpView ? (
                  <div>
                    <div className="login-eyebrow">Welcome back</div>
                    <h1 className="login-title">Log in to your desk</h1>
                    <div className="login-sub">Enter your registered email to access your account.</div>

                    {/*
                  <div className="login-tabs">
                    <div className={`login-tab ${loginTab === 'mobile' ? 'active' : ''}`} onClick={() => setLoginTab('mobile')}>Mobile number</div>
                    <div className={`login-tab ${loginTab === 'email' ? 'active' : ''}`} onClick={() => setLoginTab('email')}>Email</div>
                  </div>
                  */}

                    <form onSubmit={handleOwnerLogin}>
                      {/*
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
                    */}
                      <div className="field">
                        <label>Email address</label>
                        <input type="email" placeholder="ritik@sunrisereading.in" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} required />
                      </div>
                      <div className="field">
                        <label>Password</label>
                        <div className="password-wrapper">
                          <input
                            type={showLoginPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={ownerPassword}
                            onChange={(e) => setOwnerPassword(e.target.value)}
                          />
                          <button
                            type="button"
                            className="password-toggle-btn"
                            onClick={() => setShowLoginPassword(!showLoginPassword)}
                            aria-label={showLoginPassword ? "Hide password" : "Show password"}
                          >
                            {showLoginPassword ? (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                            ) : (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="field-row">
                        <label className="remember">
                          <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} style={{ width: 'auto' }} /> Keep me logged in
                        </label>
                        <a href="#" onClick={(e) => e.preventDefault()}>Forgot password?</a>
                      </div>
                      <button type="submit" className="btn btn-primary login-btn">Log in</button>
                    </form>

                    <div className="login-divider">or</div>
                    <button className="btn btn-ghost login-btn" onClick={() => setShowOtpView(true)}>Send OTP instead</button>
                    <div className="login-note" style={{ marginTop: '20px' }}>
                      New library on StudySpace? <a href="#" onClick={(e) => { e.preventDefault(); navigate('/onboarding'); }}>Set up your account</a>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="login-eyebrow">OTP Access</div>
                    <h1 className="login-title">Log in with OTP</h1>
                    <div className="login-sub">We will send a one-time code to your registered email address.</div>

                    <form onSubmit={otpSent ? handleVerifyOtpLogin : handleSendOtpLogin}>
                      <div className="field">
                        <label>Email address</label>
                        <input type="email" placeholder="e.g. ritik@sunrisereading.in" value={otpEmail} onChange={(e) => setOtpEmail(e.target.value)} disabled={otpSent} required />
                      </div>

                      {otpSent && (
                        <div className="field">
                          <label>Enter the 4-digit code sent to your email</label>
                          <input type="text" placeholder="e.g. 1234" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} required />
                        </div>
                      )}

                      <div className="field-row" style={{ marginTop: '10px', marginBottom: '15px' }}>
                        {otpSent && (
                          <div>
                            {timer > 0 ? (
                              <span style={{ fontSize: '14px', color: '#888' }}>Resend OTP in {timer}s</span>
                            ) : (
                              <a href="#" onClick={(e) => { e.preventDefault(); handleSendOtpLogin(); }}>Resend OTP</a>
                            )}
                          </div>
                        )}
                      </div>

                      <button type="submit" className="btn btn-primary login-btn">
                        {otpSent ? 'Verify & Login' : 'Send OTP'}
                      </button>
                    </form>

                    <div className="login-divider">or</div>
                    <button className="btn btn-ghost login-btn" onClick={() => setShowOtpView(false)}>Log in with password instead</button>
                    <div className="login-note" style={{ marginTop: '20px' }}>
                      New library on StudySpace? <a href="#" onClick={(e) => { e.preventDefault(); navigate('/onboarding'); }}>Set up your account</a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        } />

        <Route path="/onboarding" element={
          <div id="onboarding-screen" className="open">
            <div className="onboarding-top">
              <div className="brand">
                <div className="brand-mark">S</div>
                <div>
                  <div className="brand-name">StudySpace</div>
                  <div className="brand-sub">Set up your library</div>
                </div>
              </div>
              <a href="#" id="back-to-login" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>Already have an account? Log in</a>
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
                  <div className={`ob-step-item ${obStep > 4 ? 'done' : ''} ${obStep === 4 ? 'active' : ''}`}>
                    <div className="ob-step-circle">4</div><div className="ob-step-label">Plan</div>
                  </div>
                </div>

                <div className="ob-panel">
                  {/* STEP 1 — Owner account */}
                  {obStep === 1 && (
                    <div className="ob-step-content active">
                      <div className="ob-step-eyebrow">Step 1 of 4</div>
                      <h2 className="ob-step-title">Create your account</h2>
                      <div className="ob-step-sub">You'll use this email and password to log in as the library owner.</div>
                      <div className="form-grid">
                        <div className="field span-2">
                          <label>Your full name</label>
                          <input type="text" placeholder="e.g. Ritik Sharma" value={obOwnerName} onChange={(e) => setObOwnerName(e.target.value)} required />
                        </div>
                        <div className="field">
                          <label>Email address</label>
                          <input type="email" placeholder="you@library.in" value={obOwnerEmail} onChange={(e) => setObOwnerEmail(e.target.value)} required disabled={obEmailVerified} />
                          {isEmailValid && !obEmailVerified && (
                            <button type="button" className="btn btn-ghost" style={{ marginTop: '8px', padding: '6px 12px' }} onClick={handleSendOnboardingOtp}>
                              Verify Email
                            </button>
                          )}
                          {obEmailVerified && <span style={{ color: 'var(--teal)', fontSize: '12px', display: 'block', marginTop: '6px' }}>✓ Verified</span>}
                        </div>
                        <div className="field">
                          <label>Mobile number (optional)</label>
                          <input type="tel" placeholder="9811022341" maxLength={10} value={obOwnerMobile} onChange={(e) => setObOwnerMobile(e.target.value)} />
                        </div>

                        {obOtpSent && !obEmailVerified && (
                          <div className="field span-2" style={{ border: '1px dashed var(--rule)', padding: '16px', borderRadius: '8px' }}>
                            <label>Enter OTP sent to your Email</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                              <input type="text" placeholder="Enter 4-digit OTP" value={obOtpValue} onChange={(e) => setObOtpValue(e.target.value)} />
                              <button type="button" className="btn btn-primary" onClick={handleVerifyOnboardingOtp}>Verify OTP</button>
                            </div>
                          </div>
                        )}

                        <div className="field">
                          <label>Password</label>
                          <div className="password-wrapper">
                            <input
                              type={showSignupPassword ? "text" : "password"}
                              placeholder="Create a password"
                              value={obOwnerPassword}
                              onChange={(e) => setObOwnerPassword(e.target.value)}
                              required
                            />
                            <button
                              type="button"
                              className="password-toggle-btn"
                              onClick={() => setShowSignupPassword(!showSignupPassword)}
                              aria-label={showSignupPassword ? "Hide password" : "Show password"}
                            >
                              {showSignupPassword ? (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                              ) : (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                              )}
                            </button>
                          </div>
                        </div>
                        <div className="field">
                          <label>Confirm password</label>
                          <div className="password-wrapper">
                            <input
                              type={showSignupConfirmPassword ? "text" : "password"}
                              placeholder="Re-enter password"
                              value={obOwnerPassword2}
                              onChange={(e) => setObOwnerPassword2(e.target.value)}
                              required
                            />
                            <button
                              type="button"
                              className="password-toggle-btn"
                              onClick={() => setShowSignupConfirmPassword(!showSignupConfirmPassword)}
                              aria-label={showSignupConfirmPassword ? "Hide password" : "Show password"}
                            >
                              {showSignupConfirmPassword ? (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                              ) : (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                              )}
                            </button>
                          </div>
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
                          <label>Which shifts do you run &amp; their timings?</label>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '6px' }}>
                            {['Morning', 'Evening', 'Full day'].map((shiftName) => (
                              <div key={shiftName} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <label className="ob-check" style={{ margin: 0, minWidth: '110px' }}>
                                  <input
                                    type="checkbox"
                                    checked={obShifts[shiftName]}
                                    onChange={(e) => setObShifts({ ...obShifts, [shiftName]: e.target.checked })}
                                  />
                                  <span>{shiftName}</span>
                                </label>
                                {obShifts[shiftName] && (
                                  <input
                                    type="text"
                                    placeholder="e.g. 7 AM – 2 PM"
                                    className="form-control"
                                    style={{ padding: '6px 10px', fontSize: '12px', maxWidth: '160px', height: '32px' }}
                                    value={obShiftTimings[shiftName]}
                                    onChange={(e) => setObShiftTimings({ ...obShiftTimings, [shiftName]: e.target.value })}
                                    required
                                  />
                                )}
                              </div>
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
                          <label>Fee due date (day of month)</label>
                          <input
                            type="date"
                            value={(() => {
                              const today = new Date();
                              const y = today.getFullYear();
                              const m = String(today.getMonth() + 1).padStart(2, '0');
                              const d = String(obDueDay).padStart(2, '0');
                              return `${y}-${m}-${d}`;
                            })()}
                            onChange={(e) => {
                              if (e.target.value) {
                                const selectedDate = new Date(e.target.value);
                                const day = selectedDate.getDate();
                                setObDueDay(day);
                              }
                            }}
                            required
                          />
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

                  {/* STEP 4 — Choose Plan selection (Step 4 of 4) */}
                  {obStep === 4 && (
                    <div className="ob-step-content active">
                      <div className="ob-step-eyebrow">Step 4 of 4</div>
                      <h2 className="ob-step-title">Choose your plan</h2>
                      <div className="ob-step-sub">Pick the plan that fits your library. You can upgrade or downgrade anytime from Settings.</div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', margin: '24px 0' }}>
                        {((plansList && plansList.length > 0) ? plansList : [
                          { id: 1, planName: 'Starter', monthlyPrice: 499, description: 'Up to 100 seats · core modules' },
                          { id: 2, planName: 'Growth', monthlyPrice: 999, description: 'Up to 300 seats · student panel included' },
                          { id: 3, planName: 'Pro', monthlyPrice: 1499, description: 'Unlimited seats · priority support' }
                        ]).map(plan => (
                          <div
                            key={plan.id}
                            onClick={() => setSelectedPlanId(plan.id)}
                            style={{
                              border: selectedPlanId === plan.id ? '2px solid var(--teal)' : '1px solid var(--rule)',
                              background: selectedPlanId === plan.id ? 'var(--teal-tint)' : 'var(--card)',
                              borderRadius: '12px',
                              padding: '20px',
                              cursor: 'pointer',
                              textAlign: 'center',
                              position: 'relative'
                            }}
                          >
                            {plan.planName === 'Growth' && (
                              <span style={{
                                position: 'absolute',
                                top: '-12px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                background: 'var(--mustard)',
                                color: 'var(--ink)',
                                fontSize: '10px',
                                fontWeight: 'bold',
                                padding: '2px 8px',
                                borderRadius: '10px',
                                textTransform: 'uppercase'
                              }}>Most Popular</span>
                            )}
                            <h3 style={{ margin: '0 0 10px 0', fontFamily: 'var(--display)' }}>{plan.planName}</h3>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--ink)', margin: '10px 0' }}>
                              ₹{plan.monthlyPrice}<span style={{ fontSize: '13px', color: 'var(--muted)' }}>/mo</span>
                            </div>
                            <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0 }}>{plan.description}</p>
                          </div>
                        ))}
                      </div>

                      <div style={{ background: 'var(--paper-deep)', padding: '12px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', margin: '20px 0' }}>
                        <span>🎁</span>
                        <span>14-day free trial included — you won't be charged today.</span>
                      </div>
                    </div>
                  )}

                  <div className="ob-actions">
                    <button className="btn btn-ghost" style={{ visibility: obStep === 1 ? 'hidden' : 'visible' }} onClick={handleObBack}>Back</button>
                    {obStep === 4 ? (
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn btn-ghost" onClick={() => handleOnboardingRegisterSubmit(true)}>Skip for Free plan</button>
                        <button className="btn btn-primary" onClick={handlePaidCheckout}>Start trial &amp; activate dashboard →</button>
                      </div>
                    ) : (
                      <button className="btn btn-primary" onClick={handleObNext}>
                        {obStep === 3 ? 'Continue to payment →' : 'Continue'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        } />

        <Route path="/dashboard" element={
          <div className="app">
            {/* Mobile Header Bar */}
            <div className="mobile-header">
              <button className="mobile-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle Menu">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              </button>
              <div className="brand-title">StudySpace</div>
            </div>

            {/* Mobile Menu Backdrop */}
            {mobileMenuOpen && <div className="mobile-backdrop" onClick={() => setMobileMenuOpen(false)} />}

            {/* ============ SIDEBAR ============ */}
            <nav className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
              <div className="brand" onClick={() => { navigate('/login'); setMobileMenuOpen(false); }} style={{ cursor: 'pointer' }}>
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
                  { id: 'leaving-requests', label: 'Leaving Requests' },
                  { id: 'settings', label: 'Settings' }
                ].map((view) => (
                  <li
                    key={view.id}
                    className={`navitem ${activeView === view.id ? 'active' : ''}`}
                    onClick={() => {
                      setActiveView(view.id);
                      setMobileMenuOpen(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    <span className="dot"></span>
                    {view.label}
                  </li>
                ))}
              </ul>
              <div className="sidebar-foot">
                <div style={{ marginBottom: '12px', fontSize: '12px', opacity: 0.8, color: 'var(--ink-soft)' }}>
                  {libraryName}<br />
                  {libraryCity} &middot; {totalSeats} seats
                </div>
                <div
                  className="navitem"
                  onClick={handleLogout}
                  style={{
                    opacity: 0.6,
                    padding: '8px 0',
                    marginTop: '8px',
                    borderTop: '1px solid rgba(239,232,214,0.15)',
                    cursor: 'pointer',
                    transition: 'opacity 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = 0.6}
                >
                  <span className="dot" style={{ background: 'var(--terracotta, #e11d48)' }}></span>
                  Log out
                </div>
                <div style={{ marginTop: '16px', marginBottom: '12px', fontSize: '12px', opacity: 0.9, color: 'rgba(255, 255, 255, 0.5)', fontWeight: '500', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Crafted by Scriza
                </div>
              </div>
            </nav>

            {/* ============ MAIN CONTENT ============ */}
            <main className="content">

              {isTrialExpired ? (
                <section className="view active">
                  <div className="topbar">
                    <h1 className="page-title">Please upgrade your account</h1>
                  </div>
                  <div className="panel" style={{ padding: '30px', textAlign: 'center' }}>
                    <p style={{ fontSize: '16px', color: 'var(--terracotta)', fontWeight: 'bold' }}>
                      Your 14-day free trial has expired!
                    </p>
                    <p style={{ color: 'var(--muted)', marginBottom: '30px' }}>
                      To continue using the dashboard features, please choose a subscription plan below to upgrade.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', margin: '24px 0', textAlign: 'left' }}>
                      {[
                        { id: 1, planName: 'Starter', monthlyPrice: 499, description: 'Up to 100 seats · core modules' },
                        { id: 2, planName: 'Growth', monthlyPrice: 999, description: 'Up to 300 seats · student panel included' },
                        { id: 3, planName: 'Pro', monthlyPrice: 1499, description: 'Unlimited seats · priority support' }
                      ].map(plan => (
                        <div
                          key={plan.id}
                          style={{
                            border: '1px solid var(--rule)',
                            background: 'var(--card)',
                            borderRadius: '12px',
                            padding: '20px'
                          }}
                        >
                          <h3 style={{ margin: '0 0 10px 0', fontFamily: 'var(--display)' }}>{plan.planName}</h3>
                          <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--ink)', margin: '10px 0' }}>
                            ₹{plan.monthlyPrice}<span style={{ fontSize: '13px', color: 'var(--muted)' }}>/mo</span>
                          </div>
                          <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '20px' }}>{plan.description}</p>
                          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => handleUpgradeAccount(plan.id)}>
                            Upgrade Now
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              ) : (
                <React.Fragment>
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
                          <div className="stat-value">{dashboardData ? dashboardData.totalSeats : totalSeats}</div>
                        </div>
                        <div className="stat-card" style={{ '--stat-color': 'var(--sage)' }}>
                          <div className="stat-label">Occupied</div>
                          <div className="stat-value">
                            {dashboardData ? dashboardData.occupiedSeats : occupiedCount} <span className="stat-suffix">/ {dashboardData ? dashboardData.totalSeats : totalSeats}</span>
                          </div>
                        </div>
                        <div className="stat-card" style={{ '--stat-color': 'var(--mustard)' }}>
                          <div className="stat-label">Total Students</div>
                          <div className="stat-value">{dashboardData ? dashboardData.totalStudents : studentsList.length}</div>
                        </div>
                        <div className="stat-card" style={{ '--stat-color': 'var(--terracotta)' }}>
                          <div className="stat-label">Fees Due</div>
                          <div className="stat-value">₹{Number(dashboardData ? dashboardData.feesDue : feesDueSum).toLocaleString('en-IN')}</div>
                        </div>
                        <div className="stat-card" style={{ '--stat-color': 'var(--ink)' }}>
                          <div className="stat-label">Today's Attendance</div>
                          <div className="stat-value" style={{ fontSize: '13.5px', marginTop: '6px', fontFamily: 'inherit', fontWeight: '500', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div>🟢 Checked In: <span className="mono" style={{ fontSize: '14px', fontWeight: '600' }}>{dashboardData ? dashboardData.todayAttendanceCheckedIn : 0}</span></div>
                            <div>🔴 Checked Out: <span className="mono" style={{ fontSize: '14px', fontWeight: '600' }}>{dashboardData ? dashboardData.todayAttendanceCheckedOut : 0}</span></div>
                            <div>🟡 Not Arrived: <span className="mono" style={{ fontSize: '14px', fontWeight: '600' }}>{dashboardData ? dashboardData.todayAttendanceNotArrived : 0}</span></div>
                          </div>
                        </div>
                      </div>

                      <div className="grid-2">
                        <div className="panel">
                          <div className="panel-head">
                            <h3 className="panel-title">Seat map</h3>
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
                          <div className="panel-head"><h3 className="panel-title">Today's activity</h3></div>
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
                          <div className="panel-head"><h3 className="panel-title">Monthly revenue</h3></div>
                          {dashboardData?.monthlyRevenue && dashboardData.monthlyRevenue.length > 0 ? (() => {
                            const maxAmt = Math.max(...dashboardData.monthlyRevenue.map(d => d.amount || 0), 1000);
                            return (
                              <div className="bars">
                                {dashboardData.monthlyRevenue.map((item, idx) => {
                                  const heightPercent = Math.min(85, Math.max(10, ((item.amount || 0) / maxAmt) * 85));
                                  const isCurrentMonth = idx === dashboardData.monthlyRevenue.length - 1;
                                  return (
                                    <div className="bar-col" key={idx} title={`₹${item.amount}`}>
                                      <div className={`bar ${isCurrentMonth ? 'current' : ''}`} style={{ height: `${heightPercent}%` }}></div>
                                      <div className="bar-label">{item.month}</div>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })() : (
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
                          {dashboardData?.dueFees && dashboardData.dueFees.length > 0 ? (
                            <table className="ledger">
                              <tbody>
                                {dashboardData.dueFees.slice(0, 3).map((item, idx) => {
                                  const foundSt = studentsList.find(s => s.id === item.studentId);
                                  return (
                                    <tr key={idx}>
                                      <td className="cell-name">{foundSt ? foundSt.name : `Student #${item.studentId}`}</td>
                                      <td className="cell-amount">₹{item.dueAmount}</td>
                                      <td><span className="stamp due">Due</span></td>
                                    </tr>
                                  );
                                })}
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

                      <div className="toolbar" style={{ marginBottom: '16px' }}>
                        <div className="filter-chips">
                          {getParsedShiftsList().map((chip) => (
                            <div
                              key={chip}
                              className={`chip ${studentShiftFilter === chip ? 'active' : ''}`}
                              onClick={() => setStudentShiftFilter(chip)}
                            >
                              {chip}
                            </div>
                          ))}
                        </div>
                      </div>

                      {filteredStudents.length > 0 ? (
                        <>
                          <div className="panel">
                            <table className="ledger">
                              <thead>
                                <tr><th>Student</th><th>Mobile</th><th>Shift</th><th>Seat</th><th>Joined</th><th>Membership</th><th></th></tr>
                              </thead>
                              <tbody>
                                {filteredStudents.map((s, idx) => (
                                  <tr key={idx}>
                                    <td className="name-cell">
                                      {s.profileImage ? (
                                        <img src={s.profileImage} alt="Avatar" className="avatar" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                                      ) : (
                                        <span className="avatar">
                                          {s.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                                        </span>
                                      )}
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
                                    <td>
                                      <span
                                        className="panel-link"
                                        style={{marginRight: '8px'}}
                                        onClick={() => {
                                          setStudentToEdit(s);
                                          setAddStudentOpen(true);
                                        }}
                                      >
                                        Edit
                                      </span>
                                      <span
                                        className="panel-link"
                                        onClick={() => {
                                          setSelectedStudent(s);
                                          setViewStudentOpen(true);
                                        }}
                                      >
                                        View
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <div className="note">
                            Showing <span>{filteredStudents.length}</span> of {studentsList.length} students. Search narrows the list instantly — try “rohit” or “98”.
                          </div>
                        </>
                      ) : (
                        <div className="empty-state">
                          <div className="empty-state-icon">👤</div>
                          <h3 className="empty-state-title">{studentSearch ? "No Search Results" : "No Students Registered"}</h3>
                          <p className="empty-state-desc">
                            {studentSearch ? `No registered students match "${studentSearch}".` : "Get started by registering your first student into your library ledger."}
                          </p>
                          {studentSearch ? (
                            <button className="btn btn-ghost" onClick={() => setStudentSearch('')}>Clear Search</button>
                          ) : (
                            <button className="btn btn-primary" onClick={() => setAddStudentOpen(true)}>+ Add Student</button>
                          )}
                        </div>
                      )}
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
                          <button className="btn btn-ghost" onClick={() => {
                            setEditingSeatId(null);
                            setSeatForm({ seatNumber: '', floor: '', section: '' });
                            setSeatModalOpen(true);
                          }}>+ Create Seats</button>
                        </div>
                      </div>

                      {fullSeats.length > 0 ? (() => {
                        const displaySeats = getDisplaySeats();
                        const currentSeat = selectedSeatIndex !== null ? displaySeats[selectedSeatIndex] : null;
                        return (
                          <>
                            <div className="toolbar">
                              <div className="filter-chips">
                                {getParsedShiftsList().map((chip) => (
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
                                <div className="seat-grid-github">
                                  {displaySeats.map((s, idx) => (
                                    <div
                                      key={idx}
                                      className={`seat-github ${s.status} ${selectedSeatIndex === idx ? 'selected' : ''}`}
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
                                {selectedSeatIndex !== null && currentSeat ? (
                                  currentSeat.status === 'uncreated' ? (
                                    <div className="seat-detail">
                                      This seat slot has not been created yet.<br /><br />
                                      <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => {
                                        setEditingSeatId(null);

                                        const nextSeatNum = (() => {
                                          const activeCount = fullSeats.filter(s => s.status !== 'uncreated').length;
                                          const row = String.fromCharCode(65 + Math.floor(activeCount / 12));
                                          return row + String(activeCount % 12 + 1).padStart(2, '0');
                                        })();

                                        setSeatForm({
                                          seatNumber: nextSeatNum,
                                          floor: 'Floor 1',
                                          section: 'General'
                                        });
                                        setSeatModalOpen(true);
                                      }}>+ Create Seat</button>
                                    </div>
                                  ) : currentSeat.status === 'available' ? (
                                    <div className="seat-detail">
                                      Seat <b>{currentSeat.label}</b> is available.<br /><br />
                                      <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setAddStudentOpen(true)}>Assign this seat</button>
                                      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                        <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => {
                                          setEditingSeatId(currentSeat.id);
                                          setSeatForm({
                                            seatNumber: currentSeat.label,
                                            floor: currentSeat.floor || '',
                                            section: currentSeat.section || ''
                                          });
                                          setSeatModalOpen(true);
                                        }}>Edit</button>
                                        <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center', color: 'var(--terracotta)' }} onClick={() => {
                                          if (confirm('Are you sure you want to delete this seat?')) {
                                            api.seatApi.delete(currentSeat.id)
                                              .then(res => {
                                                if (res.success || res.status === 'success') {
                                                  showToast('Seat deleted');
                                                  setSelectedSeatIndex(null);
                                                  fetchSeats();
                                                } else {
                                                  alert(res.message || "Failed to delete seat.");
                                                }
                                              });
                                          }
                                        }}>Delete</button>
                                      </div>
                                    </div>
                                  ) : (() => {
                                    const targetStudents = studentsList.filter(st => {
                                      if (st.seat !== currentSeat.label) return false;
                                      if (seatFilter === 'All shifts') return true;

                                      const lowerFilter = seatFilter.toLowerCase();
                                      const stShift = (st.shift || '').toLowerCase().replace('_', ' ');
                                      if (lowerFilter.includes('morning')) return stShift === 'morning';
                                      if (lowerFilter.includes('evening')) return stShift === 'evening';
                                      if (lowerFilter.includes('full')) return stShift === 'full day';
                                      return true;
                                    });

                                    return (
                                      <div className="seat-detail filled" style={{ padding: '16px 12px' }}>
                                        <div className="seat-detail-row" style={{ marginBottom: '12px' }}>
                                          <span>Seat</span><b>{currentSeat.label}</b>
                                        </div>

                                        {targetStudents.map((st, sidx) => {
                                          const todayRecord = attendanceList.find(a => a.studentId === st.id);
                                          const attStatus = todayRecord ? (todayRecord.status === 'ABSENT' ? 'Absent' : todayRecord.checkOut ? 'Left' : 'Checked In') : 'Absent';
                                          const attClass = todayRecord ? (todayRecord.status === 'ABSENT' ? 'due' : todayRecord.checkOut ? 'inactive' : 'active') : 'due';

                                          const shiftDisp = (st.shift || '').toLowerCase().includes('morning') ? 'Morning' : (st.shift || '').toLowerCase().includes('evening') ? 'Evening' : 'Full Day';

                                          return (
                                            <div key={st.id} style={{
                                              paddingTop: sidx > 0 ? '12px' : '0',
                                              borderTop: sidx > 0 ? '1px dashed var(--rule)' : 'none',
                                              marginTop: sidx > 0 ? '12px' : '0'
                                            }}>
                                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                  {shiftDisp} Shift
                                                </span>
                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                  <span className={`stamp ${st.status === 'due' ? 'due' : 'paid'}`} style={{ margin: 0, padding: '2px 6px', fontSize: '9px' }}>
                                                    {st.status === 'due' ? 'Due' : 'Paid'}
                                                  </span>
                                                  <span className={`stamp ${attClass}`} style={{ margin: 0, padding: '2px 6px', fontSize: '9px' }}>
                                                    {attStatus}
                                                  </span>
                                                </div>
                                              </div>
                                              <div className="seat-detail-name" style={{ margin: '6px 0 2px 0', fontSize: '14px' }}>{st.name}</div>
                                              <div style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'monospace' }}>{st.mobile}</div>
                                            </div>
                                          );
                                        })}

                                        <div style={{ height: '1px', backgroundColor: 'var(--rule)', margin: '14px 0 10px 0' }} />
                                        <div className="seat-detail-row"><span>Floor</span><b>{currentSeat.floor || '—'}</b></div>
                                        <div className="seat-detail-row"><span>Section</span><b>{currentSeat.section || '—'}</b></div>
                                      </div>
                                    );
                                  })()
                                ) : (
                                  <div className="seat-detail">Click any seat to view or assign it</div>
                                )}
                              </div>
                            </div>
                          </>
                        );
                      })() : (
                        <div className="empty-state">
                          <div className="empty-state-icon">🪑</div>
                          <h3 className="empty-state-title">No Seats Configured</h3>
                          <p className="empty-state-desc">Create your library seats floor plan to start assigning them to students.</p>
                          <button className="btn btn-primary" onClick={() => {
                            setEditingSeatId(null);
                            setSeatForm({ seatNumber: '', floor: '', section: '' });
                            setSeatModalOpen(true);
                          }}>+ Create Seats</button>
                        </div>
                      )}
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
                        <button className="btn btn-primary" onClick={() => setAddFeeOpen(true)}>Create Invoice</button>
                      </div>

                      <div className="stat-strip" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: '20px' }}>
                        <div className="stat-card" style={{ '--stat-color': 'var(--teal)' }}>
                          <div className="stat-label">Collected this month</div>
                          <div className="stat-value">₹{feeStats.collectedThisMonth !== undefined ? feeStats.collectedThisMonth : 0}</div>
                        </div>
                        <div className="stat-card" style={{ '--stat-color': 'var(--terracotta)' }}>
                          <div className="stat-label">Total due</div>
                          <div className="stat-value">₹{feeStats.totalDue !== undefined ? feeStats.totalDue : 0}</div>
                        </div>
                        <div className="stat-card" style={{ '--stat-color': 'var(--mustard)' }}>
                          <div className="stat-label">Students overdue</div>
                          <div className="stat-value">{feeStats.studentsOverdue !== undefined ? feeStats.studentsOverdue : 0}</div>
                        </div>
                      </div>

                      <div className="toolbar" style={{ marginBottom: '15px' }}>
                        <div className="filter-chips">
                          {['all', 'paid', 'due'].map((filter) => (
                            <div
                              key={filter}
                              className={`chip ${feeFilter === filter ? 'active' : ''}`}
                              onClick={() => setFeeFilter(filter)}
                            >
                              {filter.toUpperCase()}
                            </div>
                          ))}
                        </div>
                      </div>

                      {(() => {
                        const filteredFees = feeHistoryList;

                        return filteredFees.length > 0 ? (
                          <div className="panel">
                            <div className="panel-head"><h3 className="panel-title">Payment history</h3></div>
                            <table className="ledger">
                              <thead>
                                <tr><th>Student</th><th>Amount</th><th>Method</th><th>Date</th><th>Status</th><th></th></tr>
                              </thead>
                              <tbody>
                                {filteredFees.map((fee, fIdx) => {
                                  const student = studentsList.find(s => s.id === fee.studentId);
                                  const sName = student ? student.name : 'Unknown Student';
                                  const avatar = sName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

                                  const isPaid = fee.status === 'PAID';
                                  const formattedDate = isPaid
                                    ? (fee.paymentDate ? new Date(fee.paymentDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '—')
                                    : `Due ${fee.dueDate ? new Date(fee.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '—'}`;

                                  return (
                                    <tr key={fIdx}>
                                      <td className="name-cell">
                                        <span className="avatar">{avatar}</span>
                                        <span className="cell-name">{sName}</span>
                                      </td>
                                      <td className="cell-amount">₹{fee.amount}</td>
                                      <td>{fee.paymentMode || '—'}</td>
                                      <td>{formattedDate}</td>
                                      <td><span className={`stamp ${isPaid ? 'paid' : 'due'}`}>{isPaid ? 'Paid' : 'Due'}</span></td>
                                      <td>
                                        {isPaid ? (
                                          <span className="panel-link" onClick={() => {
                                            alert(`RECEIPT\n-----------------\nStudent: ${sName}\nAmount: ₹${fee.amount}\nPaid Amount: ₹${fee.paidAmount}\nMethod: ${fee.paymentMode}\nDate: ${fee.paymentDate}`);
                                          }} style={{ cursor: 'pointer' }}>Receipt</span>
                                        ) : (
                                          <span className="panel-link" onClick={() => {
                                            setSelectedFeeForPayment(fee);
                                            setPayNowOpen(true);
                                          }} style={{ cursor: 'pointer', color: 'var(--terracotta)' }}>Collect</span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="empty-state">
                            <div className="empty-state-icon">💵</div>
                            <h3 className="empty-state-title">No Invoices Found</h3>
                            <p className="empty-state-desc">All student fee bills, payment history, and collection receipts will be listed here.</p>
                            <button className="btn btn-primary" onClick={() => setAddFeeOpen(true)}>Create Invoice</button>
                          </div>
                        );
                      })()}
                    </section>
                  )}

                  {/* ================= ATTENDANCE ================= */}
                  {activeView === 'attendance' && (() => {
                    const dailyAttendanceRecords = studentsList.map(student => {
                      const att = attendanceList.find(a => a.studentId === student.id);
                      return {
                        ...student,
                        attendanceRecord: att,
                      };
                    });

                    const filteredDailyAttendance = dailyAttendanceRecords.filter(r =>
                      r.name.toLowerCase().includes(attendanceSearch.toLowerCase()) ||
                      (r.seat && r.seat.toLowerCase().includes(attendanceSearch.toLowerCase()))
                    );

                    const checkedInCount = dailyAttendanceRecords.filter(r => r.attendanceRecord && !r.attendanceRecord.checkOut && r.attendanceRecord.status !== 'ABSENT').length;
                    const checkedOutCount = dailyAttendanceRecords.filter(r => r.attendanceRecord && r.attendanceRecord.checkOut && r.attendanceRecord.status !== 'ABSENT').length;
                    const notYetArrivedCount = dailyAttendanceRecords.filter(r => !r.attendanceRecord).length;

                    return (
                      <section className="view active">
                        <div className="topbar">
                          <div>
                            <div className="page-eyebrow">Today · {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}</div>
                            <h1 className="page-title">Attendance</h1>
                          </div>
                          <div className="topbar-actions">
                            <div className="search">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
                              <input placeholder="Search by name or seat" value={attendanceSearch} onChange={(e) => setAttendanceSearch(e.target.value)} />
                            </div>
                          </div>
                        </div>

                        <div className="stat-strip" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: '20px' }}>
                          <div className="stat-card" style={{ '--stat-color': 'var(--teal)' }}><div className="stat-label">Checked in</div><div className="stat-value">{attendanceStats.checkedIn}</div></div>
                          <div className="stat-card" style={{ '--stat-color': 'var(--muted)' }}><div className="stat-label">Checked out</div><div className="stat-value">{attendanceStats.checkedOut}</div></div>
                          <div className="stat-card" style={{ '--stat-color': 'var(--mustard)' }}><div className="stat-label">Not yet arrived</div><div className="stat-value">{attendanceStats.notYetArrived}</div></div>
                        </div>

                        {filteredDailyAttendance.length > 0 ? (
                          <div className="panel">
                            <div className="panel-head"><h3 className="panel-title">Daily attendance list</h3></div>
                            <table className="ledger">
                              <thead>
                                <tr><th>Student</th><th>Seat</th><th>Check-in</th><th>Check-out</th><th>Status</th><th>Actions</th></tr>
                              </thead>
                              <tbody>
                                {filteredDailyAttendance.map((r, rIdx) => {
                                  const att = r.attendanceRecord;
                                  const isAbsent = att && att.status === 'ABSENT';
                                  return (
                                    <tr key={rIdx}>
                                      <td className="cell-name">{r.name}</td>
                                      <td>{r.seat || '—'}</td>
                                      <td className="mono">{att && att.checkIn ? att.checkIn : '—'}</td>
                                      <td className="mono">{att && att.checkOut ? att.checkOut : '—'}</td>
                                      <td>
                                        <span className={`stamp ${isAbsent ? 'due' : (!att ? 'due' : (att.checkOut ? 'inactive' : 'active'))}`}>
                                          {isAbsent ? 'Absent' : (!att ? 'Not Arrived' : (att.checkOut ? 'Left' : 'Present'))}
                                        </span>
                                      </td>
                                      <td>
                                        {!att && (
                                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                            <button className="btn btn-ghost" style={{ padding: '4px 8px', minHeight: 'unset', color: 'var(--teal)' }} onClick={() => {
                                              api.attendanceApi.checkIn({ studentId: r.id })
                                                .then(res => {
                                                  if (res.success || res.status === 'success') {
                                                    showToast(`${r.name} checked in successfully`);
                                                    fetchAttendanceData();
                                                  } else {
                                                    alert(res.message);
                                                  }
                                                })
                                                .catch(console.error);
                                            }}>Check In</button>
                                          </div>
                                        )}
                                        {att && !isAbsent && !att.checkOut && (
                                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                            <button className="btn btn-ghost" style={{ padding: '4px 8px', minHeight: 'unset', color: 'var(--terracotta)' }} onClick={() => {
                                              api.attendanceApi.checkOut(r.id)
                                                .then(res => {
                                                  if (res.success || res.status === 'success') {
                                                    showToast(`${r.name} checked out successfully`);
                                                    fetchAttendanceData();
                                                  } else {
                                                    alert(res.message);
                                                  }
                                                })
                                                .catch(console.error);
                                            }}>Check Out</button>
                                            <button className="btn btn-ghost" style={{ padding: '4px 8px', minHeight: 'unset' }} onClick={() => {
                                              setEditingAttendance(att);
                                              setAttendanceForm({
                                                status: att.status,
                                                checkIn: att.checkIn ? att.checkIn.substring(0, 5) : '',
                                                checkOut: att.checkOut ? att.checkOut.substring(0, 5) : ''
                                              });
                                              setEditAttendanceOpen(true);
                                            }}>Edit</button>
                                          </div>
                                        )}
                                        {att && (isAbsent || att.checkOut) && (
                                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                            <span style={{ color: 'var(--muted)', fontSize: '13px' }}>
                                              {isAbsent ? 'Absent' : 'Completed'}
                                            </span>
                                            <button className="btn btn-ghost" style={{ padding: '4px 8px', minHeight: 'unset' }} onClick={() => {
                                              setEditingAttendance(att);
                                              setAttendanceForm({
                                                status: att.status,
                                                checkIn: att.checkIn ? att.checkIn.substring(0, 5) : '',
                                                checkOut: att.checkOut ? att.checkOut.substring(0, 5) : ''
                                              });
                                              setEditAttendanceOpen(true);
                                            }}>Edit</button>
                                          </div>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="empty-state">
                            <div className="empty-state-icon">📋</div>
                            <h3 className="empty-state-title">{attendanceSearch ? "No Search Results" : "No Registered Students"}</h3>
                            <p className="empty-state-desc">
                              {attendanceSearch ? `No students match "${attendanceSearch}".` : "Daily attendance list will appear once you register students."}
                            </p>
                            {attendanceSearch ? (
                              <button className="btn btn-ghost" onClick={() => setAttendanceSearch('')}>Clear Search</button>
                            ) : (
                              <button className="btn btn-primary" onClick={() => { setActiveView('students'); setAddStudentOpen(true); }}>+ Register Student</button>
                            )}
                          </div>
                        )}
                      </section>
                    );
                  })()}

                  {/* ================= REPORTS ================= */}
                  {activeView === 'reports' && (
                    <section className="view active">
                      <div className="topbar">
                        <div>
                          <div className="page-eyebrow">Export</div>
                          <h1 className="page-title">Reports</h1>
                        </div>
                      </div>

                      <div className="report-grid">
                        <div className="report-card">
                          <div className="report-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg></div>
                          <div className="report-name">Active students</div>
                          <div className="report-desc">Full roster of currently active members with seat and shift.</div>
                          <div className="report-actions">
                            <button className="btn btn-ghost" onClick={() => handleExportReport('active-students', 'excel')}>Excel</button>
                            <button className="btn btn-ghost" onClick={() => handleExportReport('active-students', 'pdf')}>PDF</button>
                          </div>
                        </div>
                        <div className="report-card">
                          <div className="report-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg></div>
                          <div className="report-name">Vacant seats</div>
                          <div className="report-desc">Available seats by shift, updated in real time.</div>
                          <div className="report-actions">
                            <button className="btn btn-ghost" onClick={() => handleExportReport('vacant-seats', 'excel')}>Excel</button>
                            <button className="btn btn-ghost" onClick={() => handleExportReport('vacant-seats', 'pdf')}>PDF</button>
                          </div>
                        </div>
                        <div className="report-card">
                          <div className="report-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg></div>
                          <div className="report-name">Fee collection</div>
                          <div className="report-desc">All payments recorded this month, grouped by method.</div>
                          <div className="report-actions">
                            <button className="btn btn-ghost" onClick={() => handleExportReport('fee-collection', 'excel')}>Excel</button>
                            <button className="btn btn-ghost" onClick={() => handleExportReport('fee-collection', 'pdf')}>PDF</button>
                          </div>
                        </div>
                        <div className="report-card">
                          <div className="report-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg></div>
                          <div className="report-name">Pending fees</div>
                          <div className="report-desc">Students with fees overdue, sorted by days pending.</div>
                          <div className="report-actions">
                            <button className="btn btn-ghost" onClick={() => handleExportReport('pending-fees', 'excel')}>Excel</button>
                            <button className="btn btn-ghost" onClick={() => handleExportReport('pending-fees', 'pdf')}>PDF</button>
                          </div>
                        </div>
                        <div className="report-card">
                          <div className="report-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18" /><path d="M7 13l4-4 3 3 5-6" /></svg></div>
                          <div className="report-name">Attendance log</div>
                          <div className="report-desc">Daily check-in logs and check-out status.</div>
                          <div className="report-actions">
                            <button className="btn btn-ghost" onClick={() => handleExportReport('attendance-log', 'excel')}>Excel</button>
                            <button className="btn btn-ghost" onClick={() => handleExportReport('attendance-log', 'pdf')}>PDF</button>
                          </div>
                        </div>
                      </div>
                    </section>
                  )}

                  {/* ================= LEAVING REQUESTS (ADMIN) ================= */}
                  {activeView === 'leaving-requests' && (() => {
                    return (
                      <section className="view active">
                        <div className="topbar">
                          <div>
                            <div className="page-eyebrow">Students</div>
                            <h1 className="page-title">Leaving Requests</h1>
                          </div>
                          <button className="btn btn-ghost" onClick={() => {
                            setLeavingRequests([]);
                            fetchLeavingRequests();
                          }}>↻ Refresh</button>
                        </div>

                        {leavingRequestsLoading ? (
                          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--muted)' }}>Loading...</div>
                        ) : leavingRequests.length === 0 ? (
                          <div className="empty-state">
                            <div className="empty-state-icon">🚪</div>
                            <h3 className="empty-state-title">No Leaving Requests</h3>
                            <p className="empty-state-desc">When students submit a leaving request, it will appear here.</p>
                          </div>
                        ) : (
                          <div className="panel">
                            <div className="panel-head"><h3 className="panel-title">All Requests ({leavingRequests.length})</h3></div>
                            <table className="ledger">
                              <thead>
                                <tr>
                                  <th>Student</th>
                                  <th>Phone</th>
                                  <th>Leaving Date</th>
                                  <th>Reason</th>
                                  <th>Rating</th>
                                  <th>Final Amount</th>
                                  <th>Status</th>
                                  <th style={{ textAlign: 'right' }}>Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {leavingRequests.map((req, i) => (
                                  <tr key={i}>
                                    <td className="cell-name">
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        {req.profileImage
                                          ? <img src={req.profileImage} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                                          : <span className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>{(req.studentName || 'S').slice(0, 2).toUpperCase()}</span>
                                        }
                                        {req.studentName}
                                      </div>
                                    </td>
                                    <td>{req.mobileNumber || '—'}</td>
                                    <td>{req.leavingDate ? new Date(req.leavingDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{req.reason || '—'}</td>
                                    <td>
                                      <span style={{ color: 'var(--mustard)', fontWeight: 600 }}>
                                        {'★'.repeat(req.rating || 0)}{'☆'.repeat(5 - (req.rating || 0))}
                                      </span>
                                    </td>
                                    <td style={{ fontWeight: 600, color: req.finalPendingFee < 0 ? 'var(--teal)' : req.finalPendingFee > 0 ? 'var(--red, #e05)' : 'var(--ink-soft)' }}>
                                      {req.finalPendingFee < 0
                                        ? `Refund ₹${Math.abs(req.finalPendingFee)}`
                                        : req.finalPendingFee > 0
                                          ? `Due ₹${req.finalPendingFee}`
                                          : 'Clear'}
                                    </td>
                                    <td>
                                      <span className={`stamp ${req.settled ? 'paid' : 'due'}`}>
                                        {req.settled ? 'Settled' : 'Pending'}
                                      </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                      {req.finalPendingFee < 0 && !req.settled ? (
                                        <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 13, background: 'var(--teal)' }} onClick={() => {
                                          setSettleRefundData(req);
                                          setSettleRefundForm({ mode: 'CASH', screenshot: '' });
                                          setSettleRefundOpen(true);
                                        }}>Settle Refund</button>
                                      ) : req.finalPendingFee < 0 && req.settled ? (
                                        <span style={{ fontSize: 13, color: 'var(--muted)' }}>{req.refundMode}</span>
                                      ) : null}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </section>
                    );
                  })()}

                  {/* ================= SETTINGS ================= */}
                  {activeView === 'settings' && (
                    <section className="view active">
                      <div className="topbar">
                        <div>
                          <div className="page-eyebrow">Configuration</div>
                          <h1 className="page-title">Settings</h1>
                        </div>
                      </div>

                      {/* Subscription Status Card */}
                      <div className="panel" style={{ marginBottom: '24px', padding: '24px' }}>
                        <div className="panel-head" style={{ marginBottom: '16px' }}>
                          <h3 className="panel-title">Current Subscription</h3>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                          <div>
                            <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--ink)' }}>
                              {settingsData.planName || 'Free Trial'} Plan
                              <span className="badge" style={{
                                marginLeft: '12px',
                                background: settingsData.planStatus === 'ACTIVE' ? 'var(--teal-tint)' : 'var(--mustard-tint)',
                                color: settingsData.planStatus === 'ACTIVE' ? 'var(--teal)' : 'var(--mustard)',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: '600'
                              }}>
                                {settingsData.planStatus || 'TRIAL'}
                              </span>
                            </div>
                            <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '6px' }}>
                              {settingsData.planStatus === 'EXPIRED' ? 'Subscription expired on' : 'Plan renews/expires on'}: <strong>{settingsData.endDate || 'N/A'}</strong>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Library details settings form */}
                      <div className="panel" style={{ padding: '24px' }}>
                        <div className="panel-head" style={{ marginBottom: '16px' }}><h3 className="panel-title">Library Details</h3></div>
                        <form onSubmit={handleUpdateSettings}>
                          <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                            <div className="field span-2">
                              <label style={{ fontWeight: '600', marginBottom: '6px', display: 'block' }}>Library Name</label>
                              <input
                                type="text"
                                value={settingsData.libraryName || ''}
                                onChange={(e) => setSettingsData({ ...settingsData, libraryName: e.target.value })}
                                required
                                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--rule)', background: 'var(--card)' }}
                              />
                            </div>

                            <div className="field">
                              <label style={{ fontWeight: '600', marginBottom: '6px', display: 'block' }}>City</label>
                              <input
                                type="text"
                                value={settingsData.city || ''}
                                onChange={(e) => setSettingsData({ ...settingsData, city: e.target.value })}
                                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--rule)', background: 'var(--card)' }}
                              />
                            </div>

                            <div className="field">
                              <label style={{ fontWeight: '600', marginBottom: '6px', display: 'block' }}>State</label>
                              <input
                                type="text"
                                value={settingsData.state || ''}
                                onChange={(e) => setSettingsData({ ...settingsData, state: e.target.value })}
                                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--rule)', background: 'var(--card)' }}
                              />
                            </div>

                            <div className="field span-2">
                              <label style={{ fontWeight: '600', marginBottom: '6px', display: 'block' }}>Full Address</label>
                              <textarea
                                rows="3"
                                value={settingsData.address || ''}
                                onChange={(e) => setSettingsData({ ...settingsData, address: e.target.value })}
                                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--rule)', background: 'var(--card)' }}
                              ></textarea>
                            </div>
                          </div>

                          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                              type="submit"
                              className="btn btn-primary"
                              disabled={settingsLoading}
                            >
                              {settingsLoading ? 'Saving...' : 'Save Settings'}
                            </button>
                          </div>
                        </form>
                      </div>
                    </section>
                  )}
                </React.Fragment>
              )}

            </main>
          </div>
        } />

        <Route path="/student" element={
          <div className="student-shell">
            <header className="student-header">
              <div className="brand" onClick={() => navigate('/login')} style={{ cursor: 'pointer' }}>
                <div className="brand-mark">S</div>
                <div>
                  <div className="brand-name" style={{ color: 'var(--ink)' }}>StudySpace</div>
                  <div className="brand-sub" style={{ color: 'var(--muted)' }}>Sunrise Reading Room</div>
                </div>
              </div>
              <div className="student-header-right">
                <div className="student-avatar-name" onClick={() => setStudentProfileOpen(true)} style={{ cursor: 'pointer' }}>
                  {studentDashboardData?.profileImage ? (
                    <img src={studentDashboardData.profileImage} alt="Profile" className="avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <span className="avatar">
                      {studentDashboardData?.studentName ? studentDashboardData.studentName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'ST'}
                    </span>
                  )}
                  <span>{studentDashboardData?.studentName || 'Student'}</span>
                </div>
                <button className="btn btn-ghost" onClick={handleStudentLogout}>Log out</button>
              </div>
            </header>

            <nav className="student-tabs">
              <div className={`student-tab ${studentView === 'overview' ? 'active' : ''}`} onClick={() => setStudentView('overview')}>Overview</div>
              <div className={`student-tab ${studentView === 'payments' ? 'active' : ''}`} onClick={() => setStudentView('payments')}>Payments</div>
              <div className={`student-tab ${studentView === 'attendance' ? 'active' : ''}`} onClick={() => setStudentView('attendance')}>Attendance</div>
              <div className={`student-tab ${studentView === 'leave' ? 'active' : ''}`} style={{ color: studentView === 'leave' ? 'var(--ink)' : 'var(--muted)' }} onClick={() => setStudentView('leave')}>Leave Library</div>
            </nav>

            <main className="student-content">
              {/* ================= STUDENT: OVERVIEW ================= */}
              {studentView === 'overview' && (() => {
                const data = studentDashboardData || {};
                const stFeeDue = data.feeDue !== undefined ? data.feeDue : 0;
                const hasNoDue = stFeeDue <= 0;
                return (
                  <section className="sview active">
                    <div className="page-eyebrow">{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
                    <h1 className="page-title" style={{ marginBottom: '22px' }}>Hi, {data.studentName || 'Student'}</h1>

                    <div className={`sub-card ${hasNoDue ? 'paid' : ''}`}>
                      <div className="sub-card-top">
                        <div>
                          <div className="sub-card-label">This month's subscription</div>
                          <div className="sub-card-amount">₹{hasNoDue ? 800 : stFeeDue}</div>
                          <div className="sub-card-due">
                            {hasNoDue ? 'Paid for this month ✓' : <span>Due amount is pending</span>}
                          </div>
                        </div>
                        <span className={`stamp ${hasNoDue ? 'paid' : 'due'}`}>{hasNoDue ? 'Paid' : 'Due'}</span>
                      </div>
                      {!hasNoDue && (
                        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '16px' }} onClick={() => {
                          setSelectedFeeForPayment({
                            id: studentDashboardData?.feeId || 0,
                            amount: stFeeDue,
                            dueAmount: stFeeDue,
                            month: new Date().getMonth() + 1,
                            year: new Date().getFullYear()
                          });
                          setPayNowOpen(true);
                        }}>Pay ₹{stFeeDue} now</button>
                      )}
                    </div>

                    <div className="stat-strip" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginTop: '20px' }}>
                      <div className="stat-card" style={{ '--stat-color': 'var(--teal)' }}>
                        <div className="stat-label">Your seat</div>
                        <div className="stat-value" style={{ fontSize: '20px' }}>{data.assignedSeat || '—'}</div>
                      </div>
                      <div className="stat-card" style={{ '--stat-color': 'var(--mustard)' }}>
                        <div className="stat-label">Shift</div>
                        <div className="stat-value" style={{ fontSize: '20px' }}>{data.shift || '—'}</div>
                      </div>
                      <div className="stat-card" style={{ '--stat-color': 'var(--sage)' }}>
                        <div className="stat-label">Attendance this month</div>
                        <div className="stat-value" style={{ fontSize: '20px' }}>{data.attendanceDaysThisMonth !== undefined ? data.attendanceDaysThisMonth : 0} days</div>
                      </div>
                    </div>

                    <div className="panel" style={{ marginTop: '20px' }}>
                      <div className="panel-head"><h3 className="panel-title">Membership details</h3></div>
                      <div className="seat-detail-row"><span>Member since</span><b>{data.joiningDate || '—'}</b></div>
                      <div className="seat-detail-row"><span>Parent / guardian</span><b>{data.parentName || '—'}</b></div>
                      <div className="seat-detail-row"><span>Registered mobile</span><b>{data.mobileNumber || '—'}</b></div>
                      <div className="seat-detail-row"><span>Membership status</span><b>{data.membershipStatus || '—'}</b></div>
                    </div>
                  </section>
                );
              })()}

              {/* ================= STUDENT: PAYMENTS ================= */}
              {studentView === 'payments' && (
                <section className="sview active">
                  <div className="page-eyebrow">Ledger</div>
                  <h1 className="page-title" style={{ marginBottom: '22px' }}>Your payments</h1>
                  {studentDashboardData?.paymentHistory && studentDashboardData.paymentHistory.length > 0 ? (
                    <div className="panel">
                      <div className="panel-head"><h3 className="panel-title">Payment history</h3></div>
                      <table className="ledger">
                        <thead>
                          <tr><th>Month</th><th>Amount</th><th>Method</th><th>Date</th><th>Status</th><th></th></tr>
                        </thead>
                        <tbody>
                          {studentDashboardData.paymentHistory.map((item, idx) => {
                            const formattedDate = item.paymentDate ? new Date(item.paymentDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '—';
                            return (
                              <tr key={idx}>
                                <td className="cell-name">{item.month}/{item.year}</td>
                                <td className="cell-amount">₹{item.amount}</td>
                                <td>{item.paymentMode || '—'}</td>
                                <td>{formattedDate}</td>
                                <td><span className="stamp paid">Paid</span></td>
                                <td>
                                  <span className="panel-link" onClick={() => {
                                    alert(`RECEIPT\n-----------------\nStudent: ${studentDashboardData.studentName}\nAmount: ₹${item.amount}\nPaid Amount: ₹${item.paidAmount}\nMethod: ${item.paymentMode}\nDate: ${item.paymentDate}`);
                                  }} style={{ cursor: 'pointer' }}>Receipt</span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="empty-state">
                      <div className="empty-state-icon">💵</div>
                      <h3 className="empty-state-title">No Payments Yet</h3>
                      <p className="empty-state-desc">Your payment history and invoices will be listed here once generated.</p>
                    </div>
                  )}
                </section>
              )}

              {/* ================= STUDENT: ATTENDANCE ================= */}
              {studentView === 'attendance' && (
                <section className="sview active">
                  <div className="page-eyebrow">This month</div>
                  <h1 className="page-title" style={{ marginBottom: '22px' }}>Your attendance</h1>
                  
                  <div className="toolbar" style={{ marginBottom: '20px', gap: '10px', display: 'flex' }}>
                    <button className="btn btn-primary" onClick={handleStudentCheckIn}>
                      Check In
                    </button>
                    <button className="btn btn-ghost" onClick={handleStudentCheckOut} style={{ border: '1px solid var(--border)' }}>
                      Check Out
                    </button>
                  </div>

                  {studentDashboardData?.attendanceHistory && studentDashboardData.attendanceHistory.length > 0 ? (
                    <div className="panel">
                      <div className="panel-head"><h3 className="panel-title">Recent check-ins</h3></div>
                      <table className="ledger">
                        <thead>
                          <tr><th>Date</th><th>Check-in</th><th>Check-out</th></tr>
                        </thead>
                        <tbody>
                          {studentDashboardData.attendanceHistory.map((item, idx) => (
                            <tr key={idx}>
                              <td className="cell-name">{new Date(item.attendanceDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</td>
                              <td className="mono">{item.checkIn || '—'}</td>
                              <td className="mono">{item.checkOut || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="empty-state">
                      <div className="empty-state-icon">📋</div>
                      <h3 className="empty-state-title">No Attendance Logs</h3>
                      <p className="empty-state-desc">Your daily check-in and check-out logs will be recorded here.</p>
                    </div>
                  )}
                </section>
              )}
              {/* ================= STUDENT: LEAVE LIBRARY ================= */}
              {studentView === 'leave' && (
                <section className="sview active">
                  <div className="page-eyebrow">Membership</div>
                  <h1 className="page-title" style={{ marginBottom: '8px' }}>Leave Library</h1>
                  <p style={{ color: 'var(--muted)', marginBottom: '28px', fontSize: '14px' }}>
                    Fill in the details below. If you have a pending amount, you will need to pay it via Razorpay before leaving.
                  </p>

                  {/* ── STEP: CONFIRMED ─────────────────────────────────── */}
                  {leavingStep === 'confirmed' && leavingResult && (
                    <div className="panel" style={{ padding: '32px', textAlign: 'center' }}>
                      <div style={{ fontSize: 52, marginBottom: 16 }}>{leavingResult.isRefund ? '💰' : '✅'}</div>
                      <h2 style={{ marginBottom: 12, color: 'var(--ink)' }}>Leaving Confirmed!</h2>
                      <p style={{ color: 'var(--muted)', marginBottom: 20 }}>{leavingResult.message}</p>
                      <div style={{ background: 'var(--surface)', borderRadius: 12, padding: '16px 24px', display: 'inline-block', marginBottom: 24 }}>
                        <div style={{ fontSize: 13, color: 'var(--muted)' }}>Leaving Date</div>
                        <div style={{ fontWeight: 700, fontSize: 18 }}>{leavingResult.leavingDate}</div>
                      </div>
                      <br />
                      <button className="btn btn-ghost" style={{ marginTop: 16 }} onClick={() => {
                        localStorage.removeItem('token');
                        localStorage.removeItem('role');
                        window.location.href = '/';
                      }}>Log Out</button>
                    </div>
                  )}

                  {/* ── STEP: PREVIEW (dues shown, pay or confirm) ────── */}
                  {leavingStep === 'preview' && leavingPreviewData && (
                    <div className="panel" style={{ padding: '28px' }}>
                      <h3 className="panel-title" style={{ marginBottom: '20px' }}>Review Your Dues</h3>

                      {/* Summary row */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
                        <div style={{ background: 'var(--surface)', borderRadius: 12, padding: '16px', textAlign: 'center' }}>
                          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Leaving On</div>
                          <div style={{ fontWeight: 700 }}>{leavingPreviewData.leavingDate}</div>
                        </div>
                        <div style={{ background: 'var(--surface)', borderRadius: 12, padding: '16px', textAlign: 'center' }}>
                          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Final Amount</div>
                          <div style={{ fontWeight: 700, fontSize: 18,
                            color: leavingPreviewData.finalPendingFee < 0 ? 'var(--teal)'
                              : leavingPreviewData.finalPendingFee > 0 ? '#e05050' : 'var(--ink)'
                          }}>
                            {leavingPreviewData.finalPendingFee > 0 ? `₹${leavingPreviewData.finalPendingFee} Due`
                              : leavingPreviewData.finalPendingFee < 0 ? `₹${Math.abs(leavingPreviewData.finalPendingFee)} Refund`
                              : '₹0 Clear'}
                          </div>
                        </div>
                        <div style={{ background: 'var(--surface)', borderRadius: 12, padding: '16px', textAlign: 'center' }}>
                          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Action Required</div>
                          <div style={{ fontWeight: 700, color: leavingPreviewData.requiresPayment ? '#e05050' : 'var(--teal)' }}>
                            {leavingPreviewData.requiresPayment ? 'Payment Required' : 'Ready to Leave'}
                          </div>
                        </div>
                      </div>

                      <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 24 }}>{leavingPreviewData.message}</p>

                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <button className="btn btn-ghost" onClick={() => setLeavingStep('form')}>← Go Back</button>

                        {leavingPreviewData.requiresPayment ? (
                          // ── PAY via Razorpay then confirm ────────────────
                          <button
                            className="btn btn-primary"
                            disabled={leavingSubmitting}
                            style={{ background: 'linear-gradient(135deg, #e05050, #c0392b)', minWidth: 200 }}
                            onClick={() => {
                              const options = {
                                key: leavingPreviewData.razorpayKeyId,
                                amount: leavingPreviewData.amountInPaise,
                                currency: 'INR',
                                name: 'Library — Leaving Fee',
                                description: `Final dues for leaving on ${leavingPreviewData.leavingDate}`,
                                order_id: leavingPreviewData.razorpayOrderId,
                                handler: async (paymentResponse) => {
                                  setLeavingSubmitting(true);
                                  try {
                                    const token = localStorage.getItem('token');
                                    const res = await fetch(`${API_BASE_URL}/api/leaving/confirm`, {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json', Authorization: token },
                                      body: JSON.stringify({
                                        leavingDate: leavingForm.leavingDate,
                                        reason: leavingForm.reason,
                                        rating: String(leavingForm.rating),
                                        razorpayOrderId: paymentResponse.razorpay_order_id,
                                        razorpayPaymentId: paymentResponse.razorpay_payment_id,
                                        razorpaySignature: paymentResponse.razorpay_signature
                                      })
                                    });
                                    const data = await res.json();
                                    if (data.success || data.status === 'success') {
                                      setLeavingResult(data.data);
                                      setLeavingStep('confirmed');
                                      showToast('Payment successful. Leaving confirmed!');
                                    } else {
                                      showToast(data.message || 'Confirmation failed. Contact admin.');
                                    }
                                  } catch (e) {
                                    showToast('Network error. Contact admin with your payment ID.');
                                  } finally {
                                    setLeavingSubmitting(false);
                                  }
                                },
                                prefill: { name: studentDashboardData?.studentName || '' },
                                theme: { color: '#c0392b' }
                              };
                              const rzp = new window.Razorpay(options);
                              rzp.on('payment.failed', (resp) => showToast('Payment failed: ' + resp.error.description));
                              rzp.open();
                            }}
                          >
                            {leavingSubmitting ? 'Processing...' : `Pay ₹${leavingPreviewData.finalPendingFee} & Leave`}
                          </button>
                        ) : (
                          // ── No dues — confirm directly ─────────────────
                          <button
                            className="btn btn-primary"
                            disabled={leavingSubmitting}
                            onClick={async () => {
                              if (!window.confirm('Confirm leaving? This cannot be undone.')) return;
                              setLeavingSubmitting(true);
                              try {
                                const token = localStorage.getItem('token');
                                const res = await fetch(`${API_BASE_URL}/api/leaving/confirm`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json', Authorization: token },
                                  body: JSON.stringify({
                                    leavingDate: leavingForm.leavingDate,
                                    reason: leavingForm.reason,
                                    rating: String(leavingForm.rating)
                                  })
                                });
                                const data = await res.json();
                                if (data.success || data.status === 'success') {
                                  setLeavingResult(data.data);
                                  setLeavingStep('confirmed');
                                  showToast('Leaving confirmed!');
                                } else {
                                  showToast(data.message || 'Failed to confirm.');
                                }
                              } catch (e) {
                                showToast('Network error. Please try again.');
                              } finally {
                                setLeavingSubmitting(false);
                              }
                            }}
                          >
                            {leavingSubmitting ? 'Confirming...' : 'Confirm Leaving'}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── STEP: FORM ───────────────────────────────────── */}
                  {leavingStep === 'form' && (
                    <div className="panel" style={{ padding: '28px' }}>
                      <h3 className="panel-title" style={{ marginBottom: '24px' }}>Leaving Request Form</h3>

                      {/* Leaving Date */}
                      <div className="field" style={{ marginBottom: '20px' }}>
                        <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Leaving Date <span style={{ color: '#e05' }}>*</span></label>
                        <input
                          type="date"
                          min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                          value={leavingForm.leavingDate}
                          onChange={e => setLeavingForm({ ...leavingForm, leavingDate: e.target.value })}
                          style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--rule)', background: 'var(--card)', width: '100%', maxWidth: 300 }}
                        />
                        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>Your dues will be prorated up to this date.</div>
                      </div>

                      {/* Star Rating */}
                      <div className="field" style={{ marginBottom: '20px' }}>
                        <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Your Experience Rating</label>
                        <div style={{ display: 'flex', gap: 8, fontSize: 28, cursor: 'pointer' }}>
                          {[1,2,3,4,5].map(star => (
                            <span
                              key={star}
                              onClick={() => setLeavingForm({ ...leavingForm, rating: star })}
                              style={{ color: star <= leavingForm.rating ? '#f5a623' : '#ccc', transition: 'color 0.15s' }}
                            >{star <= leavingForm.rating ? '★' : '☆'}</span>
                          ))}
                        </div>
                      </div>

                      {/* Reason */}
                      <div className="field" style={{ marginBottom: '28px' }}>
                        <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Reason for Leaving</label>
                        <textarea
                          rows={4}
                          placeholder="Tell us why you are leaving (optional)..."
                          value={leavingForm.reason}
                          onChange={e => setLeavingForm({ ...leavingForm, reason: e.target.value })}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--rule)', background: 'var(--card)', resize: 'vertical' }}
                        />
                      </div>

                      {/* Warning */}
                      <div style={{ background: 'rgba(220,53,69,0.08)', border: '1px solid rgba(220,53,69,0.25)', borderRadius: 10, padding: '14px 18px', marginBottom: 24, fontSize: 13, color: '#c0392b' }}>
                        ⚠️ <strong>This action cannot be undone.</strong> Your membership will end on the selected date.
                        If you have pending dues, you must pay via Razorpay before leaving.
                      </div>

                      <button
                        className="btn btn-primary"
                        disabled={leavingSubmitting || !leavingForm.leavingDate}
                        onClick={async () => {
                          setLeavingSubmitting(true);
                          try {
                            const token = localStorage.getItem('token');
                            const res = await fetch(`${API_BASE_URL}/api/leaving/preview`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json', Authorization: token },
                              body: JSON.stringify({
                                leavingDate: leavingForm.leavingDate,
                                reason: leavingForm.reason,
                                rating: leavingForm.rating
                              })
                            });
                            const data = await res.json();
                            if (data.success || data.status === 'success') {
                              setLeavingPreviewData(data.data);
                              setLeavingStep('preview');
                            } else {
                              showToast(data.message || 'Failed to calculate dues.');
                            }
                          } catch (e) {
                            showToast('Network error. Please try again.');
                          } finally {
                            setLeavingSubmitting(false);
                          }
                        }}
                      >
                        {leavingSubmitting ? 'Calculating...' : 'Check Dues & Proceed →'}
                      </button>
                    </div>
                  )}
                </section>
              )}
            </main>
          </div>
        } />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>

      {/* ============ MODALS ============ */}

      {/* Settle Refund Modal */}
      {settleRefundOpen && settleRefundData && (
        <div className="modal-overlay open" onClick={(e) => { if (e.target.classList.contains('modal-overlay')) setSettleRefundOpen(false); }}>
          <div className="modal-card">
            <div className="modal-head">
              <div>
                <h3 className="modal-title">Settle Refund</h3>
                <div className="modal-sub">For {settleRefundData.studentName}</div>
              </div>
              <button className="close-btn" onClick={() => setSettleRefundOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ background: 'var(--surface)', padding: 16, borderRadius: 8, marginBottom: 20, textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>Amount to Refund</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--teal)' }}>₹{Math.abs(settleRefundData.finalPendingFee)}</div>
              </div>

              <div className="field" style={{ marginBottom: '20px' }}>
                <label>Refund Mode</label>
                <div style={{ display: 'flex', gap: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input type="radio" name="refundMode" checked={settleRefundForm.mode === 'CASH'} onChange={() => setSettleRefundForm({ ...settleRefundForm, mode: 'CASH' })} /> CASH
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input type="radio" name="refundMode" checked={settleRefundForm.mode === 'UPI'} onChange={() => setSettleRefundForm({ ...settleRefundForm, mode: 'UPI' })} /> UPI
                  </label>
                </div>
              </div>

              {settleRefundForm.mode === 'UPI' && (
                <div className="field" style={{ marginBottom: '20px' }}>
                  <label>Payment Screenshot <span style={{ color: '#e05' }}>*</span></label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setSettleRefundForm({ ...settleRefundForm, screenshot: reader.result });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    style={{ padding: '8px', border: '1px solid var(--rule)', borderRadius: 8, width: '100%' }}
                  />
                  {settleRefundForm.screenshot && (
                    <img src={settleRefundForm.screenshot} alt="Preview" style={{ marginTop: 12, maxWidth: '100%', maxHeight: 200, borderRadius: 8, objectFit: 'contain', border: '1px solid var(--rule)' }} />
                  )}
                </div>
              )}
            </div>
            <div className="modal-foot">
              <button className="btn btn-ghost" onClick={() => setSettleRefundOpen(false)}>Cancel</button>
              <button
                className="btn btn-primary"
                disabled={settleRefundSubmitting || (settleRefundForm.mode === 'UPI' && !settleRefundForm.screenshot)}
                onClick={async () => {
                  setSettleRefundSubmitting(true);
                  try {
                    const token = localStorage.getItem('token');
                    const res = await fetch(`${API_BASE_URL}/api/leaving/admin/settle/${settleRefundData.id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json', Authorization: token },
                      body: JSON.stringify({
                        refundMode: settleRefundForm.mode,
                        refundScreenshot: settleRefundForm.screenshot
                      })
                    });
                    const data = await res.json();
                    if (data.success || data.status === 'success') {
                      showToast('Refund settled successfully.');
                      setSettleRefundOpen(false);
                      // Update table state
                      setLeavingRequests(prev => prev.map(req => req.id === settleRefundData.id ? { ...req, settled: true, refundMode: settleRefundForm.mode } : req));
                    } else {
                      showToast(data.message || 'Failed to settle refund.');
                    }
                  } catch (e) {
                    showToast('Network error.');
                  } finally {
                    setSettleRefundSubmitting(false);
                  }
                }}
              >
                {settleRefundSubmitting ? 'Processing...' : 'Confirm Settle'}
              </button>
            </div>
          </div>
        </div>
      )}
      {seatModalOpen && (
        <div className="modal-overlay open" onClick={(e) => { if (e.target.classList.contains('modal-overlay')) setSeatModalOpen(false); }}>
          <div className="modal-card">
            <div className="modal-head">
              <div>
                <h3 className="modal-title">{editingSeatId ? 'Edit Seat' : 'Create Seat'}</h3>
                <div className="modal-sub">{editingSeatId ? 'Update details' : 'Add a new seat'}</div>
              </div>
              <button className="modal-close" onClick={() => setSeatModalOpen(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ padding: '24px' }}>
              <div className="form-grid">
                <div className="field span-2">
                  <label>Seat Number</label>
                  <input type="text" placeholder="e.g. A01" maxLength={10} value={seatForm.seatNumber} onChange={e => setSeatForm({ ...seatForm, seatNumber: e.target.value })} />
                </div>
                <div className="field">
                  <label>Floor</label>
                  <input type="text" placeholder="e.g. First Floor" value={seatForm.floor} onChange={e => setSeatForm({ ...seatForm, floor: e.target.value })} />
                </div>
                <div className="field">
                  <label>Section</label>
                  <input type="text" placeholder="e.g. Quiet Zone" value={seatForm.section} onChange={e => setSeatForm({ ...seatForm, section: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="modal-foot">
              <button type="button" className="btn btn-ghost" onClick={() => setSeatModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => {
                const request = editingSeatId ? api.seatApi.update(editingSeatId, seatForm) : api.seatApi.create(seatForm);
                request.then(res => {
                  if (res.success || res.status === 'success') {
                    showToast(editingSeatId ? 'Seat updated' : 'Seat created');
                    setSeatModalOpen(false);
                    fetchSeats();
                  } else {
                    alert(res.message);
                  }
                });
              }}>{editingSeatId ? 'Save Changes' : 'Create Seat'}</button>
            </div>
          </div>
        </div>
      )}

      {viewStudentOpen && (
        <ViewStudentModal
          open={viewStudentOpen}
          onClose={() => setViewStudentOpen(false)}
          student={selectedStudent}
        />
      )}

      {editAttendanceOpen && editingAttendance && (
        <div className="modal-overlay open" onClick={(e) => { if (e.target.classList.contains('modal-overlay')) setEditAttendanceOpen(false); }}>
          <div className="modal-card" style={{ maxWidth: '420px' }}>
            <div className="modal-head">
              <div>
                <h3 className="modal-title">Edit Attendance</h3>
                <div className="modal-sub">{editingAttendance.studentName} · Seat {editingAttendance.seatNumber}</div>
              </div>
              <button className="modal-close" onClick={() => setEditAttendanceOpen(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ padding: '20px' }}>
              <div className="form-grid" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div className="field">
                  <label>Status</label>
                  <select value={attendanceForm.status} onChange={e => setAttendanceForm({ ...attendanceForm, status: e.target.value })}>
                    <option value="PRESENT">Present</option>
                    <option value="LEFT">Left / Checked Out</option>
                    <option value="ABSENT">Absent</option>
                  </select>
                </div>
                {attendanceForm.status !== 'ABSENT' && (
                  <React.Fragment>
                    <div className="field">
                      <label>Check-in Time</label>
                      <input type="time" value={attendanceForm.checkIn} onChange={e => setAttendanceForm({ ...attendanceForm, checkIn: e.target.value })} />
                    </div>
                    <div className="field">
                      <label>Check-out Time</label>
                      <input type="time" value={attendanceForm.checkOut} onChange={e => setAttendanceForm({ ...attendanceForm, checkOut: e.target.value })} />
                    </div>
                  </React.Fragment>
                )}
              </div>
            </div>
            <div className="modal-foot">
              <button type="button" className="btn btn-ghost" onClick={() => setEditAttendanceOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => {
                api.attendanceApi.update(editingAttendance.id, attendanceForm)
                  .then(res => {
                    if (res.success || res.status === 'success') {
                      showToast("Attendance updated successfully");
                      setEditAttendanceOpen(false);
                      fetchAttendanceData();
                    } else {
                      alert(res.message);
                    }
                  })
                  .catch(console.error);
              }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      <PayNowModal
        open={payNowOpen}
        onClose={() => { setPayNowOpen(false); setSelectedFeeForPayment(null); }}
        onSubmit={handlePayNowSubmit}
        fee={selectedFeeForPayment}
      />

      <AddFeeModal
        open={addFeeOpen}
        onClose={() => setAddFeeOpen(false)}
        onSubmit={handleAddFeeSubmit}
        students={studentsList}
      />

      <StudentProfileModal
        open={studentProfileOpen}
        onClose={() => setStudentProfileOpen(false)}
        studentData={studentDashboardData}
        onUpdate={handleStudentProfileUpdate}
      />

      <AddStudentModal
        open={addStudentOpen}
        onClose={() => { setAddStudentOpen(false); setStudentToEdit(null); }}
        onSubmit={handleAddStudentSubmit}
        fullSeats={fullSeats}
        studentsList={studentsList}
        studentToEdit={studentToEdit}
        selectedSeatLabel={selectedSeatIndex !== null ? getDisplaySeats()[selectedSeatIndex]?.label : ''}
        defaultShift={seatFilter.includes('Morning') ? 'Morning' : seatFilter.includes('Evening') ? 'Evening' : seatFilter.includes('Full') ? 'Full day' : 'Morning'}
      />
    </React.Fragment>
  );
}

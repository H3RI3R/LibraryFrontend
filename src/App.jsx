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
      } catch (ignored) {}
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
  const [loginTab, setLoginTab] = useState('mobile'); // 'mobile' or 'email'
  const [ownerMobile, setOwnerMobile] = useState('98110 22341');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('••••••••');
  
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
            if (resData.success && Array.isArray(resData.data)) {
              const mapped = resData.data.map(s => ({
                id: s.id,
                name: s.studentName,
                mobile: s.mobileNumber,
                shift: s.shift,
                seat: s.assignedSeat,
                joined: s.joiningDate ? parseDateDMY(s.joiningDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
                status: s.membershipStatus ? s.membershipStatus.toLowerCase() : 'active'
              }));
              setStudentsList(mapped);
            }
          })
          .catch(err => console.error("Error fetching students:", err));
        
        fetchDashboardData();
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

  // --- Student Portal view navigation ---
  // Views: 'overview', 'payments', 'attendance'
  const [studentView, setStudentView] = useState('overview');

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
          if (res.success && res.data) {
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
          if (res.success && res.data) {
            setStudentDashboardData(res.data);
          }
        })
        .catch(console.error);
    }
  };

  useEffect(() => {
    if (activeView === 'dashboard') {
      fetchDashboardData();
    }
    if (activeView === 'attendance' || activeView === 'seats') {
      fetchAttendanceData();
    }
    if (activeView === 'seats') {
      fetchSeats();
    }
    if (activeView === 'fees') {
      fetchFeeData();
    }
  }, [activeView, feeFilter]);

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
          if (resData.success && Array.isArray(resData.data)) {
            const mappedSeats = resData.data.map(s => ({
              id: s.id,
              label: s.seatNumber,
              floor: s.floor,
              section: s.section,
              status: s.status === 'AVAILABLE' ? 'available' : s.status === 'OCCUPIED' ? 'occupied' : 'reserved',
              student: null 
            }));
            setDashSeats(mappedSeats.slice(0, 36));
            setFullSeats(mappedSeats);
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
          if (resData.success && Array.isArray(resData.data)) {
            setAttendanceList(resData.data);
          }
        })
        .catch(console.error);

      fetch(`${API_BASE_URL}/api/attendance/dashboard`, { headers: { 'Authorization': token } })
        .then(res => res.json())
        .then(resData => {
          if (resData.success && resData.data) {
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
    let mapRow = () => {};

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
        if (res.success && reportType === 'fee-collection') {
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

        if (res.success && Array.isArray(res.data)) {
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

  const handlePayNowSubmit = (method, amount) => {
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
    const payload = {
      studentName: updatedData.studentName,
      mobileNumber: updatedData.mobileNumber,
      parentName: updatedData.parentName,
      parentMobile: updatedData.parentMobile,
      address: updatedData.address,
      profileImage: updatedData.profileImage,
      age: studentDashboardData.age || 20, 
      gender: studentDashboardData.gender || 'MALE', 
      joiningDate: studentDashboardData.joiningDate,
      assignedSeat: studentDashboardData.assignedSeat,
      shift: studentDashboardData.shift === 'Full day' ? 'FULL_DAY' : studentDashboardData.shift.toUpperCase(),
      membershipStatus: studentDashboardData.membershipStatus || 'ACTIVE',
      monthlyFee: studentDashboardData.feeDue || 800
    };

    api.studentApi.update(studentDashboardData.studentId, payload)
      .then(res => {
        if (res.success) {
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

    const payload = {
      studentName: studentData.name,
      mobileNumber: studentData.mobile,
      parentName: studentData.parentName || 'Parent Name',
      parentMobile: studentData.parentMobile || '9999999999',
      address: studentData.address || 'Address',
      joiningDate: studentData.joinedRaw || new Date().toISOString().split('T')[0],
      assignedSeat: studentData.seat,
      shift: studentData.shift === 'Full day' ? 'FULL_DAY' : studentData.shift.toUpperCase(),
      membershipStatus: studentData.status ? studentData.status.toUpperCase() : 'ACTIVE',
      email: studentData.email,
      gender: studentData.gender ? studentData.gender.toUpperCase() : 'MALE',
      age: studentData.age || 20,
      monthlyFee: studentData.monthlyFee || 800,
      profileImage: studentData.profileImage
    };

    fetch(`${API_BASE_URL}/api/student`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(resData => {
        if (resData.success) {
          const s = resData.data;
          const newStudent = {
            id: s.id,
            name: s.studentName,
            mobile: s.mobileNumber,
            shift: s.shift,
            seat: s.assignedSeat,
            joined: s.joiningDate ? parseDateDMY(s.joiningDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
            status: s.membershipStatus ? s.membershipStatus.toLowerCase() : 'active'
          };
          setStudentsList([newStudent, ...studentsList]);

          // Update Seat Status
          setFullSeats(fullSeats.map(seat => {
            if (seat.label === studentData.seat) {
              return { ...seat, status: 'occupied', student: studentData.name };
            }
            return seat;
          }));

          setAddStudentOpen(false);
          showToast(`<b>${studentData.name}</b> registered — seat ${studentData.seat}, ${studentData.shift} shift.`);
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
      shifts: Object.keys(obShifts).filter(k => obShifts[k]).join(','),
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

  // Filter students based on search string
  const filteredStudents = studentsList.filter(s => 
    s.name.toLowerCase().includes(studentSearch.toLowerCase()) || 
    s.mobile.replace(/\s/g, '').includes(studentSearch.replace(/\s/g, ''))
  );

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
                  <div className="login-sub">Enter your registered mobile number or email to access your account.</div>

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
                        <input type="tel" placeholder="98110 22341" value={obOwnerMobile} onChange={(e) => setObOwnerMobile(e.target.value)} />
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
          {/* ============ SIDEBAR ============ */}
          <nav className="sidebar">
            <div className="brand" onClick={() => navigate('/login')} style={{ cursor: 'pointer' }}>
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
                onClick={handleLogout}
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
                        <div className="stat-value">{dashboardData ? dashboardData.todayAttendanceCheckedIn : 0}</div>
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
                              <td>
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
                              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => {
                                  setEditingSeatId(fullSeats[selectedSeatIndex].id);
                                  setSeatForm({
                                    seatNumber: fullSeats[selectedSeatIndex].label,
                                    floor: fullSeats[selectedSeatIndex].floor || '',
                                    section: fullSeats[selectedSeatIndex].section || ''
                                  });
                                  setSeatModalOpen(true);
                                }}>Edit</button>
                                <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center', color: 'var(--terracotta)' }} onClick={() => {
                                  if(confirm('Are you sure you want to delete this seat?')) {
                                    api.seatApi.delete(fullSeats[selectedSeatIndex].id)
                                      .then(res => {
                                        if(res.success) {
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
                              const currentSeat = fullSeats[selectedSeatIndex];
                              const assignedStudent = studentsList.find(st => st.seat === currentSeat.label);
                              const todayRecord = assignedStudent ? attendanceList.find(a => a.studentId === assignedStudent.id) : null;
                              
                              const attStatus = todayRecord ? (todayRecord.status === 'ABSENT' ? 'Absent' : todayRecord.checkOut ? 'Left' : 'Checked In') : 'Absent';
                              const attClass = todayRecord ? (todayRecord.status === 'ABSENT' ? 'due' : todayRecord.checkOut ? 'inactive' : 'active') : 'due';

                              return (
                                <div className="seat-detail filled">
                                  <div className="seat-detail-name">{assignedStudent ? assignedStudent.name : 'Occupied'}</div>
                                  <div style={{ display: 'flex', gap: '8px', margin: '8px 0 16px 0' }}>
                                    <span className={`stamp ${currentSeat.status === 'due' ? 'due' : 'paid'}`} style={{ margin: 0 }}>
                                      {currentSeat.status === 'due' ? 'Due' : 'Paid'}
                                    </span>
                                    <span className={`stamp ${attClass}`} style={{ margin: 0 }}>
                                      {attStatus}
                                    </span>
                                  </div>
                                  <div className="seat-detail-row"><span>Seat</span><b>{currentSeat.label}</b></div>
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

                      return (
                        <div className="panel">
                          <div className="panel-head"><h3 className="panel-title">Payment history</h3></div>
                          <table className="ledger">
                            <thead>
                              <tr><th>Student</th><th>Amount</th><th>Method</th><th>Date</th><th>Status</th><th></th></tr>
                            </thead>
                            <tbody>
                              {filteredFees.length > 0 ? (
                                filteredFees.map((fee, fIdx) => {
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
                                })
                              ) : (
                                <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--muted)' }}>No payment records found.</td></tr>
                              )}
                            </tbody>
                          </table>
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

                      <div className="panel">
                        <div className="panel-head"><h3 className="panel-title">Daily attendance list</h3></div>
                        <table className="ledger">
                          <thead>
                            <tr><th>Student</th><th>Seat</th><th>Check-in</th><th>Check-out</th><th>Status</th><th>Actions</th></tr>
                          </thead>
                          <tbody>
                            {filteredDailyAttendance.length > 0 ? (
                              filteredDailyAttendance.map((r, rIdx) => {
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
                                                if (res.success) {
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
                                                if (res.success) {
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
                              })
                            ) : (
                              <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--muted)' }}>No student attendance data found.</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
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
                <div className="panel">
                  <div className="panel-head"><h3 className="panel-title">Payment history</h3></div>
                  <table className="ledger">
                    <thead>
                      <tr><th>Month</th><th>Amount</th><th>Method</th><th>Date</th><th>Status</th><th></th></tr>
                    </thead>
                    <tbody>
                      {studentDashboardData?.paymentHistory && studentDashboardData.paymentHistory.length > 0 ? (
                        studentDashboardData.paymentHistory.map((item, idx) => {
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
                        })
                      ) : (
                        <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--muted)' }}>No payment records found.</td></tr>
                      )}
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
                      {studentDashboardData?.attendanceHistory && studentDashboardData.attendanceHistory.length > 0 ? (
                        studentDashboardData.attendanceHistory.map((item, idx) => (
                          <tr key={idx}>
                            <td className="cell-name">{new Date(item.attendanceDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</td>
                            <td className="mono">{item.checkIn || '—'}</td>
                            <td className="mono">{item.checkOut || '—'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="3" style={{ textAlign: 'center', color: 'var(--muted)' }}>No attendance records found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </main>
          </div>
        } />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>

      {/* ============ MODALS ============ */}
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
                  <input type="text" placeholder="e.g. A01" value={seatForm.seatNumber} onChange={e => setSeatForm({...seatForm, seatNumber: e.target.value})} />
                </div>
                <div className="field">
                  <label>Floor</label>
                  <input type="text" placeholder="e.g. First Floor" value={seatForm.floor} onChange={e => setSeatForm({...seatForm, floor: e.target.value})} />
                </div>
                <div className="field">
                  <label>Section</label>
                  <input type="text" placeholder="e.g. Quiet Zone" value={seatForm.section} onChange={e => setSeatForm({...seatForm, section: e.target.value})} />
                </div>
              </div>
            </div>
            <div className="modal-foot">
              <button type="button" className="btn btn-ghost" onClick={() => setSeatModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => {
                const request = editingSeatId ? api.seatApi.update(editingSeatId, seatForm) : api.seatApi.create(seatForm);
                request.then(res => {
                  if(res.success) {
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
                  <select value={attendanceForm.status} onChange={e => setAttendanceForm({...attendanceForm, status: e.target.value})}>
                    <option value="PRESENT">Present</option>
                    <option value="LEFT">Left / Checked Out</option>
                    <option value="ABSENT">Absent</option>
                  </select>
                </div>
                {attendanceForm.status !== 'ABSENT' && (
                  <React.Fragment>
                    <div className="field">
                      <label>Check-in Time</label>
                      <input type="time" value={attendanceForm.checkIn} onChange={e => setAttendanceForm({...attendanceForm, checkIn: e.target.value})} />
                    </div>
                    <div className="field">
                      <label>Check-out Time</label>
                      <input type="time" value={attendanceForm.checkOut} onChange={e => setAttendanceForm({...attendanceForm, checkOut: e.target.value})} />
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
                    if (res.success) {
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
        vacantSeats={fullSeats.filter(s => s.status === 'available')}
        studentToEdit={studentToEdit}
      />
    </React.Fragment>
  );
}

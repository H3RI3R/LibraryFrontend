export const API_BASE_URL = 'https://test.edu2all.in/library';
// export const API_BASE_URL = 'http://localhost:5007';

// Note: If testing locally against the Spring Boot server, change this to 'http://localhost:5007'

export const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? token : ''
    };
};

export const apiCall = async (endpoint, method = 'GET', body = null) => {
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) {
        headers['Authorization'] = token;
    }

    const options = {
        method,
        headers,
    };

    if (body) {
        if (body instanceof FormData) {
            options.body = body;
        } else {
            headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(body);
        }
    }
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        return await response.json();
    } catch (error) {
        console.error(`API Error on ${method} ${endpoint}:`, error);
        throw error;
    }
};

// Students API
export const studentApi = {
    getAll: () => apiCall('/api/student/all'),
    getById: (id) => apiCall(`/api/student/${id}`),
    create: (data) => apiCall('/api/student', 'POST', data),
    update: (id, data) => apiCall(`/api/student/${id}`, 'PUT', data),
    delete: (id) => apiCall(`/api/student/${id}`, 'DELETE'),
    dashboard: () => apiCall('/api/student/dashboard'),
};

// Seats API
export const seatApi = {
    getAll: () => apiCall('/api/seats'),
    getAvailable: () => apiCall('/api/seats/available'),
    getById: (id) => apiCall(`/api/seats/${id}`),
    create: (data) => apiCall('/api/seats', 'POST', data),
    update: (id, data) => apiCall(`/api/seats/${id}`, 'PUT', data),
    assign: (data) => apiCall('/api/seats/assign', 'PUT', data),
    change: (data) => apiCall('/api/seats/change', 'PUT', data),
    vacate: (id) => apiCall(`/api/seats/vacate/${id}`, 'PUT'),
    delete: (id) => apiCall(`/api/seats/${id}`, 'DELETE'),
};

// Fees API
export const feeApi = {
    getAll: () => apiCall('/fee'),
    getById: (id) => apiCall(`/fee/${id}`),
    getStudentFees: () => apiCall('/fee/student'),
    // Backend fee create and pay expect RequestParams (query params)
    create: (params) => {
        const qs = new URLSearchParams(params).toString();
        return apiCall(`/fee?${qs}`, 'POST');
    },
    pay: (params) => {
        const qs = new URLSearchParams(params).toString();
        return apiCall(`/fee/pay?${qs}`, 'PUT');
    },
    dashboard: () => apiCall('/fee/dashboard'),
    dueList: () => apiCall('/fee/due-list'),
    paymentHistory: () => apiCall('/fee/payment-history'),
    myPaymentHistory: () => apiCall('/fee/my-payment-history'),
    receipt: (feeId) => apiCall(`/fee/receipt/${feeId}`),
    // Razorpay: Step 1 — create order
    razorpayCreateOrder: (feeId) => {
        return apiCall(`/fee/razorpay/create-order?feeId=${feeId}`, 'POST');
    },
    // Razorpay: Step 2 — verify payment signature and mark fee PAID
    razorpayVerify: (body) => apiCall('/fee/razorpay/verify', 'POST', body),
};


// Attendance API
export const attendanceApi = {
    checkIn: (data) => apiCall('/api/attendance/check-in', 'POST', data),
    checkOut: (studentId) => apiCall(`/api/attendance/check-out/${studentId}`, 'PUT'),
    getToday: () => apiCall('/api/attendance/today'),
    getByStudent: (studentId) => apiCall(`/api/attendance/student/${studentId}`),
    getDashboard: () => apiCall('/api/attendance/dashboard'),
    search: (keyword) => apiCall(`/api/attendance/search?keyword=${keyword}`),
    update: (id, data) => apiCall(`/api/attendance/${id}`, 'PUT', data),
};

// Reports API
export const reportApi = {
    getActiveStudents: () => apiCall('/api/reports/active-students'),
    getVacantSeats: () => apiCall('/api/reports/vacant-seats'),
    getFeeCollection: () => apiCall('/api/reports/fee-collection'),
    getPendingFees: () => apiCall('/api/reports/pending-fees'),
    getAttendanceSummary: () => apiCall('/api/reports/attendance-summary'),
};

export const dashboardApi = {
    get: () => apiCall('/dashboard')
};

export const libraryApi = {
    getSettings: () => apiCall('/api/library/settings'),
    updateSettings: (data) => apiCall('/api/library/settings', 'PUT', data)
};

export const authApi = {
    getOtp: (email) => apiCall(`/login/getOtp?email=${encodeURIComponent(email)}`, 'POST'),
    verifyForgotPassword: (email, otp) => apiCall(`/login/forgot-password-verify?email=${encodeURIComponent(email)}&otp=${otp}`, 'POST'),
};

export const ownerApi = {
    getLibraries: () => apiCall('/api/library/owner/libraries'),
    addLibrary: (data) => apiCall('/api/library/owner/libraries', 'POST', data),
    switchLibrary: (libraryId) => apiCall(`/api/library/owner/switch-library?libraryId=${libraryId}`, 'POST'),
};

export default {
    studentApi,
    seatApi,
    feeApi,
    attendanceApi,
    reportApi,
    dashboardApi,
    libraryApi,
    authApi,
    ownerApi,
    API_BASE_URL
};

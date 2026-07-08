import { test, expect } from '@playwright/test';

const API_BASE_URL = 'http://localhost:5007';
const TEST_EMAIL = 'verify' + Math.floor(Math.random() * 100000) + '@gmail.com';

test.describe('Library Management API Integration Tests', () => {

  test('1. Send OTP API Verification', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/signup/send-otp?email=${TEST_EMAIL}`);
    expect(response.ok()).toBeTruthy();
    
    const body = await response.json();
    expect(body.status).toBe('success');
    expect(body.token).toBeDefined();
  });

  test('2. Get All Subscription Plans Verification', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/plans`);
    expect(response.ok()).toBeTruthy();
    
    const plans = await response.json();
    expect(Array.isArray(plans)).toBeTruthy();
  });

  test('3. Unified Register API Verification', async ({ request }) => {
    const payload = {
      fullName: 'Ritik Soni',
      mobileNumber: '08890846567',
      email: TEST_EMAIL,
      password: 'myPassword123',
      libraryName: 'Sunrise Reading Room',
      city: 'Dadri',
      state: 'Uttar Pradesh',
      address: 'Dadri Greater Noida',
      shifts: 'Morning,Evening',
      totalSeats: 60,
      monthlyFee: 800,
      dueDay: 5,
      paymentMethods: 'Cash,UPI',
      planId: 1,
      isFreeTrial: true
    };

    const response = await request.post(`${API_BASE_URL}/signup/register`, {
      data: payload
    });
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body.status).toBe('success');
    expect(body.libraryId).toBeDefined();
  });

  test('4. Fetch Status Verification', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/signup/status?email=${TEST_EMAIL}`);
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body.status).toBe('success');
    expect(body.data.isExpired).toBe(false);
  });
});

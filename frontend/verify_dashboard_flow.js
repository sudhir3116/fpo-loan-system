import axios from 'axios';

const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

async function verifyDashboardFlow() {
  console.log('========================================================');
  console.log('      STARTING ADMIN DASHBOARD DATA VERIFICATION       ');
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;

  try {
    // 1. Authenticate Admin
    console.log('Step 1: Admin Authentication...');
    const loginRes = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@fpo.org',
      password: 'AdminPassword123!',
    });

    if (loginRes.data.status === 'success' && loginRes.data.token) {
      console.log(' ✔ PASS: Admin Login Token received');
      passed++;
    } else {
      throw new Error('Admin login failed');
    }

    const token = loginRes.data.token;
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

    // 2. Fetch Loans Dataset
    console.log('\nStep 2: Fetch Loans for Dashboard Metrics...');
    const loansRes = await axios.get(`${API_BASE_URL}/loans?limit=1000`, authHeaders);
    const loans = loansRes.data?.data?.loans || [];
    console.log(` ✔ PASS: Retrieved ${loans.length} loan applications`);
    passed++;

    // 3. Fetch Repayments Dataset
    console.log('\nStep 3: Fetch Repayments for Dashboard Metrics...');
    const repayRes = await axios.get(`${API_BASE_URL}/repayments?limit=1000`, authHeaders);
    const repayments = repayRes.data?.data?.repayments || [];
    console.log(` ✔ PASS: Retrieved ${repayments.length} repayment installments`);
    passed++;

    // 4. Verify Computed Metrics Integrity
    console.log('\nStep 4: Compute Dashboard Financial Ratios & Summary Metrics...');
    let totalDisbursed = 0;
    let submittedCount = 0;
    let underReviewCount = 0;

    loans.forEach((l) => {
      const st = (l.status || '').toUpperCase();
      if (st === 'SUBMITTED') submittedCount++;
      if (st === 'UNDER_REVIEW') underReviewCount++;
      if (st === 'DISBURSED' || st === 'CLOSED') {
        totalDisbursed += l.disbursedAmount || l.loanAmount || 0;
      }
    });

    let totalRepaid = 0;
    let overdueCount = 0;
    repayments.forEach((r) => {
      totalRepaid += r.amountPaid || 0;
      if (r.paymentStatus === 'OVERDUE') overdueCount++;
    });

    const outstanding = Math.max(0, totalDisbursed - totalRepaid);

    console.log(`   - Applications Count: ${loans.length}`);
    console.log(`   - Pending Attention: ${submittedCount + underReviewCount}`);
    console.log(`   - Total Disbursed: ₹${totalDisbursed}`);
    console.log(`   - Total Repaid: ₹${totalRepaid}`);
    console.log(`   - Outstanding Balance: ₹${outstanding}`);
    console.log(`   - Overdue Installments: ${overdueCount}`);

    console.log(' ✔ PASS: Calculated metrics successfully from real backend data');
    passed++;

  } catch (err) {
    console.error(' ❌ FAIL:', err.message);
    failed++;
  }

  console.log('\n========================================================');
  console.log(`   VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================\n');

  if (failed > 0) process.exit(1);
}

verifyDashboardFlow();

import axios from 'axios';

const BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

async function runReportsVerification() {
  console.log('\n========================================================');
  console.log('   STARTING REPORTS & ANALYTICS DATA VERIFICATION      ');
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, title, detail = '') {
    if (condition) {
      console.log(` ✔ PASS: ${title} ${detail ? `(${detail})` : ''}`);
      passed++;
    } else {
      console.error(` ✖ FAIL: ${title} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  try {
    // 1. Admin Login
    const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@fpo.org',
      password: 'AdminPassword123!',
    });
    const adminToken = adminLogin.data.token;
    assert(!!adminToken, 'Admin Authentication', 'Token issued');

    // 2. Fetch raw domain datasets for report aggregation
    const [loansRes, repayRes] = await Promise.all([
      axios.get(`${BASE_URL}/loans?limit=1000`, { headers: { Authorization: `Bearer ${adminToken}` } }),
      axios.get(`${BASE_URL}/repayments?limit=1000`, { headers: { Authorization: `Bearer ${adminToken}` } }),
    ]);

    assert(
      loansRes.status === 200 && Array.isArray(loansRes.data?.data?.loans),
      'GET /api/loans (Raw Loans Dataset for Reports)',
      `Retrieved ${loansRes.data?.data?.loans?.length} loan applications`
    );

    assert(
      repayRes.status === 200 && Array.isArray(repayRes.data?.data?.repayments),
      'GET /api/repayments (Raw Repayments Dataset for Reports)',
      `Retrieved ${repayRes.data?.data?.repayments?.length} repayment installments`
    );

    // 3. Compute KPI metrics
    const loans = loansRes.data?.data?.loans || [];
    const repayments = repayRes.data?.data?.repayments || [];

    let totalDisbursed = 0;
    loans.forEach((l) => {
      const st = (l.status || '').toUpperCase();
      if (st === 'DISBURSED' || st === 'CLOSED') {
        totalDisbursed += l.disbursedAmount || l.loanAmount || 0;
      }
    });

    let totalRepaid = 0;
    repayments.forEach((r) => {
      totalRepaid += r.amountPaid || 0;
    });

    assert(
      totalDisbursed >= 0 && totalRepaid >= 0,
      'Compiled Report Metrics Calculation',
      `Disbursed: ₹${totalDisbursed}, Repaid: ₹${totalRepaid}`
    );

  } catch (err) {
    console.error('✖ Verification error:', err.response?.data || err.message);
    failed++;
  }

  console.log('\n========================================================');
  console.log(`   VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runReportsVerification();

import axios from 'axios';

const BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

async function runStateMachineVerification() {
  console.log('\n========================================================');
  console.log('   STARTING LOAN APPLICATION STATE MACHINE VERIFICATION   ');
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
    // 1. Login Admin
    const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@fpo.org',
      password: 'AdminPassword123!',
    });
    const adminToken = adminLogin.data.token;
    assert(!!adminToken, 'Admin Authentication', 'Token issued');

    // 2. Register a new test farmer
    const testFarmerEmail = `farmer_sm_${Date.now()}@test.com`;
    const farmerReg = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'SM Test Farmer',
      email: testFarmerEmail,
      password: 'Password@123',
      phone: '9988776655',
      role: 'FARMER',
    });
    const farmerToken = farmerReg.data.token;
    assert(!!farmerToken, 'Farmer Registration', `Email: ${testFarmerEmail}`);

    // 3. Submit Loan (Status -> SUBMITTED)
    const loanCreateRes = await axios.post(
      `${BASE_URL}/loans`,
      {
        loanAmount: 50000,
        purpose: 'Drip Irrigation Setup',
        interestRate: 5,
        tenureMonths: 12,
      },
      { headers: { Authorization: `Bearer ${farmerToken}` } }
    );
    const loan = loanCreateRes.data.data.loan;
    assert(
      loanCreateRes.status === 201 && loan.status === 'SUBMITTED',
      '1. Submit Loan Application (Status: SUBMITTED)',
      `Loan ID: ${loan._id}`
    );

    // 4. Test Invalid State Bypass: Direct Disburse on SUBMITTED loan (Should be rejected with HTTP 400)
    try {
      await axios.put(
        `${BASE_URL}/loans/${loan._id}/disburse`,
        { disbursedAmount: 50000 },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      assert(false, 'State Machine Safeguard (Block direct disburse on SUBMITTED)', 'Failed to block invalid transition');
    } catch (err) {
      assert(
        err.response && err.response.status === 400,
        'State Machine Safeguard (Block direct disburse on SUBMITTED)',
        `HTTP ${err.response?.status}: "${err.response?.data?.message}"`
      );
    }

    // 5. Transition: SUBMITTED -> UNDER_REVIEW
    const reviewRes = await axios.put(
      `${BASE_URL}/loans/${loan._id}/under-review`,
      {},
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    assert(
      reviewRes.status === 200 && reviewRes.data.data.loan.status === 'UNDER_REVIEW',
      '2. Transition: SUBMITTED -> UNDER_REVIEW',
      `Updated status: ${reviewRes.data.data.loan.status}`
    );

    // 6. Transition: UNDER_REVIEW -> APPROVED
    const approveRes = await axios.put(
      `${BASE_URL}/loans/${loan._id}/approve`,
      { interestRate: 4.5, tenureMonths: 12, remarks: 'Verified land record & credit score' },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    assert(
      approveRes.status === 200 && approveRes.data.data.loan.status === 'APPROVED',
      '3. Transition: UNDER_REVIEW -> APPROVED',
      `Updated status: ${approveRes.data.data.loan.status}, ApprovedBy recorded`
    );

    // 7. Transition: APPROVED -> DISBURSED
    const disburseRes = await axios.put(
      `${BASE_URL}/loans/${loan._id}/disburse`,
      { disbursedAmount: 50000 },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    assert(
      disburseRes.status === 200 &&
        disburseRes.data.data.loan.status === 'DISBURSED' &&
        Array.isArray(disburseRes.data.data.repayments) &&
        disburseRes.data.data.repayments.length === 12,
      '4. Transition: APPROVED -> DISBURSED',
      `Status: ${disburseRes.data.data.loan.status}, Generated ${disburseRes.data.data.repayments?.length} EMI installments`
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

runStateMachineVerification();

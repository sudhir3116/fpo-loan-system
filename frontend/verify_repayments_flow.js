import axios from 'axios';

const BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

async function runRepaymentsVerification() {
  console.log('\n======================================================');
  console.log('   STARTING REPAYMENTS MONITORING API VERIFICATION    ');
  console.log('======================================================\n');

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
    assert(!!adminToken, 'Admin Login', 'Token issued');

    // 2. Fetch all repayments across system
    const allRepayRes = await axios.get(`${BASE_URL}/repayments`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      allRepayRes.status === 200 && Array.isArray(allRepayRes.data?.data?.repayments),
      'GET /api/repayments (Admin Repayment Queue)',
      `Returned ${allRepayRes.data?.data?.repayments?.length} installment records`
    );

    const repaymentsList = allRepayRes.data?.data?.repayments || [];
    if (repaymentsList.length > 0) {
      const firstInst = repaymentsList.find((r) => r.paymentStatus === 'PENDING') || repaymentsList[0];
      console.log(`Testing installment #${firstInst.installmentNumber} (paymentStatus: ${firstInst.paymentStatus}) for loan ${firstInst.loan?._id || firstInst.loan}`);

      // 3. Test Invalid Negative Payment Rejection (HTTP 400)
      try {
        await axios.put(
          `${BASE_URL}/repayments/${firstInst._id}/pay`,
          { amountPaid: -500 },
          { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        assert(false, 'Negative Payment Rejection', 'Expected 400 error');
      } catch (err) {
        assert(
          err.response && err.response.status === 400,
          'Negative Payment Rejection',
          `HTTP ${err.response?.status}: "${err.response?.data?.message}"`
        );
      }

      // 4. Test Payment Exceeding Amount Due Rejection (HTTP 400)
      try {
        await axios.put(
          `${BASE_URL}/repayments/${firstInst._id}/pay`,
          { amountPaid: 99999999 },
          { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        assert(false, 'Excessive Payment Rejection', 'Expected 400 error');
      } catch (err) {
        assert(
          err.response && err.response.status === 400,
          'Excessive Payment Rejection',
          `HTTP ${err.response?.status}: "${err.response?.data?.message}"`
        );
      }

      // 5. Test Partial Payment Mutation (PUT /api/repayments/:id/pay)
      const payRes = await axios.put(
        `${BASE_URL}/repayments/${firstInst._id}/pay`,
        {
          amountPaid: Math.floor(firstInst.amountDue / 2),
          paymentMethod: 'UPI',
          transactionReference: 'UPI-TXN-2026-TEST',
        },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      assert(
        payRes.status === 200 && payRes.data?.data?.repayment?.paymentStatus === 'PARTIAL',
        'PUT /api/repayments/:id/pay (Record Partial Repayment)',
        `Amount Paid: ₹${payRes.data?.data?.repayment?.amountPaid}, Status: '${payRes.data?.data?.repayment?.paymentStatus}'`
      );
    } else {
      console.log('ℹ No repayment installments generated yet in database.');
    }

  } catch (err) {
    console.error('✖ Verification error:', err.response?.data || err.message);
    failed++;
  }

  console.log('\n======================================================');
  console.log(`   VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runRepaymentsVerification();

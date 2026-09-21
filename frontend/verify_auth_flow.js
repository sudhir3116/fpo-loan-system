import axios from 'axios';

const BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

async function runAuthVerification() {
  console.log('\n======================================================');
  console.log('   STARTING ADMIN AUTHENTICATION FLOW VERIFICATION    ');
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
    // 1. Health check
    const healthRes = await axios.get(`${BASE_URL}/health`);
    assert(healthRes.status === 200, 'Backend API Health Check', `Status: ${healthRes.status}`);

    // 2. Test Invalid Credentials (Wrong Password)
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        email: 'admin@fpo.org',
        password: 'WrongPassword123!',
      });
      assert(false, 'Invalid Credentials Handling', 'Expected 401 error, but call succeeded');
    } catch (err) {
      assert(
        err.response && err.response.status === 401 && err.response.data.status === 'fail',
        'Invalid Credentials Handling',
        `Status 401, Message: "${err.response?.data?.message}"`
      );
    }

    // 3. Test Missing Credentials
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        email: '',
        password: '',
      });
      assert(false, 'Missing Credentials Handling', 'Expected 400 error, but call succeeded');
    } catch (err) {
      assert(
        err.response && err.response.status === 400,
        'Missing Credentials Handling',
        `Status 400, Message: "${err.response?.data?.message}"`
      );
    }

    // 4. Test Successful FPO_ADMIN Login
    const adminLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@fpo.org',
      password: 'AdminPassword123!',
    });
    const adminToken = adminLoginRes.data?.token;
    const adminUser = adminLoginRes.data?.data?.user;

    assert(
      adminLoginRes.status === 200 && !!adminToken && adminUser?.role === 'FPO_ADMIN',
      'Successful FPO_ADMIN Login',
      `Token issued, User Role: ${adminUser?.role}`
    );

    // 5. Test FARMER Account Login (To verify role segregation logic)
    const farmerLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'farmer@example.com',
      password: 'FarmerPassword123!',
    });
    const farmerUser = farmerLoginRes.data?.data?.user;

    assert(
      farmerLoginRes.status === 200 && farmerUser?.role === 'FARMER',
      'FARMER Credentials Login Response',
      `User Role: ${farmerUser?.role} (AuthContext blocks FARMER access to Admin Portal)`
    );

    // 6. Test GET /api/auth/me with FPO_ADMIN JWT (Session Verification on Refresh)
    const meRes = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      meRes.status === 200 && meRes.data?.data?.user?.role === 'FPO_ADMIN',
      'Session Verification on Page Refresh (GET /api/auth/me)',
      `User verified as ${meRes.data?.data?.user?.name} (${meRes.data?.data?.user?.role})`
    );

    // 7. Test Invalid JWT Token Handling
    try {
      await axios.get(`${BASE_URL}/auth/me`, {
        headers: { Authorization: 'Bearer invalid_jwt_token_format' },
      });
      assert(false, 'Invalid JWT Handling', 'Expected 401 error');
    } catch (err) {
      assert(
        err.response && err.response.status === 401,
        'Invalid JWT Handling',
        `Status 401, Message: "${err.response?.data?.message}"`
      );
    }

    // 8. Test Admin Protected Endpoint Access (GET /api/loans)
    const loansRes = await axios.get(`${BASE_URL}/loans`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      loansRes.status === 200 && Array.isArray(loansRes.data?.data?.loans),
      'FPO_ADMIN Protected Route API Access (/api/loans)',
      `Returned status ${loansRes.status}`
    );

  } catch (err) {
    console.error('✖ Verification error:', err.message);
    failed++;
  }

  console.log('\n======================================================');
  console.log(`   VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runAuthVerification();

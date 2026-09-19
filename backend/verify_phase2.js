process.env.NODE_ENV = 'test';
require('dotenv').config();

const http = require('http');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

async function runVerificationSuite() {
  console.log('\n==================================================');
  console.log('  STARTING PHASE 2 AUTH & RBAC VERIFICATION SUITE ');
  console.log('==================================================\n');

  let mongoServer;
  let server;
  let passed = 0;
  let failed = 0;

  function assert(condition, testName, detail = '') {
    if (condition) {
      console.log(` ✔ PASS: ${testName} ${detail ? `(${detail})` : ''}`);
      passed++;
    } else {
      console.error(` ✖ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  try {
    // 1. Initialize In-Memory MongoDB Server
    const { MongoMemoryServer } = require('mongodb-memory-server');
    console.log('Initializing isolated In-Memory MongoDB Server...');
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    process.env.MONGO_URI = mongoUri;
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'fpo_loan_system_super_secret_jwt_key_2026';
    process.env.JWT_EXPIRE = '7d';

    await mongoose.connect(mongoUri);
    console.log('Connected to In-Memory MongoDB successfully.\n');

    // Import models and app AFTER Mongo is connected
    const User = require('./models/User');
    const app = require('./server');

    // Start Express Test Server
    const TEST_PORT = 5099;
    const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

    await new Promise((resolve) => {
      server = app.listen(TEST_PORT, () => {
        console.log(`Test Express server listening on ${BASE_URL}\n`);
        resolve();
      });
    });

    const testPassword = 'Password@123';

    // --------------------------------------------------
    // TEST 1: Direct Bcrypt Hashing & Password Matching
    // --------------------------------------------------
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(testPassword, salt);
    
    assert(
      hashedPassword.startsWith('$2a$') || hashedPassword.startsWith('$2b$'),
      'Direct Password Hashing',
      'bcrypt generates valid hash string starting with $2a$/$2b$'
    );

    const isMatch = await bcrypt.compare(testPassword, hashedPassword);
    const isBadMatch = await bcrypt.compare('WrongPass', hashedPassword);
    assert(isMatch && !isBadMatch, 'Password Hash Matching', 'bcrypt compare succeeds on match and fails on mismatch');

    // --------------------------------------------------
    // TEST 2: FARMER Registration (POST /api/auth/register)
    // --------------------------------------------------
    const farmerEmail = `farmer_${Date.now()}@example.com`;
    const farmerRegRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Ramesh Patel',
        email: farmerEmail,
        password: testPassword,
        phone: '9876543210',
        role: 'FARMER',
        fpoName: 'Green Valley Farmers Producer Co.',
        address: { village: 'Perundurai', district: 'Erode', state: 'Tamil Nadu', pincode: '638052' },
      }),
    });

    const farmerRegData = await farmerRegRes.json();
    assert(
      farmerRegRes.status === 201 && farmerRegData.status === 'success' && farmerRegData.token,
      'FARMER Registration Endpoint',
      `HTTP Status: ${farmerRegRes.status}`
    );
    assert(
      farmerRegData.data.user.role === 'FARMER' && farmerRegData.data.user.password === undefined,
      'FARMER Payload Security',
      'Role is FARMER and plain-text/hash password is NOT returned in response'
    );

    const farmerToken = farmerRegData.token;

    // --------------------------------------------------
    // TEST 3: FPO_ADMIN Registration (POST /api/auth/register)
    // --------------------------------------------------
    const adminEmail = `admin_${Date.now()}@example.com`;
    const adminRegRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Suresh Kumar',
        email: adminEmail,
        password: testPassword,
        phone: '9123456789',
        role: 'FPO_ADMIN',
        adminSecretKey: process.env.ADMIN_SECRET_KEY || 'fpo_admin_secret_key_2026',
        fpoName: 'Green Valley Farmers Producer Co.',
        fpoRegistrationNo: 'FPO-MH-2024-001',
      }),
    });

    const adminRegData = await adminRegRes.json();
    assert(
      adminRegRes.status === 201 && adminRegData.status === 'success' && adminRegData.token,
      'FPO_ADMIN Registration Endpoint',
      `HTTP Status: ${adminRegRes.status}`
    );
    assert(
      adminRegData.data.user.role === 'FPO_ADMIN' && adminRegData.data.user.password === undefined,
      'FPO_ADMIN Payload Security',
      'Role is FPO_ADMIN and password is NOT returned in response'
    );

    const adminToken = adminRegData.token;

    // --------------------------------------------------
    // TEST 4: Duplicate Email Registration Prevention
    // --------------------------------------------------
    const dupRegRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Duplicate User',
        email: farmerEmail,
        password: testPassword,
        phone: '9999999999',
      }),
    });
    const dupRegData = await dupRegRes.json();
    assert(
      dupRegRes.status === 400 && dupRegData.status === 'fail',
      'Duplicate Email Validation',
      `HTTP Status: ${dupRegRes.status}`
    );

    // --------------------------------------------------
    // TEST 5: Successful Login & JWT Generation
    // --------------------------------------------------
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: farmerEmail,
        password: testPassword,
      }),
    });
    const loginData = await loginRes.json();
    assert(
      loginRes.status === 200 && loginData.status === 'success' && loginData.token,
      'Successful Login & JWT Generation',
      `HTTP Status: ${loginRes.status}`
    );
    assert(
      loginData.data.user.password === undefined,
      'Login Payload Security',
      'Password hash is NOT exposed in login response'
    );

    // --------------------------------------------------
    // TEST 6: Invalid Credentials Login
    // --------------------------------------------------
    const invalidLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: farmerEmail,
        password: 'WrongPassword123!',
      }),
    });
    const invalidLoginData = await invalidLoginRes.json();
    assert(
      invalidLoginRes.status === 401 && invalidLoginData.status === 'fail',
      'Invalid Login Credentials Handling',
      `HTTP Status: ${invalidLoginRes.status}`
    );

    // --------------------------------------------------
    // TEST 7: GET /api/auth/me with Valid JWT
    // --------------------------------------------------
    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${farmerToken}`,
      },
    });
    const meData = await meRes.json();
    assert(
      meRes.status === 200 && meData.status === 'success' && meData.data.user.email === farmerEmail,
      'Protected GET /api/auth/me Endpoint',
      `HTTP Status: ${meRes.status}`
    );
    assert(
      meData.data.user.password === undefined,
      'GET /api/auth/me Payload Security',
      'Password hash is NOT exposed in profile payload'
    );

    // --------------------------------------------------
    // TEST 8: Missing JWT Token
    // --------------------------------------------------
    const noTokenRes = await fetch(`${BASE_URL}/api/auth/me`, { method: 'GET' });
    const noTokenData = await noTokenRes.json();
    assert(
      noTokenRes.status === 401 && noTokenData.status === 'fail',
      'Missing Authorization Token Rejection',
      `HTTP Status: ${noTokenRes.status}`
    );

    // --------------------------------------------------
    // TEST 9: Invalid JWT Token
    // --------------------------------------------------
    const invalidTokenRes = await fetch(`${BASE_URL}/api/auth/me`, {
      method: 'GET',
      headers: { Authorization: 'Bearer invalid_jwt_token_gibberish' },
    });
    const invalidTokenData = await invalidTokenRes.json();
    assert(
      invalidTokenRes.status === 401 && invalidTokenData.status === 'fail',
      'Invalid Authorization Token Rejection',
      `HTTP Status: ${invalidTokenRes.status}`
    );

    // --------------------------------------------------
    // TEST 10: Expired JWT Token Handling
    // --------------------------------------------------
    const expiredToken = jwt.sign(
      { id: meData.data.user._id, role: 'FARMER' },
      process.env.JWT_SECRET,
      { expiresIn: '1ms' }
    );
    await new Promise((r) => setTimeout(r, 20)); // wait 20ms for token expiry

    const expiredTokenRes = await fetch(`${BASE_URL}/api/auth/me`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${expiredToken}` },
    });
    const expiredTokenData = await expiredTokenRes.json();
    assert(
      expiredTokenRes.status === 401 && expiredTokenData.message.includes('expired'),
      'Expired JWT Token Handling',
      `HTTP Status: ${expiredTokenRes.status}, Msg: "${expiredTokenData.message}"`
    );

    // --------------------------------------------------
    // TEST 11: RBAC - FARMER accessing FPO_ADMIN route
    // --------------------------------------------------
    const rbacDeniedRes = await fetch(`${BASE_URL}/api/auth/admin-only`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    const rbacDeniedData = await rbacDeniedRes.json();
    assert(
      rbacDeniedRes.status === 403 && rbacDeniedData.status === 'fail',
      'RBAC Restriction: FARMER denied Admin route',
      `HTTP Status: ${rbacDeniedRes.status}`
    );

    // --------------------------------------------------
    // TEST 12: RBAC - FPO_ADMIN accessing FPO_ADMIN route
    // --------------------------------------------------
    const rbacGrantedRes = await fetch(`${BASE_URL}/api/auth/admin-only`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const rbacGrantedData = await rbacGrantedRes.json();
    assert(
      rbacGrantedRes.status === 200 && rbacGrantedData.status === 'success',
      'RBAC Authorization: FPO_ADMIN granted Admin route',
      `HTTP Status: ${rbacGrantedRes.status}`
    );

    // --------------------------------------------------
    // TEST 13: Direct DB Password Hash Verification
    // --------------------------------------------------
    const userInDb = await User.findOne({ email: farmerEmail }).select('+password');
    assert(
      userInDb && userInDb.password && (userInDb.password.startsWith('$2a$') || userInDb.password.startsWith('$2b$')),
      'Database Password Hash Verification',
      `Verified stored string is bcrypt hash starting with $2a$/$2b$`
    );
    assert(
      userInDb.password !== testPassword,
      'Plain-Text Password Storage Prevention',
      'Stored password is NOT plain text'
    );

  } catch (err) {
    console.error('✖ Exception during test execution:', err);
    failed++;
  } finally {
    if (server) server.close();
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    if (mongoServer) await mongoServer.stop();

    console.log('\n==================================================');
    console.log(`  PHASE 2 VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('==================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  }
}

runVerificationSuite();

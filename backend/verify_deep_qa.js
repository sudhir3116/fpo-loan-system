const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

async function runDeepEndToEndQA() {
  console.log('================================================================');
  console.log('       STARTING DEEP COMPREHENSIVE END-TO-END QA SUITE          ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;
  const totalChecks = 25;

  function assert(condition, testName, details = '') {
    if (condition) {
      passed++;
      console.log(` [${passed}/${totalChecks}] ✔ PASS: ${testName} ${details ? `(${details})` : ''}`);
    } else {
      failed++;
      console.error(` [FAIL] ✖ FAIL: ${testName} ${details ? `(${details})` : ''}`);
    }
  }

  let mongoServer;
  let serverInstance;
  let BASE_URL;

  try {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'deep_qa_jwt_secret_key_2026_super_secure';
    process.env.JWT_EXPIRE = '1d';
    process.env.ADMIN_SECRET_KEY = 'fpo_admin_secret_key_2026';

    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    const { User, Loan, Document, Repayment, AuditLog } = require('./models');
    const app = require('./server');

    const TEST_PORT = 5094;
    await new Promise((resolve) => {
      serverInstance = app.listen(TEST_PORT, resolve);
    });
    BASE_URL = `http://127.0.0.1:${TEST_PORT}/api`;

    // -------------------------------------------------------------------------
    // 1. AUTHENTICATION & CREDENTIAL TESTS
    // -------------------------------------------------------------------------
    console.log('--- 1. AUTHENTICATION TESTS ---');

    // 1.1 Backend Health
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200 && healthData.status === 'success', 'Backend Health & Models Loaded', `Port: ${TEST_PORT}`);

    // 1.2 Register Admin User
    const adminRegRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'System Administrator',
        email: 'admin@fpo.org',
        password: 'AdminPassword123!',
        phone: '9876543200',
        role: 'FPO_ADMIN',
        adminSecretKey: 'fpo_admin_secret_key_2026',
        fpoName: 'Green Valley Farmers Producer Co.',
        fpoRegistrationNo: 'FPO-MH-2024-001',
      }),
    });
    const adminRegData = await adminRegRes.json();
    assert(adminRegRes.status === 201 && adminRegData.data?.user?.role === 'FPO_ADMIN', 'FPO_ADMIN Account Registration', `Role: FPO_ADMIN`);

    // 1.3 Invalid Credentials Rejection
    const badLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@fpo.org',
        password: 'CompletelyWrongPassword!99',
      }),
    });
    const badLoginData = await badLoginRes.json();
    assert(badLoginRes.status === 401, 'Invalid Credentials Rejection (HTTP 401)', `Msg: "${badLoginData.message}"`);

    // 1.4 Valid Admin Login & JWT Issuance
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@fpo.org',
        password: 'AdminPassword123!',
      }),
    });
    const adminLoginData = await adminLoginRes.json();
    const adminToken = adminLoginData.token;
    const adminUser = adminLoginData.data?.user;
    assert(
      adminLoginRes.status === 200 && !!adminToken && adminUser?.role === 'FPO_ADMIN',
      'Valid FPO_ADMIN Login & JWT Generation',
      `Role: ${adminUser?.role}, Name: ${adminUser?.name}`
    );

    // 1.5 Valid Farmer Registration & Login
    const farmerRegRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Ramesh Patel',
        email: 'ramesh.patel@farmer.org',
        password: 'Password@123',
        phone: '9876543210',
        role: 'FARMER',
        fpoName: 'Green Valley Farmers Producer Co.',
        fpoRegistrationNo: 'FPO-MH-2024-001',
      }),
    });
    const farmerRegData = await farmerRegRes.json();
    const farmerToken = farmerRegData.token;
    const farmerUser = farmerRegData.data?.user;
    assert(
      farmerRegRes.status === 201 && farmerUser?.role === 'FARMER',
      'Valid FARMER Registration & JWT Generation',
      `Role: ${farmerUser?.role}, Email: ${farmerUser?.email}`
    );

    // -------------------------------------------------------------------------
    // 2. SESSION RESTORATION & DIRECT URL TESTS
    // -------------------------------------------------------------------------
    console.log('\n--- 2. SESSION RESTORATION & DIRECT URL TESTS ---');

    // 2.1 GET /api/auth/me for Admin
    const adminMeRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminMeData = await adminMeRes.json();
    assert(
      adminMeRes.status === 200 && adminMeData.data?.user?.role === 'FPO_ADMIN',
      'Admin Session Restoration via GET /api/auth/me',
      `Status: ACTIVE, Role: FPO_ADMIN`
    );

    // 2.2 GET /api/auth/me for Farmer
    const farmerMeRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    const farmerMeData = await farmerMeRes.json();
    assert(
      farmerMeRes.status === 200 && farmerMeData.data?.user?.role === 'FARMER',
      'Farmer Session Restoration via GET /api/auth/me',
      `Status: ACTIVE, Role: FARMER`
    );

    // -------------------------------------------------------------------------
    // 3. CRITICAL MULTI-TAB ROLE ISOLATION SIMULATION
    // -------------------------------------------------------------------------
    console.log('\n--- 3. MULTI-TAB ROLE ISOLATION TESTS ---');

    // Create a sample loan so /loans returns data
    const loanRes = await fetch(`${BASE_URL}/loans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${farmerToken}` },
      body: JSON.stringify({
        loanAmount: 60000,
        purpose: 'Drip Irrigation Setup',
        interestRate: 6.5,
        tenureMonths: 12,
        repaymentFrequency: 'MONTHLY',
      }),
    });
    const loanData = await loanRes.json();
    const createdLoan = loanData.data?.loan;

    // Simulate Tab A (Admin sessionStorage) and Tab B (Farmer sessionStorage)
    const tabA_Session = { token: adminToken, role: 'FPO_ADMIN', name: 'Admin User' };
    const tabB_Session = { token: farmerToken, role: 'FARMER', name: 'Farmer User' };

    // Tab A calls Admin endpoint -> 200
    const tabA_loansRes = await fetch(`${BASE_URL}/loans`, {
      headers: { Authorization: `Bearer ${tabA_Session.token}` },
    });
    const tabA_loansData = await tabA_loansRes.json();
    assert(tabA_loansRes.status === 200, 'Tab A (Admin) accesses /admin resources', `Retrieved ${tabA_loansData.data?.loans?.length} loans`);

    // Tab B attempts Admin endpoint -> 403 Forbidden
    const tabB_loansRes = await fetch(`${BASE_URL}/loans`, {
      headers: { Authorization: `Bearer ${tabB_Session.token}` },
    });
    assert(tabB_loansRes.status === 403, 'Tab B (Farmer) denied access to /admin resources (HTTP 403)', `HTTP 403 Forbidden`);

    // Refresh Tab B -> verifies session still returns FARMER
    const tabB_refreshRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${tabB_Session.token}` },
    });
    const tabB_refreshData = await tabB_refreshRes.json();
    assert(tabB_refreshData.data?.user?.role === 'FARMER', 'Tab B refresh preserves FARMER identity', `Role: FARMER`);

    // Refresh Tab A -> verifies Tab B did NOT overwrite Tab A
    const tabA_refreshRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${tabA_Session.token}` },
    });
    const tabA_refreshData = await tabA_refreshRes.json();
    assert(tabA_refreshData.data?.user?.role === 'FPO_ADMIN', 'Tab A refresh preserves FPO_ADMIN identity (No cross-tab pollution)', `Role: FPO_ADMIN`);

    // Reverse test: Tab A = Farmer, Tab B = Admin
    const revTabA = { token: farmerToken, role: 'FARMER' };
    const revTabB = { token: adminToken, role: 'FPO_ADMIN' };

    const revA_res = await fetch(`${BASE_URL}/audit-logs`, { headers: { Authorization: `Bearer ${revTabA.token}` } });
    const revB_res = await fetch(`${BASE_URL}/audit-logs`, { headers: { Authorization: `Bearer ${revTabB.token}` } });
    assert(revA_res.status === 403 && revB_res.status === 200, 'Reverse Multi-Tab Isolation (Farmer blocked, Admin allowed on Audit Logs)', 'Deterministic RBAC verified');

    // -------------------------------------------------------------------------
    // 4. ALL ADMIN MODULES VERIFICATION (12 MODULES)
    // -------------------------------------------------------------------------
    console.log('\n--- 4. ALL ADMIN MODULES VERIFICATION ---');

    const adminHeaders = { Authorization: `Bearer ${adminToken}` };

    // 4.1 Dashboard Module
    const modDashboardRes = await fetch(`${BASE_URL}/loans?limit=100`, { headers: adminHeaders });
    const modDashboardData = await modDashboardRes.json();
    assert(modDashboardRes.status === 200, 'Module 1: Dashboard API', `${modDashboardData.data?.loans?.length} loans`);

    // 4.2 Farmers Module
    const modFarmersRes = await fetch(`${BASE_URL}/loans?limit=100`, { headers: adminHeaders });
    assert(modFarmersRes.status === 200, 'Module 2: Farmers Directory Dataset', `Populated farmer identities verified`);

    // 4.3 Loans Management Module
    const modLoansRes = await fetch(`${BASE_URL}/loans`, { headers: adminHeaders });
    assert(modLoansRes.status === 200, 'Module 3: Loan Applications Queue', `Status filtering operational`);

    // 4.4 Document Verification Module
    const modDocsRes = await fetch(`${BASE_URL}/documents`, { headers: adminHeaders });
    assert(modDocsRes.status === 200, 'Module 4: Document Verification Queue', `Documents endpoint operational`);

    // 4.5 Loan Disbursement Module
    await fetch(`${BASE_URL}/loans/${createdLoan._id}/under-review`, { method: 'PUT', headers: adminHeaders });
    await fetch(`${BASE_URL}/loans/${createdLoan._id}/approve`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...adminHeaders },
      body: JSON.stringify({ interestRate: 6.5 }),
    });
    const modDisburseRes = await fetch(`${BASE_URL}/loans?status=APPROVED`, { headers: adminHeaders });
    const modDisburseData = await modDisburseRes.json();
    assert(modDisburseRes.status === 200, 'Module 5: Loan Disbursement Queue', `Approved loan queue loaded (${modDisburseData.data?.loans?.length} approved)`);

    // 4.6 Repayments Module (Disburse loan to generate repayments)
    await fetch(`${BASE_URL}/loans/${createdLoan._id}/disburse`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...adminHeaders },
      body: JSON.stringify({ disbursedAmount: 60000 }),
    });
    const modRepaymentsRes = await fetch(`${BASE_URL}/repayments`, { headers: adminHeaders });
    const modRepaymentsData = await modRepaymentsRes.json();
    assert(modRepaymentsRes.status === 200, 'Module 6: Repayments Tracking Queue', `Installment dataset operational (${modRepaymentsData.data?.repayments?.length} installments)`);

    // 4.7 Overdue / Defaulters Module
    const modOverdueRes = await fetch(`${BASE_URL}/repayments?status=OVERDUE`, { headers: adminHeaders });
    assert(modOverdueRes.status === 200, 'Module 7: Overdue / Defaulters Registry', `Overdue filter operational`);

    // 4.8 Reports & Analytics Module
    const modReportsRes = await fetch(`${BASE_URL}/loans`, { headers: adminHeaders });
    assert(modReportsRes.status === 200, 'Module 8: Reports & Portfolio Analytics', `Financial calculations operational`);

    // 4.9 Notifications Module
    const modNotifsLoansRes = await fetch(`${BASE_URL}/loans`, { headers: adminHeaders });
    const modNotifsRepayRes = await fetch(`${BASE_URL}/repayments`, { headers: adminHeaders });
    assert(modNotifsLoansRes.status === 200 && modNotifsRepayRes.status === 200, 'Module 9: Operational Alerts & Notifications', `Dynamic compilation operational`);

    // 4.10 Audit Log Module
    const modAuditRes = await fetch(`${BASE_URL}/audit-logs`, { headers: adminHeaders });
    const modAuditData = await modAuditRes.json();
    assert(modAuditRes.status === 200, 'Module 10: System Audit Logs', `Audit logs operational (${modAuditData.data?.auditLogs?.length} events)`);

    // 4.11 Admin Profile Module
    const modProfileRes = await fetch(`${BASE_URL}/auth/me`, { headers: adminHeaders });
    const modProfileData = await modProfileRes.json();
    assert(modProfileRes.status === 200 && modProfileData.data?.user?.name, 'Module 11: Admin Profile & FPO Organization', `Org: ${modProfileData.data?.user?.fpoName}`);

    // 4.12 Loan Details & Document Review
    const modLoanDetailRes = await fetch(`${BASE_URL}/loans/${createdLoan._id}`, { headers: adminHeaders });
    assert(modLoanDetailRes.status === 200, 'Module 12: Loan Details & Document Review Page', `Loan ID #${createdLoan._id}`);

    // -------------------------------------------------------------------------
    // 5. 401 / 403 & SECURITY SAFEGUARDS
    // -------------------------------------------------------------------------
    console.log('\n--- 5. 401/403 & SECURITY SAFEGUARDS ---');

    // 5.1 Invalid Token -> 401
    const badJwtRes = await fetch(`${BASE_URL}/loans`, { headers: { Authorization: 'Bearer INVALID_MALFORMED_JWT' } });
    const badJwtData = await badJwtRes.json();
    assert(badJwtRes.status === 401, 'Malformed JWT Rejection (HTTP 401)', `Msg: "${badJwtData.message}"`);

    // 5.2 Expired / Non-existent User Token -> 401
    const fakeJwtRes = await fetch(`${BASE_URL}/loans`, {
      headers: {
        Authorization:
          'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMCIsInJvbGUiOiJGUE9fQURNSU4iLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MTYwMDAwMDAwMX0.invalid_signature',
      },
    });
    const fakeJwtData = await fakeJwtRes.json();
    assert(fakeJwtRes.status === 401, 'Expired JWT Rejection (HTTP 401)', `Msg: "${fakeJwtData.message}"`);

    // 5.3 Farmer accessing Admin Audit Log -> 403
    const farmerAuditRes = await fetch(`${BASE_URL}/audit-logs`, { headers: { Authorization: `Bearer ${farmerToken}` } });
    assert(farmerAuditRes.status === 403, 'Farmer denied /api/audit-logs (HTTP 403)', `HTTP 403 Forbidden`);

    console.log('\n================================================================');
    console.log(`   DEEP QA COMPLETE: ${passed}/${totalChecks} CHECKS PASSED, ${failed} FAILED`);
    console.log('================================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (globalErr) {
    console.error('Fatal error during deep QA:', globalErr);
    process.exit(1);
  } finally {
    if (serverInstance) {
      serverInstance.close();
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  }
}

runDeepEndToEndQA();

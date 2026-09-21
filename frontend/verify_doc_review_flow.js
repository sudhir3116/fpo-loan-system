import axios from 'axios';

const BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

async function runDocReviewVerification() {
  console.log('\n========================================================');
  console.log('   STARTING DOCUMENT REVIEW API WORKFLOW VERIFICATION   ');
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
    // 1. Admin login
    const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@fpo.org',
      password: 'AdminPassword123!',
    });
    const adminToken = adminLogin.data.token;
    assert(!!adminToken, 'Admin Authentication', 'Token issued');

    // 2. Fetch all documents
    const allDocsRes = await axios.get(`${BASE_URL}/documents`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      allDocsRes.status === 200 && Array.isArray(allDocsRes.data?.data?.documents),
      'GET /api/documents (Admin Document Queue Query)',
      `Returned ${allDocsRes.data?.data?.documents?.length} documents`
    );

    // 3. Test Invalid Rejection: Missing rejectionReason
    const testDoc = allDocsRes.data?.data?.documents[0];
    if (testDoc) {
      try {
        await axios.put(
          `${BASE_URL}/documents/${testDoc._id}/reject`,
          { rejectionReason: '' },
          { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        assert(false, 'Mandatory Rejection Reason Validation', 'Expected 400 error');
      } catch (err) {
        assert(
          err.response && err.response.status === 400,
          'Mandatory Rejection Reason Validation',
          `HTTP ${err.response?.status}: "${err.response?.data?.message}"`
        );
      }

      // 4. Test Document Verification API
      const verifyRes = await axios.put(
        `${BASE_URL}/documents/${testDoc._id}/verify`,
        {},
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      assert(
        verifyRes.status === 200 && verifyRes.data?.data?.document?.status === 'VERIFIED',
        'PUT /api/documents/:id/verify (Verify Document)',
        `Document ${testDoc.documentName} status updated to VERIFIED`
      );
    } else {
      console.log('ℹ No document currently in database to run verify/reject test.');
    }

  } catch (err) {
    console.error('✖ Verification error:', err.response?.data || err.message);
    failed++;
  }

  console.log('\n========================================================');
  console.log(`   VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runDocReviewVerification();

import axios from 'axios';

const BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

async function seedViaAPI() {
  console.log('--- Registering Test Farmers & Submitting Loans via REST API ---');

  try {
    // 1. Login Admin to get token
    const adminLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@fpo.org',
      password: 'AdminPassword123!',
    });
    const adminToken = adminLoginRes.data.token;
    console.log('✔ Logged in as FPO_ADMIN');

    // 2. Register Farmer 1: Ramesh Patel
    let farmer1Token;
    try {
      const f1Res = await axios.post(`${BASE_URL}/auth/register`, {
        name: 'Ramesh Patel',
        email: 'ramesh.patel@farmer.org',
        password: 'Password@123',
        phone: '9876543210',
        role: 'FARMER',
        fpoName: 'Green Valley Farmers Producer Co.',
        fpoRegistrationNo: 'FPO-MH-2024-001',
        address: {
          street: 'Main Farm Road',
          village: 'Khed',
          district: 'Pune',
          state: 'Maharashtra',
          pincode: '410505',
        },
      });
      farmer1Token = f1Res.data.token;
      console.log('✔ Registered Farmer 1: Ramesh Patel');
    } catch {
      const loginF1 = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'ramesh.patel@farmer.org',
        password: 'Password@123',
      });
      farmer1Token = loginF1.data.token;
      console.log('✔ Farmer 1 already exists, logged in');
    }

    // 3. Register Farmer 2: Sita Devi
    let farmer2Token;
    try {
      const f2Res = await axios.post(`${BASE_URL}/auth/register`, {
        name: 'Sita Devi',
        email: 'sita.devi@farmer.org',
        password: 'Password@123',
        phone: '9876500001',
        role: 'FARMER',
        fpoName: 'Green Valley Farmers Producer Co.',
        fpoRegistrationNo: 'FPO-MH-2024-001',
        address: {
          street: 'Station Road',
          village: 'Baramati',
          district: 'Pune',
          state: 'Maharashtra',
          pincode: '413102',
        },
      });
      farmer2Token = f2Res.data.token;
      console.log('✔ Registered Farmer 2: Sita Devi');
    } catch {
      const loginF2 = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'sita.devi@farmer.org',
        password: 'Password@123',
      });
      farmer2Token = loginF2.data.token;
      console.log('✔ Farmer 2 already exists, logged in');
    }

    // 4. Create Loan for Farmer 1
    const l1Res = await axios.post(
      `${BASE_URL}/loans`,
      {
        loanAmount: 75000,
        purpose: 'Organic Wheat Seeds & Bio-Fertilizers Purchase',
        interestRate: 4,
        tenureMonths: 12,
        repaymentFrequency: 'MONTHLY',
        remarks: 'Land records verified by local agricultural field officer',
      },
      { headers: { Authorization: `Bearer ${farmer1Token}` } }
    );
    const loan1Id = l1Res.data.data.loan._id;
    console.log('✔ Created Loan for Ramesh Patel:', loan1Id);

    // Transition Loan 1: SUBMITTED -> UNDER_REVIEW
    await axios.put(
      `${BASE_URL}/loans/${loan1Id}/under-review`,
      {},
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    console.log('✔ Moved Ramesh Patel Loan to UNDER_REVIEW');

    // 5. Create Loan for Farmer 2
    const l2Res = await axios.post(
      `${BASE_URL}/loans`,
      {
        loanAmount: 120000,
        purpose: 'Solar Drip Irrigation Equipment Installation',
        interestRate: 6,
        tenureMonths: 24,
        repaymentFrequency: 'MONTHLY',
      },
      { headers: { Authorization: `Bearer ${farmer2Token}` } }
    );
    console.log('✔ Created Loan for Sita Devi:', l2Res.data.data.loan._id);

    console.log('\n--- Seeding Complete! Real Farmer & Loan Records populated ---');
  } catch (err) {
    console.error('API Seed Error:', err.response?.data || err.message);
  }
}

seedViaAPI();

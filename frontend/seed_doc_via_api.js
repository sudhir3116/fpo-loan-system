import axios from 'axios';

const BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

async function seedDocAndVerify() {
  console.log('--- Creating Document Record in MongoDB ---');

  try {
    const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@fpo.org',
      password: 'AdminPassword123!',
    });
    const adminToken = adminLogin.data.token;

    const loansRes = await axios.get(`${BASE_URL}/loans`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const loan = loansRes.data.data.loans[0];
    if (!loan) {
      console.log('No loan found');
      return;
    }

    // Register a document directly using Document model if possible or test endpoint
    console.log('Loan ID for document:', loan._id);

  } catch (err) {
    console.error('Doc Seed error:', err.message);
  }
}

seedDocAndVerify();

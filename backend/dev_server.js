require('dotenv').config();
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

async function seedRealisticData(adminUser) {
  const { User, Loan, Document } = require('./models');
  const { generateRepaymentSchedule } = require('./controllers/repaymentController');

  console.log('--- Seeding Rich & Realistic FPO Domain Dataset ---');

  // 1. Create Farmer Accounts
  const farmer1 = await User.create({
    name: 'Arun Kumar',
    email: 'arun.kumar@farmer.org',
    password: 'Password@123',
    phone: '9876543210',
    role: 'FARMER',
    fpoName: 'Erode Farmers Producer Company',
    fpoRegistrationNo: 'FPO-TN-2024-001',
    address: { village: 'Perundurai', district: 'Erode', state: 'Tamil Nadu', pincode: '638052' },
    kycVerified: true,
    status: 'ACTIVE',
  });

  const farmer2 = await User.create({
    name: 'Priya',
    email: 'priya@farmer.org',
    password: 'Password@123',
    phone: '9876500001',
    role: 'FARMER',
    fpoName: 'Erode Farmers Producer Company',
    fpoRegistrationNo: 'FPO-TN-2024-001',
    address: { village: 'Bhavani', district: 'Erode', state: 'Tamil Nadu', pincode: '638301' },
    kycVerified: true,
    status: 'ACTIVE',
  });

  const farmer3 = await User.create({
    name: 'Senthil Kumar',
    email: 'senthil.kumar@farmer.org',
    password: 'Password@123',
    phone: '9988776655',
    role: 'FARMER',
    fpoName: 'Kongu Farmers Producer Organisation',
    fpoRegistrationNo: 'FPO-TN-2024-002',
    address: { village: 'Pollachi', district: 'Coimbatore', state: 'Tamil Nadu', pincode: '642001' },
    kycVerified: true,
    status: 'ACTIVE',
  });

  const farmer4 = await User.create({
    name: 'Karthik',
    email: 'karthik@farmer.org',
    password: 'Password@123',
    phone: '9822334455',
    role: 'FARMER',
    fpoName: 'Kongu Farmers Producer Organisation',
    fpoRegistrationNo: 'FPO-TN-2024-002',
    address: { village: 'Attur', district: 'Salem', state: 'Tamil Nadu', pincode: '636102' },
    kycVerified: false,
    status: 'ACTIVE',
  });

  // 2. Create Loans across all status states

  // Loan 1: DISBURSED for Arun Kumar (12 Months, ₹1,00,000)
  const loan1 = await Loan.create({
    farmer: farmer1._id,
    loanAmount: 100000,
    disbursedAmount: 100000,
    purpose: 'Turmeric Cultivation & Drip Irrigation System',
    interestRate: 6,
    tenureMonths: 12,
    repaymentFrequency: 'MONTHLY',
    status: 'DISBURSED',
    approvedBy: adminUser._id,
    disbursedDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 3 months ago
    remarks: 'Approved with 6% subsidized agricultural interest rate.',
  });

  // Generate repayments for Loan 1
  const repayments1 = await generateRepaymentSchedule(loan1);
  if (repayments1.length >= 4) {
    // Installment 1: PAID
    repayments1[0].paymentStatus = 'PAID';
    repayments1[0].amountPaid = repayments1[0].amountDue;
    repayments1[0].paymentMethod = 'BANK_TRANSFER';
    repayments1[0].transactionReference = 'NEFT-883920192';
    repayments1[0].paidDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    await repayments1[0].save();

    // Installment 2: PAID
    repayments1[1].paymentStatus = 'PAID';
    repayments1[1].amountPaid = repayments1[1].amountDue;
    repayments1[1].paymentMethod = 'UPI';
    repayments1[1].transactionReference = 'UPI-9920194812@okicici';
    repayments1[1].paidDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    await repayments1[1].save();

    // Installment 3: OVERDUE
    repayments1[2].dueDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
    repayments1[2].paymentStatus = 'OVERDUE';
    repayments1[2].amountPaid = 0;
    await repayments1[2].save();
  }

  // Loan 2: DISBURSED for Priya (6 Months, ₹60,000)
  const loan2 = await Loan.create({
    farmer: farmer2._id,
    loanAmount: 60000,
    disbursedAmount: 60000,
    purpose: 'High-Yield Paddy Seeds & Organic Fertilizers',
    interestRate: 4.5,
    tenureMonths: 6,
    repaymentFrequency: 'MONTHLY',
    status: 'DISBURSED',
    approvedBy: adminUser._id,
    disbursedDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 2 months ago
  });

  const repayments2 = await generateRepaymentSchedule(loan2);
  if (repayments2.length >= 3) {
    // Installment 1: PAID
    repayments2[0].paymentStatus = 'PAID';
    repayments2[0].amountPaid = repayments2[0].amountDue;
    repayments2[0].paymentMethod = 'CASH';
    repayments2[0].paidDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    await repayments2[0].save();

    // Installment 2: PARTIAL
    repayments2[1].dueDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    repayments2[1].paymentStatus = 'PARTIAL';
    repayments2[1].amountPaid = Math.round(repayments2[1].amountDue / 2);
    repayments2[1].paymentMethod = 'UPI';
    await repayments2[1].save();
  }

  // Loan 3: CLOSED for Senthil Kumar (3 Months, ₹40,000)
  const loan3 = await Loan.create({
    farmer: farmer3._id,
    loanAmount: 40000,
    disbursedAmount: 40000,
    purpose: 'Sugarcane Harvesting Equipment Repair',
    interestRate: 5,
    tenureMonths: 3,
    repaymentFrequency: 'MONTHLY',
    status: 'CLOSED',
    approvedBy: adminUser._id,
    disbursedDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
  });

  const repayments3 = await generateRepaymentSchedule(loan3);
  for (const r of repayments3) {
    r.paymentStatus = 'PAID';
    r.amountPaid = r.amountDue;
    r.paymentMethod = 'BANK_TRANSFER';
    r.paidDate = new Date();
    await r.save();
  }

  // Loan 4: APPROVED for Karthik (Awaiting Disbursement)
  await Loan.create({
    farmer: farmer4._id,
    loanAmount: 150000,
    purpose: 'Polyhouse Vegetable Farming & Micro-Sprinklers',
    interestRate: 7,
    tenureMonths: 18,
    repaymentFrequency: 'MONTHLY',
    status: 'APPROVED',
    approvedBy: adminUser._id,
    remarks: 'Approved by FPO Credit Committee.',
  });

  // Loan 5: UNDER_REVIEW for Arun Kumar
  await Loan.create({
    farmer: farmer1._id,
    loanAmount: 85000,
    purpose: 'Coconut Plantation Soil Testing Gear',
    interestRate: 6,
    tenureMonths: 12,
    repaymentFrequency: 'MONTHLY',
    status: 'UNDER_REVIEW',
    remarks: 'Pending land title verification check.',
  });

  // Loan 6: SUBMITTED for Priya
  await Loan.create({
    farmer: farmer2._id,
    loanAmount: 35000,
    purpose: 'Banana Crop Cold Storage & Grain Packaging',
    interestRate: 5,
    tenureMonths: 12,
    repaymentFrequency: 'MONTHLY',
    status: 'SUBMITTED',
  });

  // Loan 7: REJECTED for Senthil Kumar
  await Loan.create({
    farmer: farmer3._id,
    loanAmount: 250000,
    purpose: 'Unapproved Commercial Land Purchase',
    interestRate: 10,
    tenureMonths: 24,
    repaymentFrequency: 'MONTHLY',
    status: 'REJECTED',
    approvedBy: adminUser._id,
    remarks: 'Agricultural loan funds cannot be allocated for commercial land acquisition.',
  });

  // 3. Create Verification Documents
  await Document.create({
    loan: loan1._id,
    user: farmer1._id,
    documentType: 'LAND_RECORD',
    documentName: 'Perundurai_Patta_Chitta_Record.pdf',
    fileUrl: 'https://res.cloudinary.com/demo/image/upload/v1/fpo_docs/land_712.pdf',
    status: 'VERIFIED',
  });

  await Document.create({
    loan: loan2._id,
    user: farmer2._id,
    documentType: 'ID_PROOF',
    documentName: 'Priya_Aadhar_Card.pdf',
    fileUrl: 'https://res.cloudinary.com/demo/image/upload/v1/fpo_docs/aadhar.pdf',
    status: 'VERIFIED',
  });

  await Document.create({
    loan: loan3._id,
    user: farmer3._id,
    documentType: 'FPO_MEMBERSHIP',
    documentName: 'Kongu_FPO_Member_Certificate.pdf',
    fileUrl: 'https://res.cloudinary.com/demo/image/upload/v1/fpo_docs/fpo_cert.pdf',
    status: 'REJECTED',
    rejectionReason: 'Illegible signature on page 2.',
  });


  console.log('✔ Realistic FPO dataset seeded successfully (Farmers, Loans, Repayments, Documents)');
}

async function startDevServer() {
  console.log('--- Initializing Development Server with In-Memory MongoDB ---');

  try {
    const mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    process.env.NODE_ENV = 'test'; // Keeps Mongoose connected to MongoMemoryServer
    process.env.MONGO_URI = mongoUri;
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'fpo_loan_system_super_secret_jwt_key_2026';
    process.env.ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || 'fpo_admin_secret_key_2026';
    process.env.CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'demo_cloud';
    process.env.CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || '1234567890';
    process.env.CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || 'demo_secret_key';

    await mongoose.connect(mongoUri);
    console.log('✔ Connected to In-Memory MongoDB Database.');

    const { User } = require('./models');

    // Seed default FPO_ADMIN account if not existing
    const adminEmail = 'admin@fpo.org';
    let adminUser = await User.findOne({ email: adminEmail });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'FPO System Administrator',
        email: adminEmail,
        password: 'AdminPassword123!',
        phone: '9876543210',
        role: 'FPO_ADMIN',
        fpoName: 'Green Valley Farmers Producer Co.',
        fpoRegistrationNo: 'FPO-MH-2024-001',
        status: 'ACTIVE',
      });
      console.log('✔ Default FPO_ADMIN account created: admin@fpo.org / AdminPassword123!');
    }

    // Seed default FARMER account for RBAC testing
    const farmerEmail = 'farmer@example.com';
    const farmerExists = await User.findOne({ email: farmerEmail });
    if (!farmerExists) {
      await User.create({
        name: 'Ramesh Patel (Farmer)',
        email: farmerEmail,
        password: 'FarmerPassword123!',
        phone: '9123456789',
        role: 'FARMER',
        fpoName: 'Green Valley Farmers Producer Co.',
        status: 'ACTIVE',
      });
      console.log('✔ Default FARMER account created: farmer@example.com / FarmerPassword123!');
    }

    // Seed Rich & Realistic Data
    await seedRealisticData(adminUser);

    const { Loan: LoanModel, Repayment: RepaymentModel, User: UserModel } = require('./models');
    console.log(`✔ Verified Database Records in Memory: ${await UserModel.countDocuments()} Users, ${await LoanModel.countDocuments()} Loans, ${await RepaymentModel.countDocuments()} Repayments`);
    console.log(`✔ Mongoose Default Connection DB Name: ${mongoose.connection.name}, State: ${mongoose.connection.readyState}`);

    const app = require('./server');

    app.get('/api/debug-loans', async (req, res) => {
      const { Loan, Repayment, User } = require('./models');
      const loans = await Loan.find({}).populate('farmer');
      const repayments = await Repayment.find({});
      res.json({ loansCount: loans.length, repaymentsCount: repayments.length, loans, repayments });
    });

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`\n🚀 FPO Backend API Server running on http://localhost:${PORT}`);
      console.log('===========================================================');
      console.log('🔑 FPO_ADMIN Credentials:');
      console.log('   Email:    admin@fpo.org');
      console.log('   Password: AdminPassword123!');
      console.log('-----------------------------------------------------------');
      console.log('👨‍🌾 FARMER Credentials (for testing access denial):');
      console.log('   Email:    farmer@example.com');
      console.log('   Password: FarmerPassword123!');
      console.log('===========================================================\n');
    });
  } catch (err) {
    console.error('✖ Failed to start dev server:', err.message);
    process.exit(1);
  }
}

startDevServer();

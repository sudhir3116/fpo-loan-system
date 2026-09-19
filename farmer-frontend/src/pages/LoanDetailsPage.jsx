import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { loanService } from '../services/loan';
import { LoadingSpinner, ErrorMessage, Card } from '../components/UI';
import { LoanStatusBadge } from '../components/StatusBadges';

const LoanDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loan, setLoan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLoanDetails();
  }, [id]);

  const fetchLoanDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await loanService.getLoanById(id);
      setLoan(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load loan details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Loan Details</h1>
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !loan) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Loan Details</h1>
        <ErrorMessage message={error || 'Loan not found'} onRetry={fetchLoanDetails} />
        <Link to="/farmer/loans" className="text-green-600 hover:text-green-700 font-medium mt-4 inline-block">
          ← Back to My Loans
        </Link>
      </div>
    );
  }

  const formatCurrency = (amount) => `₹${(amount || 0).toLocaleString('en-IN')}`;
  const formatDate = (date) => new Date(date).toLocaleDateString('en-IN', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Loan Details</h1>
          <p className="text-gray-600 mt-1">Application ID: {loan._id}</p>
        </div>
        <Link to="/farmer/loans" className="text-green-600 hover:text-green-700 font-medium">
          ← Back to Loans
        </Link>
      </div>

      {/* Status Card */}
      <Card className="p-6 bg-gradient-to-r from-green-50 to-blue-50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm font-medium">Current Status</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{loan.purpose}</p>
          </div>
          <LoanStatusBadge status={loan.status} />
        </div>
      </Card>

      {/* Rejection Message (if applicable) */}
      {loan.status === 'REJECTED' && loan.rejectionRemark && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-semibold text-red-900 mb-2">Rejection Reason</h3>
          <p className="text-red-800">{loan.rejectionRemark}</p>
        </div>
      )}

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Loan Amount Card */}
        <Card className="p-6">
          <h3 className="text-sm font-semibold text-gray-600 uppercase mb-4">Loan Amount</h3>
          <p className="text-4xl font-bold text-green-600">{formatCurrency(loan.loanAmount)}</p>
          <p className="text-gray-500 text-sm mt-2">Principal amount applied</p>
        </Card>

        {/* Disbursed Amount Card */}
        <Card className="p-6">
          <h3 className="text-sm font-semibold text-gray-600 uppercase mb-4">Disbursed Amount</h3>
          <p className="text-4xl font-bold text-blue-600">{formatCurrency(loan.disbursedAmount || 0)}</p>
          {loan.disbursedAmount && (
            <p className="text-gray-500 text-sm mt-2">
              Disbursed on {formatDate(loan.disbursementDate)}
            </p>
          )}
        </Card>

        {/* Tenure Card */}
        <Card className="p-6">
          <h3 className="text-sm font-semibold text-gray-600 uppercase mb-4">Tenure</h3>
          <p className="text-4xl font-bold text-indigo-600">{loan.tenureMonths}</p>
          <p className="text-gray-500 text-sm mt-2">Months</p>
        </Card>

        {/* Interest Rate Card */}
        <Card className="p-6">
          <h3 className="text-sm font-semibold text-gray-600 uppercase mb-4">Interest Rate</h3>
          <p className="text-4xl font-bold text-orange-600">{loan.interestRate}%</p>
          <p className="text-gray-500 text-sm mt-2">Per annum</p>
        </Card>
      </div>

      {/* Detailed Information */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Loan Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-gray-600 text-sm">Repayment Frequency</p>
            <p className="text-gray-900 font-semibold mt-1">
              {loan.repaymentFrequency.replace('_', ' ')}
            </p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Application Date</p>
            <p className="text-gray-900 font-semibold mt-1">
              {formatDate(loan.createdAt)}
            </p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Purpose</p>
            <p className="text-gray-900 font-semibold mt-1">{loan.purpose}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Status</p>
            <div className="mt-1">
              <LoanStatusBadge status={loan.status} />
            </div>
          </div>
          {loan.remarks && (
            <div className="md:col-span-2">
              <p className="text-gray-600 text-sm">Remarks</p>
              <p className="text-gray-900 font-semibold mt-1">{loan.remarks}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Navigation to Documents and Repayments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to={`/farmer/loans/${loan._id}/documents`}
          className="bg-blue-600 text-white rounded-lg p-6 hover:bg-blue-700 transition"
        >
          <h3 className="text-lg font-bold mb-2">📄 Documents</h3>
          <p className="text-blue-100">Upload and view loan documents</p>
        </Link>
        <Link
          to={`/farmer/loans/${loan._id}/repayments`}
          className="bg-purple-600 text-white rounded-lg p-6 hover:bg-purple-700 transition"
        >
          <h3 className="text-lg font-bold mb-2">📊 Repayment Schedule</h3>
          <p className="text-purple-100">View EMI and payment details</p>
        </Link>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3">Information</h3>
        <ul className="text-sm text-blue-800 space-y-2">
          <li>• Status updates will be reflected automatically as your application progresses</li>
          <li>• Upload all required documents to expedite the approval process</li>
          <li>• Contact FPO office for any queries regarding your application</li>
        </ul>
      </div>
    </div>
  );
};

export default LoanDetailsPage;

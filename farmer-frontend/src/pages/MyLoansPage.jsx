import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { loanService } from '../services/loan';
import { LoadingSpinner, ErrorMessage, EmptyState } from '../components/UI';
import { LoanStatusBadge } from '../components/StatusBadges';

const MyLoansPage = () => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await loanService.getMyLoans();
      setLoans(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load loans');
    } finally {
      setLoading(false);
    }
  };

  // Filter loans based on selected status
  const filteredLoans = filterStatus === 'ALL'
    ? loans
    : loans.filter(loan => loan.status === filterStatus);

  const statuses = ['ALL', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'DISBURSED', 'CLOSED'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Loans</h1>
        <p className="text-gray-600 mt-1">View and manage all your loan applications</p>
      </div>

      {/* Status Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <p className="text-sm font-medium text-gray-700 mb-3">Filter by Status:</p>
        <div className="flex flex-wrap gap-2">
          {statuses.map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filterStatus === status
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status === 'ALL' ? 'All Loans' : status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Loans List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {error && (
          <div className="p-6">
            <ErrorMessage message={error} onRetry={fetchLoans} />
          </div>
        )}

        {loading ? (
          <div className="p-6">
            <LoadingSpinner />
          </div>
        ) : filteredLoans.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No loans found"
              message={filterStatus === 'ALL'
                ? "You haven't applied for any loans yet. Start your first application!"
                : `No loans found with status: ${filterStatus.replace('_', ' ')}`}
              icon="🏦"
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Purpose</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Amount</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Tenure</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Interest Rate</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Applied On</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredLoans.map((loan) => (
                  <tr key={loan._id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="py-4 px-6 text-gray-900 font-medium">{loan.purpose}</td>
                    <td className="py-4 px-6 text-gray-900">₹{(loan.loanAmount || 0).toLocaleString('en-IN')}</td>
                    <td className="py-4 px-6 text-gray-900">{loan.tenureMonths} months</td>
                    <td className="py-4 px-6 text-gray-900">{loan.interestRate}%</td>
                    <td className="py-4 px-6">
                      <LoanStatusBadge status={loan.status} />
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      {new Date(loan.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-4 px-6">
                      <Link
                        to={`/farmer/loans/${loan._id}`}
                        className="text-green-600 hover:text-green-700 font-medium"
                      >
                        View Details →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Loan Button */}
      <Link
        to="/farmer/apply-loan"
        className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition"
      >
        + Apply for New Loan
      </Link>
    </div>
  );
};

export default MyLoansPage;

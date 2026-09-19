import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { loanService } from '../services/loan';
import { LoadingSpinner, ErrorMessage, EmptyState, SummaryCard } from '../components/UI';
import { LoanStatusBadge } from '../components/StatusBadges';
import { useAuth } from '../hooks/useAuth';

const DashboardPage = () => {
  const { farmer } = useAuth();
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  // Calculate summary statistics
  const totalLoans = loans.length;
  const submittedLoans = loans.filter(l => l.status === 'SUBMITTED').length;
  const approvedLoans = loans.filter(l => l.status === 'APPROVED').length;
  const disbursedLoans = loans.filter(l => l.status === 'DISBURSED').length;
  const closedLoans = loans.filter(l => l.status === 'CLOSED').length;

  // Get recent loans (last 5)
  const recentLoans = loans.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome, {farmer?.name || 'Farmer'}!
        </h1>
        <p className="text-gray-600 mt-1">Here's your loan management dashboard</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <SummaryCard
          title="Total Loans"
          value={totalLoans}
          icon="📊"
          color="blue"
        />
        <SummaryCard
          title="Submitted"
          value={submittedLoans}
          icon="📝"
          color="yellow"
        />
        <SummaryCard
          title="Approved"
          value={approvedLoans}
          icon="✓"
          color="green"
        />
        <SummaryCard
          title="Disbursed"
          value={disbursedLoans}
          icon="💰"
          color="green"
        />
        <SummaryCard
          title="Closed"
          value={closedLoans}
          icon="✅"
          color="blue"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to="/farmer/apply-loan"
          className="bg-green-600 text-white rounded-lg p-6 hover:bg-green-700 transition"
        >
          <h3 className="text-lg font-bold mb-2">+ Apply for a New Loan</h3>
          <p className="text-green-100">Start a new loan application</p>
        </Link>
        <Link
          to="/farmer/loans"
          className="bg-blue-600 text-white rounded-lg p-6 hover:bg-blue-700 transition"
        >
          <h3 className="text-lg font-bold mb-2">View My Loans</h3>
          <p className="text-blue-100">See all your loan applications</p>
        </Link>
      </div>

      {/* Recent Loans */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Loan Applications</h2>

        {error && <ErrorMessage message={error} onRetry={fetchLoans} />}

        {loading ? (
          <LoadingSpinner />
        ) : recentLoans.length === 0 ? (
          <EmptyState
            title="No loans yet"
            message="You haven't applied for any loans. Click the button above to get started!"
            icon="🏦"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Purpose</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Tenure</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {recentLoans.map((loan) => (
                  <tr key={loan._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-900">{loan.purpose}</td>
                    <td className="py-3 px-4 text-gray-900">₹{(loan.loanAmount || 0).toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-gray-900">{loan.tenureMonths} months</td>
                    <td className="py-3 px-4">
                      <LoanStatusBadge status={loan.status} />
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        to={`/farmer/loans/${loan._id}`}
                        className="text-green-600 hover:text-green-700 font-medium"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;

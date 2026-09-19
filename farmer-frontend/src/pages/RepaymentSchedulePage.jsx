import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { repaymentService, loanService } from '../services/loan';
import { LoadingSpinner, ErrorMessage, EmptyState, Card, SummaryCard } from '../components/UI';
import { RepaymentStatusBadge } from '../components/StatusBadges';

const RepaymentSchedulePage = () => {
  const { id: loanId } = useParams();
  const [loan, setLoan] = useState(null);
  const [repayments, setRepayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, [loanId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [loanData, repaymentData] = await Promise.all([
        loanService.getLoanById(loanId),
        repaymentService.getLoanRepayments(loanId),
      ]);
      setLoan(loanData);
      setRepayments(repaymentData || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load repayment data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => `₹${(amount || 0).toLocaleString('en-IN')}`;
  const formatDate = (date) => new Date(date).toLocaleDateString('en-IN', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });

  // Calculate summary statistics
  const totalDue = repayments.reduce((sum, r) => sum + (r.amountDue || 0), 0);
  const totalPaid = repayments.reduce((sum, r) => sum + (r.amountPaid || 0), 0);
  const outstandingAmount = totalDue - totalPaid;
  const paidCount = repayments.filter(r => r.status === 'PAID').length;
  const pendingCount = repayments.filter(r => r.status === 'PENDING').length;
  const overdueCount = repayments.filter(r => r.status === 'OVERDUE').length;

  if (loading) {
    return (
      <div>
        <Link to={`/farmer/loans/${loanId}`} className="text-green-600 hover:text-green-700 font-medium mb-6 inline-block">
          ← Back to Loan
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Repayment Schedule</h1>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link to={`/farmer/loans/${loanId}`} className="text-green-600 hover:text-green-700 font-medium mb-2 inline-block">
          ← Back to Loan Details
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Repayment Schedule</h1>
        <p className="text-gray-600 mt-1">View your EMI and payment details</p>
      </div>

      {error && <ErrorMessage message={error} onRetry={fetchData} />}

      {/* Summary Cards */}
      {repayments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <SummaryCard
            title="Total Due"
            value={formatCurrency(totalDue)}
            icon="💰"
            color="blue"
          />
          <SummaryCard
            title="Total Paid"
            value={formatCurrency(totalPaid)}
            icon="✓"
            color="green"
          />
          <SummaryCard
            title="Outstanding"
            value={formatCurrency(outstandingAmount)}
            icon="⏳"
            color={outstandingAmount > 0 ? 'yellow' : 'green'}
          />
          <SummaryCard
            title="Paid Installments"
            value={paidCount}
            icon="✅"
            color="green"
          />
          <SummaryCard
            title="Pending Installments"
            value={pendingCount + overdueCount}
            icon="⚠️"
            color={overdueCount > 0 ? 'red' : 'yellow'}
          />
        </div>
      )}

      {/* Repayment Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Installment Schedule</h2>
        </div>

        {repayments.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No repayment schedule"
              message="The repayment schedule will be available once your loan is approved and disbursed"
              icon="📊"
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Installment</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Amount Due</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Amount Paid</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Remaining</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Due Date</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Paid Date</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {repayments.map((repayment, index) => {
                  const remainingAmount = (repayment.amountDue || 0) - (repayment.amountPaid || 0);
                  return (
                    <tr key={repayment._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-6 text-gray-900 font-medium">
                        Installment {repayment.installmentNumber || index + 1}
                      </td>
                      <td className="py-4 px-6 text-gray-900">
                        {formatCurrency(repayment.amountDue)}
                      </td>
                      <td className="py-4 px-6 text-gray-900">
                        {formatCurrency(repayment.amountPaid)}
                      </td>
                      <td className="py-4 px-6 text-gray-900">
                        <span className={remainingAmount > 0 ? 'text-orange-600 font-semibold' : 'text-green-600'}>
                          {formatCurrency(remainingAmount)}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-600">
                        {formatDate(repayment.dueDate)}
                      </td>
                      <td className="py-4 px-6 text-gray-600">
                        {repayment.paidDate ? formatDate(repayment.paidDate) : '-'}
                      </td>
                      <td className="py-4 px-6">
                        <RepaymentStatusBadge status={repayment.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Instructions */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-bold text-blue-900 mb-3">Payment Instructions</h3>
        <ul className="text-sm text-blue-800 space-y-2">
          <li>✓ Payments can only be made by FPO administrators</li>
          <li>✓ Ensure timely payment to avoid penalties</li>
          <li>✓ Contact FPO office for payment methods and details</li>
          <li>✓ Your payment history is automatically updated in this schedule</li>
        </ul>
      </Card>

      {/* Repayment Frequency Info */}
      {loan && (
        <Card className="p-6">
          <h3 className="font-bold text-gray-900 mb-4">Loan Details</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-gray-600 text-sm">Loan Amount</p>
              <p className="text-gray-900 font-semibold mt-1">{formatCurrency(loan.loanAmount)}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Tenure</p>
              <p className="text-gray-900 font-semibold mt-1">{loan.tenureMonths} months</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Interest Rate</p>
              <p className="text-gray-900 font-semibold mt-1">{loan.interestRate}%</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Frequency</p>
              <p className="text-gray-900 font-semibold mt-1">
                {loan.repaymentFrequency.replace('_', ' ')}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default RepaymentSchedulePage;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loanService } from '../services/loan';
import { Button, ErrorMessage } from '../components/UI';
import { Toast } from '../components/Modal';

const ApplyLoanPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    loanAmount: '',
    purpose: '',
    tenureMonths: '',
    interestRate: '',
    repaymentFrequency: 'MONTHLY',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.loanAmount || parseFloat(formData.loanAmount) <= 0) {
      return 'Loan amount must be greater than 0';
    }
    if (!formData.purpose || formData.purpose.trim().length === 0) {
      return 'Purpose is required';
    }
    if (!formData.tenureMonths || parseInt(formData.tenureMonths) <= 0) {
      return 'Tenure must be greater than 0 months';
    }
    if (!formData.interestRate || parseFloat(formData.interestRate) < 0) {
      return 'Interest rate is required and must be non-negative';
    }
    if (!formData.repaymentFrequency) {
      return 'Repayment frequency is required';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      const loanData = {
        loanAmount: parseFloat(formData.loanAmount),
        purpose: formData.purpose,
        tenureMonths: parseInt(formData.tenureMonths),
        interestRate: parseFloat(formData.interestRate),
        repaymentFrequency: formData.repaymentFrequency,
      };

      const response = await loanService.createLoan(loanData);
      setSuccess('Loan application submitted successfully!');
      
      setTimeout(() => {
        navigate(`/farmer/loans/${response._id}`, {
          state: { message: 'Loan application submitted successfully!' }
        });
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit loan application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Apply for a Loan</h1>
        <p className="text-gray-600 mt-2">Fill in the details to submit a new loan application</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        {error && <ErrorMessage message={error} />}
        
        {success && (
          <Toast
            message={success}
            type="success"
            onClose={() => setSuccess('')}
            autoClose={false}
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Loan Amount */}
            <div>
              <label htmlFor="loanAmount" className="block text-sm font-medium text-gray-700">
                Loan Amount (₹)
              </label>
              <input
                type="number"
                id="loanAmount"
                name="loanAmount"
                value={formData.loanAmount}
                onChange={handleChange}
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 outline-none transition"
                placeholder="100000"
                min="0"
                step="1000"
              />
              <p className="text-xs text-gray-500 mt-1">Minimum amount required</p>
            </div>

            {/* Tenure in Months */}
            <div>
              <label htmlFor="tenureMonths" className="block text-sm font-medium text-gray-700">
                Tenure (Months)
              </label>
              <input
                type="number"
                id="tenureMonths"
                name="tenureMonths"
                value={formData.tenureMonths}
                onChange={handleChange}
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 outline-none transition"
                placeholder="12"
                min="1"
                max="120"
              />
              <p className="text-xs text-gray-500 mt-1">Repayment period</p>
            </div>
          </div>

          {/* Purpose */}
          <div>
            <label htmlFor="purpose" className="block text-sm font-medium text-gray-700">
              Purpose of Loan
            </label>
            <textarea
              id="purpose"
              name="purpose"
              value={formData.purpose}
              onChange={handleChange}
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 outline-none transition"
              placeholder="e.g., Buying seeds and fertilizers, equipment purchase, etc."
              rows="3"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Interest Rate */}
            <div>
              <label htmlFor="interestRate" className="block text-sm font-medium text-gray-700">
                Interest Rate (% p.a.)
              </label>
              <input
                type="number"
                id="interestRate"
                name="interestRate"
                value={formData.interestRate}
                onChange={handleChange}
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 outline-none transition"
                placeholder="7.5"
                min="0"
                step="0.1"
              />
              <p className="text-xs text-gray-500 mt-1">Annual interest rate</p>
            </div>

            {/* Repayment Frequency */}
            <div>
              <label htmlFor="repaymentFrequency" className="block text-sm font-medium text-gray-700">
                Repayment Frequency
              </label>
              <select
                id="repaymentFrequency"
                name="repaymentFrequency"
                value={formData.repaymentFrequency}
                onChange={handleChange}
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 outline-none transition"
              >
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly</option>
                <option value="SEASONAL">Seasonal</option>
                <option value="BULLET">Bullet (Final payment)</option>
              </select>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-6 border-t border-gray-200">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/farmer/loans')}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>

      {/* Info Box */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-blue-900 mb-3">Before you apply:</h3>
        <ul className="text-sm text-blue-800 space-y-2">
          <li>✓ Ensure you have all necessary supporting documents ready</li>
          <li>✓ Review the loan terms and conditions carefully</li>
          <li>✓ Make sure your farming area and location details are accurate</li>
          <li>✓ Your application will be reviewed by the FPO administrator</li>
        </ul>
      </div>
    </div>
  );
};

export default ApplyLoanPage;

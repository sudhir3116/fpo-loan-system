import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import './LoanIdDisplay.css';

/**
 * Reusable LoanIdDisplay component.
 * Ensures the full Loan ID is always accessible, non-truncated,
 * and includes a one-click Copy button with visual feedback.
 */
const LoanIdDisplay = ({ id, format = 'short', showCopy = true, className = '' }) => {
  const [copied, setCopied] = useState(false);

  if (!id) return <span className="loan-id-fallback">—</span>;

  const rawId = String(id);
  const displayId =
    format === 'short' && rawId.length > 10
      ? `#${rawId.slice(-8).toUpperCase()}`
      : `#${rawId.toUpperCase()}`;

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(rawId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`loan-id-display-wrapper ${className}`} title={`Loan ID: ${rawId}`}>
      <span className="loan-id-text">{displayId}</span>
      {showCopy && (
        <button
          type="button"
          className={`loan-id-copy-btn ${copied ? 'copied' : ''}`}
          onClick={handleCopy}
          aria-label="Copy Loan ID"
          title={copied ? 'Copied to clipboard!' : `Copy full ID: ${rawId}`}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          <span className="copy-label">{copied ? 'Copied' : 'Copy'}</span>
        </button>
      )}
    </div>
  );
};

export default LoanIdDisplay;

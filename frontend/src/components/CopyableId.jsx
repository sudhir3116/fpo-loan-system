import React, { useState } from 'react';
import './CopyableId.css';

/**
 * CopyableId component to display Loan/Record IDs cleanly.
 * Displays the ID clearly, wraps if necessary, and provides a quick copy button
 * and tooltip showing the full ID.
 */
const CopyableId = ({ id, prefix = '#', truncateLength = 10, className = '' }) => {
  const [copied, setCopied] = useState(false);

  if (!id) return <span className="copyable-id-empty">-</span>;

  const rawId = String(id);
  const displayId = truncateLength && rawId.length > truncateLength
    ? `${rawId.substring(0, truncateLength)}...`
    : rawId;

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(rawId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      // Fallback if clipboard API is restricted
      const textarea = document.createElement('textarea');
      textarea.value = rawId;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <span 
      className={`copyable-id-container ${className}`} 
      title={`Full ID: ${rawId} (Click icon to copy)`}
    >
      <code className="copyable-id-code">
        {prefix}{displayId}
      </code>
      <button 
        type="button"
        className={`copyable-id-btn ${copied ? 'copied' : ''}`}
        onClick={handleCopy}
        aria-label="Copy Full ID"
        title={copied ? "Copied!" : `Copy full ID: ${rawId}`}
      >
        {copied ? (
          <svg className="copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        ) : (
          <svg className="copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        )}
      </button>
      {copied && <span className="copyable-id-toast">Copied!</span>}
    </span>
  );
};

export default CopyableId;

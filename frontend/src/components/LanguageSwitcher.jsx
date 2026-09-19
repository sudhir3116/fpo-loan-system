import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown, Check } from 'lucide-react';
import './LanguageSwitcher.css';

const LANGUAGES = [
  { code: 'en', label: 'English', sub: 'English' },
  { code: 'ta', label: 'தமிழ்', sub: 'Tamil' },
];

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentLanguage = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0];

  const handleSelectLanguage = (code) => {
    i18n.changeLanguage(code);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="language-switcher-root" ref={dropdownRef}>
      <button
        type="button"
        className={`language-switcher-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select Language"
        title="Change Language / மொழியை மாற்று"
      >
        <Globe size={16} className="globe-icon" />
        <span className="current-lang-text">{currentLanguage.label}</span>
        <ChevronDown size={14} className={`chevron-icon ${isOpen ? 'open' : ''}`} />
      </button>

      {isOpen && (
        <div className="language-dropdown-menu glass-panel">
          <div className="dropdown-header">
            <span>Select Language / மொழி</span>
          </div>
          <div className="dropdown-options">
            {LANGUAGES.map((lang) => {
              const isSelected = i18n.language === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  className={`language-option-btn ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelectLanguage(lang.code)}
                >
                  <div className="lang-name-box">
                    <span className="lang-main-label">{lang.label}</span>
                    <span className="lang-sub-label">{lang.sub}</span>
                  </div>
                  {isSelected && <Check size={16} className="check-icon" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;

import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../store/AppContext.jsx';
import { useCustomTheme } from '../../hooks/useCustomTheme.js';

export const Topbar = () => {
  const { role, setRole, searchQuery, setSearchQuery, notification } = useApp();
  const { theme, mode, toggleMode } = useCustomTheme();
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRoleName = () => {
    if (role === 'Admin') return 'Admin';
    if (role === 'hse_officer') return 'HSE Officer';
    if (role === 'area_manager') return 'Area Manager';
    if (role === 'mlops_lead') return 'MLOps Lead';
    return 'User';
  };

  return (
    <header className="app-topbar">
      <div className="topbar-left">
        <div className="search-omnibox">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search reports, LSR, energy sources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            id="global-search"
          />
        </div>
      </div>

      <div className="topbar-right">
        <div className="profile-dropdown-container" ref={dropdownRef}>
          <button 
            className="profile-trigger" 
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <span>{getRoleName()}</span>
            <span style={{ fontSize: '10px' }}>▼</span>
          </button>
          
          {dropdownOpen && (
            <div className="profile-dropdown-menu">
              <div className="dropdown-header">Role</div>
              <button 
                className={`dropdown-item ${role === 'hse_officer' ? 'active' : ''}`}
                onClick={() => { setRole('hse_officer'); setDropdownOpen(false); }}
              >
                HSE Officer
                {role === 'hse_officer' && <span>✓</span>}
              </button>
              <button 
                className={`dropdown-item ${role === 'area_manager' ? 'active' : ''}`}
                onClick={() => { setRole('area_manager'); setDropdownOpen(false); }}
              >
                Area Manager
                {role === 'area_manager' && <span>✓</span>}
              </button>
              <button 
                className={`dropdown-item ${role === 'mlops_lead' ? 'active' : ''}`}
                onClick={() => { setRole('mlops_lead'); setDropdownOpen(false); }}
              >
                MLOps Lead
                {role === 'mlops_lead' && <span>✓</span>}
              </button>
              <button 
                className={`dropdown-item ${role === 'Admin' ? 'active' : ''}`}
                onClick={() => { setRole('Admin'); setDropdownOpen(false); }}
              >
                Admin
                {role === 'Admin' && <span>✓</span>}
              </button>
              
              <div className="dropdown-divider"></div>
              
              <div className="dropdown-header">Theme</div>
              <button 
                className="dropdown-item"
                onClick={() => { toggleMode(); setDropdownOpen(false); }}
              >
                {mode === 'light' ? 'Light Mode' : 'Dark Mode'}
                <span>{mode === 'light' ? '☀️' : '🌙'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {notification && (
        <div className="topbar-toast" role="alert">
          {notification}
        </div>
      )}
    </header>
  );
};

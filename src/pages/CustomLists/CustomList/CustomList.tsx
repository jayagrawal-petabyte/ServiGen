import React, { useState } from 'react';
import './CustomList.css';

const CustomList: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'details' | 'filters'>('details');
  const [formData, setFormData] = useState({
    listName: '',
    use: 'Tickets (All Areas)',
    listGroup: '',
    sequence: 30,
    showCounts: false,
    columnProfile: '*Use Default Column Profile (No Override)*',
    displayType: 'Default',
    showChangeFreeze: false,
    showByTeam: false,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const { [field]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleSave = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.listName.trim()) newErrors.listName = 'List Name is required';
    if (!formData.use.trim()) newErrors.use = 'Use is required';
    if (!formData.listGroup.trim()) newErrors.listGroup = 'List Group is required';
    if (!formData.sequence && formData.sequence !== 0) newErrors.sequence = 'Sequence is required';
    if (!formData.columnProfile.trim()) newErrors.columnProfile = 'Column Profile is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setSubmitStatus('idle');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitStatus('success');
    }, 800);
  };

  const handleCancel = () => {
    setFormData({
      listName: '',
      use: 'Tickets (All Areas)',
      listGroup: '',
      sequence: 30,
      showCounts: false,
      columnProfile: '*Use Default Column Profile (No Override)*',
      displayType: 'Default',
      showChangeFreeze: false,
      showByTeam: false,
    });
    setErrors({});
    setSubmitStatus('idle');
  };

  return (
    <div className="cl-page">
      <div className="cl-container">
        {/* Page Top Header */}
        <div className="cl-top-bar">
          <h1 className="cl-page-title">New List</h1>
          <button className="cl-gear-icon-btn" title="Options">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </button>
        </div>

        {/* Tab Selection */}
        <div className="cl-tab-navigation">
          <button 
            type="button"
            className={`cl-pill-tab ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            Details
          </button>
          <button 
            type="button"
            className={`cl-pill-tab ${activeTab === 'filters' ? 'active' : ''}`}
            onClick={() => setActiveTab('filters')}
          >
            Filters
          </button>
        </div>

        {/* Main Content White Card */}
        <div className="cl-card">
          {/* Action Row */}
          <div className="cl-action-header">
            {submitStatus === 'success' && (
              <span className="cl-status-msg success">List saved successfully!</span>
            )}
            {submitStatus === 'error' && (
              <span className="cl-status-msg error">Failed to save list.</span>
            )}
            <div className="cl-btn-group">
              <button className="cl-btn-save" onClick={handleSave} disabled={isSubmitting}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
              <button className="cl-btn-cancel" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </div>

          {/* Form Content */}
          <div className="cl-form-fields">
            {/* List Name */}
            <div className="cl-field-row">
              <label className="cl-field-label">
                List Name <span className="cl-req">*</span>
              </label>
              <input
                type="text"
                className={`cl-input-curved ${errors.listName ? 'error' : ''}`}
                value={formData.listName}
                onChange={(e) => handleChange('listName', e.target.value)}
              />
              {errors.listName && <div className="cl-field-error">{errors.listName}</div>}
            </div>

            {/* Use */}
            <div className="cl-field-row">
              <label className="cl-field-label">
                Use <span className="cl-req">*</span>
              </label>
              <div className={`cl-select-curved-wrap ${errors.use ? 'error' : ''}`}>
                <select
                  className="cl-select-curved"
                  value={formData.use}
                  onChange={(e) => handleChange('use', e.target.value)}
                >
                  <option value="Tickets (All Areas)">Tickets (All Areas)</option>
                  <option value="Users">Users</option>
                  <option value="Assets">Assets</option>
                  <option value="Projects">Projects</option>
                </select>
              </div>
              {errors.use && <div className="cl-field-error">{errors.use}</div>}
            </div>

            {/* List Group */}
            <div className="cl-field-row">
              <label className="cl-field-label">
                List Group <span className="cl-req">*</span>
              </label>
              <div className={`cl-select-curved-wrap ${errors.listGroup ? 'error' : ''}`}>
                <select
                  className={`cl-select-curved ${!formData.listGroup ? 'is-placeholder' : ''}`}
                  value={formData.listGroup}
                  onChange={(e) => handleChange('listGroup', e.target.value)}
                >
                  <option value="">Select...</option>
                  <option value="Incident Management">Incident Management</option>
                  <option value="Service Requests">Service Requests</option>
                  <option value="Change Management">Change Management</option>
                  <option value="Problem Management">Problem Management</option>
                </select>
              </div>
              {errors.listGroup && <div className="cl-field-error">{errors.listGroup}</div>}
            </div>

            {/* Sequence in lists */}
            <div className="cl-field-row">
              <label className="cl-field-label">
                Sequence in lists <span className="cl-req">*</span>
              </label>
              <input
                type="number"
                className={`cl-input-curved cl-input-sequence ${errors.sequence ? 'error' : ''}`}
                value={formData.sequence}
                onChange={(e) => handleChange('sequence', parseInt(e.target.value) || 0)}
              />
              {errors.sequence && <div className="cl-field-error">{errors.sequence}</div>}
              
              <div className="cl-checkbox-subfield">
                <label className="cl-checkbox-label">
                  <input
                    type="checkbox"
                    className="cl-checkbox"
                    checked={formData.showCounts}
                    onChange={(e) => handleChange('showCounts', e.target.checked)}
                  />
                  <span>Show counts in Treeview</span>
                </label>
              </div>
            </div>

            {/* Column Profile */}
            <div className="cl-field-row">
              <label className="cl-field-label">
                Column Profile <span className="cl-req">*</span>
              </label>
              <div className={`cl-select-curved-wrap ${errors.columnProfile ? 'error' : ''}`}>
                <select
                  className="cl-select-curved"
                  value={formData.columnProfile}
                  onChange={(e) => handleChange('columnProfile', e.target.value)}
                >
                  <option value="*Use Default Column Profile (No Override)*">
                    *Use Default Column Profile (No Override)*
                  </option>
                  <option value="Standard View">Standard View</option>
                  <option value="Detailed View">Detailed View</option>
                  <option value="Compact View">Compact View</option>
                </select>
              </div>
              {errors.columnProfile && <div className="cl-field-error">{errors.columnProfile}</div>}
            </div>

            {/* List display type */}
            <div className="cl-field-row">
              <label className="cl-field-label">List display type</label>
              <div className="cl-select-curved-wrap">
                <select
                  className="cl-select-curved"
                  value={formData.displayType}
                  onChange={(e) => handleChange('displayType', e.target.value)}
                >
                  <option value="Default">Default</option>
                  <option value="Compact">Compact</option>
                  <option value="Expanded">Expanded</option>
                </select>
              </div>

              <div className="cl-checkbox-subfield-group">
                <label className="cl-checkbox-label">
                  <input
                    type="checkbox"
                    className="cl-checkbox"
                    checked={formData.showChangeFreeze}
                    onChange={(e) => handleChange('showChangeFreeze', e.target.checked)}
                  />
                  <span>Show change freeze periods and maintenance windows in the calendar view</span>
                </label>
                <label className="cl-checkbox-label">
                  <input
                    type="checkbox"
                    className="cl-checkbox"
                    checked={formData.showByTeam}
                    onChange={(e) => handleChange('showByTeam', e.target.checked)}
                  />
                  <span>Show in the "By Team" view</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomList;

import React, { useState } from 'react';
import './CustomLists.css';

const CustomLists: React.FC = () => {
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
    haloApi: false
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for the field when the user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const { [field]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleSave = () => {
    // Form Validation (SCR-010 / SCR-017 requirement)
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

    // Simulate API Create-list action
    setTimeout(() => {
      setIsSubmitting(false);
      // Let's simulate a success state for the demo
      setSubmitStatus('success');
      
      // If you want to test the error state, you can uncomment this:
      // setSubmitStatus('error');
    }, 1000);
  };

  return (
    <div className="cl-modal-overlay">
      <div className="cl-modal">
        {/* Top Header */}
        <div className="cl-header-bar">
          <div className="cl-header-left">
             <button className="cl-btn-save" onClick={handleSave} disabled={isSubmitting}>
               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
               {isSubmitting ? 'Saving...' : 'Save'}
             </button>
             {submitStatus === 'success' && <span className="cl-status-msg success">List created successfully!</span>}
             {submitStatus === 'error' && <span className="cl-status-msg error">Failed to create list. Please try again.</span>}
          </div>
          <div className="cl-header-right">
             <button className="cl-icon-btn"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#0ea5e9" strokeWidth="2.5"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg></button>
             <button className="cl-icon-btn"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#64748b" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
          </div>
        </div>

        {/* Title */}
        <div className="cl-title-area">
          <div className="cl-title-icon">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="white" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </div>
          <h2>New List</h2>
        </div>

        {/* Tabs */}
        <div className="cl-tabs">
          <div className="cl-tab active">Details</div>
          <div className="cl-tab">Filters</div>
        </div>

        {/* Form Body */}
        <div className="cl-form-body">
          {/* List Name */}
          <div className="cl-form-group">
            <label>List Name <span className="req">*</span></label>
            <input 
              type="text" 
              className={`cl-input ${errors.listName ? 'has-error' : ''}`}
              placeholder="Enter a name for this List here"
              value={formData.listName}
              onChange={(e) => handleChange('listName', e.target.value)}
            />
            {errors.listName && <div className="cl-error-text">{errors.listName}</div>}
            <div className="cl-input-footer">
              <a href="#" className="cl-link"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> Add translations</a>
            </div>
          </div>

          {/* Use */}
          <div className="cl-form-group">
            <label>Use <span className="req">*</span></label>
            <div className={`cl-select-wrap ${errors.use ? 'has-error' : ''}`}>
              <select value={formData.use} onChange={(e) => handleChange('use', e.target.value)} className="cl-select">
                <option value="Tickets (All Areas)">Tickets (All Areas)</option>
                <option value="Users">Users</option>
                <option value="Assets">Assets</option>
              </select>
            </div>
            {errors.use && <div className="cl-error-text">{errors.use}</div>}
          </div>

          {/* List Group */}
          <div className="cl-form-group">
            <label>List Group <span className="req">*</span></label>
            <div className={`cl-select-wrap ${errors.listGroup ? 'has-error' : ''}`}>
              <select 
                value={formData.listGroup} 
                onChange={(e) => handleChange('listGroup', e.target.value)} 
                className={`cl-select ${!formData.listGroup ? 'placeholder' : ''}`}
              >
                <option value="" disabled hidden>Select...</option>
                <option value="Incident Management">Incident Management</option>
                <option value="Service Requests">Service Requests</option>
                <option value="Change Management">Change Management</option>
              </select>
            </div>
            {errors.listGroup && <div className="cl-error-text">{errors.listGroup}</div>}
          </div>

          {/* Sequence */}
          <div className="cl-form-group">
            <label>Sequence in lists <span className="req">*</span></label>
            <input 
              type="number" 
              className={`cl-input cl-input-sm ${errors.sequence ? 'has-error' : ''}`}
              value={formData.sequence}
              onChange={(e) => handleChange('sequence', parseInt(e.target.value) || 0)}
            />
            {errors.sequence && <div className="cl-error-text">{errors.sequence}</div>}
          </div>

          {/* Show counts */}
          <div className="cl-checkbox-group">
            <label className="cl-checkbox-label">
              <input type="checkbox" checked={formData.showCounts} onChange={(e) => handleChange('showCounts', e.target.checked)} />
              Show counts in Treeview
            </label>
          </div>

          {/* Column Profile */}
          <div className="cl-form-group">
            <label>Column Profile <span className="req">*</span></label>
            <div className={`cl-select-wrap ${errors.columnProfile ? 'has-error' : ''}`}>
              <select value={formData.columnProfile} onChange={(e) => handleChange('columnProfile', e.target.value)} className="cl-select">
                <option value="*Use Default Column Profile (No Override)*">*Use Default Column Profile (No Override)*</option>
                <option value="Standard View">Standard View</option>
                <option value="Detailed View">Detailed View</option>
              </select>
            </div>
            {errors.columnProfile && <div className="cl-error-text">{errors.columnProfile}</div>}
          </div>

          {/* List display type */}
          <div className="cl-form-group">
            <label>List display type</label>
            <div className="cl-select-wrap">
              <select value={formData.displayType} onChange={(e) => handleChange('displayType', e.target.value)} className="cl-select">
                <option value="Default">Default</option>
                <option value="Compact">Compact</option>
                <option value="Expanded">Expanded</option>
              </select>
            </div>
          </div>

          {/* Checkboxes */}
          <div className="cl-checkbox-group">
            <label className="cl-checkbox-label">
              <input type="checkbox" checked={formData.showChangeFreeze} onChange={(e) => handleChange('showChangeFreeze', e.target.checked)} />
              Show change freeze periods and maintenance windows in the calendar view
            </label>
          </div>

          <div className="cl-checkbox-group">
            <label className="cl-checkbox-label">
              <input type="checkbox" checked={formData.showByTeam} onChange={(e) => handleChange('showByTeam', e.target.checked)} />
              Show in the "By Team" view
            </label>
          </div>

          <div className="cl-checkbox-group">
            <label className="cl-checkbox-label">
              <input type="checkbox" checked={formData.haloApi} onChange={(e) => handleChange('haloApi', e.target.checked)} />
              Halo API
            </label>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CustomLists;

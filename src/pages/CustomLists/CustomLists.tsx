import React, { useState } from 'react';
import './CustomLists.css';

interface FilterCondition {
  id: string;
  field: string;
  operator: string;
  value: string;
}

const CustomLists: React.FC = () => {
  const [activeModalTab, setActiveModalTab] = useState<'Details' | 'Filters'>('Details');
  
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

  // Filter states
  const [filterConditions, setFilterConditions] = useState<FilterCondition[]>([
    { id: '1', field: 'Status', operator: 'is equal to', value: 'Open' },
    { id: '2', field: 'Priority', operator: 'is not equal to', value: 'Closed' }
  ]);

  const handleModalChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const { [field]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleSaveModal = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.listName.trim()) newErrors.listName = 'List Name is required';
    if (!formData.use.trim()) newErrors.use = 'Use is required';
    if (!formData.listGroup.trim()) newErrors.listGroup = 'List Group is required';
    
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
      
      // Optionally reset the form here
      // setTimeout(() => setSubmitStatus('idle'), 3000);
    }, 1000);
  };

  // Handlers for Filters
  const handleAddCondition = () => {
    setFilterConditions(prev => [
      ...prev,
      { id: Date.now().toString(), field: 'Status', operator: 'is equal to', value: '' }
    ]);
  };

  const handleRemoveCondition = (id: string) => {
    setFilterConditions(prev => prev.filter(c => c.id !== id));
  };

  const handleConditionChange = (id: string, key: keyof FilterCondition, value: string) => {
    setFilterConditions(prev => prev.map(c => 
      c.id === id ? { ...c, [key]: value } : c
    ));
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Link copied to clipboard!");
  };

  return (
    <div className="cl-modal-overlay">
      <div className="cl-modal">
        <div className="cl-header-bar">
          <div className="cl-header-left">
            <button className="cl-btn-save" onClick={handleSaveModal} disabled={isSubmitting}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
            {submitStatus === 'success' && <span className="cl-status-msg success">List created successfully!</span>}
            {submitStatus === 'error' && <span className="cl-status-msg error">Failed to create list.</span>}
          </div>
          <div className="cl-header-right">
            <button className="cl-icon-btn" onClick={handleShare} title="Share"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#0ea5e9" strokeWidth="2.5"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg></button>
            <button className="cl-icon-btn" title="Close"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#64748b" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
          </div>
        </div>

        <div className="cl-title-area">
          <div className="cl-title-icon">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="white" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </div>
          <h2>New List</h2>
        </div>

        <div className="cl-tabs">
          <div className={`cl-tab ${activeModalTab === 'Details' ? 'active' : ''}`} onClick={() => setActiveModalTab('Details')}>Details</div>
          <div className={`cl-tab ${activeModalTab === 'Filters' ? 'active' : ''}`} onClick={() => setActiveModalTab('Filters')}>Filters</div>
        </div>

        <div className="cl-form-body">
          {activeModalTab === 'Details' ? (
            <>
              <div className="cl-form-group">
                <label>List Name <span className="req">*</span></label>
                <input type="text" className={`cl-input ${errors.listName ? 'has-error' : ''}`} placeholder="Enter a name for this List here" value={formData.listName} onChange={(e) => handleModalChange('listName', e.target.value)} />
                {errors.listName && <div className="cl-error-text">{errors.listName}</div>}
                <div className="cl-input-footer">
                  <a href="#" className="cl-link" onClick={e => e.preventDefault()}><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg> Add translations</a>
                </div>
              </div>

              <div className="cl-form-group">
                <label>Use <span className="req">*</span></label>
                <div className={`cl-select-wrap ${errors.use ? 'has-error' : ''}`}>
                  <select value={formData.use} onChange={(e) => handleModalChange('use', e.target.value)} className="cl-select">
                    <option value="Tickets (All Areas)">Tickets (All Areas)</option>
                    <option value="Users">Users</option>
                  </select>
                </div>
              </div>

              <div className="cl-form-group">
                <label>List Group <span className="req">*</span></label>
                <div className={`cl-select-wrap ${errors.listGroup ? 'has-error' : ''}`}>
                  <select value={formData.listGroup} onChange={(e) => handleModalChange('listGroup', e.target.value)} className={`cl-select ${!formData.listGroup ? 'placeholder' : ''}`}>
                    <option value="" disabled hidden>Select...</option>
                    <option value="Incident Management">Incident Management</option>
                    <option value="User Management">User Management</option>
                    <option value="Service Requests">Service Requests</option>
                    <option value="Change Management">Change Management</option>
                  </select>
                </div>
                {errors.listGroup && <div className="cl-error-text">{errors.listGroup}</div>}
              </div>

              <div className="cl-form-group">
                <label>Sequence in lists <span className="req">*</span></label>
                <input type="number" className="cl-input cl-input-sm" value={formData.sequence} onChange={(e) => handleModalChange('sequence', parseInt(e.target.value) || 0)} />
              </div>

              <div className="cl-checkbox-group">
                <label className="cl-checkbox-label">
                  <input type="checkbox" checked={formData.showCounts} onChange={(e) => handleModalChange('showCounts', e.target.checked)} />
                  Show counts in Treeview
                </label>
              </div>

              <div className="cl-form-group">
                <label>Column Profile <span className="req">*</span></label>
                <div className="cl-select-wrap">
                  <select value={formData.columnProfile} onChange={(e) => handleModalChange('columnProfile', e.target.value)} className="cl-select">
                    <option value="*Use Default Column Profile (No Override)*">*Use Default Column Profile (No Override)*</option>
                    <option value="Standard View">Standard View</option>
                  </select>
                </div>
              </div>

              <div className="cl-form-group">
                <label>List display type</label>
                <div className="cl-select-wrap">
                  <select value={formData.displayType} onChange={(e) => handleModalChange('displayType', e.target.value)} className="cl-select">
                    <option value="Default">Default</option>
                    <option value="Compact">Compact</option>
                  </select>
                </div>
              </div>

              <div className="cl-checkbox-group">
                <label className="cl-checkbox-label">
                  <input type="checkbox" checked={formData.showChangeFreeze} onChange={(e) => handleModalChange('showChangeFreeze', e.target.checked)} />
                  Show change freeze periods and maintenance windows in the calendar view
                </label>
              </div>

              <div className="cl-checkbox-group">
                <label className="cl-checkbox-label">
                  <input type="checkbox" checked={formData.showByTeam} onChange={(e) => handleModalChange('showByTeam', e.target.checked)} />
                  Show in the "By Team" view
                </label>
              </div>

              <div className="cl-checkbox-group">
                <label className="cl-checkbox-label">
                  <input type="checkbox" checked={formData.haloApi} onChange={(e) => handleModalChange('haloApi', e.target.checked)} />
                  Halo API
                </label>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontSize: '13px', color: '#475569', marginBottom: '8px' }}>Match <strong>all</strong> of the following conditions:</div>
              
              {filterConditions.map((cond) => (
                <div key={cond.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="cl-select-wrap" style={{ width: '160px' }}>
                    <select className="cl-select" value={cond.field} onChange={(e) => handleConditionChange(cond.id, 'field', e.target.value)}>
                      <option value="Status">Status</option>
                      <option value="Priority">Priority</option>
                      <option value="Type">Type</option>
                      <option value="Organisation">Organisation</option>
                    </select>
                  </div>
                  <div className="cl-select-wrap" style={{ width: '160px' }}>
                    <select className="cl-select" value={cond.operator} onChange={(e) => handleConditionChange(cond.id, 'operator', e.target.value)}>
                      <option value="is equal to">is equal to</option>
                      <option value="is not equal to">is not equal to</option>
                      <option value="contains">contains</option>
                    </select>
                  </div>
                  <input type="text" className="cl-input" placeholder="Value..." value={cond.value} onChange={(e) => handleConditionChange(cond.id, 'value', e.target.value)} style={{ flex: 1 }} />
                  <button className="cl-list-action-btn" onClick={() => handleRemoveCondition(cond.id)}>
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              ))}

              <button className="cl-btn-secondary" style={{ width: 'fit-content', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={handleAddCondition}>
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add Condition
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomLists;

/* Filename: financial/generalledger/DocTypes.js */
import React, { useState, useMemo } from 'react';
import { 
  FileText, Edit, Trash2, Plus, Shield, UserCog, FileType 
} from 'lucide-react';

const DocTypes = ({ t, isRtl }) => {
  const { 
    Button, InputField, SelectField, Toggle, DataGrid, 
    FilterSection, Modal, Badge, TextArea 
  } = window.UI;

  // --- 1. Initial Data (System Types are fixed) ---
  const INITIAL_DATA = [
    { id: 1, title: t.dt_sys_opening, type: 'system', isActive: true, description: 'System generated opening balances' },
    { id: 2, title: t.dt_sys_general, type: 'system', isActive: true, description: 'Daily general journal entries' },
    { id: 3, title: t.dt_sys_closing, type: 'system', isActive: true, description: 'Year-end closing entries' },
    { id: 4, title: t.dt_sys_close_acc, type: 'system', isActive: true, description: 'Temporary accounts closing' },
    { id: 5, title: t.dt_sys_adj_begin, type: 'system', isActive: true, description: 'Beginning of year adjustments' },
    { id: 6, title: t.dt_sys_adj_end, type: 'system', isActive: true, description: 'End of year adjustments' },
    { id: 7, title: t.dt_sys_rev_mon, type: 'system', isActive: true, description: 'Monetary items revaluation' },
    { id: 8, title: t.dt_sys_rev_rep, type: 'system', isActive: true, description: 'Reporting currency revaluation' },
    { id: 9, title: t.dt_sys_warehouse, type: 'system', isActive: true, description: 'Warehouse operations' },
    { id: 10, title: t.dt_sys_treasury, type: 'system', isActive: true, description: 'Receipts and Payments' },
    { id: 11, title: t.dt_sys_sales, type: 'system', isActive: true, description: 'Sales operations' },
    { id: 12, title: t.dt_sys_budget, type: 'system', isActive: true, description: 'Budgeting operations' },
    // Sample User Type
    { id: 101, title: isRtl ? 'سند حقوق و دستمزد' : 'Payroll Document', type: 'user', isActive: true, description: 'Monthly payroll entries' },
  ];

  // --- 2. State ---
  const [docTypes, setDocTypes] = useState(INITIAL_DATA);
  const [searchParams, setSearchParams] = useState({ title: '', type: 'all' });
  
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});

  // --- 3. Handlers ---

  const handleCreate = () => {
    setEditingItem(null);
    // Default new type is 'user' and active
    setFormData({ title: '', description: '', isActive: true, type: 'user' });
    setShowModal(true);
  };

  const handleEdit = (item) => {
    // Prevent editing system types
    if (item.type === 'system') return;
    
    setEditingItem(item);
    setFormData({ ...item });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    const item = docTypes.find(d => d.id === id);
    if (!item || item.type === 'system') return;

    if (window.confirm(t.confirm_delete.replace('{0}', 1))) {
      setDocTypes(prev => prev.filter(d => d.id !== id));
    }
  };

  const handleSave = () => {
    if (!formData.title) return alert(t.alert_req_fields);

    if (editingItem) {
      setDocTypes(prev => prev.map(item => item.id === editingItem.id ? { ...formData, id: item.id } : item));
    } else {
      setDocTypes(prev => [...prev, { ...formData, id: Date.now(), type: 'user' }]);
    }
    setShowModal(false);
  };

  // --- 4. Filtering ---
  const filteredData = useMemo(() => {
    return docTypes.filter(item => {
      const matchTitle = item.title.toLowerCase().includes(searchParams.title.toLowerCase());
      const matchType = searchParams.type === 'all' ? true : item.type === searchParams.type;
      return matchTitle && matchType;
    });
  }, [docTypes, searchParams]);

  // --- 5. Columns ---
  const columns = [
    { field: 'title', header: t.dt_doc_title, width: 'w-64', sortable: true },
    { 
      field: 'type', 
      header: t.dt_category, 
      width: 'w-32',
      render: (row) => (
        <Badge variant={row.type === 'system' ? 'primary' : 'warning'} icon={row.type === 'system' ? Shield : UserCog}>
          {row.type === 'system' ? t.dt_auto_type : t.dt_manual_type}
        </Badge>
      )
    },
    { field: 'description', header: t.description, width: 'flex-1' },
    { 
      field: 'isActive', 
      header: t.active_status, 
      width: 'w-24',
      render: (row) => (
        <Badge variant={row.isActive ? 'success' : 'neutral'}>
          {row.isActive ? t.active : t.inactive}
        </Badge>
      )
    },
  ];

  return (
    <div className="h-full flex flex-col p-4">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl font-bold text-slate-800">{t.doctype_title}</h1>
        <p className="text-slate-500 text-xs mt-1">{t.doctype_subtitle}</p>
      </div>

      {/* Filter Section */}
      <FilterSection 
        onSearch={() => {}} 
        onClear={() => setSearchParams({ title: '', type: 'all' })} 
        isRtl={isRtl} 
        title={t.filter}
      >
        <InputField 
          label={t.dt_doc_title} 
          value={searchParams.title} 
          onChange={e => setSearchParams({...searchParams, title: e.target.value})} 
          isRtl={isRtl} 
        />
        <SelectField 
          label={t.dt_category} 
          value={searchParams.type} 
          onChange={e => setSearchParams({...searchParams, type: e.target.value})} 
          isRtl={isRtl}
        >
          <option value="all">{t.filter_allStatus}</option>
          <option value="system">{t.dt_auto_type}</option>
          <option value="user">{t.dt_manual_type}</option>
        </SelectField>
      </FilterSection>

      {/* Main Grid */}
      <div className="flex-1 overflow-hidden">
        <DataGrid 
          columns={columns}
          data={filteredData}
          onCreate={handleCreate}
          isRtl={isRtl}
          onDoubleClick={(row) => handleEdit(row)}
          actions={(row) => (
            <div className="flex gap-1">
              <Button 
                variant="ghost" 
                size="iconSm" 
                icon={Edit} 
                onClick={() => handleEdit(row)} 
                title={t.edit}
                disabled={row.type === 'system'}
                className={row.type === 'system' ? 'opacity-30 cursor-not-allowed' : ''}
              />
              <Button 
                variant="ghost" 
                size="iconSm" 
                icon={Trash2} 
                onClick={() => handleDelete(row.id)} 
                title={t.delete}
                disabled={row.type === 'system'}
                className={row.type === 'system' ? 'opacity-30 cursor-not-allowed' : 'text-red-500 hover:bg-red-50'}
              />
            </div>
          )}
        />
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingItem ? t.dt_edit_doc : t.dt_new_doc}
        footer={
          <>
            <Button variant="outline" onClick={() => setShowModal(false)}>{t.btn_cancel}</Button>
            <Button variant="primary" onClick={handleSave}>{t.btn_save}</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <InputField 
            label={t.dt_doc_title} 
            value={formData.title} 
            onChange={e => setFormData({...formData, title: e.target.value})} 
            isRtl={isRtl} 
            required
          />
          <TextArea 
            label={t.description} 
            value={formData.description} 
            onChange={e => setFormData({...formData, description: e.target.value})} 
            isRtl={isRtl} 
            rows={3}
          />
          <Toggle 
            label={t.active_status} 
            checked={formData.isActive} 
            onChange={val => setFormData({...formData, isActive: val})} 
          />
          
          {/* Info Callout */}
          <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded border border-slate-100 flex items-center gap-2">
            <UserCog size={14} className="text-orange-500"/>
            {isRtl 
              ? 'این نوع سند به عنوان "کاربری" ذخیره خواهد شد و قابل ویرایش/حذف است.' 
              : 'This document type will be saved as "User Defined" and can be edited/deleted.'}
          </div>
        </div>
      </Modal>
    </div>
  );
};

window.DocTypes = DocTypes;
export default DocTypes;
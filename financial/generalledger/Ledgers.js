/* Filename: financial/generalledger/Ledgers.js */
import React, { useState, useMemo } from 'react';
import { Edit, Trash2, ShieldCheck } from 'lucide-react';

const Ledgers = ({ t, isRtl }) => {
  const { 
    Button, InputField, SelectField, Toggle, DataGrid, 
    FilterSection, Modal, Badge, Callout 
  } = window.UI;

  // --- Mock Data ---
  const [ledgers, setLedgers] = useState([
    { id: 1, code: '10', title: 'دفتر کل مرکزی', structure: 'std_trade', currency: 'IRR', isMain: true, isActive: true },
    { id: 2, code: '20', title: 'دفتر ارزی', structure: 'std_trade', currency: 'USD', isMain: false, isActive: true },
    { id: 3, code: '30', title: 'دفتر پروژه آلفا', structure: 'proj_alpha', currency: 'IRR', isMain: false, isActive: false },
  ]);

  // --- Mock Options for Fields ---
  const structureOptions = [
    { value: 'std_trade', label: isRtl ? 'ساختار استاندارد بازرگانی' : 'Standard Trade Structure' },
    { value: 'std_prod', label: isRtl ? 'ساختار استاندارد تولیدی' : 'Standard Production Structure' },
    { value: 'proj_alpha', label: isRtl ? 'ساختار پروژه آلفا' : 'Project Alpha Structure' },
  ];

  const currencyOptions = [
    { value: 'IRR', label: isRtl ? 'ریال ایران' : 'Iranian Rial' },
    { value: 'USD', label: 'USD - United States Dollar' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'AED', label: 'AED - UAE Dirham' },
  ];

  // --- State ---
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [searchParams, setSearchParams] = useState({ code: '', title: '' });
  const [selectedIds, setSelectedIds] = useState([]);

  // --- Actions ---
  const handleSearch = () => {
    // In a real app, fetch data with params. Here, filtering is done via useMemo
    console.log("Searching with:", searchParams);
  };

  const handleClearSearch = () => {
    setSearchParams({ code: '', title: '' });
  };

  const handleCreate = () => {
    setEditingItem(null);
    setFormData({ 
      code: '', 
      title: '', 
      structure: '', 
      currency: 'IRR', 
      isMain: false, 
      isActive: true 
    });
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({ ...item });
    setShowModal(true);
  };

  const handleDelete = (ids) => {
    if (window.confirm(t.confirm_delete.replace('{0}', ids.length))) {
      setLedgers(prev => prev.filter(item => !ids.includes(item.id)));
      setSelectedIds([]);
    }
  };

  const handleSave = () => {
    if (!formData.code || !formData.title || !formData.structure) {
      alert(t.alert_req_fields || "Please fill required fields");
      return;
    }

    let updatedLedgers = [...ledgers];

    // Main Ledger Logic: If setting to Main, uncheck others
    if (formData.isMain) {
      updatedLedgers = updatedLedgers.map(l => ({ ...l, isMain: false }));
    }

    if (editingItem) {
      updatedLedgers = updatedLedgers.map(item => 
        item.id === editingItem.id ? { ...formData, id: item.id } : item
      );
    } else {
      updatedLedgers.push({ ...formData, id: Date.now() });
    }

    setLedgers(updatedLedgers);
    setShowModal(false);
  };

  // --- Filtering Logic for DataGrid ---
  const filteredData = useMemo(() => {
    return ledgers.filter(item => {
      const matchCode = item.code.toLowerCase().includes(searchParams.code.toLowerCase());
      const matchTitle = item.title.toLowerCase().includes(searchParams.title.toLowerCase());
      return matchCode && matchTitle;
    });
  }, [ledgers, searchParams]);

  // --- Columns Definition ---
  const columns = [
    { field: 'code', header: t.lg_code || 'Code', width: 'w-24', sortable: true },
    { field: 'title', header: t.lg_title || 'Title', width: 'w-64', sortable: true },
    { 
      field: 'structure', 
      header: t.lg_structure || 'Structure', 
      width: 'w-48',
      render: (row) => structureOptions.find(o => o.value === row.structure)?.label || row.structure
    },
    { field: 'currency', header: t.lg_currency || 'Currency', width: 'w-24' },
    { 
      field: 'isMain', 
      header: t.lg_main || 'Main', 
      width: 'w-24', 
      render: (row) => (
        <div className="flex justify-center text-indigo-600">
           {row.isMain ? <ShieldCheck size={18} /> : <span className="text-slate-300">-</span>}
        </div>
      )
    },
    { 
      field: 'isActive', 
      header: t.lg_status || 'Status', 
      width: 'w-24',
      render: (row) => (
         <Badge variant={row.isActive ? 'success' : 'neutral'}>
            {row.isActive ? (t.active || 'Active') : (t.inactive || 'Inactive')}
         </Badge>
      )
    },
  ];

  return (
    <div className="h-full flex flex-col p-4">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl font-bold text-slate-800">{t.ledgers_title}</h1>
        <p className="text-slate-500 text-xs mt-1">{t.ledgers_subtitle}</p>
      </div>

      {/* Filter Section */}
      <FilterSection onSearch={handleSearch} onClear={handleClearSearch} isRtl={isRtl} title={t.filter}>
        <InputField 
          label={t.lg_code} 
          value={searchParams.code} 
          onChange={e => setSearchParams({...searchParams, code: e.target.value})}
          isRtl={isRtl}
        />
        <InputField 
          label={t.lg_title} 
          value={searchParams.title} 
          onChange={e => setSearchParams({...searchParams, title: e.target.value})}
          isRtl={isRtl}
        />
      </FilterSection>

      {/* Data Grid */}
      <div className="flex-1 overflow-hidden">
        <DataGrid 
          columns={columns}
          data={filteredData}
          selectedIds={selectedIds}
          onSelectRow={(id, checked) => setSelectedIds(prev => checked ? [...prev, id] : prev.filter(i => i !== id))}
          onSelectAll={(checked) => setSelectedIds(checked ? filteredData.map(i => i.id) : [])}
          onCreate={handleCreate}
          onDelete={handleDelete}
          onDoubleClick={handleEdit}
          isRtl={isRtl}
          actions={(row) => (
            <>
              <Button variant="ghost" size="iconSm" icon={Edit} onClick={() => handleEdit(row)} title={t.edit} />
              <Button variant="ghost" size="iconSm" icon={Trash2} onClick={() => handleDelete([row.id])} title={t.delete} className="text-red-500 hover:text-red-700 hover:bg-red-50" />
            </>
          )}
        />
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingItem ? t.lg_edit : t.lg_new}
        footer={
          <>
            <Button variant="outline" onClick={() => setShowModal(false)}>{t.btn_cancel}</Button>
            <Button variant="primary" onClick={handleSave}>{t.btn_save}</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <InputField 
             label={t.lg_code} 
             value={formData.code} 
             onChange={e => setFormData({...formData, code: e.target.value})}
             isRtl={isRtl}
             placeholder="e.g. 10"
           />
           <InputField 
             label={t.lg_title} 
             value={formData.title} 
             onChange={e => setFormData({...formData, title: e.target.value})}
             isRtl={isRtl}
             placeholder="e.g. Central Ledger"
           />
           
           <div className="md:col-span-2">
             <SelectField 
               label={t.lg_structure} 
               value={formData.structure}
               onChange={e => setFormData({...formData, structure: e.target.value})}
               isRtl={isRtl}
             >
                <option value="">{t.lg_structure_ph || '- Select -'}</option>
                {structureOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
             </SelectField>
           </div>

           <SelectField 
             label={t.lg_currency} 
             value={formData.currency}
             onChange={e => setFormData({...formData, currency: e.target.value})}
             isRtl={isRtl}
           >
              {currencyOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
           </SelectField>

           <div className="flex flex-col gap-4 mt-6">
              <Toggle 
                label={t.lg_main} 
                checked={formData.isMain} 
                onChange={val => setFormData({...formData, isMain: val})} 
              />
              <Toggle 
                label={t.active_status} 
                checked={formData.isActive} 
                onChange={val => setFormData({...formData, isActive: val})} 
              />
           </div>

           {formData.isMain && (
             <div className="md:col-span-2">
               <Callout variant="warning" title={t.lg_main}>
                  {isRtl ? 'با انتخاب این گزینه، این دفتر به عنوان دفتر اصلی سیستم شناخته شده و تیک دفتر اصلی از سایر دفاتر برداشته می‌شود.' : 'Setting this as Main Ledger will unset the Main flag from other ledgers.'}
               </Callout>
             </div>
           )}
        </div>
      </Modal>
    </div>
  );
};

window.Ledgers = Ledgers;
export default Ledgers;

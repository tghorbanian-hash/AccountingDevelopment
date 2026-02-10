/* Filename: components/financial/generalledger/Ledgers.js */
import React, { useState } from 'react';
import * as LucideIcons from 'lucide-react';

const Ledgers = ({ t, isRtl }) => {
  const UI = window.UI || {};
  const { 
    Button, InputField, SelectField, Toggle, Badge, 
    DataGrid, Modal, FilterSection 
  } = UI;

  // --- MOCK DATA ---
  const STRUCTURE_OPTIONS = [
    { value: 'std', label: t.struct_std },
    { value: 'service', label: t.struct_service },
    { value: 'project', label: t.struct_project },
  ];

  const CURRENCY_OPTIONS = [
    { value: 'IRR', label: 'Rial (IRR)' },
    { value: 'USD', label: 'US Dollar (USD)' },
    { value: 'EUR', label: 'Euro (EUR)' },
  ];

  const [data, setData] = useState([
    { id: 1, code: 'GL-01', title: 'دفتر کل مرکزی', isActive: true, isMain: true, structure: 'std', currency: 'IRR' },
    { id: 2, code: 'GL-02', title: 'دفتر پروژه کیش', isActive: true, isMain: false, structure: 'project', currency: 'IRR' },
  ]);

  const [selectedIds, setSelectedIds] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [filters, setFilters] = useState({ code: '', title: '', structure: '' });
  const [formData, setFormData] = useState({ code: '', title: '', isActive: true, isMain: false, structure: '', currency: '' });

  const handleCreate = () => {
    setEditingItem(null);
    setFormData({ code: '', title: '', isActive: true, isMain: false, structure: 'std', currency: 'IRR' });
    setIsModalOpen(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const handleDelete = (ids) => {
    if (confirm(t.confirm_delete.replace('{0}', ids.length))) {
      setData(prev => prev.filter(item => !ids.includes(item.id)));
      setSelectedIds([]);
    }
  };

  const handleSave = () => {
    if (!formData.code || !formData.title) {
      alert(t.alert_req_fields);
      return;
    }
    if (editingItem) {
      setData(prev => prev.map(item => item.id === editingItem.id ? { ...formData, id: item.id } : item));
    } else {
      const newItem = { ...formData, id: Date.now() };
      setData(prev => [...prev, newItem]);
    }
    setIsModalOpen(false);
  };

  const filteredData = data.filter(item => {
    const matchCode = item.code.toLowerCase().includes(filters.code.toLowerCase());
    const matchTitle = item.title.toLowerCase().includes(filters.title.toLowerCase());
    const matchStructure = filters.structure ? item.structure === filters.structure : true;
    return matchCode && matchTitle && matchStructure;
  });

  const columns = [
    { header: t.gl_code, field: 'code', width: 'w-32', sortable: true },
    { header: t.gl_title_field, field: 'title', width: 'w-auto', sortable: true },
    { 
      header: t.gl_structure, field: 'structure', width: 'w-40',
      render: (row) => {
        const opt = STRUCTURE_OPTIONS.find(o => o.value === row.structure);
        return opt ? opt.label : row.structure;
      }
    },
    { header: t.gl_currency, field: 'currency', width: 'w-24 text-center' },
    { 
      header: t.gl_is_main, field: 'isMain', width: 'w-24 text-center',
      render: (row) => <Badge variant={row.isMain ? 'info' : 'neutral'}>{row.isMain ? t.gl_main_yes : t.gl_main_no}</Badge>
    },
    { header: t.gl_status, field: 'isActive', width: 'w-24 text-center', type: 'toggle' },
  ];

  return (
    <div className={`flex flex-col h-full bg-slate-50/50 p-6 ${isRtl ? 'font-vazir' : 'font-sans'}`}>
      
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6 shrink-0">
         <div>
            <h1 className="text-2xl font-black text-slate-800">{t.ledgers_title}</h1>
            <p className="text-slate-500 text-sm mt-1">{t.ledgers_subtitle}</p>
         </div>
      </div>

      <FilterSection 
         onSearch={() => {}} 
         onClear={() => setFilters({code: '', title: '', structure: ''})}
         isRtl={isRtl}
         title={t.filter_title}
      >
         <InputField label={t.gl_code} value={filters.code} onChange={e => setFilters({...filters, code: e.target.value})} isRtl={isRtl} />
         <InputField label={t.gl_title_field} value={filters.title} onChange={e => setFilters({...filters, title: e.target.value})} isRtl={isRtl} />
         <SelectField label={t.gl_structure} value={filters.structure} onChange={e => setFilters({...filters, structure: e.target.value})} isRtl={isRtl}>
            <option value="">{t.all} {t.gl_structure}</option>
            {STRUCTURE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
         </SelectField>
      </FilterSection>

      <div className="flex-1 min-h-0">
        <DataGrid 
          columns={columns}
          data={filteredData}
          isRtl={isRtl}
          selectedIds={selectedIds}
          onSelectAll={(checked) => setSelectedIds(checked ? filteredData.map(d => d.id) : [])}
          onSelectRow={(id, checked) => setSelectedIds(prev => checked ? [...prev, id] : prev.filter(x => x !== id))}
          onCreate={handleCreate}
          onDelete={handleDelete}
          onDoubleClick={handleEdit}
          actions={(row) => (
             <>
               <Button variant="ghost" size="iconSm" icon={LucideIcons.Edit} className="text-indigo-600 hover:bg-indigo-50" onClick={() => handleEdit(row)} title={t.ledgers_edit} />
               <Button variant="ghost" size="iconSm" icon={LucideIcons.Trash2} className="text-red-500 hover:bg-red-50" onClick={() => handleDelete([row.id])} title={t.delete} />
             </>
          )}
        />
      </div>

      <Modal 
         isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} 
         title={editingItem ? t.ledgers_edit : t.ledgers_new} size="md"
         footer={<><Button variant="secondary" onClick={() => setIsModalOpen(false)}>{t.btn_cancel}</Button><Button variant="primary" icon={LucideIcons.Save} onClick={handleSave}>{t.btn_save}</Button></>}
      >
         <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
               <InputField label={t.gl_code} value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} isRtl={isRtl} />
               <InputField label={t.gl_title_field} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} isRtl={isRtl} />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <SelectField label={t.gl_structure} value={formData.structure} onChange={e => setFormData({...formData, structure: e.target.value})} isRtl={isRtl}>
                  <option value="">- Select -</option>
                  {STRUCTURE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
               </SelectField>
               <SelectField label={t.gl_currency} value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})} isRtl={isRtl}>
                  <option value="">- Select -</option>
                  {CURRENCY_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
               </SelectField>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
               <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-slate-600">{t.gl_is_main}</span>
                  <Toggle label={formData.isMain ? t.gl_main_yes : t.gl_main_no} checked={formData.isMain} onChange={val => setFormData({...formData, isMain: val})} />
               </div>
               <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-slate-600">{t.gl_status}</span>
                  <Toggle label={formData.isActive ? t.active : t.inactive} checked={formData.isActive} onChange={val => setFormData({...formData, isActive: val})} />
               </div>
            </div>
         </div>
      </Modal>
    </div>
  );
};

window.Ledgers = Ledgers;

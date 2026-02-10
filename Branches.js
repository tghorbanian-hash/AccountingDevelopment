
/* Filename: components/Branches.js */
import React, { useState, useMemo } from 'react';
import { 
  MapPin, Search, Plus, Edit, Trash2, Save, CheckCircle2 
} from 'lucide-react';

const Branches = ({ t, isRtl }) => {
  const UI = window.UI || {};
  const { Button, InputField, SelectField, DataGrid, FilterSection, Modal, Badge, Toggle } = UI;

  // --- States ---
  const [data, setData] = useState([
    { id: 1, code: 'BR-01', title: 'مرکز تهران', address: 'تهران، ونک', active: true, isDefault: true },
    { id: 2, code: 'BR-02', title: 'شعبه اصفهان', address: 'اصفهان، چهارباغ', active: true, isDefault: false },
  ]);

  const [filters, setFilters] = useState({ code: '', title: '', isDefault: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [formData, setFormData] = useState({});

  // --- Handlers ---
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchCode = filters.code ? item.code.toLowerCase().includes(filters.code.toLowerCase()) : true;
      const matchTitle = filters.title ? item.title.toLowerCase().includes(filters.title.toLowerCase()) : true;
      const matchDefault = filters.isDefault === '' ? true : (filters.isDefault === 'yes' ? item.isDefault : !item.isDefault);
      return matchCode && matchTitle && matchDefault;
    });
  }, [data, filters]);

  const handleOpenModal = (record = null) => {
    if (record) {
      setFormData({ ...record });
    } else {
      setFormData({ code: '', title: '', address: '', active: true, isDefault: false });
    }
    setCurrentRecord(record);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.code || !formData.title) {
      alert(isRtl ? 'کد و عنوان شعبه الزامی است.' : 'Code and Title are required.');
      return;
    }

    let newData = [];
    if (currentRecord) {
      newData = data.map(item => item.id === currentRecord.id ? { ...formData, id: item.id } : item);
    } else {
      newData = [...data, { ...formData, id: Date.now() }];
    }

    // Logic: If new/edited branch is default, uncheck others
    if (formData.isDefault) {
      newData = newData.map(item => ({
        ...item,
        isDefault: (item.id === (currentRecord?.id || newData[newData.length-1].id))
      }));
    }

    setData(newData);
    setIsModalOpen(false);
  };

  const handleDelete = (ids) => {
    if (confirm(t.confirm_delete.replace('{0}', ids.length))) {
      setData(prev => prev.filter(item => !ids.includes(item.id)));
      setSelectedIds([]);
    }
  };

  const handleToggleActive = (id, newVal) => {
    setData(prev => prev.map(item => item.id === id ? { ...item, active: newVal } : item));
  };

  const handleSetDefault = (row) => {
    if (row.isDefault) return; // Already default
    if (confirm(t.br_default_msg || 'Default branch changed.')) {
       setData(prev => prev.map(item => ({ ...item, isDefault: item.id === row.id })));
    }
  };

  // --- Columns ---
  const columns = [
    { field: 'code', header: t.br_code, width: 'w-24', sortable: true },
    { field: 'title', header: t.br_title_field, width: 'w-48', sortable: true },
    { field: 'address', header: t.br_addr, width: 'w-64' },
    { 
       field: 'isDefault', 
       header: t.br_default, 
       width: 'w-24', 
       render: (row) => (
          <div className="flex justify-center">
             <button 
                onClick={() => handleSetDefault(row)} 
                className={`p-1 rounded-full transition-all ${row.isDefault ? 'bg-indigo-100 text-indigo-600' : 'text-slate-300 hover:text-indigo-400'}`}
                title={t.br_set_default}
             >
                <CheckCircle2 size={18} strokeWidth={row.isDefault ? 2.5 : 2} />
             </button>
          </div>
       )
    },
    { 
       field: 'active', 
       header: t.active_status, 
       width: 'w-20', 
       type: 'toggle',
       render: (row) => (
          <div className="flex justify-center">
             <Toggle checked={row.active} onChange={(val) => handleToggleActive(row.id, val)} />
          </div>
       )
    }
  ];

  return (
    <div className="flex flex-col h-full p-4 md:p-6 bg-slate-50/50">
      <div className="mb-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200">
            <MapPin size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800">{t.br_title}</h1>
            <p className="text-xs text-slate-500 font-medium mt-1">{t.br_subtitle}</p>
          </div>
        </div>
      </div>

      <FilterSection 
        isRtl={isRtl} 
        onSearch={() => {}} 
        onClear={() => setFilters({ code: '', title: '', isDefault: '' })}
      >
        <InputField label={t.br_code} placeholder="..." isRtl={isRtl} value={filters.code} onChange={(e) => setFilters(prev => ({ ...prev, code: e.target.value }))} />
        <InputField label={t.br_title_field} placeholder="..." isRtl={isRtl} value={filters.title} onChange={(e) => setFilters(prev => ({ ...prev, title: e.target.value }))} />
        <SelectField label={t.br_default} isRtl={isRtl} value={filters.isDefault} onChange={(e) => setFilters(prev => ({ ...prev, isDefault: e.target.value }))}>
           <option value="">{t.all}</option>
           <option value="yes">{t.opt_active}</option>
           <option value="no">{t.opt_inactive}</option>
        </SelectField>
      </FilterSection>

      <div className="flex-1 min-h-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <DataGrid 
          columns={columns} 
          data={filteredData} 
          selectedIds={selectedIds}
          onSelectRow={(id, checked) => setSelectedIds(prev => checked ? [...prev, id] : prev.filter(x => x !== id))}
          onSelectAll={(checked) => setSelectedIds(checked ? filteredData.map(d => d.id) : [])}
          onCreate={() => handleOpenModal()}
          onDelete={handleDelete}
          isRtl={isRtl}
          actions={(row) => (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="iconSm" icon={Edit} onClick={() => handleOpenModal(row)} />
              <Button variant="ghost" size="iconSm" icon={Trash2} className="text-red-500 hover:bg-red-50" onClick={() => handleDelete([row.id])} />
            </div>
          )}
        />
      </div>

      <Modal 
        isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} 
        title={currentRecord ? t.br_edit : t.br_new}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>{t.btn_cancel}</Button>
            <Button variant="primary" icon={Save} onClick={handleSave}>{t.btn_save}</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
           <InputField label={`${t.br_code} *`} value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} isRtl={isRtl} className="dir-ltr" />
           <InputField label={`${t.br_title_field} *`} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} isRtl={isRtl} />
           
           <div className="md:col-span-2">
              <InputField label={t.br_addr} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} isRtl={isRtl} />
           </div>

           <div className="md:col-span-2 bg-slate-50 p-3 rounded-lg border border-slate-200 grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between border-l pl-4 border-slate-200">
                 <span className="text-sm font-bold text-slate-700">{t.active_status}</span>
                 <Toggle checked={formData.active} onChange={val => setFormData({...formData, active: val})} />
              </div>
              <div className="flex items-center justify-between">
                 <span className="text-sm font-bold text-slate-700">{t.br_default}</span>
                 <Toggle checked={formData.isDefault} onChange={val => setFormData({...formData, isDefault: val})} />
              </div>
           </div>
        </div>
      </Modal>
    </div>
  );
};

window.Branches = Branches;

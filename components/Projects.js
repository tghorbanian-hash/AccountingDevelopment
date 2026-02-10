/* Filename: components/Projects.js */
import React, { useState, useMemo } from 'react';
import { 
  ListTodo, Search, Plus, Edit, Trash2, Save, Link2, Calendar 
} from 'lucide-react';

const Projects = ({ t, isRtl }) => {
  const UI = window.UI || {};
  const { Button, InputField, SelectField, DataGrid, FilterSection, Modal, Badge, Toggle } = UI;

  // --- Mock Data ---
  // Mock List of Persons/Parties for LOV
  const mockParties = [
    { id: 101, name: 'علی رضایی' },
    { id: 102, name: 'سارا محمدی' },
    { id: 103, name: 'مهندس اکبری' },
    { id: 104, name: 'شرکت پیمانکاری البرز' },
  ];

  const [data, setData] = useState([
    { id: 1, code: 'PRJ-1403-01', name: 'راه‌اندازی خط جدید', start: '1403/01/15', end: '1403/06/30', manager: 'مهندس اکبری', budget: 5000000000, detailCode: '8001', active: true },
    { id: 2, code: 'PRJ-1403-02', name: 'توسعه نرم‌افزار مالی', start: '1403/02/01', end: '1403/12/29', manager: 'سارا محمدی', budget: 1200000000, detailCode: null, active: true },
  ]);

  // States
  const [filters, setFilters] = useState({ code: '', name: '', manager: '' });
  
  // Create/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [formData, setFormData] = useState({});
  const [selectedIds, setSelectedIds] = useState([]);

  // Detail Code Assignment Modal
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [targetForDetail, setTargetForDetail] = useState(null);
  const [detailCodeInput, setDetailCodeInput] = useState('');

  // --- Handlers ---
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchCode = filters.code ? item.code.toLowerCase().includes(filters.code.toLowerCase()) : true;
      const matchName = filters.name ? item.name.toLowerCase().includes(filters.name.toLowerCase()) : true;
      const matchManager = filters.manager ? item.manager === filters.manager : true;
      return matchCode && matchName && matchManager;
    });
  }, [data, filters]);

  // CRUD Handlers
  const handleOpenModal = (record = null) => {
    if (record) {
      setFormData({ ...record });
    } else {
      setFormData({ code: '', name: '', start: '', end: '', manager: '', budget: '', detailCode: null, active: true });
    }
    setCurrentRecord(record);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.code || !formData.name) {
      alert(isRtl ? 'کد و نام پروژه الزامی است.' : 'Project Code and Name are required.');
      return;
    }
    if (currentRecord) {
      setData(prev => prev.map(item => item.id === currentRecord.id ? { ...formData, id: item.id } : item));
    } else {
      setData(prev => [...prev, { ...formData, id: Date.now() }]);
    }
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

  // Detail Code Handlers
  const handleOpenDetailModal = (row) => {
    setTargetForDetail(row);
    setDetailCodeInput(row.detailCode || '');
    setIsDetailModalOpen(true);
  };

  const handleSaveDetailCode = () => {
    if (targetForDetail) {
      setData(prev => prev.map(item => item.id === targetForDetail.id ? { ...item, detailCode: detailCodeInput || null } : item));
      setIsDetailModalOpen(false);
    }
  };

  // --- Columns ---
  const columns = [
    { field: 'code', header: t.proj_code, width: 'w-32', sortable: true },
    { field: 'name', header: t.proj_name, width: 'w-48', sortable: true },
    { field: 'start', header: t.proj_start, width: 'w-24', className: 'text-center dir-ltr' },
    { 
       field: 'manager', 
       header: t.proj_manager, 
       width: 'w-32',
       render: (row) => <Badge variant="info">{row.manager}</Badge>
    },
    { 
       field: 'budget', 
       header: t.proj_budget, 
       width: 'w-32', 
       className: 'text-left font-mono font-bold dir-ltr',
       render: (row) => row.budget ? Number(row.budget).toLocaleString() : '-'
    },
    { 
      field: 'detailCode', 
      header: t.detail_code, 
      width: 'w-40',
      render: (row) => row.detailCode ? (
        <button onClick={() => handleOpenDetailModal(row)} className="flex items-center gap-2 group">
           <Badge variant="success" className="font-mono group-hover:bg-emerald-100 transition-colors">{row.detailCode}</Badge>
           <Edit size={12} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"/>
        </button>
      ) : (
        <button onClick={() => handleOpenDetailModal(row)} className="flex items-center gap-2">
           <Badge variant="danger">{t.detail_not_assigned}</Badge>
           <span className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              <Link2 size={12}/> {t.detail_assign_btn}
           </span>
        </button>
      )
    },
    { 
       field: 'active', 
       header: t.curr_active, 
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
            <ListTodo size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800">{t.proj_title}</h1>
            <p className="text-xs text-slate-500 font-medium mt-1">{t.proj_subtitle}</p>
          </div>
        </div>
      </div>

      <FilterSection 
        isRtl={isRtl} 
        onSearch={() => {}} 
        onClear={() => setFilters({ code: '', name: '', manager: '' })}
      >
        <InputField label={t.proj_code} placeholder="..." isRtl={isRtl} value={filters.code} onChange={(e) => setFilters(prev => ({ ...prev, code: e.target.value }))} />
        <InputField label={t.proj_name} placeholder="..." isRtl={isRtl} value={filters.name} onChange={(e) => setFilters(prev => ({ ...prev, name: e.target.value }))} />
        <SelectField label={t.proj_manager} isRtl={isRtl} value={filters.manager} onChange={(e) => setFilters(prev => ({ ...prev, manager: e.target.value }))}>
           <option value="">{t.all}</option>
           {mockParties.map(p => (
              <option key={p.id} value={p.name}>{p.name}</option>
           ))}
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

      {/* Create/Edit Modal */}
      <Modal 
        isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} 
        title={currentRecord ? t.proj_edit : t.proj_new}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>{t.btn_cancel}</Button>
            <Button variant="primary" icon={Save} onClick={handleSave}>{t.btn_save}</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
           <InputField label={`${t.proj_code} *`} value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} isRtl={isRtl} className="dir-ltr" />
           <InputField label={`${t.proj_name} *`} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} isRtl={isRtl} />
           
           <InputField label={t.proj_start} type="text" placeholder="1403/01/01" value={formData.start} onChange={e => setFormData({...formData, start: e.target.value})} isRtl={isRtl} className="dir-ltr" />
           <InputField label={t.proj_end} type="text" placeholder="1403/12/29" value={formData.end} onChange={e => setFormData({...formData, end: e.target.value})} isRtl={isRtl} className="dir-ltr" />
           
           {/* Manager Selection (LOV) */}
           <SelectField label={t.proj_manager} value={formData.manager} onChange={e => setFormData({...formData, manager: e.target.value})} isRtl={isRtl}>
              <option value="">- انتخاب کنید -</option>
              {mockParties.map(p => (
                 <option key={p.id} value={p.name}>{p.name}</option>
              ))}
           </SelectField>

           <InputField label={t.proj_budget} type="number" value={formData.budget} onChange={e => setFormData({...formData, budget: e.target.value})} isRtl={isRtl} className="dir-ltr" />

           <div className="md:col-span-2 bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-700">{t.active_status}</span>
              <Toggle checked={formData.active} onChange={val => setFormData({...formData, active: val})} />
           </div>
        </div>
      </Modal>

      {/* Detail Code Assignment Modal */}
      <Modal 
        isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)}
        title={t.detail_assign_btn}
        size="sm"
        footer={
           <>
             <Button variant="ghost" onClick={() => setIsDetailModalOpen(false)}>{t.btn_cancel}</Button>
             <Button variant="primary" onClick={handleSaveDetailCode}>{t.btn_save}</Button>
           </>
        }
      >
         <div className="p-2 space-y-3">
            <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-lg leading-relaxed">
               {isRtl 
                 ? `در حال تخصیص کد تفصیلی به: ${targetForDetail?.name}` 
                 : `Assigning detail code for: ${targetForDetail?.name}`}
            </div>
            <InputField 
               label={t.detail_code} 
               value={detailCodeInput} 
               onChange={(e) => setDetailCodeInput(e.target.value)} 
               isRtl={isRtl}
               className="dir-ltr text-center font-bold"
               placeholder="Example: 8001"
               autoFocus
            />
         </div>
      </Modal>
    </div>
  );
};

window.Projects = Projects;

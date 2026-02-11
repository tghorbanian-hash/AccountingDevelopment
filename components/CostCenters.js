/* Filename: components/CostCenters.js */
import React, { useState, useMemo } from 'react';
import { 
  Layers, Search, Plus, Edit, Trash2, Save, Link2, AlertTriangle, CheckCircle2 
} from 'lucide-react';

const CostCenters = ({ t, isRtl }) => {
  const UI = window.UI || {};
  const { Button, InputField, SelectField, DataGrid, FilterSection, Modal, Badge, Toggle } = UI;

  // --- States ---
  const [data, setData] = useState([
    { id: 1, code: '1001', title: 'خط تولید الف', type: 'production', address: 'سوله شماره ۱', detailCode: '9001', active: true },
    { id: 2, code: '2001', title: 'واحد حسابداری', type: 'admin', address: 'طبقه دوم', detailCode: null, active: true },
    { id: 3, code: '3005', title: 'خدمات پس از فروش', type: 'service', address: 'ساختمان مرکزی', detailCode: '9005', active: false },
  ]);

  const [filters, setFilters] = useState({ code: '', title: '', type: '' });
  
  // Create/Edit Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [formData, setFormData] = useState({});
  const [selectedIds, setSelectedIds] = useState([]);

  // Detail Code Assignment Modal States
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [targetForDetail, setTargetForDetail] = useState(null);
  const [detailCodeInput, setDetailCodeInput] = useState('');

  // --- Handlers ---
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchCode = filters.code ? item.code.toLowerCase().includes(filters.code.toLowerCase()) : true;
      const matchTitle = filters.title ? item.title.toLowerCase().includes(filters.title.toLowerCase()) : true;
      const matchType = filters.type ? item.type === filters.type : true;
      return matchCode && matchTitle && matchType;
    });
  }, [data, filters]);

  // CRUD Handlers
  const handleOpenModal = (record = null) => {
    if (record) {
      setFormData({ ...record });
    } else {
      setFormData({ code: '', title: '', type: 'production', address: '', detailCode: null, active: true });
    }
    setCurrentRecord(record);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.code || !formData.title) {
      alert(isRtl ? 'کد و عنوان مرکز هزینه الزامی است.' : 'Code and Title are required.');
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
    { field: 'code', header: t.cc_code, width: 'w-24', sortable: true },
    { field: 'title', header: t.cc_title_field, width: 'w-48', sortable: true },
    { 
      field: 'type', 
      header: t.cc_type, 
      width: 'w-32',
      render: (row) => {
        const labels = {
          production: t.cc_type_prod,
          service: t.cc_type_serv,
          admin: t.cc_type_admin
        };
        return <Badge variant="neutral">{labels[row.type] || row.type}</Badge>;
      }
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
            <Layers size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800">{t.cc_title}</h1>
            <p className="text-xs text-slate-500 font-medium mt-1">{t.cc_subtitle}</p>
          </div>
        </div>
      </div>

      <FilterSection 
        isRtl={isRtl} 
        onSearch={() => {}} 
        onClear={() => setFilters({ code: '', title: '', type: '' })}
      >
        <InputField label={t.cc_code} placeholder="..." isRtl={isRtl} value={filters.code} onChange={(e) => setFilters(prev => ({ ...prev, code: e.target.value }))} />
        <InputField label={t.cc_title_field} placeholder="..." isRtl={isRtl} value={filters.title} onChange={(e) => setFilters(prev => ({ ...prev, title: e.target.value }))} />
        <SelectField label={t.cc_type} isRtl={isRtl} value={filters.type} onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}>
           <option value="">{t.all}</option>
           <option value="production">{t.cc_type_prod}</option>
           <option value="service">{t.cc_type_serv}</option>
           <option value="admin">{t.cc_type_admin}</option>
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
        title={currentRecord ? t.cc_edit : t.cc_new}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>{t.btn_cancel}</Button>
            <Button variant="primary" icon={Save} onClick={handleSave}>{t.btn_save}</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
           <InputField label={`${t.cc_code} *`} value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} isRtl={isRtl} className="dir-ltr" />
           <InputField label={`${t.cc_title_field} *`} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} isRtl={isRtl} />
           
           {/* Combined Row for Type and Active */}
           <div className="md:col-span-2 grid grid-cols-2 gap-5">
              <SelectField label={t.cc_type} value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} isRtl={isRtl}>
                 <option value="production">{t.cc_type_prod}</option>
                 <option value="service">{t.cc_type_serv}</option>
                 <option value="admin">{t.cc_type_admin}</option>
              </SelectField>
              
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 flex items-center justify-between h-[50px] mt-auto">
                 <span className="text-xs font-bold text-slate-700 px-2">{t.active_status}</span>
                 <Toggle checked={formData.active} onChange={val => setFormData({...formData, active: val})} />
              </div>
           </div>
           
           <div className="md:col-span-2">
              <InputField label={t.cc_address} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} isRtl={isRtl} />
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
                 ? `در حال تخصیص کد تفصیلی به: ${targetForDetail?.title}` 
                 : `Assigning detail code for: ${targetForDetail?.title}`}
            </div>
            <InputField 
               label={t.detail_code} 
               value={detailCodeInput} 
               onChange={(e) => setDetailCodeInput(e.target.value)} 
               isRtl={isRtl}
               className="dir-ltr text-center font-bold"
               placeholder="Example: 9001"
               autoFocus
            />
         </div>
      </Modal>
    </div>
  );
};

window.CostCenters = CostCenters;

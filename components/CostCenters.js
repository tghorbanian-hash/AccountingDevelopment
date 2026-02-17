/* Filename: components/CostCenters.js */
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Layers, Search, Plus, Edit, Trash2, Save, Link2, AlertTriangle, CheckCircle2, Ban 
} from 'lucide-react';

const CostCenters = ({ t, isRtl }) => {
  const UI = window.UI || {};
  const { Button, InputField, SelectField, DataGrid, FilterSection, Modal, Badge } = UI;
  const supabase = window.supabase;

  // --- Resilient Permission Checks (Level 1 & 2) ---
  const checkAccess = (action = null) => {
    if (!window.hasAccess) return false;
    
    const variations = ['cost_centers', 'costcenters', 'costcenter'];
    for (const res of variations) {
       if (window.hasAccess(res, action)) return true;
    }
    return false;
  };

  const canEnterForm = checkAccess(); 
  const canView   = canEnterForm || checkAccess('view') || checkAccess('read') || checkAccess('show');
  const canCreate = checkAccess('create') || checkAccess('new') || checkAccess('add') || checkAccess('insert');
  const canEdit   = checkAccess('edit') || checkAccess('update') || checkAccess('modify');
  const canDelete = checkAccess('delete') || checkAccess('remove') || checkAccess('destroy');
  
  // Custom Action Permission
  const canAssignDetail = checkAccess('assign_detail') || checkAccess('assigndetail');

  // --- States ---
  const [data, setData] = useState([]);
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

  // --- Effects ---
  useEffect(() => {
    if (canView) {
      fetchData();
    }
  }, [canView]);

  // --- DB Operations ---
  const fetchData = async () => {
    try {
      if (!supabase) throw new Error("Supabase connection is missing.");

      const { data: dbData, error } = await supabase
        .schema('gen')
        .from('cost_centers')
        .select('*');

      if (error) throw error;

      const mappedData = (dbData || []).map(item => ({
        id: item.id,
        code: item.code || '',
        title: item.title || '',
        type: item.type || 'production',
        address: item.address || '',
        detailCode: item.detail_code || '',
        active: item.is_active !== undefined ? item.is_active : true,
        createdAt: item.created_at || new Date().toISOString()
      })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setData(mappedData);
    } catch (err) {
      console.error('Error fetching data:', err);
      alert((isRtl ? 'خطا در دریافت اطلاعات: ' : 'Fetch Error: ') + (err.message || err));
    }
  };

  const handleSave = async () => {
    if (currentRecord && currentRecord.id && !canEdit) {
      alert(t.err_access_denied || (isRtl ? 'دسترسی غیرمجاز برای ویرایش' : 'Access Denied for Edit'));
      return;
    }
    if ((!currentRecord || !currentRecord.id) && !canCreate) {
      alert(t.err_access_denied || (isRtl ? 'دسترسی غیرمجاز برای ایجاد' : 'Access Denied for Create'));
      return;
    }

    if (!formData.code || !formData.title) {
      alert(isRtl ? 'کد و عنوان مرکز هزینه الزامی است.' : 'Code and Title are required.');
      return;
    }

    try {
      const payload = {
        code: formData.code,
        title: formData.title,
        type: formData.type || 'production',
        address: formData.address || null,
        is_active: formData.active !== undefined ? formData.active : true
      };

      if (currentRecord && currentRecord.id) {
        const { error } = await supabase
          .schema('gen')
          .from('cost_centers')
          .update(payload)
          .eq('id', currentRecord.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .schema('gen')
          .from('cost_centers')
          .insert([payload]);

        if (error) throw error;
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error saving data:', err);
      alert((isRtl ? 'خطا در ثبت اطلاعات: ' : 'Save Error: ') + (err.message || err));
    }
  };

  const handleDelete = async (ids) => {
    if (!canDelete) {
      alert(t.err_access_denied || (isRtl ? 'دسترسی غیرمجاز برای حذف' : 'Access Denied for Delete'));
      return;
    }

    const confirmMsg = t.confirm_delete?.replace('{0}', ids.length) || (isRtl ? `آیا از حذف ${ids.length} مورد اطمینان دارید؟` : `Delete ${ids.length} items?`);
    if (confirm(confirmMsg)) {
      try {
        const { error } = await supabase
          .schema('gen')
          .from('cost_centers')
          .delete()
          .in('id', ids);

        if (error) throw error;

        setSelectedIds([]);
        fetchData();
      } catch (err) {
        console.error('Error deleting data:', err);
        alert((isRtl ? 'خطا در حذف اطلاعات: ' : 'Delete Error: ') + (err.message || err));
      }
    }
  };

  const handleToggleActive = async (id, newVal) => {
    if (!canEdit) {
       alert(isRtl ? 'دسترسی غیرمجاز برای ویرایش' : 'Access Denied for Edit');
       return;
    }
    try {
      const { error } = await supabase
        .schema('gen')
        .from('cost_centers')
        .update({ is_active: newVal })
        .eq('id', id);
      
      if (error) throw error;
      fetchData();
    } catch (err) {
      console.error('Error updating status:', err);
      alert((isRtl ? 'خطا در تغییر وضعیت: ' : 'Status Update Error: ') + (err.message || err));
    }
  };

  // --- Detail Code Handlers ---
  const handleOpenDetailModal = (row) => {
    if (!canAssignDetail) {
       alert(isRtl ? 'دسترسی غیرمجاز برای تخصیص کد تفصیل' : 'Access Denied for Detail Code Assignment');
       return;
    }
    setTargetForDetail(row);
    setDetailCodeInput(row.detailCode || '');
    setIsDetailModalOpen(true);
  };

  const handleSaveDetailCode = async () => {
    if (!canAssignDetail) {
       alert(isRtl ? 'دسترسی غیرمجاز' : 'Access Denied');
       return;
    }
    if (targetForDetail) {
      try {
        const { error } = await supabase
          .schema('gen')
          .from('cost_centers')
          .update({ detail_code: detailCodeInput || null })
          .eq('id', targetForDetail.id);

        if (error) throw error;

        setIsDetailModalOpen(false);
        fetchData();
      } catch (err) {
        console.error('Error assigning detail code:', err);
        alert((isRtl ? 'خطا در تخصیص کد: ' : 'Error: ') + (err.message || err));
      }
    }
  };

  const handleOpenModal = (record = null) => {
    if (record) {
      if (!canEdit) {
         alert(isRtl ? 'شما مجوز ویرایش ندارید' : 'You do not have edit permission');
         return;
      }
      setFormData({ ...record });
    } else {
      if (!canCreate) {
         alert(isRtl ? 'شما مجوز ایجاد اطلاعات جدید ندارید' : 'You do not have create permission');
         return;
      }
      setFormData({ code: '', title: '', type: 'production', address: '', active: true });
    }
    setCurrentRecord(record);
    setIsModalOpen(true);
  };

  // --- Filter Data ---
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchCode = filters.code ? String(item.code || '').toLowerCase().includes(filters.code.toLowerCase()) : true;
      const matchTitle = filters.title ? String(item.title || '').toLowerCase().includes(filters.title.toLowerCase()) : true;
      const matchType = filters.type ? item.type === filters.type : true;
      return matchCode && matchTitle && matchType;
    });
  }, [data, filters]);

  // --- Views ---
  if (!canView) {
    return (
      <div className={`flex flex-col items-center justify-center h-full bg-slate-50/50 ${isRtl ? 'font-vazir' : 'font-sans'}`}>
        <div className="p-6 bg-white rounded-2xl shadow-sm text-center border border-red-100">
           <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
             <Ban className="text-red-500" size={32} />
           </div>
           <h2 className="text-lg font-bold text-slate-800">{isRtl ? 'دسترسی غیرمجاز' : 'Access Denied'}</h2>
           <p className="text-sm text-slate-500 mt-2">{isRtl ? 'شما مجوز مشاهده این فرم را ندارید.' : 'You do not have permission to view this form.'}</p>
        </div>
      </div>
    );
  }

  const columns = [
    { field: 'code', header: t.cc_code || (isRtl ? 'کد' : 'Code'), width: 'w-24', sortable: true },
    { field: 'title', header: t.cc_title_field || (isRtl ? 'عنوان' : 'Title'), width: 'w-48', sortable: true },
    { 
      field: 'type', 
      header: t.cc_type || (isRtl ? 'نوع مرکز' : 'Type'), 
      width: 'w-32',
      render: (row) => {
        const labels = {
          production: t.cc_type_prod || (isRtl ? 'تولیدی' : 'Production'),
          service: t.cc_type_serv || (isRtl ? 'خدماتی' : 'Service'),
          admin: t.cc_type_admin || (isRtl ? 'اداری' : 'Admin')
        };
        return <Badge variant="neutral">{labels[row.type] || row.type}</Badge>;
      }
    },
    { 
      field: 'detailCode', 
      header: t.detail_code || (isRtl ? 'کد تفصیل' : 'Detail Code'), 
      width: 'w-40',
      render: (row) => row.detailCode ? (
        <button 
           onClick={() => canAssignDetail ? handleOpenDetailModal(row) : alert(isRtl ? 'عدم دسترسی به تخصیص تفصیل' : 'Access Denied')} 
           className={`flex items-center gap-2 ${canAssignDetail ? 'group cursor-pointer' : 'cursor-default opacity-80'}`}
           title={canAssignDetail ? (isRtl ? 'ویرایش کد تفصیل' : 'Edit Detail Code') : ''}
        >
           <Badge variant="success" className="font-mono transition-colors group-hover:bg-emerald-100">{row.detailCode}</Badge>
           {canAssignDetail && <Edit size={12} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"/>}
        </button>
      ) : (
        <button 
           onClick={() => canAssignDetail ? handleOpenDetailModal(row) : alert(isRtl ? 'عدم دسترسی به تخصیص تفصیل' : 'Access Denied')} 
           className={`flex items-center gap-2 ${canAssignDetail ? 'cursor-pointer' : 'cursor-default opacity-60'}`}
        >
           <Badge variant="danger">{t.detail_not_assigned || (isRtl ? 'تخصیص نیافته' : 'Not Assigned')}</Badge>
           {canAssignDetail && (
             <span className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                <Link2 size={12}/> {t.detail_assign_btn || (isRtl ? 'تخصیص' : 'Assign')}
             </span>
           )}
        </button>
      )
    },
    { 
       field: 'active', 
       header: t.curr_active || (isRtl ? 'فعال' : 'Active'), 
       width: 'w-20', 
       render: (row) => (
          <div className="flex justify-center">
             <input 
               type="checkbox" 
               className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
               checked={row.active} 
               onChange={(e) => handleToggleActive(row.id, e.target.checked)} 
             />
          </div>
       )
    }
  ];

  return (
    <div className={`flex flex-col h-full p-4 md:p-6 bg-slate-50/50 ${isRtl ? 'font-vazir' : 'font-sans'}`}>
      <div className="mb-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200">
            <Layers size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800">{t.cc_title || (isRtl ? 'مراکز هزینه' : 'Cost Centers')}</h1>
            <p className="text-xs text-slate-500 font-medium mt-1">{t.cc_subtitle || (isRtl ? 'مدیریت و تعریف مراکز هزینه سازمان' : 'Manage organizational cost centers')}</p>
          </div>
        </div>
      </div>

      <FilterSection 
        isRtl={isRtl} 
        onSearch={() => {}} 
        onClear={() => setFilters({ code: '', title: '', type: '' })}
      >
        <InputField label={t.cc_code || (isRtl ? 'کد' : 'Code')} placeholder="..." isRtl={isRtl} value={filters.code} onChange={(e) => setFilters(prev => ({ ...prev, code: e.target.value }))} />
        <InputField label={t.cc_title_field || (isRtl ? 'عنوان' : 'Title')} placeholder="..." isRtl={isRtl} value={filters.title} onChange={(e) => setFilters(prev => ({ ...prev, title: e.target.value }))} />
        <SelectField label={t.cc_type || (isRtl ? 'نوع مرکز' : 'Type')} isRtl={isRtl} value={filters.type} onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}>
           <option value="">{t.all || (isRtl ? 'همه' : 'All')}</option>
           <option value="production">{t.cc_type_prod || (isRtl ? 'تولیدی' : 'Production')}</option>
           <option value="service">{t.cc_type_serv || (isRtl ? 'خدماتی' : 'Service')}</option>
           <option value="admin">{t.cc_type_admin || (isRtl ? 'اداری' : 'Admin')}</option>
        </SelectField>
      </FilterSection>

      <div className="flex-1 min-h-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <DataGrid 
          columns={columns} 
          data={filteredData} 
          selectedIds={selectedIds}
          onSelectRow={(id, checked) => setSelectedIds(prev => checked ? [...prev, id] : prev.filter(x => x !== id))}
          onSelectAll={(checked) => setSelectedIds(checked ? filteredData.map(d => d.id) : [])}
          onCreate={canCreate ? () => handleOpenModal() : undefined}
          onDelete={canDelete ? handleDelete : undefined}
          isRtl={isRtl}
          actions={(row) => (
            <div className="flex items-center gap-1">
              {canEdit && <Button variant="ghost" size="iconSm" icon={Edit} onClick={() => handleOpenModal(row)} />}
              {canDelete && <Button variant="ghost" size="iconSm" icon={Trash2} className="text-red-500 hover:bg-red-50" onClick={() => handleDelete([row.id])} />}
            </div>
          )}
        />
      </div>

      {/* Create/Edit Modal */}
      <Modal 
        isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} 
        title={currentRecord ? (t.cc_edit || (isRtl ? 'ویرایش مرکز هزینه' : 'Edit Cost Center')) : (t.cc_new || (isRtl ? 'مرکز هزینه جدید' : 'New Cost Center'))}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>{t.btn_cancel || (isRtl ? 'انصراف' : 'Cancel')}</Button>
            <Button variant="primary" icon={Save} onClick={handleSave}>{t.btn_save || (isRtl ? 'ذخیره' : 'Save')}</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
           <InputField label={`${t.cc_code || (isRtl ? 'کد' : 'Code')} *`} value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} isRtl={isRtl} className="dir-ltr" />
           <InputField label={`${t.cc_title_field || (isRtl ? 'عنوان' : 'Title')} *`} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} isRtl={isRtl} />
           
           <div className="md:col-span-2 grid grid-cols-2 gap-5">
              <SelectField label={t.cc_type || (isRtl ? 'نوع مرکز' : 'Type')} value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} isRtl={isRtl}>
                 <option value="production">{t.cc_type_prod || (isRtl ? 'تولیدی' : 'Production')}</option>
                 <option value="service">{t.cc_type_serv || (isRtl ? 'خدماتی' : 'Service')}</option>
                 <option value="admin">{t.cc_type_admin || (isRtl ? 'اداری' : 'Admin')}</option>
              </SelectField>
              
              <div className={`flex items-center justify-between h-[50px] mt-auto bg-slate-50 border border-slate-200 rounded-lg ${isRtl ? 'pl-4 pr-3' : 'pr-4 pl-3'}`}>
                 <span className="text-sm font-bold text-slate-700">{t.active_status || (isRtl ? 'فعال' : 'Active')}</span>
                 <input 
                   type="checkbox" 
                   className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                   checked={formData.active} 
                   onChange={e => setFormData({...formData, active: e.target.checked})} 
                 />
              </div>
           </div>
           
           <div className="md:col-span-2">
              <InputField label={t.cc_address || (isRtl ? 'آدرس/توضیحات' : 'Address/Notes')} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} isRtl={isRtl} />
           </div>
        </div>
      </Modal>

      {/* Detail Code Assignment Modal */}
      <Modal 
        isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)}
        title={t.detail_assign_btn || (isRtl ? 'تخصیص کد تفصیل' : 'Assign Detail Code')}
        size="sm"
        footer={
           <>
             <Button variant="ghost" onClick={() => setIsDetailModalOpen(false)}>{t.btn_cancel || (isRtl ? 'انصراف' : 'Cancel')}</Button>
             <Button variant="primary" onClick={handleSaveDetailCode}>{t.btn_save || (isRtl ? 'ذخیره' : 'Save')}</Button>
           </>
        }
      >
         <div className="p-2 space-y-3">
            <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-lg leading-relaxed font-medium">
               {isRtl 
                 ? `در حال تخصیص کد تفصیلی به: ${targetForDetail?.title}` 
                 : `Assigning detail code for: ${targetForDetail?.title}`}
            </div>
            <InputField 
               label={t.detail_code || (isRtl ? 'کد تفصیل' : 'Detail Code')} 
               value={detailCodeInput} 
               onChange={(e) => setDetailCodeInput(e.target.value)} 
               isRtl={isRtl}
               className="dir-ltr text-center font-bold text-lg tracking-wider"
               placeholder="Example: 9001"
               autoFocus
            />
         </div>
      </Modal>
    </div>
  );
};

window.CostCenters = CostCenters;
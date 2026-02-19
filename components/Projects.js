/* Filename: components/Projects.js */
import React, { useState, useEffect, useMemo } from 'react';
import { 
  ListTodo, Search, Plus, Edit, Trash2, Save, Link2, Calendar, Ban 
} from 'lucide-react';

const Projects = ({ t, isRtl }) => {
  const UI = window.UI || {};
  const { Button, InputField, SelectField, DataGrid, FilterSection, Modal, Badge, DatePicker } = UI;
  const supabase = window.supabase;

  // --- Resilient Permission Checks (Level 1 & 2) ---
  const checkAccess = (action = null) => {
    if (!window.hasAccess) return false;
    
    const variations = ['projects', 'project'];
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

  // --- Mock Data for LOV ---
  const mockParties = [
    { id: 101, name: 'علی رضایی' },
    { id: 102, name: 'سارا محمدی' },
    { id: 103, name: 'مهندس اکبری' },
    { id: 104, name: 'شرکت پیمانکاری البرز' },
  ];

  // --- States ---
  const [data, setData] = useState([]);
  const [filters, setFilters] = useState({ code: '', name: '', manager: '' });
  
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
        .from('projects')
        .select('*');

      if (error) throw error;

      const mappedData = (dbData || []).map(item => ({
        id: item.id,
        code: item.code || '',
        name: item.name || '',
        start: item.start_date || '',
        end: item.end_date || '',
        manager: item.manager || '',
        budget: item.budget || '',
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

    if (!formData.code || !formData.name) {
      alert(isRtl ? 'کد و نام پروژه الزامی است.' : 'Project Code and Name are required.');
      return;
    }

    try {
      const payload = {
        code: formData.code,
        name: formData.name,
        start_date: formData.start || null,
        end_date: formData.end || null,
        manager: formData.manager || null,
        budget: formData.budget ? Number(formData.budget) : null,
        is_active: formData.active !== undefined ? formData.active : true
      };

      if (currentRecord && currentRecord.id) {
        const { error } = await supabase
          .schema('gen')
          .from('projects')
          .update(payload)
          .eq('id', currentRecord.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .schema('gen')
          .from('projects')
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
          .from('projects')
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
        .from('projects')
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
  const handleOpenDetailModal = async (row) => {
    if (!canAssignDetail) {
       alert(isRtl ? 'دسترسی غیرمجاز برای تخصیص کد تفصیل' : 'Access Denied for Detail Code Assignment');
       return;
    }
    setTargetForDetail(row);
    
    if (row.detailCode) {
      setDetailCodeInput(row.detailCode);
    } else {
      try {
         const { data, error } = await supabase.schema('gl').from('detail_types').select('*').eq('code', 'sys_project').single();
         if (data) {
             const lastCode = data.last_code;
             const startCode = data.start_code;
             const length = data.numbering_length || 5;
             
             let nextNum;
             if (lastCode && !isNaN(parseInt(lastCode, 10))) {
                 nextNum = parseInt(lastCode, 10) + 1;
             } else if (startCode && !isNaN(parseInt(startCode, 10))) {
                 nextNum = parseInt(startCode, 10);
             } else {
                 nextNum = 1;
             }
             
             setDetailCodeInput(nextNum.toString().padStart(length, '0'));
         } else {
             setDetailCodeInput('');
         }
      } catch (err) {
         console.error('Error fetching detail type numbering:', err);
         setDetailCodeInput('');
      }
    }
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
          .from('projects')
          .update({ detail_code: detailCodeInput || null })
          .eq('id', targetForDetail.id);

        if (error) throw error;

        // Update last_code in detail_types if we are assigning a newly generated code
        if (detailCodeInput && !targetForDetail.detailCode) {
            await supabase.schema('gl').from('detail_types').update({ last_code: detailCodeInput }).eq('code', 'sys_project');
        }

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
      setFormData({ code: '', name: '', start: '', end: '', manager: '', budget: '', detailCode: null, active: true });
    }
    setCurrentRecord(record);
    setIsModalOpen(true);
  };

  // --- Filter Data ---
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchCode = filters.code ? String(item.code || '').toLowerCase().includes(filters.code.toLowerCase()) : true;
      const matchName = filters.name ? String(item.name || '').toLowerCase().includes(filters.name.toLowerCase()) : true;
      const matchManager = filters.manager ? item.manager === filters.manager : true;
      return matchCode && matchName && matchManager;
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
    { field: 'code', header: t.proj_code || (isRtl ? 'کد' : 'Code'), width: 'w-32', sortable: true },
    { field: 'name', header: t.proj_name || (isRtl ? 'عنوان' : 'Name'), width: 'w-48', sortable: true },
    { field: 'start', header: t.proj_start || (isRtl ? 'تاریخ شروع' : 'Start Date'), width: 'w-24', className: 'text-center dir-ltr' },
    { 
       field: 'manager', 
       header: t.proj_manager || (isRtl ? 'مدیر پروژه' : 'Manager'), 
       width: 'w-32',
       render: (row) => row.manager ? <Badge variant="info">{row.manager}</Badge> : '-'
    },
    { 
       field: 'budget', 
       header: t.proj_budget || (isRtl ? 'بودجه' : 'Budget'), 
       width: 'w-32', 
       className: 'text-left font-mono font-bold dir-ltr',
       render: (row) => row.budget ? Number(row.budget).toLocaleString() : '-'
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
            <ListTodo size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800">{t.proj_title || (isRtl ? 'پروژه‌ها' : 'Projects')}</h1>
            <p className="text-xs text-slate-500 font-medium mt-1">{t.proj_subtitle || (isRtl ? 'مدیریت و تعریف پروژه‌های سازمان' : 'Manage organizational projects')}</p>
          </div>
        </div>
      </div>

      <FilterSection 
        isRtl={isRtl} 
        onSearch={() => {}} 
        onClear={() => setFilters({ code: '', name: '', manager: '' })}
      >
        <InputField label={t.proj_code || (isRtl ? 'کد' : 'Code')} placeholder="..." isRtl={isRtl} value={filters.code} onChange={(e) => setFilters(prev => ({ ...prev, code: e.target.value }))} />
        <InputField label={t.proj_name || (isRtl ? 'عنوان' : 'Name')} placeholder="..." isRtl={isRtl} value={filters.name} onChange={(e) => setFilters(prev => ({ ...prev, name: e.target.value }))} />
        <SelectField label={t.proj_manager || (isRtl ? 'مدیر پروژه' : 'Manager')} isRtl={isRtl} value={filters.manager} onChange={(e) => setFilters(prev => ({ ...prev, manager: e.target.value }))}>
           <option value="">{t.all || (isRtl ? 'همه' : 'All')}</option>
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
        title={currentRecord ? (t.proj_edit || (isRtl ? 'ویرایش پروژه' : 'Edit Project')) : (t.proj_new || (isRtl ? 'پروژه جدید' : 'New Project'))}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>{t.btn_cancel || (isRtl ? 'انصراف' : 'Cancel')}</Button>
            <Button variant="primary" icon={Save} onClick={handleSave}>{t.btn_save || (isRtl ? 'ذخیره' : 'Save')}</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
           <InputField label={`${t.proj_code || (isRtl ? 'کد' : 'Code')} *`} value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} isRtl={isRtl} className="dir-ltr" />
           <InputField label={`${t.proj_name || (isRtl ? 'عنوان' : 'Name')} *`} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} isRtl={isRtl} />
           
           <DatePicker label={t.proj_start || (isRtl ? 'تاریخ شروع' : 'Start Date')} value={formData.start} onChange={e => setFormData({...formData, start: e.target.value})} isRtl={isRtl} className="dir-ltr" />
           <DatePicker label={t.proj_end || (isRtl ? 'تاریخ پایان' : 'End Date')} value={formData.end} onChange={e => setFormData({...formData, end: e.target.value})} isRtl={isRtl} className="dir-ltr" />
           
           {/* Manager Selection (LOV) */}
           <SelectField label={t.proj_manager || (isRtl ? 'مدیر پروژه' : 'Manager')} value={formData.manager} onChange={e => setFormData({...formData, manager: e.target.value})} isRtl={isRtl}>
              <option value="">{isRtl ? '- انتخاب کنید -' : '- Select -'}</option>
              {mockParties.map(p => (
                 <option key={p.id} value={p.name}>{p.name}</option>
              ))}
           </SelectField>

           <InputField label={t.proj_budget || (isRtl ? 'بودجه' : 'Budget')} type="number" value={formData.budget} onChange={e => setFormData({...formData, budget: e.target.value})} isRtl={isRtl} className="dir-ltr" />

           <div className={`md:col-span-2 bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between`}>
              <span className="text-sm font-bold text-slate-700">{t.active_status || (isRtl ? 'فعال' : 'Active')}</span>
              <input 
                 type="checkbox" 
                 className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                 checked={formData.active} 
                 onChange={e => setFormData({...formData, active: e.target.checked})} 
              />
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
                 ? `در حال تخصیص کد تفصیلی به: ${targetForDetail?.name}` 
                 : `Assigning detail code for: ${targetForDetail?.name}`}
            </div>
            <InputField 
               label={t.detail_code || (isRtl ? 'کد تفصیل' : 'Detail Code')} 
               value={detailCodeInput} 
               onChange={(e) => setDetailCodeInput(e.target.value)} 
               isRtl={isRtl}
               className="dir-ltr text-center font-bold text-lg tracking-wider"
               placeholder="Example: 8001"
               autoFocus
            />
         </div>
      </Modal>
    </div>
  );
};

window.Projects = Projects;
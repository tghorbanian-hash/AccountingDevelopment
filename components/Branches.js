/* Filename: components/Branches.js 
 * * راهنمای رفع خطای دیتابیس:
 * دلیل اصلی عدم نمایش و خطای ذخیره اطلاعات، یکی از دو مورد زیر است:
 * 1. فعال بودن سیستم امنیتی (RLS) روی جدول. برای رفع آن کد زیر را در دیتابیس اجرا کنید:
 * ALTER TABLE gen.branches DISABLE ROW LEVEL SECURITY;
 * 2. عدم وجود ستون created_at یا تفاوت نام فیلدها.
 * * در این نسخه از کد، سیستم مدیریت خطای بسیار قدرتمندی اضافه شده است. در صورت بروز هرگونه 
 * مشکل، خطای دقیق صادر شده از دیتابیس روی صفحه (Alert) نمایش داده می‌شود تا دقیقاً بدانید مشکل کجاست.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { 
  MapPin, Search, Plus, Edit, Trash2, Save, CheckCircle2, Ban, Link2
} from 'lucide-react';

const Branches = ({ t, isRtl }) => {
  const UI = window.UI || {};
  const { Button, InputField, SelectField, DataGrid, FilterSection, Modal, Badge } = UI;
  const supabase = window.supabase;

  // --- Resilient Permission Checks (Level 1 & 2) ---
  const checkAccess = (action = null) => {
    if (!window.hasAccess) return false;
    
    const variations = ['branches', 'branch'];
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
  const [filters, setFilters] = useState({ code: '', title: '', isDefault: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [formData, setFormData] = useState({});

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

      const { data: branchesData, error } = await supabase
        .schema('gen')
        .from('branches')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch detail instances for branches to map detail codes
      const { data: detailsData, error: dErr } = await supabase
        .schema('gl')
        .from('detail_instances')
        .select('*')
        .eq('ref_entity_name', 'gen.branches');

      if (dErr) throw dErr;

      const mappedData = (branchesData || []).map(item => {
        const detailInst = (detailsData || []).find(d => d.entity_code === item.code);
        return {
          id: item.id,
          code: item.code,
          title: item.title,
          address: item.address || '',
          active: item.is_active,
          isDefault: item.is_default,
          detailCode: detailInst ? detailInst.detail_code : null,
          detailInstanceId: detailInst ? detailInst.id : null
        };
      });
      
      setData(mappedData);
    } catch (err) {
      console.error('Error fetching data:', err);
      alert((isRtl ? 'خطا در دریافت اطلاعات دیتابیس: ' : 'Fetch Error: ') + (err.message || err));
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
      alert(isRtl ? 'کد و عنوان شعبه الزامی است.' : 'Code and Title are required.');
      return;
    }

    try {
      if (formData.isDefault) {
        const { error: defErr } = await supabase
          .schema('gen')
          .from('branches')
          .update({ is_default: false })
          .not('id', 'is', null);
        if (defErr) console.warn("Warning: Could not reset existing defaults:", defErr);
      }

      const payload = {
        code: formData.code,
        title: formData.title,
        address: formData.address || null,
        is_active: formData.active !== undefined ? formData.active : true,
        is_default: formData.isDefault !== undefined ? formData.isDefault : false
      };

      if (currentRecord && currentRecord.id) {
        const { error } = await supabase
          .schema('gen')
          .from('branches')
          .update(payload)
          .eq('id', currentRecord.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .schema('gen')
          .from('branches')
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
          .from('branches')
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
        .from('branches')
        .update({ is_active: newVal })
        .eq('id', id);
      
      if (error) throw error;
      fetchData();
    } catch (err) {
      console.error('Error updating status:', err);
      alert((isRtl ? 'خطا در تغییر وضعیت: ' : 'Status Update Error: ') + (err.message || err));
    }
  };

  const handleSetDefault = async (row) => {
    if (!canEdit) {
       alert(isRtl ? 'دسترسی غیرمجاز برای ویرایش' : 'Access Denied for Edit');
       return;
    }
    if (row.isDefault) return; 
    
    if (confirm(t.br_default_msg || (isRtl ? 'آیا شعبه پیش‌فرض تغییر کند؟' : 'Change default branch?'))) {
       try {
         await supabase.schema('gen').from('branches').update({ is_default: false }).not('id', 'is', null); 
         const { error } = await supabase.schema('gen').from('branches').update({ is_default: true }).eq('id', row.id);
         if (error) throw error;
         fetchData();
       } catch (err) {
         console.error('Error changing default:', err);
         alert((isRtl ? 'خطا در تغییر شعبه پیش‌فرض: ' : 'Default Branch Error: ') + (err.message || err));
       }
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
         const { data, error } = await supabase.schema('gl').from('detail_types').select('*').eq('code', 'sys_branch').single();
         if (data) {
             const lastCode = data.last_code;
             const startCode = data.start_code;
             const length = data.numbering_length || 3;
             
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
    if (!targetForDetail) return;

    const codeValue = detailCodeInput || null;

    try {
      if (targetForDetail.detailInstanceId) {
        const { error } = await supabase
          .schema('gl')
          .from('detail_instances')
          .update({ detail_code: codeValue, title: targetForDetail.title })
          .eq('id', targetForDetail.detailInstanceId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .schema('gl')
          .from('detail_instances')
          .insert([{
            detail_type_code: 'sys_branch',
            entity_code: targetForDetail.code,
            title: targetForDetail.title,
            detail_code: codeValue,
            ref_entity_name: 'gen.branches'
          }]);

        if (error) throw error;
      }

      if (codeValue && !targetForDetail.detailCode) {
          await supabase.schema('gl').from('detail_types').update({ last_code: codeValue }).eq('code', 'sys_branch');
      }

      setIsDetailModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error assigning detail code:', err);
      alert(isRtl ? 'خطا در تخصیص کد تفصیل' : 'Error assigning detail code');
    }
  };

  // --- Filter Data ---
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
      setFormData({ code: '', title: '', address: '', active: true, isDefault: false });
    }
    setCurrentRecord(record);
    setIsModalOpen(true);
  };

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
    { field: 'code', header: t.br_code || (isRtl ? 'کد' : 'Code'), width: 'w-24', sortable: true },
    { field: 'title', header: t.br_title_field || (isRtl ? 'عنوان شعبه' : 'Branch Title'), width: 'w-48', sortable: true },
    { field: 'address', header: t.br_addr || (isRtl ? 'آدرس' : 'Address'), width: 'w-64' },
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
       field: 'isDefault', 
       header: t.br_default || (isRtl ? 'پیش‌فرض' : 'Default'), 
       width: 'w-24', 
       render: (row) => (
          <div className="flex justify-center">
             <button 
                onClick={() => handleSetDefault(row)} 
                className={`p-1 rounded-full transition-all ${row.isDefault ? 'bg-indigo-100 text-indigo-600' : 'text-slate-300 hover:text-indigo-400'}`}
                title={t.br_set_default || (isRtl ? 'انتخاب به عنوان پیش‌فرض' : 'Set as default')}
             >
                <CheckCircle2 size={18} strokeWidth={row.isDefault ? 2.5 : 2} />
             </button>
          </div>
       )
    },
    { 
       field: 'active', 
       header: t.active_status || (isRtl ? 'فعال' : 'Active'), 
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
            <MapPin size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800">{t.br_title || (isRtl ? 'شعب' : 'Branches')}</h1>
            <p className="text-xs text-slate-500 font-medium mt-1">{t.br_subtitle || (isRtl ? 'مدیریت شعب سازمان' : 'Manage organization branches')}</p>
          </div>
        </div>
      </div>

      <FilterSection 
        isRtl={isRtl} 
        onSearch={() => {}} 
        onClear={() => setFilters({ code: '', title: '', isDefault: '' })}
      >
        <InputField label={t.br_code || (isRtl ? 'کد' : 'Code')} placeholder="..." isRtl={isRtl} value={filters.code} onChange={(e) => setFilters(prev => ({ ...prev, code: e.target.value }))} />
        <InputField label={t.br_title_field || (isRtl ? 'عنوان شعبه' : 'Branch Title')} placeholder="..." isRtl={isRtl} value={filters.title} onChange={(e) => setFilters(prev => ({ ...prev, title: e.target.value }))} />
        <SelectField label={t.br_default || (isRtl ? 'پیش‌فرض' : 'Default')} isRtl={isRtl} value={filters.isDefault} onChange={(e) => setFilters(prev => ({ ...prev, isDefault: e.target.value }))}>
           <option value="">{t.all || (isRtl ? 'همه' : 'All')}</option>
           <option value="yes">{t.opt_active || (isRtl ? 'بله' : 'Yes')}</option>
           <option value="no">{t.opt_inactive || (isRtl ? 'خیر' : 'No')}</option>
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

      <Modal 
        isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} 
        title={currentRecord ? (t.br_edit || (isRtl ? 'ویرایش شعبه' : 'Edit Branch')) : (t.br_new || (isRtl ? 'شعبه جدید' : 'New Branch'))}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>{t.btn_cancel || (isRtl ? 'انصراف' : 'Cancel')}</Button>
            <Button variant="primary" icon={Save} onClick={handleSave}>{t.btn_save || (isRtl ? 'ذخیره' : 'Save')}</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
           <InputField label={`${t.br_code || (isRtl ? 'کد' : 'Code')} *`} value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} isRtl={isRtl} className="dir-ltr" />
           <InputField label={`${t.br_title_field || (isRtl ? 'عنوان شعبه' : 'Branch Title')} *`} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} isRtl={isRtl} />
           
           <div className="md:col-span-2">
              <InputField label={t.br_addr || (isRtl ? 'آدرس' : 'Address')} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} isRtl={isRtl} />
           </div>

           <div className="md:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 gap-4">
              <div className={`flex items-center justify-between ${isRtl ? 'border-l pl-4' : 'border-r pr-4'} border-slate-200`}>
                 <span className="text-sm font-bold text-slate-700">{t.active_status || (isRtl ? 'فعال' : 'Active')}</span>
                 <input 
                   type="checkbox" 
                   className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                   checked={formData.active} 
                   onChange={e => setFormData({...formData, active: e.target.checked})} 
                 />
              </div>
              <div className="flex items-center justify-between">
                 <span className="text-sm font-bold text-slate-700">{t.br_default || (isRtl ? 'پیش‌فرض' : 'Default')}</span>
                 <input 
                   type="checkbox" 
                   className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                   checked={formData.isDefault} 
                   onChange={e => setFormData({...formData, isDefault: e.target.checked})} 
                 />
              </div>
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
               placeholder="Example: 101"
               autoFocus
            />
         </div>
      </Modal>
    </div>
  );
};

window.Branches = Branches;
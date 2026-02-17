/* Filename: financial/generalledger/Ledgers.js */
import React, { useState, useEffect, useMemo } from 'react';
import { Edit, Trash2, ShieldCheck, BookOpen, Ban } from 'lucide-react';

const Ledgers = ({ t, isRtl }) => {
  const UI = window.UI || {};
  const { 
    Button, InputField, SelectField, DataGrid, 
    FilterSection, Modal, Badge, Callout 
  } = UI;
  const supabase = window.supabase;

  // --- Resilient Permission Checks ---
  const checkAccess = (action = null) => {
    if (!window.hasAccess) return false;
    const variations = ['ledgers', 'ledger'];
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
  const [ledgers, setLedgers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [searchParams, setSearchParams] = useState({ code: '', title: '' });
  const [selectedIds, setSelectedIds] = useState([]);

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

      const { data, error } = await supabase
        .schema('gl')
        .from('ledgers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedData = (data || []).map(item => ({
        id: item.id,
        code: item.code || '',
        title: item.title || '',
        structure: item.structure || '',
        currency: item.currency || 'IRR',
        isMain: item.is_main || false,
        isActive: item.is_active !== undefined ? item.is_active : true,
      }));
      
      setLedgers(mappedData);
    } catch (err) {
      console.error('Error fetching data:', err);
      alert((isRtl ? 'خطا در دریافت اطلاعات: ' : 'Fetch Error: ') + (err.message || err));
    }
  };

  const handleSave = async () => {
    if (editingItem && editingItem.id && !canEdit) {
      alert(t.err_access_denied || (isRtl ? 'دسترسی غیرمجاز برای ویرایش' : 'Access Denied for Edit'));
      return;
    }
    if ((!editingItem || !editingItem.id) && !canCreate) {
      alert(t.err_access_denied || (isRtl ? 'دسترسی غیرمجاز برای ایجاد' : 'Access Denied for Create'));
      return;
    }

    if (!formData.code || !formData.title || !formData.structure) {
      alert(t.alert_req_fields || (isRtl ? 'لطفاً فیلدهای اجباری را پر کنید.' : 'Please fill required fields.'));
      return;
    }

    try {
      // If this ledger is set to Main, remove Main status from all others first
      if (formData.isMain) {
        const { error: resetErr } = await supabase
          .schema('gl')
          .from('ledgers')
          .update({ is_main: false })
          .neq('id', editingItem?.id || 0);
          
        if (resetErr) throw resetErr;
      }

      const payload = {
        code: formData.code,
        title: formData.title,
        structure: formData.structure,
        currency: formData.currency,
        is_main: formData.isMain,
        is_active: formData.isActive
      };

      if (editingItem && editingItem.id) {
        const { error } = await supabase
          .schema('gl')
          .from('ledgers')
          .update(payload)
          .eq('id', editingItem.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .schema('gl')
          .from('ledgers')
          .insert([payload]);

        if (error) throw error;
      }

      setShowModal(false);
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
    if (window.confirm(confirmMsg)) {
      try {
        const { error } = await supabase
          .schema('gl')
          .from('ledgers')
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
        .schema('gl')
        .from('ledgers')
        .update({ is_active: newVal })
        .eq('id', id);
      
      if (error) throw error;
      fetchData();
    } catch (err) {
      console.error('Error updating status:', err);
      alert((isRtl ? 'خطا در تغییر وضعیت: ' : 'Status Update Error: ') + (err.message || err));
    }
  };

  // --- Actions ---
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

  // --- Filtering Logic for DataGrid ---
  const filteredData = useMemo(() => {
    return ledgers.filter(item => {
      const matchCode = item.code.toLowerCase().includes(searchParams.code.toLowerCase());
      const matchTitle = item.title.toLowerCase().includes(searchParams.title.toLowerCase());
      return matchCode && matchTitle;
    });
  }, [ledgers, searchParams]);

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

  // --- Columns Definition ---
  const columns = [
    { field: 'code', header: t.lg_code || (isRtl ? 'کد دفتر' : 'Code'), width: 'w-24', sortable: true },
    { field: 'title', header: t.lg_title || (isRtl ? 'عنوان دفتر' : 'Title'), width: 'w-64', sortable: true },
    { 
      field: 'structure', 
      header: t.lg_structure || (isRtl ? 'ساختار حساب‌ها' : 'Structure'), 
      width: 'w-48',
      render: (row) => structureOptions.find(o => o.value === row.structure)?.label || row.structure
    },
    { field: 'currency', header: t.lg_currency || (isRtl ? 'ارز' : 'Currency'), width: 'w-24' },
    { 
      field: 'isMain', 
      header: t.lg_main || (isRtl ? 'دفتر اصلی' : 'Main'), 
      width: 'w-24', 
      render: (row) => (
        <div className="flex justify-center text-indigo-600">
           {row.isMain ? <ShieldCheck size={18} /> : <span className="text-slate-300">-</span>}
        </div>
      )
    },
    { 
      field: 'isActive', 
      header: t.lg_status || (isRtl ? 'وضعیت' : 'Status'), 
      width: 'w-24',
      render: (row) => (
         <div className="flex justify-center">
             <input 
               type="checkbox" 
               className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
               checked={row.isActive} 
               onChange={(e) => handleToggleActive(row.id, e.target.checked)} 
             />
         </div>
      )
    },
  ];

  return (
    <div className={`h-full flex flex-col p-4 md:p-6 bg-slate-50/50 ${isRtl ? 'font-vazir' : 'font-sans'}`}>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200">
            <BookOpen size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800">{t.ledgers_title || (isRtl ? 'دفاتر کل' : 'General Ledgers')}</h1>
            <p className="text-xs text-slate-500 font-medium mt-1">{t.ledgers_subtitle || (isRtl ? 'مدیریت و تعریف دفاتر حسابداری' : 'Manage accounting ledgers')}</p>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <FilterSection onSearch={() => {}} onClear={handleClearSearch} isRtl={isRtl} title={t.filter || (isRtl ? 'فیلترها' : 'Filters')}>
        <InputField 
          label={t.lg_code || (isRtl ? 'کد دفتر' : 'Code')} 
          value={searchParams.code} 
          onChange={e => setSearchParams({...searchParams, code: e.target.value})}
          isRtl={isRtl}
        />
        <InputField 
          label={t.lg_title || (isRtl ? 'عنوان دفتر' : 'Title')} 
          value={searchParams.title} 
          onChange={e => setSearchParams({...searchParams, title: e.target.value})}
          isRtl={isRtl}
        />
      </FilterSection>

      {/* Data Grid */}
      <div className="flex-1 min-h-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <DataGrid 
          columns={columns}
          data={filteredData}
          selectedIds={selectedIds}
          onSelectRow={(id, checked) => setSelectedIds(prev => checked ? [...prev, id] : prev.filter(i => i !== id))}
          onSelectAll={(checked) => setSelectedIds(checked ? filteredData.map(i => i.id) : [])}
          onCreate={canCreate ? handleCreate : undefined}
          onDelete={canDelete ? handleDelete : undefined}
          onDoubleClick={canEdit ? handleEdit : undefined}
          isRtl={isRtl}
          actions={(row) => (
            <>
              {canEdit && <Button variant="ghost" size="iconSm" icon={Edit} onClick={() => handleEdit(row)} title={t.edit || (isRtl ? 'ویرایش' : 'Edit')} />}
              {canDelete && <Button variant="ghost" size="iconSm" icon={Trash2} onClick={() => handleDelete([row.id])} title={t.delete || (isRtl ? 'حذف' : 'Delete')} className="text-red-500 hover:text-red-700 hover:bg-red-50" />}
            </>
          )}
        />
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingItem ? (t.lg_edit || (isRtl ? 'ویرایش دفتر' : 'Edit Ledger')) : (t.lg_new || (isRtl ? 'دفتر جدید' : 'New Ledger'))}
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowModal(false)}>{t.btn_cancel || (isRtl ? 'انصراف' : 'Cancel')}</Button>
            <Button variant="primary" onClick={handleSave}>{t.btn_save || (isRtl ? 'ذخیره' : 'Save')}</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
           {/* Row 1: Code & Title */}
           <InputField 
             label={`${t.lg_code || (isRtl ? 'کد دفتر' : 'Code')} *`} 
             value={formData.code} 
             onChange={e => setFormData({...formData, code: e.target.value})}
             isRtl={isRtl}
             placeholder="e.g. 10"
             className="dir-ltr"
           />
           <InputField 
             label={`${t.lg_title || (isRtl ? 'عنوان دفتر' : 'Title')} *`} 
             value={formData.title} 
             onChange={e => setFormData({...formData, title: e.target.value})}
             isRtl={isRtl}
             placeholder="e.g. Central Ledger"
           />
           
           {/* Row 2: Structure & Currency */}
           <SelectField 
             label={`${t.lg_structure || (isRtl ? 'ساختار حساب‌ها' : 'Structure')} *`} 
             value={formData.structure}
             onChange={e => setFormData({...formData, structure: e.target.value})}
             isRtl={isRtl}
           >
              <option value="">{t.lg_structure_ph || (isRtl ? '- انتخاب کنید -' : '- Select -')}</option>
              {structureOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
           </SelectField>

           <SelectField 
             label={`${t.lg_currency || (isRtl ? 'ارز مبنا' : 'Currency')} *`} 
             value={formData.currency}
             onChange={e => setFormData({...formData, currency: e.target.value})}
             isRtl={isRtl}
           >
              {currencyOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
           </SelectField>

           {/* Row 3: Checkboxes */}
           <div className="md:col-span-2 grid grid-cols-2 gap-5">
              <div className={`flex items-center justify-between h-[50px] bg-slate-50 border border-slate-200 rounded-lg ${isRtl ? 'pr-4 pl-3' : 'pl-4 pr-3'}`}>
                 <span className="text-sm font-bold text-slate-700">{t.lg_main || (isRtl ? 'دفتر اصلی' : 'Main Ledger')}</span>
                 <input 
                   type="checkbox" 
                   className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                   checked={formData.isMain} 
                   onChange={e => setFormData({...formData, isMain: e.target.checked})} 
                 />
              </div>

              <div className={`flex items-center justify-between h-[50px] bg-slate-50 border border-slate-200 rounded-lg ${isRtl ? 'pr-4 pl-3' : 'pl-4 pr-3'}`}>
                 <span className="text-sm font-bold text-slate-700">{t.active_status || (isRtl ? 'فعال' : 'Active')}</span>
                 <input 
                   type="checkbox" 
                   className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                   checked={formData.isActive} 
                   onChange={e => setFormData({...formData, isActive: e.target.checked})} 
                 />
              </div>
           </div>

           {formData.isMain && (
             <div className="md:col-span-2">
               <Callout variant="warning" title={t.lg_main || (isRtl ? 'دفتر اصلی' : 'Main Ledger')}>
                  {isRtl ? 'با انتخاب این گزینه، این دفتر به عنوان دفتر اصلی سیستم شناخته شده و تیک دفتر اصلی از سایر دفاتر به صورت خودکار برداشته می‌شود.' : 'Setting this as Main Ledger will unset the Main flag from other ledgers automatically.'}
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
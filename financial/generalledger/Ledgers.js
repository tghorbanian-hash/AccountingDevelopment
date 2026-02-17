
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Edit, Trash2, ShieldCheck, BookOpen, Ban, Search, X } from 'lucide-react';

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

  // --- State ---
  const [ledgers, setLedgers] = useState([]);
  const [structures, setStructures] = useState([]); 
  const [currencies, setCurrencies] = useState([]);
  
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [searchParams, setSearchParams] = useState({ code: '', title: '' });
  const [selectedIds, setSelectedIds] = useState([]);

  // Searchable LOV States for Structure
  const [isStructOpen, setIsStructOpen] = useState(false);
  const [structSearch, setStructSearch] = useState('');
  const structRef = useRef(null);

  // --- Effects ---
  useEffect(() => {
    if (canView) {
      fetchData();
      fetchStructures();
      fetchCurrencies();
    }
  }, [canView]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (structRef.current && !structRef.current.contains(event.target)) {
        setIsStructOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- DB Operations ---
  const fetchCurrencies = async () => {
    try {
      const { data, error } = await supabase.schema('gen').from('currencies').select('*').eq('is_active', true);
      if (error) throw error;
      setCurrencies(data || []);
    } catch (err) {
      console.error('Error fetching currencies:', err);
    }
  };

  const fetchStructures = async () => {
    try {
      const { data, error } = await supabase.schema('gl').from('account_structures').select('*').eq('status', true);
      if (error) throw error;
      setStructures(data || []);
    } catch (err) {
      console.error('Error fetching structures:', err);
    }
  };

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
        currency: item.currency || '',
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

    if (!formData.code || !formData.title || !formData.structure || !formData.currency) {
      alert(t.alert_req_fields || (isRtl ? 'لطفاً فیلدهای اجباری را پر کنید.' : 'Please fill required fields.'));
      return;
    }

    try {
      if (formData.isMain) {
        const { error: resetErr } = await supabase.schema('gl').from('ledgers').update({ is_main: false }).neq('id', editingItem?.id || 0);
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
        const { error } = await supabase.schema('gl').from('ledgers').update(payload).eq('id', editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.schema('gl').from('ledgers').insert([payload]);
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
        const { error } = await supabase.schema('gl').from('ledgers').delete().in('id', ids);
        if (error) throw error;
        setSelectedIds([]);
        fetchData();
      } catch (err) {
        console.error('Error deleting data:', err);
      }
    }
  };

  const handleToggleActive = async (id, newVal) => {
    if (!canEdit) return;
    try {
      await supabase.schema('gl').from('ledgers').update({ is_active: newVal }).eq('id', id);
      fetchData();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  // --- Actions ---
  const handleClearSearch = () => {
    setSearchParams({ code: '', title: '' });
  };

  const handleCreate = () => {
    setEditingItem(null);
    setFormData({ code: '', title: '', structure: '', currency: '', isMain: false, isActive: true });
    setStructSearch('');
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({ ...item });
    const str = structures.find(s => s.code === item.structure);
    setStructSearch(str ? `${str.title} (${str.code})` : item.structure);
    setShowModal(true);
  };

  // --- Logic ---
  const filteredData = useMemo(() => {
    return ledgers.filter(item => {
      const matchCode = item.code.toLowerCase().includes(searchParams.code.toLowerCase());
      const matchTitle = item.title.toLowerCase().includes(searchParams.title.toLowerCase());
      return matchCode && matchTitle;
    });
  }, [ledgers, searchParams]);

  const filteredStructures = useMemo(() => {
     return structures.filter(s => 
        (s.title && s.title.toLowerCase().includes(structSearch.toLowerCase())) ||
        (s.code && s.code.toLowerCase().includes(structSearch.toLowerCase()))
     );
  }, [structures, structSearch]);

  // --- Views ---
  if (!canView) {
    return (
      <div className={`flex flex-col items-center justify-center h-full bg-slate-50/50 ${isRtl ? 'font-vazir' : 'font-sans'}`}>
        <div className="p-6 bg-white rounded-2xl shadow-sm text-center border border-red-100">
           <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4"><Ban className="text-red-500" size={32} /></div>
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
      render: (row) => {
         const str = structures.find(s => s.code === row.structure);
         return str ? str.title : row.structure;
      }
    },
    { 
      field: 'currency', 
      header: t.lg_currency || (isRtl ? 'ارز' : 'Currency'), 
      width: 'w-24',
      render: (row) => {
         const curr = currencies.find(c => c.code === row.currency);
         return curr ? `${curr.title} (${curr.code})` : row.currency;
      }
    },
    { 
      field: 'isMain', 
      header: t.lg_main || (isRtl ? 'دفتر اصلی' : 'Main'), 
      width: 'w-24', 
      render: (row) => (<div className="flex justify-center text-indigo-600">{row.isMain ? <ShieldCheck size={18} /> : <span className="text-slate-300">-</span>}</div>)
    },
    { 
      field: 'isActive', 
      header: t.lg_status || (isRtl ? 'وضعیت' : 'Status'), 
      width: 'w-24',
      render: (row) => (<div className="flex justify-center"><input type="checkbox" className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer" checked={row.isActive} onChange={(e) => handleToggleActive(row.id, e.target.checked)} /></div>)
    },
  ];

  return (
    <div className={`h-full flex flex-col p-4 md:p-6 bg-slate-50/50 ${isRtl ? 'font-vazir' : 'font-sans'}`}>
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

      <FilterSection onSearch={() => {}} onClear={handleClearSearch} isRtl={isRtl} title={t.filter || (isRtl ? 'فیلترها' : 'Filters')}>
        <InputField label={t.lg_code || (isRtl ? 'کد دفتر' : 'Code')} value={searchParams.code} onChange={e => setSearchParams({...searchParams, code: e.target.value})} isRtl={isRtl} />
        <InputField label={t.lg_title || (isRtl ? 'عنوان دفتر' : 'Title')} value={searchParams.title} onChange={e => setSearchParams({...searchParams, title: e.target.value})} isRtl={isRtl} />
      </FilterSection>

      <div className="flex-1 min-h-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <DataGrid 
          columns={columns} data={filteredData} selectedIds={selectedIds}
          onSelectRow={(id, checked) => setSelectedIds(prev => checked ? [...prev, id] : prev.filter(i => i !== id))}
          onSelectAll={(checked) => setSelectedIds(checked ? filteredData.map(i => i.id) : [])}
          onCreate={canCreate ? handleCreate : undefined} onDelete={canDelete ? handleDelete : undefined} onDoubleClick={canEdit ? handleEdit : undefined}
          isRtl={isRtl}
          actions={(row) => (
            <>
              {canEdit && <Button variant="ghost" size="iconSm" icon={Edit} onClick={() => handleEdit(row)} title={t.edit || (isRtl ? 'ویرایش' : 'Edit')} />}
              {canDelete && <Button variant="ghost" size="iconSm" icon={Trash2} onClick={() => handleDelete([row.id])} title={t.delete || (isRtl ? 'حذف' : 'Delete')} className="text-red-500 hover:text-red-700 hover:bg-red-50" />}
            </>
          )}
        />
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingItem ? (t.lg_edit || (isRtl ? 'ویرایش دفتر' : 'Edit Ledger')) : (t.lg_new || (isRtl ? 'دفتر جدید' : 'New Ledger'))}
        footer={<><Button variant="ghost" onClick={() => setShowModal(false)}>{t.btn_cancel || (isRtl ? 'انصراف' : 'Cancel')}</Button><Button variant="primary" onClick={handleSave}>{t.btn_save || (isRtl ? 'ذخیره' : 'Save')}</Button></>}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
           <InputField label={`${t.lg_code || (isRtl ? 'کد دفتر' : 'Code')} *`} value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} isRtl={isRtl} className="dir-ltr" />
           <InputField label={`${t.lg_title || (isRtl ? 'عنوان دفتر' : 'Title')} *`} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} isRtl={isRtl} />
           
           {/* Searchable LOV for Structure */}
           <div className="relative" ref={structRef}>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">{`${t.lg_structure || (isRtl ? 'ساختار حساب‌ها' : 'Structure')} *`}</label>
              <div className="relative">
                  <input
                     className={`w-full h-9 bg-white border border-slate-200 rounded text-xs outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all ${isRtl ? 'pr-2 pl-8' : 'pl-2 pr-8'}`}
                     placeholder={isRtl ? "جستجو..." : "Search..."}
                     value={structSearch}
                     onChange={e => { setStructSearch(e.target.value); setFormData({...formData, structure: ''}); setIsStructOpen(true); }}
                     onFocus={() => setIsStructOpen(true)}
                  />
                  {formData.structure ? (
                     <X size={14} className={`absolute top-2.5 text-slate-400 cursor-pointer hover:text-red-500 ${isRtl ? 'left-2.5' : 'right-2.5'}`} onClick={() => { setFormData({...formData, structure: ''}); setStructSearch(''); }} />
                  ) : (
                     <Search size={14} className={`absolute top-2.5 text-slate-400 ${isRtl ? 'left-2.5' : 'right-2.5'}`} />
                  )}
              </div>
              {isStructOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg z-[100] max-h-48 overflow-y-auto p-1">
                     {filteredStructures.length > 0 ? filteredStructures.map(str => (
                        <div key={str.id} className="px-3 py-2 text-xs cursor-pointer hover:bg-indigo-50 rounded flex flex-col transition-colors border-b border-slate-50 last:border-0" onClick={() => {
                           setFormData({...formData, structure: str.code});
                           setStructSearch(`${str.title} (${str.code})`);
                           setIsStructOpen(false);
                        }}>
                           <span className="font-bold text-slate-700">{str.title}</span>
                           <span className="text-[10px] font-mono text-slate-400">{str.code}</span>
                        </div>
                     )) : <div className="p-3 text-center text-slate-400 text-xs">{isRtl ? 'موردی یافت نشد.' : 'No items found.'}</div>}
                  </div>
              )}
           </div>

           {/* Currencies Dropdown (from DB) */}
           <SelectField label={`${t.lg_currency || (isRtl ? 'ارز مبنا' : 'Currency')} *`} value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})} isRtl={isRtl}>
              <option value="">{isRtl ? '- انتخاب کنید -' : '- Select -'}</option>
              {currencies.map(opt => <option key={opt.id} value={opt.code}>{opt.title} ({opt.code})</option>)}
           </SelectField>

           <div className="md:col-span-2 grid grid-cols-2 gap-5">
              <div className={`flex items-center justify-between h-[50px] bg-slate-50 border border-slate-200 rounded-lg ${isRtl ? 'pr-4 pl-3' : 'pl-4 pr-3'}`}>
                 <span className="text-sm font-bold text-slate-700">{t.lg_main || (isRtl ? 'دفتر اصلی' : 'Main Ledger')}</span>
                 <input type="checkbox" className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer" checked={formData.isMain} onChange={e => setFormData({...formData, isMain: e.target.checked})} />
              </div>
              <div className={`flex items-center justify-between h-[50px] bg-slate-50 border border-slate-200 rounded-lg ${isRtl ? 'pr-4 pl-3' : 'pl-4 pr-3'}`}>
                 <span className="text-sm font-bold text-slate-700">{t.active_status || (isRtl ? 'فعال' : 'Active')}</span>
                 <input type="checkbox" className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} />
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
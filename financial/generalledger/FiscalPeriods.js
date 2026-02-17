/* Filename: financial/generalledger/FiscalPeriods.js */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  CalendarDays, Calendar, Plus, Edit, Trash2, 
  Save, ShieldAlert, Check, X, Search, Ban, Lock, Unlock 
} from 'lucide-react';

const FiscalPeriods = ({ t, isRtl }) => {
  const UI = window.UI || {};
  const { 
    Button, InputField, SelectField, DataGrid, 
    FilterSection, Modal, Badge, DatePicker 
  } = UI;
  const supabase = window.supabase;

  // --- Permission Checks ---
  const checkAccess = (action = null) => {
    if (!window.hasAccess) return false;
    const variations = ['fiscal_periods', 'fiscalperiods', 'periods'];
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
  const canManagePeriods = checkAccess('manage_periods');

  // --- States ---
  const [years, setYears] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [exceptions, setExceptions] = useState([]);
  const [users, setUsers] = useState([]);

  // Modals & Selections
  const [isYearModalOpen, setIsYearModalOpen] = useState(false);
  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);
  const [isExceptionModalOpen, setIsExceptionModalOpen] = useState(false);

  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(null);

  // Forms
  const [yearForm, setYearForm] = useState({ id: null, title: '', startDate: '', endDate: '', status: 'open', isActive: true });
  const [periodForm, setPeriodForm] = useState({ id: null, title: '', startDate: '', endDate: '', status: 'open' });
  const [excFormUser, setExcFormUser] = useState(''); // Holds User ID

  // Search Filters
  const [yearSearch, setYearSearch] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef(null);

  // --- Effects ---
  useEffect(() => {
    if (canView) {
      fetchYears();
      fetchUsers();
    }
  }, [canView]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- DB Operations ---
  const cleanDate = (d) => {
    if (!d) return null;
    const trimmed = String(d).trim().replace(/\//g, '-');
    return trimmed === '' ? null : trimmed;
  };

  const fetchYears = async () => {
    try {
      const { data, error } = await supabase.schema('gl').from('fiscal_years').select('*').order('start_date', { ascending: false });
      if (error) throw error;
      setYears(data || []);
    } catch (err) {
      console.error(err);
      alert(isRtl ? 'خطا در دریافت سال‌های مالی' : 'Error fetching fiscal years');
    }
  };

  const fetchPeriods = async (yearId) => {
    try {
      const { data, error } = await supabase.schema('gl').from('fiscal_periods').select('*').eq('year_id', yearId).order('start_date', { ascending: true });
      if (error) throw error;
      setPeriods(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      // Assuming gen.users exists with these exact columns based on standard structure
      const { data, error } = await supabase.schema('gen').from('users').select('id, username, full_name').eq('is_active', true);
      if (!error && data) setUsers(data);
    } catch (err) {
      console.error('Fetch users error:', err);
    }
  };

  const fetchExceptions = async (periodId) => {
    try {
      const { data, error } = await supabase.schema('gl').from('fiscal_period_exceptions').select('*').eq('period_id', periodId);
      if (error) throw error;
      setExceptions(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  // --- Year Handlers ---
  const filteredYears = useMemo(() => {
    return years.filter(y => y.title.toLowerCase().includes(yearSearch.toLowerCase()));
  }, [years, yearSearch]);

  const handleOpenYearModal = (year = null) => {
    if (year && !canEdit) return alert(isRtl ? 'دسترسی ویرایش ندارید' : 'Access Denied');
    if (!year && !canCreate) return alert(isRtl ? 'دسترسی ایجاد ندارید' : 'Access Denied');
    
    if (year) {
      setYearForm({ id: year.id, title: year.title, startDate: year.start_date, endDate: year.end_date, status: year.status, isActive: year.is_active });
    } else {
      setYearForm({ id: null, title: '', startDate: '', endDate: '', status: 'open', isActive: true });
    }
    setIsYearModalOpen(true);
  };

  const handleSaveYear = async () => {
    if (!yearForm.title || !yearForm.startDate || !yearForm.endDate) {
      return alert(isRtl ? 'تکمیل عنوان و تاریخ‌ها الزامی است.' : 'Title and dates are required.');
    }

    const payload = {
      title: yearForm.title.trim(),
      start_date: cleanDate(yearForm.startDate),
      end_date: cleanDate(yearForm.endDate),
      status: yearForm.status,
      is_active: yearForm.isActive
    };

    try {
      if (yearForm.id) {
        const { error } = await supabase.schema('gl').from('fiscal_years').update(payload).eq('id', yearForm.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.schema('gl').from('fiscal_years').insert([payload]);
        if (error) throw error;
      }
      setIsYearModalOpen(false);
      fetchYears();
    } catch (err) {
      console.error(err);
      if (err.code === '22008') alert(isRtl ? 'فرمت تاریخ نامعتبر است.' : 'Invalid Date Format.');
      else alert(isRtl ? 'خطا در ذخیره اطلاعات' : 'Save Error');
    }
  };

  const handleDeleteYear = async (ids) => {
    if (!canDelete) return alert(isRtl ? 'دسترسی حذف ندارید' : 'Access Denied');
    if (confirm(t.confirm_delete?.replace('{0}', ids.length) || `Delete ${ids.length} items?`)) {
      try {
        const { error } = await supabase.schema('gl').from('fiscal_years').delete().in('id', ids);
        if (error) throw error;
        fetchYears();
      } catch (err) { console.error(err); }
    }
  };

  const handleToggleYearActive = async (id, currentVal) => {
    if (!canEdit) return;
    try {
      await supabase.schema('gl').from('fiscal_years').update({ is_active: !currentVal }).eq('id', id);
      fetchYears();
    } catch(err) { console.error(err); }
  };

  // --- Period Handlers ---
  const handleOpenManagePeriods = (year) => {
    if (!canManagePeriods) return alert(isRtl ? 'دسترسی مدیریت دوره‌ها ندارید' : 'Access Denied');
    setSelectedYear(year);
    setPeriodForm({ id: null, title: '', startDate: '', endDate: '', status: 'open' });
    fetchPeriods(year.id);
    setIsPeriodModalOpen(true);
  };

  const handleEditPeriod = (period) => {
    setPeriodForm({ id: period.id, title: period.title, startDate: period.start_date, endDate: period.end_date, status: period.status });
  };

  const handleSavePeriod = async () => {
    if (!periodForm.title || !periodForm.startDate || !periodForm.endDate) return alert(isRtl ? 'فیلدهای دوره الزامی است.' : 'Period fields required.');
    
    const payload = {
      year_id: selectedYear.id,
      title: periodForm.title.trim(),
      start_date: cleanDate(periodForm.startDate),
      end_date: cleanDate(periodForm.endDate),
      status: periodForm.status
    };

    try {
      if (periodForm.id) {
        const { error } = await supabase.schema('gl').from('fiscal_periods').update(payload).eq('id', periodForm.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.schema('gl').from('fiscal_periods').insert([payload]);
        if (error) throw error;
      }
      setPeriodForm({ id: null, title: '', startDate: '', endDate: '', status: 'open' });
      fetchPeriods(selectedYear.id);
    } catch (err) {
      console.error(err);
      if (err.code === '22008') alert(isRtl ? 'فرمت تاریخ نامعتبر است.' : 'Invalid Date Format.');
    }
  };

  const handleDeletePeriod = async (id) => {
    if (!confirm(isRtl ? 'دوره حذف شود؟' : 'Delete period?')) return;
    try {
      await supabase.schema('gl').from('fiscal_periods').delete().eq('id', id);
      fetchPeriods(selectedYear.id);
    } catch (err) { console.error(err); }
  };

  // --- Exception Handlers ---
  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      (u.username && u.username.toLowerCase().includes(userSearchTerm.toLowerCase())) ||
      (u.full_name && u.full_name.toLowerCase().includes(userSearchTerm.toLowerCase()))
    );
  }, [users, userSearchTerm]);

  const handleOpenExceptions = (period) => {
    setSelectedPeriod(period);
    setExcFormUser('');
    setUserSearchTerm('');
    fetchExceptions(period.id);
    setIsExceptionModalOpen(true);
  };

  const handleAddException = async () => {
    if (!excFormUser || !selectedPeriod) return;
    const userObj = users.find(u => String(u.id) === String(excFormUser));
    if (!userObj) return;

    try {
      const payload = {
        period_id: selectedPeriod.id,
        user_id: userObj.id,
        user_name: userObj.full_name || userObj.username
      };
      const { error } = await supabase.schema('gl').from('fiscal_period_exceptions').insert([payload]);
      if (error) {
         if (error.code === '23505') return alert(isRtl ? 'این کاربر قبلا اضافه شده است.' : 'User already exists.');
         throw error;
      }
      setExcFormUser('');
      setUserSearchTerm('');
      fetchExceptions(selectedPeriod.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteException = async (id) => {
    try {
      await supabase.schema('gl').from('fiscal_period_exceptions').delete().eq('id', id);
      fetchExceptions(selectedPeriod.id);
    } catch (err) { console.error(err); }
  };


  // --- Render Functions ---
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

  const renderStatusBadge = (status) => {
     if (status === 'closed') return <Badge variant="danger" icon={Lock}>{isRtl ? 'بسته' : 'Closed'}</Badge>;
     return <Badge variant="success" icon={Unlock}>{isRtl ? 'باز' : 'Open'}</Badge>;
  };

  const yearColumns = [
    { field: 'title', header: t.fy_title || (isRtl ? 'عنوان سال' : 'Title'), width: 'w-48', sortable: true },
    { field: 'start_date', header: t.fy_start || (isRtl ? 'تاریخ شروع' : 'Start Date'), width: 'w-32', className: 'text-center dir-ltr font-mono' },
    { field: 'end_date', header: t.fy_end || (isRtl ? 'تاریخ پایان' : 'End Date'), width: 'w-32', className: 'text-center dir-ltr font-mono' },
    { 
      field: 'status', header: t.fy_status || (isRtl ? 'وضعیت' : 'Status'), width: 'w-32',
      render: (row) => renderStatusBadge(row.status)
    },
    { 
      field: 'is_active', header: t.fy_active || (isRtl ? 'فعال' : 'Active'), width: 'w-20',
      render: (row) => (
         <div className="flex justify-center">
            <input 
              type="checkbox" 
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
              checked={row.is_active} 
              onChange={() => handleToggleYearActive(row.id, row.is_active)} 
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
            <CalendarDays size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800">{t.fy_page_title || (isRtl ? 'سال و دوره‌های مالی' : 'Fiscal Years & Periods')}</h1>
            <p className="text-xs text-slate-500 font-medium mt-1">{t.fy_page_subtitle || (isRtl ? 'تعریف دوره‌های زمانی حسابداری' : 'Manage accounting timeframes')}</p>
          </div>
        </div>
      </div>

      <FilterSection isRtl={isRtl} onSearch={() => {}} onClear={() => setYearSearch('')}>
         <InputField label={t.fy_title || (isRtl ? 'عنوان' : 'Title')} value={yearSearch} onChange={e => setYearSearch(e.target.value)} isRtl={isRtl} />
      </FilterSection>

      <div className="flex-1 min-h-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <DataGrid 
          columns={yearColumns} data={filteredYears} isRtl={isRtl}
          onCreate={canCreate ? () => handleOpenYearModal() : undefined}
          onDelete={canDelete ? handleDeleteYear : undefined}
          actions={(row) => (
            <div className="flex items-center gap-1">
              {canManagePeriods && <Button variant="ghost" size="iconSm" icon={Calendar} title={isRtl ? 'مدیریت دوره‌ها' : 'Manage Periods'} className="text-indigo-600 hover:bg-indigo-50" onClick={() => handleOpenManagePeriods(row)} />}
              {canEdit && <Button variant="ghost" size="iconSm" icon={Edit} onClick={() => handleOpenYearModal(row)} />}
              {canDelete && <Button variant="ghost" size="iconSm" icon={Trash2} className="text-red-500 hover:bg-red-50" onClick={() => handleDeleteYear([row.id])} />}
            </div>
          )}
        />
      </div>

      {/* Year Modal */}
      <Modal isOpen={isYearModalOpen} onClose={() => setIsYearModalOpen(false)} title={yearForm.id ? (isRtl ? 'ویرایش سال مالی' : 'Edit Year') : (isRtl ? 'سال مالی جدید' : 'New Year')}
         footer={<><Button variant="ghost" onClick={() => setIsYearModalOpen(false)}>{isRtl ? 'انصراف' : 'Cancel'}</Button><Button variant="primary" icon={Save} onClick={handleSaveYear}>{isRtl ? 'ذخیره' : 'Save'}</Button></>}>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2"><InputField label={`${isRtl ? 'عنوان سال' : 'Title'} *`} value={yearForm.title} onChange={e => setYearForm({...yearForm, title: e.target.value})} isRtl={isRtl} /></div>
            <DatePicker label={`${isRtl ? 'تاریخ شروع' : 'Start Date'} *`} value={yearForm.startDate} onChange={e => setYearForm({...yearForm, startDate: e.target.value})} isRtl={isRtl} className="dir-ltr" />
            <DatePicker label={`${isRtl ? 'تاریخ پایان' : 'End Date'} *`} value={yearForm.endDate} onChange={e => setYearForm({...yearForm, endDate: e.target.value})} isRtl={isRtl} className="dir-ltr" />
            
            <SelectField label={isRtl ? 'وضعیت' : 'Status'} value={yearForm.status} onChange={e => setYearForm({...yearForm, status: e.target.value})} isRtl={isRtl}>
               <option value="open">{isRtl ? 'باز' : 'Open'}</option>
               <option value="closed">{isRtl ? 'بسته' : 'Closed'}</option>
            </SelectField>

            <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-4 h-10 mt-auto">
               <span className="text-sm font-bold text-slate-700">{isRtl ? 'فعال' : 'Active'}</span>
               <input type="checkbox" className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer" checked={yearForm.isActive} onChange={e => setYearForm({...yearForm, isActive: e.target.checked})} />
            </div>
         </div>
      </Modal>

      {/* Manage Periods Modal */}
      <Modal isOpen={isPeriodModalOpen} onClose={() => setIsPeriodModalOpen(false)} size="3xl" title={`${isRtl ? 'دوره‌های مالی:' : 'Periods for:'} ${selectedYear?.title}`}>
         <div className="flex flex-col h-[500px]">
            {/* Inline Add/Edit Form for Periods */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4 flex gap-3 items-end shrink-0">
               <div className="flex-1"><InputField label={isRtl ? 'عنوان دوره' : 'Period Title'} value={periodForm.title} onChange={e => setPeriodForm({...periodForm, title: e.target.value})} isRtl={isRtl} /></div>
               <div className="w-32"><DatePicker label={isRtl ? 'شروع' : 'Start'} value={periodForm.startDate} onChange={e => setPeriodForm({...periodForm, startDate: e.target.value})} isRtl={isRtl} className="dir-ltr" /></div>
               <div className="w-32"><DatePicker label={isRtl ? 'پایان' : 'End'} value={periodForm.endDate} onChange={e => setPeriodForm({...periodForm, endDate: e.target.value})} isRtl={isRtl} className="dir-ltr" /></div>
               <div className="w-28">
                  <SelectField label={isRtl ? 'وضعیت' : 'Status'} value={periodForm.status} onChange={e => setPeriodForm({...periodForm, status: e.target.value})} isRtl={isRtl}>
                     <option value="open">{isRtl ? 'باز' : 'Open'}</option>
                     <option value="closed">{isRtl ? 'بسته' : 'Closed'}</option>
                  </SelectField>
               </div>
               <div className="flex gap-1 pb-1">
                  {periodForm.id && <Button variant="ghost" size="icon" icon={X} onClick={() => setPeriodForm({ id: null, title: '', startDate: '', endDate: '', status: 'open' })}/>}
                  <Button variant="primary" icon={periodForm.id ? Save : Plus} onClick={handleSavePeriod}>{periodForm.id ? (isRtl ? 'بروزرسانی' : 'Update') : (isRtl ? 'افزودن' : 'Add')}</Button>
               </div>
            </div>

            {/* Periods Grid */}
            <div className="flex-1 border border-slate-200 rounded-xl overflow-hidden relative bg-white">
               <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 sticky top-0 z-10">
                     <tr>
                        <th className={`px-4 py-2 font-bold ${isRtl ? 'text-right' : 'text-left'}`}>{isRtl ? 'عنوان' : 'Title'}</th>
                        <th className="px-4 py-2 font-bold text-center">{isRtl ? 'شروع' : 'Start'}</th>
                        <th className="px-4 py-2 font-bold text-center">{isRtl ? 'پایان' : 'End'}</th>
                        <th className="px-4 py-2 font-bold text-center">{isRtl ? 'وضعیت' : 'Status'}</th>
                        <th className="px-4 py-2 font-bold text-center w-24"></th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {periods.length > 0 ? periods.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                           <td className="px-4 py-2.5 font-bold text-slate-700">{p.title}</td>
                           <td className="px-4 py-2.5 text-center font-mono text-slate-600 dir-ltr">{p.start_date}</td>
                           <td className="px-4 py-2.5 text-center font-mono text-slate-600 dir-ltr">{p.end_date}</td>
                           <td className="px-4 py-2.5 text-center">{renderStatusBadge(p.status)}</td>
                           <td className="px-4 py-2.5 text-center">
                              <div className="flex justify-center gap-1">
                                 <button onClick={() => handleOpenExceptions(p)} title={isRtl ? 'استثنائات دسترسی' : 'Exceptions'} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"><ShieldAlert size={16}/></button>
                                 <button onClick={() => handleEditPeriod(p)} className="p-1 text-slate-500 hover:bg-slate-100 rounded"><Edit size={16}/></button>
                                 <button onClick={() => handleDeletePeriod(p.id)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                              </div>
                           </td>
                        </tr>
                     )) : (
                        <tr><td colSpan={5} className="py-8 text-center text-slate-400 italic">{isRtl ? 'دوره‌ای تعریف نشده است' : 'No periods defined'}</td></tr>
                     )}
                  </tbody>
               </table>
            </div>
         </div>
      </Modal>

      {/* Exceptions Modal */}
      <Modal isOpen={isExceptionModalOpen} onClose={() => setIsExceptionModalOpen(false)} title={`${isRtl ? 'استثنائات دسترسی:' : 'Access Exceptions:'} ${selectedPeriod?.title}`} size="md" footer={<Button variant="ghost" onClick={() => setIsExceptionModalOpen(false)}>{isRtl ? 'بستن' : 'Close'}</Button>}>
         <div className="space-y-4">
            <div className="bg-orange-50 border border-orange-100 text-orange-800 text-xs p-3 rounded-lg leading-relaxed">
               {isRtl ? 'کاربرانی که در این لیست قرار بگیرند، حتی در صورت بسته بودن دوره نیز امکان ثبت یا ویرایش سند در این بازه را خواهند داشت.' : 'Users in this list will be able to post documents even if the period is closed.'}
            </div>

            {/* Custom Searchable LOV for Users */}
            <div className="flex items-end gap-2">
               <div className="flex-1 relative" ref={userDropdownRef}>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">{isRtl ? 'جستجوی کاربر (نام یا کاربری)' : 'Search User (Name/Username)'}</label>
                  <div className="relative">
                     <input
                        className={`w-full h-9 bg-white border border-slate-200 rounded text-xs outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all ${isRtl ? 'pr-2 pl-8' : 'pl-2 pr-8'}`}
                        placeholder={isRtl ? "جستجو..." : "Search..."}
                        value={userSearchTerm}
                        onChange={e => {
                           setUserSearchTerm(e.target.value);
                           setExcFormUser('');
                           setIsUserDropdownOpen(true);
                        }}
                        onFocus={() => setIsUserDropdownOpen(true)}
                     />
                     {excFormUser ? (
                        <X size={14} className={`absolute top-2.5 text-slate-400 cursor-pointer hover:text-red-500 ${isRtl ? 'left-2.5' : 'right-2.5'}`} onClick={() => { setExcFormUser(''); setUserSearchTerm(''); }} />
                     ) : (
                        <Search size={14} className={`absolute top-2.5 text-slate-400 ${isRtl ? 'left-2.5' : 'right-2.5'}`} />
                     )}
                  </div>
                  
                  {isUserDropdownOpen && (
                     <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg z-[100] max-h-48 overflow-y-auto p-1">
                        {filteredUsers.length > 0 ? filteredUsers.map(u => (
                           <div key={u.id} className="px-3 py-2 text-xs cursor-pointer hover:bg-indigo-50 rounded flex flex-col transition-colors border-b border-slate-50 last:border-0" onClick={() => {
                              setExcFormUser(u.id);
                              setUserSearchTerm(`${u.full_name || ''} (${u.username})`.trim());
                              setIsUserDropdownOpen(false);
                           }}>
                              <span className="font-bold text-slate-700">{u.full_name || u.username}</span>
                              <span className="text-[10px] font-mono text-slate-400">{u.username}</span>
                           </div>
                        )) : <div className="p-3 text-center text-slate-400 text-xs">{isRtl ? 'کاربری یافت نشد.' : 'No users found.'}</div>}
                     </div>
                  )}
               </div>
               <Button variant="primary" icon={Plus} onClick={handleAddException} className="mb-0.5">{isRtl ? 'افزودن' : 'Add'}</Button>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden bg-white max-h-64 overflow-y-auto mt-4">
               <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 sticky top-0">
                     <tr>
                        <th className={`px-4 py-2 font-bold ${isRtl ? 'text-right' : 'text-left'}`}>{isRtl ? 'نام کاربر' : 'User Name'}</th>
                        <th className="px-4 py-2 w-12"></th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {exceptions.length > 0 ? exceptions.map(exc => (
                        <tr key={exc.id} className="hover:bg-slate-50/50">
                           <td className="px-4 py-2.5 font-bold text-slate-700">{exc.user_name}</td>
                           <td className="px-4 py-2.5 text-center">
                              <button onClick={() => handleDeleteException(exc.id)} className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"><Trash2 size={16}/></button>
                           </td>
                        </tr>
                     )) : (
                        <tr><td colSpan={2} className="py-6 text-center text-slate-400 italic text-xs">{isRtl ? 'استثنایی تعریف نشده است' : 'No exceptions'}</td></tr>
                     )}
                  </tbody>
               </table>
            </div>
         </div>
      </Modal>

    </div>
  );
};

window.FiscalPeriods = FiscalPeriods;
export default FiscalPeriods;
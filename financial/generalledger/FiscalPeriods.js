/* Filename: financial/generalledger/FiscalPeriods.js */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Calendar, Edit, Trash2, Plus, Play, Lock, 
  Clock, Users, Zap, UserPlus, X, Trash, Info, CheckCircle2,
  Search, Ban, Unlock
} from 'lucide-react';

const FiscalPeriods = ({ t, isRtl }) => {
  const UI = window.UI || {};
  const { 
    Button, InputField, SelectField, DataGrid, 
    FilterSection, Modal, Badge, Callout 
  } = UI;
  const supabase = window.supabase;

  // --- Resilient Permission Checks ---
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

  // --- State: Data ---
  const [fiscalYears, setFiscalYears] = useState([]);
  const [operationalPeriods, setOperationalPeriods] = useState([]);
  const [users, setUsers] = useState([]);

  // --- State: UI ---
  const [showYearModal, setShowYearModal] = useState(false);
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [showExPanel, setShowExPanel] = useState(false);
  
  const [activeYear, setActiveYear] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  
  const [formData, setFormData] = useState({});
  const [searchParams, setSearchParams] = useState({ code: '', title: '' });
  const [newPeriodData, setNewPeriodData] = useState({ id: null, code: '', title: '', startDate: '', endDate: '', status: 'not_open' });
  
  // Exceptions State
  const [exUser, setExUser] = useState(''); // Stores User ID
  const [exStatuses, setExStatuses] = useState([]);
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
      setFiscalYears((data || []).map(y => ({
         id: y.id,
         title: y.title,
         startDate: y.start_date,
         endDate: y.end_date,
         status: y.status,
         isActive: y.is_active
      })));
    } catch (err) {
      console.error(err);
      alert(isRtl ? 'خطا در دریافت سال‌های مالی' : 'Error fetching fiscal years');
    }
  };

  const fetchPeriodsAndExceptions = async (yearId) => {
    try {
      // 1. Fetch Periods
      const { data: pData, error: pError } = await supabase.schema('gl').from('fiscal_periods').select('*').eq('year_id', yearId).order('start_date', { ascending: true });
      if (pError) throw pError;
      
      const periodsList = pData || [];
      const periodIds = periodsList.map(p => p.id);

      // 2. Fetch Exceptions for these periods
      let excData = [];
      if (periodIds.length > 0) {
         const { data: eData, error: eError } = await supabase.schema('gl').from('fiscal_period_exceptions').select('*').in('period_id', periodIds);
         if (eError) throw eError;
         excData = eData || [];
      }

      // 3. Map together
      const mappedPeriods = periodsList.map(p => {
         const pExcs = excData.filter(e => e.period_id === p.id).map(e => ({
            id: e.id,
            userId: e.user_id,
            user: e.user_name,
            allowedStatuses: e.allowed_statuses || ['closed', 'not_open'] // Default fallback
         }));

         return {
            id: p.id,
            yearId: p.year_id,
            code: p.code || '', // If code exists in DB, otherwise empty
            title: p.title,
            startDate: p.start_date,
            endDate: p.end_date,
            status: p.status,
            exceptions: pExcs
         };
      });

      setOperationalPeriods(mappedPeriods);

      // Update selectedPeriod reference if panel is open
      if (selectedPeriod) {
         const updatedSelected = mappedPeriods.find(p => p.id === selectedPeriod.id);
         if (updatedSelected) setSelectedPeriod(updatedSelected);
      }

    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.schema('gen').from('users').select('id, username, full_name').eq('is_active', true);
      if (!error && data) setUsers(data);
    } catch (err) {
      console.error('Fetch users error:', err);
    }
  };

  // --- Logic Helpers ---
  const checkOverlap = (start, end, list, excludeId = null) => {
    return list.some(p => {
      if (excludeId && p.id === excludeId) return false;
      return (start <= p.endDate && end >= p.startDate);
    });
  };

  // --- Handlers: Year ---
  const filteredYears = useMemo(() => {
    return fiscalYears.filter(y => y.title.toLowerCase().includes(searchParams.title.toLowerCase()));
  }, [fiscalYears, searchParams]);

  const handleSaveYear = async () => {
    if (editingItem && !canEdit) return alert(isRtl ? 'دسترسی ویرایش ندارید' : 'Access Denied');
    if (!editingItem && !canCreate) return alert(isRtl ? 'دسترسی ایجاد ندارید' : 'Access Denied');

    if (!formData.title || !formData.startDate || !formData.endDate) return alert(t.alert_req_fields || 'Required fields missing');
    
    if (checkOverlap(formData.startDate, formData.endDate, fiscalYears, editingItem?.id)) {
      return alert(isRtl ? "این بازه زمانی با سال مالی دیگری تداخل دارد" : "Date range overlaps with another year");
    }

    const payload = {
      title: formData.title.trim(),
      start_date: cleanDate(formData.startDate),
      end_date: cleanDate(formData.endDate),
      status: formData.status || 'open',
      is_active: formData.isActive
    };

    try {
       if (editingItem) {
          const { error } = await supabase.schema('gl').from('fiscal_years').update(payload).eq('id', editingItem.id);
          if (error) throw error;
       } else {
          const { error } = await supabase.schema('gl').from('fiscal_years').insert([payload]);
          if (error) throw error;
       }
       setShowYearModal(false);
       fetchYears();
    } catch (err) {
       console.error(err);
       if (err.code === '22008') alert(isRtl ? 'فرمت تاریخ نامعتبر است.' : 'Invalid Date Format.');
    }
  };

  const handleDeleteYear = async (id) => {
    if (!canDelete) return alert(isRtl ? 'دسترسی حذف ندارید' : 'Access Denied');
    
    // Check if periods exist and are not 'not_open'
    const { data: pData } = await supabase.schema('gl').from('fiscal_periods').select('status').eq('year_id', id);
    if (pData && pData.some(p => p.status !== 'not_open')) {
       return alert(isRtl ? "به دلیل وجود دوره‌های باز یا بسته، حذف سال امکان‌پذیر نیست" : "Cannot delete year with open/closed periods");
    }

    if (window.confirm(isRtl ? "آیا از حذف این سال مالی و تمام دوره‌های آن اطمینان دارید؟" : "Delete year and all its periods?")) {
       try {
          await supabase.schema('gl').from('fiscal_years').delete().eq('id', id);
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

  // --- Handlers: Periods ---
  const handleOpenManagePeriods = (year) => {
     if (!canManagePeriods) return alert(isRtl ? 'دسترسی ندارید' : 'Access Denied');
     setActiveYear(year);
     setNewPeriodData({ id: null, code: '', title: '', startDate: '', endDate: '', status: 'not_open' });
     setShowExPanel(false);
     fetchPeriodsAndExceptions(year.id);
     setShowPeriodModal(true);
  };

  const handleSavePeriod = async () => {
    if (!newPeriodData.title || !newPeriodData.startDate || !newPeriodData.endDate) return alert(t.alert_req_fields || 'Required fields');
    
    const yearPeriods = operationalPeriods.filter(p => p.yearId === activeYear.id);
    if (checkOverlap(newPeriodData.startDate, newPeriodData.endDate, yearPeriods, newPeriodData.id)) {
      return alert(isRtl ? "تداخل زمانی با دوره‌های موجود" : "Overlaps with existing periods");
    }

    const payload = {
       year_id: activeYear.id,
       code: newPeriodData.code || null,
       title: newPeriodData.title.trim(),
       start_date: cleanDate(newPeriodData.startDate),
       end_date: cleanDate(newPeriodData.endDate),
       status: newPeriodData.status || 'not_open'
    };

    try {
       if (newPeriodData.id) {
          const { error } = await supabase.schema('gl').from('fiscal_periods').update(payload).eq('id', newPeriodData.id);
          if(error) throw error;
       } else {
          const { error } = await supabase.schema('gl').from('fiscal_periods').insert([payload]);
          if(error) throw error;
       }
       setNewPeriodData({ id: null, code: '', title: '', startDate: '', endDate: '', status: 'not_open' });
       fetchPeriodsAndExceptions(activeYear.id);
    } catch(err) {
       console.error(err);
       if (err.code === '22008') alert(isRtl ? 'فرمت تاریخ نامعتبر است.' : 'Invalid Date Format.');
    }
  };

  const updatePeriodStatus = async (id, newStatus) => {
     try {
        await supabase.schema('gl').from('fiscal_periods').update({ status: newStatus }).eq('id', id);
        fetchPeriodsAndExceptions(activeYear.id);
     } catch (err) { console.error(err); }
  };

  const generateAuto = async (months) => {
    const existing = operationalPeriods.filter(p => p.yearId === activeYear.id);
    if (existing.some(p => p.status !== 'not_open')) {
      return alert(isRtl ? "به دلیل وجود دوره باز/بسته، امکان تولید مجدد نیست" : "Regeneration blocked by open/closed periods");
    }
    if (!window.confirm(isRtl ? "دوره‌های فعلی حذف و جایگزین شوند؟" : "Replace current periods?")) return;

    try {
       // Delete existing periods for this year
       if (existing.length > 0) {
          await supabase.schema('gl').from('fiscal_periods').delete().eq('year_id', activeYear.id);
       }

       const generated = [];
       let start = new Date(activeYear.startDate);
       const total = Math.ceil(12 / months);
       
       for (let i = 1; i <= total; i++) {
         let currentStart = new Date(start);
         let currentEnd = new Date(start.setMonth(start.getMonth() + months));
         currentEnd.setDate(currentEnd.getDate() - 1);
         
         generated.push({
           year_id: activeYear.id,
           code: i.toString().padStart(2, '0'),
           title: (isRtl ? "دوره " : "Period ") + i,
           start_date: currentStart.toISOString().split('T')[0],
           end_date: currentEnd.toISOString().split('T')[0],
           status: 'not_open'
         });
         start.setDate(start.getDate() + 1);
       }

       if (generated.length > 0) {
          const { error } = await supabase.schema('gl').from('fiscal_periods').insert(generated);
          if (error) throw error;
       }
       
       fetchPeriodsAndExceptions(activeYear.id);
    } catch(err) {
       console.error(err);
    }
  };

  const deletePeriod = async (id) => {
    const period = operationalPeriods.find(p => p.id === id);
    if (period && period.status !== 'not_open') {
      return alert(isRtl ? "فقط دوره‌های 'باز نشده' قابل حذف هستند." : "Only 'Not Open' periods can be deleted.");
    }
    if (window.confirm(isRtl ? "آیا این دوره حذف شود؟" : "Delete this period?")) {
       try {
          await supabase.schema('gl').from('fiscal_periods').delete().eq('id', id);
          if (selectedPeriod?.id === id) setShowExPanel(false);
          fetchPeriodsAndExceptions(activeYear.id);
       } catch (err) { console.error(err); }
    }
  };

  // --- Handlers: Exceptions ---
  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      (u.username && u.username.toLowerCase().includes(userSearchTerm.toLowerCase())) ||
      (u.full_name && u.full_name.toLowerCase().includes(userSearchTerm.toLowerCase()))
    );
  }, [users, userSearchTerm]);

  const toggleStatusInEx = (status) => {
    setExStatuses(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]);
  };

  const addEx = async () => {
    if (!exUser || exStatuses.length === 0) return alert(isRtl ? "کاربر و وضعیت را انتخاب کنید" : "Select user and status");
    const userObj = users.find(u => String(u.id) === String(exUser));
    if (!userObj || !selectedPeriod) return;

    try {
      // Check if exception for this user and period already exists
      const existing = selectedPeriod.exceptions.find(e => String(e.userId) === String(userObj.id));
      
      const payload = {
         period_id: selectedPeriod.id,
         user_id: userObj.id,
         user_name: userObj.full_name || userObj.username,
         allowed_statuses: exStatuses
      };

      if (existing) {
         const { error } = await supabase.schema('gl').from('fiscal_period_exceptions').update(payload).eq('id', existing.id);
         if (error) throw error;
      } else {
         const { error } = await supabase.schema('gl').from('fiscal_period_exceptions').insert([payload]);
         if (error) {
            if (error.code === '23505') return alert(isRtl ? 'این کاربر قبلا اضافه شده است.' : 'User already exists.');
            throw error;
         }
      }
      
      setExUser(''); 
      setExStatuses([]);
      setUserSearchTerm('');
      fetchPeriodsAndExceptions(activeYear.id);
    } catch (err) {
      console.error(err);
    }
  };

  const removeEx = async (excId) => {
     try {
        await supabase.schema('gl').from('fiscal_period_exceptions').delete().eq('id', excId);
        fetchPeriodsAndExceptions(activeYear.id);
     } catch (err) { console.error(err); }
  };

  // --- Constants & Styles ---
  const statusStyles = {
    open: "text-green-600 font-black bg-green-50 border-green-200",
    closed: "text-red-600 font-black bg-red-50 border-red-200",
    not_open: "text-slate-500 font-black bg-slate-50 border-slate-200"
  };

  const renderStatusBadge = (status) => {
     if (status === 'closed') return <Badge variant="danger" icon={Lock}>{t.fp_st_closed || (isRtl ? 'بسته' : 'Closed')}</Badge>;
     if (status === 'open') return <Badge variant="success" icon={Unlock}>{t.fp_st_open || (isRtl ? 'باز' : 'Open')}</Badge>;
     return <Badge variant="neutral">{t.fp_st_not_open || (isRtl ? 'باز نشده' : 'Not Open')}</Badge>;
  };

  // --- Render ---
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

  return (
    <div className="h-full flex flex-col p-4">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-slate-800">{t.fp_title || (isRtl ? 'سال و دوره‌های مالی' : 'Fiscal Years & Periods')}</h1>
        <p className="text-slate-500 text-xs mt-1">{t.fp_subtitle || (isRtl ? 'مدیریت و تعریف دوره‌های زمانی حسابداری' : 'Manage accounting timeframes')}</p>
      </div>

      <FilterSection onSearch={()=>{}} onClear={()=>setSearchParams({code:'', title:''})} isRtl={isRtl} title={t.filter || (isRtl ? 'فیلتر' : 'Filter')}>
        <InputField label={t.fp_year_title || (isRtl ? 'عنوان سال' : 'Year Title')} value={searchParams.title} onChange={e=>setSearchParams({...searchParams, title: e.target.value})} isRtl={isRtl} />
      </FilterSection>

      <div className="flex-1 overflow-hidden bg-white rounded-xl border border-slate-200 shadow-sm">
        <DataGrid 
          columns={[
            { field: 'title', header: t.fp_year_title || (isRtl ? 'عنوان سال' : 'Title'), width: 'w-64' },
            { field: 'startDate', header: t.fp_start_date || (isRtl ? 'تاریخ شروع' : 'Start Date'), width: 'w-32', className: 'text-center dir-ltr font-mono' },
            { field: 'endDate', header: t.fp_end_date || (isRtl ? 'تاریخ پایان' : 'End Date'), width: 'w-32', className: 'text-center dir-ltr font-mono' },
            { 
               field: 'status', header: t.lg_status || (isRtl ? 'وضعیت' : 'Status'), width: 'w-32',
               render: (row) => renderStatusBadge(row.status)
            },
            { 
               field: 'isActive', header: t.active || (isRtl ? 'فعال' : 'Active'), width: 'w-24', 
               render: (row) => (
                  <div className="flex justify-center">
                     <input 
                       type="checkbox" 
                       className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                       checked={row.isActive} 
                       onChange={() => handleToggleYearActive(row.id, row.isActive)} 
                     />
                  </div>
               )
            }
          ]} 
          data={filteredYears} isRtl={isRtl}
          onCreate={canCreate ? ()=>{setEditingItem(null); setFormData({isActive:true, status: 'open'}); setShowYearModal(true);} : undefined}
          onDoubleClick={canEdit ? (row) => { setActiveYear(row); fetchPeriodsAndExceptions(row.id); setShowPeriodModal(true); } : undefined}
          actions={(row) => (
            <div className="flex gap-1">
              {canManagePeriods && <button onClick={() => { setActiveYear(row); fetchPeriodsAndExceptions(row.id); setShowPeriodModal(true); }} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded" title={isRtl ? 'مدیریت دوره‌ها' : 'Manage Periods'}><Calendar size={16}/></button>}
              {canEdit && <button onClick={() => { setEditingItem(row); setFormData({...row}); setShowYearModal(true); }} className="p-1.5 text-slate-600 hover:bg-slate-50 rounded" title={isRtl ? 'ویرایش' : 'Edit'}><Edit size={16}/></button>}
              {canDelete && <button onClick={() => handleDeleteYear(row.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title={isRtl ? 'حذف' : 'Delete'}><Trash2 size={16}/></button>}
            </div>
          )}
        />
      </div>

      {/* Modal: Year Definition */}
      <Modal isOpen={showYearModal} onClose={()=>setShowYearModal(false)} title={editingItem ? (t.fp_edit_year || (isRtl ? 'ویرایش سال مالی' : 'Edit Year')) : (t.fp_new_year || (isRtl ? 'سال مالی جدید' : 'New Year'))}
        footer={<><Button variant="outline" onClick={()=>setShowYearModal(false)}>{t.btn_cancel || (isRtl ? 'انصراف' : 'Cancel')}</Button><Button variant="primary" onClick={handleSaveYear}>{t.btn_save || (isRtl ? 'ذخیره' : 'Save')}</Button></>}>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><InputField label={`${t.fp_year_title || (isRtl ? 'عنوان سال' : 'Title')} *`} value={formData.title} onChange={e=>setFormData({...formData, title: e.target.value})} isRtl={isRtl} /></div>
          
          <InputField label={`${t.fp_start_date || (isRtl ? 'تاریخ شروع' : 'Start Date')} *`} type="date" value={formData.startDate} onChange={e=>setFormData({...formData, startDate: e.target.value})} isRtl={isRtl} className="dir-ltr" />
          <InputField label={`${t.fp_end_date || (isRtl ? 'تاریخ پایان' : 'End Date')} *`} type="date" value={formData.endDate} onChange={e=>setFormData({...formData, endDate: e.target.value})} isRtl={isRtl} className="dir-ltr" />
          
          <SelectField label={t.lg_status || (isRtl ? 'وضعیت' : 'Status')} value={formData.status} onChange={e=>setFormData({...formData, status: e.target.value})} isRtl={isRtl}>
            <option value="open">{isRtl ? 'باز' : 'Open'}</option>
            <option value="closed">{isRtl ? 'بسته' : 'Closed'}</option>
          </SelectField>

          <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-4 h-10 mt-auto">
             <span className="text-sm font-bold text-slate-700">{isRtl ? 'فعال' : 'Active'}</span>
             <input type="checkbox" className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} />
          </div>
        </div>
      </Modal>

      {/* Modal: Period Manager */}
      <Modal isOpen={showPeriodModal} onClose={()=>{setShowPeriodModal(false); setShowExPanel(false);}} title={`${isRtl ? 'دوره‌های مالی:' : 'Periods for:'} ${activeYear?.title}`} size="3xl">
        <div className="flex flex-col gap-4 h-[650px] relative overflow-hidden">
          
          {/* Top Panel: Auto Generation Guide & Tools */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 shrink-0">
            <div className="flex flex-col gap-2 mb-4 border-b border-slate-200 pb-3">
               <div className="flex items-center gap-2">
                 <div className="flex items-center gap-1.5 text-[11px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full border border-indigo-100 uppercase tracking-tighter">
                    <Info size={14}/> {t.fp_auto_gen || (isRtl ? 'تولید خودکار' : 'Auto Generate')}
                 </div>
                 <span className="text-[11px] text-slate-500 leading-none">
                    {isRtl ? 'با کلیک بر روی دکمه‌های زیر، سیستم دوره‌های زمانی را بر اساس تاریخ شروع سال تولید می‌کند.' : 'Click buttons below to auto-generate periods starting from year begin date.'}
                 </span>
               </div>
               <div className="flex gap-2 mt-1">
                  <Button variant="white" size="sm" onClick={()=>generateAuto(1)}>{t.fp_gen_monthly || (isRtl ? 'ماهانه' : 'Monthly')}</Button>
                  <Button variant="white" size="sm" onClick={()=>generateAuto(3)}>{t.fp_gen_quarterly || (isRtl ? 'فصلی' : 'Quarterly')}</Button>
                  <Button variant="white" size="sm" onClick={()=>generateAuto(6)}>{t.fp_gen_semi || (isRtl ? 'شش ماهه' : 'Semi-Annual')}</Button>
               </div>
            </div>

            {/* Manual Entry */}
            <div className="grid grid-cols-5 gap-2 items-end">
              <InputField label={t.fp_period_code || (isRtl ? 'کد' : 'Code')} size="sm" value={newPeriodData.code} onChange={e=>setNewPeriodData({...newPeriodData, code:e.target.value})} isRtl={isRtl} className="dir-ltr" />
              <InputField label={t.fp_period_title || (isRtl ? 'عنوان دوره' : 'Title')} size="sm" value={newPeriodData.title} onChange={e=>setNewPeriodData({...newPeriodData, title:e.target.value})} isRtl={isRtl} />
              <InputField label={t.fp_start_date || (isRtl ? 'شروع' : 'Start')} type="date" size="sm" value={newPeriodData.startDate} onChange={e=>setNewPeriodData({...newPeriodData, startDate:e.target.value})} isRtl={isRtl} className="dir-ltr" />
              <InputField label={t.fp_end_date || (isRtl ? 'پایان' : 'End')} type="date" size="sm" value={newPeriodData.endDate} onChange={e=>setNewPeriodData({...newPeriodData, endDate:e.target.value})} isRtl={isRtl} className="dir-ltr" />
              <Button variant="primary" size="sm" icon={newPeriodData.id ? Save : Plus} onClick={handleSavePeriod} className="mb-0.5">{newPeriodData.id ? (isRtl ? 'بروزرسانی' : 'Update') : (isRtl ? 'افزودن' : 'Add')}</Button>
              {newPeriodData.id && <Button variant="ghost" size="icon" icon={X} onClick={() => setNewPeriodData({ id: null, code: '', title: '', startDate: '', endDate: '', status: 'not_open' })}/>}
            </div>
          </div>

          <div className="flex-1 overflow-auto border border-slate-200 rounded-xl bg-white shadow-inner">
             <table className={`w-full text-[12px] ${isRtl ? 'text-right' : 'text-left'}`}>
                <thead className="sticky top-0 bg-slate-100 font-black text-slate-600 border-b z-10">
                   <tr>
                      <th className="p-2 w-16">{t.fp_period_code || (isRtl ? 'کد' : 'Code')}</th>
                      <th className="p-2">{t.fp_period_title || (isRtl ? 'عنوان' : 'Title')}</th>
                      <th className="p-2 w-28 text-center">{t.fp_start_date || (isRtl ? 'شروع' : 'Start')}</th>
                      <th className="p-2 w-28 text-center">{t.fp_end_date || (isRtl ? 'پایان' : 'End')}</th>
                      <th className="p-2 w-32 text-center">{t.fp_status || (isRtl ? 'وضعیت' : 'Status')}</th>
                      <th className="p-2 w-24 text-center">{t.col_actions || (isRtl ? 'عملیات' : 'Actions')}</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {operationalPeriods.map(p=>(
                     <tr key={p.id} className={`hover:bg-indigo-50/50 transition-colors ${selectedPeriod?.id === p.id ? 'bg-indigo-50 font-bold' : ''}`}>
                        <td className="p-2 font-mono text-slate-400 text-center">{p.code}</td>
                        <td className="p-2 text-slate-700">{p.title}</td>
                        <td className="p-2 text-center font-mono text-slate-600 dir-ltr">{p.startDate}</td>
                        <td className="p-2 text-center font-mono text-slate-600 dir-ltr">{p.endDate}</td>
                        <td className="p-2">
                           <select value={p.status} onChange={e=>updatePeriodStatus(p.id, e.target.value)} className={`text-[11px] p-1 rounded border outline-none w-full ${statusStyles[p.status]}`}>
                              <option value="not_open">{t.fp_st_not_open || (isRtl ? 'باز نشده' : 'Not Open')}</option>
                              <option value="open">{t.fp_st_open || (isRtl ? 'باز' : 'Open')}</option>
                              <option value="closed">{t.fp_st_closed || (isRtl ? 'بسته' : 'Closed')}</option>
                           </select>
                        </td>
                        <td className="p-2 flex gap-1 justify-center">
                           <button onClick={()=>{setSelectedPeriod(p); setShowExPanel(true);}} className={`p-1.5 rounded bg-white border border-slate-200 shadow-sm ${p.exceptions?.length > 0 ? 'text-indigo-600 border-indigo-200' : 'text-slate-400'}`} title={isRtl ? 'استثنائات' : 'Exceptions'}><Users size={14}/></button>
                           <button onClick={()=>setNewPeriodData({id: p.id, code: p.code, title: p.title, startDate: p.startDate, endDate: p.endDate, status: p.status})} className="p-1.5 rounded bg-white border border-slate-200 shadow-sm text-slate-600" title={isRtl ? 'ویرایش' : 'Edit'}><Edit size={14}/></button>
                           <button onClick={()=>deletePeriod(p.id)} disabled={p.status !== 'not_open'} className={`p-1.5 rounded bg-white border border-slate-200 shadow-sm ${p.status === 'not_open' ? 'text-red-500 hover:bg-red-50' : 'text-slate-200 cursor-not-allowed'}`} title={isRtl ? 'حذف' : 'Delete'}><Trash size={14}/></button>
                        </td>
                     </tr>
                   ))}
                   {operationalPeriods.length === 0 && (
                      <tr><td colSpan={6} className="py-8 text-center text-slate-400 italic">{isRtl ? 'دوره‌ای تعریف نشده است' : 'No periods defined'}</td></tr>
                   )}
                </tbody>
             </table>
          </div>

          {/* Exceptions Panel */}
          <div className={`absolute top-0 ${isRtl ? 'left-0 border-r' : 'right-0 border-l'} w-80 h-full bg-white shadow-2xl z-20 flex flex-col transition-all duration-300 transform ${showExPanel ? 'translate-x-0' : (isRtl ? '-translate-x-full' : 'translate-x-full')}`}>
             <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                <div className="flex items-center gap-2 font-black text-xs text-indigo-700 uppercase italic"><Users size={16}/> {t.fp_exceptions || (isRtl ? 'استثنائات دسترسی' : 'Exceptions')}</div>
                <button onClick={()=>setShowExPanel(false)} className="text-slate-400 hover:text-slate-800"><X size={18}/></button>
             </div>
             <div className="p-4 flex flex-col gap-4 flex-1 overflow-hidden">
                <div className="space-y-4 bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-inner overflow-visible">
                   
                   {/* Custom Searchable LOV for Users */}
                   <div className="relative" ref={userDropdownRef}>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase px-1 mb-1">{t.fp_user || (isRtl ? 'کاربر' : 'User')}</label>
                      <div className="relative">
                         <input
                            className={`w-full h-9 bg-white border border-slate-200 rounded text-xs outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all ${isRtl ? 'pr-2 pl-8' : 'pl-2 pr-8'}`}
                            placeholder={isRtl ? "جستجو (نام یا کاربری)..." : "Search..."}
                            value={userSearchTerm}
                            onChange={e => {
                               setUserSearchTerm(e.target.value);
                               setExUser('');
                               setIsUserDropdownOpen(true);
                            }}
                            onFocus={() => setIsUserDropdownOpen(true)}
                         />
                         {exUser ? (
                            <X size={14} className={`absolute top-2.5 text-slate-400 cursor-pointer hover:text-red-500 ${isRtl ? 'left-2.5' : 'right-2.5'}`} onClick={() => { setExUser(''); setUserSearchTerm(''); }} />
                         ) : (
                            <Search size={14} className={`absolute top-2.5 text-slate-400 ${isRtl ? 'left-2.5' : 'right-2.5'}`} />
                         )}
                      </div>
                      
                      {isUserDropdownOpen && (
                         <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg z-[100] max-h-48 overflow-y-auto p-1">
                            {filteredUsers.length > 0 ? filteredUsers.map(u => (
                               <div key={u.id} className="px-3 py-2 text-xs cursor-pointer hover:bg-indigo-50 rounded flex flex-col transition-colors border-b border-slate-50 last:border-0" onClick={() => {
                                  setExUser(u.id);
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

                   <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase px-1">{isRtl ? 'وضعیت‌های مجاز' : 'Allowed Statuses'}</label>
                      {['open', 'not_open', 'closed'].map(st => (
                        <div key={st} onClick={() => toggleStatusInEx(st)} className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all mb-1 ${exStatuses.includes(st) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-600'}`}>
                           <span className="text-[11px] font-bold">{t[`fp_st_${st}`] || (st === 'open' ? (isRtl ? 'باز' : 'Open') : st === 'closed' ? (isRtl ? 'بسته' : 'Closed') : (isRtl ? 'باز نشده' : 'Not Open'))}</span>
                           {exStatuses.includes(st) && <CheckCircle2 size={14}/>}
                        </div>
                      ))}
                   </div>
                   <Button variant="primary" size="sm" className="w-full" icon={UserPlus} onClick={addEx}>{t.btn_add || (isRtl ? 'افزودن' : 'Add')}</Button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar mt-2">
                   {selectedPeriod?.exceptions?.map(ex => (
                     <div key={ex.id} className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm flex justify-between items-start group">
                        <div>
                           <div className="text-[11px] font-black text-slate-800 mb-2">{ex.user}</div>
                           <div className="flex flex-wrap gap-1">
                              {ex.allowedStatuses.map(st => (
                                 <span key={st} className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold border ${statusStyles[st]}`}>
                                    {t[`fp_st_${st}`] || (st === 'open' ? (isRtl ? 'باز' : 'Open') : st === 'closed' ? (isRtl ? 'بسته' : 'Closed') : (isRtl ? 'باز نشده' : 'Not Open'))}
                                 </span>
                              ))}
                           </div>
                        </div>
                        <button onClick={()=>removeEx(ex.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1"><Trash2 size={14}/></button>
                     </div>
                   ))}
                   {(!selectedPeriod?.exceptions || selectedPeriod.exceptions.length === 0) && (
                      <div className="text-center text-slate-400 text-xs italic mt-4">{isRtl ? 'استثنایی تعریف نشده است' : 'No exceptions'}</div>
                   )}
                </div>
             </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

window.FiscalPeriods = FiscalPeriods;
export default FiscalPeriods;
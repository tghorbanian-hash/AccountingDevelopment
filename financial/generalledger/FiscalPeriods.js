/* Filename: financial/generalledger/FiscalPeriods.js */
import React, { useState, useMemo } from 'react';
import { 
  Calendar, Edit, Trash2, Plus, Play, Lock, 
  Clock, Users, Zap, UserPlus, X, Trash, Info
} from 'lucide-react';

const FiscalPeriods = ({ t, isRtl }) => {
  const { 
    Button, InputField, SelectField, Toggle, DataGrid, 
    FilterSection, Modal, Badge, Callout 
  } = window.UI;

  // --- Mock Data ---
  const [fiscalYears, setFiscalYears] = useState([
    { id: 1, code: '1403', title: 'سال مالی ۱۴۰۳', startDate: '2024-03-20', endDate: '2025-03-20', calendarType: 'jalali', isActive: true },
    { id: 2, code: '2025', title: 'Fiscal Year 2025', startDate: '2025-01-01', endDate: '2025-12-31', calendarType: 'gregorian', isActive: true },
  ]);

  const [operationalPeriods, setOperationalPeriods] = useState([
    { id: 10, yearId: 1, code: '01', title: 'فروردین ۱۴۰۳', startDate: '2024-03-20', endDate: '2024-04-20', status: 'open', exceptions: ['admin'] },
  ]);

  // --- States ---
  const [showYearModal, setShowYearModal] = useState(false);
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [showExPanel, setShowExPanel] = useState(false);
  
  const [activeYear, setActiveYear] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [searchParams, setSearchParams] = useState({ code: '', title: '' });
  
  const [newPeriodData, setNewPeriodData] = useState({ code: '', title: '', startDate: '', endDate: '', status: 'not_open' });
  const [selectedUserToEx, setSelectedUserToEx] = useState('');

  // --- Handlers: Year Management ---
  const handleSaveYear = () => {
    if (!formData.code || !formData.startDate || !formData.endDate) return alert(t.alert_req_fields);
    if (editingItem) {
      setFiscalYears(prev => prev.map(y => y.id === editingItem.id ? { ...formData, id: y.id } : y));
    } else {
      setFiscalYears(prev => [...prev, { ...formData, id: Date.now() }]);
    }
    setShowYearModal(false);
  };

  const handleDeleteYear = (id) => {
    const yearPeriods = operationalPeriods.filter(p => p.yearId === id);
    const hasActivePeriods = yearPeriods.some(p => p.status !== 'not_open');
    
    if (hasActivePeriods) {
      return alert(isRtl ? "به دلیل وجود دوره‌های باز یا بسته شده در این سال، امکان حذف وجود ندارد." : "Cannot delete year with open or closed periods.");
    }

    if (window.confirm(isRtl ? "آیا از حذف این سال مالی اطمینان دارید؟" : "Are you sure you want to delete this fiscal year?")) {
      setFiscalYears(prev => prev.filter(y => y.id !== id));
      setOperationalPeriods(prev => prev.filter(p => p.yearId !== id));
    }
  };

  // --- Handlers: Period Management ---
  const handleSavePeriod = () => {
    if (!newPeriodData.code || !newPeriodData.startDate || !newPeriodData.endDate) return alert(t.alert_req_fields);
    
    if (newPeriodData.id) {
      setOperationalPeriods(prev => prev.map(p => p.id === newPeriodData.id ? { ...newPeriodData } : p));
    } else {
      setOperationalPeriods(prev => [...prev, { ...newPeriodData, id: Date.now(), yearId: activeYear.id, exceptions: [] }]);
    }
    setNewPeriodData({ code: '', title: '', startDate: '', endDate: '', status: 'not_open' });
  };

  const deletePeriod = (id) => {
    const period = operationalPeriods.find(p => p.id === id);
    if (period && period.status !== 'not_open') {
      return alert(isRtl ? "فقط دوره‌های 'باز نشده' قابل حذف هستند." : "Only 'Not Open' periods can be deleted.");
    }
    if (window.confirm(isRtl ? "آیا این دوره حذف شود؟" : "Delete this period?")) {
      setOperationalPeriods(prev => prev.filter(p => p.id !== id));
      if (selectedPeriod?.id === id) setShowExPanel(false);
    }
  };

  const generateAuto = (months) => {
    const existingPeriods = operationalPeriods.filter(p => p.yearId === activeYear.id);
    const hasActive = existingPeriods.some(p => p.status !== 'not_open');

    if (hasActive) {
      return alert(isRtl 
        ? "به دلیل وجود دوره‌های باز یا بسته شده، امکان بازسازی اتوماتیک دوره‌ها وجود ندارد." 
        : "Cannot regenerate periods because some are already open or closed.");
    }

    if (!window.confirm(isRtl ? "تمامی دوره‌های فعلی این سال حذف و دوره‌های جدید جایگزین شوند؟" : "Existing periods for this year will be replaced. Proceed?")) return;

    const generated = [];
    let start = new Date(activeYear.startDate);
    const totalPeriods = Math.ceil(12 / months);
    
    for (let i = 1; i <= totalPeriods; i++) {
      let currentStart = new Date(start);
      let currentEnd = new Date(start.setMonth(start.getMonth() + months));
      currentEnd.setDate(currentEnd.getDate() - 1);

      generated.push({
        id: Date.now() + i,
        yearId: activeYear.id,
        code: i.toString().padStart(2, '0'),
        title: (isRtl ? "دوره " : "Period ") + i,
        startDate: currentStart.toISOString().split('T')[0],
        endDate: currentEnd.toISOString().split('T')[0],
        status: 'not_open',
        exceptions: []
      });
      start.setDate(start.getDate() + 1);
    }
    setOperationalPeriods(prev => [...prev.filter(p => p.yearId !== activeYear.id), ...generated]);
  };

  // --- Handlers: Exceptions ---
  const addException = () => {
    if (!selectedUserToEx || !selectedPeriod) return;
    if (selectedPeriod.exceptions.includes(selectedUserToEx)) return;

    const updatedExceptions = [...selectedPeriod.exceptions, selectedUserToEx];
    
    setOperationalPeriods(prev => prev.map(p => 
      p.id === selectedPeriod.id ? { ...p, exceptions: updatedExceptions } : p
    ));
    setSelectedPeriod(prev => ({ ...prev, exceptions: updatedExceptions }));
    setSelectedUserToEx('');
  };

  const removeException = (user) => {
    const updatedExceptions = selectedPeriod.exceptions.filter(u => u !== user);
    setOperationalPeriods(prev => prev.map(p => 
      p.id === selectedPeriod.id ? { ...p, exceptions: updatedExceptions } : p
    ));
    setSelectedPeriod(prev => ({ ...prev, exceptions: updatedExceptions }));
  };

  // --- UI Constants ---
  const statusStyles = {
    open: "text-green-600 font-black bg-green-50 border-green-200",
    closed: "text-red-600 font-black bg-red-50 border-red-200",
    not_open: "text-slate-500 font-black bg-slate-50 border-slate-200"
  };

  const yearColumns = [
    { field: 'code', header: t.fp_year_code, width: 'w-24' },
    { field: 'title', header: t.fp_year_title, width: 'w-64' },
    { field: 'calendarType', header: t.fp_calendar_type, width: 'w-32', render: r => <Badge variant="primary">{r.calendarType === 'jalali' ? t.fp_jalali : t.fp_gregorian}</Badge> },
    { field: 'startDate', header: t.fp_start_date, width: 'w-32' },
    { field: 'endDate', header: t.fp_end_date, width: 'w-32' },
    { field: 'isActive', header: t.lg_status, width: 'w-24', render: r => <Badge variant={r.isActive ? 'success' : 'neutral'}>{r.isActive ? t.active : t.inactive}</Badge> }
  ];

  return (
    <div className="h-full flex flex-col p-4">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-slate-800">{t.fp_title}</h1>
        <p className="text-slate-500 text-xs mt-1">{t.fp_subtitle}</p>
      </div>

      <FilterSection onSearch={()=>{}} onClear={()=>setSearchParams({code:'', title:''})} isRtl={isRtl} title={t.filter}>
        <InputField label={t.fp_year_code} value={searchParams.code} onChange={e=>setSearchParams({...searchParams, code: e.target.value})} isRtl={isRtl} />
        <InputField label={t.fp_year_title} value={searchParams.title} onChange={e=>setSearchParams({...searchParams, title: e.target.value})} isRtl={isRtl} />
      </FilterSection>

      <div className="flex-1 overflow-hidden">
        <DataGrid 
          columns={yearColumns} data={fiscalYears} isRtl={isRtl}
          onCreate={()=>{setEditingItem(null); setFormData({isActive:true, calendarType:'jalali'}); setShowYearModal(true);}}
          onDoubleClick={(row) => { setActiveYear(row); setShowPeriodModal(true); }}
          actions={(row) => (
            <div className="flex gap-1">
              <button title={t.fp_ops_periods} onClick={() => { setActiveYear(row); setShowPeriodModal(true); }} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded"><Calendar size={16}/></button>
              <button title={t.edit} onClick={() => { setEditingItem(row); setFormData({...row}); setShowYearModal(true); }} className="p-1.5 text-slate-600 hover:bg-slate-50 rounded"><Edit size={16}/></button>
              <button title={t.delete} onClick={() => handleDeleteYear(row.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
            </div>
          )}
        />
      </div>

      {/* Modal: Year Definition */}
      <Modal isOpen={showYearModal} onClose={()=>setShowYearModal(false)} title={editingItem ? t.fp_edit_year : t.fp_new_year}
        footer={<><Button variant="outline" onClick={()=>setShowYearModal(false)}>{t.btn_cancel}</Button><Button variant="primary" onClick={handleSaveYear}>{t.btn_save}</Button></>}>
        <div className="grid grid-cols-2 gap-4">
          <InputField label={t.fp_year_code} value={formData.code} onChange={e=>setFormData({...formData, code: e.target.value})} isRtl={isRtl} />
          <InputField label={t.fp_year_title} value={formData.title} onChange={e=>setFormData({...formData, title: e.target.value})} isRtl={isRtl} />
          <SelectField label={t.fp_calendar_type} value={formData.calendarType} onChange={e=>setFormData({...formData, calendarType: e.target.value})} isRtl={isRtl}>
            <option value="jalali">{t.fp_jalali}</option>
            <option value="gregorian">{t.fp_gregorian}</option>
          </SelectField>
          <Toggle label={t.lg_status} checked={formData.isActive} onChange={v=>setFormData({...formData, isActive: v})} />
          <InputField label={t.fp_start_date} type="date" value={formData.startDate} onChange={e=>setFormData({...formData, startDate: e.target.value})} isRtl={isRtl} />
          <InputField label={t.fp_end_date} type="date" value={formData.endDate} onChange={e=>setFormData({...formData, endDate: e.target.value})} isRtl={isRtl} />
        </div>
      </Modal>

      {/* Modal: Period Manager */}
      <Modal isOpen={showPeriodModal} onClose={()=>{setShowPeriodModal(false); setShowExPanel(false);}} title={activeYear?.title} size="lg">
        <div className="flex flex-col gap-4 h-[620px] relative overflow-hidden">
          
          {/* Tool Area */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex gap-3 mb-4 border-b border-slate-200 pb-3 items-center">
               <div className="flex items-center gap-1.5 text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full border border-indigo-100 uppercase tracking-tighter">
                  <Info size={12}/> {isRtl ? 'راهنمای تولید اتوماتیک' : 'Auto Generation Guide'}
               </div>
               <span className="text-[10px] text-slate-500 leading-none">
                  {isRtl ? 'سیستم بر اساس تاریخ شروع سال، دوره‌ها را با بازه‌های انتخابی (۱، ۳ یا ۶ ماهه) تا پایان سال ایجاد می‌کند.' : 'System generates periods from year start with selected intervals until year end.'}
               </span>
               <div className="flex gap-1 ml-auto">
                  <Button variant="white" size="xs" onClick={()=>generateAuto(1)}>1 {isRtl ? 'ماهه' : 'Month'}</Button>
                  <Button variant="white" size="xs" onClick={()=>generateAuto(3)}>3 {isRtl ? 'ماهه' : 'Months'}</Button>
                  <Button variant="white" size="xs" onClick={()=>generateAuto(6)}>6 {isRtl ? 'ماهه' : 'Months'}</Button>
               </div>
            </div>
            <div className="grid grid-cols-5 gap-2 items-end">
              <InputField label={t.fp_period_code} size="sm" value={newPeriodData.code} onChange={e=>setNewPeriodData({...newPeriodData, code:e.target.value})} isRtl={isRtl} />
              <InputField label={t.fp_period_title} size="sm" value={newPeriodData.title} onChange={e=>setNewPeriodData({...newPeriodData, title:e.target.value})} isRtl={isRtl} />
              <InputField label={t.fp_start_date} type="date" size="sm" value={newPeriodData.startDate} onChange={e=>setNewPeriodData({...newPeriodData, startDate:e.target.value})} isRtl={isRtl} />
              <InputField label={t.fp_end_date} type="date" size="sm" value={newPeriodData.endDate} onChange={e=>setNewPeriodData({...newPeriodData, endDate:e.target.value})} isRtl={isRtl} />
              <Button variant="primary" size="sm" icon={newPeriodData.id ? Edit : Plus} onClick={handleSavePeriod}>{newPeriodData.id ? t.edit : t.btn_add}</Button>
            </div>
          </div>

          {/* Period List */}
          <div className="flex-1 overflow-auto border border-slate-200 rounded-xl bg-white shadow-inner">
             <table className={`w-full text-[12px] ${isRtl ? 'text-right' : 'text-left'}`}>
                <thead className="sticky top-0 bg-slate-100 font-black text-slate-600 border-b z-10">
                   <tr>
                      <th className="p-2 w-16">{t.fp_period_code}</th>
                      <th className="p-2">{t.fp_period_title}</th>
                      <th className="p-2 w-28">{t.fp_start_date}</th>
                      <th className="p-2 w-28">{t.fp_end_date}</th>
                      <th className="p-2 w-32">{t.fp_status}</th>
                      <th className="p-2 w-28 text-center">{t.col_actions}</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {operationalPeriods.filter(p=>p.yearId === activeYear?.id).map(p=>(
                     <tr key={p.id} className={`hover:bg-indigo-50/50 transition-colors ${selectedPeriod?.id === p.id ? 'bg-indigo-50' : ''}`}>
                        <td className="p-2 font-mono text-slate-400">{p.code}</td>
                        <td className="p-2 font-bold text-slate-700">{p.title}</td>
                        <td className="p-2 text-slate-500">{p.startDate}</td>
                        <td className="p-2 text-slate-500">{p.endDate}</td>
                        <td className="p-2">
                           <select 
                             value={p.status} 
                             onChange={e=>setOperationalPeriods(prev=>prev.map(x=>x.id===p.id?{...x, status:e.target.value}:x))} 
                             className={`text-[11px] p-1 rounded border outline-none focus:ring-1 focus:ring-indigo-400 cursor-pointer ${statusStyles[p.status]}`}
                           >
                              <option value="not_open">{t.fp_st_not_open}</option>
                              <option value="open">{t.fp_st_open}</option>
                              <option value="closed">{t.fp_st_closed}</option>
                           </select>
                        </td>
                        <td className="p-2">
                           <div className="flex gap-1 justify-center">
                              <button title={t.fp_exceptions} onClick={()=>{setSelectedPeriod(p); setShowExPanel(true);}} className={`p-1.5 rounded bg-white border border-slate-200 shadow-sm ${p.exceptions.length > 0 ? 'text-indigo-600 border-indigo-200' : 'text-slate-400'}`}><Users size={14}/></button>
                              <button title={t.edit} onClick={()=>setNewPeriodData(p)} className="p-1.5 rounded bg-white border border-slate-200 shadow-sm text-slate-600 hover:text-indigo-600"><Edit size={14}/></button>
                              <button 
                                title={t.delete} 
                                onClick={()=>deletePeriod(p.id)} 
                                disabled={p.status !== 'not_open'}
                                className={`p-1.5 rounded bg-white border border-slate-200 shadow-sm ${p.status === 'not_open' ? 'text-red-500 hover:bg-red-50' : 'text-slate-200 cursor-not-allowed'}`}
                              >
                                <Trash size={14}/>
                              </button>
                           </div>
                        </td>
                     </tr>
                   ))}
                </tbody>
             </table>
          </div>

          {/* SIDEBAR: Exceptions Panel */}
          <div className={`
             absolute top-0 ${isRtl ? 'left-0 border-r' : 'right-0 border-l'} w-72 h-full bg-white shadow-2xl z-20 
             flex flex-col transition-all duration-300 ease-in-out transform
             ${showExPanel ? 'translate-x-0' : (isRtl ? '-translate-x-full' : 'translate-x-full')}
          `}>
             <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                <div className="flex items-center gap-2 font-black text-sm text-indigo-700 uppercase tracking-tighter italic">
                   <Users size={16}/> {t.fp_exceptions}
                </div>
                <button onClick={()=>setShowExPanel(false)} className="text-slate-400 hover:text-slate-800"><X size={18}/></button>
             </div>
             <div className="p-4 flex flex-col gap-4 flex-1 overflow-hidden">
                <div className="text-[11px] text-slate-500 font-medium bg-slate-50 p-2 rounded-lg border border-slate-100 flex items-center gap-2">
                   <Clock size={12}/> {selectedPeriod?.title}
                </div>
                <div className="flex gap-1">
                   <SelectField className="flex-1" size="sm" value={selectedUserToEx} onChange={e => setSelectedUserToEx(e.target.value)}>
                      <option value="">{t.fp_select_user}</option>
                      <option value="Admin">Admin</option>
                      <option value="Financial Manager">Financial Manager</option>
                      <option value="Audit Dept">Audit Dept</option>
                      <option value="Branch Supervisor">Branch Supervisor</option>
                   </SelectField>
                   <Button variant="primary" size="iconSm" icon={UserPlus} onClick={addException} />
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar mt-2">
                   {selectedPeriod?.exceptions.map(user => (
                     <div key={user} className="flex justify-between items-center p-2.5 bg-white rounded-xl border border-slate-100 shadow-sm group hover:border-red-200 transition-colors">
                        <span className="text-[11px] font-bold text-slate-700">{user}</span>
                        <button onClick={()=>removeException(user)} className="text-slate-300 hover:text-red-500 transition-colors"><X size={14}/></button>
                     </div>
                   ))}
                   {selectedPeriod?.exceptions.length === 0 && (
                     <div className="flex flex-col items-center justify-center h-32 opacity-20">
                        <Users size={32} strokeWidth={1}/>
                        <span className="text-[10px] mt-2 font-black">{isRtl ? 'لیست خالی' : 'NO EXCEPTIONS'}</span>
                     </div>
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
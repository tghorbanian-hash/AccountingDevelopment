/* Filename: financial/generalledger/FiscalPeriods.js */
import React, { useState, useMemo } from 'react';
import { 
  Calendar, Edit, Trash2, Plus, Play, Lock, 
  Clock, Users, Zap, UserPlus, X, Trash, Info, CheckCircle2
} from 'lucide-react';

const FiscalPeriods = ({ t, isRtl }) => {
  const { 
    Button, InputField, SelectField, Toggle, DataGrid, 
    FilterSection, Modal, Badge, Callout 
  } = window.UI;

  // --- State: Data ---
  const [fiscalYears, setFiscalYears] = useState([
    { id: 1, code: '1403', title: 'سال مالی ۱۴۰۳', startDate: '2024-03-20', endDate: '2025-03-20', calendarType: 'jalali', isActive: true },
    { id: 2, code: '2025', title: 'Fiscal Year 2025', startDate: '2025-01-01', endDate: '2025-12-31', calendarType: 'gregorian', isActive: true },
  ]);

  const [operationalPeriods, setOperationalPeriods] = useState([
    { 
      id: 10, 
      yearId: 1, 
      code: '01', 
      title: 'فروردین ۱۴۰۳', 
      startDate: '2024-03-20', 
      endDate: '2024-04-20', 
      status: 'open', 
      exceptions: [{ user: 'Financial Manager', allowedStatuses: ['closed', 'not_open'] }] 
    },
  ]);

  // --- State: UI ---
  const [showYearModal, setShowYearModal] = useState(false);
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [showExPanel, setShowExPanel] = useState(false);
  const [activeYear, setActiveYear] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [searchParams, setSearchParams] = useState({ code: '', title: '' });
  const [newPeriodData, setNewPeriodData] = useState({ code: '', title: '', startDate: '', endDate: '', status: 'not_open' });
  const [exUser, setExUser] = useState('');
  const [exStatuses, setExStatuses] = useState([]);

  // --- Logic Helpers ---
  const checkOverlap = (start, end, list, excludeId = null) => {
    return list.some(p => {
      if (excludeId && p.id === excludeId) return false;
      return (start <= p.endDate && end >= p.startDate);
    });
  };

  // --- Handlers: Year ---
  const handleSaveYear = () => {
    if (!formData.code || !formData.startDate || !formData.endDate) return alert(t.alert_req_fields);
    if (checkOverlap(formData.startDate, formData.endDate, fiscalYears, editingItem?.id)) {
      return alert(isRtl ? "این بازه زمانی با سال مالی دیگری تداخل دارد" : "Date range overlaps with another year");
    }
    if (editingItem) {
      setFiscalYears(prev => prev.map(y => y.id === editingItem.id ? { ...formData, id: y.id } : y));
    } else {
      setFiscalYears(prev => [...prev, { ...formData, id: Date.now() }]);
    }
    setShowYearModal(false);
  };

  const handleDeleteYear = (id) => {
    const yearPeriods = operationalPeriods.filter(p => p.yearId === id);
    if (yearPeriods.some(p => p.status !== 'not_open')) {
      return alert(isRtl ? "به دلیل وجود دوره‌های باز یا بسته، حذف سال امکان‌پذیر نیست" : "Cannot delete year with open/closed periods");
    }
    if (window.confirm(isRtl ? "آیا از حذف این سال مالی و تمام دوره‌های آن اطمینان دارید؟" : "Delete year and all its periods?")) {
      setFiscalYears(prev => prev.filter(y => y.id !== id));
      setOperationalPeriods(prev => prev.filter(p => p.yearId !== id));
    }
  };

  // --- Handlers: Periods ---
  const handleSavePeriod = () => {
    if (!newPeriodData.code || !newPeriodData.startDate || !newPeriodData.endDate) return alert(t.alert_req_fields);
    const yearPeriods = operationalPeriods.filter(p => p.yearId === activeYear.id);
    if (checkOverlap(newPeriodData.startDate, newPeriodData.endDate, yearPeriods, newPeriodData.id)) {
      return alert(isRtl ? "تداخل با دوره‌های موجود" : "Overlaps with existing periods");
    }

    if (newPeriodData.id) {
      setOperationalPeriods(prev => prev.map(p => p.id === newPeriodData.id ? { ...newPeriodData } : p));
    } else {
      setOperationalPeriods(prev => [...prev, { ...newPeriodData, id: Date.now(), yearId: activeYear.id, exceptions: [] }]);
    }
    setNewPeriodData({ code: '', title: '', startDate: '', endDate: '', status: 'not_open' });
  };

  const generateAuto = (months) => {
    const existing = operationalPeriods.filter(p => p.yearId === activeYear.id);
    if (existing.some(p => p.status !== 'not_open')) {
      return alert(isRtl ? "به دلیل وجود دوره باز/بسته، امکان تولید مجدد نیست" : "Regeneration blocked by open/closed periods");
    }
    if (!window.confirm(isRtl ? "دوره‌های فعلی حذف و جایگزین شوند؟" : "Replace current periods?")) return;

    const generated = [];
    let start = new Date(activeYear.startDate);
    const total = Math.ceil(12 / months);
    for (let i = 1; i <= total; i++) {
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

  // --- Handlers: Exceptions ---
  const toggleStatusInEx = (status) => {
    setExStatuses(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]);
  };

  const addEx = () => {
    if (!exUser || exStatuses.length === 0) return alert(isRtl ? "کاربر و وضعیت را انتخاب کنید" : "Select user and status");
    // Check if user already exists, if so update, else add
    const existingIndex = selectedPeriod.exceptions.findIndex(e => e.user === exUser);
    let updated;
    
    if (existingIndex >= 0) {
       updated = [...selectedPeriod.exceptions];
       updated[existingIndex] = { user: exUser, allowedStatuses: exStatuses };
    } else {
       updated = [...(selectedPeriod.exceptions || []), { user: exUser, allowedStatuses: exStatuses }];
    }

    setOperationalPeriods(prev => prev.map(p => p.id === selectedPeriod.id ? { ...p, exceptions: updated } : p));
    setSelectedPeriod(prev => ({ ...prev, exceptions: updated }));
    setExUser(''); setExStatuses([]);
  };

  const removeEx = (userName) => {
    const updated = selectedPeriod.exceptions.filter(e => e.user !== userName);
    setOperationalPeriods(prev => prev.map(p => p.id === selectedPeriod.id ? { ...p, exceptions: updated } : p));
    setSelectedPeriod(prev => ({ ...prev, exceptions: updated }));
  };

  // --- Constants ---
  const statusStyles = {
    open: "text-green-600 font-black bg-green-50 border-green-200",
    closed: "text-red-600 font-black bg-red-50 border-red-200",
    not_open: "text-slate-500 font-black bg-slate-50 border-slate-200"
  };

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
          columns={[
            { field: 'code', header: t.fp_year_code, width: 'w-24' },
            { field: 'title', header: t.fp_year_title, width: 'w-64' },
            { field: 'calendarType', header: t.fp_calendar_type, width: 'w-32', render: r => <Badge variant="primary">{r.calendarType === 'jalali' ? t.fp_jalali : t.fp_gregorian}</Badge> },
            { field: 'startDate', header: t.fp_start_date, width: 'w-32' },
            { field: 'endDate', header: t.fp_end_date, width: 'w-32' },
            { field: 'isActive', header: t.lg_status, width: 'w-24', render: r => <Badge variant={r.isActive ? 'success' : 'neutral'}>{r.isActive ? t.active : t.inactive}</Badge> }
          ]} 
          data={fiscalYears} isRtl={isRtl}
          onCreate={()=>{setEditingItem(null); setFormData({isActive:true, calendarType:'jalali'}); setShowYearModal(true);}}
          onDoubleClick={(row) => { setActiveYear(row); setShowPeriodModal(true); }}
          actions={(row) => (
            <div className="flex gap-1">
              <button onClick={() => { setActiveYear(row); setShowPeriodModal(true); }} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded"><Calendar size={16}/></button>
              <button onClick={() => { setEditingItem(row); setFormData({...row}); setShowYearModal(true); }} className="p-1.5 text-slate-600 hover:bg-slate-50 rounded"><Edit size={16}/></button>
              <button onClick={() => handleDeleteYear(row.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
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
        <div className="flex flex-col gap-4 h-[650px] relative overflow-hidden">
          
          {/* Top Panel: Auto Generation Guide & Tools */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex flex-col gap-2 mb-4 border-b border-slate-200 pb-3">
               <div className="flex items-center gap-2">
                 <div className="flex items-center gap-1.5 text-[11px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full border border-indigo-100 uppercase tracking-tighter">
                    <Info size={14}/> {t.fp_auto_gen}
                 </div>
                 <span className="text-[11px] text-slate-500 leading-none">
                    {isRtl ? 'با کلیک بر روی دکمه‌های زیر، سیستم دوره‌های زمانی را بر اساس تاریخ شروع سال تولید می‌کند.' : 'Click buttons below to auto-generate periods starting from year begin date.'}
                 </span>
               </div>
               <div className="flex gap-2 mt-1">
                  <Button variant="white" size="sm" onClick={()=>generateAuto(1)}>{t.fp_gen_monthly}</Button>
                  <Button variant="white" size="sm" onClick={()=>generateAuto(3)}>{t.fp_gen_quarterly}</Button>
                  <Button variant="white" size="sm" onClick={()=>generateAuto(6)}>{t.fp_gen_semi}</Button>
               </div>
            </div>

            {/* Manual Entry */}
            <div className="grid grid-cols-5 gap-2 items-end">
              <InputField label={t.fp_period_code} size="sm" value={newPeriodData.code} onChange={e=>setNewPeriodData({...newPeriodData, code:e.target.value})} isRtl={isRtl} />
              <InputField label={t.fp_period_title} size="sm" value={newPeriodData.title} onChange={e=>setNewPeriodData({...newPeriodData, title:e.target.value})} isRtl={isRtl} />
              <InputField label={t.fp_start_date} type="date" size="sm" value={newPeriodData.startDate} onChange={e=>setNewPeriodData({...newPeriodData, startDate:e.target.value})} isRtl={isRtl} />
              <InputField label={t.fp_end_date} type="date" size="sm" value={newPeriodData.endDate} onChange={e=>setNewPeriodData({...newPeriodData, endDate:e.target.value})} isRtl={isRtl} />
              <Button variant="primary" size="sm" icon={Plus} onClick={handleSavePeriod}>{t.btn_add}</Button>
            </div>
          </div>

          <div className="flex-1 overflow-auto border border-slate-200 rounded-xl bg-white shadow-inner">
             <table className={`w-full text-[12px] ${isRtl ? 'text-right' : 'text-left'}`}>
                <thead className="sticky top-0 bg-slate-100 font-black text-slate-600 border-b z-10">
                   <tr>
                      <th className="p-2 w-16">{t.fp_period_code}</th>
                      <th className="p-2">{t.fp_period_title}</th>
                      <th className="p-2 w-28">{t.fp_start_date}</th>
                      <th className="p-2 w-28">{t.fp_end_date}</th>
                      <th className="p-2 w-32">{t.fp_status}</th>
                      <th className="p-2 w-24 text-center">{t.col_actions}</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {operationalPeriods.filter(p=>p.yearId === activeYear?.id).map(p=>(
                     <tr key={p.id} className={`hover:bg-indigo-50/50 transition-colors ${selectedPeriod?.id === p.id ? 'bg-indigo-50 font-bold' : ''}`}>
                        <td className="p-2 font-mono text-slate-400">{p.code}</td>
                        <td className="p-2 text-slate-700">{p.title}</td>
                        <td className="p-2 text-slate-500">{p.startDate}</td>
                        <td className="p-2 text-slate-500">{p.endDate}</td>
                        <td className="p-2">
                           <select value={p.status} onChange={e=>setOperationalPeriods(prev=>prev.map(x=>x.id===p.id?{...x, status:e.target.value}:x))} className={`text-[11px] p-1 rounded border outline-none ${statusStyles[p.status]}`}>
                              <option value="not_open">{t.fp_st_not_open}</option>
                              <option value="open">{t.fp_st_open}</option>
                              <option value="closed">{t.fp_st_closed}</option>
                           </select>
                        </td>
                        <td className="p-2 flex gap-1 justify-center">
                           <button onClick={()=>{setSelectedPeriod(p); setShowExPanel(true);}} className={`p-1.5 rounded bg-white border border-slate-200 shadow-sm ${p.exceptions.length > 0 ? 'text-indigo-600 border-indigo-200' : 'text-slate-400'}`}><Users size={14}/></button>
                           <button onClick={()=>setNewPeriodData(p)} className="p-1.5 rounded bg-white border border-slate-200 shadow-sm text-slate-600"><Edit size={14}/></button>
                           <button onClick={()=>deletePeriod(p.id)} disabled={p.status !== 'not_open'} className={`p-1.5 rounded bg-white border border-slate-200 shadow-sm ${p.status === 'not_open' ? 'text-red-500' : 'text-slate-200'}`}><Trash size={14}/></button>
                        </td>
                     </tr>
                   ))}
                </tbody>
             </table>
          </div>

          <div className={`absolute top-0 ${isRtl ? 'left-0 border-r' : 'right-0 border-l'} w-80 h-full bg-white shadow-2xl z-20 flex flex-col transition-all duration-300 transform ${showExPanel ? 'translate-x-0' : (isRtl ? '-translate-x-full' : 'translate-x-full')}`}>
             <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                <div className="flex items-center gap-2 font-black text-xs text-indigo-700 uppercase italic"><Users size={16}/> {t.fp_exceptions}</div>
                <button onClick={()=>setShowExPanel(false)} className="text-slate-400 hover:text-slate-800"><X size={18}/></button>
             </div>
             <div className="p-4 flex flex-col gap-4 flex-1 overflow-hidden">
                <div className="space-y-4 bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-inner">
                   <SelectField label={t.fp_user} size="sm" value={exUser} onChange={e=>setExUser(e.target.value)}>
                      <option value="">{t.fp_select_user}</option>
                      <option value="Financial Manager">Financial Manager</option>
                      <option value="System Admin">System Admin</option>
                      <option value="Audit Team">Audit Team</option>
                   </SelectField>
                   <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase px-1">{isRtl ? 'وضعیت‌های مجاز' : 'Allowed Statuses'}</label>
                      {['open', 'not_open', 'closed'].map(st => (
                        <div key={st} onClick={() => toggleStatusInEx(st)} className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all mb-1 ${exStatuses.includes(st) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-600'}`}>
                           <span className="text-[11px] font-bold">{t[`fp_st_${st}`]}</span>
                           {exStatuses.includes(st) && <CheckCircle2 size={14}/>}
                        </div>
                      ))}
                   </div>
                   <Button variant="primary" size="sm" className="w-full" icon={UserPlus} onClick={addEx}>{t.btn_add}</Button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar mt-2">
                   {selectedPeriod?.exceptions.map(ex => (
                     <div key={ex.user} className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm flex justify-between items-start group">
                        <div>
                           <div className="text-[11px] font-black text-slate-800 mb-2">{ex.user}</div>
                           <div className="flex flex-wrap gap-1">
                              {ex.allowedStatuses.map(st => (
                                 <span key={st} className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold border ${statusStyles[st]}`}>{t[`fp_st_${st}`]}</span>
                              ))}
                           </div>
                        </div>
                        <button onClick={()=>removeEx(ex.user)} className="text-slate-300 hover:text-red-500 transition-colors p-1"><Trash2 size={14}/></button>
                     </div>
                   ))}
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
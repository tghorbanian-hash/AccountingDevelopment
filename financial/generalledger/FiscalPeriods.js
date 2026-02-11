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

  // --- Mock Data ---
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
      exceptions: [
        { user: 'Financial Manager', allowedStatuses: ['closed', 'not_open'] }
      ] 
    },
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
  
  // Exception Sidebar States
  const [exUser, setExUser] = useState('');
  const [exStatuses, setExStatuses] = useState([]);

  // --- Handlers: Year & Period ---
  const handleSaveYear = () => {
    if (!formData.code || !formData.startDate || !formData.endDate) return alert(t.alert_req_fields);
    if (editingItem) {
      setFiscalYears(prev => prev.map(y => y.id === editingItem.id ? { ...formData, id: y.id } : y));
    } else {
      setFiscalYears(prev => [...prev, { ...formData, id: Date.now() }]);
    }
    setShowYearModal(false);
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

  // --- Exception Handlers ---
  const toggleStatusInException = (status) => {
    setExStatuses(prev => 
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const addException = () => {
    if (!exUser || exStatuses.length === 0) return alert(isRtl ? "لطفاً کاربر و حداقل یک وضعیت را انتخاب کنید" : "Please select user and at least one status");
    
    const newEx = { user: exUser, allowedStatuses: exStatuses };
    const updatedExList = [...(selectedPeriod.exceptions || []), newEx];

    setOperationalPeriods(prev => prev.map(p => 
      p.id === selectedPeriod.id ? { ...p, exceptions: updatedExList } : p
    ));
    setSelectedPeriod(prev => ({ ...prev, exceptions: updatedExList }));
    
    setExUser('');
    setExStatuses([]);
  };

  const removeException = (userName) => {
    const updatedExList = selectedPeriod.exceptions.filter(e => e.user !== userName);
    setOperationalPeriods(prev => prev.map(p => 
      p.id === selectedPeriod.id ? { ...p, exceptions: updatedExList } : p
    ));
    setSelectedPeriod(prev => ({ ...prev, exceptions: updatedExList }));
  };

  // --- UI Constants ---
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
              <button onClick={() => {}} className="p-1.5 text-red-500 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
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

      {/* Modal: Operational Periods */}
      <Modal isOpen={showPeriodModal} onClose={()=>{setShowPeriodModal(false); setShowExPanel(false);}} title={activeYear?.title} size="lg">
        <div className="flex flex-col gap-4 h-[650px] relative overflow-hidden">
          
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
             <div className="grid grid-cols-5 gap-2 items-end">
              <InputField label={t.fp_period_code} size="sm" value={newPeriodData.code} onChange={e=>setNewPeriodData({...newPeriodData, code:e.target.value})} isRtl={isRtl} />
              <InputField label={t.fp_period_title} size="sm" value={newPeriodData.title} onChange={e=>setNewPeriodData({...newPeriodData, title:e.target.value})} isRtl={isRtl} />
              <InputField label={t.fp_start_date} type="date" size="sm" value={newPeriodData.startDate} onChange={e=>setNewPeriodData({...newPeriodData, startDate:e.target.value})} isRtl={isRtl} />
              <InputField label={t.fp_end_date} type="date" size="sm" value={newPeriodData.endDate} onChange={e=>setNewPeriodData({...newPeriodData, endDate:e.target.value})} isRtl={isRtl} />
              <Button variant="primary" size="sm" icon={Plus} onClick={() => setOperationalPeriods(prev => [...prev, {...newPeriodData, id: Date.now(), yearId: activeYear.id, exceptions: []}])}>{t.btn_add}</Button>
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
                           <button onClick={()=>deletePeriod(p.id)} disabled={p.status !== 'not_open'} className={`p-1.5 rounded bg-white border border-slate-200 shadow-sm ${p.status === 'not_open' ? 'text-red-500 hover:bg-red-50' : 'text-slate-200'}`}><Trash size={14}/></button>
                        </td>
                     </tr>
                   ))}
                </tbody>
             </table>
          </div>

          {/* SIDEBAR: Advanced Exceptions */}
          <div className={`
             absolute top-0 ${isRtl ? 'left-0 border-r' : 'right-0 border-l'} w-80 h-full bg-white shadow-2xl z-20 
             flex flex-col transition-all duration-300 transform
             ${showExPanel ? 'translate-x-0' : (isRtl ? '-translate-x-full' : 'translate-x-full')}
          `}>
             <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                <div className="flex items-center gap-2 font-black text-xs text-indigo-700 uppercase italic">
                   <Users size={16}/> {t.fp_exceptions}
                </div>
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
                   
                   <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase px-1">{isRtl ? 'وضعیت‌های مجاز استثنا' : 'Allowed Status Exceptions'}</label>
                      <div className="flex flex-col gap-1.5">
                         {['open', 'not_open', 'closed'].map(st => (
                           <div key={st} onClick={() => toggleStatusInException(st)} className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all ${exStatuses.includes(st) ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'}`}>
                              <span className="text-[11px] font-bold">{t[`fp_st_${st}`]}</span>
                              {exStatuses.includes(st) && <CheckCircle2 size={14}/>}
                           </div>
                         ))}
                      </div>
                   </div>
                   
                   <Button variant="primary" size="sm" className="w-full" icon={UserPlus} onClick={addException}>{t.btn_add}</Button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 mt-2 no-scrollbar">
                   {selectedPeriod?.exceptions.map(ex => (
                     <div key={ex.user} className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm relative group">
                        <button onClick={()=>removeException(ex.user)} className="absolute top-2 right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><X size={14}/></button>
                        <div className="text-[11px] font-black text-slate-800 mb-2">{ex.user}</div>
                        <div className="flex flex-wrap gap-1">
                           {ex.allowedStatuses.map(st => (
                              <span key={st} className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold border ${statusStyles[st]}`}>{t[`fp_st_${st}`]}</span>
                           ))}
                        </div>
                     </div>
                   ))}
                   {(!selectedPeriod?.exceptions || selectedPeriod.exceptions.length === 0) && (
                     <div className="flex flex-col items-center justify-center h-40 opacity-20 italic text-[10px]">
                        <Users size={32} strokeWidth={1} className="mb-2"/> {isRtl ? 'هیچ کاربری ثبت نشده' : 'NO EXCEPTIONS REGISTERED'}
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

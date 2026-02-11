/* Filename: financial/generalledger/FiscalPeriods.js */
import React, { useState, useMemo } from 'react';
import { 
  Calendar, Edit, Trash2, Plus, Play, Lock, 
  Clock, Users, Zap, UserPlus, X
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
  const [showExModal, setShowExModal] = useState(false);
  
  const [activeYear, setActiveYear] = useState(null);
  const [activePeriod, setActivePeriod] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [searchParams, setSearchParams] = useState({ code: '', title: '' });
  
  // New Period Form State (For manual entry in modal)
  const [newPeriodData, setNewPeriodData] = useState({ code: '', title: '', startDate: '', endDate: '', status: 'not_open' });

  // --- Handlers: Overlap Check ---
  const isOverlapping = (start, end, list, excludeId = null) => {
    return list.some(p => {
      if (excludeId && p.id === excludeId) return false;
      return (start <= p.endDate && end >= p.startDate);
    });
  };

  // --- Handlers: Fiscal Year ---
  const handleCreateYear = () => {
    setEditingItem(null);
    setFormData({ code: '', title: '', startDate: '', endDate: '', calendarType: 'jalali', isActive: true });
    setShowYearModal(true);
  };

  const handleSaveYear = () => {
    if (!formData.code || !formData.startDate || !formData.endDate) return alert(t.alert_req_fields);
    if (isOverlapping(formData.startDate, formData.endDate, fiscalYears, editingItem?.id)) {
      return alert(isRtl ? "این بازه زمانی با سال مالی دیگری تداخل دارد" : "Date range overlaps with another year");
    }
    if (editingItem) {
      setFiscalYears(prev => prev.map(y => y.id === editingItem.id ? { ...formData, id: y.id } : y));
    } else {
      setFiscalYears(prev => [...prev, { ...formData, id: Date.now() }]);
    }
    setShowYearModal(false);
  };

  // --- Handlers: Operational Periods ---
  const handleAddManualPeriod = () => {
    if (!newPeriodData.code || !newPeriodData.startDate || !newPeriodData.endDate) return alert(t.alert_req_fields);
    
    const yearPeriods = operationalPeriods.filter(p => p.yearId === activeYear.id);
    if (isOverlapping(newPeriodData.startDate, newPeriodData.endDate, yearPeriods)) {
      return alert(isRtl ? "تداخل با دوره‌های موجود در این سال" : "Overlaps with existing periods");
    }

    const newEntry = { ...newPeriodData, id: Date.now(), yearId: activeYear.id, exceptions: [] };
    setOperationalPeriods(prev => [...prev, newEntry]);
    setNewPeriodData({ code: '', title: '', startDate: '', endDate: '', status: 'not_open' });
  };

  const generateAutoPeriods = () => {
    if (!activeYear) return;
    const msg = isRtl ? "آیا دوره‌های ماهانه به صورت خودکار ایجاد شوند؟" : "Generate monthly periods automatically?";
    if (!window.confirm(msg)) return;

    // Simulating auto-generation of 12 months based on activeYear dates
    const generated = [];
    let baseDate = new Date(activeYear.startDate);
    for (let i = 1; i <= 12; i++) {
      const code = i.toString().padStart(2, '0');
      const start = new Date(baseDate);
      const end = new Date(baseDate.setMonth(baseDate.getMonth() + 1));
      generated.push({
        id: Date.now() + i,
        yearId: activeYear.id,
        code,
        title: (isRtl ? "دوره " : "Period ") + code,
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
        status: 'not_open',
        exceptions: []
      });
    }
    setOperationalPeriods(prev => [...prev.filter(p => p.yearId !== activeYear.id), ...generated]);
  };

  // --- Handlers: Exceptions ---
  const handleManageExceptions = (period) => {
    setActivePeriod(period);
    setShowExModal(true);
  };

  const removeException = (user) => {
    setOperationalPeriods(prev => prev.map(p => 
      p.id === activePeriod.id ? { ...p, exceptions: p.exceptions.filter(e => e !== user) } : p
    ));
    setActivePeriod(prev => ({ ...prev, exceptions: prev.exceptions.filter(e => e !== user) }));
  };

  // --- Columns ---
  const yearColumns = [
    { field: 'code', header: t.fp_year_code, width: 'w-24' },
    { field: 'title', header: t.fp_year_title, width: 'w-64' },
    { field: 'calendarType', header: t.fp_calendar_type, width: 'w-32', render: r => r.calendarType === 'jalali' ? t.fp_jalali : t.fp_gregorian },
    { field: 'startDate', header: t.fp_start_date, width: 'w-32' },
    { field: 'endDate', header: t.fp_end_date, width: 'w-32' },
    { field: 'isActive', header: t.active_status, width: 'w-24', render: r => <Badge variant={r.isActive ? 'success' : 'neutral'}>{r.isActive ? t.active : t.inactive}</Badge> }
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
          columns={yearColumns} data={fiscalYears} onCreate={handleCreateYear} isRtl={isRtl}
          onDoubleClick={(row) => { setActiveYear(row); setShowPeriodModal(true); }}
          actions={(row) => (
            <div className="flex gap-1">
              <Button variant="ghost" size="iconSm" icon={Calendar} onClick={() => { setActiveYear(row); setShowPeriodModal(true); }} className="text-indigo-600" />
              <Button variant="ghost" size="iconSm" icon={Edit} onClick={() => { setEditingItem(row); setFormData({...row}); setShowYearModal(true); }} />
            </div>
          )}
        />
      </div>

      {/* Modal: Year Define */}
      <Modal isOpen={showYearModal} onClose={()=>setShowYearModal(false)} title={editingItem ? t.fp_edit_year : t.fp_new_year}
        footer={<><Button variant="outline" onClick={()=>setShowYearModal(false)}>{t.btn_cancel}</Button><Button variant="primary" onClick={handleSaveYear}>{t.btn_save}</Button></>}>
        <div className="grid grid-cols-2 gap-4">
          <InputField label={t.fp_year_code} value={formData.code} onChange={e=>setFormData({...formData, code: e.target.value})} isRtl={isRtl} />
          <InputField label={t.fp_year_title} value={formData.title} onChange={e=>setFormData({...formData, title: e.target.value})} isRtl={isRtl} />
          <SelectField label={t.fp_calendar_type} value={formData.calendarType} onChange={e=>setFormData({...formData, calendarType: e.target.value})} isRtl={isRtl}>
            <option value="jalali">{t.fp_jalali}</option>
            <option value="gregorian">{t.fp_gregorian}</option>
          </SelectField>
          <div/>
          <InputField label={t.fp_start_date} type="date" value={formData.startDate} onChange={e=>setFormData({...formData, startDate: e.target.value})} isRtl={isRtl} />
          <InputField label={t.fp_end_date} type="date" value={formData.endDate} onChange={e=>setFormData({...formData, endDate: e.target.value})} isRtl={isRtl} />
        </div>
      </Modal>

      {/* Modal: Periods Manager */}
      <Modal isOpen={showPeriodModal} onClose={()=>setShowPeriodModal(false)} title={`${t.fp_ops_periods}: ${activeYear?.title}`} size="lg"
        footer={<Button variant="outline" onClick={()=>setShowPeriodModal(false)}>{t.btn_close}</Button>}>
        <div className="flex flex-col gap-4 h-[550px]">
          {/* Top Form: Manual & Auto */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-6 gap-3 items-end">
            <InputField label={t.fp_period_code} size="sm" value={newPeriodData.code} onChange={e=>setNewPeriodData({...newPeriodData, code: e.target.value})} isRtl={isRtl} />
            <InputField label={t.fp_period_title} size="sm" value={newPeriodData.title} onChange={e=>setNewPeriodData({...newPeriodData, title: e.target.value})} isRtl={isRtl} />
            <InputField label={t.fp_start_date} type="date" size="sm" value={newPeriodData.startDate} onChange={e=>setNewPeriodData({...newPeriodData, startDate: e.target.value})} isRtl={isRtl} />
            <InputField label={t.fp_end_date} type="date" size="sm" value={newPeriodData.endDate} onChange={e=>setNewPeriodData({...newPeriodData, endDate: e.target.value})} isRtl={isRtl} />
            <Button variant="primary" size="sm" icon={Plus} onClick={handleAddManualPeriod}>{t.btn_add}</Button>
            <Button variant="outline" size="sm" icon={Zap} className="text-orange-600 border-orange-200 bg-orange-50" onClick={generateAutoPeriods}>{t.fp_auto_gen}</Button>
          </div>

          {/* Compact Grid */}
          <div className="flex-1 overflow-auto border rounded-xl border-slate-200 shadow-inner bg-white">
            <table className={`w-full text-[12px] ${isRtl ? 'text-right' : 'text-left'}`}>
              <thead className="sticky top-0 bg-slate-100 border-b border-slate-200 text-slate-600 font-bold z-10">
                <tr>
                  <th className="p-2 w-16">{t.fp_period_code}</th>
                  <th className="p-2">{t.fp_period_title}</th>
                  <th className="p-2 w-28">{t.fp_start_date}</th>
                  <th className="p-2 w-28">{t.fp_end_date}</th>
                  <th className="p-2 w-28">{t.fp_status}</th>
                  <th className="p-2 w-16 text-center">{t.fp_exceptions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {operationalPeriods.filter(p=>p.yearId === activeYear?.id).map(p => (
                  <tr key={p.id} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="p-2 font-mono text-slate-500">{p.code}</td>
                    <td className="p-2 font-bold text-slate-700">{p.title}</td>
                    <td className="p-2 text-slate-500">{p.startDate}</td>
                    <td className="p-2 text-slate-500">{p.endDate}</td>
                    <td className="p-2">
                       <select 
                        value={p.status} 
                        onChange={(e) => setOperationalPeriods(prev => prev.map(item => item.id === p.id ? { ...item, status: e.target.value } : item))}
                        className="bg-transparent border-none text-[11px] font-bold focus:ring-0 p-0 cursor-pointer text-indigo-600"
                       >
                         <option value="not_open">{t.fp_st_not_open}</option>
                         <option value="open">{t.fp_st_open}</option>
                         <option value="closed">{t.fp_st_closed}</option>
                       </select>
                    </td>
                    <td className="p-2 text-center">
                       <button onClick={()=>handleManageExceptions(p)} className={`p-1 rounded hover:bg-white shadow-sm transition-all ${p.exceptions.length > 0 ? 'text-indigo-600' : 'text-slate-300'}`}>
                         <Users size={16} />
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      {/* Modal: Exceptions Manager */}
      <Modal isOpen={showExModal} onClose={()=>setShowExModal(false)} title={t.fp_exceptions} size="sm">
        <div className="flex flex-col gap-4">
          <Callout variant="info" title={activePeriod?.title}>{t.fp_exc_desc}</Callout>
          <div className="flex gap-2">
            <SelectField label={t.fp_user} isRtl={isRtl} className="flex-1">
               <option value="">{t.fp_select_user}</option>
               <option value="manager">Financial Manager</option>
               <option value="supervisor">Account Supervisor</option>
            </SelectField>
            <Button variant="primary" size="icon" icon={UserPlus} className="mt-6" />
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
             {activePeriod?.exceptions.map(user => (
               <Badge key={user} variant="primary" className="pl-1 flex items-center gap-1">
                  {user}
                  <X size={12} className="cursor-pointer hover:text-red-200" onClick={() => removeException(user)} />
               </Badge>
             ))}
             {activePeriod?.exceptions.length === 0 && <div className="text-slate-400 text-xs text-center w-full py-4">{isRtl ? 'هیچ کاربری اضافه نشده است' : 'No users added'}</div>}
          </div>
        </div>
      </Modal>

    </div>
  );
};

window.FiscalPeriods = FiscalPeriods;
export default FiscalPeriods;
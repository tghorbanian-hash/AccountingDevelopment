/* Filename: financial/generalledger/FiscalPeriods.js */
import React, { useState, useMemo } from 'react';
import { 
  Calendar, Edit, Trash2, Plus, Play, Lock, 
  Clock, Users, Zap, AlertCircle, ChevronLeft 
} from 'lucide-react';

const FiscalPeriods = ({ t, isRtl }) => {
  const { 
    Button, InputField, SelectField, Toggle, DataGrid, 
    FilterSection, Modal, Badge, Callout 
  } = window.UI;

  // --- Mock Data ---
  const [fiscalYears, setFiscalYears] = useState([
    { id: 1, code: '1403', title: 'سال مالی ۱۴۰۳', startDate: '2024-03-20', endDate: '2025-03-20', isActive: true },
    { id: 2, code: '1404', title: 'سال مالی ۱۴۰۴', startDate: '2025-03-21', endDate: '2026-03-20', isActive: true },
  ]);

  const [operationalPeriods, setOperationalPeriods] = useState([
    { id: 10, yearId: 1, code: '01', title: 'فروردین ۱۴۰۳', startDate: '2024-03-20', endDate: '2024-04-20', status: 'open', exceptions: ['admin', 'manager'] },
    { id: 11, yearId: 1, code: '02', title: 'اردیبهشت ۱۴۰۳', startDate: '2024-04-21', endDate: '2024-05-21', status: 'open', exceptions: [] },
    { id: 12, yearId: 1, code: '03', title: 'خرداد ۱۴۰۳', startDate: '2024-05-22', endDate: '2024-06-21', status: 'not_open', exceptions: [] },
  ]);

  // --- States ---
  const [showYearModal, setShowYearModal] = useState(false);
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [activeYear, setActiveYear] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [searchParams, setSearchParams] = useState({ code: '', title: '' });

  // --- Logic: Overlap Check ---
  const checkOverlap = (start, end, excludeId, list) => {
    return list.some(item => {
      if (item.id === excludeId) return false;
      return (start <= item.endDate && end >= item.startDate);
    });
  };

  // --- Handlers: Fiscal Year ---
  const handleCreateYear = () => {
    setEditingItem(null);
    setFormData({ code: '', title: '', startDate: '', endDate: '', isActive: true });
    setShowYearModal(true);
  };

  const handleEditYear = (year) => {
    setEditingItem(year);
    setFormData({ ...year });
    setShowYearModal(true);
  };

  const handleSaveYear = () => {
    if (!formData.code || !formData.startDate || !formData.endDate) return alert(t.alert_req_fields);
    
    if (checkOverlap(formData.startDate, formData.endDate, editingItem?.id, fiscalYears)) {
      return alert(isRtl ? "تاریخ‌های انتخاب شده با سال مالی دیگری تداخل دارد." : "Dates overlap with another fiscal year.");
    }

    if (editingItem) {
      setFiscalYears(prev => prev.map(y => y.id === editingItem.id ? { ...formData, id: y.id } : y));
    } else {
      setFiscalYears(prev => [...prev, { ...formData, id: Date.now() }]);
    }
    setShowYearModal(false);
  };

  // --- Handlers: Operational Periods ---
  const openPeriodsManager = (year) => {
    setActiveYear(year);
    setShowPeriodModal(true);
  };

  const generatePeriods = (type) => {
    if (!activeYear) return;
    // Mock generation logic based on type (monthly, quarterly, etc.)
    const msg = isRtl ? `دوره‌های ${type} برای ${activeYear.title} ایجاد شوند؟` : `Generate ${type} periods for ${activeYear.title}?`;
    if (window.confirm(msg)) {
      console.log("Generating periods of type:", type);
      // In a real app, this would calculate dates and update operationalPeriods
    }
  };

  // --- Grid Columns ---
  const yearColumns = [
    { field: 'code', header: t.fp_year_code, width: 'w-32', sortable: true },
    { field: 'title', header: t.fp_year_title, width: 'w-64', sortable: true },
    { field: 'startDate', header: t.fp_start_date, width: 'w-32' },
    { field: 'endDate', header: t.fp_end_date, width: 'w-32' },
    { 
      field: 'isActive', 
      header: t.active_status, 
      width: 'w-24',
      render: (row) => (
        <Badge variant={row.isActive ? 'success' : 'neutral'}>
          {row.isActive ? t.active : t.inactive}
        </Badge>
      )
    },
  ];

  const currentYearPeriods = useMemo(() => {
    return operationalPeriods.filter(p => p.yearId === activeYear?.id);
  }, [operationalPeriods, activeYear]);

  return (
    <div className="h-full flex flex-col p-4">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl font-bold text-slate-800">{t.fp_title}</h1>
        <p className="text-slate-500 text-xs mt-1">{t.fp_subtitle}</p>
      </div>

      {/* Filter Section */}
      <FilterSection onSearch={() => {}} onClear={() => setSearchParams({code:'', title:''})} isRtl={isRtl} title={t.filter}>
        <InputField label={t.fp_year_code} value={searchParams.code} onChange={e => setSearchParams({...searchParams, code: e.target.value})} isRtl={isRtl} />
        <InputField label={t.fp_year_title} value={searchParams.title} onChange={e => setSearchParams({...searchParams, title: e.target.value})} isRtl={isRtl} />
      </FilterSection>

      {/* Main Grid: Fiscal Years */}
      <div className="flex-1 overflow-hidden">
        <DataGrid 
          columns={yearColumns}
          data={fiscalYears}
          onCreate={handleCreateYear}
          onDoubleClick={openPeriodsManager}
          isRtl={isRtl}
          actions={(row) => (
            <div className="flex gap-1">
              <Button variant="ghost" size="iconSm" icon={Calendar} onClick={() => openPeriodsManager(row)} title={t.fp_ops_periods} className="text-indigo-600 hover:bg-indigo-50" />
              <Button variant="ghost" size="iconSm" icon={Edit} onClick={() => handleEditYear(row)} title={t.edit} />
              <Button variant="ghost" size="iconSm" icon={Trash2} onClick={() => {}} title={t.delete} className="text-red-500 hover:bg-red-50" />
            </div>
          )}
        />
      </div>

      {/* Modal: Add/Edit Fiscal Year */}
      <Modal
        isOpen={showYearModal}
        onClose={() => setShowYearModal(false)}
        title={editingItem ? t.fp_edit_year : t.fp_new_year}
        footer={
          <>
            <Button variant="outline" onClick={() => setShowYearModal(false)}>{t.btn_cancel}</Button>
            <Button variant="primary" onClick={handleSaveYear}>{t.btn_save}</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <InputField label={t.fp_year_code} value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} isRtl={isRtl} />
          <InputField label={t.fp_year_title} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} isRtl={isRtl} />
          <InputField label={t.fp_start_date} type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} isRtl={isRtl} />
          <InputField label={t.fp_end_date} type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} isRtl={isRtl} />
          <div className="col-span-2">
            <Toggle label={t.active_status} checked={formData.isActive} onChange={v => setFormData({...formData, isActive: v})} />
          </div>
        </div>
      </Modal>

      {/* Modal: Operational Periods Manager */}
      <Modal
        isOpen={showPeriodModal}
        onClose={() => setShowPeriodModal(false)}
        title={`${t.fp_ops_periods}: ${activeYear?.title}`}
        size="lg"
        footer={<Button variant="outline" onClick={() => setShowPeriodModal(false)}>{t.btn_close}</Button>}
      >
        <div className="flex flex-col gap-4 min-h-[500px]">
          {/* Fast Generation Toolbar */}
          <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-xl border border-indigo-100">
            <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm">
              <Zap size={18} />
              {t.fp_auto_gen}
            </div>
            <div className="flex gap-2">
              <Button variant="white" size="sm" onClick={() => generatePeriods('monthly')}>{t.fp_gen_monthly}</Button>
              <Button variant="white" size="sm" onClick={() => generatePeriods('quarterly')}>{t.fp_gen_quarterly}</Button>
              <Button variant="white" size="sm" onClick={() => generatePeriods('semi')}>{t.fp_gen_semi}</Button>
            </div>
          </div>

          {/* Periods Table */}
          <div className="flex-1 border rounded-xl overflow-hidden relative">
            <table className={`w-full text-sm ${isRtl ? 'text-right' : 'text-left'}`}>
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <tr>
                  <th className="p-3 w-20">{t.fp_period_code}</th>
                  <th className="p-3">{t.fp_period_title}</th>
                  <th className="p-3 w-32">{t.fp_start_date}</th>
                  <th className="p-3 w-32">{t.fp_end_date}</th>
                  <th className="p-3 w-32">{t.fp_status}</th>
                  <th className="p-3 w-24 text-center">{t.fp_exceptions}</th>
                  <th className="p-3 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentYearPeriods.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-mono">{p.code}</td>
                    <td className="p-3 font-bold">{p.title}</td>
                    <td className="p-3">{p.startDate}</td>
                    <td className="p-3">{p.endDate}</td>
                    <td className="p-3">
                       <div className="flex items-center gap-2">
                         {p.status === 'not_open' && <Badge variant="neutral" icon={Clock}>{t.fp_st_not_open}</Badge>}
                         {p.status === 'open' && <Badge variant="success" icon={Play}>{t.fp_st_open}</Badge>}
                         {p.status === 'closed' && <Badge variant="danger" icon={Lock}>{t.fp_st_closed}</Badge>}
                       </div>
                    </td>
                    <td className="p-3">
                      <div className="flex justify-center">
                        <Button variant="ghost" size="iconSm" icon={Users} onClick={() => {}} title={t.fp_exceptions} className={p.exceptions.length > 0 ? 'text-indigo-600' : 'text-slate-300'} />
                      </div>
                    </td>
                    <td className="p-3 text-center">
                       <Button variant="ghost" size="iconSm" icon={Edit} onClick={() => {}} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <Callout variant="info" title={t.fp_status}>
            {isRtl 
              ? 'تغییر وضعیت دوره‌ها باعث محدودیت در ثبت اسناد حسابداری برای کاربران عادی می‌شود.' 
              : 'Changing period status restricts accounting entries for regular users.'}
          </Callout>
        </div>
      </Modal>
    </div>
  );
};

window.FiscalPeriods = FiscalPeriods;
export default FiscalPeriods;
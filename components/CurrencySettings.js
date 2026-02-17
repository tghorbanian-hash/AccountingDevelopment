/* Filename: components/CurrencySettings.js */
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Banknote, Search, Plus, Edit, Trash2, RefreshCw, 
  History, Settings, ArrowLeftRight, Coins, Save, X, Check, Ban 
} from 'lucide-react';

const CurrencySettings = ({ t, isRtl }) => {
  const UI = window.UI || {};
  const { Button, InputField, SelectField, DataGrid, FilterSection, Modal, Badge } = UI;
  const supabase = window.supabase;

  // --- Resilient Permission Checks ---
  const checkAccess = (action = null) => {
    if (!window.hasAccess) return false;
    const variations = ['currency_settings', 'currencysettings'];
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
  
  // Custom Action Permissions
  const canManageRates = checkAccess('manage_rates');
  const canUpdateRates = checkAccess('update_rates');
  const canViewHistory = checkAccess('rates_history');

  // --- States ---
  
  // 1. Global Settings
  const [globalSettings, setGlobalSettings] = useState({
    main: '', operational: '', reporting1: '', reporting2: ''
  });

  // 2. Data & Filters
  const [currencies, setCurrencies] = useState([]);
  const [filters, setFilters] = useState({ search: '', method: '' });

  // 3. Conversions (DB Map)
  const [conversions, setConversions] = useState({});

  // 4. History Log
  const [historyLog, setHistoryLog] = useState([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isLoadingRates, setIsLoadingRates] = useState(false);

  // 5. Modals State
  const [isModalOpen, setIsModalOpen] = useState(false); 
  const [isConvModalOpen, setIsConvModalOpen] = useState(false); 
  
  const [currentRecord, setCurrentRecord] = useState(null);
  const [formData, setFormData] = useState({});
  
  // Conversion Modal Temporary State
  const [selectedForConv, setSelectedForConv] = useState(null);
  const [newConvTarget, setNewConvTarget] = useState('');
  const [newConvRate, setNewConvRate] = useState('');

  // --- DB Effects & Fetches ---
  useEffect(() => {
    if (canView) {
      fetchGlobals();
      fetchCurrencies();
      fetchConversions();
    }
  }, [canView]);

  const fetchGlobals = async () => {
    try {
      const { data, error } = await supabase.schema('gen').from('currency_globals').select('*').eq('id', 1).single();
      if (data) {
        setGlobalSettings({
          main: data.main_currency || '',
          operational: data.op_currency || '',
          reporting1: data.rep1_currency || '',
          reporting2: data.rep2_currency || ''
        });
      }
    } catch (err) {
      console.error('Error fetching globals:', err);
    }
  };

  const fetchCurrencies = async () => {
    try {
      const { data, error } = await supabase.schema('gen').from('currencies').select('*').order('created_at', { ascending: true });
      if (error) throw error;
      setCurrencies((data || []).map(c => ({
        id: c.id,
        code: c.code,
        title: c.title,
        symbol: c.symbol,
        method: c.method,
        decimals: c.decimals,
        active: c.is_active,
        reciprocal: c.is_reciprocal
      })));
    } catch (err) {
      console.error('Error fetching currencies:', err);
    }
  };

  const fetchConversions = async () => {
    try {
      const { data, error } = await supabase.schema('gen').from('currency_rates').select('*');
      if (error) throw error;
      
      const convMap = {};
      (data || []).forEach(row => {
        if (!convMap[row.source_code]) convMap[row.source_code] = [];
        convMap[row.source_code].push({ target: row.target_code, rate: Number(row.rate) });
      });
      setConversions(convMap);
    } catch (err) {
      console.error('Error fetching conversions:', err);
    }
  };

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase.schema('gen').from('currency_rate_history').select('*').order('created_at', { ascending: false }).limit(100);
      if (error) throw error;
      
      setHistoryLog((data || []).map(h => {
        const dateObj = new Date(h.created_at);
        return {
          id: h.id,
          date: dateObj.toISOString().split('T')[0],
          time: dateObj.toISOString().split('T')[1].substring(0, 5),
          source: h.source_code,
          target: h.target_code,
          rate: Number(h.rate)
        };
      }));
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  };

  // --- Logic & Handlers ---

  const filteredData = useMemo(() => {
    return currencies.filter(item => {
      const matchSearch = filters.search 
        ? (item.code.toLowerCase().includes(filters.search.toLowerCase()) || item.title.includes(filters.search))
        : true;
      const matchMethod = filters.method ? item.method === filters.method : true;
      return matchSearch && matchMethod;
    });
  }, [currencies, filters]);

  const handleSaveGlobals = async () => {
    if (!canEdit) return alert(isRtl ? 'دسترسی غیرمجاز' : 'Access Denied');
    try {
      const payload = {
        id: 1,
        main_currency: globalSettings.main || null,
        op_currency: globalSettings.operational || null,
        rep1_currency: globalSettings.reporting1 || null,
        rep2_currency: globalSettings.reporting2 || null
      };
      const { error } = await supabase.schema('gen').from('currency_globals').upsert(payload);
      if (error) throw error;
      alert(t.curr_save_global_success || (isRtl ? 'تنظیمات با موفقیت ذخیره شد.' : 'Global settings saved.'));
    } catch (err) {
      console.error('Error saving globals:', err);
      alert(isRtl ? 'خطا در ذخیره تنظیمات' : 'Error saving settings');
    }
  };

  const handleFetchRates = async () => {
    if (!canUpdateRates) return alert(isRtl ? 'دسترسی غیرمجاز' : 'Access Denied');
    setIsLoadingRates(true);
    try {
      // Mock API logic: Select random auto currencies and update their rates against USD
      const autoCurrencies = currencies.filter(c => c.method === 'auto' && c.code !== 'USD');
      if (autoCurrencies.length > 0) {
        const historyInserts = [];
        const rateUpserts = [];
        
        autoCurrencies.forEach(curr => {
          const newRate = (Math.random() * 100).toFixed(4); // Fake rate
          
          historyInserts.push({ source_code: 'USD', target_code: curr.code, rate: newRate });
          rateUpserts.push({ source_code: 'USD', target_code: curr.code, rate: newRate });
          
          if (curr.reciprocal) {
             const inverseRate = (1 / newRate).toFixed(6);
             rateUpserts.push({ source_code: curr.code, target_code: 'USD', rate: inverseRate });
          }
        });

        // Insert History
        if (historyInserts.length > 0) {
           await supabase.schema('gen').from('currency_rate_history').insert(historyInserts);
        }

        // Upsert Rates (Doing it sequentially or rely on API bulk upsert if supported)
        for (const r of rateUpserts) {
           await supabase.schema('gen').from('currency_rates')
              .upsert({ source_code: r.source_code, target_code: r.target_code, rate: r.rate }, { onConflict: 'source_code, target_code' });
        }
        
        await fetchConversions();
        alert(t.curr_update_success || (isRtl ? 'نرخ‌ها بروزرسانی شد.' : 'Rates updated.'));
      }
    } catch (err) {
      console.error('Error updating rates:', err);
    } finally {
      setIsLoadingRates(false);
    }
  };

  const handleOpenHistory = async () => {
    if (!canViewHistory) return alert(isRtl ? 'دسترسی غیرمجاز' : 'Access Denied');
    await fetchHistory();
    setIsHistoryOpen(true);
  };

  const handleOpenModal = (record = null) => {
    if (record && !canEdit) return alert(isRtl ? 'دسترسی ویرایش ندارید' : 'Access Denied for Edit');
    if (!record && !canCreate) return alert(isRtl ? 'دسترسی ایجاد ندارید' : 'Access Denied for Create');

    if (record) {
      setFormData({ ...record });
    } else {
      setFormData({ code: '', title: '', method: 'auto', decimals: 0, symbol: '', active: true, reciprocal: false });
    }
    setCurrentRecord(record);
    setIsModalOpen(true);
  };

  const handleSaveCurrency = async () => {
    if (!formData.code || !formData.title || !formData.symbol) return;
    
    try {
      const payload = {
        code: formData.code,
        title: formData.title,
        symbol: formData.symbol,
        method: formData.method,
        decimals: formData.decimals,
        is_active: formData.active,
        is_reciprocal: formData.reciprocal
      };

      if (currentRecord) {
        const { error } = await supabase.schema('gen').from('currencies').update(payload).eq('id', currentRecord.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.schema('gen').from('currencies').insert([payload]);
        if (error) throw error;
      }
      setIsModalOpen(false);
      fetchCurrencies();
    } catch (err) {
      console.error('Error saving currency:', err);
      alert(isRtl ? 'خطا در ثبت ارز' : 'Error saving currency');
    }
  };

  const handleDeleteCurrency = async (id) => {
    if (!canDelete) return alert(isRtl ? 'دسترسی حذف ندارید' : 'Access Denied for Delete');
    if (confirm(t.confirm_delete_single || 'Delete record?')) {
      try {
        const { error } = await supabase.schema('gen').from('currencies').delete().eq('id', id);
        if (error) throw error;
        fetchCurrencies();
      } catch(err) {
        console.error('Error deleting currency:', err);
      }
    }
  };

  const handleToggleActive = async (id, newVal) => {
    if (!canEdit) return;
    try {
      await supabase.schema('gen').from('currencies').update({ is_active: newVal }).eq('id', id);
      fetchCurrencies();
    } catch(err) {
      console.error(err);
    }
  };
  
  const handleToggleReciprocal = async (id, newVal) => {
    if (!canEdit) return;
    try {
      await supabase.schema('gen').from('currencies').update({ is_reciprocal: newVal }).eq('id', id);
      fetchCurrencies();
    } catch(err) {
      console.error(err);
    }
  };

  const handleDeleteHistory = async (id) => {
     if (!canDelete) return;
     if(confirm(t.confirm_delete_single || 'Delete log?')) {
        try {
          await supabase.schema('gen').from('currency_rate_history').delete().eq('id', id);
          fetchHistory();
        } catch(err) {
          console.error(err);
        }
     }
  };

  const handleOpenConvModal = (row) => {
    if (!canManageRates) return alert(isRtl ? 'دسترسی مدیریت نرخ‌ها ندارید' : 'Access Denied for Manage Rates');
    setSelectedForConv(row);
    setNewConvTarget('');
    setNewConvRate('');
    setIsConvModalOpen(true);
  };

  const handleAddConversion = async () => {
    if (!newConvTarget || !newConvRate || !selectedForConv) return;
    const rate = parseFloat(newConvRate);
    if (isNaN(rate)) return;

    const sourceCode = selectedForConv.code;
    const targetCode = newConvTarget;

    try {
      // Upsert Main Rate
      await supabase.schema('gen').from('currency_rates')
         .upsert({ source_code: sourceCode, target_code: targetCode, rate: rate }, { onConflict: 'source_code, target_code' });
      
      // Upsert Reciprocal Rate if needed
      if (selectedForConv.reciprocal) {
         const inverseRate = 1 / rate;
         await supabase.schema('gen').from('currency_rates')
            .upsert({ source_code: targetCode, target_code: sourceCode, rate: inverseRate }, { onConflict: 'source_code, target_code' });
      }

      setNewConvTarget('');
      setNewConvRate('');
      fetchConversions();
    } catch (err) {
      console.error('Error adding conversion:', err);
      alert(isRtl ? 'خطا در ثبت نرخ' : 'Error saving rate');
    }
  };

  const handleDeleteConversion = async (targetCode) => {
    const sourceCode = selectedForConv.code;
    try {
      await supabase.schema('gen').from('currency_rates').delete().match({ source_code: sourceCode, target_code: targetCode });
      fetchConversions();
    } catch (err) {
      console.error('Error deleting conversion:', err);
    }
  };

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

  // --- Column Definitions ---

  const columns = [
    { field: 'code', header: t.curr_code || (isRtl ? 'کد ارز' : 'Code'), width: 'w-20', sortable: true },
    { field: 'title', header: t.curr_desc || (isRtl ? 'عنوان' : 'Description'), width: 'w-32', sortable: true },
    { field: 'symbol', header: t.curr_symbol || (isRtl ? 'علامت' : 'Symbol'), width: 'w-16', className: 'text-center font-mono' },
    { 
      field: 'method', 
      header: t.curr_method || (isRtl ? 'متد' : 'Method'), 
      width: 'w-32',
      render: (row) => (
        <Badge variant={row.method === 'auto' ? 'info' : 'warning'}>
          {row.method === 'auto' ? (t.curr_method_auto || (isRtl ? 'خودکار' : 'Auto')) : (t.curr_method_manual || (isRtl ? 'دستی' : 'Manual'))}
        </Badge>
      )
    },
    { 
       field: 'active', 
       header: t.curr_active || (isRtl ? 'فعال' : 'Active'), 
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
    },
    { 
      field: 'reciprocal', 
      header: t.curr_reciprocal || (isRtl ? 'دوطرفه' : 'Reciprocal'), 
      width: 'w-24',
      render: (row) => (
          <div className="flex justify-center">
             <input 
               type="checkbox" 
               className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
               checked={row.reciprocal} 
               onChange={(e) => handleToggleReciprocal(row.id, e.target.checked)} 
             />
          </div>
       )
    }
  ];

  const historyColumns = [
    { field: 'date', header: t.curr_date || (isRtl ? 'تاریخ' : 'Date'), width: 'w-24', className: 'font-mono' },
    { field: 'time', header: t.curr_time || (isRtl ? 'زمان' : 'Time'), width: 'w-24', className: 'font-mono' },
    { field: 'source', header: t.curr_source || (isRtl ? 'مبدا' : 'Source'), width: 'w-20', className: 'font-mono text-center font-bold' },
    { field: 'target', header: t.curr_target_curr || (isRtl ? 'مقصد' : 'Target'), width: 'w-20', className: 'font-mono text-center font-bold' },
    { 
      field: 'rate', 
      header: t.curr_rate_val || (isRtl ? 'نرخ' : 'Rate'), 
      width: 'w-32', 
      className: 'font-mono font-bold text-left dir-ltr',
      render: (row) => row.rate.toLocaleString(undefined, { maximumFractionDigits: 6 }) 
    }
  ];

  return (
    <div className={`flex flex-col h-full p-4 md:p-6 bg-slate-50/50 ${isRtl ? 'font-vazir' : 'font-sans'}`}>
      
      {/* Header */}
      <div className="mb-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200">
            <Banknote size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800">{t.curr_title || (isRtl ? 'تنظیمات ارزها' : 'Currency Settings')}</h1>
            <p className="text-xs text-slate-500 font-medium mt-1">{t.curr_subtitle || (isRtl ? 'مدیریت ارزها' : 'Manage currencies')}</p>
          </div>
        </div>
        <div className="flex gap-2">
           {canViewHistory && (
              <Button variant="outline" icon={History} onClick={handleOpenHistory}>{t.curr_history || (isRtl ? 'تاریخچه نرخ‌ها' : 'Rates History')}</Button>
           )}
           {canUpdateRates && (
              <Button variant="primary" icon={RefreshCw} onClick={handleFetchRates} isLoading={isLoadingRates}>{t.curr_update || (isRtl ? 'بروزرسانی نرخ‌ها' : 'Update Rates')}</Button>
           )}
        </div>
      </div>

      {/* 1. Global Settings Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 shadow-sm shrink-0">
         <div className="flex items-center justify-between mb-3">
            <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Settings size={14}/> {t.curr_global || (isRtl ? 'تنظیمات کلان' : 'Global Settings')}
            </h3>
            {canEdit && <Button variant="primary" size="sm" icon={Save} onClick={handleSaveGlobals}>{t.btn_save || (isRtl ? 'ذخیره' : 'Save')}</Button>}
         </div>
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SelectField label={t.curr_base || (isRtl ? 'ارز پایه' : 'Base Currency')} isRtl={isRtl} value={globalSettings.main} onChange={e => setGlobalSettings({...globalSettings, main: e.target.value})}>
               <option value="">-</option>
               {currencies.map(c => <option key={c.id} value={c.code}>{c.title} ({c.code})</option>)}
            </SelectField>
            <SelectField label={t.curr_op || (isRtl ? 'ارز عملیاتی' : 'Operational Currency')} isRtl={isRtl} value={globalSettings.operational} onChange={e => setGlobalSettings({...globalSettings, operational: e.target.value})}>
               <option value="">-</option>
               {currencies.map(c => <option key={c.id} value={c.code}>{c.title} ({c.code})</option>)}
            </SelectField>
            <SelectField label={t.curr_rep1 || (isRtl ? 'گزارشگری ۱' : 'Reporting 1')} isRtl={isRtl} value={globalSettings.reporting1} onChange={e => setGlobalSettings({...globalSettings, reporting1: e.target.value})}>
               <option value="">-</option>
               {currencies.map(c => <option key={c.id} value={c.code}>{c.title} ({c.code})</option>)}
            </SelectField>
            <SelectField label={t.curr_rep2 || (isRtl ? 'گزارشگری ۲' : 'Reporting 2')} isRtl={isRtl} value={globalSettings.reporting2} onChange={e => setGlobalSettings({...globalSettings, reporting2: e.target.value})}>
               <option value="">-</option>
               {currencies.map(c => <option key={c.id} value={c.code}>{c.title} ({c.code})</option>)}
            </SelectField>
         </div>
      </div>

      {/* 2. Main Grid & Filters */}
      <div className="flex-1 flex flex-col min-h-0">
        <FilterSection 
          isRtl={isRtl} 
          onSearch={() => {}} 
          onClear={() => setFilters({ search: '', method: '' })}
        >
           <div className="col-span-1">
             <InputField 
               label={`${t.curr_code || 'Code'} / ${t.curr_desc || 'Desc'}`}
               placeholder="..." 
               isRtl={isRtl} 
               value={filters.search} 
               onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
             />
           </div>
           <div className="col-span-1">
              <SelectField 
                label={t.curr_method || (isRtl ? 'متد' : 'Method')}
                isRtl={isRtl}
                value={filters.method}
                onChange={(e) => setFilters(prev => ({ ...prev, method: e.target.value }))}
              >
                 <option value="">{t.all || (isRtl ? 'همه' : 'All')}</option>
                 <option value="auto">{t.curr_method_auto || (isRtl ? 'خودکار' : 'Auto')}</option>
                 <option value="manual">{t.curr_method_manual || (isRtl ? 'دستی' : 'Manual')}</option>
              </SelectField>
           </div>
        </FilterSection>

        <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-0">
          <DataGrid 
            columns={columns} 
            data={filteredData} 
            onCreate={canCreate ? () => handleOpenModal() : undefined}
            isRtl={isRtl}
            actions={(row) => (
              <div className="flex items-center gap-1">
                {canManageRates && <Button variant="ghost" size="iconSm" icon={ArrowLeftRight} title={t.curr_manage_rates || (isRtl ? 'مدیریت تبدیل‌ها' : 'Manage Rates')} className="text-indigo-600 hover:bg-indigo-50" onClick={() => handleOpenConvModal(row)} />}
                {canEdit && <Button variant="ghost" size="iconSm" icon={Edit} onClick={() => handleOpenModal(row)} />}
                {canDelete && <Button variant="ghost" size="iconSm" icon={Trash2} className="text-red-500 hover:bg-red-50" onClick={() => handleDeleteCurrency(row.id)} />}
              </div>
            )}
          />
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* 1. Create/Edit Currency Modal */}
      <Modal 
        isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} 
        title={currentRecord ? (t.curr_edit || (isRtl ? 'ویرایش ارز' : 'Edit Currency')) : (t.curr_new || (isRtl ? 'ارز جدید' : 'New Currency'))}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>{t.btn_cancel || (isRtl ? 'انصراف' : 'Cancel')}</Button>
            <Button variant="primary" icon={Save} onClick={handleSaveCurrency}>{t.btn_save || (isRtl ? 'ذخیره' : 'Save')}</Button>
          </>
        }
      >
         <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <InputField label={`${t.curr_code || (isRtl ? 'کد ارز' : 'Code')} *`} value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} isRtl={isRtl} className="dir-ltr uppercase" placeholder="USD" maxLength={5} />
            <InputField label={`${t.curr_desc || (isRtl ? 'عنوان' : 'Description')} *`} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} isRtl={isRtl} />
            <InputField label={`${t.curr_symbol || (isRtl ? 'علامت' : 'Symbol')} *`} value={formData.symbol} onChange={e => setFormData({...formData, symbol: e.target.value})} isRtl={isRtl} className="text-center" placeholder="$" />
            <InputField label={t.curr_decimals || (isRtl ? 'اعشار' : 'Decimals')} type="number" value={formData.decimals} onChange={e => setFormData({...formData, decimals: parseInt(e.target.value) || 0})} isRtl={isRtl} />
            
            <div className="md:col-span-2">
               <SelectField label={t.curr_method || (isRtl ? 'متد دریافت نرخ' : 'Method')} value={formData.method} onChange={e => setFormData({...formData, method: e.target.value})} isRtl={isRtl}>
                  <option value="auto">{t.curr_method_auto || (isRtl ? 'خودکار' : 'Auto')} (API)</option>
                  <option value="manual">{t.curr_method_manual || (isRtl ? 'دستی' : 'Manual')}</option>
               </SelectField>
            </div>
            
            <div className="md:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
               <div className="grid grid-cols-2 gap-4">
                  <div className={`flex items-center justify-between border-slate-200 ${isRtl ? 'border-l pl-4' : 'border-r pr-4'}`}>
                      <div>
                        <span className="text-sm font-bold text-slate-700 block">{t.curr_status || (isRtl ? 'وضعیت' : 'Status')}</span>
                        <span className="text-[10px] text-slate-500">{t.active || (isRtl ? 'فعال' : 'Active')}</span>
                      </div>
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                        checked={formData.active} 
                        onChange={e => setFormData({...formData, active: e.target.checked})} 
                      />
                  </div>
                  <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-bold text-slate-700 block">{t.curr_reciprocal || (isRtl ? 'تبدیل دوطرفه' : 'Reciprocal')}</span>
                        <span className="text-[10px] text-slate-500">{t.curr_reciprocal_desc || (isRtl ? 'محاسبه خودکار نرخ معکوس' : 'Auto calc inverse')}</span>
                      </div>
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                        checked={formData.reciprocal} 
                        onChange={e => setFormData({...formData, reciprocal: e.target.checked})} 
                      />
                  </div>
               </div>
            </div>
         </div>
      </Modal>

      {/* 2. Manage Conversions Modal */}
      <Modal 
        isOpen={isConvModalOpen} onClose={() => setIsConvModalOpen(false)}
        title={selectedForConv ? `${t.curr_manage_rates || (isRtl ? 'مدیریت نرخ' : 'Manage Rates')}: ${selectedForConv.title} (${selectedForConv.code})` : (t.curr_manage_rates || (isRtl ? 'مدیریت نرخ‌ها' : 'Manage Rates'))}
        size="md"
        footer={<Button variant="ghost" onClick={() => setIsConvModalOpen(false)}>{t.btn_close || (isRtl ? 'بستن' : 'Close')}</Button>}
      >
        <div className="space-y-4">
           {/* Add New Section */}
           <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl flex items-end gap-2">
              <div className="flex-1">
                 <SelectField label={t.curr_target || (isRtl ? 'ارز مقصد' : 'Target')} isRtl={isRtl} value={newConvTarget} onChange={e => setNewConvTarget(e.target.value)}>
                    <option value="">...</option>
                    {currencies.filter(c => selectedForConv && c.code !== selectedForConv.code).map(c => (
                       <option key={c.id} value={c.code}>{c.title} ({c.code})</option>
                    ))}
                 </SelectField>
              </div>
              <div className="w-32">
                 <InputField label={t.curr_rate_val || (isRtl ? 'نرخ' : 'Rate')} type="number" placeholder="1.00" value={newConvRate} onChange={e => setNewConvRate(e.target.value)} isRtl={isRtl} />
              </div>
              <Button variant="primary" icon={Plus} onClick={handleAddConversion} className="mb-0.5">{t.btn_add || (isRtl ? 'افزودن' : 'Add')}</Button>
           </div>
           
           {/* List Section */}
           <div>
              <h4 className="text-xs font-bold text-slate-500 mb-2 uppercase flex items-center gap-2">
                 <Coins size={12}/> {t.curr_defined_rates || (isRtl ? 'نرخ‌های تعریف شده' : 'Defined Rates')}
              </h4>
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                 <table className="w-full text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                       <tr>
                          <th className={`px-3 py-2 ${isRtl ? 'text-right' : 'text-left'}`}>{t.curr_target || (isRtl ? 'مقصد' : 'Target')}</th>
                          <th className="px-3 py-2 text-center">{t.curr_rate || (isRtl ? 'نرخ' : 'Rate')}</th>
                          <th className="px-3 py-2 text-center w-12"></th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                       {selectedForConv && conversions[selectedForConv.code]?.length > 0 ? (
                          conversions[selectedForConv.code].map((conv, idx) => (
                             <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                <td className="px-3 py-2.5 font-bold text-slate-700 flex items-center gap-2">
                                   <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[9px] text-slate-500 font-mono">{conv.target}</div>
                                   {currencies.find(c => c.code === conv.target)?.title || conv.target}
                                </td>
                                <td className="px-3 py-2.5 text-center font-mono font-bold text-slate-800 dir-ltr">
                                   {conv.rate.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                                </td>
                                <td className="px-3 py-2.5 text-center">
                                   <button onClick={() => handleDeleteConversion(conv.target)} className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-50">
                                      <X size={14} />
                                   </button>
                                </td>
                             </tr>
                          ))
                       ) : (
                          <tr>
                             <td colSpan={3} className="px-3 py-8 text-center text-slate-400 italic">
                                {t.curr_no_rates || (isRtl ? 'نرخی یافت نشد' : 'No rates found')}
                             </td>
                          </tr>
                       )}
                    </tbody>
                 </table>
              </div>
           </div>

           {selectedForConv?.reciprocal && (
              <div className="text-[10px] text-emerald-600 bg-emerald-50 p-2.5 rounded-xl border border-emerald-100 flex items-center gap-2">
                 <div className="p-1 bg-white rounded-full shadow-sm"><Check size={10}/></div>
                 {t.curr_reciprocal_desc || (isRtl ? 'محاسبه نرخ دوطرفه فعال است' : 'Reciprocal active')}
              </div>
           )}
        </div>
      </Modal>

      {/* 3. History Modal */}
      <Modal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} title={t.curr_history_title || (isRtl ? 'تاریخچه بروزرسانی' : 'Rates History')} size="lg">
         <div className="h-96">
            <DataGrid 
              columns={historyColumns} 
              data={historyLog} 
              isRtl={isRtl} 
              actions={(row) => (
                canDelete ? <Button variant="ghost" size="iconSm" icon={Trash2} className="text-red-500 hover:bg-red-50" onClick={() => handleDeleteHistory(row.id)} /> : null
              )}
            />
         </div>
      </Modal>

    </div>
  );
};

window.CurrencySettings = CurrencySettings;
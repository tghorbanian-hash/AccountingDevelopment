/* Filename: financial/generalledger/Vouchers.js */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Edit, Trash2, Plus, FileText, CheckCircle, FileWarning, Filter, 
  Copy, Printer, Paperclip, DownloadCloud, FileSpreadsheet, Lock
} from 'lucide-react';

const Vouchers = ({ language = 'fa' }) => {
  const { localTranslations, getStatusBadge, processCSVImport, generateCSVTemplate, getUserPermissions } = window.VoucherUtils || {};
  const VoucherForm = window.VoucherForm;
  
  const t = localTranslations ? (localTranslations[language] || localTranslations['en']) : {};
  const isRtl = language === 'fa';
  
  const UI = window.UI || {};
  const { Button, InputField, SelectField, DataGrid, FilterSection, Modal, SearchableSelect } = UI;
  const supabase = window.supabase;

  const fileInputRef = useRef(null);

  // --- Security States ---
  const [permissions, setPermissions] = useState(null);
  const [accessLoading, setAccessLoading] = useState(true);

  // --- Main States ---
  const [view, setView] = useState('list');
  const [loading, setLoading] = useState(false);
  const [currentVoucherId, setCurrentVoucherId] = useState(null);
  const [isCopying, setIsCopying] = useState(false);
  
  // --- Data States ---
  const [vouchers, setVouchers] = useState([]);
  const [contextVals, setContextVals] = useState({ fiscal_year_id: '', ledger_id: '' });
  const [searchParams, setSearchParams] = useState({ 
      voucher_number: '', description: '', from_date: '', to_date: '', status: '', voucher_type: '', account_id: '' 
  });
  const [selectedIds, setSelectedIds] = useState([]);

  // --- Modals ---
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [voucherToDelete, setVoucherToDelete] = useState(null);
  const [voucherToPrint, setVoucherToPrint] = useState(null);
  const [voucherForAttachments, setVoucherForAttachments] = useState(null);

  // --- Lookups States ---
  const [accounts, setAccounts] = useState([]);
  const [accountStructures, setAccountStructures] = useState([]);
  const [branches, setBranches] = useState([]);
  const [fiscalYears, setFiscalYears] = useState([]);
  const [ledgers, setLedgers] = useState([]);
  const [docTypes, setDocTypes] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [currencyGlobals, setCurrencyGlobals] = useState(null);
  const [detailTypes, setDetailTypes] = useState([]);
  const [allDetailInstances, setAllDetailInstances] = useState([]);

  const lookups = useMemo(() => ({
      accounts, accountStructures, branches, fiscalYears, ledgers, 
      docTypes, currencies, currencyGlobals, detailTypes, allDetailInstances,
      permissions // تزریق پرمیشن‌ها به لوکاپ‌ها برای استفاده در فرم
  }), [accounts, accountStructures, branches, fiscalYears, ledgers, docTypes, currencies, currencyGlobals, detailTypes, allDetailInstances, permissions]);

  // --- Initialization & Security ---
  useEffect(() => {
    const init = async () => {
        setAccessLoading(true);
        const perms = await getUserPermissions(supabase, 'vouchers');
        setPermissions(perms);
        setAccessLoading(false);
        fetchLookups(perms);
    };
    init();
  }, []);

  useEffect(() => {
    if (view === 'list' && contextVals.fiscal_year_id && contextVals.ledger_id && permissions) {
        fetchVouchers(searchParams);
    } else if (view === 'list') {
        setVouchers([]);
    }
  }, [view, contextVals, permissions]);

  // --- Fetch Methods ---
  const fetchLookups = async (perms) => {
    if (!supabase) return;
    
    const safeFetch = async (query) => {
        try {
            const res = await query;
            if (res.error) console.error("API Error:", res.error);
            return res.data || null;
        } catch (e) {
            console.error("Exception:", e);
            return null;
        }
    };

    const [brData, fyData, ledData, structData, dtData, diData, doctypeData, currData, currGlobalsData] = await Promise.all([
        safeFetch(supabase.schema('gen').from('branches').select('*')),
        safeFetch(supabase.schema('gl').from('fiscal_years').select('id, code, title, status').eq('is_active', true).order('code', { ascending: false })),
        safeFetch(supabase.schema('gl').from('ledgers').select('id, code, title, currency, structure, metadata').eq('is_active', true).order('title')),
        safeFetch(supabase.schema('gl').from('account_structures').select('id, code, title').eq('status', true)),
        safeFetch(supabase.schema('gl').from('detail_types').select('id, code, title').eq('is_active', true)),
        safeFetch(supabase.schema('gl').from('detail_instances').select('id, detail_code, title, detail_type_code, ref_entity_name, entity_code').eq('status', true)),
        safeFetch(supabase.schema('gl').from('doc_types').select('id, code, title, type').eq('is_active', true)),
        safeFetch(supabase.schema('gen').from('currencies').select('id, code, title').eq('is_active', true)),
        safeFetch(supabase.schema('gen').from('currency_globals').select('*').limit(1))
    ]);

    // سطح ۳: فیلتر کردن اطلاعات پایه بر اساس دسترسی کاربر
    if (brData) {
        const filteredBranches = (perms && perms.allowed_branches && perms.allowed_branches.length > 0)
            ? brData.filter(b => perms.allowed_branches.includes(b.id))
            : brData;
        setBranches(filteredBranches.filter(b => b.is_active !== false));
    }

    if (fyData) setFiscalYears(fyData);

    if (ledData) {
        const filteredLedgers = (perms && perms.allowed_ledgers && perms.allowed_ledgers.length > 0)
            ? ledData.filter(l => perms.allowed_ledgers.includes(String(l.id)))
            : ledData;
        setLedgers(filteredLedgers);
    }

    if (structData) setAccountStructures(structData);
    if (dtData) setDetailTypes(dtData);
    if (diData) setAllDetailInstances(diData);
    if (currGlobalsData && currGlobalsData.length > 0) setCurrencyGlobals(currGlobalsData[0]);

    setContextVals(prev => {
        const initialLedger = (perms && perms.allowed_ledgers && perms.allowed_ledgers.length > 0)
            ? ledData?.find(l => perms.allowed_ledgers.includes(String(l.id)))
            : ledData?.[0];
            
        if (!prev.fiscal_year_id && !prev.ledger_id) {
            return { 
                fiscal_year_id: fyData?.[0]?.id || '', 
                ledger_id: initialLedger?.id || '' 
            };
        }
        return prev;
    });

    if (doctypeData) {
        const allowedSysCodes = ['sys_opening', 'sys_general', 'sys_closing', 'sys_close_acc'];
        let baseDocTypes = doctypeData.filter(d => d.type === 'user' || allowedSysCodes.includes(d.code));
        
        // سطح ۳: فیلتر انواع سند
        if (perms && perms.allowed_doctypes && perms.allowed_doctypes.length > 0) {
            baseDocTypes = baseDocTypes.filter(d => perms.allowed_doctypes.includes(d.code));
        }
        setDocTypes(baseDocTypes);
    }

    if (currData) setCurrencies(currData);

    const accData = await safeFetch(supabase.schema('gl').from('accounts').select('id, full_code, title, level, parent_id, metadata, structure_id').eq('is_active', true).order('full_code'));
    if (accData) {
        const accMap = new Map(accData.map(a => [a.id, a]));
        const processedAccounts = accData.map(a => {
            let path = a.title;
            let curr = a;
            while (curr.parent_id && accMap.has(curr.parent_id)) {
                curr = accMap.get(curr.parent_id);
                path = curr.title + ' / ' + path;
            }
            return { ...a, path, displayPath: a.full_code + ' - ' + path };
        });
        setAccounts(processedAccounts);
    }
  };

  const fetchVouchers = async (paramsObj = searchParams) => {
    if (!supabase || !contextVals.fiscal_year_id || !contextVals.ledger_id || !permissions) return;
    setLoading(true);
    try {
      let query = supabase.schema('gl').from('vouchers')
        .select('*')
        .eq('fiscal_period_id', contextVals.fiscal_year_id)
        .eq('ledger_id', contextVals.ledger_id)
        .order('voucher_date', { ascending: false })
        .order('voucher_number', { ascending: false });
      
      // سطح ۳: محدود سازی دیتا در کوئری اصلی
      if (permissions.allowed_branches && permissions.allowed_branches.length > 0) {
          query = query.in('branch_id', permissions.allowed_branches);
      }
      if (permissions.allowed_doctypes && permissions.allowed_doctypes.length > 0) {
          query = query.in('voucher_type', permissions.allowed_doctypes);
      }

      if (paramsObj.voucher_number) query = query.eq('voucher_number', paramsObj.voucher_number);
      if (paramsObj.from_date) query = query.gte('voucher_date', paramsObj.from_date);
      if (paramsObj.to_date) query = query.lte('voucher_date', paramsObj.to_date);
      if (paramsObj.status) query = query.eq('status', paramsObj.status);
      if (paramsObj.voucher_type) query = query.eq('voucher_type', paramsObj.voucher_type);
      if (paramsObj.description) query = query.ilike('description', `%${paramsObj.description}%`);

      if (paramsObj.account_id) {
          const { data: viData } = await supabase.schema('gl').from('voucher_items').select('voucher_id').eq('account_id', paramsObj.account_id);
          if (viData && viData.length > 0) {
              query = query.in('id', viData.map(v => v.voucher_id));
          } else {
              setVouchers([]);
              setLoading(false);
              return;
          }
      }

      const { data, error } = await query;
      if (error) throw error;
      setVouchers(data || []);
    } catch (error) {
      console.error('Error fetching vouchers:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers ---
  const handleClearSearch = () => {
     const cleared = { voucher_number: '', description: '', from_date: '', to_date: '', status: '', voucher_type: '', account_id: '' };
     setSearchParams(cleared);
     fetchVouchers(cleared);
  };

  const handleOpenForm = (voucher = null, copy = false) => {
    if (!voucher && !permissions?.actions.includes('create')) {
        alert(t.accessDenied);
        return;
    }
    setCurrentVoucherId(voucher ? voucher.id : null);
    setIsCopying(copy);
    setView('form');
  };

  const handleBulkStatus = async (newStatus) => {
    if (!permissions?.actions.includes('status_change')) {
        alert(t.accessDenied);
        return;
    }
    if (selectedIds.length === 0) return;
    setLoading(true);
    try {
        const { data: authData } = await supabase.auth.getUser();
        const currentUserId = authData?.user?.id || null;
        
        let updatePayload = { status: newStatus };
        if (newStatus === 'reviewed') updatePayload.reviewed_by = currentUserId;
        if (newStatus === 'final') updatePayload.approved_by = currentUserId;

        const { error } = await supabase.schema('gl').from('vouchers').update(updatePayload).in('id', selectedIds);
        if (error) throw error;
        setSelectedIds([]);
        fetchVouchers();
    } catch (error) {
        console.error('Error updating status:', error);
    } finally {
        setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!voucherToDelete || !supabase) return;
    try {
      const { error } = await supabase.schema('gl').from('vouchers').delete().eq('id', voucherToDelete.id);
      if (error) throw error;
      setShowDeleteModal(false);
      setVoucherToDelete(null);
      fetchVouchers();
    } catch (error) {
      console.error('Error deleting voucher:', error);
    }
  };

  const promptDelete = (voucher) => {
    if (!permissions?.actions.includes('delete')) return;
    if (voucher.status === 'reviewed' || voucher.status === 'final') return;
    setVoucherToDelete(voucher);
    setShowDeleteModal(true);
  };

  const handleImportCSV = async (e) => {
     if (!permissions?.actions.includes('import')) return;
     const file = e.target.files[0];
     if (!file) return;
     setLoading(true);
     try {
         await processCSVImport(file, contextVals, lookups, supabase, t);
         alert(t.importSuccess);
         fetchVouchers();
     } catch (err) {
         console.error(err);
         alert(t.importError + '\n' + (err.message || ''));
     } finally {
         setLoading(false);
         e.target.value = ''; 
     }
  };

  // --- Computed Data ---
  const validAccountsForLedger = useMemo(() => {
     const ledger = ledgers.find(l => String(l.id) === String(contextVals.ledger_id));
     const ledgerStructure = String(ledger?.structure || '').trim();
     const targetStructure = accountStructures.find(s => String(s.code).trim() === ledgerStructure);
     const structureId = targetStructure ? String(targetStructure.id) : null;
     return accounts.filter(a => {
        const isSubsidiary = a.level === 'subsidiary' || a.level === 'معین' || a.level === '4';
        return String(a.structure_id) === structureId && isSubsidiary;
     }).map(a => ({ value: a.id, label: `${a.full_code} - ${a.title}`, subLabel: a.path }));
  }, [accounts, accountStructures, ledgers, contextVals.ledger_id]);

  const selectedVouchers = vouchers.filter(v => selectedIds.includes(v.id));
  const allDraft = selectedVouchers.length > 0 && selectedVouchers.every(v => v.status === 'draft');
  const allTemp = selectedVouchers.length > 0 && selectedVouchers.every(v => v.status === 'temporary');

  // --- Grid Columns ---
  const columns = [
    { field: 'voucher_number', header: t.voucherNumber, width: 'w-24', sortable: true },
    { field: 'voucher_date', header: t.date, width: 'w-24', sortable: true },
    { field: 'status', header: t.status, width: 'w-32', render: (row) => getStatusBadge(row.status, t) },
    { field: 'voucher_type', header: t.type, width: 'w-32', render: (row) => docTypes.find(d => d.code === row.voucher_type)?.title || row.voucher_type },
    { field: 'branch_id', header: t.branch, width: 'w-32', render: (row) => branches.find(b => b.id === row.branch_id)?.title || '-' },
    { field: 'description', header: t.description, width: 'w-64' },
    { field: 'total_debit', header: t.amount, width: 'w-32', render: (row) => UI.utils.formatNumber(row.total_debit) },
    { field: 'currency', header: t.currency, width: 'w-24', render: (row) => {
        const ledger = ledgers.find(l => String(l.id) === String(row.ledger_id));
        const currCode = ledger?.currency;
        return currencies.find(c => c.code === currCode)?.title || currCode || '-';
    }},
    { field: 'daily_number', header: t.dailyNumber, width: 'w-24' },
    { field: 'cross_reference', header: t.crossReference, width: 'w-24' }
  ];

  // --- Render View Routing ---
  if (accessLoading) {
      return <div className="h-full flex flex-col items-center justify-center bg-slate-50 text-indigo-600 gap-4"><Lock className="animate-pulse" size={48}/><p className="font-bold">{isRtl ? 'در حال بررسی دسترسی‌ها...' : 'Checking permissions...'}</p></div>;
  }

  if (!permissions?.actions.includes('view')) {
      return <div className="h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400 gap-4"><Lock size={64}/><h2 className="text-xl font-black">{isRtl ? 'عدم دسترسی' : 'Access Denied'}</h2><p>{isRtl ? 'شما مجوز مشاهده این صفحه را ندارید.' : 'You do not have permission to view this page.'}</p></div>;
  }

  if (view === 'form') {
      return (
          <VoucherForm 
              voucherId={currentVoucherId}
              isCopy={isCopying}
              contextVals={contextVals}
              lookups={lookups}
              onClose={(needsRefresh) => {
                  setView('list');
                  setCurrentVoucherId(null);
                  setIsCopying(false);
                  if (needsRefresh) fetchVouchers();
              }}
              language={language}
          />
      );
  }

  // --- Main List Render ---
  return (
    <div className="h-full flex flex-col p-4 md:p-6 bg-slate-50/50">
      <div className="mb-4 bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-2 text-indigo-800 font-bold text-sm">
          <Filter size={18} className="text-indigo-500"/>
          <span>{t.globalFiltersTitle}:</span>
        </div>
        <div className="flex gap-3">
          <select value={contextVals.fiscal_year_id} onChange={e => setContextVals({...contextVals, fiscal_year_id: e.target.value})} className="bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg px-3 py-1.5 text-xs font-bold outline-none cursor-pointer focus:ring-2 focus:ring-indigo-200 transition-all">
            {fiscalYears.map(f => <option key={f.id} value={f.id}>{f.title}</option>)}
          </select>
          <select value={contextVals.ledger_id} onChange={e => setContextVals({...contextVals, ledger_id: e.target.value})} className="bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg px-3 py-1.5 text-xs font-bold outline-none cursor-pointer focus:ring-2 focus:ring-indigo-200 transition-all">
            {ledgers.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
          </select>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200">
            <FileText size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800">{t.title}</h1>
            <p className="text-xs text-slate-500 font-medium mt-1">{t.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
            {permissions.actions.includes('import') && (
                <>
                  <input type="file" accept=".csv" ref={fileInputRef} className="hidden" onChange={handleImportCSV} />
                  <Button variant="ghost" size="sm" icon={DownloadCloud} onClick={() => generateCSVTemplate(isRtl)} title={t.downloadTemplate} />
                  <Button variant="ghost" size="sm" icon={FileSpreadsheet} onClick={() => fileInputRef.current?.click()} title={t.importCSV} className="text-emerald-600 hover:bg-emerald-50" />
                  <div className="h-6 w-px bg-slate-200 mx-1"></div>
                </>
            )}
            {permissions.actions.includes('create') && (
                <Button variant="primary" size="default" onClick={() => handleOpenForm(null, false)} icon={Plus}>{t.newVoucher}</Button>
            )}
        </div>
      </div>

      <FilterSection 
         onSearch={() => fetchVouchers(searchParams)} 
         onClear={handleClearSearch} 
         isRtl={isRtl} 
         title={t.search}
         defaultOpen={false}
      >
        <InputField label={t.voucherNumber} value={searchParams.voucher_number} onChange={e => setSearchParams({...searchParams, voucher_number: e.target.value})} isRtl={isRtl} dir="ltr" />
        <SelectField label={t.status} value={searchParams.status} onChange={e => setSearchParams({...searchParams, status: e.target.value})} isRtl={isRtl}>
           <option value="">{t.all}</option>
           <option value="draft">{t.statusDraft}</option>
           <option value="temporary">{t.statusTemporary}</option>
           <option value="reviewed">{t.statusReviewed}</option>
           <option value="final">{t.statusFinal}</option>
        </SelectField>
        <InputField type="date" label={t.fromDate} value={searchParams.from_date} onChange={e => setSearchParams({...searchParams, from_date: e.target.value})} isRtl={isRtl} />
        <InputField type="date" label={t.toDate} value={searchParams.to_date} onChange={e => setSearchParams({...searchParams, to_date: e.target.value})} isRtl={isRtl} />
        
        <SelectField label={t.type} value={searchParams.voucher_type} onChange={e => setSearchParams({...searchParams, voucher_type: e.target.value})} isRtl={isRtl}>
           <option value="">{t.all}</option>
           {docTypes.map(d => <option key={d.id} value={d.code}>{d.title}</option>)}
        </SelectField>

        <div className="flex flex-col gap-1">
           <label className="text-[11px] font-bold text-slate-600 rtl:pr-1 ltr:pl-1">{t.account}</label>
           <SearchableSelect 
               options={validAccountsForLedger} 
               value={searchParams.account_id} 
               onChange={v => setSearchParams({...searchParams, account_id: v})} 
               placeholder={t.searchAccount} 
               isRtl={isRtl}
           />
        </div>

        <InputField label={t.description} value={searchParams.description} onChange={e => setSearchParams({...searchParams, description: e.target.value})} isRtl={isRtl} />
      </FilterSection>

      <div className="flex-1 min-h-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <DataGrid 
          columns={columns} 
          data={vouchers} 
          selectedIds={selectedIds} 
          onSelectRow={(id, c) => setSelectedIds(c ? [...selectedIds, id] : selectedIds.filter(i => i !== id))} 
          onSelectAll={(c) => setSelectedIds(c ? vouchers.map(v => v.id) : [])} 
          onDelete={(ids) => { setVoucherToDelete(vouchers.find(v => v.id === ids[0])); setShowDeleteModal(true); }} 
          onDoubleClick={(r) => handleOpenForm(r, false)} 
          isRtl={isRtl} 
          isLoading={loading} 
          bulkActions={
             <>
               {permissions.actions.includes('status_change') && (
                   <>
                     {allDraft && <Button variant="secondary" size="sm" onClick={() => handleBulkStatus('temporary')} icon={CheckCircle}>{t.makeTemporary}</Button>}
                     {allTemp && <Button variant="secondary" size="sm" onClick={() => handleBulkStatus('draft')} icon={FileText}>{t.makeDraft}</Button>}
                   </>
               )}
             </>
          }
          actions={(r) => (
            <div className="flex gap-1 justify-center">
              {permissions.actions.includes('attach') && (
                <Button variant="ghost" size="iconSm" icon={Paperclip} onClick={() => setVoucherForAttachments(r)} title={t.attachments} className="text-slate-500 hover:text-indigo-600 hover:bg-indigo-50" />
              )}
              {permissions.actions.includes('create') && (
                <Button variant="ghost" size="iconSm" icon={Copy} onClick={() => handleOpenForm(r, true)} title={t.copyVoucher} className="text-blue-500 hover:text-blue-700 hover:bg-blue-50" />
              )}
              {permissions.actions.includes('print') && (
                <Button variant="ghost" size="iconSm" icon={Printer} onClick={() => setVoucherToPrint(r)} title={t.print} className="text-slate-500 hover:text-indigo-600 hover:bg-indigo-50" />
              )}
              {permissions.actions.includes('edit') && (
                <Button variant="ghost" size="iconSm" icon={Edit} onClick={() => handleOpenForm(r, false)} />
              )}
              {permissions.actions.includes('delete') && (
                <Button variant="ghost" size="iconSm" icon={Trash2} className="text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => promptDelete(r)} />
              )}
            </div>
          )}
        />
      </div>

      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title={t.delete} footer={<><Button variant="ghost" onClick={() => setShowDeleteModal(false)}>{t.backToList}</Button><Button variant="danger" onClick={confirmDelete}>{t.delete}</Button></>}>
        <div className="p-4"><p className="text-slate-700 font-medium">{t.confirmDelete}</p></div>
      </Modal>

      <Modal isOpen={!!voucherToPrint} onClose={() => setVoucherToPrint(null)} title={t.printVoucher || 'چاپ سند حسابداری'} size="lg">
         {voucherToPrint && window.VoucherPrint ? (
             <window.VoucherPrint voucherId={voucherToPrint.id} onClose={() => setVoucherToPrint(null)} />
         ) : (
             <div className="p-10 flex flex-col items-center justify-center text-slate-500 gap-4">
                <FileWarning size={48} className="text-amber-400" />
                <p>{isRtl ? 'کامپوننت چاپ یافت نشد. لطفاً فایل VoucherPrint.js را در پروژه قرار دهید.' : 'Print component not found. Please include VoucherPrint.js.'}</p>
             </div>
         )}
      </Modal>

      <Modal isOpen={!!voucherForAttachments} onClose={() => setVoucherForAttachments(null)} title={t.attachments || 'اسناد مثبته و ضمائم'} size="md">
         {voucherForAttachments && window.VoucherAttachments ? (
             <window.VoucherAttachments voucherId={voucherForAttachments.id} onClose={() => setVoucherForAttachments(null)} />
         ) : (
             <div className="p-10 flex flex-col items-center justify-center text-slate-500 gap-4">
                <FileWarning size={48} className="text-amber-400" />
                <p>{isRtl ? 'کامپوننت ضمائم یافت نشد. لطفاً فایل VoucherAttachments.js را در پروژه قرار دهید.' : 'Attachments component not found. Please include VoucherAttachments.js.'}</p>
             </div>
         )}
      </Modal>
    </div>
  );
};

window.Vouchers = Vouchers;
export default Vouchers;
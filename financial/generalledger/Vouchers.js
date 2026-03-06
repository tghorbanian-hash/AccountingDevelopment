/* Filename: financial/generalledger/Vouchers.js */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Edit, Trash2, Plus, FileText, CheckCircle, FileWarning, Filter, 
  Copy, Printer, Paperclip, DownloadCloud, FileSpreadsheet, Lock, Ban, ChevronDown, Coins
} from 'lucide-react';

const Vouchers = ({ language = 'fa', setHeaderNode }) => {
  const { localTranslations, getStatusBadge, processCSVImport, generateCSVTemplate } = window.VoucherUtils || {};
  const VoucherForm = window.VoucherForm;
  
  const t = localTranslations ? (localTranslations[language] || localTranslations['en']) : {};
  const isRtl = language === 'fa';
  
  const UI = window.UI || {};
  const { Button, InputField, SelectField, DataGrid, FilterSection, Modal, SearchableSelect } = UI;
  const supabase = window.supabase;

  const fileInputRef = useRef(null);

  const checkAccess = (action = null) => {
    if (!window.hasAccess) return false;
    const variations = ['doc_list', 'vouchers', '6ba74488-f6f0-4e23-8fc3-9cf6d7477e19'];
    for (const res of variations) {
       if (window.hasAccess(res, action)) return true;
    }
    return false;
  };

  const canEnterForm = checkAccess(); 
  const canView   = canEnterForm || checkAccess('view') || checkAccess('read') || checkAccess('show');

  const [permissions, setPermissions] = useState(null);
  const [accessLoading, setAccessLoading] = useState(true);

  const [view, setView] = useState('list');
  const [loading, setLoading] = useState(false);
  const [currentVoucherId, setCurrentVoucherId] = useState(null);
  const [isCopying, setIsCopying] = useState(false);
  const [isFxMode, setIsFxMode] = useState(false);
  
  const [vouchers, setVouchers] = useState([]);
  const [contextVals, setContextVals] = useState({ fiscal_year_id: '', ledger_id: '' });
  const [searchParams, setSearchParams] = useState({ 
      voucher_number: '', description: '', from_date: '', to_date: '', status: '', voucher_type: '', account_id: '' 
  });
  const [selectedIds, setSelectedIds] = useState([]);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [voucherToDelete, setVoucherToDelete] = useState(null);
  const [voucherToPrint, setVoucherToPrint] = useState(null);
  const [voucherForAttachments, setVoucherForAttachments] = useState(null);

  const [accounts, setAccounts] = useState([]);
  const [accountStructures, setAccountStructures] = useState([]);
  const [branches, setBranches] = useState([]);
  const [fiscalYears, setFiscalYears] = useState([]);
  const [fiscalPeriods, setFiscalPeriods] = useState([]);
  const [ledgers, setLedgers] = useState([]);
  const [docTypes, setDocTypes] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [currencyGlobals, setCurrencyGlobals] = useState(null);
  const [detailTypes, setDetailTypes] = useState([]);
  const [allDetailInstances, setAllDetailInstances] = useState([]);

  const lookups = useMemo(() => ({
      accounts, accountStructures, branches, fiscalYears, fiscalPeriods, ledgers, 
      docTypes, currencies, currencyGlobals, detailTypes, allDetailInstances,
      permissions
  }), [accounts, accountStructures, branches, fiscalYears, fiscalPeriods, ledgers, docTypes, currencies, currencyGlobals, detailTypes, allDetailInstances, permissions]);

  useEffect(() => {
    const init = async () => {
        if (!canView && !window.IS_ADMIN) {
            setAccessLoading(false);
            return;
        }

        setAccessLoading(true);
        
        const actions = [];
        if (checkAccess('view')) actions.push('view');
        if (checkAccess('create')) actions.push('create');
        if (checkAccess('edit')) actions.push('edit');
        if (checkAccess('delete')) actions.push('delete');
        if (checkAccess('import')) actions.push('import');
        if (checkAccess('export')) actions.push('export');
        if (checkAccess('print')) actions.push('print');
        if (checkAccess('attach')) actions.push('attach');
        if (checkAccess('status_change')) actions.push('status_change');
        
        if (actions.length === 0 && canView) {
            actions.push('view');
        }

        let perms = {
            actions: window.IS_ADMIN ? ['view', 'create', 'edit', 'delete', 'import', 'export', 'print', 'attach', 'status_change'] : actions,
            allowed_branches: [],
            allowed_ledgers: [],
            allowed_doctypes: []
        };
        
        try {
             if (!window.IS_ADMIN) {
                 const { data: permData } = await supabase.schema('gen').from('permissions').select('data_scopes').eq('resource_code', 'doc_list');
                 if (permData && permData.length > 0) {
                     let br = [], ld = [], dt = [];
                     permData.forEach(p => {
                         const ds = p.data_scopes || {};
                         if (ds.allowed_branches) br.push(...ds.allowed_branches);
                         if (ds.allowed_ledgers) ld.push(...ds.allowed_ledgers);
                         if (ds.allowed_doctypes) dt.push(...ds.allowed_doctypes);
                     });
                     if (br.length > 0) perms.allowed_branches = [...new Set(br)];
                     if (ld.length > 0) perms.allowed_ledgers = [...new Set(ld)];
                     if (dt.length > 0) perms.allowed_doctypes = [...new Set(dt)];
                 }
             }
        } catch(e) {
            console.error("Warning: Could not fetch data scopes", e);
        }

        setPermissions(perms);
        setAccessLoading(false);
        fetchLookups(perms);
    };
    init();
  }, []);

  useEffect(() => {
    if (setHeaderNode && fiscalYears.length > 0 && contextVals) {
      const node = (
        <div className="flex items-center bg-slate-100/80 hover:bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 transition-colors shadow-[inset_0_1px_3px_rgba(0,0,0,0.05)]">
          <Filter size={14} className="text-indigo-500 mr-2 rtl:mr-0 rtl:ml-2" />
          
          <div className="relative flex items-center group">
            <select 
              value={contextVals.fiscal_year_id} 
              onChange={e => setContextVals({...contextVals, fiscal_year_id: e.target.value})} 
              className="bg-transparent border-none text-xs font-bold text-slate-600 group-hover:text-indigo-700 focus:ring-0 outline-none cursor-pointer appearance-none py-0 pl-1 pr-5 rtl:pr-1 rtl:pl-5 transition-colors z-10"
            >
              {fiscalYears.map(f => <option key={f.id} value={f.id}>{f.title}</option>)}
            </select>
            <ChevronDown size={12} className="absolute text-slate-400 right-1 rtl:right-auto rtl:left-1 pointer-events-none group-hover:text-indigo-500 transition-colors" />
          </div>

          <div className="w-px h-4 bg-slate-300 mx-2"></div>
          
          {ledgers.length > 0 ? (
            <div className="relative flex items-center group">
              <select 
                value={contextVals.ledger_id} 
                onChange={e => setContextVals({...contextVals, ledger_id: e.target.value})} 
                className="bg-transparent border-none text-xs font-bold text-slate-600 group-hover:text-indigo-700 focus:ring-0 outline-none cursor-pointer appearance-none py-0 pl-1 pr-5 rtl:pr-1 rtl:pl-5 transition-colors z-10 max-w-[150px] truncate"
              >
                {ledgers.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
              </select>
              <ChevronDown size={12} className="absolute text-slate-400 right-1 rtl:right-auto rtl:left-1 pointer-events-none group-hover:text-indigo-500 transition-colors" />
            </div>
          ) : (
            <span className="text-[11px] text-rose-500 font-bold px-1 flex items-center">{isRtl ? 'دفتری مجاز نیست' : 'No ledgers allowed'}</span>
          )}
        </div>
      );
      setHeaderNode(node);
    }
    
    return () => {
      if (setHeaderNode) setHeaderNode(null);
    };
  }, [fiscalYears, ledgers, contextVals, setHeaderNode, isRtl]);


  useEffect(() => {
    if (view === 'list' && contextVals.fiscal_year_id && contextVals.ledger_id && permissions) {
        fetchVouchers(searchParams);
    } else if (view === 'list') {
        setVouchers([]);
    }
  }, [view, contextVals, permissions]);

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

    const [brData, fyData, ledData, structData, dtData, diData, doctypeData, currData, currGlobalsData, fpData] = await Promise.all([
        safeFetch(supabase.schema('gen').from('branches').select('*')),
        safeFetch(supabase.schema('gl').from('fiscal_years').select('id, code, title, status').eq('is_active', true).order('code', { ascending: false })),
        safeFetch(supabase.schema('gl').from('ledgers').select('id, code, title, currency, structure, metadata').eq('is_active', true).order('title')),
        safeFetch(supabase.schema('gl').from('account_structures').select('id, code, title').eq('status', true)),
        safeFetch(supabase.schema('gl').from('detail_types').select('id, code, title').eq('is_active', true)),
        safeFetch(supabase.schema('gl').from('detail_instances').select('id, detail_code, title, detail_type_code, ref_entity_name, entity_code').eq('status', true)),
        safeFetch(supabase.schema('gl').from('doc_types').select('id, code, title, type').eq('is_active', true)),
        safeFetch(supabase.schema('gen').from('currencies').select('id, code, title').eq('is_active', true)),
        safeFetch(supabase.schema('gen').from('currency_globals').select('*').limit(1)),
        safeFetch(supabase.schema('gl').from('fiscal_periods').select('id, year_id, start_date, end_date, status'))
    ]);

    if (brData) {
        if (window.IS_ADMIN) {
            setBranches(brData.filter(b => b.is_active !== false));
        } else {
            const allowed = perms?.allowed_branches || [];
            if (allowed.length > 0) {
                 const filteredBranches = brData.filter(b => allowed.includes(String(b.id)));
                 setBranches(filteredBranches.filter(b => b.is_active !== false));
            } else {
                 setBranches(brData.filter(b => b.is_active !== false));
            }
        }
    }

    if (fyData) setFiscalYears(fyData);
    if (fpData) setFiscalPeriods(fpData);

    let initialLedgerId = '';
    if (ledData) {
        if (window.IS_ADMIN) {
            setLedgers(ledData);
            initialLedgerId = ledData[0]?.id || '';
        } else {
            const allowed = perms?.allowed_ledgers || [];
            if (allowed.length > 0) {
                const filteredLedgers = ledData.filter(l => allowed.includes(String(l.id)));
                setLedgers(filteredLedgers);
                initialLedgerId = filteredLedgers[0]?.id || '';
            } else {
                setLedgers(ledData);
                initialLedgerId = ledData[0]?.id || '';
            }
        }
    }

    if (structData) setAccountStructures(structData);
    if (dtData) setDetailTypes(dtData);
    if (diData) setAllDetailInstances(diData);
    if (currGlobalsData && currGlobalsData.length > 0) setCurrencyGlobals(currGlobalsData[0]);

    setContextVals(prev => {
        if (!prev.fiscal_year_id && !prev.ledger_id) {
            return { fiscal_year_id: fyData?.[0]?.id || '', ledger_id: initialLedgerId };
        }
        return prev;
    });

    if (doctypeData) {
        const allowedSysCodes = ['sys_general', 'sys_opening'];
        if (window.IS_ADMIN) {
            setDocTypes(doctypeData.filter(d => d.type === 'user' || allowedSysCodes.includes(d.code)));
        } else {
            const allowedSys = perms?.allowed_doctypes || [];
            if (allowedSys.length > 0) {
                setDocTypes(doctypeData.filter(d => {
                    if (d.type === 'user') return true; 
                    if (!allowedSysCodes.includes(d.code)) return false; 
                    return allowedSys.includes(d.code); 
                }));
            } else {
                setDocTypes(doctypeData.filter(d => d.type === 'user' || allowedSysCodes.includes(d.code)));
            }
        }
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
        .eq('fiscal_year_id', contextVals.fiscal_year_id)
        .eq('ledger_id', contextVals.ledger_id)
        .in('status', ['draft', 'temporary']) 
        .order('voucher_date', { ascending: false })
        .order('voucher_number', { ascending: false });
      
      if (!window.IS_ADMIN) {
          if (permissions.allowed_branches && permissions.allowed_branches.length > 0) {
              query = query.in('branch_id', permissions.allowed_branches);
          }

          const sysAllowed = permissions.allowed_doctypes || [];
          if (sysAllowed.length > 0) {
              query = query.or(`voucher_type.not.ilike.sys_%,voucher_type.in.(${sysAllowed.join(',')})`);
          } else {
              query = query.not('voucher_type', 'ilike', 'sys_%');
          }
      } else {
          const allowedSysCodes = ['sys_general', 'sys_opening'];
          query = query.or(`voucher_type.not.ilike.sys_%,voucher_type.in.(${allowedSysCodes.join(',')})`);
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

  const handleClearSearch = () => {
     const cleared = { voucher_number: '', description: '', from_date: '', to_date: '', status: '', voucher_type: '', account_id: '' };
     setSearchParams(cleared);
     fetchVouchers(cleared);
  };

  const handleOpenForm = (voucher = null, copy = false, fxMode = false) => {
    if (!voucher && !permissions?.actions?.includes('create')) {
        alert(t.accessDenied || 'دسترسی غیرمجاز برای ایجاد');
        return;
    }
    setCurrentVoucherId(voucher ? voucher.id : null);
    setIsCopying(copy);
    setIsFxMode(fxMode);
    setView('form');
  };

  const handleBulkStatus = async (newStatus) => {
    if (!permissions?.actions?.includes('status_change')) {
        alert(t.accessDenied || 'دسترسی غیرمجاز');
        return;
    }
    if (selectedIds.length === 0) return;
    setLoading(true);
    try {
        let updatePayload = { status: newStatus };
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
    if (!permissions?.actions?.includes('delete')) return;
    if (voucher.status === 'reviewed' || voucher.status === 'finalized') return;
    setVoucherToDelete(voucher);
    setShowDeleteModal(true);
  };

  const handleImportCSV = async (e) => {
     if (!permissions?.actions?.includes('import')) return;
     const file = e.target.files[0];
     if (!file) return;
     setLoading(true);
     try {
         await processCSVImport(file, contextVals, lookups, supabase, t);
         alert(t.importSuccess || 'با موفقیت وارد شد');
         fetchVouchers();
     } catch (err) {
         console.error(err);
         alert((t.importError || 'خطا در درون‌ریزی') + '\n' + (err.message || ''));
     } finally {
         setLoading(false);
         e.target.value = ''; 
     }
  };

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

  const columns = [
    { field: 'voucher_number', header: t.voucherNumber || 'شماره سند', width: 'w-24', sortable: true },
    { field: 'voucher_date', header: t.date || 'تاریخ', width: 'w-24', sortable: true },
    { field: 'status', header: t.status || 'وضعیت', width: 'w-32', render: (row) => getStatusBadge ? getStatusBadge(row.status, t) : row.status },
    { field: 'voucher_type', header: t.type || 'نوع سند', width: 'w-32', render: (row) => docTypes.find(d => d.code === row.voucher_type)?.title || row.voucher_type },
    { field: 'branch_id', header: t.branch || 'شعبه', width: 'w-32', render: (row) => branches.find(b => b.id === row.branch_id)?.title || '-' },
    { field: 'description', header: t.description || 'شرح', width: 'w-64' },
    { field: 'total_debit', header: t.amount || 'مبلغ', width: 'w-32', render: (row) => UI.utils?.formatNumber ? UI.utils.formatNumber(row.total_debit) : row.total_debit },
    { field: 'currency', header: t.currency || 'ارز', width: 'w-24', render: (row) => {
        const ledger = ledgers.find(l => String(l.id) === String(row.ledger_id));
        const currCode = ledger?.currency;
        return currencies.find(c => c.code === currCode)?.title || currCode || '-';
    }},
    { field: 'daily_number', header: t.dailyNumber || 'شماره روزانه', width: 'w-24' },
    { field: 'cross_reference', header: t.crossReference || 'عطف', width: 'w-24' }
  ];

  if (accessLoading) {
      return <div className="h-full flex flex-col items-center justify-center bg-slate-50 text-indigo-600 gap-4"><Lock className="animate-pulse" size={48}/><p className="font-bold">{isRtl ? 'در حال بررسی دسترسی‌ها...' : 'Checking permissions...'}</p></div>;
  }

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

  if (view === 'form') {
      return (
          <VoucherForm 
              voucherId={currentVoucherId}
              isCopy={isCopying}
              isFxMode={isFxMode}
              contextVals={contextVals}
              lookups={lookups}
              onClose={(needsRefresh) => {
                  setView('list');
                  setCurrentVoucherId(null);
                  setIsCopying(false);
                  setIsFxMode(false);
                  if (needsRefresh) fetchVouchers();
              }}
              language={language}
          />
      );
  }

  return (
    <div className={`h-full flex flex-col p-4 md:p-6 bg-slate-50/50 ${isRtl ? 'font-vazir' : 'font-sans'}`}>
      
      <div className="mb-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200">
            <FileText size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800">{t.title || (isRtl ? 'فهرست اسناد' : 'Vouchers List')}</h1>
            <p className="text-xs text-slate-500 font-medium mt-1">{t.subtitle || (isRtl ? 'مدیریت و بررسی اسناد حسابداری' : 'Manage accounting vouchers')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
            {permissions?.actions?.includes('import') && (
                <>
                  <input type="file" accept=".csv" ref={fileInputRef} className="hidden" onChange={handleImportCSV} />
                  <Button variant="ghost" size="sm" icon={DownloadCloud} onClick={() => generateCSVTemplate && generateCSVTemplate(isRtl)} title={t.downloadTemplate || 'دانلود الگو'} />
                  <Button variant="ghost" size="sm" icon={FileSpreadsheet} onClick={() => fileInputRef.current?.click()} title={t.importCSV || 'درون‌ریزی CSV'} className="text-emerald-600 hover:bg-emerald-50" />
                  <div className="h-6 w-px bg-slate-200 mx-1"></div>
                </>
            )}
            {permissions?.actions?.includes('create') && (
                <div className="flex gap-2">
                    <Button variant="primary" size="default" onClick={() => handleOpenForm(null, false, false)} icon={Plus} disabled={ledgers.length === 0}>{t.newVoucher || (isRtl ? 'سند جدید' : 'New Voucher')}</Button>
                    <Button variant="outline" size="default" className="border-indigo-600 text-indigo-600 bg-indigo-50 hover:bg-indigo-100" onClick={() => handleOpenForm(null, false, true)} icon={Coins} disabled={ledgers.length === 0}>{isRtl ? 'سند ارزی جدید' : 'New FX Voucher'}</Button>
                </div>
            )}
        </div>
      </div>

      <FilterSection 
         onSearch={() => fetchVouchers(searchParams)} 
         onClear={handleClearSearch} 
         isRtl={isRtl} 
         title={t.search || (isRtl ? 'جستجو' : 'Search')}
         defaultOpen={false}
      >
        <InputField label={t.voucherNumber || 'شماره سند'} value={searchParams.voucher_number} onChange={e => setSearchParams({...searchParams, voucher_number: e.target.value})} isRtl={isRtl} dir="ltr" />
        <SelectField label={t.status || 'وضعیت'} value={searchParams.status} onChange={e => setSearchParams({...searchParams, status: e.target.value})} isRtl={isRtl}>
           <option value="">{t.all || 'همه'}</option>
           <option value="draft">{t.statusDraft || 'یادداشت'}</option>
           <option value="temporary">{t.statusTemporary || 'موقت'}</option>
        </SelectField>
        <InputField type="date" label={t.fromDate || 'از تاریخ'} value={searchParams.from_date} onChange={e => setSearchParams({...searchParams, from_date: e.target.value})} isRtl={isRtl} />
        <InputField type="date" label={t.toDate || 'تا تاریخ'} value={searchParams.to_date} onChange={e => setSearchParams({...searchParams, to_date: e.target.value})} isRtl={isRtl} />
        
        <SelectField label={t.type || 'نوع سند'} value={searchParams.voucher_type} onChange={e => setSearchParams({...searchParams, voucher_type: e.target.value})} isRtl={isRtl}>
           <option value="">{t.all || 'همه'}</option>
           {docTypes.map(d => <option key={d.id} value={d.code}>{d.title}</option>)}
        </SelectField>

        <div className="flex flex-col gap-1">
           <label className="text-[11px] font-bold text-slate-600 rtl:pr-1 ltr:pl-1">{t.account || 'حساب'}</label>
           <SearchableSelect 
               options={validAccountsForLedger} 
               value={searchParams.account_id} 
               onChange={v => setSearchParams({...searchParams, account_id: v})} 
               placeholder={t.searchAccount || 'جستجوی حساب'} 
               isRtl={isRtl}
           />
        </div>

        <InputField label={t.description || 'شرح'} value={searchParams.description} onChange={e => setSearchParams({...searchParams, description: e.target.value})} isRtl={isRtl} />
      </FilterSection>

      <div className="flex-1 min-h-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-4">
        <DataGrid 
          columns={columns} 
          data={vouchers} 
          selectedIds={selectedIds} 
          onSelectRow={(id, c) => setSelectedIds(c ? [...selectedIds, id] : selectedIds.filter(i => i !== id))} 
          onSelectAll={(c) => setSelectedIds(c ? vouchers.map(v => v.id) : [])} 
          onDelete={(ids) => { setVoucherToDelete(vouchers.find(v => v.id === ids[0])); setShowDeleteModal(true); }} 
          onDoubleClick={(r) => handleOpenForm(r, false, false)} 
          isRtl={isRtl} 
          isLoading={loading} 
          bulkActions={
             <>
               {permissions?.actions?.includes('status_change') && (
                   <>
                     {allDraft && <Button variant="secondary" size="sm" onClick={() => handleBulkStatus('temporary')} icon={CheckCircle}>{t.makeTemporary || 'تبدیل به موقت'}</Button>}
                     {allTemp && <Button variant="secondary" size="sm" onClick={() => handleBulkStatus('draft')} icon={FileText}>{t.makeDraft || 'تبدیل به یادداشت'}</Button>}
                   </>
               )}
             </>
          }
          actions={(r) => (
            <div className="flex gap-1 justify-center">
              {permissions?.actions?.includes('attach') && (
                <Button variant="ghost" size="iconSm" icon={Paperclip} onClick={() => setVoucherForAttachments(r)} title={t.attachments || 'ضمائم'} className="text-slate-500 hover:text-indigo-600 hover:bg-indigo-50" />
              )}
              {permissions?.actions?.includes('create') && (
                <Button variant="ghost" size="iconSm" icon={Copy} onClick={() => handleOpenForm(r, true, false)} title={t.copyVoucher || 'کپی سند'} className="text-blue-500 hover:text-blue-700 hover:bg-blue-50" />
              )}
              {permissions?.actions?.includes('print') && (
                <Button variant="ghost" size="iconSm" icon={Printer} onClick={() => setVoucherToPrint(r)} title={t.print || 'چاپ'} className="text-slate-500 hover:text-indigo-600 hover:bg-indigo-50" />
              )}
              {permissions?.actions?.includes('edit') && (
                <Button variant="ghost" size="iconSm" icon={Edit} onClick={() => handleOpenForm(r, false, false)} />
              )}
              {permissions?.actions?.includes('delete') && (
                <Button variant="ghost" size="iconSm" icon={Trash2} className="text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => promptDelete(r)} />
              )}
            </div>
          )}
        />
      </div>

      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title={t.delete || 'حذف'} footer={<><Button variant="ghost" onClick={() => setShowDeleteModal(false)}>{t.backToList || 'بازگشت'}</Button><Button variant="danger" onClick={confirmDelete}>{t.delete || 'حذف'}</Button></>}>
        <div className="p-4"><p className="text-slate-700 font-medium">{t.confirmDelete || 'آیا از حذف اطمینان دارید؟'}</p></div>
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
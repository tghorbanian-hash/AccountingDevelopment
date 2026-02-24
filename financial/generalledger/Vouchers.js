/* Filename: financial/generalledger/Vouchers.js */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Edit, Trash2, Plus, ArrowRight, ArrowLeft, 
  Save, FileText, CheckCircle, FileWarning, Filter, ChevronDown, Search, Scale, Copy, Check, X
} from 'lucide-react';

const localTranslations = {
  en: {
    title: 'Journal Vouchers',
    subtitle: 'Manage accounting vouchers and documents',
    newVoucher: 'New Voucher',
    search: 'Advanced Search',
    voucherNumber: 'Voucher No.',
    date: 'Date',
    type: 'Doc Type',
    status: 'Status',
    description: 'Description',
    totalDebit: 'Total Debit',
    totalCredit: 'Total Credit',
    actions: 'Actions',
    edit: 'Edit',
    delete: 'Delete',
    branch: 'Branch',
    selectBranch: 'Select Branch',
    branchReqError: 'Please select a branch.',
    fiscalYear: 'Fiscal Year',
    ledger: 'Ledger',
    subsidiaryNumber: 'Subsidiary No.',
    items: 'Voucher Items',
    addRow: 'Add Item',
    row: 'Row',
    account: 'Account',
    detail: 'Detail',
    debit: 'Debit',
    credit: 'Credit',
    currency: 'Currency',
    balance: 'Balance Voucher',
    saveDraft: 'Save Draft',
    saveTemp: 'Save Temporary',
    backToList: 'Back to List',
    confirmDelete: 'Are you sure you want to delete this voucher?',
    statusDraft: 'Draft',
    statusTemp: 'Temporary',
    statusReviewed: 'Reviewed',
    statusFinal: 'Final',
    general: 'General',
    trackingNumber: 'Tracking No.',
    trackingDate: 'Tracking Date',
    quantity: 'Quantity',
    unbalancedError: 'Voucher is not balanced. Can only save as draft.',
    zeroAmountError: 'Total amount cannot be zero. Please enter debit or credit values.',
    dualEntryError: 'A single row cannot have both debit and credit values.',
    reqFields: 'Description and Account are required for all items.',
    globalFiltersTitle: 'Global System Context',
    searchAccount: 'Search account code or title...',
    searchDetail: 'Search detail...',
    copyFromAbove: 'Copy from above',
    trackingReqError: 'Tracking Number and Tracking Date are required for account in row',
    qtyReqError: 'Quantity is required for account in row',
    dailyNumber: 'Daily No.',
    crossReference: 'Cross Ref.',
    referenceNumber: 'Reference No.',
    headerInfo: 'Voucher Header',
    noDetail: 'No Detail',
    searchPlaceholder: 'Search {type}...',
    notFound: 'No matches found',
    detailRequiredError: 'Please select detail for "{type}" in row {row}.',
    subDupError: 'Subsidiary number is duplicate in this fiscal year.'
  },
  fa: {
    title: 'اسناد حسابداری',
    subtitle: 'مدیریت و صدور اسناد حسابداری دفتر کل',
    newVoucher: 'سند جدید',
    search: 'جستجوی پیشرفته',
    voucherNumber: 'شماره سند',
    date: 'تاریخ',
    type: 'نوع سند',
    status: 'وضعیت',
    description: 'شرح',
    totalDebit: 'جمع بدهکار',
    totalCredit: 'جمع بستانکار',
    actions: 'عملیات',
    edit: 'ویرایش',
    delete: 'حذف',
    branch: 'شعبه',
    selectBranch: 'انتخاب شعبه',
    branchReqError: 'لطفاً شعبه را انتخاب کنید.',
    fiscalYear: 'سال مالی',
    ledger: 'دفتر کل',
    subsidiaryNumber: 'شماره فرعی',
    items: 'اقلام سند',
    addRow: 'ردیف جدید',
    row: 'ردیف',
    account: 'معین',
    detail: 'تفصیل',
    debit: 'بدهکار',
    credit: 'بستانکار',
    currency: 'ارز',
    balance: 'تراز کردن سند',
    saveDraft: 'ذخیره یادداشت',
    saveTemp: 'ذخیره موقت',
    backToList: 'بازگشت به فهرست',
    confirmDelete: 'آیا از حذف این سند اطمینان دارید؟',
    statusDraft: 'یادداشت',
    statusTemp: 'موقت',
    statusReviewed: 'بررسی شده',
    statusFinal: 'قطعی شده',
    general: 'عمومی',
    trackingNumber: 'شماره پیگیری',
    trackingDate: 'تاریخ پیگیری',
    quantity: 'مقدار',
    unbalancedError: 'سند بالانس نیست و فقط به عنوان یادداشت قابل ذخیره است.',
    zeroAmountError: 'مبلغ کل سند نمی‌تواند صفر باشد. لطفاً مقادیر بدهکار یا بستانکار را وارد کنید.',
    dualEntryError: 'یک ردیف نمی‌تواند همزمان هم بدهکار و هم بستانکار باشد.',
    reqFields: 'شرح و حساب معین برای تمامی اقلام اجباری است.',
    globalFiltersTitle: 'فیلترهای عمومی سیستم',
    searchAccount: 'جستجوی کد یا عنوان معین...',
    searchDetail: 'جستجوی تفصیل...',
    copyFromAbove: 'کپی از ردیف بالا',
    trackingReqError: 'شماره و تاریخ پیگیری برای معین در ردیف زیر الزامی است:',
    qtyReqError: 'مقدار برای معین در ردیف زیر الزامی است:',
    dailyNumber: 'شماره روزانه',
    crossReference: 'شماره عطف',
    referenceNumber: 'شماره ارجاع',
    headerInfo: 'اطلاعات سربرگ سند',
    noDetail: 'بدون تفصیل',
    searchPlaceholder: 'جستجوی {type}...',
    notFound: 'موردی یافت نشد',
    detailRequiredError: 'لطفاً تفصیل مربوط به "{type}" را در ردیف {row} مشخص کنید.',
    subDupError: 'شماره فرعی وارد شده در این سال مالی تکراری است.'
  }
};

const SearchableAccountSelect = ({ accounts, value, onChange, disabled, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);

  const selectedAcc = accounts.find(a => String(a.id) === String(value));
  const displaySelected = selectedAcc ? (selectedAcc.full_code + ' - ' + selectedAcc.title) : '';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = accounts.filter(a => 
    a.displayPath.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative w-full h-full flex items-center" ref={wrapperRef}>
      <div className="relative w-full">
        <input
          type="text"
          className={`w-full bg-transparent border-0 border-b border-transparent hover:border-slate-300 focus:border-indigo-500 rounded-none h-8 px-2 outline-none text-[12px] text-slate-800 transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          value={isOpen ? search : displaySelected}
          onChange={e => { setSearch(e.target.value); setIsOpen(true); }}
          onFocus={() => { setIsOpen(true); setSearch(''); }}
          disabled={disabled}
          placeholder={placeholder}
          title={displaySelected}
        />
      </div>
      
      {isOpen && !disabled && (
        <div className="absolute z-[60] w-[300px] rtl:right-0 ltr:left-0 top-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-56 overflow-y-auto custom-scrollbar">
          {filtered.map(acc => (
            <div
              key={acc.id}
              className="px-3 py-1.5 text-[11px] hover:bg-indigo-50 cursor-pointer border-b border-slate-50 last:border-0"
              onMouseDown={(e) => { e.preventDefault(); onChange(acc.id); setIsOpen(false); }}
            >
              <div className="font-bold text-slate-800 dir-ltr text-right">{acc.full_code} - {acc.title}</div>
              <div className="text-slate-500 truncate mt-0.5 text-[10px]" title={acc.path}>{acc.path}</div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="px-3 py-3 text-[11px] text-slate-400 text-center">موردی یافت نشد</div>
          )}
        </div>
      )}
    </div>
  );
};

const MultiDetailSelector = ({ allowedTypes, allInstances, value = {}, onChange, disabled, t }) => {
  const [activeType, setActiveType] = useState(null);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setActiveType(null);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!allowedTypes || allowedTypes.length === 0) {
     return <div className="text-slate-300 text-[11px] px-2 h-8 flex items-center">{t.noDetail}</div>;
  }

  return (
    <div className="flex flex-wrap gap-1.5 w-full items-center p-1 px-1.5" ref={wrapperRef}>
       {allowedTypes.map(type => {
          const selectedId = value[type.code];
          
          if (selectedId) {
             const selectedDetail = allInstances.find(d => String(d.id) === String(selectedId));
             const display = selectedDetail ? ((selectedDetail.detail_code ? selectedDetail.detail_code + ' - ' : '') + selectedDetail.title) : 'Unknown';
             return (
               <div key={type.code} className="flex items-center gap-1 bg-indigo-50 text-indigo-800 text-[11px] px-2 py-0.5 rounded border border-indigo-200 shadow-sm transition-all hover:shadow-md">
                 <span className="font-bold truncate max-w-[140px] select-none" title={display}>{display}</span>
                 {!disabled && (
                    <X size={12} className="cursor-pointer text-indigo-400 hover:text-red-500 hover:bg-red-50 rounded-full p-0.5 shrink-0 transition-colors" 
                       onClick={(e) => { 
                          e.stopPropagation(); 
                          const newVal = {...value}; 
                          delete newVal[type.code]; 
                          onChange(newVal); 
                       }} 
                    />
                 )}
               </div>
             )
          }

          return (
             <div key={type.code} className="relative">
                {activeType === type.code ? (
                   <div className="relative">
                      <input 
                         autoFocus
                         className="w-[140px] bg-white border border-indigo-400 shadow-sm focus:ring-2 focus:ring-indigo-100 rounded h-6 px-2 outline-none text-[11px] text-slate-800 transition-all"
                         value={search} 
                         onChange={e => setSearch(e.target.value)} 
                         placeholder={t.searchPlaceholder.replace('{type}', type.title)}
                      />
                      <div className="absolute z-[70] w-[220px] rtl:right-0 ltr:left-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-y-auto custom-scrollbar">
                         {allInstances
                           .filter(d => d.detail_type_code === type.code && (d.title.includes(search) || (d.detail_code && d.detail_code.includes(search))))
                           .map(d => (
                             <div
                               key={d.id}
                               className="px-3 py-2 text-[11px] hover:bg-indigo-50 cursor-pointer border-b border-slate-50 last:border-0 transition-colors"
                               onMouseDown={(e) => { 
                                  e.preventDefault(); 
                                  onChange({ ...value, [type.code]: d.id });
                                  setActiveType(null);
                                  setSearch('');
                               }}
                             >
                               <div className="font-bold text-slate-800">{d.detail_code ? d.detail_code + ' - ' : ''}{d.title}</div>
                             </div>
                         ))}
                         {allInstances.filter(d => d.detail_type_code === type.code && (d.title.includes(search) || (d.detail_code && d.detail_code.includes(search)))).length === 0 && (
                            <div className="px-3 py-3 text-[11px] text-slate-400 text-center">{t.notFound}</div>
                         )}
                      </div>
                   </div>
                ) : (
                   <button 
                      onClick={(e) => { e.preventDefault(); if(!disabled) { setActiveType(type.code); setSearch(''); } }} 
                      className={`bg-white border border-dashed text-[11px] px-2 py-0.5 rounded transition-colors ${disabled ? 'border-slate-200 text-slate-400 cursor-not-allowed' : 'border-slate-300 text-slate-600 hover:border-indigo-400 hover:text-indigo-700 hover:bg-indigo-50'}`}
                   >
                      + {type.title}
                   </button>
                )}
             </div>
          )
       })}
    </div>
  );
}

const formatNum = (num) => {
  if (num === null || num === undefined || num === '') return '';
  return Number(num).toLocaleString();
};

const parseNum = (str) => {
  const raw = String(str).replace(/,/g, '');
  return isNaN(raw) || raw === '' ? 0 : parseFloat(raw);
};

const Vouchers = ({ language = 'fa' }) => {
  const t = localTranslations[language];
  const isRtl = language === 'fa';
  
  const UI = window.UI || {};
  const { Button, InputField, SelectField, DataGrid, FilterSection, Modal, Badge, Accordion } = UI;
  const supabase = window.supabase;

  const [view, setView] = useState('list');
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [voucherToDelete, setVoucherToDelete] = useState(null);

  const [contextVals, setContextVals] = useState({ fiscal_year_id: '', ledger_id: '' });

  const [vouchers, setVouchers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [accountStructures, setAccountStructures] = useState([]);
  const [branches, setBranches] = useState([]);
  const [fiscalYears, setFiscalYears] = useState([]);
  const [ledgers, setLedgers] = useState([]);
  const [docTypes, setDocTypes] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  
  const [detailTypes, setDetailTypes] = useState([]);
  const [allDetailInstances, setAllDetailInstances] = useState([]);
  
  const [searchParams, setSearchParams] = useState({ voucher_number: '', description: '' });
  const [selectedIds, setSelectedIds] = useState([]);

  const [currentVoucher, setCurrentVoucher] = useState(null);
  const [voucherItems, setVoucherItems] = useState([]);
  
  const [focusedRowId, setFocusedRowId] = useState(null);
  const [isHeaderOpen, setIsHeaderOpen] = useState(true);

  useEffect(() => {
    fetchLookups();
  }, []);

  useEffect(() => {
    if (view === 'list') {
      if (contextVals.fiscal_year_id && contextVals.ledger_id) {
        fetchVouchers();
      } else {
        setVouchers([]);
      }
    }
  }, [view, contextVals]);

  const fetchLookups = async () => {
    if (!supabase) return;
    
    const safeFetch = async (query) => {
        try {
            const res = await query;
            if (res.error) console.error("API Error in fetchLookups:", res.error);
            return res.data || null;
        } catch (e) {
            console.error("Exception in fetchLookups:", e);
            return null;
        }
    };

    const [brData, fyData, ledData, structData, dtData, diData, doctypeData, currData] = await Promise.all([
        safeFetch(supabase.schema('gen').from('branches').select('*')),
        safeFetch(supabase.schema('gl').from('fiscal_years').select('id, code, title, status').eq('is_active', true).order('code', { ascending: false })),
        safeFetch(supabase.schema('gl').from('ledgers').select('id, code, title, currency, structure, metadata').eq('is_active', true).order('title')),
        safeFetch(supabase.schema('gl').from('account_structures').select('id, code, title').eq('status', true)),
        safeFetch(supabase.schema('gl').from('detail_types').select('id, code, title').eq('is_active', true)),
        safeFetch(supabase.schema('gl').from('detail_instances').select('id, detail_code, title, detail_type_code, ref_entity_name, entity_code').eq('status', true)),
        safeFetch(supabase.schema('gl').from('doc_types').select('id, code, title, type').eq('is_active', true)),
        safeFetch(supabase.schema('gen').from('currencies').select('id, code, title').eq('is_active', true))
    ]);

    if (brData) setBranches(brData.filter(b => b.is_active !== false));
    if (fyData) setFiscalYears(fyData);
    if (ledData) setLedgers(ledData);
    if (structData) setAccountStructures(structData);
    if (dtData) setDetailTypes(dtData);
    if (diData) setAllDetailInstances(diData);

    setContextVals(prev => {
        if (!prev.fiscal_year_id && !prev.ledger_id) {
            return {
                fiscal_year_id: fyData?.[0]?.id || '',
                ledger_id: ledData?.[0]?.id || ''
            };
        }
        return prev;
    });

    if (doctypeData) {
        const allowedSysCodes = ['sys_opening', 'sys_general', 'sys_closing', 'sys_close_acc'];
        const filteredDocTypes = doctypeData.filter(d => d.type === 'user' || allowedSysCodes.includes(d.code));
        setDocTypes(filteredDocTypes);
    }

    if (currData) setCurrencies(currData);

    const accData = await safeFetch(supabase.schema('gl').from('accounts').select('id, full_code, title, level, parent_id, metadata, structure_id').eq('is_active', true).order('full_code'));
    if (accData) {
        const allAccs = accData;
        const accMap = new Map(allAccs.map(a => [a.id, a]));
        
        const processedAccounts = allAccs.map(a => {
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

  const fetchVouchers = async () => {
    if (!supabase || !contextVals.fiscal_year_id || !contextVals.ledger_id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.schema('gl')
        .from('vouchers')
        .select('*')
        .eq('fiscal_period_id', contextVals.fiscal_year_id)
        .eq('ledger_id', contextVals.ledger_id)
        .order('voucher_date', { ascending: false })
        .order('voucher_number', { ascending: false });
      
      if (error) throw error;
      setVouchers(data || []);
    } catch (error) {
      console.error('Error fetching vouchers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAutoNumbers = async (date, ledgerId, fyId, branchId) => {
    let nextDaily = 1;
    let nextCross = 1;
    let nextVoucher = '';
    let config = null;

    if (date) {
        const { data } = await supabase.schema('gl').from('vouchers').select('daily_number').eq('voucher_date', date).order('daily_number', { ascending: false }).limit(1);
        if (data && data.length > 0 && data[0].daily_number) nextDaily = Number(data[0].daily_number) + 1;
    }

    if (fyId && ledgerId) {
        const { data } = await supabase.schema('gl').from('vouchers').select('cross_reference').eq('fiscal_period_id', fyId).eq('ledger_id', ledgerId).order('cross_reference', { ascending: false }).limit(1);
        if (data && data.length > 0 && data[0].cross_reference) nextCross = Number(data[0].cross_reference) + 1;
    }

    if (ledgerId) {
        const { data } = await supabase.schema('gl').from('ledgers').select('metadata').eq('id', ledgerId).single();
        if (data) {
            const meta = (typeof data.metadata === 'string' ? JSON.parse(data.metadata) : data.metadata) || {};
            config = { metadata: meta };
            
            const scope = meta.uniquenessScope || 'ledger';
            const resetYear = meta.resetYear !== false; 
            const lastNums = meta.lastNumbers || {};

            let lastVoucherNum = 0;

            if (scope === 'none') {
                nextVoucher = ''; 
            } else if (scope === 'ledger') {
                if (resetYear) {
                    lastVoucherNum = lastNums[fyId] || 0;
                } else {
                    lastVoucherNum = typeof lastNums === 'object' ? (lastNums.global || lastNums.ledger || 0) : (isNaN(lastNums) ? 0 : Number(lastNums));
                }
                nextVoucher = String(Number(lastVoucherNum) + 1);
            } else if (scope === 'branch' && branchId) {
                if (resetYear) {
                    lastVoucherNum = (lastNums[fyId] && lastNums[fyId][branchId]) ? lastNums[fyId][branchId] : 0;
                } else {
                    lastVoucherNum = lastNums[branchId] || 0;
                }
                nextVoucher = String(Number(lastVoucherNum) + 1);
            } else {
                nextVoucher = String(nextCross);
            }
        }
    }

    return { nextDaily, nextCross, nextVoucher, config };
  };

  const handleOpenForm = async (voucher = null) => {
    setIsHeaderOpen(true);
    if (voucher) {
      setCurrentVoucher(voucher);
      setLoading(true);
      try {
        const { data, error } = await supabase.schema('gl')
          .from('voucher_items')
          .select('*')
          .eq('voucher_id', voucher.id)
          .order('row_number', { ascending: true });
        
        if (error) throw error;
        
        const mappedItems = (data || []).map(item => {
          const detailsObj = typeof item.details === 'string' ? JSON.parse(item.details || '{}') : (item.details || {});
          return { 
             ...item, 
             currency_code: detailsObj.currency_code || '',
             details_dict: detailsObj.selected_details || {} 
          };
        });
        setVoucherItems(mappedItems);
      } catch (error) {
        console.error('Error fetching items:', error);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(true);
      const initialLedgerId = contextVals.ledger_id;
      const initialFyId = contextVals.fiscal_year_id;
      const currentLedger = ledgers.find(l => String(l.id) === String(initialLedgerId));
      const defaultCurrency = currentLedger?.currency || '';
      const defaultBranch = branches.find(b => b.is_default) || branches[0];
      const today = new Date().toISOString().split('T')[0];

      const { nextDaily, nextCross, nextVoucher } = await fetchAutoNumbers(today, initialLedgerId, initialFyId, defaultBranch?.id);

      setCurrentVoucher({
        voucher_date: today,
        voucher_type: docTypes.length > 0 ? docTypes[0].code : 'sys_general',
        status: 'draft',
        description: '',
        subsidiary_number: '',
        voucher_number: nextVoucher,
        daily_number: nextDaily,
        cross_reference: nextCross,
        reference_number: '',
        fiscal_period_id: initialFyId,
        ledger_id: initialLedgerId,
        branch_id: defaultBranch?.id || ''
      });
      setVoucherItems([{
        id: 'temp_' + Date.now(),
        row_number: 1,
        account_id: '',
        details_dict: {},
        debit: 0,
        credit: 0,
        currency_code: defaultCurrency,
        description: '',
        tracking_number: '',
        tracking_date: '',
        quantity: ''
      }]);
      setLoading(false);
    }
    setView('form');
  };

  const getValidDetailTypes = (accountId) => {
     if (!accountId) return [];
     const account = accounts.find(a => String(a.id) === String(accountId));
     if (!account || !account.metadata) return [];
     const meta = typeof account.metadata === 'string' ? JSON.parse(account.metadata) : account.metadata;
     const allowedTafsilCodesOrIds = meta.tafsils || [];
     
     if (allowedTafsilCodesOrIds.length === 0) return [];

     return detailTypes.filter(dt => allowedTafsilCodesOrIds.some(t => String(dt.id) === String(t) || dt.code === String(t)));
  };

  const handleSaveVoucher = async (status) => {
    if (!supabase) return;
    
    if (!currentVoucher.branch_id) {
       alert(t.branchReqError);
       return;
    }

    if (currentVoucher.subsidiary_number && currentVoucher.subsidiary_number.trim() !== '') {
        const query = supabase.schema('gl').from('vouchers')
            .select('id')
            .eq('fiscal_period_id', currentVoucher.fiscal_period_id)
            .eq('subsidiary_number', currentVoucher.subsidiary_number.trim());
            
        if (currentVoucher.id) query.neq('id', currentVoucher.id);
        
        const { data: subData } = await query;
        if (subData && subData.length > 0) {
            alert(t.subDupError);
            return;
        }
    }

    for (let i = 0; i < voucherItems.length; i++) {
        const item = voucherItems[i];
        if (!item.description || !item.account_id) {
           alert(t.reqFields);
           return;
        }

        const account = accounts.find(a => String(a.id) === String(item.account_id));
        if (account && account.metadata) {
            const meta = typeof account.metadata === 'string' ? JSON.parse(account.metadata) : account.metadata;
            
            if (meta.trackFeature && meta.trackMandatory) {
                if (!item.tracking_number || !item.tracking_date) {
                    alert(t.trackingReqError + ' ' + (i + 1) + ' (' + account.title + ')');
                    return;
                }
            }

            if (meta.qtyFeature && meta.qtyMandatory) {
                if (!item.quantity || parseNum(item.quantity) <= 0) {
                    alert(t.qtyReqError + ' ' + (i + 1) + ' (' + account.title + ')');
                    return;
                }
            }
        }

        const allowedDetailTypes = getValidDetailTypes(item.account_id);
        if (allowedDetailTypes.length > 0) {
           const dict = item.details_dict || {};
           for (const type of allowedDetailTypes) {
               if (!dict[type.code]) {
                   const errorMsg = t.detailRequiredError.replace('{type}', type.title).replace('{row}', i + 1);
                   alert(errorMsg);
                   return;
               }
           }
        }
    }

    const totalDebit = voucherItems.reduce((sum, item) => sum + parseNum(item.debit), 0);
    const totalCredit = voucherItems.reduce((sum, item) => sum + parseNum(item.credit), 0);
    
    if (totalDebit === 0 && totalCredit === 0) {
      alert(t.zeroAmountError);
      return;
    }

    if (status === 'temporary' && totalDebit !== totalCredit) {
      alert(t.unbalancedError);
      return;
    }

    setLoading(true);
    try {
      // Helper function to safely send null instead of empty strings for integer DB fields
      const cleanData = (val) => (val === '' ? null : val);

      const voucherData = { 
        ...currentVoucher, 
        status,
        total_debit: totalDebit,
        total_credit: totalCredit,
        subsidiary_number: cleanData(currentVoucher.subsidiary_number),
        reference_number: cleanData(currentVoucher.reference_number),
        voucher_number: cleanData(currentVoucher.voucher_number),
        daily_number: cleanData(currentVoucher.daily_number),
        cross_reference: cleanData(currentVoucher.cross_reference),
      };

      let savedVoucherId = voucherData.id;

      if (savedVoucherId) {
        const { error } = await supabase.schema('gl').from('vouchers').update(voucherData).eq('id', savedVoucherId);
        if (error) throw error;
        await supabase.schema('gl').from('voucher_items').delete().eq('voucher_id', savedVoucherId);
      } else {
        const { nextDaily, nextCross, nextVoucher, config } = await fetchAutoNumbers(voucherData.voucher_date, voucherData.ledger_id, voucherData.fiscal_period_id, voucherData.branch_id);
        
        voucherData.daily_number = nextDaily;
        voucherData.cross_reference = nextCross;
        
        const meta = config?.metadata || {};
        const scope = meta.uniquenessScope || 'ledger';

        if (scope !== 'none') {
            voucherData.voucher_number = nextVoucher;
        } else {
            if (!voucherData.voucher_number) {
                alert(isRtl ? 'شماره سند الزامی است.' : 'Voucher Number is required.');
                setLoading(false);
                return;
            }
        }

        const { data, error } = await supabase.schema('gl').from('vouchers').insert([voucherData]).select().single();
        if (error) throw error;
        savedVoucherId = data.id;

        // Update Auto Numbering Metadata
        if (scope !== 'none' && config) {
            const resetYear = meta.resetYear !== false;
            let lastNums = meta.lastNumbers || {};
            const fyId = voucherData.fiscal_period_id;
            const branchId = voucherData.branch_id;
            const savedVoucherNum = Number(voucherData.voucher_number); 

            if (scope === 'ledger') {
                if (resetYear) {
                    lastNums[fyId] = savedVoucherNum;
                } else {
                    lastNums.global = savedVoucherNum;
                }
            } else if (scope === 'branch') {
                if (resetYear) {
                    if (!lastNums[fyId]) lastNums[fyId] = {};
                    lastNums[fyId][branchId] = savedVoucherNum;
                } else {
                    lastNums[branchId] = savedVoucherNum;
                }
            }

            const { data: latestLedger } = await supabase.schema('gl').from('ledgers').select('metadata').eq('id', voucherData.ledger_id).single();
            if (latestLedger) {
               const latestMeta = (typeof latestLedger.metadata === 'string' ? JSON.parse(latestLedger.metadata) : latestLedger.metadata) || {};
               await supabase.schema('gl').from('ledgers').update({
                   metadata: { ...latestMeta, lastNumbers: lastNums }
               }).eq('id', voucherData.ledger_id);
            }
        }
      }

      const itemsToSave = voucherItems.map((item, index) => {
        return {
          voucher_id: savedVoucherId,
          row_number: index + 1,
          account_id: cleanData(item.account_id),
          debit: parseNum(item.debit),
          credit: parseNum(item.credit),
          description: item.description,
          tracking_number: cleanData(item.tracking_number),
          tracking_date: cleanData(item.tracking_date),
          quantity: parseNum(item.quantity) === 0 ? null : parseNum(item.quantity),
          details: { currency_code: item.currency_code, selected_details: item.details_dict || {} }
        };
      });

      if (itemsToSave.length > 0) {
        const { error: itemsError } = await supabase.schema('gl').from('voucher_items').insert(itemsToSave);
        if (itemsError) throw itemsError;
      }

      setView('list');
      setCurrentVoucher(null);
      setVoucherItems([]);
      fetchVouchers();
    } catch (error) {
      console.error('Error saving voucher:', error);
      alert('Error saving voucher: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...voucherItems];
    
    if (field === 'debit' || field === 'credit') {
      const otherField = field === 'debit' ? 'credit' : 'debit';
      if (parseNum(value) > 0) {
        newItems[index][otherField] = 0;
      }
    }

    newItems[index][field] = value;
    
    if (field === 'account_id') {
      const selectedAcc = accounts.find(a => String(a.id) === String(value));
      const currentLedger = ledgers.find(l => String(l.id) === String(currentVoucher.ledger_id));
      let newCurrency = currentLedger?.currency || '';

      if (selectedAcc && selectedAcc.metadata) {
        const meta = typeof selectedAcc.metadata === 'string' ? JSON.parse(selectedAcc.metadata) : selectedAcc.metadata;
        if (meta.currency_code) newCurrency = meta.currency_code;
      }
      newItems[index]['currency_code'] = newCurrency;
      newItems[index]['details_dict'] = {}; 
    }

    setVoucherItems(newItems);
  };

  const addItemRow = () => {
    const activeLedgerId = currentVoucher?.ledger_id || contextVals.ledger_id;
    const currentLedger = ledgers.find(l => String(l.id) === String(activeLedgerId));
    const lastDescription = voucherItems.length > 0 ? voucherItems[voucherItems.length - 1].description : '';

    const newId = 'temp_' + Date.now();
    setVoucherItems([...voucherItems, { 
      id: newId, 
      row_number: voucherItems.length + 1, 
      account_id: '', 
      details_dict: {},
      debit: 0, 
      credit: 0, 
      currency_code: currentLedger?.currency || '',
      description: lastDescription, 
      tracking_number: '', 
      tracking_date: '',
      quantity: '' 
    }]);
    setFocusedRowId(newId);
  };

  const globalBalance = () => {
    const totalDebit = voucherItems.reduce((sum, item) => sum + parseNum(item.debit), 0);
    const totalCredit = voucherItems.reduce((sum, item) => sum + parseNum(item.credit), 0);
    const diff = totalDebit - totalCredit;
    
    if (diff === 0) return;

    const emptyRowIndex = voucherItems.findIndex(item => parseNum(item.debit) === 0 && parseNum(item.credit) === 0);

    if (emptyRowIndex !== -1) {
       const newItems = [...voucherItems];
       if (diff < 0) {
           newItems[emptyRowIndex].debit = Math.abs(diff);
           newItems[emptyRowIndex].credit = 0;
       } else {
           newItems[emptyRowIndex].credit = diff;
           newItems[emptyRowIndex].debit = 0;
       }
       setVoucherItems(newItems);
       setFocusedRowId(newItems[emptyRowIndex].id);
    } else {
       const currentLedger = ledgers.find(l => String(l.id) === String(currentVoucher.ledger_id));
       const newId = 'temp_' + Date.now();
       setVoucherItems([...voucherItems, { 
         id: newId, 
         row_number: voucherItems.length + 1, 
         account_id: '', 
         details_dict: {},
         debit: diff < 0 ? Math.abs(diff) : 0, 
         credit: diff > 0 ? diff : 0, 
         currency_code: currentLedger?.currency || '',
         description: '', 
         tracking_number: '', 
         tracking_date: '',
         quantity: '' 
       }]);
       setFocusedRowId(newId);
    }
  };

  const copyDescription = (index) => {
    if (index > 0) {
      const newItems = [...voucherItems];
      newItems[index].description = newItems[index - 1].description;
      setVoucherItems(newItems);
    }
  };

  const removeRow = (index) => {
    if (voucherItems.length > 1) {
      setVoucherItems(voucherItems.filter((_, i) => i !== index));
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
    if (voucher.status === 'reviewed' || voucher.status === 'final') return;
    setVoucherToDelete(voucher);
    setShowDeleteModal(true);
  };

  const getStatusBadge = (status) => {
    const variant = status === 'final' ? 'success' : status === 'reviewed' ? 'info' : status === 'temporary' ? 'warning' : 'neutral';
    return <Badge variant={variant}>{t['status' + status.charAt(0).toUpperCase() + status.slice(1)]}</Badge>;
  };

  const columns = [
    { field: 'voucher_number', header: t.voucherNumber, width: 'w-24', sortable: true },
    { field: 'voucher_date', header: t.date, width: 'w-24', sortable: true },
    { field: 'voucher_type', header: t.type, width: 'w-32', render: (row) => docTypes.find(d => d.code === row.voucher_type)?.title || row.voucher_type },
    { field: 'status', header: t.status, width: 'w-32', render: (row) => getStatusBadge(row.status) },
    { field: 'description', header: t.description, width: 'w-64' },
    { field: 'total_debit', header: t.totalDebit, width: 'w-32', render: (row) => formatNum(row.total_debit) },
    { field: 'total_credit', header: t.totalCredit, width: 'w-32', render: (row) => formatNum(row.total_credit) }
  ];

  if (view === 'form' && currentVoucher) {
    const totalDebit = voucherItems.reduce((sum, item) => sum + parseNum(item.debit), 0);
    const totalCredit = voucherItems.reduce((sum, item) => sum + parseNum(item.credit), 0);
    const isBalanced = totalDebit === totalCredit;
    const isReadonly = currentVoucher.status === 'reviewed' || currentVoucher.status === 'final';

    const currentLedger = ledgers.find(l => String(l.id) === String(currentVoucher.ledger_id));
    const currentLedgerMeta = (typeof currentLedger?.metadata === 'string' ? JSON.parse(currentLedger.metadata) : currentLedger?.metadata) || {};
    const isVoucherNoManual = currentLedgerMeta.uniquenessScope === 'none';

    const ledgerStructureCode = String(currentLedger?.structure || '').trim();
    const targetStructure = accountStructures.find(s => String(s.code).trim() === ledgerStructureCode);
    const structureId = targetStructure ? String(targetStructure.id) : null;

    const currentFiscalYearTitle = fiscalYears.find(f => String(f.id) === String(currentVoucher.fiscal_period_id))?.title || '';
    const currentLedgerTitle = currentLedger?.title || '';

    const validAccountsForLedger = accounts.filter(a => {
        const isSubsidiary = a.level === 'subsidiary' || a.level === 'معین' || a.level === '4';
        return String(a.structure_id) === structureId && isSubsidiary;
    });

    return (
      <div className={`h-full flex flex-col p-4 md:p-6 bg-slate-50/50`}>
        <div className="mb-4 flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => { setView('list'); setCurrentVoucher(null); setVoucherItems([]); }} icon={isRtl ? ArrowRight : ArrowLeft}>{t.backToList}</Button>
            <div className="h-6 w-px bg-slate-200 mx-1"></div>
            <h2 className="text-lg font-bold text-slate-800">{currentVoucher.id ? t.edit : t.newVoucher}</h2>
            {currentVoucher.id && getStatusBadge(currentVoucher.status)}
          </div>
          <div className="flex items-center gap-2">
            {!isReadonly && (
              <>
                <Button variant="outline" onClick={() => handleSaveVoucher('draft')} icon={Save}>{t.saveDraft}</Button>
                <Button variant="primary" onClick={() => handleSaveVoucher('temporary')} icon={CheckCircle}>{t.saveTemp}</Button>
              </>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto flex flex-col gap-3">
          <Accordion 
            title={t.headerInfo} 
            isOpen={isHeaderOpen} 
            onToggle={() => setIsHeaderOpen(!isHeaderOpen)} 
            isRtl={isRtl} 
            icon={FileText}
            className="shrink-0"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <InputField label={t.fiscalYear} value={currentFiscalYearTitle} disabled isRtl={isRtl} />
              <InputField label={t.ledger} value={currentLedgerTitle} disabled isRtl={isRtl} />
              <SelectField label={t.branch} value={currentVoucher.branch_id || ''} onChange={(e) => {
                  const newBranch = e.target.value;
                  setCurrentVoucher({...currentVoucher, branch_id: newBranch});
                  if (!currentVoucher.id) {
                     fetchAutoNumbers(currentVoucher.voucher_date, currentVoucher.ledger_id, currentVoucher.fiscal_period_id, newBranch).then(({nextVoucher}) => {
                         if (currentLedgerMeta.uniquenessScope === 'branch') {
                             setCurrentVoucher(prev => ({...prev, voucher_number: nextVoucher}));
                         }
                     });
                  }
              }} disabled={isReadonly} isRtl={isRtl}>
                 <option value="" disabled>{t.selectBranch}</option>
                 {branches.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
              </SelectField>
              
              <InputField 
                 label={t.voucherNumber} 
                 value={currentVoucher.voucher_number || ''} 
                 onChange={(e) => setCurrentVoucher({...currentVoucher, voucher_number: e.target.value})}
                 disabled={isReadonly || !isVoucherNoManual} 
                 isRtl={isRtl} 
                 dir="ltr" 
                 className={`text-center ${!isVoucherNoManual ? 'bg-slate-50' : 'bg-white'}`} 
              />
              <InputField label={t.dailyNumber} value={currentVoucher.daily_number || '-'} disabled isRtl={isRtl} dir="ltr" className="text-center bg-slate-50" />
              <InputField label={t.crossReference} value={currentVoucher.cross_reference || '-'} disabled isRtl={isRtl} dir="ltr" className="text-center bg-slate-50" />
              
              <InputField label={t.referenceNumber} value={currentVoucher.reference_number || '-'} disabled={true} isRtl={isRtl} dir="ltr" className="text-center bg-slate-50" />
              <InputField label={t.subsidiaryNumber} value={currentVoucher.subsidiary_number || ''} onChange={(e) => setCurrentVoucher({...currentVoucher, subsidiary_number: e.target.value})} disabled={isReadonly} isRtl={isRtl} dir="ltr" className="text-center" />
              <InputField type="date" label={t.date} value={currentVoucher.voucher_date || ''} onChange={(e) => {
                 const newDate = e.target.value;
                 setCurrentVoucher({...currentVoucher, voucher_date: newDate});
                 if (!currentVoucher.id) {
                     fetchAutoNumbers(newDate, currentVoucher.ledger_id, currentVoucher.fiscal_period_id, currentVoucher.branch_id).then(({nextDaily}) => {
                         setCurrentVoucher(prev => ({...prev, daily_number: nextDaily}));
                     });
                 }
              }} disabled={isReadonly} isRtl={isRtl} />
              
              <SelectField label={t.type} value={currentVoucher.voucher_type || ''} onChange={(e) => setCurrentVoucher({...currentVoucher, voucher_type: e.target.value})} disabled={isReadonly} isRtl={isRtl} >
                {docTypes.map(d => <option key={d.id} value={d.code}>{d.title}</option>)}
              </SelectField>

              <div className="md:col-span-2 lg:col-span-2">
                  <InputField label={t.description} value={currentVoucher.description || ''} onChange={(e) => setCurrentVoucher({...currentVoucher, description: e.target.value})} disabled={isReadonly} isRtl={isRtl} />
              </div>
            </div>
          </Accordion>

          <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
            <div className="flex justify-between items-center p-3 bg-slate-50 border-b border-slate-200 shrink-0">
              <h3 className="text-sm font-bold text-slate-800">{t.items}</h3>
              {!isReadonly && (
                <div className="flex gap-2">
                   <Button variant="outline" size="sm" onClick={globalBalance} icon={Scale}>{t.balance}</Button>
                   <Button variant="primary" size="sm" onClick={addItemRow} icon={Plus}>{t.addRow}</Button>
                </div>
              )}
            </div>
            
            <div className="flex-1 overflow-auto custom-scrollbar p-2 bg-slate-100">
               {voucherItems.map((item, index) => {
                  const isFocused = focusedRowId === item.id;
                  const accountObj = accounts.find(a => String(a.id) === String(item.account_id));
                  let hasTracking = false;
                  let hasQuantity = false;
                  if (accountObj && accountObj.metadata) {
                      const meta = typeof accountObj.metadata === 'string' ? JSON.parse(accountObj.metadata) : accountObj.metadata;
                      if (meta.trackFeature) hasTracking = true;
                      if (meta.qtyFeature) hasQuantity = true;
                  }

                  const allowedDetailTypes = getValidDetailTypes(item.account_id);
                  const hasDetails = allowedDetailTypes.length > 0;
                  const hasRow2Data = Object.keys(item.details_dict || {}).length > 0 || item.tracking_number || item.tracking_date || item.quantity;
                  const showRow2 = hasDetails || hasTracking || hasQuantity || hasRow2Data;

                  return (
                     <div 
                        key={item.id} 
                        className={`mb-2 bg-white rounded-lg border transition-all duration-200 ${isFocused ? 'border-indigo-400 shadow-md ring-1 ring-indigo-100' : 'border-slate-200 shadow-sm hover:border-indigo-200'}`}
                        onClick={() => setFocusedRowId(item.id)}
                     >
                        <div className="flex flex-col md:flex-row gap-0">
                           <div className="w-12 bg-slate-50 flex flex-col items-center justify-center border-r border-slate-100 py-2 rounded-r-lg">
                              <span className="text-xs font-bold text-slate-400 mb-2">{index + 1}</span>
                              {!isReadonly && (
                                <button className="text-red-400 hover:text-red-600 p-1 rounded transition-all" onClick={(e) => { e.stopPropagation(); removeRow(index); }}><Trash2 size={14} /></button>
                              )}
                           </div>
                           
                           <div className="flex-1 p-2 flex flex-col gap-1.5">
                              {/* --- ROW 1 --- */}
                              <div className="grid grid-cols-12 gap-x-3 gap-y-2 items-end">
                                 <div className="col-span-12 lg:col-span-3 flex flex-col gap-1">
                                    <div className="text-[10px] font-bold text-slate-500">{t.account}</div>
                                    <div className={`border rounded h-8 flex items-center ${isFocused ? 'border-indigo-300 bg-indigo-50/20' : 'border-slate-200 bg-slate-50'}`}>
                                       <SearchableAccountSelect accounts={validAccountsForLedger} value={item.account_id} onChange={(v) => handleItemChange(index, 'account_id', v)} disabled={isReadonly} placeholder={t.searchAccount} />
                                    </div>
                                 </div>
                                 <div className="col-span-6 lg:col-span-2 flex flex-col gap-1">
                                    <div className="text-[10px] font-bold text-slate-500">{t.debit}</div>
                                    <input type="text" className={`w-full border rounded h-8 px-2 text-[12px] dir-ltr text-right outline-none ${isFocused ? 'border-indigo-300 bg-white' : 'border-slate-200 bg-slate-50'} ${item.debit > 0 ? 'text-indigo-700 font-bold bg-indigo-50/30' : ''}`} value={formatNum(item.debit)} onChange={(e) => {
                                        const raw = e.target.value.replace(/,/g, '');
                                        if (!isNaN(raw)) handleItemChange(index, 'debit', raw === '' ? 0 : raw);
                                    }} disabled={isReadonly} onFocus={() => setFocusedRowId(item.id)} />
                                 </div>
                                 <div className="col-span-6 lg:col-span-2 flex flex-col gap-1">
                                    <div className="text-[10px] font-bold text-slate-500">{t.credit}</div>
                                    <input type="text" className={`w-full border rounded h-8 px-2 text-[12px] dir-ltr text-right outline-none ${isFocused ? 'border-indigo-300 bg-white' : 'border-slate-200 bg-slate-50'} ${item.credit > 0 ? 'text-indigo-700 font-bold bg-indigo-50/30' : ''}`} value={formatNum(item.credit)} onChange={(e) => {
                                        const raw = e.target.value.replace(/,/g, '');
                                        if (!isNaN(raw)) handleItemChange(index, 'credit', raw === '' ? 0 : raw);
                                    }} disabled={isReadonly} onFocus={() => setFocusedRowId(item.id)} />
                                 </div>
                                 <div className="col-span-6 lg:col-span-2 flex flex-col gap-1">
                                    <div className="text-[10px] font-bold text-slate-500">{t.currency}</div>
                                    <select 
                                       className={`w-full border rounded h-8 px-1 text-[12px] outline-none ${isFocused ? 'border-indigo-300 bg-white' : 'border-slate-200 bg-slate-50'}`}
                                       value={item.currency_code || ''}
                                       onChange={(e) => handleItemChange(index, 'currency_code', e.target.value)}
                                       disabled={isReadonly}
                                       onFocus={() => setFocusedRowId(item.id)}
                                    >
                                       <option value="">-</option>
                                       {currencies.map(c => <option key={c.id} value={c.code}>{c.title}</option>)}
                                    </select>
                                 </div>
                                 <div className="col-span-12 lg:col-span-3 flex flex-col gap-1">
                                    <div className="flex justify-between items-center">
                                        <div className="text-[10px] font-bold text-slate-500">{t.description}</div>
                                        {!isReadonly && index > 0 && (
                                            <button onClick={() => copyDescription(index)} className="text-[10px] text-indigo-500 flex items-center gap-1 hover:text-indigo-700"><Copy size={10}/> {t.copyFromAbove}</button>
                                        )}
                                    </div>
                                    <input type="text" className={`w-full border rounded h-8 px-2 text-[12px] outline-none ${isFocused ? 'border-indigo-300 bg-white' : 'border-slate-200 bg-slate-50'}`} value={item.description || ''} onChange={(e) => handleItemChange(index, 'description', e.target.value)} disabled={isReadonly} onFocus={() => setFocusedRowId(item.id)} />
                                 </div>
                              </div>

                              {/* --- ROW 2 (Conditional) --- */}
                              {showRow2 && (
                                 <div className="grid grid-cols-12 gap-x-3 gap-y-2 p-2 bg-slate-50/80 rounded border border-slate-100 mt-0.5">
                                    <div className="col-span-12 lg:col-span-6 flex flex-col gap-1">
                                       <div className="text-[10px] font-bold text-slate-500">{t.detail}</div>
                                       <div className={`border rounded min-h-8 flex items-center ${isFocused ? 'border-indigo-300 bg-indigo-50/20' : 'border-slate-200 bg-slate-50'} ${allowedDetailTypes.length === 0 ? 'opacity-60 bg-slate-100' : ''}`}>
                                           <MultiDetailSelector 
                                              allowedTypes={allowedDetailTypes}
                                              allInstances={allDetailInstances}
                                              value={item.details_dict || {}} 
                                              onChange={(v) => handleItemChange(index, 'details_dict', v)} 
                                              disabled={isReadonly || allowedDetailTypes.length === 0} 
                                              t={t}
                                           />
                                       </div>
                                    </div>
                                    <div className={`col-span-4 lg:col-span-2 flex flex-col gap-1 ${hasTracking ? '' : 'opacity-40 grayscale'}`}>
                                       <div className="text-[10px] font-bold text-slate-500">{t.trackingNumber}</div>
                                       <input type="text" className={`w-full border rounded h-8 px-2 text-[12px] outline-none ${isFocused ? 'border-indigo-300 bg-white' : 'border-slate-200 bg-slate-50'}`} value={item.tracking_number || ''} onChange={(e) => handleItemChange(index, 'tracking_number', e.target.value)} disabled={isReadonly || (!hasTracking && !item.tracking_number)} onFocus={() => setFocusedRowId(item.id)} />
                                    </div>
                                    <div className={`col-span-4 lg:col-span-2 flex flex-col gap-1 ${hasTracking ? '' : 'opacity-40 grayscale'}`}>
                                       <div className="text-[10px] font-bold text-slate-500">{t.trackingDate}</div>
                                       <input type="date" className={`w-full border rounded h-8 px-2 text-[12px] outline-none ${isFocused ? 'border-indigo-300 bg-white' : 'border-slate-200 bg-slate-50'} uppercase`} value={item.tracking_date || ''} onChange={(e) => handleItemChange(index, 'tracking_date', e.target.value)} disabled={isReadonly || (!hasTracking && !item.tracking_date)} onFocus={() => setFocusedRowId(item.id)} />
                                    </div>
                                    <div className={`col-span-4 lg:col-span-2 flex flex-col gap-1 ${hasQuantity ? '' : 'opacity-40 grayscale'}`}>
                                       <div className="text-[10px] font-bold text-slate-500">{t.quantity}</div>
                                       <input type="text" className={`w-full border rounded h-8 px-2 text-[12px] dir-ltr text-right outline-none ${isFocused ? 'border-indigo-300 bg-white' : 'border-slate-200 bg-slate-50'}`} value={formatNum(item.quantity)} onChange={(e) => {
                                           const raw = e.target.value.replace(/,/g, '');
                                           if (!isNaN(raw)) handleItemChange(index, 'quantity', raw === '' ? '' : raw);
                                       }} disabled={isReadonly || (!hasQuantity && !item.quantity)} onFocus={() => setFocusedRowId(item.id)} />
                                    </div>
                                 </div>
                              )}
                           </div>
                        </div>
                     </div>
                  );
               })}
            </div>

            <div className="bg-slate-50 border-t border-slate-200 p-4 flex flex-wrap gap-8 text-[14px] font-bold shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
              <div className="flex items-center gap-2.5">
                <span className="text-slate-500 font-sans text-xs uppercase tracking-wider">{t.totalDebit}</span>
                <span className="text-indigo-700 bg-indigo-50 px-3 py-1 rounded-md border border-indigo-100">{formatNum(totalDebit)}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-slate-500 font-sans text-xs uppercase tracking-wider">{t.totalCredit}</span>
                <span className="text-indigo-700 bg-indigo-50 px-3 py-1 rounded-md border border-indigo-100">{formatNum(totalCredit)}</span>
              </div>
              <div className="flex-1"></div>
              <div className={`flex items-center gap-2 px-4 py-1 rounded-full border ${isBalanced ? 'text-emerald-700 bg-emerald-50 border-emerald-100' : 'text-red-700 bg-red-50 border-red-100'}`}>
                 {isBalanced ? <CheckCircle size={16}/> : <FileWarning size={16}/>}
                 <span className="font-sans text-xs">{isBalanced ? t.alreadyBalanced || 'Balanced' : formatNum(Math.abs(totalDebit - totalCredit))}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col p-4 md:p-6 bg-slate-50/50`}>
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
      </div>

      <FilterSection onSearch={() => {}} onClear={() => setSearchParams({ voucher_number: '', description: '' })} isRtl={isRtl} title={t.search}>
        <InputField label={t.voucherNumber} value={searchParams.voucher_number} onChange={e => setSearchParams({...searchParams, voucher_number: e.target.value})} isRtl={isRtl} />
        <InputField label={t.description} value={searchParams.description} onChange={e => setSearchParams({...searchParams, description: e.target.value})} isRtl={isRtl} />
      </FilterSection>

      <div className="flex-1 min-h-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <DataGrid 
          columns={columns} 
          data={vouchers.filter(v => 
            (!searchParams.voucher_number || String(v.voucher_number).includes(searchParams.voucher_number)) && 
            (!searchParams.description || v.description?.includes(searchParams.description))
          )} 
          selectedIds={selectedIds} 
          onSelectRow={(id, c) => setSelectedIds(c ? [...selectedIds, id] : selectedIds.filter(i => i !== id))} 
          onSelectAll={(c) => setSelectedIds(c ? vouchers.map(v => v.id) : [])} 
          onCreate={() => handleOpenForm()} 
          onDelete={(ids) => { setVoucherToDelete(vouchers.find(v => v.id === ids[0])); setShowDeleteModal(true); }} 
          onDoubleClick={(r) => handleOpenForm(r)} 
          isRtl={isRtl} 
          isLoading={loading} 
          actions={(r) => (
            <div className="flex gap-1 justify-center">
              <Button variant="ghost" size="iconSm" icon={Edit} onClick={() => handleOpenForm(r)} />
              <Button variant="ghost" size="iconSm" icon={Trash2} className="text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => promptDelete(r)} />
            </div>
          )}
        />
      </div>

      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title={t.delete} footer={<><Button variant="ghost" onClick={() => setShowDeleteModal(false)}>{t.backToList}</Button><Button variant="danger" onClick={confirmDelete}>{t.delete}</Button></>}>
        <div className="p-4"><p className="text-slate-700 font-medium">{t.confirmDelete}</p></div>
      </Modal>
    </div>
  );
};

window.Vouchers = Vouchers;
export default Vouchers;
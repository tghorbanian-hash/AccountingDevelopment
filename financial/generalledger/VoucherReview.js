/* Filename: financial/generalledger/VoucherReview.js */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Edit, Trash2, ArrowRight, ArrowLeft, 
  Save, FileText, CheckCircle, FileWarning, Filter, Search, Scale, Copy, Check, X, Printer, CheckSquare, Plus, Eye, RotateCcw, ListOrdered,
  Coins, Calculator, CopyPlus, PanelRightClose, PanelRightOpen, Layers
} from 'lucide-react';

const localTranslations = {
  en: {
    title: 'Voucher Review',
    subtitle: 'Review, edit, and approve accounting vouchers',
    search: 'Advanced Search',
    voucherNumber: 'Voucher No.',
    date: 'Date',
    type: 'Doc Type',
    status: 'Status',
    description: 'Description',
    totalDebit: 'Total Debit',
    totalCredit: 'Total Credit',
    amount: 'Voucher Amount',
    actions: 'Actions',
    edit: 'Edit',
    view: 'View',
    delete: 'Delete',
    print: 'Print',
    printVoucher: 'Print Voucher',
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
    balance: 'Balance',
    saveTemp: 'Save as Temporary',
    saveReviewed: 'Save as Reviewed',
    revertToTemp: 'Revert to Temporary',
    backToList: 'Back to List',
    confirmDelete: 'Are you sure you want to delete this voucher?',
    statusTemporary: 'Temporary',
    statusReviewed: 'Reviewed',
    general: 'General',
    trackingNumber: 'Tracking No.',
    trackingDate: 'Tracking Date',
    quantity: 'Qty',
    unbalancedError: 'Voucher is not balanced.',
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
    subDupError: 'Subsidiary number is duplicate in this fiscal year.',
    fromDate: 'From Date',
    toDate: 'To Date',
    all: 'All',
    makeTemporary: 'Change to Temporary',
    makeReviewed: 'Change to Reviewed',
    noPeriodsFound: 'No fiscal periods defined for this fiscal year.',
    dateNotInPeriods: 'Voucher date does not fall within any period of this fiscal year.',
    periodClosed: 'The fiscal period for this date is closed and you do not have permission to edit/save.',
    selectedItems: '{count} items selected',
    sortVouchers: 'Sort Vouchers',
    bulkSort: 'Bulk Date Range Sort',
    singleSort: 'Shift Single Voucher',
    targetDailyNumber: 'New Daily Number',
    applySort: 'Apply Sort',
    sortSuccess: 'Sorting applied successfully.',
    sortError: 'Error during sorting operation.',
    sortDesc: 'Manage and reorder the daily numbers of vouchers.',
    bulkSortDesc: 'Select a date range to sequentially reorder all daily numbers day-by-day starting from 1.',
    singleSortDesc: 'Assign a new daily number to this voucher. Other vouchers on the same day will automatically shift.',
    currencyConversions: 'Currency Conversions',
    opCurrency: 'Operating Currency',
    rep1Currency: 'Reporting Currency 1',
    rep2Currency: 'Reporting Currency 2',
    exchangeRate: 'Exchange Rate',
    reverseCalc: 'Reverse Calculation',
    convertedAmount: 'Final Converted Amount',
    baseAmount: 'Base Amount',
    duplicateRowError: 'Row {row} is an exact duplicate of another row. Please modify at least one field.',
    currencyMandatoryError: 'Currency conversions are mandatory for the account in row {row}.',
    base: 'Base',
    copyRow: 'Copy Row',
    summary: 'Summary',
    copyVoucher: 'Copy Voucher',
    balanced: 'Balanced',
    unbalanced: 'Unbalanced',
    summaryBase: 'Base',
    summaryOp: 'OP Cur',
    summaryRep1: 'Rep 1 Cur',
    summaryRep2: 'Rep 2 Cur',
  },
  fa: {
    title: 'بررسی اسناد',
    subtitle: 'بررسی، ویرایش و تایید اسناد حسابداری',
    search: 'جستجوی پیشرفته',
    voucherNumber: 'شماره سند',
    date: 'تاریخ',
    type: 'نوع سند',
    status: 'وضعیت',
    description: 'شرح',
    totalDebit: 'جمع بدهکار',
    totalCredit: 'جمع بستانکار',
    amount: 'مبلغ سند',
    actions: 'عملیات',
    edit: 'ویرایش',
    view: 'مشاهده',
    delete: 'حذف',
    print: 'چاپ',
    printVoucher: 'چاپ سند حسابداری',
    branch: 'شعبه',
    selectBranch: 'انتخاب شعبه',
    branchReqError: 'لطفاً شعبه را انتخاب کنید.',
    fiscalYear: 'سال مالی',
    ledger: 'دفتر کل',
    subsidiaryNumber: 'شماره فرعی',
    items: 'اقلام سند',
    addRow: 'ردیف جدید',
    row: 'ردیف',
    account: 'کد و شرح معین',
    detail: 'تفصیل',
    debit: 'بدهکار',
    credit: 'بستانکار',
    currency: 'ارز',
    balance: 'تراز کردن',
    saveTemp: 'ذخیره به عنوان موقت',
    saveReviewed: 'تایید و ذخیره (بررسی شده)',
    revertToTemp: 'برگشت به موقت',
    backToList: 'بازگشت به فهرست',
    confirmDelete: 'آیا از حذف این سند اطمینان دارید؟',
    statusTemporary: 'موقت',
    statusReviewed: 'بررسی شده',
    general: 'عمومی',
    trackingNumber: 'شماره پیگیری',
    trackingDate: 'تاریخ پیگیری',
    quantity: 'مقدار',
    unbalancedError: 'سند بالانس نیست.',
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
    subDupError: 'شماره فرعی وارد شده در این سال مالی تکراری است.',
    fromDate: 'از تاریخ',
    toDate: 'تا تاریخ',
    all: 'همه',
    makeTemporary: 'تبدیل به موقت',
    makeReviewed: 'تبدیل به بررسی شده',
    noPeriodsFound: 'دوره‌های مالی برای این سال تعریف نشده است.',
    dateNotInPeriods: 'تاریخ سند در محدوده دوره‌های این سال مالی نیست.',
    periodClosed: 'دوره مالی مربوط به این تاریخ بسته است و شما مجوز ثبت/ویرایش ندارید.',
    selectedItems: '{count} مورد انتخاب شده',
    sortVouchers: 'مرتب‌سازی اسناد',
    bulkSort: 'مرتب‌سازی بازه زمانی',
    singleSort: 'جابجایی سند (تکی)',
    targetDailyNumber: 'شماره روزانه جدید',
    applySort: 'اعمال مرتب‌سازی',
    sortSuccess: 'مرتب‌سازی با موفقیت انجام شد.',
    sortError: 'خطا در عملیات مرتب‌سازی.',
    sortDesc: 'در این بخش می‌توانید شماره روزانه اسناد را مرتب کنید.',
    bulkSortDesc: 'با انتخاب بازه زمانی، شماره روزانه تمامی اسناد ثبت شده در آن روزها به ترتیب از ۱ مرتب می‌شوند.',
    singleSortDesc: 'با تعیین شماره روزانه جدید، این سند جابجا شده و شماره سایر اسنادِ آن روز به صورت خودکار شیفت پیدا می‌کند.',
    currencyConversions: 'تبدیلات ارزی قلم سند',
    opCurrency: 'ارز عملیاتی',
    rep1Currency: 'ارز گزارشگری ۱',
    rep2Currency: 'ارز گزارشگری ۲',
    exchangeRate: 'نرخ تبدیل',
    reverseCalc: 'محاسبه معکوس',
    convertedAmount: 'مبلغ نهایی (محاسبه شده)',
    baseAmount: 'مبلغ مبنا',
    duplicateRowError: 'ردیف {row} دقیقاً مشابه یک ردیف دیگر است. لطفاً حداقل یک فیلد را تغییر دهید.',
    currencyMandatoryError: 'ورود اطلاعات تبدیلات ارزی برای معین ردیف {row} اجباری است.',
    base: 'مبنا',
    copyRow: 'کپی ردیف',
    summary: 'خلاصه سند',
    copyVoucher: 'کپی سند',
    balanced: 'تراز',
    unbalanced: 'اختلاف',
    summaryBase: 'ارز مبنا',
    summaryOp: 'عملیاتی',
    summaryRep1: 'گزارشگری ۱',
    summaryRep2: 'گزارشگری ۲',
  }
};

const normalizeFa = (str) => {
  if (!str) return '';
  return String(str).replace(/[يِي]/g, 'ی').replace(/[كک]/g, 'ک').replace(/[إأآا]/g, 'ا').toLowerCase();
};

const calcConv = (amount, rate, isReverse) => {
    if (!amount || !rate) return 0;
    const numAmt = parseFloat(amount);
    const numRate = parseFloat(rate);
    if (isNaN(numAmt) || isNaN(numRate) || numRate === 0) return 0;
    return isReverse ? (numAmt / numRate) : (numAmt * numRate);
};

const RowNumberInput = ({ value, onChangeRow, max }) => {
    const [val, setVal] = useState(value);
    
    useEffect(() => { 
        setVal(value); 
    }, [value]);
    
    const handleBlur = () => {
        let num = parseInt(val, 10);
        if (isNaN(num) || num < 1) num = 1;
        if (num > max) num = max;
        setVal(num);
        if (num !== value) onChangeRow(num);
    };

    return (
        <input 
            type="number" 
            className="w-8 text-center bg-transparent border-b border-dashed border-slate-300 outline-none text-[11px] font-bold text-slate-500 hover:border-indigo-400 focus:border-indigo-500 focus:text-indigo-700 transition-colors" 
            value={val} 
            onChange={e => setVal(e.target.value)} 
            onBlur={handleBlur} 
            onKeyDown={e => e.key === 'Enter' && handleBlur()} 
            title="تغییر شماره ردیف"
        />
    );
};

const SearchableAccountSelect = ({ accounts, value, onChange, disabled, placeholder, className, onFocus }) => {
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

  const normalizedSearch = normalizeFa(search);
  const filtered = accounts.filter(a => {
      const matchCode = a.full_code ? normalizeFa(a.full_code).includes(normalizedSearch) : false;
      const matchTitle = a.title ? normalizeFa(a.title).includes(normalizedSearch) : false;
      const matchPath = a.displayPath ? normalizeFa(a.displayPath).includes(normalizedSearch) : false;
      return matchCode || matchTitle || matchPath;
  });

  return (
    <div className="relative w-full h-full flex items-center" ref={wrapperRef}>
      <div className="relative w-full h-full flex items-center">
        <input
          type="text"
          className={className || `w-full bg-transparent border-0 border-b border-transparent hover:border-slate-300 focus:border-indigo-500 rounded-none h-8 px-2 outline-none text-[12px] text-slate-800 transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          value={isOpen ? search : displaySelected}
          onChange={e => { setSearch(e.target.value); setIsOpen(true); }}
          onFocus={() => { setIsOpen(true); setSearch(''); if (onFocus) onFocus(); }}
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
            <div className="px-3 py-3 text-[11px] text-slate-400 text-center">{t?.notFound || 'موردی یافت نشد'}</div>
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
                           .filter(d => d.detail_type_code === type.code && (normalizeFa(d.title).includes(normalizeFa(search)) || (d.detail_code && normalizeFa(d.detail_code).includes(normalizeFa(search)))))
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
                         {allInstances.filter(d => d.detail_type_code === type.code && (normalizeFa(d.title).includes(normalizeFa(search)) || (d.detail_code && normalizeFa(d.detail_code).includes(normalizeFa(search))))).length === 0 && (
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
  const parsed = Number(num);
  return isNaN(parsed) ? '' : parsed.toLocaleString('en-US', { maximumFractionDigits: 6 });
};

const parseNum = (str) => {
  const raw = String(str).replace(/,/g, '');
  return isNaN(raw) || raw === '' ? 0 : parseFloat(raw);
};

const VoucherReview = ({ language = 'fa' }) => {
  const t = localTranslations[language];
  const isRtl = language === 'fa';
  
  const UI = window.UI || {};
  const { Button, InputField, SelectField, DataGrid, FilterSection, Modal, Badge, Accordion } = UI;
  const supabase = window.supabase;

  const [view, setView] = useState('list');
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [voucherToDelete, setVoucherToDelete] = useState(null);
  const [voucherToPrint, setVoucherToPrint] = useState(null);
  const [currencyModalIndex, setCurrencyModalIndex] = useState(null);

  const [showSortModal, setShowSortModal] = useState(false);
  const [sortTab, setSortTab] = useState('bulk');
  const [sortParams, setSortParams] = useState({
      fromDate: '',
      toDate: '',
      singleVoucherId: null,
      singleVoucherDate: '',
      singleVoucherNo: '',
      targetDailyNumber: ''
  });

  const [contextVals, setContextVals] = useState({ fiscal_year_id: '', ledger_id: '' });

  const [vouchers, setVouchers] = useState([]);
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
  
  const [searchParams, setSearchParams] = useState({ 
      voucher_number: '', 
      description: '', 
      from_date: '', 
      to_date: '', 
      status: '', 
      voucher_type: '', 
      account_id: '' 
  });
  const [selectedIds, setSelectedIds] = useState([]);

  const [currentVoucher, setCurrentVoucher] = useState(null);
  const [voucherItems, setVoucherItems] = useState([]);
  
  const [focusedRowId, setFocusedRowId] = useState(null);
  const [isHeaderOpen, setIsHeaderOpen] = useState(true);
  const [isSummaryOpen, setIsSummaryOpen] = useState(true);

  useEffect(() => {
    fetchLookups();
  }, []);

  useEffect(() => {
    if (view === 'list') {
      if (contextVals.fiscal_year_id && contextVals.ledger_id) {
        fetchVouchers(searchParams);
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
            return res.data || null;
        } catch (e) {
            console.error("Exception in fetchLookups:", e);
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

    if (brData) setBranches(brData.filter(b => b.is_active !== false));
    if (fyData) setFiscalYears(fyData);
    if (ledData) setLedgers(ledData);
    if (structData) setAccountStructures(structData);
    if (dtData) setDetailTypes(dtData);
    if (diData) setAllDetailInstances(diData);
    if (currGlobalsData && currGlobalsData.length > 0) setCurrencyGlobals(currGlobalsData[0]);

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
    if (!supabase || !contextVals.fiscal_year_id || !contextVals.ledger_id) return;

    setLoading(true);
    try {
      let query = supabase.schema('gl').from('vouchers')
        .select('*')
        .eq('fiscal_period_id', contextVals.fiscal_year_id)
        .eq('ledger_id', contextVals.ledger_id)
        .in('status', ['temporary', 'reviewed'])
        .order('voucher_date', { ascending: false })
        .order('voucher_number', { ascending: false });
      
      if (paramsObj.voucher_number) query = query.eq('voucher_number', paramsObj.voucher_number);
      if (paramsObj.from_date) query = query.gte('voucher_date', paramsObj.from_date);
      if (paramsObj.to_date) query = query.lte('voucher_date', paramsObj.to_date);
      if (paramsObj.status) query = query.eq('status', paramsObj.status);
      if (paramsObj.voucher_type) query = query.eq('voucher_type', paramsObj.voucher_type);
      if (paramsObj.description) query = query.ilike('description', `%${paramsObj.description}%`);

      if (paramsObj.account_id) {
          const { data: viData } = await supabase.schema('gl').from('voucher_items').select('voucher_id').eq('account_id', paramsObj.account_id);
          if (viData && viData.length > 0) {
              const vIds = viData.map(v => v.voucher_id);
              query = query.in('id', vIds);
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

  const validateFiscalPeriod = async (date, fyId) => {
    try {
        const { data: periods, error: pError } = await supabase.schema('gl').from('fiscal_periods').select('*').eq('year_id', fyId);
        if (pError) throw pError;
        if (!periods || periods.length === 0) return { valid: false, msg: t.noPeriodsFound };
        const period = periods.find(p => date >= p.start_date && date <= p.end_date);
        if (!period) return { valid: false, msg: t.dateNotInPeriods };
        if (period.status === 'open') return { valid: true };

        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;
        if (userId) {
            const { data: exc, error: eError } = await supabase.schema('gl').from('fiscal_period_exceptions')
                .select('*')
                .eq('period_id', period.id)
                .eq('user_id', userId);
            if (!eError && exc && exc.length > 0) {
                if ((exc[0].allowed_statuses || []).includes(period.status)) return { valid: true };
            }
        }
        return { valid: false, msg: t.periodClosed };
    } catch (err) {
        return { valid: false, msg: 'Error validating fiscal period.' };
    }
  };

  const handleOpenForm = async (voucher = null) => {
    setIsHeaderOpen(true);
    setIsSummaryOpen(true);
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
             details_dict: detailsObj.selected_details || {},
             op_rate: item.op_rate ?? 1,
             op_is_reverse: item.op_is_reverse ?? false,
             op_debit: item.op_debit ?? 0,
             op_credit: item.op_credit ?? 0,
             rep1_rate: item.rep1_rate ?? 1,
             rep1_is_reverse: item.rep1_is_reverse ?? false,
             rep1_debit: item.rep1_debit ?? 0,
             rep1_credit: item.rep1_credit ?? 0,
             rep2_rate: item.rep2_rate ?? 1,
             rep2_is_reverse: item.rep2_is_reverse ?? false,
             rep2_debit: item.rep2_debit ?? 0,
             rep2_credit: item.rep2_credit ?? 0,
          };
        });
        setVoucherItems(mappedItems);
        setFocusedRowId(null);
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
      const newId = 'temp_' + Date.now();
      setVoucherItems([{
        id: newId,
        row_number: 1,
        account_id: '',
        details_dict: {},
        debit: 0,
        credit: 0,
        currency_code: defaultCurrency,
        description: '',
        tracking_number: '',
        tracking_date: '',
        quantity: '',
        op_rate: 1, op_is_reverse: false, op_debit: 0, op_credit: 0,
        rep1_rate: 1, rep1_is_reverse: false, rep1_debit: 0, rep1_credit: 0,
        rep2_rate: 1, rep2_is_reverse: false, rep2_debit: 0, rep2_credit: 0
      }]);
      setFocusedRowId(newId);
      setIsHeaderOpen(false);
      setLoading(false);
    }
    setView('form');
  };

  const handleCopyVoucher = async (voucher) => {
      setLoading(true);
      try {
          const { data, error } = await supabase.schema('gl').from('voucher_items').select('*').eq('voucher_id', voucher.id).order('row_number', { ascending: true });
          if (error) throw error;

          const today = new Date().toISOString().split('T')[0];
          const { nextDaily, nextCross, nextVoucher } = await fetchAutoNumbers(today, voucher.ledger_id, voucher.fiscal_period_id, voucher.branch_id);

          setCurrentVoucher({
              ...voucher,
              id: null,
              voucher_date: today,
              status: 'draft',
              voucher_number: nextVoucher,
              daily_number: nextDaily,
              cross_reference: nextCross,
              reference_number: '',
              reviewed_by: null,
              approved_by: null,
          });

          const mappedItems = (data || []).map((item, index) => {
              const detailsObj = typeof item.details === 'string' ? JSON.parse(item.details || '{}') : (item.details || {});
              return {
                  ...item,
                  id: 'temp_' + Date.now() + '_' + index,
                  voucher_id: null,
                  currency_code: detailsObj.currency_code || '',
                  details_dict: detailsObj.selected_details || {},
                  op_rate: item.op_rate ?? 1, op_is_reverse: item.op_is_reverse ?? false, op_debit: item.op_debit ?? 0, op_credit: item.op_credit ?? 0,
                  rep1_rate: item.rep1_rate ?? 1, rep1_is_reverse: item.rep1_is_reverse ?? false, rep1_debit: item.rep1_debit ?? 0, rep1_credit: item.rep1_credit ?? 0,
                  rep2_rate: item.rep2_rate ?? 1, rep2_is_reverse: item.rep2_is_reverse ?? false, rep2_debit: item.rep2_debit ?? 0, rep2_credit: item.rep2_credit ?? 0,
              };
          });
          
          setVoucherItems(mappedItems);
          setView('form');
          setIsHeaderOpen(true);
          setFocusedRowId(null);
      } catch (err) {
          console.error('Error copying voucher:', err);
      } finally {
          setLoading(false);
      }
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

  const getRowSignature = (item) => {
     return JSON.stringify({
         acc: item.account_id,
         deb: parseNum(item.debit),
         cred: parseNum(item.credit),
         cur: item.currency_code,
         desc: item.description,
         det: item.details_dict,
         tn: item.tracking_number,
         td: item.tracking_date,
         qty: parseNum(item.quantity),
         op_r: parseNum(item.op_rate),
         rep1_r: parseNum(item.rep1_rate),
         rep2_r: parseNum(item.rep2_rate)
     });
  };

  const handleSaveVoucher = async (status) => {
    if (!supabase || !currentVoucher?.id) return;
    
    if (!currentVoucher.branch_id) {
       alert(t.branchReqError);
       return;
    }

    const periodCheck = await validateFiscalPeriod(currentVoucher.voucher_date, currentVoucher.fiscal_period_id);
    if (!periodCheck.valid) {
        alert(periodCheck.msg);
        return;
    }

    if (currentVoucher.subsidiary_number && currentVoucher.subsidiary_number.trim() !== '') {
        const { data: subData } = await supabase.schema('gl').from('vouchers')
            .select('id')
            .eq('fiscal_period_id', currentVoucher.fiscal_period_id)
            .eq('subsidiary_number', currentVoucher.subsidiary_number.trim())
            .neq('id', currentVoucher.id);
        if (subData && subData.length > 0) {
            alert(t.subDupError);
            return;
        }
    }

    const rowSignatures = new Set();

    for (let i = 0; i < voucherItems.length; i++) {
        const item = voucherItems[i];
        
        if (!item.description || !item.account_id) {
           alert(t.reqFields);
           return;
        }

        const sig = getRowSignature(item);
        if (rowSignatures.has(sig)) {
             alert(t.duplicateRowError.replace('{row}', i + 1));
             return;
        }
        rowSignatures.add(sig);

        const account = accounts.find(a => String(a.id) === String(item.account_id));
        if (account && account.metadata) {
            const meta = typeof account.metadata === 'string' ? JSON.parse(account.metadata) : account.metadata;
            
            if (meta.trackFeature && meta.trackMandatory && (!item.tracking_number || !item.tracking_date)) {
                alert(t.trackingReqError + ' ' + (i + 1) + ' (' + account.title + ')');
                return;
            }
            if (meta.qtyFeature && meta.qtyMandatory && (!item.quantity || parseNum(item.quantity) <= 0)) {
                alert(t.qtyReqError + ' ' + (i + 1) + ' (' + account.title + ')');
                return;
            }
            if (meta.currencyFeature && meta.currencyMandatory && (!item.op_rate || !item.rep1_rate || !item.rep2_rate || parseNum(item.op_rate) <= 0)) {
                alert(t.currencyMandatoryError.replace('{row}', i + 1));
                return;
            }
        }

        const allowedDetailTypes = getValidDetailTypes(item.account_id);
        if (allowedDetailTypes.length > 0) {
           const dict = item.details_dict || {};
           for (const type of allowedDetailTypes) {
               if (!dict[type.code]) {
                   alert(t.detailRequiredError.replace('{type}', type.title).replace('{row}', i + 1));
                   return;
               }
           }
        }
    }

    let totalDebit = 0, totalCredit = 0;
    voucherItems.forEach(item => {
        totalDebit += parseNum(item.debit);
        totalCredit += parseNum(item.credit);
    });
    
    if (totalDebit === 0 && totalCredit === 0) {
      alert(t.zeroAmountError);
      return;
    }

    if (totalDebit !== totalCredit) {
      alert(t.unbalancedError);
      return;
    }

    setLoading(true);
    try {
      const cleanData = (val) => (val === '' ? null : val);
      const { data: authData } = await supabase.auth.getUser();
      const currentUserId = authData?.user?.id || null;

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
        updated_at: new Date().toISOString()
      };

      if (status === 'reviewed') {
          voucherData.reviewed_by = currentUserId;
      } else {
          voucherData.reviewed_by = null;
      }

      const { error } = await supabase.schema('gl').from('vouchers').update(voucherData).eq('id', voucherData.id);
      if (error) throw error;
      await supabase.schema('gl').from('voucher_items').delete().eq('voucher_id', voucherData.id);

      const itemsToSave = voucherItems.map((item, index) => ({
        voucher_id: voucherData.id,
        row_number: item.row_number,
        account_id: cleanData(item.account_id),
        debit: parseNum(item.debit),
        credit: parseNum(item.credit),
        description: item.description,
        tracking_number: cleanData(item.tracking_number),
        tracking_date: cleanData(item.tracking_date),
        quantity: parseNum(item.quantity) === 0 ? null : parseNum(item.quantity),
        details: { currency_code: item.currency_code, selected_details: item.details_dict || {} },
        op_rate: parseNum(item.op_rate),
        op_is_reverse: item.op_is_reverse,
        op_debit: parseNum(item.op_debit),
        op_credit: parseNum(item.op_credit),
        rep1_rate: parseNum(item.rep1_rate),
        rep1_is_reverse: item.rep1_is_reverse,
        rep1_debit: parseNum(item.rep1_debit),
        rep1_credit: parseNum(item.rep1_credit),
        rep2_rate: parseNum(item.rep2_rate),
        rep2_is_reverse: item.rep2_is_reverse,
        rep2_debit: parseNum(item.rep2_debit),
        rep2_credit: parseNum(item.rep2_credit)
      }));

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

  const handleBulkStatus = async (newStatus) => {
    if (selectedIds.length === 0) return;
    setLoading(true);
    try {
        const { data: authData } = await supabase.auth.getUser();
        const currentUserId = authData?.user?.id || null;
        let updatePayload = { status: newStatus };
        if (newStatus === 'reviewed') {
            updatePayload.reviewed_by = currentUserId;
        } else {
            updatePayload.reviewed_by = null;
        }
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

  const handlePrint = (voucher) => {
     setVoucherToPrint(voucher);
  };

  const handleItemFocus = (id) => {
      setFocusedRowId(id);
      setIsHeaderOpen(false);
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
    
    if (field === 'currency_code' && currencyGlobals) {
       if (value === currencyGlobals.op_currency) { newItems[index].op_rate = 1; newItems[index].op_is_reverse = false; }
       if (value === currencyGlobals.rep1_currency) { newItems[index].rep1_rate = 1; newItems[index].rep1_is_reverse = false; }
       if (value === currencyGlobals.rep2_currency) { newItems[index].rep2_rate = 1; newItems[index].rep2_is_reverse = false; }
    }
    
    if (['debit', 'credit', 'currency_code', 'op_rate', 'op_is_reverse', 'rep1_rate', 'rep1_is_reverse', 'rep2_rate', 'rep2_is_reverse'].includes(field)) {
        const baseDebit = parseNum(newItems[index].debit);
        const baseCredit = parseNum(newItems[index].credit);
        
        newItems[index].op_debit = calcConv(baseDebit, newItems[index].op_rate, newItems[index].op_is_reverse);
        newItems[index].op_credit = calcConv(baseCredit, newItems[index].op_rate, newItems[index].op_is_reverse);

        newItems[index].rep1_debit = calcConv(baseDebit, newItems[index].rep1_rate, newItems[index].rep1_is_reverse);
        newItems[index].rep1_credit = calcConv(baseCredit, newItems[index].rep1_rate, newItems[index].rep1_is_reverse);

        newItems[index].rep2_debit = calcConv(baseDebit, newItems[index].rep2_rate, newItems[index].rep2_is_reverse);
        newItems[index].rep2_credit = calcConv(baseCredit, newItems[index].rep2_rate, newItems[index].rep2_is_reverse);
    }

    if (field === 'account_id') {
      const selectedAcc = accounts.find(a => String(a.id) === String(value));
      const currentLedger = ledgers.find(l => String(l.id) === String(currentVoucher.ledger_id));
      let newCurrency = currentLedger?.currency || '';

      if (selectedAcc && selectedAcc.metadata) {
        const meta = typeof selectedAcc.metadata === 'string' ? JSON.parse(selectedAcc.metadata) : selectedAcc.metadata;
        if (meta.currencyFeature && meta.currency_code) {
             newCurrency = meta.currency_code;
        }
      }
      
      newItems[index]['currency_code'] = newCurrency;
      if (currencyGlobals) {
           if (newCurrency === currencyGlobals.op_currency) { newItems[index].op_rate = 1; newItems[index].op_is_reverse = false; }
           if (newCurrency === currencyGlobals.rep1_currency) { newItems[index].rep1_rate = 1; newItems[index].rep1_is_reverse = false; }
           if (newCurrency === currencyGlobals.rep2_currency) { newItems[index].rep2_rate = 1; newItems[index].rep2_is_reverse = false; }
      }
      
      const baseDebit = parseNum(newItems[index].debit);
      const baseCredit = parseNum(newItems[index].credit);
      newItems[index].op_debit = calcConv(baseDebit, newItems[index].op_rate, newItems[index].op_is_reverse);
      newItems[index].op_credit = calcConv(baseCredit, newItems[index].op_rate, newItems[index].op_is_reverse);
      newItems[index].rep1_debit = calcConv(baseDebit, newItems[index].rep1_rate, newItems[index].rep1_is_reverse);
      newItems[index].rep1_credit = calcConv(baseCredit, newItems[index].rep1_rate, newItems[index].rep1_is_reverse);
      newItems[index].rep2_debit = calcConv(baseDebit, newItems[index].rep2_rate, newItems[index].rep2_is_reverse);
      newItems[index].rep2_credit = calcConv(baseCredit, newItems[index].rep2_rate, newItems[index].rep2_is_reverse);

      newItems[index]['details_dict'] = {}; 
    }

    setVoucherItems(newItems);
  };

  const handleRowReorder = (id, newRowStr) => {
      const newIndex = parseInt(newRowStr, 10) - 1;
      if (isNaN(newIndex) || newIndex < 0 || newIndex >= voucherItems.length) return;
      
      const currentIdx = voucherItems.findIndex(i => i.id === id);
      if (currentIdx === -1 || currentIdx === newIndex) return;
      
      let itemsCpy = [...voucherItems];
      const [movedItem] = itemsCpy.splice(currentIdx, 1);
      itemsCpy.splice(newIndex, 0, movedItem);
      itemsCpy = itemsCpy.map((it, idx) => ({...it, row_number: idx + 1}));
      
      setVoucherItems(itemsCpy);
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
      quantity: '',
      op_rate: 1, op_is_reverse: false, op_debit: 0, op_credit: 0,
      rep1_rate: 1, rep1_is_reverse: false, rep1_debit: 0, rep1_credit: 0,
      rep2_rate: 1, rep2_is_reverse: false, rep2_debit: 0, rep2_credit: 0
    }]);
    setFocusedRowId(newId);
    setIsHeaderOpen(false);
  };

  const duplicateRow = (index) => {
      const itemToCopy = voucherItems[index];
      const newId = 'temp_' + Date.now();
      const newItem = { ...itemToCopy, id: newId };
      
      const itemsCpy = [...voucherItems];
      itemsCpy.splice(index + 1, 0, newItem);
      const renumbered = itemsCpy.map((it, idx) => ({...it, row_number: idx + 1}));
      
      setVoucherItems(renumbered);
      setFocusedRowId(newId);
      setIsHeaderOpen(false);
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
           newItems[emptyRowIndex].op_debit = calcConv(Math.abs(diff), newItems[emptyRowIndex].op_rate, newItems[emptyRowIndex].op_is_reverse);
           newItems[emptyRowIndex].op_credit = 0;
           newItems[emptyRowIndex].rep1_debit = calcConv(Math.abs(diff), newItems[emptyRowIndex].rep1_rate, newItems[emptyRowIndex].rep1_is_reverse);
           newItems[emptyRowIndex].rep1_credit = 0;
           newItems[emptyRowIndex].rep2_debit = calcConv(Math.abs(diff), newItems[emptyRowIndex].rep2_rate, newItems[emptyRowIndex].rep2_is_reverse);
           newItems[emptyRowIndex].rep2_credit = 0;
       } else {
           newItems[emptyRowIndex].credit = diff;
           newItems[emptyRowIndex].debit = 0;
           newItems[emptyRowIndex].op_credit = calcConv(diff, newItems[emptyRowIndex].op_rate, newItems[emptyRowIndex].op_is_reverse);
           newItems[emptyRowIndex].op_debit = 0;
           newItems[emptyRowIndex].rep1_credit = calcConv(diff, newItems[emptyRowIndex].rep1_rate, newItems[emptyRowIndex].rep1_is_reverse);
           newItems[emptyRowIndex].rep1_debit = 0;
           newItems[emptyRowIndex].rep2_credit = calcConv(diff, newItems[emptyRowIndex].rep2_rate, newItems[emptyRowIndex].rep2_is_reverse);
           newItems[emptyRowIndex].rep2_debit = 0;
       }
       setVoucherItems(newItems);
       setFocusedRowId(newItems[emptyRowIndex].id);
       setIsHeaderOpen(false);
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
         quantity: '',
         op_rate: 1, op_is_reverse: false, op_debit: diff < 0 ? Math.abs(diff) : 0, op_credit: diff > 0 ? diff : 0,
         rep1_rate: 1, rep1_is_reverse: false, rep1_debit: diff < 0 ? Math.abs(diff) : 0, rep1_credit: diff > 0 ? diff : 0,
         rep2_rate: 1, rep2_is_reverse: false, rep2_debit: diff < 0 ? Math.abs(diff) : 0, rep2_credit: diff > 0 ? diff : 0
       }]);
       setFocusedRowId(newId);
       setIsHeaderOpen(false);
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
      const itemsCpy = voucherItems.filter((_, i) => i !== index);
      const renumbered = itemsCpy.map((it, idx) => ({...it, row_number: idx + 1}));
      setVoucherItems(renumbered);
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
    if (voucher.status === 'reviewed') return;
    setVoucherToDelete(voucher);
    setShowDeleteModal(true);
  };

  const openBulkSort = () => {
      setSortTab('bulk');
      setSortParams({ ...sortParams, fromDate: '', toDate: '' });
      setShowSortModal(true);
  };

  const openSingleSort = (voucher) => {
      setSortTab('single');
      setSortParams({ 
          ...sortParams, 
          singleVoucherId: voucher.id, 
          singleVoucherDate: voucher.voucher_date,
          singleVoucherNo: voucher.voucher_number || voucher.id.slice(0,8),
          targetDailyNumber: voucher.daily_number 
      });
      setShowSortModal(true);
  };

  const handleBulkSort = async () => {
      if (!sortParams.fromDate || !sortParams.toDate) return alert(t.reqFields);
      setLoading(true);
      try {
          const { data, error } = await supabase.schema('gl').from('vouchers')
              .select('id, voucher_date, daily_number, created_at')
              .eq('ledger_id', contextVals.ledger_id)
              .eq('fiscal_period_id', contextVals.fiscal_year_id)
              .gte('voucher_date', sortParams.fromDate)
              .lte('voucher_date', sortParams.toDate)
              .order('voucher_date', { ascending: true })
              .order('daily_number', { ascending: true })
              .order('created_at', { ascending: true });

          if (error) throw error;

          const byDate = {};
          data.forEach(v => {
              if (!byDate[v.voucher_date]) byDate[v.voucher_date] = [];
              byDate[v.voucher_date].push(v);
          });

          const updates = [];
          for (const date in byDate) {
              byDate[date].forEach((v, idx) => {
                  const newDaily = idx + 1;
                  if (v.daily_number !== newDaily) {
                      updates.push({ id: v.id, daily_number: newDaily });
                  }
              });
          }

          const batchSize = 50;
          for (let i = 0; i < updates.length; i += batchSize) {
              const batch = updates.slice(i, i + batchSize);
              await Promise.all(batch.map(u => 
                  supabase.schema('gl').from('vouchers').update({ daily_number: u.daily_number }).eq('id', u.id)
              ));
          }

          alert(t.sortSuccess);
          setShowSortModal(false);
          fetchVouchers();
      } catch (err) {
          console.error(err);
          alert(t.sortError);
      } finally {
          setLoading(false);
      }
  };

  const handleSingleSort = async () => {
      if (!sortParams.singleVoucherId || !sortParams.targetDailyNumber) return alert(t.reqFields);
      
      setLoading(true);
      try {
          const { data, error } = await supabase.schema('gl').from('vouchers')
              .select('id, voucher_date, daily_number, created_at')
              .eq('ledger_id', contextVals.ledger_id)
              .eq('fiscal_period_id', contextVals.fiscal_year_id)
              .eq('voucher_date', sortParams.singleVoucherDate)
              .order('daily_number', { ascending: true })
              .order('created_at', { ascending: true });
          
          if (error) throw error;

          let arr = data.filter(v => v.id !== sortParams.singleVoucherId);
          const insertIndex = Math.max(0, parseInt(sortParams.targetDailyNumber, 10) - 1);
          
          arr.splice(insertIndex, 0, { 
              id: sortParams.singleVoucherId, 
              daily_number: parseInt(sortParams.targetDailyNumber, 10), 
              voucher_date: sortParams.singleVoucherDate 
          });

          const updates = [];
          arr.forEach((v, idx) => {
              const newDaily = idx + 1;
              if (v.daily_number !== newDaily) {
                  updates.push({ id: v.id, daily_number: newDaily });
              }
          });

          const batchSize = 50;
          for (let i = 0; i < updates.length; i += batchSize) {
              const batch = updates.slice(i, i + batchSize);
              await Promise.all(batch.map(u => 
                  supabase.schema('gl').from('vouchers').update({ daily_number: u.daily_number }).eq('id', u.id)
              ));
          }

          alert(t.sortSuccess);
          setShowSortModal(false);
          fetchVouchers();
      } catch (err) {
          console.error(err);
          alert(t.sortError);
      } finally {
          setLoading(false);
      }
  };

  const getStatusBadge = (status) => {
    const config = {
        'temporary': { label: t.statusTemporary, bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
        'reviewed': { label: t.statusReviewed, bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' }
    };
    const c = config[status] || { label: status, bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };
    return <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${c.bg} ${c.text} ${c.border}`}>{c.label}</span>;
  };

  const columns = [
    { field: 'voucher_number', header: t.voucherNumber, width: 'w-24', sortable: true },
    { field: 'voucher_date', header: t.date, width: 'w-24', sortable: true },
    { field: 'status', header: t.status, width: 'w-32', render: (row) => getStatusBadge(row.status) },
    { field: 'voucher_type', header: t.type, width: 'w-32', render: (row) => docTypes.find(d => d.code === row.voucher_type)?.title || row.voucher_type },
    { field: 'branch_id', header: t.branch, width: 'w-32', render: (row) => branches.find(b => b.id === row.branch_id)?.title || '-' },
    { field: 'description', header: t.description, width: 'w-64' },
    { field: 'total_debit', header: t.amount, width: 'w-32', render: (row) => formatNum(row.total_debit) },
    { field: 'currency', header: t.currency, width: 'w-24', render: (row) => {
        const ledger = ledgers.find(l => String(l.id) === String(row.ledger_id));
        const currCode = ledger?.currency;
        return currencies.find(c => c.code === currCode)?.title || currCode || '-';
    }},
    { field: 'daily_number', header: t.dailyNumber, width: 'w-24' },
    { field: 'cross_reference', header: t.crossReference, width: 'w-24' }
  ];

  const currentLedgerMeta = useMemo(() => {
     const ledger = ledgers.find(l => String(l.id) === String(contextVals.ledger_id));
     return (typeof ledger?.metadata === 'string' ? JSON.parse(ledger.metadata) : ledger?.metadata) || {};
  }, [ledgers, contextVals.ledger_id]);

  const ledgerStructureCode = useMemo(() => {
     const ledger = ledgers.find(l => String(l.id) === String(contextVals.ledger_id));
     return String(ledger?.structure || '').trim();
  }, [ledgers, contextVals.ledger_id]);

  const validAccountsForLedger = useMemo(() => {
     const targetStructure = accountStructures.find(s => String(s.code).trim() === ledgerStructureCode);
     const structureId = targetStructure ? String(targetStructure.id) : null;
     return accounts.filter(a => {
        const isSubsidiary = a.level === 'subsidiary' || a.level === 'معین' || a.level === '4';
        return String(a.structure_id) === structureId && isSubsidiary;
     });
  }, [accounts, accountStructures, ledgerStructureCode]);

  const selectedVouchers = vouchers.filter(v => selectedIds.includes(v.id));
  const allTemp = selectedVouchers.length > 0 && selectedVouchers.every(v => v.status === 'temporary');
  const allReviewed = selectedVouchers.length > 0 && selectedVouchers.every(v => v.status === 'reviewed');

  const getCurrencyTitle = (code) => {
      if(!code) return '-';
      return currencies.find(c => c.code === code)?.title || code;
  }

  if (view === 'form' && currentVoucher) {
    let totalDebit = 0, totalCredit = 0, opTotalDebit = 0, opTotalCredit = 0, rep1TotalDebit = 0, rep1TotalCredit = 0, rep2TotalDebit = 0, rep2TotalCredit = 0;
    
    voucherItems.forEach(item => {
        totalDebit += parseNum(item.debit);
        totalCredit += parseNum(item.credit);
        opTotalDebit += parseNum(item.op_debit);
        opTotalCredit += parseNum(item.op_credit);
        rep1TotalDebit += parseNum(item.rep1_debit);
        rep1TotalCredit += parseNum(item.rep1_credit);
        rep2TotalDebit += parseNum(item.rep2_debit);
        rep2TotalCredit += parseNum(item.rep2_credit);
    });

    const isBalanced = totalDebit === totalCredit;
    const isReadonly = currentVoucher.status === 'reviewed';
    const isVoucherNoManual = currentLedgerMeta.uniquenessScope === 'none';
    const currentFiscalYearTitle = fiscalYears.find(f => String(f.id) === String(currentVoucher.fiscal_period_id))?.title || '';
    const currentLedger = ledgers.find(l => String(l.id) === String(currentVoucher.ledger_id));
    const currentLedgerTitle = currentLedger?.title || '';

    return (
      <div className={`h-full flex flex-col p-4 md:p-6 bg-slate-50/50`} onClick={() => setFocusedRowId(null)}>
        <div className="mb-4 flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm shrink-0" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => { setView('list'); setCurrentVoucher(null); setVoucherItems([]); }} icon={isRtl ? ArrowRight : ArrowLeft}>{t.backToList}</Button>
            <div className="h-6 w-px bg-slate-200 mx-1"></div>
            <h2 className="text-lg font-bold text-slate-800">{isReadonly ? t.view : t.edit}</h2>
            {getStatusBadge(currentVoucher.status)}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => handlePrint(currentVoucher)} icon={Printer}>{t.print}</Button>
            {isReadonly ? (
              <Button variant="outline" onClick={() => handleSaveVoucher('temporary')} icon={RotateCcw}>{t.revertToTemp}</Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => handleSaveVoucher('temporary')} icon={Save}>{t.saveTemp}</Button>
                <Button variant="primary" onClick={() => handleSaveVoucher('reviewed')} icon={CheckCircle}>{t.saveReviewed}</Button>
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
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4" onClick={(e) => e.stopPropagation()}>
              <InputField label={t.fiscalYear} value={currentFiscalYearTitle} disabled isRtl={isRtl} />
              <InputField label={t.ledger} value={currentLedgerTitle} disabled isRtl={isRtl} />
              <SelectField label={t.branch} value={currentVoucher.branch_id || ''} onChange={(e) => setCurrentVoucher({...currentVoucher, branch_id: e.target.value})} disabled={isReadonly} isRtl={isRtl}>
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
                 className={`text-center ${(!isVoucherNoManual || isReadonly) ? 'bg-slate-50' : 'bg-white'}`} 
              />
              <InputField label={t.dailyNumber} value={currentVoucher.daily_number || '-'} disabled isRtl={isRtl} dir="ltr" className="text-center bg-slate-50" />
              <InputField label={t.crossReference} value={currentVoucher.cross_reference || '-'} disabled isRtl={isRtl} dir="ltr" className="text-center bg-slate-50" />
              
              <InputField label={t.referenceNumber} value={currentVoucher.reference_number || '-'} disabled={true} isRtl={isRtl} dir="ltr" className="text-center bg-slate-50" />
              <InputField label={t.subsidiaryNumber} value={currentVoucher.subsidiary_number || ''} onChange={(e) => setCurrentVoucher({...currentVoucher, subsidiary_number: e.target.value})} disabled={isReadonly} isRtl={isRtl} dir="ltr" className="text-center" />
              <InputField type="date" label={t.date} value={currentVoucher.voucher_date || ''} onChange={(e) => setCurrentVoucher({...currentVoucher, voucher_date: e.target.value})} disabled={isReadonly} isRtl={isRtl} />
              
              <SelectField label={t.type} value={currentVoucher.voucher_type || ''} onChange={(e) => setCurrentVoucher({...currentVoucher, voucher_type: e.target.value})} disabled={isReadonly} isRtl={isRtl} >
                {docTypes.map(d => <option key={d.id} value={d.code}>{d.title}</option>)}
              </SelectField>

              <div className="md:col-span-2 lg:col-span-2">
                  <InputField label={t.description} value={currentVoucher.description || ''} onChange={(e) => setCurrentVoucher({...currentVoucher, description: e.target.value})} disabled={isReadonly} isRtl={isRtl} />
              </div>
            </div>
          </Accordion>

          <div className="flex-1 overflow-hidden flex flex-col lg:flex-row gap-4">
            
            {/* --- Main Items List (Left/Main) --- */}
            <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col min-w-0" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-3 bg-slate-50 border-b border-slate-200 shrink-0">
                  <h3 className="text-sm font-bold text-slate-800">{t.items}</h3>
                  <div className="flex gap-2">
                    {!isReadonly && (
                        <>
                           <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); globalBalance(); }} icon={Scale}>{t.balance}</Button>
                           <Button variant="primary" size="sm" onClick={(e) => { e.stopPropagation(); addItemRow(); }} icon={Plus}>{t.addRow}</Button>
                        </>
                    )}
                    <div className="w-px bg-slate-300 mx-1 h-8"></div>
                    <button 
                        onClick={(e) => { e.stopPropagation(); setIsSummaryOpen(!isSummaryOpen); }} 
                        className={`w-8 h-8 flex items-center justify-center rounded border transition-colors ${isSummaryOpen ? 'bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                        title={t.summary}
                    >
                        {isSummaryOpen ? (isRtl ? <PanelRightClose size={16}/> : <PanelRightClose size={16}/>) : (isRtl ? <PanelRightOpen size={16}/> : <PanelRightOpen size={16}/>)}
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar bg-slate-50" onClick={() => setFocusedRowId(null)}>
                   <div className="flex flex-col pb-6 w-full min-w-min">
                       {voucherItems.map((item, index) => {
                          const isFocused = focusedRowId === item.id;
                          const isEditing = isFocused && !isReadonly;
                          
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

                          // Compact View Mode
                          if (!isEditing) {
                              const hasForeignCurrency = item.currency_code !== currentLedger?.currency || parseNum(item.op_rate) !== 1 || parseNum(item.rep1_rate) !== 1 || parseNum(item.rep2_rate) !== 1;
                              const hasTrackingData = item.tracking_number || item.tracking_date;
                              const hasQuantityData = item.quantity && parseNum(item.quantity) > 0;
                              const accountDisplay = accountObj ? `${accountObj.full_code} - ${accountObj.title}` : '-';
                              const detailsArray = Object.values(item.details_dict || {}).map(id => allDetailInstances.find(d => String(d.id) === String(id))?.title).filter(Boolean);

                              return (
                                  <div
                                      key={item.id}
                                      className={`flex items-center gap-2 p-3 bg-white border-b border-slate-100 cursor-pointer transition-colors text-[11px] hover:bg-indigo-50/40 w-full shrink-0 ${isFocused ? 'ring-1 ring-indigo-200 shadow-sm z-10 relative bg-indigo-50/20' : ''}`}
                                      onClick={(e) => { e.stopPropagation(); handleItemFocus(item.id); }}
                                  >
                                      {/* 1. Row */}
                                      <div className="w-8 text-center font-bold text-slate-400 shrink-0">{item.row_number}</div>
                                      
                                      {/* 2. Account */}
                                      <div className="w-[260px] shrink-0 font-bold text-slate-700 truncate" title={accountDisplay}>
                                          {accountDisplay}
                                      </div>

                                      {/* 3. Debit */}
                                      <div className="w-[90px] shrink-0 flex flex-col text-left dir-ltr">
                                          <span className="text-[9px] text-slate-400 mb-0.5 uppercase tracking-wide">{t.debit}</span>
                                          <span className={`font-bold ${parseNum(item.debit) > 0 ? 'text-indigo-700' : 'text-slate-300'}`}>
                                              {formatNum(item.debit) || '-'}
                                          </span>
                                      </div>

                                      {/* 4. Credit */}
                                      <div className="w-[90px] shrink-0 flex flex-col text-left dir-ltr">
                                          <span className="text-[9px] text-slate-400 mb-0.5 uppercase tracking-wide">{t.credit}</span>
                                          <span className={`font-bold ${parseNum(item.credit) > 0 ? 'text-indigo-700' : 'text-slate-300'}`}>
                                              {formatNum(item.credit) || '-'}
                                          </span>
                                      </div>

                                      {/* 5. Currency */}
                                      <div className="w-[70px] shrink-0 flex items-center justify-center gap-1.5 bg-slate-50 border border-slate-100 rounded px-1.5 py-1 text-slate-500 font-bold whitespace-nowrap">
                                          <span>{getCurrencyTitle(item.currency_code)}</span>
                                          {hasForeignCurrency && <Coins size={14} className="text-purple-500 shrink-0" title={t.currencyConversions} />}
                                      </div>

                                      {/* 6. Description */}
                                      <div className="w-[280px] shrink-0 text-slate-600 truncate" title={item.description || '-'}>
                                          {item.description || '-'}
                                      </div>

                                      {/* 7. Extra Meta */}
                                      <div className="flex-1 flex flex-wrap items-center gap-2 min-w-[200px]">
                                          {detailsArray.length > 0 && (
                                              <div className="flex items-center gap-1">
                                                  {detailsArray.map((d, i) => (
                                                      <span key={i} className="text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 text-[10px] truncate max-w-[150px]">{d}</span>
                                                  ))}
                                              </div>
                                          )}
                                          {hasTrackingData && (
                                              <div className="flex items-center gap-1 text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 text-[10px]" title={`${t.trackingNumber} / ${t.trackingDate}`}>
                                                  <FileText size={10}/> {item.tracking_number || '-'} {item.tracking_date ? `(${item.tracking_date})` : ''}
                                              </div>
                                          )}
                                          {hasQuantityData && (
                                              <div className="flex items-center gap-1 text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 text-[10px]" title={t.quantity}>
                                                  <Layers size={10}/> <span className="dir-ltr font-bold text-slate-600">{formatNum(item.quantity)}</span>
                                              </div>
                                          )}
                                      </div>
                                  </div>
                              );
                          }

                          // Full Edit View Mode
                          return (
                             <div 
                                key={item.id} 
                                className={`my-2 mx-1 bg-white rounded-lg border transition-all duration-200 border-indigo-400 shadow-md ring-1 ring-indigo-100 w-full lg:w-[calc(100%-8px)] shrink-0 min-w-[800px]`}
                                onClick={(e) => e.stopPropagation()}
                             >
                                <div className="flex flex-col md:flex-row gap-0">
                                   <div className="w-12 bg-slate-50 flex flex-col items-center justify-center border-r border-slate-100 py-2 rounded-r-lg shrink-0">
                                      <RowNumberInput value={item.row_number} onChangeRow={(newNum) => handleRowReorder(item.id, newNum)} max={voucherItems.length} />
                                      <div className="mt-2 flex flex-col gap-1.5 items-center">
                                          {!isReadonly && (
                                            <>
                                              <button className="text-slate-400 hover:text-indigo-600 p-1 rounded transition-all" title={t.copyRow} onClick={(e) => { e.stopPropagation(); duplicateRow(index); }}><CopyPlus size={14} /></button>
                                              <button className="text-red-400 hover:text-red-600 p-1 rounded transition-all" onClick={(e) => { e.stopPropagation(); removeRow(index); }}><Trash2 size={14} /></button>
                                            </>
                                          )}
                                      </div>
                                   </div>
                                   
                                   <div className="flex-1 p-2 flex flex-col gap-1.5">
                                      {/* --- ROW 1 --- */}
                                      <div className="grid grid-cols-12 gap-x-3 gap-y-2 items-end">
                                         <div className="col-span-12 lg:col-span-3 flex flex-col gap-1">
                                            <div className="text-[10px] font-bold text-slate-500">{t.account}</div>
                                            <div className={`border rounded h-8 flex items-center border-indigo-300 bg-indigo-50/20`}>
                                               <SearchableAccountSelect 
                                                  accounts={validAccountsForLedger} 
                                                  value={item.account_id} 
                                                  onChange={(v) => handleItemChange(index, 'account_id', v)} 
                                                  disabled={isReadonly} 
                                                  placeholder={t.searchAccount} 
                                                  className={`w-full bg-transparent border-0 border-b border-transparent hover:border-slate-300 focus:border-indigo-500 rounded-none h-8 px-2 outline-none text-[12px] text-slate-800 transition-colors ${isReadonly ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                                                  onFocus={() => handleItemFocus(item.id)}
                                               />
                                            </div>
                                         </div>
                                         <div className="col-span-6 lg:col-span-2 flex flex-col gap-1">
                                            <div className="text-[10px] font-bold text-slate-500">{t.debit}</div>
                                            <input type="text" className={`w-full border rounded h-8 px-2 text-[12px] dir-ltr text-right outline-none border-indigo-300 bg-white ${item.debit > 0 ? 'text-indigo-700 font-bold bg-indigo-50/30' : ''}`} value={formatNum(item.debit)} onChange={(e) => {
                                                const raw = e.target.value.replace(/,/g, '');
                                                if (!isNaN(raw)) handleItemChange(index, 'debit', raw === '' ? 0 : raw);
                                            }} disabled={isReadonly} onFocus={() => handleItemFocus(item.id)} />
                                         </div>
                                         <div className="col-span-6 lg:col-span-2 flex flex-col gap-1">
                                            <div className="text-[10px] font-bold text-slate-500">{t.credit}</div>
                                            <input type="text" className={`w-full border rounded h-8 px-2 text-[12px] dir-ltr text-right outline-none border-indigo-300 bg-white ${item.credit > 0 ? 'text-indigo-700 font-bold bg-indigo-50/30' : ''}`} value={formatNum(item.credit)} onChange={(e) => {
                                                const raw = e.target.value.replace(/,/g, '');
                                                if (!isNaN(raw)) handleItemChange(index, 'credit', raw === '' ? 0 : raw);
                                            }} disabled={isReadonly} onFocus={() => handleItemFocus(item.id)} />
                                         </div>
                                         <div className="col-span-6 lg:col-span-2 flex flex-col gap-1">
                                            <div className="text-[10px] font-bold text-slate-500">{t.currency}</div>
                                            <div className="flex items-center gap-1 h-8">
                                              <select 
                                                 className={`flex-1 w-full border rounded h-full px-1 text-[12px] outline-none border-indigo-300 bg-white`}
                                                 value={item.currency_code || ''}
                                                 onChange={(e) => handleItemChange(index, 'currency_code', e.target.value)}
                                                 disabled={isReadonly}
                                                 onFocus={() => handleItemFocus(item.id)}
                                              >
                                                 <option value="">-</option>
                                                 {currencies.map(c => <option key={c.id} value={c.code}>{c.title}</option>)}
                                              </select>
                                              <button 
                                                className={`w-8 h-full shrink-0 flex items-center justify-center rounded border transition-colors bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100`}
                                                onClick={(e) => { e.stopPropagation(); setCurrencyModalIndex(index); }}
                                                title={t.currencyConversions}
                                              >
                                                <Coins size={14}/>
                                              </button>
                                            </div>
                                         </div>
                                         <div className="col-span-12 lg:col-span-3 flex flex-col gap-1">
                                            <div className="flex justify-between items-center">
                                                <div className="text-[10px] font-bold text-slate-500">{t.description}</div>
                                                {!isReadonly && index > 0 && (
                                                    <button onClick={() => copyDescription(index)} className="text-[10px] text-indigo-500 flex items-center gap-1 hover:text-indigo-700"><Copy size={10}/> {t.copyFromAbove}</button>
                                                )}
                                            </div>
                                            <input type="text" className={`w-full border rounded h-8 px-2 text-[12px] outline-none border-indigo-300 bg-white`} value={item.description || ''} onChange={(e) => handleItemChange(index, 'description', e.target.value)} disabled={isReadonly} onFocus={() => handleItemFocus(item.id)} />
                                         </div>
                                      </div>

                                      {/* --- ROW 2 (Conditional) --- */}
                                      {showRow2 && (
                                         <div className="grid grid-cols-12 gap-x-3 gap-y-2 p-2 bg-slate-50/80 rounded border border-slate-100 mt-0.5">
                                            <div className="col-span-12 lg:col-span-5 flex flex-col gap-1">
                                               <div className="text-[10px] font-bold text-slate-500">{t.detail}</div>
                                               <div className={`border rounded min-h-8 flex items-center border-indigo-300 bg-indigo-50/20 ${allowedDetailTypes.length === 0 ? 'opacity-60 bg-slate-100' : ''}`}>
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
                                               <input type="text" className={`w-full border rounded h-8 px-2 text-[12px] outline-none border-indigo-300 bg-white`} value={item.tracking_number || ''} onChange={(e) => handleItemChange(index, 'tracking_number', e.target.value)} disabled={isReadonly || (!hasTracking && !item.tracking_number)} onFocus={() => handleItemFocus(item.id)} />
                                            </div>
                                            <div className={`col-span-4 lg:col-span-2 flex flex-col gap-1 ${hasTracking ? '' : 'opacity-40 grayscale'}`}>
                                               <div className="text-[10px] font-bold text-slate-500">{t.trackingDate}</div>
                                               <input type="date" className={`w-full border rounded h-8 px-2 text-[12px] outline-none border-indigo-300 bg-white uppercase`} value={item.tracking_date || ''} onChange={(e) => handleItemChange(index, 'tracking_date', e.target.value)} disabled={isReadonly || (!hasTracking && !item.tracking_date)} onFocus={() => handleItemFocus(item.id)} />
                                            </div>
                                            <div className={`col-span-4 lg:col-span-3 flex flex-col gap-1 ${hasQuantity ? '' : 'opacity-40 grayscale'}`}>
                                               <div className="text-[10px] font-bold text-slate-500">{t.quantity}</div>
                                               <input type="text" className={`w-full border rounded h-8 px-2 text-[12px] dir-ltr text-right outline-none border-indigo-300 bg-white`} value={formatNum(item.quantity)} onChange={(e) => {
                                                   const raw = e.target.value.replace(/,/g, '');
                                                   if (!isNaN(raw)) handleItemChange(index, 'quantity', raw === '' ? '' : raw);
                                               }} disabled={isReadonly || (!hasQuantity && !item.quantity)} onFocus={() => handleItemFocus(item.id)} />
                                            </div>
                                         </div>
                                      )}
                                   </div>
                                </div>
                             </div>
                          );
                       })}
                   </div>
                </div>
            </div>

            {/* --- Totals Sidebar (Right) --- */}
            {isSummaryOpen && (
                <div className="w-full lg:w-[280px] shrink-0 bg-slate-50 border-t lg:border-t-0 lg:border-r rtl:border-r-0 rtl:border-l border-slate-200 flex flex-col overflow-y-auto custom-scrollbar" onClick={(e) => e.stopPropagation()}>
                    <div className="p-3 border-b border-slate-200 bg-white flex justify-between items-center z-10 shrink-0">
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                            <Layers size={14} className="text-indigo-500"/>
                            {t.summary}
                        </h3>
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border bg-white shadow-sm ${isBalanced ? 'text-emerald-700 border-emerald-200' : 'text-red-700 border-red-200'}`}>
                            {isBalanced ? <CheckCircle size={12}/> : <FileWarning size={12}/>}
                            <span className="font-bold text-[10px] dir-ltr">{isBalanced ? t.balanced : formatNum(Math.abs(totalDebit - totalCredit))}</span>
                        </div>
                    </div>
                    
                    <div className="flex flex-col gap-3 p-3 text-xs">
                       {/* Base Currency Total */}
                       <div className="flex flex-col gap-1.5 bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors">
                           <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 mb-1 border-b border-slate-100 pb-1.5">
                               <span className="uppercase tracking-wider">{t.summaryBase}</span>
                               <Badge variant="indigo" size="sm">{getCurrencyTitle(currentLedger?.currency)}</Badge>
                           </div>
                           <div className="flex justify-between items-center"><span className="text-slate-500">{t.debit}:</span> <span className="font-bold text-indigo-700 dir-ltr text-[13px]">{formatNum(totalDebit)}</span></div>
                           <div className="flex justify-between items-center"><span className="text-slate-500">{t.credit}:</span> <span className="font-bold text-indigo-700 dir-ltr text-[13px]">{formatNum(totalCredit)}</span></div>
                       </div>
                       
                       {/* Operating Currency Total */}
                       {currencyGlobals?.op_currency && (
                           <div className="flex flex-col gap-1.5 bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
                               <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 mb-1 border-b border-slate-100 pb-1.5">
                                   <span className="uppercase tracking-wider">{t.summaryOp}</span>
                                   <Badge variant="slate" size="sm">{getCurrencyTitle(currencyGlobals.op_currency)}</Badge>
                               </div>
                               <div className="flex justify-between items-center"><span className="text-slate-500">{t.debit}:</span> <span className="font-bold text-slate-700 dir-ltr text-[13px]">{formatNum(opTotalDebit)}</span></div>
                               <div className="flex justify-between items-center"><span className="text-slate-500">{t.credit}:</span> <span className="font-bold text-slate-700 dir-ltr text-[13px]">{formatNum(opTotalCredit)}</span></div>
                           </div>
                       )}

                       {/* Reporting Currency 1 Total */}
                       {currencyGlobals?.rep1_currency && (
                           <div className="flex flex-col gap-1.5 bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
                               <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 mb-1 border-b border-slate-100 pb-1.5">
                                   <span className="uppercase tracking-wider">{t.summaryRep1}</span>
                                   <Badge variant="slate" size="sm">{getCurrencyTitle(currencyGlobals.rep1_currency)}</Badge>
                               </div>
                               <div className="flex justify-between items-center"><span className="text-slate-500">{t.debit}:</span> <span className="font-bold text-slate-700 dir-ltr text-[13px]">{formatNum(rep1TotalDebit)}</span></div>
                               <div className="flex justify-between items-center"><span className="text-slate-500">{t.credit}:</span> <span className="font-bold text-slate-700 dir-ltr text-[13px]">{formatNum(rep1TotalCredit)}</span></div>
                           </div>
                       )}

                       {/* Reporting Currency 2 Total */}
                       {currencyGlobals?.rep2_currency && (
                           <div className="flex flex-col gap-1.5 bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
                               <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 mb-1 border-b border-slate-100 pb-1.5">
                                   <span className="uppercase tracking-wider">{t.summaryRep2}</span>
                                   <Badge variant="slate" size="sm">{getCurrencyTitle(currencyGlobals.rep2_currency)}</Badge>
                               </div>
                               <div className="flex justify-between items-center"><span className="text-slate-500">{t.debit}:</span> <span className="font-bold text-slate-700 dir-ltr text-[13px]">{formatNum(rep2TotalDebit)}</span></div>
                               <div className="flex justify-between items-center"><span className="text-slate-500">{t.credit}:</span> <span className="font-bold text-slate-700 dir-ltr text-[13px]">{formatNum(rep2TotalCredit)}</span></div>
                           </div>
                       )}
                    </div>
                </div>
            )}

          </div>
        </div>
        
        {/* Currency Conversion Modal */}
        {currencyModalIndex !== null && voucherItems[currencyModalIndex] && (
            <Modal isOpen={true} onClose={() => setCurrencyModalIndex(null)} title={`${t.currencyConversions} - ${t.row} ${voucherItems[currencyModalIndex].row_number}`} size="lg" footer={<Button variant="primary" onClick={() => setCurrencyModalIndex(null)}>{isRtl ? 'تایید و بستن' : 'Confirm & Close'}</Button>}>
                <div className="p-4 bg-slate-50/50 flex flex-col gap-4">
                    <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm text-sm">
                        <div className="flex items-center gap-2">
                           <Calculator size={18} className="text-indigo-500"/>
                           <span className="font-bold text-slate-700">{t.baseAmount}:</span>
                           <span className={`font-bold ${parseNum(voucherItems[currencyModalIndex].debit) > 0 ? 'text-emerald-600' : (parseNum(voucherItems[currencyModalIndex].credit) > 0 ? 'text-rose-600' : 'text-slate-500')}`}>
                               {parseNum(voucherItems[currencyModalIndex].debit) > 0 
                                  ? `${formatNum(voucherItems[currencyModalIndex].debit)} (${t.debit})` 
                                  : parseNum(voucherItems[currencyModalIndex].credit) > 0 
                                      ? `${formatNum(voucherItems[currencyModalIndex].credit)} (${t.credit})`
                                      : '0'}
                           </span>
                        </div>
                        <Badge variant="indigo">{getCurrencyTitle(voucherItems[currencyModalIndex].currency_code)}</Badge>
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm bg-white">
                        <table className="w-full text-xs text-right dir-rtl">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                                <tr>
                                    <th className="py-2 px-3 font-bold">{isRtl ? 'نوع ارز' : 'Type'}</th>
                                    <th className="py-2 px-3 font-bold">{isRtl ? 'ارز مقصد' : 'Target'}</th>
                                    <th className="py-2 px-3 font-bold w-32">{t.exchangeRate}</th>
                                    <th className="py-2 px-3 font-bold text-center">{t.reverseCalc}</th>
                                    <th className="py-2 px-3 font-bold w-40">{t.convertedAmount}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Operating Currency */}
                                {currencyGlobals?.op_currency && (() => {
                                    const isMatch = voucherItems[currencyModalIndex].currency_code === currencyGlobals.op_currency;
                                    return (
                                        <tr className="border-b border-slate-100 hover:bg-slate-50">
                                            <td className="py-2 px-3 font-bold text-slate-700">{t.opCurrency}</td>
                                            <td className="py-2 px-3">{getCurrencyTitle(currencyGlobals.op_currency)}</td>
                                            <td className="py-2 px-3">
                                                <input type="text" className={`w-full border rounded h-7 px-2 text-left dir-ltr outline-none ${isMatch || isReadonly ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-white border-slate-300 focus:border-indigo-500'}`}
                                                    value={voucherItems[currencyModalIndex].op_rate} 
                                                    onChange={(e) => handleItemChange(currencyModalIndex, 'op_rate', e.target.value)} 
                                                    disabled={isMatch || isReadonly}
                                                />
                                            </td>
                                            <td className="py-2 px-3 text-center">
                                                <input type="checkbox" className={`w-4 h-4 rounded ${isMatch || isReadonly ? 'text-slate-400 cursor-not-allowed' : 'text-indigo-600 cursor-pointer'}`}
                                                    checked={voucherItems[currencyModalIndex].op_is_reverse} 
                                                    onChange={(e) => handleItemChange(currencyModalIndex, 'op_is_reverse', e.target.checked)} 
                                                    disabled={isMatch || isReadonly}
                                                />
                                            </td>
                                            <td className="py-2 px-3">
                                                <div className="w-full h-7 bg-indigo-50 border border-indigo-100 rounded flex items-center px-2 font-bold text-indigo-700 text-left dir-ltr overflow-hidden text-ellipsis whitespace-nowrap">
                                                    {formatNum(parseNum(voucherItems[currencyModalIndex].debit) > 0 ? voucherItems[currencyModalIndex].op_debit : voucherItems[currencyModalIndex].op_credit)}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })()}

                                {/* Reporting Currency 1 */}
                                {currencyGlobals?.rep1_currency && (() => {
                                    const isMatch = voucherItems[currencyModalIndex].currency_code === currencyGlobals.rep1_currency;
                                    return (
                                        <tr className="border-b border-slate-100 hover:bg-slate-50">
                                            <td className="py-2 px-3 font-bold text-slate-700">{t.rep1Currency}</td>
                                            <td className="py-2 px-3">{getCurrencyTitle(currencyGlobals.rep1_currency)}</td>
                                            <td className="py-2 px-3">
                                                <input type="text" className={`w-full border rounded h-7 px-2 text-left dir-ltr outline-none ${isMatch || isReadonly ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-white border-slate-300 focus:border-indigo-500'}`}
                                                    value={voucherItems[currencyModalIndex].rep1_rate} 
                                                    onChange={(e) => handleItemChange(currencyModalIndex, 'rep1_rate', e.target.value)} 
                                                    disabled={isMatch || isReadonly}
                                                />
                                            </td>
                                            <td className="py-2 px-3 text-center">
                                                <input type="checkbox" className={`w-4 h-4 rounded ${isMatch || isReadonly ? 'text-slate-400 cursor-not-allowed' : 'text-indigo-600 cursor-pointer'}`}
                                                    checked={voucherItems[currencyModalIndex].rep1_is_reverse} 
                                                    onChange={(e) => handleItemChange(currencyModalIndex, 'rep1_is_reverse', e.target.checked)} 
                                                    disabled={isMatch || isReadonly}
                                                />
                                            </td>
                                            <td className="py-2 px-3">
                                                <div className="w-full h-7 bg-indigo-50 border border-indigo-100 rounded flex items-center px-2 font-bold text-indigo-700 text-left dir-ltr overflow-hidden text-ellipsis whitespace-nowrap">
                                                    {formatNum(parseNum(voucherItems[currencyModalIndex].debit) > 0 ? voucherItems[currencyModalIndex].rep1_debit : voucherItems[currencyModalIndex].rep1_credit)}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })()}

                                {/* Reporting Currency 2 */}
                                {currencyGlobals?.rep2_currency && (() => {
                                    const isMatch = voucherItems[currencyModalIndex].currency_code === currencyGlobals.rep2_currency;
                                    return (
                                        <tr className="hover:bg-slate-50">
                                            <td className="py-2 px-3 font-bold text-slate-700">{t.rep2Currency}</td>
                                            <td className="py-2 px-3">{getCurrencyTitle(currencyGlobals.rep2_currency)}</td>
                                            <td className="py-2 px-3">
                                                <input type="text" className={`w-full border rounded h-7 px-2 text-left dir-ltr outline-none ${isMatch || isReadonly ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-white border-slate-300 focus:border-indigo-500'}`}
                                                    value={voucherItems[currencyModalIndex].rep2_rate} 
                                                    onChange={(e) => handleItemChange(currencyModalIndex, 'rep2_rate', e.target.value)} 
                                                    disabled={isMatch || isReadonly}
                                                />
                                            </td>
                                            <td className="py-2 px-3 text-center">
                                                <input type="checkbox" className={`w-4 h-4 rounded ${isMatch || isReadonly ? 'text-slate-400 cursor-not-allowed' : 'text-indigo-600 cursor-pointer'}`}
                                                    checked={voucherItems[currencyModalIndex].rep2_is_reverse} 
                                                    onChange={(e) => handleItemChange(currencyModalIndex, 'rep2_is_reverse', e.target.checked)} 
                                                    disabled={isMatch || isReadonly}
                                                />
                                            </td>
                                            <td className="py-2 px-3">
                                                <div className="w-full h-7 bg-indigo-50 border border-indigo-100 rounded flex items-center px-2 font-bold text-indigo-700 text-left dir-ltr overflow-hidden text-ellipsis whitespace-nowrap">
                                                    {formatNum(parseNum(voucherItems[currencyModalIndex].debit) > 0 ? voucherItems[currencyModalIndex].rep2_debit : voucherItems[currencyModalIndex].rep2_credit)}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })()}
                            </tbody>
                        </table>
                    </div>
                    <p className="text-[10px] text-slate-500 text-justify bg-amber-50 p-2 rounded border border-amber-200 flex gap-2 items-start mt-2">
                        <FileWarning size={14} className="shrink-0 text-amber-500" />
                        <span>{isRtl ? 'مقادیر تبدیل‌شده به صورت خودکار محاسبه شده و با تغییر مبلغ مبنا یا نرخ تبدیل در لحظه به‌روزرسانی می‌شوند. این مقادیر در گزارشات پایه سیستم مورد استفاده قرار می‌گیرند.' : 'Converted values are automatically calculated and updated in real-time. These are used for base system reports.'}</span>
                    </p>
                </div>
            </Modal>
        )}
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
            <CheckSquare size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800">{t.title}</h1>
            <p className="text-xs text-slate-500 font-medium mt-1">{t.subtitle}</p>
          </div>
        </div>
        <Button variant="outline" icon={ListOrdered} onClick={openBulkSort}>{t.sortVouchers}</Button>
      </div>

      <FilterSection 
         onSearch={() => fetchVouchers(searchParams)} 
         onClear={handleClearSearch} 
         isRtl={isRtl} 
         title={t.search}
      >
        <InputField label={t.voucherNumber} value={searchParams.voucher_number} onChange={e => setSearchParams({...searchParams, voucher_number: e.target.value})} isRtl={isRtl} dir="ltr" />
        <SelectField label={t.status} value={searchParams.status} onChange={e => setSearchParams({...searchParams, status: e.target.value})} isRtl={isRtl}>
           <option value="">{t.all}</option>
           <option value="temporary">{t.statusTemporary}</option>
           <option value="reviewed">{t.statusReviewed}</option>
        </SelectField>
        <InputField type="date" label={t.fromDate} value={searchParams.from_date} onChange={e => setSearchParams({...searchParams, from_date: e.target.value})} isRtl={isRtl} />
        <InputField type="date" label={t.toDate} value={searchParams.to_date} onChange={e => setSearchParams({...searchParams, to_date: e.target.value})} isRtl={isRtl} />
        
        <SelectField label={t.type} value={searchParams.voucher_type} onChange={e => setSearchParams({...searchParams, voucher_type: e.target.value})} isRtl={isRtl}>
           <option value="">{t.all}</option>
           {docTypes.map(d => <option key={d.id} value={d.code}>{d.title}</option>)}
        </SelectField>

        <div className="flex flex-col gap-1">
           <label className="text-[11px] font-bold text-slate-600 rtl:pr-1 ltr:pl-1">{t.account}</label>
           <SearchableAccountSelect 
               accounts={validAccountsForLedger} 
               value={searchParams.account_id} 
               onChange={v => setSearchParams({...searchParams, account_id: v})} 
               placeholder={t.searchAccount} 
               className="w-full bg-white border border-slate-300 hover:border-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-md h-8 px-2 outline-none text-[12px] text-slate-800 shadow-sm transition-all"
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
          onDelete={(ids) => { 
              const selectedVouchers = vouchers.filter(v => ids.includes(v.id));
              if (selectedVouchers.some(v => v.status === 'reviewed')) {
                  alert(isRtl ? 'اسناد بررسی شده قابل حذف نیستند.' : 'Reviewed vouchers cannot be deleted.');
                  return;
              }
              setVoucherToDelete(selectedVouchers[0]); 
              setShowDeleteModal(true); 
          }} 
          onDoubleClick={(r) => handleOpenForm(r)} 
          isRtl={isRtl} 
          isLoading={loading} 
          bulkActions={
             <>
               {allTemp && <Button variant="secondary" size="sm" onClick={() => handleBulkStatus('reviewed')} icon={CheckCircle}>{t.makeReviewed}</Button>}
               {allReviewed && <Button variant="secondary" size="sm" onClick={() => handleBulkStatus('temporary')} icon={FileText}>{t.makeTemporary}</Button>}
             </>
          }
          actions={(r) => (
            <div className="flex gap-1 justify-center">
              <Button variant="ghost" size="iconSm" icon={ListOrdered} onClick={() => openSingleSort(r)} title={t.singleSort} className="text-slate-500 hover:text-indigo-600 hover:bg-indigo-50" />
              <Button variant="ghost" size="iconSm" icon={Printer} onClick={() => handlePrint(r)} title={t.print} className="text-slate-500 hover:text-indigo-600 hover:bg-indigo-50" />
              <Button 
                variant="ghost" 
                size="iconSm" 
                icon={r.status === 'reviewed' ? Eye : Edit} 
                onClick={() => handleOpenForm(r)} 
                title={r.status === 'reviewed' ? t.view : t.edit} 
              />
              {r.status !== 'reviewed' && (
                <Button variant="ghost" size="iconSm" icon={Trash2} className="text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => promptDelete(r)} title={t.delete} />
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

      <Modal isOpen={showSortModal} onClose={() => setShowSortModal(false)} title={t.sortVouchers} size="md">
         <div className="p-4 flex flex-col gap-4">
             <div className="flex bg-slate-100 p-1 rounded-lg">
                <button onClick={() => setSortTab('bulk')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${sortTab === 'bulk' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>{t.bulkSort}</button>
                <button onClick={() => setSortTab('single')} disabled={!sortParams.singleVoucherId} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${sortTab === 'single' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'} ${!sortParams.singleVoucherId ? 'opacity-50 cursor-not-allowed' : ''}`}>{t.singleSort}</button>
             </div>
             
             {sortTab === 'bulk' ? (
                 <div className="flex flex-col gap-4">
                     <p className="text-xs text-slate-500">{t.bulkSortDesc}</p>
                     <InputField type="date" label={t.fromDate} value={sortParams.fromDate} onChange={e => setSortParams({...sortParams, fromDate: e.target.value})} isRtl={isRtl} />
                     <InputField type="date" label={t.toDate} value={sortParams.toDate} onChange={e => setSortParams({...sortParams, toDate: e.target.value})} isRtl={isRtl} />
                     <Button variant="primary" className="w-full justify-center mt-2" onClick={handleBulkSort} disabled={loading}>{t.applySort}</Button>
                 </div>
             ) : (
                 <div className="flex flex-col gap-4">
                     <p className="text-xs text-slate-500">{t.singleSortDesc}</p>
                     <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100 flex flex-col gap-1">
                        <div className="text-xs font-bold text-indigo-800">{t.voucherNumber}: <span className="dir-ltr">{sortParams.singleVoucherNo}</span></div>
                        <div className="text-xs text-indigo-600">{t.date}: <span className="dir-ltr">{sortParams.singleVoucherDate}</span></div>
                     </div>
                     <InputField type="number" label={t.targetDailyNumber} value={sortParams.targetDailyNumber} onChange={e => setSortParams({...sortParams, targetDailyNumber: e.target.value})} isRtl={isRtl} dir="ltr" />
                     <Button variant="primary" className="w-full justify-center mt-2" onClick={handleSingleSort} disabled={loading}>{t.applySort}</Button>
                 </div>
             )}
         </div>
      </Modal>
    </div>
  );
};

window.VoucherReview = VoucherReview;
export default VoucherReview;
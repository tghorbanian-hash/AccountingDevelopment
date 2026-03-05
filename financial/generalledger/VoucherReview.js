/* Filename: financial/generalledger/VoucherReview.js */
import React, { useState, useEffect } from 'react';
import { Loader2, Filter, ChevronDown } from 'lucide-react';

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
    attachments: 'Attachments',
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
    globalFiltersTitle: 'Global Filters',
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
    attachments: 'ضمائم',
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
    globalFiltersTitle: 'فیلترهای سراسری',
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

window.VoucherReviewTranslations = localTranslations;

const VoucherReview = ({ language = 'fa', setHeaderNode }) => {
  const t = localTranslations[language] || localTranslations['en'];
  const isRtl = language === 'fa';
  const supabase = window.supabase;

  const [isAppLoading, setIsAppLoading] = useState(true);
  const [view, setView] = useState('list');
  const [selectedVoucherId, setSelectedVoucherId] = useState(null);
  const [vouchersList, setVouchersList] = useState([]);
  const [lookups, setLookups] = useState(null);
  const [contextVals, setContextVals] = useState(null);

  useEffect(() => {
    const initApp = async () => {
      if (!supabase) return;
      try {
        const safeFetch = async (query) => {
          try {
            const res = await query;
            return res.data || [];
          } catch (e) {
            console.error("Exception in fetchLookups:", e);
            return [];
          }
        };

        const [
          brData, fyData, ledData, structData, dtData, diData, doctypeData, currData
        ] = await Promise.all([
          safeFetch(supabase.schema('gen').from('branches').select('*')),
          safeFetch(supabase.schema('gl').from('fiscal_years').select('id, code, title, status').eq('is_active', true).order('code', { ascending: false })),
          safeFetch(supabase.schema('gl').from('ledgers').select('id, code, title, currency, structure, metadata').eq('is_active', true).order('title')),
          safeFetch(supabase.schema('gl').from('account_structures').select('id, code, title').eq('status', true)),
          safeFetch(supabase.schema('gl').from('detail_types').select('id, code, title').eq('is_active', true)),
          safeFetch(supabase.schema('gl').from('detail_instances').select('id, detail_code, title, detail_type_code, ref_entity_name, entity_code').eq('status', true)),
          safeFetch(supabase.schema('gl').from('doc_types').select('id, code, title, type').eq('is_active', true)),
          safeFetch(supabase.schema('gen').from('currencies').select('id, code, title').eq('is_active', true))
        ]);

        let currencyGlobals = null;
        try {
          const { data } = await supabase.schema('gen').from('currency_globals').select('*').limit(1).maybeSingle();
          if (data) currencyGlobals = data;
        } catch (e) {}

        const accData = await safeFetch(supabase.schema('gl').from('accounts').select('id, full_code, title, level, parent_id, metadata, structure_id').eq('is_active', true).order('full_code'));
        let accounts = [];
        if (accData) {
          const accMap = new Map(accData.map(a => [a.id, a]));
          accounts = accData.map(a => {
            let path = a.title;
            let curr = a;
            while (curr.parent_id && accMap.has(curr.parent_id)) {
              curr = accMap.get(curr.parent_id);
              path = curr.title + ' / ' + path;
            }
            return { ...a, path, displayPath: a.full_code + ' - ' + path };
          });
        }

        const allDocTypes = doctypeData;

        const perms = {
          actions: ['view'], 
          allowed_branches: [],
          allowed_ledgers: [],
          allowed_doc_types: []
        };

        if (window.USER_PERMISSIONS) {
          if (window.IS_ADMIN) {
            perms.actions = ['view', 'edit', 'delete', 'print', 'attach', 'sort'];
          } else {
            ['view', 'edit', 'delete', 'print', 'attach', 'sort'].forEach(act => {
              if (window.USER_PERMISSIONS.has(`doc_review.${act}`)) perms.actions.push(act);
            });
            const scopes = window.USER_PERMISSIONS.dataScopes?.['doc_review'] || {};
            perms.allowed_branches = scopes.allowed_branches || scopes.branches || [];
            perms.allowed_ledgers = scopes.allowed_ledgers || scopes.ledgers || [];
            perms.allowed_doc_types = scopes.allowed_doctypes || scopes.doc_types || [];
          }
        } else {
            perms.actions = ['view', 'edit', 'delete', 'print', 'attach', 'sort']; 
        }

        let filteredLedgers = ledData;
        let filteredBranches = brData.filter(b => b.is_active !== false);
        let filteredDocTypes = allDocTypes;

        if (!window.IS_ADMIN) {
          if (perms.allowed_ledgers.length > 0) filteredLedgers = filteredLedgers.filter(l => perms.allowed_ledgers.includes(String(l.id)));
          if (perms.allowed_branches.length > 0) filteredBranches = filteredBranches.filter(b => perms.allowed_branches.includes(b.id));
        }

        setLookups({
          branches: filteredBranches,
          fiscalYears: fyData,
          ledgers: filteredLedgers,
          accountStructures: structData,
          detailTypes: dtData,
          allDetailInstances: diData,
          docTypes: filteredDocTypes,
          currencies: currData,
          currencyGlobals,
          accounts,
          permissions: perms
        });

        const defaultFyId = fyData?.[0]?.id || '';
        const defaultLedgerId = filteredLedgers?.[0]?.id || '';
        setContextVals({ fiscal_year_id: defaultFyId, ledger_id: defaultLedgerId });

      } catch (err) {
        console.error("Error initializing Voucher Review:", err);
      } finally {
        setIsAppLoading(false);
      }
    };
    initApp();
  }, []);

  // --- Dynamic Header Injection ---
  useEffect(() => {
    if (setHeaderNode && lookups && contextVals) {
      const node = (
        <div className="flex items-center bg-slate-100/80 hover:bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 transition-colors shadow-[inset_0_1px_3px_rgba(0,0,0,0.05)]">
          <Filter size={14} className="text-indigo-500 mr-2 rtl:mr-0 rtl:ml-2" />
          
          <div className="relative flex items-center group">
            <select 
              value={contextVals.fiscal_year_id} 
              onChange={e => setContextVals({...contextVals, fiscal_year_id: e.target.value})} 
              className="bg-transparent border-none text-xs font-bold text-slate-600 group-hover:text-indigo-700 focus:ring-0 outline-none cursor-pointer appearance-none py-0 pl-1 pr-5 rtl:pr-1 rtl:pl-5 transition-colors z-10"
            >
              {lookups.fiscalYears.map(f => <option key={f.id} value={f.id}>{f.title}</option>)}
            </select>
            <ChevronDown size={12} className="absolute text-slate-400 right-1 rtl:right-auto rtl:left-1 pointer-events-none group-hover:text-indigo-500 transition-colors" />
          </div>

          <div className="w-px h-4 bg-slate-300 mx-2"></div>
          
          {lookups.ledgers.length > 0 ? (
            <div className="relative flex items-center group">
              <select 
                value={contextVals.ledger_id} 
                onChange={e => setContextVals({...contextVals, ledger_id: e.target.value})} 
                className="bg-transparent border-none text-xs font-bold text-slate-600 group-hover:text-indigo-700 focus:ring-0 outline-none cursor-pointer appearance-none py-0 pl-1 pr-5 rtl:pr-1 rtl:pl-5 transition-colors z-10 max-w-[150px] truncate"
              >
                {lookups.ledgers.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
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
  }, [lookups, contextVals, setHeaderNode, language, t, isRtl]);


  const handleOpenForm = (voucherId, currentList) => {
    setSelectedVoucherId(voucherId);
    if (currentList) setVouchersList(currentList);
    setView('form');
  };

  const handleNavigate = (newVoucherId) => {
    setSelectedVoucherId(newVoucherId);
  };

  const handleCloseForm = () => {
    setView('list');
    setSelectedVoucherId(null);
  };

  if (isAppLoading || !lookups || !contextVals) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-50">
        <Loader2 size={40} className="animate-spin text-indigo-500 mb-4" />
        <p className="text-slate-500 font-bold">{language === 'fa' ? 'در حال بارگذاری...' : 'Loading...'}</p>
      </div>
    );
  }

  if (view === 'list') {
    return window.VoucherReviewList ? (
      <window.VoucherReviewList
        language={language}
        t={t}
        lookups={lookups}
        contextVals={contextVals}
        setContextVals={setContextVals}
        perms={lookups.permissions}
        onOpenForm={handleOpenForm}
        onListUpdate={setVouchersList}
      />
    ) : (
      <div className="p-10 text-center text-red-500 font-bold">VoucherReviewList component missing</div>
    );
  }

  if (view === 'form') {
    return window.VoucherReviewForm ? (
      <window.VoucherReviewForm
        language={language}
        t={t}
        voucherId={selectedVoucherId}
        vouchersList={vouchersList}
        lookups={lookups}
        contextVals={contextVals}
        perms={lookups.permissions}
        onClose={handleCloseForm}
        onNavigate={handleNavigate}
      />
    ) : (
      <div className="p-10 text-center text-red-500 font-bold">VoucherReviewForm component missing</div>
    );
  }

  return null;
};

window.VoucherReview = VoucherReview;
export default VoucherReview;
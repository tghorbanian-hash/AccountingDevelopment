/* Filename: financial/generalledger/VoucherFinalize.js */
import React, { useState, useEffect } from 'react';
import { Filter, ChevronDown } from 'lucide-react';

const localTranslations = {
  en: {
    title: 'Voucher Finalization',
    subtitle: 'View and permanently finalize reviewed vouchers',
    search: 'Advanced Search',
    voucherNumber: 'Voucher No.',
    date: 'Date',
    type: 'Doc Type',
    status: 'Status',
    description: 'Description',
    amount: 'Amount',
    actions: 'Actions',
    view: 'View',
    print: 'Print',
    printVoucher: 'Print Voucher',
    attachments: 'Attachments',
    branch: 'Branch',
    fiscalYear: 'Fiscal Year',
    fiscalPeriod: 'Fiscal Period',
    ledger: 'Ledger',
    items: 'Voucher Items',
    row: 'Row',
    account: 'Account',
    detail: 'Detail',
    debit: 'Debit',
    credit: 'Credit',
    currency: 'Currency',
    backToList: 'Back to List',
    statusReviewed: 'Reviewed',
    statusFinalized: 'Finalized',
    general: 'General',
    trackingNumber: 'Tracking No.',
    trackingDate: 'Tracking Date',
    quantity: 'Qty',
    globalFiltersTitle: 'Global Filters',
    dailyNumber: 'Daily No.',
    crossReference: 'Cross Ref.',
    referenceNumber: 'Reference No.',
    subsidiaryNumber: 'Subsidiary No.',
    headerInfo: 'Voucher Header',
    fromDate: 'From Date',
    toDate: 'To Date',
    all: 'All',
    finalize: 'Finalize Voucher(s)',
    finalizeWarning: 'WARNING: Finalizing vouchers is irreversible. Are you sure you want to finalize the selected voucher(s)?',
    errNotBalanced: 'Voucher {vNo} is not balanced and cannot be finalized.',
    errPeriodClosed: 'Fiscal period for voucher {vNo} date is closed. You do not have permission to change status.',
    errPeriodNotFound: 'No valid fiscal period found for voucher {vNo} date.',
    finalizeSuccess: 'Voucher(s) finalized successfully.',
    finalizeError: 'Error during finalization.',
    selectedItems: '{count} items selected',
    summary: 'Summary',
    balanced: 'Balanced',
    unbalanced: 'Unbalanced',
    summaryBase: 'Base',
    summaryOp: 'OP Cur',
    summaryRep1: 'Rep 1 Cur',
    summaryRep2: 'Rep 2 Cur',
    selectPeriod: 'Select Period...',
  },
  fa: {
    title: 'قطعی کردن اسناد',
    subtitle: 'مشاهده و قطعی‌سازی غیرقابل برگشت اسناد بررسی شده',
    search: 'جستجوی پیشرفته',
    voucherNumber: 'شماره سند',
    date: 'تاریخ',
    type: 'نوع سند',
    status: 'وضعیت',
    description: 'شرح',
    amount: 'مبلغ سند',
    actions: 'عملیات',
    view: 'مشاهده',
    print: 'چاپ',
    printVoucher: 'چاپ سند حسابداری',
    attachments: 'ضمائم',
    branch: 'شعبه',
    fiscalYear: 'سال مالی',
    fiscalPeriod: 'دوره مالی',
    ledger: 'دفتر کل',
    items: 'اقلام سند',
    row: 'ردیف',
    account: 'کد و شرح معین',
    detail: 'تفصیل',
    debit: 'بدهکار',
    credit: 'بستانکار',
    currency: 'ارز',
    backToList: 'بازگشت به فهرست',
    statusReviewed: 'بررسی شده',
    statusFinalized: 'قطعی شده',
    general: 'عمومی',
    trackingNumber: 'شماره پیگیری',
    trackingDate: 'تاریخ پیگیری',
    quantity: 'مقدار',
    globalFiltersTitle: 'فیلترهای سراسری',
    dailyNumber: 'شماره روزانه',
    crossReference: 'شماره عطف',
    referenceNumber: 'شماره ارجاع',
    subsidiaryNumber: 'شماره فرعی',
    headerInfo: 'اطلاعات سربرگ سند',
    fromDate: 'از تاریخ',
    toDate: 'تا تاریخ',
    all: 'همه',
    finalize: 'قطعی کردن اسناد',
    finalizeWarning: 'هشدار مهم: عملیات قطعی‌سازی اسناد غیرقابل برگشت است! آیا از قطعی کردن اسناد انتخاب شده اطمینان کامل دارید؟',
    errNotBalanced: 'سند شماره {vNo} تراز نیست و امکان قطعی شدن ندارد.',
    errPeriodClosed: 'دوره مالی برای تاریخ سند شماره {vNo} بسته است و شما مجوز تغییر وضعیت در این دوره را ندارید.',
    errPeriodNotFound: 'دوره مالی معتبری برای تاریخ سند شماره {vNo} یافت نشد.',
    finalizeSuccess: 'اسناد با موفقیت قطعی شدند.',
    finalizeError: 'خطا در عملیات قطعی‌سازی.',
    selectedItems: '{count} مورد انتخاب شده',
    summary: 'خلاصه سند',
    balanced: 'تراز',
    unbalanced: 'اختلاف',
    summaryBase: 'ارز مبنا',
    summaryOp: 'عملیاتی',
    summaryRep1: 'گزارشگری ۱',
    summaryRep2: 'گزارشگری ۲',
    selectPeriod: 'انتخاب دوره...',
  }
};

window.VoucherFinalizeTranslations = localTranslations;

const VoucherFinalize = ({ language = 'fa', setHeaderNode }) => {
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
            return [];
          }
        };

        const { data: authData } = await supabase.auth.getUser();
        const currentUserId = authData?.user?.id;

        const [
          brData, fyData, ledData, structData, dtData, diData, doctypeData, currData, periodsData, excData
        ] = await Promise.all([
          safeFetch(supabase.schema('gen').from('branches').select('*')),
          safeFetch(supabase.schema('gl').from('fiscal_years').select('id, code, title, status').eq('is_active', true).order('code', { ascending: false })),
          safeFetch(supabase.schema('gl').from('ledgers').select('id, code, title, currency, structure, metadata').eq('is_active', true).order('title')),
          safeFetch(supabase.schema('gl').from('account_structures').select('id, code, title').eq('status', true)),
          safeFetch(supabase.schema('gl').from('detail_types').select('id, code, title').eq('is_active', true)),
          safeFetch(supabase.schema('gl').from('detail_instances').select('id, detail_code, title, detail_type_code, ref_entity_name, entity_code').eq('status', true)),
          safeFetch(supabase.schema('gl').from('doc_types').select('id, code, title, type').eq('is_active', true)),
          safeFetch(supabase.schema('gen').from('currencies').select('id, code, title').eq('is_active', true)),
          safeFetch(supabase.schema('gl').from('fiscal_periods').select('*')),
          currentUserId ? safeFetch(supabase.schema('gl').from('fiscal_period_exceptions').select('*').eq('user_id', currentUserId)) : Promise.resolve([])
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
            perms.actions = ['view', 'status_change', 'print', 'attach'];
          } else {
            ['view', 'status_change', 'print', 'attach'].forEach(act => {
              if (window.USER_PERMISSIONS.has(`doc_finalize.${act}`)) perms.actions.push(act);
            });
            const scopes = window.USER_PERMISSIONS.dataScopes?.['doc_finalize'] || {};
            perms.allowed_branches = scopes.allowed_branches || scopes.branches || [];
            perms.allowed_ledgers = scopes.allowed_ledgers || scopes.ledgers || [];
            perms.allowed_doc_types = scopes.allowed_doctypes || scopes.doc_types || [];
          }
        } else {
            perms.actions = ['view', 'status_change', 'print', 'attach']; 
        }

        let filteredLedgers = ledData;
        let filteredBranches = brData.filter(b => b.is_active !== false);

        if (!window.IS_ADMIN) {
          if (perms.allowed_ledgers.length > 0) filteredLedgers = filteredLedgers.filter(l => perms.allowed_ledgers.includes(String(l.id)));
          if (perms.allowed_branches.length > 0) filteredBranches = filteredBranches.filter(b => perms.allowed_branches.includes(b.id));
        }

        setLookups({
          branches: filteredBranches,
          fiscalYears: fyData,
          fiscalPeriods: periodsData,
          fiscalExceptions: excData,
          ledgers: filteredLedgers,
          accountStructures: structData,
          detailTypes: dtData,
          allDetailInstances: diData,
          docTypes: allDocTypes,
          currencies: currData,
          currencyGlobals,
          accounts,
          permissions: perms
        });

        const defaultFyId = fyData?.[0]?.id || '';
        const defaultLedgerId = filteredLedgers?.[0]?.id || '';
        setContextVals({ fiscal_year_id: defaultFyId, ledger_id: defaultLedgerId });

      } catch (err) {
        console.error("Error initializing Voucher Finalize:", err);
      } finally {
        setIsAppLoading(false);
      }
    };
    initApp();
  }, []);

  // --- ارسال فیلترها به هدر سیستم (تغییر شیک و حرفه‌ای UX) ---
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
  }, [lookups, contextVals, setHeaderNode, isRtl, t]);


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
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mb-4"></div>
        <p className="text-slate-500 font-bold">{language === 'fa' ? 'در حال بارگذاری...' : 'Loading...'}</p>
      </div>
    );
  }

  if (view === 'list') {
    return window.VoucherFinalizeList ? (
      <window.VoucherFinalizeList
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
      <div className="p-10 text-center text-red-500 font-bold">VoucherFinalizeList component missing</div>
    );
  }

  if (view === 'form') {
    return window.VoucherFinalizeView ? (
      <window.VoucherFinalizeView
        language={language}
        t={t}
        voucherId={selectedVoucherId}
        vouchersList={vouchersList}
        lookups={lookups}
        contextVals={contextVals}
        perms={lookups.permissions}
        onClose={handleCloseForm}
        onNavigate={handleNavigate}
        onRefreshList={() => setView('list')}
      />
    ) : (
      <div className="p-10 text-center text-red-500 font-bold">VoucherFinalizeView component missing</div>
    );
  }

  return null;
};

window.VoucherFinalize = VoucherFinalize;
export default VoucherFinalize;
/* Filename: financial/generalledger/AccountReview.js */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, Filter, Layers, FileText, ChevronLeft, ChevronRight, 
  Printer, Download, RefreshCw, X, Eye, Calculator, ArrowRight, ArrowLeft
} from 'lucide-react';

const AccountReview = ({ language = 'fa', setHeaderNode }) => {
  const isRtl = language === 'fa';
  const UI = window.UI || {};
  const { Button, InputField, SelectField, DataGrid, Modal, FilterSection, Badge } = UI;
  const { formatNumber, parseNumber } = UI.utils || { formatNumber: (v) => v, parseNumber: (v) => v };
  const supabase = window.supabase;

  // --- Translations ---
  const t = {
    title: isRtl ? 'مرور حساب‌ها' : 'Account Review',
    subtitle: isRtl ? 'تحلیل و بررسی تعاملی حساب‌ها، تفصیل‌ها و گردش اسناد' : 'Interactive analysis of accounts, details, and transactions',
    refresh: isRtl ? 'بروزرسانی' : 'Refresh',
    print: isRtl ? 'چاپ' : 'Print',
    export: isRtl ? 'اکسل' : 'Export Excel',
    loading: isRtl ? 'در حال بارگذاری...' : 'Loading...',
    fetchData: isRtl ? 'اجرای گزارش' : 'Run Report',
    noData: isRtl ? 'داده‌ای یافت نشد' : 'No data found',
    
    // Tabs
    tabBranch: isRtl ? 'شعبه' : 'Branch',
    tabGroup: isRtl ? 'گروه حساب' : 'Account Group',
    tabCol: isRtl ? 'حساب کل' : 'General Ledger',
    tabMoe: isRtl ? 'حساب معین' : 'Subsidiary Ledger',
    tabDetail: isRtl ? 'تفصیل‌ها' : 'Details',
    tabCurrency: isRtl ? 'ارز سند' : 'Doc Currency',
    tabTracking: isRtl ? 'پیگیری' : 'Tracking',
    tabTransactions: isRtl ? 'ریز گردش' : 'Transactions',

    // Main Filters
    mainCurrency: isRtl ? 'ارز گزارش' : 'Report Currency',
    fiscalYear: isRtl ? 'سال مالی' : 'Fiscal Year',
    timeRangeType: isRtl ? 'نوع بازه زمانی' : 'Time Range Type',
    periodRange: isRtl ? 'بر اساس دوره' : 'By Period',
    dateRange: isRtl ? 'بر اساس تاریخ' : 'By Date',
    fromPeriod: isRtl ? 'از دوره' : 'From Period',
    toPeriod: isRtl ? 'تا دوره' : 'To Period',
    fromDate: isRtl ? 'از تاریخ' : 'From Date',
    toDate: isRtl ? 'تا تاریخ' : 'To Date',
    docType: isRtl ? 'نوع سند' : 'Doc Type',
    accountType: isRtl ? 'نوع حساب' : 'Account Type',
    showWithBalanceOnly: isRtl ? 'فقط حساب‌های با مانده' : 'Only Accounts with Balance',
    advancedFilters: isRtl ? 'فیلترهای بیشتر' : 'Advanced Filters',

    // Adv Filters
    advFeatures: isRtl ? 'ویژگی‌های حساب' : 'Account Features',
    featCurrency: isRtl ? 'دارای ویژگی ارزی' : 'Has Currency Feature',
    featTracking: isRtl ? 'دارای ویژگی پیگیری' : 'Has Tracking Feature',
    featQty: isRtl ? 'دارای ویژگی مقداری' : 'Has Quantity Feature',
    docNoFrom: isRtl ? 'از شماره سند' : 'From Doc No',
    docNoTo: isRtl ? 'تا شماره سند' : 'To Doc No',
    crossNoFrom: isRtl ? 'از شماره عطف' : 'From Cross No',
    crossNoTo: isRtl ? 'تا شماره عطف' : 'To Cross No',
    subNo: isRtl ? 'شماره فرعی' : 'Sub No',
    accStatus: isRtl ? 'وضعیت حساب' : 'Account Status',
    docStatus: isRtl ? 'وضعیت سند' : 'Doc Status',
    creator: isRtl ? 'صادر کننده' : 'Creator',
    reviewer: isRtl ? 'بررسی کننده' : 'Reviewer',
    trackingNo: isRtl ? 'شماره پیگیری' : 'Tracking No',
    headerDesc: isRtl ? 'شرح سند' : 'Header Desc',
    itemDesc: isRtl ? 'شرح قلم' : 'Item Desc',
    apply: isRtl ? 'اعمال' : 'Apply',
    cancel: isRtl ? 'انصراف' : 'Cancel',
    all: isRtl ? 'همه' : 'All',
    active: isRtl ? 'فعال' : 'Active',
    inactive: isRtl ? 'غیرفعال' : 'Inactive',

    // Grid Columns
    colCode: isRtl ? 'کد' : 'Code',
    colTitle: isRtl ? 'عنوان' : 'Title',
    colDebit: isRtl ? 'گردش بدهکار' : 'Debit Turnover',
    colCredit: isRtl ? 'گردش بستانکار' : 'Credit Turnover',
    colBalanceDebit: isRtl ? 'مانده بدهکار' : 'Debit Balance',
    colBalanceCredit: isRtl ? 'مانده بستانکار' : 'Credit Balance',
    colBalance: isRtl ? 'مانده نهایی' : 'Final Balance',
    colNature: isRtl ? 'ماهیت' : 'Nature',
    colDate: isRtl ? 'تاریخ' : 'Date',
    colDocNo: isRtl ? 'ش.سند' : 'Doc No',
    colDesc: isRtl ? 'شرح' : 'Description',
    sum: isRtl ? 'جمع کل' : 'Total',
    
    statusTemp: isRtl ? 'موقت' : 'Temporary',
    statusRev: isRtl ? 'بررسی شده' : 'Reviewed',
    statusFin: isRtl ? 'قطعی شده' : 'Finalized',
  };

  // --- States ---
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [lookups, setLookups] = useState(null);
  const [contextVals, setContextVals] = useState(null);

  // Raw Data State
  const [rawData, setRawData] = useState([]); 

  // Filter States
  const [baseCurrencyMode, setBaseCurrencyMode] = useState('op'); // op, rep1, rep2
  const [mainFilters, setMainFilters] = useState({
      fiscalYearIds: [],
      timeRangeType: 'period', // 'period' | 'date'
      fromPeriodId: '',
      toPeriodId: '',
      fromDate: '',
      toDate: '',
      docType: '',
      accountType: '',
      showWithBalanceOnly: false
  });
  
  const [advFilters, setAdvFilters] = useState({
      featCurrency: false, featTracking: false, featQty: false,
      docNoFrom: '', docNoTo: '', crossNoFrom: '', crossNoTo: '', subNo: '',
      accStatus: '', docStatus: '', creatorId: '', reviewerId: '',
      trackingNo: '', headerDesc: '', itemDesc: ''
  });
  const [isAdvFilterOpen, setIsAdvFilterOpen] = useState(false);

  // View States
  const tabs = [
      { id: 'branch', label: t.tabBranch },
      { id: 'group', label: t.tabGroup },
      { id: 'col', label: t.tabCol },
      { id: 'moe', label: t.tabMoe },
      { id: 'detail', label: t.tabDetail },
      { id: 'currency', label: t.tabCurrency },
      { id: 'tracking', label: t.tabTracking },
      { id: 'transactions', label: t.tabTransactions }
  ];
  const [activeTab, setActiveTab] = useState('col');
  
  // Selection Path for Drill-down
  // Keeps track of selected IDs in previous tabs to filter current view
  const [drillPath, setDrillPath] = useState({});

  // Voucher View Modal
  const [selectedVoucherId, setSelectedVoucherId] = useState(null);

  // --- Init App ---
  useEffect(() => {
    const initApp = async () => {
        if (!supabase) return;
        try {
            const fetchSafe = async (schema, table) => {
                try {
                    const { data } = await supabase.schema(schema).from(table).select('*');
                    return data || [];
                } catch (e) { return []; }
            };

            const [
                branches, ledgers, accounts, allDetailInstances, docTypes, 
                currencies, fiscalYears, fiscalPeriods, users
            ] = await Promise.all([
                fetchSafe('gen', 'branches'),
                fetchSafe('gl', 'ledgers'),
                fetchSafe('gl', 'accounts'),
                fetchSafe('gl', 'detail_instances'),
                fetchSafe('gl', 'document_types'),
                fetchSafe('gen', 'currencies'),
                fetchSafe('gl', 'fiscal_years'),
                fetchSafe('gl', 'fiscal_periods'),
                fetchSafe('gen', 'users') // Assuming a users table exists for creator/reviewer
            ]);

            let currencyGlobals = {};
            try {
                const { data } = await supabase.schema('gen').from('currency_globals').select('*').limit(1).maybeSingle();
                if(data) currencyGlobals = data;
            } catch(e){}

            // Build account hierarchy map
            const accMap = {};
            accounts.forEach(a => accMap[a.id] = a);
            accounts.forEach(a => {
                a.parentCol = null;
                a.parentGroup = null;
                if (a.level === 'معین' || a.level === 'subsidiary' || a.level === '4') {
                    const col = accounts.find(parent => String(parent.id) === String(a.parent_id));
                    if (col) {
                        a.parentCol = col;
                        const grp = accounts.find(p => String(p.id) === String(col.parent_id));
                        if (grp) a.parentGroup = grp;
                    }
                } else if (a.level === 'کل' || a.level === 'general' || a.level === '3') {
                    a.parentCol = a;
                    const grp = accounts.find(p => String(p.id) === String(a.parent_id));
                    if (grp) a.parentGroup = grp;
                } else if (a.level === 'گروه' || a.level === 'group' || a.level === '2' || a.level === '1') {
                    a.parentGroup = a;
                }
            });

            const activeYear = fiscalYears.find(y => y.is_active) || fiscalYears[0] || {};
            const activeLedger = ledgers.find(l => l.is_main) || ledgers[0] || {};

            setContextVals({
                fiscal_year_id: activeYear.id || '',
                ledger_id: activeLedger.id || ''
            });

            setMainFilters(prev => ({ ...prev, fiscalYearIds: [activeYear.id] }));

            setLookups({
                branches, ledgers, accounts, accMap, allDetailInstances, 
                docTypes, currencies, currencyGlobals, fiscalYears, fiscalPeriods, users
            });
        } catch (err) {
            console.error("Init error:", err);
        } finally {
            setIsAppLoading(false);
        }
    };
    initApp();
  }, []);

  // --- Header Node Setup ---
  useEffect(() => {
    if (setHeaderNode && lookups && contextVals) {
      const node = (
        <div className="flex items-center bg-slate-100/80 hover:bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 transition-colors shadow-[inset_0_1px_3px_rgba(0,0,0,0.05)]">
          <Layers size={14} className="text-indigo-500 mr-2 rtl:mr-0 rtl:ml-2" />
          <div className="relative flex items-center group">
            <select value={contextVals.ledger_id} onChange={e => {
                setContextVals({...contextVals, ledger_id: e.target.value});
                setRawData([]); // clear data on ledger change
                setDrillPath({});
            }} className="bg-transparent border-none text-xs font-bold text-slate-600 group-hover:text-indigo-700 focus:ring-0 outline-none cursor-pointer appearance-none py-0 pl-1 pr-5 rtl:pr-1 rtl:pl-5">
              {lookups.ledgers.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
            </select>
          </div>
        </div>
      );
      setHeaderNode(node);
    }
    return () => { if (setHeaderNode) setHeaderNode(null); };
  }, [lookups, contextVals, setHeaderNode]);

  // --- Data Fetching Engine ---
  const fetchReportData = async () => {
      if (!contextVals?.ledger_id || mainFilters.fiscalYearIds.length === 0) {
          return alert(isRtl ? 'لطفا سال مالی و دفتر را مشخص کنید.' : 'Please select fiscal year and ledger.');
      }
      setIsFetchingData(true);
      try {
          // Build Query for Voucher Items Joined with Vouchers
          // Note: Since Supabase inner joins might have a 1000 row limit depending on config, 
          // we use standard syntax and assume API config allows fetching larger sets via .limit(100000)
          let query = supabase.schema('gl').from('voucher_items')
              .select(`
                  id, account_id, debit, credit, currency_code, op_rate, op_is_reverse, op_debit, op_credit, 
                  rep1_rate, rep1_is_reverse, rep1_debit, rep1_credit, rep2_rate, rep2_is_reverse, rep2_debit, rep2_credit,
                  tracking_number, tracking_date, quantity, description, details, row_number,
                  vouchers!inner (
                      id, branch_id, voucher_date, voucher_number, daily_number, cross_reference, subsidiary_number,
                      voucher_type, status, fiscal_year_id, fiscal_period_id, created_by, reviewed_by, description
                  )
              `)
              .eq('vouchers.ledger_id', contextVals.ledger_id)
              .in('vouchers.fiscal_year_id', mainFilters.fiscalYearIds)
              .in('vouchers.status', advFilters.docStatus ? [advFilters.docStatus] : ['temporary', 'reviewed', 'finalized', 'final']) // Exclude drafts naturally
              .limit(50000); 

          // Apply Main Filters
          if (mainFilters.timeRangeType === 'period') {
              if (mainFilters.fromPeriodId) {
                  const fp = lookups.fiscalPeriods.find(p => String(p.id) === String(mainFilters.fromPeriodId));
                  if (fp) query = query.gte('vouchers.voucher_date', fp.start_date);
              }
              if (mainFilters.toPeriodId) {
                  const tp = lookups.fiscalPeriods.find(p => String(p.id) === String(mainFilters.toPeriodId));
                  if (tp) query = query.lte('vouchers.voucher_date', tp.end_date);
              }
          } else if (mainFilters.timeRangeType === 'date') {
              if (mainFilters.fromDate) query = query.gte('vouchers.voucher_date', mainFilters.fromDate);
              if (mainFilters.toDate) query = query.lte('vouchers.voucher_date', mainFilters.toDate);
          }
          if (mainFilters.docType) query = query.eq('vouchers.voucher_type', mainFilters.docType);

          // Apply Advanced Filters (Header level)
          if (advFilters.docNoFrom) query = query.gte('vouchers.voucher_number', advFilters.docNoFrom);
          if (advFilters.docNoTo) query = query.lte('vouchers.voucher_number', advFilters.docNoTo);
          if (advFilters.crossNoFrom) query = query.gte('vouchers.cross_reference', advFilters.crossNoFrom);
          if (advFilters.crossNoTo) query = query.lte('vouchers.cross_reference', advFilters.crossNoTo);
          if (advFilters.subNo) query = query.eq('vouchers.subsidiary_number', advFilters.subNo); // Simplified for =, in real app parse >, < etc.
          if (advFilters.creatorId) query = query.eq('vouchers.created_by', advFilters.creatorId);
          if (advFilters.reviewerId) query = query.eq('vouchers.reviewed_by', advFilters.reviewerId);
          if (advFilters.headerDesc) query = query.ilike('vouchers.description', `%${advFilters.headerDesc}%`);

          // Item Level Advanced Filters
          if (advFilters.trackingNo) query = query.eq('tracking_number', advFilters.trackingNo);
          if (advFilters.itemDesc) query = query.ilike('description', `%${advFilters.itemDesc}%`);

          const { data, error } = await query;
          if (error) throw error;

          // Post-processing for filters that are hard to do in PostgREST natively (like JSONB or Account metadata)
          let finalData = data || [];

          if (mainFilters.accountType || advFilters.accStatus || advFilters.featCurrency || advFilters.featTracking || advFilters.featQty) {
              finalData = finalData.filter(row => {
                  const acc = lookups.accMap[row.account_id];
                  if (!acc) return false;
                  
                  if (mainFilters.accountType && acc.account_type !== mainFilters.accountType) return false;
                  if (advFilters.accStatus === 'active' && !acc.is_active) return false;
                  if (advFilters.accStatus === 'inactive' && acc.is_active) return false;

                  if (advFilters.featCurrency || advFilters.featTracking || advFilters.featQty) {
                      const meta = typeof acc.metadata === 'string' ? JSON.parse(acc.metadata || '{}') : (acc.metadata || {});
                      if (advFilters.featCurrency && !meta.currencyFeature) return false;
                      if (advFilters.featTracking && !meta.trackFeature) return false;
                      if (advFilters.featQty && !meta.qtyFeature) return false;
                  }
                  return true;
              });
          }

          setRawData(finalData);
          setDrillPath({}); // Reset drill down on new fetch
      } catch (err) {
          console.error("Error fetching report data:", err);
          alert(isRtl ? 'خطا در واکشی اطلاعات.' : 'Error fetching report data.');
      } finally {
          setIsFetchingData(false);
          setIsAdvFilterOpen(false);
      }
  };

  // --- Aggregation Engine ---
  const reportData = useMemo(() => {
      if (rawData.length === 0) return [];

      // 1. Filter raw data based on current Drill Path
      let filteredData = rawData;
      if (drillPath.branch) filteredData = filteredData.filter(d => drillPath.branch.includes(d.vouchers.branch_id));
      if (drillPath.group) filteredData = filteredData.filter(d => drillPath.group.includes(lookups.accMap[d.account_id]?.parentGroup?.id));
      if (drillPath.col) filteredData = filteredData.filter(d => drillPath.col.includes(lookups.accMap[d.account_id]?.parentCol?.id));
      if (drillPath.moe) filteredData = filteredData.filter(d => drillPath.moe.includes(d.account_id));
      if (drillPath.currency) filteredData = filteredData.filter(d => drillPath.currency.includes(d.currency_code));
      if (drillPath.tracking) filteredData = filteredData.filter(d => drillPath.tracking.includes(d.tracking_number));
      
      if (drillPath.detail) {
          filteredData = filteredData.filter(d => {
              const detailsObj = typeof d.details === 'string' ? JSON.parse(d.details || '{}') : (d.details || {});
              const selDet = detailsObj.selected_details || {};
              return Object.values(selDet).some(id => drillPath.detail.includes(id));
          });
      }

      // If tab is transactions (ریز گردش), return raw formatted lines
      if (activeTab === 'transactions') {
          return filteredData.sort((a,b) => {
              const dateDiff = new Date(a.vouchers.voucher_date) - new Date(b.vouchers.voucher_date);
              if (dateDiff !== 0) return dateDiff;
              return (a.vouchers.voucher_number || 0) - (b.vouchers.voucher_number || 0);
          }).map(d => {
              let dAmount = 0, cAmount = 0;
              if (baseCurrencyMode === 'op') { dAmount = parseNumber(d.op_debit); cAmount = parseNumber(d.op_credit); }
              else if (baseCurrencyMode === 'rep1') { dAmount = parseNumber(d.rep1_debit); cAmount = parseNumber(d.rep1_credit); }
              else if (baseCurrencyMode === 'rep2') { dAmount = parseNumber(d.rep2_debit); cAmount = parseNumber(d.rep2_credit); }
              
              return {
                  _id: d.id, voucher_id: d.vouchers.id, doc_no: d.vouchers.voucher_number, date: d.vouchers.voucher_date,
                  doc_type: d.vouchers.voucher_type, description: d.description || d.vouchers.description,
                  debit: dAmount, credit: cAmount, 
                  account: lookups.accMap[d.account_id]?.title || '-'
              };
          });
      }

      // Aggregation Map
      const aggMap = new Map();

      filteredData.forEach(d => {
          let dAmount = 0, cAmount = 0;
          if (baseCurrencyMode === 'op') { dAmount = parseNumber(d.op_debit); cAmount = parseNumber(d.op_credit); }
          else if (baseCurrencyMode === 'rep1') { dAmount = parseNumber(d.rep1_debit); cAmount = parseNumber(d.rep1_credit); }
          else if (baseCurrencyMode === 'rep2') { dAmount = parseNumber(d.rep2_debit); cAmount = parseNumber(d.rep2_credit); }

          // Determine grouping Key & Info based on active tab
          let keys = []; 

          if (activeTab === 'branch') {
              const bId = d.vouchers.branch_id;
              const b = lookups.branches.find(x => x.id === bId);
              keys.push({ id: bId, code: b?.code || '-', title: b?.title || 'No Branch' });
          } else if (activeTab === 'group') {
              const grp = lookups.accMap[d.account_id]?.parentGroup;
              if (grp) keys.push({ id: grp.id, code: grp.code, title: grp.title });
          } else if (activeTab === 'col') {
              const col = lookups.accMap[d.account_id]?.parentCol;
              if (col) keys.push({ id: col.id, code: col.code, title: col.title });
          } else if (activeTab === 'moe') {
              const moe = lookups.accMap[d.account_id];
              if (moe) keys.push({ id: moe.id, code: moe.code, title: moe.title });
          } else if (activeTab === 'detail') {
              const detailsObj = typeof d.details === 'string' ? JSON.parse(d.details || '{}') : (d.details || {});
              const selDet = detailsObj.selected_details || {};
              Object.values(selDet).forEach(detId => {
                  const det = lookups.allDetailInstances.find(x => String(x.id) === String(detId));
                  if (det) keys.push({ id: det.id, code: det.detail_code || '-', title: det.title });
              });
          } else if (activeTab === 'currency') {
              const currCode = d.currency_code || '-';
              const curr = lookups.currencies.find(c => c.code === currCode);
              keys.push({ id: currCode, code: currCode, title: curr?.title || currCode });
          } else if (activeTab === 'tracking') {
              if (d.tracking_number) keys.push({ id: d.tracking_number, code: d.tracking_number, title: d.tracking_date || '-' });
          }

          keys.forEach(k => {
              if (!aggMap.has(k.id)) {
                  aggMap.set(k.id, { _id: k.id, code: k.code, title: k.title, debit: 0, credit: 0 });
              }
              const group = aggMap.get(k.id);
              group.debit += dAmount;
              group.credit += cAmount;
          });
      });

      // Post-process balances
      let results = Array.from(aggMap.values()).map(row => {
          const diff = row.debit - row.credit;
          row.balanceDebit = diff > 0 ? diff : 0;
          row.balanceCredit = diff < 0 ? Math.abs(diff) : 0;
          row.balance = Math.abs(diff);
          row.nature = diff === 0 ? '-' : (diff > 0 ? (isRtl ? 'بدهکار' : 'Debit') : (isRtl ? 'بستانکار' : 'Credit'));
          return row;
      });

      if (mainFilters.showWithBalanceOnly) {
          results = results.filter(r => r.balance > 0);
      }

      return results.sort((a,b) => String(a.code).localeCompare(String(b.code)));

  }, [rawData, activeTab, drillPath, baseCurrencyMode, mainFilters.showWithBalanceOnly, lookups]);

  // Calculate running balance for transactions tab
  const transactionsWithBalance = useMemo(() => {
      if (activeTab !== 'transactions') return reportData;
      let runningSum = 0;
      return reportData.map(row => {
          runningSum += (row.debit - row.credit);
          return { 
              ...row, 
              balance: Math.abs(runningSum),
              nature: runningSum === 0 ? '-' : (runningSum > 0 ? (isRtl ? 'بد' : 'Dr') : (isRtl ? 'بس' : 'Cr'))
          };
      });
  }, [reportData, activeTab, isRtl]);


  const handleRowSelect = (id) => {
      if (activeTab === 'transactions') return; // Cannot drill further
      
      const newPath = { ...drillPath };
      if (!newPath[activeTab]) newPath[activeTab] = [];
      
      if (newPath[activeTab].includes(id)) {
          newPath[activeTab] = newPath[activeTab].filter(x => x !== id);
      } else {
          newPath[activeTab].push(id);
      }
      setDrillPath(newPath);
  };

  const removeDrillFilter = (tab, id) => {
      const newPath = { ...drillPath };
      newPath[tab] = newPath[tab].filter(x => x !== id);
      if (newPath[tab].length === 0) delete newPath[tab];
      setDrillPath(newPath);
  };

  // --- UI Renders ---
  if (isAppLoading || !lookups) {
      return <div className="h-full flex items-center justify-center bg-slate-50"><div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div></div>;
  }

  // Generate Columns dynamically
  const getColumns = () => {
      if (activeTab === 'transactions') {
          return [
              { field: 'doc_no', header: t.colDocNo, width: 'w-20', className: 'text-center font-mono font-bold text-indigo-700 hover:underline cursor-pointer', render: (r) => <span onClick={()=>setSelectedVoucherId(r.voucher_id)}>{r.doc_no || '-'}</span> },
              { field: 'date', header: t.colDate, width: 'w-24', className: 'text-center font-mono text-slate-600 dir-ltr' },
              { field: 'account', header: t.tabMoe, width: 'w-48', className: 'truncate', render: (r) => <span title={r.account}>{r.account}</span> },
              { field: 'description', header: t.colDesc, width: 'w-64', className: 'truncate', render: (r) => <span title={r.description}>{r.description}</span> },
              { field: 'debit', header: t.colDebit, width: 'w-32', className: 'text-left dir-ltr font-mono text-slate-800', render: (r) => formatNumber(r.debit) },
              { field: 'credit', header: t.colCredit, width: 'w-32', className: 'text-left dir-ltr font-mono text-slate-800', render: (r) => formatNumber(r.credit) },
              { field: 'balance', header: t.colBalance, width: 'w-32', className: 'text-left dir-ltr font-mono font-bold text-indigo-700', render: (r) => formatNumber(r.balance) },
              { field: 'nature', header: t.colNature, width: 'w-16', className: 'text-center font-bold text-slate-500' },
          ];
      }

      return [
          { field: 'code', header: t.colCode, width: 'w-24', className: 'font-mono text-slate-600', sortable: true },
          { field: 'title', header: t.colTitle, width: 'w-64', sortable: true, render: (r) => <span className="font-bold text-slate-700">{r.title}</span> },
          { field: 'debit', header: t.colDebit, width: 'w-36', className: 'text-left dir-ltr font-mono', render: (r) => formatNumber(r.debit) },
          { field: 'credit', header: t.colCredit, width: 'w-36', className: 'text-left dir-ltr font-mono', render: (r) => formatNumber(r.credit) },
          { field: 'balanceDebit', header: t.colBalanceDebit, width: 'w-36', className: 'text-left dir-ltr font-mono font-bold text-emerald-600', render: (r) => r.balanceDebit > 0 ? formatNumber(r.balanceDebit) : '' },
          { field: 'balanceCredit', header: t.colBalanceCredit, width: 'w-36', className: 'text-left dir-ltr font-mono font-bold text-rose-600', render: (r) => r.balanceCredit > 0 ? formatNumber(r.balanceCredit) : '' },
          { field: 'nature', header: t.colNature, width: 'w-20', className: 'text-center text-xs font-bold text-slate-500' }
      ];
  };

  // Footer Sum calculation
  const totalSums = transactionsWithBalance.reduce((acc, row) => {
      acc.debit += row.debit || 0;
      acc.credit += row.credit || 0;
      if (activeTab !== 'transactions') {
          acc.balDebit += row.balanceDebit || 0;
          acc.balCredit += row.balanceCredit || 0;
      }
      return acc;
  }, { debit: 0, credit: 0, balDebit: 0, balCredit: 0 });

  const renderFilterChips = () => {
      let chips = [];
      Object.keys(drillPath).forEach(tabKey => {
          drillPath[tabKey].forEach(id => {
              let label = id;
              if (tabKey === 'branch') label = lookups.branches.find(x => x.id === id)?.title;
              if (tabKey === 'group' || tabKey === 'col' || tabKey === 'moe') label = lookups.accMap[id]?.title;
              if (tabKey === 'detail') label = lookups.allDetailInstances.find(x => String(x.id) === String(id))?.title;
              if (tabKey === 'currency') label = lookups.currencies.find(x => x.code === id)?.title || id;
              
              chips.push(
                  <div key={`${tabKey}-${id}`} className="flex items-center gap-1.5 bg-indigo-100 text-indigo-800 text-[11px] px-2.5 py-1 rounded-full font-bold border border-indigo-200 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                     <span className="text-indigo-500 text-[9px]">{tabs.find(t=>t.id===tabKey)?.label}:</span>
                     <span className="truncate max-w-[150px]">{label}</span>
                     <X size={12} className="cursor-pointer hover:text-red-500 transition-colors" onClick={() => removeDrillFilter(tabKey, id)}/>
                  </div>
              );
          });
      });
      return chips;
  };

  return (
    <div className={`flex flex-col h-full bg-slate-50/50 p-4 md:p-6 ${isRtl ? 'font-vazir dir-rtl' : 'font-sans dir-ltr'}`}>
        
        {/* Header Title */}
        <div className="flex items-center justify-between mb-4 shrink-0">
           <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200">
                 <Calculator size={24} />
              </div>
              <div>
                 <h1 className="text-xl font-black text-slate-800">{t.title}</h1>
                 <p className="text-xs text-slate-500 font-medium mt-1">{t.subtitle}</p>
              </div>
           </div>
           <div className="flex gap-2">
              <Button variant="outline" icon={Printer} title={t.print} className="hidden sm:flex" />
              <Button variant="outline" icon={Download} title={t.export} className="hidden sm:flex" />
           </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-4 shrink-0 flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 gap-4 items-end">
                <SelectField label={t.mainCurrency} value={baseCurrencyMode} onChange={e => setBaseCurrencyMode(e.target.value)} isRtl={isRtl}>
                    <option value="op">{isRtl ? 'عملیاتی' : 'Operational'} ({lookups.currencyGlobals?.op_currency})</option>
                    {lookups.currencyGlobals?.rep1_currency && <option value="rep1">{isRtl ? 'گزارشگری ۱' : 'Reporting 1'} ({lookups.currencyGlobals.rep1_currency})</option>}
                    {lookups.currencyGlobals?.rep2_currency && <option value="rep2">{isRtl ? 'گزارشگری ۲' : 'Reporting 2'} ({lookups.currencyGlobals.rep2_currency})</option>}
                </SelectField>

                <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-500">{t.fiscalYear}</span>
                    <select multiple className="border border-slate-200 rounded bg-slate-50 h-10 text-[11px] p-1 outline-none focus:border-indigo-400" value={mainFilters.fiscalYearIds} onChange={e => setMainFilters({...mainFilters, fiscalYearIds: Array.from(e.target.selectedOptions, option => option.value)})}>
                        {lookups.fiscalYears.map(y => <option key={y.id} value={y.id}>{y.title}</option>)}
                    </select>
                </div>

                <SelectField label={t.timeRangeType} value={mainFilters.timeRangeType} onChange={e => setMainFilters({...mainFilters, timeRangeType: e.target.value})} isRtl={isRtl}>
                    <option value="period">{t.periodRange}</option>
                    <option value="date">{t.dateRange}</option>
                </SelectField>

                {mainFilters.timeRangeType === 'period' ? (
                    <>
                       <SelectField label={t.fromPeriod} value={mainFilters.fromPeriodId} onChange={e => setMainFilters({...mainFilters, fromPeriodId: e.target.value})} isRtl={isRtl}>
                           <option value="">{t.all}</option>
                           {lookups.fiscalPeriods.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                       </SelectField>
                       <SelectField label={t.toPeriod} value={mainFilters.toPeriodId} onChange={e => setMainFilters({...mainFilters, toPeriodId: e.target.value})} isRtl={isRtl}>
                           <option value="">{t.all}</option>
                           {lookups.fiscalPeriods.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                       </SelectField>
                    </>
                ) : (
                    <>
                       <InputField type="date" label={t.fromDate} value={mainFilters.fromDate} onChange={e => setMainFilters({...mainFilters, fromDate: e.target.value})} isRtl={isRtl} />
                       <InputField type="date" label={t.toDate} value={mainFilters.toDate} onChange={e => setMainFilters({...mainFilters, toDate: e.target.value})} isRtl={isRtl} />
                    </>
                )}

                <SelectField label={t.docType} value={mainFilters.docType} onChange={e => setMainFilters({...mainFilters, docType: e.target.value})} isRtl={isRtl}>
                    <option value="">{t.all}</option>
                    {lookups.docTypes.map(d => <option key={d.id} value={d.code}>{d.title}</option>)}
                </SelectField>

                <div className="flex gap-2 w-full">
                    <Button variant="secondary" onClick={() => setIsAdvFilterOpen(true)} icon={Filter} className="flex-1 h-9 mb-1" title={t.advancedFilters}>{t.advancedFilters}</Button>
                    <Button variant="primary" onClick={fetchReportData} icon={RefreshCw} className="flex-1 h-9 mb-1" isLoading={isFetchingData}>{t.fetchData}</Button>
                </div>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
               <div className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" id="chkBal" className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer" checked={mainFilters.showWithBalanceOnly} onChange={e => setMainFilters({...mainFilters, showWithBalanceOnly: e.target.checked})} />
                  <label htmlFor="chkBal" className="cursor-pointer select-none font-bold">{t.showWithBalanceOnly}</label>
               </div>
               
               <div className="flex flex-wrap items-center gap-2">
                   {renderFilterChips()}
               </div>
            </div>
        </div>

        {/* Tabs & Grid Area */}
        <div className="flex-1 flex flex-col min-h-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Tabs Header */}
            <div className="flex items-center overflow-x-auto custom-scrollbar bg-slate-50 border-b border-slate-200 shrink-0">
                {tabs.map(tab => (
                    <button 
                       key={tab.id} 
                       onClick={() => setActiveTab(tab.id)}
                       className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap outline-none ${activeTab === tab.id ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-hidden relative flex flex-col">
               {isFetchingData ? (
                   <div className="absolute inset-0 z-10 bg-white/50 backdrop-blur-sm flex items-center justify-center">
                       <div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
                   </div>
               ) : null}

               <DataGrid 
                  columns={getColumns()} 
                  data={transactionsWithBalance} 
                  isRtl={isRtl} 
                  selectedIds={drillPath[activeTab] || []}
                  onSelectRow={handleRowSelect}
               />
               
               {/* Fixed Summary Footer */}
               <div className="bg-slate-100 border-t border-slate-300 p-2 shrink-0 flex items-center">
                  <div className="flex-1 font-black text-slate-700 px-4">{t.sum}:</div>
                  <div className="flex w-full max-w-[calc(100%-250px)]">
                     {activeTab === 'transactions' ? (
                         <>
                             <div className="flex-1"></div>
                             <div className="w-32 text-left dir-ltr font-mono font-black text-indigo-800 px-3">{formatNumber(totalSums.debit)}</div>
                             <div className="w-32 text-left dir-ltr font-mono font-black text-indigo-800 px-3">{formatNumber(totalSums.credit)}</div>
                             <div className="w-32"></div>
                             <div className="w-16"></div>
                         </>
                     ) : (
                         <>
                             <div className="w-36 text-left dir-ltr font-mono font-black text-indigo-800 px-3">{formatNumber(totalSums.debit)}</div>
                             <div className="w-36 text-left dir-ltr font-mono font-black text-indigo-800 px-3">{formatNumber(totalSums.credit)}</div>
                             <div className="w-36 text-left dir-ltr font-mono font-black text-emerald-700 px-3">{formatNumber(totalSums.balDebit)}</div>
                             <div className="w-36 text-left dir-ltr font-mono font-black text-rose-700 px-3">{formatNumber(totalSums.balCredit)}</div>
                             <div className="w-20"></div>
                         </>
                     )}
                  </div>
               </div>
            </div>
        </div>

        {/* Advanced Filters Modal */}
        <Modal isOpen={isAdvFilterOpen} onClose={() => setIsAdvFilterOpen(false)} title={t.advancedFilters} size="lg" footer={<><Button variant="ghost" onClick={() => setIsAdvFilterOpen(false)}>{t.cancel}</Button><Button variant="primary" onClick={() => {setIsAdvFilterOpen(false); fetchReportData();}} icon={Filter}>{t.apply}</Button></>}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-2">
                <div className="md:col-span-2 flex gap-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="font-bold text-slate-600 text-sm flex items-center">{t.advFeatures}:</span>
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700"><input type="checkbox" checked={advFilters.featCurrency} onChange={e => setAdvFilters({...advFilters, featCurrency: e.target.checked})} className="rounded text-indigo-600 focus:ring-indigo-500" />{t.featCurrency}</label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700"><input type="checkbox" checked={advFilters.featTracking} onChange={e => setAdvFilters({...advFilters, featTracking: e.target.checked})} className="rounded text-indigo-600 focus:ring-indigo-500" />{t.featTracking}</label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700"><input type="checkbox" checked={advFilters.featQty} onChange={e => setAdvFilters({...advFilters, featQty: e.target.checked})} className="rounded text-indigo-600 focus:ring-indigo-500" />{t.featQty}</label>
                </div>

                <InputField label={t.docNoFrom} value={advFilters.docNoFrom} onChange={e => setAdvFilters({...advFilters, docNoFrom: e.target.value})} isRtl={isRtl} dir="ltr" />
                <InputField label={t.docNoTo} value={advFilters.docNoTo} onChange={e => setAdvFilters({...advFilters, docNoTo: e.target.value})} isRtl={isRtl} dir="ltr" />
                <InputField label={t.crossNoFrom} value={advFilters.crossNoFrom} onChange={e => setAdvFilters({...advFilters, crossNoFrom: e.target.value})} isRtl={isRtl} dir="ltr" />
                <InputField label={t.crossNoTo} value={advFilters.crossNoTo} onChange={e => setAdvFilters({...advFilters, crossNoTo: e.target.value})} isRtl={isRtl} dir="ltr" />
                <InputField label={t.subNo} value={advFilters.subNo} onChange={e => setAdvFilters({...advFilters, subNo: e.target.value})} isRtl={isRtl} dir="ltr" />
                
                <SelectField label={t.docStatus} value={advFilters.docStatus} onChange={e => setAdvFilters({...advFilters, docStatus: e.target.value})} isRtl={isRtl}>
                    <option value="">{t.all}</option>
                    <option value="temporary">{t.statusTemp}</option>
                    <option value="reviewed">{t.statusRev}</option>
                    <option value="finalized">{t.statusFin}</option>
                </SelectField>
                
                <SelectField label={t.accStatus} value={advFilters.accStatus} onChange={e => setAdvFilters({...advFilters, accStatus: e.target.value})} isRtl={isRtl}>
                    <option value="">{t.all}</option>
                    <option value="active">{t.active}</option>
                    <option value="inactive">{t.inactive}</option>
                </SelectField>

                <SelectField label={t.creator} value={advFilters.creatorId} onChange={e => setAdvFilters({...advFilters, creatorId: e.target.value})} isRtl={isRtl}>
                    <option value="">{t.all}</option>
                    {lookups?.users?.map(u => <option key={u.id} value={u.id}>{u.title || u.email}</option>)}
                </SelectField>

                <SelectField label={t.reviewer} value={advFilters.reviewerId} onChange={e => setAdvFilters({...advFilters, reviewerId: e.target.value})} isRtl={isRtl}>
                    <option value="">{t.all}</option>
                    {lookups?.users?.map(u => <option key={u.id} value={u.id}>{u.title || u.email}</option>)}
                </SelectField>

                <InputField label={t.trackingNo} value={advFilters.trackingNo} onChange={e => setAdvFilters({...advFilters, trackingNo: e.target.value})} isRtl={isRtl} dir="ltr" />
                <InputField label={t.headerDesc} value={advFilters.headerDesc} onChange={e => setAdvFilters({...advFilters, headerDesc: e.target.value})} isRtl={isRtl} />
                <div className="md:col-span-2">
                   <InputField label={t.itemDesc} value={advFilters.itemDesc} onChange={e => setAdvFilters({...advFilters, itemDesc: e.target.value})} isRtl={isRtl} />
                </div>
            </div>
        </Modal>

        {/* Voucher View Modal */}
        {selectedVoucherId && (
            <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 md:p-8 overflow-hidden">
                <div className="bg-white w-full h-full rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex-1 overflow-hidden relative">
                        {window.VoucherForm ? (
                            <window.VoucherForm 
                                voucherId={selectedVoucherId} 
                                isCopy={false} 
                                contextVals={contextVals} 
                                lookups={lookups} 
                                language={language}
                                onClose={() => setSelectedVoucherId(null)} 
                            />
                        ) : (
                            <div className="p-10 flex flex-col items-center justify-center text-slate-500 h-full">
                                <p>VoucherForm Component Not Found</p>
                                <Button variant="outline" className="mt-4" onClick={() => setSelectedVoucherId(null)}>{t.cancel}</Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

window.AccountReview = AccountReview;
export default AccountReview;
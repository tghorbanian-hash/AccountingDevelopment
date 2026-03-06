/* Filename: financial/generalledger/AccountReview.js */
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Layers, ChevronDown, ChevronUp,
  Printer, Download, X, Calculator, Eye, Trash2
} from 'lucide-react';

const AccountReview = ({ language = 'fa', setHeaderNode }) => {
  const isRtl = language === 'fa';
  const UI = window.UI || {};
  const { Button, InputField, SelectField, DataGrid, FilterSection, Badge, Modal } = UI;
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
    clearAll: isRtl ? 'حذف همه فیلترها' : 'Clear All Filters',
    actions: isRtl ? 'عملیات' : 'Actions',
    viewDoc: isRtl ? 'مشاهده سند' : 'View Document',
    
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
    ledger: isRtl ? 'دفتر مالی' : 'Ledger',
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
    
    moreFilters: isRtl ? 'فیلترهای بیشتر' : 'More Filters',
    lessFilters: isRtl ? 'فیلترهای کمتر' : 'Less Filters',

    // Adv Filters
    advFeatures: isRtl ? 'ویژگی‌های حساب' : 'Account Features',
    featCurrency: isRtl ? 'ارزی' : 'Currency Feat',
    featTracking: isRtl ? 'پیگیری' : 'Tracking Feat',
    featQty: isRtl ? 'مقداری' : 'Qty Feat',
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
    headerDesc: isRtl ? 'شرح سربرگ' : 'Header Desc',
    itemDesc: isRtl ? 'شرح قلم' : 'Item Desc',
    all: isRtl ? 'همه' : 'All',
    active: isRtl ? 'فعال' : 'Active',
    inactive: isRtl ? 'غیرفعال' : 'Inactive',

    // Grid Columns
    colCode: isRtl ? 'کد' : 'Code',
    colTitle: isRtl ? 'عنوان' : 'Title',
    colDetailType: isRtl ? 'نوع تفصیل' : 'Detail Type',
    colDebit: isRtl ? 'گردش بدهکار' : 'Debit Turnover',
    colCredit: isRtl ? 'گردش بستانکار' : 'Credit Turnover',
    colBalanceDebit: isRtl ? 'مانده بدهکار' : 'Debit Balance',
    colBalanceCredit: isRtl ? 'مانده بستانکار' : 'Credit Balance',
    colBalance: isRtl ? 'مانده نهایی' : 'Final Balance',
    colNature: isRtl ? 'ماهیت' : 'Nature',
    colDate: isRtl ? 'تاریخ' : 'Date',
    colDocNo: isRtl ? 'ش.سند' : 'Doc No',
    colDesc: isRtl ? 'شرح قلم' : 'Description',
    sum: isRtl ? 'جمع کل' : 'Total',
    
    statusTemp: isRtl ? 'موقت' : 'Temporary',
    statusRev: isRtl ? 'بررسی شده' : 'Reviewed',
    statusFin: isRtl ? 'قطعی شده' : 'Finalized',
  };

  const tabSingular = isRtl ? {
      branch: 'شعبه', group: 'گروه', col: 'کل', moe: 'معین', detail: 'تفصیل', currency: 'ارز', tracking: 'پیگیری'
  } : {
      branch: 'Branch', group: 'Group', col: 'General', moe: 'Subsidiary', detail: 'Detail', currency: 'Currency', tracking: 'Tracking'
  };

  // --- States ---
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [lookups, setLookups] = useState(null);

  useEffect(() => {
     if (setHeaderNode) setHeaderNode(null);
     return () => { if (setHeaderNode) setHeaderNode(null); };
  }, [setHeaderNode]);

  const [rawData, setRawData] = useState([]); 

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [baseCurrencyMode, setBaseCurrencyMode] = useState('op'); 
  const [showWithBalanceOnly, setShowWithBalanceOnly] = useState(false);
  
  const defaultMainFilters = {
      ledgerId: '', fiscalYearId: '', timeRangeType: 'period', fromPeriodId: '', toPeriodId: '',
      fromDate: '', toDate: '', docType: '', accountType: ''
  };
  const [mainFilters, setMainFilters] = useState(defaultMainFilters);
  
  const defaultAdvFilters = {
      featCurrency: false, featTracking: false, featQty: false,
      docNoFrom: '', docNoTo: '', crossNoFrom: '', crossNoTo: '', subNo: '',
      accStatus: '', docStatus: '', creatorId: '', reviewerId: '',
      trackingNo: '', headerDesc: '', itemDesc: ''
  };
  const [advFilters, setAdvFilters] = useState(defaultAdvFilters);

  // Safely define contextVals to prevent crashes in sub-modals
  const currentContextVals = useMemo(() => {
      return {
          ledger_id: mainFilters.ledgerId,
          fiscal_year_id: mainFilters.fiscalYearId
      };
  }, [mainFilters.ledgerId, mainFilters.fiscalYearId]);

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
  const [drillPath, setDrillPath] = useState({});
  
  const [selectedVoucherId, setSelectedVoucherId] = useState(null);
  const [voucherToPrint, setVoucherToPrint] = useState(null);
  const [isMainPrintOpen, setIsMainPrintOpen] = useState(false);

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
                branches, ledgers, accounts, accountStructures, allDetailInstances, detailTypes, docTypes, 
                currencies, fiscalYears, fiscalPeriods, users
            ] = await Promise.all([
                fetchSafe('gen', 'branches'),
                fetchSafe('gl', 'ledgers'),
                fetchSafe('gl', 'accounts'),
                fetchSafe('gl', 'account_structures'), 
                fetchSafe('gl', 'detail_instances'),
                fetchSafe('gl', 'detail_types'),
                fetchSafe('gl', 'doc_types'), 
                fetchSafe('gen', 'currencies'),
                fetchSafe('gl', 'fiscal_years'),
                fetchSafe('gl', 'fiscal_periods'),
                fetchSafe('gen', 'users') 
            ]);

            let orgInfo = { name: isRtl ? 'نام سازمان تنظیم نشده' : 'Organization Name' };
            try {
                const { data: orgData } = await supabase.schema('gen').from('organization_info').select('*').limit(1).maybeSingle();
                if (orgData) orgInfo = orgData;
            } catch(e) {}

            let currentUser = { full_name: 'کاربر' };
            try {
                const { data: authData } = await supabase.auth.getUser();
                if (authData?.user?.id) {
                    const { data: userRec } = await supabase.schema('gen').from('users').select('*').eq('id', authData.user.id).single();
                    if (userRec) currentUser = userRec;
                }
            } catch(e) {}

            let currencyGlobals = {};
            try {
                const { data } = await supabase.schema('gen').from('currency_globals').select('*').limit(1).maybeSingle();
                if(data) currencyGlobals = data;
            } catch(e){}

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

            setMainFilters(prev => ({ 
                ...prev, 
                ledgerId: activeLedger.id || '',
                fiscalYearId: activeYear.id || '' 
            }));

            setLookups({
                branches, ledgers, accounts, accountStructures, accMap, allDetailInstances, detailTypes,
                docTypes, currencies, currencyGlobals, fiscalYears, fiscalPeriods, users, orgInfo, currentUser,
                permissions: { actions: ['view', 'print', 'attach'], allowed_branches: [], allowed_ledgers: [] }
            });
        } catch (err) {
            console.error("Init error:", err);
        } finally {
            setIsAppLoading(false);
        }
    };
    initApp();
  }, []);

  // --- Data Fetching Engine ---
  const fetchReportData = async () => {
      if (!mainFilters.ledgerId || !mainFilters.fiscalYearId) {
          return alert(isRtl ? 'لطفا سال مالی و دفتر را مشخص کنید.' : 'Please select fiscal year and ledger.');
      }
      setIsFetchingData(true);
      try {
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
              .eq('vouchers.ledger_id', mainFilters.ledgerId)
              .eq('vouchers.fiscal_year_id', mainFilters.fiscalYearId)
              .in('vouchers.status', advFilters.docStatus ? [advFilters.docStatus] : ['temporary', 'reviewed', 'finalized', 'final'])
              .limit(50000); 

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
          if (advFilters.docNoFrom) query = query.gte('vouchers.voucher_number', advFilters.docNoFrom);
          if (advFilters.docNoTo) query = query.lte('vouchers.voucher_number', advFilters.docNoTo);
          if (advFilters.crossNoFrom) query = query.gte('vouchers.cross_reference', advFilters.crossNoFrom);
          if (advFilters.crossNoTo) query = query.lte('vouchers.cross_reference', advFilters.crossNoTo);
          if (advFilters.subNo) query = query.eq('vouchers.subsidiary_number', advFilters.subNo);
          if (advFilters.creatorId) query = query.eq('vouchers.created_by', advFilters.creatorId);
          if (advFilters.reviewerId) query = query.eq('vouchers.reviewed_by', advFilters.reviewerId);
          if (advFilters.headerDesc) query = query.ilike('vouchers.description', `%${advFilters.headerDesc}%`);
          if (advFilters.trackingNo) query = query.eq('tracking_number', advFilters.trackingNo);
          if (advFilters.itemDesc) query = query.ilike('description', `%${advFilters.itemDesc}%`);

          const { data, error } = await query;
          if (error) throw error;

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
          setDrillPath({});
      } catch (err) {
          console.error("Error fetching report data:", err);
          alert(isRtl ? 'خطا در واکشی اطلاعات.' : 'Error fetching report data.');
      } finally {
          setIsFetchingData(false);
      }
  };

  const handleClearSearch = () => {
      const activeYear = lookups.fiscalYears.find(y => y.is_active) || lookups.fiscalYears[0] || {};
      const activeLedger = lookups.ledgers.find(l => l.is_main) || lookups.ledgers[0] || {};
      setMainFilters({ ...defaultMainFilters, ledgerId: activeLedger.id, fiscalYearId: activeYear.id });
      setAdvFilters(defaultAdvFilters);
      setDrillPath({});
      setRawData([]);
  };

  const handleClearAllDrillFilters = () => {
      setDrillPath({});
  };

  // --- Aggregation Engine ---
  const reportData = useMemo(() => {
      if (rawData.length === 0) return [];

      let filteredData = rawData;

      const rowMatchesPath = (d, tabKey, selectedIds) => {
          if (!selectedIds || selectedIds.length === 0) return true;
          if (tabKey === 'branch') return selectedIds.includes(d.vouchers.branch_id);
          if (tabKey === 'group') return selectedIds.includes(lookups.accMap[d.account_id]?.parentGroup?.id);
          if (tabKey === 'col') return selectedIds.includes(lookups.accMap[d.account_id]?.parentCol?.id);
          if (tabKey === 'moe') return selectedIds.includes(d.account_id);
          if (tabKey === 'currency') return selectedIds.includes(d.currency_code || '-');
          if (tabKey === 'tracking') return selectedIds.includes(d.tracking_number);
          if (tabKey === 'detail') {
              const detailsObj = typeof d.details === 'string' ? JSON.parse(d.details || '{}') : (d.details || {});
              const selDet = detailsObj.selected_details || {};
              return Object.values(selDet).some(id => selectedIds.includes(id));
          }
          return true;
      };

      Object.keys(drillPath).forEach(tabKey => {
          if (tabKey !== activeTab) { 
              filteredData = filteredData.filter(d => rowMatchesPath(d, tabKey, drillPath[tabKey]));
          }
      });

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
                  id: d.id, // Explicit ID for internal selection
                  voucher_id: d.vouchers.id, 
                  doc_no: d.vouchers.voucher_number, 
                  date: d.vouchers.voucher_date,
                  doc_type: d.vouchers.voucher_type, 
                  description: d.description || d.vouchers.description,
                  debit: dAmount, credit: cAmount, 
                  account: lookups.accMap[d.account_id]?.title || '-'
              };
          });
      }

      const aggMap = new Map();

      filteredData.forEach(d => {
          let dAmount = 0, cAmount = 0;
          if (baseCurrencyMode === 'op') { dAmount = parseNumber(d.op_debit); cAmount = parseNumber(d.op_credit); }
          else if (baseCurrencyMode === 'rep1') { dAmount = parseNumber(d.rep1_debit); cAmount = parseNumber(d.rep1_credit); }
          else if (baseCurrencyMode === 'rep2') { dAmount = parseNumber(d.rep2_debit); cAmount = parseNumber(d.rep2_credit); }

          let keys = []; 

          if (activeTab === 'branch') {
              const bId = d.vouchers.branch_id;
              const b = lookups.branches.find(x => x.id === bId);
              keys.push({ id: bId || 'no-branch', code: b?.code || '-', title: b?.title || 'No Branch' });
          } else if (activeTab === 'group') {
              const grp = lookups.accMap[d.account_id]?.parentGroup;
              if (grp) keys.push({ id: grp.id, code: grp.full_code || grp.code, title: grp.title });
          } else if (activeTab === 'col') {
              const col = lookups.accMap[d.account_id]?.parentCol;
              if (col) keys.push({ id: col.id, code: col.full_code || col.code, title: col.title });
          } else if (activeTab === 'moe') {
              const moe = lookups.accMap[d.account_id];
              if (moe) keys.push({ id: moe.id, code: moe.full_code || moe.code, title: moe.title });
          } else if (activeTab === 'detail') {
              const detailsObj = typeof d.details === 'string' ? JSON.parse(d.details || '{}') : (d.details || {});
              const selDet = detailsObj.selected_details || {};
              Object.values(selDet).forEach(detId => {
                  const det = lookups.allDetailInstances.find(x => String(x.id) === String(detId));
                  if (det) {
                      const dt = lookups.detailTypes?.find(type => type.code === det.detail_type_code);
                      const typeTitle = dt ? dt.title : (isRtl ? 'ناشناخته' : 'Unknown');
                      keys.push({ id: det.id, code: det.detail_code || '-', title: det.title, extra: typeTitle });
                  }
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
                  aggMap.set(k.id, { id: k.id, code: k.code, title: k.title, extra: k.extra, debit: 0, credit: 0 });
              }
              const group = aggMap.get(k.id);
              group.debit += dAmount;
              group.credit += cAmount;
          });
      });

      let results = Array.from(aggMap.values()).map(row => {
          const diff = row.debit - row.credit;
          row.balanceDebit = diff > 0 ? diff : 0;
          row.balanceCredit = diff < 0 ? Math.abs(diff) : 0;
          row.balance = Math.abs(diff);
          row.nature = diff === 0 ? '-' : (diff > 0 ? (isRtl ? 'بدهکار' : 'Debit') : (isRtl ? 'بستانکار' : 'Credit'));
          return row;
      });

      if (showWithBalanceOnly) {
          results = results.filter(r => r.balance > 0);
      }

      return results.sort((a,b) => String(a.code).localeCompare(String(b.code)));

  }, [rawData, activeTab, drillPath, baseCurrencyMode, showWithBalanceOnly, lookups, isRtl]);

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

  const handleRowSelect = (id, checked) => {
      if (activeTab === 'transactions') return; 
      setDrillPath(prev => {
          const current = prev[activeTab] || [];
          return {
              ...prev,
              [activeTab]: checked ? [...current, id] : current.filter(x => x !== id)
          };
      });
  };

  const handleSelectAll = (checked) => {
      if (activeTab === 'transactions') return;
      setDrillPath(prev => ({
          ...prev,
          [activeTab]: checked ? reportData.map(r => r.id) : []
      }));
  };

  const removeDrillFilter = (tab, id) => {
      setDrillPath(prev => {
          const newPath = { ...prev };
          newPath[tab] = newPath[tab].filter(x => x !== id);
          if (newPath[tab].length === 0) delete newPath[tab];
          return newPath;
      });
  };

  // --- UI Renders ---
  if (isAppLoading || !lookups) {
      return <div className="h-full flex items-center justify-center bg-slate-50"><div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div></div>;
  }

  const getColumns = () => {
      if (activeTab === 'transactions') {
          return [
              { field: 'doc_no', header: t.colDocNo, width: 'w-20', className: 'text-center font-mono font-bold text-slate-700' },
              { field: 'date', header: t.colDate, width: 'w-24', className: 'text-center font-mono text-slate-600 dir-ltr' },
              { field: 'account', header: t.tabMoe, width: 'w-48', className: 'truncate', render: (r) => <span title={r.account}>{r.account}</span> },
              { field: 'description', header: t.colDesc, width: 'w-64', className: 'truncate', render: (r) => <span title={r.description}>{r.description}</span> },
              { field: 'debit', header: t.colDebit, width: 'w-32', className: 'text-left dir-ltr font-mono text-slate-800', render: (r) => formatNumber(r.debit) },
              { field: 'credit', header: t.colCredit, width: 'w-32', className: 'text-left dir-ltr font-mono text-slate-800', render: (r) => formatNumber(r.credit) },
              { field: 'balance', header: t.colBalance, width: 'w-32', className: 'text-left dir-ltr font-mono font-bold text-indigo-700', render: (r) => formatNumber(r.balance) },
              { field: 'nature', header: t.colNature, width: 'w-16', className: 'text-center font-bold text-slate-500' },
              { field: 'custom_actions', header: t.actions, width: 'w-24', className: 'text-center', render: (r) => (
                  <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="iconSm" icon={Eye} onClick={(e) => { e.stopPropagation(); setSelectedVoucherId(r.voucher_id); }} title={t.viewDoc} className="text-slate-400 hover:text-indigo-600" />
                      <Button variant="ghost" size="iconSm" icon={Printer} onClick={(e) => { e.stopPropagation(); setVoucherToPrint(r.voucher_id); }} title={t.print} className="text-slate-400 hover:text-indigo-600" />
                  </div>
              )}
          ];
      }

      let cols = [
          { field: 'code', header: t.colCode, width: 'w-32', className: 'font-mono text-slate-600', sortable: true },
          { field: 'title', header: t.colTitle, width: 'w-64', sortable: true, render: (r) => <span className="font-bold text-slate-700">{r.title}</span> }
      ];

      if (activeTab === 'detail') {
          cols.push({ field: 'extra', header: t.colDetailType, width: 'w-32', sortable: true, render: (r) => <Badge variant="indigo" size="sm">{r.extra}</Badge> });
      }

      cols.push(
          { field: 'debit', header: t.colDebit, width: 'w-36', className: 'text-left dir-ltr font-mono', render: (r) => formatNumber(r.debit) },
          { field: 'credit', header: t.colCredit, width: 'w-36', className: 'text-left dir-ltr font-mono', render: (r) => formatNumber(r.credit) },
          { field: 'balanceDebit', header: t.colBalanceDebit, width: 'w-36', className: 'text-left dir-ltr font-mono font-bold text-emerald-600', render: (r) => r.balanceDebit > 0 ? formatNumber(r.balanceDebit) : '' },
          { field: 'balanceCredit', header: t.colBalanceCredit, width: 'w-36', className: 'text-left dir-ltr font-mono font-bold text-rose-600', render: (r) => r.balanceCredit > 0 ? formatNumber(r.balanceCredit) : '' },
          { field: 'nature', header: t.colNature, width: 'w-20', className: 'text-center text-xs font-bold text-slate-500' }
      );

      return cols;
  };

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
              let label = String(id);
              let codeStr = '';

              if (tabKey === 'branch') {
                  const b = lookups.branches.find(x => String(x.id) === String(id));
                  if(b) { label = b.title; codeStr = b.code; }
              }
              if (tabKey === 'group' || tabKey === 'col' || tabKey === 'moe') {
                  const acc = lookups.accMap[id];
                  if(acc) { label = acc.title; codeStr = acc.full_code || acc.code; }
              }
              if (tabKey === 'detail') {
                  const det = lookups.allDetailInstances.find(x => String(x.id) === String(id));
                  if(det) { label = det.title; codeStr = det.detail_code; }
              }
              if (tabKey === 'currency') {
                  const curr = lookups.currencies.find(x => x.code === String(id));
                  if(curr) { label = curr.title; codeStr = curr.code; }
              }
              
              const displayText = codeStr ? `${label} (${codeStr})` : label;

              chips.push(
                  <div key={`${tabKey}-${id}`} className="flex items-center gap-1.5 bg-indigo-100 text-indigo-800 text-[11px] px-2.5 py-1 rounded-full font-bold border border-indigo-200 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                     <span className="text-indigo-500 text-[10px] whitespace-nowrap">{tabSingular[tabKey]}:</span>
                     <span className="truncate max-w-[200px]" title={displayText}>{displayText}</span>
                     <X size={12} className="cursor-pointer hover:text-red-500 transition-colors" onClick={() => removeDrillFilter(tabKey, id)}/>
                  </div>
              );
          });
      });
      return chips;
  };

  return (
    <div className={`flex flex-col h-full bg-slate-50/50 p-4 md:p-6 ${isRtl ? 'font-vazir dir-rtl' : 'font-sans dir-ltr'}`}>
        
        <div className="flex items-center justify-between mb-4 shrink-0">
           <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200 flex items-center justify-center shrink-0">
                 <Calculator size={24} />
              </div>
              <div>
                 <h1 className="text-xl font-black text-slate-800">{t.title}</h1>
                 <p className="text-xs text-slate-500 font-medium mt-1">{t.subtitle}</p>
              </div>
           </div>
           <div className="flex gap-2">
              <Button variant="outline" icon={Printer} title={t.print} className="hidden sm:flex" onClick={() => setIsMainPrintOpen(true)} />
              <Button variant="outline" icon={Download} title={t.export} className="hidden sm:flex" />
           </div>
        </div>

        {/* Filters Section (Standard Component + Internal Grid) */}
        <div className="shrink-0 mb-4">
            <FilterSection onSearch={fetchReportData} onClear={handleClearSearch} isRtl={isRtl} title={t.search} defaultOpen={true}>
                <div className="col-span-full grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 w-full">
                    
                    <SelectField label={t.ledger} value={mainFilters.ledgerId} onChange={e => setMainFilters({...mainFilters, ledgerId: e.target.value})} isRtl={isRtl}>
                        <option value="" disabled>-</option>
                        {lookups.ledgers.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
                    </SelectField>

                    <SelectField label={t.fiscalYear} value={mainFilters.fiscalYearId} onChange={e => setMainFilters({...mainFilters, fiscalYearId: e.target.value})} isRtl={isRtl}>
                        <option value="" disabled>-</option>
                        {lookups.fiscalYears.map(y => <option key={y.id} value={y.id}>{y.title}</option>)}
                    </SelectField>

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

                    <div className="col-span-full flex items-center justify-between border-t border-slate-100 pt-3 mt-1">
                        <Button variant="ghost" size="sm" onClick={() => setShowAdvanced(!showAdvanced)} icon={showAdvanced ? ChevronUp : ChevronDown} className="text-indigo-600 hover:text-indigo-800">
                            {showAdvanced ? t.lessFilters : t.moreFilters}
                        </Button>
                        <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] font-bold text-slate-700 bg-indigo-50/50 px-3 py-1.5 rounded-lg border border-indigo-100">
                            <input type="checkbox" className="w-4 h-4 text-indigo-600 rounded border-indigo-300 focus:ring-indigo-500" checked={showWithBalanceOnly} onChange={e => setShowWithBalanceOnly(e.target.checked)} />
                            {t.showWithBalanceOnly}
                        </label>
                    </div>

                    {showAdvanced && (
                        <>
                           <SelectField label={t.mainCurrency} value={baseCurrencyMode} onChange={e => setBaseCurrencyMode(e.target.value)} isRtl={isRtl}>
                               <option value="op">{isRtl ? 'عملیاتی' : 'Operational'} ({lookups.currencyGlobals?.op_currency})</option>
                               {lookups.currencyGlobals?.rep1_currency && <option value="rep1">{isRtl ? 'گزارشگری ۱' : 'Reporting 1'} ({lookups.currencyGlobals.rep1_currency})</option>}
                               {lookups.currencyGlobals?.rep2_currency && <option value="rep2">{isRtl ? 'گزارشگری ۲' : 'Reporting 2'} ({lookups.currencyGlobals.rep2_currency})</option>}
                           </SelectField>

                           <SelectField label={t.accountType} value={mainFilters.accountType} onChange={e => setMainFilters({...mainFilters, accountType: e.target.value})} isRtl={isRtl}>
                               <option value="">{t.all}</option>
                               <option value="دائم">{isRtl ? 'دائم' : 'Permanent'}</option>
                               <option value="موقت">{isRtl ? 'موقت' : 'Temporary'}</option>
                               <option value="انتظامی">{isRtl ? 'انتظامی' : 'Disciplinary'}</option>
                           </SelectField>

                           <div className="lg:col-span-2 xl:col-span-4 flex items-center flex-wrap gap-4 p-2 bg-slate-50 border border-slate-200 rounded h-9 mt-[18px]">
                               <span className="font-bold text-slate-500 text-[10px] tracking-wider">{t.advFeatures}:</span>
                               <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700"><input type="checkbox" checked={advFilters.featCurrency} onChange={e => setAdvFilters({...advFilters, featCurrency: e.target.checked})} className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5" />{t.featCurrency}</label>
                               <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700"><input type="checkbox" checked={advFilters.featTracking} onChange={e => setAdvFilters({...advFilters, featTracking: e.target.checked})} className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5" />{t.featTracking}</label>
                               <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700"><input type="checkbox" checked={advFilters.featQty} onChange={e => setAdvFilters({...advFilters, featQty: e.target.checked})} className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5" />{t.featQty}</label>
                           </div>

                           <InputField label={t.docNoFrom} value={advFilters.docNoFrom} onChange={e => setAdvFilters({...advFilters, docNoFrom: e.target.value})} isRtl={isRtl} dir="ltr" className="text-center" />
                           <InputField label={t.docNoTo} value={advFilters.docNoTo} onChange={e => setAdvFilters({...advFilters, docNoTo: e.target.value})} isRtl={isRtl} dir="ltr" className="text-center" />
                           <InputField label={t.crossNoFrom} value={advFilters.crossNoFrom} onChange={e => setAdvFilters({...advFilters, crossNoFrom: e.target.value})} isRtl={isRtl} dir="ltr" className="text-center" />
                           <InputField label={t.crossNoTo} value={advFilters.crossNoTo} onChange={e => setAdvFilters({...advFilters, crossNoTo: e.target.value})} isRtl={isRtl} dir="ltr" className="text-center" />
                           <InputField label={t.subNo} value={advFilters.subNo} onChange={e => setAdvFilters({...advFilters, subNo: e.target.value})} isRtl={isRtl} dir="ltr" className="text-center" />
                           
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
                               {lookups?.users?.map(u => <option key={u.id} value={u.id}>{u.title || u.email || u.username}</option>)}
                           </SelectField>

                           <SelectField label={t.reviewer} value={advFilters.reviewerId} onChange={e => setAdvFilters({...advFilters, reviewerId: e.target.value})} isRtl={isRtl}>
                               <option value="">{t.all}</option>
                               {lookups?.users?.map(u => <option key={u.id} value={u.id}>{u.title || u.email || u.username}</option>)}
                           </SelectField>

                           <InputField label={t.trackingNo} value={advFilters.trackingNo} onChange={e => setAdvFilters({...advFilters, trackingNo: e.target.value})} isRtl={isRtl} dir="ltr" />
                           <InputField label={t.headerDesc} value={advFilters.headerDesc} onChange={e => setAdvFilters({...advFilters, headerDesc: e.target.value})} isRtl={isRtl} />
                           <InputField label={t.itemDesc} value={advFilters.itemDesc} onChange={e => setAdvFilters({...advFilters, itemDesc: e.target.value})} isRtl={isRtl} />
                        </>
                    )}
                </div>
            </FilterSection>

            {Object.keys(drillPath).length > 0 && (
               <div className="flex flex-wrap items-center gap-2 mt-4 bg-slate-50 p-2 rounded-lg border border-slate-100">
                   {renderFilterChips()}
                   <button onClick={handleClearAllDrillFilters} className="text-[10px] text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-full flex items-center gap-1 font-bold transition-colors mr-auto border border-red-200">
                       <Trash2 size={12}/> {t.clearAll}
                   </button>
               </div>
            )}
        </div>

        {/* Tabs & Grid Area */}
        <div className="flex-1 flex flex-col min-h-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            
            {/* Horizontal Tabs Header */}
            <div className="flex items-center overflow-x-auto custom-scrollbar bg-slate-50 border-b border-slate-200 shrink-0">
                {tabs.map(tab => (
                    <button 
                       key={tab.id} 
                       onClick={() => setActiveTab(tab.id)}
                       className={`
                          px-5 py-3 text-[11px] font-bold border-b-2 transition-colors whitespace-nowrap outline-none
                          ${activeTab === tab.id 
                              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50' 
                              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'}
                       `}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Grid Area */}
            <div className="flex-1 overflow-hidden relative flex flex-col min-w-0">
               {isFetchingData ? (
                   <div className="absolute inset-0 z-10 bg-white/50 backdrop-blur-sm flex items-center justify-center">
                       <div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
                   </div>
               ) : null}

               <div className="flex-1 overflow-x-auto flex flex-col">
                   <div className="min-w-max flex-1 flex flex-col">
                       {/* REMOVED the actions prop here so DataGrid doesn't render duplicate column */}
                       <DataGrid 
                          columns={getColumns()} 
                          data={transactionsWithBalance} 
                          isRtl={isRtl} 
                          selectedIds={activeTab !== 'transactions' ? (drillPath[activeTab] || []) : undefined}
                          onSelectRow={activeTab !== 'transactions' ? handleRowSelect : undefined}
                          onSelectAll={activeTab !== 'transactions' ? handleSelectAll : undefined}
                       />
                       
                       {/* Exactly Aligned Custom Footer */}
                       <div className="bg-slate-100 border-t border-slate-300 p-0 shrink-0 flex items-center h-12 text-[11px]">
                          {activeTab === 'transactions' ? (
                              <>
                                 <div className="w-20 shrink-0"></div> {/* doc_no */}
                                 <div className="w-24 shrink-0"></div> {/* date */}
                                 <div className="w-48 shrink-0"></div> {/* account */}
                                 <div className="w-64 shrink-0 font-black text-slate-700 px-3 flex justify-end items-center">{t.sum}:</div> {/* desc */}
                                 <div className="w-32 shrink-0 text-left dir-ltr font-mono font-black text-indigo-800 px-3 flex items-center">{formatNumber(totalSums.debit)}</div>
                                 <div className="w-32 shrink-0 text-left dir-ltr font-mono font-black text-indigo-800 px-3 flex items-center">{formatNumber(totalSums.credit)}</div>
                                 <div className="w-32 shrink-0 text-left dir-ltr font-mono font-black text-indigo-800 px-3 flex items-center"></div> {/* bal */}
                                 <div className="w-16 shrink-0"></div> {/* nat */}
                                 <div className="w-24 shrink-0"></div> {/* actions */}
                              </>
                          ) : (
                              <>
                                 <div className="w-12 shrink-0"></div> {/* checkbox */}
                                 <div className="w-32 shrink-0"></div> {/* code */}
                                 <div className={`${activeTab === 'detail' ? 'w-96' : 'w-64'} shrink-0 font-black text-slate-700 px-3 flex justify-end items-center`}>{t.sum}:</div> {/* title */}
                                 <div className="w-36 shrink-0 text-left dir-ltr font-mono font-black text-indigo-800 px-3 flex items-center">{formatNumber(totalSums.debit)}</div>
                                 <div className="w-36 shrink-0 text-left dir-ltr font-mono font-black text-indigo-800 px-3 flex items-center">{formatNumber(totalSums.credit)}</div>
                                 <div className="w-36 shrink-0 text-left dir-ltr font-mono font-black text-emerald-700 px-3 flex items-center">{formatNumber(totalSums.balDebit)}</div>
                                 <div className="w-36 shrink-0 text-left dir-ltr font-mono font-black text-rose-700 px-3 flex items-center">{formatNumber(totalSums.balCredit)}</div>
                                 <div className="w-20 shrink-0"></div> {/* nature */}
                              </>
                          )}
                       </div>
                   </div>
               </div>
            </div>
        </div>

        {/* --- MODALS --- */}
        {selectedVoucherId && window.AccountReviewVoucherModal && (
            <window.AccountReviewVoucherModal 
                isOpen={!!selectedVoucherId} 
                voucherId={selectedVoucherId} 
                contextVals={currentContextVals} 
                lookups={lookups} 
                language={language} 
                onClose={() => setSelectedVoucherId(null)} 
                t={t}
            />
        )}

        {/* Voucher Print Modal triggered from eye icon */}
        {voucherToPrint && window.VoucherPrint && (
            <Modal isOpen={!!voucherToPrint} onClose={() => setVoucherToPrint(null)} title={t.print} size="full">
                <window.VoucherPrint voucherId={voucherToPrint} onClose={() => setVoucherToPrint(null)} />
            </Modal>
        )}

        {/* Main Report Print Modal triggered from header */}
        {isMainPrintOpen && window.AccountReviewPrint && (
            <window.AccountReviewPrint 
                isOpen={isMainPrintOpen} 
                onClose={() => setIsMainPrintOpen(false)} 
                rawData={rawData}
                drillPath={drillPath}
                lookups={lookups}
                mainFilters={mainFilters}
                advFilters={advFilters}
                baseCurrencyMode={baseCurrencyMode}
                showWithBalanceOnly={showWithBalanceOnly}
                initialTab={activeTab} 
                t={t} 
                isRtl={isRtl} 
            />
        )}
    </div>
  );
};

window.AccountReview = AccountReview;
export default AccountReview;
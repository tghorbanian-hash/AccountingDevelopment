/* Filename: financial/generalledger/VoucherPrint.js */
import React, { useState, useEffect } from 'react';
import { Loader2, Printer, X, Settings2 } from 'lucide-react';

const localTranslations = {
  en: {
    previewTitle: 'Print Preview',
    cancel: 'Cancel',
    printBtn: 'Print Voucher',
    settingsBtn: 'Settings',
    loading: 'Preparing print data...',
    notFound: 'Voucher not found.',
    fiscalYear: 'Fiscal Year:',
    financialLedger: 'Ledger:',
    branch: 'Branch:',
    voucherDate: 'Voucher Date:',
    voucherNumber: 'Voucher No:',
    dailyNumber: 'Daily No:',
    crossReference: 'Cross Ref:',
    subsidiaryNumber: 'Subsidiary No:',
    documentTitle: 'Accounting Voucher',
    generalDescription: 'General Description:',
    row: 'Row',
    accountCode: 'Account Code',
    accountTitle: 'Account Title',
    detailsColumn: 'Details',
    rowDescription: 'Description',
    trackingQty: 'Tracking/Qty',
    baseGroup: 'Base',
    opGroup: 'Operational',
    currencySimple: 'Curr',
    debitSimple: 'Debit',
    creditSimple: 'Credit',
    total: 'Total Amount:',
    issuer: 'Issuer',
    reviewer: 'Reviewer',
    approver: 'Approver',
    statusDraft: 'Draft',
    statusTemporary: 'Temporary',
    statusReviewed: 'Reviewed',
    statusFinal: 'Final',
    trackingPrefix: 'T:',
    qtyPrefix: 'Qty:',
    printSettings: 'Print Settings',
    showSubsidiaryNo: 'Show Subsidiary No',
    showTracking: 'Show Tracking & Date',
    showQuantity: 'Show Quantity',
    showBaseCurrency: 'Show Base Currency Amounts',
    showOpCurrency: 'Show Operational Currency Amounts',
    showGeneralAccount: 'Group by General Account',
    sumGeneralAccount: 'Sum General Account',
    showGroupAccount: 'Group by Group Account',
    sumGroupAccount: 'Sum Group Account',
    showDetails: 'Show Details',
    showDetailsColumn: 'Show Details in Separate Column',
    showSignatures: 'Show Signatures Space'
  },
  fa: {
    previewTitle: 'پیش‌نمایش چاپ',
    cancel: 'انصراف',
    printBtn: 'چاپ سند',
    settingsBtn: 'تنظیمات',
    loading: 'در حال آماده‌سازی اطلاعات چاپ...',
    notFound: 'سند یافت نشد.',
    fiscalYear: 'سال مالی:',
    financialLedger: 'دفتر مالی:',
    branch: 'شعبه:',
    voucherDate: 'تاریخ سند:',
    voucherNumber: 'شماره سند:',
    dailyNumber: 'شماره روزانه:',
    crossReference: 'شماره عطف:',
    subsidiaryNumber: 'شماره فرعی:',
    documentTitle: 'سند حسابداری',
    generalDescription: 'شرح کلی:',
    row: 'ردیف',
    accountCode: 'کد حساب',
    accountTitle: 'عنوان حساب',
    detailsColumn: 'تفصیل‌ها',
    rowDescription: 'شرح ردیف',
    trackingQty: 'پیگیری/مقدار',
    baseGroup: 'مبنا',
    opGroup: 'عملیاتی',
    currencySimple: 'ارز',
    debitSimple: 'بدهکار',
    creditSimple: 'بستانکار',
    total: 'جمع کل:',
    issuer: 'صادرکننده',
    reviewer: 'بررسی‌کننده',
    approver: 'تاییدکننده',
    statusDraft: 'یادداشت',
    statusTemporary: 'موقت',
    statusReviewed: 'بررسی شده',
    statusFinal: 'قطعی شده',
    trackingPrefix: 'ت:',
    qtyPrefix: 'مقدار:',
    printSettings: 'تنظیمات چاپ',
    showSubsidiaryNo: 'نمایش شماره فرعی در سربرگ',
    showTracking: 'نمایش شماره و تاریخ پیگیری',
    showQuantity: 'نمایش مقدار',
    showBaseCurrency: 'نمایش مبالغ به ارز مبنا',
    showOpCurrency: 'نمایش مبالغ به ارز عملیاتی',
    showGeneralAccount: 'نمایش و گروه‌بندی حساب کل',
    sumGeneralAccount: 'نمایش مجموع در حساب کل',
    showGroupAccount: 'نمایش و گروه‌بندی حساب گروه',
    sumGroupAccount: 'نمایش مجموع در حساب گروه',
    showDetails: 'نمایش تفصیل‌ها',
    showDetailsColumn: 'نمایش تفصیل‌ها در ستون مجزا',
    showSignatures: 'نمایش محل امضاها'
  }
};

const formatNum = (num) => {
  if (num === null || num === undefined || num === '') return '';
  return Number(num).toLocaleString();
};

const VoucherPrint = ({ voucherId, onClose }) => {
  const supabase = window.supabase;
  const lang = document.documentElement.lang || 'fa';
  const t = localTranslations[lang] || localTranslations.fa;
  const isRtl = lang === 'fa';
  
  const [loading, setLoading] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [data, setData] = useState({
     voucher: null,
     items: [],
     fiscalYearTitle: '',
     ledgerTitle: '',
     baseCurrencyCode: '',
     branchTitle: '',
     creatorName: '',
     reviewerName: '',
     approverName: ''
  });

  const [printOptions, setPrintOptions] = useState({
     showSubsidiaryNo: true,
     showTracking: true,
     showQuantity: true,
     showBaseCurrency: false, 
     showOpCurrency: true, 
     showGeneralAccount: false,
     sumGeneralAccount: false,
     showGroupAccount: false,
     sumGroupAccount: false,
     showDetails: true,
     showDetailsColumn: false,
     showSignatures: true
  });

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        @page { size: A4 landscape; margin: 8mm; }
        html, body, #root { 
            height: auto !important; 
            overflow: visible !important; 
            background-color: white !important;
        }
        .no-print { display: none !important; }
        .print-border { border: 1px solid #000 !important; }
        .print-border-b { border-bottom: 1px solid #000 !important; }
        .print-border-l { border-left: 1px solid #000 !important; }
        .print-border-t { border-top: 1px solid #000 !important; }
        .print-bg-gray { background-color: #f1f5f9 !important; -webkit-print-color-adjust: exact; color-adjust: exact; }
      }
    `;
    document.head.appendChild(style);
    
    fetchData();
    
    return () => document.head.removeChild(style);
  }, [voucherId]);

  const fetchData = async () => {
    if (!supabase || !voucherId) return;
    setLoading(true);
    try {
       const { data: vData } = await supabase.schema('gl').from('vouchers').select('*').eq('id', voucherId).single();
       if (!vData) throw new Error('Voucher not found');

       const userIds = [vData.created_by, vData.reviewed_by, vData.approved_by].filter(Boolean);
       
       const [ledRes, brRes, usersRes, allAccRes, fpRes] = await Promise.all([
          supabase.schema('gl').from('ledgers').select('title, currency').eq('id', vData.ledger_id).single(),
          vData.branch_id ? supabase.schema('gen').from('branches').select('title').eq('id', vData.branch_id).single() : { data: { title: '-' } },
          userIds.length > 0 ? supabase.schema('gen').from('users').select('id, party_id, full_name').in('id', userIds) : { data: [] },
          supabase.schema('gl').from('accounts').select('id, parent_id, level, full_code, title'),
          supabase.schema('gl').from('fiscal_periods').select('year_id').eq('id', vData.fiscal_period_id).single()
       ]);

       let fyTitle = '';
       if (fpRes.data?.year_id) {
          const { data: fyData } = await supabase.schema('gl').from('fiscal_years').select('title').eq('id', fpRes.data.year_id).single();
          fyTitle = fyData?.title || '';
       }

       const accountsMap = new Map();
       (allAccRes.data || []).forEach(a => accountsMap.set(a.id, a));

       const getAncestor = (accId, levels) => {
           let curr = accountsMap.get(accId);
           while (curr) {
               if (levels.includes(curr.level)) return curr;
               if (!curr.parent_id) break;
               curr = accountsMap.get(curr.parent_id);
           }
           return null;
       };

       const partyIds = (usersRes.data || []).map(u => u.party_id).filter(Boolean);
       let partyMap = new Map();
       if (partyIds.length > 0) {
          const { data: pData } = await supabase.schema('gen').from('parties').select('id, name').in('id', partyIds);
          (pData || []).forEach(p => partyMap.set(p.id, p.name));
       }

       const userToNameMap = new Map();
       (usersRes.data || []).forEach(u => {
          const realName = partyMap.get(u.party_id) || u.full_name || '---';
          userToNameMap.set(u.id, realName);
       });

       const baseCurrencyCode = ledRes.data?.currency || '-';

       const { data: itemsData } = await supabase.schema('gl').from('voucher_items').select('*').eq('voucher_id', voucherId).order('row_number');

       const { data: diData } = await supabase.schema('gl').from('detail_instances').select('id, detail_code, title');
       const detailsMap = new Map();
       (diData || []).forEach(d => detailsMap.set(d.id, d));

       const mappedItems = (itemsData || []).map(item => {
           const acc = accountsMap.get(item.account_id);
           const generalAcc = getAncestor(item.account_id, ['general', 'کل', '2']);
           const groupAcc = getAncestor(item.account_id, ['group', 'گروه', '1']);

           const detailsObj = typeof item.details === 'string' ? JSON.parse(item.details || '{}') : (item.details || {});
           const selectedDetails = detailsObj.selected_details || {};
           const currencyCode = detailsObj.currency_code || '-';
           
           const detailArray = Object.values(selectedDetails).map(dId => {
               const d = detailsMap.get(dId);
               return d ? `${d.detail_code ? d.detail_code + '-' : ''}${d.title}` : '';
           }).filter(Boolean);

           return {
               ...item,
               account_code: acc?.full_code || '',
               account_title: acc?.title || '',
               general_acc: generalAcc,
               group_acc: groupAcc,
               details_array: detailArray,
               currency_code_display: currencyCode
           };
       });

       setData({
           voucher: vData,
           items: mappedItems,
           fiscalYearTitle: fyTitle,
           ledgerTitle: ledRes.data?.title || (isRtl ? 'نامشخص' : 'Unknown'),
           baseCurrencyCode: baseCurrencyCode,
           branchTitle: brRes.data?.title || (isRtl ? 'نامشخص' : 'Unknown'),
           creatorName: userToNameMap.get(vData.created_by) || '',
           reviewerName: userToNameMap.get(vData.reviewed_by) || '',
           approverName: userToNameMap.get(vData.approved_by) || ''
       });
    } catch (err) {
       console.error("Print fetch error:", err);
    } finally {
       setLoading(false);
    }
  };

  const handleOptionChange = (key, val) => {
      setPrintOptions(prev => ({ ...prev, [key]: val }));
  };

  const processItemsForPrint = () => {
      const items = data.items || [];
      let sorted = [...items];
      
      if (printOptions.showGeneralAccount || printOptions.showGroupAccount) {
          sorted.sort((a, b) => {
              const codeDiff = (a.account_code || '').localeCompare(b.account_code || '');
              if (codeDiff !== 0) return codeDiff;
              return (a.row_number || 0) - (b.row_number || 0);
          });
      } else {
          sorted.sort((a, b) => (a.row_number || 0) - (b.row_number || 0));
      }

      const groupSums = {};
      const generalSums = {};

      sorted.forEach(item => {
          const gId = item.group_acc?.id || 'none';
          const genId = item.general_acc?.id || 'none';

          if (!groupSums[gId]) groupSums[gId] = { debit: 0, credit: 0, op_debit: 0, op_credit: 0 };
          if (!generalSums[genId]) generalSums[genId] = { debit: 0, credit: 0, op_debit: 0, op_credit: 0 };

          const d = Number(item.debit) || 0;
          const c = Number(item.credit) || 0;
          const od = Number(item.op_debit) || 0;
          const oc = Number(item.op_credit) || 0;

          groupSums[gId].debit += d; groupSums[gId].credit += c;
          groupSums[gId].op_debit += od; groupSums[gId].op_credit += oc;

          generalSums[genId].debit += d; generalSums[genId].credit += c;
          generalSums[genId].op_debit += od; generalSums[genId].op_credit += oc;
      });

      let result = [];
      let currentGroup = null;
      let currentGeneral = null;

      if (!printOptions.showGeneralAccount && !printOptions.showGroupAccount) {
          return sorted.map(i => ({...i, rowType: 'item'}));
      }

      sorted.forEach(item => {
          const gAcc = item.group_acc;
          const genAcc = item.general_acc;
          const gId = gAcc?.id || 'none';
          const genId = genAcc?.id || 'none';

          if (printOptions.showGroupAccount) {
              if (!currentGroup || currentGroup !== gId) {
                  currentGroup = gId;
                  const sums = groupSums[gId];
                  result.push({
                      rowType: 'group_header',
                      title: gAcc ? `${gAcc.full_code} - ${gAcc.title}` : (isRtl ? 'بدون گروه' : 'No Group'),
                      ...sums
                  });
                  currentGeneral = null; 
              }
          }

          if (printOptions.showGeneralAccount) {
              if (!currentGeneral || currentGeneral !== genId) {
                  currentGeneral = genId;
                  const sums = generalSums[genId];
                  result.push({
                      rowType: 'general_header',
                      title: genAcc ? `${genAcc.full_code} - ${genAcc.title}` : (isRtl ? 'بدون کل' : 'No General'),
                      ...sums
                  });
              }
          }

          result.push({ ...item, rowType: 'item' });
      });

      return result;
  };

  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center p-20 text-slate-500 gap-4">
            <Loader2 className="animate-spin" size={32} />
            <p className="font-bold">{t.loading}</p>
        </div>
    );
  }

  if (!data.voucher) return <div className="p-10 text-center text-red-500">{t.notFound}</div>;

  const { voucher, fiscalYearTitle, ledgerTitle, branchTitle, creatorName, reviewerName, approverName } = data;
  const renderItems = processItemsForPrint();

  const showDetailsCol = printOptions.showDetails && printOptions.showDetailsColumn;
  const baseTextSpan = 4 + (showDetailsCol ? 1 : 0) + ((printOptions.showTracking || printOptions.showQuantity) ? 1 : 0);
  const totalColsCount = baseTextSpan + (printOptions.showBaseCurrency ? 3 : 0) + (printOptions.showOpCurrency ? 3 : 0);

  const colsConfig = [
    { key: 'row', weight: 4.5, show: true },                  
    { key: 'code', weight: 7, show: true },
    { key: 'title', weight: 15, show: true },                 
    { key: 'details', weight: 12, show: showDetailsCol },     
    { key: 'desc', weight: 16, show: true },                  
    { key: 'tracking', weight: 9.5, show: printOptions.showTracking || printOptions.showQuantity }, 
    { key: 'base_curr', weight: 3.5, show: printOptions.showBaseCurrency }, 
    { key: 'base_deb', weight: 11.5, show: printOptions.showBaseCurrency }, 
    { key: 'base_cred', weight: 11.5, show: printOptions.showBaseCurrency }, 
    { key: 'op_curr', weight: 3.5, show: printOptions.showOpCurrency },
    { key: 'op_deb', weight: 11.5, show: printOptions.showOpCurrency }, 
    { key: 'op_cred', weight: 11.5, show: printOptions.showOpCurrency }, 
  ];

  const totalWeight = colsConfig.filter(c => c.show).reduce((sum, c) => sum + c.weight, 0);
  
  const getWidth = (key) => {
      const col = colsConfig.find(c => c.key === key);
      return col && col.show ? `${(col.weight / totalWeight) * 100}%` : '0%';
  };

  const getGroupWidth = (keys) => {
      const w = keys.reduce((sum, k) => {
          const c = colsConfig.find(col => col.key === k);
          return sum + (c && c.show ? c.weight : 0);
      }, 0);
      return `${(w / totalWeight) * 100}%`;
  };

  const handlePrint = () => window.print();

  const getStatusText = (status) => {
    switch(status) {
       case 'temporary': return t.statusTemporary;
       case 'reviewed': return t.statusReviewed;
       case 'final': return t.statusFinal;
       case 'draft': default: return t.statusDraft;
    }
  };

  const OptionCheckbox = ({ label, optKey, disabled = false }) => (
      <label className={`flex items-center gap-2 text-sm text-slate-700 p-1.5 rounded transition-colors border border-transparent ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50 hover:border-slate-200 cursor-pointer'}`}>
          <input type="checkbox" className={`rounded w-4 h-4 text-indigo-600 focus:ring-indigo-500 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`} checked={printOptions[optKey]} onChange={(e) => handleOptionChange(optKey, e.target.checked)} disabled={disabled} />
          <span>{label}</span>
      </label>
  );

  return (
    <div className={`relative w-full h-full bg-slate-50 ${isRtl ? 'font-vazir text-right dir-rtl' : 'font-sans text-left dir-ltr'}`}>
       
       {isSettingsOpen && (
           <div className="no-print fixed inset-0 z-40 cursor-pointer" onClick={() => setIsSettingsOpen(false)}></div>
       )}

       <div className={`no-print fixed top-0 ${isRtl ? 'right-0' : 'left-0'} h-full w-[320px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isSettingsOpen ? 'translate-x-0' : (isRtl ? 'translate-x-full' : '-translate-x-full')} overflow-y-auto flex flex-col`}>
          <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
             <div className="flex items-center gap-2 font-black text-slate-800">
                 <Settings2 size={18} className="text-indigo-600"/> {t.printSettings}
             </div>
             <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-rose-500 transition-colors p-1 rounded hover:bg-rose-50"><X size={20}/></button>
          </div>
          
          <div className="p-5 flex flex-col gap-2">
             <OptionCheckbox label={t.showSubsidiaryNo} optKey="showSubsidiaryNo" />
             <div className="h-px bg-slate-100 my-1"></div>
             <OptionCheckbox label={t.showTracking} optKey="showTracking" />
             <OptionCheckbox label={t.showQuantity} optKey="showQuantity" />
             <div className="h-px bg-slate-100 my-1"></div>
             <OptionCheckbox label={t.showBaseCurrency} optKey="showBaseCurrency" />
             <OptionCheckbox label={t.showOpCurrency} optKey="showOpCurrency" />
             <div className="h-px bg-slate-100 my-1"></div>
             <OptionCheckbox label={t.showGeneralAccount} optKey="showGeneralAccount" />
             <OptionCheckbox label={t.sumGeneralAccount} optKey="sumGeneralAccount" />
             <div className="h-px bg-slate-100 my-1"></div>
             <OptionCheckbox label={t.showGroupAccount} optKey="showGroupAccount" />
             <OptionCheckbox label={t.sumGroupAccount} optKey="sumGroupAccount" />
             <div className="h-px bg-slate-100 my-1"></div>
             
             <div className="flex flex-col gap-1 bg-slate-50 p-2 rounded border border-slate-100">
                 <OptionCheckbox label={t.showDetails} optKey="showDetails" />
                 <div className={`mr-6 rtl:mr-6 rtl:ml-0 ml-6 transition-opacity duration-200 ${printOptions.showDetails ? 'opacity-100' : 'opacity-40'}`}>
                     <OptionCheckbox label={t.showDetailsColumn} optKey="showDetailsColumn" disabled={!printOptions.showDetails} />
                 </div>
             </div>

             <div className="h-px bg-slate-100 my-1"></div>
             <OptionCheckbox label={t.showSignatures} optKey="showSignatures" />
          </div>
       </div>

       <div className="flex flex-col h-full min-w-0 bg-slate-200 overflow-y-auto custom-scrollbar relative z-0 print:overflow-visible print:h-auto print:bg-white">
           <div className="no-print flex items-center justify-between bg-white border-b border-slate-300 p-4 shrink-0 shadow-sm sticky top-0 z-10">
              <div className="text-slate-600 text-sm font-bold flex items-center gap-2">
                 <Printer size={18} /> {t.previewTitle}
              </div>
              <div className="flex gap-2">
                 <button onClick={() => setIsSettingsOpen(true)} className="flex items-center gap-1.5 px-4 py-1.5 text-sm rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold transition-all shadow-sm">
                    <Settings2 size={16} className="text-indigo-600" /> {t.settingsBtn}
                 </button>
                 <div className="w-px bg-slate-300 mx-1"></div>
                 <button onClick={onClose} className="px-4 py-1.5 text-sm rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold transition-all shadow-sm">{t.cancel}</button>
                 <button onClick={handlePrint} className="flex items-center gap-2 px-6 py-1.5 text-sm rounded border border-indigo-700 bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-sm">
                    <Printer size={16} /> {t.printBtn}
                 </button>
              </div>
           </div>

           <div className="p-4 md:p-8 flex justify-center print:p-0 print:m-0">
               <div id="printable-voucher" className="bg-white text-black shadow-lg mx-auto w-full max-w-[297mm] p-6 print:shadow-none print:max-w-none print:w-full print:p-0">
                   <div className="flex items-start justify-between border-b-2 border-slate-800 pb-4 mb-4 print-border-b">
                       <div className="w-1/3 flex flex-col gap-1 text-[11px]">
                           <div><span className="font-bold">{t.fiscalYear}</span> {fiscalYearTitle}</div>
                           <div><span className="font-bold">{t.financialLedger}</span> {ledgerTitle}</div>
                           <div><span className="font-bold">{t.branch}</span> {branchTitle}</div>
                           <div className="flex items-center gap-1">
                               <span className="font-bold">{t.voucherDate}</span> 
                               <span className="font-mono dir-ltr inline-block">{voucher.voucher_date}</span>
                           </div>
                       </div>
                       
                       <div className="w-1/3 text-center flex flex-col gap-2 items-center">
                           <h1 className="text-xl font-black tracking-tight">{t.documentTitle}</h1>
                           <div className="text-xs font-black text-slate-700 px-3 py-0.5 bg-slate-100 border border-slate-300 rounded print-bg-gray">
                               {getStatusText(voucher.status)}
                           </div>
                       </div>
                       
                       <div className="w-1/3 flex flex-col gap-1 text-[11px] items-end">
                           <div className="flex items-center gap-1">
                               <span className="font-bold">{t.voucherNumber}</span> 
                               <span className="font-mono dir-ltr inline-block text-[13px] font-bold">{voucher.voucher_number || '-'}</span>
                           </div>
                           <div className="flex items-center gap-1">
                               <span className="font-bold">{t.dailyNumber}</span> 
                               <span className="font-mono dir-ltr inline-block">{voucher.daily_number || '-'}</span>
                           </div>
                           <div className="flex items-center gap-1">
                               <span className="font-bold">{t.crossReference}</span> 
                               <span className="font-mono dir-ltr inline-block">{voucher.cross_reference || '-'}</span>
                           </div>
                           {printOptions.showSubsidiaryNo && (
                           <div className="flex items-center gap-1">
                               <span className="font-bold">{t.subsidiaryNumber}</span> 
                               <span className="font-mono dir-ltr inline-block">{voucher.subsidiary_number || '-'}</span>
                           </div>
                           )}
                       </div>
                   </div>

                   {voucher.description && (
                       <div className="mb-4 text-[10px] font-bold bg-slate-50 p-2 rounded print-bg-gray print-border">
                           <span className="text-slate-600">{t.generalDescription} </span>
                           {voucher.description}
                       </div>
                   )}

                   <table className="w-full text-[9px] mb-8 border-collapse border border-slate-800 print-border leading-tight table-fixed">
                       <thead className="bg-slate-100 print-bg-gray font-bold text-center text-[10px]">
                           <tr>
                               <th rowSpan={2} className="border border-slate-800 p-1 print-border" style={{width: getWidth('row')}}>{t.row}</th>
                               <th rowSpan={2} className="border border-slate-800 p-1 print-border" style={{width: getWidth('code')}}>{t.accountCode}</th>
                               <th rowSpan={2} className="border border-slate-800 p-1 print-border" style={{width: getWidth('title')}}>{t.accountTitle}</th>
                               {showDetailsCol && <th rowSpan={2} className="border border-slate-800 p-1 print-border" style={{width: getWidth('details')}}>{t.detailsColumn}</th>}
                               
                               <th rowSpan={2} className="border border-slate-800 p-1 print-border" style={{width: getWidth('desc')}}>{t.rowDescription}</th>
                               
                               {(printOptions.showTracking || printOptions.showQuantity) && <th rowSpan={2} className="border border-slate-800 p-1 print-border" style={{width: getWidth('tracking')}}>{t.trackingQty}</th>}
                               
                               {printOptions.showBaseCurrency && <th colSpan={3} className="border border-slate-800 p-1 print-border" style={{width: getGroupWidth(['base_curr', 'base_deb', 'base_cred'])}}>{t.baseGroup}</th>}
                               {printOptions.showOpCurrency && <th colSpan={3} className="border border-slate-800 p-1 print-border" style={{width: getGroupWidth(['op_curr', 'op_deb', 'op_cred'])}}>{t.opGroup}</th>}
                           </tr>
                           <tr>
                               {printOptions.showBaseCurrency && <th className="border border-slate-800 p-1 print-border" style={{width: getWidth('base_curr')}}>{t.currencySimple}</th>}
                               {printOptions.showBaseCurrency && <th className="border border-slate-800 p-1 print-border" style={{width: getWidth('base_deb')}}>{t.debitSimple}</th>}
                               {printOptions.showBaseCurrency && <th className="border border-slate-800 p-1 print-border" style={{width: getWidth('base_cred')}}>{t.creditSimple}</th>}
                               
                               {printOptions.showOpCurrency && <th className="border border-slate-800 p-1 print-border" style={{width: getWidth('op_curr')}}>{t.currencySimple}</th>}
                               {printOptions.showOpCurrency && <th className="border border-slate-800 p-1 print-border" style={{width: getWidth('op_deb')}}>{t.debitSimple}</th>}
                               {printOptions.showOpCurrency && <th className="border border-slate-800 p-1 print-border" style={{width: getWidth('op_cred')}}>{t.creditSimple}</th>}
                           </tr>
                       </thead>
                       <tbody>
                           {renderItems.map((it, idx) => {
                               if (it.rowType === 'group_header' || it.rowType === 'general_header') {
                                   const showSum = (it.rowType === 'group_header' && printOptions.sumGroupAccount) || (it.rowType === 'general_header' && printOptions.sumGeneralAccount);
                                   
                                   return (
                                       <tr key={`header-${idx}`} className={it.rowType === 'group_header' ? 'bg-slate-200 print-bg-gray font-bold text-[10px]' : 'bg-slate-100 print-bg-gray font-bold text-[10px]'}>
                                           <td colSpan={showSum ? baseTextSpan : totalColsCount} className={`border border-slate-800 p-1.5 print-border ${isRtl ? 'text-right' : 'text-left'}`}>
                                               {it.title}
                                           </td>
                                           {showSum && printOptions.showBaseCurrency && <td className="border border-slate-800 p-1 print-border"></td>}
                                           {showSum && printOptions.showBaseCurrency && <td className="border border-slate-800 p-1.5 text-right font-mono print-border dir-ltr tracking-tighter break-all">{formatNum(it.debit)}</td>}
                                           {showSum && printOptions.showBaseCurrency && <td className="border border-slate-800 p-1.5 text-right font-mono print-border dir-ltr tracking-tighter break-all">{formatNum(it.credit)}</td>}
                                           
                                           {showSum && printOptions.showOpCurrency && <td className="border border-slate-800 p-1 print-border"></td>}
                                           {showSum && printOptions.showOpCurrency && <td className="border border-slate-800 p-1.5 text-right font-mono print-border dir-ltr tracking-tighter break-all">{formatNum(it.op_debit)}</td>}
                                           {showSum && printOptions.showOpCurrency && <td className="border border-slate-800 p-1.5 text-right font-mono print-border dir-ltr tracking-tighter break-all">{formatNum(it.op_credit)}</td>}
                                       </tr>
                                   );
                               }

                               return (
                                   <tr key={it.id || idx}>
                                       <td className="border border-slate-800 p-1 text-center font-bold print-border break-words">{it.row_number}</td>
                                       <td className="border border-slate-800 p-1 text-center font-mono print-border dir-ltr break-all">{it.account_code}</td>
                                       <td className="border border-slate-800 p-1 print-border align-top break-words">
                                          <div className={`font-bold ${it.credit > 0 && isRtl ? 'pr-4' : (it.credit > 0 && !isRtl ? 'pl-4' : '')} text-slate-800`}>
                                              {it.account_title}
                                          </div>
                                          {printOptions.showDetails && !printOptions.showDetailsColumn && it.details_array.length > 0 && (
                                              <div className={`text-[8.5px] text-slate-600 mt-1 flex flex-col gap-0.5 ${it.credit > 0 && isRtl ? 'pr-4' : (it.credit > 0 && !isRtl ? 'pl-4' : '')}`}>
                                                  {it.details_array.map((d, i) => <div key={i}>{d}</div>)}
                                              </div>
                                          )}
                                       </td>
                                       
                                       {showDetailsCol && (
                                       <td className="border border-slate-800 p-1 print-border align-top text-[8.5px] text-slate-700 break-words">
                                          {it.details_array.map((d, i) => <div key={i} className="mb-0.5 last:mb-0">{d}</div>)}
                                       </td>
                                       )}

                                       <td className="border border-slate-800 p-1 print-border align-top break-words">{it.description}</td>
                                       
                                       {(printOptions.showTracking || printOptions.showQuantity) && (
                                       <td className="border border-slate-800 p-1 text-center font-mono text-[8.5px] print-border align-top break-all">
                                           {printOptions.showTracking && it.tracking_number ? <div>{t.trackingPrefix} {it.tracking_number} {it.tracking_date ? <br/> : ''} {it.tracking_date ? `(${it.tracking_date})` : ''}</div> : null}
                                           {printOptions.showQuantity && it.quantity ? <div className="mt-0.5">{t.qtyPrefix} {formatNum(it.quantity)}</div> : null}
                                       </td>
                                       )}
                                       
                                       {printOptions.showBaseCurrency && <td className="border border-slate-800 p-1 text-center font-mono print-border align-top break-all">{data.baseCurrencyCode}</td>}
                                       {printOptions.showBaseCurrency && <td className="border border-slate-800 p-1 text-right font-mono font-bold print-border dir-ltr align-top tracking-tighter break-all">{it.debit > 0 ? formatNum(it.debit) : '-'}</td>}
                                       {printOptions.showBaseCurrency && <td className="border border-slate-800 p-1 text-right font-mono font-bold print-border dir-ltr align-top tracking-tighter break-all">{it.credit > 0 ? formatNum(it.credit) : '-'}</td>}
                                       
                                       {printOptions.showOpCurrency && <td className="border border-slate-800 p-1 text-center font-mono print-border align-top break-all">{it.currency_code_display}</td>}
                                       {printOptions.showOpCurrency && <td className="border border-slate-800 p-1 text-right font-mono font-bold text-slate-600 print-border dir-ltr align-top tracking-tighter break-all">{it.op_debit > 0 ? formatNum(it.op_debit) : '-'}</td>}
                                       {printOptions.showOpCurrency && <td className="border border-slate-800 p-1 text-right font-mono font-bold text-slate-600 print-border dir-ltr align-top tracking-tighter break-all">{it.op_credit > 0 ? formatNum(it.op_credit) : '-'}</td>}
                                   </tr>
                               );
                           })}
                       </tbody>
                       <tfoot className="bg-slate-100 print-bg-gray font-black text-[10px]">
                           <tr>
                               <td colSpan={baseTextSpan} className={`border border-slate-800 p-1.5 print-border ${isRtl ? 'text-left' : 'text-right'}`}>{t.total}</td>
                               
                               {printOptions.showBaseCurrency && <td className="border border-slate-800 p-1 print-border"></td>}
                               {printOptions.showBaseCurrency && <td className="border border-slate-800 p-1.5 text-right font-mono print-border dir-ltr tracking-tighter break-all">{formatNum(voucher.total_debit)}</td>}
                               {printOptions.showBaseCurrency && <td className="border border-slate-800 p-1.5 text-right font-mono print-border dir-ltr tracking-tighter break-all">{formatNum(voucher.total_credit)}</td>}
                               
                               {printOptions.showOpCurrency && <td className="border border-slate-800 p-1 print-border"></td>}
                               {printOptions.showOpCurrency && <td className="border border-slate-800 p-1.5 text-right font-mono print-border dir-ltr text-slate-700 tracking-tighter break-all">
                                   {formatNum(renderItems.reduce((acc, it) => acc + (it.rowType === 'item' ? (Number(it.op_debit) || 0) : 0), 0))}
                               </td>}
                               {printOptions.showOpCurrency && <td className="border border-slate-800 p-1.5 text-right font-mono print-border dir-ltr text-slate-700 tracking-tighter break-all">
                                   {formatNum(renderItems.reduce((acc, it) => acc + (it.rowType === 'item' ? (Number(it.op_credit) || 0) : 0), 0))}
                               </td>}
                           </tr>
                       </tfoot>
                   </table>

                   {printOptions.showSignatures && (
                   <div className="flex items-start justify-between mt-12 pt-4 px-8 text-[11px] no-print-break">
                       <div className="text-center w-1/3">
                           <div className="font-bold text-slate-600 mb-12">{t.issuer}</div>
                           <div className="border-t border-slate-400 border-dashed pt-2 mx-8 font-bold text-slate-800">
                               {creatorName || '\u00A0'}
                           </div>
                       </div>
                       <div className="text-center w-1/3">
                           <div className="font-bold text-slate-600 mb-12">{t.reviewer}</div>
                           <div className="border-t border-slate-400 border-dashed pt-2 mx-8 font-bold text-slate-800">
                               {reviewerName || '\u00A0'}
                           </div>
                       </div>
                       <div className="text-center w-1/3">
                           <div className="font-bold text-slate-600 mb-12">{t.approver}</div>
                           <div className="border-t border-slate-400 border-dashed pt-2 mx-8 font-bold text-slate-800">
                               {approverName || '\u00A0'}
                           </div>
                       </div>
                   </div>
                   )}
               </div>
           </div>
       </div>
    </div>
  );
};

window.VoucherPrint = VoucherPrint;
export default VoucherPrint;
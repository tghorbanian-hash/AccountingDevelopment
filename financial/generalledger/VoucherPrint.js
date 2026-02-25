/* Filename: financial/generalledger/VoucherPrint.js */
import React, { useState, useEffect } from 'react';
import { Loader2, Printer, X } from 'lucide-react';

const localTranslations = {
  en: {
    previewTitle: 'Print Preview',
    cancel: 'Cancel',
    printBtn: 'Print Voucher',
    loading: 'Preparing print data...',
    notFound: 'Voucher not found.',
    financialLedger: 'Financial Ledger:',
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
    accountTitle: 'Account Title / Details',
    rowDescription: 'Description',
    trackingQty: 'Tracking/Qty',
    currency: 'Currency',
    debit: 'Debit',
    credit: 'Credit',
    total: 'Total Amount:',
    issuer: 'Issuer',
    reviewer: 'Reviewer',
    approver: 'Approver',
    statusDraft: 'Draft',
    statusTemporary: 'Temporary',
    statusReviewed: 'Reviewed',
    statusFinal: 'Final',
    trackingPrefix: 'T:',
    qtyPrefix: 'Qty:'
  },
  fa: {
    previewTitle: 'پیش‌نمایش چاپ',
    cancel: 'انصراف',
    printBtn: 'چاپ سند',
    loading: 'در حال آماده‌سازی اطلاعات چاپ...',
    notFound: 'سند یافت نشد.',
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
    accountTitle: 'عنوان حساب / تفصیل',
    rowDescription: 'شرح ردیف',
    trackingQty: 'پیگیری/مقدار',
    currency: 'ارز',
    debit: 'بدهکار',
    credit: 'بستانکار',
    total: 'جمع کل:',
    issuer: 'صادرکننده',
    reviewer: 'بررسی‌کننده',
    approver: 'تاییدکننده',
    statusDraft: 'یادداشت',
    statusTemporary: 'موقت',
    statusReviewed: 'بررسی شده',
    statusFinal: 'قطعی شده',
    trackingPrefix: 'ت:',
    qtyPrefix: 'مقدار:'
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
  const [data, setData] = useState({
     voucher: null,
     items: [],
     ledgerTitle: '',
     branchTitle: '',
     creatorName: '',
     reviewerName: '',
     approverName: ''
  });

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        @page { size: A5 landscape; margin: 10mm; }
        body * { visibility: hidden; }
        #printable-voucher, #printable-voucher * { visibility: visible; }
        #printable-voucher { 
           position: absolute; left: 0; top: 0; width: 100%; 
           padding: 0; background: white; margin: 0;
           box-sizing: border-box;
           direction: ${isRtl ? 'rtl' : 'ltr'};
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
  }, [voucherId, isRtl]);

  const fetchData = async () => {
    if (!supabase || !voucherId) return;
    setLoading(true);
    try {
       const { data: vData } = await supabase.schema('gl').from('vouchers').select('*').eq('id', voucherId).single();
       if (!vData) throw new Error('Voucher not found');

       const [ledRes, brRes, currRes, usersRes] = await Promise.all([
          supabase.schema('gl').from('ledgers').select('title').eq('id', vData.ledger_id).single(),
          vData.branch_id ? supabase.schema('gen').from('branches').select('title').eq('id', vData.branch_id).single() : { data: { title: '-' } },
          supabase.schema('gen').from('currencies').select('id, code, title'),
          supabase.schema('gen').from('users').select('id, full_name, username')
       ]);

       const currMap = new Map();
       (currRes.data || []).forEach(c => currMap.set(c.code, c.title));

       const userMap = new Map();
       (usersRes.data || []).forEach(u => userMap.set(u.id, u.full_name || u.username));

       const { data: itemsData } = await supabase.schema('gl').from('voucher_items').select('*').eq('voucher_id', voucherId).order('row_number');

       const accIds = [...new Set((itemsData || []).map(i => i.account_id).filter(Boolean))];
       let accountsMap = new Map();
       if (accIds.length > 0) {
           const { data: accData } = await supabase.schema('gl').from('accounts').select('id, full_code, title').in('id', accIds);
           (accData || []).forEach(a => accountsMap.set(a.id, a));
       }

       const { data: diData } = await supabase.schema('gl').from('detail_instances').select('id, detail_code, title');
       const detailsMap = new Map();
       (diData || []).forEach(d => detailsMap.set(d.id, d));

       const mappedItems = (itemsData || []).map(item => {
           const acc = accountsMap.get(item.account_id);
           const detailsObj = typeof item.details === 'string' ? JSON.parse(item.details || '{}') : (item.details || {});
           const selectedDetails = detailsObj.selected_details || {};
           const currencyCode = detailsObj.currency_code || '';
           
           const detailStrings = Object.values(selectedDetails).map(dId => {
               const d = detailsMap.get(dId);
               return d ? `${d.detail_code ? d.detail_code + '-' : ''}${d.title}` : '';
           }).filter(Boolean).join(' | ');

           return {
               ...item,
               account_code: acc?.full_code || '',
               account_title: acc?.title || '',
               details_str: detailStrings,
               currency_title: currMap.get(currencyCode) || currencyCode || '-'
           };
       });

       const creatorId = vData.creator_id || vData.created_by;
       const reviewerId = vData.reviewer_id || vData.reviewed_by;
       const approverId = vData.approver_id || vData.approved_by;

       setData({
           voucher: vData,
           items: mappedItems,
           ledgerTitle: ledRes.data?.title || (isRtl ? 'نامشخص' : 'Unknown'),
           branchTitle: brRes.data?.title || (isRtl ? 'نامشخص' : 'Unknown'),
           creatorName: userMap.get(creatorId) || '',
           reviewerName: userMap.get(reviewerId) || '',
           approverName: userMap.get(approverId) || ''
       });
    } catch (err) {
       console.error("Print fetch error:", err);
    } finally {
       setLoading(false);
    }
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

  const { voucher, items, ledgerTitle, branchTitle, creatorName, reviewerName, approverName } = data;

  const handlePrint = () => {
     window.print();
  };

  const getStatusText = (status) => {
    switch(status) {
       case 'temporary': return t.statusTemporary;
       case 'reviewed': return t.statusReviewed;
       case 'final': return t.statusFinal;
       case 'draft': default: return t.statusDraft;
    }
  };

  return (
    <div className={`w-full max-w-4xl mx-auto bg-white ${isRtl ? 'font-vazir text-right' : 'font-sans text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
       <div className="no-print flex items-center justify-between bg-slate-50 border-b border-slate-200 p-4 mb-4 rounded-t-lg">
          <div className="text-slate-500 text-sm font-bold flex items-center gap-2">
             <Printer size={18} />
             {t.previewTitle}
          </div>
          <div className="flex gap-2">
             <button onClick={onClose} className="px-4 py-1.5 text-sm rounded border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold transition-all">{t.cancel}</button>
             <button onClick={handlePrint} className="flex items-center gap-2 px-6 py-1.5 text-sm rounded border border-indigo-700 bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-sm">
                <Printer size={16} /> {t.printBtn}
             </button>
          </div>
       </div>

       <div id="printable-voucher" className="p-4 md:p-6 bg-white text-black">
           <div className={`flex items-start justify-between border-b-2 border-slate-800 pb-4 mb-4 print-border-b ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
               <div className={`w-1/3 flex flex-col gap-1 text-xs ${isRtl ? 'items-end' : 'items-start'}`}>
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
                   <div className="flex items-center gap-1">
                       <span className="font-bold">{t.subsidiaryNumber}</span> 
                       <span className="font-mono dir-ltr inline-block">{voucher.subsidiary_number || '-'}</span>
                   </div>
               </div>
               
               <div className="w-1/3 text-center flex flex-col gap-2 items-center">
                   <h1 className="text-xl font-black tracking-tight">{t.documentTitle}</h1>
                   <div className="text-sm font-black text-slate-700 px-3 py-0.5 bg-slate-100 border border-slate-300 rounded print-bg-gray">
                       {getStatusText(voucher.status)}
                   </div>
               </div>
               
               <div className={`w-1/3 flex flex-col gap-1 text-xs ${isRtl ? 'items-start' : 'items-end'}`}>
                   <div><span className="font-bold">{t.financialLedger}</span> {ledgerTitle}</div>
                   <div><span className="font-bold">{t.branch}</span> {branchTitle}</div>
                   <div className="flex items-center gap-1">
                       <span className="font-bold">{t.voucherDate}</span> 
                       <span className="font-mono dir-ltr inline-block">{voucher.voucher_date}</span>
                   </div>
               </div>
           </div>

           {voucher.description && (
               <div className="mb-4 text-xs font-bold bg-slate-50 p-2 rounded print-bg-gray print-border">
                   <span className="text-slate-600">{t.generalDescription} </span>
                   {voucher.description}
               </div>
           )}

           <table className="w-full text-[11px] mb-8 border-collapse border border-slate-800 print-border">
               <thead className="bg-slate-100 print-bg-gray font-bold text-center">
                   <tr>
                       <th className="border border-slate-800 p-1.5 w-8 print-border">{t.row}</th>
                       <th className="border border-slate-800 p-1.5 w-20 print-border">{t.accountCode}</th>
                       <th className="border border-slate-800 p-1.5 w-[30%] print-border">{t.accountTitle}</th>
                       <th className="border border-slate-800 p-1.5 w-auto print-border">{t.rowDescription}</th>
                       <th className="border border-slate-800 p-1.5 w-20 print-border">{t.trackingQty}</th>
                       <th className="border border-slate-800 p-1.5 w-12 print-border">{t.currency}</th>
                       <th className="border border-slate-800 p-1.5 w-24 print-border">{t.debit}</th>
                       <th className="border border-slate-800 p-1.5 w-24 print-border">{t.credit}</th>
                   </tr>
               </thead>
               <tbody>
                   {items.map((it, idx) => (
                       <tr key={it.id || idx}>
                           <td className="border border-slate-800 p-1.5 text-center font-bold print-border">{idx + 1}</td>
                           <td className="border border-slate-800 p-1.5 text-center font-mono print-border dir-ltr">{it.account_code}</td>
                           <td className="border border-slate-800 p-1.5 print-border">
                              <div className={`font-bold ${it.credit > 0 && isRtl ? 'pr-8' : (it.credit > 0 && !isRtl ? 'pl-8' : '')} text-slate-700`}>
                                  {it.account_title}
                              </div>
                              {it.details_str && <div className={`text-[10px] text-slate-600 mt-0.5 ${it.credit > 0 && isRtl ? 'pr-8' : (it.credit > 0 && !isRtl ? 'pl-8' : '')}`}>{it.details_str}</div>}
                           </td>
                           <td className="border border-slate-800 p-1.5 print-border">{it.description}</td>
                           <td className="border border-slate-800 p-1.5 text-center font-mono text-[10px] print-border">
                               {it.tracking_number ? <div>{t.trackingPrefix} {it.tracking_number}</div> : null}
                               {it.quantity ? <div>{t.qtyPrefix} {formatNum(it.quantity)}</div> : null}
                           </td>
                           <td className="border border-slate-800 p-1.5 text-center font-mono text-[10px] print-border">{it.currency_title}</td>
                           <td className="border border-slate-800 p-1.5 text-right font-mono font-bold print-border dir-ltr">{it.debit > 0 ? formatNum(it.debit) : '-'}</td>
                           <td className="border border-slate-800 p-1.5 text-right font-mono font-bold print-border dir-ltr">{it.credit > 0 ? formatNum(it.credit) : '-'}</td>
                       </tr>
                   ))}
               </tbody>
               <tfoot className="bg-slate-100 print-bg-gray font-black">
                   <tr>
                       <td colSpan="6" className={`border border-slate-800 p-2 print-border ${isRtl ? 'text-left' : 'text-right'}`}>{t.total}</td>
                       <td className="border border-slate-800 p-2 text-right font-mono print-border dir-ltr">{formatNum(voucher.total_debit)}</td>
                       <td className="border border-slate-800 p-2 text-right font-mono print-border dir-ltr">{formatNum(voucher.total_credit)}</td>
                   </tr>
               </tfoot>
           </table>

           <div className="flex items-start justify-between mt-12 pt-4 px-8 text-xs">
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
       </div>
    </div>
  );
};

window.VoucherPrint = VoucherPrint;
export default VoucherPrint;
/* Filename: financial/generalledger/VoucherPrint.js */
import React, { useState, useEffect } from 'react';
import { Loader2, Printer, X } from 'lucide-react';

const formatNum = (num) => {
  if (num === null || num === undefined || num === '') return '';
  return Number(num).toLocaleString();
};

const VoucherPrint = ({ voucherId, onClose }) => {
  const supabase = window.supabase;
  const isRtl = document.dir === 'rtl' || true; // Accounting standard is mostly RTL here
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
     voucher: null,
     items: [],
     ledgerTitle: '',
     branchTitle: ''
  });

  useEffect(() => {
    // Inject standard CSS for printing (hides app interface, shows only this component)
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        body * { visibility: hidden; }
        #printable-voucher, #printable-voucher * { visibility: visible; }
        #printable-voucher { 
           position: absolute; left: 0; top: 0; width: 100%; 
           padding: 10mm; background: white; margin: 0;
           box-sizing: border-box;
        }
        .no-print { display: none !important; }
        .print-border { border: 1px solid #000 !important; }
        .print-border-b { border-bottom: 1px solid #000 !important; }
        .print-border-l { border-left: 1px solid #000 !important; }
        .print-border-t { border-top: 1px solid #000 !important; }
        .print-bg-gray { background-color: #f1f5f9 !important; -webkit-print-color-adjust: exact; }
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
       // Fetch Voucher
       const { data: vData } = await supabase.schema('gl').from('vouchers').select('*').eq('id', voucherId).single();
       if (!vData) throw new Error('Voucher not found');

       // Fetch Ledger & Branch names
       const [ledRes, brRes] = await Promise.all([
          supabase.schema('gl').from('ledgers').select('title').eq('id', vData.ledger_id).single(),
          vData.branch_id ? supabase.schema('gen').from('branches').select('title').eq('id', vData.branch_id).single() : { data: { title: '-' } }
       ]);

       // Fetch Items
       const { data: itemsData } = await supabase.schema('gl').from('voucher_items').select('*').eq('voucher_id', voucherId).order('row_number');

       // Fetch Accounts linked to items
       const accIds = [...new Set((itemsData || []).map(i => i.account_id).filter(Boolean))];
       let accountsMap = new Map();
       if (accIds.length > 0) {
           const { data: accData } = await supabase.schema('gl').from('accounts').select('id, full_code, title').in('id', accIds);
           (accData || []).forEach(a => accountsMap.set(a.id, a));
       }

       // Fetch all Detail Instances (for decoding detail dicts)
       const { data: diData } = await supabase.schema('gl').from('detail_instances').select('id, detail_code, title');
       const detailsMap = new Map();
       (diData || []).forEach(d => detailsMap.set(d.id, d));

       // Map item details
       const mappedItems = (itemsData || []).map(item => {
           const acc = accountsMap.get(item.account_id);
           const detailsObj = typeof item.details === 'string' ? JSON.parse(item.details || '{}') : (item.details || {});
           const selectedDetails = detailsObj.selected_details || {};
           
           // Build detail string: "Code - Title"
           const detailStrings = Object.values(selectedDetails).map(dId => {
               const d = detailsMap.get(dId);
               return d ? `${d.detail_code ? d.detail_code + '-' : ''}${d.title}` : '';
           }).filter(Boolean).join(' | ');

           return {
               ...item,
               account_code: acc?.full_code || '',
               account_title: acc?.title || '',
               details_str: detailStrings
           };
       });

       setData({
           voucher: vData,
           items: mappedItems,
           ledgerTitle: ledRes.data?.title || 'نامشخص',
           branchTitle: brRes.data?.title || 'نامشخص'
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
            <p className="font-bold">در حال آماده‌سازی اطلاعات چاپ...</p>
        </div>
    );
  }

  if (!data.voucher) return <div className="p-10 text-center text-red-500">سند یافت نشد.</div>;

  const { voucher, items, ledgerTitle, branchTitle } = data;

  const handlePrint = () => {
     window.print();
  };

  return (
    <div className={`w-full max-w-4xl mx-auto bg-white ${isRtl ? 'font-vazir text-right' : 'font-sans text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
       {/* Actions Toolbar (Hidden on Print) */}
       <div className="no-print flex items-center justify-between bg-slate-50 border-b border-slate-200 p-4 mb-4 rounded-t-lg">
          <div className="text-slate-500 text-sm font-bold flex items-center gap-2">
             <Printer size={18} />
             پیش‌نمایش چاپ
          </div>
          <div className="flex gap-2">
             <button onClick={onClose} className="px-4 py-1.5 text-sm rounded border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold transition-all">انصراف</button>
             <button onClick={handlePrint} className="flex items-center gap-2 px-6 py-1.5 text-sm rounded border border-indigo-700 bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-sm">
                <Printer size={16} /> چاپ سند
             </button>
          </div>
       </div>

       {/* Printable Area */}
       <div id="printable-voucher" className="p-4 md:p-8 bg-white text-black min-h-[500px]">
           {/* Header */}
           <div className="flex items-start justify-between border-b-2 border-slate-800 pb-4 mb-4 print-border-b">
               <div className="w-1/3 flex flex-col gap-1 text-xs">
                   <div><span className="font-bold">دفتر مالی:</span> {ledgerTitle}</div>
                   <div><span className="font-bold">شعبه:</span> {branchTitle}</div>
                   <div><span className="font-bold">شماره فرعی:</span> <span className="font-mono">{voucher.subsidiary_number || '-'}</span></div>
               </div>
               
               <div className="w-1/3 text-center flex flex-col gap-2">
                   <h1 className="text-xl font-black tracking-tight">سند حسابداری</h1>
                   <div className="text-xs font-bold text-slate-600">{voucher.status === 'temporary' ? 'موقت' : voucher.status === 'final' ? 'قطعی' : 'یادداشت'}</div>
               </div>
               
               <div className="w-1/3 flex flex-col gap-1 text-xs items-end">
                   <div><span className="font-bold">شماره سند:</span> <span className="font-mono">{voucher.voucher_number || '-'}</span></div>
                   <div><span className="font-bold">تاریخ:</span> <span className="font-mono">{voucher.voucher_date}</span></div>
                   <div><span className="font-bold">شماره روزانه:</span> <span className="font-mono">{voucher.daily_number || '-'}</span></div>
               </div>
           </div>

           {/* Description */}
           {voucher.description && (
               <div className="mb-4 text-xs font-bold bg-slate-50 p-2 rounded print-bg-gray print-border">
                   <span className="text-slate-600">شرح کلی: </span>
                   {voucher.description}
               </div>
           )}

           {/* Items Table */}
           <table className="w-full text-[11px] mb-8 border-collapse border border-slate-800 print-border">
               <thead className="bg-slate-100 print-bg-gray font-bold text-center">
                   <tr>
                       <th className="border border-slate-800 p-1.5 w-10 print-border">ردیف</th>
                       <th className="border border-slate-800 p-1.5 w-24 print-border">کد حساب</th>
                       <th className="border border-slate-800 p-1.5 w-auto print-border">عنوان حساب / تفصیل</th>
                       <th className="border border-slate-800 p-1.5 w-64 print-border">شرح ردیف</th>
                       <th className="border border-slate-800 p-1.5 w-20 print-border">پیگیری / عطف</th>
                       <th className="border border-slate-800 p-1.5 w-28 print-border">بدهکار</th>
                       <th className="border border-slate-800 p-1.5 w-28 print-border">بستانکار</th>
                   </tr>
               </thead>
               <tbody>
                   {items.map((it, idx) => (
                       <tr key={it.id || idx}>
                           <td className="border border-slate-800 p-1.5 text-center font-bold print-border">{idx + 1}</td>
                           <td className="border border-slate-800 p-1.5 text-center font-mono print-border">{it.account_code}</td>
                           <td className="border border-slate-800 p-1.5 print-border">
                              <div className="font-bold">{it.account_title}</div>
                              {it.details_str && <div className="text-[10px] text-slate-600 mt-0.5">{it.details_str}</div>}
                           </td>
                           <td className="border border-slate-800 p-1.5 print-border">{it.description}</td>
                           <td className="border border-slate-800 p-1.5 text-center font-mono text-[10px] print-border">
                               {it.tracking_number ? <div>ت: {it.tracking_number}</div> : null}
                               {it.quantity ? <div>مقدار: {formatNum(it.quantity)}</div> : null}
                           </td>
                           <td className="border border-slate-800 p-1.5 text-left font-mono font-bold print-border">{it.debit > 0 ? formatNum(it.debit) : '-'}</td>
                           <td className="border border-slate-800 p-1.5 text-left font-mono font-bold print-border">{it.credit > 0 ? formatNum(it.credit) : '-'}</td>
                       </tr>
                   ))}
                   {/* Empty rows to fill space optionally can be added here if items length < 5 */}
                   {items.length < 5 && Array.from({ length: 5 - items.length }).map((_, i) => (
                       <tr key={`empty-${i}`} className="text-transparent">
                           <td className="border border-slate-800 p-1.5 print-border">-</td>
                           <td className="border border-slate-800 p-1.5 print-border">-</td>
                           <td className="border border-slate-800 p-1.5 print-border">-</td>
                           <td className="border border-slate-800 p-1.5 print-border">-</td>
                           <td className="border border-slate-800 p-1.5 print-border">-</td>
                           <td className="border border-slate-800 p-1.5 print-border">-</td>
                           <td className="border border-slate-800 p-1.5 print-border">-</td>
                       </tr>
                   ))}
               </tbody>
               <tfoot className="bg-slate-100 print-bg-gray font-black">
                   <tr>
                       <td colSpan="5" className="border border-slate-800 p-2 text-left print-border">جمع کل:</td>
                       <td className="border border-slate-800 p-2 text-left font-mono print-border">{formatNum(voucher.total_debit)}</td>
                       <td className="border border-slate-800 p-2 text-left font-mono print-border">{formatNum(voucher.total_credit)}</td>
                   </tr>
               </tfoot>
           </table>

           {/* Signatures */}
           <div className="flex items-center justify-between mt-12 pt-4 px-8 text-xs font-bold">
               <div className="text-center w-1/4">
                   <div className="mb-12 border-b border-slate-300 print-border-b border-dashed pb-8">تنظیم‌کننده</div>
               </div>
               <div className="text-center w-1/4">
                   <div className="mb-12 border-b border-slate-300 print-border-b border-dashed pb-8">بررسی‌کننده</div>
               </div>
               <div className="text-center w-1/4">
                   <div className="mb-12 border-b border-slate-300 print-border-b border-dashed pb-8">تایید‌کننده</div>
               </div>
               <div className="text-center w-1/4">
                   <div className="mb-12 border-b border-slate-300 print-border-b border-dashed pb-8">مدیر مالی</div>
               </div>
           </div>
       </div>
    </div>
  );
};

window.VoucherPrint = VoucherPrint;
export default VoucherPrint;
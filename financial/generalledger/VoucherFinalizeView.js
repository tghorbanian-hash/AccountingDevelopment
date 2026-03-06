/* Filename: financial/generalledger/VoucherFinalizeView.js */
import React, { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, FileText, CheckCircle, FileWarning, Printer, ShieldCheck, Coins, Layers, Paperclip } from 'lucide-react';

const formatNum = (num) => {
  if (num === null || num === undefined || num === '') return '';
  const parsed = Number(num);
  return isNaN(parsed) ? '' : parsed.toLocaleString('en-US', { maximumFractionDigits: 6 });
};

const parseNum = (str) => {
  const raw = String(str).replace(/,/g, '');
  return isNaN(raw) || raw === '' ? 0 : parseFloat(raw);
};

const VoucherFinalizeView = ({ language, t, voucherId, vouchersList, lookups, contextVals, perms, onClose, onNavigate, onRefreshList }) => {
  const isRtl = language === 'fa';
  const UI = window.UI || {};
  const { Button, InputField, Modal, Badge, Accordion } = UI;
  const supabase = window.supabase;

  const [loading, setLoading] = useState(false);
  const [currentVoucher, setCurrentVoucher] = useState(null);
  const [voucherItems, setVoucherItems] = useState([]);
  
  const [isHeaderOpen, setIsHeaderOpen] = useState(true);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showAttachModal, setShowAttachModal] = useState(false);

  useEffect(() => {
    if (voucherId) fetchVoucherData(voucherId);
  }, [voucherId]);

  const fetchVoucherData = async (id) => {
    setLoading(true);
    try {
      const v = vouchersList.find(x => x.id === id);
      if (v) setCurrentVoucher(v);
      else {
          const { data: vData } = await supabase.schema('gl').from('vouchers').select('*').eq('id', id).single();
          if (vData) setCurrentVoucher(vData);
      }

      const { data, error } = await supabase.schema('gl').from('voucher_items').select('*').eq('voucher_id', id).order('row_number', { ascending: true });
      if (error) throw error;
      
      const mappedItems = (data || []).map(item => {
        const detailsObj = typeof item.details === 'string' ? JSON.parse(item.details || '{}') : (item.details || {});
        return { 
           ...item, 
           currency_code: item.currency_code || detailsObj.currency_code || '',
           details_dict: detailsObj.selected_details || {},
           op_debit: item.op_debit ?? 0, op_credit: item.op_credit ?? 0,
           rep1_debit: item.rep1_debit ?? 0, rep1_credit: item.rep1_credit ?? 0,
           rep2_debit: item.rep2_debit ?? 0, rep2_credit: item.rep2_credit ?? 0,
        };
      });
      setVoucherItems(mappedItems);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = async () => {
    if (!perms.actions.includes('status_change') || currentVoucher?.status !== 'reviewed') return;
    
    if (!window.confirm(t.finalizeWarning)) return;

    let totDeb = 0, totCred = 0;
    voucherItems.forEach(i => { totDeb += parseNum(i.debit); totCred += parseNum(i.credit); });
    
    if (totDeb !== totCred) return alert(t.errNotBalanced.replace('{vNo}', currentVoucher.voucher_number || currentVoucher.daily_number || '-'));

    const activeYearId = currentVoucher.fiscal_year_id || contextVals.fiscal_year_id;
    const period = lookups.fiscalPeriods.find(x => String(x.year_id) === String(activeYearId) && currentVoucher.voucher_date >= x.start_date && currentVoucher.voucher_date <= x.end_date);
    if (!period) return alert(t.errPeriodNotFound.replace('{vNo}', currentVoucher.voucher_number || currentVoucher.daily_number || '-'));
    
    if (period.status !== 'open') {
        const hasException = lookups.fiscalExceptions.some(e => String(e.period_id) === String(period.id) && (e.allowed_statuses || []).includes(period.status));
        if (!hasException) return alert(t.errPeriodClosed.replace('{vNo}', currentVoucher.voucher_number || currentVoucher.daily_number || '-'));
    }

    setLoading(true);
    try {
        const { error } = await supabase.schema('gl').from('vouchers').update({ 
            status: 'finalized',
            fiscal_year_id: activeYearId,
            fiscal_period_id: period.id
        }).eq('id', currentVoucher.id);
        if (error) throw error;
        alert(t.finalizeSuccess);
        onRefreshList();
    } catch (error) {
        console.error('Error finalizing:', error);
        alert(t.finalizeError);
    } finally {
        setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const config = { 'reviewed': { label: t.statusReviewed, bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' }, 'finalized': { label: t.statusFinalized, bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' }};
    const c = config[status] || { label: status, bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };
    return <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${c.bg} ${c.text} ${c.border}`}>{c.label}</span>;
  };

  const currentIndex = vouchersList.findIndex(v => v.id === voucherId);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex !== -1 && currentIndex < vouchersList.length - 1;

  if (!currentVoucher || loading) {
      return (
          <div className="h-full flex items-center justify-center bg-slate-50">
              <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
          </div>
      );
  }

  const getCurrencyTitle = (code) => { if(!code) return '-'; return lookups.currencies.find(c => c.code === code)?.title || code; };

  let totalDebit = 0, totalCredit = 0, opTotalDebit = 0, opTotalCredit = 0, rep1TotalDebit = 0, rep1TotalCredit = 0, rep2TotalDebit = 0, rep2TotalCredit = 0;
  voucherItems.forEach(item => { totalDebit += parseNum(item.debit); totalCredit += parseNum(item.credit); opTotalDebit += parseNum(item.op_debit); opTotalCredit += parseNum(item.op_credit); rep1TotalDebit += parseNum(item.rep1_debit); rep1TotalCredit += parseNum(item.rep1_credit); rep2TotalDebit += parseNum(item.rep2_debit); rep2TotalCredit += parseNum(item.rep2_credit); });
  const isBalanced = totalDebit === totalCredit;

  return (
    <div className={`h-full flex flex-col p-4 md:p-6 bg-slate-50/50 ${isRtl ? 'dir-rtl' : 'dir-ltr'}`}>
      <div className="mb-4 flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={onClose} icon={isRtl ? ArrowRight : ArrowLeft}>{t.backToList}</Button>
          <div className="h-6 w-px bg-slate-200 mx-1"></div>
          <div className="flex gap-1">
             <Button variant="ghost" size="iconSm" onClick={() => onNavigate(vouchersList[currentIndex - 1].id)} disabled={!hasPrev} icon={isRtl ? ArrowRight : ArrowLeft} className="text-slate-500 hover:text-emerald-600" />
             <Button variant="ghost" size="iconSm" onClick={() => onNavigate(vouchersList[currentIndex + 1].id)} disabled={!hasNext} icon={isRtl ? ArrowLeft : ArrowRight} className="text-slate-500 hover:text-emerald-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-800 mr-2">{t.view}</h2>
          {getStatusBadge(currentVoucher.status)}
        </div>
        <div className="flex items-center gap-2">
          {perms.actions.includes('attach') && <Button variant="ghost" size="icon" icon={Paperclip} onClick={() => setShowAttachModal(true)} title={t.attachments} className="text-slate-500 hover:text-emerald-600 hover:bg-emerald-50" />}
          {perms.actions.includes('print') && <Button variant="ghost" size="icon" icon={Printer} onClick={() => setShowPrintModal(true)} title={t.print} className="text-slate-500 hover:text-emerald-600 hover:bg-emerald-50" />}
          
          {perms.actions.includes('status_change') && currentVoucher.status === 'reviewed' && (
              <>
                <div className="h-6 w-px bg-slate-200 mx-1"></div>
                <Button variant="success" onClick={handleFinalize} icon={ShieldCheck}>{t.finalize}</Button>
              </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto flex flex-col gap-3">
        <Accordion title={t.headerInfo} isOpen={isHeaderOpen} onToggle={() => setIsHeaderOpen(!isHeaderOpen)} isRtl={isRtl} icon={FileText} className="shrink-0">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 pointer-events-none opacity-90">
            <InputField label={t.fiscalYear} value={lookups.fiscalYears.find(f => String(f.id) === String(currentVoucher.fiscal_year_id || contextVals.fiscal_year_id))?.title || ''} disabled isRtl={isRtl} />
            <InputField label={t.ledger} value={lookups.ledgers.find(l => String(l.id) === String(currentVoucher.ledger_id))?.title || ''} disabled isRtl={isRtl} />
            <InputField label={t.branch} value={lookups.branches.find(b => String(b.id) === String(currentVoucher.branch_id))?.title || ''} disabled isRtl={isRtl} />
            <InputField label={t.voucherNumber} value={currentVoucher.voucher_number || ''} disabled isRtl={isRtl} dir="ltr" className="text-center" />
            <InputField label={t.dailyNumber} value={currentVoucher.daily_number || '-'} disabled isRtl={isRtl} dir="ltr" className="text-center" />
            <InputField label={t.crossReference} value={currentVoucher.cross_reference || '-'} disabled isRtl={isRtl} dir="ltr" className="text-center" />
            <InputField label={t.referenceNumber} value={currentVoucher.reference_number || '-'} disabled isRtl={isRtl} dir="ltr" className="text-center" />
            <InputField label={t.subsidiaryNumber} value={currentVoucher.subsidiary_number || '-'} disabled isRtl={isRtl} dir="ltr" className="text-center" />
            <InputField type="date" label={t.date} value={currentVoucher.voucher_date || ''} disabled isRtl={isRtl} />
            <InputField label={t.type} value={lookups.docTypes.find(d => d.code === currentVoucher.voucher_type)?.title || ''} disabled isRtl={isRtl} />
            <div className="md:col-span-2 lg:col-span-2">
                <InputField label={t.description} value={currentVoucher.description || ''} disabled isRtl={isRtl} />
            </div>
          </div>
        </Accordion>

        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row gap-4">
          <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col min-w-0">
              <div className="p-3 bg-slate-50 border-b border-slate-200 shrink-0">
                <h3 className="text-sm font-bold text-slate-800">{t.items}</h3>
              </div>
              <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar bg-slate-50">
                 <div className="flex flex-col w-full min-w-min pointer-events-none">
                     {voucherItems.map(item => {
                        const accountObj = lookups.accounts.find(a => String(a.id) === String(item.account_id));
                        const hasForeignCurrency = item.currency_code !== lookups.ledgers.find(l => String(l.id) === String(currentVoucher.ledger_id))?.currency;
                        const accountDisplay = accountObj ? `${accountObj.full_code} - ${accountObj.title}` : '-';
                        const detailsArray = Object.values(item.details_dict || {}).map(id => lookups.allDetailInstances.find(d => String(d.id) === String(id))?.title).filter(Boolean);

                        return (
                            <div key={item.id} className="flex items-center gap-2 p-3 bg-white border-b border-slate-100 text-[11px] w-full shrink-0">
                                <div className="w-8 text-center font-bold text-slate-400 shrink-0">{item.row_number}</div>
                                <div className="w-[260px] shrink-0 font-bold text-slate-700 truncate" title={accountDisplay}>{accountDisplay}</div>
                                <div className="w-[90px] shrink-0 flex flex-col text-left dir-ltr">
                                    <span className="text-[9px] text-slate-400 mb-0.5 uppercase tracking-wide">{t.debit}</span>
                                    <span className={`font-bold ${parseNum(item.debit) > 0 ? 'text-emerald-700' : 'text-slate-300'}`}>{formatNum(item.debit) || '-'}</span>
                                </div>
                                <div className="w-[90px] shrink-0 flex flex-col text-left dir-ltr">
                                    <span className="text-[9px] text-slate-400 mb-0.5 uppercase tracking-wide">{t.credit}</span>
                                    <span className={`font-bold ${parseNum(item.credit) > 0 ? 'text-emerald-700' : 'text-slate-300'}`}>{formatNum(item.credit) || '-'}</span>
                                </div>
                                <div className="w-[70px] shrink-0 flex items-center justify-center gap-1.5 bg-slate-50 border border-slate-100 rounded px-1.5 py-1 text-slate-500 font-bold whitespace-nowrap">
                                    <span>{getCurrencyTitle(item.currency_code)}</span>
                                    {hasForeignCurrency && <Coins size={14} className="text-purple-500 shrink-0" />}
                                </div>
                                <div className="w-[280px] shrink-0 text-slate-600 truncate">{item.description || '-'}</div>
                                <div className="flex-1 flex flex-wrap items-center gap-2 min-w-[200px]">
                                    {detailsArray.length > 0 && <div className="flex items-center gap-1">{detailsArray.map((d, i) => <span key={i} className="text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 text-[10px] truncate max-w-[150px]">{d}</span>)}</div>}
                                    {(item.tracking_number || item.tracking_date) && <div className="flex items-center gap-1 text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 text-[10px]"><FileText size={10}/> {item.tracking_number || '-'} {item.tracking_date ? `(${item.tracking_date})` : ''}</div>}
                                    {item.quantity && parseNum(item.quantity) > 0 && <div className="flex items-center gap-1 text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 text-[10px]"><Layers size={10}/> <span className="dir-ltr font-bold text-slate-600">{formatNum(item.quantity)}</span></div>}
                                </div>
                            </div>
                        );
                     })}
                 </div>
              </div>
          </div>

          <div className="w-full lg:w-[280px] shrink-0 bg-slate-50 border-t lg:border-t-0 lg:border-r rtl:border-r-0 rtl:border-l border-slate-200 flex flex-col overflow-y-auto custom-scrollbar">
              <div className="p-3 border-b border-slate-200 bg-white flex justify-between items-center z-10 shrink-0">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5"><Layers size={14} className="text-emerald-500"/>{t.summary}</h3>
                  <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border bg-white shadow-sm ${isBalanced ? 'text-emerald-700 border-emerald-200' : 'text-red-700 border-red-200'}`}>
                      {isBalanced ? <CheckCircle size={12}/> : <FileWarning size={12}/>}
                      <span className="font-bold text-[10px] dir-ltr">{isBalanced ? t.balanced : formatNum(Math.abs(totalDebit - totalCredit))}</span>
                  </div>
              </div>
              <div className="flex flex-col gap-3 p-3 text-xs">
                 <div className="flex flex-col gap-1.5 bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:border-emerald-300 transition-colors">
                     <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 mb-1 border-b border-slate-100 pb-1.5"><span className="uppercase tracking-wider">{t.summaryBase}</span><Badge variant="indigo" size="sm">{getCurrencyTitle(lookups.ledgers.find(l => String(l.id) === String(currentVoucher.ledger_id))?.currency)}</Badge></div>
                     <div className="flex justify-between items-center"><span className="text-slate-500">{t.debit}:</span> <span className="font-bold text-emerald-700 dir-ltr text-[13px]">{formatNum(totalDebit)}</span></div>
                     <div className="flex justify-between items-center"><span className="text-slate-500">{t.credit}:</span> <span className="font-bold text-emerald-700 dir-ltr text-[13px]">{formatNum(totalCredit)}</span></div>
                 </div>
                 {lookups.currencyGlobals?.op_currency && (
                     <div className="flex flex-col gap-1.5 bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
                         <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 mb-1 border-b border-slate-100 pb-1.5"><span className="uppercase tracking-wider">{t.summaryOp}</span><Badge variant="slate" size="sm">{getCurrencyTitle(lookups.currencyGlobals.op_currency)}</Badge></div>
                         <div className="flex justify-between items-center"><span className="text-slate-500">{t.debit}:</span> <span className="font-bold text-slate-700 dir-ltr text-[13px]">{formatNum(opTotalDebit)}</span></div>
                         <div className="flex justify-between items-center"><span className="text-slate-500">{t.credit}:</span> <span className="font-bold text-slate-700 dir-ltr text-[13px]">{formatNum(opTotalCredit)}</span></div>
                     </div>
                 )}
                 {lookups.currencyGlobals?.rep1_currency && (
                     <div className="flex flex-col gap-1.5 bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
                         <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 mb-1 border-b border-slate-100 pb-1.5"><span className="uppercase tracking-wider">{t.summaryRep1}</span><Badge variant="slate" size="sm">{getCurrencyTitle(lookups.currencyGlobals.rep1_currency)}</Badge></div>
                         <div className="flex justify-between items-center"><span className="text-slate-500">{t.debit}:</span> <span className="font-bold text-slate-700 dir-ltr text-[13px]">{formatNum(rep1TotalDebit)}</span></div>
                         <div className="flex justify-between items-center"><span className="text-slate-500">{t.credit}:</span> <span className="font-bold text-slate-700 dir-ltr text-[13px]">{formatNum(rep1TotalCredit)}</span></div>
                     </div>
                 )}
                 {lookups.currencyGlobals?.rep2_currency && (
                     <div className="flex flex-col gap-1.5 bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
                         <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 mb-1 border-b border-slate-100 pb-1.5"><span className="uppercase tracking-wider">{t.summaryRep2}</span><Badge variant="slate" size="sm">{getCurrencyTitle(lookups.currencyGlobals.rep2_currency)}</Badge></div>
                         <div className="flex justify-between items-center"><span className="text-slate-500">{t.debit}:</span> <span className="font-bold text-slate-700 dir-ltr text-[13px]">{formatNum(rep2TotalDebit)}</span></div>
                         <div className="flex justify-between items-center"><span className="text-slate-500">{t.credit}:</span> <span className="font-bold text-slate-700 dir-ltr text-[13px]">{formatNum(rep2TotalCredit)}</span></div>
                     </div>
                 )}
              </div>
          </div>
        </div>
      </div>

      {showPrintModal && window.VoucherPrint && (
          <Modal isOpen={true} onClose={() => setShowPrintModal(false)} title={t.printVoucher || 'چاپ سند حسابداری'} size="lg">
              <window.VoucherPrint voucherId={voucherId} onClose={() => setShowPrintModal(false)} />
          </Modal>
      )}

      {showAttachModal && window.VoucherAttachments && (
          <Modal isOpen={true} onClose={() => setShowAttachModal(false)} title={t.attachments || 'ضمائم'} size="md">
              <window.VoucherAttachments voucherId={voucherId} onClose={() => setShowAttachModal(false)} readOnly={true} />
          </Modal>
      )}
    </div>
  );
};

window.VoucherFinalizeView = VoucherFinalizeView;
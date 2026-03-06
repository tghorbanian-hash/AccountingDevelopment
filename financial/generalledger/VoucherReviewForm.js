/* Filename: financial/generalledger/VoucherReviewForm.js */
import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowRight, ArrowLeft, Save, CheckCircle, FileText, 
  Printer, Paperclip, ChevronRight, ChevronLeft, Layers, FileWarning
} from 'lucide-react';

const VoucherReviewForm = ({ language, t, voucherId, vouchersList, lookups, contextVals, perms, onClose, onNavigate }) => {
  const isRtl = language === 'fa';
  const UI = window.UI || {};
  const { Button, InputField, SelectField, Accordion, Modal, Badge } = UI;
  const { formatNumber, parseNumber } = UI.utils || { formatNumber: (v)=>v, parseNumber: (v)=>v };
  const supabase = window.supabase;

  const canEdit = perms?.actions.includes('edit');
  const canPrint = perms?.actions.includes('print');
  const canAttach = perms?.actions.includes('attach');

  const [loading, setLoading] = useState(false);
  const [currentVoucher, setCurrentVoucher] = useState(null);
  const [voucherItems, setVoucherItems] = useState([]);
  
  const [isHeaderOpen, setIsHeaderOpen] = useState(true);
  const [isSummaryOpen, setIsSummaryOpen] = useState(true);

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
           op_rate: item.op_rate ?? 1, op_is_reverse: item.op_is_reverse ?? false, op_debit: item.op_debit ?? 0, op_credit: item.op_credit ?? 0,
           rep1_rate: item.rep1_rate ?? 1, rep1_is_reverse: item.rep1_is_reverse ?? false, rep1_debit: item.rep1_debit ?? 0, rep1_credit: item.rep1_credit ?? 0,
           rep2_rate: item.rep2_rate ?? 1, rep2_is_reverse: item.rep2_is_reverse ?? false, rep2_debit: item.rep2_debit ?? 0, rep2_credit: item.rep2_credit ?? 0,
        };
      });
      setVoucherItems(mappedItems);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateFiscalPeriod = async (date, periodId) => {
    try {
        const period = lookups.fiscalPeriods?.find(p => p.id === periodId);
        if (!period) return { valid: false, msg: t.dateNotInPeriods };
        if (period.status === 'open') return { valid: true };

        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;
        if (userId) {
            const { data: exc, error: eError } = await supabase.schema('gl').from('fiscal_period_exceptions').select('*').eq('period_id', period.id).eq('user_id', userId);
            if (!eError && exc && exc.length > 0 && (exc[0].allowed_statuses || []).includes(period.status)) return { valid: true };
        }
        return { valid: false, msg: t.periodClosed };
    } catch (err) {
        return { valid: false, msg: 'Error validating fiscal period.' };
    }
  };

  const handleSaveVoucher = async (status) => {
    if (!supabase || !currentVoucher?.id) return;
    if (!currentVoucher.branch_id) return alert(t.branchReqError);

    const activeDate = currentVoucher.voucher_date;
    const activeYearId = contextVals.fiscal_year_id;

    const targetPeriod = lookups.fiscalPeriods?.find(p => 
        String(p.year_id) === String(activeYearId) && 
        p.start_date <= activeDate && 
        p.end_date >= activeDate
    );

    if (!targetPeriod) {
        alert(isRtl ? 'دوره‌ای برای تاریخ سند در سال مالی انتخاب شده یافت نشد.' : 'No fiscal period found for this date in the selected year.');
        setLoading(false);
        return;
    }

    const periodCheck = await validateFiscalPeriod(activeDate, targetPeriod.id);
    if (!periodCheck.valid) {
        alert(periodCheck.msg);
        return;
    }

    if (currentVoucher.subsidiary_number && currentVoucher.subsidiary_number.trim() !== '') {
        const { data: subData } = await supabase.schema('gl').from('vouchers').select('id').eq('fiscal_year_id', activeYearId).eq('subsidiary_number', currentVoucher.subsidiary_number.trim()).neq('id', currentVoucher.id);
        if (subData && subData.length > 0) return alert(t.subDupError);
    }

    const rowSignatures = new Set();
    for (let i = 0; i < voucherItems.length; i++) {
        const item = voucherItems[i];
        if (!item.description || !item.account_id) return alert(t.reqFields);

        const sig = JSON.stringify({ acc: item.account_id, deb: parseNumber(item.debit), cred: parseNumber(item.credit), cur: item.currency_code, desc: item.description, det: item.details_dict, tn: item.tracking_number, td: item.tracking_date, qty: parseNumber(item.quantity), op_r: parseNumber(item.op_rate), rep1_r: parseNumber(item.rep1_rate), rep2_r: parseNumber(item.rep2_rate) });
        if (rowSignatures.has(sig)) return alert(t.duplicateRowError.replace('{row}', i + 1));
        rowSignatures.add(sig);
    }

    let opTotalDebit = 0, opTotalCredit = 0;
    voucherItems.forEach(item => {
        opTotalDebit += parseNumber(item.op_debit); 
        opTotalCredit += parseNumber(item.op_credit);
    });
    
    if (opTotalDebit === 0 && opTotalCredit === 0) return alert(t.zeroAmountError);
    
    const diffRound = Math.round((opTotalDebit - opTotalCredit) * 100) / 100;
    if (diffRound !== 0) return alert(t.unbalancedError); 

    setLoading(true);
    try {
      const cleanData = (val) => (val === '' ? null : val);
      const { data: authData } = await supabase.auth.getUser();
      const currentUserId = authData?.user?.id || null;

      const voucherData = { 
        ...currentVoucher, status, 
        total_debit: opTotalDebit, 
        total_credit: opTotalCredit,
        fiscal_year_id: activeYearId,
        fiscal_period_id: targetPeriod.id,
        subsidiary_number: cleanData(currentVoucher.subsidiary_number), reference_number: cleanData(currentVoucher.reference_number),
        voucher_number: cleanData(currentVoucher.voucher_number), daily_number: cleanData(currentVoucher.daily_number), cross_reference: cleanData(currentVoucher.cross_reference), updated_at: new Date().toISOString()
      };
      if (status === 'reviewed') voucherData.reviewed_by = currentUserId;
      else voucherData.reviewed_by = null;

      const { error } = await supabase.schema('gl').from('vouchers').update(voucherData).eq('id', voucherData.id);
      if (error) throw error;
      await supabase.schema('gl').from('voucher_items').delete().eq('voucher_id', voucherData.id);

      const itemsToSave = voucherItems.map(item => ({
        voucher_id: voucherData.id, row_number: item.row_number, account_id: cleanData(item.account_id),
        debit: parseNumber(item.debit), credit: parseNumber(item.credit), description: item.description,
        tracking_number: cleanData(item.tracking_number), tracking_date: cleanData(item.tracking_date), quantity: parseNumber(item.quantity) === 0 ? null : parseNumber(item.quantity),
        currency_code: cleanData(item.currency_code),
        details: { selected_details: item.details_dict || {} },
        op_rate: parseNumber(item.op_rate), op_is_reverse: item.op_is_reverse, op_debit: parseNumber(item.op_debit), op_credit: parseNumber(item.op_credit),
        rep1_rate: parseNumber(item.rep1_rate), rep1_is_reverse: item.rep1_is_reverse, rep1_debit: parseNumber(item.rep1_debit), rep1_credit: parseNumber(item.rep1_credit),
        rep2_rate: parseNumber(item.rep2_rate), rep2_is_reverse: item.rep2_is_reverse, rep2_debit: parseNumber(item.rep2_debit), rep2_credit: parseNumber(item.rep2_credit)
      }));

      if (itemsToSave.length > 0) {
        const { error: itemsError } = await supabase.schema('gl').from('voucher_items').insert(itemsToSave);
        if (itemsError) throw itemsError;
      }
      onClose();
    } catch (error) {
      console.error('Error saving voucher:', error);
      alert('Error saving voucher: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const currentIndex = vouchersList.findIndex(v => v.id === voucherId);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex !== -1 && currentIndex < vouchersList.length - 1;

  if (!currentVoucher || loading) {
      return (
          <div className="h-full flex items-center justify-center bg-slate-50">
              <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
          </div>
      );
  }

  const isReadonly = currentVoucher.status === 'reviewed' || !perms.actions.includes('edit');
  const isVoucherNoManual = (() => {
      const meta = typeof lookups.ledgers.find(l => String(l.id) === String(currentVoucher.ledger_id))?.metadata === 'string' ? JSON.parse(lookups.ledgers.find(l => String(l.id) === String(currentVoucher.ledger_id))?.metadata || '{}') : (lookups.ledgers.find(l => String(l.id) === String(currentVoucher.ledger_id))?.metadata || {});
      return meta.uniquenessScope === 'none';
  })();
  const getCurrencyTitle = (code) => { if(!code) return '-'; return lookups.currencies.find(c => c.code === code)?.title || code; };

  let opTotalDebit = 0, opTotalCredit = 0, rep1TotalDebit = 0, rep1TotalCredit = 0, rep2TotalDebit = 0, rep2TotalCredit = 0;
  const baseTotalsByCurrency = {};

  voucherItems.forEach(item => {
      const cCode = item.currency_code || '-';
      if (!baseTotalsByCurrency[cCode]) {
          baseTotalsByCurrency[cCode] = { debit: 0, credit: 0 };
      }
      baseTotalsByCurrency[cCode].debit += parseNumber(item.debit);
      baseTotalsByCurrency[cCode].credit += parseNumber(item.credit);

      opTotalDebit += parseNumber(item.op_debit); 
      opTotalCredit += parseNumber(item.op_credit);
      rep1TotalDebit += parseNumber(item.rep1_debit); 
      rep1TotalCredit += parseNumber(item.rep1_credit);
      rep2TotalDebit += parseNumber(item.rep2_debit); 
      rep2TotalCredit += parseNumber(item.rep2_credit);
  });

  const diffRound = Math.round((opTotalDebit - opTotalCredit) * 100) / 100;
  const isBalanced = diffRound === 0;

  const ledgerCurrencyLabel = lookups.ledgers.find(l => String(l.id) === String(currentVoucher.ledger_id))?.currency || lookups.currencyGlobals?.op_currency;

  const ledgerStructureCode = useMemo(() => {
     const ledger = lookups.ledgers.find(l => String(l.id) === String(currentVoucher?.ledger_id));
     return String(ledger?.structure || '').trim();
  }, [lookups.ledgers, currentVoucher?.ledger_id]);

  const validAccountsOptions = useMemo(() => {
     const targetStructure = lookups.accountStructures.find(s => String(s.code).trim() === ledgerStructureCode);
     const structureId = targetStructure ? String(targetStructure.id) : null;
     return lookups.accounts.filter(a => {
        const isSubsidiary = a.level === 'subsidiary' || a.level === 'معین' || a.level === '4';
        return String(a.structure_id) === structureId && isSubsidiary;
     }).map(a => ({ value: a.id, label: `${a.full_code} - ${a.title}`, subLabel: a.path }));
  }, [lookups.accounts, lookups.accountStructures, ledgerStructureCode]);

  const allDetailInstancesFormatted = useMemo(() => {
      return lookups.allDetailInstances.map(d => ({
          id: d.id,
          category_code: d.detail_type_code,
          label: (d.detail_code ? d.detail_code + ' - ' : '') + d.title
      }));
  }, [lookups.allDetailInstances]);

  // بررسی وضعیت FX در زمان بررسی
  const currentLedger = lookups.ledgers.find(l => String(l.id) === String(currentVoucher.ledger_id));
  const defaultCurrency = currentLedger?.currency || '';
  const isFxVoucher = voucherItems.some(i => i.currency_code !== defaultCurrency);

  const getStatusBadgeUI = (status) => {
    const config = {
        'draft': { label: t.statusDraft, bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
        'temporary': { label: t.statusTemporary, bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
        'reviewed': { label: t.statusReviewed, bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
        'final': { label: t.statusFinal, bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    };
    const c = config[status] || { label: status, bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };
    return <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${c.bg} ${c.text} ${c.border}`}>{c.label}</span>;
  };

  return (
    <div className={`h-full flex flex-col p-4 md:p-6 bg-slate-50/50 ${isRtl ? 'dir-rtl' : 'dir-ltr'}`}>
      <div className="mb-4 flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={onClose} icon={isRtl ? ArrowRight : ArrowLeft}>{t.backToList}</Button>
          <div className="h-6 w-px bg-slate-200 mx-1"></div>
          <div className="flex gap-1">
             <Button variant="ghost" size="iconSm" onClick={() => onNavigate(vouchersList[currentIndex - 1].id)} disabled={!hasPrev} icon={isRtl ? ArrowRight : ArrowLeft} className="text-slate-500 hover:text-indigo-600" />
             <Button variant="ghost" size="iconSm" onClick={() => onNavigate(vouchersList[currentIndex + 1].id)} disabled={!hasNext} icon={isRtl ? ArrowLeft : ArrowRight} className="text-slate-500 hover:text-indigo-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-800 mr-2">{isReadonly ? t.view : t.edit}</h2>
          {getStatusBadgeUI(currentVoucher.status)}
        </div>
        <div className="flex items-center gap-2">
          {canAttach && <Button variant="ghost" size="icon" icon={Paperclip} onClick={() => setShowAttachModal(true)} title={t.attachments} className="text-slate-500 hover:text-indigo-600 hover:bg-indigo-50" />}
          {canPrint && <Button variant="ghost" size="icon" icon={Printer} onClick={() => setShowPrintModal(true)} title={t.print} className="text-slate-500 hover:text-indigo-600 hover:bg-indigo-50" />}
          
          {canEdit && (
            isReadonly ? (
              <>
                 <div className="h-6 w-px bg-slate-200 mx-1"></div>
                 <Button variant="outline" onClick={() => handleSaveVoucher('temporary')} icon={Save}>{t.revertToTemp}</Button>
              </>
            ) : (
              <>
                <div className="h-6 w-px bg-slate-200 mx-1"></div>
                <Button variant="outline" onClick={() => handleSaveVoucher('temporary')} icon={Save}>{t.saveTemp}</Button>
                <Button variant="primary" onClick={() => handleSaveVoucher('reviewed')} icon={CheckCircle}>{t.saveReviewed}</Button>
              </>
            )
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto flex flex-col gap-3">
        <Accordion title={t.headerInfo} isOpen={isHeaderOpen} onToggle={() => setIsHeaderOpen(!isHeaderOpen)} isRtl={isRtl} icon={FileText} className="shrink-0">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <InputField label={t.fiscalYear} value={lookups.fiscalYears.find(f => String(f.id) === String(currentVoucher.fiscal_year_id || contextVals.fiscal_year_id))?.title || ''} disabled isRtl={isRtl} />
            <InputField label={t.ledger} value={lookups.ledgers.find(l => String(l.id) === String(currentVoucher.ledger_id))?.title || ''} disabled isRtl={isRtl} />
            <SelectField label={t.branch} value={currentVoucher.branch_id || ''} onChange={(e) => setCurrentVoucher({...currentVoucher, branch_id: e.target.value})} disabled={isReadonly} isRtl={isRtl}>
               <option value="" disabled>{t.selectBranch}</option>
               {lookups.branches.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
            </SelectField>
            
            <InputField label={t.voucherNumber} value={currentVoucher.voucher_number || ''} onChange={(e) => setCurrentVoucher({...currentVoucher, voucher_number: e.target.value})} disabled={isReadonly || !isVoucherNoManual} isRtl={isRtl} dir="ltr" className={`text-center ${(!isVoucherNoManual || isReadonly) ? 'bg-slate-50' : 'bg-white'}`} />
            <InputField label={t.dailyNumber} value={currentVoucher.daily_number || '-'} disabled isRtl={isRtl} dir="ltr" className="text-center bg-slate-50" />
            <InputField label={t.crossReference} value={currentVoucher.cross_reference || '-'} disabled isRtl={isRtl} dir="ltr" className="text-center bg-slate-50" />
            
            <InputField label={t.referenceNumber} value={currentVoucher.reference_number || '-'} disabled={true} isRtl={isRtl} dir="ltr" className="text-center bg-slate-50" />
            <InputField label={t.subsidiaryNumber} value={currentVoucher.subsidiary_number || ''} onChange={(e) => setCurrentVoucher({...currentVoucher, subsidiary_number: e.target.value})} disabled={isReadonly} isRtl={isRtl} dir="ltr" className="text-center" />
            <InputField type="date" label={t.date} value={currentVoucher.voucher_date || ''} onChange={(e) => setCurrentVoucher({...currentVoucher, voucher_date: e.target.value})} disabled={isReadonly} isRtl={isRtl} />
            
            <SelectField label={t.type} value={currentVoucher.voucher_type || ''} onChange={(e) => setCurrentVoucher({...currentVoucher, voucher_type: e.target.value})} disabled={isReadonly} isRtl={isRtl} >
              {lookups.docTypes.map(d => <option key={d.id} value={d.code}>{d.title}</option>)}
            </SelectField>
            <div className="md:col-span-2 lg:col-span-2">
                <InputField label={t.description} value={currentVoucher.description || ''} onChange={(e) => setCurrentVoucher({...currentVoucher, description: e.target.value})} disabled={isReadonly} isRtl={isRtl} />
            </div>
          </div>
        </Accordion>

        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row gap-4">
            {window.VoucherReviewItemsGrid && (
               <window.VoucherReviewItemsGrid 
                   voucherItems={voucherItems}
                   setVoucherItems={setVoucherItems}
                   currentVoucher={currentVoucher}
                   lookups={lookups}
                   validAccounts={validAccountsOptions}
                   allDetailInstancesFormatted={allDetailInstancesFormatted}
                   isReadonly={isReadonly}
                   isFxVoucher={isFxVoucher}
                   t={t}
                   isRtl={isRtl}
                   supabase={supabase}
                   isSummaryOpen={isSummaryOpen}
                   toggleSummary={() => setIsSummaryOpen(!isSummaryOpen)}
                   onFocusRow={() => setIsHeaderOpen(false)}
               />
            )}

          {isSummaryOpen && (
              <div className="w-full lg:w-[280px] shrink-0 bg-slate-50 border-t lg:border-t-0 lg:border-r rtl:border-r-0 rtl:border-l border-slate-200 flex flex-col overflow-y-auto custom-scrollbar">
                  <div className="p-3 border-b border-slate-200 bg-white flex justify-between items-center z-10 shrink-0">
                      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5"><Layers size={14} className="text-indigo-500"/>{t.summary}</h3>
                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border bg-white shadow-sm ${isBalanced ? 'text-emerald-700 border-emerald-200' : 'text-red-700 border-red-200'}`}>
                          {isBalanced ? <CheckCircle size={12}/> : <FileWarning size={12}/>}
                          <span className="font-bold text-[10px] dir-ltr">{isBalanced ? t.balanced : formatNumber(Math.abs(opTotalDebit - opTotalCredit))}</span>
                      </div>
                  </div>
                  <div className="flex flex-col gap-3 p-3 text-xs">
                     {Object.keys(baseTotalsByCurrency).map(code => (
                         <div key={code} className="flex flex-col gap-1.5 bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors">
                             <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 mb-1 border-b border-slate-100 pb-1.5">
                                 <span className="uppercase tracking-wider">{t.summaryBase}</span>
                                 <Badge variant="indigo" size="sm">{getCurrencyTitle(code)}</Badge>
                             </div>
                             <div className="flex justify-between items-center"><span className="text-slate-500">{t.debit}:</span> <span className="font-bold text-indigo-700 dir-ltr text-[13px]">{formatNumber(baseTotalsByCurrency[code].debit)}</span></div>
                             <div className="flex justify-between items-center"><span className="text-slate-500">{t.credit}:</span> <span className="font-bold text-indigo-700 dir-ltr text-[13px]">{formatNumber(baseTotalsByCurrency[code].credit)}</span></div>
                         </div>
                     ))}
                     <div className="flex flex-col gap-1.5 bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
                         <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 mb-1 border-b border-slate-100 pb-1.5">
                             <span className="uppercase tracking-wider">{t.summaryOp}</span>
                             <Badge variant="slate" size="sm">{getCurrencyTitle(ledgerCurrencyLabel)}</Badge>
                         </div>
                         <div className="flex justify-between items-center"><span className="text-slate-500">{t.debit}:</span> <span className="font-bold text-slate-700 dir-ltr text-[13px]">{formatNumber(opTotalDebit)}</span></div>
                         <div className="flex justify-between items-center"><span className="text-slate-500">{t.credit}:</span> <span className="font-bold text-slate-700 dir-ltr text-[13px]">{formatNumber(opTotalCredit)}</span></div>
                     </div>
                     {lookups.currencyGlobals?.rep1_currency && (
                         <div className="flex flex-col gap-1.5 bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
                             <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 mb-1 border-b border-slate-100 pb-1.5"><span className="uppercase tracking-wider">{t.summaryRep1}</span><Badge variant="slate" size="sm">{getCurrencyTitle(lookups.currencyGlobals.rep1_currency)}</Badge></div>
                             <div className="flex justify-between items-center"><span className="text-slate-500">{t.debit}:</span> <span className="font-bold text-slate-700 dir-ltr text-[13px]">{formatNumber(rep1TotalDebit)}</span></div>
                             <div className="flex justify-between items-center"><span className="text-slate-500">{t.credit}:</span> <span className="font-bold text-slate-700 dir-ltr text-[13px]">{formatNumber(rep1TotalCredit)}</span></div>
                         </div>
                     )}
                     {lookups.currencyGlobals?.rep2_currency && (
                         <div className="flex flex-col gap-1.5 bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
                             <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 mb-1 border-b border-slate-100 pb-1.5"><span className="uppercase tracking-wider">{t.summaryRep2}</span><Badge variant="slate" size="sm">{getCurrencyTitle(lookups.currencyGlobals.rep2_currency)}</Badge></div>
                             <div className="flex justify-between items-center"><span className="text-slate-500">{t.debit}:</span> <span className="font-bold text-slate-700 dir-ltr text-[13px]">{formatNumber(rep2TotalDebit)}</span></div>
                             <div className="flex justify-between items-center"><span className="text-slate-500">{t.credit}:</span> <span className="font-bold text-slate-700 dir-ltr text-[13px]">{formatNumber(rep2TotalCredit)}</span></div>
                         </div>
                     )}
                  </div>
              </div>
          )}
        </div>
      </div>

      {showPrintModal && window.VoucherPrint && (
          <Modal isOpen={true} onClose={() => setShowPrintModal(false)} title={t.printVoucher || 'چاپ سند حسابداری'} size="lg">
              <window.VoucherPrint voucherId={voucherId} onClose={() => setShowPrintModal(false)} />
          </Modal>
      )}

      {showAttachModal && window.VoucherAttachments && (
          <Modal isOpen={true} onClose={() => setShowAttachModal(false)} title={t.attachments || 'ضمائم'} size="md">
              <window.VoucherAttachments voucherId={voucherId} onClose={() => setShowAttachModal(false)} readOnly={isReadonly} />
          </Modal>
      )}
    </div>
  );
};

window.VoucherReviewForm = VoucherReviewForm;
export default VoucherReviewForm;
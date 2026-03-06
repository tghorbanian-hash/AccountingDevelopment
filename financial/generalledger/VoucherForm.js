/* Filename: financial/generalledger/VoucherForm.js */
import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowRight, ArrowLeft, Save, CheckCircle, FileText, 
  Printer, Paperclip, ChevronRight, ChevronLeft, Layers, FileWarning
} from 'lucide-react';

const VoucherForm = ({ voucherId, isCopy, isFxMode, contextVals, lookups, onClose, language = 'fa' }) => {
  const { fetchAutoNumbers, validateFiscalPeriod, localTranslations } = window.VoucherUtils || {};
  const t = localTranslations ? (localTranslations[language] || localTranslations['en']) : {};
  const isRtl = language === 'fa';
  
  const UI = window.UI || {};
  const { Button, InputField, SelectField, Accordion, Modal, Badge } = UI;
  const { formatNumber, parseNumber } = UI.utils || { formatNumber: (v)=>v, parseNumber: (v)=>v };
  const supabase = window.supabase;

  const perms = lookups.permissions;
  const canEdit = perms?.actions.includes('edit');
  const canCreate = perms?.actions.includes('create');
  const canPrint = perms?.actions.includes('print');
  const canAttach = perms?.actions.includes('attach');

  const [localVoucherId, setLocalVoucherId] = useState(voucherId);
  const [currentVoucher, setCurrentVoucher] = useState(null);
  const [voucherItems, setVoucherItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isHeaderOpen, setIsHeaderOpen] = useState(true);
  const [isSummaryOpen, setIsSummaryOpen] = useState(true);
  
  const [voucherToPrint, setVoucherToPrint] = useState(null);
  const [voucherForAttachments, setVoucherForAttachments] = useState(null);
  
  const [isFxVoucher, setIsFxVoucher] = useState(isFxMode || false);

  useEffect(() => {
     setLocalVoucherId(voucherId);
  }, [voucherId]);

  const ledgerStructureCode = useMemo(() => {
     const ledger = lookups.ledgers.find(l => String(l.id) === String(contextVals.ledger_id));
     return String(ledger?.structure || '').trim();
  }, [lookups.ledgers, contextVals.ledger_id]);

  const filteredBranches = useMemo(() => {
      const allBranches = lookups.branches;
      if (perms?.allowed_branches && perms.allowed_branches.length > 0) {
          return allBranches.filter(b => perms.allowed_branches.includes(b.id));
      }
      return allBranches;
  }, [lookups.branches, perms]);

  const filteredLedgers = useMemo(() => {
      const allLedgers = lookups.ledgers;
      if (perms?.allowed_ledgers && perms.allowed_ledgers.length > 0) {
          return allLedgers.filter(l => perms.allowed_ledgers.includes(String(l.id)));
      }
      return allLedgers;
  }, [lookups.ledgers, perms]);

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

  const currentLedgerMeta = useMemo(() => {
     const ledger = lookups.ledgers.find(l => String(l.id) === String(contextVals.ledger_id));
     return (typeof ledger?.metadata === 'string' ? JSON.parse(ledger.metadata) : ledger?.metadata) || {};
  }, [lookups.ledgers, contextVals.ledger_id]);

  useEffect(() => {
    const initializeForm = async () => {
      setLoading(true);
      if (localVoucherId) {
        try {
          const { data: vData, error: vError } = await supabase.schema('gl').from('vouchers').select('*').eq('id', localVoucherId).single();
          if (vError) throw vError;

          const { data: itemsData, error: itemsError } = await supabase.schema('gl').from('voucher_items').select('*').eq('voucher_id', localVoucherId).order('row_number', { ascending: true });
          if (itemsError) throw itemsError;

          let targetVoucher = { ...vData };
          const currentLedger = lookups.ledgers.find(l => String(l.id) === String(targetVoucher.ledger_id));
          const defaultCurrency = currentLedger?.currency || '';
          let hasFx = false;

          let mappedItems = (itemsData || []).map((item, index) => {
            const detailsObj = typeof item.details === 'string' ? JSON.parse(item.details || '{}') : (item.details || {});
            const code = item.currency_code || detailsObj.currency_code || defaultCurrency;
            if (code !== defaultCurrency) hasFx = true;

            return { 
               ...item, 
               id: isCopy ? 'temp_' + Date.now() + '_' + index : item.id,
               voucher_id: isCopy ? null : item.voucher_id,
               currency_code: code,
               details_dict: detailsObj.selected_details || {},
               op_rate: item.op_rate ?? 1, op_is_reverse: item.op_is_reverse ?? false, op_debit: item.op_debit ?? 0, op_credit: item.op_credit ?? 0,
               rep1_rate: item.rep1_rate ?? 1, rep1_is_reverse: item.rep1_is_reverse ?? false, rep1_debit: item.rep1_debit ?? 0, rep1_credit: item.rep1_credit ?? 0,
               rep2_rate: item.rep2_rate ?? 1, rep2_is_reverse: item.rep2_is_reverse ?? false, rep2_debit: item.rep2_debit ?? 0, rep2_credit: item.rep2_credit ?? 0,
            };
          });

          if (isCopy) {
              const today = new Date().toISOString().split('T')[0];
              const { nextDaily, nextCross, nextVoucher } = await fetchAutoNumbers(today, targetVoucher.ledger_id, contextVals.fiscal_year_id, targetVoucher.branch_id, supabase);
              targetVoucher = {
                  ...targetVoucher, id: null, voucher_date: today, status: 'draft',
                  voucher_number: nextVoucher, daily_number: nextDaily, cross_reference: nextCross,
                  reference_number: '', reviewed_by: null, approved_by: null, fiscal_year_id: contextVals.fiscal_year_id
              };
              setIsHeaderOpen(true);
              setIsFxVoucher(isFxMode); 
          } else {
              setIsHeaderOpen(false);
              setIsFxVoucher(hasFx);
          }

          setCurrentVoucher(targetVoucher);
          setVoucherItems(mappedItems);
        } catch (error) {
          console.error('Error initializing form:', error);
        }
      } else {
        setIsFxVoucher(isFxMode);
        const initialLedgerId = contextVals.ledger_id;
        const initialFyId = contextVals.fiscal_year_id;
        const currentLedger = lookups.ledgers.find(l => String(l.id) === String(initialLedgerId));
        const defaultCurrency = currentLedger?.currency || '';
        
        const defaultBranch = filteredBranches.find(b => b.is_default) || filteredBranches[0];
        const today = new Date().toISOString().split('T')[0];

        const { nextDaily, nextCross, nextVoucher } = await fetchAutoNumbers(today, initialLedgerId, initialFyId, defaultBranch?.id, supabase);

        setCurrentVoucher({
          voucher_date: today, voucher_type: lookups.docTypes.length > 0 ? lookups.docTypes[0].code : 'sys_general',
          status: 'draft', description: '', subsidiary_number: '',
          voucher_number: nextVoucher, daily_number: nextDaily, cross_reference: nextCross,
          reference_number: '', fiscal_year_id: initialFyId, ledger_id: initialLedgerId, branch_id: defaultBranch?.id || ''
        });
        const newId = 'temp_' + Date.now();
        setVoucherItems([{
          id: newId, row_number: 1, account_id: '', details_dict: {}, debit: 0, credit: 0,
          currency_code: defaultCurrency, description: '', tracking_number: '', tracking_date: '', quantity: '',
          op_rate: 1, op_is_reverse: false, op_debit: 0, op_credit: 0,
          rep1_rate: 1, rep1_is_reverse: false, rep1_debit: 0, rep1_credit: 0,
          rep2_rate: 1, rep2_is_reverse: false, rep2_debit: 0, rep2_credit: 0
        }]);
        setIsHeaderOpen(false);
      }
      setLoading(false);
    };

    initializeForm();
  }, [localVoucherId, isCopy, contextVals, filteredBranches, isFxMode]);

  const getRowSignature = (item) => {
     return JSON.stringify({
         acc: item.account_id, deb: parseNumber(item.debit), cred: parseNumber(item.credit),
         cur: item.currency_code, desc: item.description, det: item.details_dict,
         tn: item.tracking_number, td: item.tracking_date, qty: parseNumber(item.quantity),
         op_r: parseNumber(item.op_rate), rep1_r: parseNumber(item.rep1_rate), rep2_r: parseNumber(item.rep2_rate)
     });
  };

  const getCurrencyTitle = (code) => {
      if(!code) return '-';
      return lookups.currencies.find(c => c.code === code)?.title || code;
  };

  const handleNavigate = async (direction) => {
      if (!currentVoucher || !currentVoucher.voucher_number || !currentVoucher.fiscal_year_id) return;
      setLoading(true);
      try {
          let query = supabase.schema('gl').from('vouchers').select('id').eq('fiscal_year_id', currentVoucher.fiscal_year_id);
          if (currentVoucher.branch_id) query = query.eq('branch_id', currentVoucher.branch_id);

          const currentVn = Number(currentVoucher.voucher_number) || 0;
          const currentDn = Number(currentVoucher.daily_number) || 0;

          if (direction === 'next') {
              query = query.or(`voucher_number.gt.${currentVn},and(voucher_number.eq.${currentVn},daily_number.gt.${currentDn})`)
                           .order('voucher_number', { ascending: true }).order('daily_number', { ascending: true });
          } else {
              query = query.or(`voucher_number.lt.${currentVn},and(voucher_number.eq.${currentVn},daily_number.lt.${currentDn})`)
                           .order('voucher_number', { ascending: false }).order('daily_number', { ascending: false });
          }

          const { data } = await query.limit(1).maybeSingle();
          if (data && data.id) setLocalVoucherId(data.id);
          else alert(isRtl ? 'سند دیگری در این مسیر یافت نشد.' : 'No further vouchers found in this direction.');
      } catch (err) {
          alert(isRtl ? 'خطا در پیمایش اسناد.' : 'Error navigating vouchers.');
      } finally {
          setLoading(false);
      }
  };

  const handleSaveVoucher = async (status) => {
    if (!supabase) return;

    const isNew = !currentVoucher.id || isCopy;
    if (isNew && !canCreate) { alert(t.accessDenied); return; }
    if (!isNew && !canEdit) { alert(t.accessDenied); return; }
    
    if (!currentVoucher.branch_id) { alert(t.branchReqError); return; }

    const activeDate = currentVoucher.voucher_date;
    const activeYearId = contextVals.fiscal_year_id;

    const targetPeriod = lookups.fiscalPeriods?.find(p => String(p.year_id) === String(activeYearId) && p.start_date <= activeDate && p.end_date >= activeDate);
    if (!targetPeriod) { alert(isRtl ? 'دوره‌ای برای تاریخ سند در سال مالی انتخاب شده یافت نشد.' : 'No fiscal period found for this date.'); return; }

    const periodCheck = await validateFiscalPeriod(activeDate, targetPeriod.id, supabase, t);
    if (!periodCheck.valid) { alert(periodCheck.msg); return; }

    if (currentVoucher.subsidiary_number && currentVoucher.subsidiary_number.trim() !== '') {
        const query = supabase.schema('gl').from('vouchers').select('id').eq('fiscal_year_id', activeYearId).eq('subsidiary_number', currentVoucher.subsidiary_number.trim());
        if (currentVoucher.id) query.neq('id', currentVoucher.id);
        const { data: subData } = await query;
        if (subData && subData.length > 0) { alert(t.subDupError); return; }
    }

    const rowSignatures = new Set();
    for (let i = 0; i < voucherItems.length; i++) {
        const item = voucherItems[i];
        if (!item.description || !item.account_id) { alert(t.reqFields); return; }
        
        const sig = getRowSignature(item);
        if (rowSignatures.has(sig)) { alert(t.duplicateRowError.replace('{row}', i + 1)); return; }
        rowSignatures.add(sig);

        const account = lookups.accounts.find(a => String(a.id) === String(item.account_id));
        if (account && account.metadata) {
            const meta = typeof account.metadata === 'string' ? JSON.parse(account.metadata) : account.metadata;
            if (meta.trackFeature && meta.trackMandatory && (!item.tracking_number || !item.tracking_date)) { alert(t.trackingReqError + ' ' + (i + 1) + ' (' + account.title + ')'); return; }
            if (meta.qtyFeature && meta.qtyMandatory && (!item.quantity || parseNumber(item.quantity) <= 0)) { alert(t.qtyReqError + ' ' + (i + 1) + ' (' + account.title + ')'); return; }
            if (meta.currencyFeature && meta.currencyMandatory && (!item.op_rate || !item.rep1_rate || !item.rep2_rate || parseNumber(item.op_rate) <= 0)) { alert(t.currencyMandatoryError.replace('{row}', i + 1)); return; }
        }

        const allowedDetailTypes = lookups.detailTypes.filter(dt => (typeof account?.metadata === 'string' ? JSON.parse(account.metadata) : account?.metadata)?.tafsils?.some(tId => String(dt.id) === String(tId) || dt.code === String(tId)));
        if (allowedDetailTypes.length > 0) {
           const dict = item.details_dict || {};
           for (const type of allowedDetailTypes) { if (!dict[type.code]) { alert(t.detailRequiredError.replace('{type}', type.title).replace('{row}', i + 1)); return; } }
        }
    }

    let opTotalDebit = 0, opTotalCredit = 0;
    voucherItems.forEach(item => { opTotalDebit += parseNumber(item.op_debit); opTotalCredit += parseNumber(item.op_credit); });
    
    if (opTotalDebit === 0 && opTotalCredit === 0) { alert(t.zeroAmountError); return; }
    
    const diffRound = Math.round((opTotalDebit - opTotalCredit) * 100) / 100;
    if (status === 'temporary' && diffRound !== 0) { alert(t.unbalancedError); return; }

    setLoading(true);
    try {
      const cleanData = (val) => (val === '' ? null : val);
      const { data: authData } = await supabase.auth.getUser();
      const currentUserId = authData?.user?.id || null;

      const voucherData = { 
        ...currentVoucher, status, fiscal_year_id: activeYearId, fiscal_period_id: targetPeriod.id,
        total_debit: opTotalDebit, total_credit: opTotalCredit,
        subsidiary_number: cleanData(currentVoucher.subsidiary_number), reference_number: cleanData(currentVoucher.reference_number),
        voucher_number: cleanData(currentVoucher.voucher_number), daily_number: cleanData(currentVoucher.daily_number), cross_reference: cleanData(currentVoucher.cross_reference),
      };

      if (status === 'reviewed') voucherData.reviewed_by = currentUserId;
      if (status === 'final') voucherData.approved_by = currentUserId;

      let savedVoucherId = voucherData.id;

      if (savedVoucherId) {
        const { error } = await supabase.schema('gl').from('vouchers').update(voucherData).eq('id', savedVoucherId);
        if (error) throw error;
        await supabase.schema('gl').from('voucher_items').delete().eq('voucher_id', savedVoucherId);
      } else {
        const { nextDaily, nextCross, nextVoucher, config } = await fetchAutoNumbers(voucherData.voucher_date, voucherData.ledger_id, voucherData.fiscal_year_id, voucherData.branch_id, supabase);
        voucherData.daily_number = nextDaily; voucherData.cross_reference = nextCross; voucherData.created_by = currentUserId;
        
        const meta = config?.metadata || {};
        const scope = meta.uniquenessScope || 'ledger';

        if (scope !== 'none') voucherData.voucher_number = nextVoucher;
        else if (!voucherData.voucher_number) { alert(isRtl ? 'شماره سند الزامی است.' : 'Voucher Number is required.'); setLoading(false); return; }

        const { data, error } = await supabase.schema('gl').from('vouchers').insert([voucherData]).select().single();
        if (error) throw error;
        savedVoucherId = data.id;

        if (scope !== 'none' && config) {
            const resetYear = meta.resetYear !== false;
            let lastNums = meta.lastNumbers || {};
            if (scope === 'ledger') { if (resetYear) lastNums[activeYearId] = Number(voucherData.voucher_number); else lastNums.global = Number(voucherData.voucher_number); } 
            else if (scope === 'branch') { if (resetYear) { if (!lastNums[activeYearId]) lastNums[activeYearId] = {}; lastNums[activeYearId][voucherData.branch_id] = Number(voucherData.voucher_number); } else { lastNums[voucherData.branch_id] = Number(voucherData.voucher_number); } }
            
            const { data: latestLedger } = await supabase.schema('gl').from('ledgers').select('metadata').eq('id', voucherData.ledger_id).single();
            if (latestLedger) {
               const latestMeta = (typeof latestLedger.metadata === 'string' ? JSON.parse(latestLedger.metadata) : latestLedger.metadata) || {};
               await supabase.schema('gl').from('ledgers').update({ metadata: { ...latestMeta, lastNumbers: lastNums } }).eq('id', voucherData.ledger_id);
            }
        }
      }

      const itemsToSave = voucherItems.map((item) => ({
          voucher_id: savedVoucherId, row_number: item.row_number, account_id: cleanData(item.account_id),
          debit: parseNumber(item.debit), credit: parseNumber(item.credit), description: item.description,
          tracking_number: cleanData(item.tracking_number), tracking_date: cleanData(item.tracking_date), quantity: parseNumber(item.quantity) === 0 ? null : parseNumber(item.quantity),
          currency_code: cleanData(item.currency_code), details: { selected_details: item.details_dict || {} },
          op_rate: parseNumber(item.op_rate), op_is_reverse: item.op_is_reverse, op_debit: parseNumber(item.op_debit), op_credit: parseNumber(item.op_credit),
          rep1_rate: parseNumber(item.rep1_rate), rep1_is_reverse: item.rep1_is_reverse, rep1_debit: parseNumber(item.rep1_debit), rep1_credit: parseNumber(item.rep1_credit),
          rep2_rate: parseNumber(item.rep2_rate), rep2_is_reverse: item.rep2_is_reverse, rep2_debit: parseNumber(item.rep2_debit), rep2_credit: parseNumber(item.rep2_credit),
      }));

      if (itemsToSave.length > 0) {
        const { error: itemsError } = await supabase.schema('gl').from('voucher_items').insert(itemsToSave);
        if (itemsError) throw itemsError;
      }
      onClose(true);
    } catch (error) {
      console.error('Error saving voucher:', error);
      alert('Error saving voucher: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !currentVoucher) {
      return <div className="h-full flex items-center justify-center bg-slate-50"><div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div></div>;
  }

  let opTotalDebit = 0, opTotalCredit = 0, rep1TotalDebit = 0, rep1TotalCredit = 0, rep2TotalDebit = 0, rep2TotalCredit = 0;
  const baseTotalsByCurrency = {};

  voucherItems.forEach(item => {
      const cCode = item.currency_code || '-';
      if (!baseTotalsByCurrency[cCode]) baseTotalsByCurrency[cCode] = { debit: 0, credit: 0 };
      baseTotalsByCurrency[cCode].debit += parseNumber(item.debit);
      baseTotalsByCurrency[cCode].credit += parseNumber(item.credit);
      opTotalDebit += parseNumber(item.op_debit); opTotalCredit += parseNumber(item.op_credit);
      rep1TotalDebit += parseNumber(item.rep1_debit); rep1TotalCredit += parseNumber(item.rep1_credit);
      rep2TotalDebit += parseNumber(item.rep2_debit); rep2TotalCredit += parseNumber(item.rep2_credit);
  });

  const isBalanced = Math.round((opTotalDebit - opTotalCredit) * 100) / 100 === 0;
  const isReadonly = currentVoucher.status === 'reviewed' || currentVoucher.status === 'final' || (!canEdit && currentVoucher.id && !isCopy);
  const isVoucherNoManual = currentLedgerMeta.uniquenessScope === 'none';
  const currentFiscalYearTitle = lookups.fiscalYears.find(f => String(f.id) === String(currentVoucher.fiscal_year_id || contextVals.fiscal_year_id))?.title || '';
  const ledgerCurrencyLabel = lookups.ledgers.find(l => String(l.id) === String(currentVoucher.ledger_id))?.currency || lookups.currencyGlobals?.op_currency;

  const getStatusBadgeUI = (status) => {
    const config = { 'draft': { label: t.statusDraft, bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' }, 'temporary': { label: t.statusTemporary, bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' }, 'reviewed': { label: t.statusReviewed, bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' }, 'final': { label: t.statusFinal, bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' }};
    const c = config[status] || { label: status, bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };
    return <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${c.bg} ${c.text} ${c.border}`}>{c.label}</span>;
  };

  return (
    <div className={`h-full flex flex-col p-4 md:p-6 bg-slate-50/50 ${isRtl ? 'dir-rtl' : 'dir-ltr'}`}>
      <div className="mb-4 flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => onClose(false)} icon={isRtl ? ArrowRight : ArrowLeft}>{t.backToList}</Button>
          <div className="h-6 w-px bg-slate-200 mx-1"></div>
          {currentVoucher.id && !isCopy && (
             <div className="flex gap-1 mr-2 rtl:mr-0 rtl:ml-2">
                 <Button variant="ghost" size="icon" onClick={() => handleNavigate('prev')} icon={isRtl ? ChevronRight : ChevronLeft} title={isRtl ? 'سند قبلی' : 'Previous Voucher'} className="text-slate-500 hover:text-indigo-600 hover:bg-indigo-50" />
                 <Button variant="ghost" size="icon" onClick={() => handleNavigate('next')} icon={isRtl ? ChevronLeft : ChevronRight} title={isRtl ? 'سند بعدی' : 'Next Voucher'} className="text-slate-500 hover:text-indigo-600 hover:bg-indigo-50" />
             </div>
          )}
          <h2 className="text-lg font-bold text-slate-800">{currentVoucher.id && currentVoucher.status !== 'draft' && !isCopy ? t.edit : t.newVoucher}</h2>
          {currentVoucher.id && getStatusBadgeUI(currentVoucher.status)}
        </div>
        <div className="flex items-center gap-2">
          {currentVoucher.id && !isCopy && (
            <>
              {canAttach && <Button variant="ghost" size="icon" icon={Paperclip} onClick={() => setVoucherForAttachments(currentVoucher)} title={t.attachments} className="text-slate-500 hover:text-indigo-600 hover:bg-indigo-50" />}
              {canPrint && <Button variant="ghost" size="icon" icon={Printer} onClick={() => setVoucherToPrint(currentVoucher)} title={t.print} className="text-slate-500 hover:text-indigo-600 hover:bg-indigo-50" />}
              <div className="h-6 w-px bg-slate-200 mx-1"></div>
            </>
          )}
          {!isReadonly && (
            <>
              <Button variant="outline" onClick={() => handleSaveVoucher('draft')} icon={Save}>{t.saveDraft}</Button>
              <Button variant="primary" onClick={() => handleSaveVoucher('temporary')} icon={CheckCircle}>{t.saveTemp}</Button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto flex flex-col gap-3">
        <Accordion title={t.headerInfo} isOpen={isHeaderOpen} onToggle={() => setIsHeaderOpen(!isHeaderOpen)} isRtl={isRtl} icon={FileText} className="shrink-0">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <InputField label={t.fiscalYear} value={currentFiscalYearTitle} disabled isRtl={isRtl} />
            <SelectField label={t.ledger} value={currentVoucher.ledger_id || ''} onChange={(e) => setCurrentVoucher({...currentVoucher, ledger_id: e.target.value})} disabled={isReadonly} isRtl={isRtl}>
               <option value="" disabled>{isRtl ? 'انتخاب دفتر' : 'Select Ledger'}</option>
               {filteredLedgers.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
            </SelectField>
            <SelectField label={t.branch} value={currentVoucher.branch_id || ''} onChange={(e) => {
                const newBranch = e.target.value; setCurrentVoucher({...currentVoucher, branch_id: newBranch});
                if (!currentVoucher.id || currentVoucher.status === 'draft') {
                   fetchAutoNumbers(currentVoucher.voucher_date, currentVoucher.ledger_id, contextVals.fiscal_year_id, newBranch, supabase).then(({nextVoucher}) => {
                       if (currentLedgerMeta.uniquenessScope === 'branch') setCurrentVoucher(prev => ({...prev, voucher_number: nextVoucher}));
                   });
                }
            }} disabled={isReadonly} isRtl={isRtl}>
               <option value="" disabled>{t.selectBranch}</option>
               {filteredBranches.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
            </SelectField>
            
            <InputField label={t.voucherNumber} value={currentVoucher.voucher_number || ''} onChange={(e) => setCurrentVoucher({...currentVoucher, voucher_number: e.target.value})} disabled={isReadonly || !isVoucherNoManual} isRtl={isRtl} dir="ltr" className={`text-center ${!isVoucherNoManual ? 'bg-slate-50' : 'bg-white'}`} />
            <InputField label={t.dailyNumber} value={currentVoucher.daily_number || '-'} disabled isRtl={isRtl} dir="ltr" className="text-center bg-slate-50" />
            <InputField label={t.crossReference} value={currentVoucher.cross_reference || '-'} disabled isRtl={isRtl} dir="ltr" className="text-center bg-slate-50" />
            
            <InputField label={t.referenceNumber} value={currentVoucher.reference_number || '-'} disabled={true} isRtl={isRtl} dir="ltr" className="text-center bg-slate-50" />
            <InputField label={t.subsidiaryNumber} value={currentVoucher.subsidiary_number || ''} onChange={(e) => setCurrentVoucher({...currentVoucher, subsidiary_number: e.target.value})} disabled={isReadonly} isRtl={isRtl} dir="ltr" className="text-center" />
            <InputField type="date" label={t.date} value={currentVoucher.voucher_date || ''} onChange={(e) => {
               const newDate = e.target.value; setCurrentVoucher({...currentVoucher, voucher_date: newDate});
               if (!currentVoucher.id || currentVoucher.status === 'draft') {
                   fetchAutoNumbers(newDate, currentVoucher.ledger_id, contextVals.fiscal_year_id, currentVoucher.branch_id, supabase).then(({nextDaily}) => {
                       setCurrentVoucher(prev => ({...prev, daily_number: nextDaily}));
                   });
               }
            }} disabled={isReadonly} isRtl={isRtl} />
            
            <SelectField label={t.type} value={currentVoucher.voucher_type || ''} onChange={(e) => setCurrentVoucher({...currentVoucher, voucher_type: e.target.value})} disabled={isReadonly} isRtl={isRtl} >
              {lookups.docTypes.map(d => <option key={d.id} value={d.code}>{d.title}</option>)}
            </SelectField>

            <div className="md:col-span-2 lg:col-span-2">
                <InputField label={t.description} value={currentVoucher.description || ''} onChange={(e) => setCurrentVoucher({...currentVoucher, description: e.target.value})} disabled={isReadonly} isRtl={isRtl} />
            </div>
          </div>
        </Accordion>

        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row gap-4">
            {window.VoucherItemsGrid && (
               <window.VoucherItemsGrid 
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

      <Modal isOpen={!!voucherToPrint} onClose={() => setVoucherToPrint(null)} title={t.printVoucher || 'چاپ سند حسابداری'} size="full">
          {voucherToPrint && window.VoucherPrint ? (
              <window.VoucherPrint voucherId={voucherToPrint.id || localVoucherId} onClose={() => setVoucherToPrint(null)} />
          ) : (
              <div className="p-10 flex flex-col items-center justify-center text-slate-500 gap-4">
                  <FileWarning size={48} className="text-amber-400" />
                  <p>{isRtl ? 'کامپوننت چاپ یافت نشد. لطفاً فایل VoucherPrint.js را در پروژه قرار دهید.' : 'Print component not found. Please include VoucherPrint.js.'}</p>
              </div>
          )}
      </Modal>

      <Modal isOpen={!!voucherForAttachments} onClose={() => setVoucherForAttachments(null)} title={t.attachments || 'اسناد مثبته و ضمائم'} size="md">
          {voucherForAttachments && window.VoucherAttachments ? (
              <window.VoucherAttachments voucherId={voucherForAttachments.id || localVoucherId} onClose={() => setVoucherForAttachments(null)} readOnly={isReadonly} />
          ) : (
              <div className="p-10 flex flex-col items-center justify-center text-slate-500 gap-4">
                  <FileWarning size={48} className="text-amber-400" />
                  <p>{isRtl ? 'کامپوننت ضمائم یافت نشد. لطفاً فایل VoucherAttachments.js را در پروژه قرار دهید.' : 'Attachments component not found. Please include VoucherAttachments.js.'}</p>
              </div>
          )}
      </Modal>
    </div>
  );
};

window.VoucherForm = VoucherForm;
export default VoucherForm;
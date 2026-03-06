/* Filename: financial/generalledger/VoucherReviewForm.js */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Edit, Trash2, ArrowRight, ArrowLeft, Save, FileText, CheckCircle, FileWarning, Scale, Copy, X, Printer, Plus, Eye, RotateCcw, Coins, Calculator, CopyPlus, PanelRightClose, PanelRightOpen, Layers, Paperclip } from 'lucide-react';

const normalizeFa = (str) => {
  if (!str) return '';
  return String(str).replace(/[يِي]/g, 'ی').replace(/[كک]/g, 'ک').replace(/[إأآا]/g, 'ا').toLowerCase();
};

const calcConv = (amount, rate, isReverse) => {
    if (!amount || !rate) return 0;
    const numAmt = parseFloat(amount);
    const numRate = parseFloat(rate);
    if (isNaN(numAmt) || isNaN(numRate) || numRate === 0) return 0;
    return isReverse ? (numAmt / numRate) : (numAmt * numRate);
};

const formatNum = (num) => {
  if (num === null || num === undefined || num === '') return '';
  const parsed = Number(num);
  return isNaN(parsed) ? '' : parsed.toLocaleString('en-US', { maximumFractionDigits: 6 });
};

const parseNum = (str) => {
  const raw = String(str).replace(/,/g, '');
  return isNaN(raw) || raw === '' ? 0 : parseFloat(raw);
};

const RowNumberInput = ({ value, onChangeRow, max }) => {
    const [val, setVal] = useState(value);
    useEffect(() => { setVal(value); }, [value]);
    const handleBlur = () => {
        let num = parseInt(val, 10);
        if (isNaN(num) || num < 1) num = 1;
        if (num > max) num = max;
        setVal(num);
        if (num !== value) onChangeRow(num);
    };
    return (
        <input type="number" className="w-8 text-center bg-transparent border-b border-dashed border-slate-300 outline-none text-[11px] font-bold text-slate-500 hover:border-indigo-400 focus:border-indigo-500 focus:text-indigo-700 transition-colors" value={val} onChange={e => setVal(e.target.value)} onBlur={handleBlur} onKeyDown={e => e.key === 'Enter' && handleBlur()} title="تغییر شماره ردیف" />
    );
};

const SearchableAccountSelect = ({ accounts, value, onChange, disabled, placeholder, className, onFocus }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);
  const selectedAcc = accounts.find(a => String(a.id) === String(value));
  const displaySelected = selectedAcc ? (selectedAcc.full_code + ' - ' + selectedAcc.title) : '';

  useEffect(() => {
    const handleClickOutside = (event) => { if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setIsOpen(false); };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const normalizedSearch = normalizeFa(search);
  const filtered = accounts.filter(a => (a.full_code && normalizeFa(a.full_code).includes(normalizedSearch)) || (a.title && normalizeFa(a.title).includes(normalizedSearch)) || (a.displayPath && normalizeFa(a.displayPath).includes(normalizedSearch)));

  return (
    <div className="relative w-full h-full flex items-center" ref={wrapperRef}>
      <input type="text" className={className} value={isOpen ? search : displaySelected} onChange={e => { setSearch(e.target.value); setIsOpen(true); }} onFocus={() => { setIsOpen(true); setSearch(''); if (onFocus) onFocus(); }} disabled={disabled} placeholder={placeholder} title={displaySelected} />
      {isOpen && !disabled && (
        <div className="absolute z-[60] w-[300px] rtl:right-0 ltr:left-0 top-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-56 overflow-y-auto custom-scrollbar">
          {filtered.map(acc => (
            <div key={acc.id} className="px-3 py-1.5 text-[11px] hover:bg-indigo-50 cursor-pointer border-b border-slate-50 last:border-0" onMouseDown={(e) => { e.preventDefault(); onChange(acc.id); setIsOpen(false); }}>
              <div className="font-bold text-slate-800 dir-ltr text-right">{acc.full_code} - {acc.title}</div>
              <div className="text-slate-500 truncate mt-0.5 text-[10px]">{acc.path}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const MultiDetailSelector = ({ allowedTypes, allInstances, value = {}, onChange, disabled, t }) => {
  const [activeType, setActiveType] = useState(null);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => { if (wrapperRef.current && !wrapperRef.current.contains(event.target)) { setActiveType(null); setSearch(''); } };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!allowedTypes || allowedTypes.length === 0) return <div className="text-slate-300 text-[11px] px-2 h-8 flex items-center">{t.noDetail}</div>;

  return (
    <div className="flex flex-wrap gap-1.5 w-full items-center p-1 px-1.5" ref={wrapperRef}>
       {allowedTypes.map(type => {
          const selectedId = value[type.code];
          if (selectedId) {
             const selectedDetail = allInstances.find(d => String(d.id) === String(selectedId));
             const display = selectedDetail ? ((selectedDetail.detail_code ? selectedDetail.detail_code + ' - ' : '') + selectedDetail.title) : 'Unknown';
             return (
               <div key={type.code} className="flex items-center gap-1 bg-indigo-50 text-indigo-800 text-[11px] px-2 py-0.5 rounded border border-indigo-200 shadow-sm transition-all hover:shadow-md">
                 <span className="font-bold truncate max-w-[140px] select-none" title={display}>{display}</span>
                 {!disabled && <X size={12} className="cursor-pointer text-indigo-400 hover:text-red-500 hover:bg-red-50 rounded-full p-0.5 shrink-0 transition-colors" onClick={(e) => { e.stopPropagation(); const newVal = {...value}; delete newVal[type.code]; onChange(newVal); }} />}
               </div>
             )
          }
          return (
             <div key={type.code} className="relative">
                {activeType === type.code ? (
                   <div className="relative">
                      <input autoFocus className="w-[140px] bg-white border border-indigo-400 shadow-sm focus:ring-2 focus:ring-indigo-100 rounded h-6 px-2 outline-none text-[11px] text-slate-800 transition-all" value={search} onChange={e => setSearch(e.target.value)} placeholder={t.searchPlaceholder.replace('{type}', type.title)} />
                      <div className="absolute z-[70] w-[220px] rtl:right-0 ltr:left-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-y-auto custom-scrollbar">
                         {allInstances.filter(d => d.detail_type_code === type.code && (normalizeFa(d.title).includes(normalizeFa(search)) || (d.detail_code && normalizeFa(d.detail_code).includes(normalizeFa(search))))).map(d => (
                             <div key={d.id} className="px-3 py-2 text-[11px] hover:bg-indigo-50 cursor-pointer border-b border-slate-50 last:border-0 transition-colors" onMouseDown={(e) => { e.preventDefault(); onChange({ ...value, [type.code]: d.id }); setActiveType(null); setSearch(''); }}>
                               <div className="font-bold text-slate-800">{d.detail_code ? d.detail_code + ' - ' : ''}{d.title}</div>
                             </div>
                         ))}
                      </div>
                   </div>
                ) : (
                   <button onClick={(e) => { e.preventDefault(); if(!disabled) { setActiveType(type.code); setSearch(''); } }} className={`bg-white border border-dashed text-[11px] px-2 py-0.5 rounded transition-colors ${disabled ? 'border-slate-200 text-slate-400 cursor-not-allowed' : 'border-slate-300 text-slate-600 hover:border-indigo-400 hover:text-indigo-700 hover:bg-indigo-50'}`}>+ {type.title}</button>
                )}
             </div>
          )
       })}
    </div>
  );
}

const VoucherReviewForm = ({ language, t, voucherId, vouchersList, lookups, contextVals, perms, onClose, onNavigate }) => {
  const isRtl = language === 'fa';
  const UI = window.UI || {};
  const { Button, InputField, SelectField, Modal, Badge, Accordion } = UI;
  const supabase = window.supabase;

  const [loading, setLoading] = useState(false);
  const [currentVoucher, setCurrentVoucher] = useState(null);
  const [voucherItems, setVoucherItems] = useState([]);
  
  const [focusedRowId, setFocusedRowId] = useState(null);
  const [isHeaderOpen, setIsHeaderOpen] = useState(true);
  const [isSummaryOpen, setIsSummaryOpen] = useState(true);
  const [currencyModalIndex, setCurrencyModalIndex] = useState(null);

  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showAttachModal, setShowAttachModal] = useState(false);

  useEffect(() => {
    if (voucherId) {
      fetchVoucherData(voucherId);
    }
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
      setFocusedRowId(null);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const getValidDetailTypes = (accountId) => {
     if (!accountId) return [];
     const account = lookups.accounts.find(a => String(a.id) === String(accountId));
     if (!account || !account.metadata) return [];
     const meta = typeof account.metadata === 'string' ? JSON.parse(account.metadata) : account.metadata;
     const allowedTafsilCodesOrIds = meta.tafsils || [];
     if (allowedTafsilCodesOrIds.length === 0) return [];
     return lookups.detailTypes.filter(dt => allowedTafsilCodesOrIds.some(t => String(dt.id) === String(t) || dt.code === String(t)));
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

        const sig = JSON.stringify({ acc: item.account_id, deb: parseNum(item.debit), cred: parseNum(item.credit), cur: item.currency_code, desc: item.description, det: item.details_dict, tn: item.tracking_number, td: item.tracking_date, qty: parseNum(item.quantity), op_r: parseNum(item.op_rate), rep1_r: parseNum(item.rep1_rate), rep2_r: parseNum(item.rep2_rate) });
        if (rowSignatures.has(sig)) return alert(t.duplicateRowError.replace('{row}', i + 1));
        rowSignatures.add(sig);

        const account = lookups.accounts.find(a => String(a.id) === String(item.account_id));
        if (account && account.metadata) {
            const meta = typeof account.metadata === 'string' ? JSON.parse(account.metadata) : account.metadata;
            if (meta.trackFeature && meta.trackMandatory && (!item.tracking_number || !item.tracking_date)) return alert(t.trackingReqError + ' ' + (i + 1) + ' (' + account.title + ')');
            if (meta.qtyFeature && meta.qtyMandatory && (!item.quantity || parseNum(item.quantity) <= 0)) return alert(t.qtyReqError + ' ' + (i + 1) + ' (' + account.title + ')');
            if (meta.currencyFeature && meta.currencyMandatory && (!item.op_rate || !item.rep1_rate || !item.rep2_rate || parseNum(item.op_rate) <= 0)) return alert(t.currencyMandatoryError.replace('{row}', i + 1));
        }

        const allowedDetailTypes = getValidDetailTypes(item.account_id);
        if (allowedDetailTypes.length > 0) {
           const dict = item.details_dict || {};
           for (const type of allowedDetailTypes) {
               if (!dict[type.code]) return alert(t.detailRequiredError.replace('{type}', type.title).replace('{row}', i + 1));
           }
        }
    }

    let totalDebit = 0, totalCredit = 0;
    voucherItems.forEach(item => { totalDebit += parseNum(item.debit); totalCredit += parseNum(item.credit); });
    if (totalDebit === 0 && totalCredit === 0) return alert(t.zeroAmountError);
    if (totalDebit !== totalCredit) return alert(t.unbalancedError);

    setLoading(true);
    try {
      const cleanData = (val) => (val === '' ? null : val);
      const { data: authData } = await supabase.auth.getUser();
      const currentUserId = authData?.user?.id || null;

      const voucherData = { 
        ...currentVoucher, status, total_debit: totalDebit, total_credit: totalCredit,
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
        debit: parseNum(item.debit), credit: parseNum(item.credit), description: item.description,
        tracking_number: cleanData(item.tracking_number), tracking_date: cleanData(item.tracking_date), quantity: parseNum(item.quantity) === 0 ? null : parseNum(item.quantity),
        currency_code: cleanData(item.currency_code),
        details: { selected_details: item.details_dict || {} },
        op_rate: parseNum(item.op_rate), op_is_reverse: item.op_is_reverse, op_debit: parseNum(item.op_debit), op_credit: parseNum(item.op_credit),
        rep1_rate: parseNum(item.rep1_rate), rep1_is_reverse: item.rep1_is_reverse, rep1_debit: parseNum(item.rep1_debit), rep1_credit: parseNum(item.rep1_credit),
        rep2_rate: parseNum(item.rep2_rate), rep2_is_reverse: item.rep2_is_reverse, rep2_debit: parseNum(item.rep2_debit), rep2_credit: parseNum(item.rep2_credit)
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

  const handleItemChange = (index, field, value) => {
    const newItems = [...voucherItems];
    if (field === 'debit' || field === 'credit') {
      const otherField = field === 'debit' ? 'credit' : 'debit';
      if (parseNum(value) > 0) newItems[index][otherField] = 0;
    }
    newItems[index][field] = value;
    
    if (field === 'currency_code' && lookups.currencyGlobals) {
       if (value === lookups.currencyGlobals.op_currency) { newItems[index].op_rate = 1; newItems[index].op_is_reverse = false; }
       if (value === lookups.currencyGlobals.rep1_currency) { newItems[index].rep1_rate = 1; newItems[index].rep1_is_reverse = false; }
       if (value === lookups.currencyGlobals.rep2_currency) { newItems[index].rep2_rate = 1; newItems[index].rep2_is_reverse = false; }
    }
    
    if (['debit', 'credit', 'currency_code', 'op_rate', 'op_is_reverse', 'rep1_rate', 'rep1_is_reverse', 'rep2_rate', 'rep2_is_reverse'].includes(field)) {
        const baseDebit = parseNum(newItems[index].debit);
        const baseCredit = parseNum(newItems[index].credit);
        newItems[index].op_debit = calcConv(baseDebit, newItems[index].op_rate, newItems[index].op_is_reverse);
        newItems[index].op_credit = calcConv(baseCredit, newItems[index].op_rate, newItems[index].op_is_reverse);
        newItems[index].rep1_debit = calcConv(baseDebit, newItems[index].rep1_rate, newItems[index].rep1_is_reverse);
        newItems[index].rep1_credit = calcConv(baseCredit, newItems[index].rep1_rate, newItems[index].rep1_is_reverse);
        newItems[index].rep2_debit = calcConv(baseDebit, newItems[index].rep2_rate, newItems[index].rep2_is_reverse);
        newItems[index].rep2_credit = calcConv(baseCredit, newItems[index].rep2_rate, newItems[index].rep2_is_reverse);
    }

    if (field === 'account_id') {
      const selectedAcc = lookups.accounts.find(a => String(a.id) === String(value));
      const currentLedger = lookups.ledgers.find(l => String(l.id) === String(currentVoucher.ledger_id));
      let newCurrency = currentLedger?.currency || '';

      if (selectedAcc && selectedAcc.metadata) {
        const meta = typeof selectedAcc.metadata === 'string' ? JSON.parse(selectedAcc.metadata) : selectedAcc.metadata;
        if (meta.currencyFeature && meta.currency_code) newCurrency = meta.currency_code;
      }
      
      newItems[index]['currency_code'] = newCurrency;
      if (lookups.currencyGlobals) {
           if (newCurrency === lookups.currencyGlobals.op_currency) { newItems[index].op_rate = 1; newItems[index].op_is_reverse = false; }
           if (newCurrency === lookups.currencyGlobals.rep1_currency) { newItems[index].rep1_rate = 1; newItems[index].rep1_is_reverse = false; }
           if (newCurrency === lookups.currencyGlobals.rep2_currency) { newItems[index].rep2_rate = 1; newItems[index].rep2_is_reverse = false; }
      }
      
      const baseDebit = parseNum(newItems[index].debit);
      const baseCredit = parseNum(newItems[index].credit);
      newItems[index].op_debit = calcConv(baseDebit, newItems[index].op_rate, newItems[index].op_is_reverse);
      newItems[index].op_credit = calcConv(baseCredit, newItems[index].op_rate, newItems[index].op_is_reverse);
      newItems[index].rep1_debit = calcConv(baseDebit, newItems[index].rep1_rate, newItems[index].rep1_is_reverse);
      newItems[index].rep1_credit = calcConv(baseCredit, newItems[index].rep1_rate, newItems[index].rep1_is_reverse);
      newItems[index].rep2_debit = calcConv(baseDebit, newItems[index].rep2_rate, newItems[index].rep2_is_reverse);
      newItems[index].rep2_credit = calcConv(baseCredit, newItems[index].rep2_rate, newItems[index].rep2_is_reverse);
      newItems[index]['details_dict'] = {}; 
    }
    setVoucherItems(newItems);
  };

  const globalBalance = () => {
    const totalDebit = voucherItems.reduce((sum, item) => sum + parseNum(item.debit), 0);
    const totalCredit = voucherItems.reduce((sum, item) => sum + parseNum(item.credit), 0);
    const diff = totalDebit - totalCredit;
    if (diff === 0) return;

    const emptyRowIndex = voucherItems.findIndex(item => parseNum(item.debit) === 0 && parseNum(item.credit) === 0);
    if (emptyRowIndex !== -1) {
       const newItems = [...voucherItems];
       if (diff < 0) {
           newItems[emptyRowIndex].debit = Math.abs(diff); newItems[emptyRowIndex].credit = 0;
           newItems[emptyRowIndex].op_debit = calcConv(Math.abs(diff), newItems[emptyRowIndex].op_rate, newItems[emptyRowIndex].op_is_reverse); newItems[emptyRowIndex].op_credit = 0;
           newItems[emptyRowIndex].rep1_debit = calcConv(Math.abs(diff), newItems[emptyRowIndex].rep1_rate, newItems[emptyRowIndex].rep1_is_reverse); newItems[emptyRowIndex].rep1_credit = 0;
           newItems[emptyRowIndex].rep2_debit = calcConv(Math.abs(diff), newItems[emptyRowIndex].rep2_rate, newItems[emptyRowIndex].rep2_is_reverse); newItems[emptyRowIndex].rep2_credit = 0;
       } else {
           newItems[emptyRowIndex].credit = diff; newItems[emptyRowIndex].debit = 0;
           newItems[emptyRowIndex].op_credit = calcConv(diff, newItems[emptyRowIndex].op_rate, newItems[emptyRowIndex].op_is_reverse); newItems[emptyRowIndex].op_debit = 0;
           newItems[emptyRowIndex].rep1_credit = calcConv(diff, newItems[emptyRowIndex].rep1_rate, newItems[emptyRowIndex].rep1_is_reverse); newItems[emptyRowIndex].rep1_debit = 0;
           newItems[emptyRowIndex].rep2_credit = calcConv(diff, newItems[emptyRowIndex].rep2_rate, newItems[emptyRowIndex].rep2_is_reverse); newItems[emptyRowIndex].rep2_debit = 0;
       }
       setVoucherItems(newItems);
       setFocusedRowId(newItems[emptyRowIndex].id);
       setIsHeaderOpen(false);
    } else {
       const currentLedger = lookups.ledgers.find(l => String(l.id) === String(currentVoucher.ledger_id));
       const newId = 'temp_' + Date.now();
       setVoucherItems([...voucherItems, { 
         id: newId, row_number: voucherItems.length + 1, account_id: '', details_dict: {},
         debit: diff < 0 ? Math.abs(diff) : 0, credit: diff > 0 ? diff : 0, currency_code: currentLedger?.currency || '', description: '', tracking_number: '', tracking_date: '', quantity: '',
         op_rate: 1, op_is_reverse: false, op_debit: diff < 0 ? Math.abs(diff) : 0, op_credit: diff > 0 ? diff : 0,
         rep1_rate: 1, rep1_is_reverse: false, rep1_debit: diff < 0 ? Math.abs(diff) : 0, rep1_credit: diff > 0 ? diff : 0,
         rep2_rate: 1, rep2_is_reverse: false, rep2_debit: diff < 0 ? Math.abs(diff) : 0, rep2_credit: diff > 0 ? diff : 0
       }]);
       setFocusedRowId(newId);
       setIsHeaderOpen(false);
    }
  };

  const addItemRow = () => {
    const currentLedger = lookups.ledgers.find(l => String(l.id) === String(currentVoucher?.ledger_id));
    const lastDescription = voucherItems.length > 0 ? voucherItems[voucherItems.length - 1].description : '';
    const newId = 'temp_' + Date.now();
    setVoucherItems([...voucherItems, { 
      id: newId, row_number: voucherItems.length + 1, account_id: '', details_dict: {},
      debit: 0, credit: 0, currency_code: currentLedger?.currency || '', description: lastDescription, tracking_number: '', tracking_date: '', quantity: '',
      op_rate: 1, op_is_reverse: false, op_debit: 0, op_credit: 0, rep1_rate: 1, rep1_is_reverse: false, rep1_debit: 0, rep1_credit: 0, rep2_rate: 1, rep2_is_reverse: false, rep2_debit: 0, rep2_credit: 0
    }]);
    setFocusedRowId(newId);
    setIsHeaderOpen(false);
  };

  const duplicateRow = (index) => {
      const itemToCopy = voucherItems[index];
      const newId = 'temp_' + Date.now();
      const itemsCpy = [...voucherItems];
      itemsCpy.splice(index + 1, 0, { ...itemToCopy, id: newId });
      setVoucherItems(itemsCpy.map((it, idx) => ({...it, row_number: idx + 1})));
      setFocusedRowId(newId);
      setIsHeaderOpen(false);
  };

  const removeRow = (index) => {
    if (voucherItems.length > 1) {
      const itemsCpy = voucherItems.filter((_, i) => i !== index);
      setVoucherItems(itemsCpy.map((it, idx) => ({...it, row_number: idx + 1})));
    }
  };

  const getStatusBadge = (status) => {
    const config = { 'temporary': { label: t.statusTemporary, bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' }, 'reviewed': { label: t.statusReviewed, bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' }};
    const c = config[status] || { label: status, bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };
    return <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${c.bg} ${c.text} ${c.border}`}>{c.label}</span>;
  };

  const ledgerStructureCode = useMemo(() => {
     const ledger = lookups.ledgers.find(l => String(l.id) === String(currentVoucher?.ledger_id));
     return String(ledger?.structure || '').trim();
  }, [lookups.ledgers, currentVoucher?.ledger_id]);

  const validAccountsForLedger = useMemo(() => {
     const targetStructure = lookups.accountStructures.find(s => String(s.code).trim() === ledgerStructureCode);
     const structureId = targetStructure ? String(targetStructure.id) : null;
     return lookups.accounts.filter(a => {
        const isSubsidiary = a.level === 'subsidiary' || a.level === 'معین' || a.level === '4';
        return String(a.structure_id) === structureId && isSubsidiary;
     });
  }, [lookups.accounts, lookups.accountStructures, ledgerStructureCode]);

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

  let totalDebit = 0, totalCredit = 0, opTotalDebit = 0, opTotalCredit = 0, rep1TotalDebit = 0, rep1TotalCredit = 0, rep2TotalDebit = 0, rep2TotalCredit = 0;
  voucherItems.forEach(item => { totalDebit += parseNum(item.debit); totalCredit += parseNum(item.credit); opTotalDebit += parseNum(item.op_debit); opTotalCredit += parseNum(item.op_credit); rep1TotalDebit += parseNum(item.rep1_debit); rep1TotalCredit += parseNum(item.rep1_credit); rep2TotalDebit += parseNum(item.rep2_debit); rep2TotalCredit += parseNum(item.rep2_credit); });
  const isBalanced = totalDebit === totalCredit;

  return (
    <div className={`h-full flex flex-col p-4 md:p-6 bg-slate-50/50 ${isRtl ? 'dir-rtl' : 'dir-ltr'}`} onClick={() => setFocusedRowId(null)}>
      <div className="mb-4 flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm shrink-0" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={onClose} icon={isRtl ? ArrowRight : ArrowLeft}>{t.backToList}</Button>
          <div className="h-6 w-px bg-slate-200 mx-1"></div>
          <div className="flex gap-1">
             <Button variant="ghost" size="iconSm" onClick={() => onNavigate(vouchersList[currentIndex - 1].id)} disabled={!hasPrev} icon={isRtl ? ArrowRight : ArrowLeft} className="text-slate-500 hover:text-indigo-600" />
             <Button variant="ghost" size="iconSm" onClick={() => onNavigate(vouchersList[currentIndex + 1].id)} disabled={!hasNext} icon={isRtl ? ArrowLeft : ArrowRight} className="text-slate-500 hover:text-indigo-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-800 mr-2">{isReadonly ? t.view : t.edit}</h2>
          {getStatusBadge(currentVoucher.status)}
        </div>
        <div className="flex items-center gap-2">
          {perms.actions.includes('attach') && <Button variant="ghost" size="icon" icon={Paperclip} onClick={() => setShowAttachModal(true)} title={t.attachments} className="text-slate-500 hover:text-indigo-600 hover:bg-indigo-50" />}
          {perms.actions.includes('print') && <Button variant="ghost" size="icon" icon={Printer} onClick={() => setShowPrintModal(true)} title={t.print} className="text-slate-500 hover:text-indigo-600 hover:bg-indigo-50" />}
          {(perms.actions.includes('attach') || perms.actions.includes('print')) && <div className="h-6 w-px bg-slate-200 mx-1"></div>}
          
          {perms.actions.includes('edit') && (
            isReadonly ? (
              <Button variant="outline" onClick={() => handleSaveVoucher('temporary')} icon={RotateCcw}>{t.revertToTemp}</Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => handleSaveVoucher('temporary')} icon={Save}>{t.saveTemp}</Button>
                <Button variant="primary" onClick={() => handleSaveVoucher('reviewed')} icon={CheckCircle}>{t.saveReviewed}</Button>
              </>
            )
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto flex flex-col gap-3">
        <Accordion title={t.headerInfo} isOpen={isHeaderOpen} onToggle={() => setIsHeaderOpen(!isHeaderOpen)} isRtl={isRtl} icon={FileText} className="shrink-0">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4" onClick={(e) => e.stopPropagation()}>
            <InputField label={t.fiscalYear} value={lookups.fiscalYears.find(f => String(f.id) === String(currentVoucher.fiscal_year_id || contextVals.fiscal_year_id))?.title || ''} disabled isRtl={isRtl} />
            <InputField label={t.ledger} value={lookups.ledgers.find(l => String(l.id) === String(currentVoucher.ledger_id))?.title || ''} disabled isRtl={isRtl} />
            <SelectField label={t.branch} value={currentVoucher.branch_id || ''} onChange={(e) => setCurrentVoucher({...currentVoucher, branch_id: e.target.value})} disabled={isReadonly} isRtl={isRtl}>
               <option value="" disabled>{t.selectBranch}</option>
               {lookups.branches.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
            </SelectField>
            
            <InputField label={t.voucherNumber} value={currentVoucher.voucher_number || ''} onChange={(e) => setCurrentVoucher({...currentVoucher, voucher_number: e.target.value})} disabled={isReadonly || !isVoucherNoManual} isRtl={isRtl} dir="ltr" className={`text-center ${(!isVoucherNoManual || isReadonly) ? 'bg-slate-50' : 'bg-white'}`} />
            <InputField label={t.dailyNumber} value={currentVoucher.daily_number || '-'} disabled isRtl={isRtl} dir="ltr" className="text-center bg-slate-50" />
            <InputField label={t.crossReference} value={currentVoucher.cross_reference || '-'} disabled isRtl={isRtl} dir="ltr" className="text-center bg-slate-50" />
            
            <InputField label={t.referenceNumber} value={currentVoucher.reference_number || '-'} disabled isRtl={isRtl} dir="ltr" className="text-center bg-slate-50" />
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
          <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col min-w-0" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center p-3 bg-slate-50 border-b border-slate-200 shrink-0">
                <h3 className="text-sm font-bold text-slate-800">{t.items}</h3>
                <div className="flex gap-2">
                  {!isReadonly && (
                      <>
                         <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); globalBalance(); }} icon={Scale}>{t.balance}</Button>
                         <Button variant="primary" size="sm" onClick={(e) => { e.stopPropagation(); addItemRow(); }} icon={Plus}>{t.addRow}</Button>
                      </>
                  )}
                  <div className="w-px bg-slate-300 mx-1 h-8"></div>
                  <button onClick={(e) => { e.stopPropagation(); setIsSummaryOpen(!isSummaryOpen); }} className={`w-8 h-8 flex items-center justify-center rounded border transition-colors ${isSummaryOpen ? 'bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`} title={t.summary}>
                      {isSummaryOpen ? (isRtl ? <PanelRightClose size={16}/> : <PanelRightClose size={16}/>) : (isRtl ? <PanelRightOpen size={16}/> : <PanelRightOpen size={16}/>)}
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar bg-slate-50" onClick={() => setFocusedRowId(null)}>
                 <div className="flex flex-col pb-6 w-full min-w-min">
                     {voucherItems.map((item, index) => {
                        const isFocused = focusedRowId === item.id;
                        const isEditing = isFocused && !isReadonly;
                        const accountObj = lookups.accounts.find(a => String(a.id) === String(item.account_id));
                        let hasTracking = false, hasQuantity = false;
                        if (accountObj && accountObj.metadata) {
                            const meta = typeof accountObj.metadata === 'string' ? JSON.parse(accountObj.metadata) : accountObj.metadata;
                            if (meta.trackFeature) hasTracking = true;
                            if (meta.qtyFeature) hasQuantity = true;
                        }
                        const allowedDetailTypes = getValidDetailTypes(item.account_id);
                        const hasRow2Data = Object.keys(item.details_dict || {}).length > 0 || item.tracking_number || item.tracking_date || item.quantity;
                        const showRow2 = allowedDetailTypes.length > 0 || hasTracking || hasQuantity || hasRow2Data;

                        if (!isEditing) {
                            const hasForeignCurrency = item.currency_code !== lookups.ledgers.find(l => String(l.id) === String(currentVoucher.ledger_id))?.currency || parseNum(item.op_rate) !== 1 || parseNum(item.rep1_rate) !== 1 || parseNum(item.rep2_rate) !== 1;
                            const accountDisplay = accountObj ? `${accountObj.full_code} - ${accountObj.title}` : '-';
                            const detailsArray = Object.values(item.details_dict || {}).map(id => lookups.allDetailInstances.find(d => String(d.id) === String(id))?.title).filter(Boolean);

                            return (
                                <div key={item.id} className={`flex items-center gap-2 p-3 bg-white border-b border-slate-100 cursor-pointer transition-colors text-[11px] hover:bg-indigo-50/40 w-full shrink-0 ${isFocused ? 'ring-1 ring-indigo-200 shadow-sm z-10 relative bg-indigo-50/20' : ''}`} onClick={(e) => { e.stopPropagation(); setFocusedRowId(item.id); }}>
                                    <div className="w-8 text-center font-bold text-slate-400 shrink-0">{item.row_number}</div>
                                    <div className="w-[260px] shrink-0 font-bold text-slate-700 truncate" title={accountDisplay}>{accountDisplay}</div>
                                    <div className="w-[90px] shrink-0 flex flex-col text-left dir-ltr">
                                        <span className="text-[9px] text-slate-400 mb-0.5 uppercase tracking-wide">{t.debit}</span>
                                        <span className={`font-bold ${parseNum(item.debit) > 0 ? 'text-indigo-700' : 'text-slate-300'}`}>{formatNum(item.debit) || '-'}</span>
                                    </div>
                                    <div className="w-[90px] shrink-0 flex flex-col text-left dir-ltr">
                                        <span className="text-[9px] text-slate-400 mb-0.5 uppercase tracking-wide">{t.credit}</span>
                                        <span className={`font-bold ${parseNum(item.credit) > 0 ? 'text-indigo-700' : 'text-slate-300'}`}>{formatNum(item.credit) || '-'}</span>
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
                        }

                        return (
                           <div key={item.id} className="my-2 mx-1 bg-white rounded-lg border transition-all duration-200 border-indigo-400 shadow-md ring-1 ring-indigo-100 w-full lg:w-[calc(100%-8px)] shrink-0 min-w-[800px]" onClick={(e) => e.stopPropagation()}>
                              <div className="flex flex-col md:flex-row gap-0">
                                 <div className="w-12 bg-slate-50 flex flex-col items-center justify-center border-r border-slate-100 py-2 rounded-r-lg shrink-0">
                                    <RowNumberInput value={item.row_number} onChangeRow={(newNum) => {
                                        const newIndex = parseInt(newNum, 10) - 1;
                                        if (isNaN(newIndex) || newIndex < 0 || newIndex >= voucherItems.length || newIndex === index) return;
                                        let itemsCpy = [...voucherItems];
                                        const [movedItem] = itemsCpy.splice(index, 1);
                                        itemsCpy.splice(newIndex, 0, movedItem);
                                        setVoucherItems(itemsCpy.map((it, idx) => ({...it, row_number: idx + 1})));
                                    }} max={voucherItems.length} />
                                    <div className="mt-2 flex flex-col gap-1.5 items-center">
                                        {!isReadonly && (
                                          <>
                                            <button className="text-slate-400 hover:text-indigo-600 p-1 rounded" title={t.copyRow} onClick={(e) => { e.stopPropagation(); duplicateRow(index); }}><CopyPlus size={14} /></button>
                                            <button className="text-red-400 hover:text-red-600 p-1 rounded" onClick={(e) => { e.stopPropagation(); removeRow(index); }}><Trash2 size={14} /></button>
                                          </>
                                        )}
                                    </div>
                                 </div>
                                 <div className="flex-1 p-2 flex flex-col gap-1.5">
                                    <div className="grid grid-cols-12 gap-x-3 gap-y-2 items-end">
                                       <div className="col-span-12 lg:col-span-3 flex flex-col gap-1">
                                          <div className="text-[10px] font-bold text-slate-500">{t.account}</div>
                                          <div className="border rounded h-8 flex items-center border-indigo-300 bg-indigo-50/20">
                                             <SearchableAccountSelect accounts={validAccountsForLedger} value={item.account_id} onChange={(v) => handleItemChange(index, 'account_id', v)} disabled={isReadonly} placeholder={t.searchAccount} className={`w-full bg-transparent border-0 border-b border-transparent hover:border-slate-300 focus:border-indigo-500 rounded-none h-8 px-2 outline-none text-[12px] text-slate-800 transition-colors ${isReadonly ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`} onFocus={() => setFocusedRowId(item.id)} />
                                          </div>
                                       </div>
                                       <div className="col-span-6 lg:col-span-2 flex flex-col gap-1">
                                          <div className="text-[10px] font-bold text-slate-500">{t.debit}</div>
                                          <input type="text" className={`w-full border rounded h-8 px-2 text-[12px] dir-ltr text-right outline-none border-indigo-300 bg-white ${item.debit > 0 ? 'text-indigo-700 font-bold bg-indigo-50/30' : ''}`} value={formatNum(item.debit)} onChange={(e) => { const raw = e.target.value.replace(/,/g, ''); if (!isNaN(raw)) handleItemChange(index, 'debit', raw === '' ? 0 : raw); }} disabled={isReadonly} onFocus={() => setFocusedRowId(item.id)} />
                                       </div>
                                       <div className="col-span-6 lg:col-span-2 flex flex-col gap-1">
                                          <div className="text-[10px] font-bold text-slate-500">{t.credit}</div>
                                          <input type="text" className={`w-full border rounded h-8 px-2 text-[12px] dir-ltr text-right outline-none border-indigo-300 bg-white ${item.credit > 0 ? 'text-indigo-700 font-bold bg-indigo-50/30' : ''}`} value={formatNum(item.credit)} onChange={(e) => { const raw = e.target.value.replace(/,/g, ''); if (!isNaN(raw)) handleItemChange(index, 'credit', raw === '' ? 0 : raw); }} disabled={isReadonly} onFocus={() => setFocusedRowId(item.id)} />
                                       </div>
                                       <div className="col-span-6 lg:col-span-2 flex flex-col gap-1">
                                          <div className="text-[10px] font-bold text-slate-500">{t.currency}</div>
                                          <div className="flex items-center gap-1 h-8">
                                            <select className="flex-1 w-full border rounded h-full px-1 text-[12px] outline-none border-indigo-300 bg-white" value={item.currency_code || ''} onChange={(e) => handleItemChange(index, 'currency_code', e.target.value)} disabled={isReadonly} onFocus={() => setFocusedRowId(item.id)}>
                                               <option value="">-</option>
                                               {lookups.currencies.map(c => <option key={c.id} value={c.code}>{c.title}</option>)}
                                            </select>
                                            <button className="w-8 h-full shrink-0 flex items-center justify-center rounded border transition-colors bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100" onClick={(e) => { e.stopPropagation(); setCurrencyModalIndex(index); }}><Coins size={14}/></button>
                                          </div>
                                       </div>
                                       <div className="col-span-12 lg:col-span-3 flex flex-col gap-1">
                                          <div className="flex justify-between items-center">
                                              <div className="text-[10px] font-bold text-slate-500">{t.description}</div>
                                              {!isReadonly && index > 0 && <button onClick={() => { const newItems = [...voucherItems]; newItems[index].description = newItems[index - 1].description; setVoucherItems(newItems); }} className="text-[10px] text-indigo-500 flex items-center gap-1 hover:text-indigo-700"><Copy size={10}/> {t.copyFromAbove}</button>}
                                          </div>
                                          <input type="text" className="w-full border rounded h-8 px-2 text-[12px] outline-none border-indigo-300 bg-white" value={item.description || ''} onChange={(e) => handleItemChange(index, 'description', e.target.value)} disabled={isReadonly} onFocus={() => setFocusedRowId(item.id)} />
                                       </div>
                                    </div>
                                    {showRow2 && (
                                       <div className="grid grid-cols-12 gap-x-3 gap-y-2 p-2 bg-slate-50/80 rounded border border-slate-100 mt-0.5">
                                          <div className="col-span-12 lg:col-span-5 flex flex-col gap-1">
                                             <div className="text-[10px] font-bold text-slate-500">{t.detail}</div>
                                             <div className={`border rounded min-h-8 flex items-center border-indigo-300 bg-indigo-50/20 ${allowedDetailTypes.length === 0 ? 'opacity-60 bg-slate-100' : ''}`}>
                                                 <MultiDetailSelector allowedTypes={allowedDetailTypes} allInstances={lookups.allDetailInstances} value={item.details_dict || {}} onChange={(v) => handleItemChange(index, 'details_dict', v)} disabled={isReadonly || allowedDetailTypes.length === 0} t={t} />
                                             </div>
                                          </div>
                                          <div className={`col-span-4 lg:col-span-2 flex flex-col gap-1 ${hasTracking ? '' : 'opacity-40 grayscale'}`}>
                                             <div className="text-[10px] font-bold text-slate-500">{t.trackingNumber}</div>
                                             <input type="text" className="w-full border rounded h-8 px-2 text-[12px] outline-none border-indigo-300 bg-white" value={item.tracking_number || ''} onChange={(e) => handleItemChange(index, 'tracking_number', e.target.value)} disabled={isReadonly || (!hasTracking && !item.tracking_number)} onFocus={() => setFocusedRowId(item.id)} />
                                          </div>
                                          <div className={`col-span-4 lg:col-span-2 flex flex-col gap-1 ${hasTracking ? '' : 'opacity-40 grayscale'}`}>
                                             <div className="text-[10px] font-bold text-slate-500">{t.trackingDate}</div>
                                             <input type="date" className="w-full border rounded h-8 px-2 text-[12px] outline-none border-indigo-300 bg-white uppercase" value={item.tracking_date || ''} onChange={(e) => handleItemChange(index, 'tracking_date', e.target.value)} disabled={isReadonly || (!hasTracking && !item.tracking_date)} onFocus={() => setFocusedRowId(item.id)} />
                                          </div>
                                          <div className={`col-span-4 lg:col-span-3 flex flex-col gap-1 ${hasQuantity ? '' : 'opacity-40 grayscale'}`}>
                                             <div className="text-[10px] font-bold text-slate-500">{t.quantity}</div>
                                             <input type="text" className="w-full border rounded h-8 px-2 text-[12px] dir-ltr text-right outline-none border-indigo-300 bg-white" value={formatNum(item.quantity)} onChange={(e) => { const raw = e.target.value.replace(/,/g, ''); if (!isNaN(raw)) handleItemChange(index, 'quantity', raw === '' ? '' : raw); }} disabled={isReadonly || (!hasQuantity && !item.quantity)} onFocus={() => setFocusedRowId(item.id)} />
                                          </div>
                                       </div>
                                    )}
                                 </div>
                              </div>
                           </div>
                        );
                     })}
                 </div>
              </div>
          </div>

          {isSummaryOpen && (
              <div className="w-full lg:w-[280px] shrink-0 bg-slate-50 border-t lg:border-t-0 lg:border-r rtl:border-r-0 rtl:border-l border-slate-200 flex flex-col overflow-y-auto custom-scrollbar" onClick={(e) => e.stopPropagation()}>
                  <div className="p-3 border-b border-slate-200 bg-white flex justify-between items-center z-10 shrink-0">
                      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5"><Layers size={14} className="text-indigo-500"/>{t.summary}</h3>
                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border bg-white shadow-sm ${isBalanced ? 'text-emerald-700 border-emerald-200' : 'text-red-700 border-red-200'}`}>
                          {isBalanced ? <CheckCircle size={12}/> : <FileWarning size={12}/>}
                          <span className="font-bold text-[10px] dir-ltr">{isBalanced ? t.balanced : formatNum(Math.abs(totalDebit - totalCredit))}</span>
                      </div>
                  </div>
                  <div className="flex flex-col gap-3 p-3 text-xs">
                     <div className="flex flex-col gap-1.5 bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors">
                         <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 mb-1 border-b border-slate-100 pb-1.5"><span className="uppercase tracking-wider">{t.summaryBase}</span><Badge variant="indigo" size="sm">{getCurrencyTitle(lookups.ledgers.find(l => String(l.id) === String(currentVoucher.ledger_id))?.currency)}</Badge></div>
                         <div className="flex justify-between items-center"><span className="text-slate-500">{t.debit}:</span> <span className="font-bold text-indigo-700 dir-ltr text-[13px]">{formatNum(totalDebit)}</span></div>
                         <div className="flex justify-between items-center"><span className="text-slate-500">{t.credit}:</span> <span className="font-bold text-indigo-700 dir-ltr text-[13px]">{formatNum(totalCredit)}</span></div>
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
          )}
        </div>
      </div>

      {currencyModalIndex !== null && voucherItems[currencyModalIndex] && (
          <Modal isOpen={true} onClose={() => setCurrencyModalIndex(null)} title={`${t.currencyConversions} - ${t.row} ${voucherItems[currencyModalIndex].row_number}`} size="lg" footer={<Button variant="primary" onClick={() => setCurrencyModalIndex(null)}>{isRtl ? 'تایید و بستن' : 'Confirm & Close'}</Button>}>
              <div className="p-4 bg-slate-50/50 flex flex-col gap-4">
                  <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm text-sm">
                      <div className="flex items-center gap-2">
                         <Calculator size={18} className="text-indigo-500"/>
                         <span className="font-bold text-slate-700">{t.baseAmount}:</span>
                         <span className={`font-bold ${parseNum(voucherItems[currencyModalIndex].debit) > 0 ? 'text-emerald-600' : (parseNum(voucherItems[currencyModalIndex].credit) > 0 ? 'text-rose-600' : 'text-slate-500')}`}>
                             {parseNum(voucherItems[currencyModalIndex].debit) > 0 ? `${formatNum(voucherItems[currencyModalIndex].debit)} (${t.debit})` : parseNum(voucherItems[currencyModalIndex].credit) > 0 ? `${formatNum(voucherItems[currencyModalIndex].credit)} (${t.credit})` : '0'}
                         </span>
                      </div>
                      <Badge variant="indigo">{getCurrencyTitle(voucherItems[currencyModalIndex].currency_code)}</Badge>
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm bg-white">
                      <table className="w-full text-xs text-right dir-rtl">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                              <tr>
                                  <th className="py-2 px-3 font-bold">{isRtl ? 'نوع ارز' : 'Type'}</th>
                                  <th className="py-2 px-3 font-bold">{isRtl ? 'ارز مقصد' : 'Target'}</th>
                                  <th className="py-2 px-3 font-bold w-32">{t.exchangeRate}</th>
                                  <th className="py-2 px-3 font-bold text-center">{t.reverseCalc}</th>
                                  <th className="py-2 px-3 font-bold w-40">{t.convertedAmount}</th>
                              </tr>
                          </thead>
                          <tbody>
                              {lookups.currencyGlobals?.op_currency && (() => {
                                  const isMatch = voucherItems[currencyModalIndex].currency_code === lookups.currencyGlobals.op_currency;
                                  return (
                                      <tr className="border-b border-slate-100 hover:bg-slate-50">
                                          <td className="py-2 px-3 font-bold text-slate-700">{t.opCurrency}</td>
                                          <td className="py-2 px-3">{getCurrencyTitle(lookups.currencyGlobals.op_currency)}</td>
                                          <td className="py-2 px-3">
                                              <input type="text" className={`w-full border rounded h-7 px-2 text-left dir-ltr outline-none ${isMatch || isReadonly ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-white border-slate-300 focus:border-indigo-500'}`} value={voucherItems[currencyModalIndex].op_rate} onChange={(e) => handleItemChange(currencyModalIndex, 'op_rate', e.target.value)} disabled={isMatch || isReadonly} />
                                          </td>
                                          <td className="py-2 px-3 text-center">
                                              <input type="checkbox" className={`w-4 h-4 rounded ${isMatch || isReadonly ? 'text-slate-400 cursor-not-allowed' : 'text-indigo-600 cursor-pointer'}`} checked={voucherItems[currencyModalIndex].op_is_reverse} onChange={(e) => handleItemChange(currencyModalIndex, 'op_is_reverse', e.target.checked)} disabled={isMatch || isReadonly} />
                                          </td>
                                          <td className="py-2 px-3">
                                              <div className="w-full h-7 bg-indigo-50 border border-indigo-100 rounded flex items-center px-2 font-bold text-indigo-700 text-left dir-ltr overflow-hidden text-ellipsis whitespace-nowrap">
                                                  {formatNum(parseNum(voucherItems[currencyModalIndex].debit) > 0 ? voucherItems[currencyModalIndex].op_debit : voucherItems[currencyModalIndex].op_credit)}
                                              </div>
                                          </td>
                                      </tr>
                                  );
                              })()}
                              {lookups.currencyGlobals?.rep1_currency && (() => {
                                  const isMatch = voucherItems[currencyModalIndex].currency_code === lookups.currencyGlobals.rep1_currency;
                                  return (
                                      <tr className="border-b border-slate-100 hover:bg-slate-50">
                                          <td className="py-2 px-3 font-bold text-slate-700">{t.rep1Currency}</td>
                                          <td className="py-2 px-3">{getCurrencyTitle(lookups.currencyGlobals.rep1_currency)}</td>
                                          <td className="py-2 px-3">
                                              <input type="text" className={`w-full border rounded h-7 px-2 text-left dir-ltr outline-none ${isMatch || isReadonly ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-white border-slate-300 focus:border-indigo-500'}`} value={voucherItems[currencyModalIndex].rep1_rate} onChange={(e) => handleItemChange(currencyModalIndex, 'rep1_rate', e.target.value)} disabled={isMatch || isReadonly} />
                                          </td>
                                          <td className="py-2 px-3 text-center">
                                              <input type="checkbox" className={`w-4 h-4 rounded ${isMatch || isReadonly ? 'text-slate-400 cursor-not-allowed' : 'text-indigo-600 cursor-pointer'}`} checked={voucherItems[currencyModalIndex].rep1_is_reverse} onChange={(e) => handleItemChange(currencyModalIndex, 'rep1_is_reverse', e.target.checked)} disabled={isMatch || isReadonly} />
                                          </td>
                                          <td className="py-2 px-3">
                                              <div className="w-full h-7 bg-indigo-50 border border-indigo-100 rounded flex items-center px-2 font-bold text-indigo-700 text-left dir-ltr overflow-hidden text-ellipsis whitespace-nowrap">
                                                  {formatNum(parseNum(voucherItems[currencyModalIndex].debit) > 0 ? voucherItems[currencyModalIndex].rep1_debit : voucherItems[currencyModalIndex].rep1_credit)}
                                              </div>
                                          </td>
                                      </tr>
                                  );
                              })()}
                              {lookups.currencyGlobals?.rep2_currency && (() => {
                                  const isMatch = voucherItems[currencyModalIndex].currency_code === lookups.currencyGlobals.rep2_currency;
                                  return (
                                      <tr className="hover:bg-slate-50">
                                          <td className="py-2 px-3 font-bold text-slate-700">{t.rep2Currency}</td>
                                          <td className="py-2 px-3">{getCurrencyTitle(lookups.currencyGlobals.rep2_currency)}</td>
                                          <td className="py-2 px-3">
                                              <input type="text" className={`w-full border rounded h-7 px-2 text-left dir-ltr outline-none ${isMatch || isReadonly ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-white border-slate-300 focus:border-indigo-500'}`} value={voucherItems[currencyModalIndex].rep2_rate} onChange={(e) => handleItemChange(currencyModalIndex, 'rep2_rate', e.target.value)} disabled={isMatch || isReadonly} />
                                          </td>
                                          <td className="py-2 px-3 text-center">
                                              <input type="checkbox" className={`w-4 h-4 rounded ${isMatch || isReadonly ? 'text-slate-400 cursor-not-allowed' : 'text-indigo-600 cursor-pointer'}`} checked={voucherItems[currencyModalIndex].rep2_is_reverse} onChange={(e) => handleItemChange(currencyModalIndex, 'rep2_is_reverse', e.target.checked)} disabled={isMatch || isReadonly} />
                                          </td>
                                          <td className="py-2 px-3">
                                              <div className="w-full h-7 bg-indigo-50 border border-indigo-100 rounded flex items-center px-2 font-bold text-indigo-700 text-left dir-ltr overflow-hidden text-ellipsis whitespace-nowrap">
                                                  {formatNum(parseNum(voucherItems[currencyModalIndex].debit) > 0 ? voucherItems[currencyModalIndex].rep2_debit : voucherItems[currencyModalIndex].rep2_credit)}
                                              </div>
                                          </td>
                                      </tr>
                                  );
                              })()}
                          </tbody>
                      </table>
                  </div>
              </div>
          </Modal>
      )}

      {showPrintModal && window.VoucherPrint && (
          <Modal isOpen={true} onClose={() => setShowPrintModal(false)} title={t.printVoucher || 'چاپ سند حسابداری'} size="lg">
              <window.VoucherPrint voucherId={voucherId} onClose={() => setShowPrintModal(false)} />
          </Modal>
      )}

      {showAttachModal && window.VoucherAttachments && (
          <Modal isOpen={true} onClose={() => setShowAttachModal(false)} title={t.attachments || 'ضمائم'} size="md">
              <window.VoucherAttachments voucherId={voucherId} onClose={() => setShowAttachModal(false)} />
          </Modal>
      )}
    </div>
  );
};

window.VoucherReviewForm = VoucherReviewForm;
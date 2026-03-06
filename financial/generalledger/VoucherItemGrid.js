/* Filename: financial/generalledger/VoucherItemGrid.js */
import React, { useState, useEffect, useRef } from 'react';
import { Scale, Plus, PanelRightClose, PanelRightOpen, Coins, CopyPlus, Trash2, Copy, Layers, FileText, Calculator, X, RefreshCw } from 'lucide-react';

const normalizeFa = (str) => {
  if (!str) return '';
  return String(str).replace(/[يِي]/g, 'ی').replace(/[كک]/g, 'ک').replace(/[إأآا]/g, 'ا').toLowerCase();
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

const VoucherItemsGrid = ({ 
    voucherItems, setVoucherItems, currentVoucher, lookups, validAccounts, allDetailInstancesFormatted, 
    isReadonly, isFxVoucher, t, isRtl, supabase, isSummaryOpen, toggleSummary, onFocusRow 
}) => {
  const UI = window.UI || {};
  const { Button, Modal, Badge } = UI;
  const { formatNumber, parseNumber } = UI.utils || { formatNumber: (v)=>v, parseNumber: (v)=>v };
  const { calcConv } = window.VoucherUtils || { calcConv: (amount, rate, isReverse) => isReverse ? amount/rate : amount*rate };

  const [focusedRowId, setFocusedRowId] = useState(null);
  const [currencyModalIndex, setCurrencyModalIndex] = useState(null);
  const [fetchingRate, setFetchingRate] = useState(false);

  const getCurrencyTitle = (code) => {
      if(!code) return '-';
      return lookups.currencies.find(c => c.code === code)?.title || code;
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

  const handleFocus = (id) => {
      setFocusedRowId(id);
      onFocusRow();
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...voucherItems];
    
    if (field === 'debit' || field === 'credit') {
      const otherField = field === 'debit' ? 'credit' : 'debit';
      if (parseNumber(value) > 0) newItems[index][otherField] = 0;
    }

    newItems[index][field] = value;
    
    if (field === 'currency_code' && lookups.currencyGlobals) {
       if (value === lookups.currencyGlobals.op_currency) { newItems[index].op_rate = 1; newItems[index].op_is_reverse = false; }
       if (value === lookups.currencyGlobals.rep1_currency) { newItems[index].rep1_rate = 1; newItems[index].rep1_is_reverse = false; }
       if (value === lookups.currencyGlobals.rep2_currency) { newItems[index].rep2_rate = 1; newItems[index].rep2_is_reverse = false; }
    }
    
    if (['debit', 'credit', 'currency_code', 'op_rate', 'op_is_reverse', 'rep1_rate', 'rep1_is_reverse', 'rep2_rate', 'rep2_is_reverse'].includes(field)) {
        const baseDebit = parseNumber(newItems[index].debit);
        const baseCredit = parseNumber(newItems[index].credit);
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

      if (isFxVoucher && selectedAcc && selectedAcc.metadata) {
        const meta = typeof selectedAcc.metadata === 'string' ? JSON.parse(selectedAcc.metadata) : selectedAcc.metadata;
        if (meta.currencyFeature && meta.currency_code) newCurrency = meta.currency_code;
      }
      
      newItems[index]['currency_code'] = newCurrency;
      if (lookups.currencyGlobals) {
           if (newCurrency === lookups.currencyGlobals.op_currency) { newItems[index].op_rate = 1; newItems[index].op_is_reverse = false; }
           if (newCurrency === lookups.currencyGlobals.rep1_currency) { newItems[index].rep1_rate = 1; newItems[index].rep1_is_reverse = false; }
           if (newCurrency === lookups.currencyGlobals.rep2_currency) { newItems[index].rep2_rate = 1; newItems[index].rep2_is_reverse = false; }
      }
      
      const baseDebit = parseNumber(newItems[index].debit);
      const baseCredit = parseNumber(newItems[index].credit);
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

  const handleRowReorder = (id, newRowStr) => {
      const newIndex = parseInt(newRowStr, 10) - 1;
      if (isNaN(newIndex) || newIndex < 0 || newIndex >= voucherItems.length) return;
      let itemsCpy = [...voucherItems];
      const currentIdx = itemsCpy.findIndex(i => i.id === id);
      if (currentIdx === -1 || currentIdx === newIndex) return;
      const [movedItem] = itemsCpy.splice(currentIdx, 1);
      itemsCpy.splice(newIndex, 0, movedItem);
      setVoucherItems(itemsCpy.map((it, idx) => ({...it, row_number: idx + 1})));
  };

  const addItemRow = () => {
    const currentLedger = lookups.ledgers.find(l => String(l.id) === String(currentVoucher?.ledger_id));
    const lastDescription = voucherItems.length > 0 ? voucherItems[voucherItems.length - 1].description : '';
    const newId = 'temp_' + Date.now();
    setVoucherItems([...voucherItems, { 
      id: newId, row_number: voucherItems.length + 1, account_id: '', details_dict: {},
      debit: 0, credit: 0, currency_code: currentLedger?.currency || '', description: lastDescription, 
      tracking_number: '', tracking_date: '', quantity: '',
      op_rate: 1, op_is_reverse: false, op_debit: 0, op_credit: 0,
      rep1_rate: 1, rep1_is_reverse: false, rep1_debit: 0, rep1_credit: 0,
      rep2_rate: 1, rep2_is_reverse: false, rep2_debit: 0, rep2_credit: 0
    }]);
    handleFocus(newId);
  };

  const duplicateRow = (index) => {
      const itemToCopy = voucherItems[index];
      const newId = 'temp_' + Date.now();
      const itemsCpy = [...voucherItems];
      itemsCpy.splice(index + 1, 0, { ...itemToCopy, id: newId });
      setVoucherItems(itemsCpy.map((it, idx) => ({...it, row_number: idx + 1})));
      handleFocus(newId);
  };

  const removeRow = (index) => {
    if (voucherItems.length > 1) {
      const itemsCpy = voucherItems.filter((_, i) => i !== index);
      setVoucherItems(itemsCpy.map((it, idx) => ({...it, row_number: idx + 1})));
    }
  };

  const copyDescription = (index) => {
    if (index > 0) {
      const newItems = [...voucherItems];
      newItems[index].description = newItems[index - 1].description;
      setVoucherItems(newItems);
    }
  };

  const globalBalance = () => {
    let opTotalDebit = 0, opTotalCredit = 0;
    voucherItems.forEach(item => {
        opTotalDebit += parseNumber(item.op_debit);
        opTotalCredit += parseNumber(item.op_credit);
    });
    
    const diffRound = Math.round((opTotalDebit - opTotalCredit) * 100) / 100;
    if (diffRound === 0) return;

    const currentLedger = lookups.ledgers.find(l => String(l.id) === String(currentVoucher.ledger_id));
    const defaultCurrency = currentLedger?.currency || '';
    const emptyRowIndex = voucherItems.findIndex(item => parseNumber(item.debit) === 0 && parseNumber(item.credit) === 0);

    if (emptyRowIndex !== -1) {
       const newItems = [...voucherItems];
       newItems[emptyRowIndex].currency_code = defaultCurrency;
       newItems[emptyRowIndex].op_rate = 1;
       newItems[emptyRowIndex].op_is_reverse = false;

       if (diffRound < 0) {
           const absDiff = Math.abs(diffRound);
           newItems[emptyRowIndex].debit = absDiff;
           newItems[emptyRowIndex].credit = 0;
           newItems[emptyRowIndex].op_debit = absDiff;
           newItems[emptyRowIndex].op_credit = 0;
           newItems[emptyRowIndex].rep1_debit = calcConv(absDiff, newItems[emptyRowIndex].rep1_rate, newItems[emptyRowIndex].rep1_is_reverse);
           newItems[emptyRowIndex].rep1_credit = 0;
           newItems[emptyRowIndex].rep2_debit = calcConv(absDiff, newItems[emptyRowIndex].rep2_rate, newItems[emptyRowIndex].rep2_is_reverse);
           newItems[emptyRowIndex].rep2_credit = 0;
       } else {
           newItems[emptyRowIndex].credit = diffRound;
           newItems[emptyRowIndex].debit = 0;
           newItems[emptyRowIndex].op_credit = diffRound;
           newItems[emptyRowIndex].op_debit = 0;
           newItems[emptyRowIndex].rep1_credit = calcConv(diffRound, newItems[emptyRowIndex].rep1_rate, newItems[emptyRowIndex].rep1_is_reverse);
           newItems[emptyRowIndex].rep1_debit = 0;
           newItems[emptyRowIndex].rep2_credit = calcConv(diffRound, newItems[emptyRowIndex].rep2_rate, newItems[emptyRowIndex].rep2_is_reverse);
           newItems[emptyRowIndex].rep2_debit = 0;
       }
       setVoucherItems(newItems);
       handleFocus(newItems[emptyRowIndex].id);
    } else {
       const newId = 'temp_' + Date.now();
       setVoucherItems([...voucherItems, { 
         id: newId, row_number: voucherItems.length + 1, account_id: '', details_dict: {},
         debit: diffRound < 0 ? Math.abs(diffRound) : 0, credit: diffRound > 0 ? diffRound : 0, 
         currency_code: defaultCurrency, description: '', tracking_number: '', tracking_date: '', quantity: '',
         op_rate: 1, op_is_reverse: false, op_debit: diffRound < 0 ? Math.abs(diffRound) : 0, op_credit: diffRound > 0 ? diffRound : 0,
         rep1_rate: 1, rep1_is_reverse: false, rep1_debit: diffRound < 0 ? Math.abs(diffRound) : 0, rep1_credit: diffRound > 0 ? diffRound : 0,
         rep2_rate: 1, rep2_is_reverse: false, rep2_debit: diffRound < 0 ? Math.abs(diffRound) : 0, rep2_credit: diffRound > 0 ? diffRound : 0
       }]);
       handleFocus(newId);
    }
  };

  const handleFetchAutoRate = async (type) => {
    if (!supabase) return;
    setFetchingRate(true);
    try {
        const item = voucherItems[currencyModalIndex];
        const fromCode = item.currency_code;
        const currentLedger = lookups.ledgers.find(l => String(l.id) === String(currentVoucher.ledger_id));
        
        let toCode;
        if (type === 'op') toCode = currentLedger?.currency || lookups.currencyGlobals?.op_currency;
        if (type === 'rep1') toCode = lookups.currencyGlobals?.rep1_currency;
        if (type === 'rep2') toCode = lookups.currencyGlobals?.rep2_currency;

        if (!fromCode || !toCode) {
             alert(isRtl ? 'کد ارز مبدا یا مقصد نامشخص است.' : 'Source or target currency is missing.');
             setFetchingRate(false);
             return;
        }

        const TABLE_NAME = 'currency_rates'; 
        const FROM_FIELD = 'source_code'; 
        const TO_FIELD = 'target_code';     
        
        // ارسال مستقیم حروف متنی (مثل USD و IRR) به دیتابیس
        const queryFromVal = fromCode; 
        const queryToVal = toCode;

        let rate = null;
        let isReverse = false;

        // حذف کامل دستور order که باعث خطای 400 می‌شد
        const { data, error } = await supabase.schema('gen').from(TABLE_NAME)
            .select('rate')
            .eq(FROM_FIELD, queryFromVal)
            .eq(TO_FIELD, queryToVal)
            .limit(1)
            .maybeSingle();

        if (error) throw error;

        if (data && data.rate) {
            rate = data.rate;
        } else {
            // بررسی حالت معکوس
            const { data: revData, error: revErr } = await supabase.schema('gen').from(TABLE_NAME)
                .select('rate')
                .eq(FROM_FIELD, queryToVal)
                .eq(TO_FIELD, queryFromVal)
                .limit(1)
                .maybeSingle();
            
            if (revErr) throw revErr;
            if (revData && revData.rate) { rate = revData.rate; isReverse = true; }
        }

        if (rate) {
            handleItemChange(currencyModalIndex, `${type}_rate`, rate);
            handleItemChange(currencyModalIndex, `${type}_is_reverse`, isReverse);
        } else {
            alert(isRtl ? `نرخی برای تبدیل ${fromCode} به ${toCode} در سیستم یافت نشد.` : `No rate found.`);
        }
    } catch (e) {
        console.error('Auto rate fetch failed:', e);
        alert(isRtl ? 'خطای اتصال به دیتابیس در خواندن نرخ ارز.' : 'Error fetching rate. Check console.');
    } finally {
        setFetchingRate(false);
    }
  };

  const ledgerCurrencyLabel = lookups.ledgers.find(l => String(l.id) === String(currentVoucher.ledger_id))?.currency || lookups.currencyGlobals?.op_currency;

  return (
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
            <button onClick={(e) => { e.stopPropagation(); toggleSummary(); }} className={`w-8 h-8 flex items-center justify-center rounded border transition-colors ${isSummaryOpen ? 'bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`} title={t.summary}>
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
                      const currentLedger = lookups.ledgers.find(l => String(l.id) === String(currentVoucher.ledger_id));
                      const hasForeignCurrency = item.currency_code !== currentLedger?.currency || parseNumber(item.op_rate) !== 1 || parseNumber(item.rep1_rate) !== 1 || parseNumber(item.rep2_rate) !== 1;
                      const hasTrackingData = item.tracking_number || item.tracking_date;
                      const hasQuantityData = item.quantity && parseNumber(item.quantity) > 0;
                      const accountDisplay = accountObj ? `${accountObj.full_code} - ${accountObj.title}` : '-';
                      const detailsArray = Object.values(item.details_dict || {}).map(id => lookups.allDetailInstances.find(d => String(d.id) === String(id))?.title).filter(Boolean);

                      return (
                          <div key={item.id} className={`flex items-center gap-2 p-3 bg-white border-b border-slate-100 cursor-pointer transition-colors text-[11px] hover:bg-indigo-50/40 w-full shrink-0 ${isFocused ? 'ring-1 ring-indigo-200 shadow-sm z-10 relative bg-indigo-50/20' : ''}`} onClick={(e) => { e.stopPropagation(); handleFocus(item.id); }}>
                              <div className="w-8 text-center font-bold text-slate-400 shrink-0">{item.row_number}</div>
                              <div className="w-[260px] shrink-0 font-bold text-slate-700 truncate" title={accountDisplay}>{accountDisplay}</div>
                              <div className="w-[90px] shrink-0 flex flex-col text-left dir-ltr">
                                  <span className="text-[9px] text-slate-400 mb-0.5 uppercase tracking-wide">{t.debit}</span>
                                  <span className={`font-bold ${parseNumber(item.debit) > 0 ? 'text-indigo-700' : 'text-slate-300'}`}>{formatNumber(item.debit) || '-'}</span>
                              </div>
                              <div className="w-[90px] shrink-0 flex flex-col text-left dir-ltr">
                                  <span className="text-[9px] text-slate-400 mb-0.5 uppercase tracking-wide">{t.credit}</span>
                                  <span className={`font-bold ${parseNumber(item.credit) > 0 ? 'text-indigo-700' : 'text-slate-300'}`}>{formatNumber(item.credit) || '-'}</span>
                              </div>
                              <div className="w-[70px] shrink-0 flex items-center justify-center gap-1.5 bg-slate-50 border border-slate-100 rounded px-1.5 py-1 text-slate-500 font-bold whitespace-nowrap">
                                  <span>{getCurrencyTitle(item.currency_code)}</span>
                                  {(isFxVoucher || hasForeignCurrency) && (
                                      <button 
                                          type="button" 
                                          onClick={(e) => { e.stopPropagation(); setCurrencyModalIndex(index); }} 
                                          className="text-purple-500 hover:text-purple-700 hover:bg-purple-100 p-0.5 rounded transition-colors focus:outline-none shrink-0" 
                                          title={t.currencyConversions}
                                      >
                                          <Coins size={14} />
                                      </button>
                                  )}
                              </div>
                              <div className="w-[280px] shrink-0 text-slate-600 truncate" title={item.description || '-'}>{item.description || '-'}</div>
                              <div className="flex-1 flex flex-wrap items-center gap-2 min-w-[200px]">
                                  {detailsArray.length > 0 && <div className="flex items-center gap-1">{detailsArray.map((d, i) => <span key={i} className="text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 text-[10px] truncate max-w-[150px]">{d}</span>)}</div>}
                                  {hasTrackingData && <div className="flex items-center gap-1 text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 text-[10px]" title={`${t.trackingNumber} / ${t.trackingDate}`}><FileText size={10}/> {item.tracking_number || '-'} {item.tracking_date ? `(${item.tracking_date})` : ''}</div>}
                                  {hasQuantityData && <div className="flex items-center gap-1 text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 text-[10px]" title={t.quantity}><Layers size={10}/> <span className="dir-ltr font-bold text-slate-600">{formatNumber(item.quantity)}</span></div>}
                              </div>
                          </div>
                      );
                  }

                  return (
                     <div key={item.id} className={`my-2 mx-1 bg-white rounded-lg border transition-all duration-200 border-indigo-400 shadow-md ring-1 ring-indigo-100 w-full lg:w-[calc(100%-8px)] shrink-0 min-w-[800px]`} onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-col md:flex-row gap-0">
                           <div className="w-12 bg-slate-50 flex flex-col items-center justify-center border-r border-slate-100 py-2 rounded-r-lg shrink-0">
                              <RowNumberInput value={item.row_number} onChangeRow={(newNum) => handleRowReorder(item.id, newNum)} max={voucherItems.length} />
                              <div className="mt-2 flex flex-col gap-1.5 items-center">
                                  <button className="text-slate-400 hover:text-indigo-600 p-1 rounded transition-all" title={t.copyRow} onClick={(e) => { e.stopPropagation(); duplicateRow(index); }}><CopyPlus size={14} /></button>
                                  <button className="text-red-400 hover:text-red-600 p-1 rounded transition-all" onClick={(e) => { e.stopPropagation(); removeRow(index); }}><Trash2 size={14} /></button>
                              </div>
                           </div>
                           
                           <div className="flex-1 p-2 flex flex-col gap-1.5">
                              <div className="grid grid-cols-12 gap-x-3 gap-y-2 items-end">
                                 <div className="col-span-12 lg:col-span-3 flex flex-col gap-1">
                                    <div className="text-[10px] font-bold text-slate-500">{t.account}</div>
                                    <div className={`border rounded h-8 flex items-center border-indigo-300 bg-indigo-50/20`}>
                                       <SearchableAccountSelect 
                                          accounts={validAccounts} 
                                          value={item.account_id} 
                                          onChange={(v) => handleItemChange(index, 'account_id', v)} 
                                          disabled={isReadonly} 
                                          placeholder={t.searchAccount} 
                                          className={`w-full bg-transparent border-0 border-b border-transparent hover:border-slate-300 focus:border-indigo-500 rounded-none h-8 px-2 outline-none text-[12px] text-slate-800 transition-colors cursor-pointer`}
                                          onFocus={() => handleFocus(item.id)}
                                       />
                                    </div>
                                 </div>
                                 <div className="col-span-6 lg:col-span-2 flex flex-col gap-1">
                                    <div className="text-[10px] font-bold text-slate-500">{t.debit}</div>
                                    <input type="text" className={`w-full border rounded h-8 px-2 text-[12px] dir-ltr text-right outline-none border-indigo-300 bg-white ${item.debit > 0 ? 'text-indigo-700 font-bold bg-indigo-50/30' : ''}`} value={formatNumber(item.debit)} onChange={(e) => { const raw = e.target.value.replace(/,/g, ''); if (!isNaN(raw)) handleItemChange(index, 'debit', raw === '' ? 0 : raw); }} disabled={isReadonly} onFocus={() => handleFocus(item.id)} />
                                 </div>
                                 <div className="col-span-6 lg:col-span-2 flex flex-col gap-1">
                                    <div className="text-[10px] font-bold text-slate-500">{t.credit}</div>
                                    <input type="text" className={`w-full border rounded h-8 px-2 text-[12px] dir-ltr text-right outline-none border-indigo-300 bg-white ${item.credit > 0 ? 'text-indigo-700 font-bold bg-indigo-50/30' : ''}`} value={formatNumber(item.credit)} onChange={(e) => { const raw = e.target.value.replace(/,/g, ''); if (!isNaN(raw)) handleItemChange(index, 'credit', raw === '' ? 0 : raw); }} disabled={isReadonly} onFocus={() => handleFocus(item.id)} />
                                 </div>
                                 <div className="col-span-6 lg:col-span-2 flex flex-col gap-1">
                                    <div className="text-[10px] font-bold text-slate-500">{t.currency}</div>
                                    <div className="flex items-center gap-1 h-8">
                                      <select className={`flex-1 w-full border rounded h-full px-1 text-[12px] outline-none border-indigo-300 bg-white`} value={item.currency_code || ''} onChange={(e) => handleItemChange(index, 'currency_code', e.target.value)} disabled={isReadonly || !isFxVoucher} onFocus={() => handleFocus(item.id)}>
                                         <option value="">-</option>
                                         {lookups.currencies.map(c => <option key={c.id} value={c.code}>{c.title}</option>)}
                                      </select>
                                      {isFxVoucher && (
                                          <button className={`w-8 h-full shrink-0 flex items-center justify-center rounded border transition-colors bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100`} onClick={(e) => { e.stopPropagation(); setCurrencyModalIndex(index); }} title={t.currencyConversions}>
                                          <Coins size={14}/>
                                          </button>
                                      )}
                                    </div>
                                 </div>
                                 <div className="col-span-12 lg:col-span-3 flex flex-col gap-1">
                                    <div className="flex justify-between items-center">
                                        <div className="text-[10px] font-bold text-slate-500">{t.description}</div>
                                        {index > 0 && <button onClick={() => copyDescription(index)} className="text-[10px] text-indigo-500 flex items-center gap-1 hover:text-indigo-700"><Copy size={10}/> {t.copyFromAbove}</button>}
                                    </div>
                                    <input type="text" className={`w-full border rounded h-8 px-2 text-[12px] outline-none border-indigo-300 bg-white`} value={item.description || ''} onChange={(e) => handleItemChange(index, 'description', e.target.value)} disabled={isReadonly} onFocus={() => handleFocus(item.id)} />
                                 </div>
                              </div>

                              {showRow2 && (
                                 <div className="grid grid-cols-12 gap-x-3 gap-y-2 p-2 bg-slate-50/80 rounded border border-slate-100 mt-0.5">
                                    <div className="col-span-12 lg:col-span-5 flex flex-col gap-1">
                                       <div className="text-[10px] font-bold text-slate-500">{t.detail}</div>
                                       <div className={`border rounded min-h-8 flex items-center border-indigo-300 bg-indigo-50/20 ${allowedDetailTypes.length === 0 ? 'opacity-60 bg-slate-100' : ''}`}>
                                           <MultiDetailSelector 
                                              allowedTypes={allowedDetailTypes}
                                              allInstances={lookups.allDetailInstances}
                                              value={item.details_dict || {}} 
                                              onChange={(v) => handleItemChange(index, 'details_dict', v)} 
                                              disabled={isReadonly || allowedDetailTypes.length === 0} 
                                              t={t}
                                           />
                                       </div>
                                    </div>
                                    <div className={`col-span-4 lg:col-span-2 flex flex-col gap-1 ${hasTracking ? '' : 'opacity-40 grayscale'}`}>
                                       <div className="text-[10px] font-bold text-slate-500">{t.trackingNumber}</div>
                                       <input type="text" className={`w-full border rounded h-8 px-2 text-[12px] outline-none border-indigo-300 bg-white`} value={item.tracking_number || ''} onChange={(e) => handleItemChange(index, 'tracking_number', e.target.value)} disabled={isReadonly || (!hasTracking && !item.tracking_number)} onFocus={() => handleFocus(item.id)} />
                                    </div>
                                    <div className={`col-span-4 lg:col-span-2 flex flex-col gap-1 ${hasTracking ? '' : 'opacity-40 grayscale'}`}>
                                       <div className="text-[10px] font-bold text-slate-500">{t.trackingDate}</div>
                                       <input type="date" className={`w-full border rounded h-8 px-2 text-[12px] outline-none border-indigo-300 bg-white uppercase`} value={item.tracking_date || ''} onChange={(e) => handleItemChange(index, 'tracking_date', e.target.value)} disabled={isReadonly || (!hasTracking && !item.tracking_date)} onFocus={() => handleFocus(item.id)} />
                                    </div>
                                    <div className={`col-span-4 lg:col-span-3 flex flex-col gap-1 ${hasQuantity ? '' : 'opacity-40 grayscale'}`}>
                                       <div className="text-[10px] font-bold text-slate-500">{t.quantity}</div>
                                       <input type="text" className={`w-full border rounded h-8 px-2 text-[12px] dir-ltr text-right outline-none border-indigo-300 bg-white`} value={formatNumber(item.quantity)} onChange={(e) => { const raw = e.target.value.replace(/,/g, ''); if (!isNaN(raw)) handleItemChange(index, 'quantity', raw === '' ? '' : raw); }} disabled={isReadonly || (!hasQuantity && !item.quantity)} onFocus={() => handleFocus(item.id)} />
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

        {currencyModalIndex !== null && voucherItems[currencyModalIndex] && (
          <Modal isOpen={true} onClose={() => setCurrencyModalIndex(null)} title={`${t.currencyConversions} - ${t.row} ${voucherItems[currencyModalIndex].row_number}`} size="lg" footer={<Button variant={isReadonly ? 'ghost' : 'primary'} onClick={() => setCurrencyModalIndex(null)}>{isReadonly ? (isRtl ? 'بستن' : 'Close') : (isRtl ? 'تایید و بستن' : 'Confirm & Close')}</Button>}>
              <div className="p-4 bg-slate-50/50 flex flex-col gap-4">
                  <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm text-sm">
                      <div className="flex items-center gap-2">
                         <Calculator size={18} className="text-indigo-500"/>
                         <span className="font-bold text-slate-700">{t.baseAmount}:</span>
                         <span className={`font-bold ${parseNumber(voucherItems[currencyModalIndex].debit) > 0 ? 'text-emerald-600' : (parseNumber(voucherItems[currencyModalIndex].credit) > 0 ? 'text-rose-600' : 'text-slate-500')}`}>
                             {parseNumber(voucherItems[currencyModalIndex].debit) > 0 ? `${formatNumber(voucherItems[currencyModalIndex].debit)} (${t.debit})` : parseNumber(voucherItems[currencyModalIndex].credit) > 0 ? `${formatNumber(voucherItems[currencyModalIndex].credit)} (${t.credit})` : '0'}
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
                                  <th className="py-2 px-3 font-bold w-36">{t.exchangeRate}</th>
                                  <th className="py-2 px-3 font-bold text-center">{t.reverseCalc}</th>
                                  <th className="py-2 px-3 font-bold w-40">{t.convertedAmount}</th>
                              </tr>
                          </thead>
                          <tbody>
                              {ledgerCurrencyLabel && (() => {
                                  const isMatch = voucherItems[currencyModalIndex].currency_code === ledgerCurrencyLabel;
                                  return (
                                      <tr className="border-b border-slate-100 hover:bg-slate-50">
                                          <td className="py-2 px-3 font-bold text-slate-700">{t.opCurrency}</td>
                                          <td className="py-2 px-3">{getCurrencyTitle(ledgerCurrencyLabel)}</td>
                                          <td className="py-2 px-3">
                                              <div className="flex items-center gap-1 h-7">
                                                <input type="text" className={`w-full flex-1 border rounded h-full px-2 text-left dir-ltr outline-none ${isMatch || isReadonly ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-white border-slate-300 focus:border-indigo-500'}`} value={voucherItems[currencyModalIndex].op_rate} onChange={(e) => handleItemChange(currencyModalIndex, 'op_rate', e.target.value)} disabled={isMatch || isReadonly} />
                                                {!isMatch && !isReadonly && (
                                                   <button onClick={() => handleFetchAutoRate('op')} disabled={fetchingRate} className="w-7 h-full flex items-center justify-center bg-indigo-50 text-indigo-500 hover:text-indigo-700 border border-indigo-200 rounded transition-colors shrink-0" title={isRtl ? 'دریافت نرخ اتوماتیک' : 'Fetch Auto Rate'}>
                                                      <RefreshCw size={12} className={fetchingRate ? "animate-spin" : ""} />
                                                   </button>
                                                )}
                                              </div>
                                          </td>
                                          <td className="py-2 px-3 text-center">
                                              <input type="checkbox" className={`w-4 h-4 rounded ${isMatch || isReadonly ? 'text-slate-400 cursor-not-allowed' : 'text-indigo-600 cursor-pointer'}`} checked={voucherItems[currencyModalIndex].op_is_reverse} onChange={(e) => handleItemChange(currencyModalIndex, 'op_is_reverse', e.target.checked)} disabled={isMatch || isReadonly} />
                                          </td>
                                          <td className="py-2 px-3"><div className="w-full h-7 bg-indigo-50 border border-indigo-100 rounded flex items-center px-2 font-bold text-indigo-700 text-left dir-ltr overflow-hidden text-ellipsis whitespace-nowrap">{formatNumber(parseNumber(voucherItems[currencyModalIndex].debit) > 0 ? voucherItems[currencyModalIndex].op_debit : voucherItems[currencyModalIndex].op_credit)}</div></td>
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
                                              <div className="flex items-center gap-1 h-7">
                                                <input type="text" className={`w-full flex-1 border rounded h-full px-2 text-left dir-ltr outline-none ${isMatch || isReadonly ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-white border-slate-300 focus:border-indigo-500'}`} value={voucherItems[currencyModalIndex].rep1_rate} onChange={(e) => handleItemChange(currencyModalIndex, 'rep1_rate', e.target.value)} disabled={isMatch || isReadonly} />
                                                {!isMatch && !isReadonly && (
                                                   <button onClick={() => handleFetchAutoRate('rep1')} disabled={fetchingRate} className="w-7 h-full flex items-center justify-center bg-indigo-50 text-indigo-500 hover:text-indigo-700 border border-indigo-200 rounded transition-colors shrink-0" title={isRtl ? 'دریافت نرخ اتوماتیک' : 'Fetch Auto Rate'}>
                                                      <RefreshCw size={12} className={fetchingRate ? "animate-spin" : ""} />
                                                   </button>
                                                )}
                                              </div>
                                          </td>
                                          <td className="py-2 px-3 text-center">
                                              <input type="checkbox" className={`w-4 h-4 rounded ${isMatch || isReadonly ? 'text-slate-400 cursor-not-allowed' : 'text-indigo-600 cursor-pointer'}`} checked={voucherItems[currencyModalIndex].rep1_is_reverse} onChange={(e) => handleItemChange(currencyModalIndex, 'rep1_is_reverse', e.target.checked)} disabled={isMatch || isReadonly} />
                                          </td>
                                          <td className="py-2 px-3"><div className="w-full h-7 bg-indigo-50 border border-indigo-100 rounded flex items-center px-2 font-bold text-indigo-700 text-left dir-ltr overflow-hidden text-ellipsis whitespace-nowrap">{formatNumber(parseNumber(voucherItems[currencyModalIndex].debit) > 0 ? voucherItems[currencyModalIndex].rep1_debit : voucherItems[currencyModalIndex].rep1_credit)}</div></td>
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
                                              <div className="flex items-center gap-1 h-7">
                                                <input type="text" className={`w-full flex-1 border rounded h-full px-2 text-left dir-ltr outline-none ${isMatch || isReadonly ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-white border-slate-300 focus:border-indigo-500'}`} value={voucherItems[currencyModalIndex].rep2_rate} onChange={(e) => handleItemChange(currencyModalIndex, 'rep2_rate', e.target.value)} disabled={isMatch || isReadonly} />
                                                {!isMatch && !isReadonly && (
                                                   <button onClick={() => handleFetchAutoRate('rep2')} disabled={fetchingRate} className="w-7 h-full flex items-center justify-center bg-indigo-50 text-indigo-500 hover:text-indigo-700 border border-indigo-200 rounded transition-colors shrink-0" title={isRtl ? 'دریافت نرخ اتوماتیک' : 'Fetch Auto Rate'}>
                                                      <RefreshCw size={12} className={fetchingRate ? "animate-spin" : ""} />
                                                   </button>
                                                )}
                                              </div>
                                          </td>
                                          <td className="py-2 px-3 text-center">
                                              <input type="checkbox" className={`w-4 h-4 rounded ${isMatch || isReadonly ? 'text-slate-400 cursor-not-allowed' : 'text-indigo-600 cursor-pointer'}`} checked={voucherItems[currencyModalIndex].rep2_is_reverse} onChange={(e) => handleItemChange(currencyModalIndex, 'rep2_is_reverse', e.target.checked)} disabled={isMatch || isReadonly} />
                                          </td>
                                          <td className="py-2 px-3"><div className="w-full h-7 bg-indigo-50 border border-indigo-100 rounded flex items-center px-2 font-bold text-indigo-700 text-left dir-ltr overflow-hidden text-ellipsis whitespace-nowrap">{formatNumber(parseNumber(voucherItems[currencyModalIndex].debit) > 0 ? voucherItems[currencyModalIndex].rep2_debit : voucherItems[currencyModalIndex].rep2_credit)}</div></td>
                                      </tr>
                                  );
                              })()}
                          </tbody>
                      </table>
                  </div>
              </div>
          </Modal>
      )}
    </div>
  );
};

window.VoucherItemsGrid = VoucherItemsGrid;
export default VoucherItemsGrid;
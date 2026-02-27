/* Filename: financial/generalledger/VoucherForm.js */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ArrowRight, ArrowLeft, Save, CheckCircle, FileText, Scale, Plus, 
  PanelRightClose, PanelRightOpen, Coins, CopyPlus, Trash2, Copy, Layers, FileWarning, Calculator, X,
  Printer, Paperclip
} from 'lucide-react';

const VoucherForm = ({ voucherId, isCopy, contextVals, lookups, onClose, language = 'fa' }) => {
  const { fetchAutoNumbers, validateFiscalPeriod, calcConv, localTranslations } = window.VoucherUtils || {};
  const t = localTranslations ? (localTranslations[language] || localTranslations['en']) : {};
  const isRtl = language === 'fa';
  
  const UI = window.UI || {};
  const { Button, InputField, SelectField, Accordion, Modal, Badge, SearchableSelect, MultiTagSelect } = UI;
  const { formatNumber, parseNumber } = UI.utils || { formatNumber: (v)=>v, parseNumber: (v)=>v };
  const supabase = window.supabase;

  // --- Security Check ---
  // دریافت پرمیشن‌ها از props که توسط Vouchers.js پاس داده شده
  const perms = lookups.permissions;
  const canEdit = perms?.actions.includes('edit');
  const canCreate = perms?.actions.includes('create');
  const canPrint = perms?.actions.includes('print');
  const canAttach = perms?.actions.includes('attach');

  // --- States ---
  const [currentVoucher, setCurrentVoucher] = useState(null);
  const [voucherItems, setVoucherItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [focusedRowId, setFocusedRowId] = useState(null);
  const [isHeaderOpen, setIsHeaderOpen] = useState(true);
  const [isSummaryOpen, setIsSummaryOpen] = useState(true);
  const [currencyModalIndex, setCurrencyModalIndex] = useState(null);
  const [voucherToPrint, setVoucherToPrint] = useState(null);
  const [voucherForAttachments, setVoucherForAttachments] = useState(null);

  // --- Computed Lookups for Form (With Data Scoping) ---
  const ledgerStructureCode = useMemo(() => {
     const ledger = lookups.ledgers.find(l => String(l.id) === String(contextVals.ledger_id));
     return String(ledger?.structure || '').trim();
  }, [lookups.ledgers, contextVals.ledger_id]);

  // سطح ۳: فیلتر کردن شعب بر اساس دسترسی
  const filteredBranches = useMemo(() => {
      const allBranches = lookups.branches;
      if (perms?.allowed_branches && perms.allowed_branches.length > 0) {
          return allBranches.filter(b => perms.allowed_branches.includes(b.id));
      }
      return allBranches;
  }, [lookups.branches, perms]);

  // سطح ۳: فیلتر کردن دفاتر بر اساس دسترسی
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

  // --- Initialization Effect ---
  useEffect(() => {
    const initializeForm = async () => {
      setLoading(true);
      if (voucherId) {
        try {
          const { data: vData, error: vError } = await supabase.schema('gl').from('vouchers').select('*').eq('id', voucherId).single();
          if (vError) throw vError;

          const { data: itemsData, error: itemsError } = await supabase.schema('gl').from('voucher_items').select('*').eq('voucher_id', voucherId).order('row_number', { ascending: true });
          if (itemsError) throw itemsError;

          let targetVoucher = { ...vData };
          let mappedItems = (itemsData || []).map((item, index) => {
            const detailsObj = typeof item.details === 'string' ? JSON.parse(item.details || '{}') : (item.details || {});
            return { 
               ...item, 
               id: isCopy ? 'temp_' + Date.now() + '_' + index : item.id,
               voucher_id: isCopy ? null : item.voucher_id,
               currency_code: detailsObj.currency_code || '',
               details_dict: detailsObj.selected_details || {},
               op_rate: item.op_rate ?? 1, op_is_reverse: item.op_is_reverse ?? false, op_debit: item.op_debit ?? 0, op_credit: item.op_credit ?? 0,
               rep1_rate: item.rep1_rate ?? 1, rep1_is_reverse: item.rep1_is_reverse ?? false, rep1_debit: item.rep1_debit ?? 0, rep1_credit: item.rep1_credit ?? 0,
               rep2_rate: item.rep2_rate ?? 1, rep2_is_reverse: item.rep2_is_reverse ?? false, rep2_debit: item.rep2_debit ?? 0, rep2_credit: item.rep2_credit ?? 0,
            };
          });

          if (isCopy) {
              const today = new Date().toISOString().split('T')[0];
              const { nextDaily, nextCross, nextVoucher } = await fetchAutoNumbers(today, targetVoucher.ledger_id, targetVoucher.fiscal_period_id, targetVoucher.branch_id, supabase);
              targetVoucher = {
                  ...targetVoucher,
                  id: null,
                  voucher_date: today,
                  status: 'draft',
                  voucher_number: nextVoucher,
                  daily_number: nextDaily,
                  cross_reference: nextCross,
                  reference_number: '',
                  reviewed_by: null,
                  approved_by: null,
              };
              setIsHeaderOpen(true);
          } else {
              setIsHeaderOpen(false);
          }

          setCurrentVoucher(targetVoucher);
          setVoucherItems(mappedItems);
          setFocusedRowId(null);
        } catch (error) {
          console.error('Error initializing form:', error);
        }
      } else {
        const initialLedgerId = contextVals.ledger_id;
        const initialFyId = contextVals.fiscal_year_id;
        const currentLedger = lookups.ledgers.find(l => String(l.id) === String(initialLedgerId));
        const defaultCurrency = currentLedger?.currency || '';
        
        // انتخاب شعبه پیش‌فرض بر اساس دسترسی
        const defaultBranch = filteredBranches.find(b => b.is_default) || filteredBranches[0];
        const today = new Date().toISOString().split('T')[0];

        const { nextDaily, nextCross, nextVoucher } = await fetchAutoNumbers(today, initialLedgerId, initialFyId, defaultBranch?.id, supabase);

        setCurrentVoucher({
          voucher_date: today,
          voucher_type: lookups.docTypes.length > 0 ? lookups.docTypes[0].code : 'sys_general',
          status: 'draft',
          description: '',
          subsidiary_number: '',
          voucher_number: nextVoucher,
          daily_number: nextDaily,
          cross_reference: nextCross,
          reference_number: '',
          fiscal_period_id: initialFyId,
          ledger_id: initialLedgerId,
          branch_id: defaultBranch?.id || ''
        });
        const newId = 'temp_' + Date.now();
        setVoucherItems([{
          id: newId,
          row_number: 1,
          account_id: '',
          details_dict: {},
          debit: 0,
          credit: 0,
          currency_code: defaultCurrency,
          description: '',
          tracking_number: '',
          tracking_date: '',
          quantity: '',
          op_rate: 1, op_is_reverse: false, op_debit: 0, op_credit: 0,
          rep1_rate: 1, rep1_is_reverse: false, rep1_debit: 0, rep1_credit: 0,
          rep2_rate: 1, rep2_is_reverse: false, rep2_debit: 0, rep2_credit: 0
        }]);
        setFocusedRowId(newId);
        setIsHeaderOpen(false);
      }
      setLoading(false);
    };

    initializeForm();
  }, [voucherId, isCopy, contextVals, filteredBranches]);

  // --- Helpers ---
  const getValidDetailTypes = (accountId) => {
     if (!accountId) return [];
     const account = lookups.accounts.find(a => String(a.id) === String(accountId));
     if (!account || !account.metadata) return [];
     const meta = typeof account.metadata === 'string' ? JSON.parse(account.metadata) : account.metadata;
     const allowedTafsilCodesOrIds = meta.tafsils || [];
     if (allowedTafsilCodesOrIds.length === 0) return [];
     return lookups.detailTypes.filter(dt => allowedTafsilCodesOrIds.some(t => String(dt.id) === String(t) || dt.code === String(t)));
  };

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

  // --- Action Handlers ---
  const handleItemFocus = (id) => {
      setFocusedRowId(id);
      setIsHeaderOpen(false);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...voucherItems];
    
    if (field === 'debit' || field === 'credit') {
      const otherField = field === 'debit' ? 'credit' : 'debit';
      if (parseNumber(value) > 0) {
        newItems[index][otherField] = 0;
      }
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

      if (selectedAcc && selectedAcc.metadata) {
        const meta = typeof selectedAcc.metadata === 'string' ? JSON.parse(selectedAcc.metadata) : selectedAcc.metadata;
        if (meta.currencyFeature && meta.currency_code) {
             newCurrency = meta.currency_code;
        }
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
      
      const currentIdx = voucherItems.findIndex(i => i.id === id);
      if (currentIdx === -1 || currentIdx === newIndex) return;
      
      let itemsCpy = [...voucherItems];
      const [movedItem] = itemsCpy.splice(currentIdx, 1);
      itemsCpy.splice(newIndex, 0, movedItem);
      itemsCpy = itemsCpy.map((it, idx) => ({...it, row_number: idx + 1}));
      
      setVoucherItems(itemsCpy);
  };

  const addItemRow = () => {
    const activeLedgerId = currentVoucher?.ledger_id || contextVals.ledger_id;
    const currentLedger = lookups.ledgers.find(l => String(l.id) === String(activeLedgerId));
    const lastDescription = voucherItems.length > 0 ? voucherItems[voucherItems.length - 1].description : '';

    const newId = 'temp_' + Date.now();
    setVoucherItems([...voucherItems, { 
      id: newId, 
      row_number: voucherItems.length + 1, 
      account_id: '', 
      details_dict: {},
      debit: 0, 
      credit: 0, 
      currency_code: currentLedger?.currency || '',
      description: lastDescription, 
      tracking_number: '', 
      tracking_date: '',
      quantity: '',
      op_rate: 1, op_is_reverse: false, op_debit: 0, op_credit: 0,
      rep1_rate: 1, rep1_is_reverse: false, rep1_debit: 0, rep1_credit: 0,
      rep2_rate: 1, rep2_is_reverse: false, rep2_debit: 0, rep2_credit: 0
    }]);
    setFocusedRowId(newId);
    setIsHeaderOpen(false);
  };

  const duplicateRow = (index) => {
      const itemToCopy = voucherItems[index];
      const newId = 'temp_' + Date.now();
      const newItem = { ...itemToCopy, id: newId };
      
      const itemsCpy = [...voucherItems];
      itemsCpy.splice(index + 1, 0, newItem);
      const renumbered = itemsCpy.map((it, idx) => ({...it, row_number: idx + 1}));
      
      setVoucherItems(renumbered);
      setFocusedRowId(newId);
      setIsHeaderOpen(false);
  };

  const removeRow = (index) => {
    if (voucherItems.length > 1) {
      const itemsCpy = voucherItems.filter((_, i) => i !== index);
      const renumbered = itemsCpy.map((it, idx) => ({...it, row_number: idx + 1}));
      setVoucherItems(renumbered);
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
    const totalDebit = voucherItems.reduce((sum, item) => sum + parseNumber(item.debit), 0);
    const totalCredit = voucherItems.reduce((sum, item) => sum + parseNumber(item.credit), 0);
    const diff = totalDebit - totalCredit;
    
    if (diff === 0) return;

    const emptyRowIndex = voucherItems.findIndex(item => parseNumber(item.debit) === 0 && parseNumber(item.credit) === 0);

    if (emptyRowIndex !== -1) {
       const newItems = [...voucherItems];
       if (diff < 0) {
           newItems[emptyRowIndex].debit = Math.abs(diff);
           newItems[emptyRowIndex].credit = 0;
           newItems[emptyRowIndex].op_debit = calcConv(Math.abs(diff), newItems[emptyRowIndex].op_rate, newItems[emptyRowIndex].op_is_reverse);
           newItems[emptyRowIndex].op_credit = 0;
           newItems[emptyRowIndex].rep1_debit = calcConv(Math.abs(diff), newItems[emptyRowIndex].rep1_rate, newItems[emptyRowIndex].rep1_is_reverse);
           newItems[emptyRowIndex].rep1_credit = 0;
           newItems[emptyRowIndex].rep2_debit = calcConv(Math.abs(diff), newItems[emptyRowIndex].rep2_rate, newItems[emptyRowIndex].rep2_is_reverse);
           newItems[emptyRowIndex].rep2_credit = 0;
       } else {
           newItems[emptyRowIndex].credit = diff;
           newItems[emptyRowIndex].debit = 0;
           newItems[emptyRowIndex].op_credit = calcConv(diff, newItems[emptyRowIndex].op_rate, newItems[emptyRowIndex].op_is_reverse);
           newItems[emptyRowIndex].op_debit = 0;
           newItems[emptyRowIndex].rep1_credit = calcConv(diff, newItems[emptyRowIndex].rep1_rate, newItems[emptyRowIndex].rep1_is_reverse);
           newItems[emptyRowIndex].rep1_debit = 0;
           newItems[emptyRowIndex].rep2_credit = calcConv(diff, newItems[emptyRowIndex].rep2_rate, newItems[emptyRowIndex].rep2_is_reverse);
           newItems[emptyRowIndex].rep2_debit = 0;
       }
       setVoucherItems(newItems);
       setFocusedRowId(newItems[emptyRowIndex].id);
       setIsHeaderOpen(false);
    } else {
       const currentLedger = lookups.ledgers.find(l => String(l.id) === String(currentVoucher.ledger_id));
       const newId = 'temp_' + Date.now();
       setVoucherItems([...voucherItems, { 
         id: newId, 
         row_number: voucherItems.length + 1, 
         account_id: '', 
         details_dict: {},
         debit: diff < 0 ? Math.abs(diff) : 0, 
         credit: diff > 0 ? diff : 0, 
         currency_code: currentLedger?.currency || '',
         description: '', 
         tracking_number: '', 
         tracking_date: '',
         quantity: '',
         op_rate: 1, op_is_reverse: false, op_debit: diff < 0 ? Math.abs(diff) : 0, op_credit: diff > 0 ? diff : 0,
         rep1_rate: 1, rep1_is_reverse: false, rep1_debit: diff < 0 ? Math.abs(diff) : 0, rep1_credit: diff > 0 ? diff : 0,
         rep2_rate: 1, rep2_is_reverse: false, rep2_debit: diff < 0 ? Math.abs(diff) : 0, rep2_credit: diff > 0 ? diff : 0
       }]);
       setFocusedRowId(newId);
       setIsHeaderOpen(false);
    }
  };

  const handleSaveVoucher = async (status) => {
    if (!supabase) return;

    // کنترل سطح ۲: آیا اجازه ویرایش یا ایجاد دارد؟
    const isNew = !currentVoucher.id || isCopy;
    if (isNew && !canCreate) { alert(t.accessDenied); return; }
    if (!isNew && !canEdit) { alert(t.accessDenied); return; }
    
    if (!currentVoucher.branch_id) {
       alert(t.branchReqError);
       return;
    }

    const periodCheck = await validateFiscalPeriod(currentVoucher.voucher_date, currentVoucher.fiscal_period_id, supabase, t);
    if (!periodCheck.valid) {
        alert(periodCheck.msg);
        return;
    }

    if (currentVoucher.subsidiary_number && currentVoucher.subsidiary_number.trim() !== '') {
        const query = supabase.schema('gl').from('vouchers')
            .select('id')
            .eq('fiscal_period_id', currentVoucher.fiscal_period_id)
            .eq('subsidiary_number', currentVoucher.subsidiary_number.trim());
        if (currentVoucher.id) query.neq('id', currentVoucher.id);
        const { data: subData } = await query;
        if (subData && subData.length > 0) {
            alert(t.subDupError);
            return;
        }
    }

    const rowSignatures = new Set();
    for (let i = 0; i < voucherItems.length; i++) {
        const item = voucherItems[i];
        if (!item.description || !item.account_id) {
           alert(t.reqFields);
           return;
        }
        const sig = getRowSignature(item);
        if (rowSignatures.has(sig)) {
             alert(t.duplicateRowError.replace('{row}', i + 1));
             return;
        }
        rowSignatures.add(sig);

        const account = lookups.accounts.find(a => String(a.id) === String(item.account_id));
        if (account && account.metadata) {
            const meta = typeof account.metadata === 'string' ? JSON.parse(account.metadata) : account.metadata;
            if (meta.trackFeature && meta.trackMandatory && (!item.tracking_number || !item.tracking_date)) {
                alert(t.trackingReqError + ' ' + (i + 1) + ' (' + account.title + ')'); return;
            }
            if (meta.qtyFeature && meta.qtyMandatory && (!item.quantity || parseNumber(item.quantity) <= 0)) {
                alert(t.qtyReqError + ' ' + (i + 1) + ' (' + account.title + ')'); return;
            }
            if (meta.currencyFeature && meta.currencyMandatory && (!item.op_rate || !item.rep1_rate || !item.rep2_rate || parseNumber(item.op_rate) <= 0)) {
                alert(t.currencyMandatoryError.replace('{row}', i + 1)); return;
            }
        }

        const allowedDetailTypes = getValidDetailTypes(item.account_id);
        if (allowedDetailTypes.length > 0) {
           const dict = item.details_dict || {};
           for (const type of allowedDetailTypes) {
               if (!dict[type.code]) {
                   alert(t.detailRequiredError.replace('{type}', type.title).replace('{row}', i + 1)); return;
               }
           }
        }
    }

    let totalDebit = 0, totalCredit = 0;
    voucherItems.forEach(item => {
        totalDebit += parseNumber(item.debit); totalCredit += parseNumber(item.credit);
    });
    
    if (totalDebit === 0 && totalCredit === 0) { alert(t.zeroAmountError); return; }
    if (status === 'temporary' && totalDebit !== totalCredit) { alert(t.unbalancedError); return; }

    setLoading(true);
    try {
      const cleanData = (val) => (val === '' ? null : val);
      const { data: authData } = await supabase.auth.getUser();
      const currentUserId = authData?.user?.id || null;

      const voucherData = { 
        ...currentVoucher, status,
        total_debit: totalDebit, total_credit: totalCredit,
        subsidiary_number: cleanData(currentVoucher.subsidiary_number),
        reference_number: cleanData(currentVoucher.reference_number),
        voucher_number: cleanData(currentVoucher.voucher_number),
        daily_number: cleanData(currentVoucher.daily_number),
        cross_reference: cleanData(currentVoucher.cross_reference),
      };

      if (status === 'reviewed') voucherData.reviewed_by = currentUserId;
      if (status === 'final') voucherData.approved_by = currentUserId;

      let savedVoucherId = voucherData.id;

      if (savedVoucherId) {
        const { error } = await supabase.schema('gl').from('vouchers').update(voucherData).eq('id', savedVoucherId);
        if (error) throw error;
        await supabase.schema('gl').from('voucher_items').delete().eq('voucher_id', savedVoucherId);
      } else {
        const { nextDaily, nextCross, nextVoucher, config } = await fetchAutoNumbers(voucherData.voucher_date, voucherData.ledger_id, voucherData.fiscal_period_id, voucherData.branch_id, supabase);
        voucherData.daily_number = nextDaily;
        voucherData.cross_reference = nextCross;
        voucherData.created_by = currentUserId;
        
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
            const fyId = voucherData.fiscal_period_id;
            const branchId = voucherData.branch_id;
            const savedVoucherNum = Number(voucherData.voucher_number); 

            if (scope === 'ledger') {
                if (resetYear) lastNums[fyId] = savedVoucherNum; else lastNums.global = savedVoucherNum;
            } else if (scope === 'branch') {
                if (resetYear) {
                    if (!lastNums[fyId]) lastNums[fyId] = {};
                    lastNums[fyId][branchId] = savedVoucherNum;
                } else {
                    lastNums[branchId] = savedVoucherNum;
                }
            }
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
          tracking_number: cleanData(item.tracking_number), tracking_date: cleanData(item.tracking_date),
          quantity: parseNumber(item.quantity) === 0 ? null : parseNumber(item.quantity),
          details: { currency_code: item.currency_code, selected_details: item.details_dict || {} },
          op_rate: parseNumber(item.op_rate), op_is_reverse: item.op_is_reverse, op_debit: parseNumber(item.op_debit), op_credit: parseNumber(item.op_credit),
          rep1_rate: parseNumber(item.rep1_rate), rep1_is_reverse: item.rep1_is_reverse, rep1_debit: parseNumber(item.rep1_debit), rep1_credit: parseNumber(item.rep1_credit),
          rep2_rate: parseNumber(item.rep2_rate), rep2_is_reverse: item.rep2_is_reverse, rep2_debit: parseNumber(item.rep2_debit), rep2_credit: parseNumber(item.rep2_credit),
      }));

      if (itemsToSave.length > 0) {
        const { error: itemsError } = await supabase.schema('gl').from('voucher_items').insert(itemsToSave);
        if (itemsError) throw itemsError;
      }
      onClose(true); // Signal refresh
    } catch (error) {
      console.error('Error saving voucher:', error);
      alert('Error saving voucher: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Early Returns ---
  if (loading || !currentVoucher) {
      return <div className="h-full flex items-center justify-center bg-slate-50"><div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div></div>;
  }

  // --- Render Computations ---
  let totalDebit = 0, totalCredit = 0, opTotalDebit = 0, opTotalCredit = 0, rep1TotalDebit = 0, rep1TotalCredit = 0, rep2TotalDebit = 0, rep2TotalCredit = 0;
  voucherItems.forEach(item => {
      totalDebit += parseNumber(item.debit); totalCredit += parseNumber(item.credit);
      opTotalDebit += parseNumber(item.op_debit); opTotalCredit += parseNumber(item.op_credit);
      rep1TotalDebit += parseNumber(item.rep1_debit); rep1TotalCredit += parseNumber(item.rep1_credit);
      rep2TotalDebit += parseNumber(item.rep2_debit); rep2TotalCredit += parseNumber(item.rep2_credit);
  });

  const isBalanced = totalDebit === totalCredit;
  const isReadonly = currentVoucher.status === 'reviewed' || currentVoucher.status === 'final' || (!canEdit && currentVoucher.id && !isCopy);
  const isVoucherNoManual = currentLedgerMeta.uniquenessScope === 'none';
  const currentFiscalYearTitle = lookups.fiscalYears.find(f => String(f.id) === String(currentVoucher.fiscal_period_id))?.title || '';
  const currentLedgerTitle = lookups.ledgers.find(l => String(l.id) === String(currentVoucher.ledger_id))?.title || '';

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
    <div className={`h-full flex flex-col p-4 md:p-6 bg-slate-50/50`} onClick={() => setFocusedRowId(null)}>
      {/* Top Toolbar */}
      <div className="mb-4 flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm shrink-0" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => onClose(false)} icon={isRtl ? ArrowRight : ArrowLeft}>{t.backToList}</Button>
          <div className="h-6 w-px bg-slate-200 mx-1"></div>
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
        {/* Header Accordion */}
        <Accordion 
          title={t.headerInfo} 
          isOpen={isHeaderOpen} 
          onToggle={() => setIsHeaderOpen(!isHeaderOpen)} 
          isRtl={isRtl} 
          icon={FileText}
          className="shrink-0"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4" onClick={(e) => e.stopPropagation()}>
            <InputField label={t.fiscalYear} value={currentFiscalYearTitle} disabled isRtl={isRtl} />
            
            <SelectField label={t.ledger} value={currentVoucher.ledger_id || ''} onChange={(e) => setCurrentVoucher({...currentVoucher, ledger_id: e.target.value})} disabled={isReadonly} isRtl={isRtl}>
               <option value="" disabled>{isRtl ? 'انتخاب دفتر' : 'Select Ledger'}</option>
               {filteredLedgers.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
            </SelectField>

            <SelectField label={t.branch} value={currentVoucher.branch_id || ''} onChange={(e) => {
                const newBranch = e.target.value;
                setCurrentVoucher({...currentVoucher, branch_id: newBranch});
                if (!currentVoucher.id || currentVoucher.status === 'draft') {
                   fetchAutoNumbers(currentVoucher.voucher_date, currentVoucher.ledger_id, currentVoucher.fiscal_period_id, newBranch, supabase).then(({nextVoucher}) => {
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
               const newDate = e.target.value;
               setCurrentVoucher({...currentVoucher, voucher_date: newDate});
               if (!currentVoucher.id || currentVoucher.status === 'draft') {
                   fetchAutoNumbers(newDate, currentVoucher.ledger_id, currentVoucher.fiscal_period_id, currentVoucher.branch_id, supabase).then(({nextDaily}) => {
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
          {/* Main Items Grid */}
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
                        const hasDetails = allowedDetailTypes.length > 0;
                        const hasRow2Data = Object.keys(item.details_dict || {}).length > 0 || item.tracking_number || item.tracking_date || item.quantity;
                        const showRow2 = hasDetails || hasTracking || hasQuantity || hasRow2Data;

                        // Compact View
                        if (!isEditing) {
                            const currentLedger = lookups.ledgers.find(l => String(l.id) === String(currentVoucher.ledger_id));
                            const hasForeignCurrency = item.currency_code !== currentLedger?.currency || parseNumber(item.op_rate) !== 1 || parseNumber(item.rep1_rate) !== 1 || parseNumber(item.rep2_rate) !== 1;
                            const hasTrackingData = item.tracking_number || item.tracking_date;
                            const hasQuantityData = item.quantity && parseNumber(item.quantity) > 0;
                            const accountDisplay = accountObj ? `${accountObj.full_code} - ${accountObj.title}` : '-';
                            const detailsArray = Object.values(item.details_dict || {}).map(id => lookups.allDetailInstances.find(d => String(d.id) === String(id))?.title).filter(Boolean);

                            return (
                                <div key={item.id} className={`flex items-center gap-2 p-3 bg-white border-b border-slate-100 cursor-pointer transition-colors text-[11px] hover:bg-indigo-50/40 w-full shrink-0 ${isFocused ? 'ring-1 ring-indigo-200 shadow-sm z-10 relative bg-indigo-50/20' : ''}`} onClick={(e) => { e.stopPropagation(); handleItemFocus(item.id); }}>
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
                                        {hasForeignCurrency && <Coins size={14} className="text-purple-500 shrink-0" title={t.currencyConversions} />}
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

                        // Full Edit View
                        return (
                           <div key={item.id} className={`my-2 mx-1 bg-white rounded-lg border transition-all duration-200 border-indigo-400 shadow-md ring-1 ring-indigo-100 w-full lg:w-[calc(100%-8px)] shrink-0 min-w-[800px]`} onClick={(e) => e.stopPropagation()}>
                              <div className="flex flex-col md:flex-row gap-0">
                                 <div className="w-12 bg-slate-50 flex flex-col items-center justify-center border-r border-slate-100 py-2 rounded-r-lg shrink-0">
                                    <input type="text" className="w-8 text-center bg-transparent border-b border-dashed border-slate-300 outline-none text-[11px] font-bold text-slate-500 focus:border-indigo-500 transition-colors" value={item.row_number} onChange={(e) => handleRowReorder(item.id, e.target.value)} />
                                    <div className="mt-2 flex flex-col gap-1.5 items-center">
                                        <button className="text-slate-400 hover:text-indigo-600 p-1 rounded transition-all" title={t.copyRow} onClick={(e) => { e.stopPropagation(); duplicateRow(index); }}><CopyPlus size={14} /></button>
                                        <button className="text-red-400 hover:text-red-600 p-1 rounded transition-all" onClick={(e) => { e.stopPropagation(); removeRow(index); }}><Trash2 size={14} /></button>
                                    </div>
                                 </div>
                                 
                                 <div className="flex-1 p-2 flex flex-col gap-1.5">
                                    {/* ROW 1 */}
                                    <div className="grid grid-cols-12 gap-x-3 gap-y-2 items-end">
                                       <div className="col-span-12 lg:col-span-3 flex flex-col gap-1">
                                          <div className="text-[10px] font-bold text-slate-500">{t.account}</div>
                                          <div className={`border rounded h-8 flex items-center border-indigo-300 bg-indigo-50/20`}>
                                             <SearchableSelect 
                                                options={validAccountsOptions} 
                                                value={item.account_id} 
                                                onChange={(v) => handleItemChange(index, 'account_id', v)} 
                                                disabled={isReadonly} 
                                                placeholder={t.searchAccount} 
                                                className={`w-full bg-transparent border-0 border-b border-transparent hover:border-slate-300 focus:border-indigo-500 rounded-none h-8 px-2 outline-none text-[12px] text-slate-800 transition-colors cursor-pointer`}
                                                onFocus={() => handleItemFocus(item.id)}
                                                isRtl={isRtl}
                                             />
                                          </div>
                                       </div>
                                       <div className="col-span-6 lg:col-span-2 flex flex-col gap-1">
                                          <div className="text-[10px] font-bold text-slate-500">{t.debit}</div>
                                          <input type="text" className={`w-full border rounded h-8 px-2 text-[12px] dir-ltr text-right outline-none border-indigo-300 bg-white ${item.debit > 0 ? 'text-indigo-700 font-bold bg-indigo-50/30' : ''}`} value={formatNumber(item.debit)} onChange={(e) => { const raw = e.target.value.replace(/,/g, ''); if (!isNaN(raw)) handleItemChange(index, 'debit', raw === '' ? 0 : raw); }} disabled={isReadonly} onFocus={() => handleItemFocus(item.id)} />
                                       </div>
                                       <div className="col-span-6 lg:col-span-2 flex flex-col gap-1">
                                          <div className="text-[10px] font-bold text-slate-500">{t.credit}</div>
                                          <input type="text" className={`w-full border rounded h-8 px-2 text-[12px] dir-ltr text-right outline-none border-indigo-300 bg-white ${item.credit > 0 ? 'text-indigo-700 font-bold bg-indigo-50/30' : ''}`} value={formatNumber(item.credit)} onChange={(e) => { const raw = e.target.value.replace(/,/g, ''); if (!isNaN(raw)) handleItemChange(index, 'credit', raw === '' ? 0 : raw); }} disabled={isReadonly} onFocus={() => handleItemFocus(item.id)} />
                                       </div>
                                       <div className="col-span-6 lg:col-span-2 flex flex-col gap-1">
                                          <div className="text-[10px] font-bold text-slate-500">{t.currency}</div>
                                          <div className="flex items-center gap-1 h-8">
                                            <select className={`flex-1 w-full border rounded h-full px-1 text-[12px] outline-none border-indigo-300 bg-white`} value={item.currency_code || ''} onChange={(e) => handleItemChange(index, 'currency_code', e.target.value)} disabled={isReadonly} onFocus={() => handleItemFocus(item.id)}>
                                               <option value="">-</option>
                                               {lookups.currencies.map(c => <option key={c.id} value={c.code}>{c.title}</option>)}
                                            </select>
                                            <button className={`w-8 h-full shrink-0 flex items-center justify-center rounded border transition-colors bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100`} onClick={(e) => { e.stopPropagation(); setCurrencyModalIndex(index); }} title={t.currencyConversions}>
                                              <Coins size={14}/>
                                            </button>
                                          </div>
                                       </div>
                                       <div className="col-span-12 lg:col-span-3 flex flex-col gap-1">
                                          <div className="flex justify-between items-center">
                                              <div className="text-[10px] font-bold text-slate-500">{t.description}</div>
                                              {index > 0 && <button onClick={() => copyDescription(index)} className="text-[10px] text-indigo-500 flex items-center gap-1 hover:text-indigo-700"><Copy size={10}/> {t.copyFromAbove}</button>}
                                          </div>
                                          <input type="text" className={`w-full border rounded h-8 px-2 text-[12px] outline-none border-indigo-300 bg-white`} value={item.description || ''} onChange={(e) => handleItemChange(index, 'description', e.target.value)} disabled={isReadonly} onFocus={() => handleItemFocus(item.id)} />
                                       </div>
                                    </div>

                                    {/* ROW 2 (Conditional) */}
                                    {showRow2 && (
                                       <div className="grid grid-cols-12 gap-x-3 gap-y-2 p-2 bg-slate-50/80 rounded border border-slate-100 mt-0.5">
                                          <div className="col-span-12 lg:col-span-5 flex flex-col gap-1">
                                             <div className="text-[10px] font-bold text-slate-500">{t.detail}</div>
                                             <div className={`border rounded min-h-8 flex items-center border-indigo-300 bg-indigo-50/20 ${allowedDetailTypes.length === 0 ? 'opacity-60 bg-slate-100' : ''}`}>
                                                 <MultiTagSelect 
                                                    categories={allowedDetailTypes}
                                                    options={allDetailInstancesFormatted}
                                                    value={item.details_dict || {}} 
                                                    onChange={(v) => handleItemChange(index, 'details_dict', v)} 
                                                    disabled={isReadonly || allowedDetailTypes.length === 0} 
                                                    isRtl={isRtl}
                                                    placeholderText={t.searchPlaceholder}
                                                    notFoundText={t.notFound}
                                                 />
                                             </div>
                                          </div>
                                          <div className={`col-span-4 lg:col-span-2 flex flex-col gap-1 ${hasTracking ? '' : 'opacity-40 grayscale'}`}>
                                             <div className="text-[10px] font-bold text-slate-500">{t.trackingNumber}</div>
                                             <input type="text" className={`w-full border rounded h-8 px-2 text-[12px] outline-none border-indigo-300 bg-white`} value={item.tracking_number || ''} onChange={(e) => handleItemChange(index, 'tracking_number', e.target.value)} disabled={isReadonly || (!hasTracking && !item.tracking_number)} onFocus={() => handleItemFocus(item.id)} />
                                          </div>
                                          <div className={`col-span-4 lg:col-span-2 flex flex-col gap-1 ${hasTracking ? '' : 'opacity-40 grayscale'}`}>
                                             <div className="text-[10px] font-bold text-slate-500">{t.trackingDate}</div>
                                             <input type="date" className={`w-full border rounded h-8 px-2 text-[12px] outline-none border-indigo-300 bg-white uppercase`} value={item.tracking_date || ''} onChange={(e) => handleItemChange(index, 'tracking_date', e.target.value)} disabled={isReadonly || (!hasTracking && !item.tracking_date)} onFocus={() => handleItemFocus(item.id)} />
                                          </div>
                                          <div className={`col-span-4 lg:col-span-3 flex flex-col gap-1 ${hasQuantity ? '' : 'opacity-40 grayscale'}`}>
                                             <div className="text-[10px] font-bold text-slate-500">{t.quantity}</div>
                                             <input type="text" className={`w-full border rounded h-8 px-2 text-[12px] dir-ltr text-right outline-none border-indigo-300 bg-white`} value={formatNumber(item.quantity)} onChange={(e) => { const raw = e.target.value.replace(/,/g, ''); if (!isNaN(raw)) handleItemChange(index, 'quantity', raw === '' ? '' : raw); }} disabled={isReadonly || (!hasQuantity && !item.quantity)} onFocus={() => handleItemFocus(item.id)} />
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

          {/* Summary Sidebar */}
          {isSummaryOpen && (
              <div className="w-full lg:w-[280px] shrink-0 bg-slate-50 border-t lg:border-t-0 lg:border-r rtl:border-r-0 rtl:border-l border-slate-200 flex flex-col overflow-y-auto custom-scrollbar" onClick={(e) => e.stopPropagation()}>
                  <div className="p-3 border-b border-slate-200 bg-white flex justify-between items-center z-10 shrink-0">
                      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5"><Layers size={14} className="text-indigo-500"/>{t.summary}</h3>
                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border bg-white shadow-sm ${isBalanced ? 'text-emerald-700 border-emerald-200' : 'text-red-700 border-red-200'}`}>
                          {isBalanced ? <CheckCircle size={12}/> : <FileWarning size={12}/>}
                          <span className="font-bold text-[10px] dir-ltr">{isBalanced ? t.balanced : formatNumber(Math.abs(totalDebit - totalCredit))}</span>
                      </div>
                  </div>
                  <div className="flex flex-col gap-3 p-3 text-xs">
                     <div className="flex flex-col gap-1.5 bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors">
                         <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 mb-1 border-b border-slate-100 pb-1.5"><span className="uppercase tracking-wider">{t.summaryBase}</span><Badge variant="indigo" size="sm">{getCurrencyTitle(lookups.ledgers.find(l=>l.id===contextVals.ledger_id)?.currency)}</Badge></div>
                         <div className="flex justify-between items-center"><span className="text-slate-500">{t.debit}:</span> <span className="font-bold text-indigo-700 dir-ltr text-[13px]">{formatNumber(totalDebit)}</span></div>
                         <div className="flex justify-between items-center"><span className="text-slate-500">{t.credit}:</span> <span className="font-bold text-indigo-700 dir-ltr text-[13px]">{formatNumber(totalCredit)}</span></div>
                     </div>
                     {lookups.currencyGlobals?.op_currency && (
                         <div className="flex flex-col gap-1.5 bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
                             <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 mb-1 border-b border-slate-100 pb-1.5"><span className="uppercase tracking-wider">{t.summaryOp}</span><Badge variant="slate" size="sm">{getCurrencyTitle(lookups.currencyGlobals.op_currency)}</Badge></div>
                             <div className="flex justify-between items-center"><span className="text-slate-500">{t.debit}:</span> <span className="font-bold text-slate-700 dir-ltr text-[13px]">{formatNumber(opTotalDebit)}</span></div>
                             <div className="flex justify-between items-center"><span className="text-slate-500">{t.credit}:</span> <span className="font-bold text-slate-700 dir-ltr text-[13px]">{formatNumber(opTotalCredit)}</span></div>
                         </div>
                     )}
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
      
      {/* Currency Conversion Modal */}
      {currencyModalIndex !== null && voucherItems[currencyModalIndex] && (
          <Modal isOpen={true} onClose={() => setCurrencyModalIndex(null)} title={`${t.currencyConversions} - ${t.row} ${voucherItems[currencyModalIndex].row_number}`} size="lg" footer={<Button variant="primary" onClick={() => setCurrencyModalIndex(null)}>{isRtl ? 'تایید و بستن' : 'Confirm & Close'}</Button>}>
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
                                              <input type="text" className={`w-full border rounded h-7 px-2 text-left dir-ltr outline-none ${isMatch ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-white border-slate-300 focus:border-indigo-500'}`} value={voucherItems[currencyModalIndex].op_rate} onChange={(e) => handleItemChange(currencyModalIndex, 'op_rate', e.target.value)} disabled={isMatch || isReadonly} />
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
                                              <input type="text" className={`w-full border rounded h-7 px-2 text-left dir-ltr outline-none ${isMatch ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-white border-slate-300 focus:border-indigo-500'}`} value={voucherItems[currencyModalIndex].rep1_rate} onChange={(e) => handleItemChange(currencyModalIndex, 'rep1_rate', e.target.value)} disabled={isMatch || isReadonly} />
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
                                              <input type="text" className={`w-full border rounded h-7 px-2 text-left dir-ltr outline-none ${isMatch ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-white border-slate-300 focus:border-indigo-500'}`} value={voucherItems[currencyModalIndex].rep2_rate} onChange={(e) => handleItemChange(currencyModalIndex, 'rep2_rate', e.target.value)} disabled={isMatch || isReadonly} />
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

      {/* Attachments & Print Modals */}
      <Modal isOpen={!!voucherToPrint} onClose={() => setVoucherToPrint(null)} title={t.printVoucher || 'چاپ سند حسابداری'} size="lg">
         {voucherToPrint && window.VoucherPrint ? (
             <window.VoucherPrint voucherId={voucherToPrint.id} onClose={() => setVoucherToPrint(null)} />
         ) : (
             <div className="p-10 flex flex-col items-center justify-center text-slate-500 gap-4">
                <FileWarning size={48} className="text-amber-400" />
                <p>{isRtl ? 'کامپوننت چاپ یافت نشد. لطفاً فایل VoucherPrint.js را در پروژه قرار دهید.' : 'Print component not found. Please include VoucherPrint.js.'}</p>
             </div>
         )}
      </Modal>

      <Modal isOpen={!!voucherForAttachments} onClose={() => setVoucherForAttachments(null)} title={t.attachments || 'اسناد مثبته و ضمائم'} size="md">
         {voucherForAttachments && window.VoucherAttachments ? (
             <window.VoucherAttachments voucherId={voucherForAttachments.id} onClose={() => setVoucherForAttachments(null)} />
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
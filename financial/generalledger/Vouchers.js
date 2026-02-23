/* Filename: financial/generalledger/Vouchers.js */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Edit, Trash2, Plus, ArrowRight, ArrowLeft, 
  Save, FileText, CheckCircle, FileWarning, Filter, ChevronDown, Search, Scale, Copy
} from 'lucide-react';

const localTranslations = {
  en: {
    title: 'Journal Vouchers',
    subtitle: 'Manage accounting vouchers and documents',
    newVoucher: 'New Voucher',
    search: 'Advanced Search',
    voucherNumber: 'Voucher No.',
    date: 'Date',
    type: 'Doc Type',
    status: 'Status',
    description: 'Description',
    totalDebit: 'Total Debit',
    totalCredit: 'Total Credit',
    actions: 'Actions',
    edit: 'Edit',
    delete: 'Delete',
    branch: 'Branch',
    fiscalYear: 'Fiscal Year',
    ledger: 'Ledger',
    subsidiaryNumber: 'Subsidiary No.',
    items: 'Voucher Items',
    addRow: 'Add Item',
    row: 'Row',
    account: 'Account',
    debit: 'Debit',
    credit: 'Credit',
    currency: 'Currency',
    balance: 'Balance Voucher',
    saveDraft: 'Save Draft',
    saveTemp: 'Save Temporary',
    backToList: 'Back to List',
    confirmDelete: 'Are you sure you want to delete this voucher?',
    statusDraft: 'Draft',
    statusTemp: 'Temporary',
    statusReviewed: 'Reviewed',
    statusFinal: 'Final',
    general: 'General',
    trackingNumber: 'Tracking No.',
    quantity: 'Quantity',
    unbalancedError: 'Voucher is not balanced. Can only save as draft.',
    zeroAmountError: 'Total amount cannot be zero. Please enter debit or credit values.',
    dualEntryError: 'A single row cannot have both debit and credit values.',
    reqFields: 'Description and Account are required for all items.',
    globalFiltersTitle: 'Global System Context',
    searchAccount: 'Search account code or title...',
    copyFromAbove: 'Copy from above'
  },
  fa: {
    title: 'اسناد حسابداری',
    subtitle: 'مدیریت و صدور اسناد حسابداری دفتر کل',
    newVoucher: 'سند جدید',
    search: 'جستجوی پیشرفته',
    voucherNumber: 'شماره سند',
    date: 'تاریخ',
    type: 'نوع سند',
    status: 'وضعیت',
    description: 'شرح',
    totalDebit: 'جمع بدهکار',
    totalCredit: 'جمع بستانکار',
    actions: 'عملیات',
    edit: 'ویرایش',
    delete: 'حذف',
    branch: 'شعبه',
    fiscalYear: 'سال مالی',
    ledger: 'دفتر کل',
    subsidiaryNumber: 'شماره فرعی',
    items: 'اقلام سند',
    addRow: 'ردیف جدید',
    row: 'ردیف',
    account: 'معین',
    debit: 'بدهکار',
    credit: 'بستانکار',
    currency: 'ارز',
    balance: 'تراز کردن سند',
    saveDraft: 'ذخیره یادداشت',
    saveTemp: 'ذخیره موقت',
    backToList: 'بازگشت به فهرست',
    confirmDelete: 'آیا از حذف این سند اطمینان دارید؟',
    statusDraft: 'یادداشت',
    statusTemp: 'موقت',
    statusReviewed: 'بررسی شده',
    statusFinal: 'قطعی شده',
    general: 'عمومی',
    trackingNumber: 'شماره پیگیری',
    quantity: 'مقدار',
    unbalancedError: 'سند بالانس نیست و فقط به عنوان یادداشت قابل ذخیره است.',
    zeroAmountError: 'مبلغ کل سند نمی‌تواند صفر باشد. لطفاً مقادیر بدهکار یا بستانکار را وارد کنید.',
    dualEntryError: 'یک ردیف نمی‌تواند همزمان هم بدهکار و هم بستانکار باشد.',
    reqFields: 'شرح و حساب معین برای تمامی اقلام اجباری است.',
    globalFiltersTitle: 'فیلترهای عمومی سیستم',
    searchAccount: 'جستجوی کد یا عنوان معین...',
    copyFromAbove: 'کپی از ردیف بالا'
  }
};

const SearchableAccountSelect = ({ accounts, value, onChange, disabled, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);

  const selectedAcc = accounts.find(a => String(a.id) === String(value));
  const displaySelected = selectedAcc ? `${selectedAcc.full_code} - ${selectedAcc.title}` : '';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = accounts.filter(a => 
    a.displayPath.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative">
        <input
          type="text"
          className="w-full bg-slate-50 border border-slate-200 rounded h-8 px-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-[12px] text-slate-800"
          value={isOpen ? search : displaySelected}
          onChange={e => { setSearch(e.target.value); setIsOpen(true); }}
          onFocus={() => { setIsOpen(true); setSearch(''); }}
          disabled={disabled}
          placeholder={placeholder}
          title={displaySelected}
        />
        <Search size={12} className="absolute top-1/2 -translate-y-1/2 left-2 text-slate-400 pointer-events-none" />
      </div>
      
      {isOpen && !disabled && (
        <div className="absolute z-[60] w-[350px] rtl:right-0 ltr:left-0 mt-1 bg-white border border-slate-200 rounded shadow-xl max-h-60 overflow-y-auto custom-scrollbar">
          {filtered.map(acc => (
            <div
              key={acc.id}
              className="px-3 py-2 text-[11px] hover:bg-indigo-50 cursor-pointer border-b border-slate-50 last:border-0"
              onMouseDown={(e) => { e.preventDefault(); onChange(acc.id); setIsOpen(false); }}
            >
              <div className="font-bold text-slate-800 dir-ltr text-right">{acc.full_code} - {acc.title}</div>
              <div className="text-slate-500 truncate mt-0.5 text-[10px]" title={acc.path}>{acc.path}</div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="px-3 py-3 text-[11px] text-slate-400 text-center">موردی یافت نشد</div>
          )}
        </div>
      )}
    </div>
  );
};

const formatNum = (num) => {
  if (num === null || num === undefined || num === '') return '';
  return Number(num).toLocaleString();
};

const parseNum = (str) => {
  const raw = String(str).replace(/,/g, '');
  return isNaN(raw) || raw === '' ? 0 : parseFloat(raw);
};

const Vouchers = ({ language = 'fa' }) => {
  const t = localTranslations[language];
  const isRtl = language === 'fa';
  
  const UI = window.UI || {};
  const { Button, InputField, SelectField, DataGrid, FilterSection, Modal, Badge } = UI;
  const supabase = window.supabase;

  const [view, setView] = useState('list');
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [voucherToDelete, setVoucherToDelete] = useState(null);

  const [contextVals, setContextVals] = useState({ fiscal_year_id: '', ledger_id: '', branch_id: '' });

  const [vouchers, setVouchers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [accountStructures, setAccountStructures] = useState([]);
  const [branches, setBranches] = useState([]);
  const [fiscalYears, setFiscalYears] = useState([]);
  const [ledgers, setLedgers] = useState([]);
  const [docTypes, setDocTypes] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  
  const [searchParams, setSearchParams] = useState({ voucher_number: '', description: '' });
  const [selectedIds, setSelectedIds] = useState([]);

  const [currentVoucher, setCurrentVoucher] = useState(null);
  const [voucherItems, setVoucherItems] = useState([]);

  useEffect(() => {
    fetchLookups();
  }, []);

  useEffect(() => {
    if (view === 'list') {
      if (contextVals.fiscal_year_id && contextVals.ledger_id && contextVals.branch_id) {
        fetchVouchers();
      } else {
        setVouchers([]);
      }
    }
  }, [view, contextVals]);

  const fetchLookups = async () => {
    if (!supabase) return;
    try {
      const [brRes, fyRes, ledRes, structRes] = await Promise.all([
        supabase.schema('gen').from('branches').select('id, code, title, is_default').eq('is_active', true).order('title'),
        supabase.schema('gl').from('fiscal_years').select('id, code, title, status').eq('is_active', true).order('code', { ascending: false }),
        supabase.schema('gl').from('ledgers').select('id, code, title, currency, structure').eq('is_active', true).order('title'),
        supabase.schema('gl').from('account_structures').select('id, code, title').eq('status', true)
      ]);
      
      if (brRes.data) setBranches(brRes.data);
      if (fyRes.data) setFiscalYears(fyRes.data);
      if (ledRes.data) setLedgers(ledRes.data);
      if (structRes.data) setAccountStructures(structRes.data);

      setContextVals(prev => {
        if (!prev.fiscal_year_id && !prev.ledger_id && !prev.branch_id) {
          const defaultBranch = brRes.data?.find(b => b.is_default) || brRes.data?.[0];
          return {
            fiscal_year_id: fyRes.data?.[0]?.id || '',
            ledger_id: ledRes.data?.[0]?.id || '',
            branch_id: defaultBranch?.id || ''
          };
        }
        return prev;
      });

      const accRes = await supabase.schema('gl').from('accounts').select('id, full_code, title, level, parent_id, metadata, structure_id').eq('is_active', true).order('full_code');
      if (accRes.data) {
        const allAccs = accRes.data;
        const accMap = new Map(allAccs.map(a => [a.id, a]));
        
        const processedAccounts = allAccs.map(a => {
          let path = a.title;
          let curr = a;
          while (curr.parent_id && accMap.has(curr.parent_id)) {
            curr = accMap.get(curr.parent_id);
            path = `${curr.title} / ${path}`;
          }
          return { ...a, path, displayPath: `${a.full_code} - ${path}` };
        });
        setAccounts(processedAccounts);
      }

      const dtRes = await supabase.schema('gl').from('doc_types').select('id, code, title').eq('is_active', true);
      if (dtRes.data) setDocTypes(dtRes.data);

      const currRes = await supabase.schema('gen').from('currencies').select('id, code, title').eq('is_active', true);
      if (currRes.data) setCurrencies(currRes.data);

    } catch (error) {
      console.error('Error fetching lookups:', error);
    }
  };

  const fetchVouchers = async () => {
    if (!supabase || !contextVals.fiscal_year_id || !contextVals.ledger_id || !contextVals.branch_id) return;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(contextVals.fiscal_year_id)) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.schema('gl')
        .from('vouchers')
        .select('*')
        .eq('fiscal_period_id', contextVals.fiscal_year_id)
        .eq('ledger_id', contextVals.ledger_id)
        .eq('branch_id', contextVals.branch_id)
        .order('voucher_date', { ascending: false })
        .order('voucher_number', { ascending: false });
      
      if (error) throw error;
      setVouchers(data || []);
    } catch (error) {
      console.error('Error fetching vouchers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = async (voucher = null) => {
    if (voucher) {
      setCurrentVoucher(voucher);
      setLoading(true);
      try {
        const { data, error } = await supabase.schema('gl')
          .from('voucher_items')
          .select('*')
          .eq('voucher_id', voucher.id)
          .order('row_number', { ascending: true });
        
        if (error) throw error;
        
        const mappedItems = (data || []).map(item => {
          const detailsObj = typeof item.details === 'string' ? JSON.parse(item.details || '{}') : (item.details || {});
          return { ...item, currency_code: detailsObj.currency_code || '' };
        });
        setVoucherItems(mappedItems);
      } catch (error) {
        console.error('Error fetching items:', error);
      } finally {
        setLoading(false);
      }
    } else {
      const initialLedgerId = contextVals.ledger_id;
      const currentLedger = ledgers.find(l => String(l.id) === String(initialLedgerId));
      const defaultCurrency = currentLedger?.currency || '';

      setCurrentVoucher({
        voucher_date: new Date().toISOString().split('T')[0],
        voucher_type: docTypes.length > 0 ? docTypes[0].code : 'general',
        status: 'draft',
        description: '',
        subsidiary_number: '',
        fiscal_period_id: contextVals.fiscal_year_id,
        ledger_id: initialLedgerId,
        branch_id: contextVals.branch_id
      });
      setVoucherItems([{
        id: `temp_${Date.now()}`,
        row_number: 1,
        account_id: '',
        debit: 0,
        credit: 0,
        currency_code: defaultCurrency,
        description: '',
        tracking_number: '',
        quantity: 0
      }]);
    }
    setView('form');
  };

  const handleSaveVoucher = async (status) => {
    if (!supabase) return;
    
    if (voucherItems.some(item => !item.description || !item.account_id)) {
      alert(t.reqFields);
      return;
    }

    const totalDebit = voucherItems.reduce((sum, item) => sum + parseNum(item.debit), 0);
    const totalCredit = voucherItems.reduce((sum, item) => sum + parseNum(item.credit), 0);
    
    if (totalDebit === 0 && totalCredit === 0) {
      alert(t.zeroAmountError);
      return;
    }

    if (status === 'temporary' && totalDebit !== totalCredit) {
      alert(t.unbalancedError);
      return;
    }

    setLoading(true);
    try {
      const voucherData = { 
        ...currentVoucher, 
        status,
        total_debit: totalDebit,
        total_credit: totalCredit
      };

      let savedVoucherId = currentVoucher.id;

      if (savedVoucherId) {
        const { error } = await supabase.schema('gl').from('vouchers').update(voucherData).eq('id', savedVoucherId);
        if (error) throw error;
        await supabase.schema('gl').from('voucher_items').delete().eq('voucher_id', savedVoucherId);
      } else {
        const { data, error } = await supabase.schema('gl').from('vouchers').insert([voucherData]).select().single();
        if (error) throw error;
        savedVoucherId = data.id;
      }

      const itemsToSave = voucherItems.map((item, index) => {
        return {
          voucher_id: savedVoucherId,
          row_number: index + 1,
          account_id: item.account_id || null,
          debit: parseNum(item.debit),
          credit: parseNum(item.credit),
          description: item.description,
          tracking_number: item.tracking_number || null,
          quantity: parseNum(item.quantity),
          details: { currency_code: item.currency_code }
        };
      });

      if (itemsToSave.length > 0) {
        const { error: itemsError } = await supabase.schema('gl').from('voucher_items').insert(itemsToSave);
        if (itemsError) throw itemsError;
      }

      setView('list');
      setCurrentVoucher(null);
      setVoucherItems([]);
      fetchVouchers();
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
      if (parseNum(value) > 0) {
        newItems[index][otherField] = 0;
      }
    }

    newItems[index][field] = value;
    
    if (field === 'account_id') {
      const selectedAcc = accounts.find(a => String(a.id) === String(value));
      const currentLedger = ledgers.find(l => String(l.id) === String(currentVoucher.ledger_id));
      let newCurrency = currentLedger?.currency || '';

      if (selectedAcc && selectedAcc.metadata) {
        const meta = typeof selectedAcc.metadata === 'string' ? JSON.parse(selectedAcc.metadata) : selectedAcc.metadata;
        if (meta.currency_code) newCurrency = meta.currency_code;
      }
      newItems[index]['currency_code'] = newCurrency;
    }

    setVoucherItems(newItems);
  };

  const addItemRow = () => {
    const activeLedgerId = currentVoucher?.ledger_id || contextVals.ledger_id;
    const currentLedger = ledgers.find(l => String(l.id) === String(activeLedgerId));
    const lastDescription = voucherItems.length > 0 ? voucherItems[voucherItems.length - 1].description : '';

    setVoucherItems([...voucherItems, { 
      id: `temp_${Date.now()}`, 
      row_number: voucherItems.length + 1, 
      account_id: '', 
      debit: 0, 
      credit: 0, 
      currency_code: currentLedger?.currency || '',
      description: lastDescription, 
      tracking_number: '', 
      quantity: 0 
    }]);
  };

  const globalBalance = () => {
    const totalDebit = voucherItems.reduce((sum, item) => sum + parseNum(item.debit), 0);
    const totalCredit = voucherItems.reduce((sum, item) => sum + parseNum(item.credit), 0);
    const diff = totalDebit - totalCredit;
    
    if (diff === 0) return;

    const currentLedger = ledgers.find(l => String(l.id) === String(currentVoucher.ledger_id));

    setVoucherItems([...voucherItems, { 
      id: `temp_${Date.now()}`, 
      row_number: voucherItems.length + 1, 
      account_id: '', 
      debit: diff < 0 ? Math.abs(diff) : 0, 
      credit: diff > 0 ? diff : 0, 
      currency_code: currentLedger?.currency || '',
      description: '', 
      tracking_number: '', 
      quantity: 0 
    }]);
  };

  const copyDescription = (index) => {
    if (index > 0) {
      const newItems = [...voucherItems];
      newItems[index].description = newItems[index - 1].description;
      setVoucherItems(newItems);
    }
  };

  const removeRow = (index) => {
    if (voucherItems.length > 1) {
      setVoucherItems(voucherItems.filter((_, i) => i !== index));
    }
  };

  const confirmDelete = async () => {
    if (!voucherToDelete || !supabase) return;
    try {
      const { error } = await supabase.schema('gl').from('vouchers').delete().eq('id', voucherToDelete.id);
      if (error) throw error;
      setShowDeleteModal(false);
      setVoucherToDelete(null);
      fetchVouchers();
    } catch (error) {
      console.error('Error deleting voucher:', error);
    }
  };

  const promptDelete = (voucher) => {
    if (voucher.status === 'reviewed' || voucher.status === 'final') return;
    setVoucherToDelete(voucher);
    setShowDeleteModal(true);
  };

  const getStatusBadge = (status) => {
    const variant = status === 'final' ? 'success' : status === 'reviewed' ? 'info' : status === 'temporary' ? 'warning' : 'neutral';
    return <Badge variant={variant}>{t[`status${status.charAt(0).toUpperCase() + status.slice(1)}`]}</Badge>;
  };

  const columns = [
    { field: 'voucher_number', header: t.voucherNumber, width: 'w-24', sortable: true },
    { field: 'voucher_date', header: t.date, width: 'w-24', sortable: true },
    { field: 'voucher_type', header: t.type, width: 'w-32', render: (row) => docTypes.find(d => d.code === row.voucher_type)?.title || row.voucher_type },
    { field: 'status', header: t.status, width: 'w-32', render: (row) => getStatusBadge(row.status) },
    { field: 'description', header: t.description, width: 'w-64' },
    { field: 'total_debit', header: t.totalDebit, width: 'w-32', render: (row) => formatNum(row.total_debit) },
    { field: 'total_credit', header: t.totalCredit, width: 'w-32', render: (row) => formatNum(row.total_credit) }
  ];

  if (view === 'form' && currentVoucher) {
    const totalDebit = voucherItems.reduce((sum, item) => sum + parseNum(item.debit), 0);
    const totalCredit = voucherItems.reduce((sum, item) => sum + parseNum(item.credit), 0);
    const isBalanced = totalDebit === totalCredit;
    const isReadonly = currentVoucher.status === 'reviewed' || currentVoucher.status === 'final';

    const currentLedger = ledgers.find(l => String(l.id) === String(currentVoucher.ledger_id));
    const ledgerStructureCode = String(currentLedger?.structure || '').trim();
    const targetStructure = accountStructures.find(s => String(s.code).trim() === ledgerStructureCode);
    const structureId = targetStructure ? String(targetStructure.id) : null;

    const validAccountsForLedger = accounts.filter(a => {
        const isSubsidiary = a.level === 'subsidiary' || a.level === 'معین' || a.level === '4';
        return String(a.structure_id) === structureId && isSubsidiary;
    });

    return (
      <div className={`h-full flex flex-col p-4 md:p-6 bg-slate-50/50 ${isRtl ? 'font-vazir' : 'font-sans'}`}>
        <div className="mb-4 flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => { setView('list'); setCurrentVoucher(null); setVoucherItems([]); }} icon={isRtl ? ArrowRight : ArrowLeft}>{t.backToList}</Button>
            <div className="h-6 w-px bg-slate-200 mx-1"></div>
            <h2 className="text-lg font-bold text-slate-800">{currentVoucher.id ? t.edit : t.newVoucher}</h2>
            {currentVoucher.id && getStatusBadge(currentVoucher.status)}
          </div>
          <div className="flex items-center gap-2">
            {!isReadonly && (
              <>
                <Button variant="outline" onClick={() => handleSaveVoucher('draft')} icon={Save}>{t.saveDraft}</Button>
                <Button variant="primary" onClick={() => handleSaveVoucher('temporary')} icon={CheckCircle}>{t.saveTemp}</Button>
              </>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto flex flex-col gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm shrink-0 grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <InputField type="date" label={t.date} value={currentVoucher.voucher_date || ''} onChange={(e) => setCurrentVoucher({...currentVoucher, voucher_date: e.target.value})} disabled={isReadonly} isRtl={isRtl} className="lg:col-span-2" />
            <SelectField label={t.type} value={currentVoucher.voucher_type || ''} onChange={(e) => setCurrentVoucher({...currentVoucher, voucher_type: e.target.value})} disabled={isReadonly} isRtl={isRtl} className="lg:col-span-2">
              {docTypes.map(d => <option key={d.id} value={d.code}>{d.title}</option>)}
            </SelectField>
            <InputField label={t.subsidiaryNumber} value={currentVoucher.subsidiary_number || ''} onChange={(e) => setCurrentVoucher({...currentVoucher, subsidiary_number: e.target.value})} disabled={isReadonly} isRtl={isRtl} className="lg:col-span-2" />
            <div className="md:col-span-4 lg:col-span-6">
                <InputField label={t.description} value={currentVoucher.description || ''} onChange={(e) => setCurrentVoucher({...currentVoucher, description: e.target.value})} disabled={isReadonly} isRtl={isRtl} />
            </div>
          </div>

          <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
            <div className="flex justify-between items-center p-3 bg-slate-50 border-b border-slate-200 shrink-0">
              <h3 className="text-sm font-bold text-slate-800">{t.items}</h3>
              {!isReadonly && (
                <div className="flex gap-2">
                   <Button variant="outline" size="sm" onClick={globalBalance} icon={Scale}>{t.balance}</Button>
                   <Button variant="primary" size="sm" onClick={addItemRow} icon={Plus}>{t.addRow}</Button>
                </div>
              )}
            </div>
            
            <div className="flex-1 overflow-auto custom-scrollbar">
              <table className="w-full text-[12px] text-left rtl:text-right border-collapse">
                <thead className="bg-slate-100 text-slate-700 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-3 py-2 text-center w-12 border-b border-slate-200">{t.row}</th>
                    <th className="px-3 py-2 min-w-[250px] border-b border-slate-200">{t.account}</th>
                    <th className="px-3 py-2 min-w-[140px] border-b border-slate-200">{t.debit}</th>
                    <th className="px-3 py-2 min-w-[140px] border-b border-slate-200">{t.credit}</th>
                    <th className="px-3 py-2 min-w-[100px] border-b border-slate-200">{t.currency}</th>
                    <th className="px-3 py-2 min-w-[300px] border-b border-slate-200">{t.description}</th>
                    <th className="px-3 py-2 min-w-[120px] border-b border-slate-200">{t.trackingNumber}</th>
                    <th className="px-3 py-2 w-24 border-b border-slate-200">{t.quantity}</th>
                    <th className="px-3 py-2 text-center w-20 border-b border-slate-200 sticky left-0 bg-slate-100 shadow-[-2px_0_5_rgba(0,0,0,0.05)]">{t.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {voucherItems.map((item, index) => (
                    <tr key={item.id} className="hover:bg-indigo-50/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-bold text-slate-400">{index + 1}</td>
                      <td className="px-3 py-2">
                        <SearchableAccountSelect accounts={validAccountsForLedger} value={item.account_id} onChange={(v) => handleItemChange(index, 'account_id', v)} disabled={isReadonly} placeholder={t.searchAccount} />
                      </td>
                      <td className="px-3 py-2">
                         <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded h-8 px-2 text-[12px] dir-ltr text-right font-mono focus:bg-white focus:border-indigo-400 outline-none" value={formatNum(item.debit)} onChange={(e) => {
                             const raw = e.target.value.replace(/,/g, '');
                             if (!isNaN(raw)) handleItemChange(index, 'debit', raw === '' ? 0 : raw);
                         }} disabled={isReadonly} />
                      </td>
                      <td className="px-3 py-2">
                         <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded h-8 px-2 text-[12px] dir-ltr text-right font-mono focus:bg-white focus:border-indigo-400 outline-none" value={formatNum(item.credit)} onChange={(e) => {
                             const raw = e.target.value.replace(/,/g, '');
                             if (!isNaN(raw)) handleItemChange(index, 'credit', raw === '' ? 0 : raw);
                         }} disabled={isReadonly} />
                      </td>
                      <td className="px-3 py-2">
                        <select className="w-full bg-slate-50 border border-slate-200 rounded h-8 px-2 text-[12px] outline-none" value={item.currency_code || ''} onChange={(e) => handleItemChange(index, 'currency_code', e.target.value)} disabled={isReadonly}>
                          <option value="">--</option>
                          {currencies.map(c => <option key={c.id} value={c.code}>{c.title}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1 items-center">
                          <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded h-8 px-2 text-[12px] focus:bg-white focus:border-indigo-400 outline-none" value={item.description || ''} onChange={(e) => handleItemChange(index, 'description', e.target.value)} disabled={isReadonly} />
                          {!isReadonly && index > 0 && (
                            <button onClick={() => copyDescription(index)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title={t.copyFromAbove}><Copy size={14} /></button>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded h-8 px-2 text-[12px] outline-none" value={item.tracking_number || ''} onChange={(e) => handleItemChange(index, 'tracking_number', e.target.value)} disabled={isReadonly} />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded h-8 px-2 text-[12px] dir-ltr outline-none" value={item.quantity || ''} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} disabled={isReadonly} />
                      </td>
                      <td className="px-3 py-2 text-center sticky left-0 bg-white group-hover:bg-indigo-50/30">
                        {!isReadonly && (
                          <button className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded transition-all" onClick={() => removeRow(index)}><Trash2 size={14} /></button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-slate-50 border-t border-slate-200 p-4 flex flex-wrap gap-8 font-mono text-[14px] font-bold shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="text-slate-500 font-sans text-xs uppercase tracking-wider">{t.totalDebit}</span>
                <span className="text-indigo-700 bg-indigo-50 px-3 py-1 rounded-md border border-indigo-100">{formatNum(totalDebit)}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-slate-500 font-sans text-xs uppercase tracking-wider">{t.totalCredit}</span>
                <span className="text-indigo-700 bg-indigo-50 px-3 py-1 rounded-md border border-indigo-100">{formatNum(totalCredit)}</span>
              </div>
              <div className="flex-1"></div>
              <div className={`flex items-center gap-2 px-4 py-1 rounded-full border ${isBalanced ? 'text-emerald-700 bg-emerald-50 border-emerald-100' : 'text-red-700 bg-red-50 border-red-100'}`}>
                 {isBalanced ? <CheckCircle size={16}/> : <FileWarning size={16}/>}
                 <span className="font-sans text-xs">{isBalanced ? t.alreadyBalanced : formatNum(Math.abs(totalDebit - totalCredit))}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col p-4 md:p-6 bg-slate-50/50 ${isRtl ? 'font-vazir' : 'font-sans'}`}>
      <div className="mb-4 bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-2 text-indigo-800 font-bold text-sm">
          <Filter size={18} className="text-indigo-500"/>
          <span>{t.globalFiltersTitle}:</span>
        </div>
        <div className="flex gap-3">
          <select value={contextVals.fiscal_year_id} onChange={e => setContextVals({...contextVals, fiscal_year_id: e.target.value})} className="bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg px-3 py-1.5 text-xs font-bold outline-none cursor-pointer focus:ring-2 focus:ring-indigo-200 transition-all">
            {fiscalYears.map(f => <option key={f.id} value={f.id}>{f.title}</option>)}
          </select>
          <select value={contextVals.ledger_id} onChange={e => setContextVals({...contextVals, ledger_id: e.target.value})} className="bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg px-3 py-1.5 text-xs font-bold outline-none cursor-pointer focus:ring-2 focus:ring-indigo-200 transition-all">
            {ledgers.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
          </select>
          <select value={contextVals.branch_id} onChange={e => setContextVals({...contextVals, branch_id: e.target.value})} className="bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg px-3 py-1.5 text-xs font-bold outline-none cursor-pointer focus:ring-2 focus:ring-indigo-200 transition-all">
            {branches.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
          </select>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200">
            <FileText size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800">{t.title}</h1>
            <p className="text-xs text-slate-500 font-medium mt-1">{t.subtitle}</p>
          </div>
        </div>
      </div>

      <FilterSection onSearch={() => {}} onClear={() => setSearchParams({ voucher_number: '', description: '' })} isRtl={isRtl} title={t.search}>
        <InputField label={t.voucherNumber} value={searchParams.voucher_number} onChange={e => setSearchParams({...searchParams, voucher_number: e.target.value})} isRtl={isRtl} />
        <InputField label={t.description} value={searchParams.description} onChange={e => setSearchParams({...searchParams, description: e.target.value})} isRtl={isRtl} />
      </FilterSection>

      <div className="flex-1 min-h-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <DataGrid 
          columns={columns} 
          data={vouchers.filter(v => 
            (!searchParams.voucher_number || String(v.voucher_number).includes(searchParams.voucher_number)) && 
            (!searchParams.description || v.description?.includes(searchParams.description))
          )} 
          selectedIds={selectedIds} 
          onSelectRow={(id, c) => setSelectedIds(c ? [...selectedIds, id] : selectedIds.filter(i => i !== id))} 
          onSelectAll={(c) => setSelectedIds(c ? vouchers.map(v => v.id) : [])} 
          onCreate={() => handleOpenForm()} 
          onDelete={(ids) => { setVoucherToDelete(vouchers.find(v => v.id === ids[0])); setShowDeleteModal(true); }} 
          onDoubleClick={(r) => handleOpenForm(r)} 
          isRtl={isRtl} 
          isLoading={loading} 
          actions={(r) => (
            <div className="flex gap-1 justify-center">
              <Button variant="ghost" size="iconSm" icon={Edit} onClick={() => handleOpenForm(r)} />
              <Button variant="ghost" size="iconSm" icon={Trash2} className="text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => promptDelete(r)} />
            </div>
          )}
        />
      </div>

      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title={t.delete} footer={<><Button variant="ghost" onClick={() => setShowDeleteModal(false)}>{t.backToList}</Button><Button variant="danger" onClick={confirmDelete}>{t.delete}</Button></>}>
        <div className="p-4"><p className="text-slate-700 font-medium">{t.confirmDelete}</p></div>
      </Modal>
    </div>
  );
};

window.Vouchers = Vouchers;
export default Vouchers;
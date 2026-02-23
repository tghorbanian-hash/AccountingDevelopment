import React, { useState, useEffect, useMemo } from 'react';

const { supabase } = window;
const { Card, Button, Input, Select, Table, Modal, Checkbox } = window.UI || {};

const translations = {
  en: {
    title: 'Journal Vouchers',
    newVoucher: 'New Voucher',
    search: 'Advanced Search',
    voucherNumber: 'Voucher No.',
    dailyNumber: 'Daily No.',
    date: 'Date',
    type: 'Type',
    status: 'Status',
    description: 'Description',
    totalDebit: 'Total Debit',
    totalCredit: 'Total Credit',
    actions: 'Actions',
    edit: 'Edit',
    delete: 'Delete',
    copy: 'Copy',
    print: 'Print',
    numbering: 'Numbering',
    branch: 'Branch',
    subsidiaryNumber: 'Subsidiary No.',
    referenceNumber: 'Ref No.',
    crossReference: 'Cross Ref.',
    items: 'Voucher Items',
    addRow: 'Add Item',
    row: 'Row',
    account: 'Account',
    debit: 'Debit',
    credit: 'Credit',
    balance: 'Balance Voucher',
    saveDraft: 'Save as Draft',
    saveTemp: 'Save as Temporary',
    backToList: 'Back to List',
    confirmDelete: 'Are you sure you want to delete this voucher?',
    statusDraft: 'Draft',
    statusTemp: 'Temporary',
    statusReviewed: 'Reviewed',
    statusFinal: 'Final',
    general: 'General',
    opening: 'Opening',
    trackingNumber: 'Tracking No.',
    trackingDate: 'Tracking Date',
    quantity: 'Quantity',
    itemsCount: 'Items Count',
    page: 'Page',
    of: 'of',
    rowsPerPage: 'Rows per page',
    noData: 'No records found to display',
    unbalancedError: 'Voucher is not balanced. Can only save as draft.',
    alreadyBalanced: 'Voucher is already balanced.',
    cannotDelete: 'Reviewed or Final vouchers cannot be deleted.',
    advancedFilters: 'Advanced Filters',
    field: 'Field',
    operator: 'Operator',
    value: 'Value',
    applyFilter: 'Apply',
    clearFilters: 'Clear',
    equals: 'Equals',
    contains: 'Contains',
    greaterThan: 'Greater Than',
    lessThan: 'Less Than'
  },
  fa: {
    title: 'اسناد حسابداری',
    newVoucher: 'سند جدید',
    search: 'جستجوی پیشرفته',
    voucherNumber: 'شماره سند',
    dailyNumber: 'شماره روزانه',
    date: 'تاریخ',
    type: 'نوع سند',
    status: 'وضعیت',
    description: 'شرح',
    totalDebit: 'جمع بدهکار',
    totalCredit: 'جمع بستانکار',
    actions: 'عملیات',
    edit: 'ویرایش',
    delete: 'حذف',
    copy: 'کپی',
    print: 'چاپ',
    numbering: 'شماره گذاری',
    branch: 'شعبه',
    subsidiaryNumber: 'شماره فرعی',
    referenceNumber: 'شماره عطف',
    crossReference: 'شماره ارجاع',
    items: 'اقلام سند',
    addRow: 'ردیف جدید',
    row: 'ردیف',
    account: 'معین',
    debit: 'بدهکار',
    credit: 'بستانکار',
    balance: 'موازنه مبلغ',
    saveDraft: 'ذخیره یادداشت',
    saveTemp: 'ذخیره موقت',
    backToList: 'بازگشت به فهرست',
    confirmDelete: 'آیا از حذف این سند اطمینان دارید؟',
    statusDraft: 'یادداشت',
    statusTemp: 'موقت',
    statusReviewed: 'بررسی شده',
    statusFinal: 'قطعی شده',
    general: 'عمومی',
    opening: 'افتتاحیه',
    trackingNumber: 'شماره پیگیری',
    trackingDate: 'تاریخ پیگیری',
    quantity: 'مقدار',
    itemsCount: 'تعداد کل',
    page: 'صفحه',
    of: 'از',
    rowsPerPage: 'تعداد در صفحه',
    noData: 'اطلاعاتی برای نمایش وجود ندارد',
    unbalancedError: 'سند بالانس نیست و فقط به عنوان یادداشت قابل ذخیره است.',
    alreadyBalanced: 'سند بالانس است.',
    cannotDelete: 'اسناد بررسی شده یا قطعی قابل حذف نیستند.',
    advancedFilters: 'فیلترهای پیشرفته',
    field: 'فیلد',
    operator: 'عملگر',
    value: 'مقدار',
    applyFilter: 'اعمال',
    clearFilters: 'حذف فیلترها',
    equals: 'برابر باشد با',
    contains: 'شامل باشد',
    greaterThan: 'بزرگتر از',
    lessThan: 'کوچکتر از'
  }
};

window.Vouchers = function Vouchers({ language = 'fa' }) {
  const t = translations[language];
  const isRtl = language === 'fa';
  
  const [view, setView] = useState('list');
  const [loading, setLoading] = useState(false);
  
  const [vouchers, setVouchers] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [accounts, setAccounts] = useState([]);
  const [branches, setBranches] = useState([]);
  
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortField, setSortField] = useState('voucher_date');
  const [sortAsc, setSortAsc] = useState(false);

  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [filters, setFilters] = useState([]);
  const [currentFilter, setCurrentFilter] = useState({ field: 'voucher_number', operator: 'eq', value: '' });

  const [currentVoucher, setCurrentVoucher] = useState(null);
  const [voucherItems, setVoucherItems] = useState([]);
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [voucherToDelete, setVoucherToDelete] = useState(null);

  useEffect(() => {
    fetchLookups();
  }, []);

  useEffect(() => {
    if (view === 'list') {
      fetchVouchers();
    }
  }, [page, pageSize, sortField, sortAsc, filters, view]);

  const fetchLookups = async () => {
    try {
      const [accRes, brRes] = await Promise.all([
        supabase.from('accounts').select('id, code, title, is_active').eq('is_active', true),
        supabase.from('branches').select('id, code, title, is_active').eq('is_active', true)
      ]);
      if (accRes.data) setAccounts(accRes.data);
      if (brRes.data) setBranches(brRes.data);
    } catch (error) {
      console.error('Error fetching lookups:', error);
    }
  };

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      let query = supabase.schema('gl').from('vouchers').select('*', { count: 'exact' });

      filters.forEach(f => {
        if (f.operator === 'eq') query = query.eq(f.field, f.value);
        if (f.operator === 'ilike') query = query.ilike(f.field, `%${f.value}%`);
        if (f.operator === 'gt') query = query.gt(f.field, f.value);
        if (f.operator === 'lt') query = query.lt(f.field, f.value);
      });

      query = query.order(sortField, { ascending: sortAsc });
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      
      if (error) throw error;
      setVouchers(data || []);
      setTotalRecords(count || 0);
    } catch (error) {
      console.error('Error fetching vouchers:', error);
    } finally {
      setLoading(false);
    }
  };

  const addFilter = () => {
    if (!currentFilter.value) return;
    setFilters([...filters, { ...currentFilter }]);
    setCurrentFilter({ ...currentFilter, value: '' });
    setPage(1);
  };

  const removeFilter = (index) => {
    const newFilters = [...filters];
    newFilters.splice(index, 1);
    setFilters(newFilters);
    setPage(1);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
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
        setVoucherItems(data || []);
      } catch (error) {
        console.error('Error fetching items:', error);
      } finally {
        setLoading(false);
      }
    } else {
      setCurrentVoucher({
        voucher_date: new Date().toISOString().split('T')[0],
        voucher_type: 'general',
        status: 'draft',
        description: '',
        subsidiary_number: '',
        branch_id: branches.length > 0 ? branches[0].id : null
      });
      setVoucherItems([{
        id: `temp_${Date.now()}`,
        row_number: 1,
        account_id: '',
        debit: 0,
        credit: 0,
        description: '',
        tracking_number: '',
        tracking_date: '',
        quantity: 0
      }]);
    }
    setView('form');
  };

  const handleCloseForm = () => {
    setView('list');
    setCurrentVoucher(null);
    setVoucherItems([]);
  };

  const handleSaveVoucher = async (status) => {
    try {
      setLoading(true);
      
      const missingDescriptions = voucherItems.some(item => !item.description || item.description.trim() === '');
      if (missingDescriptions) {
        alert(language === 'fa' ? 'شرح تمامی اقلام اجباری است.' : 'Description is required for all items.');
        setLoading(false);
        return;
      }

      const voucherData = { ...currentVoucher, status };
      
      const totalDebit = voucherItems.reduce((sum, item) => sum + (parseFloat(item.debit) || 0), 0);
      const totalCredit = voucherItems.reduce((sum, item) => sum + (parseFloat(item.credit) || 0), 0);
      
      if (status === 'temporary' && totalDebit !== totalCredit) {
        alert(t.unbalancedError);
        setLoading(false);
        return;
      }

      voucherData.total_debit = totalDebit;
      voucherData.total_credit = totalCredit;

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

      const itemsToSave = voucherItems.map((item, index) => ({
        voucher_id: savedVoucherId,
        row_number: index + 1,
        account_id: item.account_id || null,
        debit: parseFloat(item.debit) || 0,
        credit: parseFloat(item.credit) || 0,
        description: item.description,
        tracking_number: item.tracking_number || null,
        tracking_date: item.tracking_date || null,
        quantity: parseFloat(item.quantity) || 0
      }));

      if (itemsToSave.length > 0) {
        const { error: itemsError } = await supabase.schema('gl').from('voucher_items').insert(itemsToSave);
        if (itemsError) throw itemsError;
      }

      handleCloseForm();
    } catch (error) {
      console.error('Error saving voucher:', error);
      alert('Error saving voucher.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (voucher) => {
    if (voucher.status === 'reviewed' || voucher.status === 'final') {
      alert(t.cannotDelete);
      return;
    }
    setVoucherToDelete(voucher);
    setIsDeleting(true);
  };

  const confirmDelete = async () => {
    if (!voucherToDelete) return;
    try {
      const { error } = await supabase.schema('gl').from('vouchers').delete().eq('id', voucherToDelete.id);
      if (error) throw error;
      setIsDeleting(false);
      setVoucherToDelete(null);
      fetchVouchers();
    } catch (error) {
      console.error('Error deleting voucher:', error);
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...voucherItems];
    newItems[index][field] = value;
    
    if (field === 'debit' && parseFloat(value) > 0) newItems[index]['credit'] = 0;
    if (field === 'credit' && parseFloat(value) > 0) newItems[index]['debit'] = 0;
    
    setVoucherItems(newItems);
  };

  const addItemRow = () => {
    setVoucherItems([...voucherItems, {
      id: `temp_${Date.now()}`,
      row_number: voucherItems.length + 1,
      account_id: '',
      debit: 0,
      credit: 0,
      description: '',
      tracking_number: '',
      tracking_date: '',
      quantity: 0
    }]);
  };

  const copyRowDescription = (index) => {
    if (index > 0) {
      const newItems = [...voucherItems];
      newItems[index].description = newItems[index - 1].description;
      setVoucherItems(newItems);
    }
  };

  const removeItemRow = (index) => {
    const newItems = [...voucherItems];
    newItems.splice(index, 1);
    setVoucherItems(newItems);
  };

  const balanceVoucher = (index) => {
    let totalD = 0;
    let totalC = 0;
    voucherItems.forEach((item, i) => {
      if (i !== index) {
        totalD += parseFloat(item.debit) || 0;
        totalC += parseFloat(item.credit) || 0;
      }
    });
    
    const diff = totalD - totalC;
    const newItems = [...voucherItems];
    
    if (diff > 0) {
      newItems[index].credit = diff;
      newItems[index].debit = 0;
    } else if (diff < 0) {
      newItems[index].debit = Math.abs(diff);
      newItems[index].credit = 0;
    } else {
      alert(t.alreadyBalanced);
      return;
    }
    setVoucherItems(newItems);
  };

  const formatNumber = (num) => {
    return Number(num || 0).toLocaleString();
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'draft': return t.statusDraft;
      case 'temporary': return t.statusTemp;
      case 'reviewed': return t.statusReviewed;
      case 'final': return t.statusFinal;
      default: return status;
    }
  };

  const totalPages = Math.ceil(totalRecords / pageSize);

  if (view === 'form' && currentVoucher) {
    const totalDebit = voucherItems.reduce((sum, item) => sum + (parseFloat(item.debit) || 0), 0);
    const totalCredit = voucherItems.reduce((sum, item) => sum + (parseFloat(item.credit) || 0), 0);
    const isBalanced = totalDebit === totalCredit;
    const isReadonly = currentVoucher.status === 'reviewed' || currentVoucher.status === 'final';

    return (
      <div className="w-full space-y-4 text-white" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="flex justify-between items-center mb-4 bg-white/5 p-4 rounded-lg backdrop-blur-md border border-white/10 shadow-xl">
          <h2 className="text-2xl font-bold">{currentVoucher.id ? t.edit : t.newVoucher}</h2>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleCloseForm}>{t.backToList}</Button>
            {!isReadonly && (
              <>
                <Button variant="warning" onClick={() => handleSaveVoucher('draft')}>{t.saveDraft}</Button>
                <Button variant="primary" onClick={() => handleSaveVoucher('temporary')}>{t.saveTemp}</Button>
              </>
            )}
          </div>
        </div>

        <Card className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6 bg-white/5 backdrop-blur-lg border border-white/10 shadow-2xl rounded-xl">
          <Select 
            label={t.branch} 
            value={currentVoucher.branch_id || ''} 
            onChange={(e) => setCurrentVoucher({...currentVoucher, branch_id: e.target.value})}
            disabled={isReadonly}
            options={branches.map(b => ({ value: b.id, label: b.title }))}
          />
          <Input 
            type="date" 
            label={t.date} 
            value={currentVoucher.voucher_date || ''} 
            onChange={(e) => setCurrentVoucher({...currentVoucher, voucher_date: e.target.value})}
            disabled={isReadonly}
          />
          <Select 
            label={t.type} 
            value={currentVoucher.voucher_type || 'general'} 
            onChange={(e) => setCurrentVoucher({...currentVoucher, voucher_type: e.target.value})}
            disabled={isReadonly}
            options={[
              { value: 'general', label: t.general },
              { value: 'opening', label: t.opening }
            ]}
          />
          <Input 
            label={t.subsidiaryNumber} 
            value={currentVoucher.subsidiary_number || ''} 
            onChange={(e) => setCurrentVoucher({...currentVoucher, subsidiary_number: e.target.value})}
            disabled={isReadonly}
          />
          <div className="md:col-span-4">
            <Input 
              label={t.description} 
              value={currentVoucher.description || ''} 
              onChange={(e) => setCurrentVoucher({...currentVoucher, description: e.target.value})}
              disabled={isReadonly}
              className="w-full"
            />
          </div>
        </Card>

        <Card className="p-0 bg-white/5 backdrop-blur-lg border border-white/10 shadow-2xl rounded-xl overflow-hidden">
          <div className="flex justify-between items-center p-4 bg-black/20 border-b border-white/10">
            <h3 className="text-xl font-bold">{t.items}</h3>
            {!isReadonly && <Button onClick={addItemRow} variant="primary">{t.addRow}</Button>}
          </div>
          
          <div className="overflow-x-auto w-full">
            <table className="w-full text-sm text-left rtl:text-right whitespace-nowrap">
              <thead className="text-xs uppercase bg-white/10 text-gray-200">
                <tr>
                  <th className="px-4 py-3">{t.row}</th>
                  <th className="px-4 py-3 min-w-[200px]">{t.account}</th>
                  <th className="px-4 py-3 min-w-[150px]">{t.debit}</th>
                  <th className="px-4 py-3 min-w-[150px]">{t.credit}</th>
                  <th className="px-4 py-3 min-w-[250px]">{t.description}</th>
                  <th className="px-4 py-3 min-w-[120px]">{t.trackingNumber}</th>
                  <th className="px-4 py-3 min-w-[150px]">{t.trackingDate}</th>
                  <th className="px-4 py-3">{t.quantity}</th>
                  <th className="px-4 py-3 text-center">{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {voucherItems.map((item, index) => (
                  <tr key={item.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 text-center font-bold">{index + 1}</td>
                    <td className="px-4 py-3">
                      <select 
                        className="w-full bg-black/30 border border-white/20 rounded p-2 text-white outline-none focus:border-blue-500 transition-colors"
                        value={item.account_id || ''}
                        onChange={(e) => handleItemChange(index, 'account_id', e.target.value)}
                        disabled={isReadonly}
                      >
                        <option value="">--</option>
                        {accounts.map(acc => (
                          <option key={acc.id} value={acc.id}>{acc.code} - {acc.title}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input 
                        type="number" 
                        className="w-full bg-black/30 border border-white/20 rounded p-2 text-white outline-none focus:border-blue-500 transition-colors"
                        value={item.debit}
                        onChange={(e) => handleItemChange(index, 'debit', e.target.value)}
                        disabled={isReadonly}
                        min="0"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input 
                        type="number" 
                        className="w-full bg-black/30 border border-white/20 rounded p-2 text-white outline-none focus:border-blue-500 transition-colors"
                        value={item.credit}
                        onChange={(e) => handleItemChange(index, 'credit', e.target.value)}
                        disabled={isReadonly}
                        min="0"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <input 
                          type="text" 
                          className="w-full bg-black/30 border border-white/20 rounded p-2 text-white outline-none focus:border-blue-500 transition-colors"
                          value={item.description || ''}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          disabled={isReadonly}
                          required
                        />
                        {!isReadonly && index > 0 && (
                          <Button variant="secondary" className="px-2" onClick={() => copyRowDescription(index)} title="Copy from above">
                            ↑
                          </Button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <input 
                        type="text" 
                        className="w-full bg-black/30 border border-white/20 rounded p-2 text-white outline-none focus:border-blue-500 transition-colors"
                        value={item.tracking_number || ''}
                        onChange={(e) => handleItemChange(index, 'tracking_number', e.target.value)}
                        disabled={isReadonly}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input 
                        type="date" 
                        className="w-full bg-black/30 border border-white/20 rounded p-2 text-white outline-none focus:border-blue-500 transition-colors"
                        value={item.tracking_date || ''}
                        onChange={(e) => handleItemChange(index, 'tracking_date', e.target.value)}
                        disabled={isReadonly}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input 
                        type="number" 
                        className="w-full bg-black/30 border border-white/20 rounded p-2 text-white outline-none focus:border-blue-500 transition-colors"
                        value={item.quantity || ''}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        disabled={isReadonly}
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      {!isReadonly && (
                        <div className="flex gap-2 justify-center">
                          <Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => balanceVoucher(index)} title={t.balance}>=</Button>
                          <Button variant="danger" className="px-2 py-1 text-xs" onClick={() => removeItemRow(index)}>X</Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="font-bold bg-black/40 border-t border-white/20">
                <tr>
                  <td colSpan="2" className="px-4 py-4 text-left rtl:text-right">{t.totalDebit} / {t.totalCredit}:</td>
                  <td className="px-4 py-4 text-blue-400 text-lg">{formatNumber(totalDebit)}</td>
                  <td className="px-4 py-4 text-blue-400 text-lg">{formatNumber(totalCredit)}</td>
                  <td colSpan="5" className={`px-4 py-4 text-lg ${isBalanced ? 'text-green-400' : 'text-red-400'}`}>
                    {isBalanced ? t.alreadyBalanced : `اختلاف: ${formatNumber(Math.abs(totalDebit - totalCredit))}`}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 text-white" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center bg-white/5 p-4 rounded-lg backdrop-blur-md border border-white/10 shadow-xl">
        <h2 className="text-2xl font-bold">{t.title}</h2>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => {}}>{t.numbering}</Button>
          <Button variant="primary" onClick={() => handleOpenForm()}>{t.newVoucher}</Button>
        </div>
      </div>

      <Card className="p-6 bg-white/5 backdrop-blur-lg border border-white/10 shadow-2xl rounded-xl">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4 cursor-pointer" onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <span className="text-blue-400">{showAdvancedSearch ? '▼' : '▶'}</span> {t.search}
            </h3>
          </div>
          
          {showAdvancedSearch && (
            <div className="p-4 bg-black/20 rounded-lg border border-white/5 mb-4 space-y-4">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                  <Select 
                    label={t.field}
                    value={currentFilter.field}
                    onChange={(e) => setCurrentFilter({...currentFilter, field: e.target.value})}
                    options={[
                      { value: 'voucher_number', label: t.voucherNumber },
                      { value: 'voucher_date', label: t.date },
                      { value: 'description', label: t.description }
                    ]}
                  />
                </div>
                <div className="flex-1 min-w-[150px]">
                  <Select 
                    label={t.operator}
                    value={currentFilter.operator}
                    onChange={(e) => setCurrentFilter({...currentFilter, operator: e.target.value})}
                    options={[
                      { value: 'eq', label: t.equals },
                      { value: 'ilike', label: t.contains },
                      { value: 'gt', label: t.greaterThan },
                      { value: 'lt', label: t.lessThan }
                    ]}
                  />
                </div>
                <div className="flex-[2] min-w-[200px]">
                  <Input 
                    label={t.value}
                    value={currentFilter.value}
                    onChange={(e) => setCurrentFilter({...currentFilter, value: e.target.value})}
                    onKeyPress={(e) => e.key === 'Enter' && addFilter()}
                  />
                </div>
                <Button onClick={addFilter} className="mb-1 px-8">{t.applyFilter}</Button>
              </div>

              {filters.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
                  {filters.map((f, i) => (
                    <span key={i} className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-sm flex items-center gap-2 border border-blue-500/30">
                      {f.field} {f.operator} {f.value}
                      <button onClick={() => removeFilter(i)} className="text-white hover:text-red-400 ml-1 font-bold">×</button>
                    </span>
                  ))}
                  <button onClick={() => setFilters([])} className="text-sm text-gray-400 hover:text-white underline">{t.clearFilters}</button>
                </div>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-300 text-lg">در حال پردازش...</div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border border-white/10 shadow-inner">
              <table className="w-full text-sm text-left rtl:text-right whitespace-nowrap">
                <thead className="text-xs uppercase bg-black/40 text-gray-300">
                  <tr>
                    <th className="px-4 py-4 cursor-pointer hover:text-white" onClick={() => handleSort('voucher_number')}>
                      {t.voucherNumber} {sortField === 'voucher_number' && (sortAsc ? '↑' : '↓')}
                    </th>
                    <th className="px-4 py-4 cursor-pointer hover:text-white" onClick={() => handleSort('voucher_date')}>
                      {t.date} {sortField === 'voucher_date' && (sortAsc ? '↑' : '↓')}
                    </th>
                    <th className="px-4 py-4">{t.type}</th>
                    <th className="px-4 py-4">{t.status}</th>
                    <th className="px-4 py-4 max-w-xs">{t.description}</th>
                    <th className="px-4 py-4">{t.totalDebit}</th>
                    <th className="px-4 py-4">{t.totalCredit}</th>
                    <th className="px-4 py-4 text-center">{t.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {vouchers.map((voucher) => (
                    <tr key={voucher.id} className="border-b border-white/5 hover:bg-white/10 transition-colors">
                      <td className="px-4 py-3 font-mono">{voucher.voucher_number || '-'}</td>
                      <td className="px-4 py-3 font-mono">{voucher.voucher_date}</td>
                      <td className="px-4 py-3">{voucher.voucher_type === 'opening' ? t.opening : t.general}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-md text-xs font-bold shadow-sm ${
                          voucher.status === 'final' ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 
                          voucher.status === 'reviewed' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                          voucher.status === 'temporary' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                          'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                        }`}>
                          {getStatusLabel(voucher.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 truncate max-w-xs" title={voucher.description}>{voucher.description}</td>
                      <td className="px-4 py-3 text-blue-300 font-mono">{formatNumber(voucher.total_debit)}</td>
                      <td className="px-4 py-3 text-blue-300 font-mono">{formatNumber(voucher.total_credit)}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex gap-2 justify-center">
                          <Button variant="secondary" className="px-3 py-1 text-xs" onClick={() => handleOpenForm(voucher)}>{t.edit}</Button>
                          <Button variant="danger" className="px-3 py-1 text-xs" onClick={() => handleDeleteClick(voucher)}>{t.delete}</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {vouchers.length === 0 && (
                    <tr>
                      <td colSpan="8" className="px-4 py-12 text-center text-gray-400 text-lg">{t.noData}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center mt-6 bg-black/20 p-3 rounded-lg border border-white/5">
              <div className="flex items-center gap-4">
                <span className="text-gray-400">{t.itemsCount}: <strong className="text-white">{totalRecords}</strong></span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">{t.rowsPerPage}:</span>
                  <select 
                    className="bg-black/40 border border-white/20 rounded p-1 text-white outline-none"
                    value={pageSize}
                    onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                  >
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" className="px-3 py-1" disabled={page === 1} onClick={() => setPage(page - 1)}>
                  {isRtl ? 'قبلی' : 'Prev'}
                </Button>
                <span className="text-gray-300 px-4">{t.page} {page} {t.of} {totalPages || 1}</span>
                <Button variant="secondary" className="px-3 py-1" disabled={page === totalPages || totalPages === 0} onClick={() => setPage(page + 1)}>
                  {isRtl ? 'بعدی' : 'Next'}
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      {isDeleting && (
        <Modal 
          isOpen={isDeleting} 
          onClose={() => setIsDeleting(false)}
          title={t.delete}
        >
          <div className="p-6 text-white bg-gray-900/90 rounded-b-lg">
            <p className="mb-8 text-lg">{t.confirmDelete}</p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" className="px-6" onClick={() => setIsDeleting(false)}>انصراف</Button>
              <Button variant="danger" className="px-6" onClick={confirmDelete}>حذف قطعی</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
/* Filename: financial/generalledger/Vouchers.js */
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Edit, Trash2, Plus, ArrowRight, ArrowLeft, 
  Save, FileText, CheckCircle, FileWarning, Search 
} from 'lucide-react';

const localTranslations = {
  en: {
    title: 'Journal Vouchers',
    subtitle: 'Manage accounting vouchers and documents',
    newVoucher: 'New Voucher',
    search: 'Advanced Search',
    voucherNumber: 'Voucher No.',
    date: 'Date',
    type: 'Type',
    status: 'Status',
    description: 'Description',
    totalDebit: 'Total Debit',
    totalCredit: 'Total Credit',
    actions: 'Actions',
    edit: 'Edit',
    delete: 'Delete',
    branch: 'Branch',
    subsidiaryNumber: 'Subsidiary No.',
    items: 'Voucher Items',
    addRow: 'Add Item',
    row: 'Row',
    account: 'Account',
    debit: 'Debit',
    credit: 'Credit',
    balance: 'Balance',
    saveDraft: 'Save Draft',
    saveTemp: 'Save Temporary',
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
    unbalancedError: 'Voucher is not balanced. Can only save as draft.',
    alreadyBalanced: 'Voucher is already balanced.',
    cannotDelete: 'Reviewed or Final vouchers cannot be deleted.',
    reqFields: 'Description and Account are required for all items.',
    emptyData: 'No records found.'
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
    subsidiaryNumber: 'شماره فرعی',
    items: 'اقلام سند',
    addRow: 'ردیف جدید',
    row: 'ردیف',
    account: 'معین',
    debit: 'بدهکار',
    credit: 'بستانکار',
    balance: 'موازنه',
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
    unbalancedError: 'سند بالانس نیست و فقط به عنوان یادداشت قابل ذخیره است.',
    alreadyBalanced: 'سند بالانس است.',
    cannotDelete: 'اسناد بررسی شده یا قطعی قابل حذف نیستند.',
    reqFields: 'شرح و حساب معین برای تمامی اقلام اجباری است.',
    emptyData: 'اطلاعاتی یافت نشد.'
  }
};

const Vouchers = ({ language = 'fa' }) => {
  const t = localTranslations[language];
  const isRtl = language === 'fa';
  
  const UI = window.UI || {};
  const { Button, InputField, SelectField, DataGrid, FilterSection, Modal, Badge, Callout } = UI;
  const supabase = window.supabase;

  // Views & UI State
  const [view, setView] = useState('list'); // 'list' or 'form'
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [voucherToDelete, setVoucherToDelete] = useState(null);

  // Data State
  const [vouchers, setVouchers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [branches, setBranches] = useState([]);
  
  // List State
  const [searchParams, setSearchParams] = useState({ voucher_number: '', description: '' });
  const [selectedIds, setSelectedIds] = useState([]);

  // Form State
  const [currentVoucher, setCurrentVoucher] = useState(null);
  const [voucherItems, setVoucherItems] = useState([]);

  useEffect(() => {
    fetchLookups();
  }, []);

  useEffect(() => {
    if (view === 'list') {
      fetchVouchers();
    }
  }, [view]);

  const fetchLookups = async () => {
    if (!supabase) return;
    try {
      const [accRes, brRes] = await Promise.all([
        supabase.schema('gl').from('accounts').select('id, code, title').eq('is_active', true).order('code'),
        supabase.schema('gen').from('branches').select('id, code, title').eq('is_active', true)
      ]);
      if (accRes.data) setAccounts(accRes.data);
      if (brRes.data) setBranches(brRes.data);
    } catch (error) {
      console.error('Error fetching lookups:', error);
    }
  };

  const fetchVouchers = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.schema('gl')
        .from('vouchers')
        .select('*')
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

  const handleClearSearch = () => {
    setSearchParams({ voucher_number: '', description: '' });
  };

  const filteredVouchers = useMemo(() => {
    return vouchers.filter(v => {
      const matchNo = !searchParams.voucher_number || String(v.voucher_number).includes(searchParams.voucher_number);
      const matchDesc = !searchParams.description || (v.description && v.description.includes(searchParams.description));
      return matchNo && matchDesc;
    });
  }, [vouchers, searchParams]);

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
    if (!supabase) return;
    
    // Validation
    const missingReqs = voucherItems.some(item => !item.description || !item.account_id);
    if (missingReqs) {
      alert(t.reqFields);
      return;
    }

    const totalDebit = voucherItems.reduce((sum, item) => sum + (parseFloat(item.debit) || 0), 0);
    const totalCredit = voucherItems.reduce((sum, item) => sum + (parseFloat(item.credit) || 0), 0);
    
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
      alert('Error saving voucher: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const promptDelete = (voucher) => {
    if (voucher.status === 'reviewed' || voucher.status === 'final') {
      alert(t.cannotDelete);
      return;
    }
    setVoucherToDelete(voucher);
    setShowDeleteModal(true);
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

  // Item Table Methods
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

  const formatNumber = (num) => Number(num || 0).toLocaleString();

  const getStatusBadge = (status) => {
    switch(status) {
      case 'draft': return <Badge variant="neutral">{t.statusDraft}</Badge>;
      case 'temporary': return <Badge variant="warning">{t.statusTemp}</Badge>;
      case 'reviewed': return <Badge variant="info">{t.statusReviewed}</Badge>;
      case 'final': return <Badge variant="success">{t.statusFinal}</Badge>;
      default: return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const columns = [
    { field: 'voucher_number', header: t.voucherNumber, width: 'w-24', sortable: true },
    { field: 'voucher_date', header: t.date, width: 'w-24', sortable: true },
    { field: 'voucher_type', header: t.type, width: 'w-32', render: (row) => row.voucher_type === 'opening' ? t.opening : t.general },
    { field: 'status', header: t.status, width: 'w-32', render: (row) => getStatusBadge(row.status) },
    { field: 'description', header: t.description, width: 'w-64' },
    { field: 'total_debit', header: t.totalDebit, width: 'w-32', render: (row) => formatNumber(row.total_debit) },
    { field: 'total_credit', header: t.totalCredit, width: 'w-32', render: (row) => formatNumber(row.total_credit) }
  ];

  if (view === 'form' && currentVoucher) {
    const totalDebit = voucherItems.reduce((sum, item) => sum + (parseFloat(item.debit) || 0), 0);
    const totalCredit = voucherItems.reduce((sum, item) => sum + (parseFloat(item.credit) || 0), 0);
    const isBalanced = totalDebit === totalCredit;
    const isReadonly = currentVoucher.status === 'reviewed' || currentVoucher.status === 'final';

    return (
      <div className={`h-full flex flex-col p-4 md:p-6 bg-slate-50/50 ${isRtl ? 'font-vazir' : 'font-sans'}`}>
        {/* Header Actions */}
        <div className="mb-4 flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200 shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={handleCloseForm} icon={isRtl ? ArrowRight : ArrowLeft}>
              {t.backToList}
            </Button>
            <div className="h-6 w-px bg-slate-300 mx-2"></div>
            <h2 className="text-lg font-bold text-slate-800">
              {currentVoucher.id ? t.edit : t.newVoucher}
              {currentVoucher.voucher_number && <span className="text-indigo-600 mx-2">#{currentVoucher.voucher_number}</span>}
            </h2>
            <div className="mx-2">{getStatusBadge(currentVoucher.status)}</div>
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
          {/* Header Info */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm shrink-0">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <SelectField 
                label={t.branch} 
                value={currentVoucher.branch_id || ''} 
                onChange={(e) => setCurrentVoucher({...currentVoucher, branch_id: e.target.value})}
                disabled={isReadonly}
                isRtl={isRtl}
              >
                <option value="">--</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
              </SelectField>
              <InputField 
                type="date" 
                label={t.date} 
                value={currentVoucher.voucher_date || ''} 
                onChange={(e) => setCurrentVoucher({...currentVoucher, voucher_date: e.target.value})}
                disabled={isReadonly}
                isRtl={isRtl}
              />
              <SelectField 
                label={t.type} 
                value={currentVoucher.voucher_type || 'general'} 
                onChange={(e) => setCurrentVoucher({...currentVoucher, voucher_type: e.target.value})}
                disabled={isReadonly}
                isRtl={isRtl}
              >
                <option value="general">{t.general}</option>
                <option value="opening">{t.opening}</option>
              </SelectField>
              <InputField 
                label={t.subsidiaryNumber} 
                value={currentVoucher.subsidiary_number || ''} 
                onChange={(e) => setCurrentVoucher({...currentVoucher, subsidiary_number: e.target.value})}
                disabled={isReadonly}
                isRtl={isRtl}
              />
              <div className="md:col-span-4">
                <InputField 
                  label={t.description} 
                  value={currentVoucher.description || ''} 
                  onChange={(e) => setCurrentVoucher({...currentVoucher, description: e.target.value})}
                  disabled={isReadonly}
                  isRtl={isRtl}
                />
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[300px]">
            <div className="flex justify-between items-center p-3 bg-slate-50 border-b border-slate-200 shrink-0">
              <h3 className="text-sm font-bold text-slate-800">{t.items}</h3>
              {!isReadonly && <Button variant="primary" size="sm" onClick={addItemRow} icon={Plus}>{t.addRow}</Button>}
            </div>
            
            <div className="flex-1 overflow-x-auto custom-scrollbar">
              <table className="w-full text-[12px] text-left rtl:text-right border-collapse">
                <thead className="bg-slate-100 text-slate-700 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-3 py-2 text-center w-12 border-b border-slate-200">{t.row}</th>
                    <th className="px-3 py-2 min-w-[200px] border-b border-slate-200">{t.account}</th>
                    <th className="px-3 py-2 min-w-[120px] border-b border-slate-200">{t.debit}</th>
                    <th className="px-3 py-2 min-w-[120px] border-b border-slate-200">{t.credit}</th>
                    <th className="px-3 py-2 min-w-[250px] border-b border-slate-200">{t.description}</th>
                    <th className="px-3 py-2 min-w-[120px] border-b border-slate-200">{t.trackingNumber}</th>
                    <th className="px-3 py-2 min-w-[120px] border-b border-slate-200">{t.trackingDate}</th>
                    <th className="px-3 py-2 w-24 border-b border-slate-200">{t.quantity}</th>
                    <th className="px-3 py-2 text-center w-24 border-b border-slate-200 sticky left-0 bg-slate-100 shadow-[-2px_0_5_rgba(0,0,0,0.05)]">{t.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {voucherItems.map((item, index) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-3 py-1.5 text-center font-bold text-slate-500">{index + 1}</td>
                      <td className="px-3 py-1.5">
                        <select 
                          className="w-full bg-slate-50 border border-slate-200 rounded h-8 px-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-[12px] text-slate-800"
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
                      <td className="px-3 py-1.5">
                        <input 
                          type="number" 
                          className="w-full bg-slate-50 border border-slate-200 rounded h-8 px-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-[12px] text-slate-800 dir-ltr"
                          value={item.debit}
                          onChange={(e) => handleItemChange(index, 'debit', e.target.value)}
                          disabled={isReadonly}
                          min="0"
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input 
                          type="number" 
                          className="w-full bg-slate-50 border border-slate-200 rounded h-8 px-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-[12px] text-slate-800 dir-ltr"
                          value={item.credit}
                          onChange={(e) => handleItemChange(index, 'credit', e.target.value)}
                          disabled={isReadonly}
                          min="0"
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <div className="flex gap-1 relative">
                          <input 
                            type="text" 
                            className="w-full bg-slate-50 border border-slate-200 rounded h-8 px-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-[12px] text-slate-800"
                            value={item.description || ''}
                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            disabled={isReadonly}
                          />
                          {!isReadonly && index > 0 && (
                            <button 
                              className="bg-slate-200 hover:bg-slate-300 text-slate-600 px-2 rounded transition-colors h-8 text-[10px] absolute left-0" 
                              onClick={() => copyRowDescription(index)} 
                              title="Copy from above"
                            >
                              ↑
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-1.5">
                        <input 
                          type="text" 
                          className="w-full bg-slate-50 border border-slate-200 rounded h-8 px-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-[12px] text-slate-800"
                          value={item.tracking_number || ''}
                          onChange={(e) => handleItemChange(index, 'tracking_number', e.target.value)}
                          disabled={isReadonly}
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input 
                          type="date" 
                          className="w-full bg-slate-50 border border-slate-200 rounded h-8 px-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-[12px] text-slate-800 dir-ltr"
                          value={item.tracking_date || ''}
                          onChange={(e) => handleItemChange(index, 'tracking_date', e.target.value)}
                          disabled={isReadonly}
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input 
                          type="number" 
                          className="w-full bg-slate-50 border border-slate-200 rounded h-8 px-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-[12px] text-slate-800 dir-ltr"
                          value={item.quantity || ''}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          disabled={isReadonly}
                        />
                      </td>
                      <td className="px-3 py-1.5 text-center sticky left-0 bg-white group-hover:bg-slate-50 border-l border-slate-100 z-10">
                        {!isReadonly && (
                          <div className="flex gap-1 justify-center">
                            <button className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 h-7 px-2 rounded text-[11px] font-bold transition-colors" onClick={() => balanceVoucher(index)} title={t.balance}>=</button>
                            <button className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 h-7 px-2 rounded text-[11px] font-bold transition-colors" onClick={() => removeItemRow(index)}>X</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-slate-50 border-t border-slate-200 p-3 shrink-0">
              <div className="flex items-center gap-6 font-mono text-[13px] font-bold">
                <div className="flex items-center gap-2">
                   <span className="text-slate-500 font-sans">{t.totalDebit}:</span>
                   <span className="text-indigo-700">{formatNumber(totalDebit)}</span>
                </div>
                <div className="flex items-center gap-2">
                   <span className="text-slate-500 font-sans">{t.totalCredit}:</span>
                   <span className="text-indigo-700">{formatNumber(totalCredit)}</span>
                </div>
                <div className="h-4 w-px bg-slate-300"></div>
                <div className={`flex items-center gap-2 ${isBalanced ? 'text-emerald-600' : 'text-red-500'}`}>
                   {isBalanced ? <CheckCircle size={16}/> : <FileWarning size={16}/>}
                   <span>{isBalanced ? t.alreadyBalanced : `${formatNumber(Math.abs(totalDebit - totalCredit))}`}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- List View ---
  return (
    <div className={`h-full flex flex-col p-4 md:p-6 bg-slate-50/50 ${isRtl ? 'font-vazir' : 'font-sans'}`}>
      <div className="mb-6 flex items-center justify-between shrink-0">
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

      <FilterSection onSearch={() => {}} onClear={handleClearSearch} isRtl={isRtl} title={t.search}>
        <InputField label={t.voucherNumber} value={searchParams.voucher_number} onChange={e => setSearchParams({...searchParams, voucher_number: e.target.value})} isRtl={isRtl} className="dir-ltr" />
        <InputField label={t.description} value={searchParams.description} onChange={e => setSearchParams({...searchParams, description: e.target.value})} isRtl={isRtl} />
      </FilterSection>

      <div className="flex-1 min-h-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <DataGrid 
          columns={columns} 
          data={filteredVouchers} 
          selectedIds={selectedIds}
          onSelectRow={(id, checked) => setSelectedIds(prev => checked ? [...prev, id] : prev.filter(i => i !== id))}
          onSelectAll={(checked) => setSelectedIds(checked ? filteredVouchers.map(i => i.id) : [])}
          onCreate={() => handleOpenForm()} 
          onDelete={(ids) => promptDelete(filteredVouchers.find(v => v.id === ids[0]))} 
          onDoubleClick={(row) => handleOpenForm(row)}
          isRtl={isRtl}
          isLoading={loading}
          actions={(row) => (
            <>
              <Button variant="ghost" size="iconSm" icon={Edit} onClick={() => handleOpenForm(row)} title={t.edit} />
              <Button variant="ghost" size="iconSm" icon={Trash2} onClick={() => promptDelete(row)} title={t.delete} className="text-red-500 hover:text-red-700 hover:bg-red-50" />
            </>
          )}
        />
      </div>

      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title={t.delete}
        footer={<><Button variant="ghost" onClick={() => setShowDeleteModal(false)}>{t.backToList}</Button><Button variant="danger" onClick={confirmDelete}>{t.delete}</Button></>}>
        <div className="p-4">
          <p className="text-slate-700 font-medium">{t.confirmDelete}</p>
        </div>
      </Modal>

    </div>
  );
};

window.Vouchers = Vouchers;
export default Vouchers;
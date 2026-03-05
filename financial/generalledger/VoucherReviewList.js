/* Filename: financial/generalledger/VoucherReviewList.js */
import React, { useState, useEffect } from 'react';
import { Edit, Trash2, CheckCircle, FileWarning, Search, Printer, CheckSquare, Eye, ListOrdered, Paperclip } from 'lucide-react';

const VoucherReviewList = ({ language, t, lookups, contextVals, setContextVals, perms, onOpenForm, onListUpdate }) => {
  const isRtl = language === 'fa';
  const UI = window.UI || {};
  const { Button, InputField, SelectField, DataGrid, FilterSection, Modal } = UI;
  const supabase = window.supabase;

  const [loading, setLoading] = useState(false);
  const [vouchers, setVouchers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchParams, setSearchParams] = useState({ voucher_number: '', description: '', from_date: '', to_date: '', status: '', voucher_type: '', account_id: '' });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [voucherToDelete, setVoucherToDelete] = useState(null);
  
  const [showSortModal, setShowSortModal] = useState(false);
  const [sortTab, setSortTab] = useState('bulk');
  const [sortParams, setSortParams] = useState({ fromDate: '', toDate: '', singleVoucherId: null, singleVoucherDate: '', singleVoucherNo: '', targetDailyNumber: '' });

  const [voucherToPrint, setVoucherToPrint] = useState(null);
  const [voucherForAttachments, setVoucherForAttachments] = useState(null);

  useEffect(() => {
    if (contextVals.fiscal_year_id && contextVals.ledger_id) {
      fetchVouchers(searchParams);
    } else {
      setVouchers([]);
      if (onListUpdate) onListUpdate([]);
    }
  }, [contextVals]);

  const fetchVouchers = async (paramsObj = searchParams) => {
    if (!supabase || !contextVals.fiscal_year_id || !contextVals.ledger_id) return;

    setLoading(true);
    try {
      let query = supabase.schema('gl').from('vouchers')
        .select('*')
        .eq('fiscal_period_id', contextVals.fiscal_year_id)
        .eq('ledger_id', contextVals.ledger_id)
        .in('status', ['temporary', 'reviewed'])
        .order('voucher_date', { ascending: false })
        .order('voucher_number', { ascending: false });

      if (!window.IS_ADMIN) {
        if (perms.allowed_branches.length > 0) query = query.in('branch_id', perms.allowed_branches);
        
        // اعمال دسترسی‌های انواع سند (اسناد کاربری همیشه مجاز هستند)
        if (perms.allowed_doc_types && perms.allowed_doc_types.length > 0) {
            const userTypes = lookups.docTypes.filter(d => d.type === 'user').map(d => d.code);
            const combinedAllowed = [...perms.allowed_doc_types, ...userTypes];
            query = query.in('voucher_type', combinedAllowed);
        }
      }

      if (paramsObj.voucher_number) query = query.eq('voucher_number', paramsObj.voucher_number);
      if (paramsObj.from_date) query = query.gte('voucher_date', paramsObj.from_date);
      if (paramsObj.to_date) query = query.lte('voucher_date', paramsObj.to_date);
      if (paramsObj.status) query = query.eq('status', paramsObj.status);
      if (paramsObj.voucher_type) query = query.eq('voucher_type', paramsObj.voucher_type);
      if (paramsObj.description) query = query.ilike('description', `%${paramsObj.description}%`);

      if (paramsObj.account_id) {
          const { data: viData } = await supabase.schema('gl').from('voucher_items').select('voucher_id').eq('account_id', paramsObj.account_id);
          if (viData && viData.length > 0) {
              const vIds = viData.map(v => v.voucher_id);
              query = query.in('id', vIds);
          } else {
              setVouchers([]);
              if (onListUpdate) onListUpdate([]);
              setLoading(false);
              return;
          }
      }

      const { data, error } = await query;
      if (error) throw error;
      setVouchers(data || []);
      if (onListUpdate) onListUpdate(data || []);
    } catch (error) {
      console.error('Error fetching vouchers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = () => {
    const cleared = { voucher_number: '', description: '', from_date: '', to_date: '', status: '', voucher_type: '', account_id: '' };
    setSearchParams(cleared);
    fetchVouchers(cleared);
  };

  const handleBulkStatus = async (newStatus) => {
    if (selectedIds.length === 0 || !perms.actions.includes('edit')) return;
    setLoading(true);
    try {
        const { data: authData } = await supabase.auth.getUser();
        const currentUserId = authData?.user?.id || null;
        let updatePayload = { status: newStatus };
        if (newStatus === 'reviewed') {
            updatePayload.reviewed_by = currentUserId;
        } else {
            updatePayload.reviewed_by = null;
        }
        const { error } = await supabase.schema('gl').from('vouchers').update(updatePayload).in('id', selectedIds);
        if (error) throw error;
        setSelectedIds([]);
        fetchVouchers();
    } catch (error) {
        console.error('Error updating status:', error);
    } finally {
        setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!voucherToDelete || !supabase || !perms.actions.includes('delete')) return;
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
    if (voucher.status === 'reviewed' || !perms.actions.includes('delete')) return;
    setVoucherToDelete(voucher);
    setShowDeleteModal(true);
  };

  const openBulkSort = () => {
      setSortTab('bulk');
      setSortParams({ ...sortParams, fromDate: '', toDate: '' });
      setShowSortModal(true);
  };

  const openSingleSort = (voucher) => {
      setSortTab('single');
      setSortParams({ 
          ...sortParams, 
          singleVoucherId: voucher.id, 
          singleVoucherDate: voucher.voucher_date,
          singleVoucherNo: voucher.voucher_number || voucher.id.slice(0,8),
          targetDailyNumber: voucher.daily_number 
      });
      setShowSortModal(true);
  };

  const handleBulkSort = async () => {
      if (!sortParams.fromDate || !sortParams.toDate) return alert(t.reqFields);
      setLoading(true);
      try {
          const { data, error } = await supabase.schema('gl').from('vouchers')
              .select('id, voucher_date, daily_number, created_at')
              .eq('ledger_id', contextVals.ledger_id)
              .eq('fiscal_period_id', contextVals.fiscal_year_id)
              .gte('voucher_date', sortParams.fromDate)
              .lte('voucher_date', sortParams.toDate)
              .order('voucher_date', { ascending: true })
              .order('daily_number', { ascending: true })
              .order('created_at', { ascending: true });

          if (error) throw error;

          const byDate = {};
          data.forEach(v => {
              if (!byDate[v.voucher_date]) byDate[v.voucher_date] = [];
              byDate[v.voucher_date].push(v);
          });

          const updates = [];
          for (const date in byDate) {
              byDate[date].forEach((v, idx) => {
                  const newDaily = idx + 1;
                  if (v.daily_number !== newDaily) updates.push({ id: v.id, daily_number: newDaily });
              });
          }

          const batchSize = 50;
          for (let i = 0; i < updates.length; i += batchSize) {
              const batch = updates.slice(i, i + batchSize);
              await Promise.all(batch.map(u => supabase.schema('gl').from('vouchers').update({ daily_number: u.daily_number }).eq('id', u.id)));
          }

          alert(t.sortSuccess);
          setShowSortModal(false);
          fetchVouchers();
      } catch (err) {
          console.error(err);
          alert(t.sortError);
      } finally {
          setLoading(false);
      }
  };

  const handleSingleSort = async () => {
      if (!sortParams.singleVoucherId || !sortParams.targetDailyNumber) return alert(t.reqFields);
      
      setLoading(true);
      try {
          const { data, error } = await supabase.schema('gl').from('vouchers')
              .select('id, voucher_date, daily_number, created_at')
              .eq('ledger_id', contextVals.ledger_id)
              .eq('fiscal_period_id', contextVals.fiscal_year_id)
              .eq('voucher_date', sortParams.singleVoucherDate)
              .order('daily_number', { ascending: true })
              .order('created_at', { ascending: true });
          
          if (error) throw error;

          let arr = data.filter(v => v.id !== sortParams.singleVoucherId);
          const insertIndex = Math.max(0, parseInt(sortParams.targetDailyNumber, 10) - 1);
          
          arr.splice(insertIndex, 0, { id: sortParams.singleVoucherId, daily_number: parseInt(sortParams.targetDailyNumber, 10), voucher_date: sortParams.singleVoucherDate });

          const updates = [];
          arr.forEach((v, idx) => {
              const newDaily = idx + 1;
              if (v.daily_number !== newDaily) updates.push({ id: v.id, daily_number: newDaily });
          });

          const batchSize = 50;
          for (let i = 0; i < updates.length; i += batchSize) {
              const batch = updates.slice(i, i + batchSize);
              await Promise.all(batch.map(u => supabase.schema('gl').from('vouchers').update({ daily_number: u.daily_number }).eq('id', u.id)));
          }

          alert(t.sortSuccess);
          setShowSortModal(false);
          fetchVouchers();
      } catch (err) {
          console.error(err);
          alert(t.sortError);
      } finally {
          setLoading(false);
      }
  };

  const formatNum = (num) => {
    if (num === null || num === undefined || num === '') return '';
    const parsed = Number(num);
    return isNaN(parsed) ? '' : parsed.toLocaleString('en-US', { maximumFractionDigits: 6 });
  };

  const getStatusBadge = (status) => {
    const config = {
        'temporary': { label: t.statusTemporary, bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
        'reviewed': { label: t.statusReviewed, bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' }
    };
    const c = config[status] || { label: status, bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };
    return <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${c.bg} ${c.text} ${c.border}`}>{c.label}</span>;
  };

  const columns = [
    { field: 'voucher_number', header: t.voucherNumber, width: 'w-24', sortable: true },
    { field: 'voucher_date', header: t.date, width: 'w-24', sortable: true },
    { field: 'status', header: t.status, width: 'w-32', render: (row) => getStatusBadge(row.status) },
    { field: 'voucher_type', header: t.type, width: 'w-32', render: (row) => lookups.docTypes.find(d => d.code === row.voucher_type)?.title || row.voucher_type },
    { field: 'branch_id', header: t.branch, width: 'w-32', render: (row) => lookups.branches.find(b => b.id === row.branch_id)?.title || '-' },
    { field: 'description', header: t.description, width: 'w-64' },
    { field: 'total_debit', header: t.amount, width: 'w-32', render: (row) => formatNum(row.total_debit) },
    { field: 'currency', header: t.currency, width: 'w-24', render: (row) => {
        const ledger = lookups.ledgers.find(l => String(l.id) === String(row.ledger_id));
        const currCode = ledger?.currency;
        return lookups.currencies.find(c => c.code === currCode)?.title || currCode || '-';
    }},
    { field: 'daily_number', header: t.dailyNumber, width: 'w-24' },
    { field: 'cross_reference', header: t.crossReference, width: 'w-24' }
  ];

  const selectedVouchers = vouchers.filter(v => selectedIds.includes(v.id));
  const allTemp = selectedVouchers.length > 0 && selectedVouchers.every(v => v.status === 'temporary');
  const allReviewed = selectedVouchers.length > 0 && selectedVouchers.every(v => v.status === 'reviewed');

  return (
    <div className={`h-full flex flex-col p-4 md:p-6 bg-slate-50/50`}>
      {/* فیلتر سراسری از اینجا حذف شده است */}

      <div className="mb-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200">
            <CheckSquare size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800">{t.title}</h1>
            <p className="text-xs text-slate-500 font-medium mt-1">{t.subtitle}</p>
          </div>
        </div>
        {perms.actions.includes('sort') && (
            <Button variant="outline" icon={ListOrdered} onClick={openBulkSort}>{t.sortVouchers}</Button>
        )}
      </div>

      <FilterSection onSearch={() => fetchVouchers(searchParams)} onClear={handleClearSearch} isRtl={isRtl} title={t.search} defaultOpen={false}>
        <InputField label={t.voucherNumber} value={searchParams.voucher_number} onChange={e => setSearchParams({...searchParams, voucher_number: e.target.value})} isRtl={isRtl} dir="ltr" />
        <SelectField label={t.status} value={searchParams.status} onChange={e => setSearchParams({...searchParams, status: e.target.value})} isRtl={isRtl}>
           <option value="">{t.all}</option>
           <option value="temporary">{t.statusTemporary}</option>
           <option value="reviewed">{t.statusReviewed}</option>
        </SelectField>
        <InputField type="date" label={t.fromDate} value={searchParams.from_date} onChange={e => setSearchParams({...searchParams, from_date: e.target.value})} isRtl={isRtl} />
        <InputField type="date" label={t.toDate} value={searchParams.to_date} onChange={e => setSearchParams({...searchParams, to_date: e.target.value})} isRtl={isRtl} />
        
        <SelectField label={t.type} value={searchParams.voucher_type} onChange={e => setSearchParams({...searchParams, voucher_type: e.target.value})} isRtl={isRtl}>
           <option value="">{t.all}</option>
           {lookups.docTypes.map(d => <option key={d.id} value={d.code}>{d.title}</option>)}
        </SelectField>
        <InputField label={t.description} value={searchParams.description} onChange={e => setSearchParams({...searchParams, description: e.target.value})} isRtl={isRtl} />
      </FilterSection>

      <div className="flex-1 min-h-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-4">
        <DataGrid 
          columns={columns} 
          data={vouchers} 
          selectedIds={selectedIds} 
          onSelectRow={(id, c) => setSelectedIds(c ? [...selectedIds, id] : selectedIds.filter(i => i !== id))} 
          onSelectAll={(c) => setSelectedIds(c ? vouchers.map(v => v.id) : [])} 
          onDelete={(ids) => { 
              if (!perms.actions.includes('delete')) return;
              const selectedVouchers = vouchers.filter(v => ids.includes(v.id));
              if (selectedVouchers.some(v => v.status === 'reviewed')) {
                  alert(isRtl ? 'اسناد بررسی شده قابل حذف نیستند.' : 'Reviewed vouchers cannot be deleted.');
                  return;
              }
              setVoucherToDelete(selectedVouchers[0]); 
              setShowDeleteModal(true); 
          }} 
          onDoubleClick={(r) => onOpenForm(r.id, vouchers)} 
          isRtl={isRtl} 
          isLoading={loading} 
          bulkActions={
             perms.actions.includes('edit') && (
               <>
                 {allTemp && <Button variant="secondary" size="sm" onClick={() => handleBulkStatus('reviewed')} icon={CheckCircle}>{t.makeReviewed}</Button>}
                 {allReviewed && <Button variant="secondary" size="sm" onClick={() => handleBulkStatus('temporary')} icon={CheckSquare}>{t.makeTemporary}</Button>}
               </>
             )
          }
          actions={(r) => (
            <div className="flex gap-1 justify-center">
              {perms.actions.includes('sort') && <Button variant="ghost" size="iconSm" icon={ListOrdered} onClick={() => openSingleSort(r)} title={t.singleSort} className="text-slate-500 hover:text-indigo-600 hover:bg-indigo-50" />}
              {perms.actions.includes('print') && <Button variant="ghost" size="iconSm" icon={Printer} onClick={() => setVoucherToPrint(r)} title={t.print} className="text-slate-500 hover:text-indigo-600 hover:bg-indigo-50" />}
              {perms.actions.includes('attach') && <Button variant="ghost" size="iconSm" icon={Paperclip} onClick={() => setVoucherForAttachments(r)} title={t.attachments} className="text-slate-500 hover:text-indigo-600 hover:bg-indigo-50" />}
              <Button 
                variant="ghost" 
                size="iconSm" 
                icon={(!perms.actions.includes('edit') || r.status === 'reviewed') ? Eye : Edit} 
                onClick={() => onOpenForm(r.id, vouchers)} 
                title={(!perms.actions.includes('edit') || r.status === 'reviewed') ? t.view : t.edit} 
              />
              {perms.actions.includes('delete') && r.status !== 'reviewed' && (
                <Button variant="ghost" size="iconSm" icon={Trash2} className="text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => promptDelete(r)} title={t.delete} />
              )}
            </div>
          )}
        />
      </div>

      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title={t.delete} footer={<><Button variant="ghost" onClick={() => setShowDeleteModal(false)}>{t.backToList}</Button><Button variant="danger" onClick={confirmDelete}>{t.delete}</Button></>}>
        <div className="p-4"><p className="text-slate-700 font-medium">{t.confirmDelete}</p></div>
      </Modal>

      {perms.actions.includes('print') && (
          <Modal isOpen={!!voucherToPrint} onClose={() => setVoucherToPrint(null)} title={t.printVoucher || 'چاپ سند حسابداری'} size="lg">
            {voucherToPrint && window.VoucherPrint ? (
                <window.VoucherPrint voucherId={voucherToPrint.id} onClose={() => setVoucherToPrint(null)} />
            ) : (
                <div className="p-10 flex flex-col items-center justify-center text-slate-500 gap-4">
                    <FileWarning size={48} className="text-amber-400" />
                    <p>{isRtl ? 'کامپوننت چاپ یافت نشد.' : 'Print component not found.'}</p>
                </div>
            )}
          </Modal>
      )}

      {perms.actions.includes('attach') && (
          <Modal isOpen={!!voucherForAttachments} onClose={() => setVoucherForAttachments(null)} title={t.attachments || 'ضمائم'} size="md">
            {voucherForAttachments && window.VoucherAttachments ? (
                <window.VoucherAttachments voucherId={voucherForAttachments.id} onClose={() => setVoucherForAttachments(null)} />
            ) : (
                <div className="p-10 flex flex-col items-center justify-center text-slate-500 gap-4">
                    <FileWarning size={48} className="text-amber-400" />
                    <p>{isRtl ? 'کامپوننت ضمائم یافت نشد.' : 'Attachments component not found.'}</p>
                </div>
            )}
          </Modal>
      )}

      {perms.actions.includes('sort') && (
          <Modal isOpen={showSortModal} onClose={() => setShowSortModal(false)} title={t.sortVouchers} size="md">
            <div className="p-4 flex flex-col gap-4">
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button onClick={() => setSortTab('bulk')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${sortTab === 'bulk' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>{t.bulkSort}</button>
                    <button onClick={() => setSortTab('single')} disabled={!sortParams.singleVoucherId} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${sortTab === 'single' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'} ${!sortParams.singleVoucherId ? 'opacity-50 cursor-not-allowed' : ''}`}>{t.singleSort}</button>
                </div>
                
                {sortTab === 'bulk' ? (
                    <div className="flex flex-col gap-4">
                        <p className="text-xs text-slate-500">{t.bulkSortDesc}</p>
                        <InputField type="date" label={t.fromDate} value={sortParams.fromDate} onChange={e => setSortParams({...sortParams, fromDate: e.target.value})} isRtl={isRtl} />
                        <InputField type="date" label={t.toDate} value={sortParams.toDate} onChange={e => setSortParams({...sortParams, toDate: e.target.value})} isRtl={isRtl} />
                        <Button variant="primary" className="w-full justify-center mt-2" onClick={handleBulkSort} disabled={loading}>{t.applySort}</Button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        <p className="text-xs text-slate-500">{t.singleSortDesc}</p>
                        <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100 flex flex-col gap-1">
                            <div className="text-xs font-bold text-indigo-800">{t.voucherNumber}: <span className="dir-ltr">{sortParams.singleVoucherNo}</span></div>
                            <div className="text-xs text-indigo-600">{t.date}: <span className="dir-ltr">{sortParams.singleVoucherDate}</span></div>
                        </div>
                        <InputField type="number" label={t.targetDailyNumber} value={sortParams.targetDailyNumber} onChange={e => setSortParams({...sortParams, targetDailyNumber: e.target.value})} isRtl={isRtl} dir="ltr" />
                        <Button variant="primary" className="w-full justify-center mt-2" onClick={handleSingleSort} disabled={loading}>{t.applySort}</Button>
                    </div>
                )}
            </div>
          </Modal>
      )}
    </div>
  );
};

window.VoucherReviewList = VoucherReviewList;
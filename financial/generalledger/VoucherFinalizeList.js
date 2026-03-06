/* Filename: financial/generalledger/VoucherFinalizeList.js */
import React, { useState, useEffect, useMemo } from 'react';
import { Printer, Paperclip, Eye, CheckSquare, ShieldCheck, FileWarning } from 'lucide-react';

const VoucherFinalizeList = ({ language, t, lookups, contextVals, setContextVals, perms, onOpenForm, onListUpdate }) => {
  const isRtl = language === 'fa';
  const UI = window.UI || {};
  const { Button, InputField, SelectField, DataGrid, FilterSection, Modal } = UI;
  const supabase = window.supabase;

  const [loading, setLoading] = useState(false);
  const [vouchers, setVouchers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  
  const [selectedPeriodId, setSelectedPeriodId] = useState('');
  const [searchParams, setSearchParams] = useState({ voucher_number: '', description: '', from_date: '', to_date: '', status: '', voucher_type: '', account_id: '' });

  const [voucherToPrint, setVoucherToPrint] = useState(null);
  const [voucherForAttachments, setVoucherForAttachments] = useState(null);

  const activePeriods = useMemo(() => {
     return lookups.fiscalPeriods.filter(p => String(p.year_id) === String(contextVals.fiscal_year_id)).sort((a, b) => a.start_date.localeCompare(b.start_date));
  }, [lookups.fiscalPeriods, contextVals.fiscal_year_id]);

  useEffect(() => {
    setSelectedPeriodId('');
    setSearchParams(prev => ({...prev, from_date: '', to_date: ''}));
    if (contextVals.fiscal_year_id && contextVals.ledger_id) {
      fetchVouchers({ ...searchParams, from_date: '', to_date: '' });
    } else {
      setVouchers([]);
      if (onListUpdate) onListUpdate([]);
    }
  }, [contextVals]);

  const handlePeriodChange = (e) => {
      const pid = e.target.value;
      setSelectedPeriodId(pid);
      if (pid) {
          const p = activePeriods.find(x => String(x.id) === String(pid));
          if (p) setSearchParams(prev => ({...prev, from_date: p.start_date, to_date: p.end_date}));
      } else {
          setSearchParams(prev => ({...prev, from_date: '', to_date: ''}));
      }
  };

  const fetchVouchers = async (paramsObj = searchParams) => {
    if (!supabase || !contextVals.fiscal_year_id || !contextVals.ledger_id) return;

    setLoading(true);
    try {
      let query = supabase.schema('gl').from('vouchers')
        .select('*')
        .eq('fiscal_year_id', contextVals.fiscal_year_id)
        .eq('ledger_id', contextVals.ledger_id)
        .in('status', ['reviewed', 'finalized'])
        .order('voucher_date', { ascending: false })
        .order('voucher_number', { ascending: false });

      if (!window.IS_ADMIN) {
        if (perms.allowed_branches.length > 0) query = query.in('branch_id', perms.allowed_branches);
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
    setSelectedPeriodId('');
    setSearchParams(cleared);
    fetchVouchers(cleared);
  };

  const executeFinalize = async () => {
    if (selectedIds.length === 0 || !perms.actions.includes('status_change')) return;
    
    const vouchersToProcess = vouchers.filter(v => selectedIds.includes(v.id) && v.status === 'reviewed');
    if (vouchersToProcess.length === 0) return;

    if (!window.confirm(t.finalizeWarning)) return;

    for (let v of vouchersToProcess) {
        if (Number(v.total_debit) !== Number(v.total_credit)) {
            return alert(t.errNotBalanced.replace('{vNo}', v.voucher_number || v.daily_number || '-'));
        }
        
        const period = lookups.fiscalPeriods.find(x => String(x.year_id) === String(contextVals.fiscal_year_id) && v.voucher_date >= x.start_date && v.voucher_date <= x.end_date);
        if (!period) return alert(t.errPeriodNotFound.replace('{vNo}', v.voucher_number || v.daily_number || '-'));
        
        if (period.status !== 'open') {
            const hasException = lookups.fiscalExceptions.some(e => String(e.period_id) === String(period.id) && (e.allowed_statuses || []).includes(period.status));
            if (!hasException) return alert(t.errPeriodClosed.replace('{vNo}', v.voucher_number || v.daily_number || '-'));
        }
    }

    setLoading(true);
    try {
        const { error } = await supabase.schema('gl').from('vouchers').update({ status: 'finalized' }).in('id', vouchersToProcess.map(v => v.id));
        if (error) throw error;
        alert(t.finalizeSuccess);
        setSelectedIds([]);
        fetchVouchers();
    } catch (error) {
        console.error('Error finalizing:', error);
        alert(t.finalizeError);
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
        'reviewed': { label: t.statusReviewed, bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
        'finalized': { label: t.statusFinalized, bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' }
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
  const hasReviewedSelected = selectedVouchers.some(v => v.status === 'reviewed');

  return (
    <div className={`h-full flex flex-col p-4 md:p-6 bg-slate-50/50`}>
      <div className="mb-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-600 rounded-xl text-white shadow-lg shadow-emerald-200">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800">{t.title}</h1>
            <p className="text-xs text-slate-500 font-medium mt-1">{t.subtitle}</p>
          </div>
        </div>
      </div>

      <FilterSection onSearch={() => fetchVouchers(searchParams)} onClear={handleClearSearch} isRtl={isRtl} title={t.search}>
        <SelectField label={t.fiscalPeriod} value={selectedPeriodId} onChange={handlePeriodChange} isRtl={isRtl}>
           <option value="">{t.selectPeriod}</option>
           {activePeriods.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
        </SelectField>
        <InputField type="date" label={t.fromDate} value={searchParams.from_date} onChange={e => setSearchParams({...searchParams, from_date: e.target.value})} disabled={!!selectedPeriodId} isRtl={isRtl} />
        <InputField type="date" label={t.toDate} value={searchParams.to_date} onChange={e => setSearchParams({...searchParams, to_date: e.target.value})} disabled={!!selectedPeriodId} isRtl={isRtl} />

        <InputField label={t.voucherNumber} value={searchParams.voucher_number} onChange={e => setSearchParams({...searchParams, voucher_number: e.target.value})} isRtl={isRtl} dir="ltr" />
        <SelectField label={t.status} value={searchParams.status} onChange={e => setSearchParams({...searchParams, status: e.target.value})} isRtl={isRtl}>
           <option value="">{t.all}</option>
           <option value="reviewed">{t.statusReviewed}</option>
           <option value="finalized">{t.statusFinalized}</option>
        </SelectField>
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
          onDoubleClick={(r) => onOpenForm(r.id, vouchers)} 
          isRtl={isRtl} 
          isLoading={loading} 
          bulkActions={
             perms.actions.includes('status_change') && hasReviewedSelected && (
                 <Button variant="success" size="sm" onClick={executeFinalize} icon={ShieldCheck}>{t.finalize}</Button>
             )
          }
          actions={(r) => (
            <div className="flex gap-1 justify-center">
              {perms.actions.includes('print') && <Button variant="ghost" size="iconSm" icon={Printer} onClick={() => setVoucherToPrint(r)} title={t.print} className="text-slate-500 hover:text-indigo-600 hover:bg-indigo-50" />}
              {perms.actions.includes('attach') && <Button variant="ghost" size="iconSm" icon={Paperclip} onClick={() => setVoucherForAttachments(r)} title={t.attachments} className="text-slate-500 hover:text-indigo-600 hover:bg-indigo-50" />}
              <Button variant="ghost" size="iconSm" icon={Eye} onClick={() => onOpenForm(r.id, vouchers)} title={t.view} className="text-slate-500 hover:text-indigo-600 hover:bg-indigo-50" />
            </div>
          )}
        />
      </div>

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
                <window.VoucherAttachments voucherId={voucherForAttachments.id} onClose={() => setVoucherForAttachments(null)} readOnly={true} />
            ) : (
                <div className="p-10 flex flex-col items-center justify-center text-slate-500 gap-4">
                    <FileWarning size={48} className="text-amber-400" />
                    <p>{isRtl ? 'کامپوننت ضمائم یافت نشد.' : 'Attachments component not found.'}</p>
                </div>
            )}
          </Modal>
      )}
    </div>
  );
};

window.VoucherFinalizeList = VoucherFinalizeList;
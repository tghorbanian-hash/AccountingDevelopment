/* Filename: financial/generalledger/VoucherList.js */
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Filter, Eye, Printer, Paperclip, FileText, 
  ChevronRight, ChevronLeft, RefreshCw 
} from 'lucide-react';

const VoucherList = ({ contextVals, lookups, language = 'fa' }) => {
  const { localTranslations } = window.VoucherUtils || {};
  const t = localTranslations ? (localTranslations[language] || localTranslations['en']) : {
      search: 'جستجو',
      filter: 'فیلتر',
      refresh: 'بروزرسانی',
      ledger: 'دفتر مالی',
      branch: 'شعبه',
      status: 'وضعیت',
      fromDate: 'از تاریخ',
      toDate: 'تا تاریخ',
      voucherNumber: 'شماره سند',
      all: 'همه',
      view: 'مشاهده',
      print: 'چاپ',
      attachments: 'ضمائم',
      row: 'ردیف',
      date: 'تاریخ',
      description: 'شرح',
      debit: 'بدهکار',
      credit: 'بستانکار',
      noData: 'سندی یافت نشد',
      statusDraft: 'یادداشت',
      statusTemporary: 'موقت',
      statusReviewed: 'بررسی شده',
      statusFinal: 'قطعی شده'
  };
  const isRtl = language === 'fa';
  
  const UI = window.UI || {};
  const { Button, InputField, SelectField, Modal } = UI;
  const { formatNumber } = UI.utils || { formatNumber: (v) => v };
  const supabase = window.supabase;

  // --- Security & Data Scoping ---
  const perms = lookups.permissions || { actions: [], allowed_branches: [], allowed_ledgers: [] };
  const canView = perms.actions.includes('view') || true; // Assuming list access implies view
  const canPrint = perms.actions.includes('print');
  const canAttach = perms.actions.includes('attach');

  const filteredBranches = useMemo(() => {
      if (perms.allowed_branches && perms.allowed_branches.length > 0) {
          return lookups.branches.filter(b => perms.allowed_branches.includes(b.id));
      }
      return lookups.branches;
  }, [lookups.branches, perms]);

  const filteredLedgers = useMemo(() => {
      if (perms.allowed_ledgers && perms.allowed_ledgers.length > 0) {
          return lookups.ledgers.filter(l => perms.allowed_ledgers.includes(String(l.id)));
      }
      return lookups.ledgers;
  }, [lookups.ledgers, perms]);

  // --- States ---
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
      ledger_id: contextVals.ledger_id || '',
      branch_id: '',
      status: '',
      fromDate: '',
      toDate: '',
      voucherNumber: ''
  });

  // Modals States
  const [selectedVoucherForView, setSelectedVoucherForView] = useState(null);
  const [voucherToPrint, setVoucherToPrint] = useState(null);
  const [voucherForAttachments, setVoucherForAttachments] = useState(null);

  // --- Fetch Data ---
  const fetchVouchers = async () => {
    if (!supabase || !canView) return;
    setLoading(true);
    try {
      let query = supabase.schema('gl').from('vouchers')
        .select('*')
        .eq('fiscal_period_id', contextVals.fiscal_year_id)
        .order('voucher_number', { ascending: false })
        .order('daily_number', { ascending: false });

      if (filters.ledger_id) query = query.eq('ledger_id', filters.ledger_id);
      if (filters.branch_id) query = query.eq('branch_id', filters.branch_id);
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.fromDate) query = query.gte('voucher_date', filters.fromDate);
      if (filters.toDate) query = query.lte('voucher_date', filters.toDate);
      if (filters.voucherNumber) query = query.eq('voucher_number', filters.voucherNumber);

      // Apply Data Scoping
      if (perms.allowed_ledgers && perms.allowed_ledgers.length > 0 && !filters.ledger_id) {
          query = query.in('ledger_id', perms.allowed_ledgers);
      }
      if (perms.allowed_branches && perms.allowed_branches.length > 0 && !filters.branch_id) {
          query = query.in('branch_id', perms.allowed_branches);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      setVouchers(data || []);
    } catch (err) {
      console.error('Error fetching vouchers list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
      fetchVouchers();
  }, [contextVals.fiscal_year_id]); // Refresh when fiscal year changes

  const handleFilterChange = (field, value) => {
      setFilters(prev => ({ ...prev, [field]: value }));
  };

  // --- Helpers ---
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
    <div className={`h-full flex flex-col bg-slate-50/50 p-4 md:p-6 ${isRtl ? 'dir-rtl' : 'dir-ltr'}`}>
        
        {/* Filters Top Bar */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-4 shrink-0">
            <div className="flex items-center gap-2 mb-4 text-slate-800 font-bold">
                <Filter size={18} className="text-indigo-600" />
                <h2>{t.filter}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
                <SelectField label={t.ledger} value={filters.ledger_id} onChange={(e) => handleFilterChange('ledger_id', e.target.value)} isRtl={isRtl}>
                    <option value="">{t.all}</option>
                    {filteredLedgers.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
                </SelectField>
                
                <SelectField label={t.branch} value={filters.branch_id} onChange={(e) => handleFilterChange('branch_id', e.target.value)} isRtl={isRtl}>
                    <option value="">{t.all}</option>
                    {filteredBranches.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
                </SelectField>

                <SelectField label={t.status} value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)} isRtl={isRtl}>
                    <option value="">{t.all}</option>
                    <option value="draft">{t.statusDraft}</option>
                    <option value="temporary">{t.statusTemporary}</option>
                    <option value="reviewed">{t.statusReviewed}</option>
                    <option value="final">{t.statusFinal}</option>
                </SelectField>

                <InputField type="date" label={t.fromDate} value={filters.fromDate} onChange={(e) => handleFilterChange('fromDate', e.target.value)} isRtl={isRtl} />
                <InputField type="date" label={t.toDate} value={filters.toDate} onChange={(e) => handleFilterChange('toDate', e.target.value)} isRtl={isRtl} />
                
                <div className="flex gap-2">
                    <div className="flex-1">
                        <InputField label={t.voucherNumber} value={filters.voucherNumber} onChange={(e) => handleFilterChange('voucherNumber', e.target.value)} dir="ltr" className="text-center" isRtl={isRtl} />
                    </div>
                    <Button variant="primary" onClick={fetchVouchers} icon={Search} className="h-9 mb-1" title={t.search}></Button>
                </div>
            </div>
        </div>

        {/* Data Grid */}
        <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col min-w-0 overflow-hidden">
            <div className="flex justify-between items-center p-3 bg-slate-50 border-b border-slate-200 shrink-0">
                <div className="flex items-center gap-2 font-bold text-slate-700">
                    <FileText size={18} className="text-indigo-500" />
                    <span>{t.all}</span>
                    <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs ml-2 rtl:ml-0 rtl:mr-2">{vouchers.length}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={fetchVouchers} icon={RefreshCw} className="text-slate-500">{t.refresh}</Button>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar">
                {loading ? (
                    <div className="h-full flex items-center justify-center">
                        <Loader2 size={32} className="animate-spin text-indigo-500" />
                    </div>
                ) : vouchers.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
                        <Search size={48} className="opacity-20" />
                        <p>{t.noData}</p>
                    </div>
                ) : (
                    <table className="w-full text-sm text-right dir-rtl">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 sticky top-0 z-10">
                            <tr>
                                <th className="p-3 font-bold w-16 text-center">{t.row}</th>
                                <th className="p-3 font-bold w-24 text-center">{t.voucherNumber}</th>
                                <th className="p-3 font-bold w-28 text-center">{t.date}</th>
                                <th className="p-3 font-bold min-w-[200px]">{t.description}</th>
                                <th className="p-3 font-bold w-32 text-center">{t.status}</th>
                                <th className="p-3 font-bold w-36 text-center">{t.debit}</th>
                                <th className="p-3 font-bold w-36 text-center">{t.credit}</th>
                                <th className="p-3 font-bold w-32 text-center">عملیات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {vouchers.map((v, idx) => (
                                <tr key={v.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="p-3 text-center text-slate-400 font-bold">{idx + 1}</td>
                                    <td className="p-3 text-center font-mono font-bold text-slate-700 dir-ltr">{v.voucher_number || '-'}</td>
                                    <td className="p-3 text-center font-mono text-slate-600 dir-ltr">{v.voucher_date}</td>
                                    <td className="p-3 text-slate-600 truncate max-w-[200px]" title={v.description || '-'}>{v.description || '-'}</td>
                                    <td className="p-3 text-center">{getStatusBadgeUI(v.status)}</td>
                                    <td className="p-3 text-center font-mono font-bold text-indigo-700 dir-ltr">{formatNumber(v.total_debit)}</td>
                                    <td className="p-3 text-center font-mono font-bold text-indigo-700 dir-ltr">{formatNumber(v.total_credit)}</td>
                                    <td className="p-3">
                                        <div className="flex items-center justify-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => setSelectedVoucherForView(v.id)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title={t.view}>
                                                <Eye size={16} />
                                            </button>
                                            {canPrint && (
                                            <button onClick={() => setVoucherToPrint(v)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title={t.print}>
                                                <Printer size={16} />
                                            </button>
                                            )}
                                            {canAttach && (
                                            <button onClick={() => setVoucherForAttachments(v)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title={t.attachments}>
                                                <Paperclip size={16} />
                                            </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>

        {/* View Modal (Loads VoucherForm in readonly context visually) */}
        {selectedVoucherForView && (
            <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 md:p-8 overflow-hidden">
                <div className="bg-white w-full h-full rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex-1 overflow-hidden relative">
                        {window.VoucherForm ? (
                            <window.VoucherForm 
                                voucherId={selectedVoucherForView} 
                                isCopy={false} 
                                contextVals={contextVals} 
                                lookups={lookups} 
                                language={language}
                                onClose={(changed) => {
                                    setSelectedVoucherForView(null);
                                    if(changed) fetchVouchers();
                                }} 
                            />
                        ) : (
                            <div className="p-10 flex flex-col items-center justify-center text-slate-500 h-full">
                                <FileWarning size={48} className="mb-4 text-amber-400"/>
                                <p>کامپوننت VoucherForm یافت نشد.</p>
                                <Button variant="outline" className="mt-4" onClick={() => setSelectedVoucherForView(null)}>بستن</Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* Print Modal */}
        <Modal isOpen={!!voucherToPrint} onClose={() => setVoucherToPrint(null)} title={t.print || 'چاپ سند'} size="full">
            {voucherToPrint && window.VoucherPrint ? (
                <window.VoucherPrint voucherId={voucherToPrint.id} onClose={() => setVoucherToPrint(null)} />
            ) : (
                <div className="p-10 flex flex-col items-center justify-center text-slate-500 gap-4">
                    <FileWarning size={48} className="text-amber-400" />
                    <p>{isRtl ? 'کامپوننت چاپ یافت نشد. لطفاً فایل VoucherPrint.js را در پروژه قرار دهید.' : 'Print component not found.'}</p>
                </div>
            )}
        </Modal>

        {/* Attachments Modal */}
        <Modal isOpen={!!voucherForAttachments} onClose={() => setVoucherForAttachments(null)} title={t.attachments || 'اسناد مثبته و ضمائم'} size="md">
            {voucherForAttachments && window.VoucherAttachments ? (
                <window.VoucherAttachments voucherId={voucherForAttachments.id} onClose={() => setVoucherForAttachments(null)} />
            ) : (
                <div className="p-10 flex flex-col items-center justify-center text-slate-500 gap-4">
                    <FileWarning size={48} className="text-amber-400" />
                    <p>{isRtl ? 'کامپوننت ضمائم یافت نشد.' : 'Attachments component not found.'}</p>
                </div>
            )}
        </Modal>

    </div>
  );
};

window.VoucherList = VoucherList;
export default VoucherList;
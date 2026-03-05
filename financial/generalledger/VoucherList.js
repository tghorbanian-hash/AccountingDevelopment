/* Filename: financial/generalledger/VoucherList.js */
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Filter, Eye, Printer, Paperclip, FileText, 
  RefreshCw, Loader2, FileWarning, ChevronDown
} from 'lucide-react';

const VoucherList = ({ language = 'fa', setHeaderNode }) => {
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

  const [lookups, setLookups] = useState(null);
  const [contextVals, setContextVals] = useState(null);
  const [isAppLoading, setIsAppLoading] = useState(true);

  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
      branch_id: '',
      status: '',
      fromDate: '',
      toDate: '',
      voucherNumber: ''
  });

  const [selectedVoucherForView, setSelectedVoucherForView] = useState(null);
  const [voucherToPrint, setVoucherToPrint] = useState(null);
  const [voucherForAttachments, setVoucherForAttachments] = useState(null);

  useEffect(() => {
      const initApp = async () => {
          if (!supabase) return;
          try {
              const fetchSafe = async (schema, table) => {
                  try {
                      const { data, error } = await supabase.schema(schema).from(table).select('*');
                      if (error) console.warn(`Error fetching ${table}:`, error);
                      return data || [];
                  } catch (e) {
                      return [];
                  }
              };

              const [
                  branches, ledgers, accountStructures, accounts, 
                  allDetailInstances, detailTypes, currencies, 
                  fiscalYears, fiscalPeriods
              ] = await Promise.all([
                  fetchSafe('gen', 'branches'),
                  fetchSafe('gl', 'ledgers'),
                  fetchSafe('gl', 'account_structures'),
                  fetchSafe('gl', 'accounts'),
                  fetchSafe('gl', 'detail_instances'),
                  fetchSafe('gl', 'detail_types'),
                  fetchSafe('gen', 'currencies'),
                  fetchSafe('gl', 'fiscal_years'),
                  fetchSafe('gl', 'fiscal_periods')
              ]);

              let docTypes = [];
              try {
                  const { data } = await supabase.schema('gl').from('document_types').select('*');
                  docTypes = data || [];
              } catch (e) { }

              let currencyGlobals = {};
              try {
                  const { data } = await supabase.schema('gen').from('currency_globals').select('*').limit(1).maybeSingle();
                  if(data) currencyGlobals = data;
              } catch(e){}

              const activeYear = fiscalYears.find(y => y.is_active) || fiscalYears[0] || {};
              const activeLedger = ledgers.find(l => l.is_main) || ledgers[0] || {};

              setContextVals({
                  fiscal_year_id: activeYear.id || '',
                  ledger_id: activeLedger.id || ''
              });

              const perms = {
                  actions: ['view', 'print', 'attach'], 
                  allowed_branches: [], 
                  allowed_ledgers: []
              };

              if (window.USER_PERMISSIONS) {
                  if (window.IS_ADMIN || window.USER_PERMISSIONS.has('gl_docs.edit')) {
                      perms.actions.push('edit');
                  }
              }

              let filteredLedgers = ledgers;
              if (!window.IS_ADMIN && perms.allowed_ledgers.length > 0) {
                  filteredLedgers = ledgers.filter(l => perms.allowed_ledgers.includes(String(l.id)));
              }

              setLookups({
                  branches, ledgers: filteredLedgers, accountStructures, accounts,
                  allDetailInstances, detailTypes, currencies, currencyGlobals,
                  fiscalYears, fiscalPeriods, 
                  docTypes: docTypes.length > 0 ? docTypes : [{id:1, code:'sys_general', title: isRtl ? 'عمومی' : 'General'}],
                  permissions: perms
              });
          } catch (err) {
              console.error("Error loading lookups:", err);
          } finally {
              setIsAppLoading(false);
          }
      };
      initApp();
  }, [isRtl]);

  useEffect(() => {
    if (setHeaderNode && lookups && contextVals) {
      const node = (
        <div className="flex items-center bg-slate-100/80 hover:bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 transition-colors shadow-[inset_0_1px_3px_rgba(0,0,0,0.05)]">
          <Filter size={14} className="text-indigo-500 mr-2 rtl:mr-0 rtl:ml-2" />
          
          <div className="relative flex items-center group">
            <select 
              value={contextVals.fiscal_year_id} 
              onChange={e => setContextVals({...contextVals, fiscal_year_id: e.target.value})} 
              className="bg-transparent border-none text-xs font-bold text-slate-600 group-hover:text-indigo-700 focus:ring-0 outline-none cursor-pointer appearance-none py-0 pl-1 pr-5 rtl:pr-1 rtl:pl-5 transition-colors z-10"
            >
              {lookups.fiscalYears.map(f => <option key={f.id} value={f.id}>{f.title}</option>)}
            </select>
            <ChevronDown size={12} className="absolute text-slate-400 right-1 rtl:right-auto rtl:left-1 pointer-events-none group-hover:text-indigo-500 transition-colors" />
          </div>

          <div className="w-px h-4 bg-slate-300 mx-2"></div>
          
          {lookups.ledgers.length > 0 ? (
            <div className="relative flex items-center group">
              <select 
                value={contextVals.ledger_id} 
                onChange={e => setContextVals({...contextVals, ledger_id: e.target.value})} 
                className="bg-transparent border-none text-xs font-bold text-slate-600 group-hover:text-indigo-700 focus:ring-0 outline-none cursor-pointer appearance-none py-0 pl-1 pr-5 rtl:pr-1 rtl:pl-5 transition-colors z-10 max-w-[150px] truncate"
              >
                {lookups.ledgers.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
              </select>
              <ChevronDown size={12} className="absolute text-slate-400 right-1 rtl:right-auto rtl:left-1 pointer-events-none group-hover:text-indigo-500 transition-colors" />
            </div>
          ) : (
            <span className="text-[11px] text-rose-500 font-bold px-1 flex items-center">{isRtl ? 'دفتری مجاز نیست' : 'No ledgers allowed'}</span>
          )}
        </div>
      );
      setHeaderNode(node);
    }
    
    return () => {
      if (setHeaderNode) setHeaderNode(null);
    };
  }, [lookups, contextVals, setHeaderNode, isRtl]);

  const fetchVouchers = async () => {
    if (!supabase || !contextVals || !contextVals.fiscal_year_id || !contextVals.ledger_id) {
        setVouchers([]);
        return;
    }
    
    setLoading(true);
    try {
      let query = supabase.schema('gl').from('vouchers')
        .select('*')
        .eq('fiscal_year_id', contextVals.fiscal_year_id)
        .eq('ledger_id', contextVals.ledger_id)
        .order('voucher_number', { ascending: false })
        .order('daily_number', { ascending: false });

      if (filters.branch_id) query = query.eq('branch_id', filters.branch_id);
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.fromDate) query = query.gte('voucher_date', filters.fromDate);
      if (filters.toDate) query = query.lte('voucher_date', filters.toDate);
      if (filters.voucherNumber) query = query.eq('voucher_number', filters.voucherNumber);

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
      if (contextVals && !isAppLoading) {
          fetchVouchers();
      }
  }, [contextVals, isAppLoading]);

  const handleFilterChange = (field, value) => {
      setFilters(prev => ({ ...prev, [field]: value }));
  };

  if (isAppLoading || !lookups || !contextVals) {
      return (
          <div className="h-full flex flex-col items-center justify-center bg-slate-50">
              <Loader2 size={40} className="animate-spin text-indigo-500 mb-4" />
              <p className="text-slate-500 font-bold">{isRtl ? 'در حال واکشی اطلاعات پایه...' : 'Loading dependencies...'}</p>
          </div>
      );
  }

  const getStatusBadgeUI = (status) => {
    const config = {
        'draft': { label: t.statusDraft, bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
        'temporary': { label: t.statusTemporary, bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
        'reviewed': { label: t.statusReviewed, bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
        'finalized': { label: t.statusFinal, bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
        'final': { label: t.statusFinal, bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    };
    const c = config[status] || { label: status, bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };
    return <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${c.bg} ${c.text} ${c.border}`}>{c.label}</span>;
  };

  return (
    <div className={`h-full flex flex-col bg-slate-50/50 p-4 md:p-6 ${isRtl ? 'dir-rtl' : 'dir-ltr'}`}>
        
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-4 shrink-0">
            <div className="flex items-center gap-2 mb-4 text-slate-800 font-bold">
                <Filter size={18} className="text-indigo-600" />
                <h2>{t.filter}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
                <SelectField label={t.branch} value={filters.branch_id} onChange={(e) => handleFilterChange('branch_id', e.target.value)} isRtl={isRtl}>
                    <option value="">{t.all}</option>
                    {lookups.branches.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
                </SelectField>

                <SelectField label={t.status} value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)} isRtl={isRtl}>
                    <option value="">{t.all}</option>
                    <option value="draft">{t.statusDraft}</option>
                    <option value="temporary">{t.statusTemporary}</option>
                    <option value="reviewed">{t.statusReviewed}</option>
                    <option value="finalized">{t.statusFinal}</option>
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
                                            {lookups.permissions.actions.includes('print') && (
                                            <button onClick={() => setVoucherToPrint(v)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title={t.print}>
                                                <Printer size={16} />
                                            </button>
                                            )}
                                            {lookups.permissions.actions.includes('attach') && (
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

        <Modal isOpen={!!voucherForAttachments} onClose={() => setVoucherForAttachments(null)} title={t.attachments || 'اسناد مثبته و ضمائم'} size="md">
            {voucherForAttachments && window.VoucherAttachments ? (
                <window.VoucherAttachments 
                  voucherId={voucherForAttachments.id} 
                  onClose={() => setVoucherForAttachments(null)} 
                  readOnly={voucherForAttachments.status === 'finalized' || voucherForAttachments.status === 'final'} 
                />
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
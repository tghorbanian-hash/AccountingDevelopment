/* Filename: financial/generalledger/AccountReviewPrint.js */
import React, { useState, useMemo } from 'react';
import { Printer, Settings, CheckSquare, Square } from 'lucide-react';

const AccountReviewPrint = ({ 
    isOpen, onClose, rawData, drillPath, lookups, 
    mainFilters, baseCurrencyMode, showWithBalanceOnly, 
    initialTab, t, isRtl 
}) => {
    const UI = window.UI || {};
    const { Modal, Button } = UI;
    const { formatNumber, parseNumber } = UI.utils || { formatNumber: (v) => v, parseNumber: (v) => v };

    if (!isOpen) return null;

    const [printTab, setPrintTab] = useState(initialTab || 'col');
    const [hiddenColumns, setHiddenColumns] = useState({});

    const tabs = [
        { id: 'branch', label: t.tabBranch },
        { id: 'group', label: t.tabGroup },
        { id: 'col', label: t.tabCol },
        { id: 'moe', label: t.tabMoe },
        { id: 'detail', label: t.tabDetail },
        { id: 'currency', label: t.tabCurrency },
        { id: 'tracking', label: t.tabTracking },
        { id: 'transactions', label: t.tabTransactions }
    ];

    const tabSingular = isRtl ? {
        branch: 'شعبه', group: 'گروه', col: 'کل', moe: 'معین', detail: 'تفصیل', currency: 'ارز', tracking: 'پیگیری'
    } : {
        branch: 'Branch', group: 'Group', col: 'General', moe: 'Subsidiary', detail: 'Detail', currency: 'Currency', tracking: 'Tracking'
    };

    const reportData = useMemo(() => {
        if (!rawData || rawData.length === 0) return [];
  
        let filteredData = rawData;
  
        const rowMatchesPath = (d, tabKey, selectedIds) => {
            if (!selectedIds || selectedIds.length === 0) return true;
            if (tabKey === 'branch') return selectedIds.includes(d.vouchers.branch_id);
            if (tabKey === 'group') return selectedIds.includes(lookups.accMap[d.account_id]?.parentGroup?.id);
            if (tabKey === 'col') return selectedIds.includes(lookups.accMap[d.account_id]?.parentCol?.id);
            if (tabKey === 'moe') return selectedIds.includes(d.account_id);
            if (tabKey === 'currency') return selectedIds.includes(d.currency_code || '-');
            if (tabKey === 'tracking') return selectedIds.includes(d.tracking_number);
            if (tabKey === 'detail') {
                const detailsObj = typeof d.details === 'string' ? JSON.parse(d.details || '{}') : (d.details || {});
                const selDet = detailsObj.selected_details || {};
                return Object.values(selDet).some(id => selectedIds.includes(id));
            }
            return true;
        };
  
        Object.keys(drillPath).forEach(tabKey => {
            if (tabKey !== printTab) { 
                filteredData = filteredData.filter(d => rowMatchesPath(d, tabKey, drillPath[tabKey]));
            }
        });
  
        if (printTab === 'transactions') {
            let runningSum = 0;
            return filteredData.sort((a,b) => {
                const dateDiff = new Date(a.vouchers.voucher_date) - new Date(b.vouchers.voucher_date);
                if (dateDiff !== 0) return dateDiff;
                return (a.vouchers.voucher_number || 0) - (b.vouchers.voucher_number || 0);
            }).map(d => {
                let dAmount = 0, cAmount = 0;
                if (baseCurrencyMode === 'op') { dAmount = parseNumber(d.op_debit); cAmount = parseNumber(d.op_credit); }
                else if (baseCurrencyMode === 'rep1') { dAmount = parseNumber(d.rep1_debit); cAmount = parseNumber(d.rep1_credit); }
                else if (baseCurrencyMode === 'rep2') { dAmount = parseNumber(d.rep2_debit); cAmount = parseNumber(d.rep2_credit); }
                
                runningSum += (dAmount - cAmount);

                return {
                    id: d.id, voucher_id: d.vouchers.id, doc_no: d.vouchers.voucher_number, date: d.vouchers.voucher_date,
                    doc_type: d.vouchers.voucher_type, description: d.description || d.vouchers.description,
                    debit: dAmount, credit: cAmount, 
                    account: lookups.accMap[d.account_id]?.title || '-',
                    balance: Math.abs(runningSum),
                    nature: runningSum === 0 ? '-' : (runningSum > 0 ? (isRtl ? 'بد' : 'Dr') : (isRtl ? 'بس' : 'Cr'))
                };
            });
        }
  
        const aggMap = new Map();
  
        filteredData.forEach(d => {
            let dAmount = 0, cAmount = 0;
            if (baseCurrencyMode === 'op') { dAmount = parseNumber(d.op_debit); cAmount = parseNumber(d.op_credit); }
            else if (baseCurrencyMode === 'rep1') { dAmount = parseNumber(d.rep1_debit); cAmount = parseNumber(d.rep1_credit); }
            else if (baseCurrencyMode === 'rep2') { dAmount = parseNumber(d.rep2_debit); cAmount = parseNumber(d.rep2_credit); }
  
            let keys = []; 
  
            if (printTab === 'branch') {
                const bId = d.vouchers.branch_id;
                const b = lookups.branches.find(x => x.id === bId);
                keys.push({ id: bId || 'no-branch', code: b?.code || '-', title: b?.title || 'No Branch' });
            } else if (printTab === 'group') {
                const grp = lookups.accMap[d.account_id]?.parentGroup;
                if (grp) keys.push({ id: grp.id, code: grp.full_code || grp.code, title: grp.title });
            } else if (printTab === 'col') {
                const col = lookups.accMap[d.account_id]?.parentCol;
                if (col) keys.push({ id: col.id, code: col.full_code || col.code, title: col.title });
            } else if (printTab === 'moe') {
                const moe = lookups.accMap[d.account_id];
                if (moe) keys.push({ id: moe.id, code: moe.full_code || moe.code, title: moe.title });
            } else if (printTab === 'detail') {
                const detailsObj = typeof d.details === 'string' ? JSON.parse(d.details || '{}') : (d.details || {});
                const selDet = detailsObj.selected_details || {};
                Object.values(selDet).forEach(detId => {
                    const det = lookups.allDetailInstances.find(x => String(x.id) === String(detId));
                    if (det) {
                        const dt = lookups.detailTypes?.find(type => type.code === det.detail_type_code);
                        const typeTitle = dt ? dt.title : (isRtl ? 'ناشناخته' : 'Unknown');
                        keys.push({ id: det.id, code: det.detail_code || '-', title: det.title, extra: typeTitle });
                    }
                });
            } else if (printTab === 'currency') {
                const currCode = d.currency_code || '-';
                const curr = lookups.currencies.find(c => c.code === currCode);
                keys.push({ id: currCode, code: currCode, title: curr?.title || currCode });
            } else if (printTab === 'tracking') {
                if (d.tracking_number) keys.push({ id: d.tracking_number, code: d.tracking_number, title: d.tracking_date || '-' });
            }
  
            keys.forEach(k => {
                if (!aggMap.has(k.id)) {
                    aggMap.set(k.id, { id: k.id, code: k.code, title: k.title, extra: k.extra, debit: 0, credit: 0 });
                }
                const group = aggMap.get(k.id);
                group.debit += dAmount;
                group.credit += cAmount;
            });
        });
  
        let results = Array.from(aggMap.values()).map(row => {
            const diff = row.debit - row.credit;
            row.balanceDebit = diff > 0 ? diff : 0;
            row.balanceCredit = diff < 0 ? Math.abs(diff) : 0;
            row.balance = Math.abs(diff);
            row.nature = diff === 0 ? '-' : (diff > 0 ? (isRtl ? 'بدهکار' : 'Debit') : (isRtl ? 'بستانکار' : 'Credit'));
            return row;
        });
  
        if (showWithBalanceOnly) {
            results = results.filter(r => r.balance > 0);
        }
  
        return results.sort((a,b) => String(a.code).localeCompare(String(b.code)));
  
    }, [rawData, printTab, drillPath, baseCurrencyMode, showWithBalanceOnly, lookups, isRtl]);

    const getColumns = () => {
        let cols = [];
        if (printTab === 'transactions') {
            cols = [
                { field: 'doc_no', header: t.colDocNo },
                { field: 'date', header: t.colDate },
                { field: 'account', header: t.tabMoe },
                { field: 'description', header: t.colDesc },
                { field: 'debit', header: t.colDebit },
                { field: 'credit', header: t.colCredit },
                { field: 'balance', header: t.colBalance },
                { field: 'nature', header: t.colNature }
            ];
        } else {
            cols = [
                { field: 'code', header: t.colCode },
                { field: 'title', header: t.colTitle }
            ];
            if (printTab === 'detail') cols.push({ field: 'extra', header: t.colDetailType });
            cols.push(
                { field: 'debit', header: t.colDebit },
                { field: 'credit', header: t.colCredit },
                { field: 'balanceDebit', header: t.colBalanceDebit },
                { field: 'balanceCredit', header: t.colBalanceCredit },
                { field: 'nature', header: t.colNature }
            );
        }
        return cols.filter(c => !hiddenColumns[c.field]);
    };

    const finalCols = getColumns();

    const totalSums = reportData.reduce((acc, row) => {
        acc.debit += row.debit || 0;
        acc.credit += row.credit || 0;
        if (printTab !== 'transactions') {
            acc.balDebit += row.balanceDebit || 0;
            acc.balCredit += row.balanceCredit || 0;
        }
        return acc;
    }, { debit: 0, credit: 0, balDebit: 0, balCredit: 0 });

    const handlePrint = () => {
        window.print();
    };

    const toggleColumn = (field) => {
        setHiddenColumns(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    // Prepare Header Data
    const repName = t.title;
    const orgName = lookups.orgInfo?.name || 'نام سازمان';
    const repDate = new Date().toLocaleDateString(isRtl ? 'fa-IR' : 'en-US');
    const userName = lookups.currentUser?.full_name || lookups.currentUser?.username || 'کاربر سیستم';
    const fYear = lookups.fiscalYears.find(y => String(y.id) === String(mainFilters.fiscalYearId))?.title || '-';
    const ledger = lookups.ledgers.find(l => String(l.id) === String(mainFilters.ledgerId))?.title || '-';
    
    let repCurrencyStr = lookups.currencyGlobals?.op_currency;
    if(baseCurrencyMode === 'rep1') repCurrencyStr = lookups.currencyGlobals?.rep1_currency;
    if(baseCurrencyMode === 'rep2') repCurrencyStr = lookups.currencyGlobals?.rep2_currency;

    const renderActiveChips = () => {
        let chips = [];
        Object.keys(drillPath).forEach(tabKey => {
            if (tabKey === printTab) return; 
            drillPath[tabKey].forEach(id => {
                let label = String(id);
                if (tabKey === 'branch') label = lookups.branches.find(x => String(x.id) === String(id))?.title || id;
                if (tabKey === 'group' || tabKey === 'col' || tabKey === 'moe') label = lookups.accMap[id]?.title || id;
                if (tabKey === 'detail') label = lookups.allDetailInstances.find(x => String(x.id) === String(id))?.title || id;
                if (tabKey === 'currency') label = lookups.currencies.find(x => x.code === String(id))?.title || id;
                chips.push(`${tabSingular[tabKey]}: ${label}`);
            });
        });
        return chips.join(' | ');
    };

    const activeFiltersStr = renderActiveChips();

    // Print specific styling injection (A4 Portrait)
    const printStyles = `
        @media print {
            body * { visibility: hidden; }
            #print-area, #print-area * { visibility: visible; }
            #print-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; }
            .print-modal { position: static !important; width: 100% !important; background: white !important; }
            @page { size: A4 portrait; margin: 10mm; }
        }
    `;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t.print || 'چاپ گزارش'} size="full" className="print-modal p-0">
            <style>{printStyles}</style>
            <div className="flex h-[calc(100vh-100px)] w-full">
                
                {/* Sidebar Settings (Hidden in Print) */}
                <div className="w-72 bg-slate-50 border-r border-slate-200 p-4 flex flex-col gap-6 print:hidden overflow-y-auto shrink-0">
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3"><Settings size={16}/> تنظیمات گزارش</h3>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">تب گزارش‌گیری:</label>
                        <select className="w-full border border-slate-300 rounded bg-white h-9 px-2 outline-none text-xs" value={printTab} onChange={(e) => setPrintTab(e.target.value)}>
                            {tabs.map(tab => <option key={tab.id} value={tab.id}>{tab.label}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-2 block">ستون‌های نمایشی:</label>
                        <div className="flex flex-col gap-2 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                            {(() => {
                                let allCols = [];
                                if (printTab === 'transactions') {
                                    allCols = [
                                        { field: 'doc_no', header: t.colDocNo }, { field: 'date', header: t.colDate },
                                        { field: 'account', header: t.tabMoe }, { field: 'description', header: t.colDesc },
                                        { field: 'debit', header: t.colDebit }, { field: 'credit', header: t.colCredit },
                                        { field: 'balance', header: t.colBalance }, { field: 'nature', header: t.colNature }
                                    ];
                                } else {
                                    allCols = [
                                        { field: 'code', header: t.colCode }, { field: 'title', header: t.colTitle }
                                    ];
                                    if (printTab === 'detail') allCols.push({ field: 'extra', header: t.colDetailType });
                                    allCols.push(
                                        { field: 'debit', header: t.colDebit }, { field: 'credit', header: t.colCredit },
                                        { field: 'balanceDebit', header: t.colBalanceDebit }, { field: 'balanceCredit', header: t.colBalanceCredit },
                                        { field: 'nature', header: t.colNature }
                                    );
                                }
                                return allCols.map(c => (
                                    <button key={c.field} onClick={() => toggleColumn(c.field)} className="flex items-center justify-start gap-2 text-xs text-slate-700 outline-none">
                                        {hiddenColumns[c.field] ? <Square size={14} className="text-slate-300"/> : <CheckSquare size={14} className="text-indigo-600"/>}
                                        {c.header}
                                    </button>
                                ));
                            })()}
                        </div>
                    </div>

                    <div className="mt-auto flex flex-col gap-2">
                        <Button variant="primary" icon={Printer} onClick={handlePrint} className="w-full justify-center h-10">{t.print || 'چاپ'}</Button>
                        <Button variant="ghost" onClick={onClose} className="w-full justify-center h-10">{t.cancel || 'انصراف'}</Button>
                    </div>
                </div>

                {/* Preview Area (A4 Portrait format) */}
                <div className="flex-1 bg-slate-200 p-8 overflow-y-auto print:p-0 print:bg-white flex justify-center" dir={isRtl ? 'rtl' : 'ltr'}>
                    <div id="print-area" className="bg-white shadow-lg print:shadow-none w-full max-w-[210mm] min-h-[297mm] p-[10mm]">
                        
                        {/* Print Header */}
                        <div className="border-b-2 border-slate-800 pb-4 mb-4">
                            <div className="flex justify-between items-start">
                                {/* Right Side (Ledger, Year, Dates) */}
                                <div className="w-1/3 text-xs text-slate-700 leading-relaxed flex flex-col gap-1.5 text-right">
                                    <div><strong>دفتر مالی:</strong> {ledger}</div>
                                    <div><strong>سال مالی:</strong> {fYear}</div>
                                    {mainFilters.fromDate && <div><strong>از تاریخ:</strong> <span className="dir-ltr inline-block">{mainFilters.fromDate}</span></div>}
                                    {mainFilters.toDate && <div><strong>تا تاریخ:</strong> <span className="dir-ltr inline-block">{mainFilters.toDate}</span></div>}
                                </div>
                                
                                {/* Center */}
                                <div className="w-1/3 text-center">
                                    <h1 className="text-xl font-black text-slate-900 mb-1">{repName}</h1>
                                    <h2 className="text-sm font-bold text-slate-600">{orgName}</h2>
                                    <div className="mt-2 text-xs font-bold text-indigo-700 bg-indigo-50 inline-block px-3 py-1 rounded-full border border-indigo-100">
                                        سطح گزارش: {tabs.find(t=>t.id === printTab)?.label}
                                    </div>
                                </div>

                                {/* Left Side (User, Date, Items Count, Currency) */}
                                <div className="w-1/3 text-xs text-slate-700 leading-relaxed flex flex-col gap-1.5 items-end text-left">
                                    <div><strong>کاربر:</strong> {userName}</div>
                                    <div><strong>تاریخ گزارش:</strong> <span className="dir-ltr inline-block">{repDate}</span></div>
                                    <div><strong>تعداد اقلام:</strong> {reportData.length}</div>
                                    <div><strong>ارز گزارش:</strong> {repCurrencyStr}</div>
                                </div>
                            </div>
                        </div>

                        {/* Applied Filters */}
                        {activeFiltersStr && (
                            <div className="mb-4 text-[10px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-200 leading-relaxed text-right">
                                <strong className="text-slate-800">فیلترهای اعمال شده:</strong> {activeFiltersStr}
                            </div>
                        )}

                        {/* Print Table */}
                        <table className="w-full text-[10px] text-right border-collapse border border-slate-300">
                            <thead>
                                <tr className="bg-slate-100">
                                    {finalCols.map((c, i) => (
                                        <th key={i} className="border border-slate-300 p-2 font-bold text-slate-700 text-center">{c.header}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.map((row, idx) => (
                                    <tr key={idx} className="border-b border-slate-200 break-inside-avoid hover:bg-slate-50">
                                        {finalCols.map((c, i) => {
                                            const isAmount = ['debit', 'credit', 'balanceDebit', 'balanceCredit', 'balance'].includes(c.field);
                                            const alignClass = isAmount ? 'text-left dir-ltr font-mono' : (c.field === 'code' || c.field === 'doc_no' || c.field === 'date' || c.field === 'nature' ? 'text-center' : '');
                                            let val = row[c.field] || '-';
                                            if (isAmount) val = parseNumber(val) > 0 ? formatNumber(val) : '';
                                            return <td key={i} className={`border border-slate-300 p-1.5 text-slate-700 ${alignClass}`}>{val}</td>;
                                        })}
                                    </tr>
                                ))}

                                {/* Print Footer Sums */}
                                {reportData.length > 0 && (
                                    <tr className="bg-slate-100 font-bold break-inside-avoid">
                                        {finalCols.map((c, i) => {
                                            if (i === 0) return <td key={i} colSpan={finalCols.length > 5 ? 2 : 1} className="border border-slate-300 p-2 text-left">{t.sum}:</td>;
                                            if (i === 1 && finalCols.length > 5) return null; 
                                            
                                            if (c.field === 'debit') return <td key={i} className="border border-slate-300 p-1.5 text-indigo-700 dir-ltr text-left font-mono">{formatNumber(totalSums.debit)}</td>;
                                            if (c.field === 'credit') return <td key={i} className="border border-slate-300 p-1.5 text-indigo-700 dir-ltr text-left font-mono">{formatNumber(totalSums.credit)}</td>;
                                            if (c.field === 'balanceDebit' && printTab !== 'transactions') return <td key={i} className="border border-slate-300 p-1.5 text-emerald-700 dir-ltr text-left font-mono">{formatNumber(totalSums.balDebit)}</td>;
                                            if (c.field === 'balanceCredit' && printTab !== 'transactions') return <td key={i} className="border border-slate-300 p-1.5 text-rose-700 dir-ltr text-left font-mono">{formatNumber(totalSums.balCredit)}</td>;
                                            
                                            return <td key={i} className="border border-slate-300 p-1.5"></td>;
                                        })}
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        
                        {reportData.length === 0 && (
                            <div className="text-center py-10 text-slate-400 font-bold">{t.noData}</div>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
};

window.AccountReviewPrint = AccountReviewPrint;
export default AccountReviewPrint;
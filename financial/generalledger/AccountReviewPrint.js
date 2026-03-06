/* Filename: financial/generalledger/AccountReviewPrint.js */
import React from 'react';
import { Printer } from 'lucide-react';

const AccountReviewPrint = ({ isOpen, onClose, data, columns, totalSums, activeTab, t, isRtl }) => {
    const UI = window.UI || {};
    const { Modal, Button } = UI;
    const { formatNumber } = UI.utils || { formatNumber: (v) => v };

    if (!isOpen) return null;

    const handlePrint = () => {
        window.print();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t.print || 'چاپ'} size="xl" className="print-modal">
            <div className="flex flex-col h-[80vh] bg-white">
                <div className="flex justify-between items-center p-4 border-b border-slate-200 shrink-0 print:hidden">
                    <Button variant="primary" icon={Printer} onClick={handlePrint}>{t.print || 'چاپ'}</Button>
                    <Button variant="ghost" onClick={onClose}>{t.cancel || 'انصراف'}</Button>
                </div>
                
                <div className="flex-1 overflow-auto p-8 print:p-0 print:overflow-visible" id="print-area">
                    <div className="text-center mb-6">
                        <h2 className="text-xl font-bold text-slate-800">{t.title}</h2>
                        <p className="text-sm text-slate-500 mt-1">{t[activeTab] || activeTab}</p>
                    </div>
                    
                    <table className="w-full text-xs text-right border-collapse border border-slate-300" dir={isRtl ? 'rtl' : 'ltr'}>
                        <thead>
                            <tr className="bg-slate-100">
                                {columns.map((c, i) => {
                                    if(c.field === 'actions') return null; // Hide actions column in print
                                    return <th key={i} className="border border-slate-300 p-2 font-bold text-slate-700">{c.header}</th>
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, idx) => (
                                <tr key={idx} className="border-b border-slate-200 break-inside-avoid">
                                    {columns.map((c, i) => {
                                        if(c.field === 'actions') return null;
                                        const val = c.render ? c.render(row) : row[c.field];
                                        return <td key={i} className="border border-slate-300 p-2 text-slate-700">{val}</td>;
                                    })}
                                </tr>
                            ))}
                            <tr className="bg-slate-100 font-bold break-inside-avoid">
                                <td colSpan={columns.length > 5 ? 2 : 1} className="border border-slate-300 p-2 text-left">{t.sum}:</td>
                                {columns.slice(columns.length > 5 ? 2 : 1).map((c, i) => {
                                    if (c.field === 'actions') return null;
                                    if (c.field === 'debit') return <td key={i} className="border border-slate-300 p-2 text-indigo-700 dir-ltr">{formatNumber(totalSums.debit)}</td>;
                                    if (c.field === 'credit') return <td key={i} className="border border-slate-300 p-2 text-indigo-700 dir-ltr">{formatNumber(totalSums.credit)}</td>;
                                    if (c.field === 'balanceDebit' && activeTab !== 'transactions') return <td key={i} className="border border-slate-300 p-2 text-emerald-700 dir-ltr">{formatNumber(totalSums.balDebit)}</td>;
                                    if (c.field === 'balanceCredit' && activeTab !== 'transactions') return <td key={i} className="border border-slate-300 p-2 text-rose-700 dir-ltr">{formatNumber(totalSums.balCredit)}</td>;
                                    return <td key={i} className="border border-slate-300 p-2"></td>;
                                })}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </Modal>
    );
};

window.AccountReviewPrint = AccountReviewPrint;
export default AccountReviewPrint;
/* Filename: financial/generalledger/AccountReviewVoucherModal.js */
import React from 'react';
import { FileWarning } from 'lucide-react';

const AccountReviewVoucherModal = ({ isOpen, voucherId, contextVals, lookups, language, onClose, t }) => {
    const UI = window.UI || {};
    const { Button } = UI;

    if (!isOpen || !voucherId) return null;

    // Inject permissions dynamically so VoucherForm doesn't crash in view mode
    const safeLookups = {
        ...lookups,
        permissions: lookups.permissions || { actions: ['view', 'print', 'attach'], allowed_branches: [], allowed_ledgers: [] }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 md:p-8 overflow-hidden">
            <div className="bg-white w-full h-full rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex-1 overflow-hidden relative">
                    {window.VoucherForm ? (
                        <window.VoucherForm 
                            voucherId={voucherId} 
                            isCopy={false} 
                            contextVals={contextVals} 
                            lookups={safeLookups} 
                            language={language}
                            onClose={onClose} 
                        />
                    ) : (
                        <div className="p-10 flex flex-col items-center justify-center text-slate-500 h-full">
                            <FileWarning size={48} className="mb-4 text-amber-400" />
                            <p>کامپوننت VoucherForm در سیستم بارگذاری نشده است.</p>
                            <Button variant="outline" className="mt-4" onClick={onClose}>{t.cancel || 'بستن'}</Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

window.AccountReviewVoucherModal = AccountReviewVoucherModal;
export default AccountReviewVoucherModal;
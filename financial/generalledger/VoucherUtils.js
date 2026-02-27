/* Filename: financial/generalledger/VoucherUtils.js */
import React from 'react';

export const localTranslations = {
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
    amount: 'Voucher Amount',
    actions: 'Actions',
    edit: 'Edit',
    delete: 'Delete',
    print: 'Print',
    printVoucher: 'Print Voucher',
    attachments: 'Attachments',
    branch: 'Branch',
    selectBranch: 'Select Branch',
    branchReqError: 'Please select a branch.',
    fiscalYear: 'Fiscal Year',
    ledger: 'Ledger',
    subsidiaryNumber: 'Subsidiary No.',
    items: 'Voucher Items',
    addRow: 'Add Item',
    row: 'Row',
    account: 'Account',
    detail: 'Detail',
    debit: 'Debit',
    credit: 'Credit',
    currency: 'Currency',
    balance: 'Balance',
    saveDraft: 'Save Draft',
    saveTemp: 'Save Temporary',
    backToList: 'Back to List',
    confirmDelete: 'Are you sure you want to delete this voucher?',
    statusDraft: 'Draft',
    statusTemporary: 'Temporary',
    statusReviewed: 'Reviewed',
    statusFinal: 'Final',
    general: 'General',
    trackingNumber: 'Tracking No.',
    trackingDate: 'Tracking Date',
    quantity: 'Qty',
    unbalancedError: 'Voucher is not balanced. Can only save as draft.',
    zeroAmountError: 'Total amount cannot be zero. Please enter debit or credit values.',
    dualEntryError: 'A single row cannot have both debit and credit values.',
    reqFields: 'Description and Account are required for all items.',
    globalFiltersTitle: 'Global System Context',
    searchAccount: 'Search account code or title...',
    searchDetail: 'Search detail...',
    copyFromAbove: 'Copy from above',
    trackingReqError: 'Tracking Number and Tracking Date are required for account in row',
    qtyReqError: 'Quantity is required for account in row',
    dailyNumber: 'Daily No.',
    crossReference: 'Cross Ref.',
    referenceNumber: 'Reference No.',
    headerInfo: 'Voucher Header',
    noDetail: 'No Detail',
    searchPlaceholder: 'Search...',
    notFound: 'No matches found',
    detailRequiredError: 'Please select detail for "{type}" in row {row}.',
    subDupError: 'Subsidiary number is duplicate in this fiscal year.',
    fromDate: 'From Date',
    toDate: 'To Date',
    all: 'All',
    makeTemporary: 'Change to Temporary',
    makeDraft: 'Change to Draft',
    noPeriodsFound: 'No fiscal periods defined for this fiscal year.',
    dateNotInPeriods: 'Voucher date does not fall within any period of this fiscal year.',
    periodClosed: 'The fiscal period for this date is closed and you do not have permission to edit/save.',
    selectedItems: '{count} items selected',
    currencyConversions: 'Currency Conversions',
    opCurrency: 'Operating Currency',
    rep1Currency: 'Reporting Currency 1',
    rep2Currency: 'Reporting Currency 2',
    exchangeRate: 'Exchange Rate',
    reverseCalc: 'Reverse Calculation',
    convertedAmount: 'Final Converted Amount',
    baseAmount: 'Base Amount',
    duplicateRowError: 'Row {row} is an exact duplicate of another row. Please modify at least one field.',
    currencyMandatoryError: 'Currency conversions are mandatory for the account in row {row}.',
    base: 'Base',
    copyRow: 'Copy Row',
    summary: 'Summary',
    copyVoucher: 'Copy Voucher',
    balanced: 'Balanced',
    unbalanced: 'Unbalanced',
    summaryBase: 'Base',
    summaryOp: 'OP Cur',
    summaryRep1: 'Rep 1 Cur',
    summaryRep2: 'Rep 2 Cur',
    downloadTemplate: 'Download CSV Template',
    importCSV: 'Import CSV',
    importSuccess: 'Import completed successfully.',
    importError: 'Error importing data. Please check the file format.',
    emptyFile: 'The selected file is empty or invalid.',
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
    totalDebit: 'بدهکار',
    totalCredit: 'بستانکار',
    amount: 'مبلغ سند',
    actions: 'عملیات',
    edit: 'ویرایش',
    delete: 'حذف',
    print: 'چاپ',
    printVoucher: 'چاپ سند حسابداری',
    attachments: 'اسناد مثبته',
    branch: 'شعبه',
    selectBranch: 'انتخاب شعبه',
    branchReqError: 'لطفاً شعبه را انتخاب کنید.',
    fiscalYear: 'سال مالی',
    ledger: 'دفتر کل',
    subsidiaryNumber: 'شماره فرعی',
    items: 'اقلام سند',
    addRow: 'ردیف جدید',
    row: 'ردیف',
    account: 'کد و شرح معین',
    detail: 'تفصیل',
    debit: 'بدهکار',
    credit: 'بستانکار',
    currency: 'ارز',
    balance: 'تراز کردن',
    saveDraft: 'ذخیره یادداشت',
    saveTemp: 'ذخیره موقت',
    backToList: 'بازگشت به فهرست',
    confirmDelete: 'آیا از حذف این سند اطمینان دارید؟',
    statusDraft: 'یادداشت',
    statusTemporary: 'موقت',
    statusReviewed: 'بررسی شده',
    statusFinal: 'قطعی شده',
    general: 'عمومی',
    trackingNumber: 'شماره پیگیری',
    trackingDate: 'تاریخ پیگیری',
    quantity: 'مقدار',
    unbalancedError: 'سند بالانس نیست و فقط به عنوان یادداشت قابل ذخیره است.',
    zeroAmountError: 'مبلغ کل سند نمی‌تواند صفر باشد. لطفاً مقادیر بدهکار یا بستانکار را وارد کنید.',
    dualEntryError: 'یک ردیف نمی‌تواند همزمان هم بدهکار و هم بستانکار باشد.',
    reqFields: 'شرح و حساب معین برای تمامی اقلام اجباری است.',
    globalFiltersTitle: 'فیلترهای عمومی سیستم',
    searchAccount: 'جستجوی کد یا عنوان معین...',
    searchDetail: 'جستجوی تفصیل...',
    copyFromAbove: 'کپی از ردیف بالا',
    trackingReqError: 'شماره و تاریخ پیگیری برای معین در ردیف زیر الزامی است:',
    qtyReqError: 'مقدار برای معین در ردیف زیر الزامی است:',
    dailyNumber: 'شماره روزانه',
    crossReference: 'شماره عطف',
    referenceNumber: 'شماره ارجاع',
    headerInfo: 'اطلاعات سربرگ سند',
    noDetail: 'بدون تفصیل',
    searchPlaceholder: 'جستجو...',
    notFound: 'موردی یافت نشد',
    detailRequiredError: 'لطفاً تفصیل مربوط به "{type}" را در ردیف {row} مشخص کنید.',
    subDupError: 'شماره فرعی وارد شده در این سال مالی تکراری است.',
    fromDate: 'از تاریخ',
    toDate: 'تا تاریخ',
    all: 'همه',
    makeTemporary: 'تبدیل به موقت',
    makeDraft: 'تبدیل به یادداشت',
    noPeriodsFound: 'دوره‌های مالی برای این سال تعریف نشده است.',
    dateNotInPeriods: 'تاریخ سند در محدوده دوره‌های این سال مالی نیست.',
    periodClosed: 'دوره مالی مربوط به این تاریخ بسته است و شما مجوز ثبت/ویرایش ندارید.',
    selectedItems: '{count} مورد انتخاب شده',
    currencyConversions: 'تبدیلات ارزی قلم سند',
    opCurrency: 'ارز عملیاتی',
    rep1Currency: 'ارز گزارشگری ۱',
    rep2Currency: 'ارز گزارشگری ۲',
    exchangeRate: 'نرخ تبدیل',
    reverseCalc: 'محاسبه معکوس',
    convertedAmount: 'مبلغ نهایی (محاسبه شده)',
    baseAmount: 'مبلغ مبنا',
    duplicateRowError: 'ردیف {row} دقیقاً مشابه یک ردیف دیگر است. لطفاً حداقل یک فیلد را تغییر دهید.',
    currencyMandatoryError: 'ورود اطلاعات تبدیلات ارزی برای معین ردیف {row} اجباری است.',
    base: 'مبنا',
    copyRow: 'کپی ردیف',
    summary: 'خلاصه سند',
    copyVoucher: 'کپی سند',
    balanced: 'تراز',
    unbalanced: 'اختلاف',
    summaryBase: 'ارز مبنا',
    summaryOp: 'عملیاتی',
    summaryRep1: 'گزارشگری ۱',
    summaryRep2: 'گزارشگری ۲',
    downloadTemplate: 'دانلود نمونه فایل اکسل',
    importCSV: 'ورود اطلاعات از اکسل',
    importSuccess: 'ورود اطلاعات با موفقیت انجام شد.',
    importError: 'خطا در ورود اطلاعات. لطفاً فرمت فایل را بررسی کنید.',
    emptyFile: 'فایل انتخاب شده خالی یا نامعتبر است.',
  }
};

export const getStatusBadge = (status, t) => {
    const config = {
        'draft': { label: t.statusDraft, bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
        'temporary': { label: t.statusTemporary, bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
        'reviewed': { label: t.statusReviewed, bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
        'final': { label: t.statusFinal, bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    };
    const c = config[status] || { label: status, bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };
    return <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${c.bg} ${c.text} ${c.border}`}>{c.label}</span>;
};

export const calcConv = (amount, rate, isReverse) => {
    if (!amount || !rate) return 0;
    const numAmt = parseFloat(amount);
    const numRate = parseFloat(rate);
    if (isNaN(numAmt) || isNaN(numRate) || numRate === 0) return 0;
    return isReverse ? (numAmt / numRate) : (numAmt * numRate);
};

export const csvToArray = (text) => {
    let p = '', row = [''], ret = [row], i = 0, r = 0, s = !0, l;
    for (l of text) {
        if ('"' === l) {
            if (s && l === p) row[i] += l;
            s = !s;
        } else if (',' === l && s) l = row[++i] = '';
        else if ('\n' === l && s) {
            if ('\r' === p) row[i] = row[i].slice(0, -1);
            row = ret[++r] = [l = '']; i = 0;
        } else row[i] += l;
        p = l;
    }
    return ret.filter(r => r.length > 1 || r[0] !== '');
};

export const fetchAutoNumbers = async (date, ledgerId, fyId, branchId, supabase) => {
    let nextDaily = 1;
    let nextCross = 1;
    let nextVoucher = '';
    let config = null;

    if (date) {
        const { data } = await supabase.schema('gl').from('vouchers').select('daily_number').eq('voucher_date', date).order('daily_number', { ascending: false }).limit(1);
        if (data && data.length > 0 && data[0].daily_number) nextDaily = Number(data[0].daily_number) + 1;
    }

    if (fyId && ledgerId) {
        const { data } = await supabase.schema('gl').from('vouchers').select('cross_reference').eq('fiscal_period_id', fyId).eq('ledger_id', ledgerId).order('cross_reference', { ascending: false }).limit(1);
        if (data && data.length > 0 && data[0].cross_reference) nextCross = Number(data[0].cross_reference) + 1;
    }

    if (ledgerId) {
        const { data } = await supabase.schema('gl').from('ledgers').select('metadata').eq('id', ledgerId).single();
        if (data) {
            const meta = (typeof data.metadata === 'string' ? JSON.parse(data.metadata) : data.metadata) || {};
            config = { metadata: meta };
            
            const scope = meta.uniquenessScope || 'ledger';
            const resetYear = meta.resetYear !== false; 
            const lastNums = meta.lastNumbers || {};

            let lastVoucherNum = 0;

            if (scope === 'none') {
                nextVoucher = ''; 
            } else if (scope === 'ledger') {
                if (resetYear) {
                    lastVoucherNum = lastNums[fyId] || 0;
                } else {
                    lastVoucherNum = typeof lastNums === 'object' ? (lastNums.global || lastNums.ledger || 0) : (isNaN(lastNums) ? 0 : Number(lastNums));
                }
                nextVoucher = String(Number(lastVoucherNum) + 1);
            } else if (scope === 'branch' && branchId) {
                if (resetYear) {
                    lastVoucherNum = (lastNums[fyId] && lastNums[fyId][branchId]) ? lastNums[fyId][branchId] : 0;
                } else {
                    lastVoucherNum = lastNums[branchId] || 0;
                }
                nextVoucher = String(Number(lastVoucherNum) + 1);
            } else {
                nextVoucher = String(nextCross);
            }
        }
    }

    return { nextDaily, nextCross, nextVoucher, config };
};

export const validateFiscalPeriod = async (date, fyId, supabase, t) => {
    try {
        const { data: periods, error: pError } = await supabase.schema('gl').from('fiscal_periods').select('*').eq('year_id', fyId);
        if (pError) throw pError;
        
        if (!periods || periods.length === 0) return { valid: false, msg: t.noPeriodsFound };

        const period = periods.find(p => date >= p.start_date && date <= p.end_date);
        if (!period) return { valid: false, msg: t.dateNotInPeriods };

        if (period.status === 'open') return { valid: true };

        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;
        if (userId) {
            const { data: exc, error: eError } = await supabase.schema('gl').from('fiscal_period_exceptions')
                .select('*')
                .eq('period_id', period.id)
                .eq('user_id', userId);
                
            if (!eError && exc && exc.length > 0) {
                const allowedStatuses = exc[0].allowed_statuses || [];
                if (allowedStatuses.includes(period.status)) {
                    return { valid: true };
                }
            }
        }

        return { valid: false, msg: t.periodClosed };
    } catch (err) {
        console.error('Error validating period:', err);
        return { valid: false, msg: 'Error validating fiscal period.' };
    }
};

export const generateCSVTemplate = (isRtl) => {
    const header = isRtl 
        ? "شناسه گروه (برای اقلام یک سند),تاریخ,شماره سند,شماره روزانه,شرح سربرگ,کد معین,بدهکار,بستانکار,شرح قلم,ارز\n"
        : "Group_ID,Date,Voucher_Number,Daily_Number,Header_Description,Account_Code,Debit,Credit,Item_Description,Currency_Code\n";
    const sample = isRtl
        ? "1,2025-10-10,,,سند آزمایشی,1101,1000,0,بابت خرید,IRR\n1,2025-10-10,,,سند آزمایشی,2101,0,1000,بابت خرید,IRR\n"
        : "1,2025-10-10,,,Test Voucher,1101,1000,0,For Purchase,USD\n1,2025-10-10,,,Test Voucher,2101,0,1000,For Purchase,USD\n";
    
    const blob = new Blob(['\ufeff' + header + sample], { type: 'text/csv;charset=utf-8;' }); 
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Voucher_Import_Template.csv`;
    a.click();
    URL.revokeObjectURL(url);
};

export const processCSVImport = async (file, contextVals, lookups, supabase, t) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const text = event.target.result;
                const rows = csvToArray(text);
                if (rows.length < 2) throw new Error(t.emptyFile);

                const { data: authData } = await supabase.auth.getUser();
                const currentUserId = authData?.user?.id || null;
                const defaultBranch = lookups.branches.find(b => b.is_default) || lookups.branches[0];
                const branchId = defaultBranch?.id;

                if (!contextVals.fiscal_year_id || !contextVals.ledger_id) {
                    throw new Error(t.importError + ' - Missing fiscal year or ledger.');
                }

                const groups = {};
                for (let i = 1; i < rows.length; i++) {
                    const row = rows[i];
                    if (row.length < 10) continue;
                    const groupId = row[0]?.trim();
                    if (!groupId) continue;
                    
                    if (!groups[groupId]) groups[groupId] = [];
                    groups[groupId].push({
                        date: row[1]?.trim(),
                        voucherNumber: row[2]?.trim(),
                        dailyNumber: row[3]?.trim(),
                        headerDesc: row[4]?.trim(),
                        accountCode: row[5]?.trim(),
                        debit: window.UI?.utils?.parseNumber(row[6]) || parseFloat(row[6]) || 0,
                        credit: window.UI?.utils?.parseNumber(row[7]) || parseFloat(row[7]) || 0,
                        itemDesc: row[8]?.trim(),
                        currency: row[9]?.trim()
                    });
                }

                const accountMap = new Map();
                lookups.accounts.forEach(a => accountMap.set(a.full_code, a));

                for (const [groupId, groupRows] of Object.entries(groups)) {
                    const firstRow = groupRows[0];
                    const voucherDate = firstRow.date || new Date().toISOString().split('T')[0];
                    
                    let voucherNumber = firstRow.voucherNumber;
                    let dailyNumber = firstRow.dailyNumber;
                    let crossRef = '';

                    const { nextDaily, nextCross, nextVoucher, config } = await fetchAutoNumbers(voucherDate, contextVals.ledger_id, contextVals.fiscal_year_id, branchId, supabase);
                    
                    if (!voucherNumber) voucherNumber = nextVoucher;
                    if (!dailyNumber) dailyNumber = nextDaily;
                    crossRef = nextCross;

                    let totalDebit = 0;
                    let totalCredit = 0;
                    groupRows.forEach(r => {
                        totalDebit += r.debit;
                        totalCredit += r.credit;
                    });

                    const voucherData = {
                        voucher_date: voucherDate,
                        voucher_type: lookups.docTypes.length > 0 ? lookups.docTypes[0].code : 'sys_general',
                        status: 'draft',
                        description: firstRow.headerDesc || '',
                        voucher_number: voucherNumber,
                        daily_number: dailyNumber,
                        cross_reference: crossRef,
                        fiscal_period_id: contextVals.fiscal_year_id,
                        ledger_id: contextVals.ledger_id,
                        branch_id: branchId,
                        total_debit: totalDebit,
                        total_credit: totalCredit,
                        created_by: currentUserId
                    };

                    const { data: vData, error: vError } = await supabase.schema('gl').from('vouchers').insert([voucherData]).select().single();
                    if (vError) throw vError;

                    const savedVoucherId = vData.id;

                    if (config && config.metadata && config.metadata.uniquenessScope && config.metadata.uniquenessScope !== 'none') {
                        const scope = config.metadata.uniquenessScope;
                        const resetYear = config.metadata.resetYear !== false;
                        let lastNums = config.metadata.lastNumbers || {};
                        const fyId = contextVals.fiscal_year_id;
                        const bId = branchId;
                        const savedVoucherNum = Number(voucherNumber); 

                        if (scope === 'ledger') {
                            if (resetYear) lastNums[fyId] = savedVoucherNum;
                            else lastNums.global = savedVoucherNum;
                        } else if (scope === 'branch') {
                            if (resetYear) {
                                if (!lastNums[fyId]) lastNums[fyId] = {};
                                lastNums[fyId][bId] = savedVoucherNum;
                            } else {
                                lastNums[bId] = savedVoucherNum;
                            }
                        }

                        const { data: latestLedger } = await supabase.schema('gl').from('ledgers').select('metadata').eq('id', contextVals.ledger_id).single();
                        if (latestLedger) {
                           const latestMeta = (typeof latestLedger.metadata === 'string' ? JSON.parse(latestLedger.metadata) : latestLedger.metadata) || {};
                           await supabase.schema('gl').from('ledgers').update({
                               metadata: { ...latestMeta, lastNumbers: lastNums }
                           }).eq('id', contextVals.ledger_id);
                        }
                    }

                    const itemsToSave = groupRows.map((item, index) => {
                        const acc = accountMap.get(item.accountCode);
                        let itemCurrency = item.currency;
                        if (!itemCurrency && acc && acc.metadata) {
                            const meta = typeof acc.metadata === 'string' ? JSON.parse(acc.metadata) : acc.metadata;
                            if (meta.currencyFeature && meta.currency_code) {
                                 itemCurrency = meta.currency_code;
                            }
                        }
                        if (!itemCurrency) {
                            const ledger = lookups.ledgers.find(l => String(l.id) === String(contextVals.ledger_id));
                            itemCurrency = ledger?.currency || '';
                        }

                        return {
                            voucher_id: savedVoucherId,
                            row_number: index + 1,
                            account_id: acc ? acc.id : null,
                            debit: item.debit,
                            credit: item.credit,
                            description: item.itemDesc || firstRow.headerDesc || '',
                            details: { currency_code: itemCurrency, selected_details: {} },
                            op_rate: 1, op_is_reverse: false, op_debit: item.debit, op_credit: item.credit,
                            rep1_rate: 1, rep1_is_reverse: false, rep1_debit: item.debit, rep1_credit: item.credit,
                            rep2_rate: 1, rep2_is_reverse: false, rep2_debit: item.debit, rep2_credit: item.credit
                        };
                    });

                    if (itemsToSave.length > 0) {
                        const { error: itemsError } = await supabase.schema('gl').from('voucher_items').insert(itemsToSave);
                        if (itemsError) throw itemsError;
                    }
                }
                resolve();
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = () => reject(new Error('File reading error'));
        reader.readAsText(file, 'UTF-8');
    });
};
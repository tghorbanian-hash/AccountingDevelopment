export const glData = {
    ledgers: [
        { 
            id: 1, 
            code: '100', 
            title: 'دفتر کل مرکزی', 
            titleEn: 'Central General Ledger', 
            status: 'active', 
            isMain: true, 
            accountStructureId: 1, 
            currencyId: 1 
        }
    ],
    accountStructures: [
        { id: 1, title: 'ساختار استاندارد حسابداری', titleEn: 'Standard Accounting Structure' },
        { id: 2, title: 'ساختار پروژه‌محور', titleEn: 'Project-based Structure' },
        { id: 3, title: 'ساختار دولتی', titleEn: 'Governmental Structure' }
    ],
    translations: {
        financial: { fa: 'مالی', en: 'Financial' },
        generalLedger: { fa: 'دفتر کل', en: 'General Ledger' },
        baseData: { fa: 'اطلاعات پایه', en: 'Base Data' },
        ledgerDefinition: { fa: 'تعریف دفاتر', en: 'Ledger Definition' },
        ledgerCode: { fa: 'کد دفتر', en: 'Ledger Code' },
        ledgerTitle: { fa: 'عنوان دفتر', en: 'Ledger Title' },
        status: { fa: 'وضعیت', en: 'Status' },
        active: { fa: 'فعال', en: 'Active' },
        inactive: { fa: 'غیرفعال', en: 'Inactive' },
        isMain: { fa: 'اصلی', en: 'Is Main' },
        yes: { fa: 'بله', en: 'Yes' },
        no: { fa: 'خیر', en: 'No' },
        accountStructure: { fa: 'ساختار حساب', en: 'Account Structure' },
        mainCurrency: { fa: 'ارز اصلی', en: 'Main Currency' },
        save: { fa: 'ذخیره', en: 'Save' },
        cancel: { fa: 'انصراف', en: 'Cancel' },
        edit: { fa: 'ویرایش', en: 'Edit' },
        delete: { fa: 'حذف', en: 'Delete' },
        actions: { fa: 'عملیات', en: 'Actions' },
        addLedger: { fa: 'افزودن دفتر', en: 'Add Ledger' },
        search: { fa: 'جستجو...', en: 'Search...' },
        confirmDelete: { fa: 'آیا از حذف این مورد اطمینان دارید؟', en: 'Are you sure you want to delete this item?' },
        successAdd: { fa: 'دفتر با موفقیت افزوده شد', en: 'Ledger added successfully' },
        successUpdate: { fa: 'دفتر با موفقیت ویرایش شد', en: 'Ledger updated successfully' },
        successDelete: { fa: 'دفتر با موفقیت حذف شد', en: 'Ledger deleted successfully' }
    }
};

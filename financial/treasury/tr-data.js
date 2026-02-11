/* Filename: financial/treasury/tr-data.js */

export const TR_MENU = {
  id: 'treasury', 
  label: { en: 'Treasury', fa: 'خزانه‌داری' },
  children: [
    {
      id: 'tr_settings',
      label: { en: 'Treasury Settings', fa: 'تنظیمات خزانه‌داری' },
      children: [
        { id: 'balance_control', label: { en: 'Balance Control', fa: 'کنترل مانده منابع' } }
      ]
    },
    {
      id: 'tr_base_info',
      label: { en: 'Base Information', fa: 'اطلاعات پایه' },
      children: [
        { id: 'banks', label: { en: 'Banks', fa: 'بانک‌ها' } },
        { id: 'acc_types', label: { en: 'Account Types', fa: 'انواع حساب‌های بانکی' } },
        { id: 'acc_setup', label: { en: 'Account Setup', fa: 'استقرار حساب‌ها' } },
        { id: 'safes', label: { en: 'Safes', fa: 'صندوق‌ها' } },
        { id: 'promissory', label: { en: 'Promissory Notes', fa: 'سفته‌ها' } },
        { id: 'cheque_types', label: { en: 'Cheque Types', fa: 'انواع چک' } },
        { id: 'petty_cashiers', label: { en: 'Petty Cashiers', fa: 'تنخواه دارها' } },
        { id: 'cheque_books', label: { en: 'Cheque Books', fa: 'دسته چک' } },
        { id: 'print_template', label: { en: 'Print Templates', fa: 'الگوی چاپ چک' } },
        { id: 'reasons', label: { en: 'Reasons/Descriptions', fa: 'بابت‌ها/ شرح‌ها' } },
        { id: 'blank_promissory', label: { en: 'Blank Promissory', fa: 'سفته سفید' } },
      ]
    },
    {
      id: 'tr_init',
      label: { en: 'Initial Operations', fa: 'عملیات ابتدای دوره/ سال' },
      children: [
        { id: 'ap_setup', label: { en: 'A/P Setup', fa: 'استقرار حساب‌های پرداختنی' } },
        { id: 'ar_setup', label: { en: 'A/R Setup', fa: 'استقرار اسناد دریافتنی' } },
        { id: 'opening_balance', label: { en: 'Opening Balance', fa: 'موجودی ابتدای دوره' } },
      ]
    },
    {
      id: 'tr_ops',
      label: { en: 'Receipt & Payment', fa: 'عملیات دریافت و پرداخت' },
      children: [
        { id: 'receipts', label: { en: 'Receipts', fa: 'دریافت‌ها' } },
        { id: 'payments', label: { en: 'پرداخت‌ها', fa: 'پرداخت‌ها' } },
        { id: 'transfers', label: { en: 'Transfers', fa: 'عملیات انتقال' } },
        { id: 'petty_summary', label: { en: 'Petty Cash Summary', fa: 'صورت خلاصه تنخواه' } },
        { id: 'batch_ops', label: { en: 'Batch Operations', fa: 'عملیات گروهی' } },
      ]
    },
    {
      id: 'tr_requests',
      label: { en: 'Request Management', fa: 'مدیریت درخواست‌ها' },
      children: [
        { id: 'payment_req', label: { en: 'Payment Requests', fa: 'درخواست پرداخت' } },
        { id: 'my_requests', label: { en: 'My Requests', fa: 'درخواست‌های من' } },
      ]
    },
    {
      id: 'tr_reports',
      label: { en: 'Reports & Analytics', fa: 'گزارش‌ها و تحلیل‌ها' },
      children: [
        { id: 'print_req', label: { en: 'Print Request', fa: 'چاپ درخواست' } },
        { id: 'print_cheque', label: { en: 'Print Cheque', fa: 'چاپ چک' } },
        { id: 'review_req', label: { en: 'Review Requests', fa: 'مرور درخواست‌ها' } },
        { id: 'review_rp', label: { en: 'Review R/P', fa: 'مرور دریافت/ پرداخت' } },
      ]
    }
  ]
};

export const TR_TRANS = {
  en: {},
  fa: {}
};

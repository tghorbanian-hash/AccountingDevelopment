/* Filename: components/financial/generalledger/gl-data.js */

import { BarChart3 } from 'lucide-react';

// 1. منوی اختصاصی دفتر کل و حسابداری
export const GL_MENU_ITEMS = {
  id: 'accounting', 
  label: { en: 'Accounting', fa: 'حسابداری و مالی' }, 
  icon: BarChart3,
  children: [
    { 
      id: 'gl', 
      label: { en: 'General Ledger', fa: 'دفتر کل' },
      children: [
        {
          id: 'gl_settings',
          label: { en: 'GL Settings', fa: 'تنظیمات دفتر کل' },
          children: [
            { id: 'auto_num', label: { en: 'Auto Numbering', fa: 'شماره‌گذاری اتوماتیک' } },
            { id: 'year_end_setup', label: { en: 'Year-end Settings', fa: 'تنظیمات عملیات پایان سال' } },
            { id: 'allowed_modules', label: { en: 'Allowed Modules', fa: 'ماژول‌های مجاز' } },
          ]
        },
        {
          id: 'gl_base_info',
          label: { en: 'Base Information', fa: 'اطلاعات پایه' },
          children: [
            { id: 'ledgers', label: { en: 'Ledgers', fa: 'دفاتر' } },
            { id: 'acc_structure', label: { en: 'Account Structure', fa: 'ساختار حساب' } },
            { id: 'details', label: { en: 'Details', fa: 'تفصیل‌ها' } },
            { id: 'fiscal_periods', label: { en: 'Fiscal Periods', fa: 'دوره‌های مالی' } },
            { id: 'doc_types', label: { en: 'Document Types', fa: 'انواع اسناد' } },
            { id: 'std_desc', label: { en: 'Standard Descriptions', fa: 'شرح‌های استاندارد' } },
          ]
        },
        {
          id: 'gl_docs',
          label: { en: 'Document Management', fa: 'مدیریت اسناد' },
          children: [
            { id: 'doc_list', label: { en: 'Document List', fa: 'فهرست اسناد' } },
            { id: 'doc_review', label: { en: 'Document Review', fa: 'بررسی اسناد' } },
            { id: 'doc_finalize', label: { en: 'Finalize Documents', fa: 'قطعی کردن اسناد' } },
          ]
        },
        {
          id: 'gl_reports',
          label: { en: 'Reports & Analytics', fa: 'گزارش‌ها و تحلیل‌ها' },
          children: [
            { id: 'print_doc', label: { en: 'Print Accounting Doc', fa: 'چاپ سند حسابداری' } },
            { id: 'acc_review', label: { en: 'Account Review', fa: 'مرور حساب‌ها' } },
          ]
        }
      ]
    },
    { 
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
    },
    { id: 'budgeting', label: { en: 'Budgeting', fa: 'بودجه‌ریزی' } },
  ]
};

// 2. ترجمه‌های اختصاصی دفتر کل
export const GL_TRANSLATIONS = {
  en: {
    acc_mgmt_title: "Accounting Document Management",
    acc_mgmt_subtitle: "List of all financial documents with search and batch operation capabilities",
    grid_title: "Document List",
    col_docNo: "Doc No",
    col_date: "Date",
    col_dept: "Department",
    col_desc: "Description",
    col_debtor: "Debtor",
    col_status: "Status",
    col_active: "Active",
    col_actions: "Actions",
    status_final: "Final",
    status_draft: "Draft",
    status_reviewed: "Reviewed",
    filter_fromDoc: "From Doc No",
    filter_toDoc: "To Doc No",
    filter_fromDate: "From Date",
    filter_toDate: "To Date",
    filter_status: "Document Status",
    filter_costCenter: "Cost Center",
    filter_subsidiary: "Subsidiary Account",
    filter_allStatus: "All Statuses",
    modal_newDoc: "New Document",
    modal_editDoc: "Edit Document",
    modal_warning: "Note: Changes to final documents require financial manager approval.",
    field_docType: "Document Type",
    field_general: "General",
    field_opening: "Opening",
    field_party: "Party",
    field_selectParty: "Select Person...",
    field_amount: "Document Amount",
    field_isActive: "Active Document",
  },
  fa: {
    acc_mgmt_title: "مدیریت اسناد حسابداری",
    acc_mgmt_subtitle: "لیست کلیه اسناد مالی با قابلیت جستجو و عملیات گروهی",
    grid_title: "لیست اسناد",
    col_docNo: "شماره سند",
    col_date: "تاریخ",
    col_dept: "دپارتمان",
    col_desc: "شرح سند",
    col_debtor: "بدهکار (ریال)",
    col_status: "وضعیت",
    col_active: "فعال",
    col_actions: "عملیات",
    status_final: "نهایی",
    status_draft: "پیش‌نویس",
    status_reviewed: "بررسی شده",
    filter_fromDoc: "از شماره سند",
    filter_toDoc: "تا شماره سند",
    filter_fromDate: "از تاریخ",
    filter_toDate: "تا تاریخ",
    filter_status: "وضعیت سند",
    filter_costCenter: "مرکز هزینه",
    filter_subsidiary: "معین",
    filter_allStatus: "همه وضعیت‌ها",
    modal_newDoc: "سند جدید",
    modal_editDoc: "ویرایش سند",
    modal_warning: "لطفاً دقت کنید: تغییرات در اسناد نهایی نیازمند تایید مدیر مالی می‌باشد.",
    field_docType: "نوع سند",
    field_general: "عمومی",
    field_opening: "افتتاحیه",
    field_party: "طرف حساب",
    field_selectParty: "انتخاب شخص...",
    field_amount: "مبلغ سند",
    field_isActive: "سند فعال باشد",
  }
};

// 3. تنظیمات پیش‌فرض (Schema) اختصاصی
export const GL_DEFAULT_SCHEMA = {
  moduleId: 'accounting',
  label: { en: 'Accounting & Finance', fa: 'حسابداری و مالی' },
  icon: BarChart3,
  groups: [
    {
      groupId: 'gl',
      label: { en: 'General Ledger', fa: 'دفتر کل' },
      fields: [
        { key: 'defaultDocType', label: { en: 'Default Document Type', fa: 'نوع سند پیش‌فرض' }, type: 'select', options: [{ value: 'general', label: { en: 'General', fa: 'عمومی' } }, { value: 'opening', label: { en: 'Opening', fa: 'افتتاحیه' } }, { value: 'closing', label: { en: 'Closing', fa: 'اختتامیه' } }] },
        { key: 'autoPost', label: { en: 'Auto Post Documents', fa: 'قطعی شدن خودکار اسناد' }, type: 'toggle' }
      ]
    },
    {
      groupId: 'treasury',
      label: { en: 'Treasury', fa: 'خزانه‌داری' },
      fields: [
        { key: 'paymentType', label: { en: 'Default Payment Type', fa: 'نوع پرداخت پیش‌فرض' }, type: 'select', options: [{ value: 'expense', label: { en: 'Expense', fa: 'هزینه' } }, { value: 'prepayment', label: { en: 'Prepayment', fa: 'پیش‌پرداخت' } }, { value: 'transfer', label: { en: 'Transfer', fa: 'انتقال' } }] },
        { key: 'defaultBank', label: { en: 'Default Bank Account', fa: 'حساب بانکی پیش‌فرض' }, type: 'select', options: [{ value: 'mellat', label: { en: 'Mellat Bank - Main', fa: 'بانک ملت - اصلی' } }, { value: 'pasargad', label: { en: 'Pasargad Bank', fa: 'بانک پاسارگاد' } }] }
      ]
    }
  ]
};

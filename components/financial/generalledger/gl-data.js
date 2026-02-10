/* Filename: components/financial/generalledger/gl-data.js */

import { BarChart3 } from 'lucide-react';

// 1. GL SPECIFIC MENU ITEMS
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
        // ... (Other Treasury items can be expanded later)
      ]
    },
    { id: 'budgeting', label: { en: 'Budgeting', fa: 'بودجه‌ریزی' } },
  ]
};

// 2. GL SPECIFIC TRANSLATIONS
export const GL_TRANSLATIONS = {
  en: {
    // Ledgers Form
    ledgers_title: "General Ledgers",
    ledgers_subtitle: "Define and manage system general ledgers",
    ledgers_new: "New Ledger",
    ledgers_edit: "Edit Ledger",
    
    // Fields
    gl_code: "Ledger Code",
    gl_title_field: "Ledger Title",
    gl_status: "Status",
    gl_is_main: "Is Main Ledger",
    gl_structure: "Account Structure",
    gl_currency: "Base Currency",
    
    // Values
    gl_main_yes: "Main",
    gl_main_no: "Subsidiary",
    
    // Mock Data Labels
    struct_std: "Standard Industrial",
    struct_service: "Service Based",
    struct_project: "Project Based",
  },
  fa: {
    // Ledgers Form
    ledgers_title: "دفاتر کل",
    ledgers_subtitle: "تعریف و مدیریت دفاتر کل سیستم",
    ledgers_new: "دفتر جدید",
    ledgers_edit: "ویرایش دفتر",

    // Fields
    gl_code: "کد دفتر",
    gl_title_field: "عنوان دفتر",
    gl_status: "وضعیت",
    gl_is_main: "دفتر اصلی",
    gl_structure: "ساختار حساب",
    gl_currency: "ارز اصلی",

    // Values
    gl_main_yes: "اصلی",
    gl_main_no: "فرعی",

    // Mock Data Labels
    struct_std: "استاندارد صنعتی",
    struct_service: "خدماتی",
    struct_project: "پروژه محور",
  }
};

// 3. GL DEFAULT SCHEMA (For future settings)
export const GL_DEFAULT_SCHEMA = {
  moduleId: 'accounting',
  label: { en: 'Accounting & Finance', fa: 'حسابداری و مالی' },
  icon: BarChart3,
  groups: [
    {
      groupId: 'gl',
      label: { en: 'General Ledger', fa: 'دفتر کل' },
      fields: [
        { key: 'defaultDocType', label: { en: 'Default Document Type', fa: 'نوع سند پیش‌فرض' }, type: 'select', options: [{ value: 'general', label: { en: 'General', fa: 'عمومی' } }, { value: 'opening', label: { en: 'Opening', fa: 'افتتاحیه' } }] },
      ]
    }
  ]
};

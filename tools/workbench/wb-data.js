
/* Filename: tools/workbench/wb-data.js */
import { Briefcase, Wallet, ArrowUpRight, ArrowDownLeft, UserCheck } from 'lucide-react';

export const WB_MENU = {
  id: 'workspace', 
  label: { en: 'Workspace', fa: 'میز کار' }, 
  icon: Briefcase,
  children: [
    { id: 'workspace_gen', label: { en: 'General Workspace', fa: 'میزکار عمومی' } },
    { id: 'workspace_spec', label: { en: 'Specific Workspace', fa: 'میزکار اختصاصی' } }
  ]
};

export const WB_MOCK_TRANSACTIONS = [
  { id: 1, title: { en: 'Monthly Server Hosting', fa: 'هزینه میزبانی سرور ماهانه' }, amount: 1200, type: 'expense', date: '2024-03-01', category: 'IT' },
  { id: 2, title: { en: 'Consultancy Fee', fa: 'هزینه مشاوره' }, amount: 4500, type: 'income', date: '2024-03-02', category: 'Service' },
  { id: 3, title: { en: 'Office Supplies', fa: 'لوازم اداری' }, amount: 350, type: 'expense', date: '2024-03-03', category: 'Admin' },
  { id: 4, title: { en: 'Client Payment', fa: 'پرداخت مشتری' }, amount: 12500, type: 'income', date: '2024-03-04', category: 'Sales' },
];

export const WB_MOCK_STATS = [
  { id: 1, label: { en: 'Total Balance', fa: 'موجودی کل' }, value: '$124,500.00', change: '+12.5%', icon: Wallet, color: 'text-blue-600' },
  { id: 2, label: { en: 'Monthly Revenue', fa: 'درآمد ماهانه' }, value: '$45,200.00', change: '+8.2%', icon: ArrowUpRight, color: 'text-green-600' },
  { id: 3, label: { en: 'Total Expenses', fa: 'مجموع هزینه‌ها' }, value: '$12,800.00', change: '-2.4%', icon: ArrowDownLeft, color: 'text-red-600' },
  { id: 4, label: { en: 'Active Accounts', fa: 'حساب‌های فعال' }, value: '18', change: '0', icon: UserCheck, color: 'text-purple-600' },
];

export const WB_TRANS = {
  en: {
    ws_title: "User Workspace",
    ws_subtitle: "Exchange & Accounting Management System",
    kpi_cash: "Cash & Bank Balance",
    kpi_receivable: "Accounts Receivable",
    kpi_payable: "Accounts Payable",
    kpi_profit: "Monthly Net Profit",
    btn_invoice: "+ Buy/Sell Currency",
    btn_check: "Receive Check",
    btn_payment_req: "Payment Request",
    btn_expense: "Record Expense",
    btn_account: "New Contact/Account",
    table_title: "Recent Transactions",
    th_id: "ID",
    th_date: "Date",
    th_desc: "Description",
    th_amount: "Amount",
    th_status: "Status",
    row1_desc: "USD Purchase - 5,000$",
    row2_desc: "Office Rent - Jan 2026",
    row3_desc: "EUR Sale - 2,200€",
    status_paid: "Paid",
    status_pending: "Pending",
    sidebar_title: "Critical Alerts",
    alert1_title: "Check Due Soon",
    alert1_sub: "Mellat Bank - Tomorrow",
    alert2_title: "Overdue Invoice",
    alert2_sub: "Client A - 10 Days Delay",
    alert3_title: "Credit Limit Warning",
    alert3_sub: "Exchange Partner B - Near Limit",
    mod_exp_title: "Record New Expense",
    mod_acc_title: "New Contact",
    lbl_category: "Category",
    lbl_amount: "Amount",
    opt_rent: "Rent",
    opt_salary: "Salary",
    btn_save_data: "Save Data",
    ph_name: "Contact Name",
    ph_phone: "Phone Number"
  },
  fa: {
    ws_title: "میز کار کاربر",
    ws_subtitle: "سیستم مدیریت حسابداری و صرافی",
    kpi_cash: "موجودی نقد و بانک",
    kpi_receivable: "مطالبات (بدهکاران)",
    kpi_payable: "بدهی‌ها (بستانکاران)",
    kpi_profit: "سود خالص ماهانه",
    btn_invoice: "+ خرید و فروش ارز",
    btn_check: "ثبت چک دریافتی",
    btn_payment_req: "درخواست پرداخت",
    btn_expense: "ثبت هزینه",
    btn_account: "تعریف طرف حساب",
    table_title: "آخرین تراکنش‌ها",
    th_id: "شناسه",
    th_date: "تاریخ",
    th_desc: "شرح",
    th_amount: "مبلغ",
    th_status: "وضعیت",
    row1_desc: "خرید دلار - ۵۰۰۰ واحد",
    row2_desc: "اجاره دفتر - ژانویه ۲۰۲۶",
    row3_desc: "فروش یورو - ۲۲۰۰ واحد",
    status_paid: "تسویه شده",
    status_pending: "در انتظار",
    sidebar_title: "هشدارهای حساس",
    alert1_title: "سررسید چک",
    alert1_sub: "بانک ملت - موعد فردا",
    alert2_title: "فاکتور معوقه",
    alert2_sub: "مشتری الف - ۱۰ روز تاخیر",
    alert3_title: "هشدار حد اعتبار",
    alert3_sub: "همکار صراف ب - نزدیک سقف",
    mod_exp_title: "ثبت هزینه جدید",
    mod_acc_title: "تعریف طرف حساب جدید",
    lbl_category: "دسته بندی",
    lbl_amount: "مبلغ",
    opt_rent: "اجاره",
    opt_salary: "حقوق",
    btn_save_data: "ذخیره اطلاعات",
    ph_name: "نام طرف حساب",
    ph_phone: "شماره تماس"
  }
};


/* Filename: financial/budgeting/bd-data.js */

export const BD_MENU = {
  id: 'budgeting', 
  label: { en: 'Budgeting', fa: 'بودجه‌ریزی' },
  children: [
      { id: 'budget_def', label: { en: 'Budget Definition', fa: 'تعریف بودجه' } },
      { id: 'budget_alloc', label: { en: 'Allocation', fa: 'تخصیص اعتبار' } },
      { id: 'budget_control', label: { en: 'Budget Control', fa: 'کنترل بودجه' } },
      { id: 'budget_reports', label: { en: 'Budget Reports', fa: 'گزارشات بودجه' } },
  ]
};

export const BD_TRANS = {
  en: {
    budgetAlloc: 'Budget Allocation',
  },
  fa: {
    budgetAlloc: 'توزیع بودجه',
  }
};


/* Filename: tools/reportbuilder/rep-data.js */
import { FileText } from 'lucide-react';

export const REP_MENU = {
  id: 'report_builder',
  label: { en: 'Report Builder', fa: 'گزارش ساز' },
  icon: FileText,
  children: [
      { id: 'my_reports', label: { en: 'My Reports', fa: 'گزارش‌های من' } },
      { id: 'new_report', label: { en: 'New Report', fa: 'گزارش جدید' } },
  ]
};

export const REP_TRANS = {
  en: {},
  fa: {}
};

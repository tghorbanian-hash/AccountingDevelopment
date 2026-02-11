/* Filename: tools/dashboard/dash-data.js */
import { LayoutDashboard } from 'lucide-react';

export const DASH_MENU = { 
  id: 'dashboards', 
  label: { en: 'Dashboards', fa: 'داشبوردها' }, 
  icon: LayoutDashboard,
  children: [
    { id: 'dashboards_gen', label: { en: 'General Dashboards', fa: 'داشبوردهای عمومی' } },
    { id: 'dashboards_spec', label: { en: 'Specific Dashboards', fa: 'داشبوردهای اختصاصی' } }
  ]
};

export const DASH_TRANS = {
  en: {},
  fa: {}
};

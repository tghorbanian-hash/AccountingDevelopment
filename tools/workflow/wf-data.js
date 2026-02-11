/* Filename: tools/workflow/wf-data.js */
import { GitBranch } from 'lucide-react';

export const WF_MENU = {
  id: 'workflow',
  label: { en: 'Workflow', fa: 'مدیریت گردش کار' },
  icon: GitBranch,
  children: [
    { id: 'processes', label: { en: 'Process Management', fa: 'مدیریت فرایندها' } },
    { id: 'inbox', label: { en: 'Inbox Management', fa: 'مدیریت کارتابل' } },
    { id: 'tasks', label: { en: 'Task Management', fa: 'مدیریت کارها' } },
  ]
};

export const WF_TRANS = {
  en: {},
  fa: {}
};

import React from 'react';
import { 
  Wallet, ArrowUpRight, ArrowDownLeft, UserCheck, Plus 
} from 'lucide-react';

// --- تغییر اصلاحی: دریافت داده‌ها از window به جای import ---
// این کار مانع از درخواست مجدد فایل و ارور 404 می‌شود
const { MOCK_STATS, MOCK_TRANSACTIONS } = window;

const KpiDashboard = ({ t, isRtl }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">{t.welcome}</h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">{t.financialOverview}</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all text-xs">
          <Plus size={18} /> {isRtl ? 'ایجاد موجودیت جدید' : 'Create New'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {MOCK_STATS.map(stat => (
          <div key={stat.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-2xl bg-slate-50 group-hover:bg-blue-50 transition-colors ${stat.color}`}><stat.icon size={24} /></div>
              <span className={`text-[10px] font-black px-2 py-1 rounded-full ${stat.change.startsWith('+') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{stat.change}</span>
            </div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wide">{stat.label[t.language === 'English' ? 'en' : 'fa']}</p>
            <h3 className="text-2xl font-black mt-1 text-slate-900 font-mono tracking-tighter">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-12">
        <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
            <h2 className="font-black text-slate-800 tracking-tight">{t.recentTransactions}</h2>
            <button className="text-blue-600 text-xs font-black hover:underline px-2">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50/50 text-slate-400 font-black uppercase tracking-[0.1em]">
                <tr>
                  <th className={`px-6 py-4 text-${isRtl ? 'right' : 'left'}`}>Entity</th>
                  <th className={`px-6 py-4 text-${isRtl ? 'right' : 'left'}`}>Category</th>
                  <th className={`px-6 py-4 text-${isRtl ? 'right' : 'left'}`}>Amount</th>
                  <th className={`px-6 py-4 text-${isRtl ? 'right' : 'left'}`}>Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {MOCK_TRANSACTIONS.map(tx => (
                  <tr key={tx.id} className="hover:bg-blue-50/10 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-700">{tx.title[t.language === 'English' ? 'en' : 'fa']}</td>
                    <td className="px-6 py-4"><span className="px-2 py-1 bg-slate-100 text-slate-500 rounded-lg font-bold text-[10px]">{tx.category}</span></td>
                    <td className={`px-6 py-4 font-black ${tx.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>{tx.type === 'income' ? '+' : '-'}${tx.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-slate-400 font-medium">{tx.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8">
          <h2 className="font-black text-slate-800 tracking-tight mb-8">{t.budgetAlloc}</h2>
          <div className="space-y-8">
            {[
              { l: isRtl ? 'عملیاتی' : 'Operations', p: 65, c: 'bg-blue-600', val: '$45k' },
              { l: isRtl ? 'بازاریابی' : 'Marketing', p: 42, c: 'bg-indigo-500', val: '$22k' },
              { l: isRtl ? 'توسعه' : 'R&D', p: 89, c: 'bg-emerald-500', val: '$12k' }
            ].map((b, i) => (
              <div key={i} className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{b.l}</span>
                  <span className="text-xs font-black text-blue-600">{b.p}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${b.c} transition-all duration-1000`} style={{ width: `${b.p}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Export to global scope instead of module export
window.KpiDashboard = KpiDashboard;

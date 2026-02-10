import React, { useState } from 'react';
import { 
  Plus, CheckCircle2, AlertTriangle, AlertCircle, X, Save, 
  Wallet, TrendingUp, TrendingDown, DollarSign 
} from 'lucide-react';

const GeneralWorkspace = ({ t, isRtl }) => {
  const [activeModal, setActiveModal] = useState(null); // 'expense', 'account' or null

  // --- Mock Data from Help.html ---
  const kpiData = [
    { id: 'cash', title: t.kpi_cash, value: '4,820,000,000', color: 'text-slate-800' },
    { id: 'rec', title: t.kpi_receivable, value: '1,250,000,000', color: 'text-green-600' },
    { id: 'pay', title: t.kpi_payable, value: '980,000,000', color: 'text-red-600' },
    { id: 'profit', title: t.kpi_profit, value: '640,000,000', color: 'text-slate-800' }
  ];

  const transactions = [
    { id: '10584', date: '2026/01/29', desc: t.row1_desc, amount: '2,950,000,000', status: 'paid' },
    { id: '10583', date: '2026/01/28', desc: t.row2_desc, amount: '120,500,000', status: 'pending' },
    { id: '10582', date: '2026/01/27', desc: t.row3_desc, amount: '1,430,000,000', status: 'paid' },
  ];

  const alerts = [
    { title: t.alert1_title, sub: t.alert1_sub, color: 'text-red-600' },
    { title: t.alert2_title, sub: t.alert2_sub, color: 'text-yellow-600' },
    { title: t.alert3_title, sub: t.alert3_sub, color: 'text-cyan-600' },
  ];

  return (
    <div className="animate-in fade-in duration-500 pb-12">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900">{t.ws_title}</h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">{t.ws_subtitle}</p>
        </div>
        {/* Language switch is handled in main Layout, so we skip it here */}
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {kpiData.map((kpi, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-sm text-slate-500 font-bold mb-2">{kpi.title}</div>
            <div className={`text-2xl font-black ${kpi.color} font-mono tracking-tight`}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap gap-3 mb-8">
        <button className="px-5 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center gap-2">
           <Plus size={18} /> {t.btn_invoice}
        </button>
        <button className="px-5 py-3 rounded-xl bg-green-600 text-white font-bold text-sm hover:bg-green-700 transition-colors shadow-lg shadow-green-200">
          {t.btn_check}
        </button>
        <button className="px-5 py-3 rounded-xl bg-cyan-600 text-white font-bold text-sm hover:bg-cyan-700 transition-colors shadow-lg shadow-cyan-200">
          {t.btn_payment_req}
        </button>
        <button 
          onClick={() => setActiveModal('expense')}
          className="px-5 py-3 rounded-xl bg-slate-700 text-white font-bold text-sm hover:bg-slate-800 transition-colors shadow-lg shadow-slate-300"
        >
          {t.btn_expense}
        </button>
        <button 
          onClick={() => setActiveModal('account')}
          className="px-5 py-3 rounded-xl bg-purple-600 text-white font-bold text-sm hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200"
        >
          {t.btn_account}
        </button>
      </div>

      {/* Main Layout: Table + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Recent Transactions Table */}
        <div className="lg:col-span-3 bg-white rounded-[1.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 font-black text-slate-800">
            {t.table_title}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs border-b border-slate-200">
                <tr>
                  <th className={`px-5 py-4 text-${isRtl ? 'right' : 'left'}`}>{t.th_id}</th>
                  <th className={`px-5 py-4 text-${isRtl ? 'right' : 'left'}`}>{t.th_date}</th>
                  <th className={`px-5 py-4 text-${isRtl ? 'right' : 'left'}`}>{t.th_desc}</th>
                  <th className={`px-5 py-4 text-${isRtl ? 'right' : 'left'}`}>{t.th_amount}</th>
                  <th className={`px-5 py-4 text-${isRtl ? 'right' : 'left'}`}>{t.th_status}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4 font-mono text-slate-500">{tx.id}</td>
                    <td className="px-5 py-4 text-slate-600">{tx.date}</td>
                    <td className="px-5 py-4 font-bold text-slate-700">{tx.desc}</td>
                    <td className="px-5 py-4 font-mono font-bold text-slate-800">{tx.amount}</td>
                    <td className="px-5 py-4">
                      {tx.status === 'paid' ? (
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1">
                          <CheckCircle2 size={12} /> {t.status_paid}
                        </span>
                      ) : (
                        <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1">
                          <AlertCircle size={12} /> {t.status_pending}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Critical Alerts Sidebar */}
        <div className="bg-white rounded-[1.5rem] border border-slate-200 shadow-sm p-6 h-fit">
          <h3 className="font-black text-slate-800 mb-4">{t.sidebar_title}</h3>
          <div className="space-y-4">
            {alerts.map((alert, idx) => (
              <div key={idx} className="pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                <div className={`${alert.color} font-bold text-sm mb-1 flex items-center gap-2`}>
                   <AlertTriangle size={14} /> {alert.title}
                </div>
                <div className="text-xs text-slate-500 font-medium">{alert.sub}</div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Modals */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setActiveModal(null)}>
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">
                {activeModal === 'expense' ? t.mod_exp_title : t.mod_acc_title}
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {activeModal === 'expense' ? (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2">{t.lbl_category}</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 transition-all">
                      <option>{t.opt_rent}</option>
                      <option>{t.opt_salary}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2">{t.lbl_amount}</label>
                    <input type="number" placeholder="0" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 transition-all" />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <input type="text" placeholder={t.ph_name} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 transition-all" />
                  </div>
                  <div>
                    <input type="text" placeholder={t.ph_phone} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 transition-all" />
                  </div>
                </>
              )}

              <button className={`w-full py-3.5 rounded-xl font-bold text-sm text-white shadow-lg transition-all ${activeModal === 'expense' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' : 'bg-purple-600 hover:bg-purple-700 shadow-purple-200'}`}>
                {t.btn_save}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

window.GeneralWorkspace = GeneralWorkspace;

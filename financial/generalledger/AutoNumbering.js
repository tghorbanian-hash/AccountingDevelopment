/* Filename: financial/generalledger/AutoNumbering.js */
import React, { useState } from 'react';
import { 
  Settings, Hash, FileDigit, Layers, Save, Edit, AlertCircle, CheckSquare, 
  RefreshCw, ShieldCheck 
} from 'lucide-react';

const AutoNumbering = ({ t, isRtl }) => {
  const { 
    Button, InputField, SelectField, Toggle, DataGrid, Modal, Badge 
  } = window.UI;

  // --- Constants & Initial Data ---
  
  // 1. Details Settings (All 13 System Types)
  const INITIAL_DETAILS = [
    { id: 'sys_partner', title: t.sys_partner, length: 6, startCode: '100001', endCode: '999999', lastCode: '100450' },
    { id: 'sys_cost_center', title: t.sys_cost_center, length: 4, startCode: '1001', endCode: '9999', lastCode: '1045' },
    { id: 'sys_project', title: t.sys_project, length: 5, startCode: '10001', endCode: '99999', lastCode: '10230' },
    { id: 'sys_other_person', title: t.sys_other_person, length: 6, startCode: '200001', endCode: '299999', lastCode: '200015' },
    { id: 'sys_branch', title: t.sys_branch, length: 3, startCode: '101', endCode: '999', lastCode: '102' }, // Fixed start to match length 3 logic
    { id: 'sys_bank_acc', title: t.sys_bank_acc, length: 4, startCode: '1001', endCode: '9999', lastCode: '1005' },
    { id: 'sys_cash', title: t.sys_cash, length: 3, startCode: '101', endCode: '999', lastCode: '104' },
    { id: 'sys_petty', title: t.sys_petty, length: 4, startCode: '2001', endCode: '9999', lastCode: '2010' },
    { id: 'sys_customer_group', title: t.sys_customer_group, length: 3, startCode: '101', endCode: '999', lastCode: '108' },
    { id: 'sys_product_group', title: t.sys_product_group, length: 3, startCode: '501', endCode: '999', lastCode: '520' },
    { id: 'sys_sales_office', title: t.sys_sales_office, length: 3, startCode: '101', endCode: '999', lastCode: '103' },
    { id: 'sys_price_zone', title: t.sys_price_zone, length: 2, startCode: '10', endCode: '99', lastCode: '14' }, // Fixed start to match length 2
    { id: 'sys_item', title: t.sys_item, length: 8, startCode: '10000001', endCode: '99999999', lastCode: '10004500' },
  ];

  // 2. Account Settings
  const INITIAL_ACCOUNTS = {
    group: { length: 1, mode: 'manual', startCode: '1', endCode: '9', lastCode: '4' },
    general: { length: 2, mode: 'auto', startCode: '01', endCode: '99', lastCode: '12' },
    subsidiary: { length: 4, mode: 'auto', startCode: '0001', endCode: '9999', lastCode: '0150' },
  };

  // 3. Document Settings (Refactored Structure)
  // Each ledger has: resetYear (bool), uniquenessScope (string: 'none', 'branch', 'ledger')
  const INITIAL_DOCS = [
    { id: 101, title: isRtl ? 'دفتر کل مرکزی' : 'Main General Ledger', resetYear: true, uniquenessScope: 'ledger' },
    { id: 102, title: isRtl ? 'دفتر کل ارزی' : 'Currency Ledger', resetYear: false, uniquenessScope: 'branch' },
    { id: 103, title: isRtl ? 'دفتر کل پروژه ها' : 'Projects Ledger', resetYear: true, uniquenessScope: 'none' },
  ];

  // --- States ---
  const [activeTab, setActiveTab] = useState('details'); 
  
  // Details State
  const [detailSettings, setDetailSettings] = useState(INITIAL_DETAILS);
  const [editingDetail, setEditingDetail] = useState(null);
  const [detailFormData, setDetailFormData] = useState({});
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Accounts State
  const [accSettings, setAccSettings] = useState(INITIAL_ACCOUNTS);

  // Docs State
  const [docSettings, setDocSettings] = useState(INITIAL_DOCS);


  // --- Handlers: Details ---
  const openDetailModal = (item) => {
    setEditingDetail(item);
    setDetailFormData({ ...item });
    setShowDetailModal(true);
  };

  const handleLengthChange = (e) => {
    const newLen = parseInt(e.target.value);
    if (isNaN(newLen) || newLen < 1) return;

    // Smart Suggestion: Calculate Start/End based on length
    // e.g., Length 6 -> Start: 100000, End: 999999
    const start = "1".padEnd(newLen, "0");
    const end = "9".padEnd(newLen, "9");

    setDetailFormData({ 
      ...detailFormData, 
      length: newLen, 
      startCode: start, 
      endCode: end 
    });
  };

  const saveDetail = () => {
    const len = detailFormData.length;
    if (len < 1 || len > 20) return alert(isRtl ? "طول کد باید بین ۱ تا ۲۰ باشد" : "Length must be between 1 and 20");
    
    // Strict Validation: Start/End codes must match the specified length
    if (detailFormData.startCode.length !== len) return alert(isRtl ? `کد شروع حتما باید ${len} رقمی باشد` : `Start code must be exactly ${len} digits`);
    if (detailFormData.endCode.length !== len) return alert(isRtl ? `کد پایان حتما باید ${len} رقمی باشد` : `End code must be exactly ${len} digits`);

    setDetailSettings(prev => prev.map(d => d.id === editingDetail.id ? { ...detailFormData } : d));
    setShowDetailModal(false);
  };

  // --- Handlers: Accounts ---
  const updateAccSetting = (level, field, value) => {
    setAccSettings(prev => ({
      ...prev,
      [level]: { ...prev[level], [field]: value }
    }));
  };

  // --- Handlers: Docs ---
  const updateDocRow = (id, field, value) => {
    setDocSettings(prev => prev.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  // --- UI Components ---
  
  const TabButton = ({ id, icon: Icon, label }) => {
    const isActive = activeTab === id;
    return (
      <button
        onClick={() => setActiveTab(id)}
        className={`
          relative flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all duration-200 z-10
          ${isActive ? 'text-slate-800' : 'text-slate-500 hover:text-slate-700'}
        `}
      >
        {isActive && (
          <div className="absolute inset-0 bg-white rounded-lg shadow-sm border border-slate-200 -z-10 animate-in fade-in zoom-in-95 duration-200"></div>
        )}
        <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
        <span>{label}</span>
      </button>
    );
  };

  // --- Render Sections ---

  const renderDetailsTab = () => (
    <div className="h-full flex flex-col p-4 animate-in fade-in zoom-in-95 duration-300">
       <div className="flex-1 overflow-hidden border rounded-2xl shadow-sm bg-white">
         <DataGrid 
           columns={[
              { field: 'title', header: t.an_dt_type, width: 'w-64', render: r => <span className="font-bold text-slate-700">{r.title}</span> },
              { field: 'length', header: t.an_dt_length, width: 'w-32', render: r => <span className="font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100 font-bold text-xs">{r.length}</span> },
              { field: 'startCode', header: t.an_dt_start, width: 'w-32', render: r => <span className="font-mono text-slate-500">{r.startCode}</span> },
              { field: 'endCode', header: t.an_dt_end, width: 'w-32', render: r => <span className="font-mono text-slate-500">{r.endCode}</span> },
              { field: 'lastCode', header: t.an_dt_last, width: 'w-48', render: r => <Badge variant="neutral" className="font-mono">{r.lastCode}</Badge> },
           ]}
           data={detailSettings}
           isRtl={isRtl}
           actions={(row) => (
              <Button variant="ghost" size="iconSm" icon={Edit} onClick={() => openDetailModal(row)} className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"/>
           )}
         />
       </div>

       {/* Modal for Details */}
       <Modal
         isOpen={showDetailModal}
         onClose={() => setShowDetailModal(false)}
         title={t.an_edit_dt}
         footer={<><Button variant="outline" onClick={() => setShowDetailModal(false)}>{t.btn_cancel}</Button><Button variant="primary" onClick={saveDetail}>{t.btn_save}</Button></>}
       >
          <div className="grid grid-cols-2 gap-4">
             <div className="col-span-2 flex items-center gap-3 mb-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700">
                <Hash size={20} className="text-indigo-500"/>
                <span className="font-black text-sm">{editingDetail?.title}</span>
             </div>
             
             {/* Length Input with Auto-Calc Logic */}
             <div className="col-span-2">
                <InputField 
                  label={t.an_dt_length} 
                  type="number" 
                  value={detailFormData.length} 
                  onChange={handleLengthChange} 
                  isRtl={isRtl} 
                  hint={isRtl ? 'با تغییر طول، کد شروع و پایان بازنشانی می‌شوند' : 'Changing length resets start/end codes'}
                />
             </div>

             <div className="col-span-2 h-px bg-slate-100 my-1"></div>

             <InputField label={t.an_dt_start} value={detailFormData.startCode} onChange={e => setDetailFormData({...detailFormData, startCode: e.target.value})} isRtl={isRtl} />
             <InputField label={t.an_dt_end} value={detailFormData.endCode} onChange={e => setDetailFormData({...detailFormData, endCode: e.target.value})} isRtl={isRtl} />
             
             <div className="col-span-2 text-xs text-orange-600 bg-orange-50 p-2 rounded border border-orange-100 flex items-center gap-2">
                <AlertCircle size={14}/>
                {isRtl ? 'تعداد ارقام کد شروع و پایان باید دقیقاً برابر با طول مجاز باشد.' : 'Start/End codes length must exactly match Max Length.'}
             </div>
          </div>
       </Modal>
    </div>
  );

  const renderAccountsTab = () => {
    const Card = ({ title, data, level, icon: Icon }) => (
       <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
             <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Icon size={20} />
             </div>
             <div className="font-bold text-lg text-slate-700">{title}</div>
          </div>
          <div className="space-y-5">
             <div className="grid grid-cols-2 gap-4">
                <InputField label={t.an_acc_len} type="number" size="sm" value={data.length} onChange={e => updateAccSetting(level, 'length', e.target.value)} isRtl={isRtl} />
                <SelectField label={t.an_mode} size="sm" value={data.mode} onChange={e => updateAccSetting(level, 'mode', e.target.value)} isRtl={isRtl}>
                   <option value="auto">{t.an_mode_auto}</option>
                   <option value="manual">{t.an_mode_manual}</option>
                </SelectField>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <InputField label={t.an_dt_start} size="sm" value={data.startCode} onChange={e => updateAccSetting(level, 'startCode', e.target.value)} isRtl={isRtl} />
                <InputField label={t.an_dt_end} size="sm" value={data.endCode} onChange={e => updateAccSetting(level, 'endCode', e.target.value)} isRtl={isRtl} />
             </div>
             <div className="bg-slate-50 p-3 rounded-xl text-sm text-slate-500 flex justify-between items-center border border-slate-100">
                <span>{t.an_dt_last}:</span>
                <span className="font-mono font-bold text-slate-800 bg-white px-2 py-1 rounded shadow-sm border">{data.lastCode}</span>
             </div>
          </div>
       </div>
    );

    return (
       <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card title={t.an_acc_group} data={accSettings.group} level="group" icon={Layers} />
          <Card title={t.an_acc_general} data={accSettings.general} level="general" icon={FileDigit} />
          <Card title={t.an_acc_subsidiary} data={accSettings.subsidiary} level="subsidiary" icon={Hash} />
          <div className="md:col-span-3 flex justify-end mt-4">
             <Button variant="primary" size="lg" icon={Save} onClick={() => alert(t.save_success)}>{t.btn_save}</Button>
          </div>
       </div>
    );
  };

  const renderDocsTab = () => (
    <div className="h-full flex flex-col p-6 animate-in fade-in zoom-in-95 duration-300">
       <div className="bg-white border rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-slate-50 px-6 py-4 border-b flex justify-between items-center">
             <div className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Settings size={18} className="text-slate-400"/>
                {t.an_tab_docs}
             </div>
             <div className="text-xs text-slate-400">{isRtl ? 'تنظیمات برای هر دفتر کل مجزا است' : 'Settings are per ledger'}</div>
          </div>

          {/* Grid Rows */}
          <div className="overflow-auto flex-1">
             <table className={`w-full text-sm ${isRtl ? 'text-right' : 'text-left'}`}>
                <thead className="bg-white text-slate-500 font-medium border-b sticky top-0 z-10">
                   <tr>
                      <th className="px-6 py-3 w-1/3">{t.lg_title}</th>
                      <th className="px-6 py-3 w-1/4 text-center">{t.an_reset_year}</th>
                      <th className="px-6 py-3 w-1/3">{t.an_unique_scope}</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {docSettings.map(row => (
                      <tr key={row.id} className="hover:bg-indigo-50/30 transition-colors group">
                         <td className="px-6 py-4 font-bold text-slate-700">
                            {row.title}
                         </td>
                         <td className="px-6 py-4 text-center">
                            <div className="flex justify-center">
                               <Toggle 
                                 checked={row.resetYear} 
                                 onChange={(val) => updateDocRow(row.id, 'resetYear', val)} 
                               />
                            </div>
                         </td>
                         <td className="px-6 py-4">
                            <div className="relative">
                               <select 
                                 className={`w-full p-2 pl-8 pr-4 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer hover:border-indigo-300 transition-colors ${isRtl ? 'text-right' : 'text-left'}`}
                                 value={row.uniquenessScope}
                                 onChange={(e) => updateDocRow(row.id, 'uniquenessScope', e.target.value)}
                               >
                                  <option value="none">{isRtl ? '--- بدون کنترل ---' : '--- None ---'}</option>
                                  <option value="branch">{t.an_scope_branch}</option>
                                  <option value="ledger">{t.an_scope_ledger}</option>
                               </select>
                               <div className={`absolute top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 ${isRtl ? 'left-3' : 'right-3'}`}>
                                  <ShieldCheck size={14}/>
                               </div>
                            </div>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
          
          <div className="p-4 border-t bg-slate-50 flex justify-end">
             <Button variant="primary" icon={Save} onClick={() => alert(t.save_success)}>{t.btn_save}</Button>
          </div>
       </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-slate-50/50">
       {/* Header */}
       <div className="bg-white border-b px-8 py-5 shrink-0 flex justify-between items-center">
         <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">{t.an_title}</h1>
            <p className="text-slate-500 text-xs font-medium mt-0.5">{t.an_subtitle}</p>
         </div>
         
         {/* Modern Segmented Tabs */}
         <div className="bg-slate-100 p-1 rounded-xl flex shadow-inner">
            <TabButton id="details" icon={Hash} label={t.an_tab_details} />
            <TabButton id="accounts" icon={FileDigit} label={t.an_tab_accounts} />
            <TabButton id="docs" icon={Settings} label={t.an_tab_docs} />
         </div>
       </div>

       {/* Tab Content Area */}
       <div className="flex-1 overflow-hidden relative">
          {activeTab === 'details' && renderDetailsTab()}
          {activeTab === 'accounts' && renderAccountsTab()}
          {activeTab === 'docs' && renderDocsTab()}
       </div>
    </div>
  );
};

window.AutoNumbering = AutoNumbering;
export default AutoNumbering;
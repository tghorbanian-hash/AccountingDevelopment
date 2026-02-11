/* Filename: financial/generalledger/AutoNumbering.js */
import React, { useState } from 'react';
import { 
  Settings, Hash, FileDigit, Layers, Save, Edit, AlertCircle, CheckSquare 
} from 'lucide-react';

const AutoNumbering = ({ t, isRtl }) => {
  const { 
    Button, InputField, SelectField, Toggle, DataGrid, Modal, Badge, Callout 
  } = window.UI;

  // --- Mock Data Initialization ---
  // 1. Details Settings
  const INITIAL_DETAILS = [
    { id: 'sys_cost_center', title: t.sys_cost_center, length: 6, startCode: '1', endCode: '999999', lastCode: '10045' },
    { id: 'sys_project', title: t.sys_project, length: 5, startCode: '10000', endCode: '99999', lastCode: '10230' },
    { id: 'sys_partner', title: t.sys_partner, length: 8, startCode: '1', endCode: '99999999', lastCode: '2050' },
  ];

  // 2. Account Settings
  const INITIAL_ACCOUNTS = {
    group: { length: 1, mode: 'manual', startCode: '1', endCode: '9', lastCode: '4' },
    general: { length: 2, mode: 'auto', startCode: '01', endCode: '99', lastCode: '12' },
    subsidiary: { length: 4, mode: 'auto', startCode: '0001', endCode: '9999', lastCode: '0150' },
  };

  // 3. Document Settings (Mocking Ledger IDs)
  const LEDGERS = [
    { id: 101, title: isRtl ? 'دفتر کل مرکزی' : 'Main General Ledger' },
    { id: 102, title: isRtl ? 'دفتر کل ارزی' : 'Currency Ledger' },
  ];
  const INITIAL_DOCS = {
    101: { resetYear: true, uniqueness: ['ledger'] }, // Default for Ledger 101
    102: { resetYear: false, uniqueness: ['company'] },
  };

  // --- States ---
  const [activeTab, setActiveTab] = useState('details'); // details, accounts, docs
  
  // Details State
  const [detailSettings, setDetailSettings] = useState(INITIAL_DETAILS);
  const [editingDetail, setEditingDetail] = useState(null);
  const [detailFormData, setDetailFormData] = useState({});
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Accounts State
  const [accSettings, setAccSettings] = useState(INITIAL_ACCOUNTS);

  // Docs State
  const [selectedLedgerId, setSelectedLedgerId] = useState(LEDGERS[0].id);
  const [docSettings, setDocSettings] = useState(INITIAL_DOCS);


  // --- Handlers: Details ---
  const openDetailModal = (item) => {
    setEditingDetail(item);
    setDetailFormData({ ...item });
    setShowDetailModal(true);
  };

  const saveDetail = () => {
    if (detailFormData.length < 1 || detailFormData.length > 20) return alert("Length must be between 1 and 20");
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
  const getCurrentDocSetting = () => {
    return docSettings[selectedLedgerId] || { resetYear: true, uniqueness: ['ledger'] };
  };

  const updateDocSetting = (field, value) => {
    setDocSettings(prev => ({
      ...prev,
      [selectedLedgerId]: { ...getCurrentDocSetting(), [field]: value }
    }));
  };

  const toggleUniqueness = (scope) => {
    const currentScopes = getCurrentDocSetting().uniqueness;
    let newScopes;
    if (currentScopes.includes(scope)) {
      newScopes = currentScopes.filter(s => s !== scope);
    } else {
      newScopes = [...currentScopes, scope];
    }
    updateDocSetting('uniqueness', newScopes);
  };

  // --- UI Components ---
  
  const TabButton = ({ id, icon: Icon, label }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
        activeTab === id 
          ? 'border-indigo-600 text-indigo-700 font-bold bg-indigo-50/50' 
          : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
      }`}
    >
      <Icon size={18} />
      <span>{label}</span>
    </button>
  );

  // --- Render Sections ---

  const renderDetailsTab = () => (
    <div className="h-full flex flex-col">
       <DataGrid 
         columns={[
            { field: 'title', header: t.an_dt_type, width: 'w-64' },
            { field: 'length', header: t.an_dt_length, width: 'w-32', render: r => <span className="font-mono">{r.length}</span> },
            { field: 'startCode', header: t.an_dt_start, width: 'w-32', render: r => <span className="font-mono">{r.startCode}</span> },
            { field: 'endCode', header: t.an_dt_end, width: 'w-32', render: r => <span className="font-mono">{r.endCode}</span> },
            { field: 'lastCode', header: t.an_dt_last, width: 'w-48', render: r => <Badge variant="neutral" className="font-mono">{r.lastCode}</Badge> },
         ]}
         data={detailSettings}
         isRtl={isRtl}
         actions={(row) => (
            <Button variant="ghost" size="iconSm" icon={Edit} onClick={() => openDetailModal(row)} />
         )}
       />
       {/* Modal for Details */}
       <Modal
         isOpen={showDetailModal}
         onClose={() => setShowDetailModal(false)}
         title={t.an_edit_dt}
         footer={<><Button variant="outline" onClick={() => setShowDetailModal(false)}>{t.btn_cancel}</Button><Button variant="primary" onClick={saveDetail}>{t.btn_save}</Button></>}
       >
          <div className="grid grid-cols-2 gap-4">
             <div className="col-span-2 font-bold text-lg text-slate-800 mb-2">{editingDetail?.title}</div>
             <InputField label={t.an_dt_length} type="number" value={detailFormData.length} onChange={e => setDetailFormData({...detailFormData, length: parseInt(e.target.value)})} isRtl={isRtl} />
             <div />
             <InputField label={t.an_dt_start} value={detailFormData.startCode} onChange={e => setDetailFormData({...detailFormData, startCode: e.target.value})} isRtl={isRtl} />
             <InputField label={t.an_dt_end} value={detailFormData.endCode} onChange={e => setDetailFormData({...detailFormData, endCode: e.target.value})} isRtl={isRtl} />
          </div>
       </Modal>
    </div>
  );

  const renderAccountsTab = () => {
    const Card = ({ title, data, level }) => (
       <div className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-4 text-indigo-700 font-bold border-b pb-2">
             <Layers size={18}/> {title}
          </div>
          <div className="space-y-4">
             <div className="grid grid-cols-2 gap-3">
                <InputField label={t.an_acc_len} type="number" size="sm" value={data.length} onChange={e => updateAccSetting(level, 'length', e.target.value)} isRtl={isRtl} />
                <SelectField label={t.an_mode} size="sm" value={data.mode} onChange={e => updateAccSetting(level, 'mode', e.target.value)} isRtl={isRtl}>
                   <option value="auto">{t.an_mode_auto}</option>
                   <option value="manual">{t.an_mode_manual}</option>
                </SelectField>
             </div>
             <div className="grid grid-cols-2 gap-3">
                <InputField label={t.an_dt_start} size="sm" value={data.startCode} onChange={e => updateAccSetting(level, 'startCode', e.target.value)} isRtl={isRtl} />
                <InputField label={t.an_dt_end} size="sm" value={data.endCode} onChange={e => updateAccSetting(level, 'endCode', e.target.value)} isRtl={isRtl} />
             </div>
             <div className="bg-slate-50 p-2 rounded text-xs text-slate-500 flex justify-between">
                <span>{t.an_dt_last}:</span>
                <span className="font-mono font-bold text-slate-800">{data.lastCode}</span>
             </div>
          </div>
       </div>
    );

    return (
       <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-auto">
          <Card title={t.an_acc_group} data={accSettings.group} level="group" />
          <Card title={t.an_acc_general} data={accSettings.general} level="general" />
          <Card title={t.an_acc_subsidiary} data={accSettings.subsidiary} level="subsidiary" />
          <div className="md:col-span-3 flex justify-end mt-4">
             <Button variant="primary" icon={Save} onClick={() => alert(t.save_success)}>{t.btn_save}</Button>
          </div>
       </div>
    );
  };

  const renderDocsTab = () => {
    const current = getCurrentDocSetting();
    
    return (
       <div className="p-6 max-w-2xl mx-auto">
          <div className="bg-white border rounded-xl p-6 shadow-sm space-y-6">
             {/* Ledger Selector */}
             <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">{t.an_select_ledger}</label>
                <select 
                  className={`w-full p-2.5 border rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isRtl ? 'text-right' : 'text-left'}`}
                  value={selectedLedgerId}
                  onChange={(e) => setSelectedLedgerId(parseInt(e.target.value))}
                >
                   {LEDGERS.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
                </select>
             </div>
             
             <hr className="border-slate-100" />

             {/* Reset Setting */}
             <div className="flex items-center justify-between">
                <div className="flex flex-col">
                   <span className="font-bold text-slate-800">{t.an_reset_year}</span>
                   <span className="text-xs text-slate-500">{isRtl ? 'با شروع سال مالی جدید، شماره اسناد از ۱ شروع می‌شوند.' : 'Numbers reset to 1 at the start of new fiscal year.'}</span>
                </div>
                <Toggle checked={current.resetYear} onChange={v => updateDocSetting('resetYear', v)} />
             </div>

             <hr className="border-slate-100" />

             {/* Uniqueness Scope */}
             <div className="space-y-3">
                <div className="font-bold text-slate-800 flex items-center gap-2">
                   <ShieldIcon size={16} className="text-indigo-600"/>
                   {t.an_unique_scope}
                </div>
                <div className="grid grid-cols-1 gap-2 bg-slate-50 p-4 rounded-lg border border-slate-100">
                   {['ledger', 'branch', 'company'].map(scope => (
                      <label key={scope} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white rounded transition-colors">
                         <div 
                           className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${current.uniqueness.includes(scope) ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}
                           onClick={() => toggleUniqueness(scope)}
                         >
                            {current.uniqueness.includes(scope) && <CheckSquare size={14} className="text-white" />}
                         </div>
                         <span className="text-sm font-medium text-slate-700">{t[`an_scope_${scope}`]}</span>
                      </label>
                   ))}
                </div>
                <div className="text-xs text-orange-600 flex gap-1 items-start bg-orange-50 p-2 rounded">
                   <AlertCircle size={14} className="mt-0.5 shrink-0"/>
                   {isRtl ? 'ترکیب انتخاب شده تعیین می‌کند شماره سند در چه محدوده‌ای باید یکتا باشد.' : 'Selected combination determines the scope within which document numbers must be unique.'}
                </div>
             </div>

             <div className="pt-4 flex justify-end">
                <Button variant="primary" icon={Save} onClick={() => alert(t.save_success)}>{t.btn_save}</Button>
             </div>
          </div>
       </div>
    );
  };

  // Helper Icon
  const ShieldIcon = ({size, className}) => (
     <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
  );

  return (
    <div className="h-full flex flex-col bg-slate-50/50">
       {/* Header */}
       <div className="bg-white border-b px-6 py-4">
         <h1 className="text-xl font-bold text-slate-800">{t.an_title}</h1>
         <p className="text-slate-500 text-xs mt-1">{t.an_subtitle}</p>
       </div>

       {/* Tabs Header */}
       <div className="bg-white px-6 flex border-b">
          <TabButton id="details" icon={Hash} label={t.an_tab_details} />
          <TabButton id="accounts" icon={FileDigit} label={t.an_tab_accounts} />
          <TabButton id="docs" icon={Settings} label={t.an_tab_docs} />
       </div>

       {/* Tab Content */}
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
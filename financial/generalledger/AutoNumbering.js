/* Filename: financial/generalledger/AutoNumbering.js */
import React, { useState } from 'react';
import { 
  Settings, Hash, FileDigit, Layers, Save, Edit, AlertCircle, 
  ShieldCheck, RotateCcw, X as XIcon, Box, CheckSquare, List
} from 'lucide-react';

const AutoNumbering = ({ t, isRtl }) => {
  const { 
    Button, InputField, SelectField, Toggle, DataGrid, Modal, Badge 
  } = window.UI;

  // --- Constants & Initial Data ---
  
  // 1. Details Settings
  const INITIAL_DETAILS = [
    { id: 'sys_partner', title: t.sys_partner, length: 6, startCode: '100001', endCode: '999999', lastCode: '100450' },
    { id: 'sys_cost_center', title: t.sys_cost_center, length: 4, startCode: '1001', endCode: '9999', lastCode: '1045' },
    { id: 'sys_project', title: t.sys_project, length: 5, startCode: '10001', endCode: '99999', lastCode: '10230' },
    { id: 'sys_other_person', title: t.sys_other_person, length: 6, startCode: '200001', endCode: '299999', lastCode: '200015' },
    { id: 'sys_branch', title: t.sys_branch, length: 3, startCode: '101', endCode: '999', lastCode: '102' },
    { id: 'sys_bank_acc', title: t.sys_bank_acc, length: 4, startCode: '1001', endCode: '9999', lastCode: '1005' },
    { id: 'sys_cash', title: t.sys_cash, length: 3, startCode: '101', endCode: '999', lastCode: '104' },
    { id: 'sys_petty', title: t.sys_petty, length: 4, startCode: '2001', endCode: '9999', lastCode: '2010' },
    { id: 'sys_customer_group', title: t.sys_customer_group, length: 3, startCode: '101', endCode: '999', lastCode: '108' },
    { id: 'sys_product_group', title: t.sys_product_group, length: 3, startCode: '501', endCode: '999', lastCode: '520' },
    { id: 'sys_sales_office', title: t.sys_sales_office, length: 3, startCode: '101', endCode: '999', lastCode: '103' },
    { id: 'sys_price_zone', title: t.sys_price_zone, length: 2, startCode: '10', endCode: '99', lastCode: '14' },
    { id: 'sys_item', title: t.sys_item, length: 8, startCode: '10000001', endCode: '99999999', lastCode: '10004500' },
  ];

  // 2. Account Settings
  const INITIAL_ACCOUNTS = {
    group: { length: 1, mode: 'manual', startCode: '1', endCode: '9', lastCode: '4' },
    general: { length: 2, mode: 'auto', startCode: '01', endCode: '99', lastCode: '12' },
    subsidiary: { length: 4, mode: 'auto', startCode: '0001', endCode: '9999', lastCode: '0150' },
  };

  // 3. Document Settings
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
  const [editingDoc, setEditingDoc] = useState(null);
  const [docFormData, setDocFormData] = useState({});
  const [showDocModal, setShowDocModal] = useState(false);


  // --- Handlers: Details ---
  const openDetailModal = (item) => {
    setEditingDetail(item);
    setDetailFormData({ ...item });
    setShowDetailModal(true);
  };

  const handleLengthChange = (e) => {
    const newLen = parseInt(e.target.value);
    if (isNaN(newLen) || newLen < 1) return;

    // Smart Suggestion
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
  const openDocModal = (item) => {
    setEditingDoc(item);
    setDocFormData({ ...item });
    setShowDocModal(true);
  };

  const saveDoc = () => {
    setDocSettings(prev => prev.map(d => d.id === editingDoc.id ? { ...docFormData } : d));
    setShowDocModal(false);
  };

  // --- UI Components ---
  
  const NavItem = ({ id, icon: Icon, label, desc }) => {
    const isActive = activeTab === id;
    return (
      <button
        onClick={() => setActiveTab(id)}
        className={`
          w-full flex items-center gap-3 px-4 py-3 rounded-xl text-right transition-all duration-200 group
          ${isActive 
            ? 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200' 
            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}
        `}
      >
        <div className={`
          w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors
          ${isActive ? 'bg-white text-indigo-600 shadow-sm' : 'bg-slate-100 text-slate-400 group-hover:bg-white group-hover:text-slate-600'}
        `}>
          <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
        </div>
        <div className="flex-1 min-w-0">
           <div className={`font-bold text-sm ${isActive ? 'text-slate-800' : ''}`}>{label}</div>
           <div className="text-[10px] text-slate-400 truncate mt-0.5 opacity-80">{desc}</div>
        </div>
        {isActive && <div className={`w-1 h-5 bg-indigo-600 rounded-full ${isRtl ? '-ml-5' : '-mr-5'}`}></div>}
      </button>
    );
  };

  // --- Render Sections ---

  const renderDetailsTab = () => (
    <div className="h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
       <div className="mb-4 px-1">
          <h2 className="text-lg font-bold text-slate-800">{t.an_tab_details}</h2>
          <p className="text-xs text-slate-500 mt-1">تنظیمات طول و فرمت کدهای تفصیلی سیستم</p>
       </div>
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

       {/* Modal for Details (Optimized: 3 Cols) */}
       <Modal
         isOpen={showDetailModal}
         onClose={() => setShowDetailModal(false)}
         title={t.an_edit_dt}
         size="lg"
         footer={<><Button variant="outline" onClick={() => setShowDetailModal(false)}>{t.btn_cancel}</Button><Button variant="primary" onClick={saveDetail}>{t.btn_save}</Button></>}
       >
          <div className="flex flex-col gap-4">
             <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700">
                <Hash size={20} className="text-indigo-500"/>
                <span className="font-black text-sm">{editingDetail?.title}</span>
             </div>
             
             <div className="grid grid-cols-3 gap-3 items-end">
                <InputField 
                  label={t.an_dt_length} 
                  type="number" 
                  value={detailFormData.length} 
                  onChange={handleLengthChange} 
                  isRtl={isRtl} 
                />
                <InputField label={t.an_dt_start} value={detailFormData.startCode} onChange={e => setDetailFormData({...detailFormData, startCode: e.target.value})} isRtl={isRtl} />
                <InputField label={t.an_dt_end} value={detailFormData.endCode} onChange={e => setDetailFormData({...detailFormData, endCode: e.target.value})} isRtl={isRtl} />
             </div>
             
             <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded border border-orange-100 flex items-center gap-2">
                <AlertCircle size={14}/>
                {isRtl ? 'تعداد ارقام کد شروع و پایان باید دقیقاً برابر با طول مجاز باشد.' : 'Start/End codes length must exactly match Max Length.'}
             </div>
          </div>
       </Modal>
    </div>
  );

  const renderAccountsTab = () => {
    const Card = ({ title, data, level, icon: Icon }) => (
       <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
             <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Icon size={20} />
             </div>
             <div className="font-bold text-sm text-slate-700">{title}</div>
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
       <div className="h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
           <div className="mb-4 px-1">
             <h2 className="text-lg font-bold text-slate-800">{t.an_tab_accounts}</h2>
             <p className="text-xs text-slate-500 mt-1">پیکربندی ساختار درختی حساب‌های دفتر کل</p>
           </div>
           <div className="flex-1 overflow-auto">
             <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-6">
                <Card title={t.an_acc_group} data={accSettings.group} level="group" icon={Layers} />
                <Card title={t.an_acc_general} data={accSettings.general} level="general" icon={Box} />
                <Card title={t.an_acc_subsidiary} data={accSettings.subsidiary} level="subsidiary" icon={FileDigit} />
             </div>
             <div className="flex justify-end pt-4 border-t border-slate-200">
                 <Button variant="primary" size="lg" icon={Save} onClick={() => alert(t.save_success)}>{t.btn_save}</Button>
             </div>
           </div>
       </div>
    );
  };

  const renderDocsTab = () => (
    <div className="h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
       <div className="mb-4 px-1">
          <h2 className="text-lg font-bold text-slate-800">{t.an_tab_docs}</h2>
          <p className="text-xs text-slate-500 mt-1">تنظیمات تولید شماره سند برای هر دفتر</p>
       </div>
       <div className="flex-1 overflow-hidden border rounded-2xl shadow-sm bg-white">
          <DataGrid 
             columns={[
                { field: 'title', header: t.lg_title, width: 'w-64', render: r => <span className="font-bold text-slate-700">{r.title}</span> },
                { 
                   field: 'resetYear', 
                   header: t.an_reset_year, 
                   width: 'w-48', 
                   render: r => (
                      <Badge variant={r.resetYear ? 'success' : 'neutral'} icon={r.resetYear ? RotateCcw : XIcon}>
                         {r.resetYear ? t.active : t.inactive}
                      </Badge>
                   )
                },
                { 
                   field: 'uniquenessScope', 
                   header: t.an_unique_scope, 
                   width: 'w-48', 
                   render: r => (
                      <Badge variant="primary" icon={ShieldCheck}>
                         {r.uniquenessScope === 'none' ? (isRtl ? '---' : 'None') : t[`an_scope_${r.uniquenessScope}`]}
                      </Badge>
                   )
                },
             ]}
             data={docSettings}
             isRtl={isRtl}
             actions={(row) => (
                <Button variant="ghost" size="iconSm" icon={Edit} onClick={() => openDocModal(row)} className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"/>
             )}
          />
       </div>

       {/* Modal for Documents Settings */}
       <Modal
         isOpen={showDocModal}
         onClose={() => setShowDocModal(false)}
         title={t.an_tab_docs}
         footer={<><Button variant="outline" onClick={() => setShowDocModal(false)}>{t.btn_cancel}</Button><Button variant="primary" onClick={saveDoc}>{t.btn_save}</Button></>}
       >
          <div className="flex flex-col gap-6">
             <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100 text-indigo-900">
                <Settings size={20}/>
                <span className="font-bold">{editingDoc?.title}</span>
             </div>

             <Toggle 
                label={t.an_reset_year} 
                checked={docFormData.resetYear} 
                onChange={val => setDocFormData({...docFormData, resetYear: val})}
             />
             
             <SelectField 
                label={t.an_unique_scope} 
                value={docFormData.uniquenessScope} 
                onChange={e => setDocFormData({...docFormData, uniquenessScope: e.target.value})} 
                isRtl={isRtl}
             >
                <option value="none">{isRtl ? '--- بدون کنترل ---' : '--- None ---'}</option>
                <option value="branch">{t.an_scope_branch}</option>
                <option value="ledger">{t.an_scope_ledger}</option>
                <option value="company">{t.an_scope_company}</option>
             </SelectField>

             <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100 flex gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5"/>
                <span>{isRtl ? 'با فعال‌سازی ریست سالانه، در ابتدای هر سال مالی شماره اسناد این دفتر از ۱ شروع خواهد شد.' : 'Enabling annual reset will restart document numbering from 1 at the beginning of each fiscal year.'}</span>
             </div>
          </div>
       </Modal>
    </div>
  );

  return (
    <div className="h-full flex bg-slate-50/50 overflow-hidden">
       {/* Sidebar (Like UserProfile) */}
       <aside className={`w-64 bg-white border-${isRtl ? 'l' : 'r'} border-slate-200 flex flex-col shrink-0`}>
          <div className="p-6 border-b border-slate-100">
             <h1 className="text-xl font-black text-slate-800 tracking-tight">{t.an_title}</h1>
             <p className="text-slate-500 text-xs font-medium mt-1 leading-relaxed">{t.an_subtitle}</p>
          </div>
          
          <div className="p-4 flex flex-col gap-2 overflow-y-auto flex-1">
             <NavItem id="details" icon={Hash} label={t.an_tab_details} desc="طول و فرمت کد تفصیل‌ها" />
             <NavItem id="accounts" icon={FileDigit} label={t.an_tab_accounts} desc="ساختار درختی حساب‌ها" />
             <NavItem id="docs" icon={Settings} label={t.an_tab_docs} desc="شماره‌گذاری اسناد مالی" />
          </div>
       </aside>

       {/* Main Content Area */}
       <main className="flex-1 overflow-hidden p-6 relative">
          {activeTab === 'details' && renderDetailsTab()}
          {activeTab === 'accounts' && renderAccountsTab()}
          {activeTab === 'docs' && renderDocsTab()}
       </main>
    </div>
  );
};

window.AutoNumbering = AutoNumbering;
export default AutoNumbering;
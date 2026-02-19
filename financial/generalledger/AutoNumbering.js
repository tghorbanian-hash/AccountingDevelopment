/* Filename: financial/generalledger/AutoNumbering.js */
import React, { useState } from 'react';
import { 
  Settings, Hash, FileDigit, Layers, Save, Edit, AlertCircle, 
  ShieldCheck, RotateCcw, X as XIcon, Box, CheckSquare, List
} from 'lucide-react';

const AutoNumbering = ({ t, isRtl }) => {
  const { 
    Button, InputField, SelectField, Toggle, DataGrid, Modal, Badge, SideMenu, ToggleChip 
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

  // 2. Document Settings
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

  // --- Render Sections ---

  const renderDetailsTab = () => (
    <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-500">
       <div className="flex-1 overflow-hidden">
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

       {/* Modal for Details - Compact Layout */}
       <Modal
         isOpen={showDetailModal}
         onClose={() => setShowDetailModal(false)}
         title={t.an_edit_dt}
         size="md"
         footer={<><Button variant="outline" onClick={() => setShowDetailModal(false)}>{t.btn_cancel}</Button><Button variant="primary" onClick={saveDetail}>{t.btn_save}</Button></>}
       >
          <div className="flex flex-col gap-4">
             <div className="flex items-center gap-2 p-2 bg-slate-50 rounded border border-slate-200 text-slate-700">
                <Hash size={16} className="text-indigo-500"/>
                <span className="font-bold text-xs">{editingDetail?.title}</span>
             </div>
             
             {/* 3 Fields in One Row, Compact */}
             <div className="grid grid-cols-3 gap-3">
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
             
             <div className="text-[10px] text-orange-600 bg-orange-50 p-2 rounded border border-orange-100 flex items-center gap-2">
                <AlertCircle size={12}/>
                {isRtl ? 'تعداد ارقام کد شروع و پایان باید دقیقاً برابر با طول مجاز باشد.' : 'Start/End codes length must exactly match Max Length.'}
             </div>
          </div>
       </Modal>
    </div>
  );

  const renderDocsTab = () => (
    <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-500">
       <div className="flex-1 overflow-hidden">
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
             
             {/* Toggle Chips for Uniqueness */}
             <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-600">{t.an_unique_scope}</label>
                <div className="flex flex-wrap gap-2">
                   {['none', 'branch', 'ledger', 'company'].map(scope => (
                      <ToggleChip 
                         key={scope}
                         label={scope === 'none' ? (isRtl ? 'بدون کنترل' : 'None') : t[`an_scope_${scope}`]}
                         checked={docFormData.uniquenessScope === scope}
                         onClick={() => setDocFormData({...docFormData, uniquenessScope: scope})}
                         colorClass="green"
                      />
                   ))}
                </div>
             </div>

             <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100 flex gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5"/>
                <span>{isRtl ? 'با فعال‌سازی ریست سالانه، در ابتدای هر سال مالی شماره اسناد این دفتر از ۱ شروع خواهد شد.' : 'Enabling annual reset will restart document numbering from 1 at the beginning of each fiscal year.'}</span>
             </div>
          </div>
       </Modal>
    </div>
  );

  const tabs = [
    { id: 'details', icon: Hash, label: t.an_tab_details },
    { id: 'docs', icon: Settings, label: t.an_tab_docs },
  ];

  return (
    <div className={`flex flex-col h-full bg-slate-50/50 p-4 md:p-6 overflow-hidden ${isRtl ? 'font-vazir' : 'font-sans'}`}>
      <div className="mb-6 shrink-0 flex items-center justify-between">
         <div>
            <h1 className="text-xl font-black text-slate-900">{t.an_title}</h1>
            <p className="text-xs font-medium text-slate-500 mt-1">{t.an_subtitle}</p>
         </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0 overflow-hidden">
        {/* Sidebar using SideMenu component to match UserProfile */}
        <div className="w-full md:w-64 shrink-0">
            <SideMenu 
               title={t.an_title} 
               items={tabs} 
               activeId={activeTab} 
               onChange={setActiveTab} 
               isRtl={isRtl} 
            />
        </div>
        
        {/* Content Area */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-hidden flex flex-col">
          {activeTab === 'details' && renderDetailsTab()}
          {activeTab === 'docs' && renderDocsTab()}
        </div>
      </div>
    </div>
  );
};

window.AutoNumbering = AutoNumbering;
export default AutoNumbering;
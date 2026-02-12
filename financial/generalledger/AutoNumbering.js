/* Filename: financial/generalledger/AutoNumbering.js */
import React, { useState } from 'react';
import { 
  Settings, Tag, File, Layers, Save, Edit, AlertCircle,  // ✅ FIXED: Hash→Tag, FileDigit→File, ShieldCheck→Shield
  Shield, RotateCcw, X as XIcon, Box, CheckSquare, List
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
    { id: 103, title: isRtl ? 'دفتر روزنامه کل' : 'Daily Journal', resetYear: true, uniquenessScope: 'none' },
  ];

  // --- States ---
  const [activeTab, setActiveTab] = useState('details');
  
  // Details
  const [details, setDetails] = useState(INITIAL_DETAILS);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingDetail, setEditingDetail] = useState(null);
  const [detailFormData, setDetailFormData] = useState({});

  // Accounts
  const [accounts, setAccounts] = useState(INITIAL_ACCOUNTS);

  // Documents
  const [docs, setDocs] = useState(INITIAL_DOCS);
  const [showDocModal, setShowDocModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [docFormData, setDocFormData] = useState({});

  // --- Handlers ---
  
  // Details Tab
  const openDetailModal = (detail) => {
    setEditingDetail(detail);
    setDetailFormData({ ...detail });
    setShowDetailModal(true);
  };

  const saveDetail = () => {
    setDetails(prev => prev.map(d => d.id === editingDetail.id ? detailFormData : d));
    setShowDetailModal(false);
  };

  const handleLengthChange = (e) => {
    const len = parseInt(e.target.value) || 1;
    const newStart = '1'.padStart(len, '0');
    const newEnd = '9'.repeat(len);
    setDetailFormData({ 
      ...detailFormData, 
      length: len, 
      startCode: newStart, 
      endCode: newEnd 
    });
  };

  // Accounts Tab
  const updateAccSetting = (level, field, value) => {
    setAccounts(prev => ({
      ...prev,
      [level]: { ...prev[level], [field]: value }
    }));
  };

  const handleAccLengthChange = (level, newLen) => {
    const len = parseInt(newLen) || 1;
    const newStart = level === 'group' ? '1'.padStart(len, '0') : '0'.repeat(len - 1) + '1';
    const newEnd = '9'.repeat(len);
    setAccounts(prev => ({
      ...prev,
      [level]: { ...prev[level], length: len, startCode: newStart, endCode: newEnd }
    }));
  };

  // Docs Tab
  const openDocModal = (doc) => {
    setEditingDoc(doc);
    setDocFormData({ ...doc });
    setShowDocModal(true);
  };

  const saveDoc = () => {
    setDocs(prev => prev.map(d => d.id === editingDoc.id ? docFormData : d));
    setShowDocModal(false);
  };

  // --- Render Functions ---
  
  const renderDetailsTab = () => (
    <div className="space-y-4 h-full flex flex-col">
      <div className="shrink-0">
        <h3 className="text-sm font-black text-slate-700 mb-1">{t.an_dt_subtitle}</h3>
        <p className="text-xs text-slate-500">{t.an_dt_desc}</p>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-2">
          {details.map(detail => (
            <div 
              key={detail.id} 
              className="bg-slate-50 border border-slate-200 rounded-lg p-3 hover:bg-white hover:shadow-md transition-all cursor-pointer group"
              onClick={() => openDetailModal(detail)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-bold text-slate-700 text-xs mb-1">{detail.title}</div>
                  <div className="flex items-center gap-4 text-[10px] text-slate-500 font-mono">
                    <span>{t.an_dt_length}: <strong className="text-indigo-600">{detail.length}</strong></span>
                    <span>{t.an_dt_range}: <strong>{detail.startCode}</strong> - <strong>{detail.endCode}</strong></span>
                    <span>{t.an_dt_last}: <strong className="text-emerald-600">{detail.lastCode}</strong></span>
                  </div>
                </div>
                <Button variant="ghost" size="iconSm" icon={Edit} className="opacity-0 group-hover:opacity-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* MODAL: Detail Settings */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={isRtl ? 'تنظیمات شماره‌گذاری تفصیل' : 'Detail Numbering Settings'}
        footer={<><Button variant="outline" onClick={() => setShowDetailModal(false)}>{t.btn_cancel}</Button><Button variant="primary" onClick={saveDetail}>{t.btn_save}</Button></>}
      >
         <div className="space-y-4">
            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center gap-2">
               <Tag size={16} className="text-indigo-600"/>
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

  const renderAccountsTab = () => {
    const Card = ({ title, data, level, icon: Icon }) => (
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300">
         <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
               <Icon size={16} />
            </div>
            <div className="font-bold text-sm text-slate-700">{title}</div>
         </div>
         <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
               <InputField label={t.an_acc_len} type="number" size="sm" value={data.length} onChange={e => handleAccLengthChange(level, e.target.value)} isRtl={isRtl} />
               <SelectField label={t.an_mode} size="sm" value={data.mode} onChange={e => updateAccSetting(level, 'mode', e.target.value)} isRtl={isRtl}>
                  <option value="auto">{t.an_mode_auto}</option>
                  <option value="manual">{t.an_mode_manual}</option>
               </SelectField>
            </div>
            <div className="grid grid-cols-2 gap-2">
               <InputField label={t.an_dt_start} size="sm" value={data.startCode} readOnly className="bg-slate-50" isRtl={isRtl} />
               <InputField label={t.an_dt_end} size="sm" value={data.endCode} readOnly className="bg-slate-50" isRtl={isRtl} />
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded p-2 text-xs text-emerald-700 font-mono flex items-center justify-between">
               <span>{t.an_dt_last}:</span>
               <strong>{data.lastCode}</strong>
            </div>
         </div>
      </div>
    );

    return (
      <div className="space-y-4 h-full flex flex-col">
        <div className="shrink-0">
          <h3 className="text-sm font-black text-slate-700 mb-1">{t.an_acc_subtitle}</h3>
          <p className="text-xs text-slate-500">{t.an_acc_desc}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card title={t.an_group} data={accounts.group} level="group" icon={Layers} />
          <Card title={t.an_general} data={accounts.general} level="general" icon={List} />
          <Card title={t.an_subsidiary} data={accounts.subsidiary} level="subsidiary" icon={File} />
        </div>
      </div>
    );
  };

  const renderDocsTab = () => (
    <div className="space-y-4 h-full flex flex-col">
      <div className="shrink-0">
        <h3 className="text-sm font-black text-slate-700 mb-1">{t.an_doc_subtitle}</h3>
        <p className="text-xs text-slate-500">{t.an_doc_desc}</p>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-2">
          {docs.map(doc => (
            <div 
              key={doc.id} 
              className="bg-slate-50 border border-slate-200 rounded-lg p-3 hover:bg-white hover:shadow-md transition-all cursor-pointer group"
              onClick={() => openDocModal(doc)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-bold text-slate-700 text-xs mb-2">{doc.title}</div>
                  <div className="flex items-center gap-4 text-[10px]">
                    <Badge variant={doc.resetYear ? 'success' : 'neutral'}>{doc.resetYear ? (isRtl ? 'ریست سالانه' : 'Annual Reset') : (isRtl ? 'ادامه‌دار' : 'Continuous')}</Badge>
                    <span className="text-slate-500">{isRtl ? 'محدوده یکتایی:' : 'Uniqueness:'} <strong className="text-indigo-600">{t[`an_scope_${doc.uniquenessScope}`] || doc.uniquenessScope}</strong></span>
                  </div>
                </div>
                <Button variant="ghost" size="iconSm" icon={Edit} className="opacity-0 group-hover:opacity-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* MODAL: Document Settings */}
      <Modal
        isOpen={showDocModal}
        onClose={() => setShowDocModal(false)}
        title={isRtl ? 'تنظیمات شماره‌گذاری سند' : 'Document Numbering Settings'}
        footer={<><Button variant="outline" onClick={() => setShowDocModal(false)}>{t.btn_cancel}</Button><Button variant="primary" onClick={saveDoc}>{t.btn_save}</Button></>}
      >
         <div className="space-y-4">
            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center gap-2">
               <File size={16} className="text-indigo-600"/>
               <span className="font-bold text-xs">{editingDoc?.title}</span>
            </div>

            <div className="space-y-3">
               <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                  <span className="text-xs font-bold text-slate-600">{isRtl ? 'ریست سالانه شماره‌گذاری' : 'Annual Numbering Reset'}</span>
                  <Toggle checked={docFormData.resetYear} onChange={val => setDocFormData({...docFormData, resetYear: val})} />
               </div>

               <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">{isRtl ? 'محدوده یکتا بودن شماره سند' : 'Document Number Uniqueness Scope'}</label>
                  <div className="flex gap-2">
                     {['ledger', 'branch', 'none'].map(scope => (
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
         </div>
      </Modal>
    </div>
  );

  const tabs = [
    { id: 'details', icon: Tag, label: t.an_tab_details },    // ✅ FIXED: Hash → Tag
    { id: 'accounts', icon: File, label: t.an_tab_accounts }, // ✅ FIXED: FileDigit → File
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
          {activeTab === 'accounts' && renderAccountsTab()}
          {activeTab === 'docs' && renderDocsTab()}
        </div>
      </div>
    </div>
  );
};

window.AutoNumbering = AutoNumbering;
export default AutoNumbering;
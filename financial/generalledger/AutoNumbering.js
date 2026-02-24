/* Filename: financial/generalledger/AutoNumbering.js */
import React, { useState, useEffect } from 'react';
import { 
  Settings, Hash, Layers, Save, Edit, AlertCircle, 
  ShieldCheck, RotateCcw, X as XIcon, Box, CheckSquare, List
} from 'lucide-react';

const AutoNumbering = ({ t, isRtl }) => {
  const { 
    Button, InputField, SelectField, DataGrid, Modal, Badge, SideMenu, ToggleChip 
  } = window.UI;
  const supabase = window.supabase;

  // --- States ---
  const [activeTab, setActiveTab] = useState('details'); 
  
  // Details State
  const [detailSettings, setDetailSettings] = useState([]);
  const [editingDetail, setEditingDetail] = useState(null);
  const [detailFormData, setDetailFormData] = useState({});
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Docs State
  const [docSettings, setDocSettings] = useState([
    { id: 101, title: isRtl ? 'دفتر کل مرکزی' : 'Main General Ledger', resetYear: true, uniquenessScope: 'ledger' },
    { id: 102, title: isRtl ? 'دفتر کل ارزی' : 'Currency Ledger', resetYear: false, uniquenessScope: 'branch' },
    { id: 103, title: isRtl ? 'دفتر کل پروژه ها' : 'Projects Ledger', resetYear: true, uniquenessScope: 'none' },
  ]);
  const [editingDoc, setEditingDoc] = useState(null);
  const [docFormData, setDocFormData] = useState({});
  const [showDocModal, setShowDocModal] = useState(false);

  useEffect(() => {
    fetchDetailSettings();
  }, []);

  const fetchDetailSettings = async () => {
    try {
      const { data, error } = await supabase.schema('gl').from('detail_types').select('*').order('code');
      if (error) throw error;
      setDetailSettings((data || []).map(d => ({
        id: d.id,
        code: d.code,
        title: d.title,
        length: d.numbering_length || 4,
        startCode: d.start_code || '',
        endCode: d.end_code || '',
        lastCode: d.last_code || ''
      })));
    } catch (err) {
      console.error(err);
    }
  };

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

  const saveDetail = async () => {
    const len = parseInt(detailFormData.length);
    if (len < 1 || len > 20) return alert(isRtl ? "طول کد باید بین ۱ تا ۲۰ باشد" : "Length must be between 1 and 20");
    
    if (detailFormData.startCode && detailFormData.startCode.length !== len) return alert(isRtl ? `کد شروع حتما باید ${len} رقمی باشد` : `Start code must be exactly ${len} digits`);
    if (detailFormData.endCode && detailFormData.endCode.length !== len) return alert(isRtl ? `کد پایان حتما باید ${len} رقمی باشد` : `End code must be exactly ${len} digits`);

    try {
       await supabase.schema('gl').from('detail_types').update({
          numbering_length: len,
          start_code: detailFormData.startCode,
          end_code: detailFormData.endCode,
          last_code: detailFormData.lastCode
       }).eq('id', editingDetail.id);
       
       setShowDetailModal(false);
       fetchDetailSettings();
    } catch(err) {
       console.error(err);
       alert(isRtl ? 'خطا در ذخیره اطلاعات' : 'Save Error');
    }
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
              { field: 'code', header: isRtl ? 'کد سیستم' : 'Sys Code', width: 'w-32', render: r => <span className="text-slate-500 font-mono text-[10px]">{r.code}</span> },
              { field: 'title', header: t.an_dt_type || (isRtl ? 'نوع تفصیل' : 'Detail Type'), width: 'w-64', render: r => <span className="font-bold text-slate-700">{r.title}</span> },
              { field: 'length', header: t.an_dt_length || (isRtl ? 'طول کد' : 'Length'), width: 'w-32', render: r => <span className="font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100 font-bold text-xs">{r.length}</span> },
              { field: 'startCode', header: t.an_dt_start || (isRtl ? 'کد شروع' : 'Start Code'), width: 'w-32', render: r => <span className="font-mono text-slate-500">{r.startCode || '-'}</span> },
              { field: 'endCode', header: t.an_dt_end || (isRtl ? 'کد پایان' : 'End Code'), width: 'w-32', render: r => <span className="font-mono text-slate-500">{r.endCode || '-'}</span> },
              { field: 'lastCode', header: t.an_dt_last || (isRtl ? 'آخرین کد' : 'Last Code'), width: 'w-48', render: r => <Badge variant="neutral" className="font-mono">{r.lastCode || '-'}</Badge> },
           ]}
           data={detailSettings}
           isRtl={isRtl}
           actions={(row) => (
              <Button variant="ghost" size="iconSm" icon={Edit} onClick={() => openDetailModal(row)} className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"/>
           )}
         />
       </div>

       <Modal
         isOpen={showDetailModal}
         onClose={() => setShowDetailModal(false)}
         title={t.an_edit_dt || (isRtl ? 'ویرایش تنظیمات تفصیل' : 'Edit Detail Settings')}
         size="md"
         footer={<><Button variant="outline" onClick={() => setShowDetailModal(false)}>{t.btn_cancel || (isRtl ? 'انصراف' : 'Cancel')}</Button><Button variant="primary" onClick={saveDetail}>{t.btn_save || (isRtl ? 'ذخیره' : 'Save')}</Button></>}
       >
          <div className="flex flex-col gap-4">
             <div className="flex items-center gap-2 p-2 bg-slate-50 rounded border border-slate-200 text-slate-700">
                <Hash size={16} className="text-indigo-500"/>
                <span className="font-bold text-xs">{editingDetail?.title} <span className="text-[10px] text-slate-400 font-normal">({editingDetail?.code})</span></span>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
                <InputField 
                  label={t.an_dt_length || (isRtl ? 'طول کد' : 'Length')} 
                  type="number" 
                  value={detailFormData.length || ''} 
                  onChange={handleLengthChange} 
                  isRtl={isRtl} 
                />
                <InputField 
                  label={t.an_dt_last || (isRtl ? 'آخرین کد ثبت شده' : 'Last Code')} 
                  value={detailFormData.lastCode || ''} 
                  onChange={e => setDetailFormData({...detailFormData, lastCode: e.target.value})} 
                  isRtl={isRtl} 
                />
                <InputField label={t.an_dt_start || (isRtl ? 'کد شروع' : 'Start Code')} value={detailFormData.startCode || ''} onChange={e => setDetailFormData({...detailFormData, startCode: e.target.value})} isRtl={isRtl} />
                <InputField label={t.an_dt_end || (isRtl ? 'کد پایان' : 'End Code')} value={detailFormData.endCode || ''} onChange={e => setDetailFormData({...detailFormData, endCode: e.target.value})} isRtl={isRtl} />
             </div>
             
             <div className="text-[10px] text-orange-600 bg-orange-50 p-2 rounded border border-orange-100 flex items-center gap-2">
                <AlertCircle size={12} className="shrink-0"/>
                <span>{isRtl ? 'تعداد ارقام کد شروع و پایان باید دقیقاً برابر با طول مجاز باشد.' : 'Start/End codes length must exactly match Max Length.'}</span>
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
                { field: 'title', header: t.lg_title || 'عنوان', width: 'w-64', render: r => <span className="font-bold text-slate-700">{r.title}</span> },
                { 
                   field: 'resetYear', 
                   header: t.an_reset_year || 'ریست سالانه', 
                   width: 'w-48', 
                   render: r => (
                      <Badge variant={r.resetYear ? 'success' : 'neutral'} icon={r.resetYear ? RotateCcw : XIcon}>
                         {r.resetYear ? (t.active || 'فعال') : (t.inactive || 'غیرفعال')}
                      </Badge>
                   )
                },
                { 
                   field: 'uniquenessScope', 
                   header: t.an_unique_scope || 'دامنه یکتایی', 
                   width: 'w-48', 
                   render: r => (
                      <Badge variant="primary" icon={ShieldCheck}>
                         {r.uniquenessScope === 'none' ? (isRtl ? '---' : 'None') : (t[`an_scope_${r.uniquenessScope}`] || r.uniquenessScope)}
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

       <Modal
         isOpen={showDocModal}
         onClose={() => setShowDocModal(false)}
         title={t.an_tab_docs || 'تنظیمات اسناد'}
         footer={<><Button variant="outline" onClick={() => setShowDocModal(false)}>{t.btn_cancel || 'انصراف'}</Button><Button variant="primary" onClick={saveDoc}>{t.btn_save || 'ذخیره'}</Button></>}
       >
          <div className="flex flex-col gap-6">
             <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100 text-indigo-900">
                <Settings size={20}/>
                <span className="font-bold">{editingDoc?.title}</span>
             </div>

             <div className="flex items-center gap-2">
                <input 
                   type="checkbox" 
                   id="resetYearCheck"
                   className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                   checked={docFormData.resetYear} 
                   onChange={e => setDocFormData({...docFormData, resetYear: e.target.checked})}
                />
                <label htmlFor="resetYearCheck" className="text-sm font-bold text-slate-700 select-none cursor-pointer">
                   {t.an_reset_year || 'ریست سالانه'}
                </label>
             </div>
             
             <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-600">{t.an_unique_scope || 'دامنه یکتایی'}</label>
                <div className="flex flex-wrap gap-2">
                   {['none', 'branch', 'ledger', 'company'].map(scope => (
                      <ToggleChip 
                         key={scope}
                         label={scope === 'none' ? (isRtl ? 'بدون کنترل' : 'None') : (t[`an_scope_${scope}`] || scope)}
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
    { id: 'details', icon: Hash, label: t.an_tab_details || (isRtl ? 'شماره‌گذاری تفصیل‌ها' : 'Details Numbering') },
    { id: 'docs', icon: Settings, label: t.an_tab_docs || (isRtl ? 'تنظیمات اسناد' : 'Document Settings') },
  ];

  return (
    <div className={`flex flex-col h-full bg-slate-50/50 p-4 md:p-6 overflow-hidden ${isRtl ? 'font-vazir' : 'font-sans'}`}>
      <div className="mb-6 shrink-0 flex items-center justify-between">
         <div>
            <h1 className="text-xl font-black text-slate-900">{t.an_title || (isRtl ? 'تنظیمات شماره‌گذاری' : 'Auto Numbering')}</h1>
            <p className="text-xs font-medium text-slate-500 mt-1">{t.an_subtitle || (isRtl ? 'مدیریت و پیکربندی الگوهای تولید کد' : 'Manage and configure code generation patterns')}</p>
         </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0 overflow-hidden">
        <div className="w-full md:w-64 shrink-0">
            <SideMenu 
               title={t.an_title || (isRtl ? 'تنظیمات شماره‌گذاری' : 'Auto Numbering')} 
               items={tabs} 
               activeId={activeTab} 
               onChange={setActiveTab} 
               isRtl={isRtl} 
            />
        </div>
        
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
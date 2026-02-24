/* Filename: financial/generalledger/AutoNumbering.js */
import React, { useState, useEffect, Fragment } from 'react';
import { 
  Settings, Hash, Layers, Save, Edit, AlertCircle, 
  ShieldCheck, RotateCcw, X as XIcon, Box, CheckSquare, List
} from 'lucide-react';

// تابع کمکی و امن برای پردازش JSON
const parseMeta = (meta) => {
    if (!meta) return {};
    if (typeof meta === 'object') return meta;
    try { 
        return JSON.parse(meta) || {}; 
    } catch (e) { 
        console.warn('Error parsing metadata JSON:', e);
        return {}; 
    }
};

const AutoNumbering = ({ t, isRtl }) => {
  const tSafe = t || {}; // جلوگیری از خطای undefined برای t
  const UI = window.UI || {};
  const { 
    Button, InputField, SelectField, DataGrid, Modal, Badge, SideMenu, ToggleChip 
  } = UI;
  const supabase = window.supabase;

  // --- States ---
  const [activeTab, setActiveTab] = useState('details'); 
  const [fiscalYears, setFiscalYears] = useState([]);
  const [branches, setBranches] = useState([]);
  
  // Details State
  const [detailSettings, setDetailSettings] = useState([]);
  const [editingDetail, setEditingDetail] = useState(null);
  const [detailFormData, setDetailFormData] = useState({});
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Docs State (Ledgers)
  const [docSettings, setDocSettings] = useState([]);
  const [editingDoc, setEditingDoc] = useState(null);
  const [docFormData, setDocFormData] = useState({});
  const [showDocModal, setShowDocModal] = useState(false);

  // View Numbers State
  const [viewingDocNumbers, setViewingDocNumbers] = useState(null);
  const [showNumbersModal, setShowNumbersModal] = useState(false);

  useEffect(() => {
    fetchDetailSettings();
    fetchDocSettings();
  }, []);

  const fetchDetailSettings = async () => {
    if (!supabase) return;
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
      console.error('Error fetching detail settings:', err);
    }
  };

  const fetchDocSettings = async () => {
    if (!supabase) return;
    try {
      const { data: fyData } = await supabase.schema('gl').from('fiscal_years').select('id, title').order('code', { ascending: false });
      if (fyData) setFiscalYears(fyData);

      const { data: brData } = await supabase.schema('gen').from('branches').select('id, title').eq('is_active', true).order('title');
      if (brData) setBranches(brData);

      const { data: ledgersData, error } = await supabase.schema('gl').from('ledgers').select('*').order('title');
      if (error) throw error;

      const mappedLedgers = (ledgersData || []).map(l => {
         const meta = parseMeta(l.metadata);
         return {
            id: l.id,
            title: l.title,
            metadata: meta, 
            resetYear: meta.resetYear !== undefined ? meta.resetYear : true,
            uniquenessScope: meta.uniquenessScope || 'ledger',
            lastNumbers: meta.lastNumbers || {}
         };
      });
      setDocSettings(mappedLedgers);
    } catch (err) {
      console.error('Error fetching doc settings:', err);
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

  // --- Handlers: Docs (Ledgers) ---
  const openDocModal = (item) => {
    setEditingDoc(item);
    setDocFormData({ resetYear: item.resetYear, uniquenessScope: item.uniquenessScope });
    setShowDocModal(true);
  };

  const saveDoc = async () => {
    try {
        const payloadMeta = {
            ...(editingDoc.metadata || {}),
            resetYear: docFormData.resetYear,
            uniquenessScope: docFormData.uniquenessScope
        };

        const { error } = await supabase.schema('gl').from('ledgers').update({ metadata: payloadMeta }).eq('id', editingDoc.id);
        if (error) throw error;

        setShowDocModal(false);
        fetchDocSettings();
    } catch (err) {
        console.error('Error saving ledger settings:', err);
        alert(isRtl ? 'خطا در ذخیره تنظیمات شماره‌گذاری اسناد' : 'Error saving document numbering settings');
    }
  };

  const openNumbersModal = (item) => {
     setViewingDocNumbers(item);
     setShowNumbersModal(true);
  };

  // --- Render Sections ---

  const renderDetailsTab = () => (
    <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-500">
       <div className="flex-1 overflow-hidden">
         <DataGrid 
           columns={[
              { field: 'code', header: isRtl ? 'کد سیستم' : 'Sys Code', width: 'w-32', render: r => <span className="text-slate-500 font-mono text-[10px]">{r.code}</span> },
              { field: 'title', header: tSafe.an_dt_type || (isRtl ? 'نوع تفصیل' : 'Detail Type'), width: 'w-64', render: r => <span className="font-bold text-slate-700">{r.title}</span> },
              { field: 'length', header: tSafe.an_dt_length || (isRtl ? 'طول کد' : 'Length'), width: 'w-32', render: r => <span className="font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100 font-bold text-xs">{r.length}</span> },
              { field: 'startCode', header: tSafe.an_dt_start || (isRtl ? 'کد شروع' : 'Start Code'), width: 'w-32', render: r => <span className="font-mono text-slate-500">{r.startCode || '-'}</span> },
              { field: 'endCode', header: tSafe.an_dt_end || (isRtl ? 'کد پایان' : 'End Code'), width: 'w-32', render: r => <span className="font-mono text-slate-500">{r.endCode || '-'}</span> },
              { field: 'lastCode', header: tSafe.an_dt_last || (isRtl ? 'آخرین کد' : 'Last Code'), width: 'w-48', render: r => <Badge variant="neutral" className="font-mono">{r.lastCode || '-'}</Badge> },
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
         title={tSafe.an_edit_dt || (isRtl ? 'ویرایش تنظیمات تفصیل' : 'Edit Detail Settings')}
         size="md"
         footer={<><Button variant="outline" onClick={() => setShowDetailModal(false)}>{tSafe.btn_cancel || (isRtl ? 'انصراف' : 'Cancel')}</Button><Button variant="primary" onClick={saveDetail}>{tSafe.btn_save || (isRtl ? 'ذخیره' : 'Save')}</Button></>}
       >
          <div className="flex flex-col gap-4">
             <div className="flex items-center gap-2 p-2 bg-slate-50 rounded border border-slate-200 text-slate-700">
                <Hash size={16} className="text-indigo-500"/>
                <span className="font-bold text-xs">{editingDetail?.title} <span className="text-[10px] text-slate-400 font-normal">({editingDetail?.code})</span></span>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
                <InputField 
                  label={tSafe.an_dt_length || (isRtl ? 'طول کد' : 'Length')} 
                  type="number" 
                  value={detailFormData.length || ''} 
                  onChange={handleLengthChange} 
                  isRtl={isRtl} 
                />
                <InputField 
                  label={tSafe.an_dt_last || (isRtl ? 'آخرین کد ثبت شده' : 'Last Code')} 
                  value={detailFormData.lastCode || ''} 
                  onChange={e => setDetailFormData({...detailFormData, lastCode: e.target.value})} 
                  isRtl={isRtl} 
                />
                <InputField label={tSafe.an_dt_start || (isRtl ? 'کد شروع' : 'Start Code')} value={detailFormData.startCode || ''} onChange={e => setDetailFormData({...detailFormData, startCode: e.target.value})} isRtl={isRtl} />
                <InputField label={tSafe.an_dt_end || (isRtl ? 'کد پایان' : 'End Code')} value={detailFormData.endCode || ''} onChange={e => setDetailFormData({...detailFormData, endCode: e.target.value})} isRtl={isRtl} />
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
                { field: 'title', header: tSafe.lg_title || 'دفتر کل', width: 'w-64', render: r => <span className="font-bold text-slate-700">{r.title}</span> },
                { 
                   field: 'resetYear', 
                   header: tSafe.an_reset_year || (isRtl ? 'ریست سالانه' : 'Reset Annually'), 
                   width: 'w-48', 
                   render: r => (
                      <Badge variant={r.resetYear ? 'success' : 'neutral'} icon={r.resetYear ? RotateCcw : XIcon}>
                         {r.resetYear ? (tSafe.active || 'فعال') : (tSafe.inactive || 'غیرفعال')}
                      </Badge>
                   )
                },
                { 
                   field: 'uniquenessScope', 
                   header: tSafe.an_unique_scope || (isRtl ? 'دامنه کنترل شماره' : 'Uniqueness Scope'), 
                   width: 'w-48', 
                   render: r => (
                      <Badge variant="primary" icon={ShieldCheck}>
                         {r.uniquenessScope === 'none' ? (isRtl ? 'بدون کنترل (دستی)' : 'None (Manual)') : (tSafe[`an_scope_${r.uniquenessScope}`] || (isRtl && r.uniquenessScope === 'branch' ? 'دفتر و شعبه' : isRtl && r.uniquenessScope === 'ledger' ? 'دفتر کل' : r.uniquenessScope))}
                      </Badge>
                   )
                },
             ]}
             data={docSettings}
             isRtl={isRtl}
             actions={(row) => (
                <div className="flex gap-1 justify-center">
                   <Button variant="ghost" size="iconSm" icon={Hash} onClick={() => openNumbersModal(row)} className="text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50" title={isRtl ? 'مشاهده شماره‌ها' : 'View Numbers'}/>
                   <Button variant="ghost" size="iconSm" icon={Edit} onClick={() => openDocModal(row)} className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50" title={isRtl ? 'ویرایش تنظیمات' : 'Edit Settings'}/>
                </div>
             )}
          />
       </div>

       {/* Edit Document Numbering Settings Modal */}
       <Modal
         isOpen={showDocModal}
         onClose={() => setShowDocModal(false)}
         title={tSafe.an_tab_docs || (isRtl ? 'تنظیمات شماره‌گذاری اسناد' : 'Document Settings')}
         size="sm"
         footer={<><Button variant="outline" onClick={() => setShowDocModal(false)}>{tSafe.btn_cancel || (isRtl ? 'انصراف' : 'Cancel')}</Button><Button variant="primary" onClick={saveDoc}>{tSafe.btn_save || (isRtl ? 'ذخیره' : 'Save')}</Button></>}
       >
          <div className="flex flex-col gap-5">
             <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100 text-indigo-900">
                <Settings size={20} className="shrink-0"/>
                <span className="font-bold">{editingDoc?.title}</span>
             </div>

             <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-600">{tSafe.an_unique_scope || (isRtl ? 'دامنه تولید و کنترل شماره' : 'Numbering Scope')}</label>
                <div className="flex flex-wrap gap-2">
                   {['none', 'branch', 'ledger'].map(scope => {
                      let label = scope;
                      if (scope === 'none') label = isRtl ? 'بدون کنترل (دستی)' : 'None (Manual)';
                      else if (scope === 'branch') label = isRtl ? 'دفتر و شعبه' : 'Ledger & Branch';
                      else if (scope === 'ledger') label = isRtl ? 'دفتر کل' : 'Ledger Only';

                      return (
                         <ToggleChip 
                            key={scope}
                            label={label}
                            checked={docFormData.uniquenessScope === scope}
                            onClick={() => setDocFormData({...docFormData, uniquenessScope: scope})}
                            colorClass="green"
                         />
                      );
                   })}
                </div>
             </div>

             <div className="flex items-center justify-between bg-slate-50 border border-slate-200 p-3 rounded-lg">
                <label htmlFor="resetYearCheck" className="text-sm font-bold text-slate-700 select-none cursor-pointer">
                   {tSafe.an_reset_year || (isRtl ? 'ریست شماره در سال جدید' : 'Reset numbering in new FY')}
                </label>
                <input 
                   type="checkbox" 
                   id="resetYearCheck"
                   className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                   checked={docFormData.resetYear || false} 
                   onChange={e => setDocFormData({...docFormData, resetYear: e.target.checked})}
                />
             </div>
          </div>
       </Modal>

       {/* View Last Generated Numbers Modal (Read-Only) */}
       <Modal
         isOpen={showNumbersModal}
         onClose={() => setShowNumbersModal(false)}
         title={isRtl ? 'آخرین شماره‌های تولید شده' : 'Last Generated Numbers'}
         size="sm"
         footer={<Button variant="outline" onClick={() => setShowNumbersModal(false)}>{isRtl ? 'بستن' : 'Close'}</Button>}
       >
          <div className="flex flex-col gap-3">
             <div className="flex items-center gap-2 p-2 bg-slate-50 rounded border border-slate-200 text-slate-700 mb-1">
                <Hash size={16} className="text-indigo-500 shrink-0"/>
                <span className="font-bold text-xs">{viewingDocNumbers?.title}</span>
             </div>

             {viewingDocNumbers?.uniquenessScope === 'none' ? (
                <div className="p-6 text-center text-slate-500 bg-slate-50 rounded border border-slate-100 text-sm">
                   {isRtl ? 'شماره‌گذاری برای این دفتر به صورت دستی تنظیم شده است.' : 'Numbering for this ledger is set to manual.'}
                </div>
             ) : (
                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden max-h-[350px] overflow-y-auto custom-scrollbar">
                   <table className="w-full text-xs text-right">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 sticky top-0 z-10 shadow-sm">
                         <tr>
                            {viewingDocNumbers?.resetYear && <th className="p-2.5 font-bold">{isRtl ? 'سال مالی' : 'Fiscal Year'}</th>}
                            {viewingDocNumbers?.uniquenessScope === 'branch' && <th className="p-2.5 font-bold">{isRtl ? 'شعبه' : 'Branch'}</th>}
                            {(!viewingDocNumbers?.resetYear && viewingDocNumbers?.uniquenessScope === 'ledger') && <th className="p-2.5 font-bold">{isRtl ? 'دفتر کل' : 'Ledger'}</th>}
                            <th className="p-2.5 font-bold w-32">{isRtl ? 'آخرین شماره' : 'Last Number'}</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                         {(() => {
                            const scope = viewingDocNumbers?.uniquenessScope;
                            const resetYear = viewingDocNumbers?.resetYear;
                            const lastNums = viewingDocNumbers?.lastNumbers || {};

                            if (resetYear) {
                                // Reset annually -> group by FY
                                if (fiscalYears.length === 0) {
                                    return <tr><td colSpan={scope === 'branch' ? 3 : 2} className="p-4 text-center text-slate-400 italic">{isRtl ? 'سال مالی یافت نشد' : 'No fiscal years'}</td></tr>;
                                }
                                return fiscalYears.map(fy => {
                                    const fyNumbers = lastNums[fy.id];
                                    if (scope === 'branch') {
                                        if (branches.length === 0) return null;
                                        return (
                                            <Fragment key={fy.id}>
                                                {branches.map((br, index) => {
                                                    const brNum = (typeof fyNumbers === 'object' && fyNumbers !== null) ? fyNumbers[br.id] : null;
                                                    return (
                                                        <tr key={`${fy.id}_${br.id}`} className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
                                                           {index === 0 && (
                                                              <td rowSpan={branches.length} className="p-2.5 text-slate-800 font-bold bg-slate-100/40 align-middle text-center border-x border-slate-200">
                                                                 {fy.title}
                                                              </td>
                                                           )}
                                                           <td className="p-2.5 text-slate-700 font-medium">{br.title}</td>
                                                           <td className="p-2.5">
                                                              <Badge variant="neutral" className="font-mono bg-white border-slate-200 px-2 py-0.5 text-[11px]">
                                                                 {brNum || '0'}
                                                              </Badge>
                                                           </td>
                                                        </tr>
                                                    );
                                                })}
                                            </Fragment>
                                        );
                                    } else {
                                        const num = (typeof fyNumbers === 'object') ? '0' : fyNumbers;
                                        return (
                                           <tr key={fy.id} className="hover:bg-slate-50 transition-colors">
                                              <td className="p-2.5 text-slate-700 font-medium">{fy.title}</td>
                                              <td className="p-2.5">
                                                 <Badge variant="neutral" className="font-mono bg-slate-100 px-2 py-0.5 text-[11px]">
                                                    {num || '0'}
                                                 </Badge>
                                              </td>
                                           </tr>
                                        );
                                    }
                                });
                            } else {
                                // No annual reset -> flat list
                                if (scope === 'branch') {
                                    if (branches.length === 0) {
                                        return <tr><td colSpan="2" className="p-4 text-center text-slate-400 italic">{isRtl ? 'شعبه‌ای یافت نشد' : 'No branches'}</td></tr>;
                                    }
                                    return branches.map(br => {
                                        const brNum = lastNums[br.id];
                                        return (
                                            <tr key={br.id} className="hover:bg-slate-50 transition-colors">
                                               <td className="p-2.5 text-slate-700 font-medium">{br.title}</td>
                                               <td className="p-2.5">
                                                  <Badge variant="neutral" className="font-mono bg-slate-100 px-2 py-0.5 text-[11px]">
                                                     {brNum || '0'}
                                                  </Badge>
                                               </td>
                                            </tr>
                                        );
                                    });
                                } else {
                                    // Ledger scope without reset: single global number
                                    let globalNum = 0;
                                    if (typeof lastNums === 'number' || typeof lastNums === 'string') {
                                        globalNum = lastNums;
                                    } else if (typeof lastNums === 'object' && lastNums !== null) {
                                        globalNum = lastNums.global || lastNums.ledger || 0;
                                    }
                                    return (
                                        <tr className="hover:bg-slate-50 transition-colors">
                                           <td className="p-2.5 text-slate-700 font-medium">{viewingDocNumbers?.title}</td>
                                           <td className="p-2.5">
                                              <Badge variant="neutral" className="font-mono bg-slate-100 px-2 py-0.5 text-[11px]">
                                                 {globalNum || '0'}
                                              </Badge>
                                           </td>
                                        </tr>
                                    );
                                }
                            }
                         })()}
                      </tbody>
                   </table>
                </div>
             )}
          </div>
       </Modal>
    </div>
  );

  const tabs = [
    { id: 'details', icon: Hash, label: tSafe.an_tab_details || (isRtl ? 'شماره‌گذاری تفصیل‌ها' : 'Details Numbering') },
    { id: 'docs', icon: Settings, label: tSafe.an_tab_docs || (isRtl ? 'تنظیمات اسناد' : 'Document Settings') },
  ];

  return (
    <div className={`flex flex-col h-full bg-slate-50/50 p-4 md:p-6 overflow-hidden ${isRtl ? 'font-vazir' : 'font-sans'}`}>
      <div className="mb-6 shrink-0 flex items-center justify-between">
         <div>
            <h1 className="text-xl font-black text-slate-900">{tSafe.an_title || (isRtl ? 'تنظیمات شماره‌گذاری' : 'Auto Numbering')}</h1>
            <p className="text-xs font-medium text-slate-500 mt-1">{tSafe.an_subtitle || (isRtl ? 'مدیریت و پیکربندی الگوهای تولید کد' : 'Manage and configure code generation patterns')}</p>
         </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0 overflow-hidden">
        <div className="w-full md:w-64 shrink-0">
            <SideMenu 
               title={tSafe.an_title || (isRtl ? 'تنظیمات شماره‌گذاری' : 'Auto Numbering')} 
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
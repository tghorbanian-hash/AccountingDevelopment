/* Filename: financial/generalledger/ChartofAccounts.js */
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Folder, FolderOpen, FileText, Plus, Save, Trash2, 
  Settings, Search, Check, 
  AlertCircle, Layout, List, Layers, FileDigit, ArrowRight, Edit,
  TreeDeciduous, ShieldCheck, X, User, Ban,
  ChevronDown, Minimize2, Maximize2, UploadCloud, DownloadCloud, FileSpreadsheet
} from 'lucide-react';

// --- DATA CONSTANTS ---
const ACCOUNT_TYPES = [
  { id: 'permanent', labelFa: 'دائم (ترازنامه‌ای)', labelEn: 'Permanent (Balance Sheet)' },
  { id: 'temporary', labelFa: 'موقت (سود و زیانی)', labelEn: 'Temporary (P&L)' },
  { id: 'disciplinary', labelFa: 'انتظامی', labelEn: 'Disciplinary' },
];

const ACCOUNT_NATURES = [
  { id: 'debit', labelFa: 'بدهکار', labelEn: 'Debit' },
  { id: 'credit', labelFa: 'بستانکار', labelEn: 'Credit' },
  { id: 'none', labelFa: 'مهم نیست', labelEn: 'None' },
];

// --- CSV PARSER HELPER ---
const csvToArray = (text) => {
    let p = '', row = [''], ret = [row], i = 0, r = 0, s = !0, l;
    for (l of text) {
        if ('"' === l) {
            if (s && l === p) row[i] += l;
            s = !s;
        } else if (',' === l && s) l = row[++i] = '';
        else if ('\n' === l && s) {
            if ('\r' === p) row[i] = row[i].slice(0, -1);
            row = ret[++r] = [l = '']; i = 0;
        } else row[i] += l;
        p = l;
    }
    return ret.filter(r => r.length > 1 || r[0] !== '');
};

// --- SHARED HELPERS & SUB-COMPONENTS ---
const Checkbox = ({ label, checked, onChange, disabled, className = '' }) => (
  <div 
    className={`flex items-center gap-2 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer group'} ${className}`} 
    onClick={(e) => {
      e.stopPropagation();
      if (!disabled && onChange) onChange(!checked);
    }}
  >
    <div className={`
      w-4 h-4 rounded border flex items-center justify-center transition-all duration-200 shrink-0
      ${checked 
        ? 'bg-indigo-600 border-indigo-600 shadow-sm' 
        : 'bg-white border-slate-300 group-hover:border-indigo-400'}
    `}>
      {checked && <Check size={12} className="text-white" strokeWidth={3} />}
    </div>
    {label && <span className="text-[12px] font-medium text-slate-700 select-none">{label}</span>}
  </div>
);

const Tabs = ({ tabs, activeTab, onChange }) => (
  <div className="flex items-center gap-1 border-b border-slate-200 mb-4 overflow-x-auto no-scrollbar">
    {tabs.map(tab => (
      <button
        key={tab.id}
        onClick={() => onChange(tab.id)}
        className={`
          px-4 py-2 text-[12px] font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-2
          ${activeTab === tab.id 
            ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50' 
            : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}
        `}
      >
        {tab.icon && <tab.icon size={14} />}
        {tab.label}
      </button>
    ))}
  </div>
);

// --- FORM COMPONENTS ---

const AccountForm = ({ 
  formData, setFormData, structure, selectedNode, isRtl, 
  onOpenContraModal, contraAccountName, currencies, treeData 
}) => {
  const { InputField, SelectField, Button } = window.UI;

  const isSubsidiary = formData.level === 'subsidiary';
  const isGeneral = formData.level === 'general';
  const isGroup = formData.level === 'group';

  let prefix = '';
  if (!isGroup) {
     const findNode = (nodes, id) => {
        for (const n of nodes) {
           if (n.id === id) return n;
           if (n.children) {
              const f = findNode(n.children, id);
              if (f) return f;
           }
        }
        return null;
     };
     const pNode = findNode(treeData, formData.parentId);
     if (pNode) prefix = pNode.dynamicFullCode || pNode.fullCode || pNode.code;
  }

  const maxLen = isGroup ? structure.groupLen : (isGeneral ? structure.generalLen : structure.subsidiaryLen);

  return (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="col-span-1 md:col-span-2">
           <label className="block text-[11px] font-bold text-slate-600 mb-1">{isRtl ? "کد حساب" : "Account Code"}</label>
           <div className="flex items-center" dir="ltr">
             {prefix && (
               <span className="bg-slate-100 border border-slate-300 border-r-0 rounded-l h-8 flex items-center px-2 text-slate-500 font-mono text-sm">
                 {prefix}
               </span>
             )}
             <input 
                value={formData.code || ''}
                onChange={e => {
                  const val = e.target.value;
                  if (val.length <= maxLen) setFormData(prev => ({...prev, code: val}));
                }}
                className={`
                  flex-1 ${window.UI.THEME.colors.surface} border ${window.UI.THEME.colors.border}
                  ${prefix ? 'rounded-r border-l-0' : 'rounded'} h-8 px-2 outline-none
                  focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500
                  text-sm font-mono
                `}
                placeholder={"0".repeat(maxLen)}
             />
           </div>
           <div className="text-[10px] text-slate-400 mt-1 text-right">
             {isRtl ? `تعداد ارقام مجاز: ${maxLen}` : `Max digits: ${maxLen}`}
           </div>
        </div>

        <InputField label={isRtl ? "عنوان حساب (فارسی)" : "Account Title (Local)"} value={formData.title || ''} onChange={e => setFormData(prev => ({...prev, title: e.target.value}))} isRtl={isRtl} />
        <InputField label={isRtl ? "عنوان حساب (انگلیسی)" : "Account Title (English)"} value={formData.titleEn || ''} onChange={e => setFormData(prev => ({...prev, titleEn: e.target.value}))} isRtl={isRtl} dir="ltr" />
        
        <SelectField label={isRtl ? "نوع حساب" : "Account Type"} value={formData.type || ''} onChange={e => setFormData(prev => ({...prev, type: e.target.value}))} isRtl={isRtl}>
          {ACCOUNT_TYPES.map(t => <option key={t.id} value={t.id}>{isRtl ? t.labelFa : t.labelEn}</option>)}
        </SelectField>

        <SelectField label={isRtl ? "ماهیت حساب" : "Account Nature"} value={formData.nature || ''} onChange={e => setFormData(prev => ({...prev, nature: e.target.value}))} isRtl={isRtl}>
          {ACCOUNT_NATURES.map(n => <option key={n.id} value={n.id}>{isRtl ? n.labelFa : n.labelEn}</option>)}
        </SelectField>
        
        {isSubsidiary && (
           <div className="col-span-1 md:col-span-2">
              <Checkbox label={isRtl ? "فعال" : "Active"} checked={formData.isActive !== false} onChange={v => setFormData(prev => ({...prev, isActive: v}))} className="mb-4" />
           </div>
        )}
      </div>

      {isSubsidiary && (
        <div className="w-full animate-in slide-in-from-bottom-2">
           <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-3 mb-4">
              <h4 className="font-bold text-[11px] text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2"><ShieldCheck size={14} />{isRtl ? "ویژگی‌های کنترلی" : "Control Features"}</h4>
              
              <div className="flex flex-col gap-2 pb-2 border-b border-slate-200">
                 <Checkbox label={isRtl ? "ویژگی ارزی (چند ارزی)" : "Currency Feature"} checked={!!formData.currencyFeature} onChange={v => setFormData(prev => ({...prev, currencyFeature: v}))} />
                 {formData.currencyFeature && (
                    <div className="mr-6 grid grid-cols-2 gap-2 animate-in slide-in-from-top-1">
                       <SelectField label={isRtl ? "ارز پیش‌فرض" : "Default Currency"} isRtl={isRtl} value={formData.defaultCurrency || ''} onChange={e => setFormData(prev => ({...prev, defaultCurrency: e.target.value}))}>
                          <option value="">-</option>
                          {currencies.map(c => <option key={c.id} value={c.code}>{c.title}</option>)}
                       </SelectField>
                       <div className="mt-6"><Checkbox label={isRtl ? "الزام ورود ارز" : "Mandatory Currency"} checked={!!formData.currencyMandatory} onChange={v => setFormData(prev => ({...prev, currencyMandatory: v}))} /></div>
                    </div>
                 )}
              </div>

              <div className="flex flex-col gap-2 pb-2 border-b border-slate-200">
                 <Checkbox label={isRtl ? "ویژگی پیگیری" : "Tracking Feature"} checked={!!formData.trackFeature} onChange={v => setFormData(prev => ({...prev, trackFeature: v}))} />
                 {formData.trackFeature && (
                    <div className="mr-6 flex gap-4 animate-in slide-in-from-top-1">
                       <Checkbox label={isRtl ? "اجباری" : "Mandatory"} checked={!!formData.trackMandatory} onChange={v => setFormData(prev => ({...prev, trackMandatory: v}))} />
                       <Checkbox label={isRtl ? "یکتا بودن شماره پیگیری" : "Unique Tracking No."} checked={!!formData.trackUnique} onChange={v => setFormData(prev => ({...prev, trackUnique: v}))} />
                    </div>
                 )}
              </div>

              <div className="flex flex-col gap-2">
                 <Checkbox label={isRtl ? "ویژگی مقداری" : "Quantity Feature"} checked={!!formData.qtyFeature} onChange={v => setFormData(prev => ({...prev, qtyFeature: v}))} />
                 {formData.qtyFeature && (
                    <div className="mr-6 flex gap-4 animate-in slide-in-from-top-1">
                       <Checkbox label={isRtl ? "اجباری" : "Mandatory"} checked={!!formData.qtyMandatory} onChange={v => setFormData(prev => ({...prev, qtyMandatory: v}))} />
                    </div>
                 )}
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 items-end">
              <SelectField label={isRtl ? "کنترل ماهیت طی دوره" : "Nature Control"} isRtl={isRtl} value={formData.natureControl || 'none'} onChange={e => setFormData(prev => ({...prev, natureControl: e.target.value}))}>
                 <option value="none">{isRtl ? "بدون کنترل" : "No Control"}</option>
                 <option value="warn">{isRtl ? "هشدار" : "Warning"}</option>
                 <option value="block">{isRtl ? "خطا (جلوگیری)" : "Error (Block)"}</option>
              </SelectField>
              
              <div>
                 <label className="block text-[11px] font-bold text-slate-600 mb-1">{isRtl ? "حساب مقابل (تعدیل ماهیت)" : "Contra Account"}</label>
                 <div className="flex gap-2">
                    <div className="flex-1 bg-slate-50 border border-slate-200 rounded h-9 flex items-center px-2 text-sm text-slate-700 truncate" dir="ltr">
                        {contraAccountName || (isRtl ? "انتخاب نشده" : "Not Selected")}
                    </div>
                    <Button variant="outline" icon={Search} onClick={onOpenContraModal} />
                    {formData.contraAccountId && (
                       <Button variant="outline" className="text-red-500 border-red-200 hover:bg-red-50" icon={X} onClick={() => setFormData(prev => ({...prev, contraAccountId: null}))} />
                    )}
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const TafsilSelector = ({ formData, setFormData, isRtl, detailTypes }) => {
  const { Callout } = window.UI;
  return (
     <div className="space-y-4">
        <Callout variant="info">
           {isRtl ? "انواع تفصیل‌های مجاز برای این حساب معین را انتخاب کنید." : "Select the detailed account types allowed for this subsidiary."}
        </Callout>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
           {detailTypes.map(t => {
              const isSelected = formData.tafsils?.some(x => String(x) === String(t.id) || x === t.code);
              return (
                 <div 
                    key={t.id}
                    onClick={() => {
                       let current = formData.tafsils || [];
                       if (isSelected) {
                          current = current.filter(x => String(x) !== String(t.id) && x !== t.code);
                       } else {
                          current = [...current, t.id]; 
                       }
                       setFormData(prev => ({...prev, tafsils: current}));
                    }}
                    className={`
                       relative cursor-pointer border rounded-lg p-3 text-center transition-all select-none
                       ${isSelected 
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-bold shadow-sm ring-1 ring-indigo-200' 
                          : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'}
                    `}
                 >
                    {!t.is_system && <div className={`absolute top-1 left-1 ${isRtl ? 'right-auto' : 'right-1'} text-[8px] opacity-70`}><User size={10} className="text-indigo-500" /></div>}
                    <div className="text-[12px] flex items-center justify-center gap-1">{t.title}</div>
                 </div>
              )
           })}
        </div>
     </div>
  );
};

const StandardDesc = ({ formData, setFormData, isRtl }) => {
  const { InputField, Button } = window.UI;
  const [descText, setDescText] = useState('');
  const list = formData.descriptions || [];

  const addDesc = () => {
     if(!descText) return;
     const newList = [...list, { id: Date.now(), text: descText }];
     setFormData(prev => ({...prev, descriptions: newList}));
     setDescText('');
  };

  return (
     <div className="h-full flex flex-col">
        <div className="flex gap-2 mb-3">
           <InputField placeholder={isRtl ? "شرح استاندارد جدید..." : "New standard description..."} value={descText} onChange={e=>setDescText(e.target.value)} className="flex-1" isRtl={isRtl} />
           <Button onClick={addDesc} icon={Plus} variant="secondary">{isRtl ? "افزودن" : "Add"}</Button>
        </div>
        <div className="flex-1 overflow-y-auto border border-slate-200 rounded-lg bg-slate-50 p-2 space-y-1">
           {list.map(item => (
              <div key={item.id} className="bg-white p-2 rounded border border-slate-200 flex justify-between items-center group">
                 <span className="text-[12px] text-slate-700">{item.text}</span>
                 <button onClick={() => setFormData(prev => ({...prev, descriptions: list.filter(l => l.id !== item.id)}))} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14}/></button>
              </div>
           ))}
           {list.length === 0 && <div className="text-center text-slate-400 text-xs mt-4 italic">{isRtl ? "موردی تعریف نشده است" : "No descriptions defined"}</div>}
        </div>
     </div>
  );
};

// --- CUSTOM TREE RENDERER ---
const CustomTreeNode = ({ node, level, selectedId, onSelect, expandedKeys, onToggle, isRtl }) => {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedKeys.has(node.id);
  const isSelected = selectedId === node.id;
  const isGroup = node.level === 'group';
  const isGeneral = node.level === 'general';
  
  const color = isGroup ? 'text-indigo-700' : isGeneral ? 'text-slate-700' : 'text-slate-500';
  const icon = isGroup ? <Layers size={14}/> : isGeneral ? <Folder size={14}/> : <FileText size={14}/>;

  const displayCode = node.dynamicFullCode || node.fullCode || node.code;

  return (
    <div className="select-none">
      <div 
        className={`
          flex items-center gap-2 py-1 px-2 my-0.5 cursor-pointer rounded-lg transition-all border border-transparent
          ${isSelected 
            ? 'bg-indigo-50 text-indigo-700 font-bold border-indigo-200 shadow-sm' 
            : 'hover:bg-slate-50 text-slate-700 hover:border-slate-200'}
        `}
        style={{ paddingRight: isRtl ? `${level * 20 + 8}px` : '8px', paddingLeft: isRtl ? '8px' : `${level * 20 + 8}px` }}
        onClick={() => onSelect(node)}
      >
        {hasChildren ? (
          <div 
            className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors z-10 bg-white rounded border border-slate-200 shadow-sm shrink-0"
            onClick={(e) => { e.stopPropagation(); onToggle(node.id); }}
          >
             <div className={`transition-transform duration-200 ${isExpanded ? '' : (isRtl ? 'rotate-90' : '-rotate-90')}`}>
               <ChevronDown size={12} />
             </div>
          </div>
        ) : (
           <div className="w-5 h-5 flex items-center justify-center shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
           </div>
        )}
        
        <div className={`flex items-center gap-2 truncate flex-1 ${color}`}>
           {icon}
           <span className="font-mono text-[11px] font-bold bg-white/60 border border-slate-200/50 px-1 rounded">{displayCode}</span>
           <span className="text-[12px] truncate">{node.title}</span>
           {node.isActive === false && <span className="bg-red-100 text-red-600 text-[9px] px-1 rounded">{isRtl ? 'غیرفعال' : 'Inactive'}</span>}
        </div>
      </div>
      {hasChildren && isExpanded && (
        <div className="overflow-hidden relative">
          <div className={`absolute top-0 bottom-2 w-px bg-slate-200 ${isRtl ? `right-[${level * 20 + 17}px]` : `left-[${level * 20 + 17}px]`}`}></div>
          {node.children.map(child => (
            <CustomTreeNode 
              key={child.id} node={child} level={level + 1} 
              selectedId={selectedId} onSelect={onSelect} 
              expandedKeys={expandedKeys} onToggle={onToggle} isRtl={isRtl} 
            />
          ))}
        </div>
      )}
    </div>
  );
};


// --- SUB-COMPONENT: STRUCTURE LIST VIEW ---

const StructureList = ({ 
   structures, fetchStructures, isRtl, t, 
   canCreate, canEdit, canDelete, canDesign, 
   supabase, onOpenTree 
}) => {
  const { InputField, Button, DataGrid, Modal, Badge, FilterSection } = window.UI;
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ code: '', title: '', status: true, groupLen: 1, generalLen: 2, subsidiaryLen: 2, useChar: false });

  const handleEdit = (row) => {
    if(!canEdit) return alert(isRtl ? "دسترسی ندارید" : "Access Denied");
    setEditingItem(row);
    setFormData(row);
    setShowModal(true);
  };

  const handleCreate = () => {
    if(!canCreate) return alert(isRtl ? "دسترسی ندارید" : "Access Denied");
    setEditingItem(null);
    setFormData({ code: '', title: '', status: true, groupLen: 1, generalLen: 2, subsidiaryLen: 2, useChar: false });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.code || !formData.title) return alert(isRtl ? "کد و عنوان الزامی است" : "Code and Title are required");
    try {
       const payload = {
          code: formData.code, title: formData.title, status: formData.status,
          group_len: formData.groupLen, general_len: formData.generalLen, subsidiary_len: formData.subsidiaryLen, use_char: formData.useChar
       };

       if (editingItem) {
          await supabase.schema('gl').from('account_structures').update(payload).eq('id', editingItem.id);
       } else {
          await supabase.schema('gl').from('account_structures').insert([payload]);
       }
       setShowModal(false);
       fetchStructures();
    } catch(err) {
       console.error(err);
    }
  };

  const handleDelete = async (ids) => {
    if(!canDelete) return alert(isRtl ? "دسترسی ندارید" : "Access Denied");
    if (confirm(isRtl ? "آیا از حذف مطمئن هستید؟" : "Are you sure?")) {
       try {
          await supabase.schema('gl').from('account_structures').delete().in('id', ids);
          fetchStructures();
       } catch(err) { console.error(err); }
    }
  };

  const filtered = structures.filter(s => s.code.includes(searchTerm) || s.title.includes(searchTerm));

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-300">
      <FilterSection onSearch={() => {}} onClear={() => setSearchTerm('')} isRtl={isRtl}>
         <InputField label={isRtl ? "جستجو (کد یا عنوان)" : "Search"} value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} isRtl={isRtl}/>
      </FilterSection>

      <div className="flex-1 overflow-hidden relative h-full">
        <DataGrid 
          columns={[
            { field: 'code', header: isRtl ? 'کد' : 'Code', width: 'w-24' },
            { field: 'title', header: isRtl ? 'عنوان' : 'Title', width: 'w-64' },
            { field: 'status', header: isRtl ? 'وضعیت' : 'Status', width: 'w-24', render: r => <Badge variant={r.status ? 'success' : 'neutral'}>{r.status ? (isRtl ? 'فعال' : 'Active') : (isRtl ? 'غیرفعال' : 'Inactive')}</Badge> },
            { field: 'groupLen', header: isRtl ? 'طول گروه' : 'Group Len', width: 'w-24' },
            { field: 'generalLen', header: isRtl ? 'طول کل' : 'General Len', width: 'w-24' },
            { field: 'subsidiaryLen', header: isRtl ? 'طول معین' : 'Sub Len', width: 'w-24' },
          ]}
          data={filtered}
          isRtl={isRtl}
          onCreate={canCreate ? handleCreate : undefined}
          onDelete={canDelete ? handleDelete : undefined}
          actions={(row) => (
            <div className="flex gap-1 justify-center">
               {canDesign && <button onClick={() => onOpenTree(row)} title={isRtl ? "طراحی ساختار درختی" : "Design Tree Structure"} className="p-1.5 text-indigo-600 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded transition-colors"><TreeDeciduous size={16}/></button>}
               {canEdit && <button onClick={() => handleEdit(row)} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded"><Edit size={16}/></button>}
               {canDelete && <button onClick={()=>handleDelete([row.id])} className="p-1.5 text-red-500 hover:bg-red-50 rounded"><Trash2 size={16}/></button>}
            </div>
          )}
        />
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingItem ? (isRtl ? "ویرایش ساختار حساب" : "Edit Account Structure") : (isRtl ? "تعریف ساختار حساب جدید" : "New Account Structure")}
        footer={<><Button variant="outline" onClick={() => setShowModal(false)}>{isRtl ? "انصراف" : "Cancel"}</Button><Button variant="primary" onClick={handleSave}>{isRtl ? "ذخیره" : "Save"}</Button></>}>
         <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
               <InputField label={isRtl ? "کد ساختار" : "Code"} value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} isRtl={isRtl} />
               <InputField label={isRtl ? "عنوان ساختار" : "Title"} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} isRtl={isRtl} />
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-4">
               <h4 className="text-[11px] font-bold text-slate-500 uppercase">{isRtl ? "تنظیمات طول کدینگ" : "Coding Length Settings"}</h4>
               <div className="grid grid-cols-3 gap-4">
                  <InputField type="number" min="1" max="10" label={isRtl ? "طول کد گروه" : "Group Length"} value={formData.groupLen} onChange={e => setFormData({...formData, groupLen: parseInt(e.target.value)})} isRtl={isRtl} />
                  <InputField type="number" min="1" max="10" label={isRtl ? "طول کد کل" : "General Length"} value={formData.generalLen} onChange={e => setFormData({...formData, generalLen: parseInt(e.target.value)})} isRtl={isRtl} />
                  <InputField type="number" min="1" max="10" label={isRtl ? "طول کد معین" : "Sub Length"} value={formData.subsidiaryLen} onChange={e => setFormData({...formData, subsidiaryLen: parseInt(e.target.value)})} isRtl={isRtl} />
               </div>
               <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <span className="text-[11px] text-slate-500">{isRtl ? "مجموع طول کد حساب:" : "Total Length:"}</span>
                  <span className="font-black text-indigo-700 text-lg">{(formData.groupLen || 0) + (formData.generalLen || 0) + (formData.subsidiaryLen || 0)}</span>
               </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <Checkbox label={isRtl ? "استفاده از حروف در کد" : "Use Characters"} checked={formData.useChar} onChange={v => setFormData({...formData, useChar: v})} />
               <Checkbox label={isRtl ? "فعال" : "Active"} checked={formData.status} onChange={v => setFormData({...formData, status: v})} />
            </div>
         </div>
      </Modal>
    </div>
  );
};


const AccountTreeView = ({ 
  structure, onBack, treeData, fetchTreeData, isRtl, t, 
  canCreate, canEdit, canDelete, supabase, currencies, detailTypes 
}) => {
  const { Button, Badge, DataGrid, Modal } = window.UI;

  const [selectedNode, setSelectedNode] = useState(null);
  const [mode, setMode] = useState('view'); 
  const [activeTab, setActiveTab] = useState('info'); 
  const [formData, setFormData] = useState({});
  const [expandedKeys, setExpandedKeys] = useState(new Set());
  const [showContraModal, setShowContraModal] = useState(false);
  
  const fileInputRef = useRef(null);

  const getParentCode = (node) => {
    if (!node) return '';
    if (node.level === 'group') return node.code;
    if (node.level === 'general') return node.fullCode;
    return '';
  };

  const handleCreate = (level) => {
    if (level !== 'group' && !selectedNode) return;
    
    let defaults = {
      level: level, isActive: true, type: 'permanent', nature: 'debit',
      tafsils: [], descriptions: []
    };

    if (selectedNode && (level === 'general' || level === 'subsidiary')) {
      defaults.parentId = selectedNode.id;
      defaults.type = selectedNode.type || 'permanent';
      defaults.nature = selectedNode.nature || 'debit';
    }
    setFormData(defaults);
    setMode(`create_${level}`);
    setActiveTab('info');
  };

  const handleEdit = () => {
    if (!selectedNode) return;
    setFormData({ ...selectedNode });
    setMode('edit');
    setActiveTab('info');
  };

  const getAncestorIds = (nodes, targetId, path = []) => {
    for (const node of nodes) {
      if (node.id === targetId) return path;
      if (node.children) {
        const res = getAncestorIds(node.children, targetId, [...path, node.id]);
        if (res) return res;
      }
    }
    return null;
  };

  const handleSaveForm = async () => {
    if (!formData.code || !formData.title) return alert(isRtl ? "کد و عنوان الزامی است" : "Code and Title Required");
    
    let requiredLen = 0;
    if (formData.level === 'group') requiredLen = structure.groupLen;
    else if (formData.level === 'general') requiredLen = structure.generalLen;
    else if (formData.level === 'subsidiary') requiredLen = structure.subsidiaryLen;

    if (formData.code.length !== requiredLen) {
      return alert(isRtl ? `طول کد برای این سطح باید ${requiredLen} کاراکتر باشد.` : `Code length must be ${requiredLen}.`);
    }

    let parentFullCode = '';
    if (formData.level !== 'group') {
       const findNode = (nodes, id) => {
          for (const n of nodes) {
             if (n.id === id) return n;
             if (n.children) {
                const f = findNode(n.children, id);
                if (f) return f;
             }
          }
          return null;
       };
       const pNode = findNode(treeData, formData.parentId);
       if (pNode) parentFullCode = pNode.dynamicFullCode || pNode.fullCode || pNode.code;
    }
    
    let fullCode = formData.level === 'group' ? formData.code : (parentFullCode + formData.code);

    const payload = {
       structure_id: structure.id,
       parent_id: formData.parentId || null,
       code: formData.code,
       full_code: fullCode,
       title: formData.title,
       title_en: formData.titleEn || null,
       level: formData.level,
       type: formData.type || null,
       nature: formData.nature || null,
       is_active: formData.isActive !== false,
       contra_account_id: formData.contraAccountId || null,
       metadata: {
           currencyFeature: formData.currencyFeature,
           defaultCurrency: formData.defaultCurrency,
           currencyMandatory: formData.currencyMandatory,
           trackFeature: formData.trackFeature,
           trackMandatory: formData.trackMandatory,
           trackUnique: formData.trackUnique,
           qtyFeature: formData.qtyFeature,
           qtyMandatory: formData.qtyMandatory,
           natureControl: formData.natureControl,
           tafsils: formData.tafsils,
           descriptions: formData.descriptions
       }
    };

    try {
        let targetNodeId = formData.id;
        if (mode === 'edit') {
            await supabase.schema('gl').from('accounts').update(payload).eq('id', formData.id);
        } else {
            const { data, error } = await supabase.schema('gl').from('accounts').insert([payload]).select();
            if(error) throw error;
            if(data && data.length > 0) targetNodeId = data[0].id;
        }

        const { roots, map } = await fetchTreeData(structure.id);
        
        if(targetNodeId) {
           const ancestors = getAncestorIds(roots, targetNodeId) || [];
           setExpandedKeys(prev => new Set([...prev, ...ancestors]));
           if(map.has(targetNodeId)) setSelectedNode(map.get(targetNodeId));
        }
        
        setMode('view');
    } catch (err) {
        console.error(err);
        alert(isRtl ? "خطا در ثبت اطلاعات" : "Save Error");
    }
  };

  const handleDelete = async () => {
     if (selectedNode?.children?.length > 0) return alert(isRtl ? "حساب دارای زیرمجموعه است" : "Account has children");
     if (!confirm(isRtl ? "آیا مطمئن هستید؟" : "Are you sure?")) return;
     
     try {
         await supabase.schema('gl').from('accounts').delete().eq('id', selectedNode.id);
         await fetchTreeData(structure.id);
         setSelectedNode(null);
         setMode('view');
     } catch (err) { console.error(err); }
  };

  const handleExpandAll = () => {
     const allIds = new Set();
     const traverse = (nodes) => {
       nodes.forEach(n => {
         if (n.children && n.children.length > 0) {
           allIds.add(n.id);
           traverse(n.children);
         }
       });
     };
     traverse(treeData);
     setExpandedKeys(allIds);
  };

  const handleCollapseAll = () => setExpandedKeys(new Set());

  const toggleExpand = (id) => {
     const newSet = new Set(expandedKeys);
     if (newSet.has(id)) newSet.delete(id);
     else newSet.add(id);
     setExpandedKeys(newSet);
  };

  // --- CSV Import / Export Handlers ---
  const handleDownloadTemplate = () => {
     const header = isRtl 
        ? "کد گروه,عنوان گروه,کد کل,عنوان کل,کد معین,عنوان معین,نوع حساب (دائم/موقت/انتظامی),ماهیت حساب (بدهکار/بستانکار/مهم نیست)\n"
        : "Group Code,Group Title,General Code,General Title,Subsidiary Code,Subsidiary Title,Account Type,Account Nature\n";
     const sample = isRtl
        ? "1,دارایی ها,11,دارایی های جاری,1101,موجودی نقد و بانک,دائم,بدهکار\n"
        : "1,Assets,11,Current Assets,1101,Cash and Bank,permanent,debit\n";
     
     const blob = new Blob(['\ufeff' + header + sample], { type: 'text/csv;charset=utf-8;' }); 
     const url = URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     a.download = `ChartOfAccounts_Template_${structure.code}.csv`;
     a.click();
     URL.revokeObjectURL(url);
  };

  const handleImportCSV = async (e) => {
     const file = e.target.files[0];
     if (!file) return;

     const reader = new FileReader();
     reader.onload = async (event) => {
         const text = event.target.result;
         const rows = csvToArray(text);
         if (rows.length < 2) return alert(isRtl ? "فایل فاقد اطلاعات است." : "File is empty.");

         const toInsertGroups = new Map();
         const toInsertGenerals = new Map();
         const toInsertSubs = new Map();

         for (let i = 1; i < rows.length; i++) {
             const row = rows[i];
             if (!row[0] && !row[2] && !row[4]) continue; 

             const grpFull = row[0] ? row[0].trim() : '';
             const grpTitle = row[1] ? row[1].trim() : '';
             const genFull = row[2] ? row[2].trim() : '';
             const genTitle = row[3] ? row[3].trim() : '';
             const subFull = row[4] ? row[4].trim() : '';
             const subTitle = row[5] ? row[5].trim() : '';
             const rawType = row[6] ? row[6].trim() : '';
             const rawNature = row[7] ? row[7].trim() : '';

             let type = 'permanent';
             if (rawType.includes('موقت') || rawType.toLowerCase().includes('temp')) type = 'temporary';
             if (rawType.includes('انتظامی') || rawType.toLowerCase().includes('disc')) type = 'disciplinary';

             let nature = 'debit';
             if (rawNature.includes('بستانکار') || rawNature.toLowerCase().includes('cred')) nature = 'credit';
             if (rawNature.includes('مهم نیست') || rawNature.includes('فاقد') || rawNature.toLowerCase().includes('none')) nature = 'none';

             if (grpFull && grpTitle) {
                 if (!toInsertGroups.has(grpFull)) {
                     const code = grpFull; 
                     toInsertGroups.set(grpFull, { code, full_code: grpFull, title: grpTitle, level: 'group', type, nature });
                 }
             }

             if (genFull && genTitle && grpFull) { 
                 if (!toInsertGenerals.has(genFull)) {
                     const code = genFull.slice(-structure.generalLen);
                     toInsertGenerals.set(genFull, { parentFull: grpFull, code, full_code: genFull, title: genTitle, level: 'general', type, nature });
                 }
             }

             if (subFull && subTitle && genFull) { 
                 if (!toInsertSubs.has(subFull)) {
                     const code = subFull.slice(-structure.subsidiaryLen);
                     toInsertSubs.set(subFull, { parentFull: genFull, code, full_code: subFull, title: subTitle, level: 'subsidiary', type, nature });
                 }
             }
         }

         try {
             const { data: existing, error } = await supabase.schema('gl').from('accounts').select('id, full_code, level').eq('structure_id', structure.id);
             if (error) throw error;

             const existingMap = new Map();
             existing.forEach(acc => existingMap.set(acc.full_code, acc.id));

             const groupPayloads = [];
             for (const [full, data] of toInsertGroups.entries()) {
                 if (!existingMap.has(full)) {
                     groupPayloads.push({ structure_id: structure.id, code: data.code, full_code: data.full_code, title: data.title, level: data.level, type: data.type, nature: data.nature, is_active: true });
                 }
             }
             if (groupPayloads.length > 0) {
                 const { data: insertedGroups, error: grpErr } = await supabase.schema('gl').from('accounts').insert(groupPayloads).select();
                 if (grpErr) throw grpErr;
                 insertedGroups.forEach(g => existingMap.set(g.full_code, g.id));
             }

             const generalPayloads = [];
             for (const [full, data] of toInsertGenerals.entries()) {
                 if (!existingMap.has(full)) {
                     const parentId = existingMap.get(data.parentFull);
                     if (parentId) {
                         generalPayloads.push({ structure_id: structure.id, parent_id: parentId, code: data.code, full_code: data.full_code, title: data.title, level: data.level, type: data.type, nature: data.nature, is_active: true });
                     }
                 }
             }
             if (generalPayloads.length > 0) {
                 const { data: insertedGenerals, error: genErr } = await supabase.schema('gl').from('accounts').insert(generalPayloads).select();
                 if (genErr) throw genErr;
                 insertedGenerals.forEach(g => existingMap.set(g.full_code, g.id));
             }

             const subPayloads = [];
             for (const [full, data] of toInsertSubs.entries()) {
                 if (!existingMap.has(full)) {
                     const parentId = existingMap.get(data.parentFull);
                     if (parentId) {
                         subPayloads.push({ structure_id: structure.id, parent_id: parentId, code: data.code, full_code: data.full_code, title: data.title, level: data.level, type: data.type, nature: data.nature, is_active: true });
                     }
                 }
             }
             if (subPayloads.length > 0) {
                 const { error: subErr } = await supabase.schema('gl').from('accounts').insert(subPayloads);
                 if (subErr) throw subErr;
             }

             alert(isRtl ? "ورود اطلاعات با موفقیت انجام شد." : "Import completed successfully.");
             fetchTreeData(structure.id);

         } catch (err) {
             console.error(err);
             alert(isRtl ? "خطا در پردازش و ورود اطلاعات." : "Error importing data.");
         }
     };
     reader.readAsText(file, 'UTF-8');
     e.target.value = ''; 
  };


  const flattenSubsidiariesWithPaths = (nodes, parentPath = '') => {
     let result = [];
     nodes.forEach(node => {
        const currentPath = parentPath ? `${parentPath} > ${node.title}` : node.title;
        if (node.level === 'subsidiary') {
            result.push({ 
               ...node, 
               pathTitle: currentPath,
               fullCode: node.dynamicFullCode || node.fullCode || node.code 
            });
        }
        if (node.children) result = result.concat(flattenSubsidiariesWithPaths(node.children, currentPath));
     });
     return result;
  };
  
  const filteredSubsidiaries = useMemo(() => {
     return flattenSubsidiariesWithPaths(treeData).filter(n => n.id !== formData.id); 
  }, [treeData, formData.id]);

  const getContraAccountName = (id) => {
     if (!id) return '';
     const acc = flattenSubsidiariesWithPaths(treeData).find(n => n.id === id);
     return acc ? `${acc.dynamicFullCode || acc.fullCode || acc.code} - ${acc.title}` : '';
  };

  const handleNodeSelect = (node) => {
      setSelectedNode(node);
      setMode('view');
  };

  const activeTabs = formData.level === 'subsidiary' 
      ? [{ id: 'info', label: isRtl ? 'اطلاعات اصلی' : 'General Info', icon: FileText }, { id: 'tafsil', label: isRtl ? 'تفصیل‌ها' : 'Detailed Accts', icon: List }, { id: 'desc', label: isRtl ? 'شرح‌های استاندارد' : 'Descriptions', icon: FileDigit }] 
      : [{ id: 'info', label: isRtl ? 'اطلاعات اصلی' : 'General Info', icon: FileText }];

  return (
    <div className="h-full flex flex-col animate-in slide-in-from-right-8 duration-300">
       <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm shrink-0">
          <div className="flex items-center gap-3">
             <Button variant="outline" size="sm" onClick={onBack} icon={isRtl ? ArrowRight : ArrowRight} className={isRtl ? '' : 'rotate-180'}>{isRtl ? "بازگشت به فهرست" : "Back to List"}</Button>
             <div className="h-6 w-px bg-slate-200 mx-2"></div>
             <div>
                <h2 className="font-bold text-slate-800 text-sm">{structure.title}</h2>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                   <span>Code: {structure.code}</span><span>|</span><span>Structure: {structure.groupLen}-{structure.generalLen}-{structure.subsidiaryLen}</span>
                </div>
             </div>
          </div>
          <div className="flex items-center gap-2">
             <input type="file" accept=".csv" ref={fileInputRef} className="hidden" onChange={handleImportCSV} />
             <Button variant="ghost" size="sm" icon={DownloadCloud} onClick={handleDownloadTemplate} title={isRtl ? "دانلود نمونه فایل اکسل (CSV)" : "Download CSV Template"} />
             <Button variant="ghost" size="sm" icon={FileSpreadsheet} onClick={() => fileInputRef.current?.click()} title={isRtl ? "ورود اطلاعات از اکسل (CSV)" : "Import CSV"} className="text-emerald-600 hover:bg-emerald-50" />
             <div className="h-4 w-px bg-slate-200 mx-1"></div>
             <Button variant="primary" size="sm" icon={Plus} onClick={() => handleCreate('group')}>{isRtl ? "گروه حساب جدید" : "New Group"}</Button>
          </div>
       </div>

       <div className="flex-1 flex gap-4 p-4 overflow-hidden bg-slate-100">
          <div className="w-1/3 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
             <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <span className="text-[11px] font-bold text-slate-500 uppercase">{isRtl ? "ساختار درختی" : "Tree Structure"}</span>
                <div className="flex gap-1">
                   <Button size="iconSm" variant="ghost" onClick={handleExpandAll} title={isRtl ? "باز کردن همه" : "Expand All"} icon={Maximize2} />
                   <Button size="iconSm" variant="ghost" onClick={handleCollapseAll} title={isRtl ? "بستن همه" : "Collapse All"} icon={Minimize2} />
                </div>
             </div>
             <div className="flex-1 overflow-y-auto p-2">
                {treeData.length > 0 ? treeData.map(node => (
                   <CustomTreeNode 
                      key={node.id} node={node} level={0} 
                      selectedId={selectedNode?.id} onSelect={handleNodeSelect} 
                      expandedKeys={expandedKeys} onToggle={toggleExpand} isRtl={isRtl} 
                   />
                )) : (
                   <div className="text-center text-slate-400 text-xs italic mt-10">{isRtl ? "بدون ساختار" : "No Structure"}</div>
                )}
             </div>
          </div>

          <div className="w-2/3 flex flex-col">
             {!selectedNode && mode === 'view' && (
                <div className="h-full bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-slate-400">
                   <TreeDeciduous size={48} className="text-indigo-200 mb-2"/>
                   <p className="text-sm font-medium">{isRtl ? "یک حساب انتخاب کنید یا گروه جدید بسازید" : "Select an account or create a group"}</p>
                </div>
             )}

             {selectedNode && mode === 'view' && (
                <div className="h-full bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-y-auto">
                   <div className="p-6 border-b border-slate-100 flex justify-between items-start shrink-0">
                      <div>
                         <div className="flex items-center gap-2 mb-1">
                            <Badge variant="neutral" className="font-mono text-lg px-2">{selectedNode.dynamicFullCode || selectedNode.fullCode || selectedNode.code}</Badge>
                            <h2 className="text-lg font-bold text-slate-800">{selectedNode.title}</h2>
                         </div>
                         <div className="text-xs text-slate-500">{selectedNode.titleEn}</div>
                      </div>
                      <div className="flex gap-2">
                         <Button variant="outline" size="sm" icon={Trash2} onClick={handleDelete} className="text-red-600 hover:text-red-700"/>
                         <Button variant="secondary" size="sm" icon={Edit} onClick={handleEdit}>{isRtl ? "ویرایش" : "Edit"}</Button>
                      </div>
                   </div>
                   
                   <div className="p-6 space-y-6 flex-1">
                      <div className="grid grid-cols-2 gap-6">
                         <div><label className="text-[10px] font-bold text-slate-400 block mb-1">{isRtl ? "سطح" : "Level"}</label><span className="text-sm">{selectedNode.level}</span></div>
                         <div><label className="text-[10px] font-bold text-slate-400 block mb-1">{isRtl ? "ماهیت" : "Nature"}</label><Badge variant="info">{selectedNode.nature}</Badge></div>
                         <div><label className="text-[10px] font-bold text-slate-400 block mb-1">{isRtl ? "نوع" : "Type"}</label><span className="text-sm">{selectedNode.type}</span></div>
                         {selectedNode.level === 'subsidiary' && (
                            <div><label className="text-[10px] font-bold text-slate-400 block mb-1">{isRtl ? "وضعیت" : "Status"}</label>
                            <Badge variant={selectedNode.isActive !== false ? 'success' : 'danger'}>{selectedNode.isActive !== false ? 'فعال' : 'غیرفعال'}</Badge></div>
                         )}
                         {selectedNode.contraAccountId && (
                             <div className="col-span-2">
                                 <label className="text-[10px] font-bold text-slate-400 block mb-1">{isRtl ? "حساب مقابل (تعدیل ماهیت)" : "Contra Account"}</label>
                                 <div className="text-sm font-medium text-slate-700 bg-slate-50 p-2 rounded border border-slate-100" dir="ltr">{getContraAccountName(selectedNode.contraAccountId)}</div>
                             </div>
                         )}
                      </div>

                      {selectedNode.level === 'subsidiary' && (
                         <>
                            <div className="border-t border-slate-100 pt-4">
                               <h4 className="text-xs font-bold text-slate-500 mb-3 flex items-center gap-1"><ShieldCheck size={12}/> {isRtl ? "ویژگی‌های کنترلی" : "Control Features"}</h4>
                               <div className="grid grid-cols-2 gap-3">
                                  <div className={`p-2 rounded border text-xs ${selectedNode.currencyFeature ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                                     <div className="font-bold mb-1">{isRtl ? "ویژگی ارزی" : "Currency"}</div>
                                     <div className="text-slate-500">{selectedNode.currencyFeature ? (isRtl ? "فعال" : "Active") : (isRtl ? "غیرفعال" : "Inactive")}</div>
                                     {selectedNode.currencyFeature && selectedNode.currencyMandatory && <div className="mt-1 text-indigo-600 font-bold text-[10px]">{isRtl ? "الزام ورود ارز" : "Mandatory"}</div>}
                                  </div>
                                  <div className={`p-2 rounded border text-xs ${selectedNode.trackFeature ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                                     <div className="font-bold mb-1">{isRtl ? "ویژگی پیگیری" : "Tracking"}</div>
                                     <div className="text-slate-500">{selectedNode.trackFeature ? (isRtl ? "فعال" : "Active") : (isRtl ? "غیرفعال" : "Inactive")}</div>
                                     {selectedNode.trackFeature && (
                                         <div className="mt-1 flex gap-2 text-[10px]">
                                             {selectedNode.trackMandatory && <span className="text-indigo-600 font-bold">{isRtl ? "اجباری" : "Mandatory"}</span>}
                                             {selectedNode.trackUnique && <span className="text-indigo-600 font-bold">{isRtl ? "یکتا" : "Unique"}</span>}
                                         </div>
                                     )}
                                  </div>
                                  <div className={`p-2 rounded border text-xs ${selectedNode.qtyFeature ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                                     <div className="font-bold mb-1">{isRtl ? "ویژگی مقداری" : "Quantity"}</div>
                                     <div className="text-slate-500">{selectedNode.qtyFeature ? (isRtl ? "فعال" : "Active") : (isRtl ? "غیرفعال" : "Inactive")}</div>
                                     {selectedNode.qtyFeature && selectedNode.qtyMandatory && <div className="mt-1 text-indigo-600 font-bold text-[10px]">{isRtl ? "اجباری" : "Mandatory"}</div>}
                                  </div>
                               </div>
                            </div>
                            <div className="border-t border-slate-100 pt-4 grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-xs font-bold text-slate-500 mb-3 flex items-center gap-1"><List size={12}/> {isRtl ? "تفصیل‌های مرتبط" : "Linked Tafsils"}</h4>
                                    <div className="flex flex-wrap gap-1">
                                        {(selectedNode.tafsils || []).map(tId => {
                                            const tObj = detailTypes.find(x => String(x.id) === String(tId) || x.code === String(tId));
                                            if (!tObj) return null;
                                            return <Badge key={tId} variant="neutral">{tObj.title}</Badge>;
                                        })}
                                        {(!selectedNode.tafsils || selectedNode.tafsils.length === 0 || !selectedNode.tafsils.some(tId => detailTypes.find(x => String(x.id) === String(tId) || x.code === String(tId)))) && <span className="text-xs text-slate-400 italic">{isRtl ? 'موردی یافت نشد' : 'None'}</span>}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-slate-500 mb-3 flex items-center gap-1"><FileDigit size={12}/> {isRtl ? "شرح‌های استاندارد" : "Standard Descriptions"}</h4>
                                    <ul className="list-disc list-inside text-xs text-slate-600 space-y-1 pl-4 rtl:pr-4">
                                        {(selectedNode.descriptions || []).map(desc => (
                                            <li key={desc.id}>{desc.text}</li>
                                        ))}
                                        {(!selectedNode.descriptions || selectedNode.descriptions.length === 0) && <span className="text-slate-400 italic list-none">{isRtl ? 'موردی یافت نشد' : 'None'}</span>}
                                    </ul>
                                </div>
                            </div>
                         </>
                      )}
                   </div>

                   <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 shrink-0">
                      {selectedNode.level === 'group' && <Button variant="primary" size="sm" icon={Plus} onClick={() => handleCreate('general')}>{isRtl ? "حساب کل جدید" : "New General"}</Button>}
                      {selectedNode.level === 'general' && <Button variant="primary" size="sm" icon={Plus} onClick={() => handleCreate('subsidiary')}>{isRtl ? "حساب معین جدید" : "New Subsidiary"}</Button>}
                   </div>
                </div>
             )}

             {mode !== 'view' && (
                <div className="h-full bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
                   <div className="px-4 py-3 border-b border-slate-100 font-bold text-slate-700 flex items-center gap-2">
                      {mode === 'edit' ? <Edit size={16}/> : <Plus size={16}/>}
                      {mode === 'edit' ? (isRtl ? "ویرایش حساب" : "Edit Account") : (isRtl ? "حساب جدید" : "New Account")}
                      <Badge variant="neutral">{formData.level}</Badge>
                   </div>
                   
                   <div className="p-4 flex-1 overflow-y-auto">
                      <Tabs tabs={activeTabs} activeTab={activeTab} onChange={setActiveTab} />
                      {activeTab === 'info' && <AccountForm formData={formData} setFormData={setFormData} structure={structure} selectedNode={selectedNode} treeData={treeData} isRtl={isRtl} currencies={currencies} onOpenContraModal={() => setShowContraModal(true)} contraAccountName={getContraAccountName(formData.contraAccountId)} />}
                      {activeTab === 'tafsil' && <TafsilSelector formData={formData} setFormData={setFormData} isRtl={isRtl} detailTypes={detailTypes} />}
                      {activeTab === 'desc' && <StandardDesc formData={formData} setFormData={setFormData} isRtl={isRtl} />}
                   </div>
                   <div className="p-3 border-t border-slate-200 bg-slate-50 flex justify-end gap-2 rounded-b-xl">
                      <Button variant="outline" onClick={() => setMode('view')}>{isRtl ? "انصراف" : "Cancel"}</Button>
                      <Button variant="primary" icon={Save} onClick={handleSaveForm}>{isRtl ? "ذخیره" : "Save"}</Button>
                   </div>
                </div>
             )}
          </div>
       </div>

       <Modal isOpen={showContraModal} onClose={() => setShowContraModal(false)} title={isRtl ? "انتخاب حساب معین (تعدیل ماهیت)" : "Select Contra Account"} maxWidth="max-w-4xl">
           <div className="h-[500px] flex flex-col">
               <div className="flex-1 overflow-hidden border border-slate-200 rounded-lg relative">
                   <DataGrid 
                       columns={[
                           { field: 'fullCode', header: isRtl ? 'کد کامل' : 'Full Code', width: 'w-32' },
                           { field: 'pathTitle', header: isRtl ? 'مسیر حساب' : 'Account Path', width: 'w-auto' }, 
                           { field: 'nature', header: isRtl ? 'ماهیت' : 'Nature', width: 'w-24', render: r => <Badge variant={r.nature === 'debit' ? 'info' : r.nature === 'credit' ? 'warning' : 'neutral'}>{r.nature}</Badge> }
                       ]}
                       data={filteredSubsidiaries} isRtl={isRtl}
                       actions={(row) => (<Button size="sm" onClick={() => { setFormData(prev => ({...prev, contraAccountId: row.id})); setShowContraModal(false); }}>{isRtl ? "انتخاب" : "Select"}</Button>)}
                   />
               </div>
               <div className="mt-2 text-xs text-slate-400">{isRtl ? `تعداد: ${filteredSubsidiaries.length}` : `Count: ${filteredSubsidiaries.length}`}</div>
           </div>
       </Modal>
    </div>
  );
};


// --- ROOT COMPONENT ---

const ChartofAccounts = ({ t, isRtl }) => {
  const checkAccess = (action = null) => {
    if (!window.hasAccess) return false;
    const variations = [
      'chart_of_accounts', 'chartofaccounts', 'coa', 'ChartofAccounts', 
      'chart_of_account', 'account_structures', 'account_structure', 'accounts'
    ];
    for (const res of variations) {
       if (window.hasAccess(res, action)) return true;
    }
    return false;
  };

  const canEnterForm = checkAccess(); 
  const canView   = canEnterForm || checkAccess('view') || checkAccess('read') || checkAccess('show');
  const canCreate = checkAccess('create') || checkAccess('new') || checkAccess('add') || checkAccess('insert');
  const canEdit   = checkAccess('edit') || checkAccess('update') || checkAccess('modify');
  const canDelete = checkAccess('delete') || checkAccess('remove') || checkAccess('destroy');
  const canDesign = checkAccess('design_tree') || checkAccess('designtree');

  const [viewMode, setViewMode] = useState('list'); 
  const [activeStructure, setActiveStructure] = useState(null);
  const [structures, setStructures] = useState([]);
  const [treeData, setTreeData] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [detailTypes, setDetailTypes] = useState([]);
  
  const supabase = window.supabase;

  useEffect(() => {
    if (canView) {
        fetchStructures();
        fetchCurrencies();
        fetchDetailTypes();
    }
  }, [canView]);

  const fetchCurrencies = async () => {
    try {
       const { data, error } = await supabase.schema('gen').from('currencies').select('*').eq('is_active', true);
       if(!error) setCurrencies(data || []);
    } catch(err) { console.error(err); }
  };

  const fetchDetailTypes = async () => {
    try {
       const { data, error } = await supabase.schema('gl').from('detail_types').select('*').eq('is_active', true);
       if(!error) setDetailTypes(data || []);
    } catch(err) { console.error(err); }
  };

  const fetchStructures = async () => {
    try {
      const { data, error } = await supabase.schema('gl').from('account_structures').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setStructures((data || []).map(item => ({
         id: item.id,
         code: item.code,
         title: item.title,
         status: item.status,
         groupLen: item.group_len,
         generalLen: item.general_len,
         subsidiaryLen: item.subsidiary_len,
         useChar: item.use_char
      })));
    } catch (err) {
      console.error('Error fetching structures:', err);
    }
  };

  const fetchTreeData = async (structureId) => {
     try {
        const { data, error } = await supabase.schema('gl').from('accounts').select('*').eq('structure_id', structureId);
        if (error) throw error;

        const map = new Map();
        (data || []).forEach(n => map.set(n.id, { 
           id: n.id, 
           parentId: n.parent_id,
           code: n.code,
           fullCode: n.full_code,
           title: n.title,
           titleEn: n.title_en || '',
           level: n.level,
           type: n.type || 'permanent',
           nature: n.nature || 'debit',
           isActive: n.is_active,
           contraAccountId: n.contra_account_id,
           ...n.metadata,
           children: [] 
        }));

        const roots = [];
        data.forEach(n => {
           const node = map.get(n.id);
           if (n.parent_id && map.has(n.parent_id)) {
              map.get(n.parent_id).children.push(node);
           } else {
              roots.push(node);
           }
        });

        const sortAndBuildFullCodes = (nodes, parentFullCode = '') => {
           nodes.sort((a,b) => a.code.localeCompare(b.code));
           nodes.forEach(n => { 
               n.dynamicFullCode = parentFullCode + n.code;
               if(n.children) sortAndBuildFullCodes(n.children, n.dynamicFullCode); 
           });
        };
        sortAndBuildFullCodes(roots, '');

        setTreeData(roots);
        return { roots, map };
     } catch (err) {
        console.error('Error fetching tree:', err);
        return { roots: [], map: new Map() };
     }
  };

  const handleOpenTree = async (structure) => {
    if(!canDesign) return alert(t.err_access_denied || (isRtl ? "دسترسی طراحی ساختار ندارید" : "Access Denied for Designing"));
    setActiveStructure(structure);
    await fetchTreeData(structure.id);
    setViewMode('tree');
  };

  if (!canView) {
    return (
      <div className={`flex flex-col items-center justify-center h-full bg-slate-50/50 ${isRtl ? 'font-vazir' : 'font-sans'}`}>
        <div className="p-6 bg-white rounded-2xl shadow-sm text-center border border-red-100">
           <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4"><Ban className="text-red-500" size={32} /></div>
           <h2 className="text-lg font-bold text-slate-800">{isRtl ? 'دسترسی غیرمجاز' : 'Access Denied'}</h2>
           <p className="text-sm text-slate-500 mt-2">{isRtl ? 'شما مجوز مشاهده این فرم را ندارید.' : 'You do not have permission to view this form.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4 bg-slate-100">
       <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <List className="text-indigo-600"/>
            {t.coa_title || (isRtl ? "ساختار حساب‌ها (کدینگ)" : "Chart of Accounts")}
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            {isRtl ? "تعریف ساختار حساب‌ها و طراحی درخت کدینگ" : "Manage account structures and coding trees."}
          </p>
        </div>
      </div>

      <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
         {viewMode === 'list' ? (
            <StructureList 
               structures={structures} fetchStructures={fetchStructures} isRtl={isRtl} t={t}
               canCreate={canCreate} canEdit={canEdit} canDelete={canDelete} canDesign={canDesign}
               supabase={supabase} onOpenTree={handleOpenTree}
            />
         ) : (
            <AccountTreeView 
               structure={activeStructure} onBack={() => setViewMode('list')} 
               treeData={treeData} fetchTreeData={fetchTreeData} isRtl={isRtl} t={t}
               canCreate={canCreate} canEdit={canEdit} canDelete={canDelete} supabase={supabase}
               currencies={currencies} detailTypes={detailTypes}
            />
         )}
      </div>
    </div>
  );
};

window.ChartofAccounts = ChartofAccounts;
export default ChartofAccounts;
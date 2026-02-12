/* Filename: financial/generalledger/ChartofAccounts.js */
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Folder, FolderOpen, FileText, Plus, Save, Trash2, 
  Settings, Search, ChevronRight, ChevronDown, Check,
  AlertCircle, Layout, List, CreditCard, DollarSign,
  Package, Hash, Layers, FileDigit, ArrowRight, Edit,
  TreeDeciduous, MoreVertical, ShieldCheck, X, User,
  ChevronsDown, ChevronsUp, Minimize2, Maximize2 
} from 'lucide-react';

// --- DATA CONSTANTS ---

const ALL_TAFSIL_TYPES = [
  // --- System Types ---
  { id: 'party', label: 'طرف تجاری', en: 'Business Party', isSystem: true },
  { id: 'costcenter', label: 'مرکز هزینه', en: 'Cost Center', isSystem: true },
  { id: 'project', label: 'پروژه', en: 'Project', isSystem: true },
  { id: 'personnel', label: 'پرسنل', en: 'Personnel', isSystem: true },
  { id: 'bank', label: 'حساب بانکی', en: 'Bank Account', isSystem: true },
  { id: 'cash', label: 'صندوق', en: 'Cash Box', isSystem: true },
  { id: 'petty_cash', label: 'تنخواه', en: 'Petty Cash', isSystem: true },
  { id: 'branch', label: 'شعبه', en: 'Branch', isSystem: true },
  { id: 'customer_group', label: 'گروه مشتری', en: 'Customer Group', isSystem: true },
  { id: 'product_group', label: 'گروه محصول', en: 'Product Group', isSystem: true },
  { id: 'sales_office', label: 'دفتر فروش', en: 'Sales Office', isSystem: true },
  { id: 'price_zone', label: 'حوزه قیمت‌گذاری', en: 'Pricing Zone', isSystem: true },
  { id: 'product', label: 'کالا/خدمات', en: 'Product/Service', isSystem: true },
  
  // --- User Defined Types ---
  { id: 'contract', label: 'قراردادها', en: 'Contracts', isSystem: false },
  { id: 'vehicle', label: 'وسایل نقلیه', en: 'Vehicles', isSystem: false },
  { id: 'loan', label: 'تسهیلات', en: 'Loans', isSystem: false },
  { id: 'other1', label: 'سایر ۱', en: 'Other 1', isSystem: false },
  { id: 'other2', label: 'سایر ۲', en: 'Other 2', isSystem: false },
];

// --- SHARED HELPERS & SUB-COMPONENTS ---

const Checkbox = ({ label, checked, onChange, disabled, className = '' }) => (
  <div 
    className={`flex items-center gap-2 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer group'} ${className}`} 
    onClick={(e) => {
      e.stopPropagation(); // Prevent bubbling issues
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
  accountTypes, accountNatures, onOpenContraModal, contraAccountName 
}) => {
  const { InputField, SelectField, Button } = window.UI;

  const isSubsidiary = formData.level === 'subsidiary';
  const isGeneral = formData.level === 'general';
  const isGroup = formData.level === 'group';

  let prefix = '';
  if (!isGroup && selectedNode) {
     if (formData.id && selectedNode.fullCode) { // Editing
        const ownCodeLen = formData.code ? formData.code.length : 0;
        if (ownCodeLen > 0 && formData.fullCode.length > ownCodeLen) {
            prefix = formData.fullCode.substring(0, formData.fullCode.length - ownCodeLen);
        }
     } else { // Creating
        prefix = isGeneral 
          ? (selectedNode.level === 'group' ? selectedNode.code : '') 
          : (selectedNode.level === 'general' ? selectedNode.fullCode : '');
     }
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
                  if (val.length <= maxLen) setFormData({...formData, code: val});
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

        <InputField 
          label={isRtl ? "عنوان حساب (فارسی)" : "Account Title (Local)"} 
          value={formData.title || ''} 
          onChange={e => setFormData({...formData, title: e.target.value})}
          isRtl={isRtl}
        />
        <InputField 
          label={isRtl ? "عنوان حساب (انگلیسی)" : "Account Title (English)"} 
          value={formData.titleEn || ''} 
          onChange={e => setFormData({...formData, titleEn: e.target.value})}
          isRtl={isRtl}
          dir="ltr"
        />
        
        <SelectField 
          label={isRtl ? "نوع حساب" : "Account Type"}
          value={formData.type}
          onChange={e => setFormData({...formData, type: e.target.value})}
          isRtl={isRtl}
        >
          {accountTypes.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
        </SelectField>

        <SelectField 
          label={isRtl ? "ماهیت حساب" : "Account Nature"}
          value={formData.nature}
          onChange={e => setFormData({...formData, nature: e.target.value})}
          isRtl={isRtl}
        >
          {accountNatures.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
        </SelectField>
        
        {isSubsidiary && (
           <div className="col-span-1 md:col-span-2">
              <Checkbox 
                 label={isRtl ? "فعال" : "Active"}
                 checked={formData.isActive !== false}
                 onChange={v => setFormData(prev => ({...prev, isActive: v}))}
                 className="mb-4"
              />
           </div>
        )}
      </div>

      {isSubsidiary && (
        <div className="w-full animate-in slide-in-from-bottom-2">
           <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-3 mb-4">
              <h4 className="font-bold text-[11px] text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                 <ShieldCheck size={14} />
                 {isRtl ? "ویژگی‌های کنترلی" : "Control Features"}
              </h4>
              
              <div className="flex flex-col gap-2 pb-2 border-b border-slate-200">
                 <Checkbox 
                    label={isRtl ? "ویژگی ارزی (چند ارزی)" : "Currency Feature (Multi-currency)"}
                    checked={!!formData.currencyFeature}
                    onChange={v => setFormData(prev => ({...prev, currencyFeature: v}))}
                 />
                 {formData.currencyFeature && (
                    <div className="mr-6 grid grid-cols-2 gap-2 animate-in slide-in-from-top-1">
                       <SelectField 
                          label={isRtl ? "ارز پیش‌فرض" : "Default Currency"} isRtl={isRtl}
                          value={formData.defaultCurrency || ''}
                          onChange={e => setFormData({...formData, defaultCurrency: e.target.value})}
                       >
                          <option value="">-</option><option value="IRR">IRR</option><option value="USD">USD</option><option value="EUR">EUR</option>
                       </SelectField>
                       <div className="mt-6">
                         <Checkbox 
                            label={isRtl ? "الزام ورود ارز" : "Mandatory Currency"} 
                            checked={!!formData.currencyMandatory} 
                            onChange={v => setFormData(prev => ({...prev, currencyMandatory: v}))}
                         />
                       </div>
                    </div>
                 )}
              </div>

              <div className="flex flex-col gap-2 pb-2 border-b border-slate-200">
                 <Checkbox 
                    label={isRtl ? "ویژگی پیگیری" : "Tracking Feature"}
                    checked={!!formData.trackFeature}
                    onChange={v => setFormData(prev => ({...prev, trackFeature: v}))}
                 />
                 {formData.trackFeature && (
                    <div className="mr-6 flex gap-4 animate-in slide-in-from-top-1">
                       <Checkbox 
                          label={isRtl ? "اجباری" : "Mandatory"} 
                          checked={!!formData.trackMandatory} 
                          onChange={v => setFormData(prev => ({...prev, trackMandatory: v}))}
                       />
                       <Checkbox 
                          label={isRtl ? "یکتا بودن شماره پیگیری" : "Unique Tracking No."} 
                          checked={!!formData.trackUnique} 
                          onChange={v => setFormData(prev => ({...prev, trackUnique: v}))}
                       />
                    </div>
                 )}
              </div>

              <div className="flex flex-col gap-2">
                 <Checkbox 
                    label={isRtl ? "ویژگی مقداری" : "Quantity Feature"}
                    checked={!!formData.qtyFeature}
                    onChange={v => setFormData(prev => ({...prev, qtyFeature: v}))}
                 />
                 {formData.qtyFeature && (
                    <div className="mr-6 flex gap-4 animate-in slide-in-from-top-1">
                       <Checkbox 
                          label={isRtl ? "اجباری" : "Mandatory"} 
                          checked={!!formData.qtyMandatory} 
                          onChange={v => setFormData(prev => ({...prev, qtyMandatory: v}))}
                       />
                    </div>
                 )}
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 items-end">
              <SelectField 
                  label={isRtl ? "کنترل ماهیت طی دوره" : "Nature Control During Period"} 
                  isRtl={isRtl}
                  value={formData.natureControl || 'none'}
                  onChange={e => setFormData({...formData, natureControl: e.target.value})}
              >
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
                       <Button variant="outline" className="text-red-500 border-red-200 hover:bg-red-50" icon={X} onClick={() => setFormData({...formData, contraAccountId: null})} />
                    )}
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const TafsilSelector = ({ formData, setFormData, isRtl }) => {
  const { Callout } = window.UI;
  return (
     <div className="space-y-4">
        <Callout variant="info">
           {isRtl 
              ? "انواع تفصیل‌های مجاز برای این حساب معین را انتخاب کنید." 
              : "Select the detailed account types allowed for this subsidiary."}
        </Callout>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
           {ALL_TAFSIL_TYPES.map(t => (
              <div 
                 key={t.id}
                 onClick={() => {
                    const exists = formData.tafsils?.includes(t.id);
                    const newTafsils = exists ? formData.tafsils.filter(x => x !== t.id) : [...(formData.tafsils || []), t.id];
                    setFormData({...formData, tafsils: newTafsils});
                 }}
                 className={`
                    relative cursor-pointer border rounded-lg p-3 text-center transition-all select-none
                    ${formData.tafsils?.includes(t.id) 
                       ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-bold shadow-sm ring-1 ring-indigo-200' 
                       : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'}
                 `}
              >
                 {!t.isSystem && (
                     <div className={`absolute top-1 left-1 ${isRtl ? 'right-auto' : 'right-1'} text-[8px] opacity-70`}>
                        <User size={10} className="text-indigo-500" />
                     </div>
                 )}
                 <div className="text-[12px] flex items-center justify-center gap-1">
                    {t.label}
                 </div>
              </div>
           ))}
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
     setFormData({...formData, descriptions: newList});
     setDescText('');
  };

  return (
     <div className="h-full flex flex-col">
        <div className="flex gap-2 mb-3">
           <InputField 
              placeholder={isRtl ? "شرح استاندارد جدید..." : "New standard description..."} 
              value={descText} onChange={e=>setDescText(e.target.value)} 
              className="flex-1" isRtl={isRtl}
           />
           <Button onClick={addDesc} icon={Plus} variant="secondary">{isRtl ? "افزودن" : "Add"}</Button>
        </div>
        <div className="flex-1 overflow-y-auto border border-slate-200 rounded-lg bg-slate-50 p-2 space-y-1">
           {list.map(item => (
              <div key={item.id} className="bg-white p-2 rounded border border-slate-200 flex justify-between items-center group">
                 <span className="text-[12px] text-slate-700">{item.text}</span>
                 <button 
                    onClick={() => {
                       const newList = list.filter(l => l.id !== item.id);
                       setFormData({...formData, descriptions: newList});
                    }}
                    className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                 >
                    <Trash2 size={14}/>
                 </button>
              </div>
           ))}
           {list.length === 0 && (
              <div className="text-center text-slate-400 text-xs mt-4 italic">
                 {isRtl ? "موردی تعریف نشده است" : "No descriptions defined"}
              </div>
           )}
        </div>
     </div>
  );
};

// --- MAIN COMPONENT ---

const ChartofAccounts = ({ t, isRtl }) => {
  const { 
    Button, InputField, SelectField, DataGrid, Modal, 
    Badge, Callout, ToggleChip, SelectionGrid, TreeView,
    FilterSection 
  } = window.UI;

  // --- GLOBAL STATE ---

  const [viewMode, setViewMode] = useState('list'); 
  const [activeStructure, setActiveStructure] = useState(null);

  const [structures, setStructures] = useState([
    { 
      id: 1, code: '01', title: 'کدینگ حسابداری اصلی', status: true, 
      groupLen: 1, generalLen: 2, subsidiaryLen: 2, useChar: false 
    },
    { 
      id: 2, code: '02', title: 'کدینگ پروژه ای', status: true, 
      groupLen: 2, generalLen: 3, subsidiaryLen: 4, useChar: true 
    }
  ]);

  const [allAccounts, setAllAccounts] = useState({
    1: [
      { 
        id: '1', level: 'group', code: '1', 
        title: 'دارایی‌های جاری', titleEn: 'Current Assets',
        label: { fa: 'دارایی‌های جاری', en: 'Current Assets' },
        type: 'permanent', nature: 'debit', 
        children: [
          {
            id: '101', level: 'general', code: '01', fullCode: '101',
            title: 'موجودی نقد و بانک', titleEn: 'Cash & Banks',
            label: { fa: 'موجودی نقد و بانک', en: 'Cash & Banks' },
            type: 'permanent', nature: 'debit',
            children: []
          }
        ]
      }
    ],
    2: []
  });

  const accountTypes = [
    { id: 'permanent', label: isRtl ? 'دائم (ترازنامه‌ای)' : 'Permanent (Balance Sheet)' },
    { id: 'temporary', label: isRtl ? 'موقت (سود و زیانی)' : 'Temporary (P&L)' },
    { id: 'disciplinary', label: isRtl ? 'انتظامی' : 'Disciplinary' },
  ];

  const accountNatures = [
    { id: 'debit', label: isRtl ? 'بدهکار' : 'Debit' },
    { id: 'credit', label: isRtl ? 'بستانکار' : 'Credit' },
    { id: 'none', label: isRtl ? 'مهم نیست' : 'None' },
  ];

  // --- SUB-COMPONENT: STRUCTURE LIST VIEW ---
  
  const StructureList = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({
      code: '', title: '', status: true,
      groupLen: 1, generalLen: 2, subsidiaryLen: 2, useChar: false
    });

    const handleEdit = (row) => {
      setEditingItem(row);
      setFormData(row);
      setShowModal(true);
    };

    const handleCreate = () => {
      setEditingItem(null);
      setFormData({
        code: '', title: '', status: true,
        groupLen: 1, generalLen: 2, subsidiaryLen: 2, useChar: false
      });
      setShowModal(true);
    };

    const handleSave = () => {
      if (!formData.code || !formData.title) return alert(isRtl ? "کد و عنوان الزامی است" : "Code and Title are required");
      
      if (editingItem) {
        setStructures(prev => prev.map(item => item.id === editingItem.id ? { ...formData, id: item.id } : item));
      } else {
        const newId = Date.now();
        setStructures(prev => [...prev, { ...formData, id: newId }]);
        setAllAccounts(prev => ({ ...prev, [newId]: [] })); 
      }
      setShowModal(false);
    };

    const handleDelete = (ids) => {
      if (confirm(isRtl ? "آیا از حذف موارد انتخاب شده اطمینان دارید؟" : "Are you sure?")) {
        setStructures(prev => prev.filter(item => !ids.includes(item.id)));
      }
    };

    const handleOpenTree = (structure) => {
      setActiveStructure(structure);
      setViewMode('tree');
    };

    return (
      <div className="h-full flex flex-col animate-in fade-in duration-300">
        <FilterSection onSearch={() => {}} onClear={() => setSearchTerm('')} isRtl={isRtl}>
           <InputField label={isRtl ? "کد ساختار" : "Structure Code"} value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} isRtl={isRtl}/>
           <InputField label={isRtl ? "عنوان" : "Title"} isRtl={isRtl}/>
        </FilterSection>

        <div className="flex-1 overflow-hidden">
          <DataGrid 
            columns={[
              { field: 'code', header: isRtl ? 'کد' : 'Code', width: 'w-24' },
              { field: 'title', header: isRtl ? 'عنوان' : 'Title', width: 'w-64' },
              { 
                field: 'status', 
                header: isRtl ? 'وضعیت' : 'Status', 
                width: 'w-24', 
                render: r => <Badge variant={r.status ? 'success' : 'neutral'}>{r.status ? (isRtl ? 'فعال' : 'Active') : (isRtl ? 'غیرفعال' : 'Inactive')}</Badge> 
              },
              { field: 'groupLen', header: isRtl ? 'طول گروه' : 'Group Len', width: 'w-24' },
              { field: 'generalLen', header: isRtl ? 'طول کل' : 'General Len', width: 'w-24' },
              { field: 'subsidiaryLen', header: isRtl ? 'طول معین' : 'Sub Len', width: 'w-24' },
              { field: 'useChar', header: isRtl ? 'کاراکتر' : 'Chars', width: 'w-24', type: 'toggle' },
            ]}
            data={structures}
            isRtl={isRtl}
            onCreate={handleCreate}
            onDelete={handleDelete}
            actions={(row) => (
              <div className="flex gap-1 justify-center">
                 <button 
                    onClick={() => handleOpenTree(row)} 
                    title={isRtl ? "طراحی ساختار درختی" : "Design Tree Structure"}
                    className="p-1.5 text-indigo-600 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded transition-colors"
                 >
                    <TreeDeciduous size={16}/>
                 </button>
                 <button onClick={() => handleEdit(row)} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded"><Edit size={16}/></button>
                 <button className="p-1.5 text-red-500 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
              </div>
            )}
          />
        </div>

        <Modal 
          isOpen={showModal} 
          onClose={() => setShowModal(false)} 
          title={editingItem ? (isRtl ? "ویرایش ساختار حساب" : "Edit Account Structure") : (isRtl ? "تعریف ساختار حساب جدید" : "New Account Structure")}
          footer={<><Button variant="outline" onClick={() => setShowModal(false)}>{isRtl ? "انصراف" : "Cancel"}</Button><Button variant="primary" onClick={handleSave}>{isRtl ? "ذخیره" : "Save"}</Button></>}
        >
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

  // --- SUB-COMPONENT: TREE DESIGNER VIEW ---

  const AccountTreeView = ({ structure, data, onSaveTree, onBack }) => {
    const [selectedNode, setSelectedNode] = useState(null);
    const [mode, setMode] = useState('view'); 
    const [activeTab, setActiveTab] = useState('info'); 
    const [formData, setFormData] = useState({});
    
    // Tree State Control
    const [expandedIds, setExpandedIds] = useState([]);

    // Contra Account Modal State
    const [showContraModal, setShowContraModal] = useState(false);

    // --- Helpers ---
    const getParentCode = (node) => {
      if (!node) return '';
      if (node.level === 'group') return node.code;
      if (node.level === 'general') return node.fullCode;
      return '';
    };

    const flattenTree = (nodes, list = []) => {
        nodes.forEach(node => { list.push(node); if (node.children) flattenTree(node.children, list); });
        return list;
    };

    const handleCreate = (level) => {
      if (level !== 'group' && !selectedNode) return;
      
      let defaults = {
        level: level,
        isActive: true,
        type: 'permanent',
        nature: 'debit',
        tafsils: [],
        descriptions: []
      };

      if (selectedNode) {
        if (level === 'general' || level === 'subsidiary') {
          defaults.parentId = selectedNode.id;
          defaults.type = selectedNode.type;
          defaults.nature = selectedNode.nature;
        }
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

    // Recursive Updaters
    const addNodeToTree = (nodes, parentId, newNode) => {
      return nodes.map(node => {
        if (node.id === parentId) {
          return { ...node, children: [...(node.children || []), newNode] };
        } else if (node.children) {
          return { ...node, children: addNodeToTree(node.children, parentId, newNode) };
        }
        return node;
      });
    };

    const updateNodeInTree = (nodes, updatedNode) => {
      return nodes.map(node => {
        if (node.id === updatedNode.id) {
          return { ...node, ...updatedNode };
        } else if (node.children) {
          return { ...node, children: updateNodeInTree(node.children, updatedNode) };
        }
        return node;
      });
    };

    // Find all ancestor IDs for a given node ID to expand the path
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

    const handleSaveForm = () => {
      if (!formData.code || !formData.title) return alert(isRtl ? "کد و عنوان الزامی است" : "Code and Title Required");
      
      let requiredLen = 0;
      if (formData.level === 'group') requiredLen = structure.groupLen;
      else if (formData.level === 'general') requiredLen = structure.generalLen;
      else if (formData.level === 'subsidiary') requiredLen = structure.subsidiaryLen;

      if (formData.code.length !== requiredLen) {
        return alert(isRtl ? `طول کد برای این سطح باید ${requiredLen} کاراکتر باشد.` : `Code length must be ${requiredLen}.`);
      }

      let fullCode = formData.code;
      if (formData.level !== 'group') {
        const parentCode = getParentCode(selectedNode);
        fullCode = parentCode + formData.code;
      }

      const labelObj = { fa: formData.title, en: formData.titleEn || formData.title };
      const nodeData = { ...formData, fullCode, label: labelObj };

      let newData;
      let targetNodeId;

      if (mode === 'edit') {
        newData = updateNodeInTree(data, nodeData);
        targetNodeId = nodeData.id;
      } else {
        const newNode = { ...nodeData, id: Date.now().toString(), children: [] };
        targetNodeId = newNode.id;
        if (formData.level === 'group') {
          newData = [...data, newNode];
        } else {
          newData = addNodeToTree(data, selectedNode.id, newNode);
        }
      }
      
      // 1. Calculate Path to expand BEFORE updating tree data
      const ancestors = getAncestorIds(newData, targetNodeId) || [];
      
      // 2. Set Expanded IDs (Merge with existing)
      setExpandedIds(prev => [...new Set([...prev, ...ancestors])]);

      // 3. Find the new object reference in the new data structure
      const newFlatData = flattenTree(newData);
      const newSelectedNode = newFlatData.find(n => n.id === targetNodeId);
      
      // 4. Update Selected Node
      setSelectedNode(newSelectedNode);

      // 5. Save Data (This triggers prop update)
      onSaveTree(newData);
      
      setMode('view');
    };

    const handleDelete = () => {
       if (selectedNode?.children?.length > 0) return alert(isRtl ? "حساب دارای زیرمجموعه است" : "Account has children");
       alert(isRtl ? "عملیات حذف (شبیه‌سازی شده)" : "Delete simulated");
       setSelectedNode(null);
       setMode('view');
    };

    // --- Tree Controls ---
    const getAllParentIds = (nodes) => {
        let ids = [];
        nodes.forEach(node => {
            if (node.children && node.children.length > 0) {
                ids.push(node.id);
                ids = ids.concat(getAllParentIds(node.children));
            }
        });
        return ids;
    };

    const handleExpandAll = () => {
        const allIds = getAllParentIds(data);
        setExpandedIds(allIds);
    };

    const handleCollapseAll = () => {
        setExpandedIds([]);
    };

    // --- Helpers for Contra Account Modal (Path Building) ---
    const flattenSubsidiariesWithPaths = (nodes, parentPath = '') => {
       let result = [];
       nodes.forEach(node => {
          const currentPath = parentPath ? `${parentPath} > ${node.title}` : node.title;
          
          if (node.level === 'subsidiary') {
             result.push({ 
                 ...node, 
                 pathTitle: currentPath 
             });
          }
          
          if (node.children) {
             result = result.concat(flattenSubsidiariesWithPaths(node.children, currentPath));
          }
       });
       return result;
    };
    
    const filteredSubsidiaries = useMemo(() => {
       const list = flattenSubsidiariesWithPaths(data);
       return list.filter(n => n.id !== formData.id); 
    }, [data, formData.id]);

    const getContraAccountName = (id) => {
       if (!id) return '';
       const list = flattenSubsidiariesWithPaths(data);
       const acc = list.find(n => n.id === id);
       return acc ? `${acc.fullCode} - ${acc.title}` : '';
    };

    // --- Renderers ---
    const renderTreeContent = (node) => {
      const isGroup = node.level === 'group';
      const isGeneral = node.level === 'general';
      const color = isGroup ? 'text-indigo-700' : isGeneral ? 'text-slate-700' : 'text-slate-500';
      const icon = isGroup ? <Layers size={14}/> : isGeneral ? <Folder size={14}/> : <FileText size={14}/>;
      return (
        <div className={`flex items-center gap-1.5 ${color}`}>
          {icon}
          <span className="font-mono text-[11px] font-bold bg-slate-100 px-1 rounded">{node.code}</span>
          <span className="text-[11px]">{node.title}</span>
        </div>
      );
    };

    const handleNodeSelect = (nodeId) => {
        const allNodes = flattenTree(data);
        setSelectedNode(allNodes.find(n => n.id === nodeId));
        setMode('view');
    };

    const tabs = [
      { id: 'info', label: isRtl ? 'اطلاعات اصلی' : 'General Info', icon: FileText },
      { id: 'tafsil', label: isRtl ? 'تفصیل‌ها' : 'Detailed Accts', icon: List },
      { id: 'desc', label: isRtl ? 'شرح‌های استاندارد' : 'Descriptions', icon: FileDigit },
    ];
 
    const activeTabs = formData.level === 'subsidiary' ? tabs : [tabs[0]];

    return (
      <div className="h-full flex flex-col animate-in slide-in-from-right-8 duration-300">
         {/* Tree Header */}
         <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between shadow-sm shrink-0">
            <div className="flex items-center gap-3">
               <Button variant="ghost" size="iconSm" onClick={onBack} icon={isRtl ? ArrowRight : ArrowRight} className={isRtl ? '' : 'rotate-180'} />
               <div>
                  <h2 className="font-bold text-slate-800 text-sm">{structure.title}</h2>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                     <span>Code: {structure.code}</span>
                     <span>|</span>
                     <span>Structure: {structure.groupLen}-{structure.generalLen}-{structure.subsidiaryLen}</span>
                  </div>
               </div>
            </div>
            <div className="flex items-center gap-2">
               <Button variant="primary" size="sm" icon={Plus} onClick={() => handleCreate('group')}>{isRtl ? "گروه حساب جدید" : "New Group"}</Button>
            </div>
         </div>

         <div className="flex-1 flex gap-4 p-4 overflow-hidden bg-slate-100">
            {/* Tree Sidebar */}
            <div className="w-1/3 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
               <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">{isRtl ? "ساختار درختی" : "Tree Structure"}</span>
                  <div className="flex gap-1">
                     <button className="w-6 h-6 flex items-center justify-center hover:bg-slate-200 rounded text-slate-500 transition-colors" onClick={handleExpandAll} title={isRtl ? "باز کردن همه" : "Expand All"}><ChevronsDown size={14}/></button>
                     <button className="w-6 h-6 flex items-center justify-center hover:bg-slate-200 rounded text-slate-500 transition-colors" onClick={handleCollapseAll} title={isRtl ? "بستن همه" : "Collapse All"}><ChevronsUp size={14}/></button>
                  </div>
               </div>
               <div className="flex-1 overflow-y-auto p-2">
                  <TreeView 
                     data={data} 
                     onSelectNode={(node) => handleNodeSelect(node.id)}
                     selectedNodeId={selectedNode?.id}
                     renderNodeContent={renderTreeContent}
                     isRtl={isRtl}
                     expandedIds={expandedIds}
                     onToggle={(ids) => setExpandedIds(ids)}
                  />
               </div>
            </div>

            {/* Details Panel */}
            <div className="w-2/3 flex flex-col">
               {!selectedNode && mode === 'view' && (
                  <div className="h-full bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-slate-400">
                     <TreeDeciduous size={48} className="text-indigo-200 mb-2"/>
                     <p className="text-sm font-medium">{isRtl ? "یک حساب انتخاب کنید یا گروه جدید بسازید" : "Select an account or create a group"}</p>
                  </div>
               )}

               {/* VIEW MODE - READ ONLY DETAILS */}
               {selectedNode && mode === 'view' && (
                  <div className="h-full bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-y-auto">
                     <div className="p-6 border-b border-slate-100 flex justify-between items-start">
                        <div>
                           <div className="flex items-center gap-2 mb-1">
                              <Badge variant="neutral" className="font-mono text-lg px-2">{selectedNode.code}</Badge>
                              <h2 className="text-lg font-bold text-slate-800">{selectedNode.title}</h2>
                           </div>
                           <div className="text-xs text-slate-500">{selectedNode.titleEn}</div>
                        </div>
                        <div className="flex gap-2">
                           <Button variant="outline" size="sm" icon={Trash2} onClick={handleDelete} className="text-red-600 hover:text-red-700"/>
                           <Button variant="secondary" size="sm" icon={Edit} onClick={handleEdit}>{isRtl ? "ویرایش" : "Edit"}</Button>
                        </div>
                     </div>
                     
                     <div className="p-6 space-y-6">
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
                                   <div className="text-sm font-medium text-slate-700 bg-slate-50 p-2 rounded border border-slate-100" dir="ltr">
                                       {getContraAccountName(selectedNode.contraAccountId)}
                                   </div>
                               </div>
                           )}
                        </div>

                        {selectedNode.level === 'subsidiary' && (
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
                        )}
                     </div>

                     <div className="mt-auto p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
                        {selectedNode.level === 'group' && <Button variant="primary" size="sm" icon={Plus} onClick={() => handleCreate('general')}>{isRtl ? "حساب کل جدید" : "New General"}</Button>}
                        {selectedNode.level === 'general' && <Button variant="primary" size="sm" icon={Plus} onClick={() => handleCreate('subsidiary')}>{isRtl ? "حساب معین جدید" : "New Subsidiary"}</Button>}
                     </div>
                  </div>
               )}

               {/* EDIT / CREATE MODE */}
               {mode !== 'view' && (
                  <div className="h-full bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
                     <div className="px-4 py-3 border-b border-slate-100 font-bold text-slate-700 flex items-center gap-2">
                        {mode === 'edit' ? <Edit size={16}/> : <Plus size={16}/>}
                        {mode === 'edit' ? (isRtl ? "ویرایش حساب" : "Edit Account") : (isRtl ? "حساب جدید" : "New Account")}
                        <Badge variant="neutral">{formData.level}</Badge>
                     </div>
                     
                     <div className="p-4 flex-1 overflow-y-auto">
                        <Tabs tabs={activeTabs} activeTab={activeTab} onChange={setActiveTab} />
                        
                        {activeTab === 'info' && (
                           <AccountForm 
                             formData={formData} 
                             setFormData={setFormData} 
                             structure={structure} 
                             selectedNode={selectedNode} 
                             isRtl={isRtl}
                             accountTypes={window.accountTypes || []} 
                             accountNatures={window.accountNatures || []}
                             onOpenContraModal={() => setShowContraModal(true)}
                             contraAccountName={getContraAccountName(formData.contraAccountId)}
                           />
                        )}
                        {activeTab === 'tafsil' && (
                           <TafsilSelector 
                             formData={formData} 
                             setFormData={setFormData} 
                             isRtl={isRtl} 
                           />
                        )}
                        {activeTab === 'desc' && (
                           <StandardDesc 
                             formData={formData} 
                             setFormData={setFormData} 
                             isRtl={isRtl} 
                           />
                        )}
                     </div>
                     <div className="p-3 border-t border-slate-200 bg-slate-50 flex justify-end gap-2 rounded-b-xl">
                        <Button variant="outline" onClick={() => setMode('view')}>{isRtl ? "انصراف" : "Cancel"}</Button>
                        <Button variant="primary" icon={Save} onClick={handleSaveForm}>{isRtl ? "ذخیره" : "Save"}</Button>
                     </div>
                  </div>
               )}
            </div>
         </div>

         {/* CONTRA ACCOUNT SELECTION MODAL */}
         <Modal
            isOpen={showContraModal}
            onClose={() => setShowContraModal(false)}
            title={isRtl ? "انتخاب حساب معین (تعدیل ماهیت)" : "Select Contra Account"}
            maxWidth="max-w-4xl"
         >
             <div className="h-[500px] flex flex-col">
                 <div className="flex-1 overflow-hidden border border-slate-200 rounded-lg">
                     <DataGrid 
                         columns={[
                             { field: 'fullCode', header: isRtl ? 'کد کامل' : 'Full Code', width: 'w-32' },
                             { field: 'pathTitle', header: isRtl ? 'مسیر حساب' : 'Account Path', width: 'w-auto' }, 
                             { field: 'nature', header: isRtl ? 'ماهیت' : 'Nature', width: 'w-24', render: r => <Badge variant={r.nature === 'debit' ? 'info' : r.nature === 'credit' ? 'warning' : 'neutral'}>{r.nature}</Badge> }
                         ]}
                         data={filteredSubsidiaries}
                         isRtl={isRtl}
                         actions={(row) => (
                             <Button size="sm" onClick={() => {
                                 setFormData(prev => ({...prev, contraAccountId: row.id}));
                                 setShowContraModal(false);
                             }}>
                                 {isRtl ? "انتخاب" : "Select"}
                             </Button>
                         )}
                     />
                 </div>
                 <div className="mt-2 text-xs text-slate-400">
                     {isRtl 
                         ? `تعداد حساب‌های قابل انتخاب: ${filteredSubsidiaries.length}` 
                         : `${filteredSubsidiaries.length} eligible accounts`}
                 </div>
             </div>
         </Modal>
      </div>
    );
  };

  // --- 4. MAIN RENDER ---

  const handleUpdateTree = (newData) => {
     setAllAccounts(prev => ({ ...prev, [activeStructure.id]: newData }));
  };
  
  window.accountTypes = accountTypes;
  window.accountNatures = accountNatures;

  return (
    <div className="h-full flex flex-col p-4 bg-slate-100">
       <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Hash className="text-indigo-600"/>
            {t.coa_title || (isRtl ? "ساختار حساب‌ها (کدینگ)" : "Chart of Accounts")}
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            {isRtl ? "تعریف ساختار حساب‌ها و طراحی درخت کدینگ" : "Manage account structures and coding trees."}
          </p>
        </div>
      </div>

      <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
         {viewMode === 'list' ? (
            <StructureList />
         ) : (
            <AccountTreeView 
               structure={activeStructure} 
               data={allAccounts[activeStructure.id] || []} 
               onSaveTree={handleUpdateTree}
               onBack={() => setViewMode('list')}
            />
         )}
      </div>
    </div>
  );
};

window.ChartofAccounts = ChartofAccounts;

export default ChartofAccounts;
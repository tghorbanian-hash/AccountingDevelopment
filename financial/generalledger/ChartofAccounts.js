/* Filename: financial/generalledger/ChartofAccounts.js */
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Folder, FolderOpen, FileText, Plus, Save, Trash2, 
  Settings, Search, ChevronRight, ChevronDown, Check,
  AlertCircle, Layout, List, CreditCard, DollarSign,
  Package, Hash, Layers, FileDigit
} from 'lucide-react';

const ChartofAccounts = ({ t, isRtl }) => {
  const { 
    Button, InputField, SelectField, DataGrid, Modal, 
    Badge, Callout, ToggleChip, SelectionGrid, TreeView 
  } = window.UI;

  // --- 0. CUSTOM COMPONENTS (Local) ---
  
  // Custom Checkbox (replacement for Toggle as requested)
  const Checkbox = ({ label, checked, onChange, disabled, className = '' }) => (
    <div 
      className={`flex items-center gap-2 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer group'} ${className}`} 
      onClick={() => !disabled && onChange(!checked)}
    >
      <div className={`
        w-4 h-4 rounded border flex items-center justify-center transition-all duration-200
        ${checked 
          ? 'bg-indigo-600 border-indigo-600 shadow-sm' 
          : 'bg-white border-slate-300 group-hover:border-indigo-400'}
      `}>
        {checked && <Check size={12} className="text-white" strokeWidth={3} />}
      </div>
      {label && <span className="text-[12px] font-medium text-slate-700 select-none">{label}</span>}
    </div>
  );

  // Tab Navigation Component
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

  // --- 1. STATE MANAGEMENT ---

  // Coding Structure Settings
  const [structure, setStructure] = useState({
    groupLen: 1,
    generalLen: 2,
    subsidiaryLen: 2,
    useChar: false,
    isLocked: false // Becomes true after first account is created
  });

  // Data Store (Mocked for UI)
  const [accounts, setAccounts] = useState([
    { 
      id: '1', level: 'group', code: '1', 
      title: 'دارایی‌های جاری', titleEn: 'Current Assets',
      type: 'permanent', nature: 'debit', 
      children: [
        {
          id: '101', level: 'general', code: '01', fullCode: '101',
          title: 'موجودی نقد و بانک', titleEn: 'Cash & Banks',
          type: 'permanent', nature: 'debit',
          children: [
            {
              id: '10101', level: 'subsidiary', code: '01', fullCode: '10101',
              title: 'موجودی ریالی نزد بانک‌ها', titleEn: 'Cash in Banks (Rials)',
              type: 'permanent', nature: 'debit',
              isActive: true,
              currencyFeature: false, trackFeature: false, qtyFeature: false,
              tafsils: [], descriptions: []
            }
          ]
        }
      ]
    }
  ]);

  // UI State
  const [selectedNode, setSelectedNode] = useState(null); // The node selected in the tree
  const [mode, setMode] = useState('view'); // 'view', 'create_group', 'create_general', 'create_sub', 'edit'
  const [showStructureModal, setShowStructureModal] = useState(false);
  const [activeTab, setActiveTab] = useState('info'); // 'info', 'tafsil', 'desc'
  
  // Form Data
  const [formData, setFormData] = useState({});

  // --- 2. HELPERS & LOGIC ---

  const getFullCodeLength = (level) => {
    if (level === 'group') return structure.groupLen;
    if (level === 'general') return structure.groupLen + structure.generalLen;
    if (level === 'subsidiary') return structure.groupLen + structure.generalLen + structure.subsidiaryLen;
    return 0;
  };

  const getParentCode = (node) => {
    if (!node) return '';
    if (node.level === 'group') return node.code;
    if (node.level === 'general') return node.fullCode;
    return '';
  };

  const flattenTree = (nodes, list = []) => {
    nodes.forEach(node => {
      list.push(node);
      if (node.children) flattenTree(node.children, list);
    });
    return list;
  };

  const handleNodeSelect = (nodeId) => {
    const allNodes = flattenTree(accounts);
    const node = allNodes.find(n => n.id === nodeId);
    setSelectedNode(node);
    setMode('view');
    setFormData({});
  };

  const handleCreate = (level) => {
    if (level !== 'group' && !selectedNode) return;
    
    // Default values inheritance
    let defaults = {
      level: level,
      isActive: true,
      type: 'permanent',
      nature: 'debit',
      tafsils: [],
      descriptions: []
    };

    if (selectedNode) {
      if (level === 'general') {
        defaults.parentId = selectedNode.id;
        defaults.type = selectedNode.type;
        defaults.nature = selectedNode.nature;
      } else if (level === 'subsidiary') {
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

  const handleSave = () => {
    // Validation
    if (!formData.code || !formData.title) {
      alert(isRtl ? "لطفا کد و عنوان را وارد کنید." : "Please enter code and title.");
      return;
    }
    
    // Length check
    let requiredLen = 0;
    if (formData.level === 'group') requiredLen = structure.groupLen;
    else if (formData.level === 'general') requiredLen = structure.generalLen;
    else if (formData.level === 'subsidiary') requiredLen = structure.subsidiaryLen;

    if (formData.code.length !== requiredLen) {
      alert(isRtl ? `طول کد باید ${requiredLen} رقم باشد.` : `Code length must be ${requiredLen} digits.`);
      return;
    }

    // Determine Full Code
    let fullCode = formData.code;
    if (formData.level !== 'group') {
      const parentCode = getParentCode(selectedNode);
      fullCode = parentCode + formData.code;
    }

    // Save Logic (Mock)
    // In a real app, you would recurse the tree to add/update
    // Here we just alert success for UI demo
    if (!structure.isLocked) setStructure(prev => ({ ...prev, isLocked: true }));
    
    alert(isRtl ? "اطلاعات با موفقیت ذخیره شد." : "Data saved successfully.");
    setMode('view');
    
    // Optimistic Update (Simplified for Group level just to show effect)
    if (formData.level === 'group' && mode === 'create_group') {
      const newGroup = { ...formData, id: Date.now().toString(), fullCode: formData.code, children: [] };
      setAccounts(prev => [...prev, newGroup]);
    } else {
       // Refresh tree logic would go here
    }
  };

  const handleDelete = () => {
    if (selectedNode?.children?.length > 0) {
      alert(isRtl ? "این حساب دارای زیرمجموعه است و قابل حذف نیست." : "Cannot delete account with children.");
      return;
    }
    if (confirm(isRtl ? "آیا از حذف این حساب اطمینان دارید؟" : "Are you sure you want to delete this account?")) {
      alert(isRtl ? "حساب حذف شد." : "Account deleted.");
      setSelectedNode(null);
      setMode('view');
    }
  };

  // --- 3. OPTIONS DATA ---

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

  const tafsilTypes = [
    { id: 'party', label: isRtl ? 'طرف تجاری' : 'Business Party' },
    { id: 'costcenter', label: isRtl ? 'مرکز هزینه' : 'Cost Center' },
    { id: 'project', label: isRtl ? 'پروژه' : 'Project' },
    { id: 'personnel', label: isRtl ? 'پرسنل' : 'Personnel' },
    { id: 'bank', label: isRtl ? 'حساب بانکی' : 'Bank Account' },
    { id: 'cash', label: isRtl ? 'صندوق' : 'Cash Box' },
    { id: 'product', label: isRtl ? 'کالا/خدمات' : 'Product/Service' },
    { id: 'branch', label: isRtl ? 'شعبه' : 'Branch' },
  ];

  // --- 4. RENDERERS ---

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

  // --- 5. SUB-COMPONENTS (FORMS) ---

  const StructureForm = () => (
    <div className="space-y-4">
      <Callout variant="info" icon={AlertCircle}>
        {isRtl 
          ? "توجه: پس از تعریف اولین حساب، طول کدها قابل تغییر نخواهد بود. مجموع طول کدها حداکثر ۱۲ رقم می‌تواند باشد."
          : "Note: Code lengths cannot be changed after creating the first account. Total length max 12 digits."}
      </Callout>
      
      <div className="grid grid-cols-3 gap-4">
        <InputField 
          label={isRtl ? "طول کد گروه" : "Group Code Length"} 
          type="number" min="1" max="10"
          value={structure.groupLen}
          onChange={e => setStructure({...structure, groupLen: parseInt(e.target.value)})}
          disabled={structure.isLocked}
          isRtl={isRtl}
        />
        <InputField 
          label={isRtl ? "طول کد کل" : "General Code Length"} 
          type="number" min="1" max="10"
          value={structure.generalLen}
          onChange={e => setStructure({...structure, generalLen: parseInt(e.target.value)})}
          disabled={structure.isLocked}
          isRtl={isRtl}
        />
        <InputField 
          label={isRtl ? "طول کد معین" : "Subsidiary Code Length"} 
          type="number" min="1" max="10"
          value={structure.subsidiaryLen}
          onChange={e => setStructure({...structure, subsidiaryLen: parseInt(e.target.value)})}
          disabled={structure.isLocked}
          isRtl={isRtl}
        />
      </div>

      <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
        <div className="text-[12px] font-bold text-slate-700">
          {isRtl ? "مجموع طول کد حساب:" : "Total Account Code Length:"}
        </div>
        <div className="text-lg font-black text-indigo-700">
          {structure.groupLen + structure.generalLen + structure.subsidiaryLen} / 12
        </div>
      </div>
      
      <div className="pt-2">
         <Checkbox 
            label={isRtl ? "استفاده از حروف و کاراکتر در کدینگ" : "Use alphanumeric characters in coding"}
            checked={structure.useChar}
            onChange={v => setStructure({...structure, useChar: v})}
            disabled={structure.isLocked}
         />
      </div>
    </div>
  );

  const AccountForm = () => {
    const isSubsidiary = formData.level === 'subsidiary';
    const isGeneral = formData.level === 'general';
    const isGroup = formData.level === 'group';

    // Calculate Code Prefix
    let prefix = '';
    if (!isGroup && selectedNode) {
       prefix = isGeneral 
         ? (selectedNode.level === 'group' ? selectedNode.code : '') // Parent is Group
         : (selectedNode.level === 'general' ? selectedNode.fullCode : ''); // Parent is General
    }

    // Validations for visual feedback
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
            // Inherited types cannot be changed easily on lower levels unless logic permits
            // Here we assume flexibility for General/Sub but Group dictates defaults
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
                   checked={formData.isActive}
                   onChange={v => setFormData({...formData, isActive: v})}
                   className="mb-4"
                />
             </div>
          )}
        </div>

        {/* SUBSIDIARY SPECIFIC SETTINGS */}
        {isSubsidiary && (
          <div className="flex-1 overflow-y-auto pr-1">
             <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-3 mb-4">
                <h4 className="font-bold text-[11px] text-slate-500 uppercase tracking-wider mb-2">
                   {isRtl ? "ویژگی‌های کنترلی" : "Control Features"}
                </h4>
                
                {/* Currency */}
                <div className="flex flex-col gap-2 pb-2 border-b border-slate-200">
                   <Checkbox 
                      label={isRtl ? "ویژگی ارزی (چند ارزی)" : "Currency Feature (Multi-currency)"}
                      checked={formData.currencyFeature}
                      onChange={v => setFormData({...formData, currencyFeature: v})}
                   />
                   {formData.currencyFeature && (
                      <div className="mr-6 grid grid-cols-2 gap-2 animate-in slide-in-from-top-1">
                         <SelectField label={isRtl ? "ارز پیش‌فرض" : "Default Currency"} isRtl={isRtl}>
                            <option>IRR</option><option>USD</option><option>EUR</option>
                         </SelectField>
                         <Checkbox label={isRtl ? "الزام ورود ارز" : "Mandatory Currency"} checked={true} disabled />
                      </div>
                   )}
                </div>

                {/* Tracking */}
                <div className="flex flex-col gap-2 pb-2 border-b border-slate-200">
                   <Checkbox 
                      label={isRtl ? "ویژگی پیگیری" : "Tracking Feature"}
                      checked={formData.trackFeature}
                      onChange={v => setFormData({...formData, trackFeature: v})}
                   />
                   {formData.trackFeature && (
                      <div className="mr-6 flex gap-4 animate-in slide-in-from-top-1">
                         <Checkbox label={isRtl ? "اجباری" : "Mandatory"} checked={true} onChange={()=>{}} />
                         <Checkbox label={isRtl ? "یکتا بودن شماره پیگیری" : "Unique Tracking No."} checked={false} onChange={()=>{}} />
                      </div>
                   )}
                </div>

                {/* Quantity */}
                <div className="flex flex-col gap-2">
                   <Checkbox 
                      label={isRtl ? "ویژگی مقداری" : "Quantity Feature"}
                      checked={formData.qtyFeature}
                      onChange={v => setFormData({...formData, qtyFeature: v})}
                   />
                   {formData.qtyFeature && (
                      <div className="mr-6 flex gap-4 animate-in slide-in-from-top-1">
                         <Checkbox label={isRtl ? "اجباری" : "Mandatory"} checked={false} onChange={()=>{}} />
                      </div>
                   )}
                </div>
             </div>

             {/* Nature Adjustment & Modules */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <SelectField label={isRtl ? "کنترل ماهیت طی دوره" : "Nature Control During Period"} isRtl={isRtl}>
                   <option value="none">{isRtl ? "بدون کنترل" : "No Control"}</option>
                   <option value="warn">{isRtl ? "هشدار" : "Warning"}</option>
                   <option value="block">{isRtl ? "خطا (جلوگیری)" : "Error (Block)"}</option>
                </SelectField>
                <div className="md:mt-5">
                   {/* Contra Account Selector Placeholder */}
                   <Button variant="outline" className="w-full justify-between" icon={Search}>
                      {isRtl ? "انتخاب حساب مقابل (تعدیل ماهیت)" : "Select Contra Account"}
                   </Button>
                </div>
             </div>
          </div>
        )}
      </div>
    );
  };

  const TafsilSelector = () => {
     return (
        <div className="space-y-4">
           <Callout variant="info">
              {isRtl 
                 ? "انواع تفصیل‌های مجاز برای این حساب معین را انتخاب کنید." 
                 : "Select the detailed account types allowed for this subsidiary."}
           </Callout>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {tafsilTypes.map(t => (
                 <div 
                    key={t.id}
                    onClick={() => {
                       const exists = formData.tafsils?.includes(t.id);
                       const newTafsils = exists ? formData.tafsils.filter(x => x !== t.id) : [...(formData.tafsils || []), t.id];
                       setFormData({...formData, tafsils: newTafsils});
                    }}
                    className={`
                       cursor-pointer border rounded-lg p-3 text-center transition-all
                       ${formData.tafsils?.includes(t.id) 
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-bold shadow-sm ring-1 ring-indigo-200' 
                          : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'}
                    `}
                 >
                    <div className="text-[12px]">{t.label}</div>
                 </div>
              ))}
           </div>
        </div>
     );
  };

  const StandardDesc = () => {
      const [descText, setDescText] = useState('');
      const [list, setList] = useState(formData.descriptions || []);

      const addDesc = () => {
         if(!descText) return;
         const newList = [...list, { id: Date.now(), text: descText }];
         setList(newList);
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
                           setList(newList);
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

  // --- 6. MAIN LAYOUT ---

  const tabs = [
     { id: 'info', label: isRtl ? 'اطلاعات اصلی' : 'General Info', icon: FileText },
     { id: 'tafsil', label: isRtl ? 'تفصیل‌ها' : 'Detailed Accts', icon: List },
     { id: 'desc', label: isRtl ? 'شرح‌های استاندارد' : 'Descriptions', icon: FileDigit },
  ];

  // If level is not subsidiary, show only info tab
  const activeTabs = formData.level === 'subsidiary' ? tabs : [tabs[0]];

  return (
    <div className="h-full flex flex-col p-4 bg-slate-100">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Hash className="text-indigo-600"/>
            {t.coa_title || (isRtl ? "ساختار حساب‌ها (کدینگ)" : "Chart of Accounts")}
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            {isRtl ? "مدیریت درخت حساب‌های گروه، کل و معین" : "Manage Group, General, and Subsidiary accounts tree."}
          </p>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" icon={Settings} onClick={() => setShowStructureModal(true)}>
             {isRtl ? "تنظیمات ساختار" : "Structure Settings"}
           </Button>
           <Button variant="primary" icon={Plus} onClick={() => handleCreate('group')}>
             {isRtl ? "گروه حساب جدید" : "New Account Group"}
           </Button>
        </div>
      </div>

      {/* Workspace */}
      <div className="flex-1 flex gap-4 overflow-hidden">
        
        {/* Left: Tree View */}
        <div className="w-1/3 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <span className="text-[11px] font-bold text-slate-500 uppercase">{isRtl ? "درخت حساب‌ها" : "Accounts Tree"}</span>
            <div className="flex gap-1">
               <button className="p-1 hover:bg-slate-200 rounded text-slate-500" title={isRtl ? "جمع کردن همه" : "Collapse All"}><Layout size={14}/></button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
             <TreeView 
                data={accounts} 
                onSelectNode={(node) => handleNodeSelect(node.id)}
                selectedNodeId={selectedNode?.id}
                renderNodeContent={renderTreeContent}
                isRtl={isRtl}
                searchPlaceholder={isRtl ? "جستجوی کد یا عنوان..." : "Search code or title..."}
             />
          </div>
        </div>

        {/* Right: Details / Form */}
        <div className="w-2/3 flex flex-col">
           
           {/* Case 1: Nothing Selected */}
           {!selectedNode && mode === 'view' && (
              <div className="h-full bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-slate-400">
                 <div className="bg-slate-50 p-4 rounded-full mb-3"><FolderOpen size={48} className="text-indigo-200"/></div>
                 <p className="text-sm font-medium">{isRtl ? "یک حساب را از درخت انتخاب کنید" : "Select an account from the tree"}</p>
                 <p className="text-xs mt-1 opacity-70">{isRtl ? "یا یک گروه حساب جدید ایجاد کنید" : "Or create a new account group"}</p>
              </div>
           )}

           {/* Case 2: View Mode (Read Only Details) */}
           {selectedNode && mode === 'view' && (
              <div className="h-full bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col animate-in fade-in zoom-in-95 duration-200">
                 <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-start bg-slate-50/30">
                    <div>
                       <div className="flex items-center gap-2 mb-1">
                          <Badge variant="neutral" className="font-mono text-lg px-2">{selectedNode.code}</Badge>
                          <h2 className="text-lg font-bold text-slate-800">{selectedNode.title}</h2>
                       </div>
                       <div className="text-xs text-slate-500 font-mono" dir="ltr">{selectedNode.titleEn}</div>
                    </div>
                    <div className="flex gap-2">
                       <Button variant="outline" size="sm" icon={Trash2} onClick={handleDelete} className="text-red-600 hover:text-red-700 hover:border-red-200"/>
                       <Button variant="secondary" size="sm" icon={Settings} onClick={handleEdit}>{isRtl ? "ویرایش" : "Edit"}</Button>
                    </div>
                 </div>
                 
                 <div className="p-6 grid grid-cols-2 gap-y-6 gap-x-4">
                    <div>
                       <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">{isRtl ? "سطح" : "Level"}</label>
                       <div className="text-sm font-medium text-slate-700 flex items-center gap-1">
                          {selectedNode.level === 'group' ? <Layers size={14}/> : selectedNode.level === 'general' ? <Folder size={14}/> : <FileText size={14}/>}
                          {isRtl ? (selectedNode.level === 'group' ? 'گروه' : selectedNode.level === 'general' ? 'کل' : 'معین') : selectedNode.level}
                       </div>
                    </div>
                    <div>
                       <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">{isRtl ? "ماهیت" : "Nature"}</label>
                       <Badge variant={selectedNode.nature === 'debit' ? 'info' : selectedNode.nature === 'credit' ? 'warning' : 'neutral'}>
                          {accountNatures.find(n => n.id === selectedNode.nature)?.label}
                       </Badge>
                    </div>
                    <div>
                       <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">{isRtl ? "نوع" : "Type"}</label>
                       <span className="text-sm text-slate-700">{accountTypes.find(t => t.id === selectedNode.type)?.label}</span>
                    </div>
                    <div>
                       <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">{isRtl ? "وضعیت" : "Status"}</label>
                       <Badge variant={selectedNode.isActive !== false ? 'success' : 'danger'}>
                          {selectedNode.isActive !== false ? (isRtl ? 'فعال' : 'Active') : (isRtl ? 'غیرفعال' : 'Inactive')}
                       </Badge>
                    </div>
                 </div>

                 {/* Actions for Child Creation */}
                 <div className="mt-auto p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                    {selectedNode.level === 'group' && (
                       <Button variant="primary" icon={Plus} onClick={() => handleCreate('general')}>
                          {isRtl ? "ایجاد حساب کل" : "Create General Account"}
                       </Button>
                    )}
                    {selectedNode.level === 'general' && (
                       <Button variant="primary" icon={Plus} onClick={() => handleCreate('subsidiary')}>
                          {isRtl ? "ایجاد حساب معین" : "Create Subsidiary Account"}
                       </Button>
                    )}
                 </div>
              </div>
           )}

           {/* Case 3: Create/Edit Mode */}
           {mode !== 'view' && (
              <div className="h-full bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col animate-in slide-in-from-right-4 duration-300">
                 <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                       {mode === 'edit' ? <Settings size={16}/> : <Plus size={16}/>}
                       {mode === 'edit' ? (isRtl ? "ویرایش حساب" : "Edit Account") : (isRtl ? "تعریف حساب جدید" : "New Account")}
                    </h3>
                    <div className="text-xs text-slate-400 font-mono bg-slate-100 px-2 py-0.5 rounded">
                       {formData.level?.toUpperCase()}
                    </div>
                 </div>

                 <div className="flex-1 flex flex-col min-h-0">
                    <div className="px-4 pt-2">
                       <Tabs tabs={activeTabs} activeTab={activeTab} onChange={setActiveTab} />
                    </div>
                    <div className="flex-1 overflow-y-auto px-4 pb-4">
                       {activeTab === 'info' && <AccountForm />}
                       {activeTab === 'tafsil' && <TafsilSelector />}
                       {activeTab === 'desc' && <StandardDesc />}
                    </div>
                 </div>

                 <div className="p-3 border-t border-slate-200 bg-slate-50 flex justify-end gap-2 rounded-b-xl">
                    <Button variant="outline" onClick={() => setMode('view')}>{isRtl ? "انصراف" : "Cancel"}</Button>
                    <Button variant="primary" icon={Save} onClick={handleSave}>{isRtl ? "ذخیره" : "Save"}</Button>
                 </div>
              </div>
           )}

        </div>
      </div>

      {/* Settings Modal */}
      <Modal 
        isOpen={showStructureModal} 
        onClose={() => setShowStructureModal(false)}
        title={isRtl ? "تنظیمات ساختار کدینگ" : "Coding Structure Settings"}
        footer={<Button variant="primary" onClick={() => setShowStructureModal(false)}>{t.btn_confirm || (isRtl ? "تایید" : "Confirm")}</Button>}
      >
        <StructureForm />
      </Modal>

    </div>
  );
};

// --- CRITICAL FIX: Assign Component to Global Window Object ---
window.ChartofAccounts = ChartofAccounts;

export default ChartofAccounts;
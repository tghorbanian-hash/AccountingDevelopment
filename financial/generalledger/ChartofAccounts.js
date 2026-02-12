/* Filename: financial/generalledger/ChartofAccounts.js */
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Folder, FolderOpen, FileText, Plus, Save, Trash2, 
  Settings, Search, Check, Tag,  // ✅ FIXED: Hash → Tag
  AlertCircle, LayoutGrid, List, Layers, File, ArrowRight, Edit,  // ✅ FIXED: Layout → LayoutGrid, FileDigit → File
  TreeDeciduous, Shield, X, User,  // ✅ FIXED: ShieldCheck → Shield
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
  onOpenContraModal, contraAccountName 
}) => {
  const { InputField, SelectField, Button } = window.UI;

  const isSubsidiary = formData.level === 'subsidiary';
  const isGeneral = formData.level === 'general';
  const isGroup = formData.level === 'group';

  let prefix = '';
  if (!isGroup && selectedNode) {
     if (formData.id && selectedNode.fullCode) { 
        const ownCodeLen = formData.code ? formData.code.length : 0;
        if (ownCodeLen > 0 && formData.fullCode.length > ownCodeLen) {
            prefix = formData.fullCode.substring(0, formData.fullCode.length - ownCodeLen);
        }
     } else { 
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
           <div className="flex items-center gap-2">
              {prefix && <span className="px-2 py-1.5 bg-slate-100 border border-slate-200 rounded text-[12px] font-mono text-slate-500">{prefix}</span>}
              <InputField 
                value={formData.code || ''} 
                onChange={e => setFormData({...formData, code: e.target.value})} 
                isRtl={isRtl} 
                maxLength={maxLen}
                className="font-mono"
              />
           </div>
        </div>

        <InputField 
          label={`${isRtl ? "عنوان فارسی" : "Persian Title"} *`} 
          value={formData.title || ''} 
          onChange={e => setFormData({...formData, title: e.target.value})} 
          isRtl={isRtl} 
        />
        <InputField 
          label={isRtl ? "عنوان لاتین" : "English Title"} 
          value={formData.titleEn || ''} 
          onChange={e => setFormData({...formData, titleEn: e.target.value})} 
          isRtl={isRtl} 
        />

        {isSubsidiary && (
          <>
            <SelectField 
              label={isRtl ? "نوع حساب" : "Account Type"} 
              value={formData.type || 'permanent'} 
              onChange={e => setFormData({...formData, type: e.target.value})} 
              isRtl={isRtl}
            >
              {ACCOUNT_TYPES.map(t => (
                <option key={t.id} value={t.id}>{isRtl ? t.labelFa : t.labelEn}</option>
              ))}
            </SelectField>

            <SelectField 
              label={isRtl ? "ماهیت حساب" : "Account Nature"} 
              value={formData.nature || 'debit'} 
              onChange={e => setFormData({...formData, nature: e.target.value})} 
              isRtl={isRtl}
            >
              {ACCOUNT_NATURES.map(n => (
                <option key={n.id} value={n.id}>{isRtl ? n.labelFa : n.labelEn}</option>
              ))}
            </SelectField>
          </>
        )}
      </div>

      {isSubsidiary && (
        <div className="space-y-4 mt-4">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
            <h4 className="text-[11px] font-bold text-slate-500 uppercase">{isRtl ? "ویژگی‌های حساب" : "Account Features"}</h4>
            
            <div className="space-y-2">
              <Checkbox 
                label={isRtl ? "رد یابی (Track): نگهداری اسناد پیوست" : "Track: Keep attached documents"} 
                checked={formData.trackFeature || false}
                onChange={val => setFormData({...formData, trackFeature: val})}
              />
              {formData.trackFeature && (
                <div className="mr-6 space-y-2">
                  <Checkbox 
                    label={isRtl ? "رد یابی الزامی است" : "Tracking is mandatory"} 
                    checked={formData.trackMandatory || false}
                    onChange={val => setFormData({...formData, trackMandatory: val})}
                  />
                  <Checkbox 
                    label={isRtl ? "رد یابی باید یکتا باشد" : "Tracking must be unique"} 
                    checked={formData.trackUnique || false}
                    onChange={val => setFormData({...formData, trackUnique: val})}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Checkbox 
                label={isRtl ? "مقداری (Quantity): نگهداری مقدار در اسناد" : "Quantity: Store quantity in documents"} 
                checked={formData.qtyFeature || false}
                onChange={val => setFormData({...formData, qtyFeature: val})}
              />
              {formData.qtyFeature && (
                <div className="mr-6">
                  <Checkbox 
                    label={isRtl ? "ثبت مقدار الزامی است" : "Quantity entry is mandatory"} 
                    checked={formData.qtyMandatory || false}
                    onChange={val => setFormData({...formData, qtyMandatory: val})}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h4 className="text-[11px] font-bold text-amber-700 uppercase mb-2 flex items-center gap-2">
              <Shield size={14}/>
              {isRtl ? "حساب معین متقابل (تعدیل ماهیت)" : "Contra Account (Nature Reversal)"}
            </h4>
            <p className="text-[11px] text-slate-600 mb-3">
              {isRtl 
                ? "اگر این حساب ماهیت معکوس نسبت به گروه خود دارد، حساب معین مرتبط را انتخاب کنید."
                : "If this account has reversed nature relative to its parent group, select the related contra account."}
            </p>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={onOpenContraModal}>
                {isRtl ? "انتخاب حساب معین" : "Select Contra Account"}
              </Button>
              {contraAccountName && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-600 font-mono">{contraAccountName}</span>
                  <button 
                    onClick={() => setFormData({...formData, contraAccountId: null})}
                    className="text-red-500 hover:bg-red-50 rounded p-1"
                  >
                    <X size={12}/>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TafsilSelector = ({ formData, setFormData, isRtl }) => {
  const systemTypes = ALL_TAFSIL_TYPES.filter(t => t.isSystem);
  const userTypes = ALL_TAFSIL_TYPES.filter(t => !t.isSystem);

  const toggleTafsil = (typeId) => {
    const current = formData.tafsilTypes || [];
    if (current.includes(typeId)) {
      setFormData({...formData, tafsilTypes: current.filter(id => id !== typeId)});
    } else {
      setFormData({...formData, tafsilTypes: [...current, typeId]});
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-[11px] font-bold text-blue-700 uppercase mb-2 flex items-center gap-2">
          <AlertCircle size={14}/>
          {isRtl ? "تفصیلی چیست؟" : "What are Detailed Accounts?"}
        </h4>
        <p className="text-[11px] text-slate-600">
          {isRtl 
            ? "تفصیلی‌ها به شما امکان می‌دهند اطلاعات دقیق‌تری از اسناد مالی ثبت کنید. مانند: طرف معامله، پروژه، مرکز هزینه و غیره."
            : "Detailed accounts allow you to record more granular information in financial documents, such as: business party, project, cost center, etc."}
        </p>
      </div>

      <div>
        <h3 className="text-[12px] font-bold text-slate-700 mb-3">{isRtl ? "تفصیلی‌های سیستمی" : "System-Defined Detailed Accounts"}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {systemTypes.map(type => (
            <Checkbox 
              key={type.id}
              label={`${isRtl ? type.label : type.en}`}
              checked={(formData.tafsilTypes || []).includes(type.id)}
              onChange={() => toggleTafsil(type.id)}
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-[12px] font-bold text-slate-700 mb-3">{isRtl ? "تفصیلی‌های کاربر" : "User-Defined Detailed Accounts"}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {userTypes.map(type => (
            <Checkbox 
              key={type.id}
              label={`${isRtl ? type.label : type.en}`}
              checked={(formData.tafsilTypes || []).includes(type.id)}
              onChange={() => toggleTafsil(type.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const StandardDesc = ({ formData, setFormData, isRtl }) => {
  const { InputField, Button } = window.UI;
  const [newDesc, setNewDesc] = useState('');

  const handleAdd = () => {
    if (!newDesc.trim()) return;
    const current = formData.standardDescs || [];
    setFormData({...formData, standardDescs: [...current, { id: Date.now(), text: newDesc }]});
    setNewDesc('');
  };

  const handleRemove = (id) => {
    const current = formData.standardDescs || [];
    setFormData({...formData, standardDescs: current.filter(d => d.id !== id)});
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
        <h4 className="text-[11px] font-bold text-slate-500 uppercase mb-2">{isRtl ? "درباره شرح‌های استاندارد" : "About Standard Descriptions"}</h4>
        <p className="text-[11px] text-slate-600">
          {isRtl 
            ? "می‌توانید شرح‌های پیش‌فرض و رایجی که در اسناد این حساب استفاده می‌شود را از قبل تعریف کنید تا در هنگام ثبت سند، انتخاب آن‌ها سریع‌تر باشد."
            : "You can define commonly used descriptions for this account in advance to speed up document entry."}
        </p>
      </div>

      <div className="flex gap-2">
        <InputField 
          placeholder={isRtl ? "شرح استاندارد جدید..." : "New standard description..."} 
          value={newDesc}
          onChange={e => setNewDesc(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleAdd()}
          isRtl={isRtl}
        />
        <Button variant="primary" size="sm" icon={Plus} onClick={handleAdd}>
          {isRtl ? "افزودن" : "Add"}
        </Button>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {(formData.standardDescs || []).length > 0 ? (
          (formData.standardDescs || []).map(desc => (
            <div key={desc.id} className="flex items-center justify-between p-2 bg-white border border-slate-200 rounded group">
              <span className="text-[12px] text-slate-700">{desc.text}</span>
              <button 
                onClick={() => handleRemove(desc.id)}
                className="opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-50 rounded p-1 transition-opacity"
              >
                <X size={14}/>
              </button>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-slate-400 text-[12px]">
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

        <div className="flex-1 overflow-hidden relative h-full">
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
                    <InputField type="number" min="1" max="10" label={isRtl ? "طول کد معین" : "Subsidiary Length"} value={formData.subsidiaryLen} onChange={e => setFormData({...formData, subsidiaryLen: parseInt(e.target.value)})} isRtl={isRtl} />
                 </div>
                 
                 <div className="flex items-center gap-2">
                    <Checkbox 
                       label={isRtl ? "استفاده از کاراکترهای حروفی در کدینگ" : "Use alphanumeric characters in coding"} 
                       checked={formData.useChar}
                       onChange={val => setFormData({...formData, useChar: val})}
                    />
                 </div>
              </div>
           </div>
        </Modal>
      </div>
    );
  };

  // --- SUB-COMPONENT: ACCOUNT TREE VIEW ---

  const AccountTreeView = ({ structure, data, onSaveTree, onBack }) => {
    const [selectedNode, setSelectedNode] = useState(null);
    const [mode, setMode] = useState('view'); 
    const [formData, setFormData] = useState({});
    const [expandedIds, setExpandedIds] = useState([]);
    const [activeTab, setActiveTab] = useState('info');
    const [showContraModal, setShowContraModal] = useState(false);

    // --- Tree Helpers ---
    const flattenTree = (nodes) => {
      let result = [];
      nodes.forEach(node => {
        result.push(node);
        if (node.children) {
          result = result.concat(flattenTree(node.children));
        }
      });
      return result;
    };

    const buildFullCode = (node, parentCode = '') => {
      const fullCode = parentCode ? `${parentCode}${node.code}` : node.code;
      return {
        ...node,
        fullCode,
        children: node.children ? node.children.map(child => buildFullCode(child, fullCode)) : []
      };
    };

    const rebuildData = (nodes) => {
      return nodes.map(node => buildFullCode(node));
    };

    // --- Actions ---
    const handleCreate = (level) => {
      const newAccount = {
        id: `new_${Date.now()}`,
        level,
        code: '',
        title: '',
        titleEn: '',
        type: level === 'subsidiary' ? 'permanent' : undefined,
        nature: level === 'subsidiary' ? 'debit' : undefined,
        children: []
      };
      
      setFormData(newAccount);
      setMode('create');
      setActiveTab('info');
    };

    const handleEdit = () => {
      if (!selectedNode) return;
      setFormData({...selectedNode});
      setMode('edit');
      setActiveTab('info');
    };

    const handleSaveForm = () => {
      if (!formData.code || !formData.title) {
        return alert(isRtl ? "کد و عنوان الزامی است" : "Code and Title are required");
      }

      // 1. Get current data
      let newData = JSON.parse(JSON.stringify(data));

      // 2. Find and update/add node
      if (mode === 'edit') {
        // Edit existing
        const updateRecursive = (nodes) => {
          return nodes.map(node => {
            if (node.id === formData.id) {
              return { ...formData, children: node.children };
            }
            if (node.children) {
              return { ...node, children: updateRecursive(node.children) };
            }
            return node;
          });
        };
        newData = updateRecursive(newData);
      } else {
        // Create new
        if (!selectedNode) {
          // Root level
          newData.push({ ...formData, children: [] });
        } else {
          // Under selected node
          const addRecursive = (nodes) => {
            return nodes.map(node => {
              if (node.id === selectedNode.id) {
                return { 
                  ...node, 
                  children: [...(node.children || []), { ...formData, children: [] }] 
                };
              }
              if (node.children) {
                return { ...node, children: addRecursive(node.children) };
              }
              return node;
            });
          };
          newData = addRecursive(newData);
        }
      }

      // 3. Rebuild fullCode for all nodes
      newData = rebuildData(newData);

      // 4. Find the target node's ID (for re-selection after save)
      const targetNodeId = formData.id;

      // Find the new object reference in the new data structure
      const newFlatData = flattenTree(newData);
      const newSelectedNode = newFlatData.find(n => n.id === targetNodeId);
      
      // 5. Update Selected Node
      setSelectedNode(newSelectedNode);

      // 6. Save Data (This triggers prop update)
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

    const activeTabs = formData.level === 'subsidiary' 
        ? [{ id: 'info', label: isRtl ? 'اطلاعات اصلی' : 'General Info', icon: FileText }, { id: 'tafsil', label: isRtl ? 'تفصیل‌ها' : 'Detailed Accts', icon: List }, { id: 'desc', label: isRtl ? 'شرح‌های استاندارد' : 'Descriptions', icon: File }] 
        : [{ id: 'info', label: isRtl ? 'اطلاعات اصلی' : 'General Info', icon: FileText }];

    return (
      <div className="h-full flex flex-col animate-in slide-in-from-right-8 duration-300">
         {/* Tree Header */}
         <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm shrink-0">
            <div className="flex items-center gap-3">
               <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onBack} 
                  icon={isRtl ? ArrowRight : ArrowRight} 
                  className={isRtl ? '' : 'rotate-180'}
               >
                  {isRtl ? "بازگشت به فهرست" : "Back to List"} 
               </Button>
               <div className="h-6 w-px bg-slate-200 mx-2"></div>
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
                     <Button size="iconSm" variant="ghost" onClick={handleExpandAll} title={isRtl ? "باز کردن همه" : "Expand All"} icon={Maximize2} />
                     <Button size="iconSm" variant="ghost" onClick={handleCollapseAll} title={isRtl ? "بستن همه" : "Collapse All"} icon={Minimize2} />
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
                     <p className="text-sm font-medium">{isRtl ? "یک حساب را از درخت انتخاب کنید" : "Select an account from the tree"}</p>
                  </div>
               )}

               {/* VIEW MODE */}
               {selectedNode && mode === 'view' && (
                  <div className="h-full bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
                     <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                        <div>
                           <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800 text-sm">{selectedNode.title}</span>
                              <Badge variant="neutral">{selectedNode.level}</Badge>
                           </div>
                           <div className="text-[10px] text-slate-500 font-mono mt-1">
                              {isRtl ? "کد کامل:" : "Full Code:"} {selectedNode.fullCode}
                           </div>
                        </div>
                        <div className="flex gap-2">
                           <Button size="sm" variant="outline" icon={Edit} onClick={handleEdit}>{isRtl ? "ویرایش" : "Edit"}</Button>
                           <Button size="sm" variant="danger" icon={Trash2} onClick={handleDelete}>{isRtl ? "حذف" : "Delete"}</Button>
                        </div>
                     </div>

                     <div className="p-4 flex-1 overflow-y-auto space-y-4">
                        {selectedNode.titleEn && (
                           <div className="text-sm">
                              <span className="text-slate-500 text-xs">{isRtl ? "عنوان انگلیسی:" : "English Title:"}</span>
                              <div className="font-medium text-slate-700">{selectedNode.titleEn}</div>
                           </div>
                        )}

                        {selectedNode.level === 'subsidiary' && (
                           <div className="grid grid-cols-2 gap-4 mt-4">
                              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                                 <div className="text-xs text-slate-500 mb-1">{isRtl ? "نوع حساب" : "Account Type"}</div>
                                 <div className="font-bold text-slate-700">{ACCOUNT_TYPES.find(t => t.id === selectedNode.type)?.[isRtl ? 'labelFa' : 'labelEn']}</div>
                              </div>
                              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                                 <div className="text-xs text-slate-500 mb-1">{isRtl ? "ماهیت حساب" : "Account Nature"}</div>
                                 <div className="font-bold text-slate-700">{ACCOUNT_NATURES.find(n => n.id === selectedNode.nature)?.[isRtl ? 'labelFa' : 'labelEn']}</div>
                              </div>
                           </div>
                        )}

                        {selectedNode.level === 'subsidiary' && (selectedNode.trackFeature || selectedNode.qtyFeature) && (
                           <div className="mt-4">
                              <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">{isRtl ? "ویژگی‌ها" : "Features"}</h4>
                              <div className="grid grid-cols-2 gap-3">
                                 <div className={`p-2 rounded border text-xs ${selectedNode.trackFeature ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                                    <div className="font-bold mb-1">{isRtl ? "رد یابی" : "Tracking"}</div>
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
                             accountTypes={ACCOUNT_TYPES}
                             accountNatures={ACCOUNT_NATURES}
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
                 <div className="flex-1 overflow-hidden border border-slate-200 rounded-lg relative">
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

  return (
    <div className="h-full flex flex-col p-4 bg-slate-100">
       <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Tag className="text-indigo-600"/>
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

/* Filename: financial/generalledger/ChartofAccounts.js */
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Folder, FolderOpen, FileText, Plus, Save, Trash2, 
  Settings, Search, Check, Hash,
  AlertCircle, Layout, List, Layers, FileDigit, ArrowRight, ArrowLeft, Edit,
  TreeDeciduous, ShieldCheck, X, User,
  ChevronsDown, ChevronsUp, Minimize2, Maximize2, ChevronDown 
} from 'lucide-react';

const ChartofAccounts = ({ t, isRtl }) => {
  const UI = window.UI || {};
  const { Button, InputField, SelectField, DataGrid, FilterSection, Toggle, Modal, Badge } = UI;

  // --- INTERNAL: CUSTOM TREE COMPONENT (Based on OrgChart.js pattern) ---
  const CustomTreeNode = ({ node, level, selectedId, onSelect, expandedKeys, onToggle, isRtl }) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedKeys.has(node.id);
    const isSelected = selectedId === node.id;

    // Determine Icon based on level
    let NodeIcon = FileText;
    let iconColor = 'text-slate-400';
    if (node.level === 'group') { NodeIcon = Layers; iconColor = 'text-indigo-600'; }
    else if (node.level === 'general') { NodeIcon = Folder; iconColor = 'text-slate-600'; }

    return (
      <div className="select-none">
        <div 
          className={`
            flex items-center gap-2 py-1 px-2 my-0.5 cursor-pointer rounded-lg transition-all border border-transparent
            ${isSelected 
              ? 'bg-indigo-50 text-indigo-700 font-bold border-indigo-200 shadow-sm' 
              : 'hover:bg-slate-50 text-slate-700 hover:border-slate-200'}
          `}
          style={{ 
            paddingRight: isRtl ? `${level * 20 + 8}px` : '8px', 
            paddingLeft: isRtl ? '8px' : `${level * 20 + 8}px` 
          }}
          onClick={() => onSelect(node)}
        >
          {hasChildren ? (
            <div 
              className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors z-10 bg-white rounded border border-slate-200 shadow-sm"
              onClick={(e) => { e.stopPropagation(); onToggle(node.id); }}
            >
               <div className={`transition-transform duration-200 ${isExpanded ? '' : (isRtl ? 'rotate-90' : '-rotate-90')}`}>
                 <ChevronDown size={12} />
               </div>
            </div>
          ) : (
             <div className="w-5 h-5 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
             </div>
          )}
          
          <div className="flex items-center gap-2 truncate flex-1">
             <NodeIcon size={16} className={isSelected ? 'text-indigo-600' : iconColor} />
             <span className="font-mono text-[11px] bg-slate-100 px-1 rounded text-slate-600 min-w-[20px] text-center">{node.code}</span>
             <span className="text-[13px] truncate">{node.title}</span>
             {node.level === 'subsidiary' && node.isActive === false && <Badge variant="danger" className="scale-75">غیرفعال</Badge>}
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

  // --- DATA CONSTANTS ---
  const ALL_TAFSIL_TYPES = [
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

  // --- SUB-COMPONENTS (Local Checkbox & Tabs) ---
  const LocalCheckbox = ({ label, checked, onChange, disabled }) => (
    <div 
      className={`flex items-center gap-2 ${disabled ? 'opacity-50' : 'cursor-pointer'}`} 
      onClick={(e) => { e.stopPropagation(); if (!disabled && onChange) onChange(!checked); }}
    >
      <div className={`w-4 h-4 rounded border flex items-center justify-center ${checked ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}>
        {checked && <Check size={12} className="text-white" strokeWidth={3} />}
      </div>
      {label && <span className="text-[12px] text-slate-700 select-none">{label}</span>}
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

  // --- STATES ---
  const [viewMode, setViewMode] = useState('list');
  const [structures, setStructures] = useState([
    { id: 1, code: '01', title: 'کدینگ حسابداری اصلی', status: true, groupLen: 1, generalLen: 2, subsidiaryLen: 2, useChar: false },
    { id: 2, code: '02', title: 'کدینگ پروژه ای', status: true, groupLen: 2, generalLen: 3, subsidiaryLen: 4, useChar: true }
  ]);

  // Tree Data & State
  const [treeData, setTreeData] = useState([]);
  const [expandedKeys, setExpandedKeys] = useState(new Set());
  const [activeStructure, setActiveStructure] = useState(null);

  // Forms
  const [showStructureModal, setShowStructureModal] = useState(false);
  const [structureForm, setStructureForm] = useState({});
  
  const [selectedNode, setSelectedNode] = useState(null);
  const [formData, setFormData] = useState({});
  const [activeTab, setActiveTab] = useState('info');
  const [isNodeEditMode, setIsNodeEditMode] = useState(false);

  // Modals
  const [showContraModal, setShowContraModal] = useState(false);

  // Mock Data Store
  const [allAccountsStore, setAllAccountsStore] = useState({
    1: [
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
                type: 'permanent', nature: 'debit', isActive: true,
                children: []
              }
            ]
          }
        ]
      }
    ],
    2: []
  });

  // --- HELPERS ---
  const flattenNodes = (nodes, result = []) => {
    nodes.forEach(node => {
      result.push(node);
      if (node.children) flattenNodes(node.children, result);
    });
    return result;
  };

  const getContraAccountName = (id) => {
    if (!id) return '';
    const flat = flattenNodes(treeData);
    const acc = flat.find(n => n.id === id);
    return acc ? `${acc.fullCode} - ${acc.title}` : '';
  };

  const flattenSubsidiariesWithPaths = (nodes, parentPath = '') => {
    let result = [];
    nodes.forEach(node => {
       const currentPath = parentPath ? `${parentPath} > ${node.title}` : node.title;
       if (node.level === 'subsidiary') {
          result.push({ ...node, pathTitle: currentPath });
       }
       if (node.children) {
          result = result.concat(flattenSubsidiariesWithPaths(node.children, currentPath));
       }
    });
    return result;
 };

  // --- TREE HANDLERS ---
  const toggleExpand = (id) => {
    const newSet = new Set(expandedKeys);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedKeys(newSet);
  };

  const expandAll = () => {
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

  const collapseAll = () => setExpandedKeys(new Set());

  // --- LIST ACTIONS ---
  const handleOpenStructureModal = (item = null) => {
    if (item) {
      setStructureForm({ ...item });
    } else {
      setStructureForm({ code: '', title: '', status: true, groupLen: 1, generalLen: 2, subsidiaryLen: 2, useChar: false });
    }
    setShowStructureModal(true);
  };

  const handleSaveStructure = () => {
    if (!structureForm.code || !structureForm.title) return alert('کد و عنوان الزامی است');
    if (structureForm.id) {
      setStructures(prev => prev.map(s => s.id === structureForm.id ? structureForm : s));
    } else {
      const newId = Date.now();
      setStructures(prev => [...prev, { ...structureForm, id: newId }]);
      setAllAccountsStore(prev => ({ ...prev, [newId]: [] }));
    }
    setShowStructureModal(false);
  };

  const handleOpenTreeDesigner = (structure) => {
    setActiveStructure(structure);
    setTreeData(allAccountsStore[structure.id] || []);
    setExpandedKeys(new Set());
    setSelectedNode(null);
    setFormData({});
    setIsNodeEditMode(false);
    setViewMode('designer');
  };

  // --- DESIGNER ACTIONS ---
  const handleSelectNode = (node) => {
    setSelectedNode(node);
    setIsNodeEditMode(true);
    setFormData({ ...node });
    setActiveTab('info');
  };

  const handlePrepareNewNode = (level) => {
    if (level !== 'group' && !selectedNode) return;
    
    let parentId = '';
    let nature = 'debit'; 
    let type = 'permanent';

    if (level !== 'group' && selectedNode) {
       parentId = selectedNode.id;
       nature = selectedNode.nature;
       type = selectedNode.type;
    }

    setFormData({
      id: null,
      level: level,
      code: '',
      title: '',
      titleEn: '',
      type: type,
      nature: nature,
      isActive: true,
      parentId: parentId,
      tafsils: [],
      descriptions: []
    });
    
    setIsNodeEditMode(false);
    setActiveTab('info');
  };

  const handleSaveNode = () => {
    if (!formData.code || !formData.title) return alert('کد و عنوان الزامی است.');

    // 1. Logic to Build New Tree Data
    let newData = [...treeData];
    const newNode = { ...formData, id: formData.id || Date.now().toString(), children: formData.children || [] };
    
    // Auto Generate FullCode
    if (newNode.level !== 'group') {
       const flat = flattenNodes(treeData);
       const parent = flat.find(n => n.id === formData.parentId);
       if (parent) {
          const prefix = parent.level === 'group' ? parent.code : parent.fullCode;
          newNode.fullCode = prefix + newNode.code;
       }
    } else {
       newNode.fullCode = newNode.code;
    }

    // Recursive Updates
    const updateRecursive = (nodes) => {
       return nodes.map(n => {
          if (n.id === newNode.id) return { ...newNode, children: n.children };
          if (n.children) return { ...n, children: updateRecursive(n.children) };
          return n;
       });
    };

    const addRecursive = (nodes, pId) => {
       return nodes.map(n => {
          if (n.id === pId) return { ...n, children: [...(n.children || []), newNode] };
          if (n.children) return { ...n, children: addRecursive(n.children, pId) };
          return n;
       });
    };

    if (isNodeEditMode) {
       newData = updateRecursive(newData);
    } else {
       if (newNode.level === 'group') {
          newData = [...newData, newNode];
       } else {
          newData = addRecursive(newData, formData.parentId);
       }
    }

    // 2. Update Global Data
    setTreeData(newData);
    setAllAccountsStore(prev => ({ ...prev, [activeStructure.id]: newData }));

    // 3. TREE STATE MANAGEMENT (Fix for closing tree)
    // Find ancestors to expand
    const findAncestors = (nodes, targetId, path = []) => {
        for (const node of nodes) {
            if (node.id === targetId) return path;
            if (node.children) {
                const res = findAncestors(node.children, targetId, [...path, node.id]);
                if (res) return res;
            }
        }
        return null;
    };

    const ancestors = findAncestors(newData, newNode.id) || [];
    setExpandedKeys(prev => {
        const next = new Set(prev);
        ancestors.forEach(id => next.add(id));
        return next;
    });

    // 4. Update Selection
    setSelectedNode(newNode);
    setIsNodeEditMode(true);
    setFormData(newNode);
    
    alert('اطلاعات با موفقیت ذخیره شد.');
  };

  const handleDeleteNode = () => {
     if (!selectedNode) return;
     if (!confirm('آیا از حذف این حساب اطمینان دارید؟')) return;

     const deleteRecursive = (nodes) => {
        return nodes.filter(n => n.id !== selectedNode.id).map(n => ({
           ...n,
           children: n.children ? deleteRecursive(n.children) : []
        }));
     };

     const newData = deleteRecursive(treeData);
     setTreeData(newData);
     setAllAccountsStore(prev => ({ ...prev, [activeStructure.id]: newData }));
     setSelectedNode(null);
     setIsNodeEditMode(false);
     setFormData({});
  };

  // --- RENDER SECTIONS ---

  const renderStructureList = () => (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
       <div className="mb-4">
          <FilterSection onSearch={() => {}} onClear={() => {}} isRtl={isRtl}>
             <InputField label="کد ساختار" isRtl={isRtl} />
             <InputField label="عنوان" isRtl={isRtl} />
          </FilterSection>
       </div>
       
       {/* Relative container to fix Pagination positioning */}
       <div className="flex-1 overflow-hidden relative"> 
          <DataGrid 
             columns={[
                { field: 'code', header: 'کد', width: 'w-24' },
                { field: 'title', header: 'عنوان', width: 'w-64' },
                { field: 'status', header: 'وضعیت', width: 'w-24', render: r => <Badge variant={r.status ? 'success' : 'neutral'}>{r.status ? 'فعال' : 'غیرفعال'}</Badge> },
                { field: 'groupLen', header: 'طول گروه', width: 'w-20' },
                { field: 'generalLen', header: 'طول کل', width: 'w-20' },
                { field: 'subsidiaryLen', header: 'طول معین', width: 'w-20' },
             ]}
             data={structures}
             isRtl={isRtl}
             onCreate={() => handleOpenStructureModal()}
             actions={(row) => (
                <div className="flex gap-1 justify-center">
                   <Button variant="ghost" size="iconSm" icon={TreeDeciduous} className="text-indigo-600" onClick={() => handleOpenTreeDesigner(row)} title="طراحی ساختار" />
                   <Button variant="ghost" size="iconSm" icon={Edit} onClick={() => handleOpenStructureModal(row)} />
                   <Button variant="ghost" size="iconSm" icon={Trash2} className="text-red-500" />
                </div>
             )}
          />
       </div>
    </div>
  );

  const renderDesigner = () => {
    const BackIcon = isRtl ? ArrowRight : ArrowLeft;
    
    // Setup form restrictions
    const maxLen = formData.level === 'group' ? activeStructure.groupLen : (formData.level === 'general' ? activeStructure.generalLen : activeStructure.subsidiaryLen);
    
    let codePrefix = '';
    if (formData.level !== 'group' && !isNodeEditMode && selectedNode) {
       codePrefix = selectedNode.level === 'group' ? selectedNode.code : selectedNode.fullCode;
    } else if (isNodeEditMode && formData.fullCode && formData.code) {
       codePrefix = formData.fullCode.substring(0, formData.fullCode.length - formData.code.length);
    }

    const filteredContraAccounts = useMemo(() => {
        const list = flattenSubsidiariesWithPaths(treeData);
        return list.filter(n => n.id !== formData.id);
    }, [treeData, formData.id]);

    return (
      <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
         {/* HEADER */}
         <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
               <Button variant="outline" size="sm" onClick={() => setViewMode('list')} icon={BackIcon}>
                  بازگشت به فهرست
               </Button>
               <div className="h-6 w-px bg-slate-200 mx-2"></div>
               <div>
                  <h2 className="font-bold text-slate-800 text-sm">{activeStructure.title}</h2>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                     <span>{activeStructure.code}</span>
                     <span className="text-slate-300">|</span>
                     <span>Structure: {activeStructure.groupLen}-{activeStructure.generalLen}-{activeStructure.subsidiaryLen}</span>
                  </div>
               </div>
            </div>
         </div>

         <div className="flex-1 flex overflow-hidden">
            {/* TREE SIDEBAR */}
            <div className={`w-1/3 min-w-[300px] flex flex-col bg-slate-50/50 ${isRtl ? 'border-l' : 'border-r'} border-slate-200`}>
               <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
                  <span className="text-[11px] font-black text-slate-500 uppercase">ساختار درختی</span>
                  <div className="flex gap-1">
                     <Button variant="ghost" size="iconSm" icon={Maximize2} onClick={expandAll} title="باز کردن همه" />
                     <Button variant="ghost" size="iconSm" icon={Minimize2} onClick={collapseAll} title="بستن همه" />
                     <Button variant="ghost" size="iconSm" icon={Plus} onClick={() => handlePrepareNewNode('group')} title="گروه جدید" />
                  </div>
               </div>
               <div className="flex-1 overflow-y-auto p-2">
                  {treeData.length > 0 ? treeData.map(node => (
                     <CustomTreeNode 
                        key={node.id} node={node} level={0} 
                        selectedId={selectedNode?.id} onSelect={handleSelectNode} 
                        expandedKeys={expandedKeys} onToggle={toggleExpand} isRtl={isRtl} 
                     />
                  )) : (
                     <div className="text-center p-10 text-slate-400 text-xs">هیچ حسابی تعریف نشده است.</div>
                  )}
               </div>
            </div>

            {/* FORM AREA */}
            <div className="flex-1 flex flex-col bg-white overflow-hidden">
               <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
                  <div className="flex items-center gap-2">
                     {isNodeEditMode ? <Edit size={18} className="text-indigo-600"/> : <Plus size={18} className="text-emerald-600"/>}
                     <h3 className="font-bold text-slate-800">
                        {isNodeEditMode ? 'ویرایش حساب' : 'تعریف حساب جدید'}
                     </h3>
                     {formData.level && <Badge variant="neutral">{formData.level === 'group' ? 'گروه' : formData.level === 'general' ? 'کل' : 'معین'}</Badge>}
                  </div>
                  <div className="flex gap-2">
                     {selectedNode && (
                        <>
                           {selectedNode.level === 'group' && <Button size="sm" variant="secondary" onClick={() => handlePrepareNewNode('general')}>+ کل جدید</Button>}
                           {selectedNode.level === 'general' && <Button size="sm" variant="secondary" onClick={() => handlePrepareNewNode('subsidiary')}>+ معین جدید</Button>}
                        </>
                     )}
                     {isNodeEditMode && <Button size="sm" variant="danger" icon={Trash2} onClick={handleDeleteNode} />}
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto p-5">
                  <Tabs tabs={
                     formData.level === 'subsidiary' 
                     ? [{id:'info', label:'اطلاعات اصلی'}, {id:'tafsil', label:'تفصیل‌ها'}, {id:'desc', label:'شرح‌های استاندارد'}]
                     : [{id:'info', label:'اطلاعات اصلی'}]
                  } activeTab={activeTab} onChange={setActiveTab} />

                  {/* TAB 1: INFO */}
                  {activeTab === 'info' && (
                     <div className="space-y-4 max-w-3xl">
                        <div className="grid grid-cols-2 gap-4">
                           <div className="col-span-2 md:col-span-1">
                              <label className="block text-[11px] font-bold text-slate-600 mb-1">کد حساب</label>
                              <div className="flex items-center" dir="ltr">
                                 {codePrefix && <span className="bg-slate-100 border border-slate-300 border-r-0 rounded-l h-8 flex items-center px-2 text-slate-500 font-mono text-xs">{codePrefix}</span>}
                                 <input 
                                    value={formData.code || ''}
                                    onChange={e => { if(e.target.value.length <= maxLen) setFormData({...formData, code: e.target.value}) }}
                                    className={`flex-1 border border-slate-300 ${codePrefix ? 'rounded-r' : 'rounded'} h-8 px-2 outline-none focus:border-indigo-500 text-sm font-mono`}
                                    placeholder={'0'.repeat(maxLen)}
                                 />
                              </div>
                           </div>
                           <div className="col-span-2 md:col-span-1 flex items-end pb-2">
                              {formData.level === 'subsidiary' && (
                                 <LocalCheckbox label="فعال" checked={formData.isActive !== false} onChange={v => setFormData({...formData, isActive: v})} />
                              )}
                           </div>
                           <InputField label="عنوان (فارسی)" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} isRtl={isRtl} />
                           <InputField label="عنوان (انگلیسی)" value={formData.titleEn} onChange={e => setFormData({...formData, titleEn: e.target.value})} isRtl={isRtl} dir="ltr" />
                           <SelectField label="نوع حساب" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} isRtl={isRtl}>
                              {ACCOUNT_TYPES.map(t => <option key={t.id} value={t.id}>{t.labelFa}</option>)}
                           </SelectField>
                           <SelectField label="ماهیت حساب" value={formData.nature} onChange={e => setFormData({...formData, nature: e.target.value})} isRtl={isRtl}>
                              {ACCOUNT_NATURES.map(n => <option key={n.id} value={n.id}>{n.labelFa}</option>)}
                           </SelectField>
                        </div>

                        {formData.level === 'subsidiary' && (
                           <div className="mt-6 border-t border-slate-100 pt-4">
                              <h4 className="font-bold text-xs text-indigo-700 mb-3 flex items-center gap-2"><ShieldCheck size={14}/> ویژگی‌های کنترلی</h4>
                              <div className="grid grid-cols-1 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                                 {/* Currency */}
                                 <div className="flex items-center gap-4">
                                    <LocalCheckbox label="ویژگی ارزی" checked={!!formData.currencyFeature} onChange={v => setFormData({...formData, currencyFeature: v})} />
                                    {formData.currencyFeature && (
                                       <>
                                          <LocalCheckbox label="الزام ورود ارز" checked={!!formData.currencyMandatory} onChange={v => setFormData({...formData, currencyMandatory: v})} />
                                          <select className="h-8 border border-slate-300 rounded text-xs px-2" value={formData.defaultCurrency || ''} onChange={e => setFormData({...formData, defaultCurrency: e.target.value})}>
                                             <option value="">ارز پیش‌فرض...</option><option value="USD">دلار</option><option value="EUR">یورو</option>
                                          </select>
                                       </>
                                    )}
                                 </div>
                                 {/* Tracking */}
                                 <div className="flex items-center gap-4">
                                    <LocalCheckbox label="ویژگی پیگیری" checked={!!formData.trackFeature} onChange={v => setFormData({...formData, trackFeature: v})} />
                                    {formData.trackFeature && (
                                       <>
                                          <LocalCheckbox label="اجباری" checked={!!formData.trackMandatory} onChange={v => setFormData({...formData, trackMandatory: v})} />
                                          <LocalCheckbox label="یکتا بودن" checked={!!formData.trackUnique} onChange={v => setFormData({...formData, trackUnique: v})} />
                                       </>
                                    )}
                                 </div>
                                 {/* Quantity */}
                                 <div className="flex items-center gap-4">
                                    <LocalCheckbox label="ویژگی مقداری" checked={!!formData.qtyFeature} onChange={v => setFormData({...formData, qtyFeature: v})} />
                                    {formData.qtyFeature && (
                                       <LocalCheckbox label="اجباری" checked={!!formData.qtyMandatory} onChange={v => setFormData({...formData, qtyMandatory: v})} />
                                    )}
                                 </div>
                              </div>

                              {/* Nature Control */}
                              <div className="grid grid-cols-2 gap-4 mt-4">
                                 <SelectField label="کنترل ماهیت" value={formData.natureControl || 'none'} onChange={e => setFormData({...formData, natureControl: e.target.value})} isRtl={isRtl}>
                                    <option value="none">بدون کنترل</option>
                                    <option value="warn">هشدار</option>
                                    <option value="block">خطا (جلوگیری)</option>
                                 </SelectField>
                                 <div>
                                    <label className="block text-[11px] font-bold text-slate-600 mb-1">حساب مقابل (تعدیل ماهیت)</label>
                                    <div className="flex gap-2">
                                       <div className="flex-1 bg-white border border-slate-300 rounded h-8 flex items-center px-2 text-xs truncate" dir="ltr">
                                          {getContraAccountName(formData.contraAccountId)}
                                       </div>
                                       <Button variant="outline" size="sm" icon={Search} onClick={() => setShowContraModal(true)} />
                                       {formData.contraAccountId && <Button variant="ghost" size="sm" icon={X} className="text-red-500" onClick={() => setFormData({...formData, contraAccountId: null})} />}
                                    </div>
                                 </div>
                              </div>
                           </div>
                        )}
                     </div>
                  )}

                  {/* TAB 2: TAFSIL */}
                  {activeTab === 'tafsil' && (
                     <div className="grid grid-cols-3 gap-2">
                        {ALL_TAFSIL_TYPES.map(t => (
                           <div key={t.id} onClick={() => {
                              const list = formData.tafsils || [];
                              const exists = list.includes(t.id);
                              setFormData({...formData, tafsils: exists ? list.filter(x => x !== t.id) : [...list, t.id]});
                           }} className={`p-2 border rounded cursor-pointer text-xs flex items-center justify-between transition-all select-none ${formData.tafsils?.includes(t.id) ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-bold' : 'bg-white hover:bg-slate-50'}`}>
                              <span>{t.label}</span>
                              {!t.isSystem && <User size={12} className="text-slate-400"/>}
                           </div>
                        ))}
                     </div>
                  )}

                  {/* TAB 3: DESCRIPTION */}
                  {activeTab === 'desc' && (
                     <div className="space-y-2">
                        <div className="flex gap-2">
                           <InputField placeholder="شرح جدید..." id="newDescInput" isRtl={isRtl} />
                           <Button onClick={() => {
                              const el = document.getElementById('newDescInput');
                              if(el.value) {
                                 setFormData({...formData, descriptions: [...(formData.descriptions || []), {id: Date.now(), text: el.value}]});
                                 el.value = '';
                              }
                           }} icon={Plus}>افزودن</Button>
                        </div>
                        <div className="space-y-1">
                           {(formData.descriptions || []).map(d => (
                              <div key={d.id} className="flex justify-between p-2 bg-slate-50 border rounded text-xs">
                                 <span>{d.text}</span>
                                 <button onClick={() => setFormData({...formData, descriptions: formData.descriptions.filter(x => x.id !== d.id)})} className="text-red-500"><Trash2 size={12}/></button>
                              </div>
                           ))}
                        </div>
                     </div>
                  )}
               </div>

               <div className="p-3 border-t border-slate-200 bg-slate-50 flex justify-end gap-2 shrink-0">
                  <Button variant="outline" onClick={() => { setIsNodeEditMode(false); setFormData({}); setSelectedNode(null); }}>انصراف</Button>
                  <Button variant="primary" icon={Save} onClick={handleSaveNode}>ذخیره تغییرات</Button>
               </div>
            </div>
         </div>

         {/* CONTRA MODAL */}
         <Modal isOpen={showContraModal} onClose={() => setShowContraModal(false)} title="انتخاب حساب تعدیل ماهیت" maxWidth="max-w-4xl">
             <div className="h-[400px] flex flex-col relative">
                 <div className="flex-1 overflow-hidden border border-slate-200 rounded relative">
                     <DataGrid 
                         columns={[
                             { field: 'fullCode', header: 'کد کامل', width: 'w-32' },
                             { field: 'pathTitle', header: 'مسیر حساب', width: 'w-auto' }, 
                             { field: 'nature', header: 'ماهیت', width: 'w-24', render: r => <Badge variant={r.nature === 'debit' ? 'info' : 'warning'}>{r.nature}</Badge> }
                         ]}
                         data={filteredContraAccounts}
                         isRtl={isRtl}
                         actions={(row) => <Button size="sm" onClick={() => { setFormData({...formData, contraAccountId: row.id}); setShowContraModal(false); }}>انتخاب</Button>}
                     />
                 </div>
             </div>
         </Modal>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col p-4 bg-slate-100">
       <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm text-indigo-600"><Hash size={20}/></div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">{t.coa_title || (isRtl ? "ساختار حساب‌ها (کدینگ)" : "Chart of Accounts")}</h1>
            <p className="text-slate-500 text-xs mt-1">مدیریت درخت حساب‌های گروه، کل و معین</p>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
         {viewMode === 'list' ? renderStructureList() : renderDesigner()}
      </div>

      <Modal isOpen={showStructureModal} onClose={() => setShowStructureModal(false)} title={structureForm.id ? "ویرایش ساختار" : "ساختار جدید"} footer={<><Button variant="outline" onClick={() => setShowStructureModal(false)}>انصراف</Button><Button variant="primary" onClick={handleSaveStructure}>ذخیره</Button></>}>
         <div className="grid grid-cols-2 gap-4">
            <InputField label="کد" value={structureForm.code} onChange={e => setStructureForm({...structureForm, code: e.target.value})} isRtl={isRtl} />
            <InputField label="عنوان" value={structureForm.title} onChange={e => setStructureForm({...structureForm, title: e.target.value})} isRtl={isRtl} />
            <div className="col-span-2 grid grid-cols-3 gap-2 bg-slate-50 p-2 rounded border">
               <InputField label="طول گروه" type="number" value={structureForm.groupLen} onChange={e => setStructureForm({...structureForm, groupLen: parseInt(e.target.value)})} isRtl={isRtl} />
               <InputField label="طول کل" type="number" value={structureForm.generalLen} onChange={e => setStructureForm({...structureForm, generalLen: parseInt(e.target.value)})} isRtl={isRtl} />
               <InputField label="طول معین" type="number" value={structureForm.subsidiaryLen} onChange={e => setStructureForm({...structureForm, subsidiaryLen: parseInt(e.target.value)})} isRtl={isRtl} />
            </div>
         </div>
      </Modal>
    </div>
  );
};

window.ChartofAccounts = ChartofAccounts;

export default ChartofAccounts;
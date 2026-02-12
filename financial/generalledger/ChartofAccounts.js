/* Filename: financial/generalledger/ChartofAccounts.js */
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Folder, FolderOpen, FileText, Plus, Save, Trash2, 
  Settings, Search, ChevronRight, ChevronDown, Check,
  AlertCircle, Layout, List, CreditCard, DollarSign,
  Package, Hash, Layers, FileDigit, ArrowRight, Edit,
  TreeDeciduous, MoreVertical
} from 'lucide-react';

const ChartofAccounts = ({ t, isRtl }) => {
  const { 
    Button, InputField, SelectField, DataGrid, Modal, 
    Badge, Callout, ToggleChip, SelectionGrid, TreeView,
    FilterSection 
  } = window.UI;

  // --- 0. SHARED CUSTOM COMPONENTS ---
  
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

  // --- 1. GLOBAL STATE & MOCK DATA ---

  const [viewMode, setViewMode] = useState('list'); // 'list' | 'tree'
  const [activeStructure, setActiveStructure] = useState(null);

  // Mock: Defined Structures (Master Data)
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

  // Mock: Accounts Data (Mapped by Structure ID)
  // This simulates separate trees for separate structures
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

  // --- 2. SUB-COMPONENT: STRUCTURE LIST VIEW ---
  
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
        setAllAccounts(prev => ({ ...prev, [newId]: [] })); // Initialize empty tree
      }
      setShowModal(false);
    };

    const handleDelete = (ids) => {
      if (confirm(isRtl ? "آیا از حذف موارد انتخاب شده اطمینان دارید؟" : "Are you sure?")) {
        setStructures(prev => prev.filter(item => !ids.includes(item.id)));
        // In real app, also clean up accounts
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
              { field: 'status', header: isRtl ? 'وضعیت' : 'Status', width: 'w-24', render: r => <Badge variant={r.status ? 'success' : 'neutral'}>{r.status ? (isRtl ? 'فعال' : 'Active') : (isRtl ? 'غیرفعال' : 'Inactive')}</Badge> },
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

        {/* Create/Edit Modal */}
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

  // --- 3. SUB-COMPONENT: TREE DESIGNER VIEW ---

  const AccountTreeView = ({ structure, data, onSaveTree, onBack }) => {
    // Local state for the tree view logic
    const [selectedNode, setSelectedNode] = useState(null);
    const [mode, setMode] = useState('view'); 
    const [activeTab, setActiveTab] = useState('info'); 
    const [formData, setFormData] = useState({});

    // --- Helpers ---
    const getParentCode = (node) => {
      if (!node) return '';
      if (node.level === 'group') return node.code;
      if (node.level === 'general') return node.fullCode;
      return '';
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

    const handleSaveForm = () => {
      if (!formData.code || !formData.title) return alert(isRtl ? "کد و عنوان الزامی است" : "Code and Title Required");
      
      // Length Validation based on Structure Settings
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
      if (mode === 'edit') {
        newData = updateNodeInTree(data, nodeData);
        setSelectedNode(nodeData);
      } else {
        const newNode = { ...nodeData, id: Date.now().toString(), children: [] };
        if (formData.level === 'group') {
          newData = [...data, newNode];
        } else {
          newData = addNodeToTree(data, selectedNode.id, newNode);
        }
      }
      
      onSaveTree(newData);
      setMode('view');
    };

    const handleDelete = () => {
       if (selectedNode?.children?.length > 0) return alert(isRtl ? "حساب دارای زیرمجموعه است" : "Account has children");
       // Delete logic would go here (simplified for mock)
       alert(isRtl ? "عملیات حذف (شبیه‌سازی شده)" : "Delete simulated");
       setSelectedNode(null);
       setMode('view');
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

    const flattenTree = (nodes, list = []) => {
        nodes.forEach(node => { list.push(node); if (node.children) flattenTree(node.children, list); });
        return list;
    };
    const handleNodeSelect = (nodeId) => {
        const allNodes = flattenTree(data);
        setSelectedNode(allNodes.find(n => n.id === nodeId));
        setMode('view');
    };

    // --- Forms ---
    const AccountForm = () => {
        const maxLen = formData.level === 'group' ? structure.groupLen : (formData.level === 'general' ? structure.generalLen : structure.subsidiaryLen);
        let prefix = '';
        if (formData.level !== 'group' && selectedNode) prefix = selectedNode.level === 'group' ? selectedNode.code : selectedNode.fullCode;

        return (
            <div className="space-y-4">
                <div>
                   <label className="block text-[11px] font-bold text-slate-600 mb-1">{isRtl ? "کد حساب" : "Account Code"}</label>
                   <div className="flex items-center" dir="ltr">
                     {prefix && <span className="bg-slate-100 border border-slate-300 border-r-0 rounded-l h-8 flex items-center px-2 text-slate-500 font-mono text-sm">{prefix}</span>}
                     <input 
                        value={formData.code || ''}
                        onChange={e => { if (e.target.value.length <= maxLen) setFormData({...formData, code: e.target.value}); }}
                        className={`flex-1 ${window.UI.THEME.colors.surface} border ${window.UI.THEME.colors.border} ${prefix ? 'rounded-r border-l-0' : 'rounded'} h-8 px-2 outline-none focus:border-indigo-500 text-sm font-mono`}
                        placeholder={"0".repeat(maxLen)}
                     />
                   </div>
                </div>
                <InputField label={isRtl ? "عنوان فارسی" : "Title (Local)"} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} isRtl={isRtl} />
                <InputField label={isRtl ? "عنوان انگلیسی" : "Title (En)"} value={formData.titleEn} onChange={e => setFormData({...formData, titleEn: e.target.value})} isRtl={isRtl} dir="ltr" />
                <SelectField label={isRtl ? "نوع حساب" : "Type"} value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} isRtl={isRtl}>
                    <option value="permanent">{isRtl ? 'دائم' : 'Permanent'}</option>
                    <option value="temporary">{isRtl ? 'موقت' : 'Temporary'}</option>
                    <option value="disciplinary">{isRtl ? 'انتظامی' : 'Disciplinary'}</option>
                </SelectField>
                <SelectField label={isRtl ? "ماهیت حساب" : "Nature"} value={formData.nature} onChange={e => setFormData({...formData, nature: e.target.value})} isRtl={isRtl}>
                    <option value="debit">{isRtl ? 'بدهکار' : 'Debit'}</option>
                    <option value="credit">{isRtl ? 'بستانکار' : 'Credit'}</option>
                    <option value="none">{isRtl ? 'مهم نیست' : 'None'}</option>
                </SelectField>
                {formData.level === 'subsidiary' && <Checkbox label={isRtl ? "فعال" : "Active"} checked={formData.isActive} onChange={v => setFormData({...formData, isActive: v})} />}
            </div>
        );
    };

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
               </div>
               <div className="flex-1 overflow-y-auto p-2">
                  <TreeView 
                     data={data} 
                     onSelectNode={(node) => handleNodeSelect(node.id)}
                     selectedNodeId={selectedNode?.id}
                     renderNodeContent={renderTreeContent}
                     isRtl={isRtl}
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

               {selectedNode && mode === 'view' && (
                  <div className="h-full bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
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
                     <div className="p-6 grid grid-cols-2 gap-6">
                        <div><label className="text-[10px] font-bold text-slate-400 block mb-1">{isRtl ? "سطح" : "Level"}</label><span className="text-sm">{selectedNode.level}</span></div>
                        <div><label className="text-[10px] font-bold text-slate-400 block mb-1">{isRtl ? "ماهیت" : "Nature"}</label><Badge variant="info">{selectedNode.nature}</Badge></div>
                        <div><label className="text-[10px] font-bold text-slate-400 block mb-1">{isRtl ? "نوع" : "Type"}</label><span className="text-sm">{selectedNode.type}</span></div>
                     </div>
                     <div className="mt-auto p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
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
                        <Tabs tabs={[{id: 'info', label: isRtl ? 'اطلاعات' : 'Info', icon: FileText}]} activeTab={activeTab} onChange={setActiveTab} />
                        {activeTab === 'info' && <AccountForm />}
                     </div>
                     <div className="p-3 border-t border-slate-200 bg-slate-50 flex justify-end gap-2 rounded-b-xl">
                        <Button variant="outline" onClick={() => setMode('view')}>{isRtl ? "انصراف" : "Cancel"}</Button>
                        <Button variant="primary" icon={Save} onClick={handleSaveForm}>{isRtl ? "ذخیره" : "Save"}</Button>
                     </div>
                  </div>
               )}
            </div>
         </div>
      </div>
    );
  };

  // --- 4. MAIN RENDER ---

  const handleUpdateTree = (newData) => {
     // Save the updated tree back to the global store for this structure ID
     setAllAccounts(prev => ({ ...prev, [activeStructure.id]: newData }));
  };

  return (
    <div className="h-full flex flex-col p-4 bg-slate-100">
       {/* Main Header */}
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
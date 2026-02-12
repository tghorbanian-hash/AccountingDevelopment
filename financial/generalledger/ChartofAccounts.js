import React, { useState, useEffect } from 'react';
import { 
  Folder, FolderOpen, FileText, Plus, Save, Trash2, 
  Settings, Search, Check, AlertCircle, Layout, List, 
  Layers, FileDigit, ArrowRight, Edit, TreeDeciduous, 
  ShieldCheck, X, User, ChevronsDown, ChevronsUp, 
  Minimize2, Maximize2 
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/UIComponents';

const ChartofAccounts = () => {
  // State for Groups (Level 1)
  const [groups, setGroups] = useState([
    { id: 1, code: '1', title: 'دارایی‌ها', type: 'balance_sheet', nature: 'debtor', description: 'حساب‌های دارایی جاری و غیرجاری' },
    { id: 2, code: '2', title: 'بدهی‌ها', type: 'balance_sheet', nature: 'creditor', description: 'تعهدات به اشخاص ثالث' },
    { id: 3, code: '3', title: 'حقوق صاحبان سهام', type: 'balance_sheet', nature: 'creditor', description: 'سرمایه و اندوخته‌ها' },
    { id: 4, code: '4', title: 'درآمدها', type: 'profit_loss', nature: 'creditor', description: 'درآمدهای عملیاتی و غیرعملیاتی' },
    { id: 5, code: '5', title: 'هزینه‌ها', type: 'profit_loss', nature: 'debtor', description: 'هزینه‌های عملیاتی و اداری' },
    { id: 6, code: '6', title: 'حساب‌های انتظامی', type: 'disciplinary', nature: 'none', description: 'حساب‌های آماری و انتظامی' }
  ]);

  // State for General Accounts (Level 2)
  const [generals, setGenerals] = useState([
    { id: 101, groupId: 1, code: '101', title: 'موجودی نقد و بانک', nature: 'debtor', hasFloating: false },
    { id: 102, groupId: 1, code: '102', title: 'حساب‌های دریافتنی', nature: 'debtor', hasFloating: true },
    { id: 103, groupId: 1, code: '103', title: 'موجودی کالا', nature: 'debtor', hasFloating: false },
    { id: 104, groupId: 1, code: '104', title: 'دارایی‌های ثابت', nature: 'debtor', hasFloating: false },
    { id: 201, groupId: 2, code: '201', title: 'حساب‌های پرداختنی', nature: 'creditor', hasFloating: true },
    { id: 202, groupId: 2, code: '202', title: 'تسهیلات دریافتی', nature: 'creditor', hasFloating: false },
    { id: 401, groupId: 4, code: '401', title: 'درآمد فروش', nature: 'creditor', hasFloating: false },
    { id: 501, groupId: 5, code: '501', title: 'هزینه حقوق و دستمزد', nature: 'debtor', hasFloating: true }
  ]);

  // View & Selection States
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedGeneral, setSelectedGeneral] = useState(null);
  
  // Filter States
  const [filteredGroups, setFilteredGroups] = useState(groups);
  const [filteredGenerals, setFilteredGenerals] = useState([]);

  // Search States
  const [groupSearch, setGroupSearch] = useState('');
  const [generalSearch, setGeneralSearch] = useState('');

  // Modal States
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isGeneralModalOpen, setIsGeneralModalOpen] = useState(false);
  
  // Editing States
  const [editingGroup, setEditingGroup] = useState(null);
  const [editingGeneral, setEditingGeneral] = useState(null);

  const t = {
    coa_title: "ساختار حساب‌ها (کدینگ)",
    group_accounts: "گروه حساب‌ها",
    general_accounts: "حساب‌های کل",
    add_group: "افزودن گروه",
    add_general: "افزودن کل",
    search: "جستجو...",
    code: "کد",
    title: "عنوان",
    type: "نوع حساب",
    nature: "ماهیت",
    actions: "عملیات",
    save: "ذخیره",
    cancel: "انصراف",
    delete_confirm: "آیا از حذف این حساب اطمینان دارید؟",
    edit: "ویرایش",
    delete: "حذف"
  };

  const isRtl = true;

  // Effects
  useEffect(() => {
    setFilteredGroups(
      groups.filter(g => 
        g.title.includes(groupSearch) || g.code.includes(groupSearch)
      )
    );
  }, [groupSearch, groups]);

  useEffect(() => {
    if (selectedGroup) {
      setFilteredGenerals(
        generals.filter(g => 
          g.groupId === selectedGroup.id &&
          (g.title.includes(generalSearch) || g.code.includes(generalSearch))
        )
      );
    } else {
      setFilteredGenerals([]);
    }
  }, [selectedGroup, generalSearch, generals]);

  // Handlers
  const handleSelectGroup = (group) => {
    setSelectedGroup(group);
    setSelectedGeneral(null);
  };

  const handleSelectGeneral = (general) => {
    setSelectedGeneral(general);
  };

  // CRUD - Groups
  const handleSaveGroup = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newGroup = {
      id: editingGroup ? editingGroup.id : Date.now(),
      code: formData.get('code'),
      title: formData.get('title'),
      type: formData.get('type'),
      nature: formData.get('nature'),
      description: formData.get('description')
    };

    if (editingGroup) {
      setGroups(groups.map(g => g.id === editingGroup.id ? newGroup : g));
    } else {
      setGroups([...groups, newGroup]);
    }
    setIsGroupModalOpen(false);
    setEditingGroup(null);
  };

  const handleDeleteGroup = (id) => {
    if (window.confirm(t.delete_confirm)) {
      setGroups(groups.filter(g => g.id !== id));
      if (selectedGroup?.id === id) {
        setSelectedGroup(null);
        setSelectedGeneral(null);
      }
    }
  };

  // CRUD - Generals
  const handleSaveGeneral = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newGeneral = {
      id: editingGeneral ? editingGeneral.id : Date.now(),
      groupId: selectedGroup.id,
      code: formData.get('code'),
      title: formData.get('title'),
      nature: formData.get('nature'),
      hasFloating: formData.get('hasFloating') === 'true'
    };

    if (editingGeneral) {
      setGenerals(generals.map(g => g.id === editingGeneral.id ? newGeneral : g));
    } else {
      setGenerals([...generals, newGeneral]);
    }
    setIsGeneralModalOpen(false);
    setEditingGeneral(null);
  };

  const handleDeleteGeneral = (id) => {
    if (window.confirm(t.delete_confirm)) {
      setGenerals(generals.filter(g => g.id !== id));
      if (selectedGeneral?.id === id) {
        setSelectedGeneral(null);
      }
    }
  };

  // Render Helpers
  const getTypeLabel = (type) => {
    switch(type) {
      case 'balance_sheet': return 'ترازنامه‌ای';
      case 'profit_loss': return 'سود و زیانی';
      case 'disciplinary': return 'انتظامی';
      default: return type;
    }
  };

  const getNatureLabel = (nature) => {
    switch(nature) {
      case 'debtor': return 'بدهکار';
      case 'creditor': return 'بستانکار';
      case 'none': return 'خلافی/خنثی';
      default: return nature;
    }
  };

  return (
    <div className={`space-y-6 ${isRtl ? 'rtl' : 'ltr'} p-4`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 rounded-lg">
            <Layers className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              {t.coa_title}
            </h1>
            <p className="text-sm text-slate-500 mt-1">مدیریت ساختار حساب‌ها در 2 سطح (گروه و کل)</p>
          </div>
        </div>
      </div>

      {/* Main Grid - Changed to 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-180px)]">
        
        {/* Column 1: Groups */}
        <Card className="flex flex-col h-full border-slate-200 shadow-lg">
          <CardHeader className="bg-slate-50 border-b border-slate-200 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Folder className="w-5 h-5 text-indigo-600" />
                <CardTitle className="text-lg">{t.group_accounts}</CardTitle>
                <span className="px-2 py-0.5 text-xs bg-indigo-100 text-indigo-700 rounded-full">
                  {filteredGroups.length}
                </span>
              </div>
              <button 
                onClick={() => { setEditingGroup(null); setIsGroupModalOpen(true); }}
                className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm"
                title={t.add_group}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-3 relative">
              <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder={t.search}
                value={groupSearch}
                onChange={(e) => setGroupSearch(e.target.value)}
                className="w-full pr-9 pl-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-2 space-y-2 bg-slate-50/50">
            {filteredGroups.map(group => (
              <div
                key={group.id}
                onClick={() => handleSelectGroup(group)}
                className={`
                  group relative p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md
                  ${selectedGroup?.id === group.id 
                    ? 'bg-white border-indigo-500 shadow-md ring-1 ring-indigo-500' 
                    : 'bg-white border-slate-200 hover:border-indigo-300'
                  }
                `}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg
                      ${selectedGroup?.id === group.id ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}
                    `}>
                      {group.code}
                    </div>
                    <div>
                      <h3 className={`font-bold ${selectedGroup?.id === group.id ? 'text-indigo-900' : 'text-slate-700'}`}>
                        {group.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                          {getTypeLabel(group.type)}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                          {getNatureLabel(group.nature)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setEditingGroup(group); setIsGroupModalOpen(true); }}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteGroup(group.id); }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {selectedGroup?.id === group.id && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 -ml-3 hidden lg:block">
                    <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center shadow-sm">
                      <ArrowRight className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Column 2: Generals */}
        <Card className="flex flex-col h-full border-slate-200 shadow-lg">
          <CardHeader className="bg-slate-50 border-b border-slate-200 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-indigo-600" />
                <CardTitle className="text-lg">{t.general_accounts}</CardTitle>
                {selectedGroup && (
                  <span className="text-xs px-2 py-1 bg-slate-200 text-slate-600 rounded-md">
                    {selectedGroup.title}
                  </span>
                )}
              </div>
              <button 
                onClick={() => { 
                  if (selectedGroup) {
                    setEditingGeneral(null); 
                    setIsGeneralModalOpen(true);
                  } else {
                    alert('لطفا ابتدا یک گروه حساب انتخاب کنید');
                  }
                }}
                className={`
                  p-2 rounded-lg transition-colors shadow-sm text-white
                  ${selectedGroup 
                    ? 'bg-indigo-600 hover:bg-indigo-700' 
                    : 'bg-slate-300 cursor-not-allowed'
                  }
                `}
                disabled={!selectedGroup}
                title={t.add_general}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-3 relative">
              <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder={selectedGroup ? t.search : "ابتدا گروه را انتخاب کنید..."}
                value={generalSearch}
                onChange={(e) => setGeneralSearch(e.target.value)}
                disabled={!selectedGroup}
                className="w-full pr-9 pl-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:bg-slate-50 disabled:text-slate-400"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-2 space-y-2 bg-slate-50/50">
            {!selectedGroup ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                <Folder className="w-16 h-16 mb-4 text-slate-300" />
                <p>جهت مشاهده حساب‌های کل،</p>
                <p>یک گروه حساب انتخاب کنید</p>
              </div>
            ) : filteredGenerals.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                <FolderOpen className="w-16 h-16 mb-4 text-slate-300" />
                <p>هیچ حساب کلی یافت نشد</p>
              </div>
            ) : (
              filteredGenerals.map(general => (
                <div
                  key={general.id}
                  onClick={() => handleSelectGeneral(general)}
                  className={`
                    group relative p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md
                    ${selectedGeneral?.id === general.id 
                      ? 'bg-white border-indigo-500 shadow-md ring-1 ring-indigo-500' 
                      : 'bg-white border-slate-200 hover:border-indigo-300'
                    }
                  `}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className={`
                        w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg
                        ${selectedGeneral?.id === general.id ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}
                      `}>
                        {general.code}
                      </div>
                      <div>
                        <h3 className={`font-bold ${selectedGeneral?.id === general.id ? 'text-indigo-900' : 'text-slate-700'}`}>
                          {general.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                            {getNatureLabel(general.nature)}
                          </span>
                          {general.hasFloating && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100 flex items-center gap-1">
                              <User className="w-3 h-3" />
                              تفصیل‌پذیر
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setEditingGeneral(general); setIsGeneralModalOpen(true); }}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteGeneral(general.id); }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

      </div>

      {/* Group Modal */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">
                {editingGroup ? 'ویرایش گروه حساب' : 'افزودن گروه جدید'}
              </h3>
              <button onClick={() => setIsGroupModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveGroup} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">کد گروه</label>
                  <input 
                    name="code" 
                    defaultValue={editingGroup?.code} 
                    required 
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-left"
                    placeholder="مثلا: 1"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">نوع حساب</label>
                  <select name="type" defaultValue={editingGroup?.type || 'balance_sheet'} className="w-full p-2 border border-slate-300 rounded-lg">
                    <option value="balance_sheet">ترازنامه‌ای</option>
                    <option value="profit_loss">سود و زیانی</option>
                    <option value="disciplinary">انتظامی</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">عنوان گروه</label>
                <input 
                  name="title" 
                  defaultValue={editingGroup?.title} 
                  required 
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="مثلا: دارایی‌های جاری"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">ماهیت حساب</label>
                <select name="nature" defaultValue={editingGroup?.nature || 'debtor'} className="w-full p-2 border border-slate-300 rounded-lg">
                  <option value="debtor">بدهکار</option>
                  <option value="creditor">بستانکار</option>
                  <option value="none">مهم نیست</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">توضیحات</label>
                <textarea 
                  name="description" 
                  defaultValue={editingGroup?.description} 
                  rows="3"
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsGroupModalOpen(false)} className="flex-1 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 transition-colors">
                  {t.cancel}
                </button>
                <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-colors">
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* General Modal */}
      {isGeneralModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">
                {editingGeneral ? 'ویرایش حساب کل' : 'افزودن حساب کل جدید'}
              </h3>
              <button onClick={() => setIsGeneralModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveGeneral} className="p-6 space-y-4">
              <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <label className="text-xs text-slate-500">گروه مادر:</label>
                <div className="font-bold text-slate-800">{selectedGroup?.title}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">کد کل</label>
                  <input 
                    name="code" 
                    defaultValue={editingGeneral?.code} 
                    required 
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-left"
                    placeholder="مثلا: 101"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">ماهیت</label>
                  <select name="nature" defaultValue={editingGeneral?.nature || 'debtor'} className="w-full p-2 border border-slate-300 rounded-lg">
                    <option value="debtor">بدهکار</option>
                    <option value="creditor">بستانکار</option>
                    <option value="none">مهم نیست</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">عنوان حساب کل</label>
                <input 
                  name="title" 
                  defaultValue={editingGeneral?.title} 
                  required 
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="مثلا: موجودی نقد"
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox" 
                  name="hasFloating" 
                  id="hasFloating"
                  defaultChecked={editingGeneral?.hasFloating}
                  value="true"
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <label htmlFor="hasFloating" className="text-sm font-medium text-slate-700 cursor-pointer select-none">
                  این حساب دارای تفصیل شناور است
                </label>
              </div>
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsGeneralModalOpen(false)} className="flex-1 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 transition-colors">
                  {t.cancel}
                </button>
                <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-colors">
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartofAccounts;
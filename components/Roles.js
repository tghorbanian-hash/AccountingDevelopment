/* Filename: components/Roles.js */
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Shield, Edit, Save, Check, Lock, Layers, CheckSquare, Eye, Filter, AlertCircle,
  FolderOpen, Trash2, Zap, Users, Search, UserPlus, X, UserMinus, Plus, ChevronDown
} from 'lucide-react';

const Roles = ({ t, isRtl }) => {
  const UI = window.UI || {};
  const { 
    Button, InputField, Toggle, Badge, DataGrid, 
    FilterSection, Modal, DatePicker, SelectField,
    TreeView, SelectionGrid, ToggleChip 
  } = UI;
  const supabase = window.supabase;

  if (!Button) return <div className="p-4 text-center">Loading UI...</div>;

  const MultiSelect = ({ options, value = [], onChange, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef(null);

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (containerRef.current && !containerRef.current.contains(event.target)) setIsOpen(false);
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = options.filter(opt => opt.label.toLowerCase().includes(searchTerm.toLowerCase()));
    const toggleOption = (id) => onChange(value.includes(id) ? value.filter(v => v !== id) : [...value, id]);

    return (
      <div className="relative" ref={containerRef}>
        <div className="min-h-[32px] bg-white border border-slate-200 rounded-md flex flex-wrap items-center gap-1 p-1 cursor-pointer focus-within:border-indigo-400 transition-all" onClick={() => setIsOpen(!isOpen)}>
          {value.length === 0 && <span className="text-slate-400 text-[11px] px-1 select-none">{placeholder}</span>}
          {value.map(id => (
            <span key={id} className="bg-indigo-50 text-indigo-700 border border-indigo-100 rounded px-1.5 py-0.5 text-[10px] flex items-center gap-1">
              {options.find(o => o.id === id)?.label}
              <X size={10} className="hover:text-red-500" onClick={(e) => { e.stopPropagation(); onChange(value.filter(v => v !== id)); }}/>
            </span>
          ))}
          <div className={`${isRtl ? 'mr-auto' : 'ml-auto'} px-1 text-slate-400`}><ChevronDown size={14}/></div>
        </div>
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg z-[100] max-h-48 overflow-y-auto p-2">
            <input className="w-full text-[11px] border border-slate-200 rounded px-2 py-1 mb-2 outline-none focus:border-indigo-400" placeholder={t.search || (isRtl ? "جستجو..." : "Search...")} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onClick={e => e.stopPropagation()} autoFocus />
            {filteredOptions.length > 0 ? filteredOptions.map(opt => (
              <div key={opt.id} className={`px-3 py-2 text-[11px] cursor-pointer hover:bg-slate-50 flex items-center justify-between ${value.includes(opt.id) ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700'}`} onClick={() => toggleOption(opt.id)}>
                {opt.label} {value.includes(opt.id) && <Check size={12}/>}
              </div>
            )) : <div className="p-2 text-center text-slate-400 text-[10px]">{t.noItemsFound || (isRtl ? "موردی یافت نشد." : "No items found.")}</div>}
          </div>
        )}
      </div>
    );
  };

  // --- DB STATES ---
  const [allUsers, setAllUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [dynamicMenu, setDynamicMenu] = useState([]);
  const [allForms, setAllForms] = useState([]);

  // --- UI STATES ---
  const [selectedRows, setSelectedRows] = useState([]);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({ title: '', code: '', isActive: true, startDate: '', endDate: '' });

  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);
  const [tempPermissions, setTempPermissions] = useState({});

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [showUserResults, setShowUserResults] = useState(false);

  const [filterValues, setFilterValues] = useState({ formIds: [], userIds: [], isActive: 'all' });
  const [appliedFilters, setAppliedFilters] = useState({ formIds: [], userIds: [], isActive: 'all' });

  // --- CONFIG ---
  const AVAILABLE_ACTIONS = [
    { id: 'create', label: t.actCreate || (isRtl ? 'ایجاد' : 'Create') }, { id: 'view', label: t.actView || (isRtl ? 'مشاهده' : 'View') }, { id: 'edit', label: t.actEdit || (isRtl ? 'ویرایش' : 'Edit') }, { id: 'delete', label: t.actDelete || (isRtl ? 'حذف' : 'Delete') },
    { id: 'print', label: t.actPrint || (isRtl ? 'چاپ' : 'Print') }, { id: 'approve', label: t.actApprove || (isRtl ? 'تایید' : 'Approve') }, { id: 'export', label: t.actExport || (isRtl ? 'خروجی' : 'Export') }, { id: 'share', label: t.actShare || (isRtl ? 'اشتراک' : 'Share') },
  ];

  const DATA_SCOPES = {
    'doc_list': [
      { id: 'docType', label: t.dsDocType || (isRtl ? 'نوع سند' : 'Doc Type'), options: [{ value: 'opening', label: t.dsDocOpening || (isRtl ? 'سند افتتاحیه' : 'Opening') }, { value: 'general', label: t.dsDocGeneral || (isRtl ? 'سند عمومی' : 'General') }] },
      { id: 'docStatus', label: t.dsStatus || (isRtl ? 'وضعیت سند' : 'Status'), options: [{ value: 'draft', label: t.dsStatusTemp || (isRtl ? 'پیش‌نویس' : 'Draft') }, { value: 'final', label: t.dsStatusFinal || (isRtl ? 'نهایی' : 'Final') }] }
    ]
  };

  // --- FETCH DATA ---
  useEffect(() => {
    fetchData();
  }, [isRtl]);

  const fetchData = async () => {
    const { data: resData } = await supabase.schema('gen').from('resources').select('*');
    if (resData) {
      const map = new Map();
      const roots = [];
      const formsList = [];
      resData.forEach(r => map.set(r.id, { id: r.code, uuid: r.id, label: { fa: r.title_fa, en: r.title_en }, type: r.type, parent_id: r.parent_id, children: [] }));
      resData.forEach(r => {
        const node = map.get(r.id);
        if (r.parent_id && map.has(r.parent_id)) map.get(r.parent_id).children.push(node);
        else roots.push(node);
      });
      setDynamicMenu(roots);

      const traverse = (nodes, path = '') => {
        nodes.forEach(n => {
          const currentPath = path ? `${path} / ${n.label[isRtl ? 'fa' : 'en']}` : n.label[isRtl ? 'fa' : 'en'];
          if (n.type === 'form') formsList.push({ id: n.id, label: n.label[isRtl ? 'fa' : 'en'], fullPath: currentPath });
          if (n.children.length > 0) traverse(n.children, currentPath);
        });
      };
      traverse(roots);
      setAllForms(formsList);
    }

    const { data: uData } = await supabase.schema('gen').from('users').select('*');
    const { data: urData } = await supabase.schema('gen').from('user_roles').select('*');
    if (uData && urData) {
      setAllUsers(uData.map(u => ({ id: u.id, username: u.username, fullName: u.full_name, isActive: u.is_active, roleIds: urData.filter(ur => ur.user_id === u.id).map(ur => ur.role_id) })));
    }

    const { data: rData } = await supabase.schema('gen').from('roles').select('*').order('created_at', { ascending: false });
    if (rData) setRoles(rData.map(r => ({ id: r.id, title: r.title, code: r.code, isActive: r.is_active, startDate: '', endDate: '' })));

    const { data: pData } = await supabase.schema('gen').from('permissions').select('*').not('role_id', 'is', null);
    if (pData) {
      const permsMap = {};
      pData.forEach(p => {
        if (!permsMap[p.role_id]) permsMap[p.role_id] = {};
        permsMap[p.role_id][p.resource_code] = { actions: p.actions || [], dataScopes: p.data_scopes || {} };
      });
      setPermissions(permsMap);
    }
  };

  const filteredRoles = useMemo(() => {
    return roles.filter(role => {
      const matchStatus = appliedFilters.isActive === 'all' || (appliedFilters.isActive === 'active' ? role.isActive : !role.isActive);
      const matchUser = appliedFilters.userIds.length === 0 || allUsers.some(u => appliedFilters.userIds.includes(u.id) && u.roleIds.includes(role.id));
      const matchForm = appliedFilters.formIds.length === 0 || (permissions[role.id] && appliedFilters.formIds.some(fid => permissions[role.id][fid]?.actions?.length > 0));
      return matchStatus && matchUser && matchForm;
    });
  }, [roles, appliedFilters, allUsers, permissions]);

  // --- HANDLERS ---
  const handleCreate = () => {
    setEditingRole(null);
    setFormData({ title: '', code: '', isActive: true, startDate: '', endDate: '' });
    setIsRoleModalOpen(true);
  };

  const handleEdit = (role) => {
    setEditingRole(role);
    setFormData(role);
    setIsRoleModalOpen(true);
  };

  const handleDelete = async (ids) => {
    const msg = isRtl ? `آیا از حذف ${ids.length} نقش اطمینان دارید؟` : `Delete ${ids.length} roles?`;
    if (confirm(msg)) {
      await supabase.schema('gen').from('roles').delete().in('id', ids);
      fetchData();
      setSelectedRows([]);
    }
  };

  const saveRole = async () => {
    if (editingRole) {
      await supabase.schema('gen').from('roles').update({ title: formData.title, code: formData.code, is_active: formData.isActive }).eq('id', editingRole.id);
    } else {
      await supabase.schema('gen').from('roles').insert([{ title: formData.title, code: formData.code, is_active: formData.isActive }]);
    }
    setIsRoleModalOpen(false);
    fetchData();
  };

  const openAccessModal = (role) => {
    setEditingRole(role);
    setTempPermissions(JSON.parse(JSON.stringify(permissions[role.id] || {})));
    setSelectedModule(null);
    setIsAccessModalOpen(true);
  };

  const saveAccess = async () => {
    const { error: delErr } = await supabase.schema('gen').from('permissions').delete().eq('role_id', editingRole.id);
    if (delErr) console.error(delErr);

    const permInserts = [];
    Object.keys(tempPermissions).forEach(formId => {
      const perm = tempPermissions[formId];
      if (perm.actions.length > 0 || Object.keys(perm.dataScopes).length > 0) {
        permInserts.push({ role_id: editingRole.id, resource_code: formId, actions: perm.actions, data_scopes: perm.dataScopes });
      }
    });

    if (permInserts.length > 0) {
      const { error: insErr } = await supabase.schema('gen').from('permissions').insert(permInserts);
      if (insErr) {
         console.error(insErr);
         alert(t.errSavePerms || (isRtl ? 'خطا در ذخیره دسترسی‌ها' : 'Error saving permissions.'));
         return;
      }
    }

    setIsAccessModalOpen(false);
    fetchData();
  };

  const updateAction = (moduleId, actionId) => {
    setTempPermissions(prev => {
      const modulePerms = prev[moduleId] || { actions: [], dataScopes: {} };
      const newActions = modulePerms.actions.includes(actionId) ? modulePerms.actions.filter(a => a !== actionId) : [...modulePerms.actions, actionId];
      return { ...prev, [moduleId]: { ...modulePerms, actions: newActions } };
    });
  };

  const updateScope = (moduleId, scopeId, value) => {
    setTempPermissions(prev => {
      const modulePerms = prev[moduleId] || { actions: [], dataScopes: {} };
      const current = modulePerms.dataScopes[scopeId] || [];
      const newValues = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
      return { ...prev, [moduleId]: { ...modulePerms, dataScopes: { ...modulePerms.dataScopes, [scopeId]: newValues } } };
    });
  };

  const getAllDescendantIds = (node) => {
    let ids = [node.id];
    if (node.children && node.children.length > 0) node.children.forEach(child => { ids = [...ids, ...getAllDescendantIds(child)]; });
    return ids;
  };

  const handleBulkPermission = (mode) => {
    if (!selectedModule) return;
    const targetIds = getAllDescendantIds(selectedModule);
    const msg = isRtl ? `این عملیات روی آیتم‌های زیرمجموعه نیز اعمال می‌شود. ادامه می‌دهید؟` : `This will affect child items. Continue?`;
    if (targetIds.length > 1 && !confirm(msg)) return;
    setTempPermissions(prev => {
      const next = { ...prev };
      targetIds.forEach(id => {
        if (mode === 'revoke') delete next[id];
        else {
          let allScopes = {};
          if (DATA_SCOPES[id]) DATA_SCOPES[id].forEach(scope => { allScopes[scope.id] = scope.options.map(o => o.value); });
          next[id] = { actions: AVAILABLE_ACTIONS.map(a => a.id), dataScopes: allScopes };
        }
      });
      return next;
    });
  };

  const renderPermissionNode = (item) => {
    const hasAccess = tempPermissions[item.id]?.actions?.length > 0;
    return <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all shrink-0 ${hasAccess ? 'bg-green-500 border-green-500 text-white shadow-sm' : 'border-slate-300 bg-white'}`}>{hasAccess && <Check size={12} strokeWidth={3} />}</div>;
  };

  const openUserAssignment = (role) => {
    setEditingRole(role);
    setUserSearchTerm('');
    setShowUserResults(false);
    setIsUserModalOpen(true);
  };

  const assignedUsers = useMemo(() => {
    if (!editingRole) return [];
    return allUsers.filter(u => u.roleIds.includes(editingRole.id));
  }, [allUsers, editingRole]);

  const searchResults = useMemo(() => {
    if (!editingRole || !userSearchTerm) return [];
    const term = userSearchTerm.toLowerCase();
    return allUsers.filter(u => !u.roleIds.includes(editingRole.id) && (u.username.toLowerCase().includes(term) || u.fullName.toLowerCase().includes(term)));
  }, [userSearchTerm, allUsers, editingRole]);

  const handleAssignUser = async (userId) => {
    await supabase.schema('gen').from('user_roles').insert([{ user_id: userId, role_id: editingRole.id }]);
    setUserSearchTerm('');
    setShowUserResults(false);
    fetchData();
  };

  const handleUnassignUser = async (userId) => {
    if (confirm(t.confirmUnassignRole || (isRtl ? 'آیا از سلب مسئولیت این نقش از کاربر اطمینان دارید؟' : 'Are you sure you want to remove this role from the user?'))) {
      await supabase.schema('gen').from('user_roles').delete().match({ user_id: userId, role_id: editingRole.id });
      fetchData();
    }
  };

  // --- COLUMNS ---
  const roleColumns = [
    { header: t.id || (isRtl ? 'شناسه' : 'ID'), field: 'id', width: 'w-16', render: (r) => <span className="text-[10px] text-slate-400 font-mono truncate w-12 inline-block">{r.id.split('-')[0]}</span> },
    { header: t.roleTitle || (isRtl ? 'عنوان نقش' : 'Role Title'), field: 'title', width: 'w-48', sortable: true },
    { header: t.sysCode || (isRtl ? 'کد سیستمی' : 'System Code'), field: 'code', width: 'w-32', sortable: true },
    { header: t.startDate || (isRtl ? 'تاریخ شروع' : 'Start Date'), field: 'startDate', width: 'w-32', render: (r) => <span className="dir-ltr font-mono text-xs">{r.startDate || '-'}</span> },
    { header: t.status || (isRtl ? 'وضعیت' : 'Status'), field: 'isActive', width: 'w-24 text-center', render: (r) => <Badge variant={r.isActive ? 'success' : 'neutral'}>{r.isActive ? (t.active || (isRtl ? 'فعال' : 'Active')) : (t.inactive || (isRtl ? 'غیرفعال' : 'Inactive'))}</Badge> },
  ];

  const assignedUsersColumns = [
    { header: t.id || (isRtl ? 'شناسه' : 'ID'), field: 'id', width: 'w-16', render: (r) => <span className="text-[10px] font-mono">{r.id.split('-')[0]}</span> },
    { header: t.username || (isRtl ? 'نام کاربری' : 'Username'), field: 'username', width: 'w-32' },
    { header: t.fullName || (isRtl ? 'نام و نام خانوادگی' : 'Full Name'), field: 'fullName', width: 'w-48', render: (r) => <span className="font-bold text-slate-700">{r.fullName}</span> },
    { header: t.status || (isRtl ? 'وضعیت کاربر' : 'Status'), field: 'isActive', width: 'w-24', render: (r) => <div className="flex justify-center"><Toggle checked={r.isActive} disabled /></div> },
  ];

  return (
    <div className={`flex flex-col h-full bg-slate-50/50 p-4 overflow-hidden ${isRtl ? 'font-vazir' : 'font-sans'}`}>
      <div className="flex items-center justify-between mb-4 shrink-0">
          <div><h1 className="text-xl font-black text-slate-800 flex items-center gap-2"><Shield className="text-indigo-600" size={24}/> {t.roles_title || (isRtl ? 'مدیریت نقش‌ها' : 'Roles Management')}</h1></div>
      </div>

      <FilterSection title={t.advancedSearch || (isRtl ? "جستجوی پیشرفته" : "Advanced Search")} onSearch={() => setAppliedFilters(filterValues)} onClear={() => { setFilterValues({ formIds: [], userIds: [], isActive: 'all' }); setAppliedFilters({ formIds: [], userIds: [], isActive: 'all' }); }} isRtl={isRtl}>
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-600">{t.formName || (isRtl ? 'نام فرم' : 'Form Name')}</label>
            <MultiSelect options={allForms} value={filterValues.formIds} onChange={v => setFilterValues({...filterValues, formIds: v})} placeholder={t.searchForm || (isRtl ? "جستجوی فرم..." : "Search Form...")} />
          </div>
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-600">{t.userName || (isRtl ? 'نام کاربر' : 'User Name')}</label>
            <MultiSelect options={allUsers.map(u => ({ id: u.id, label: u.fullName }))} value={filterValues.userIds} onChange={v => setFilterValues({...filterValues, userIds: v})} placeholder={t.searchUser || (isRtl ? "جستجوی کاربر..." : "Search User...")} />
          </div>
          <SelectField label={t.status || (isRtl ? "وضعیت" : "Status")} value={filterValues.isActive} onChange={e => setFilterValues({...filterValues, isActive: e.target.value})} isRtl={isRtl}>
            <option value="all">{t.optAll || (isRtl ? "همه" : "All")}</option><option value="active">{t.active || (isRtl ? "فعال" : "Active")}</option><option value="inactive">{t.inactive || (isRtl ? "غیرفعال" : "Inactive")}</option>
          </SelectField>
      </FilterSection>

      <div className="flex-1 min-h-0">
          <DataGrid columns={roleColumns} data={filteredRoles} isRtl={isRtl} selectedIds={selectedRows} onSelectAll={(c) => setSelectedRows(c ? roles.map(r => r.id) : [])} onSelectRow={(id, c) => setSelectedRows(p => c ? [...p, id] : p.filter(r => r !== id))} onCreate={handleCreate} onDelete={handleDelete} onDoubleClick={handleEdit}
            actions={(row) => (<><Button variant="ghost" size="iconSm" icon={Edit} onClick={() => handleEdit(row)} title={t.edit || (isRtl ? "ویرایش" : "Edit")} /><Button variant="ghost" size="iconSm" icon={Users} className="text-indigo-600" onClick={() => openUserAssignment(row)} title={t.roleUsers || (isRtl ? "کاربران نقش" : "Role Users")} /><Button variant="ghost" size="iconSm" icon={Lock} className="text-amber-600" onClick={() => openAccessModal(row)} title={t.permissions || (isRtl ? "دسترسی‌ها" : "Permissions")} /></>)}
          />
      </div>

      <Modal isOpen={isRoleModalOpen} onClose={() => setIsRoleModalOpen(false)} title={editingRole ? (t.editRole || (isRtl ? "ویرایش نقش" : "Edit Role")) : (t.newRole || (isRtl ? "نقش جدید" : "New Role"))} size="md" footer={<><Button variant="secondary" onClick={() => setIsRoleModalOpen(false)}>{t.cancel || (isRtl ? "انصراف" : "Cancel")}</Button><Button variant="primary" icon={Save} onClick={saveRole}>{t.save || (isRtl ? "ذخیره" : "Save")}</Button></>}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
               <InputField label={t.roleTitle || (isRtl ? "عنوان نقش" : "Role Title")} value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} isRtl={isRtl} />
               <InputField label={t.sysCode || (isRtl ? "کد سیستمی" : "System Code")} value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} isRtl={isRtl} className="dir-ltr" />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <DatePicker label={t.startDate || (isRtl ? "تاریخ شروع" : "Start Date")} value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} />
               <DatePicker label={t.endDate || (isRtl ? "تاریخ پایان" : "End Date")} value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})} />
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-2">
               <span className="text-[13px] font-bold text-slate-700">{t.roleStatus || (isRtl ? "وضعیت نقش" : "Role Status")}</span>
               <Toggle checked={formData.isActive} onChange={(val) => setFormData({...formData, isActive: val})} label={formData.isActive ? (t.active || (isRtl ? "فعال" : "Active")) : (t.inactive || (isRtl ? "غیرفعال" : "Inactive"))} />
            </div>
          </div>
      </Modal>

      <Modal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} title={`${t.usersWithRole || (isRtl ? 'کاربران دارای نقش' : 'Users with Role')}: ${editingRole?.title}`} size="lg" footer={<Button variant="primary" onClick={() => setIsUserModalOpen(false)}>{t.close || (isRtl ? 'بستن' : 'Close')}</Button>}>
          <div className="flex flex-col h-[500px]">
            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 mb-3 relative z-[60]">
               <label className="text-xs font-bold text-indigo-800 mb-2 block flex items-center gap-2"><UserPlus size={14}/> {t.addUserToRole || (isRtl ? 'افزودن کاربر جدید به این نقش' : 'Add user to this role')}</label>
               <div className="relative">
                  <input value={userSearchTerm} onChange={(e) => { setUserSearchTerm(e.target.value); setShowUserResults(true); }} placeholder={t.searchUserPrompt || (isRtl ? "جستجوی نام کاربری یا نام شخص..." : "Search username or full name...")} className={`w-full h-9 bg-white border border-indigo-200 rounded text-xs outline-none focus:ring-2 focus:ring-indigo-300 transition-all ${isRtl ? 'pr-9 pl-2' : 'pl-9 pr-2'}`} />
                  <Search size={16} className={`absolute top-2.5 text-indigo-400 ${isRtl ? 'right-2.5' : 'left-2.5'}`}/>
                  {showUserResults && userSearchTerm && (
                     <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-y-auto z-[100]">
                        {searchResults.length > 0 ? searchResults.map(user => (
                           <div key={user.id} onClick={() => handleAssignUser(user.id)} className="p-2 hover:bg-indigo-50 cursor-pointer flex items-center justify-between border-b border-slate-50 last:border-0 group transition-colors">
                              <div className="flex flex-col"><span className="text-xs font-bold text-slate-700">{user.fullName}</span><span className="text-[10px] text-slate-400 font-mono">@{user.username}</span></div>
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-600 bg-indigo-100 p-1 rounded"><Plus size={14}/></div>
                           </div>
                        )) : <div className="p-3 text-center text-xs text-slate-400">{t.userNotFoundOrAdded || (isRtl ? 'کاربری یافت نشد یا قبلاً اضافه شده است.' : 'User not found or already added.')}</div>}
                     </div>
                  )}
                  {showUserResults && userSearchTerm && <div className="fixed inset-0 z-[-1]" onClick={() => setShowUserResults(false)}></div>}
               </div>
            </div>
            <div className="flex-1 overflow-hidden border border-slate-200 rounded-lg bg-white relative z-0">
               <DataGrid columns={assignedUsersColumns} data={assignedUsers} isRtl={isRtl} actions={(row) => (<Button variant="ghost" size="iconSm" icon={UserMinus} className="text-red-500 hover:bg-red-50" onClick={() => handleUnassignUser(row.id)} title={t.removeRoleFromUser || (isRtl ? "حذف نقش از کاربر" : "Remove role from user")} />)} />
            </div>
          </div>
      </Modal>

      <Modal isOpen={isAccessModalOpen} onClose={() => setIsAccessModalOpen(false)} title={`${t.managePermsFor || (isRtl ? 'مدیریت دسترسی‌های:' : 'Manage Permissions for:')} ${editingRole?.title}`} size="xl" footer={<><Button variant="secondary" onClick={() => setIsAccessModalOpen(false)}>{t.cancel || (isRtl ? "انصراف" : "Cancel")}</Button><Button variant="primary" icon={Save} onClick={saveAccess}>{t.apply || (isRtl ? "اعمال" : "Apply")}</Button></>}>
          <div className="flex h-[550px] border border-slate-200 rounded-lg overflow-hidden">
            <div className="w-1/3 border-l border-slate-200 bg-slate-50 flex flex-col p-2">
               <TreeView data={dynamicMenu} selectedNodeId={selectedModule?.id} onSelectNode={setSelectedModule} renderNodeContent={renderPermissionNode} isRtl={isRtl} />
            </div>
            <div className="w-2/3 bg-white flex flex-col">
               {selectedModule ? (
                  <>
                     <div className="p-4 border-b border-slate-100 flex justify-between items-center"><h3 className="font-bold text-sm">{selectedModule.label[isRtl ? 'fa' : 'en']}</h3><div className="flex gap-1"><Button variant="outline" size="sm" icon={Trash2} onClick={() => handleBulkPermission('revoke')}>{t.revokeAll || (isRtl ? 'حذف همه' : 'Revoke All')}</Button><Button variant="success" size="sm" icon={Zap} onClick={() => handleBulkPermission('grant')}>{t.fullAccess || (isRtl ? 'دسترسی کامل' : 'Full Access')}</Button></div></div>
                     <div className="flex-1 overflow-y-auto p-5 space-y-6">
                        <div>
                           <div className="text-[11px] font-bold text-slate-500 uppercase mb-2">{t.actions || (isRtl ? 'عملیات' : 'Actions')}</div>
                           <SelectionGrid items={AVAILABLE_ACTIONS} selectedIds={tempPermissions[selectedModule.id]?.actions || []} onToggle={(id) => updateAction(selectedModule.id, id)} />
                        </div>
                        {DATA_SCOPES[selectedModule.id] && (
                           <div className="pt-4 border-t border-slate-100">
                              <div className="text-[11px] font-bold text-slate-500 uppercase mb-2">{t.dataAccess || (isRtl ? 'داده‌ها' : 'Data Access')}</div>
                              {DATA_SCOPES[selectedModule.id].map(scope => (
                                 <div key={scope.id} className="mb-3">
                                    <span className="text-xs font-bold block mb-1">{scope.label}:</span>
                                    <div className="flex flex-wrap gap-2">{scope.options.map(o => <ToggleChip key={o.value} label={o.label} checked={tempPermissions[selectedModule.id]?.dataScopes?.[scope.id]?.includes(o.value)} onClick={() => updateScope(selectedModule.id, scope.id, o.value)} />)}</div>
                                 </div>
                              ))}
                           </div>
                        )}
                     </div>
                  </>
               ) : <div className="flex items-center justify-center h-full text-slate-400 text-sm">{t.selectItem || (isRtl ? 'یک آیتم انتخاب کنید' : 'Select an item')}</div>}
            </div>
          </div>
      </Modal>
    </div>
  );
};

window.Roles = Roles;
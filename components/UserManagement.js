/* Filename: components/UserManagement.js */
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Users, Search, Plus, Edit, Trash2, Key, Shield, 
  Check, X, RefreshCw, Briefcase, ChevronLeft, 
  Lock, FileText, Filter, CheckSquare, Zap, UserPlus, UserMinus, ChevronDown, Info
} from 'lucide-react';

const UserManagement = ({ t, isRtl }) => {
  const UI = window.UI || {};
  const { 
    Button, InputField, SelectField, Toggle, Badge, DataGrid, 
    FilterSection, Modal, SelectionGrid, ToggleChip 
  } = UI;
  const supabase = window.supabase;

  if (!Button) return <div className="p-4">Loading UI...</div>;

  // --- INTERNAL COMPONENT: MULTI-SELECT WITH SEARCH ---
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
    const removeTag = (e, id) => { e.stopPropagation(); onChange(value.filter(v => v !== id)); };

    return (
      <div className="relative" ref={containerRef}>
        <div className="min-h-[32px] bg-white border border-slate-200 rounded-md flex flex-wrap items-center gap-1 p-1 cursor-pointer focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-100 transition-all" onClick={() => setIsOpen(!isOpen)}>
          {value.length === 0 && <span className="text-slate-400 text-[11px] px-1 select-none">{placeholder}</span>}
          {value.map(id => {
            const opt = options.find(o => o.id === id);
            return (
              <span key={id} className="bg-indigo-50 text-indigo-700 border border-indigo-100 rounded px-1.5 py-0.5 text-[10px] flex items-center gap-1">
                {opt?.label}
                <span onClick={(e) => removeTag(e, id)} className="hover:text-red-500 rounded-full"><X size={10}/></span>
              </span>
            );
          })}
          <div className={`px-1 text-slate-400 ${isRtl ? 'mr-auto' : 'ml-auto'}`}><ChevronDown size={14}/></div>
        </div>
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg z-[60] max-h-48 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
            <div className="p-2 border-b border-slate-50 sticky top-0 bg-white">
              <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder={t.searchMenu || (isRtl ? "جستجو..." : "Search...")} className="w-full text-[11px] border border-slate-200 rounded px-2 py-1 outline-none focus:border-indigo-400" autoFocus onClick={(e) => e.stopPropagation()} />
            </div>
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
  const [partiesList, setPartiesList] = useState([]);
  const [rolesList, setRolesList] = useState([]);
  const [users, setUsers] = useState([]);
  const [globalRolePermissions, setGlobalRolePermissions] = useState({});
  const [allSystemForms, setAllSystemForms] = useState([]);

  // --- UI STATES ---
  const [selectedRows, setSelectedRows] = useState([]);
  const [filterValues, setFilterValues] = useState({ username: '', roleIds: [], isActive: 'all' });
  const [appliedFilters, setAppliedFilters] = useState({ username: '', roleIds: [], isActive: 'all' });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userFormData, setUserFormData] = useState({ username: '', partyId: '', userType: '', isActive: true, password: '' });

  const [isPermModalOpen, setIsPermModalOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState(null);
  const [assignedRoles, setAssignedRoles] = useState([]); 
  const [directPermissions, setDirectPermissions] = useState([]); 
  const [selectedPermDetail, setSelectedPermDetail] = useState(null);
  const [activeSourceId, setActiveSourceId] = useState(null); 
  
  const [formSearchTerm, setFormSearchTerm] = useState('');
  const [showFormResults, setShowFormResults] = useState(false);
  
  const [roleSearchTerm, setRoleSearchTerm] = useState('');
  const [isRoleSearchOpen, setIsRoleSearchOpen] = useState(false);

  // --- FETCH DATA ---
  useEffect(() => {
    fetchData();
  }, [isRtl]);

  const fetchData = async () => {
    const { data: resData } = await supabase.schema('gen').from('resources').select('*');
    if (resData) {
      const map = new Map();
      const roots = [];
      const forms = [];
      resData.forEach(r => map.set(r.id, { id: r.code, label: { fa: r.title_fa, en: r.title_en }, type: r.type, parent_id: r.parent_id, children: [] }));
      resData.forEach(r => {
        const node = map.get(r.id);
        if (r.parent_id && map.has(r.parent_id)) map.get(r.parent_id).children.push(node);
        else roots.push(node);
      });
      const traverse = (nodes, pathPrefix = '') => {
        nodes.forEach(node => {
          const currentPath = pathPrefix ? `${pathPrefix} / ${node.label[isRtl ? 'fa' : 'en']}` : node.label[isRtl ? 'fa' : 'en'];
          if (node.type === 'form') forms.push({ ...node, fullPath: currentPath });
          if (node.children.length > 0) traverse(node.children, currentPath);
        });
      };
      traverse(roots);
      setAllSystemForms(forms);
    }

    const { data: pData } = await supabase.schema('gen').from('parties').select('*');
    if (pData) setPartiesList(pData.map(p => ({ id: p.id, name: p.name, code: p.code })));

    const { data: rData } = await supabase.schema('gen').from('roles').select('*');
    if (rData) setRolesList(rData);

    const { data: permData } = await supabase.schema('gen').from('permissions').select('*').not('role_id', 'is', null);
    if (permData) {
      const rolePerms = {};
      permData.forEach(p => {
        if (!rolePerms[p.role_id]) rolePerms[p.role_id] = [];
        rolePerms[p.role_id].push({ formId: p.resource_code, actions: p.actions || [], dataScopes: p.data_scopes || {} });
      });
      setGlobalRolePermissions(rolePerms);
    }

    const { data: uData } = await supabase.schema('gen').from('users').select('*').order('created_at', { ascending: false });
    const { data: urData } = await supabase.schema('gen').from('user_roles').select('*');
    
    if (uData && urData) {
      const mappedUsers = uData.map(u => ({
        id: u.id, username: u.username, partyId: u.party_id, userType: u.user_type, isActive: u.is_active,
        lastLogin: u.last_login || '-', fullName: u.full_name, roleIds: urData.filter(ur => ur.user_id === u.id).map(ur => ur.role_id)
      }));
      setUsers(mappedUsers);
    }
  };

  const getPartyName = (id) => {
    if (!id) return t.unknown || (isRtl ? 'نامشخص' : 'Unknown');
    const p = partiesList.find(p => p.id === id);
    return p ? `${p.name} (${p.code})` : (t.unknown || (isRtl ? 'نامشخص' : 'Unknown'));
  };

  const effectivePermissions = useMemo(() => {
    const map = new Map();
    const getForm = (id) => allSystemForms.find(f => f.id === id);

    assignedRoles.forEach(roleId => {
      const rolePerms = globalRolePermissions[roleId] || [];
      const roleInfo = rolesList.find(r => r.id === roleId);
      
      rolePerms.forEach(p => {
        const formInfo = getForm(p.formId);
        if (!formInfo) return; 
        if (!map.has(p.formId)) map.set(p.formId, { id: p.formId, path: formInfo.fullPath, breakdown: [] });
        map.get(p.formId).breakdown.push({ sourceId: `role_${roleId}`, type: 'role', label: roleInfo?.title || (t.unknownRole || (isRtl ? 'نقش نامشخص' : 'Unknown Role')), actions: p.actions, scopes: p.dataScopes });
      });
    });

    directPermissions.forEach(p => {
      const formInfo = getForm(p.formId);
      if (!formInfo) return;
      if (!map.has(p.formId)) map.set(p.formId, { id: p.formId, path: formInfo.fullPath, breakdown: [] });
      const existing = map.get(p.formId).breakdown.find(b => b.type === 'direct');
      if (existing) {
         existing.actions = p.actions || []; existing.scopes = p.dataScopes || {};
      } else {
         map.get(p.formId).breakdown.push({ sourceId: 'direct', type: 'direct', label: t.direct || (isRtl ? 'مستقیم' : 'Direct'), actions: p.actions || [], scopes: p.dataScopes || {} });
      }
    });

    return Array.from(map.values());
  }, [assignedRoles, directPermissions, allSystemForms, globalRolePermissions, rolesList, isRtl]);

  useEffect(() => {
    if (selectedPermDetail) {
      const updated = effectivePermissions.find(p => p.id === selectedPermDetail.id);
      if (updated) {
        setSelectedPermDetail(updated);
        const sourceStillExists = updated.breakdown.find(b => b.sourceId === activeSourceId);
        if (!sourceStillExists && updated.breakdown.length > 0) setActiveSourceId(updated.breakdown[0].sourceId);
      }
    }
  }, [effectivePermissions]);

  // --- HANDLERS ---
  const handleCreate = () => {
    setEditingUser(null);
    setUserFormData({ username: '', partyId: '', userType: t.sysUser || (isRtl ? 'کاربر سیستم' : 'System User'), isActive: true, password: '' });
    setIsEditModalOpen(true);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setUserFormData({ username: user.username, partyId: user.partyId, userType: user.userType, isActive: user.isActive, password: '' });
    setIsEditModalOpen(true);
  };

  const handleSaveUser = async () => {
    if (!userFormData.username || !userFormData.partyId) return alert(t.reqUsernameParty || (isRtl ? 'لطفا نام کاربری و طرف حساب را مشخص کنید.' : 'Please provide Username and Party.'));
    if (!editingUser && !userFormData.password) return alert(t.reqPassword || (isRtl ? 'لطفا رمز عبور را وارد کنید.' : 'Please provide Password.'));

    const fullName = getPartyName(userFormData.partyId).split(' (')[0];

    if (editingUser) {
      const { error } = await supabase.schema('gen').from('users').update({
        username: userFormData.username, party_id: userFormData.partyId, user_type: userFormData.userType,
        is_active: userFormData.isActive, full_name: fullName
      }).eq('id', editingUser.id);
      if (error) return alert(t.errUpdateUser || (isRtl ? 'خطا در ویرایش کاربر' : 'Error updating user.'));
    } else {
      const { error } = await supabase.rpc('create_user_with_hash', {
        p_username: userFormData.username, p_password: userFormData.password, p_full_name: fullName,
        p_user_type: userFormData.userType, p_email: '', p_is_active: userFormData.isActive, p_party_id: userFormData.partyId
      }, { schema: 'gen' });
      if (error) return alert(t.errCreateUser || (isRtl ? 'خطا در ثبت کاربر' : 'Error creating user.'));
    }
    
    setIsEditModalOpen(false);
    fetchData();
  };

  const handleResetPassword = async (user) => {
    const msg = isRtl ? `آیا مطمئن هستید که می‌خواهید رمز عبور "${user.username}" را بازنشانی کنید؟` : `Are you sure you want to reset password for "${user.username}"?`;
    if (confirm(msg)) {
      const { error } = await supabase.rpc('reset_user_password', { p_user_id: user.id, p_new_password: '123456' }, { schema: 'gen' });
      if (error) alert(t.errOperation || (isRtl ? 'خطا در عملیات' : 'Operation failed.')); else alert(t.passResetSuccess || (isRtl ? 'رمز عبور به 123456 تغییر یافت.' : 'Password reset to 123456.'));
    }
  };

  const handleDelete = async (ids) => {
    const msg = isRtl ? `آیا از حذف ${ids.length} کاربر اطمینان دارید؟` : `Delete ${ids.length} users?`;
    if (confirm(msg)) {
      await supabase.schema('gen').from('users').delete().in('id', ids);
      fetchData();
      setSelectedRows([]);
    }
  };

  const handleOpenPermissions = async (user) => {
    setViewingUser(user);
    setAssignedRoles(user.roleIds || []);
    const { data } = await supabase.schema('gen').from('permissions').select('*').eq('user_id', user.id);
    if (data) setDirectPermissions(data.map(d => ({ formId: d.resource_code, actions: d.actions || [], dataScopes: d.data_scopes || {} })));
    else setDirectPermissions([]);
    
    setSelectedPermDetail(null);
    setActiveSourceId(null);
    setFormSearchTerm('');
    setRoleSearchTerm('');
    setIsPermModalOpen(true);
  };

  const handleCloseAndSavePermissions = async () => {
    if (!viewingUser) return;
    await supabase.schema('gen').from('user_roles').delete().eq('user_id', viewingUser.id);
    if (assignedRoles.length > 0) {
      await supabase.schema('gen').from('user_roles').insert(assignedRoles.map(rId => ({ user_id: viewingUser.id, role_id: rId })));
    }

    const { error: delErr } = await supabase.schema('gen').from('permissions').delete().eq('user_id', viewingUser.id);
    if (delErr) console.error(delErr);

    const validDirect = directPermissions.filter(p => p.actions.length > 0 || Object.keys(p.dataScopes).length > 0);
    if (validDirect.length > 0) {
      const { error: insErr } = await supabase.schema('gen').from('permissions').insert(validDirect.map(p => ({
        user_id: viewingUser.id, resource_code: p.formId, actions: p.actions, data_scopes: p.dataScopes
      })));
      if (insErr) {
        console.error(insErr);
        alert(t.errSavePerms || (isRtl ? 'خطا در ذخیره دسترسی‌ها' : 'Error saving permissions.'));
        return;
      }
    }
    setIsPermModalOpen(false);
    fetchData();
  };

  const handleAddRole = (roleId) => {
    if (roleId && !assignedRoles.includes(roleId)) setAssignedRoles(prev => [...prev, roleId]);
    setIsRoleSearchOpen(false);
    setRoleSearchTerm('');
  };

  const handleRemoveRole = (roleId) => setAssignedRoles(prev => prev.filter(id => id !== roleId));

  const handleAddDirectForm = (form) => {
    if (directPermissions.find(p => p.formId === form.id)) return alert(t.alreadyAdded || (isRtl ? 'قبلاً اضافه شده است.' : 'Already added.'));
    setDirectPermissions(prev => [...prev, { formId: form.id, actions: [], dataScopes: {} }]);
    setFormSearchTerm('');
    setShowFormResults(false);
  };

  const handleSelectSource = (row, source) => { setSelectedPermDetail(row); setActiveSourceId(source.sourceId); };

  const handleUpdateDirectPermission = (formId, type, key, value) => {
    setDirectPermissions(prev => {
        const existingDirect = prev.find(p => p.formId === formId);
        let targetEntry = existingDirect ? { ...existingDirect } : { formId: formId, actions: [], dataScopes: {} };
        if (type === 'action') {
            const has = targetEntry.actions.includes(key);
            targetEntry.actions = has ? targetEntry.actions.filter(a => a !== key) : [...targetEntry.actions, key];
        } else if (type === 'scope') {
            const currentScopes = targetEntry.dataScopes[key] || [];
            const has = currentScopes.includes(value);
            targetEntry.dataScopes = { ...targetEntry.dataScopes, [key]: has ? currentScopes.filter(v => v !== value) : [...currentScopes, value] };
        }
        return existingDirect ? prev.map(p => p.formId === formId ? targetEntry : p) : [...prev, targetEntry];
    });
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchName = !appliedFilters.username || user.username.toLowerCase().includes(appliedFilters.username.toLowerCase());
      let matchRole = true;
      if (appliedFilters.roleIds && appliedFilters.roleIds.length > 0) matchRole = user.roleIds && appliedFilters.roleIds.some(rId => user.roleIds.includes(rId));
      return matchName && matchRole;
    });
  }, [users, appliedFilters]);

  const formSearchResults = useMemo(() => formSearchTerm ? allSystemForms.filter(f => f.fullPath.includes(formSearchTerm)) : [], [formSearchTerm, allSystemForms]);
  const roleSearchResults = useMemo(() => rolesList.filter(r => !assignedRoles.includes(r.id) && r.title.toLowerCase().includes(roleSearchTerm.toLowerCase())), [roleSearchTerm, assignedRoles, rolesList]);

  // --- COLUMNS & OPTIONS ---
  const columns = [
    { header: t.id || (isRtl ? 'شناسه' : 'ID'), field: 'id', width: 'w-16', render: (r) => <span className="text-[10px] text-slate-400 font-mono truncate w-12 inline-block">{r.id.split('-')[0]}</span> },
    { header: t.username || (isRtl ? 'نام کاربری' : 'Username'), field: 'username', width: 'w-32', sortable: true },
    { header: t.partyName || (isRtl ? 'نام شخص / شرکت' : 'Party / Company'), field: 'partyId', width: 'w-48', render: (row) => <span className="font-bold text-slate-700">{getPartyName(row.partyId)}</span> },
    { header: t.userType || (isRtl ? 'نوع کاربری' : 'User Type'), field: 'userType', width: 'w-32', sortable: true },
    { header: t.roles || (isRtl ? 'نقش‌ها' : 'Roles'), field: 'roleIds', width: 'w-48', render: (r) => (
        <div className="flex flex-wrap gap-1">
            {r.roleIds && r.roleIds.map(rid => {
                const role = rolesList.find(x => x.id === rid);
                return role ? <Badge key={rid} variant="neutral" className="px-1 py-0 text-[9px]">{role.title}</Badge> : null;
            })}
        </div>
    )},
    { header: t.lastLogin || (isRtl ? 'آخرین ورود' : 'Last Login'), field: 'lastLogin', width: 'w-32', render: (r) => <span className="dir-ltr font-mono text-xs text-slate-500">{r.lastLogin}</span> },
    { header: t.status || (isRtl ? 'وضعیت' : 'Status'), field: 'isActive', width: 'w-24 text-center', render: (r) => <Badge variant={r.isActive ? 'success' : 'neutral'}>{r.isActive ? (t.active || (isRtl ? 'فعال' : 'Active')) : (t.inactive || (isRtl ? 'غیرفعال' : 'Inactive'))}</Badge> },
  ];

  const permColumns = [
    { header: t.formPath || (isRtl ? 'مسیر فرم' : 'Form Path'), field: 'path', width: 'w-full', render: (r) => <div className="text-[11px] font-medium flex items-center gap-2"><FileText size={12} className="text-indigo-400"/>{r.path}</div> },
    { header: t.accessSource || (isRtl ? 'منبع دسترسی (برای جزئیات کلیک کنید)' : 'Access Source (click for details)'), field: 'source', width: 'w-72', render: (r) => (
       <div className="flex flex-wrap gap-1">
          {r.breakdown.map((s, idx) => {
             const isActive = selectedPermDetail?.id === r.id && activeSourceId === s.sourceId;
             return (
                 <div key={idx} onClick={(e) => { e.stopPropagation(); handleSelectSource(r, s); }}
                    className={`cursor-pointer px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all flex items-center gap-1
                        ${isActive ? (s.type === 'role' ? 'bg-purple-100 text-purple-700 border-purple-300 ring-1 ring-purple-200' : 'bg-blue-100 text-blue-700 border-blue-300 ring-1 ring-blue-200')
                           : (s.type === 'role' ? 'bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-100 hover:border-purple-200' : 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100 hover:border-blue-200')}`}
                 >
                    {s.type === 'role' ? <Shield size={10}/> : <Zap size={10}/>} {s.type === 'role' ? `${s.label}` : (t.directAccess || (isRtl ? 'دسترسی مستقیم' : 'Direct Access'))}
                 </div>
             )
          })}
       </div>
    )},
  ];

  const AVAILABLE_ACTIONS = [
      { id: 'create', label: t.actCreate || (isRtl ? 'ایجاد' : 'Create') }, { id: 'edit', label: t.actEdit || (isRtl ? 'ویرایش' : 'Edit') }, { id: 'view', label: t.actView || (isRtl ? 'مشاهده' : 'View') }, { id: 'delete', label: t.actDelete || (isRtl ? 'حذف' : 'Delete') },
      { id: 'print', label: t.actPrint || (isRtl ? 'چاپ' : 'Print') }, { id: 'approve', label: t.actApprove || (isRtl ? 'تایید' : 'Approve') }, { id: 'export', label: t.actExport || (isRtl ? 'خروجی' : 'Export') }, { id: 'share', label: t.actShare || (isRtl ? 'اشتراک' : 'Share') },
  ];

  const DATA_SCOPES = { 
     'doc_list': { label: t.dsDocType || (isRtl ? 'نوع سند' : 'Doc Type'), options: [{value:'عمومی', label: t.dsDocGeneral || (isRtl ? 'عمومی' : 'General')}, {value:'افتتاحیه', label: t.dsDocOpening || (isRtl ? 'افتتاحیه' : 'Opening')}] },
     'status': { label: t.dsStatus || (isRtl ? 'وضعیت' : 'Status'), options: [{value:'موقت', label: t.dsStatusTemp || (isRtl ? 'موقت' : 'Temp')}, {value:'قطعی', label: t.dsStatusFinal || (isRtl ? 'قطعی' : 'Final')}] }
  };

  return (
    <div className={`flex flex-col h-full bg-slate-50/50 p-4 overflow-hidden ${isRtl ? 'font-vazir' : 'font-sans'}`}>
      <div className="flex items-center justify-between mb-4 shrink-0">
         <h1 className="text-xl font-black text-slate-800 flex items-center gap-2"><Users className="text-indigo-600" size={24}/> {t.user_management || (isRtl ? 'مدیریت کاربران' : 'User Management')}</h1>
      </div>

      <FilterSection title={t.advancedSearch || (isRtl ? "جستجوی پیشرفته" : "Advanced Search")} onSearch={() => setAppliedFilters(filterValues)} onClear={() => {setFilterValues({username: '', roleIds: []}); setAppliedFilters({username: '', roleIds: []})}} isRtl={isRtl}>
         <InputField label={t.username || (isRtl ? "نام کاربری" : "Username")} value={filterValues.username} onChange={(e) => setFilterValues({...filterValues, username: e.target.value})} placeholder={t.search || (isRtl ? "جستجو..." : "Search...")} isRtl={isRtl} />
         <div>
           <label className="block text-[11px] font-bold text-slate-600 mb-1">{t.userRoles || (isRtl ? 'نقش‌های کاربری' : 'User Roles')}</label>
           <MultiSelect options={rolesList.map(r => ({id: r.id, label: r.title}))} value={filterValues.roleIds} onChange={(vals) => setFilterValues({...filterValues, roleIds: vals})} placeholder={t.selectRoles || (isRtl ? "انتخاب نقش‌ها..." : "Select Roles...")} />
         </div>
      </FilterSection>

      <div className="flex-1 min-h-0">
         <DataGrid title={t.usersList || (isRtl ? "لیست کاربران" : "Users List")} columns={columns} data={filteredUsers} isRtl={isRtl} selectedIds={selectedRows} onSelectAll={(c) => setSelectedRows(c ? filteredUsers.map(r => r.id) : [])} onSelectRow={(id, c) => setSelectedRows(p => c ? [...p, id] : p.filter(r => r !== id))} onCreate={handleCreate} onDelete={handleDelete}
            actions={(row) => (<><Button variant="ghost" size="iconSm" icon={Edit} onClick={() => handleEdit(row)} title={t.edit || (isRtl ? "ویرایش" : "Edit")} /><Button variant="ghost" size="iconSm" icon={Shield} className="text-purple-600" onClick={() => handleOpenPermissions(row)} title={t.permissions || (isRtl ? "دسترسی‌ها" : "Permissions")} /><Button variant="ghost" size="iconSm" icon={RefreshCw} className="text-amber-600" onClick={() => handleResetPassword(row)} title={t.resetPass || (isRtl ? "ریست رمز" : "Reset Password")} /></>)}
         />
      </div>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={editingUser ? (t.editUser || (isRtl ? "ویرایش کاربر" : "Edit User")) : (t.newUser || (isRtl ? "تعریف کاربر جدید" : "New User"))} size="md" footer={<><Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>{t.cancel || (isRtl ? "انصراف" : "Cancel")}</Button><Button variant="primary" icon={Check} onClick={handleSaveUser}>{t.save || (isRtl ? "ذخیره" : "Save")}</Button></>}>
         <div className="grid grid-cols-2 gap-4">
            <InputField label={t.username || (isRtl ? "نام کاربری" : "Username")} value={userFormData.username} onChange={(e) => setUserFormData({...userFormData, username: e.target.value})} isRtl={isRtl} className="dir-ltr" />
            <SelectField label={t.userType || (isRtl ? "نوع کاربری" : "User Type")} value={userFormData.userType} onChange={(e) => setUserFormData({...userFormData, userType: e.target.value})} isRtl={isRtl}>
              <option value={t.sysAdmin || (isRtl ? "مدیر سیستم" : "System Admin")}>{t.sysAdmin || (isRtl ? "مدیر سیستم" : "System Admin")}</option>
              <option value={t.sysUser || (isRtl ? "کاربر سیستم" : "System User")}>{t.sysUser || (isRtl ? "کاربر سیستم" : "System User")}</option>
            </SelectField>
            <div className="col-span-2 grid grid-cols-2 gap-4">
                {!editingUser ? <InputField label={t.password || (isRtl ? "رمز عبور" : "Password")} type="password" value={userFormData.password} onChange={(e) => setUserFormData({...userFormData, password: e.target.value})} isRtl={isRtl} className="dir-ltr" placeholder="********" /> : <div className="opacity-50"><InputField label={t.password || (isRtl ? "رمز عبور" : "Password")} disabled value="********" isRtl={isRtl} /></div>}
                <SelectField label={t.linkToParty || (isRtl ? "اتصال به شخص / طرف حساب" : "Link to Party")} value={userFormData.partyId} onChange={(e) => setUserFormData({...userFormData, partyId: e.target.value})} isRtl={isRtl}><option value="">-- {t.select || (isRtl ? "انتخاب کنید" : "Select")} --</option>{partiesList.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}</SelectField>
            </div>
            <div className="col-span-2 flex items-center justify-between pt-2">
               <span className="text-xs font-bold text-slate-700">{t.accountStatus || (isRtl ? "وضعیت حساب" : "Account Status")}:</span>
               <Toggle checked={userFormData.isActive} onChange={(val) => setUserFormData({...userFormData, isActive: val})} label={userFormData.isActive ? (t.active || (isRtl ? "فعال" : "Active")) : (t.inactive || (isRtl ? "غیرفعال" : "Inactive"))} />
            </div>
         </div>
      </Modal>

      <Modal isOpen={isPermModalOpen} onClose={() => setIsPermModalOpen(false)} title={`${t.managePermsFor || (isRtl ? 'مدیریت دسترسی‌های:' : 'Manage Permissions for:')} ${viewingUser?.username}`} size="xl" footer={<Button variant="primary" onClick={handleCloseAndSavePermissions}>{t.confirmAndClose || (isRtl ? 'تایید و بستن' : 'Confirm & Close')}</Button>}>
         <div className="flex flex-col h-[600px]">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-3 flex items-center justify-between">
               <div className="flex items-center gap-2 overflow-x-auto">
                  <Shield size={16} className="text-purple-600 shrink-0"/>
                  <span className="text-xs font-bold text-slate-700 shrink-0">{t.assignedRoles || (isRtl ? 'نقش‌های تخصیص یافته:' : 'Assigned Roles:')}</span>
                  <div className="flex gap-1 mr-2">
                     {assignedRoles.map(rId => {
                        const role = rolesList.find(r => r.id === rId);
                        return (
                           <div key={rId} className="flex items-center gap-1 bg-white border border-purple-200 text-purple-700 px-2 py-1 rounded-md text-[11px] font-bold shadow-sm whitespace-nowrap">
                              {role?.title}
                              <button onClick={() => handleRemoveRole(rId)} className="hover:text-red-500 rounded-full p-0.5"><X size={10}/></button>
                           </div>
                        );
                     })}
                     {assignedRoles.length === 0 && <span className="text-[10px] text-slate-400 italic mt-1">{t.noRoles || (isRtl ? 'بدون نقش' : 'No roles')}</span>}
                  </div>
               </div>
               <div className="relative shrink-0 w-64">
                   <div className="flex items-center border border-slate-300 rounded bg-white px-2 h-8 cursor-text" onClick={() => setIsRoleSearchOpen(!isRoleSearchOpen)}>
                       <input className="w-full text-[11px] outline-none" placeholder={t.addRoleSearch || (isRtl ? "افزودن نقش (جستجو)..." : "Add role (search)...")} value={roleSearchTerm} onChange={(e) => { setRoleSearchTerm(e.target.value); setIsRoleSearchOpen(true); }} />
                       <ChevronDown size={14} className="text-slate-400"/>
                   </div>
                   {isRoleSearchOpen && (
                       <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded shadow-lg z-[60] max-h-40 overflow-y-auto">
                           {roleSearchResults.length > 0 ? roleSearchResults.map(r => (
                               <div key={r.id} onClick={() => handleAddRole(r.id)} className="px-3 py-2 hover:bg-purple-50 cursor-pointer text-[11px] text-slate-700 border-b border-slate-50">{r.title}</div>
                           )) : <div className="p-2 text-center text-slate-400 text-[10px]">{t.noRoleFound || (isRtl ? 'نقشی یافت نشد' : 'Role not found')}</div>}
                       </div>
                   )}
                   {isRoleSearchOpen && <div className="fixed inset-0 z-[-1]" onClick={() => setIsRoleSearchOpen(false)}></div>}
               </div>
            </div>

            <div className="flex flex-1 border border-slate-200 rounded-lg overflow-hidden">
               <div className={`${selectedPermDetail ? 'w-1/2' : 'w-full'} flex flex-col transition-all duration-300 bg-white relative`}>
                  <div className="p-2 border-b border-slate-100 bg-white relative z-[50]">
                     <div className="relative">
                        <input value={formSearchTerm} onChange={(e) => { setFormSearchTerm(e.target.value); setShowFormResults(true); }} placeholder={t.addDirectPerm || (isRtl ? "افزودن دسترسی مستقیم (نام فرم را جستجو کنید)..." : "Add direct perm (search form)...")} className={`w-full h-9 bg-slate-50 border border-slate-200 rounded text-xs outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 transition-all ${isRtl ? 'pr-8 pl-2' : 'pl-8 pr-2'}`} />
                        <Search size={14} className={`absolute top-2.5 text-slate-400 ${isRtl ? 'right-2.5' : 'left-2.5'}`}/>
                        {showFormResults && formSearchTerm && (
                           <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded shadow-xl max-h-48 overflow-y-auto z-[100]">
                              {formSearchResults.length > 0 ? formSearchResults.map(f => (
                                 <div key={f.id} onClick={() => handleAddDirectForm(f)} className="p-2 hover:bg-indigo-50 cursor-pointer text-xs border-b border-slate-50 last:border-0">
                                    <div className="font-bold text-slate-700">{f.label[isRtl ? 'fa' : 'en']}</div>
                                    <div className="text-[10px] text-slate-400">{f.fullPath}</div>
                                 </div>
                              )) : <div className="p-2 text-xs text-slate-400 text-center">{t.noItemsFound || (isRtl ? "موردی یافت نشد." : "No items found.")}</div>}
                           </div>
                        )}
                        {showFormResults && formSearchTerm && <div className="fixed inset-0 z-[-1]" onClick={() => setShowFormResults(false)}></div>}
                     </div>
                  </div>
                  <div className="flex-1 overflow-hidden z-0">
                     <DataGrid columns={permColumns} data={effectivePermissions} isRtl={isRtl}
                        onSelectRow={(id) => { const item = effectivePermissions.find(p => p.id === id); if(item) { setSelectedPermDetail(item); if(item.breakdown.length > 0) setActiveSourceId(item.breakdown[0].sourceId); } }}
                        actions={(row) => (<div className="flex gap-1"><Button variant="ghost" size="iconSm" icon={ChevronLeft} onClick={() => { setSelectedPermDetail(row); if(row.breakdown.length > 0) setActiveSourceId(row.breakdown[0].sourceId); }} className={selectedPermDetail?.id === row.id ? 'bg-indigo-50 text-indigo-700' : ''} /></div>)}
                     />
                  </div>
               </div>

               {selectedPermDetail && (
                  <div className="w-1/2 border-r border-slate-200 bg-slate-50 flex flex-col animate-in slide-in-from-right-5 duration-200 relative shadow-xl z-10">
                     <div className="absolute top-2 left-2"><button onClick={() => setSelectedPermDetail(null)} className="p-1 hover:bg-slate-200 rounded text-slate-500"><X size={14}/></button></div>
                     <div className="p-4 border-b border-slate-200 bg-white">
                        <h3 className="font-black text-slate-800 text-sm mb-1">{selectedPermDetail.path.split('/').pop().trim()}</h3>
                        <div className="text-[11px] text-slate-500 mb-2">{selectedPermDetail.path}</div>
                     </div>
                     <div className="p-5 flex-1 overflow-y-auto space-y-4">
                        {(() => {
                           const activeSource = selectedPermDetail.breakdown.find(b => b.sourceId === activeSourceId);
                           if (!activeSource) return <div className="text-center text-slate-400 text-xs mt-10">{t.selectSourcePrompt || (isRtl ? 'لطفا یکی از منابع دسترسی (بج‌های رنگی) را از لیست انتخاب کنید.' : 'Please select a source (colored badges) from the list.')}</div>;
                           const isReadOnly = activeSource.type === 'role';
                           return (
                              <>
                                 <div className={`p-3 rounded border mb-2 flex items-center gap-2 ${isReadOnly ? 'bg-purple-50 border-purple-100 text-purple-800' : 'bg-blue-50 border-blue-100 text-blue-800'}`}>
                                     {isReadOnly ? <Shield size={16}/> : <Edit size={16}/>}
                                     <div className="font-bold text-xs">{t.source || (isRtl ? 'منبع:' : 'Source:')} {activeSource.type === 'role' ? `${t.role || (isRtl ? 'نقش' : 'Role')} ${activeSource.label}` : (t.directAccess || (isRtl ? 'دسترسی مستقیم' : 'Direct Access'))}</div>
                                 </div>
                                 {isReadOnly && <div className="flex items-start gap-2 text-[10px] text-slate-500 bg-slate-100 p-2 rounded"><Info size={14} className="shrink-0 mt-0.5"/>{t.readOnlyPermInfo || (isRtl ? 'این دسترسی‌ها از نقش به ارث رسیده‌اند و در اینجا قابل تغییر نیستند.' : 'These permissions are inherited from the role and cannot be changed here.')}</div>}
                                 <div>
                                    <div className="text-[11px] font-bold text-slate-500 uppercase mb-3">{t.allowedActions || (isRtl ? 'عملیات مجاز' : 'Allowed Actions')}</div>
                                    {isReadOnly ? (
                                        <div className="flex flex-wrap gap-2">
                                            {activeSource.actions.map(act => { const label = AVAILABLE_ACTIONS.find(a => a.id === act)?.label || act; return <Badge key={act} variant="success">{label}</Badge> })}
                                            {activeSource.actions.length === 0 && <span className="text-slate-400 text-xs">{t.noActionsAllowed || (isRtl ? 'هیچ عملیاتی مجاز نیست' : 'No actions allowed')}</span>}
                                        </div>
                                    ) : (
                                        <SelectionGrid items={AVAILABLE_ACTIONS} selectedIds={activeSource.actions || []} onToggle={(id) => handleUpdateDirectPermission(selectedPermDetail.id, 'action', id)} columns={3} />
                                    )}
                                 </div>
                                 <div className="pt-4 border-t border-slate-200">
                                    <div className="text-[11px] font-bold text-slate-500 uppercase mb-3">{t.dataAccess || (isRtl ? 'دسترسی داده' : 'Data Access')}</div>
                                    {Object.entries(DATA_SCOPES).map(([key, def]) => (
                                        <div key={key} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm mb-3">
                                            <span className="text-[11px] font-bold block mb-2 text-slate-700">{def.label}:</span>
                                            <div className="flex flex-wrap gap-2">
                                                {def.options.map(opt => {
                                                    const hasAccess = activeSource.scopes?.[key]?.includes(opt.value);
                                                    if (isReadOnly) return hasAccess ? <Badge key={opt.value} variant="info">{opt.label}</Badge> : null;
                                                    return <ToggleChip key={opt.value} label={opt.label} checked={hasAccess} onClick={() => handleUpdateDirectPermission(selectedPermDetail.id, 'scope', key, opt.value)} colorClass="indigo" />
                                                })}
                                                {isReadOnly && (!activeSource.scopes?.[key] || activeSource.scopes[key].length === 0) && <span className="text-[10px] text-slate-400">{t.noLimitsDefined || (isRtl ? 'محدودیتی تعریف نشده' : 'No limits defined')}</span>}
                                            </div>
                                        </div>
                                    ))}
                                 </div>
                              </>
                           );
                        })()}
                     </div>
                  </div>
               )}
            </div>
         </div>
      </Modal>
    </div>
  );
};

window.UserManagement = UserManagement;
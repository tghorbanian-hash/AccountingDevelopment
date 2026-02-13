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
  const MENU_DATA = window.MENU_DATA || [];
  const supabase = window.supabase;

  if (!Button) return <div className="p-4">Loading UI...</div>;

  // --- INTERNAL COMPONENT: MULTI-SELECT WITH SEARCH ---
  const MultiSelect = ({ options, value = [], onChange, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef(null);

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (containerRef.current && !containerRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = options.filter(opt => 
      opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleOption = (id) => {
      const newValue = value.includes(id) 
        ? value.filter(v => v !== id) 
        : [...value, id];
      onChange(newValue);
    };

    const removeTag = (e, id) => {
      e.stopPropagation();
      onChange(value.filter(v => v !== id));
    };

    return (
      <div className="relative" ref={containerRef}>
        <div 
          className="min-h-[32px] bg-white border border-slate-200 rounded-md flex flex-wrap items-center gap-1 p-1 cursor-pointer focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-100 transition-all"
          onClick={() => setIsOpen(!isOpen)}
        >
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
          <div className="ml-auto px-1 text-slate-400">
            <ChevronDown size={14}/>
          </div>
        </div>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg z-[60] max-h-48 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
            <div className="p-2 border-b border-slate-50 sticky top-0 bg-white">
              <input 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="جستجو..."
                className="w-full text-[11px] border border-slate-200 rounded px-2 py-1 outline-none focus:border-indigo-400"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            {filteredOptions.length > 0 ? filteredOptions.map(opt => (
              <div 
                key={opt.id} 
                className={`px-3 py-2 text-[11px] cursor-pointer hover:bg-slate-50 flex items-center justify-between ${value.includes(opt.id) ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700'}`}
                onClick={() => toggleOption(opt.id)}
              >
                {opt.label}
                {value.includes(opt.id) && <Check size={12}/>}
              </div>
            )) : (
              <div className="p-2 text-center text-slate-400 text-[10px]">موردی یافت نشد</div>
            )}
          </div>
        )}
      </div>
    );
  };

  const getAllForms = () => {
    const forms = [];
    const traverse = (nodes, pathPrefix = '') => {
      nodes.forEach(node => {
        const currentPath = pathPrefix ? `${pathPrefix} / ${node.label[isRtl ? 'fa' : 'en']}` : node.label[isRtl ? 'fa' : 'en'];
        if (!node.children || node.children.length === 0) {
          forms.push({ ...node, fullPath: currentPath });
        } else {
          traverse(node.children, currentPath);
        }
      });
    };
    traverse(MENU_DATA);
    return forms;
  };
  const ALL_SYSTEM_FORMS = useMemo(() => getAllForms(), [MENU_DATA, isRtl]);

  // --- DB STATES ---
  const [partiesList, setPartiesList] = useState([]);
  const [rolesList, setRolesList] = useState([]);
  const [users, setUsers] = useState([]);
  const [globalRolePermissions, setGlobalRolePermissions] = useState({});

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
  }, []);

  const fetchData = async () => {
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
        id: u.id,
        username: u.username,
        partyId: u.party_id,
        userType: u.user_type,
        isActive: u.is_active,
        lastLogin: u.last_login || '-',
        fullName: u.full_name,
        roleIds: urData.filter(ur => ur.user_id === u.id).map(ur => ur.role_id)
      }));
      setUsers(mappedUsers);
    }
  };

  const getPartyName = (id) => {
    if (!id) return 'نامشخص';
    const p = partiesList.find(p => p.id === id);
    return p ? `${p.name} (${p.code})` : 'نامشخص';
  };

  const effectivePermissions = useMemo(() => {
    const map = new Map();
    const getForm = (id) => ALL_SYSTEM_FORMS.find(f => f.id === id);

    assignedRoles.forEach(roleId => {
      const rolePerms = globalRolePermissions[roleId] || [];
      const roleInfo = rolesList.find(r => r.id === roleId);
      
      rolePerms.forEach(p => {
        const formInfo = getForm(p.formId);
        if (!formInfo) return; 

        if (!map.has(p.formId)) {
          map.set(p.formId, { id: p.formId, path: formInfo.fullPath, breakdown: [] });
        }
        
        map.get(p.formId).breakdown.push({
           sourceId: `role_${roleId}`,
           type: 'role',
           label: roleInfo?.title || 'نقش نامشخص',
           actions: p.actions,
           scopes: p.dataScopes
        });
      });
    });

    directPermissions.forEach(p => {
      const formInfo = getForm(p.formId);
      if (!formInfo) return;

      if (!map.has(p.formId)) {
        map.set(p.formId, { id: p.formId, path: formInfo.fullPath, breakdown: [] });
      }

      const existing = map.get(p.formId).breakdown.find(b => b.type === 'direct');
      if (existing) {
         existing.actions = p.actions || [];
         existing.scopes = p.dataScopes || {};
      } else {
         map.get(p.formId).breakdown.push({
            sourceId: 'direct',
            type: 'direct',
            label: 'مستقیم',
            actions: p.actions || [],
            scopes: p.dataScopes || {}
         });
      }
    });

    return Array.from(map.values());
  }, [assignedRoles, directPermissions, ALL_SYSTEM_FORMS, globalRolePermissions, rolesList]);

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
    setUserFormData({ username: '', partyId: '', userType: 'کاربر سیستم', isActive: true, password: '' });
    setIsEditModalOpen(true);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setUserFormData({ 
      username: user.username, partyId: user.partyId, userType: user.userType, isActive: user.isActive, password: '' 
    });
    setIsEditModalOpen(true);
  };

  const handleSaveUser = async () => {
    if (!userFormData.username || !userFormData.partyId) return alert('لطفا نام کاربری و طرف حساب را مشخص کنید.');
    if (!editingUser && !userFormData.password) return alert('لطفا رمز عبور را وارد کنید.');

    const fullName = getPartyName(userFormData.partyId).split(' (')[0];

    if (editingUser) {
      const { error } = await supabase.schema('gen').from('users').update({
        username: userFormData.username,
        party_id: userFormData.partyId,
        user_type: userFormData.userType,
        is_active: userFormData.isActive,
        full_name: fullName
      }).eq('id', editingUser.id);
      
      if (error) return alert('خطا در ویرایش کاربر');
    } else {
      const { error } = await supabase.rpc('create_user_with_hash', {
        p_username: userFormData.username,
        p_password: userFormData.password,
        p_full_name: fullName,
        p_user_type: userFormData.userType,
        p_email: '',
        p_is_active: userFormData.isActive,
        p_party_id: userFormData.partyId
      }, { schema: 'gen' });

      if (error) return alert('خطا در ثبت کاربر');
    }
    
    setIsEditModalOpen(false);
    fetchData();
  };

  const handleResetPassword = async (user) => {
    if (confirm(`آیا مطمئن هستید که می‌خواهید رمز عبور "${user.username}" را بازنشانی کنید؟`)) {
      const { error } = await supabase.rpc('reset_user_password', {
        p_user_id: user.id, p_new_password: '123456'
      }, { schema: 'gen' });
      if (error) alert('خطا در عملیات'); else alert('رمز عبور به 123456 تغییر یافت.');
    }
  };

  const handleDelete = async (ids) => {
    if (confirm(`حذف ${ids.length} کاربر؟`)) {
      await supabase.schema('gen').from('users').delete().in('id', ids);
      fetchData();
      setSelectedRows([]);
    }
  };

  const handleOpenPermissions = async (user) => {
    setViewingUser(user);
    setAssignedRoles(user.roleIds || []);
    
    // Fetch Direct Perms
    const { data } = await supabase.schema('gen').from('permissions').select('*').eq('user_id', user.id);
    if (data) {
      setDirectPermissions(data.map(d => ({ formId: d.resource_code, actions: d.actions || [], dataScopes: d.data_scopes || {} })));
    } else {
      setDirectPermissions([]);
    }
    
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

    await supabase.schema('gen').from('permissions').delete().eq('user_id', viewingUser.id);
    const validDirect = directPermissions.filter(p => p.actions.length > 0 || Object.keys(p.dataScopes).length > 0);
    if (validDirect.length > 0) {
      await supabase.schema('gen').from('permissions').insert(validDirect.map(p => ({
        user_id: viewingUser.id, resource_code: p.formId, actions: p.actions, data_scopes: p.dataScopes
      })));
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
    if (directPermissions.find(p => p.formId === form.id)) return alert('قبلاً اضافه شده است.');
    setDirectPermissions(prev => [...prev, { formId: form.id, actions: [], dataScopes: {} }]);
    setFormSearchTerm('');
    setShowFormResults(false);
  };

  const handleSelectSource = (row, source) => {
    setSelectedPermDetail(row);
    setActiveSourceId(source.sourceId);
  };

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
      if (appliedFilters.roleIds && appliedFilters.roleIds.length > 0) {
        matchRole = user.roleIds && appliedFilters.roleIds.some(rId => user.roleIds.includes(rId));
      }
      return matchName && matchRole;
    });
  }, [users, appliedFilters]);

  const formSearchResults = useMemo(() => formSearchTerm ? ALL_SYSTEM_FORMS.filter(f => f.fullPath.includes(formSearchTerm)) : [], [formSearchTerm, ALL_SYSTEM_FORMS]);
  const roleSearchResults = useMemo(() => rolesList.filter(r => !assignedRoles.includes(r.id) && r.title.toLowerCase().includes(roleSearchTerm.toLowerCase())), [roleSearchTerm, assignedRoles, rolesList]);

  // --- COLUMNS ---
  const columns = [
    { header: 'شناسه', field: 'id', width: 'w-16', render: (r) => <span className="text-[10px] text-slate-400 font-mono truncate w-12 inline-block">{r.id.split('-')[0]}</span> },
    { header: 'نام کاربری', field: 'username', width: 'w-32', sortable: true },
    { header: 'نام شخص / شرکت', field: 'partyId', width: 'w-48', render: (row) => <span className="font-bold text-slate-700">{getPartyName(row.partyId)}</span> },
    { header: 'نوع کاربری', field: 'userType', width: 'w-32', sortable: true },
    { header: 'نقش‌ها', field: 'roleIds', width: 'w-48', render: (r) => (
        <div className="flex flex-wrap gap-1">
            {r.roleIds && r.roleIds.map(rid => {
                const role = rolesList.find(x => x.id === rid);
                return role ? <Badge key={rid} variant="neutral" className="px-1 py-0 text-[9px]">{role.title}</Badge> : null;
            })}
        </div>
    )},
    { header: 'آخرین ورود', field: 'lastLogin', width: 'w-32', render: (r) => <span className="dir-ltr font-mono text-xs text-slate-500">{r.lastLogin}</span> },
    { header: 'وضعیت', field: 'isActive', width: 'w-24 text-center', render: (r) => <Badge variant={r.isActive ? 'success' : 'neutral'}>{r.isActive ? 'فعال' : 'غیرفعال'}</Badge> },
  ];

  const permColumns = [
    { header: 'مسیر فرم', field: 'path', width: 'w-full', render: (r) => <div className="text-[11px] font-medium flex items-center gap-2"><FileText size={12} className="text-indigo-400"/>{r.path}</div> },
    { header: 'منبع دسترسی (برای جزئیات کلیک کنید)', field: 'source', width: 'w-72', render: (r) => (
       <div className="flex flex-wrap gap-1">
          {r.breakdown.map((s, idx) => {
             const isActive = selectedPermDetail?.id === r.id && activeSourceId === s.sourceId;
             return (
                 <div key={idx} onClick={(e) => { e.stopPropagation(); handleSelectSource(r, s); }}
                    className={`cursor-pointer px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all flex items-center gap-1
                        ${isActive 
                           ? (s.type === 'role' ? 'bg-purple-100 text-purple-700 border-purple-300 ring-1 ring-purple-200' : 'bg-blue-100 text-blue-700 border-blue-300 ring-1 ring-blue-200')
                           : (s.type === 'role' ? 'bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-100 hover:border-purple-200' : 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100 hover:border-blue-200')
                        }`}
                 >
                    {s.type === 'role' ? <Shield size={10}/> : <Zap size={10}/>} {s.type === 'role' ? `${s.label}` : 'مستقیم'}
                 </div>
             )
          })}
       </div>
    )},
  ];

  const AVAILABLE_ACTIONS = [
      { id: 'create', label: 'ایجاد' }, { id: 'edit', label: 'ویرایش' }, { id: 'view', label: 'مشاهده' }, { id: 'delete', label: 'حذف' },
      { id: 'print', label: 'چاپ' }, { id: 'approve', label: 'تایید' }, { id: 'export', label: 'خروجی' }, { id: 'share', label: 'اشتراک' },
  ];

  const DATA_SCOPES = { 
     'doc_list': { label: 'نوع سند', options: [{value:'عمومی', label:'عمومی'}, {value:'افتتاحیه', label:'افتتاحیه'}] },
     'status': { label: 'وضعیت', options: [{value:'موقت', label:'موقت'}, {value:'قطعی', label:'قطعی'}] }
  };

  return (
    <div className={`flex flex-col h-full bg-slate-50/50 p-4 overflow-hidden ${isRtl ? 'font-vazir' : 'font-sans'}`}>
      <div className="flex items-center justify-between mb-4 shrink-0">
         <div>
            <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
               <Users className="text-indigo-600" size={24}/> مدیریت کاربران
            </h1>
         </div>
      </div>

      <FilterSection title="جستجوی پیشرفته" onSearch={() => setAppliedFilters(filterValues)} onClear={() => {setFilterValues({username: '', roleIds: []}); setAppliedFilters({username: '', roleIds: []})}} isRtl={isRtl}>
         <InputField label="نام کاربری" value={filterValues.username} onChange={(e) => setFilterValues({...filterValues, username: e.target.value})} placeholder="جستجو..." isRtl={isRtl} />
         <div>
           <label className="block text-[11px] font-bold text-slate-600 mb-1">نقش‌های کاربری</label>
           <MultiSelect options={rolesList.map(r => ({id: r.id, label: r.title}))} value={filterValues.roleIds} onChange={(vals) => setFilterValues({...filterValues, roleIds: vals})} placeholder="انتخاب نقش‌ها..." />
         </div>
      </FilterSection>

      <div className="flex-1 min-h-0">
         <DataGrid 
            title="لیست کاربران" columns={columns} data={filteredUsers} isRtl={isRtl}
            selectedIds={selectedRows} onSelectAll={(c) => setSelectedRows(c ? filteredUsers.map(r => r.id) : [])}
            onSelectRow={(id, c) => setSelectedRows(p => c ? [...p, id] : p.filter(r => r !== id))}
            onCreate={handleCreate} onDelete={handleDelete}
            actions={(row) => (
               <>
                 <Button variant="ghost" size="iconSm" icon={Edit} onClick={() => handleEdit(row)} title="ویرایش" />
                 <Button variant="ghost" size="iconSm" icon={Shield} className="text-purple-600" onClick={() => handleOpenPermissions(row)} title="دسترسی‌ها" />
                 <Button variant="ghost" size="iconSm" icon={RefreshCw} className="text-amber-600" onClick={() => handleResetPassword(row)} title="ریست رمز" />
               </>
            )}
         />
      </div>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={editingUser ? "ویرایش کاربر" : "تعریف کاربر جدید"} size="md"
         footer={<><Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>انصراف</Button><Button variant="primary" icon={Check} onClick={handleSaveUser}>ذخیره</Button></>}>
         <div className="grid grid-cols-2 gap-4">
            <InputField label="نام کاربری" value={userFormData.username} onChange={(e) => setUserFormData({...userFormData, username: e.target.value})} isRtl={isRtl} className="dir-ltr" />
            <SelectField label="نوع کاربری" value={userFormData.userType} onChange={(e) => setUserFormData({...userFormData, userType: e.target.value})} isRtl={isRtl}>
               <option value="مدیر سیستم">مدیر سیستم</option><option value="کاربر سیستم">کاربر سیستم</option>
            </SelectField>
            <div className="col-span-2 grid grid-cols-2 gap-4">
                {!editingUser ? (
                    <InputField label="رمز عبور" type="password" value={userFormData.password} onChange={(e) => setUserFormData({...userFormData, password: e.target.value})} isRtl={isRtl} className="dir-ltr" placeholder="********" />
                ) : (
                    <div className="opacity-50"><InputField label="رمز عبور" disabled value="********" isRtl={isRtl} /></div>
                )}
                <SelectField label="اتصال به شخص / طرف حساب" value={userFormData.partyId} onChange={(e) => setUserFormData({...userFormData, partyId: e.target.value})} isRtl={isRtl}>
                    <option value="">-- انتخاب کنید --</option>
                    {partiesList.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
                </SelectField>
            </div>
            <div className="col-span-2 flex items-center justify-between pt-2">
               <span className="text-xs font-bold text-slate-700">وضعیت حساب:</span>
               <Toggle checked={userFormData.isActive} onChange={(val) => setUserFormData({...userFormData, isActive: val})} label={userFormData.isActive ? "فعال" : "غیرفعال"} />
            </div>
         </div>
      </Modal>

      <Modal isOpen={isPermModalOpen} onClose={() => setIsPermModalOpen(false)} title={`مدیریت دسترسی‌های: ${viewingUser?.username}`} size="xl"
         footer={<Button variant="primary" onClick={handleCloseAndSavePermissions}>تایید و بستن</Button>}>
         <div className="flex flex-col h-[600px]">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-3 flex items-center justify-between">
               <div className="flex items-center gap-2 overflow-x-auto">
                  <Shield size={16} className="text-purple-600 shrink-0"/>
                  <span className="text-xs font-bold text-slate-700 shrink-0">نقش‌های تخصیص یافته:</span>
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
                     {assignedRoles.length === 0 && <span className="text-[10px] text-slate-400 italic mt-1">بدون نقش</span>}
                  </div>
               </div>
               <div className="relative shrink-0 w-64">
                   <div className="flex items-center border border-slate-300 rounded bg-white px-2 h-8 cursor-text" onClick={() => setIsRoleSearchOpen(!isRoleSearchOpen)}>
                       <input className="w-full text-[11px] outline-none" placeholder="افزودن نقش (جستجو)..." value={roleSearchTerm} onChange={(e) => { setRoleSearchTerm(e.target.value); setIsRoleSearchOpen(true); }} />
                       <ChevronDown size={14} className="text-slate-400"/>
                   </div>
                   {isRoleSearchOpen && (
                       <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded shadow-lg z-[60] max-h-40 overflow-y-auto">
                           {roleSearchResults.length > 0 ? roleSearchResults.map(r => (
                               <div key={r.id} onClick={() => handleAddRole(r.id)} className="px-3 py-2 hover:bg-purple-50 cursor-pointer text-[11px] text-slate-700 border-b border-slate-50">{r.title}</div>
                           )) : <div className="p-2 text-center text-slate-400 text-[10px]">نقشی یافت نشد</div>}
                       </div>
                   )}
                   {isRoleSearchOpen && <div className="fixed inset-0 z-[-1]" onClick={() => setIsRoleSearchOpen(false)}></div>}
               </div>
            </div>

            <div className="flex flex-1 border border-slate-200 rounded-lg overflow-hidden">
               <div className={`${selectedPermDetail ? 'w-1/2' : 'w-full'} flex flex-col transition-all duration-300 bg-white relative`}>
                  <div className="p-2 border-b border-slate-100 bg-white relative z-[50]">
                     <div className="relative">
                        <input value={formSearchTerm} onChange={(e) => { setFormSearchTerm(e.target.value); setShowFormResults(true); }} placeholder="افزودن دسترسی مستقیم (نام فرم را جستجو کنید)..." className="w-full h-9 bg-slate-50 border border-slate-200 rounded text-xs pr-8 pl-2 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 transition-all" />
                        <Search size={14} className="absolute top-2.5 right-2.5 text-slate-400"/>
                        {showFormResults && formSearchTerm && (
                           <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded shadow-xl max-h-48 overflow-y-auto z-[100]">
                              {formSearchResults.length > 0 ? formSearchResults.map(f => (
                                 <div key={f.id} onClick={() => handleAddDirectForm(f)} className="p-2 hover:bg-indigo-50 cursor-pointer text-xs border-b border-slate-50 last:border-0">
                                    <div className="font-bold text-slate-700">{f.label[isRtl ? 'fa' : 'en']}</div>
                                    <div className="text-[10px] text-slate-400">{f.fullPath}</div>
                                 </div>
                              )) : <div className="p-2 text-xs text-slate-400 text-center">موردی یافت نشد</div>}
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
                           if (!activeSource) return <div className="text-center text-slate-400 text-xs mt-10">لطفا یکی از منابع دسترسی (بج‌های رنگی) را از لیست انتخاب کنید.</div>;
                           const isReadOnly = activeSource.type === 'role';
                           return (
                              <>
                                 <div className={`p-3 rounded border mb-2 flex items-center gap-2 ${isReadOnly ? 'bg-purple-50 border-purple-100 text-purple-800' : 'bg-blue-50 border-blue-100 text-blue-800'}`}>
                                     {isReadOnly ? <Shield size={16}/> : <Edit size={16}/>}
                                     <div className="font-bold text-xs">منبع: {activeSource.type === 'role' ? `نقش ${activeSource.label}` : 'دسترسی مستقیم'}</div>
                                 </div>
                                 {isReadOnly && <div className="flex items-start gap-2 text-[10px] text-slate-500 bg-slate-100 p-2 rounded"><Info size={14} className="shrink-0 mt-0.5"/>این دسترسی‌ها از نقش به ارث رسیده‌اند و در اینجا قابل تغییر نیستند.</div>}
                                 <div>
                                    <div className="text-[11px] font-bold text-slate-500 uppercase mb-3">عملیات مجاز</div>
                                    {isReadOnly ? (
                                        <div className="flex flex-wrap gap-2">
                                            {activeSource.actions.map(act => { const label = AVAILABLE_ACTIONS.find(a => a.id === act)?.label || act; return <Badge key={act} variant="success">{label}</Badge> })}
                                            {activeSource.actions.length === 0 && <span className="text-slate-400 text-xs">هیچ عملیاتی مجاز نیست</span>}
                                        </div>
                                    ) : (
                                        <SelectionGrid items={AVAILABLE_ACTIONS} selectedIds={activeSource.actions || []} onToggle={(id) => handleUpdateDirectPermission(selectedPermDetail.id, 'action', id)} columns={3} />
                                    )}
                                 </div>
                                 <div className="pt-4 border-t border-slate-200">
                                    <div className="text-[11px] font-bold text-slate-500 uppercase mb-3">دسترسی داده</div>
                                    {Object.entries(DATA_SCOPES).map(([key, def]) => (
                                        <div key={key} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm mb-3">
                                            <span className="text-[11px] font-bold block mb-2 text-slate-700">{def.label}:</span>
                                            <div className="flex flex-wrap gap-2">
                                                {def.options.map(opt => {
                                                    const hasAccess = activeSource.scopes?.[key]?.includes(opt.value);
                                                    if (isReadOnly) return hasAccess ? <Badge key={opt.value} variant="info">{opt.label}</Badge> : null;
                                                    return <ToggleChip key={opt.value} label={opt.label} checked={hasAccess} onClick={() => handleUpdateDirectPermission(selectedPermDetail.id, 'scope', key, opt.value)} colorClass="indigo" />
                                                })}
                                                {isReadOnly && (!activeSource.scopes?.[key] || activeSource.scopes[key].length === 0) && <span className="text-[10px] text-slate-400">محدودیتی تعریف نشده</span>}
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
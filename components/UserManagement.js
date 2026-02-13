/* Filename: components/UserManagement.js */
import React, { useState, useEffect } from 'react';
import { Users, Key, Edit, Trash2, Check, RefreshCw, Settings, Shield } from 'lucide-react';

const UserManagement = ({ t, isRtl }) => {
  const UI = window.UI || {};
  const { Button, InputField, SelectField, Toggle, DataGrid, Modal, Badge } = UI;
  const supabase = window.supabase;

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [userRoles, setUserRoles] = useState([]);
  const [resources, setResources] = useState([]);
  const [permissions, setPermissions] = useState([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ username: '', password: '', fullName: '', userType: 'employee', email: '', isActive: true, roleIds: [] });

  const [isPermModalOpen, setIsPermModalOpen] = useState(false);
  const [activeUserForPerms, setActiveUserForPerms] = useState(null);
  const [userPerms, setUserPerms] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: uData } = await supabase.schema('gen').from('users').select('*').order('created_at', { ascending: false });
    const { data: rData } = await supabase.schema('gen').from('roles').select('*');
    const { data: urData } = await supabase.schema('gen').from('user_roles').select('*');
    const { data: resData } = await supabase.schema('gen').from('resources').select('*');
    const { data: pData } = await supabase.schema('gen').from('permissions').select('*').not('user_id', 'is', null);
    
    if (uData) setUsers(uData);
    if (rData) setRoles(rData);
    if (urData) setUserRoles(urData);
    if (resData) setResources(resData);
    if (pData) setPermissions(pData);
  };

  const handleSave = async () => {
    if (!formData.username || !formData.fullName || (!editingUser && !formData.password)) {
      return alert(isRtl ? 'لطفاً فیلدهای اجباری را پر کنید.' : 'Please fill required fields.');
    }

    let targetUserId = editingUser?.id;

    if (editingUser) {
      const { error } = await supabase.schema('gen').from('users').update({
        username: formData.username,
        full_name: formData.fullName,
        user_type: formData.userType,
        email: formData.email,
        is_active: formData.isActive
      }).eq('id', targetUserId);
      if (error) return alert(isRtl ? 'خطا در ویرایش کاربر' : 'Error updating user');
    } else {
      const { data, error } = await supabase.rpc('create_user_with_hash', {
        p_username: formData.username,
        p_password: formData.password,
        p_full_name: formData.fullName,
        p_user_type: formData.userType,
        p_email: formData.email,
        p_is_active: formData.isActive
      }, { schema: 'gen' });
      if (error) return alert(isRtl ? 'خطا در ثبت کاربر' : 'Error creating user');
      targetUserId = data;
    }

    await supabase.schema('gen').from('user_roles').delete().eq('user_id', targetUserId);
    if (formData.roleIds.length > 0) {
      const roleInserts = formData.roleIds.map(rId => ({ user_id: targetUserId, role_id: rId }));
      await supabase.schema('gen').from('user_roles').insert(roleInserts);
    }

    setIsModalOpen(false);
    fetchData();
  };

  const handleDelete = async (ids) => {
    if (confirm(t.confirm_delete?.replace('{0}', ids.length) || `Delete ${ids.length} items?`)) {
      await supabase.schema('gen').from('users').delete().in('id', ids);
      fetchData();
    }
  };

  const handleResetPassword = async (userId) => {
    if (confirm(isRtl ? 'آیا از ریست کردن کلمه عبور به 123456 اطمینان دارید؟' : 'Reset password to 123456?')) {
      const { error } = await supabase.rpc('reset_user_password', {
        p_user_id: userId,
        p_new_password: '123456'
      }, { schema: 'gen' });
      
      if (error) alert(isRtl ? 'خطا در ریست کلمه عبور' : 'Error resetting password');
      else alert(isRtl ? 'کلمه عبور با موفقیت ریست شد' : 'Password reset successfully');
    }
  };

  const handleToggleActive = async (id, newVal) => {
    await supabase.schema('gen').from('users').update({ is_active: newVal }).eq('id', id);
    fetchData();
  };

  const openPermModal = (user) => {
    setActiveUserForPerms(user);
    const existing = permissions.filter(p => p.user_id === user.id);
    const currentPerms = resources.map(res => {
      const ext = existing.find(e => e.resource_code === res.code) || {};
      return {
        resource_code: res.code,
        title: res.title,
        can_view: ext.can_view || false,
        can_create: ext.can_create || false,
        can_edit: ext.can_edit || false,
        can_delete: ext.can_delete || false,
        can_approve: ext.can_approve || false,
        row_level_rule: ext.row_level_rule || ''
      };
    });
    setUserPerms(currentPerms);
    setIsPermModalOpen(true);
  };

  const handleSavePermissions = async () => {
    await supabase.schema('gen').from('permissions').delete().eq('user_id', activeUserForPerms.id);
    const inserts = userPerms.filter(p => p.can_view || p.can_create || p.can_edit || p.can_delete || p.can_approve).map(p => ({
      user_id: activeUserForPerms.id,
      resource_code: p.resource_code,
      can_view: p.can_view,
      can_create: p.can_create,
      can_edit: p.can_edit,
      can_delete: p.can_delete,
      can_approve: p.can_approve,
      row_level_rule: p.row_level_rule
    }));
    
    if (inserts.length > 0) {
      await supabase.schema('gen').from('permissions').insert(inserts);
    }
    setIsPermModalOpen(false);
    fetchData();
  };

  const updatePerm = (idx, field, val) => {
    const newPerms = [...userPerms];
    newPerms[idx][field] = val;
    setUserPerms(newPerms);
  };

  const columns = [
    { header: t.username || 'Username', field: 'username', width: 'w-32', render: r => <span className="font-bold text-slate-700">{r.username}</span> },
    { header: t.pt_fullname || 'Full Name', field: 'full_name', width: 'w-48' },
    { header: t.user_type || 'UserType', field: 'user_type', width: 'w-32', render: r => <Badge variant="info">{r.user_type}</Badge> },
    { header: t.roles || 'Roles', field: 'roles', width: 'w-48', render: r => {
        const uRoles = userRoles.filter(ur => ur.user_id === r.id).map(ur => roles.find(rl => rl.id === ur.role_id)?.title).filter(Boolean);
        return <div className="flex gap-1 flex-wrap">{uRoles.map(rl => <Badge key={rl} variant="neutral">{rl}</Badge>)}</div>;
    }},
    { header: t.active_status || 'Status', field: 'is_active', width: 'w-24', type: 'toggle', render: r => <div className="flex justify-center"><Toggle checked={r.is_active} onChange={v => handleToggleActive(r.id, v)} /></div> },
    { header: t.permissions || 'Direct Perms', field: 'perms', width: 'w-24', render: r => (
      <Button variant="ghost" size="iconSm" icon={Shield} onClick={() => openPermModal(r)} className="text-blue-600 hover:bg-blue-50" />
    )},
    { header: t.actions || 'Actions', field: 'actions', width: 'w-32', render: r => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="iconSm" icon={RefreshCw} className="text-orange-500 hover:bg-orange-50" onClick={() => handleResetPassword(r.id)} />
          <Button variant="ghost" size="iconSm" icon={Edit} onClick={() => {
            setEditingUser(r);
            setFormData({
              username: r.username, password: '', fullName: r.full_name, userType: r.user_type, email: r.email, isActive: r.is_active,
              roleIds: userRoles.filter(ur => ur.user_id === r.id).map(ur => ur.role_id)
            });
            setIsModalOpen(true);
          }} />
          <Button variant="ghost" size="iconSm" icon={Trash2} className="text-red-500 hover:bg-red-50" onClick={() => handleDelete([r.id])} />
        </div>
    )}
  ];

  return (
    <div className={`flex flex-col h-full bg-slate-50/50 p-4 ${isRtl ? 'font-vazir' : 'font-sans'}`}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg"><Users size={24} /></div>
          <div><h1 className="text-xl font-black text-slate-800">{t.user_management || 'User Management'}</h1></div>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <DataGrid 
          columns={columns} 
          data={users} 
          isRtl={isRtl} 
          onCreate={() => { 
            setEditingUser(null); 
            setFormData({ username: '', password: '', fullName: '', userType: 'employee', email: '', isActive: true, roleIds: [] }); 
            setIsModalOpen(true); 
          }} 
          onDelete={handleDelete} 
        />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUser ? (t.edit_user || 'Edit User') : (t.new_user || 'New User')} size="lg" footer={<><Button variant="secondary" onClick={() => setIsModalOpen(false)}>{t.btn_cancel || 'Cancel'}</Button><Button variant="primary" icon={Check} onClick={handleSave}>{t.btn_save || 'Save'}</Button></>}>
        <div className="grid grid-cols-2 gap-4">
          <InputField label={`${t.username || 'Username'} *`} value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="dir-ltr" />
          {!editingUser && <InputField label={`${t.password || 'Password'} *`} type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="dir-ltr" />}
          <InputField label={`${t.pt_fullname || 'Full Name'} *`} value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="col-span-2" />
          <SelectField label={t.user_type || 'UserType'} value={formData.userType} onChange={e => setFormData({...formData, userType: e.target.value})}>
             <option value="admin">Admin</option>
             <option value="employee">Employee</option>
             <option value="customer">Customer</option>
          </SelectField>
          <InputField label={t.pt_email || 'Email'} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="dir-ltr" />
          <div className="col-span-2 flex items-center gap-2 mt-2">
            <Toggle checked={formData.isActive} onChange={v => setFormData({...formData, isActive: v})} /> 
            <span className="text-sm font-bold text-slate-600">{t.active_status || 'Active'}</span>
          </div>
          <div className="col-span-2 border-t pt-4">
             <label className="block text-[11px] font-bold text-slate-600 mb-2">{t.assign_roles || 'Assign Roles'}</label>
             <div className="flex flex-wrap gap-2">
               {roles.map(r => (
                 <label key={r.id} className="flex items-center gap-2 text-sm bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-indigo-50 transition-colors">
                   <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500" checked={formData.roleIds.includes(r.id)} onChange={e => {
                     const newIds = e.target.checked ? [...formData.roleIds, r.id] : formData.roleIds.filter(id => id !== r.id);
                     setFormData({...formData, roleIds: newIds});
                   }} /> {r.title}
                 </label>
               ))}
             </div>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isPermModalOpen} onClose={() => setIsPermModalOpen(false)} title={`${t.permissions || 'Permissions'}: ${activeUserForPerms?.full_name}`} size="xl" footer={<><Button variant="secondary" onClick={() => setIsPermModalOpen(false)}>{t.btn_cancel || 'Cancel'}</Button><Button variant="primary" icon={Check} onClick={handleSavePermissions}>{t.btn_save || 'Save Permissions'}</Button></>}>
        <div className="max-h-[60vh] overflow-y-auto border rounded-lg">
          <table className="w-full text-xs text-left" dir={isRtl ? 'rtl' : 'ltr'}>
            <thead className="bg-slate-100 sticky top-0 shadow-sm text-slate-600">
              <tr>
                <th className="p-3 border-b">{t.resource || 'Resource'}</th>
                <th className="p-3 border-b text-center">{t.can_view || 'View'}</th>
                <th className="p-3 border-b text-center">{t.can_create || 'Create'}</th>
                <th className="p-3 border-b text-center">{t.can_edit || 'Edit'}</th>
                <th className="p-3 border-b text-center">{t.can_delete || 'Delete'}</th>
                <th className="p-3 border-b text-center">{t.can_approve || 'Approve'}</th>
                <th className="p-3 border-b">{t.row_level || 'Row Level Rule'}</th>
              </tr>
            </thead>
            <tbody>
              {userPerms.map((p, idx) => (
                <tr key={p.resource_code} className="border-b hover:bg-slate-50">
                  <td className="p-2 font-medium">{p.title} <div className="text-[9px] text-slate-400 font-mono mt-1">{p.resource_code}</div></td>
                  <td className="p-2 text-center"><input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500" checked={p.can_view} onChange={e => updatePerm(idx, 'can_view', e.target.checked)} /></td>
                  <td className="p-2 text-center"><input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500" checked={p.can_create} onChange={e => updatePerm(idx, 'can_create', e.target.checked)} /></td>
                  <td className="p-2 text-center"><input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500" checked={p.can_edit} onChange={e => updatePerm(idx, 'can_edit', e.target.checked)} /></td>
                  <td className="p-2 text-center"><input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500" checked={p.can_delete} onChange={e => updatePerm(idx, 'can_delete', e.target.checked)} /></td>
                  <td className="p-2 text-center"><input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500" checked={p.can_approve} onChange={e => updatePerm(idx, 'can_approve', e.target.checked)} /></td>
                  <td className="p-2"><input type="text" className="w-full border border-slate-200 rounded px-2 py-1.5 text-[10px] dir-ltr outline-none focus:border-indigo-500" value={p.row_level_rule} onChange={e => updatePerm(idx, 'row_level_rule', e.target.value)} placeholder='{"branch": 1}' /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  );
};

window.UserManagement = UserManagement;
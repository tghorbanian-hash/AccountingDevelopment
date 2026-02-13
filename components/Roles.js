/* Filename: components/Roles.js */
import React, { useState, useEffect } from 'react';
import { Shield, Edit, Trash2, Check, Settings } from 'lucide-react';

const Roles = ({ t, isRtl }) => {
  const UI = window.UI || {};
  const { Button, InputField, DataGrid, Modal, Toggle } = UI;
  const supabase = window.supabase;

  const [roles, setRoles] = useState([]);
  const [resources, setResources] = useState([]);
  const [permissions, setPermissions] = useState([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({ code: '', title: '', description: '', isActive: true });

  const [isPermModalOpen, setIsPermModalOpen] = useState(false);
  const [activeRoleForPerms, setActiveRoleForPerms] = useState(null);
  const [rolePerms, setRolePerms] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: rData } = await supabase.schema('gen').from('roles').select('*').order('created_at', { ascending: false });
    const { data: resData } = await supabase.schema('gen').from('resources').select('*');
    const { data: pData } = await supabase.schema('gen').from('permissions').select('*').not('role_id', 'is', null);
    
    if (rData) setRoles(rData);
    if (resData) setResources(resData);
    if (pData) setPermissions(pData);
  };

  const handleSaveRole = async () => {
    if (!formData.code || !formData.title) {
      return alert(isRtl ? 'لطفاً فیلدهای اجباری را پر کنید.' : 'Please fill required fields.');
    }

    const payload = { 
      code: formData.code, 
      title: formData.title, 
      description: formData.description, 
      is_active: formData.isActive 
    };

    if (editingRole) {
      const { error } = await supabase.schema('gen').from('roles').update(payload).eq('id', editingRole.id);
      if (error) return alert(isRtl ? 'خطا در ویرایش نقش' : 'Error updating role');
    } else {
      const { error } = await supabase.schema('gen').from('roles').insert([payload]);
      if (error) return alert(isRtl ? 'خطا در ثبت نقش' : 'Error creating role');
    }
    
    setIsModalOpen(false);
    fetchData();
  };

  const handleDeleteRole = async (ids) => {
    if (confirm(t.confirm_delete?.replace('{0}', ids.length) || `Delete ${ids.length} items?`)) {
      await supabase.schema('gen').from('roles').delete().in('id', ids);
      fetchData();
    }
  };

  const handleToggleActive = async (id, newVal) => {
    await supabase.schema('gen').from('roles').update({ is_active: newVal }).eq('id', id);
    fetchData();
  };

  const openPermModal = (role) => {
    setActiveRoleForPerms(role);
    const existing = permissions.filter(p => p.role_id === role.id);
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
    setRolePerms(currentPerms);
    setIsPermModalOpen(true);
  };

  const handleSavePermissions = async () => {
    await supabase.schema('gen').from('permissions').delete().eq('role_id', activeRoleForPerms.id);
    
    const inserts = rolePerms.filter(p => p.can_view || p.can_create || p.can_edit || p.can_delete || p.can_approve).map(p => ({
      role_id: activeRoleForPerms.id,
      resource_code: p.resource_code,
      can_view: p.can_view,
      can_create: p.can_create,
      can_edit: p.can_edit,
      can_delete: p.can_delete,
      can_approve: p.can_approve,
      row_level_rule: p.row_level_rule
    }));
    
    if (inserts.length > 0) {
      const { error } = await supabase.schema('gen').from('permissions').insert(inserts);
      if (error) return alert(isRtl ? 'خطا در تخصیص دسترسی' : 'Error assigning permissions');
    }
    
    setIsPermModalOpen(false);
    fetchData();
  };

  const updatePerm = (idx, field, val) => {
    const newPerms = [...rolePerms];
    newPerms[idx][field] = val;
    setRolePerms(newPerms);
  };

  const columns = [
    { header: t.code || 'Code', field: 'code', width: 'w-32', render: r => <span className="font-mono text-indigo-700 font-bold bg-indigo-50 px-2 py-1 rounded">{r.code}</span> },
    { header: t.title || 'Title', field: 'title', width: 'w-48', render: r => <span className="font-bold text-slate-700">{r.title}</span> },
    { header: t.description || 'Description', field: 'description', width: 'w-64' },
    { header: t.active_status || 'Status', field: 'is_active', width: 'w-24', type: 'toggle', render: r => <div className="flex justify-center"><Toggle checked={r.is_active} onChange={(v) => handleToggleActive(r.id, v)} /></div> },
    { header: t.permissions || 'Permissions', field: 'perms', width: 'w-32', render: r => (
      <Button variant="secondary" size="sm" icon={Settings} onClick={() => openPermModal(r)}>{t.config || 'Config'}</Button>
    )},
    { header: t.actions || 'Actions', field: 'actions', width: 'w-24', render: r => (
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="iconSm" icon={Edit} onClick={() => { 
          setEditingRole(r); 
          setFormData({ code: r.code, title: r.title, description: r.description, isActive: r.is_active }); 
          setIsModalOpen(true); 
        }} />
        <Button variant="ghost" size="iconSm" icon={Trash2} className="text-red-500 hover:bg-red-50" onClick={() => handleDeleteRole([r.id])} />
      </div>
    )}
  ];

  return (
    <div className={`flex flex-col h-full bg-slate-50/50 p-4 ${isRtl ? 'font-vazir' : 'font-sans'}`}>
      <div className="mb-4 flex items-center gap-3">
        <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg"><Shield size={24} /></div>
        <div>
          <h1 className="text-xl font-black text-slate-800">{t.roles_management || 'Roles & Permissions'}</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">{t.roles_subtitle || 'Manage system access levels'}</p>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <DataGrid 
          columns={columns} 
          data={roles} 
          isRtl={isRtl} 
          onCreate={() => { 
            setEditingRole(null); 
            setFormData({ code: '', title: '', description: '', isActive: true }); 
            setIsModalOpen(true); 
          }} 
          onDelete={handleDeleteRole} 
        />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingRole ? (t.edit_role || 'Edit Role') : (t.new_role || 'New Role')} footer={<><Button variant="secondary" onClick={() => setIsModalOpen(false)}>{t.btn_cancel || 'Cancel'}</Button><Button variant="primary" icon={Check} onClick={handleSaveRole}>{t.btn_save || 'Save'}</Button></>}>
        <div className="space-y-4">
          <InputField label={`${t.code || 'Code'} *`} value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className="dir-ltr" />
          <InputField label={`${t.title || 'Title'} *`} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
          <InputField label={t.description || 'Description'} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
            <Toggle checked={formData.isActive} onChange={v => setFormData({...formData, isActive: v})} /> 
            <span className="text-sm font-bold text-slate-600">{t.active_status || 'Active'}</span>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isPermModalOpen} onClose={() => setIsPermModalOpen(false)} title={`${t.permissions || 'Permissions'}: ${activeRoleForPerms?.title}`} size="xl" footer={<><Button variant="secondary" onClick={() => setIsPermModalOpen(false)}>{t.btn_cancel || 'Cancel'}</Button><Button variant="primary" icon={Check} onClick={handleSavePermissions}>{t.btn_save || 'Save Permissions'}</Button></>}>
        <div className="max-h-[60vh] overflow-y-auto border rounded-lg shadow-inner">
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
              {rolePerms.map((p, idx) => (
                <tr key={p.resource_code} className="border-b hover:bg-slate-50 transition-colors">
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

window.Roles = Roles;
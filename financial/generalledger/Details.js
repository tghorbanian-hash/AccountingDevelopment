/* Filename: financial/generalledger/Details.js */
import React, { useState, useEffect, useMemo } from 'react';
import { Edit, Trash2, List, Shield, UserCog, Key } from 'lucide-react';

const Details = ({ t, isRtl }) => {
  const { 
    Button, InputField, SelectField, DataGrid, 
    FilterSection, Modal, Badge, Callout 
  } = window.UI;
  const supabase = window.supabase;

  // --- States ---
  const [detailTypes, setDetailTypes] = useState([]);
  const [allInstances, setAllInstances] = useState([]);
  
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showInstanceModal, setShowInstanceModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [searchParams, setSearchParams] = useState({ title: '', type: 'all' });
  const [selectedDetailType, setSelectedDetailType] = useState(null);
  
  const [assigningItem, setAssigningItem] = useState(null);
  const [newDetailCode, setNewDetailCode] = useState('');

  // --- Effects ---
  useEffect(() => {
    fetchDetailTypes();
    fetchInstances();
  }, []);

  // --- DB Operations ---
  const fetchDetailTypes = async () => {
    const { data, error } = await supabase
      .schema('gl')
      .from('detail_types')
      .select('*')
      .order('created_at', { ascending: true });
      
    if (error) {
      console.error('Error fetching detail types:', error);
      return;
    }
    
    const mappedData = data.map(item => ({
      id: item.id,
      code: item.code,
      title: item.title,
      type: item.type,
      isActive: item.is_active
    }));
    setDetailTypes(mappedData);
  };

  const fetchInstances = async () => {
    const { data, error } = await supabase
      .schema('gl')
      .from('detail_instances')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching instances:', error);
      return;
    }

    const mappedData = data.map(item => ({
      id: item.id,
      detailTypeCode: item.detail_type_code,
      entityCode: item.entity_code,
      title: item.title,
      status: item.status,
      detailCode: item.detail_code,
      refEntityName: item.ref_entity_name
    }));
    setAllInstances(mappedData);
  };

  const handleSaveType = async () => {
    if (!formData.title) return alert(t.alert_req_fields || 'Please fill required fields.');
    
    const payload = {
      title: formData.title,
      is_active: formData.isActive,
      type: 'user'
    };

    if (editingItem && editingItem.id) {
      const { error } = await supabase
        .schema('gl')
        .from('detail_types')
        .update(payload)
        .eq('id', editingItem.id);

      if (error) {
        console.error('Error updating type:', error);
        alert(isRtl ? 'خطا در ویرایش اطلاعات.' : 'Error updating.');
        return;
      }
    } else {
      payload.code = `usr_${Date.now()}`;
      const { error } = await supabase
        .schema('gl')
        .from('detail_types')
        .insert([payload]);

      if (error) {
        console.error('Error inserting type:', error);
        alert(isRtl ? 'خطا در ثبت اطلاعات.' : 'Error creating.');
        return;
      }
    }

    setShowTypeModal(false);
    fetchDetailTypes();
  };

  const handleDelete = async (ids) => {
    const typesToDelete = detailTypes.filter(d => ids.includes(d.id) && d.type === 'user');
    if (typesToDelete.length === 0) return;

    if (window.confirm(t.confirm_delete?.replace('{0}', typesToDelete.length) || `Delete ${typesToDelete.length} items?`)) {
      const idsToDelete = typesToDelete.map(t => t.id);
      const { error } = await supabase
        .schema('gl')
        .from('detail_types')
        .delete()
        .in('id', idsToDelete);

      if (error) {
        console.error('Error deleting type:', error);
        alert(isRtl ? 'خطا در حذف اطلاعات.' : 'Error deleting.');
        return;
      }
      fetchDetailTypes();
    }
  };

  const handleSaveCode = async () => {
    if (!newDetailCode) return alert(isRtl ? 'لطفا کد را وارد کنید' : 'Please enter a code');
    
    const { error } = await supabase
      .schema('gl')
      .from('detail_instances')
      .update({ detail_code: newDetailCode })
      .eq('id', assigningItem.id);

    if (error) {
      console.error('Error assigning code:', error);
      alert(isRtl ? 'خطا در تخصیص کد.' : 'Error assigning code.');
      return;
    }

    setShowAssignModal(false);
    setAssigningItem(null);
    fetchInstances();
  };

  // --- Derived Data ---
  const filteredDetails = useMemo(() => {
    return detailTypes.filter(item => {
      const matchTitle = item.title.toLowerCase().includes(searchParams.title.toLowerCase());
      const matchType = searchParams.type === 'all' ? true : item.type === searchParams.type;
      return matchTitle && matchType;
    });
  }, [detailTypes, searchParams]);

  const currentInstances = useMemo(() => {
    if (!selectedDetailType) return [];
    return allInstances.filter(inst => inst.detailTypeCode === selectedDetailType.code);
  }, [selectedDetailType, allInstances]);

  // --- Handlers ---
  const handleCreate = () => {
    setEditingItem(null);
    setFormData({ title: '', isActive: true, type: 'user' });
    setShowTypeModal(true);
  };

  const handleEdit = (item) => {
    if (item.type === 'system') return;
    setEditingItem(item);
    setFormData({ ...item });
    setShowTypeModal(true);
  };

  const handleViewInstances = (item) => {
    setSelectedDetailType(item);
    setShowInstanceModal(true);
  };

  const handleOpenAssign = (instance) => {
    setAssigningItem(instance);
    setNewDetailCode('');
    setShowAssignModal(true);
  };

  // --- Column Definitions ---
  const mainColumns = [
    { field: 'title', header: t.dt_type_title || 'Title', width: 'w-64', sortable: true },
    { 
      field: 'type', 
      header: t.dt_category || 'Category', 
      width: 'w-32',
      render: (row) => (
        <Badge variant={row.type === 'system' ? 'primary' : 'warning'} icon={row.type === 'system' ? Shield : UserCog}>
          {row.type === 'system' ? (t.dt_system || 'System') : (t.dt_user || 'User')}
        </Badge>
      )
    },
    { 
      field: 'isActive', 
      header: t.active_status || 'Status', 
      width: 'w-24',
      render: (row) => (
         <Badge variant={row.isActive ? 'success' : 'neutral'}>
            {row.isActive ? (t.active || 'Active') : (t.inactive || 'Inactive')}
         </Badge>
      )
    },
  ];

  const instanceColumns = [
    { field: 'entityCode', header: t.dt_entity_code || 'Code', width: 'w-32' },
    { field: 'title', header: t.dt_entity_title || 'Title', width: 'w-64' },
    { 
      field: 'status', 
      header: t.active_status || 'Status', 
      width: 'w-24',
      render: (row) => (
         <Badge variant={row.status ? 'success' : 'neutral'}>
            {row.status ? (t.active || 'Active') : (t.inactive || 'Inactive')}
         </Badge>
      )
    },
    { 
      field: 'detailCode', 
      header: t.dt_alloc_code || 'Detail Code', 
      width: 'w-48',
      render: (row) => {
        if (row.detailCode) {
           return <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded">{row.detailCode}</span>;
        } else {
           return (
             <Button 
                variant="ghost" 
                size="sm" 
                icon={Key} 
                onClick={() => handleOpenAssign(row)}
                className="text-orange-600 hover:bg-orange-50 hover:text-orange-700 h-7 text-xs"
             >
                {t.dt_assign_btn || 'Assign'}
             </Button>
           );
        }
      }
    },
  ];

  return (
    <div className="h-full flex flex-col p-4">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-slate-800">{t.details_title || 'Details'}</h1>
        <p className="text-slate-500 text-xs mt-1">{t.details_subtitle || 'Manage detail codes'}</p>
      </div>

      <FilterSection 
        onSearch={() => {}} 
        onClear={() => setSearchParams({ title: '', type: 'all' })} 
        isRtl={isRtl} 
        title={t.filter || 'Filter'}
      >
        <InputField 
          label={t.dt_type_title || 'Title'} 
          value={searchParams.title} 
          onChange={e => setSearchParams({...searchParams, title: e.target.value})}
          isRtl={isRtl}
        />
        <SelectField 
          label={t.dt_category || 'Category'}
          value={searchParams.type}
          onChange={e => setSearchParams({...searchParams, type: e.target.value})}
          isRtl={isRtl}
        >
          <option value="all">{t.opt_all_types || 'All'}</option>
          <option value="system">{t.dt_system || 'System'}</option>
          <option value="user">{t.dt_user || 'User'}</option>
        </SelectField>
      </FilterSection>

      <div className="flex-1 overflow-hidden">
        <DataGrid 
          columns={mainColumns}
          data={filteredDetails}
          onCreate={handleCreate}
          onDelete={(ids) => {
             const hasSystem = ids.some(id => detailTypes.find(d => d.id === id)?.type === 'system');
             if (!hasSystem) handleDelete(ids);
             else alert(isRtl ? "موارد سیستمی قابل حذف نیستند." : "System details cannot be deleted.");
          }}
          onDoubleClick={(row) => row.type === 'user' ? handleEdit(row) : handleViewInstances(row)}
          isRtl={isRtl}
          selectable={true}
          actions={(row) => (
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="iconSm" 
                icon={List} 
                onClick={() => handleViewInstances(row)} 
                title={t.dt_view_instances || 'View'} 
                className="text-blue-600 hover:bg-blue-50"
              />
              {row.type === 'user' && (
                <>
                  <Button variant="ghost" size="iconSm" icon={Edit} onClick={() => handleEdit(row)} title={t.edit || 'Edit'} />
                  <Button variant="ghost" size="iconSm" icon={Trash2} onClick={() => handleDelete([row.id])} title={t.delete || 'Delete'} className="text-red-500 hover:text-red-700 hover:bg-red-50" />
                </>
              )}
            </div>
          )}
        />
      </div>

      <Modal
        isOpen={showTypeModal}
        onClose={() => setShowTypeModal(false)}
        title={editingItem ? (t.dt_edit || 'Edit') : (t.dt_new || 'New')}
        footer={
          <>
            <Button variant="outline" onClick={() => setShowTypeModal(false)}>{t.btn_cancel || 'Cancel'}</Button>
            <Button variant="primary" onClick={handleSaveType}>{t.btn_save || 'Save'}</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <InputField 
            label={t.dt_type_title || 'Title'} 
            value={formData.title} 
            onChange={e => setFormData({...formData, title: e.target.value})}
            isRtl={isRtl}
          />
          <div className="flex items-center gap-2 mt-2">
            <input 
              type="checkbox" 
              id="isActiveCheck"
              checked={formData.isActive} 
              onChange={e => setFormData({...formData, isActive: e.target.checked})} 
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
            />
            <label htmlFor="isActiveCheck" className="text-sm font-medium text-slate-700 cursor-pointer">
              {isRtl ? 'فعال' : 'Active'}
            </label>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showInstanceModal}
        onClose={() => setShowInstanceModal(false)}
        title={selectedDetailType ? `${t.dt_instance_list || 'Instances for'} ${selectedDetailType.title}` : (t.dt_instances || 'Instances')}
        size="lg"
        footer={
          <Button variant="outline" onClick={() => setShowInstanceModal(false)}>{t.btn_close || 'Close'}</Button>
        }
      >
        <div className="flex flex-col h-[400px]">
          <div className="mb-4 flex justify-between items-center bg-slate-50 p-3 rounded border border-slate-100">
             <div className="text-sm text-slate-600">
               {isRtl ? 'کدهای تفصیلی برای برقراری ارتباط با ماژول حسابداری استفاده می‌شوند.' : 'Detail codes are used to link entities with accounting records.'}
             </div>
          </div>
          <div className="flex-1 border rounded-lg overflow-hidden relative">
            <DataGrid 
              columns={instanceColumns}
              data={currentInstances}
              isRtl={isRtl}
              selectable={false} 
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title={t.dt_assign_title || 'Assign Code'}
        size="sm"
        footer={
           <>
             <Button variant="outline" onClick={() => setShowAssignModal(false)}>{t.btn_cancel || 'Cancel'}</Button>
             <Button variant="primary" onClick={handleSaveCode}>{t.btn_save || 'Save'}</Button>
           </>
        }
      >
         <div className="flex flex-col gap-4">
            <div className="text-sm text-slate-600 mb-2">
               {t.dt_enter_code || 'Enter code for:'}
               <div className="font-bold text-slate-800 mt-1">{assigningItem?.title}</div>
            </div>
            <InputField 
               value={newDetailCode}
               onChange={(e) => setNewDetailCode(e.target.value)}
               placeholder="e.g. 201005"
               isRtl={isRtl}
               autoFocus
               className="dir-ltr"
            />
         </div>
      </Modal>

    </div>
  );
};

window.Details = Details;
export default Details;
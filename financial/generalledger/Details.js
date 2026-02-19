/* Filename: financial/generalledger/Details.js */
import React, { useState, useEffect, useMemo } from 'react';
import { Edit, Trash2, List, Shield, UserCog, Key, Plus, Check } from 'lucide-react';

const Details = ({ t, isRtl }) => {
  const { 
    Button, InputField, SelectField, DataGrid, 
    FilterSection, Modal, Badge 
  } = window.UI;
  const supabase = window.supabase;

  // --- States ---
  const [detailTypes, setDetailTypes] = useState([]);
  const [currentInstances, setCurrentInstances] = useState([]);
  
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showInstanceModal, setShowInstanceModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [searchParams, setSearchParams] = useState({ title: '', type: 'all' });
  const [selectedDetailType, setSelectedDetailType] = useState(null);
  
  const [assigningItem, setAssigningItem] = useState(null);
  const [newDetailCode, setNewDetailCode] = useState('');
  const [newDetailTitle, setNewDetailTitle] = useState('');

  // --- Effects ---
  useEffect(() => {
    fetchDetailTypes();
  }, []);

  // --- DB Operations ---
  const fetchDetailTypes = async () => {
    try {
      const { data, error } = await supabase
        .schema('gl')
        .from('detail_types')
        .select('*')
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      
      const mappedData = data.map(item => ({
        id: item.id,
        code: item.code,
        title: item.title,
        type: item.type,
        isActive: item.is_active,
        startCode: item.start_code,
        lastCode: item.last_code,
        length: item.numbering_length
      }));
      setDetailTypes(mappedData);
    } catch (err) {
      console.error('Error fetching detail types:', err);
    }
  };

  const fetchInstancesForType = async (typeObj) => {
    if (!typeObj) return;
    
    try {
      if (typeObj.type === 'user') {
        const { data, error } = await supabase.schema('gl').from('detail_instances').select('*').eq('detail_type_code', typeObj.code);
        if (error) throw error;
        
        setCurrentInstances(data.map(d => ({ 
          id: d.id, 
          entityCode: d.entity_code || '-', 
          title: d.title, 
          status: d.status !== false, 
          detailCode: d.detail_code 
        })));
      } else {
        // System Types Mapping
        let tableName, schemaName = 'gen', titleField = 'title', codeField = 'code', statusField = 'is_active', hasDetailCodeCol = false;
        
        switch (typeObj.code) {
          case 'sys_cost_center': tableName = 'cost_centers'; hasDetailCodeCol = true; break;
          case 'sys_project': tableName = 'projects'; titleField = 'name'; hasDetailCodeCol = true; break;
          case 'sys_partner': tableName = 'parties'; titleField = 'name'; break;
          case 'sys_branch': tableName = 'branches'; break;
          default: 
            // Fallback for unknown system types
            const { data: fbData } = await supabase.schema('gl').from('detail_instances').select('*').eq('detail_type_code', typeObj.code);
            setCurrentInstances((fbData || []).map(d => ({ id: d.id, entityCode: d.entity_code || '-', title: d.title, status: d.status !== false, detailCode: d.detail_code })));
            return;
        }

        const { data: entityData, error: eErr } = await supabase.schema(schemaName).from(tableName).select('*');
        if (eErr) throw eErr;
        
        let detailsData = [];
        if (!hasDetailCodeCol) {
          const { data: dData } = await supabase.schema('gl').from('detail_instances').select('*').eq('detail_type_code', typeObj.code);
          detailsData = dData || [];
        }

        const mapped = (entityData || []).map(item => {
          let dCode = null;
          let instId = null;

          if (hasDetailCodeCol) {
            dCode = item.detail_code;
          } else {
            const f = detailsData.find(d => d.entity_code === item[codeField]);
            if (f) {
              dCode = f.detail_code;
              instId = f.id;
            }
          }

          return {
            id: item.id, 
            entityCode: item[codeField],
            title: item[titleField] || item.name,
            status: item[statusField] !== false,
            detailCode: dCode,
            detailInstanceId: instId, 
            tableName,
            hasDetailCodeCol
          };
        });
        
        setCurrentInstances(mapped);
      }
    } catch (err) {
      console.error('Error fetching instances:', err);
    }
  };

  const handleSaveType = async () => {
    if (!formData.title) return alert(t.alert_req_fields || (isRtl ? 'لطفاً فیلدهای اجباری را پر کنید.' : 'Please fill required fields.'));
    
    const payload = {
      title: formData.title,
      is_active: formData.isActive,
      type: 'user'
    };

    try {
      if (editingItem && editingItem.id) {
        const { error } = await supabase.schema('gl').from('detail_types').update(payload).eq('id', editingItem.id);
        if (error) throw error;
      } else {
        payload.code = `usr_${Date.now()}`;
        const { error } = await supabase.schema('gl').from('detail_types').insert([payload]);
        if (error) throw error;
      }

      setShowTypeModal(false);
      fetchDetailTypes();
    } catch (err) {
      console.error('Error saving type:', err);
      alert(isRtl ? 'خطا در ثبت اطلاعات.' : 'Error saving data.');
    }
  };

  const handleDelete = async (ids) => {
    const typesToDelete = detailTypes.filter(d => ids.includes(d.id) && d.type === 'user');
    if (typesToDelete.length === 0) return;

    if (window.confirm(t.confirm_delete?.replace('{0}', typesToDelete.length) || (isRtl ? `آیا از حذف ${typesToDelete.length} مورد مطمئن هستید؟` : `Delete ${typesToDelete.length} items?`))) {
      try {
        const idsToDelete = typesToDelete.map(t => t.id);
        const { error } = await supabase.schema('gl').from('detail_types').delete().in('id', idsToDelete);
        if (error) throw error;
        
        fetchDetailTypes();
      } catch (err) {
        console.error('Error deleting type:', err);
        alert(isRtl ? 'خطا در حذف اطلاعات.' : 'Error deleting.');
      }
    }
  };

  const handleSaveCode = async () => {
    if (!newDetailCode) return alert(isRtl ? 'لطفا کد را وارد کنید' : 'Please enter a code');
    if (assigningItem?.isNew && !newDetailTitle) return alert(isRtl ? 'لطفا عنوان را وارد کنید' : 'Please enter title');

    try {
      if (selectedDetailType.type === 'system') {
        if (assigningItem.hasDetailCodeCol) {
          const { error } = await supabase.schema('gen').from(assigningItem.tableName).update({ detail_code: newDetailCode }).eq('id', assigningItem.id);
          if (error) throw error;
        } else {
          if (assigningItem.detailInstanceId) {
            const { error } = await supabase.schema('gl').from('detail_instances').update({ detail_code: newDetailCode }).eq('id', assigningItem.detailInstanceId);
            if (error) throw error;
          } else {
            const { error } = await supabase.schema('gl').from('detail_instances').insert([{
              detail_type_code: selectedDetailType.code,
              entity_code: assigningItem.entityCode,
              title: assigningItem.title,
              detail_code: newDetailCode,
              ref_entity_name: `gen.${assigningItem.tableName}`
            }]);
            if (error) throw error;
          }
        }
      } else {
        // User type
        if (assigningItem.isNew) {
          const { error } = await supabase.schema('gl').from('detail_instances').insert([{
            detail_type_code: selectedDetailType.code,
            title: newDetailTitle,
            detail_code: newDetailCode,
            status: true
          }]);
          if (error) throw error;
        } else {
          const { error } = await supabase.schema('gl').from('detail_instances').update({ detail_code: newDetailCode, title: newDetailTitle }).eq('id', assigningItem.id);
          if (error) throw error;
        }
      }

      // Update AutoNumbering last_code
      if (newDetailCode && (!assigningItem || !assigningItem.detailCode)) {
        await supabase.schema('gl').from('detail_types').update({ last_code: newDetailCode }).eq('code', selectedDetailType.code);
        // Refresh details type state silently to get updated last_code
        fetchDetailTypes();
      }

      setShowAssignModal(false);
      setAssigningItem(null);
      fetchInstancesForType(selectedDetailType);
    } catch (err) {
      console.error('Error saving code:', err);
      alert(isRtl ? 'خطا در ثبت اطلاعات.' : 'Error saving code.');
    }
  };

  // --- Derived Data ---
  const filteredDetails = useMemo(() => {
    return detailTypes.filter(item => {
      const matchTitle = item.title.toLowerCase().includes(searchParams.title.toLowerCase());
      const matchType = searchParams.type === 'all' ? true : item.type === searchParams.type;
      return matchTitle && matchType;
    });
  }, [detailTypes, searchParams]);

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
    fetchInstancesForType(item);
    setShowInstanceModal(true);
  };

  const generateNextCode = (typeObj) => {
    const lastCode = typeObj.lastCode;
    const startCode = typeObj.startCode;
    const length = typeObj.length || 4;
    
    let nextNum;
    if (lastCode && !isNaN(parseInt(lastCode, 10))) {
        nextNum = parseInt(lastCode, 10) + 1;
    } else if (startCode && !isNaN(parseInt(startCode, 10))) {
        nextNum = parseInt(startCode, 10);
    } else {
        nextNum = 1;
    }
    return nextNum.toString().padStart(length, '0');
  };

  const handleOpenAssign = (instance, isNew = false) => {
    if (isNew) {
      setAssigningItem({ isNew: true, title: '' });
      setNewDetailTitle('');
      setNewDetailCode(generateNextCode(selectedDetailType));
    } else {
      setAssigningItem(instance);
      setNewDetailTitle(instance.title);
      if (instance.detailCode) {
        setNewDetailCode(instance.detailCode);
      } else {
        setNewDetailCode(generateNextCode(selectedDetailType));
      }
    }
    setShowAssignModal(true);
  };

  // --- Column Definitions ---
  const mainColumns = [
    { field: 'title', header: t.dt_type_title || (isRtl ? 'عنوان نوع تفصیل' : 'Title'), width: 'w-64', sortable: true },
    { 
      field: 'type', 
      header: t.dt_category || (isRtl ? 'دسته‌بندی' : 'Category'), 
      width: 'w-32',
      render: (row) => (
        <Badge variant={row.type === 'system' ? 'primary' : 'warning'} icon={row.type === 'system' ? Shield : UserCog}>
          {row.type === 'system' ? (t.dt_system || (isRtl ? 'سیستمی' : 'System')) : (t.dt_user || (isRtl ? 'کاربرساز' : 'User'))}
        </Badge>
      )
    },
    { 
      field: 'isActive', 
      header: t.active_status || (isRtl ? 'وضعیت' : 'Status'), 
      width: 'w-24',
      render: (row) => (
         <Badge variant={row.isActive ? 'success' : 'neutral'}>
            {row.isActive ? (t.active || (isRtl ? 'فعال' : 'Active')) : (t.inactive || (isRtl ? 'غیرفعال' : 'Inactive'))}
         </Badge>
      )
    },
  ];

  const instanceColumns = [
    { field: 'entityCode', header: t.dt_entity_code || (isRtl ? 'کد موجودیت' : 'Code'), width: 'w-32', className: 'font-mono' },
    { field: 'title', header: t.dt_entity_title || (isRtl ? 'عنوان تفصیل' : 'Title'), width: 'w-64', render: r => <span className="font-bold text-slate-700">{r.title}</span> },
    { 
      field: 'status', 
      header: t.active_status || (isRtl ? 'وضعیت' : 'Status'), 
      width: 'w-24',
      render: (row) => (
         <Badge variant={row.status ? 'success' : 'neutral'}>
            {row.status ? (t.active || (isRtl ? 'فعال' : 'Active')) : (t.inactive || (isRtl ? 'غیرفعال' : 'Inactive'))}
         </Badge>
      )
    },
    { 
      field: 'detailCode', 
      header: t.dt_alloc_code || (isRtl ? 'کد تفصیل' : 'Detail Code'), 
      width: 'w-48',
      render: (row) => {
        if (row.detailCode) {
           return (
             <div className="flex items-center gap-2 group cursor-pointer" onClick={() => handleOpenAssign(row)}>
               <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded transition-colors group-hover:bg-indigo-100">{row.detailCode}</span>
               <Edit size={12} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
             </div>
           );
        } else {
           return (
             <Button 
                variant="ghost" 
                size="sm" 
                icon={Key} 
                onClick={() => handleOpenAssign(row)}
                className="text-orange-600 hover:bg-orange-50 hover:text-orange-700 h-7 text-xs"
             >
                {t.dt_assign_btn || (isRtl ? 'تخصیص کد' : 'Assign')}
             </Button>
           );
        }
      }
    },
  ];

  return (
    <div className="h-full flex flex-col p-4 bg-slate-50/50">
      <div className="mb-4 flex items-center gap-3 shrink-0">
        <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200">
           <List size={24} />
        </div>
        <div>
           <h1 className="text-xl font-bold text-slate-800">{t.details_title || (isRtl ? 'انواع تفصیل‌ها' : 'Detail Types')}</h1>
           <p className="text-slate-500 text-xs mt-1">{t.details_subtitle || (isRtl ? 'مدیریت و پیکربندی انواع تفصیل و کدهای مرتبط' : 'Manage detail types and code allocation')}</p>
        </div>
      </div>

      <FilterSection 
        onSearch={() => {}} 
        onClear={() => setSearchParams({ title: '', type: 'all' })} 
        isRtl={isRtl} 
      >
        <InputField 
          label={t.dt_type_title || (isRtl ? 'عنوان نوع' : 'Title')} 
          value={searchParams.title} 
          onChange={e => setSearchParams({...searchParams, title: e.target.value})}
          isRtl={isRtl}
        />
        <SelectField 
          label={t.dt_category || (isRtl ? 'دسته‌بندی' : 'Category')}
          value={searchParams.type}
          onChange={e => setSearchParams({...searchParams, type: e.target.value})}
          isRtl={isRtl}
        >
          <option value="all">{t.opt_all_types || (isRtl ? 'همه موارد' : 'All')}</option>
          <option value="system">{t.dt_system || (isRtl ? 'سیستمی' : 'System')}</option>
          <option value="user">{t.dt_user || (isRtl ? 'کاربرساز' : 'User')}</option>
        </SelectField>
      </FilterSection>

      <div className="flex-1 bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
        <DataGrid 
          columns={mainColumns}
          data={filteredDetails}
          onCreate={handleCreate}
          onDelete={(ids) => {
             const hasSystem = ids.some(id => detailTypes.find(d => d.id === id)?.type === 'system');
             if (!hasSystem) handleDelete(ids);
             else alert(isRtl ? "انواع تفصیل سیستمی قابل حذف نیستند." : "System details cannot be deleted.");
          }}
          onDoubleClick={(row) => handleViewInstances(row)}
          isRtl={isRtl}
          selectable={true}
          actions={(row) => (
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="iconSm" 
                icon={List} 
                onClick={() => handleViewInstances(row)} 
                title={t.dt_view_instances || (isRtl ? 'مشاهده زیرمجموعه‌ها' : 'View Instances')} 
                className="text-blue-600 hover:bg-blue-50"
              />
              {row.type === 'user' && (
                <>
                  <Button variant="ghost" size="iconSm" icon={Edit} onClick={() => handleEdit(row)} />
                  <Button variant="ghost" size="iconSm" icon={Trash2} onClick={() => handleDelete([row.id])} className="text-red-500 hover:text-red-700 hover:bg-red-50" />
                </>
              )}
            </div>
          )}
        />
      </div>

      <Modal
        isOpen={showTypeModal}
        onClose={() => setShowTypeModal(false)}
        title={editingItem ? (t.dt_edit || (isRtl ? 'ویرایش نوع تفصیل' : 'Edit Detail Type')) : (t.dt_new || (isRtl ? 'نوع تفصیل جدید' : 'New Detail Type'))}
        footer={
          <>
            <Button variant="outline" onClick={() => setShowTypeModal(false)}>{t.btn_cancel || (isRtl ? 'انصراف' : 'Cancel')}</Button>
            <Button variant="primary" onClick={handleSaveType}>{t.btn_save || (isRtl ? 'ذخیره' : 'Save')}</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <InputField 
            label={`${t.dt_type_title || (isRtl ? 'عنوان' : 'Title')} *`} 
            value={formData.title} 
            onChange={e => setFormData({...formData, title: e.target.value})}
            isRtl={isRtl}
          />
          <div className={`flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg ${isRtl ? 'pl-4 pr-3' : 'pr-4 pl-3'}`}>
             <span className="text-sm font-bold text-slate-700">{t.active_status || (isRtl ? 'فعال' : 'Active')}</span>
             <input 
               type="checkbox" 
               className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
               checked={formData.isActive} 
               onChange={e => setFormData({...formData, isActive: e.target.checked})} 
             />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showInstanceModal}
        onClose={() => setShowInstanceModal(false)}
        title={selectedDetailType ? `${t.dt_instance_list || (isRtl ? 'آیتم‌های تفصیل:' : 'Instances for')} ${selectedDetailType.title}` : (t.dt_instances || 'Instances')}
        size="2xl"
        footer={
          <Button variant="outline" onClick={() => setShowInstanceModal(false)}>{t.btn_close || (isRtl ? 'بستن' : 'Close')}</Button>
        }
      >
        <div className="flex flex-col h-[500px]">
          <div className="mb-4 flex justify-between items-center bg-slate-50 p-3 rounded border border-slate-100">
             <div className="text-sm text-slate-600 font-medium">
               {isRtl ? 'کدهای تفصیلی برای برقراری ارتباط موجودیت‌ها با ماژول حسابداری استفاده می‌شوند.' : 'Detail codes are used to link entities with accounting records.'}
             </div>
             {selectedDetailType?.type === 'user' && (
                <Button variant="primary" size="sm" icon={Plus} onClick={() => handleOpenAssign(null, true)}>
                   {isRtl ? 'ایجاد آیتم جدید' : 'New Instance'}
                </Button>
             )}
          </div>
          <div className="flex-1 border rounded-lg overflow-hidden relative bg-white">
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
        title={t.dt_assign_title || (isRtl ? 'تخصیص کد تفصیل' : 'Assign Code')}
        size="sm"
        footer={
           <>
             <Button variant="outline" onClick={() => setShowAssignModal(false)}>{t.btn_cancel || (isRtl ? 'انصراف' : 'Cancel')}</Button>
             <Button variant="primary" icon={Check} onClick={handleSaveCode}>{t.btn_save || (isRtl ? 'ذخیره' : 'Save')}</Button>
           </>
        }
      >
         <div className="flex flex-col gap-4">
            <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-lg leading-relaxed font-medium">
               {assigningItem?.isNew 
                 ? (isRtl ? `تعریف آیتم جدید برای تفصیل: ${selectedDetailType?.title}` : `New instance for: ${selectedDetailType?.title}`)
                 : (isRtl ? `در حال تخصیص کد تفصیلی به: ${assigningItem?.title}` : `Assigning detail code for: ${assigningItem?.title}`)
               }
            </div>
            
            {(assigningItem?.isNew || selectedDetailType?.type === 'user') && (
               <InputField 
                  label={t.dt_entity_title || (isRtl ? 'عنوان آیتم' : 'Title')}
                  value={newDetailTitle}
                  onChange={(e) => setNewDetailTitle(e.target.value)}
                  isRtl={isRtl}
               />
            )}

            <InputField 
               label={t.detail_code || (isRtl ? 'کد تفصیل' : 'Detail Code')}
               value={newDetailCode}
               onChange={(e) => setNewDetailCode(e.target.value)}
               placeholder="Example: 201005"
               isRtl={isRtl}
               autoFocus
               className="dir-ltr text-center font-bold text-lg tracking-wider"
            />
         </div>
      </Modal>

    </div>
  );
};

window.Details = Details;
export default Details;
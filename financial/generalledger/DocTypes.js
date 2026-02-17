/* Filename: financial/generalledger/DocTypes.js */
import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, Edit, Trash2, Plus, Shield, UserCog, Ban 
} from 'lucide-react';

const DocTypes = ({ t, isRtl }) => {
  const UI = window.UI || {};
  const { 
    Button, InputField, SelectField, DataGrid, 
    FilterSection, Modal, Badge 
  } = UI;
  const supabase = window.supabase;

  // --- Resilient Permission Checks ---
  const checkAccess = (action = null) => {
    if (!window.hasAccess) return false;
    const variations = ['doc_types', 'doctypes', 'doc_type', 'doctype'];
    for (const res of variations) {
       if (window.hasAccess(res, action)) return true;
    }
    return false;
  };

  const canEnterForm = checkAccess(); 
  const canView   = canEnterForm || checkAccess('view') || checkAccess('read') || checkAccess('show');
  const canCreate = checkAccess('create') || checkAccess('new') || checkAccess('add') || checkAccess('insert');
  const canEdit   = checkAccess('edit') || checkAccess('update') || checkAccess('modify');
  const canDelete = checkAccess('delete') || checkAccess('remove') || checkAccess('destroy');

  // --- State ---
  const [docTypes, setDocTypes] = useState([]);
  const [searchParams, setSearchParams] = useState({ title: '', type: 'all' });
  
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});

  // --- Effects ---
  useEffect(() => {
    if (canView) {
      fetchData();
    }
  }, [canView]);

  // --- DB Operations ---
  const fetchData = async () => {
    try {
      const { data, error } = await supabase
        .schema('gl')
        .from('doc_types')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      const mappedData = (data || []).map(item => ({
        id: item.id,
        code: item.code || '',
        title: item.title || '',
        type: item.type || 'user',
        description: item.description || '',
        isActive: item.is_active !== undefined ? item.is_active : true,
      }));
      
      setDocTypes(mappedData);
    } catch (err) {
      console.error('Error fetching data:', err);
      alert((isRtl ? 'خطا در دریافت اطلاعات' : 'Fetch Error'));
    }
  };

  const handleSave = async () => {
    if (editingItem && editingItem.id && !canEdit) {
      return alert(t.err_access_denied || (isRtl ? 'دسترسی غیرمجاز برای ویرایش' : 'Access Denied for Edit'));
    }
    if ((!editingItem || !editingItem.id) && !canCreate) {
      return alert(t.err_access_denied || (isRtl ? 'دسترسی غیرمجاز برای ایجاد' : 'Access Denied for Create'));
    }

    if (!formData.title) return alert(t.alert_req_fields || (isRtl ? 'عنوان سند الزامی است.' : 'Title is required.'));

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        is_active: formData.isActive
      };

      if (!editingItem) {
         payload.type = 'user'; // New types are strictly user-defined
      }

      if (editingItem && editingItem.id) {
        const { error } = await supabase.schema('gl').from('doc_types').update(payload).eq('id', editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.schema('gl').from('doc_types').insert([payload]);
        if (error) throw error;
      }

      setShowModal(false);
      fetchData();
    } catch (err) {
      console.error('Error saving data:', err);
      alert(isRtl ? 'خطا در ثبت اطلاعات' : 'Save Error');
    }
  };

  const handleDelete = async (id) => {
    if (!canDelete) return alert(t.err_access_denied || (isRtl ? 'دسترسی غیرمجاز برای حذف' : 'Access Denied for Delete'));
    
    const item = docTypes.find(d => d.id === id);
    if (!item || item.type === 'system') {
       return alert(isRtl ? 'اسناد سیستمی قابل حذف نیستند.' : 'System types cannot be deleted.');
    }

    if (window.confirm(t.confirm_delete?.replace('{0}', 1) || (isRtl ? 'آیا از حذف این نوع سند اطمینان دارید؟' : 'Delete this item?'))) {
      try {
        const { error } = await supabase.schema('gl').from('doc_types').delete().eq('id', id);
        if (error) throw error;
        fetchData();
      } catch (err) {
        console.error('Error deleting data:', err);
      }
    }
  };

  const handleToggleActive = async (id, currentType, newVal) => {
    if (!canEdit) return alert(isRtl ? 'دسترسی غیرمجاز برای ویرایش' : 'Access Denied for Edit');
    if (currentType === 'system') return alert(isRtl ? 'اسناد سیستمی قابل غیرفعال شدن نیستند.' : 'System types cannot be modified.');
    
    try {
      const { error } = await supabase.schema('gl').from('doc_types').update({ is_active: newVal }).eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  // --- UI Handlers ---
  const handleCreate = () => {
    if (!canCreate) return alert(isRtl ? 'دسترسی ایجاد ندارید.' : 'Access Denied');
    setEditingItem(null);
    setFormData({ title: '', description: '', isActive: true, type: 'user' });
    setShowModal(true);
  };

  const handleEdit = (item) => {
    if (!canEdit) return alert(isRtl ? 'دسترسی ویرایش ندارید.' : 'Access Denied');
    if (item.type === 'system') return alert(isRtl ? 'انواع سند سیستمی قابل ویرایش نیستند.' : 'System types cannot be edited.');
    
    setEditingItem(item);
    setFormData({ ...item });
    setShowModal(true);
  };

  // --- Filtering ---
  const filteredData = useMemo(() => {
    return docTypes.filter(item => {
      const matchTitle = item.title.toLowerCase().includes(searchParams.title.toLowerCase());
      const matchType = searchParams.type === 'all' ? true : item.type === searchParams.type;
      return matchTitle && matchType;
    });
  }, [docTypes, searchParams]);

  // --- Views ---
  if (!canView) {
    return (
      <div className={`flex flex-col items-center justify-center h-full bg-slate-50/50 ${isRtl ? 'font-vazir' : 'font-sans'}`}>
        <div className="p-6 bg-white rounded-2xl shadow-sm text-center border border-red-100">
           <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
             <Ban className="text-red-500" size={32} />
           </div>
           <h2 className="text-lg font-bold text-slate-800">{isRtl ? 'دسترسی غیرمجاز' : 'Access Denied'}</h2>
           <p className="text-sm text-slate-500 mt-2">{isRtl ? 'شما مجوز مشاهده این فرم را ندارید.' : 'You do not have permission to view this form.'}</p>
        </div>
      </div>
    );
  }

  const columns = [
    { field: 'title', header: t.dt_doc_title || (isRtl ? 'عنوان نوع سند' : 'Document Title'), width: 'w-64', sortable: true },
    { 
      field: 'type', 
      header: t.dt_category || (isRtl ? 'دسته‌بندی' : 'Category'), 
      width: 'w-32',
      render: (row) => (
        <Badge variant={row.type === 'system' ? 'primary' : 'warning'} icon={row.type === 'system' ? Shield : UserCog}>
          {row.type === 'system' ? (t.dt_auto_type || (isRtl ? 'سیستمی' : 'System')) : (t.dt_manual_type || (isRtl ? 'کاربری' : 'User Defined'))}
        </Badge>
      )
    },
    { field: 'description', header: t.description || (isRtl ? 'توضیحات' : 'Description'), width: 'flex-1' },
    { 
      field: 'isActive', 
      header: t.active_status || (isRtl ? 'فعال' : 'Active'), 
      width: 'w-24',
      render: (row) => (
         <div className="flex justify-center">
            <input 
              type="checkbox" 
              className={`w-4 h-4 rounded border-slate-300 ${row.type === 'system' ? 'text-indigo-400 cursor-not-allowed opacity-50' : 'text-indigo-600 focus:ring-indigo-500 cursor-pointer'}`}
              checked={row.isActive} 
              onChange={(e) => handleToggleActive(row.id, row.type, e.target.checked)} 
              disabled={row.type === 'system'}
            />
         </div>
      )
    },
  ];

  return (
    <div className={`h-full flex flex-col p-4 md:p-6 bg-slate-50/50 ${isRtl ? 'font-vazir' : 'font-sans'}`}>
      
      <div className="mb-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200">
            <FileText size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800">{t.doctype_title || (isRtl ? 'انواع اسناد' : 'Document Types')}</h1>
            <p className="text-xs text-slate-500 font-medium mt-1">{t.doctype_subtitle || (isRtl ? 'مدیریت و تعریف انواع سند حسابداری' : 'Manage accounting document types')}</p>
          </div>
        </div>
      </div>

      <FilterSection 
        onSearch={() => {}} 
        onClear={() => setSearchParams({ title: '', type: 'all' })} 
        isRtl={isRtl} 
        title={t.filter || (isRtl ? 'فیلترها' : 'Filters')}
      >
        <InputField 
          label={t.dt_doc_title || (isRtl ? 'عنوان' : 'Title')} 
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
          <option value="all">{t.filter_allStatus || (isRtl ? 'همه' : 'All')}</option>
          <option value="system">{t.dt_auto_type || (isRtl ? 'سیستمی' : 'System')}</option>
          <option value="user">{t.dt_manual_type || (isRtl ? 'کاربری' : 'User Defined')}</option>
        </SelectField>
      </FilterSection>

      <div className="flex-1 min-h-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <DataGrid 
          columns={columns}
          data={filteredData}
          onCreate={canCreate ? handleCreate : undefined}
          isRtl={isRtl}
          onDoubleClick={(row) => {
             if (row.type !== 'system' && canEdit) handleEdit(row);
          }}
          actions={(row) => (
            <div className="flex gap-1 items-center justify-center">
              {canEdit && (
                <Button 
                  variant="ghost" 
                  size="iconSm" 
                  icon={Edit} 
                  onClick={() => handleEdit(row)} 
                  title={t.edit || (isRtl ? 'ویرایش' : 'Edit')}
                  disabled={row.type === 'system'}
                  className={row.type === 'system' ? 'opacity-30 cursor-not-allowed' : 'text-slate-600'}
                />
              )}
              {canDelete && (
                <Button 
                  variant="ghost" 
                  size="iconSm" 
                  icon={Trash2} 
                  onClick={() => handleDelete(row.id)} 
                  title={t.delete || (isRtl ? 'حذف' : 'Delete')}
                  disabled={row.type === 'system'}
                  className={row.type === 'system' ? 'opacity-30 cursor-not-allowed' : 'text-red-500 hover:bg-red-50'}
                />
              )}
            </div>
          )}
        />
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingItem ? (t.dt_edit_doc || (isRtl ? 'ویرایش نوع سند' : 'Edit Document Type')) : (t.dt_new_doc || (isRtl ? 'نوع سند جدید' : 'New Document Type'))}
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowModal(false)}>{t.btn_cancel || (isRtl ? 'انصراف' : 'Cancel')}</Button>
            <Button variant="primary" onClick={handleSave}>{t.btn_save || (isRtl ? 'ذخیره' : 'Save')}</Button>
          </>
        }
      >
        <div className="flex flex-col gap-5">
          <InputField 
            label={`${t.dt_doc_title || (isRtl ? 'عنوان نوع سند' : 'Title')} *`} 
            value={formData.title} 
            onChange={e => setFormData({...formData, title: e.target.value})} 
            isRtl={isRtl} 
            required
          />
          
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-600">{t.description || (isRtl ? 'توضیحات' : 'Description')}</label>
            <textarea
               className={`w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500 text-sm transition-colors ${isRtl ? 'text-right' : 'text-left'}`}
               rows={3}
               value={formData.description || ''}
               onChange={e => setFormData({...formData, description: e.target.value})}
               dir={isRtl ? 'rtl' : 'ltr'}
               placeholder="..."
            />
          </div>

          <div className={`flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg h-[50px] ${isRtl ? 'pr-4 pl-3' : 'pl-4 pr-3'}`}>
             <span className="text-sm font-bold text-slate-700">{t.active_status || (isRtl ? 'وضعیت فعال' : 'Active Status')}</span>
             <input 
               type="checkbox" 
               className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
               checked={formData.isActive} 
               onChange={e => setFormData({...formData, isActive: e.target.checked})} 
             />
          </div>
          
          <div className="text-xs text-orange-700 bg-orange-50 p-3 rounded-xl border border-orange-100 flex items-center gap-2 mt-2 leading-relaxed font-medium">
            <UserCog size={16} className="text-orange-500 shrink-0"/>
            {isRtl 
              ? 'این نوع سند به عنوان "کاربری" ذخیره خواهد شد و برخلاف اسناد سیستمی، در آینده قابل ویرایش یا حذف خواهد بود.' 
              : 'This document type will be saved as "User Defined" and can be edited/deleted.'}
          </div>
        </div>
      </Modal>
    </div>
  );
};

window.DocTypes = DocTypes;
export default DocTypes;
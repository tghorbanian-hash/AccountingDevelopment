/* Filename: components/OrganizationInfo.js */
import React, { useState, useEffect } from 'react';
import { 
  Building2, Search, Plus, Edit, Trash2, MapPin, 
  Phone, FileText, Upload, X, Save, Printer 
} from 'lucide-react';

const OrganizationInfo = ({ t, isRtl }) => {
  const UI = window.UI || {};
  const { Button, InputField, DataGrid, FilterSection, Modal, Badge } = UI;
  const supabase = window.supabase;

  // --- Permission Checks ---
  const canCreate = window.hasAccess ? window.hasAccess('org_info', 'create') : true;
  const canEdit   = window.hasAccess ? window.hasAccess('org_info', 'edit') : true;
  const canDelete = window.hasAccess ? window.hasAccess('org_info', 'delete') : true;

  // --- States ---
  const [data, setData] = useState([]);
  const [filters, setFilters] = useState({ code: '', name: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  
  // Form States
  const [formData, setFormData] = useState({});
  const [newAddress, setNewAddress] = useState('');

  // --- Effects ---
  useEffect(() => {
    fetchData();
  }, []);

  // --- DB Operations ---
  const fetchData = async () => {
    const { data: orgs, error } = await supabase
      .schema('gen')
      .from('organization_info')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching data:', error);
      return;
    }

    const mappedData = orgs.map(item => ({
      id: item.id,
      code: item.code,
      name: item.name,
      regNo: item.reg_no,
      phone: item.phone,
      fax: item.fax,
      logo: item.logo,
      addresses: item.addresses || []
    }));
    
    setData(mappedData);
  };

  const handleSave = async () => {
    if (!formData.code || !formData.name) {
      alert(t.req_org_fields || (isRtl ? 'لطفاً کد و نام سازمان را وارد کنید.' : 'Please enter Organization Code and Name.'));
      return;
    }

    const payload = {
      code: formData.code,
      name: formData.name,
      reg_no: formData.regNo,
      phone: formData.phone,
      fax: formData.fax,
      logo: formData.logo,
      addresses: formData.addresses || []
    };

    if (currentRecord && currentRecord.id) {
      const { error } = await supabase
        .schema('gen')
        .from('organization_info')
        .update(payload)
        .eq('id', currentRecord.id);

      if (error) {
        console.error('Error updating:', error);
        alert(t.err_update || (isRtl ? 'خطا در ویرایش اطلاعات.' : 'Error updating data.'));
        return;
      }
    } else {
      const { error } = await supabase
        .schema('gen')
        .from('organization_info')
        .insert([payload]);

      if (error) {
        console.error('Error inserting:', error);
        alert(t.err_insert || (isRtl ? 'خطا در ثبت اطلاعات.' : 'Error inserting data.'));
        return;
      }
    }

    setIsModalOpen(false);
    fetchData();
  };

  const handleDelete = async (ids) => {
    const confirmMsg = t.confirm_delete?.replace('{0}', ids.length) || (isRtl ? `آیا از حذف ${ids.length} مورد اطمینان دارید؟` : `Delete ${ids.length} items?`);
    if (confirm(confirmMsg)) {
      const { error } = await supabase
        .schema('gen')
        .from('organization_info')
        .delete()
        .in('id', ids);

      if (error) {
        console.error('Error deleting:', error);
        alert(t.err_delete || (isRtl ? 'خطا در حذف اطلاعات.' : 'Error deleting data.'));
        return;
      }

      setSelectedIds([]);
      fetchData();
    }
  };

  // --- Handlers ---
  const handleOpenModal = (record = null) => {
    if (record) {
      setFormData({ ...record });
    } else {
      setFormData({ code: '', name: '', regNo: '', phone: '', fax: '', logo: null, addresses: [] });
    }
    setCurrentRecord(record);
    setIsModalOpen(true);
  };

  const handleAddAddress = () => {
    if (!newAddress.trim()) return;
    setFormData(prev => ({
      ...prev,
      addresses: [...(prev.addresses || []), { id: Date.now(), text: newAddress }]
    }));
    setNewAddress('');
  };

  const handleRemoveAddress = (addrId) => {
    setFormData(prev => ({
      ...prev,
      addresses: prev.addresses.filter(a => a.id !== addrId)
    }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Columns Definition ---
  const columns = [
    { field: 'code', header: t.org_code || (isRtl ? 'کد' : 'Code'), width: 'w-24', sortable: true },
    { field: 'name', header: t.org_name || (isRtl ? 'نام' : 'Name'), width: 'w-64', sortable: true },
    { field: 'regNo', header: t.org_regNo || (isRtl ? 'شماره ثبت' : 'Reg No'), width: 'w-32' },
    { field: 'phone', header: t.org_phone || (isRtl ? 'تلفن' : 'Phone'), width: 'w-32' },
    { 
      field: 'addressCount', 
      header: t.org_addrCount || (isRtl ? 'تعداد آدرس' : 'Addr Count'), 
      width: 'w-24', 
      render: (row) => <Badge variant="info">{row.addresses?.length || 0}</Badge> 
    }
  ];

  // --- Filter Logic ---
  const filteredData = data.filter(item => {
    const matchCode = filters.code ? item.code.toLowerCase().includes(filters.code.toLowerCase()) : true;
    const matchName = filters.name ? item.name.toLowerCase().includes(filters.name.toLowerCase()) : true;
    return matchCode && matchName;
  });

  return (
    <div className={`flex flex-col h-full p-4 md:p-6 bg-slate-50/50 ${isRtl ? 'font-vazir' : 'font-sans'}`}>
      <div className="mb-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200">
            <Building2 size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800">{t.org_title || (isRtl ? 'اطلاعات سازمان' : 'Organization Info')}</h1>
            <p className="text-xs text-slate-500 font-medium mt-1">{t.org_subtitle || (isRtl ? 'مدیریت اطلاعات پایه شرکت' : 'Manage company info')}</p>
          </div>
        </div>
      </div>

      <FilterSection 
        isRtl={isRtl} 
        onSearch={() => {}} 
        onClear={() => setFilters({ code: '', name: '' })}
      >
        <InputField 
          label={t.org_code || (isRtl ? 'کد' : 'Code')} 
          placeholder="..." 
          isRtl={isRtl} 
          value={filters.code}
          onChange={(e) => setFilters(prev => ({ ...prev, code: e.target.value }))}
        />
        <InputField 
          label={t.org_name || (isRtl ? 'نام' : 'Name')} 
          placeholder="..." 
          isRtl={isRtl} 
          value={filters.name}
          onChange={(e) => setFilters(prev => ({ ...prev, name: e.target.value }))}
        />
      </FilterSection>

      <div className="flex-1 min-h-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <DataGrid 
          columns={columns} 
          data={filteredData} 
          selectedIds={selectedIds}
          onSelectRow={(id, checked) => setSelectedIds(prev => checked ? [...prev, id] : prev.filter(x => x !== id))}
          onSelectAll={(checked) => setSelectedIds(checked ? filteredData.map(d => d.id) : [])}
          onCreate={canCreate ? () => handleOpenModal() : undefined}
          onDelete={canDelete ? handleDelete : undefined}
          isRtl={isRtl}
          actions={(row) => (
            <>
              {canEdit && <Button variant="ghost" size="iconSm" icon={Edit} onClick={() => handleOpenModal(row)} title={t.edit || (isRtl ? 'ویرایش' : 'Edit')} />}
              {canDelete && <Button variant="ghost" size="iconSm" icon={Trash2} className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete([row.id])} title={t.delete || (isRtl ? 'حذف' : 'Delete')} />}
            </>
          )}
        />
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={currentRecord ? (t.org_editTitle || (isRtl ? 'ویرایش اطلاعات' : 'Edit Info')) : (t.org_newTitle || (isRtl ? 'سازمان جدید' : 'New Org'))}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>{t.btn_cancel || (isRtl ? 'انصراف' : 'Cancel')}</Button>
            <Button variant="primary" icon={Save} onClick={handleSave}>{t.btn_save || (isRtl ? 'ذخیره' : 'Save')}</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Logo Section */}
          <div className="md:col-span-2 flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
             {formData.logo ? (
               <div className="relative group">
                 <img src={formData.logo} alt="Logo" className="h-24 object-contain" />
                 <button 
                   onClick={() => setFormData(prev => ({ ...prev, logo: null }))}
                   className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                 >
                   <X size={12}/>
                 </button>
               </div>
             ) : (
               <div className="text-center">
                 <Upload size={32} className="mx-auto text-slate-400 mb-2"/>
                 <label className="cursor-pointer text-indigo-600 font-bold text-sm hover:underline">
                   <span>{t.org_selectLogo || (isRtl ? 'انتخاب لوگو' : 'Select Logo')}</span>
                   <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                 </label>
                 <p className="text-[10px] text-slate-400 mt-1">PNG, JPG up to 2MB</p>
               </div>
             )}
          </div>

          <InputField 
            label={`${t.org_code || (isRtl ? 'کد' : 'Code')} *`} 
            value={formData.code} 
            onChange={e => setFormData({...formData, code: e.target.value})} 
            isRtl={isRtl} 
            className="dir-ltr"
          />
          <InputField 
            label={`${t.org_name || (isRtl ? 'نام' : 'Name')} *`} 
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})} 
            isRtl={isRtl} 
          />
          <InputField 
            label={t.org_regNo || (isRtl ? 'شماره ثبت' : 'Reg No')} 
            value={formData.regNo} 
            onChange={e => setFormData({...formData, regNo: e.target.value})} 
            isRtl={isRtl} 
            className="dir-ltr"
          />
          <div className="grid grid-cols-2 gap-4">
             <InputField 
               label={t.org_phone || (isRtl ? 'تلفن' : 'Phone')} 
               value={formData.phone} 
               onChange={e => setFormData({...formData, phone: e.target.value})} 
               isRtl={isRtl} 
               className="dir-ltr"
             />
             <InputField 
               label={t.org_fax || (isRtl ? 'فکس' : 'Fax')} 
               value={formData.fax} 
               onChange={e => setFormData({...formData, fax: e.target.value})} 
               isRtl={isRtl} 
               className="dir-ltr"
             />
          </div>

          {/* Addresses Section */}
          <div className="md:col-span-2 bg-slate-50 rounded-xl p-4 border border-slate-200">
             <label className="block text-[11px] font-bold text-slate-600 mb-2 flex items-center gap-2">
               <MapPin size={14}/> {t.org_address || (isRtl ? 'آدرس‌ها' : 'Addresses')}
             </label>
             
             <div className="flex gap-2 mb-3">
               <InputField 
                 placeholder={t.org_newAddr || (isRtl ? 'آدرس جدید...' : 'New address...')} 
                 value={newAddress} 
                 onChange={e => setNewAddress(e.target.value)} 
                 isRtl={isRtl}
                 className="bg-white"
               />
               <Button variant="secondary" icon={Plus} onClick={handleAddAddress} />
             </div>

             <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
               {formData.addresses?.map((addr) => (
                 <div key={addr.id} className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200 text-xs">
                    <span className="truncate flex-1">{addr.text}</span>
                    <button onClick={() => handleRemoveAddress(addr.id)} className="text-slate-400 hover:text-red-500 px-2">
                      <Trash2 size={14}/>
                    </button>
                 </div>
               ))}
               {(!formData.addresses || formData.addresses.length === 0) && (
                 <p className="text-center text-[10px] text-slate-400 italic py-2">{t.org_noAddr || (isRtl ? 'آدرسی ثبت نشده است.' : 'No addresses.')}</p>
               )}
             </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

window.OrganizationInfo = OrganizationInfo;
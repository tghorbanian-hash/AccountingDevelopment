/* Filename: components/Parties.js */
import React, { useState, useMemo, useEffect, useRef } from 'react';
import * as LucideIcons from 'lucide-react';

const Parties = ({ t, isRtl }) => {
  const UI = window.UI || {};
  const { 
    Button, InputField, SelectField, Badge, 
    DataGrid, Modal, ToggleChip, SelectionGrid, DatePicker, FilterSection 
  } = UI;
  const supabase = window.supabase;

  const { 
    Users, Building2, User, Plus, Edit, Trash2, Check, X, 
    Link2, Ban, ChevronDown
  } = LucideIcons;

  // --- Resilient Permission Checks (Level 1 & 2) ---
  const checkAccess = (action = null) => {
    if (!window.hasAccess) return false;
    
    const variations = ['parties', 'party'];
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
  
  // Custom Action Permission
  const canAssignDetail = checkAccess('assign_detail') || checkAccess('assigndetail');

  // --- INTERNAL COMPONENT: MULTI-SELECT ---
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
    const toggleOption = (id) => {
      const newValue = value.includes(id) ? value.filter(v => v !== id) : [...value, id];
      onChange(newValue);
    };

    return (
      <div className="relative" ref={containerRef}>
        <div className="min-h-[32px] bg-white border border-slate-200 rounded-md flex flex-wrap items-center gap-1 p-1 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
          {value.length === 0 && <span className="text-slate-400 text-[11px] px-1">{placeholder}</span>}
          {value.map(id => (
            <span key={id} className="bg-indigo-50 text-indigo-700 border border-indigo-100 rounded px-1.5 py-0.5 text-[10px] flex items-center gap-1 font-bold">
              {options.find(o => o.id === id)?.label}
              <X size={10} onClick={(e) => { e.stopPropagation(); onChange(value.filter(v => v !== id)); }}/>
            </span>
          ))}
          <div className="ml-auto px-1 text-slate-400"><ChevronDown size={14}/></div>
        </div>
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg z-[100] max-h-48 overflow-y-auto p-2">
            <input className="w-full text-[11px] border border-slate-200 rounded px-2 py-1 mb-2 outline-none" placeholder={t.searchMenu || "Search..."} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onClick={e => e.stopPropagation()}/>
            {filteredOptions.map(opt => (
              <div key={opt.id} className={`px-3 py-2 text-[11px] cursor-pointer hover:bg-slate-50 flex items-center justify-between ${value.includes(opt.id) ? 'bg-indigo-50 text-indigo-700 font-bold' : ''}`} onClick={() => toggleOption(opt.id)}>
                {opt.label} {value.includes(opt.id) && <Check size={12}/>}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const PARTY_ROLES = [
    { id: 'employee', label: t.role_employee || (isRtl ? 'پرسنل' : 'Employee') }, 
    { id: 'customer', label: t.role_customer || (isRtl ? 'مشتری' : 'Customer') },
    { id: 'supplier', label: t.role_supplier || (isRtl ? 'تامین‌کننده' : 'Supplier') }, 
    { id: 'contractor', label: t.role_contractor || (isRtl ? 'پیمانکار' : 'Contractor') },
    { id: 'shareholder', label: t.role_shareholder || (isRtl ? 'سهامدار' : 'Shareholder') }, 
    { id: 'logistics', label: t.role_logistics || (isRtl ? 'لجستیک' : 'Logistics') },
    { id: 'cashier', label: t.role_cashier || (isRtl ? 'صندوق‌دار' : 'Cashier') }, 
    { id: 'petty_cashier', label: t.role_petty || (isRtl ? 'تنخواه‌دار' : 'Petty Cashier') },
    { id: 'bank', label: t.role_bank || (isRtl ? 'بانک' : 'Bank') }, 
    { id: 'trustee', label: t.role_trustee || (isRtl ? 'امین اموال' : 'Trustee') }, 
    { id: 'other', label: t.role_other || (isRtl ? 'سایر' : 'Other') }
  ];

  // --- STATES ---
  const [parties, setParties] = useState([]);
  const [filterValues, setFilterValues] = useState({ roles: [], detailCode: '', status: 'all', type: 'all' });
  const [appliedFilters, setAppliedFilters] = useState({ roles: [], detailCode: '', status: 'all', type: 'all' });

  // CRUD States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingParty, setEditingParty] = useState(null);
  
  // Detail Code Modal States
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [targetForDetail, setTargetForDetail] = useState(null);
  const [detailCodeInput, setDetailCodeInput] = useState('');

  const initialForm = {
    type: 'person', firstName: '', lastName: '', name: '', fullName: '',
    nationalId: '', alias: '', gender: 'male', fatherName: '', birthDate: '',
    birthCertificateNo: '', birthPlace: '', province: '', nationality: 'iranian',
    phone: '', mobile: '', email: '', website: '', regNo: '',
    addresses: [''], roles: [], isActive: true
  };
  const [formData, setFormData] = useState(initialForm);

  // --- EFFECTS ---
  useEffect(() => {
    if (canView) {
      fetchData();
    }
  }, [canView]);

  // --- DB OPERATIONS ---
  const fetchData = async () => {
    try {
      const { data: partiesData, error: pErr } = await supabase
        .schema('gen')
        .from('parties')
        .select('*')
        .order('created_at', { ascending: false });

      if (pErr) throw pErr;

      const { data: detailsData, error: dErr } = await supabase
        .schema('gl')
        .from('detail_instances')
        .select('*')
        .eq('ref_entity_name', 'gen.parties');

      if (dErr) throw dErr;

      const mappedParties = (partiesData || []).map(p => {
        const meta = p.metadata || {};
        const detailInst = (detailsData || []).find(d => d.entity_code === p.code);
        return {
          id: p.id,
          code: p.code,
          type: p.party_type,
          fullName: p.name,
          nationalId: p.national_id,
          phone: p.phone,
          isActive: p.is_active,
          
          firstName: meta.firstName || '',
          lastName: meta.lastName || '',
          name: meta.name || '',
          nationality: meta.nationality || 'iranian',
          roles: meta.roles || [],
          addresses: meta.addresses || [],
          alias: meta.alias || '',
          gender: meta.gender || 'male',
          fatherName: meta.fatherName || '',
          birthDate: meta.birthDate || '',
          birthCertificateNo: meta.birthCertificateNo || '',
          birthPlace: meta.birthPlace || '',
          province: meta.province || '',
          mobile: meta.mobile || '',
          email: meta.email || '',
          website: meta.website || '',
          regNo: meta.regNo || '',
          
          detailCode: detailInst ? detailInst.detail_code : null,
          detailInstanceId: detailInst ? detailInst.id : null
        };
      });

      setParties(mappedParties);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  const handleSave = async () => {
    if (editingParty && editingParty.id && !canEdit) {
      alert(t.err_access_denied || (isRtl ? 'دسترسی غیرمجاز برای ویرایش' : 'Access Denied for Edit'));
      return;
    }
    if ((!editingParty || !editingParty.id) && !canCreate) {
      alert(t.err_access_denied || (isRtl ? 'دسترسی غیرمجاز برای ایجاد' : 'Access Denied for Create'));
      return;
    }

    if (formData.type === 'person') {
      if (!formData.firstName || !formData.lastName || !formData.nationalId) return alert(t.alert_req_fields || (isRtl ? 'لطفاً فیلدهای اجباری را پر کنید.' : 'Please fill required fields.'));
    } else {
      if (!formData.name || !formData.nationalId) return alert(t.alert_req_fields || (isRtl ? 'لطفاً فیلدهای اجباری را پر کنید.' : 'Please fill required fields.'));
    }

    const finalFullName = formData.type === 'person' ? `${formData.firstName} ${formData.lastName}`.trim() : formData.name;
    
    const metadata = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      name: formData.name,
      nationality: formData.nationality,
      roles: formData.roles,
      addresses: formData.addresses,
      alias: formData.alias,
      gender: formData.gender,
      fatherName: formData.fatherName,
      birthDate: formData.birthDate,
      birthCertificateNo: formData.birthCertificateNo,
      birthPlace: formData.birthPlace,
      province: formData.province,
      mobile: formData.mobile,
      email: formData.email,
      website: formData.website,
      regNo: formData.regNo
    };

    const payload = {
      name: finalFullName,
      party_type: formData.type,
      national_id: formData.nationalId,
      phone: formData.phone,
      is_active: formData.isActive,
      metadata: metadata
    };

    try {
      if (editingParty && editingParty.id) {
        const { error } = await supabase
          .schema('gen')
          .from('parties')
          .update(payload)
          .eq('id', editingParty.id);

        if (error) throw error;
      } else {
        payload.code = `PRT-${Date.now()}`;
        const { error } = await supabase
          .schema('gen')
          .from('parties')
          .insert([payload]);

        if (error) throw error;
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error saving party:', err);
      alert(isRtl ? 'خطا در ثبت اطلاعات' : 'Error saving data');
    }
  };

  const handleDelete = async (ids) => {
    if (!canDelete) {
      alert(t.err_access_denied || (isRtl ? 'دسترسی غیرمجاز برای حذف' : 'Access Denied for Delete'));
      return;
    }

    if (confirm(t.confirm_delete?.replace('{0}', ids.length) || (isRtl ? `آیا از حذف ${ids.length} مورد اطمینان دارید؟` : `Delete ${ids.length} items?`))) {
      try {
        const { error } = await supabase
          .schema('gen')
          .from('parties')
          .delete()
          .in('id', ids);

        if (error) throw error;
        fetchData();
      } catch (err) {
        console.error('Error deleting parties:', err);
        alert(isRtl ? 'خطا در حذف اطلاعات' : 'Error deleting data');
      }
    }
  };

  const handleToggleActive = async (id, newVal) => {
    if (!canEdit) {
       alert(isRtl ? 'دسترسی غیرمجاز برای ویرایش' : 'Access Denied for Edit');
       return;
    }
    try {
      const { error } = await supabase
        .schema('gen')
        .from('parties')
        .update({ is_active: newVal })
        .eq('id', id);

      if (error) throw error;
      fetchData();
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  };

  const handleSaveDetailCode = async () => {
    if (!canAssignDetail) {
       alert(isRtl ? 'دسترسی غیرمجاز برای تخصیص تفصیل' : 'Access Denied for Detail Code Assignment');
       return;
    }
    if (!targetForDetail) return;

    const codeValue = detailCodeInput || null;

    try {
      if (targetForDetail.detailInstanceId) {
        const { error } = await supabase
          .schema('gl')
          .from('detail_instances')
          .update({ detail_code: codeValue, title: targetForDetail.fullName })
          .eq('id', targetForDetail.detailInstanceId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .schema('gl')
          .from('detail_instances')
          .insert([{
            detail_type_code: 'sys_partner',
            entity_code: targetForDetail.code,
            title: targetForDetail.fullName,
            detail_code: codeValue,
            ref_entity_name: 'gen.parties'
          }]);

        if (error) throw error;
      }

      setIsDetailModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error assigning detail code:', err);
      alert(isRtl ? 'خطا در تخصیص کد تفصیل' : 'Error assigning detail code');
    }
  };

  // --- FILTER LOGIC ---
  const filteredParties = useMemo(() => {
    return parties.filter(p => {
      const matchRole = appliedFilters.roles.length === 0 || appliedFilters.roles.some(r => p.roles?.includes(r));
      const matchDetail = !appliedFilters.detailCode || p.detailCode?.includes(appliedFilters.detailCode);
      const matchStatus = appliedFilters.status === 'all' || (appliedFilters.status === 'active' ? p.isActive : !p.isActive);
      const matchType = appliedFilters.type === 'all' || p.type === appliedFilters.type;
      return matchRole && matchDetail && matchStatus && matchType;
    });
  }, [parties, appliedFilters]);

  // --- HANDLERS ---
  const handleCreate = () => {
    if (!canCreate) {
      alert(t.err_access_denied || (isRtl ? 'شما مجوز ایجاد اطلاعات جدید ندارید' : 'You do not have create permission'));
      return;
    }
    setEditingParty(null);
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  const handleEdit = (row) => {
    if (!canEdit) {
      alert(t.err_access_denied || (isRtl ? 'شما مجوز ویرایش ندارید' : 'You do not have edit permission'));
      return;
    }
    setEditingParty(row);
    setFormData({
      ...row,
      addresses: row.addresses && row.addresses.length > 0 ? row.addresses : [''],
      roles: row.roles || []
    });
    setIsModalOpen(true);
  };

  const handleOpenDetailModal = (row) => {
    if (!canAssignDetail) {
      alert(isRtl ? 'دسترسی غیرمجاز برای تخصیص تفصیل' : 'Access Denied for Detail Code Assignment');
      return;
    }
    setTargetForDetail(row);
    setDetailCodeInput(row.detailCode || '');
    setIsDetailModalOpen(true);
  };

  // --- VIEWS ---
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

  // --- COLUMNS ---
  const columns = [
    { header: t.pt_type || (isRtl ? 'نوع' : 'Type'), field: 'type', width: 'w-20', render: (r) => r.type === 'person' ? <User size={14} className="text-blue-500"/> : <Building2 size={14} className="text-indigo-500"/> },
    { header: t.pt_fullname || (isRtl ? 'نام کامل / عنوان' : 'Full Name / Title'), field: 'fullName', width: 'w-48', render: (r) => <span className="font-bold text-slate-700">{r.fullName}</span> },
    { header: t.pt_nat_id || (isRtl ? 'شناسه ملی/کدملی' : 'National ID'), field: 'nationalId', width: 'w-32', className: 'font-mono' },
    { 
      header: t.detail_code || (isRtl ? 'کد تفصیل' : 'Detail Code'), 
      field: 'detailCode', 
      width: 'w-40', 
      render: (row) => row.detailCode ? (
        <button 
          onClick={() => canAssignDetail ? handleOpenDetailModal(row) : alert(isRtl ? 'عدم دسترسی به تخصیص تفصیل' : 'Access Denied')} 
          className={`flex items-center gap-2 ${canAssignDetail ? 'group cursor-pointer' : 'cursor-default opacity-80'}`}
          title={canAssignDetail ? (isRtl ? 'ویرایش کد تفصیل' : 'Edit Detail Code') : ''}
        >
           <Badge variant="success" className="font-mono transition-colors group-hover:bg-emerald-100">{row.detailCode}</Badge>
           {canAssignDetail && <Edit size={12} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"/>}
        </button>
      ) : (
        <button 
          onClick={() => canAssignDetail ? handleOpenDetailModal(row) : alert(isRtl ? 'عدم دسترسی به تخصیص تفصیل' : 'Access Denied')} 
          className={`flex items-center gap-2 ${canAssignDetail ? 'cursor-pointer' : 'cursor-default opacity-60'}`}
        >
           <Badge variant="danger">{t.detail_not_assigned || (isRtl ? 'تخصیص نیافته' : 'Not Assigned')}</Badge>
           {canAssignDetail && (
             <span className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                <Link2 size={12}/> {t.detail_assign_btn || (isRtl ? 'تخصیص' : 'Assign')}
             </span>
           )}
        </button>
      )
    },
    { header: t.pt_roles || (isRtl ? 'نقش‌ها' : 'Roles'), field: 'roles', width: 'w-40', render: (r) => <div className="flex flex-wrap gap-1">{(r.roles || []).map(role => <Badge key={role} variant="neutral">{PARTY_ROLES.find(pr => pr.id === role)?.label}</Badge>)}</div> },
    { 
      header: t.active_status || (isRtl ? 'فعال' : 'Active'), 
      field: 'isActive', 
      width: 'w-20', 
      render: (row) => (
         <div className="flex justify-center">
             <input 
               type="checkbox" 
               className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
               checked={row.isActive} 
               onChange={(e) => handleToggleActive(row.id, e.target.checked)} 
             />
         </div>
      )
    }
  ];

  return (
    <div className={`flex flex-col h-full bg-slate-50/50 p-4 overflow-hidden ${isRtl ? 'font-vazir' : 'font-sans'}`}>
      
      <div className="mb-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200">
            <Users size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800">{t.parties_title || (isRtl ? 'اشخاص و شرکت‌ها' : 'Parties & Companies')}</h1>
            <p className="text-xs text-slate-500 font-medium mt-1">{t.parties_subtitle || (isRtl ? 'مدیریت اطلاعات اشخاص حقیقی و حقوقی' : 'Manage legal and natural persons')}</p>
          </div>
        </div>
      </div>

      <FilterSection 
        title={t.filter || (isRtl ? 'فیلترها' : 'Filters')}
        onSearch={() => setAppliedFilters(filterValues)} 
        onClear={() => { setFilterValues({ roles: [], detailCode: '', status: 'all', type: 'all' }); setAppliedFilters({ roles: [], detailCode: '', status: 'all', type: 'all' }); }}
        isRtl={isRtl}
      >
        <div className="space-y-1">
          <label className="block text-[11px] font-bold text-slate-600">{t.pt_roles || (isRtl ? 'نقش‌ها' : 'Roles')}</label>
          <MultiSelect options={PARTY_ROLES} value={filterValues.roles} onChange={v => setFilterValues({...filterValues, roles: v})} placeholder={t.ph_role_filter || (isRtl ? 'انتخاب نقش...' : 'Select role...')} />
        </div>
        <InputField label={t.detail_code || (isRtl ? 'کد تفصیل' : 'Detail Code')} value={filterValues.detailCode} onChange={e => setFilterValues({...filterValues, detailCode: e.target.value})} placeholder="..." className="dir-ltr" isRtl={isRtl} />
        <SelectField label={t.pt_status || (isRtl ? 'وضعیت' : 'Status')} value={filterValues.status} onChange={e => setFilterValues({...filterValues, status: e.target.value})} isRtl={isRtl}>
          <option value="all">{t.opt_all_status || (isRtl ? 'همه وضعیت‌ها' : 'All Statuses')}</option>
          <option value="active">{t.opt_active || (isRtl ? 'فعال' : 'Active')}</option>
          <option value="inactive">{t.opt_inactive || (isRtl ? 'غیرفعال' : 'Inactive')}</option>
        </SelectField>
        <SelectField label={t.pt_type || (isRtl ? 'نوع' : 'Type')} value={filterValues.type} onChange={e => setFilterValues({...filterValues, type: e.target.value})} isRtl={isRtl}>
          <option value="all">{t.opt_all_types || (isRtl ? 'همه انواع' : 'All Types')}</option>
          <option value="person">{t.pt_person || (isRtl ? 'شخص حقیقی' : 'Person')}</option>
          <option value="company">{t.pt_company || (isRtl ? 'شرکت (حقوقی)' : 'Company')}</option>
        </SelectField>
      </FilterSection>

      <div className="flex-1 min-h-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <DataGrid 
          columns={columns} 
          data={filteredParties} 
          isRtl={isRtl}
          onCreate={canCreate ? handleCreate : undefined}
          onDelete={canDelete ? handleDelete : undefined}
          actions={(row) => (
            <>
              {canEdit && <Button variant="ghost" size="iconSm" icon={Edit} onClick={() => handleEdit(row)} />}
              {canDelete && <Button variant="ghost" size="iconSm" icon={Trash2} className="text-red-500 hover:bg-red-50" onClick={() => handleDelete([row.id])} />}
            </>
          )}
        />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingParty ? (t.pt_edit || (isRtl ? 'ویرایش شخص/شرکت' : 'Edit Party')) : (t.pt_new || (isRtl ? 'شخص/شرکت جدید' : 'New Party'))} size="xl"
        footer={<><Button variant="secondary" onClick={() => setIsModalOpen(false)}>{t.btn_cancel || (isRtl ? 'انصراف' : 'Cancel')}</Button><Button variant="primary" icon={Check} onClick={handleSave}>{t.btn_save || (isRtl ? 'ذخیره' : 'Save')}</Button></>}>
        <div className="space-y-6">
          <div className="flex gap-4 p-2 bg-slate-50 rounded-lg justify-center">
             <ToggleChip label={t.pt_person || (isRtl ? 'حقیقی (شخص)' : 'Person')} checked={formData.type === 'person'} onClick={() => setFormData({...formData, type: 'person'})} colorClass="indigo" />
             <ToggleChip label={t.pt_company || (isRtl ? 'حقوقی (شرکت)' : 'Company')} checked={formData.type === 'company'} onClick={() => setFormData({...formData, type: 'company'})} colorClass="indigo" />
          </div>

          <div className="grid grid-cols-4 gap-4 items-end">
            {formData.type === 'person' ? (
              <>
                <InputField label={`${t.pt_fname || (isRtl ? 'نام' : 'First Name')} *`} value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} isRtl={isRtl} />
                <InputField label={`${t.pt_lname || (isRtl ? 'نام خانوادگی' : 'Last Name')} *`} value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} isRtl={isRtl} />
                <InputField label={`${t.pt_nat_id || (isRtl ? 'کد ملی' : 'National ID')} *`} value={formData.nationalId} onChange={e => setFormData({...formData, nationalId: e.target.value})} className="dir-ltr" isRtl={isRtl} />
                <InputField label={t.pt_fullname || (isRtl ? 'نام کامل' : 'Full Name')} value={`${formData.firstName} ${formData.lastName}`} disabled className="bg-slate-100" isRtl={isRtl} />
                <InputField label={t.pt_alias || (isRtl ? 'نام مستعار' : 'Alias')} value={formData.alias} onChange={e => setFormData({...formData, alias: e.target.value})} isRtl={isRtl} />
                <SelectField label={t.pt_gender || (isRtl ? 'جنسیت' : 'Gender')} value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} isRtl={isRtl}>
                  <option value="male">{t.opt_male || (isRtl ? 'مرد' : 'Male')}</option><option value="female">{t.opt_female || (isRtl ? 'زن' : 'Female')}</option>
                </SelectField>
                <InputField label={t.pt_father || (isRtl ? 'نام پدر' : 'Father Name')} value={formData.fatherName} onChange={e => setFormData({...formData, fatherName: e.target.value})} isRtl={isRtl} />
                <DatePicker label={t.pt_birthdate || (isRtl ? 'تاریخ تولد' : 'Birth Date')} value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} className="dir-ltr" isRtl={isRtl} />
                <InputField label={t.pt_birth_no || (isRtl ? 'شماره شناسنامه' : 'Birth Cert No')} value={formData.birthCertificateNo} onChange={e => setFormData({...formData, birthCertificateNo: e.target.value})} className="dir-ltr" isRtl={isRtl} />
                <InputField label={t.pt_birth_place || (isRtl ? 'محل تولد' : 'Birth Place')} value={formData.birthPlace} onChange={e => setFormData({...formData, birthPlace: e.target.value})} isRtl={isRtl} />
                <InputField label={t.pt_province || (isRtl ? 'استان' : 'Province')} value={formData.province} onChange={e => setFormData({...formData, province: e.target.value})} isRtl={isRtl} />
              </>
            ) : (
              <>
                <InputField label={`${t.pt_comp_name || (isRtl ? 'نام شرکت' : 'Company Name')} *`} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="col-span-2" isRtl={isRtl} />
                <InputField label={`${t.pt_nat_id || (isRtl ? 'شناسه ملی' : 'National ID')} *`} value={formData.nationalId} onChange={e => setFormData({...formData, nationalId: e.target.value})} className="dir-ltr" isRtl={isRtl} />
                <InputField label={t.pt_reg_no || (isRtl ? 'شماره ثبت' : 'Reg No')} value={formData.regNo} onChange={e => setFormData({...formData, regNo: e.target.value})} className="dir-ltr" isRtl={isRtl} />
                <InputField label={t.pt_website || (isRtl ? 'وبسایت' : 'Website')} value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} className="dir-ltr" isRtl={isRtl} />
              </>
            )}
            <SelectField label={`${t.pt_nationality || (isRtl ? 'تابعیت' : 'Nationality')} *`} value={formData.nationality} onChange={e => setFormData({...formData, nationality: e.target.value})} isRtl={isRtl}>
              <option value="iranian">{t.opt_iranian || (isRtl ? 'ایرانی' : 'Iranian')}</option><option value="foreign">{t.opt_foreign || (isRtl ? 'اتباع خارجی' : 'Foreign')}</option>
            </SelectField>
            <InputField label={t.pt_phone || (isRtl ? 'تلفن ثابت' : 'Phone')} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="dir-ltr" isRtl={isRtl} />
            <InputField label={t.pt_mobile || (isRtl ? 'موبایل' : 'Mobile')} value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} className="dir-ltr" isRtl={isRtl} />
            <InputField label={t.pt_email || (isRtl ? 'ایمیل' : 'Email')} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="dir-ltr" isRtl={isRtl} />
            
            <div className={`col-span-1 flex items-center h-8 bg-slate-50 rounded border border-slate-200 shadow-sm justify-between ${isRtl ? 'px-3' : 'px-3'}`}>
              <span className="text-[11px] font-bold text-slate-600">{t.active_status || (isRtl ? 'فعال' : 'Active')}</span>
              <input 
                 type="checkbox" 
                 className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                 checked={formData.isActive} 
                 onChange={e => setFormData({...formData, isActive: e.target.checked})} 
              />
            </div>
          </div>

          <div className="space-y-2 border-t pt-4">
            <div className="flex justify-between items-center"><label className="text-[11px] font-bold text-slate-600">{t.pt_addr || (isRtl ? 'آدرس‌ها' : 'Addresses')}</label><Button size="sm" variant="ghost" icon={Plus} onClick={() => setFormData({...formData, addresses: [...(formData.addresses || []), '']})}>{t.btn_add || (isRtl ? 'افزودن' : 'Add')}</Button></div>
            {(formData.addresses || ['']).map((addr, idx) => (
              <div key={idx} className="flex gap-2"><InputField placeholder={`${t.ph_addr || (isRtl ? 'آدرس' : 'Address')} ${idx + 1}`} value={addr} onChange={e => { const n = [...formData.addresses]; n[idx] = e.target.value; setFormData({...formData, addresses: n}); }} isRtl={isRtl} />{idx > 0 && <Button variant="ghost" size="iconSm" icon={X} className="text-red-500" onClick={() => setFormData({...formData, addresses: formData.addresses.filter((_, i) => i !== idx)})} />}</div>
            ))}
          </div>

          <div className="border-t pt-4">
            <label className="block text-[11px] font-bold text-slate-600 mb-3">{t.pt_roles || (isRtl ? 'نقش‌ها' : 'Roles')}</label>
            <SelectionGrid items={PARTY_ROLES} selectedIds={formData.roles || []} onToggle={id => { const r = formData.roles || []; const n = r.includes(id) ? r.filter(x => x !== id) : [...r, id]; setFormData({...formData, roles: n}); }} />
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)}
        title={t.detail_assign_btn || (isRtl ? 'تخصیص کد تفصیل' : 'Assign Detail Code')}
        size="sm"
        footer={
           <>
             <Button variant="ghost" onClick={() => setIsDetailModalOpen(false)}>{t.btn_cancel || (isRtl ? 'انصراف' : 'Cancel')}</Button>
             <Button variant="primary" onClick={handleSaveDetailCode}>{t.btn_save || (isRtl ? 'ذخیره' : 'Save')}</Button>
           </>
        }
      >
         <div className="p-2 space-y-3">
            <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-lg leading-relaxed font-medium">
               {isRtl 
                 ? `در حال تخصیص کد تفصیلی به: ${targetForDetail?.fullName}` 
                 : `Assigning detail code for: ${targetForDetail?.fullName}`}
            </div>
            <InputField 
               label={t.detail_code || (isRtl ? 'کد تفصیل' : 'Detail Code')}
               value={detailCodeInput} 
               onChange={(e) => setDetailCodeInput(e.target.value)} 
               isRtl={isRtl}
               className="dir-ltr text-center font-bold tracking-wider"
               placeholder="Example: 101001"
               autoFocus
            />
         </div>
      </Modal>
    </div>
  );
};

window.Parties = Parties;
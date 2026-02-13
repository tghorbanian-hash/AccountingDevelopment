/* Filename: components/Parties.js */
import React, { useState, useMemo, useEffect, useRef } from 'react';
import * as LucideIcons from 'lucide-react';

const Parties = ({ t, isRtl }) => {
  const UI = window.UI || {};
  const { 
    Button, InputField, SelectField, Toggle, Badge, 
    DataGrid, Modal, ToggleChip, SelectionGrid, DatePicker, FilterSection 
  } = UI;
  const supabase = window.supabase;

  const { 
    Users, Building2, User, Plus, Edit, Trash2, Check, X, 
    Link2, ShieldAlert, ChevronDown
  } = LucideIcons;

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
    { id: 'employee', label: t.role_employee || 'Employee' }, { id: 'customer', label: t.role_customer || 'Customer' },
    { id: 'supplier', label: t.role_supplier || 'Supplier' }, { id: 'contractor', label: t.role_contractor || 'Contractor' },
    { id: 'shareholder', label: t.role_shareholder || 'Shareholder' }, { id: 'logistics', label: t.role_logistics || 'Logistics' },
    { id: 'cashier', label: t.role_cashier || 'Cashier' }, { id: 'petty_cashier', label: t.role_petty || 'Petty Cashier' },
    { id: 'bank', label: t.role_bank || 'Bank' }, { id: 'trustee', label: t.role_trustee || 'Trustee' }, { id: 'other', label: t.role_other || 'Other' }
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
    fetchData();
  }, []);

  // --- DB OPERATIONS ---
  const fetchData = async () => {
    // Fetch Parties
    const { data: partiesData, error: pErr } = await supabase
      .schema('gen')
      .from('parties')
      .select('*')
      .order('created_at', { ascending: false });

    if (pErr) {
      console.error('Error fetching parties:', pErr);
      return;
    }

    // Fetch Linked Details
    const { data: detailsData, error: dErr } = await supabase
      .schema('gl')
      .from('detail_instances')
      .select('*')
      .eq('ref_entity_name', 'gen.parties');

    if (dErr) {
      console.error('Error fetching details:', dErr);
      return;
    }

    // Map and Merge Data
    const mappedParties = partiesData.map(p => {
      const meta = p.metadata || {};
      const detailInst = detailsData.find(d => d.entity_code === p.code);
      return {
        id: p.id,
        code: p.code,
        type: p.party_type,
        fullName: p.name,
        nationalId: p.national_id,
        phone: p.phone,
        isActive: p.is_active,
        
        // Fields from metadata
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
        
        // Fields from details table
        detailCode: detailInst ? detailInst.detail_code : null,
        detailInstanceId: detailInst ? detailInst.id : null
      };
    });

    setParties(mappedParties);
  };

  const handleSave = async () => {
    if (formData.type === 'person') {
      if (!formData.firstName || !formData.lastName || !formData.nationalId) return alert(t.alert_req_fields);
    } else {
      if (!formData.name || !formData.nationalId) return alert(t.alert_req_fields);
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

    if (editingParty && editingParty.id) {
      const { error } = await supabase
        .schema('gen')
        .from('parties')
        .update(payload)
        .eq('id', editingParty.id);

      if (error) {
        console.error('Error updating party:', error);
        alert(isRtl ? 'خطا در ویرایش اطلاعات' : 'Error updating data');
        return;
      }
    } else {
      payload.code = `PRT-${Date.now()}`;
      const { error } = await supabase
        .schema('gen')
        .from('parties')
        .insert([payload]);

      if (error) {
        console.error('Error inserting party:', error);
        alert(isRtl ? 'خطا در ثبت اطلاعات' : 'Error saving data');
        return;
      }
    }

    setIsModalOpen(false);
    fetchData();
  };

  const handleDelete = async (ids) => {
    if (confirm(t.confirm_delete?.replace('{0}', ids.length) || `Delete ${ids.length} items?`)) {
      const { error } = await supabase
        .schema('gen')
        .from('parties')
        .delete()
        .in('id', ids);

      if (error) {
        console.error('Error deleting parties:', error);
        alert(isRtl ? 'خطا در حذف اطلاعات' : 'Error deleting data');
        return;
      }
      fetchData();
    }
  };

  const handleToggleActive = async (id, newVal) => {
    const { error } = await supabase
      .schema('gen')
      .from('parties')
      .update({ is_active: newVal })
      .eq('id', id);

    if (error) {
      console.error('Error toggling status:', error);
      return;
    }
    fetchData();
  };

  const handleSaveDetailCode = async () => {
    if (!targetForDetail) return;

    const codeValue = detailCodeInput || null;

    if (targetForDetail.detailInstanceId) {
      // Update existing record in gl.detail_instances
      const { error } = await supabase
        .schema('gl')
        .from('detail_instances')
        .update({ detail_code: codeValue, title: targetForDetail.fullName })
        .eq('id', targetForDetail.detailInstanceId);

      if (error) {
        console.error('Error updating detail instance:', error);
        alert(isRtl ? 'خطا در بروزرسانی کد تفصیل' : 'Error updating detail code');
        return;
      }
    } else {
      // Insert new record in gl.detail_instances
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

      if (error) {
        console.error('Error inserting detail instance:', error);
        alert(isRtl ? 'خطا در تخصیص کد تفصیل' : 'Error assigning detail code');
        return;
      }
    }

    setIsDetailModalOpen(false);
    fetchData();
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
    setEditingParty(null);
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  const handleEdit = (row) => {
    setEditingParty(row);
    setFormData({
      ...row,
      addresses: row.addresses && row.addresses.length > 0 ? row.addresses : [''],
      roles: row.roles || []
    });
    setIsModalOpen(true);
  };

  const handleOpenDetailModal = (row) => {
    setTargetForDetail(row);
    setDetailCodeInput(row.detailCode || '');
    setIsDetailModalOpen(true);
  };

  // --- COLUMNS ---
  const columns = [
    { header: t.pt_type, field: 'type', width: 'w-20', render: (r) => r.type === 'person' ? <User size={14} className="text-blue-500"/> : <Building2 size={14} className="text-indigo-500"/> },
    { header: t.pt_fullname, field: 'fullName', width: 'w-48', render: (r) => <span className="font-bold text-slate-700">{r.fullName}</span> },
    { header: t.pt_nat_id, field: 'nationalId', width: 'w-32', className: 'font-mono' },
    { 
      header: t.detail_code, 
      field: 'detailCode', 
      width: 'w-40', 
      render: (row) => row.detailCode ? (
        <button onClick={() => handleOpenDetailModal(row)} className="flex items-center gap-2 group">
           <Badge variant="success" className="font-mono group-hover:bg-emerald-100 transition-colors">{row.detailCode}</Badge>
           <Edit size={12} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"/>
        </button>
      ) : (
        <button onClick={() => handleOpenDetailModal(row)} className="flex items-center gap-2">
           <Badge variant="danger">{t.detail_not_assigned}</Badge>
           <span className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              <Link2 size={12}/> {t.detail_assign_btn}
           </span>
        </button>
      )
    },
    { header: t.pt_roles, field: 'roles', width: 'w-40', render: (r) => <div className="flex flex-wrap gap-1">{(r.roles || []).map(role => <Badge key={role} variant="neutral">{PARTY_ROLES.find(pr => pr.id === role)?.label}</Badge>)}</div> },
    { 
      header: t.active_status, 
      field: 'isActive', 
      width: 'w-20', 
      type: 'toggle',
      render: (row) => (
         <div className="flex justify-center">
            <Toggle checked={row.isActive} onChange={(val) => handleToggleActive(row.id, val)} />
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
            <h1 className="text-xl font-black text-slate-800">{t.parties_title}</h1>
            <p className="text-xs text-slate-500 font-medium mt-1">{t.parties_subtitle}</p>
          </div>
        </div>
      </div>

      <FilterSection 
        title={t.filter}
        onSearch={() => setAppliedFilters(filterValues)} 
        onClear={() => { setFilterValues({ roles: [], detailCode: '', status: 'all', type: 'all' }); setAppliedFilters({ roles: [], detailCode: '', status: 'all', type: 'all' }); }}
        isRtl={isRtl}
      >
        <div className="space-y-1">
          <label className="block text-[11px] font-bold text-slate-600">{t.pt_roles}</label>
          <MultiSelect options={PARTY_ROLES} value={filterValues.roles} onChange={v => setFilterValues({...filterValues, roles: v})} placeholder={t.ph_role_filter} />
        </div>
        <InputField label={t.detail_code} value={filterValues.detailCode} onChange={e => setFilterValues({...filterValues, detailCode: e.target.value})} placeholder="..." className="dir-ltr" />
        <SelectField label={t.pt_status} value={filterValues.status} onChange={e => setFilterValues({...filterValues, status: e.target.value})}>
          <option value="all">{t.opt_all_status}</option>
          <option value="active">{t.opt_active}</option>
          <option value="inactive">{t.opt_inactive}</option>
        </SelectField>
        <SelectField label={t.pt_type} value={filterValues.type} onChange={e => setFilterValues({...filterValues, type: e.target.value})}>
          <option value="all">{t.opt_all_types}</option>
          <option value="person">{t.pt_person}</option>
          <option value="company">{t.pt_company}</option>
        </SelectField>
      </FilterSection>

      <div className="flex-1 min-h-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <DataGrid 
          columns={columns} 
          data={filteredParties} 
          isRtl={isRtl}
          onCreate={handleCreate}
          onDelete={handleDelete}
          actions={(row) => (
            <>
              <Button variant="ghost" size="iconSm" icon={Edit} onClick={() => handleEdit(row)} />
              <Button variant="ghost" size="iconSm" icon={Trash2} className="text-red-500 hover:bg-red-50" onClick={() => handleDelete([row.id])} />
            </>
          )}
        />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingParty ? t.pt_edit : t.pt_new} size="xl"
        footer={<><Button variant="secondary" onClick={() => setIsModalOpen(false)}>{t.btn_cancel}</Button><Button variant="primary" icon={Check} onClick={handleSave}>{t.btn_save}</Button></>}>
        <div className="space-y-6">
          <div className="flex gap-4 p-2 bg-slate-50 rounded-lg justify-center">
             <ToggleChip label={t.pt_person} checked={formData.type === 'person'} onClick={() => setFormData({...formData, type: 'person'})} colorClass="indigo" />
             <ToggleChip label={t.pt_company} checked={formData.type === 'company'} onClick={() => setFormData({...formData, type: 'company'})} colorClass="indigo" />
          </div>

          <div className="grid grid-cols-4 gap-4 items-end">
            {formData.type === 'person' ? (
              <>
                <InputField label={`${t.pt_fname} *`} value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
                <InputField label={`${t.pt_lname} *`} value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
                <InputField label={`${t.pt_nat_id} *`} value={formData.nationalId} onChange={e => setFormData({...formData, nationalId: e.target.value})} />
                <InputField label={t.pt_fullname} value={`${formData.firstName} ${formData.lastName}`} disabled className="bg-slate-100" />
                <InputField label={t.pt_alias} value={formData.alias} onChange={e => setFormData({...formData, alias: e.target.value})} />
                <SelectField label={t.pt_gender} value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                  <option value="male">{t.opt_male}</option><option value="female">{t.opt_female}</option>
                </SelectField>
                <InputField label={t.pt_father} value={formData.fatherName} onChange={e => setFormData({...formData, fatherName: e.target.value})} />
                <DatePicker label={t.pt_birthdate} value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} />
                <InputField label={t.pt_birth_no} value={formData.birthCertificateNo} onChange={e => setFormData({...formData, birthCertificateNo: e.target.value})} />
                <InputField label={t.pt_birth_place} value={formData.birthPlace} onChange={e => setFormData({...formData, birthPlace: e.target.value})} />
                <InputField label={t.pt_province} value={formData.province} onChange={e => setFormData({...formData, province: e.target.value})} />
              </>
            ) : (
              <>
                <InputField label={`${t.pt_comp_name} *`} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="col-span-2" />
                <InputField label={`${t.pt_nat_id} *`} value={formData.nationalId} onChange={e => setFormData({...formData, nationalId: e.target.value})} />
                <InputField label={t.pt_reg_no} value={formData.regNo} onChange={e => setFormData({...formData, regNo: e.target.value})} />
                <InputField label={t.pt_website} value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} />
              </>
            )}
            <SelectField label={`${t.pt_nationality} *`} value={formData.nationality} onChange={e => setFormData({...formData, nationality: e.target.value})}>
              <option value="iranian">{t.opt_iranian}</option><option value="foreign">{t.opt_foreign}</option>
            </SelectField>
            <InputField label={t.pt_phone} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            <InputField label={t.pt_mobile} value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} />
            <InputField label={t.pt_email} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            
            {/* فیلد وضعیت */}
            <div className="col-span-1 flex items-center h-8 bg-slate-50 px-2 rounded border border-slate-200 shadow-sm justify-between">
              <span className="text-[11px] font-bold text-slate-600">{t.pt_status}</span>
              <Toggle checked={formData.isActive} onChange={v => setFormData({...formData, isActive: v})} />
            </div>
          </div>

          <div className="space-y-2 border-t pt-4">
            <div className="flex justify-between items-center"><label className="text-[11px] font-bold text-slate-600">{t.pt_addr}</label><Button size="sm" variant="ghost" icon={Plus} onClick={() => setFormData({...formData, addresses: [...(formData.addresses || []), '']})}>{t.btn_add}</Button></div>
            {(formData.addresses || ['']).map((addr, idx) => (
              <div key={idx} className="flex gap-2"><InputField placeholder={`${t.ph_addr} ${idx + 1}`} value={addr} onChange={e => { const n = [...formData.addresses]; n[idx] = e.target.value; setFormData({...formData, addresses: n}); }} />{idx > 0 && <Button variant="ghost" size="iconSm" icon={X} className="text-red-500" onClick={() => setFormData({...formData, addresses: formData.addresses.filter((_, i) => i !== idx)})} />}</div>
            ))}
          </div>

          <div className="border-t pt-4">
            <label className="block text-[11px] font-bold text-slate-600 mb-3">{t.pt_roles}</label>
            <SelectionGrid items={PARTY_ROLES} selectedIds={formData.roles || []} onToggle={id => { const r = formData.roles || []; const n = r.includes(id) ? r.filter(x => x !== id) : [...r, id]; setFormData({...formData, roles: n}); }} />
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)}
        title={t.detail_assign_btn}
        size="sm"
        footer={
           <>
             <Button variant="ghost" onClick={() => setIsDetailModalOpen(false)}>{t.btn_cancel}</Button>
             <Button variant="primary" onClick={handleSaveDetailCode}>{t.btn_save}</Button>
           </>
        }
      >
         <div className="p-2 space-y-3">
            <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-lg leading-relaxed">
               {isRtl 
                 ? `در حال تخصیص کد تفصیلی به: ${targetForDetail?.fullName}` 
                 : `Assigning detail code for: ${targetForDetail?.fullName}`}
            </div>
            <InputField 
               label={t.detail_code}
               value={detailCodeInput} 
               onChange={(e) => setDetailCodeInput(e.target.value)} 
               isRtl={isRtl}
               className="dir-ltr text-center font-bold"
               placeholder="Example: 101001"
               autoFocus
            />
         </div>
      </Modal>
    </div>
  );
};

window.Parties = Parties;
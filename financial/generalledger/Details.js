/* Filename: financial/generalledger/Details.js */
import React, { useState, useMemo } from 'react';
import { Edit, Trash2, List, Shield, UserCog, RefreshCw } from 'lucide-react';

const Details = ({ t, isRtl }) => {
  const { 
    Button, InputField, SelectField, Toggle, DataGrid, 
    FilterSection, Modal, Badge, Callout 
  } = window.UI;

  // --- 1. Define System Details (Fixed) ---
  const SYSTEM_DETAILS = [
    { id: 'sys_partner', title: t.sys_partner, type: 'system', isActive: true },
    { id: 'sys_cost_center', title: t.sys_cost_center, type: 'system', isActive: true },
    { id: 'sys_project', title: t.sys_project, type: 'system', isActive: true },
    { id: 'sys_other_person', title: t.sys_other_person, type: 'system', isActive: true },
    { id: 'sys_branch', title: t.sys_branch, type: 'system', isActive: true },
    { id: 'sys_bank_acc', title: t.sys_bank_acc, type: 'system', isActive: true },
    { id: 'sys_cash', title: t.sys_cash, type: 'system', isActive: true },
    { id: 'sys_petty', title: t.sys_petty, type: 'system', isActive: true },
    { id: 'sys_customer_group', title: t.sys_customer_group, type: 'system', isActive: true },
    { id: 'sys_product_group', title: t.sys_product_group, type: 'system', isActive: true },
    { id: 'sys_sales_office', title: t.sys_sales_office, type: 'system', isActive: true },
    { id: 'sys_price_zone', title: t.sys_price_zone, type: 'system', isActive: true },
    { id: 'sys_item', title: t.sys_item, type: 'system', isActive: true },
  ];

  // --- 2. State for User Details & UI ---
  const [userDetails, setUserDetails] = useState([
    { id: 101, title: isRtl ? 'قراردادهای بیمه' : 'Insurance Contracts', type: 'user', isActive: true },
    { id: 102, title: isRtl ? 'محموله‌های وارداتی' : 'Import Shipments', type: 'user', isActive: true },
  ]);

  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showInstanceModal, setShowInstanceModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [searchParams, setSearchParams] = useState({ title: '', type: 'all' });
  const [selectedDetailType, setSelectedDetailType] = useState(null);
  
  // Mock Data for Instances (This simulates data fetched from Projects, CostCenters, etc.)
  const [mockInstances, setMockInstances] = useState({
    'sys_project': [
      { id: 1, entityCode: 'PRJ-101', title: isRtl ? 'پروژه برج آفتاب' : 'Sun Tower Project', status: true, detailCode: '209038' },
      { id: 2, entityCode: 'PRJ-102', title: isRtl ? 'پروژه اتوبان تهران-شمال' : 'Highway Project', status: true, detailCode: '209039' },
      { id: 3, entityCode: 'PRJ-103', title: isRtl ? 'بازسازی دفتر مرکزی' : 'HQ Renovation', status: false, detailCode: '209040' },
    ],
    'sys_cost_center': [
      { id: 1, entityCode: 'CC-001', title: isRtl ? 'واحد اداری' : 'Admin Unit', status: true, detailCode: '101001' },
      { id: 2, entityCode: 'CC-002', title: isRtl ? 'واحد فروش' : 'Sales Unit', status: true, detailCode: '101002' },
      { id: 3, entityCode: 'CC-003', title: isRtl ? 'واحد تولید' : 'Production Unit', status: true, detailCode: '101003' },
    ],
    'default': [
      { id: 1, entityCode: 'GEN-001', title: isRtl ? 'نمونه آیتم ۱' : 'Sample Item 1', status: true, detailCode: '900001' },
      { id: 2, entityCode: 'GEN-002', title: isRtl ? 'نمونه آیتم ۲' : 'Sample Item 2', status: true, detailCode: '900002' },
    ]
  });

  // --- 3. Combined Data for Main Grid ---
  const combinedDetails = useMemo(() => {
    return [...SYSTEM_DETAILS, ...userDetails];
  }, [userDetails]);

  const filteredDetails = useMemo(() => {
    return combinedDetails.filter(item => {
      const matchTitle = item.title.toLowerCase().includes(searchParams.title.toLowerCase());
      const matchType = searchParams.type === 'all' ? true : item.type === searchParams.type;
      return matchTitle && matchType;
    });
  }, [combinedDetails, searchParams]);

  // --- 4. Handlers ---
  
  const handleCreate = () => {
    setEditingItem(null);
    setFormData({ title: '', isActive: true, type: 'user' });
    setShowTypeModal(true);
  };

  const handleEdit = (item) => {
    // Only User types are editable
    if (item.type === 'system') return;
    setEditingItem(item);
    setFormData({ ...item });
    setShowTypeModal(true);
  };

  const handleDelete = (ids) => {
    // Filter out system types
    const idsToDelete = ids.filter(id => {
      const item = combinedDetails.find(d => d.id === id);
      return item && item.type === 'user';
    });
    
    if (idsToDelete.length === 0) return;

    if (window.confirm(t.confirm_delete.replace('{0}', idsToDelete.length))) {
      setUserDetails(prev => prev.filter(item => !idsToDelete.includes(item.id)));
    }
  };

  const handleSaveType = () => {
    if (!formData.title) return alert(t.alert_req_fields);
    
    if (editingItem) {
      setUserDetails(prev => prev.map(item => item.id === editingItem.id ? { ...formData, id: item.id, type: 'user' } : item));
    } else {
      setUserDetails(prev => [...prev, { ...formData, id: Date.now(), type: 'user' }]);
    }
    setShowTypeModal(false);
  };

  const handleViewInstances = (item) => {
    setSelectedDetailType(item);
    setShowInstanceModal(true);
  };

  // --- 5. Column Definitions ---

  const mainColumns = [
    { field: 'title', header: t.dt_type_title, width: 'w-64', sortable: true },
    { 
      field: 'type', 
      header: t.dt_category, 
      width: 'w-32',
      render: (row) => (
        <Badge variant={row.type === 'system' ? 'primary' : 'warning'} icon={row.type === 'system' ? Shield : UserCog}>
          {row.type === 'system' ? t.dt_system : t.dt_user}
        </Badge>
      )
    },
    { 
      field: 'isActive', 
      header: t.active_status, 
      width: 'w-24',
      render: (row) => (
         <Badge variant={row.isActive ? 'success' : 'neutral'}>
            {row.isActive ? (t.active || 'Active') : (t.inactive || 'Inactive')}
         </Badge>
      )
    },
  ];

  const instanceColumns = [
    { field: 'entityCode', header: t.dt_entity_code, width: 'w-32' },
    { field: 'title', header: t.dt_entity_title, width: 'w-64' },
    { 
      field: 'status', 
      header: t.active_status, 
      width: 'w-24',
      render: (row) => (
         <Badge variant={row.status ? 'success' : 'neutral'}>
            {row.status ? t.active : t.inactive}
         </Badge>
      )
    },
    { 
      field: 'detailCode', 
      header: t.dt_alloc_code, 
      width: 'w-48',
      render: (row) => <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded">{row.detailCode}</span>
    },
  ];

  // Helper to get instances for current modal
  const currentInstances = useMemo(() => {
    if (!selectedDetailType) return [];
    return mockInstances[selectedDetailType.id] || mockInstances['default'];
  }, [selectedDetailType, mockInstances]);

  return (
    <div className="h-full flex flex-col p-4">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl font-bold text-slate-800">{t.details_title}</h1>
        <p className="text-slate-500 text-xs mt-1">{t.details_subtitle}</p>
      </div>

      {/* Filter */}
      <FilterSection 
        onSearch={() => {}} 
        onClear={() => setSearchParams({ title: '', type: 'all' })} 
        isRtl={isRtl} 
        title={t.filter}
      >
        <InputField 
          label={t.dt_type_title} 
          value={searchParams.title} 
          onChange={e => setSearchParams({...searchParams, title: e.target.value})}
          isRtl={isRtl}
        />
        <SelectField 
          label={t.dt_category}
          value={searchParams.type}
          onChange={e => setSearchParams({...searchParams, type: e.target.value})}
          isRtl={isRtl}
        >
          <option value="all">{t.opt_all_types}</option>
          <option value="system">{t.dt_system}</option>
          <option value="user">{t.dt_user}</option>
        </SelectField>
      </FilterSection>

      {/* Main Grid */}
      <div className="flex-1 overflow-hidden">
        <DataGrid 
          columns={mainColumns}
          data={filteredDetails}
          onCreate={handleCreate}
          // Only show delete if selection contains ONLY user types
          onDelete={(ids) => {
             const hasSystem = ids.some(id => combinedDetails.find(d => d.id === id)?.type === 'system');
             if (!hasSystem) handleDelete(ids);
             else alert("System details cannot be deleted.");
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
                title={t.dt_view_instances} 
                className="text-blue-600 hover:bg-blue-50"
              />
              {row.type === 'user' && (
                <>
                  <Button variant="ghost" size="iconSm" icon={Edit} onClick={() => handleEdit(row)} title={t.edit} />
                  <Button variant="ghost" size="iconSm" icon={Trash2} onClick={() => handleDelete([row.id])} title={t.delete} className="text-red-500 hover:text-red-700 hover:bg-red-50" />
                </>
              )}
            </div>
          )}
        />
      </div>

      {/* Modal: Create/Edit Detail Type */}
      <Modal
        isOpen={showTypeModal}
        onClose={() => setShowTypeModal(false)}
        title={editingItem ? t.dt_edit : t.dt_new}
        footer={
          <>
            <Button variant="outline" onClick={() => setShowTypeModal(false)}>{t.btn_cancel}</Button>
            <Button variant="primary" onClick={handleSaveType}>{t.btn_save}</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <InputField 
            label={t.dt_type_title} 
            value={formData.title} 
            onChange={e => setFormData({...formData, title: e.target.value})}
            isRtl={isRtl}
          />
          <Toggle 
            label={t.active_status} 
            checked={formData.isActive} 
            onChange={val => setFormData({...formData, isActive: val})} 
          />
        </div>
      </Modal>

      {/* Modal: View Instances (The Detail Grid) */}
      <Modal
        isOpen={showInstanceModal}
        onClose={() => setShowInstanceModal(false)}
        title={selectedDetailType ? `${t.dt_instance_list} ${selectedDetailType.title}` : t.dt_instances}
        size="lg" // Make it wider
        footer={
          <Button variant="outline" onClick={() => setShowInstanceModal(false)}>{t.btn_close}</Button>
        }
      >
        <div className="flex flex-col h-[400px]">
          <div className="mb-4 flex justify-between items-center bg-slate-50 p-3 rounded border border-slate-100">
             <div className="text-sm text-slate-600">
               {isRtl ? 'این کدها به صورت خودکار از فرم مربوطه (مانند پروژه یا مرکز هزینه) خوانده می‌شوند.' : 'These codes are auto-fetched from respective forms (e.g., Projects, Cost Centers).'}
             </div>
             <Button variant="ghost" size="sm" icon={RefreshCw} onClick={() => alert("Syncing codes...")}>
                {t.dt_auto_map}
             </Button>
          </div>
          <div className="flex-1 border rounded-lg overflow-hidden relative">
            {/* Reusing DataGrid but without Create/Delete actions since these are read-only views of other entities */}
            <DataGrid 
              columns={instanceColumns}
              data={currentInstances}
              isRtl={isRtl}
              selectable={false} 
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

window.Details = Details;
export default Details;
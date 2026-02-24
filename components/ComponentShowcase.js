/* Filename: components/ComponentShowcase.js */
import React, { useState } from 'react';
import { 
  Save, Trash2, Search, Plus, Filter, Download, 
  Printer, Edit, Eye, Shield, DollarSign,
  FileCheck, AlertTriangle, Send, XCircle
} from 'lucide-react';

// --- MOCK DATA ---
const MOCK_DATA = Array.from({ length: 100 }).map((_, i) => ({
  id: 1000 + i,
  docNo: `DOC-${202400 + i}`,
  date: `1402/${String(Math.floor(Math.random() * 12) + 1).padStart(2,'0')}/${String(Math.floor(Math.random() * 28) + 1).padStart(2,'0')}`,
  description: i % 3 === 0 ? 'بابت خرید ملزومات اداری و مصرفی' : (i % 2 === 0 ? 'سند افتتاحیه دوره مالی جدید' : 'هزینه تنخواه گردان'),
  dept: i % 4 === 0 ? 'منابع انسانی' : (i % 3 === 0 ? 'فنی و مهندسی' : 'مالی'),
  debtor: (Math.random() * 10000000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ","),
  creditor: (Math.random() * 10000000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ","),
  status: i % 5 === 0 ? 'پیش‌نویس' : (i % 3 === 0 ? 'بررسی شده' : 'نهایی'),
  isActive: i % 4 !== 0,
  creator: 'Admin User'
}));

const ComponentShowcase = ({ t, isRtl }) => {
  const UI = window.UI || {};
  const { 
    Button, InputField, SelectField, Toggle, Badge, 
    DataGrid, FilterSection, Modal, DatePicker, LOV 
  } = UI;

  if (!Button) return <div>Error loading UI</div>;

  const [selectedRows, setSelectedRows] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [groupBy, setGroupBy] = useState([]); // Default no grouping

  // --- Handlers ---
  const handleCreate = () => {
    setEditingRow(null);
    setIsModalOpen(true);
  };

  const handleDelete = (ids) => {
    if(confirm(t.confirm_delete.replace('{0}', ids.length))) {
      alert(`Deleted: ${ids.join(', ')}`);
      setSelectedRows([]);
    }
  };

  const handleEdit = (row) => {
    setEditingRow(row);
    setIsModalOpen(true);
  };

  const handleView = (row) => {
    alert(`نمایش جزئیات سند شماره: ${row.docNo}`);
  };

  // --- Columns ---
  const columns = [
    { header: t.col_docNo, field: 'docNo', width: 'w-28', sortable: true },
    { header: t.col_date, field: 'date', width: 'w-24', sortable: true },
    { header: t.col_dept, field: 'dept', width: 'w-32', sortable: true },
    { header: t.col_desc, field: 'description', width: 'w-auto' },
    { header: t.col_debtor, field: 'debtor', width: 'w-32 text-end font-mono tracking-tight' },
    { 
      header: t.col_status, 
      field: 'status',
      width: 'w-24 text-center',
      sortable: true,
      render: (row) => {
        const map = { 
          'نهایی': { variant: 'success', label: t.status_final }, 
          'پیش‌نویس': { variant: 'warning', label: t.status_draft }, 
          'بررسی شده': { variant: 'info', label: t.status_reviewed } 
        };
        const statusConfig = map[row.status] || { variant: 'neutral', label: row.status };
        return <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>;
      }
    },
    { header: t.col_active, field: 'isActive', type: 'toggle', width: 'w-16 text-center' },
  ];

  return (
    <div className={`flex flex-col h-full bg-slate-50/50 p-4 overflow-hidden ${isRtl ? 'font-vazir' : 'font-sans'}`}>
      
      {/* HEADER */}
      <div className="flex items-center justify-between mb-4 shrink-0">
         <div>
            <h1 className="text-xl font-black text-slate-800">{t.acc_mgmt_title}</h1>
            <p className="text-slate-500 text-xs mt-1">{t.acc_mgmt_subtitle}</p>
         </div>
      </div>

      {/* FILTER SECTION (COLLAPSIBLE) */}
      <FilterSection 
        onSearch={() => alert('Search Triggered')} 
        onClear={() => alert('Filters Cleared')}
        isRtl={isRtl}
        title={t.filters}
      >
         <InputField label={t.filter_fromDoc} placeholder="1000" isRtl={isRtl} />
         <InputField label={t.filter_toDoc} placeholder="2000" isRtl={isRtl} />
         <DatePicker label={t.filter_fromDate} isRtl={isRtl} />
         <DatePicker label={t.filter_toDate} isRtl={isRtl} />
         <SelectField label={t.filter_status} isRtl={isRtl}>
            <option>{t.filter_allStatus}</option>
            <option>{t.status_final}</option>
            <option>{t.status_draft}</option>
         </SelectField>
         <LOV label={t.filter_costCenter} placeholder={t.filter_costCenter} isRtl={isRtl} />
         <LOV label={t.filter_subsidiary} placeholder={t.filter_subsidiary} isRtl={isRtl} />
      </FilterSection>

      {/* DATA GRID */}
      <div className="flex-1 min-h-0">
        <DataGrid 
          title={t.grid_title}
          columns={columns}
          data={MOCK_DATA}
          isRtl={isRtl}
          
          // Selection
          selectedIds={selectedRows}
          onSelectAll={(checked) => setSelectedRows(checked ? MOCK_DATA.map(r=>r.id) : [])}
          onSelectRow={(id, checked) => setSelectedRows(prev => checked ? [...prev, id] : prev.filter(x => x !== id))}
          
          // CRUD Actions
          onCreate={handleCreate}
          onDelete={handleDelete}
          onDoubleClick={handleEdit}
          
          // Grouping
          groupBy={groupBy}
          setGroupBy={setGroupBy}

          // Row Actions (Rendered per row)
          actions={(row) => (
             <>
               <Button variant="ghost" size="iconSm" icon={Edit} className="text-indigo-600 hover:bg-indigo-50" onClick={() => handleEdit(row)} title={t.edit} />
               <Button variant="ghost" size="iconSm" icon={Eye} className="text-slate-500 hover:text-slate-800" onClick={() => handleView(row)} title={t.view} />
               {row.status === 'پیش‌نویس' && (
                 <Button variant="ghost" size="iconSm" icon={Trash2} className="text-red-500 hover:bg-red-50" onClick={() => handleDelete([row.id])} title={t.delete} />
               )}
             </>
          )}
        />
      </div>

      {/* EDIT MODAL */}
      <Modal 
         isOpen={isModalOpen} 
         onClose={() => setIsModalOpen(false)} 
         title={editingRow ? `${t.modal_editDoc} ${editingRow.docNo}` : t.modal_newDoc}
         size="lg"
         footer={
            <>
               <Button variant="secondary" onClick={() => setIsModalOpen(false)}>{t.btn_cancel}</Button>
               <Button variant="primary" icon={Save}>{t.btn_save}</Button>
            </>
         }
      >
         <div className="space-y-4">
            <div className="bg-indigo-50 border border-indigo-100 p-3 rounded flex items-start gap-3">
               <Shield className="text-indigo-600 shrink-0 mt-0.5" size={16} />
               <div className="text-[11px] text-indigo-900 leading-relaxed">
                  {t.modal_warning}
               </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
               <InputField label={t.col_docNo} value={editingRow?.docNo || "Auto"} disabled />
               <DatePicker label={t.col_date} defaultValue={editingRow?.date} />
               <SelectField label={t.field_docType}>
                  <option>{t.field_general}</option>
                  <option>{t.field_opening}</option>
               </SelectField>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
               <LOV label={t.field_party} placeholder={t.field_selectParty} />
               <InputField label={t.field_amount} value={editingRow?.debtor} dir="ltr" className="font-mono text-left"/>
            </div>

            <InputField label={t.col_desc} value={editingRow?.description} />

            <div className="flex items-center gap-2 pt-2 mt-2 border-t border-slate-100">
               <Toggle label={t.field_isActive} checked={true} onChange={()=>{}} />
            </div>
         </div>
      </Modal>

    </div>
  );
};

window.ComponentShowcase = ComponentShowcase;

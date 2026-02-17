/* Filename: components/OrgChart.js */
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Network, Search, Plus, Edit, Trash2, Save, 
  ArrowLeft, ArrowRight, Users, FolderTree, Ban, X,
  ChevronDown, Maximize2, Minimize2 
} from 'lucide-react';

const OrgChart = ({ t, isRtl }) => {
  const UI = window.UI || {};
  const { Button, InputField, SelectField, DataGrid, FilterSection, Modal, Badge, DatePicker } = UI;
  const supabase = window.supabase;

  // --- Resilient Permission Checks ---
  const checkAccess = (action = null) => {
    if (!window.hasAccess) return false;
    const variations = ['org_chart', 'orgchart'];
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
  const canDesign = checkAccess('design');

  // --- Data Sanitization Helpers ---
  const cleanDate = (d) => {
    if (!d) return null;
    const trimmed = String(d).trim().replace(/\//g, '-');
    return trimmed === '' ? null : trimmed;
  };

  const cleanStr = (s) => {
    if (!s) return null;
    const trimmed = String(s).trim();
    return trimmed === '' ? null : trimmed;
  };

  // --- INTERNAL: CUSTOM TREE COMPONENT ---
  const CustomTreeNode = ({ node, level, selectedId, onSelect, expandedKeys, onToggle, isRtl }) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedKeys.has(node.id);
    const isSelected = selectedId === node.id;

    return (
      <div className="select-none">
        <div 
          className={`
            flex items-center gap-2 py-1 px-2 my-0.5 cursor-pointer rounded-lg transition-all border border-transparent
            ${isSelected 
              ? 'bg-indigo-50 text-indigo-700 font-bold border-indigo-200 shadow-sm' 
              : 'hover:bg-slate-50 text-slate-700 hover:border-slate-200'}
          `}
          style={{ paddingRight: isRtl ? `${level * 20 + 8}px` : '8px', paddingLeft: isRtl ? '8px' : `${level * 20 + 8}px` }}
          onClick={() => onSelect(node)}
        >
          {hasChildren ? (
            <div 
              className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors z-10 bg-white rounded border border-slate-200 shadow-sm"
              onClick={(e) => { e.stopPropagation(); onToggle(node.id); }}
            >
               <div className={`transition-transform duration-200 ${isExpanded ? '' : (isRtl ? 'rotate-90' : '-rotate-90')}`}>
                 <ChevronDown size={12} />
               </div>
            </div>
          ) : (
             <div className="w-5 h-5 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
             </div>
          )}
          
          <div className="flex items-center gap-2 truncate flex-1">
             <FolderTree size={16} className={`${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
             <span className="text-[13px] truncate">{node.title}</span>
             {!node.active && <Badge variant="danger" className="scale-75 origin-right">{t.inactive || (isRtl ? 'غیرفعال' : 'Inactive')}</Badge>}
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div className="overflow-hidden relative">
            <div className={`absolute top-0 bottom-2 w-px bg-slate-200 ${isRtl ? `right-[${level * 20 + 17}px]` : `left-[${level * 20 + 17}px]`}`}></div>
            {node.children.map(child => (
              <CustomTreeNode 
                key={child.id} node={child} level={level + 1} 
                selectedId={selectedId} onSelect={onSelect} 
                expandedKeys={expandedKeys} onToggle={onToggle} isRtl={isRtl} 
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  // --- STATES ---
  const [viewMode, setViewMode] = useState('list');
  const [charts, setCharts] = useState([]);
  const [treeData, setTreeData] = useState([]);
  const [expandedKeys, setExpandedKeys] = useState(new Set());
  const [employees, setEmployees] = useState([]);

  const [filters, setFilters] = useState({ code: '', title: '' });
  const [activeChart, setActiveChart] = useState(null); 
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  const [chartFormData, setChartFormData] = useState({});

  const [selectedNode, setSelectedNode] = useState(null);
  const [nodeForm, setNodeForm] = useState({ id: null, code: '', title: '', parentId: '', active: true });
  const [isNodeEditMode, setIsNodeEditMode] = useState(false); 
  
  // Assign Modal States
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignData, setAssignData] = useState({ id: null, personId: '', fromDate: '', toDate: '' });
  const [empSearchTerm, setEmpSearchTerm] = useState('');
  const [isEmpDropdownOpen, setIsEmpDropdownOpen] = useState(false);
  const empDropdownRef = useRef(null);

  // --- DB EFFECTS & FETCHES ---
  useEffect(() => {
    if (canView) {
       fetchCharts();
       fetchEmployees();
    }
  }, [canView]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (empDropdownRef.current && !empDropdownRef.current.contains(event.target)) {
        setIsEmpDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchCharts = async () => {
    try {
      const { data, error } = await supabase.schema('gen').from('org_charts').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setCharts((data || []).map(c => ({
         id: c.id,
         code: c.code || '',
         title: c.title || '',
         type: c.type || 'standard',
         startDate: c.start_date || '',
         endDate: c.end_date || '',
         active: c.is_active
      })));
    } catch (err) {
      console.error(err);
      alert(t.err_fetch || 'Error fetching charts');
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase.schema('gen').from('parties')
        .select('id, code, name, metadata, is_active')
        .eq('party_type', 'person')
        .eq('is_active', true);
        
      if (error) throw error;
      
      const emps = (data || []).filter(p => p.metadata?.roles?.includes('employee')).map(p => ({
         id: p.id,
         code: p.code || '',
         name: p.name || ''
      }));
      setEmployees(emps);
    } catch(err) {
      console.error(err);
    }
  };

  // Modified to optionally retain selection
  const fetchDesignerData = async (chartId, retainNodeId = null) => {
    try {
       const { data: nData, error: nErr } = await supabase.schema('gen').from('org_chart_nodes').select('*').eq('chart_id', chartId);
       if (nErr) throw nErr;

       const nodeIds = nData.map(n => n.id);
       let pData = [];
       if (nodeIds.length > 0) {
          const { data: personnelData, error: pErr } = await supabase.schema('gen').from('org_chart_personnel').select('*').in('node_id', nodeIds);
          if (pErr) throw pErr;
          pData = personnelData || [];
       }

       const map = new Map();
       nData.forEach(n => map.set(n.id, { 
          id: n.id, 
          code: n.code || '', 
          title: n.title, 
          active: n.is_active, 
          parentId: n.parent_id,
          children: [], 
          personnel: [] 
       }));

       pData.forEach(p => {
          if (map.has(p.node_id)) {
             map.get(p.node_id).personnel.push({ id: p.id, personId: p.person_id, name: p.person_name, fromDate: p.from_date, toDate: p.to_date });
          }
       });

       const roots = [];
       nData.forEach(n => {
          const node = map.get(n.id);
          if (n.parent_id && map.has(n.parent_id)) {
             map.get(n.parent_id).children.push(node);
          } else {
             roots.push(node);
          }
       });

       setTreeData(roots);
       
       if (roots.length > 0 && expandedKeys.size === 0) {
          setExpandedKeys(new Set([roots[0].id]));
       }

       // Keep the previously selected node active if requested
       if (retainNodeId && map.has(retainNodeId)) {
          const updatedNode = map.get(retainNodeId);
          setSelectedNode(updatedNode);
          setNodeForm({ 
             id: updatedNode.id, 
             code: updatedNode.code || '', 
             title: updatedNode.title, 
             parentId: updatedNode.parentId || '', 
             active: updatedNode.active 
          });
          setIsNodeEditMode(true);
       }
    } catch (err) {
       console.error(err);
       alert(t.err_fetch || 'Error fetching structure');
    }
  };

  // --- HELPERS ---
  const flattenNodes = (nodes, result = []) => {
    nodes.forEach(node => {
      result.push({ id: node.id, title: node.title });
      if (node.children) flattenNodes(node.children, result);
    });
    return result;
  };

  // --- LIST HANDLERS ---
  const filteredCharts = useMemo(() => {
    return charts.filter(c => {
       const mCode = filters.code ? c.code.includes(filters.code) : true;
       const mTitle = filters.title ? c.title.includes(filters.title) : true;
       return mCode && mTitle;
    });
  }, [charts, filters]);

  const handleOpenChartModal = (chart = null) => {
    if (chart && !canEdit) return alert(t.err_access_denied || 'Access Denied');
    if (!chart && !canCreate) return alert(t.err_access_denied || 'Access Denied');

    if (chart) {
      setChartFormData({ ...chart });
    } else {
      setChartFormData({ code: '', title: '', type: 'standard', active: true, startDate: '', endDate: '' });
    }
    setIsChartModalOpen(true);
  };

  const handleSaveChartMeta = async () => {
    if (!chartFormData.code || !chartFormData.title) {
       return alert(isRtl ? 'کد و عنوان اجباری است' : 'Code and Title are required');
    }
    try {
       const payload = {
          code: cleanStr(chartFormData.code),
          title: cleanStr(chartFormData.title),
          type: chartFormData.type,
          start_date: cleanDate(chartFormData.startDate),
          end_date: cleanDate(chartFormData.endDate),
          is_active: chartFormData.active
       };

       if (chartFormData.id) {
          const { error } = await supabase.schema('gen').from('org_charts').update(payload).eq('id', chartFormData.id);
          if (error) {
             if (error.code === '22008') return alert(isRtl ? 'فرمت تاریخ نامعتبر است.' : 'Invalid Date Format.');
             throw error;
          }
       } else {
          const { error } = await supabase.schema('gen').from('org_charts').insert([payload]);
          if (error) {
             if (error.code === '22008') return alert(isRtl ? 'فرمت تاریخ نامعتبر است.' : 'Invalid Date Format.');
             throw error;
          }
       }
       setIsChartModalOpen(false);
       fetchCharts();
    } catch (err) {
       console.error(err);
       alert(t.err_save || 'Error saving data');
    }
  };

  const handleDeleteChart = async (ids) => {
    if (!canDelete) return alert(t.err_access_denied || 'Access Denied');
    if (confirm(t.confirm_delete?.replace('{0}', ids.length) || `Delete ${ids.length} items?`)) {
       try {
          const { error } = await supabase.schema('gen').from('org_charts').delete().in('id', ids);
          if (error) throw error;
          fetchCharts();
       } catch(err) {
          console.error(err);
       }
    }
  };

  const handleToggleActiveList = async (id, newVal) => {
    if (!canEdit) return alert(t.err_access_denied || 'Access Denied');
    try {
       const { error } = await supabase.schema('gen').from('org_charts').update({ is_active: newVal }).eq('id', id);
       if (error) throw error;
       fetchCharts();
    } catch (err) {
       console.error(err);
    }
  };

  const handleOpenDesigner = (chart) => {
    if (!canDesign) return alert(t.err_access_denied || 'Access Denied for Designing');
    setActiveChart(chart);
    fetchDesignerData(chart.id);
    setSelectedNode(null);
    setNodeForm({ id: null, code: '', title: '', parentId: '', active: true });
    setIsNodeEditMode(false);
    setViewMode('designer');
  };

  // --- DESIGNER HANDLERS ---
  const toggleExpand = (id) => {
    const newSet = new Set(expandedKeys);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedKeys(newSet);
  };

  const expandAll = () => {
    const allIds = new Set();
    const traverse = (nodes) => {
      nodes.forEach(n => {
        if (n.children && n.children.length > 0) {
          allIds.add(n.id);
          traverse(n.children);
        }
      });
    };
    traverse(treeData);
    setExpandedKeys(allIds);
  };

  const collapseAll = () => setExpandedKeys(new Set());

  const handleSelectNode = (node) => {
    setSelectedNode(node);
    setNodeForm({ 
       id: node.id, 
       code: node.code || '', 
       title: node.title, 
       parentId: node.parentId || '', 
       active: node.active 
    });
    setIsNodeEditMode(true);
  };

  const handlePrepareNewNode = () => {
     setNodeForm({ 
        id: null, 
        code: '', 
        title: '', 
        parentId: selectedNode ? selectedNode.id : '', 
        active: true 
     });
     setIsNodeEditMode(false);
  };

  const handleSaveNode = async () => {
     if (!nodeForm.title) return alert(isRtl ? 'عنوان گره الزامی است' : 'Title is required');

     try {
        const payload = {
           chart_id: activeChart.id,
           code: cleanStr(nodeForm.code),
           title: cleanStr(nodeForm.title),
           parent_id: cleanStr(nodeForm.parentId),
           is_active: nodeForm.active
        };

        let targetNodeId = null;

        if (isNodeEditMode && selectedNode) {
           if (nodeForm.parentId === selectedNode.id) return alert(isRtl ? 'یک گره نمی‌تواند زیرمجموعه خودش باشد.' : 'Cannot be child of itself.');
           const { error } = await supabase.schema('gen').from('org_chart_nodes').update(payload).eq('id', selectedNode.id);
           if (error) throw error;
           targetNodeId = selectedNode.id;
        } else {
           const { data, error } = await supabase.schema('gen').from('org_chart_nodes').insert([payload]).select();
           if (error) throw error;
           if (data && data.length > 0) targetNodeId = data[0].id;
        }

        const currentExpanded = new Set(expandedKeys);
        if (nodeForm.parentId) currentExpanded.add(nodeForm.parentId);
        
        // Pass targetNodeId to retain selection after refresh
        await fetchDesignerData(activeChart.id, targetNodeId);
        setExpandedKeys(currentExpanded);

     } catch (err) {
        console.error(err);
        alert(t.err_save || 'Error saving node');
     }
  };

  const handleDeleteNode = async () => {
    if (!selectedNode) return;
    if (!confirm(t.oc_delete_confirm_cascade)) return;
    
    try {
       const { error } = await supabase.schema('gen').from('org_chart_nodes').delete().eq('id', selectedNode.id);
       if (error) throw error;
       
       await fetchDesignerData(activeChart.id);
       setSelectedNode(null);
       handlePrepareNewNode();
    } catch (err) {
       console.error(err);
    }
  };

  // Personnel Handlers
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp =>
       (emp.name && emp.name.toLowerCase().includes(empSearchTerm.toLowerCase())) ||
       (emp.code && emp.code.toLowerCase().includes(empSearchTerm.toLowerCase()))
    );
  }, [employees, empSearchTerm]);

  const handleOpenAssignModal = (assignment = null) => {
    if (assignment) {
       setAssignData({ 
          id: assignment.id, 
          personId: assignment.personId || '', 
          fromDate: assignment.fromDate || '', 
          toDate: assignment.toDate || '' 
       });
       const emp = employees.find(e => String(e.id) === String(assignment.personId));
       setEmpSearchTerm(emp ? `${emp.name} (${emp.code})` : assignment.name || '');
    } else {
       setAssignData({ id: null, personId: '', fromDate: '', toDate: '' });
       setEmpSearchTerm('');
    }
    setIsAssignModalOpen(true);
  };

  const handleSaveAssignment = async () => {
    if (!assignData.personId || !selectedNode) return;
    const personName = employees.find(p => String(p.id) === String(assignData.personId))?.name || '';
    
    try {
       const payload = {
          node_id: selectedNode.id,
          person_id: Number(assignData.personId),
          person_name: cleanStr(personName),
          from_date: cleanDate(assignData.fromDate),
          to_date: cleanDate(assignData.toDate)
       };

       if (assignData.id) {
          const { error } = await supabase.schema('gen').from('org_chart_personnel').update(payload).eq('id', assignData.id);
          if (error) {
             console.error("Supabase Error:", error);
             if (error.code === '22008' || error.message?.includes('date format')) return alert(isRtl ? 'فرمت تاریخ نامعتبر است. از تاریخ میلادی صحیح استفاده کنید.' : 'Invalid Date Format.');
             throw error;
          }
       } else {
          const { error } = await supabase.schema('gen').from('org_chart_personnel').insert([payload]);
          if (error) {
             console.error("Supabase Error:", error);
             if (error.code === '22008' || error.message?.includes('date format')) return alert(isRtl ? 'فرمت تاریخ نامعتبر است. از تاریخ میلادی صحیح استفاده کنید.' : 'Invalid Date Format.');
             throw error;
          }
       }

       // Refetch tree and retain the current selectedNode
       await fetchDesignerData(activeChart.id, selectedNode.id);
       setIsAssignModalOpen(false);
    } catch(err) {
       console.error(err);
    }
  };

  const handleRemovePerson = async (pId) => {
     if(!confirm(t.confirm_delete_single || 'Delete record?')) return;
     try {
        const { error } = await supabase.schema('gen').from('org_chart_personnel').delete().eq('id', pId);
        if (error) throw error;
        
        // Refetch tree and retain the current selectedNode
        await fetchDesignerData(activeChart.id, selectedNode.id);
     } catch (err) {
        console.error(err);
     }
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

  const renderList = () => {
    const columns = [
      { field: 'code', header: t.oc_code || (isRtl ? 'کد' : 'Code'), width: 'w-24' },
      { field: 'title', header: t.oc_title_field || (isRtl ? 'عنوان' : 'Title'), width: 'w-48' },
      { 
         field: 'type', header: t.oc_type || (isRtl ? 'نوع چارت' : 'Type'), width: 'w-32',
         render: (row) => {
            const types = { standard: t.oc_type_std || 'Standard', sales: t.oc_type_sales || 'Sales', finance: t.oc_type_finance || 'Finance', hr: t.oc_type_hr || 'HR', custom: t.oc_type_custom || 'Custom' };
            return <Badge variant="neutral">{types[row.type] || row.type}</Badge>;
         }
      },
      { field: 'startDate', header: t.oc_start_date || (isRtl ? 'تاریخ شروع' : 'Start Date'), width: 'w-24', className: 'dir-ltr text-center font-mono' },
      { field: 'endDate', header: t.oc_end_date || (isRtl ? 'تاریخ پایان' : 'End Date'), width: 'w-24', className: 'dir-ltr text-center font-mono' },
      { 
         field: 'active', header: t.active_status || (isRtl ? 'فعال' : 'Active'), width: 'w-20',
         render: (row) => (
            <div className="flex justify-center">
               <input 
                 type="checkbox" 
                 className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                 checked={row.active} 
                 onChange={(e) => handleToggleActiveList(row.id, e.target.checked)} 
               />
            </div>
         )
      }
    ];

    return (
      <div className={`flex flex-col h-full ${isRtl ? 'font-vazir' : 'font-sans'}`}>
         <div className="mb-6 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
               <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200">
                  <Network size={24} />
               </div>
               <div>
                  <h1 className="text-xl font-black text-slate-800">{t.oc_title || (isRtl ? 'چارت سازمانی' : 'Org Chart')}</h1>
                  <p className="text-xs text-slate-500 font-medium mt-1">{t.oc_subtitle || (isRtl ? 'طراحی ساختار سازمان' : 'Design organizational structure')}</p>
               </div>
            </div>
         </div>

         <FilterSection isRtl={isRtl} onSearch={() => {}} onClear={() => setFilters({ code: '', title: '' })}>
            <InputField label={t.oc_code || (isRtl ? 'کد' : 'Code')} value={filters.code} onChange={e => setFilters({...filters, code: e.target.value})} isRtl={isRtl} />
            <InputField label={t.oc_title_field || (isRtl ? 'عنوان' : 'Title')} value={filters.title} onChange={e => setFilters({...filters, title: e.target.value})} isRtl={isRtl} />
         </FilterSection>
         
         <div className="flex-1 min-h-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <DataGrid 
               columns={columns} data={filteredCharts} isRtl={isRtl}
               onCreate={canCreate ? () => handleOpenChartModal() : undefined}
               actions={(row) => (
                  <div className="flex items-center gap-1">
                     <Button variant="ghost" size="iconSm" icon={FolderTree} title={t.oc_design_btn || (isRtl ? 'طراحی' : 'Design')} className="text-indigo-600 hover:bg-indigo-50" onClick={() => handleOpenDesigner(row)} />
                     {canEdit && <Button variant="ghost" size="iconSm" icon={Edit} onClick={() => handleOpenChartModal(row)} />}
                     {canDelete && <Button variant="ghost" size="iconSm" icon={Trash2} className="text-red-500 hover:bg-red-50" onClick={() => handleDeleteChart([row.id])} />}
                  </div>
               )}
            />
         </div>
      </div>
    );
  };

  const renderDesigner = () => {
    const BackIcon = isRtl ? ArrowRight : ArrowLeft;
    const parentOptions = flattenNodes(treeData).filter(n => n.id !== nodeForm.id); 

    return (
      <div className={`flex flex-col h-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-300 ${isRtl ? 'font-vazir' : 'font-sans'}`}>
         {/* 1. Header Actions */}
         <div className="bg-white border-b border-slate-200 p-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
               <Button variant="ghost" size="sm" icon={BackIcon} onClick={() => setViewMode('list')}>
                  {t.oc_back_list || (isRtl ? 'بازگشت به لیست' : 'Back to List')}
               </Button>
               <div className="h-5 w-px bg-slate-300 mx-1"></div>
               <h2 className="font-bold text-slate-800 text-sm">
                  {t.oc_design || (isRtl ? 'طراحی' : 'Design')}: <span className="text-indigo-600">{activeChart?.title}</span>
               </h2>
            </div>
         </div>

         {/* 2. Main Content (Split View) */}
         <div className="flex-1 flex overflow-hidden">
            
            {/* RIGHT (RTL) / LEFT (LTR): Tree Structure */}
            <div className={`w-1/3 min-w-[300px] flex flex-col bg-slate-50/50 ${isRtl ? 'border-l' : 'border-r'} border-slate-200`}>
               <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-white">
                  <h3 className="text-xs font-black text-slate-600 uppercase flex items-center gap-2">
                     <FolderTree size={16}/> {t.oc_tree_title || (isRtl ? 'درختواره' : 'Tree')}
                  </h3>
                  <div className="flex items-center gap-1">
                     <Button variant="ghost" size="iconSm" icon={Maximize2} title={t.oc_expand_all || (isRtl ? 'باز کردن همه' : 'Expand All')} onClick={expandAll} />
                     <Button variant="ghost" size="iconSm" icon={Minimize2} title={t.oc_collapse_all || (isRtl ? 'بستن همه' : 'Collapse All')} onClick={collapseAll} />
                     <Button variant="ghost" size="iconSm" icon={Plus} onClick={handlePrepareNewNode} title={t.oc_add_root || (isRtl ? 'گره جدید' : 'New Node')} />
                  </div>
               </div>
               <div className="flex-1 overflow-y-auto p-2">
                  {treeData.length > 0 ? (
                     treeData.map(node => (
                       <CustomTreeNode 
                         key={node.id} node={node} level={0} 
                         selectedId={selectedNode?.id} onSelect={handleSelectNode} 
                         expandedKeys={expandedKeys} onToggle={toggleExpand} isRtl={isRtl} 
                       />
                     ))
                  ) : (
                     <div className="text-center p-8 text-slate-400 text-xs italic">
                        {isRtl ? 'ساختاری تعریف نشده است.' : 'No structure defined.'}
                     </div>
                  )}
               </div>
            </div>

            {/* LEFT (RTL) / RIGHT (LTR): Form & Details */}
            <div className="flex-1 flex flex-col bg-white">
               {/* Top: Node Info Form */}
               <div className="p-5 border-b border-slate-200 bg-white">
                  <div className="flex items-center justify-between mb-4">
                     <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 uppercase">
                        {isNodeEditMode ? <Edit size={16} className="text-indigo-500"/> : <Plus size={16} className="text-emerald-500"/>}
                        {isNodeEditMode ? (t.oc_node_info || (isRtl ? 'اطلاعات گره' : 'Node Info')) : (isRtl ? 'تعریف گره جدید' : 'Define New Node')}
                     </h3>
                     {isNodeEditMode && (
                        <Button variant="danger" size="sm" icon={Trash2} onClick={handleDeleteNode}>{t.oc_delete_node || (isRtl ? 'حذف گره' : 'Delete Node')}</Button>
                     )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                     <InputField label={t.oc_node_code || (isRtl ? 'کد گره' : 'Node Code')} value={nodeForm.code} onChange={e => setNodeForm({...nodeForm, code: e.target.value})} isRtl={isRtl} className="dir-ltr" />
                     <InputField label={`${t.oc_node_title || (isRtl ? 'عنوان گره' : 'Node Title')} *`} value={nodeForm.title} onChange={e => setNodeForm({...nodeForm, title: e.target.value})} isRtl={isRtl} />
                     
                     <SelectField label={t.oc_parent || (isRtl ? 'گره مادر' : 'Parent Node')} isRtl={isRtl} value={nodeForm.parentId} onChange={e => setNodeForm({...nodeForm, parentId: e.target.value})}>
                        <option value="">{t.oc_root || (isRtl ? 'ریشه' : 'Root')}</option>
                        {parentOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.title}</option>)}
                     </SelectField>

                     <div className="flex items-end pb-2">
                        <div className={`bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 flex items-center justify-between w-full h-8`}>
                           <span className="text-xs font-bold text-slate-600">{t.active_status || (isRtl ? 'فعال' : 'Active')}</span>
                           <input 
                              type="checkbox" 
                              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                              checked={nodeForm.active} 
                              onChange={e => setNodeForm({...nodeForm, active: e.target.checked})} 
                           />
                        </div>
                     </div>
                  </div>
                  
                  <div className="mt-4 flex justify-end pt-2 border-t border-slate-100">
                     <Button variant="primary" icon={Save} onClick={handleSaveNode}>{t.btn_save || (isRtl ? 'ذخیره' : 'Save')}</Button>
                  </div>
               </div>

               {/* Bottom: Personnel */}
               <div className="flex-1 flex flex-col p-5 bg-slate-50/30">
                  <div className="flex items-center justify-between mb-3">
                     <h3 className="text-xs font-black text-slate-500 uppercase flex items-center gap-2">
                        <Users size={14}/> {t.oc_personnel || (isRtl ? 'پرسنل' : 'Personnel')}
                     </h3>
                     {isNodeEditMode && (
                        <Button variant="secondary" size="sm" icon={Plus} onClick={() => handleOpenAssignModal()}>{t.oc_assign_person || (isRtl ? 'تخصیص پرسنل' : 'Assign Personnel')}</Button>
                     )}
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex-1 relative">
                     {selectedNode && selectedNode.personnel && selectedNode.personnel.length > 0 ? (
                        <div className="absolute inset-0 overflow-auto">
                           <table className="w-full text-xs">
                              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 sticky top-0">
                                 <tr>
                                    <th className={`px-4 py-2 ${isRtl ? 'text-right' : 'text-left'}`}>{t.oc_person || (isRtl ? 'شخص' : 'Person')}</th>
                                    <th className="px-4 py-2 text-center">{t.oc_from_date || (isRtl ? 'از تاریخ' : 'From Date')}</th>
                                    <th className="px-4 py-2 text-center">{t.oc_to_date || (isRtl ? 'تا تاریخ' : 'To Date')}</th>
                                    <th className="px-4 py-2 text-center w-24">{t.colActions || (isRtl ? 'عملیات' : 'Actions')}</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                 {selectedNode.personnel.map(p => (
                                    <tr key={p.id} className="hover:bg-slate-50">
                                       <td className="px-4 py-1.5 font-bold text-slate-700">{p.name}</td>
                                       <td className="px-4 py-1.5 text-center dir-ltr text-slate-500 font-mono">{p.fromDate}</td>
                                       <td className="px-4 py-1.5 text-center dir-ltr text-slate-500 font-mono">{p.toDate || '-'}</td>
                                       <td className="px-4 py-1.5 text-center">
                                          <div className="flex justify-center gap-1">
                                             <button onClick={() => handleOpenAssignModal(p)} className="text-indigo-500 hover:bg-indigo-50 p-1 rounded"><Edit size={14}/></button>
                                             <button onClick={() => handleRemovePerson(p.id)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={14}/></button>
                                          </div>
                                       </td>
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                     ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                           <p className="text-xs italic">{isNodeEditMode ? (t.oc_no_person || (isRtl ? 'شخصی تخصیص داده نشده است' : 'No personnel assigned.')) : (isRtl ? 'یک گره را برای مشاهده پرسنل انتخاب کنید' : 'Select a node to view personnel')}</p>
                        </div>
                     )}
                  </div>
               </div>
            </div>
         </div>
      </div>
    );
  };

  return (
    <div className={`flex flex-col h-full p-4 md:p-6 bg-slate-50/50 ${isRtl ? 'font-vazir' : 'font-sans'}`}>
      <Modal 
         isOpen={isChartModalOpen} onClose={() => setIsChartModalOpen(false)} 
         title={chartFormData.id ? (t.oc_edit || (isRtl ? 'ویرایش' : 'Edit')) : (t.oc_new || (isRtl ? 'جدید' : 'New'))}
         footer={<><Button variant="ghost" onClick={() => setIsChartModalOpen(false)}>{t.btn_cancel || (isRtl ? 'انصراف' : 'Cancel')}</Button><Button variant="primary" icon={Save} onClick={handleSaveChartMeta}>{t.btn_save || (isRtl ? 'ذخیره' : 'Save')}</Button></>}
      >
         <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <InputField label={`${t.oc_code || (isRtl ? 'کد' : 'Code')} *`} value={chartFormData.code} onChange={e => setChartFormData({...chartFormData, code: e.target.value})} isRtl={isRtl} className="dir-ltr" />
            <InputField label={`${t.oc_title_field || (isRtl ? 'عنوان' : 'Title')} *`} value={chartFormData.title} onChange={e => setChartFormData({...chartFormData, title: e.target.value})} isRtl={isRtl} />
            <SelectField label={t.oc_type || (isRtl ? 'نوع' : 'Type')} value={chartFormData.type} onChange={e => setChartFormData({...chartFormData, type: e.target.value})} isRtl={isRtl}>
               <option value="standard">{t.oc_type_std || (isRtl ? 'استاندارد' : 'Standard')}</option>
               <option value="sales">{t.oc_type_sales || (isRtl ? 'فروش' : 'Sales')}</option>
               <option value="finance">{t.oc_type_finance || (isRtl ? 'مالی' : 'Finance')}</option>
               <option value="hr">{t.oc_type_hr || (isRtl ? 'سرمایه انسانی' : 'HR')}</option>
               <option value="custom">{t.oc_type_custom || (isRtl ? 'سفارشی' : 'Custom')}</option>
            </SelectField>
            
            <div className="bg-slate-50 px-3 flex items-center justify-between rounded-lg border border-slate-200 h-8 mt-auto">
               <span className="text-xs font-bold text-slate-700">{t.active_status || (isRtl ? 'فعال' : 'Active')}</span>
               <input 
                  type="checkbox" 
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                  checked={chartFormData.active} 
                  onChange={e => setChartFormData({...chartFormData, active: e.target.checked})} 
               />
            </div>

            <DatePicker label={t.oc_start_date || (isRtl ? 'تاریخ شروع' : 'Start Date')} value={chartFormData.startDate} onChange={e => setChartFormData({...chartFormData, startDate: e.target.value})} isRtl={isRtl} className="dir-ltr" />
            <DatePicker label={t.oc_end_date || (isRtl ? 'تاریخ پایان' : 'End Date')} value={chartFormData.endDate} onChange={e => setChartFormData({...chartFormData, endDate: e.target.value})} isRtl={isRtl} className="dir-ltr" />
         </div>
      </Modal>

      <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} title={t.oc_assign_person || (isRtl ? 'تخصیص پرسنل' : 'Assign Personnel')} size="sm"
         footer={<><Button variant="ghost" onClick={() => setIsAssignModalOpen(false)}>{t.btn_cancel || (isRtl ? 'انصراف' : 'Cancel')}</Button><Button variant="primary" onClick={handleSaveAssignment}>{t.oc_assign || (isRtl ? 'افزودن' : 'Add')}</Button></>}>
         <div className="space-y-4 overflow-visible">
            
            {/* Custom Searchable Select for Personnel */}
            <div className="relative" ref={empDropdownRef}>
               <label className="block text-[11px] font-bold text-slate-600 mb-1">{t.oc_select_person || (isRtl ? 'انتخاب شخص (کد یا نام)' : 'Select Person (Code or Name)')}</label>
               <div className="relative">
                  <input
                     className={`w-full h-9 bg-white border border-slate-200 rounded text-xs outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all ${isRtl ? 'pr-2 pl-8' : 'pl-2 pr-8'}`}
                     placeholder={isRtl ? "جستجو..." : "Search..."}
                     value={empSearchTerm}
                     onChange={e => {
                        setEmpSearchTerm(e.target.value);
                        setAssignData({...assignData, personId: ''});
                        setIsEmpDropdownOpen(true);
                     }}
                     onFocus={() => setIsEmpDropdownOpen(true)}
                  />
                  {assignData.personId ? (
                     <X size={14} className={`absolute top-2.5 text-slate-400 cursor-pointer hover:text-red-500 ${isRtl ? 'left-2.5' : 'right-2.5'}`} onClick={() => { setAssignData({...assignData, personId: ''}); setEmpSearchTerm(''); }} />
                  ) : (
                     <Search size={14} className={`absolute top-2.5 text-slate-400 ${isRtl ? 'left-2.5' : 'right-2.5'}`} />
                  )}
               </div>
               
               {isEmpDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg z-[100] max-h-48 overflow-y-auto p-1">
                     {filteredEmployees.length > 0 ? filteredEmployees.map(emp => (
                        <div key={emp.id} className="px-3 py-2 text-xs cursor-pointer hover:bg-indigo-50 rounded flex flex-col transition-colors border-b border-slate-50 last:border-0" onClick={() => {
                           setAssignData({...assignData, personId: emp.id});
                           setEmpSearchTerm(`${emp.name} (${emp.code})`);
                           setIsEmpDropdownOpen(false);
                        }}>
                           <span className="font-bold text-slate-700">{emp.name}</span>
                           <span className="text-[10px] font-mono text-slate-400">{emp.code}</span>
                        </div>
                     )) : <div className="p-3 text-center text-slate-400 text-xs">{isRtl ? 'موردی یافت نشد.' : 'No items found.'}</div>}
                  </div>
               )}
            </div>

            <DatePicker label={t.oc_from_date || (isRtl ? 'از تاریخ' : 'From Date')} value={assignData.fromDate} onChange={e => setAssignData({...assignData, fromDate: e.target.value})} isRtl={isRtl} className="dir-ltr" />
            <DatePicker label={t.oc_to_date || (isRtl ? 'تا تاریخ' : 'To Date')} value={assignData.toDate} onChange={e => setAssignData({...assignData, toDate: e.target.value})} isRtl={isRtl} className="dir-ltr" />
         </div>
      </Modal>

      {viewMode === 'list' ? renderList() : renderDesigner()}
    </div>
  );
};

window.OrgChart = OrgChart;
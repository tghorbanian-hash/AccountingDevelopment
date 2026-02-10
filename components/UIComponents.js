/* Filename: components/UIComponents.js */
import React, { useState, useMemo, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';

// Extract icons safely
const Loader2 = LucideIcons.Loader2;
const ChevronDown = LucideIcons.ChevronDown;
const ChevronRight = LucideIcons.ChevronRight;
const Search = LucideIcons.Search;
const X = LucideIcons.X;
const Check = LucideIcons.Check;
const Filter = LucideIcons.Filter;
const Settings = LucideIcons.Settings;
const ChevronLeft = LucideIcons.ChevronLeft;
const ChevronsLeft = LucideIcons.ChevronsLeft;
const ChevronsRight = LucideIcons.ChevronsRight;
const List = LucideIcons.List;
const MoreVertical = LucideIcons.MoreVertical;
const Plus = LucideIcons.Plus;
const Trash2 = LucideIcons.Trash2;
const Download = LucideIcons.Download;
const Printer = LucideIcons.Printer;
const Edit = LucideIcons.Edit;
const Eye = LucideIcons.Eye;
const Maximize2 = LucideIcons.Maximize2;
const Minimize2 = LucideIcons.Minimize2;
const FolderOpen = LucideIcons.FolderOpen;
const Folder = LucideIcons.Folder;
const FileText = LucideIcons.FileText;
const AlertCircle = LucideIcons.AlertCircle;
const ArrowRight = LucideIcons.ArrowRight;
const ArrowUp = LucideIcons.ArrowUp;
const ArrowDown = LucideIcons.ArrowDown;
const Info = LucideIcons.Info;

// --- ENTERPRISE THEME TOKENS ---
const THEME = {
  colors: {
    primary: 'bg-indigo-700 hover:bg-indigo-800 text-white',
    primaryLight: 'bg-indigo-50 text-indigo-700',
    secondary: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300',
    accent: 'text-indigo-700',
    surface: 'bg-white',
    background: 'bg-slate-100',
    border: 'border-slate-200',
    textMain: 'text-slate-800',
    textMuted: 'text-slate-500',
    headerBg: 'bg-slate-50',
    rowHover: 'hover:bg-indigo-50/60',
    rowSelected: 'bg-indigo-50 border-l-4 border-l-indigo-600', 
    groupHeader: 'bg-slate-100/90 backdrop-blur-sm text-slate-700 font-bold',
  },
  metrics: {
    radius: 'rounded-md', 
    inputHeight: 'h-8',
    buttonHeight: 'h-8',
    fontSize: 'text-[12px]', 
    headerHeight: 'h-9',
  }
};

// --- 1. ATOMIC COMPONENTS ---

const Button = ({ 
  children, variant = 'primary', icon, isLoading, className = '', onClick, disabled, size = 'default', title
}) => {
  const baseStyle = `flex items-center justify-center gap-1.5 px-3 ${THEME.metrics.radius} font-medium ${THEME.metrics.fontSize} transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed select-none whitespace-nowrap active:scale-[0.98] outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-100`;
  
  const variants = {
    primary: `${THEME.colors.primary} shadow-sm border border-transparent`,
    secondary: `${THEME.colors.secondary} shadow-sm`,
    ghost: `bg-transparent text-slate-600 hover:bg-slate-200 hover:text-slate-900`,
    danger: `bg-white text-red-600 border border-red-200 hover:bg-red-50 hover:border-red-300 shadow-sm`,
    success: `bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm`,
    outline: `bg-transparent border border-slate-300 text-slate-600 hover:border-indigo-300 hover:text-indigo-600`,
  };

  const sizes = {
    default: THEME.metrics.buttonHeight,
    sm: 'h-6 px-2 text-[11px]',
    icon: 'h-8 w-8 px-0',
    iconSm: 'h-6 w-6 px-0',
  };
  
  // Determine Icon Element
  let IconElement = null;
  const iconSize = size === 'sm' || size === 'iconSm' ? 14 : 16;
  
  if (isLoading) {
    IconElement = <Loader2 size={iconSize} className="animate-spin" />;
  } else if (React.isValidElement(icon)) {
    IconElement = React.cloneElement(icon, { size: iconSize, strokeWidth: 2 });
  } else if (icon) {
    const IconComp = icon;
    IconElement = <IconComp size={iconSize} strokeWidth={2} />;
  }

  return (
    <button 
      onClick={onClick} 
      disabled={isLoading || disabled} 
      title={title}
      type="button"
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {IconElement}
      {children}
    </button>
  );
};

const InputField = ({ label, icon: Icon, isRtl, className = '', ...props }) => {
  return (
    <div className={`w-full ${className}`}>
      {label && <label className="block text-[11px] font-bold text-slate-600 mb-1">{label}</label>}
      <div className="relative group">
        {Icon && (
          <div className={`absolute inset-y-0 ${isRtl ? 'right-2' : 'left-2'} flex items-center text-slate-400 group-focus-within:text-indigo-600 transition-colors`}>
            <Icon size={14} />
          </div>
        )}
        <input 
          {...props}
          className={`
            w-full ${THEME.colors.surface} border ${THEME.colors.border}
            ${THEME.metrics.radius} ${THEME.metrics.inputHeight}
            ${Icon ? (isRtl ? 'pr-8 pl-2' : 'pl-8 pr-2') : 'px-2'} 
            outline-none 
            focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500
            transition-all text-[12px] text-slate-800 placeholder:text-slate-400
          `}
        />
      </div>
    </div>
  );
};

const SelectField = ({ label, children, isRtl, className = '', ...props }) => (
  <div className={`w-full ${className}`}>
    {label && <label className="block text-[11px] font-bold text-slate-600 mb-1">{label}</label>}
    <div className="relative group">
      <select 
        {...props}
        className={`
          w-full ${THEME.colors.surface} border ${THEME.colors.border}
          ${THEME.metrics.radius} ${THEME.metrics.inputHeight} pl-2 pr-8 appearance-none
          outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500
          transition-all text-[12px] text-slate-800 cursor-pointer hover:border-slate-300
        `}
      >
        {children}
      </select>
      <div className={`absolute inset-y-0 ${isRtl ? 'left-2' : 'right-2'} flex items-center pointer-events-none text-slate-400 group-hover:text-slate-600`}>
        <ChevronDown size={14} />
      </div>
    </div>
  </div>
);

const Toggle = ({ checked, onChange, label, disabled }) => (
  <div 
    className={`flex items-center gap-2 select-none ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer group'}`}
    onClick={() => !disabled && onChange(!checked)}
  >
    <div className={`
      w-8 h-4 rounded-full p-0.5 transition-all duration-200 ease-in-out relative border
      ${checked ? 'bg-indigo-600 border-indigo-600' : 'bg-slate-200 border-slate-300 group-hover:border-slate-400'}
    `}>
      <div className={`
        w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform duration-200
        ${checked ? (document.dir === 'rtl' ? '-translate-x-4' : 'translate-x-4') : 'translate-x-0'}
      `}></div>
    </div>
    {label && <span className="text-[12px] font-medium text-slate-700">{label}</span>}
  </div>
);

const Badge = ({ children, variant = 'neutral', className='' }) => {
  const styles = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-red-50 text-red-700 border-red-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    neutral: 'bg-slate-100 text-slate-600 border-slate-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0 rounded-md text-[11px] font-bold border ${styles[variant] || styles.neutral} ${className}`}>
      {children}
    </span>
  );
};

// --- NEW COMPONENTS FOR ROLES & ACCESS ---

// 1. ToggleChip
const ToggleChip = ({ label, checked, onClick, colorClass = "green" }) => {
  const styles = {
    green: checked 
      ? 'bg-emerald-50 border-emerald-400 text-emerald-700 font-bold ring-1 ring-emerald-100 shadow-sm' 
      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50',
    indigo: checked 
      ? 'bg-indigo-50 border-indigo-400 text-indigo-700 font-bold ring-1 ring-indigo-100 shadow-sm' 
      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50',
  };

  const activeStyle = styles[colorClass] || styles.green;

  return (
    <button
      onClick={onClick}
      className={`
        px-3 py-1.5 rounded-lg text-[11px] border transition-all duration-200
        ${activeStyle} text-center min-w-[80px]
      `}
    >
      {label}
    </button>
  );
};

// 2. SelectionGrid
const SelectionGrid = ({ items, selectedIds = [], onToggle, columns = 4 }) => {
  const gridCols = { 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4', 6: 'grid-cols-6' };
  
  return (
    <div className={`grid ${gridCols[columns] || 'grid-cols-4'} gap-2`}>
      {items.map(item => {
         const isChecked = selectedIds.includes(item.id);
         return (
            <div 
               key={item.id} 
               className={`
                  flex items-center justify-center p-2 rounded-lg border transition-all duration-200 cursor-pointer select-none text-center h-10
                  ${isChecked 
                    ? 'bg-indigo-50 border-indigo-400 text-indigo-700 font-bold shadow-sm ring-1 ring-indigo-100' 
                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'}
               `}
               onClick={() => onToggle(item.id)}
            >
               <span className="text-[11px]">{item.label}</span>
            </div>
         );
      })}
    </div>
  );
};

// 3. TreeView
const TreeView = ({ data, onSelectNode, selectedNodeId, renderNodeContent, isRtl, searchPlaceholder }) => {
  const [expandedNodes, setExpandedNodes] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  // Default placeholder based on language
  const defaultPlaceholder = searchPlaceholder || (isRtl ? "جستجو..." : "Search...");

  // Filtering Logic
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    const filterNodes = (nodes) => {
      return nodes.reduce((acc, node) => {
        const label = (node.label[isRtl ? 'fa' : 'en'] || '').toLowerCase();
        const matches = label.includes(searchTerm.toLowerCase());
        let children = [];
        if (node.children) children = filterNodes(node.children);
        if (matches || children.length > 0) {
          acc.push({ ...node, children, _matches: matches });
        }
        return acc;
      }, []);
    };
    return filterNodes(data);
  }, [data, searchTerm, isRtl]);

  // Auto Expand on Search
  useEffect(() => {
    if (searchTerm) {
      const allIds = {};
      const traverse = (nodes) => {
        nodes.forEach(n => {
          if (n.children && n.children.length > 0) {
            allIds[n.id] = true;
            traverse(n.children);
          }
        });
      };
      traverse(filteredData);
      setExpandedNodes(allIds);
    } else {
      setExpandedNodes({});
    }
  }, [searchTerm, filteredData]);

  const toggleNode = (id, e) => {
    e.stopPropagation();
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const renderTree = (items, depth = 0) => {
    return items.map(item => {
      const hasChildren = item.children && item.children.length > 0;
      const isExpanded = expandedNodes[item.id];
      const isSelected = selectedNodeId === item.id;
      
      const label = item.label[isRtl ? 'fa' : 'en'];
      const displayLabel = (searchTerm && item._matches) ? <mark className="bg-yellow-100 rounded px-0.5">{label}</mark> : label;

      return (
        <div key={item.id} className="select-none relative">
           {depth > 0 && <div className={`absolute top-0 bottom-0 w-px bg-slate-200 ${isRtl ? 'right-[11px]' : 'left-[11px]'}`}></div>}
           <div 
             className={`
               flex items-center gap-2 py-1.5 px-2 my-0.5 cursor-pointer rounded-lg transition-all
               ${isSelected ? 'bg-indigo-50 text-indigo-700 font-bold ring-1 ring-indigo-200' : 'hover:bg-slate-100 text-slate-700'}
             `}
             style={{ paddingRight: isRtl ? `${depth * 16 + 8}px` : '8px', paddingLeft: isRtl ? '8px' : `${depth * 16 + 8}px` }}
             onClick={() => onSelectNode(item)}
           >
             {hasChildren ? (
               <div 
                  className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors z-10"
                  onClick={(e) => toggleNode(item.id, e)}
               >
                  <div className={`transition-transform duration-200 ${isExpanded ? '' : (isRtl ? 'rotate-90' : '-rotate-90')}`}>
                    <ChevronDown size={14} />
                  </div>
               </div>
             ) : (
                <div className="shrink-0">{renderNodeContent ? renderNodeContent(item) : <div className="w-5 h-5"/>}</div>
             )}
             
             <div className="flex items-center gap-2 truncate">
                {hasChildren && <span className={`text-slate-400 ${isExpanded ? 'text-indigo-400' : ''}`}>{isExpanded ? <FolderOpen size={14}/> : <Folder size={14}/>}</span>}
                <span className="text-[12px] truncate">{displayLabel}</span>
             </div>
           </div>
           {hasChildren && isExpanded && <div className="overflow-hidden animate-in slide-in-from-top-1 duration-200">{renderTree(item.children, depth + 1)}</div>}
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="relative mb-2 shrink-0">
         <input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={defaultPlaceholder} 
            className={`w-full bg-slate-100 border border-slate-200 rounded-md text-[11px] h-8 focus:bg-white focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none transition-all ${isRtl ? 'pr-8 pl-2' : 'pl-8 pr-2'}`} 
         />
         <Search size={14} className={`absolute top-1/2 -translate-y-1/2 text-slate-400 ${isRtl ? 'right-2.5' : 'left-2.5'}`}/>
         {searchTerm && <button onClick={() => setSearchTerm('')} className={`absolute top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 ${isRtl ? 'left-2' : 'right-2'}`}><X size={12}/></button>}
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
         {filteredData.length > 0 ? renderTree(filteredData) : <div className="text-center p-4 text-slate-400 text-xs">{isRtl ? 'موردی یافت نشد.' : 'No items found.'}</div>}
      </div>
    </div>
  );
};


// --- EXISTING COMPLEX COMPONENTS ---

// 2. FILTER SECTION
const FilterSection = ({ children, onSearch, onClear, isRtl, title }) => {
  const [isOpen, setIsOpen] = useState(true);

  // Defaults based on isRtl
  const defaultTitle = title || (isRtl ? "فیلترهای پیشرفته" : "Advanced Filters");
  const clearLabel = isRtl ? "پاک کردن" : "Clear";
  const searchLabel = isRtl ? "اعمال فیلتر" : "Apply Filter";

  return (
    <div className={`bg-white border border-slate-300 rounded-lg shadow-sm mb-3 transition-all duration-300 ${isOpen ? 'overflow-visible' : 'overflow-hidden'}`}>
      <div 
        className="flex items-center justify-between px-3 py-2 bg-slate-50 cursor-pointer select-none border-b border-transparent hover:bg-slate-100"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 text-indigo-700 font-bold text-[12px]">
          <Filter size={14} />
          <span>{defaultTitle}</span>
        </div>
        <div className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          <ChevronDown size={16} />
        </div>
      </div>

      <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
        <div className="p-3 border-t border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-3 relative z-10">
            {children}
          </div>
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="ghost" onClick={onClear} size="sm" icon={X}>{clearLabel}</Button>
            <Button variant="primary" onClick={onSearch} size="sm" icon={Search}>{searchLabel}</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// 3. DATA GRID
const DataGrid = ({ 
  columns, 
  data = [], 
  onSelectAll, 
  onSelectRow, 
  selectedIds = [], 
  isLoading, 
  isRtl, 
  title,
  groupBy = [], 
  setGroupBy,
  onCreate,
  onDelete,
  onDoubleClick,
  actions 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Translations
  const txtSearch = isRtl ? "جستجو..." : "Search...";
  const txtLoading = isRtl ? "در حال بارگذاری..." : "Loading...";
  const txtNoData = isRtl ? "اطلاعاتی یافت نشد." : "No records found.";
  const txtRows = isRtl ? "سطر" : "Rows";
  const txtRecord = isRtl ? "رکورد" : "Records";
  const txtPage = isRtl ? "صفحه" : "Page";
  const txtOf = isRtl ? "از" : "of";
  const txtNew = isRtl ? "جدید" : "New";
  const txtDelete = isRtl ? "حذف" : "Delete";
  const txtExcel = isRtl ? "خروجی اکسل" : "Export Excel";
  const txtCols = isRtl ? "تنظیمات ستون‌ها" : "Column Settings";
  const txtOps = isRtl ? "عملیات" : "Actions";

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const processedData = useMemo(() => {
    let result = [...data];
    if (searchTerm) {
      result = result.filter(item => 
        Object.values(item).some(val => 
          String(val).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
    if (sortConfig.key) {
      result.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    if (groupBy.length > 0) {
      result.sort((a, b) => {
        for (let field of groupBy) {
          if (a[field] < b[field]) return -1;
          if (a[field] > b[field]) return 1;
        }
        return 0;
      });
      const flatList = [];
      let lastValues = {};
      result.forEach(row => {
        let isVisible = true;
        groupBy.forEach((field, level) => {
          const val = row[field];
          const groupKey = `grp-${level}-${field}-${val}`;
          if (lastValues[level] !== val) {
            flatList.push({
              _type: 'GROUP_HEADER',
              field,
              value: val,
              level,
              key: groupKey,
              count: result.filter(r => r[field] === val).length 
            });
            lastValues[level] = val;
            for(let l=level+1; l<groupBy.length; l++) lastValues[l] = null;
          }
          if (expandedGroups[groupKey] === false) {
             isVisible = false;
          }
        });
        if (isVisible) flatList.push(row);
      });
      result = flatList;
    }
    return result;
  }, [data, searchTerm, groupBy, expandedGroups, sortConfig]);

  const totalItems = processedData.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  
  useEffect(() => { if(currentPage > totalPages) setCurrentPage(1); }, [totalItems, pageSize]);
  const paginatedData = processedData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleGroup = (groupKey) => {
    setExpandedGroups(prev => ({ ...prev, [groupKey]: prev[groupKey] === false ? true : false }));
  };

  const removeGroup = (field) => {
    if(setGroupBy) setGroupBy(groupBy.filter(g => g !== field));
  };

  return (
    <div className="flex flex-col h-full bg-white border border-slate-300 rounded-lg shadow-sm overflow-hidden relative z-0">
      <div className="px-3 py-2 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {groupBy.map(field => (
             <span key={field} className="flex items-center gap-1 bg-white text-indigo-700 px-2 py-0.5 rounded border border-indigo-200 text-[11px] font-bold shadow-sm">
               <span>{columns.find(c => c.field === field)?.header || field}</span>
               <button onClick={() => removeGroup(field)} className="hover:text-red-500"><X size={12}/></button>
             </span>
          ))}
          {onCreate && (
             <Button variant="primary" size="sm" icon={Plus} onClick={onCreate}>{txtNew}</Button>
          )}
          {selectedIds.length > 0 && onDelete && (
             <Button variant="danger" size="sm" icon={Trash2} onClick={() => onDelete(selectedIds)}>{txtDelete} ({selectedIds.length})</Button>
          )}
        </div>

        <div className="flex items-center gap-2">
           <div className="relative">
             <input 
               placeholder={txtSearch} 
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
               className={`h-7 w-40 bg-white border border-slate-300 rounded text-[11px] outline-none focus:border-indigo-500 transition-all ${isRtl ? 'pr-7 pl-2' : 'pl-7 pr-2'}`}
             />
             <Search size={12} className={`absolute top-1/2 -translate-y-1/2 text-slate-400 ${isRtl ? 'right-2' : 'left-2'}`} />
           </div>
           <div className="flex items-center gap-1 border-r border-slate-300 pr-2 mr-1">
             <Button variant="ghost" size="iconSm" icon={Download} title={txtExcel} />
             <Button variant="ghost" size="iconSm" icon={Settings} title={txtCols} />
           </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto relative custom-scrollbar bg-white">
        <table className="w-full border-collapse text-[12px] relative">
          <thead className="bg-slate-100 sticky top-0 z-10 shadow-sm border-b border-slate-300">
            <tr>
              <th className="w-10 px-2 py-2 text-center">
                <input 
                  type="checkbox" 
                  className="rounded border-slate-400 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                  checked={data.length > 0 && selectedIds.length === data.length}
                  onChange={(e) => onSelectAll && onSelectAll(e.target.checked)}
                />
              </th>
              {columns.map((col, idx) => (
                <th 
                  key={idx} 
                  className={`px-3 py-2 font-bold text-slate-700 text-start whitespace-nowrap ${col.width || ''} hover:bg-slate-200 cursor-pointer transition-colors select-none`}
                  style={{ minWidth: col.minWidth }}
                  onClick={() => col.sortable && handleSort(col.field)}
                >
                  <div className="flex items-center gap-1">
                    {col.header}
                    {col.sortable && (
                      <div className="flex flex-col text-slate-400">
                        {sortConfig.key === col.field ? (
                           sortConfig.direction === 'asc' ? <ArrowUp size={12} className="text-indigo-600"/> : <ArrowDown size={12} className="text-indigo-600"/>
                        ) : (
                           <div className="opacity-0 group-hover:opacity-50"><ArrowDown size={12}/></div>
                        )}
                      </div>
                    )}
                  </div>
                </th>
              ))}
              <th className="px-3 py-2 w-20 text-center bg-slate-100 border-l border-slate-300">{txtOps}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
               <tr><td colSpan={100} className="p-10 text-center text-slate-500"><Loader2 className="animate-spin mx-auto mb-2"/>{txtLoading}</td></tr>
            ) : paginatedData.length === 0 ? (
               <tr><td colSpan={100} className="p-10 text-center text-slate-400 italic">{txtNoData}</td></tr>
            ) : (
              paginatedData.map((row, rowIndex) => {
                if (row._type === 'GROUP_HEADER') {
                  const isClosed = expandedGroups[row.key] === false;
                  return (
                    <tr key={row.key} className="bg-slate-50 sticky top-9 z-10">
                      <td colSpan={100} className="px-3 py-1.5 border-y border-slate-200">
                        <div 
                          className="flex items-center gap-2 cursor-pointer select-none"
                          onClick={() => toggleGroup(row.key)}
                          style={{ paddingRight: `${row.level * 16}px` }}
                        >
                           <div className={`p-0.5 rounded hover:bg-slate-200 transition-transform duration-200 ${isClosed ? (isRtl ? 'rotate-90' : '-rotate-90') : ''}`}>
                             <ChevronDown size={14} className="text-slate-500" />
                           </div>
                           <span className="font-bold text-slate-800 text-[11px]">{columns.find(c => c.field === row.field)?.header}:</span>
                           <span className="text-indigo-700 font-medium">{row.value}</span>
                           <Badge variant="neutral" className="mr-2 text-[10px] h-4 py-0">{row.count}</Badge>
                        </div>
                      </td>
                    </tr>
                  );
                }
                const isSelected = selectedIds.includes(row.id);
                return (
                  <tr 
                    key={row.id || rowIndex} 
                    onDoubleClick={() => onDoubleClick && onDoubleClick(row)}
                    className={`
                      transition-all duration-100 group
                      ${isSelected ? THEME.colors.rowSelected : 'hover:bg-slate-50'}
                    `}
                  >
                    <td className="px-2 py-1.5 border-r border-slate-100 text-center">
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-400 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                        checked={isSelected}
                        onChange={(e) => onSelectRow && onSelectRow(row.id, e.target.checked)}
                      />
                    </td>
                    {columns.map((col, cIdx) => (
                      <td key={cIdx} className="px-3 py-1.5 border-r border-slate-100 text-slate-700 truncate max-w-xs align-middle">
                         {col.type === 'toggle' ? (
                           <div className="flex justify-center"><Toggle checked={row[col.field]} onChange={() => {}} disabled /></div>
                         ) : col.render ? (
                           col.render(row)
                         ) : (
                           row[col.field]
                         )}
                      </td>
                    ))}
                    <td className="px-1 py-1 text-center bg-white group-hover:bg-slate-50 border-l border-slate-100">
                      <div className="flex items-center justify-center gap-1 opacity-100">
                        {actions ? actions(row) : null}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="px-3 py-2 bg-slate-50 border-t border-slate-300 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-2">
           <select 
             value={pageSize}
             onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
             className="bg-white border border-slate-300 rounded text-[11px] font-bold text-slate-700 py-0.5 px-1 outline-none focus:border-indigo-500 cursor-pointer"
           >
              <option value={10}>10 {txtRows}</option>
              <option value={25}>25 {txtRows}</option>
              <option value={50}>50 {txtRows}</option>
           </select>
           <div className="h-3 w-px bg-slate-300 mx-1"></div>
           <span className="text-[11px] text-slate-500">
             <span className="font-bold text-slate-800">{totalItems}</span> {txtRecord}
           </span>
        </div>

        <div className="flex items-center gap-1">
           <Button variant="outline" size="iconSm" icon={ChevronsRight} disabled={currentPage === 1} onClick={() => setCurrentPage(1)} />
           <Button variant="outline" size="iconSm" icon={ChevronRight} disabled={currentPage === 1} onClick={() => setCurrentPage(c => c - 1)} />
           <div className="flex items-center gap-1 px-2">
              <span className="text-[11px] text-slate-500">{txtPage}</span>
              <input 
                value={currentPage}
                onChange={(e) => setCurrentPage(Number(e.target.value))}
                className="w-8 h-6 text-center border border-slate-300 rounded text-[11px] font-bold outline-none focus:border-indigo-500"
              />
              <span className="text-[11px] text-slate-500">{txtOf} {totalPages}</span>
           </div>
           <Button variant="outline" size="iconSm" icon={ChevronLeft} disabled={currentPage === totalPages} onClick={() => setCurrentPage(c => c + 1)} />
           <Button variant="outline" size="iconSm" icon={ChevronsLeft} disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)} />
        </div>
      </div>
    </div>
  );
};

// 4. TREE MENU
const TreeMenu = ({ items, activeId, onSelect, isRtl }) => {
  const renderNode = (item) => (
     <div className={`w-1.5 h-1.5 rounded-full transition-colors ${activeId === item.id ? 'bg-indigo-600 scale-125' : 'bg-slate-300'}`}></div>
  );
  
  return <TreeView data={items} selectedNodeId={activeId} onSelectNode={(item) => onSelect(item.id)} renderNodeContent={renderNode} isRtl={isRtl} searchPlaceholder={isRtl ? "جستجوی منو..." : "Search Menu..."} />;
};

const Modal = ({ isOpen, onClose, title, children, footer, size = 'md' }) => {
  if (!isOpen) return null;
  const sizes = { sm: 'max-w-sm', md: 'max-w-xl', lg: 'max-w-4xl', xl: 'max-w-6xl', full: 'max-w-[95vw] h-[90vh]' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className={`bg-white rounded-lg shadow-2xl flex flex-col w-full ${sizes[size]} max-h-[90vh] animate-in zoom-in-95 border border-slate-200`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50 shrink-0 rounded-t-lg">
          <h3 className="font-bold text-slate-800 text-sm">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500"><X size={18} /></button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">{children}</div>
        {footer && <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2 shrink-0 rounded-b-lg">{footer}</div>}
      </div>
    </div>
  );
};

const DatePicker = ({ label, isRtl, className = '', ...props }) => (
  <div className={`w-full ${className}`}>
    {label && <label className="block text-[11px] font-bold text-slate-600 mb-1">{label}</label>}
    <div className="relative">
       <input type="date" {...props} className={`w-full ${THEME.colors.surface} border ${THEME.colors.border} ${THEME.metrics.radius} ${THEME.metrics.inputHeight} px-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-[12px] text-slate-800 uppercase font-mono transition-all`} />
    </div>
  </div>
);

const LOV = ({ label, placeholder, isRtl }) => (
  <div className="w-full">
    {label && <label className="block text-[11px] font-bold text-slate-600 mb-1">{label}</label>}
    <div className="flex relative">
      <input placeholder={placeholder} className={`flex-1 ${THEME.colors.surface} border ${THEME.colors.border} rounded-r-md border-l-0 ${THEME.metrics.inputHeight} px-2 outline-none focus:border-indigo-500 text-[12px]`} />
      <button className={`bg-slate-50 border ${THEME.colors.border} px-2 hover:bg-slate-100 rounded-l-md border-r-0`}><List size={14}/></button>
    </div>
  </div>
);

// 5. NEW GENERIC COMPONENTS (For DRY Compliance)

const SideMenu = ({ items, activeId, onChange, title, isRtl, className = '' }) => {
  return (
    <div className={`w-full ${className}`}>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {title && (
          <div className="p-3 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
              {title}
            </h3>
          </div>
        )}
        <div className="p-2 space-y-1">
          {items.map(item => {
            const isActive = activeId === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onChange(item.id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[12px] font-bold transition-all duration-200
                  ${isActive 
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200/50' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}
                `}
              >
                {Icon && <Icon size={16} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />}
                <span>{item.label}</span>
                {isActive && (
                  <div className={`ml-auto ${isRtl ? 'rotate-180' : ''}`}>
                    <ChevronRight size={14} className="text-indigo-400" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const Accordion = ({ title, icon: Icon, isOpen, onToggle, children, actions, isRtl, className = '' }) => {
  return (
    <div className={`bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm transition-all hover:shadow-md ${className}`}>
      <button 
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 bg-white hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`p-1.5 rounded-lg transition-colors ${isOpen ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
            {Icon && <Icon size={18} />}
          </div>
          <span className="font-bold text-slate-800 text-sm">{title}</span>
        </div>
        <div className="flex items-center gap-3">
            {actions && <div onClick={e => e.stopPropagation()}>{actions}</div>}
            <div className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
               <ChevronDown size={18} />
            </div>
        </div>
      </button>

      {isOpen && (
        <div className="p-4 pt-2 border-t border-slate-100 animate-in slide-in-from-top-2">
          {children}
        </div>
      )}
    </div>
  );
};

const Callout = ({ title, children, icon: Icon, action, variant = 'info', className = '' }) => {
  const variants = {
     info: 'bg-blue-50 border-blue-100 text-blue-900',
     warning: 'bg-amber-50 border-amber-100 text-amber-900',
     success: 'bg-emerald-50 border-emerald-100 text-emerald-900',
     danger: 'bg-red-50 border-red-100 text-red-900',
  };
  
  const iconColors = {
     info: 'text-blue-600',
     warning: 'text-amber-600',
     success: 'text-emerald-600',
     danger: 'text-red-600',
  };

  return (
    <div className={`${variants[variant]} border p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${className}`}>
       <div className="flex items-start gap-3">
          {Icon && (
             <div className={`p-1.5 bg-white rounded-lg shadow-sm ${iconColors[variant]}`}>
                <Icon size={18}/>
             </div>
          )}
          <div>
             {title && <h4 className="font-bold text-xs mb-0.5">{title}</h4>}
             <div className="text-[11px] opacity-80 leading-relaxed">{children}</div>
          </div>
       </div>
       {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};

window.UI = { Button, InputField, SelectField, Toggle, Badge, DataGrid, FilterSection, TreeMenu, TreeView, SelectionGrid, ToggleChip, Modal, DatePicker, LOV, SideMenu, Accordion, Callout, THEME };

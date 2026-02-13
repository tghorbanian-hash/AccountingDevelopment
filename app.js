/* Filename: app.js */
import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  BarChart3, Languages, Bell, Search, 
  ChevronRight, LogOut, LayoutGrid, ChevronRightSquare,
  Menu, Circle, Loader2
} from 'lucide-react';

const App = () => {
  const MENU_DATA = window.MENU_DATA || [];
  const translations = window.translations || { en: {}, fa: {} };
  const UI = window.UI || {};
  const { TreeMenu } = UI;
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [lang, setLang] = useState('fa'); 
  const [activeModuleId, setActiveModuleId] = useState('');
  const [activeId, setActiveId] = useState(''); 
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const [authView, setAuthView] = useState('login'); 
  const [loginMethod, setLoginMethod] = useState('standard');
  const [loginData, setLoginData] = useState({ identifier: '', password: '' });
  const [error, setError] = useState('');

  const t = translations[lang] || {};
  const isRtl = lang === 'fa';

  useEffect(() => {
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang, isRtl]);

  // ============================================================================
  // GLOBAL PERMISSION CHECKER FUNCTION
  // ============================================================================
  window.hasAccess = (formCode, action) => {
    const user = window.currentUser;
    if (!user) return false;
    
    // 1. Admin Override Rule
    if (user.user_type === 'admin' || user.user_type === 'مدیر سیستم') return true;
    
    // 2. Standard User Check
    const perms = window.userPermissions || {};
    const resourcePerms = perms[formCode];
    
    if (!resourcePerms) return false;
    
    // If checking 'view', they can view if they have ANY action permission explicitly given for this form
    if (action === 'view') {
       return resourcePerms.actions.includes('view') || resourcePerms.actions.length > 0;
    }
    
    return resourcePerms.actions.includes(action);
  };

  // --- Auth Handlers ---
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!window.supabase) return setError('دیتابیس مقداردهی نشده است.');

    setIsLoggingIn(true);
    setError('');

    try {
      // 1. Verify User Credentials via RPC
      const { data: user, error: loginErr } = await window.supabase.rpc('verify_user', {
        p_username: loginData.identifier,
        p_password: loginData.password
      }, { schema: 'gen' });

      if (loginErr || !user) {
        setError(t.invalidCreds || (isRtl ? 'نام کاربری یا رمز عبور اشتباه است، یا حساب غیرفعال می‌باشد.' : 'Invalid credentials.'));
        setIsLoggingIn(false);
        return;
      }

      window.currentUser = user;

      // 2. Fetch Permissions for non-admins
      if (user.user_type !== 'admin' && user.user_type !== 'مدیر سیستم') {
        // Get user roles
        const { data: rolesData } = await window.supabase.schema('gen').from('user_roles').select('role_id').eq('user_id', user.id);
        const roleIds = rolesData ? rolesData.map(r => r.role_id) : [];

        // Fetch permissions (both direct and role-based)
        let query = window.supabase.schema('gen').from('permissions').select('*');
        if (roleIds.length > 0) {
          query = query.or(`user_id.eq.${user.id},role_id.in.(${roleIds.join(',')})`);
        } else {
          query = query.eq('user_id', user.id);
        }

        const { data: permsData } = await query;
        const mergedPerms = {};
        
        if (permsData) {
          permsData.forEach(p => {
            if (!mergedPerms[p.resource_code]) {
              mergedPerms[p.resource_code] = { actions: [], scopes: {} };
            }
            const existing = mergedPerms[p.resource_code];
            existing.actions = [...new Set([...existing.actions, ...(p.actions || [])])];
            // Merge scopes if needed...
            Object.keys(p.data_scopes || {}).forEach(key => {
               if (!existing.scopes[key]) existing.scopes[key] = [];
               existing.scopes[key] = [...new Set([...existing.scopes[key], ...p.data_scopes[key]])];
            });
          });
        }
        window.userPermissions = mergedPerms;
      } else {
        window.userPermissions = 'ALL';
      }

      setIsLoggedIn(true);
    } catch (err) {
      console.error(err);
      setError(isRtl ? 'خطای ارتباط با سرور' : 'Server error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // --- Dynamic Menu Filtering ---
  const filterMenuTree = (nodes) => {
    if (window.currentUser?.user_type === 'admin' || window.currentUser?.user_type === 'مدیر سیستم') return nodes;
    
    return nodes.reduce((acc, node) => {
      if (node.type === 'form') {
         if (window.hasAccess(node.id, 'view')) {
             acc.push({ ...node });
         }
      } else if (node.children) {
         const filteredChildren = filterMenuTree(node.children);
         if (filteredChildren.length > 0) {
             acc.push({ ...node, children: filteredChildren });
         }
      }
      return acc;
    }, []);
  };

  const dynamicMenuData = useMemo(() => {
    if (!isLoggedIn) return [];
    return filterMenuTree(MENU_DATA);
  }, [isLoggedIn, MENU_DATA]);

  // Set default modules after login
  useEffect(() => {
    if (isLoggedIn && dynamicMenuData.length > 0 && !activeModuleId) {
       setActiveModuleId(dynamicMenuData[0].id);
       // Select first form of first module
       let firstForm = null;
       const findFirstForm = (nodes) => {
         for (let n of nodes) {
            if (n.type === 'form') { firstForm = n.id; break; }
            if (n.children) findFirstForm(n.children);
            if (firstForm) break;
         }
       };
       findFirstForm(dynamicMenuData[0].children || []);
       setActiveId(firstForm || 'workspace_gen');
    }
  }, [isLoggedIn, dynamicMenuData]);

  const currentModule = useMemo(() => {
    return dynamicMenuData.find(m => m.id === activeModuleId) || dynamicMenuData[0] || {};
  }, [activeModuleId, dynamicMenuData]);

  // --- Render Components ---
  const renderContent = () => {
    const { 
      KpiDashboard, UserManagement, GeneralWorkspace, ComponentShowcase, 
      Roles, Parties, UserProfile, OrganizationInfo, CurrencySettings, 
      CostCenters, Projects, Branches, OrgChart, Ledgers, Details, 
      FiscalPeriods, DocTypes, AutoNumbering, ChartofAccounts 
    } = window;

    // Security Check: Even if they manually change the activeId state, prevent rendering if no access
    if (activeId !== 'user_profile' && !window.hasAccess(activeId, 'view')) {
      return (
         <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
            <div className="p-8 bg-red-50 rounded-full border border-red-100">
               <Shield size={64} className="text-red-400" />
            </div>
            <div>
               <h2 className="text-xl font-bold text-slate-800">{isRtl ? 'دسترسی غیرمجاز' : 'Access Denied'}</h2>
               <p className="text-slate-500 mt-2 text-sm font-medium">{isRtl ? 'شما مجوز مشاهده این فرم را ندارید.' : 'You do not have permission to view this form.'}</p>
            </div>
         </div>
      );
    }

    if (activeId === 'user_profile') return UserProfile ? <UserProfile t={t} isRtl={isRtl} onLanguageChange={setLang} /> : null;
    if (activeId === 'org_info') return OrganizationInfo ? <OrganizationInfo t={t} isRtl={isRtl} /> : null;
    if (activeId === 'currency_settings') return CurrencySettings ? <CurrencySettings t={t} isRtl={isRtl} /> : null;
    if (activeId === 'parties') return Parties ? <Parties t={t} isRtl={isRtl} /> : null;
    if (activeId === 'cost_centers') return CostCenters ? <CostCenters t={t} isRtl={isRtl} /> : null;
    if (activeId === 'projects') return Projects ? <Projects t={t} isRtl={isRtl} /> : null;
    if (activeId === 'branches') return Branches ? <Branches t={t} isRtl={isRtl} /> : null;
    if (activeId === 'org_chart') return OrgChart ? <OrgChart t={t} isRtl={isRtl} /> : null;
    if (activeId === 'ledgers') return Ledgers ? <Ledgers t={t} isRtl={isRtl} /> : null;
    if (activeId === 'details') return Details ? <Details t={t} isRtl={isRtl} /> : null;
    if (activeId === 'acc_structure') return ChartofAccounts ? <ChartofAccounts t={t} isRtl={isRtl} /> : null;
    if (activeId === 'fiscal_periods') return FiscalPeriods ? <FiscalPeriods t={t} isRtl={isRtl} /> : null;
    if (activeId === 'doc_types') return DocTypes ? <DocTypes t={t} isRtl={isRtl} /> : null;
    if (activeId === 'auto_num') return AutoNumbering ? <AutoNumbering t={t} isRtl={isRtl} /> : null;
    if (activeId === 'users_list') return UserManagement ? <UserManagement t={t} isRtl={isRtl} /> : null;
    if (activeId === 'roles') return Roles ? <Roles t={t} isRtl={isRtl} /> : null;
    if (activeId === 'workspace_gen') return GeneralWorkspace ? <GeneralWorkspace t={t} isRtl={isRtl} /> : null;
    if (activeId === 'dashboards_gen') return KpiDashboard ? <KpiDashboard t={t} isRtl={isRtl} /> : null;
    if (activeId === 'ui_showcase') return ComponentShowcase ? <ComponentShowcase t={t} isRtl={isRtl} /> : null;

    return (
      <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-60">
          <div className="p-8 bg-white rounded-[2rem] shadow-sm border border-slate-200">
            <LayoutGrid size={64} className="text-slate-300" strokeWidth={1} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">{activeId}</h2>
            <p className="text-slate-500 mt-2 text-sm font-medium">{t.emptyPage || 'This page is empty.'}</p>
          </div>
      </div>
    );
  };

  const { LoginPage } = window;
  if (!isLoggedIn) {
    if (!LoginPage) return <div className="p-10 text-center">Loading Login Page...</div>;
    return (
      <div className="relative">
         {isLoggingIn && (
            <div className="absolute inset-0 bg-white/80 z-[100] backdrop-blur-sm flex flex-col items-center justify-center">
               <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
               <div className="font-bold text-slate-700">{isRtl ? 'در حال ورود و دریافت دسترسی‌ها...' : 'Loading permissions...'}</div>
            </div>
         )}
         <LoginPage 
           t={t} isRtl={isRtl} authView={authView} setAuthView={setAuthView} 
           loginMethod={loginMethod} setLoginMethod={setLoginMethod} 
           loginData={loginData} setLoginData={setLoginData} 
           error={error} handleLogin={handleLogin} 
           toggleLanguage={() => setLang(l => l === 'en' ? 'fa' : 'en')} 
         />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* SIDEBAR - Module Rail */}
      <aside className={`bg-white w-[72px] flex flex-col items-center py-4 shrink-0 z-40 border-${isRtl ? 'l' : 'r'} border-slate-200 shadow-sm relative overflow-x-hidden`}>
        <div className="bg-indigo-700 w-10 h-10 rounded-xl text-white mb-6 shadow-lg shadow-indigo-500/30 flex items-center justify-center shrink-0">
          <BarChart3 size={20} strokeWidth={2.5} />
        </div>
        
        <div className="flex-1 flex flex-col gap-3 items-center w-full px-2 overflow-y-auto no-scrollbar">
          {dynamicMenuData.map(mod => {
             const isActive = activeModuleId === mod.id;
             return (
              <button 
                key={mod.id} onClick={() => setActiveModuleId(mod.id)}
                className={`relative w-10 h-10 rounded-xl transition-all flex items-center justify-center shrink-0 group
                  ${isActive ? 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}
                `}
              >
                {mod.icon ? <mod.icon size={20} strokeWidth={isActive ? 2 : 1.5} /> : <Circle size={10}/>}
                {isActive && <span className={`absolute w-1.5 h-1.5 bg-indigo-600 rounded-full top-1.5 ${isRtl ? 'right-1' : 'left-1'}`}></span>}
                <div className={`absolute ${isRtl ? 'right-full mr-4' : 'left-full ml-4'} top-1/2 -translate-y-1/2 bg-slate-900 text-white text-[11px] py-1.5 px-3 rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl font-medium`}>
                  {mod.label ? mod.label[lang] : mod.id}
                  <div className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? 'right-[-4px]' : 'left-[-4px]'} w-2 h-2 bg-slate-900 rotate-45`}></div>
                </div>
              </button>
            );
          })}
        </div>
        
        <div className="mt-auto flex flex-col gap-3 items-center pb-2 shrink-0">
            <button onClick={() => setLang(l => l === 'en' ? 'fa' : 'en')} className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-colors">
                 <Languages size={20} />
            </button>
            <div className="w-8 h-px bg-slate-200"></div>
            <button onClick={() => { setIsLoggedIn(false); window.currentUser = null; window.userPermissions = null; }} className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors">
              <LogOut size={20} />
            </button>
        </div>
      </aside>

      {/* SIDEBAR - Sub Menu */}
      <aside className={`bg-white border-${isRtl ? 'l' : 'r'} border-slate-200 flex flex-col transition-all duration-300 ease-in-out overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,0.01)] ${sidebarCollapsed ? 'w-0 opacity-0' : 'w-72 opacity-100'}`}>
        <div className="h-16 flex items-center px-6 border-b border-slate-100 shrink-0 bg-slate-50/30">
           <h2 className="text-sm font-black text-slate-800 truncate leading-tight">
             {currentModule.label ? currentModule.label[lang] : ''}
           </h2>
        </div>
        
        <div className="flex-1 overflow-hidden">
          {TreeMenu ? <TreeMenu items={currentModule.children || []} activeId={activeId} onSelect={setActiveId} isRtl={isRtl} /> : null}
        </div>
        
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 shrink-0">
          <div onClick={() => setActiveId('user_profile')} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white hover:shadow-sm transition-all cursor-pointer border border-transparent hover:border-slate-100">
             <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-100 to-blue-50 border border-white shadow-sm flex items-center justify-center text-indigo-700 font-black text-xs">
               {window.currentUser?.username?.substring(0,2).toUpperCase()}
             </div>
             <div className="min-w-0">
                <div className="text-[12px] font-bold text-slate-700 truncate">{window.currentUser?.full_name}</div>
                <div className="text-[10px] text-slate-400 truncate">{window.currentUser?.user_type}</div>
             </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50/50 relative">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-20">
           <div className="flex items-center gap-4">
             <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-2 -ml-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-colors">
                {sidebarCollapsed ? <Menu size={20} /> : <ChevronRightSquare size={20} className={isRtl ? '' : 'rotate-180'} />}
             </button>
             
             <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-400 font-medium hidden sm:inline">{currentModule.label ? currentModule.label[lang] : ''}</span>
                <ChevronRight size={14} className={`text-slate-300 hidden sm:inline ${isRtl ? 'rotate-180' : ''}`} />
                <span className="text-slate-800 font-bold">{activeId === 'user_profile' ? (t.profileTitle || 'User Profile') : activeId}</span>
             </div>
           </div>
           <div className="flex items-center gap-3">
              <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors relative">
                 <Bell size={18} />
                 <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
           </div>
        </header>

        <div className="flex-1 overflow-hidden relative p-0">
           {renderContent()}
        </div>
      </main>
    </div>
  );
};

const root = createRoot(document.getElementById('root'));
root.render(<App />);
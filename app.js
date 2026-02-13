/* Filename: app.js */
import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  BarChart3, Languages, Bell, Search, 
  ChevronRight, LogOut, LayoutGrid, ChevronRightSquare,
  Menu, Circle, Loader2, Shield
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
  // GLOBAL PERMISSION CHECKER
  // ============================================================================
  window.hasAccess = (formCode, action = 'view') => {
    const user = window.currentUser;
    if (!user) return false;
    
    // Admin Override
    if (user.user_type === 'admin' || user.user_type === 'مدیر سیستم') return true;
    
    const perms = window.userPermissions || {};
    const resourcePerms = perms[formCode];
    
    if (!resourcePerms) return false;
    
    if (action === 'view') {
       // کاربر اگر حتی یک عملیات در فرم داشته باشد، یعنی اجازه مشاهده اصل فرم را دارد
       return (resourcePerms.actions && resourcePerms.actions.length > 0);
    }
    
    return resourcePerms.actions ? resourcePerms.actions.includes(action) : false;
  };

  // --- Auth Handlers ---
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!window.supabase) return setError('دیتابیس مقداردهی نشده است.');

    setIsLoggingIn(true);
    setError('');

    try {
      const { data: user, error: loginErr } = await window.supabase.schema('gen').rpc('verify_user', {
        p_username: loginData.identifier,
        p_password: loginData.password
      });

      if (loginErr || !user) {
        setError(t.invalidCreds || (isRtl ? 'نام کاربری یا رمز عبور اشتباه است.' : 'Invalid credentials.'));
        setIsLoggingIn(false);
        return;
      }

      // ۱. ذخیره اطلاعات کاربر
      window.currentUser = user;

      // ۲. دریافت و پردازش دسترسی‌ها (قبل از ست کردن isLoggedIn)
      if (user.user_type !== 'admin' && user.user_type !== 'مدیر سیستم') {
        const { data: rolesData } = await window.supabase.schema('gen').from('user_roles').select('role_id').eq('user_id', user.id);
        const roleIds = rolesData ? rolesData.map(r => r.role_id) : [];

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
            if (p.actions) {
               existing.actions = [...new Set([...existing.actions, ...p.actions])];
            }
            if (p.data_scopes) {
               Object.keys(p.data_scopes).forEach(key => {
                  if (!existing.scopes[key]) existing.scopes[key] = [];
                  existing.scopes[key] = [...new Set([...existing.scopes[key], ...p.data_scopes[key]])];
               });
            }
          });
        }
        window.userPermissions = mergedPerms;
      } else {
        window.userPermissions = 'ALL';
      }

      // ۳. حالا که دسترسی‌ها آماده است، وارد شو
      setIsLoggedIn(true);
    } catch (err) {
      console.error(err);
      setError(isRtl ? 'خطای ارتباط با سرور' : 'Server error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // --- Dynamic Menu Filtering Logic ---
  const filterMenuTree = (nodes) => {
    if (window.userPermissions === 'ALL') return nodes;
    
    return nodes.reduce((acc, node) => {
      if (node.type === 'form') {
         // چک کن کاربر به این فرم دسترسی دارد یا خیر
         if (window.hasAccess(node.id, 'view')) {
             acc.push({ ...node });
         }
      } else {
         // برای ماژول‌ها و منوها، اگر فرزندی داشتند که کاربر به آن دسترسی داشت، نمایش بده
         const filteredChildren = node.children ? filterMenuTree(node.children) : [];
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

  // یافتن اولین فرم قابل دسترس برای لود اولیه
  useEffect(() => {
    if (isLoggedIn && dynamicMenuData.length > 0) {
       let firstAvailableFormId = '';
       let firstAvailableModuleId = '';

       const findFirst = (nodes, modId) => {
          for (const node of nodes) {
             if (node.type === 'form') {
                firstAvailableFormId = node.id;
                firstAvailableModuleId = modId;
                return true;
             }
             if (node.children && findFirst(node.children, modId)) return true;
          }
          return false;
       };

       for (const mod of dynamicMenuData) {
          if (findFirst(mod.children || [], mod.id)) break;
       }

       if (firstAvailableFormId) {
          setActiveModuleId(firstAvailableModuleId);
          setActiveId(firstAvailableFormId);
       }
    }
  }, [isLoggedIn, dynamicMenuData]);

  const currentModule = useMemo(() => {
    return dynamicMenuData.find(m => m.id === activeModuleId) || dynamicMenuData[0] || {};
  }, [activeModuleId, dynamicMenuData]);

  // --- Render Contents ---
  const renderContent = () => {
    const { 
      KpiDashboard, UserManagement, GeneralWorkspace, ComponentShowcase, 
      Roles, Parties, UserProfile, OrganizationInfo, CurrencySettings, 
      CostCenters, Projects, Branches, OrgChart, Ledgers, Details, 
      FiscalPeriods, DocTypes, AutoNumbering, ChartofAccounts 
    } = window;

    // Security Guard
    if (activeId && activeId !== 'user_profile' && !window.hasAccess(activeId, 'view')) {
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
            <h2 className="text-xl font-bold text-slate-800">{activeId || (isRtl ? 'انتخاب فرم' : 'Select Form')}</h2>
            <p className="text-slate-500 mt-2 text-sm font-medium">{t.emptyPage || (isRtl ? 'لطفا یک فرم را از منوی سمت راست انتخاب کنید.' : 'Please select a form from the sidebar.')}</p>
          </div>
      </div>
    );
  };

  const { LoginPage } = window;
  if (!isLoggedIn) {
    return (
      <div className="relative">
         {isLoggingIn && (
            <div className="absolute inset-0 bg-white/80 z-[100] backdrop-blur-sm flex flex-col items-center justify-center">
               <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
               <div className="font-bold text-slate-700">{isRtl ? 'در حال ورود و دریافت دسترسی‌ها...' : 'Loading permissions...'}</div>
            </div>
         )}
         {LoginPage && (
           <LoginPage 
             t={t} isRtl={isRtl} authView={authView} setAuthView={setAuthView} 
             loginMethod={loginMethod} setLoginMethod={setLoginMethod} 
             loginData={loginData} setLoginData={setLoginData} 
             error={error} handleLogin={handleLogin} 
             toggleLanguage={() => setLang(l => l === 'en' ? 'fa' : 'en')} 
           />
         )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Module Rail (Icons) */}
      <aside className={`bg-white w-[72px] flex flex-col items-center py-4 shrink-0 z-40 border-${isRtl ? 'l' : 'r'} border-slate-200 shadow-sm relative`}>
        <div className="bg-indigo-700 w-10 h-10 rounded-xl text-white mb-6 shadow-lg shadow-indigo-500/30 flex items-center justify-center">
          <BarChart3 size={20} strokeWidth={2.5} />
        </div>
        <div className="flex-1 flex flex-col gap-3 items-center w-full px-2 overflow-y-auto no-scrollbar">
          {dynamicMenuData.map(mod => (
            <button 
              key={mod.id} onClick={() => setActiveModuleId(mod.id)}
              className={`relative w-10 h-10 rounded-xl transition-all flex items-center justify-center group ${activeModuleId === mod.id ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200' : 'text-slate-400 hover:bg-slate-100'}`}
            >
              {mod.icon ? <mod.icon size={20} /> : <Circle size={10}/>}
              <div className={`absolute ${isRtl ? 'right-full mr-4' : 'left-full ml-4'} top-1/2 -translate-y-1/2 bg-slate-900 text-white text-[11px] py-1.5 px-3 rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl`}>
                {mod.label ? mod.label[lang] : mod.id}
              </div>
            </button>
          ))}
        </div>
        <div className="mt-auto flex flex-col gap-3 items-center pb-2">
            <button onClick={() => setLang(l => l === 'en' ? 'fa' : 'en')} className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 transition-colors"><Languages size={20} /></button>
            <button onClick={() => { setIsLoggedIn(false); window.currentUser = null; }} className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"><LogOut size={20} /></button>
        </div>
      </aside>

      {/* Sub Menu (Tree) */}
      <aside className={`bg-white border-${isRtl ? 'l' : 'r'} border-slate-200 flex flex-col transition-all duration-300 overflow-hidden shadow-sm ${sidebarCollapsed ? 'w-0' : 'w-72'}`}>
        <div className="h-16 flex items-center px-6 border-b border-slate-100 bg-slate-50/30">
           <h2 className="text-sm font-black text-slate-800 truncate">{currentModule.label ? currentModule.label[lang] : ''}</h2>
        </div>
        <div className="flex-1 overflow-hidden">
          {TreeMenu && <TreeMenu items={currentModule.children || []} activeId={activeId} onSelect={setActiveId} isRtl={isRtl} />}
        </div>
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <div onClick={() => setActiveId('user_profile')} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white transition-all cursor-pointer border border-transparent hover:border-slate-100">
             <div className="w-9 h-9 rounded-full bg-indigo-100 border border-white shadow-sm flex items-center justify-center text-indigo-700 font-black text-xs">
               {window.currentUser?.username?.substring(0,2).toUpperCase()}
             </div>
             <div className="min-w-0">
                <div className="text-[12px] font-bold text-slate-700 truncate">{window.currentUser?.full_name}</div>
                <div className="text-[10px] text-slate-400 truncate">{window.currentUser?.user_type}</div>
             </div>
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50/50">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-20">
           <div className="flex items-center gap-4">
             <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-2 -ml-2 rounded-lg text-slate-400 hover:bg-slate-100"><Menu size={20} /></button>
             <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-400 font-medium hidden sm:inline">{currentModule.label ? currentModule.label[lang] : ''}</span>
                <ChevronRight size={14} className={`text-slate-300 ${isRtl ? 'rotate-180' : ''}`} />
                <span className="text-slate-800 font-bold">{activeId === 'user_profile' ? (t.profileTitle || 'User Profile') : activeId}</span>
             </div>
           </div>
           <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 relative"><Bell size={18} /><span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span></button>
        </header>
        <div className="flex-1 overflow-hidden">{renderContent()}</div>
      </main>
    </div>
  );
};

const root = createRoot(document.getElementById('root'));
root.render(<App />);
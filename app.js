/* Filename: app.js */
import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import * as Lucide from 'lucide-react';

const App = () => {
  const translations = window.translations || { en: {}, fa: {} };
  const UI = window.UI || {};
  const { TreeMenu } = UI;
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [lang, setLang] = useState('fa'); 
  const [activeModuleId, setActiveModuleId] = useState('');
  const [activeId, setActiveId] = useState(''); 
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const [currentUser, setCurrentUser] = useState(null);
  const [permissionsMap, setPermissionsMap] = useState(null);
  const [dynamicMenuData, setDynamicMenuData] = useState([]); // دیتای منو از دیتابیس
  
  const [loginData, setLoginData] = useState({ identifier: '', password: '' });
  const [error, setError] = useState('');

  const t = translations[lang] || {};
  const isRtl = lang === 'fa';

  useEffect(() => {
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang, isRtl]);

  // تابع کمکی برای تبدیل نام رشته‌ای آیکون به کامپوننت Lucide
  const getIcon = (name) => Lucide[name] || Lucide.Circle;

  // --- Permission Checker ---
  const checkAccess = (formCode, action = 'view') => {
    if (!currentUser) return false;
    if (currentUser.user_type === 'admin' || currentUser.user_type === 'مدیر سیستم') return true;
    if (!permissionsMap || !permissionsMap[formCode]) return false;
    
    const resourcePerms = permissionsMap[formCode];
    if (action === 'view') return (resourcePerms.actions && resourcePerms.actions.length > 0);
    return resourcePerms.actions ? resourcePerms.actions.includes(action) : false;
  };
  window.hasAccess = checkAccess;

  // --- Login & Menu Loader ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError('');

    try {
      const { data: user, error: loginErr } = await window.supabase.schema('gen').rpc('verify_user', {
        p_username: loginData.identifier,
        p_password: loginData.password
      });

      if (loginErr || !user) {
        setError(isRtl ? 'نام کاربری یا رمز عبور اشتباه است.' : 'Invalid credentials.');
        setIsLoggingIn(false);
        return;
      }

      // ۱. دریافت دسترسی‌ها
      const { data: rolesData } = await window.supabase.schema('gen').from('user_roles').select('role_id').eq('user_id', user.id);
      const roleIds = rolesData ? rolesData.map(r => r.role_id) : [];

      let pQuery = window.supabase.schema('gen').from('permissions').select('*');
      if (roleIds.length > 0) pQuery = pQuery.or(`user_id.eq.${user.id},role_id.in.(${roleIds.join(',')})`);
      else pQuery = pQuery.eq('user_id', user.id);

      const { data: permsData } = await pQuery;
      const mergedPerms = {};
      if (permsData) {
        permsData.forEach(p => {
          if (!mergedPerms[p.resource_code]) mergedPerms[p.resource_code] = { actions: [], scopes: {} };
          if (p.actions) mergedPerms[p.resource_code].actions = [...new Set([...mergedPerms[p.resource_code].actions, ...p.actions])];
        });
      }

      // ۲. دریافت ساختار منو از جدول Resources
      const { data: resData } = await window.supabase.schema('gen').from('resources').select('*');
      
      // تابع تبدیل لیست تخت دیتابیس به درخت و فیلتر بر اساس دسترسی
      const buildMenu = (parentId = null) => {
        return resData
          .filter(r => r.parent_id === parentId)
          .map(r => {
            const node = {
              id: r.code,
              label: { fa: r.title_fa, en: r.title_en },
              type: r.type,
              icon: getIcon(r.icon_name),
              children: buildMenu(r.id)
            };
            return node;
          })
          .filter(node => {
            if (user.user_type === 'admin' || user.user_type === 'مدیر سیستم') return true;
            if (node.type === 'form') return mergedPerms[node.id];
            return node.children.length > 0; // پوشه‌ها فقط اگر فرزند مجاز دارند بمانند
          });
      };

      const finalMenu = buildMenu(null);
      
      setPermissionsMap(mergedPerms);
      setDynamicMenuData(finalMenu);
      setCurrentUser(user);
      window.currentUser = user;
      setIsLoggedIn(true);

    } catch (err) {
      console.error(err);
      setError(isRtl ? 'خطای سیستم' : 'System error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // تنظیم صفحه اول
  useEffect(() => {
    if (isLoggedIn && dynamicMenuData.length > 0 && !activeId) {
      const findFirst = (nodes) => {
        for (const n of nodes) {
          if (n.type === 'form') return n;
          const f = n.children && findFirst(n.children);
          if (f) return f;
        }
      };
      for (const mod of dynamicMenuData) {
        const firstForm = findFirst(mod.children || []);
        if (firstForm) {
          setActiveModuleId(mod.id);
          setActiveId(firstForm.id);
          break;
        }
      }
    }
  }, [isLoggedIn, dynamicMenuData]);

  const currentModule = useMemo(() => 
    dynamicMenuData.find(m => m.id === activeModuleId) || dynamicMenuData[0] || {}, 
    [activeModuleId, dynamicMenuData]
  );

  const renderContent = () => {
    const { 
      KpiDashboard, UserManagement, GeneralWorkspace, ComponentShowcase, 
      Roles, Parties, UserProfile, OrganizationInfo, CurrencySettings, 
      CostCenters, Projects, Branches, OrgChart, Ledgers, Details, 
      FiscalPeriods, DocTypes, AutoNumbering, ChartofAccounts 
    } = window;

    if (activeId && activeId !== 'user_profile' && !checkAccess(activeId, 'view')) {
      return (
         <div className="flex flex-col items-center justify-center h-full text-center">
            <Shield size={64} className="text-red-400 mb-4" />
            <h2 className="text-xl font-bold">{isRtl ? 'دسترسی غیرمجاز' : 'Access Denied'}</h2>
         </div>
      );
    }

    const components = {
      'user_profile': UserProfile, 'org_info': OrganizationInfo, 'currency_settings': CurrencySettings,
      'parties': Parties, 'cost_centers': CostCenters, 'projects': Projects,
      'branches': Branches, 'org_chart': OrgChart, 'ledgers': Ledgers,
      'details': Details, 'acc_structure': ChartofAccounts, 'fiscal_periods': FiscalPeriods,
      'doc_types': DocTypes, 'auto_num': AutoNumbering, 'users_list': UserManagement,
      'roles': Roles, 'workspace_gen': GeneralWorkspace, 'dashboards_gen': KpiDashboard,
      'ui_showcase': ComponentShowcase
    };

    const Comp = components[activeId];
    return Comp ? <Comp t={t} isRtl={isRtl} onLanguageChange={setLang} /> : null;
  };

  if (!isLoggedIn) {
    return (
      <div className="relative">
        {isLoggingIn && (
          <div className="absolute inset-0 bg-white/80 z-[100] flex flex-col items-center justify-center">
            <Lucide.Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
            <div className="font-bold">{isRtl ? 'در حال ورود...' : 'Logging in...'}</div>
          </div>
        )}
        {window.LoginPage && (
          <window.LoginPage 
            t={t} isRtl={isRtl} loginData={loginData} setLoginData={setLoginData} 
            error={error} handleLogin={handleLogin} 
            toggleLanguage={() => setLang(l => l === 'en' ? 'fa' : 'en')} 
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className={`bg-white w-[72px] flex flex-col items-center py-4 shrink-0 z-40 border-${isRtl ? 'l' : 'r'} border-slate-200 shadow-sm`}>
        <div className="bg-indigo-700 w-10 h-10 rounded-xl text-white mb-6 flex items-center justify-center"><Lucide.BarChart3 size={20} /></div>
        <div className="flex-1 flex flex-col gap-3 items-center w-full px-2">
          {dynamicMenuData.map(mod => (
            <button key={mod.id} onClick={() => setActiveModuleId(mod.id)} className={`relative w-10 h-10 rounded-xl transition-all flex items-center justify-center group ${activeModuleId === mod.id ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200' : 'text-slate-400 hover:bg-slate-50'}`}>
              {mod.icon && <mod.icon size={20} />}
              <div className={`absolute ${isRtl ? 'right-full mr-4' : 'left-full ml-4'} top-1/2 -translate-y-1/2 bg-slate-900 text-white text-[10px] py-1 px-2 rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50`}>{mod.label[lang]}</div>
            </button>
          ))}
        </div>
        <div className="mt-auto flex flex-col gap-3 pb-2">
            <button onClick={() => setLang(isRtl ? 'en' : 'fa')} className="w-10 h-10 flex items-center justify-center text-slate-400"><Lucide.Languages size={20}/></button>
            <button onClick={() => window.location.reload()} className="w-10 h-10 flex items-center justify-center text-slate-400"><Lucide.LogOut size={20}/></button>
        </div>
      </aside>

      <aside className={`bg-white border-${isRtl ? 'l' : 'r'} border-slate-200 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'w-0 overflow-hidden' : 'w-72'}`}>
        <div className="h-16 flex items-center px-6 border-b border-slate-100 bg-slate-50/30">
           <h2 className="text-sm font-black text-slate-800 truncate">{currentModule.label ? currentModule.label[lang] : ''}</h2>
        </div>
        <div className="flex-1 overflow-hidden">
          {TreeMenu && <TreeMenu items={currentModule.children || []} activeId={activeId} onSelect={setActiveId} isRtl={isRtl} />}
        </div>
        <div className="p-4 border-t border-slate-100 flex items-center gap-3">
           <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">{currentUser?.username?.charAt(0).toUpperCase()}</div>
           <div className="min-w-0 flex-1">
              <div className="text-xs font-bold truncate">{currentUser?.full_name}</div>
              <div className="text-[10px] text-slate-400 truncate">{currentUser?.user_type}</div>
           </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-20">
           <div className="flex items-center gap-4">
             <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg"><Lucide.Menu size={20} /></button>
             <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-400">{currentModule.label ? currentModule.label[lang] : ''}</span>
                <Lucide.ChevronRight size={14} className={isRtl ? 'rotate-180' : ''} />
                <span className="text-slate-800 font-bold">{activeId}</span>
             </div>
           </div>
        </header>
        <div className="flex-1 overflow-hidden bg-slate-50/30">{renderContent()}</div>
      </main>
    </div>
  );
};

const root = createRoot(document.getElementById('root'));
root.render(<App />);
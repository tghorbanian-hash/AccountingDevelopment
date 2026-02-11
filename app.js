/* Filename: app.js */
import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  BarChart3, Languages, Bell, Search, 
  ChevronRight, LogOut, LayoutGrid, ChevronRightSquare,
  Menu, Circle
} from 'lucide-react';

const App = () => {
  const MENU_DATA = window.MENU_DATA || [];
  const translations = window.translations || { en: {}, fa: {} };
  const UI = window.UI || {};
  const { TreeMenu } = UI;
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [lang, setLang] = useState('fa'); 
  const [activeModuleId, setActiveModuleId] = useState('accounting');
  const [activeId, setActiveId] = useState('gl_docs');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Authentication States
  const [authView, setAuthView] = useState('login'); // login, forgot, otp, reset
  const [loginMethod, setLoginMethod] = useState('standard');
  const [loginData, setLoginData] = useState({ identifier: '', password: '' });
  const [recoveryData, setRecoveryData] = useState({ otp: '', newPass: '', confirmPass: '' });
  const [error, setError] = useState('');

  const t = translations[lang] || {};
  const isRtl = lang === 'fa';

  useEffect(() => {
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang, isRtl]);

  // --- Auth Handlers ---

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginData.identifier === 'admin' && loginData.password === 'admin') {
      setIsLoggedIn(true);
      setError('');
    } else {
      setError(t.invalidCreds || 'Invalid credentials');
    }
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    // MOCK LOGIC: Accept '123456' as the valid code
    if (recoveryData.otp === '123456') {
      setError('');
      setAuthView('reset'); // Go to Change Password Page
    } else {
      setError(t.invalidOtp || 'Invalid OTP code');
    }
  };

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    // MOCK LOGIC: Validate passwords match
    if (!recoveryData.newPass || recoveryData.newPass !== recoveryData.confirmPass) {
       setError(isRtl ? 'رمز عبور و تکرار آن مطابقت ندارند' : 'Passwords do not match');
       return;
    }
    
    // Success scenario
    alert(t.resetSuccess || 'Password updated successfully');
    setAuthView('login');
    setError('');
    setRecoveryData({ otp: '', newPass: '', confirmPass: '' });
  };

  // --- App Logic ---

  const currentModule = useMemo(() => {
    return MENU_DATA.find(m => m.id === activeModuleId) || MENU_DATA[0] || {};
  }, [activeModuleId, MENU_DATA]);
  
  const renderContent = () => {
    // دریافت کامپوننت‌ها از window
    const { 
      KpiDashboard, 
      UserManagement, 
      GeneralWorkspace, 
      ComponentShowcase, 
      LoginPage, 
      Roles,
      Parties,
      UserProfile,
      OrganizationInfo,
      CurrencySettings,
      CostCenters,
      Projects,
      Branches,
      OrgChart,
      Ledgers,
      Details,
      FiscalPeriods
    } = window;

    // --- مسیردهی صفحات (Routing) ---
    
    // 1. پروفایل کاربری
    if (activeId === 'user_profile') return UserProfile ? <UserProfile t={t} isRtl={isRtl} onLanguageChange={setLang} /> : <div className="p-4 text-red-500">Error: UserProfile Component Not Loaded</div>;

    // 2. اطلاعات پایه (Base Info)
    if (activeId === 'org_info') return OrganizationInfo ? <OrganizationInfo t={t} isRtl={isRtl} /> : <div className="p-4 text-red-500">Error: OrganizationInfo Component Not Loaded</div>;
    if (activeId === 'currency_settings') return CurrencySettings ? <CurrencySettings t={t} isRtl={isRtl} /> : <div className="p-4 text-red-500">Error: CurrencySettings Component Not Loaded</div>;
    if (activeId === 'parties') return Parties ? <Parties t={t} isRtl={isRtl} /> : <div className="p-4 text-red-500">Error: Parties Component Not Loaded</div>;
    if (activeId === 'cost_centers') return CostCenters ? <CostCenters t={t} isRtl={isRtl} /> : <div className="p-4 text-red-500">Error: CostCenters Component Not Loaded</div>;
    if (activeId === 'projects') return Projects ? <Projects t={t} isRtl={isRtl} /> : <div className="p-4 text-red-500">Error: Projects Component Not Loaded</div>;
    if (activeId === 'branches') return Branches ? <Branches t={t} isRtl={isRtl} /> : <div className="p-4 text-red-500">Error: Branches Component Not Loaded</div>;
    if (activeId === 'org_chart') return OrgChart ? <OrgChart t={t} isRtl={isRtl} /> : <div className="p-4 text-red-500">Error: OrgChart Component Not Loaded</div>;

    // 2.1 اطلاعات پایه مالی (Financial Base Info)
    if (activeId === 'ledgers') return Ledgers ? <Ledgers t={t} isRtl={isRtl} /> : <div className="p-4 text-red-500">Error: Ledgers Component Not Loaded</div>;
    if (activeId === 'details') return Details ? <Details t={t} isRtl={isRtl} /> : <div className="p-4 text-red-500">Error: Details Component Not Loaded</div>;
    if (activeId === 'fiscalperiods') return FiscalPeriods ? <FiscalPeriods t={t} isRtl={isRtl} /> : <div className="p-4 text-red-500">Error: FiscalPeriods Component Not Loaded</div>;


    // 3. امنیت و دسترسی (Security)
    if (activeId === 'users_list') return UserManagement ? <UserManagement t={t} isRtl={isRtl} /> : <div className="p-4 text-red-500">Error: UserManagement Not Loaded</div>;
    if (activeId === 'roles') return Roles ? <Roles t={t} isRtl={isRtl} /> : <div className="p-4 text-red-500">Error: Roles Component Not Loaded</div>;

    // 4. فضای کار و داشبوردها (Workspace)
    if (activeId === 'workspace_gen') return GeneralWorkspace ? <GeneralWorkspace t={t} isRtl={isRtl} /> : <div>Loading...</div>;
    if (activeId === 'dashboards_gen') return KpiDashboard ? <KpiDashboard t={t} isRtl={isRtl} /> : <div>Loading...</div>;
    if (activeId === 'ui_showcase') return ComponentShowcase ? <ComponentShowcase t={t} isRtl={isRtl} /> : <div>Loading...</div>;

    // 5. صفحه خالی (پیش‌فرض)
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
    if (!LoginPage) return <div className="p-10 text-center">Loading...</div>;
    return (
      <LoginPage 
        t={t} 
        isRtl={isRtl} 
        authView={authView} 
        setAuthView={setAuthView} 
        loginMethod={loginMethod} 
        setLoginMethod={setLoginMethod} 
        loginData={loginData} 
        setLoginData={setLoginData} 
        recoveryData={recoveryData} 
        setRecoveryData={setRecoveryData} 
        error={error} 
        handleLogin={handleLogin} 
        toggleLanguage={() => setLang(l => l === 'en' ? 'fa' : 'en')} 
        
        // --- Added Handlers ---
        handleVerifyOtp={handleVerifyOtp} 
        handleUpdatePassword={handleUpdatePassword} 
      />
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
          {MENU_DATA.map(mod => {
             const isActive = activeModuleId === mod.id;
             return (
              <button 
                key={mod.id} onClick={() => setActiveModuleId(mod.id)}
                className={`
                  relative w-10 h-10 rounded-xl transition-all flex items-center justify-center shrink-0 group
                  ${isActive 
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200' 
                    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}
                `}
              >
                {mod.icon ? <mod.icon size={20} strokeWidth={isActive ? 2 : 1.5} /> : <Circle size={10}/>}
                
                {isActive && (
                  <span className={`absolute w-1.5 h-1.5 bg-indigo-600 rounded-full top-1.5 ${isRtl ? 'right-1' : 'left-1'}`}></span>
                )}

                <div className={`
                  absolute ${isRtl ? 'right-full mr-4' : 'left-full ml-4'} top-1/2 -translate-y-1/2 
                  bg-slate-900 text-white text-[11px] py-1.5 px-3 rounded-md opacity-0 invisible 
                  group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl font-medium
                `}>
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
            <button onClick={() => setIsLoggedIn(false)} className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors">
              <LogOut size={20} />
            </button>
        </div>
      </aside>

      {/* SIDEBAR - Sub Menu */}
      <aside className={`
        bg-white border-${isRtl ? 'l' : 'r'} border-slate-200 
        flex flex-col transition-all duration-300 ease-in-out overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,0.01)]
        ${sidebarCollapsed ? 'w-0 opacity-0' : 'w-72 opacity-100'}
      `}>
        <div className="h-16 flex items-center px-6 border-b border-slate-100 shrink-0 bg-slate-50/30">
           <h2 className="text-sm font-black text-slate-800 truncate leading-tight">
             {currentModule.label ? currentModule.label[lang] : 'Menu'}
           </h2>
        </div>
        
        <div className="flex-1 overflow-hidden">
          {TreeMenu ? (
            <TreeMenu 
              items={currentModule.children || []} 
              activeId={activeId} 
              onSelect={setActiveId} 
              isRtl={isRtl}
            />
          ) : (
             <div className="p-4 text-center text-slate-400 text-xs">Loading Menu Component...</div>
          )}
        </div>
        
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 shrink-0">
          <div 
             onClick={() => setActiveId('user_profile')}
             className="flex items-center gap-3 p-2 rounded-xl hover:bg-white hover:shadow-sm transition-all cursor-pointer border border-transparent hover:border-slate-100"
          >
             <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-100 to-blue-50 border border-white shadow-sm flex items-center justify-center text-indigo-700 font-black text-xs">
               AD
             </div>
             <div className="min-w-0">
                <div className="text-[12px] font-bold text-slate-700 truncate">Admin User</div>
                <div className="text-[10px] text-slate-400 truncate">Product Manager</div>
             </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50/50 relative">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-20">
           <div className="flex items-center gap-4">
             <button 
               onClick={() => setSidebarCollapsed(!sidebarCollapsed)} 
               className="p-2 -ml-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-colors"
             >
                {sidebarCollapsed ? <Menu size={20} /> : <ChevronRightSquare size={20} className={isRtl ? '' : 'rotate-180'} />}
             </button>
             
             <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-400 font-medium hidden sm:inline">{currentModule.label ? currentModule.label[lang] : ''}</span>
                <ChevronRight size={14} className={`text-slate-300 hidden sm:inline ${isRtl ? 'rotate-180' : ''}`} />
                <span className="text-slate-800 font-bold">{activeId === 'user_profile' ? (t.profileTitle || 'User Profile') : activeId}</span>
             </div>
           </div>

           <div className="flex items-center gap-3">
              <div className="relative hidden md:block">
                 <Search size={16} className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? 'right-3' : 'left-3'} text-slate-400`} />
                 <input 
                    placeholder={t.searchMenu || 'Search...'}
                    className={`
                       h-9 bg-slate-100 border-none rounded-full text-xs w-56 focus:w-72 transition-all
                       ${isRtl ? 'pr-9 pl-4' : 'pl-9 pr-4'} focus:ring-2 focus:ring-indigo-100 outline-none
                    `}
                 />
              </div>
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

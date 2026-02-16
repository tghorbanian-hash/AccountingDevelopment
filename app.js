/* Filename: app.js */
import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  BarChart3, Languages, Bell, Search, 
  ChevronRight, LogOut, LayoutGrid, ChevronRightSquare,
  Menu, Circle
} from 'lucide-react';

// --- Pure JS SHA-256 Fallback ---
const computeSHA256 = async (message) => {
  if (window.crypto && window.crypto.subtle) {
    try {
      const msgBuffer = new TextEncoder().encode(message);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      console.warn("Native SHA-256 failed, falling back to JS implementation.", e);
    }
  }
  
  function _sha256(ascii) {
    function rightRotate(value, amount) { return (value>>>amount) | (value<<(32 - amount)); }
    var mathPow = Math.pow;
    var maxWord = mathPow(2, 32);
    var lengthProperty = 'length';
    var i, j;
    var result = '';
    var words = [];
    var asciiBitLength = ascii[lengthProperty]*8;
    var hash = [], k = [];
    var primeCounter = k[lengthProperty];
    var isComposite = {};
    for (var candidate = 2; primeCounter < 64; candidate++) {
      if (!isComposite[candidate]) {
        for (i = 0; i < 313; i += candidate) { isComposite[i] = candidate; }
        hash[primeCounter] = (mathPow(candidate, .5)*maxWord)|0;
        k[primeCounter++] = (mathPow(candidate, 1/3)*maxWord)|0;
      }
    }
    ascii += '\x80';
    while (ascii[lengthProperty]%64 - 56) ascii += '\x00';
    for (i = 0; i < ascii[lengthProperty]; i++) {
      j = ascii.charCodeAt(i);
      if (j>>8) return; 
      words[i>>2] |= j << ((3 - i)%4)*8;
    }
    words[words[lengthProperty]] = ((asciiBitLength/maxWord)|0);
    words[words[lengthProperty]] = (asciiBitLength);
    for (j = 0; j < words[lengthProperty];) {
      var w = words.slice(j, j += 16);
      var oldHash = hash;
      hash = hash.slice(0, 8);
      for (i = 0; i < 64; i++) {
        var w15 = w[i - 15], w2 = w[i - 2];
        var a = hash[0], e = hash[4];
        var temp1 = hash[7]
          + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25))
          + ((e&hash[5])^((~e)&hash[6]))
          + k[i]
          + (w[i] = (i < 16) ? w[i] : (
              w[i - 16]
              + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15>>>3))
              + w[i - 7]
              + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2>>>10))
            )|0
          );
        var temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22))
          + ((a&hash[1])^(a&hash[2])^(hash[1]&hash[2]));
        hash = [(temp1 + temp2)|0].concat(hash);
        hash[4] = (hash[4] + temp1)|0;
      }
      for (i = 0; i < 8; i++) { hash[i] = (hash[i] + oldHash[i])|0; }
    }
    for (i = 0; i < 8; i++) {
      for (j = 3; j + 1; j--) {
        var b = (hash[i]>>(j*8))&255;
        result += ((b < 16) ? 0 : '') + b.toString(16);
      }
    }
    return result;
  }
  return _sha256(message);
};

// --- Global Permission Handler ---
window.USER_PERMISSIONS = new Set();
window.IS_ADMIN = false;

window.hasAccess = (resource, action = null) => {
  // 1. Global Admin Override
  if (window.IS_ADMIN) return true;

  const permissions = window.USER_PERMISSIONS;
  if (!permissions) return false;

  const resStr = String(resource).toLowerCase();

  // Level 1: Form Access (Check if they have the form, or ANY action under this form)
  if (!action) {
    for (const p of permissions) {
      if (p === resStr || p.startsWith(`${resStr}.`)) {
        return true;
      }
    }
    return false;
  }

  // Level 2: Specific Action Access
  const actStr = String(action).toLowerCase();
  return permissions.has(`${resStr}.${actStr}`);
};

const App = () => {
  const translations = window.translations || { en: {}, fa: {} };
  const UI = window.UI || {};
  const { TreeMenu } = UI;
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [menuData, setMenuData] = useState([]);
  
  const [lang, setLang] = useState('fa'); 
  const [activeModuleId, setActiveModuleId] = useState('gl_base_info'); 
  const [activeId, setActiveId] = useState('workspace_gen'); 
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Authentication States
  const [authView, setAuthView] = useState('login'); 
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

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!loginData.identifier || !loginData.password) {
      setError(isRtl ? 'لطفا نام کاربری و رمز عبور را وارد کنید' : 'Please enter username and password');
      return;
    }

    const supabase = window.supabase;
    if (!supabase) {
      setError(isRtl ? 'خطای ارتباط با دیتابیس' : 'Database connection error');
      return;
    }

    try {
      const { data: userData, error: userErr } = await supabase
        .schema('gen')
        .from('users')
        .select('*')
        .eq('username', loginData.identifier)
        .single();

      if (userErr || !userData) {
        setError(t.invalidCreds || (isRtl ? 'نام کاربری در سیستم یافت نشد' : 'Username not found'));
        return;
      }

      if (!userData.is_active) {
        setError(isRtl ? 'حساب کاربری شما غیرفعال شده است' : 'Your account is disabled');
        return;
      }

      const storedPassword = userData.password_hash || userData.password || userData.password_hash_value;
      
      if (!storedPassword) {
        setError(isRtl ? 'کلمه عبور در پروفایل این کاربر تنظیم نشده است' : 'Password not set for this user');
        return;
      }

      let isPasswordValid = false;
      const cleanStored = String(storedPassword).trim().toLowerCase();

      if (cleanStored === loginData.password.trim().toLowerCase() || storedPassword === loginData.password) {
        isPasswordValid = true;
      } else {
        try {
          if (atob(storedPassword) === loginData.password || btoa(loginData.password) === storedPassword) {
            isPasswordValid = true;
          }
        } catch (err) {}
      }

      if (!isPasswordValid) {
        try {
          const sha256Hash = await computeSHA256(loginData.password);
          if (cleanStored === sha256Hash) {
            isPasswordValid = true;
          }
        } catch (err) {
          console.error("SHA-256 Hash check error:", err);
        }
      }

      if (!isPasswordValid) {
        try {
          const { data: rpcValid, error: rpcErr } = await supabase.schema('gen').rpc('verify_user_password', {
            p_username: loginData.identifier,
            p_password: loginData.password
          });
          
          if (!rpcErr && rpcValid === true) {
            isPasswordValid = true;
          }
        } catch (err) {
          console.error("RPC call failed:", err);
        }
      }

      if (isPasswordValid) {
        setIsLoggedIn(true);
        setError('');
        setCurrentUser(userData);
      } else {
        setError(t.invalidCreds || (isRtl ? 'نام کاربری یا رمز عبور اشتباه است' : 'Invalid credentials'));
      }

    } catch (err) {
      console.error(err);
      setError(t.serverError || (isRtl ? 'خطای ارتباط با سرور' : 'Server error'));
    }
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (recoveryData.otp === '123456') {
      setError('');
      setAuthView('reset'); 
    } else {
      setError(t.invalidOtp || 'Invalid OTP code');
    }
  };

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    if (!recoveryData.newPass || recoveryData.newPass !== recoveryData.confirmPass) {
       setError(isRtl ? 'رمز عبور و تکرار آن مطابقت ندارند' : 'Passwords do not match');
       return;
    }
    alert(t.resetSuccess || 'Password updated successfully');
    setAuthView('login');
    setError('');
    setRecoveryData({ otp: '', newPass: '', confirmPass: '' });
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setMenuData([]);
    window.USER_PERMISSIONS = new Set();
    window.IS_ADMIN = false;
  };

  // --- Dynamic Menu & Permissions Logic ---

  useEffect(() => {
    if (!currentUser) return;

    const buildMenu = async () => {
      const rawMenu = window.MENU_DATA || [];
      const userType = currentUser.user_type || currentUser.UserType || '';
      
      const isSysAdmin = userType === 'System Admin' || userType === 'مدیر سیستم';
      
      window.IS_ADMIN = isSysAdmin;

      if (isSysAdmin) {
        setMenuData(rawMenu);
        window.USER_PERMISSIONS = new Set(); 
        if (rawMenu.length > 0 && !activeModuleId) setActiveModuleId(rawMenu[0].id);
        return;
      }

      try {
        const supabase = window.supabase;
        let allowedCodes = new Set();
        
        const { data: userRoles } = await supabase.schema('gen').from('user_roles').select('role_id').eq('user_id', currentUser.id);
        const roleIds = userRoles ? userRoles.map(ur => ur.role_id) : [];

        if (roleIds.length > 0) {
          const { data: rPerms } = await supabase.schema('gen').from('permissions').select('resource_code').in('role_id', roleIds);
          if (rPerms) {
            rPerms.forEach(p => {
              if (p.resource_code) allowedCodes.add(p.resource_code.toLowerCase());
            });
          }
        }

        const { data: uPerms } = await supabase.schema('gen').from('permissions').select('resource_code').eq('user_id', currentUser.id);
        if (uPerms) {
          uPerms.forEach(p => {
            if (p.resource_code) allowedCodes.add(p.resource_code.toLowerCase());
          });
        }

        window.USER_PERMISSIONS = allowedCodes;

        const filterMenu = (nodes) => {
          return nodes.map(node => {
            if (!node.children || node.children.length === 0) {
              return window.hasAccess(node.id) ? node : null;
            }
            const filteredChildren = filterMenu(node.children);
            if (filteredChildren.length > 0) {
              return { ...node, children: filteredChildren };
            }
            return null;
          }).filter(Boolean);
        };

        const filteredMenu = filterMenu(rawMenu);
        setMenuData(filteredMenu);
        
        if (filteredMenu.length > 0) {
           setActiveModuleId(filteredMenu[0].id);
        } else {
           setActiveModuleId(''); 
        }

      } catch (err) {
        console.error("Error fetching permissions", err);
        setMenuData([]);
        window.USER_PERMISSIONS = new Set();
      }
    };

    buildMenu();
  }, [currentUser]);

  // --- App Logic & Rendering ---

  const currentModule = useMemo(() => {
    return menuData.find(m => m.id === activeModuleId) || menuData[0] || {};
  }, [activeModuleId, menuData]);
  
  const renderContent = () => {
    const { 
      KpiDashboard, UserManagement, GeneralWorkspace, ComponentShowcase, LoginPage, 
      Roles, Parties, UserProfile, OrganizationInfo, CurrencySettings, CostCenters, 
      Projects, Branches, OrgChart, Ledgers, Details, FiscalPeriods, DocTypes, 
      AutoNumbering, ChartofAccounts 
    } = window;

    if (activeId === 'user_profile') return UserProfile ? <UserProfile t={t} isRtl={isRtl} onLanguageChange={setLang} /> : <div className="p-4 text-red-500">Error: UserProfile Component Not Loaded</div>;
    if (activeId === 'org_info') return OrganizationInfo ? <OrganizationInfo t={t} isRtl={isRtl} /> : <div className="p-4 text-red-500">Error: OrganizationInfo Component Not Loaded</div>;
    if (activeId === 'currency_settings') return CurrencySettings ? <CurrencySettings t={t} isRtl={isRtl} /> : <div className="p-4 text-red-500">Error: CurrencySettings Component Not Loaded</div>;
    if (activeId === 'parties') return Parties ? <Parties t={t} isRtl={isRtl} /> : <div className="p-4 text-red-500">Error: Parties Component Not Loaded</div>;
    if (activeId === 'cost_centers') return CostCenters ? <CostCenters t={t} isRtl={isRtl} /> : <div className="p-4 text-red-500">Error: CostCenters Component Not Loaded</div>;
    if (activeId === 'projects') return Projects ? <Projects t={t} isRtl={isRtl} /> : <div className="p-4 text-red-500">Error: Projects Component Not Loaded</div>;
    if (activeId === 'branches') return Branches ? <Branches t={t} isRtl={isRtl} /> : <div className="p-4 text-red-500">Error: Branches Component Not Loaded</div>;
    if (activeId === 'org_chart') return OrgChart ? <OrgChart t={t} isRtl={isRtl} /> : <div className="p-4 text-red-500">Error: OrgChart Component Not Loaded</div>;
    if (activeId === 'ledgers') return Ledgers ? <Ledgers t={t} isRtl={isRtl} /> : <div className="p-4 text-red-500">Error: Ledgers Component Not Loaded</div>;
    if (activeId === 'details') return Details ? <Details t={t} isRtl={isRtl} /> : <div className="p-4 text-red-500">Error: Details Component Not Loaded</div>;
    if (activeId === 'acc_structure') return ChartofAccounts ? <ChartofAccounts t={t} isRtl={isRtl} /> : <div className="p-4 text-red-500">Error: ChartofAccounts Component Not Loaded</div>; 
    if (activeId === 'fiscal_periods') return FiscalPeriods ? <FiscalPeriods t={t} isRtl={isRtl} /> : <div className="p-4 text-red-500">Error: FiscalPeriods Component Not Loaded</div>;
    if (activeId === 'doc_types') return DocTypes ? <DocTypes t={t} isRtl={isRtl} /> : <div className="p-4 text-red-500">Error: DocTypes Component Not Loaded</div>;
    if (activeId === 'auto_num') return AutoNumbering ? <AutoNumbering t={t} isRtl={isRtl} /> : <div className="p-4 text-red-500">Error: AutoNumbering Component Not Loaded</div>;
    if (activeId === 'users_list') return UserManagement ? <UserManagement t={t} isRtl={isRtl} /> : <div className="p-4 text-red-500">Error: UserManagement Not Loaded</div>;
    if (activeId === 'roles') return Roles ? <Roles t={t} isRtl={isRtl} /> : <div className="p-4 text-red-500">Error: Roles Component Not Loaded</div>;
    if (activeId === 'workspace_gen') return GeneralWorkspace ? <GeneralWorkspace t={t} isRtl={isRtl} /> : <div>Loading...</div>;
    if (activeId === 'dashboards_gen') return KpiDashboard ? <KpiDashboard t={t} isRtl={isRtl} /> : <div>Loading...</div>;
    if (activeId === 'ui_showcase') return ComponentShowcase ? <ComponentShowcase t={t} isRtl={isRtl} /> : <div>Loading...</div>;

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
        handleVerifyOtp={handleVerifyOtp} 
        handleUpdatePassword={handleUpdatePassword} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className={`bg-white w-[72px] flex flex-col items-center py-4 shrink-0 z-40 border-${isRtl ? 'l' : 'r'} border-slate-200 shadow-sm relative overflow-x-hidden`}>
        <div className="bg-indigo-700 w-10 h-10 rounded-xl text-white mb-6 shadow-lg shadow-indigo-500/30 flex items-center justify-center shrink-0">
          <BarChart3 size={20} strokeWidth={2.5} />
        </div>
        
        <div className="flex-1 flex flex-col gap-3 items-center w-full px-2 overflow-y-auto no-scrollbar">
          {menuData.map(mod => {
             const isActive = activeModuleId === mod.id;
             const IconComponent = mod.icon || Circle;
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
                <IconComponent size={20} strokeWidth={isActive ? 2 : 1.5} />
                
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
            <button onClick={handleLogout} className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors">
              <LogOut size={20} />
            </button>
        </div>
      </aside>

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
             <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-100 to-blue-50 border border-white shadow-sm flex items-center justify-center text-indigo-700 font-black text-xs uppercase">
               {currentUser?.username ? currentUser.username.substring(0,2) : 'US'}
             </div>
             <div className="min-w-0">
                <div className="text-[12px] font-bold text-slate-700 truncate">{currentUser?.full_name || currentUser?.username || 'User'}</div>
                <div className="text-[10px] text-slate-400 truncate">{currentUser?.user_type || currentUser?.UserType || 'System User'}</div>
             </div>
          </div>
        </div>
      </aside>

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
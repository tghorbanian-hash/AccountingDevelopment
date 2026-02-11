/* Filename: components/UserProfile.js */
import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Globe, Moon, Sun, Save, 
  CheckCircle2, Shield, Settings, Key, 
  Database, Type
} from 'lucide-react';

const UserProfile = ({ t, isRtl, onLanguageChange }) => {
  const UI = window.UI || {};
  const { Button, InputField, SelectField, Toggle, Badge, SideMenu, Accordion, Callout } = UI;
  const DEFAULT_VALUES_SCHEMA = window.DEFAULT_VALUES_SCHEMA || [];

  // --- States ---
  const [activeTab, setActiveTab] = useState('personal'); 
  const [theme, setTheme] = useState('light');
  const [passMode, setPassMode] = useState('view'); 
  const [defaultValues, setDefaultValues] = useState({});
  const [expandedModules, setExpandedModules] = useState(['accounting']);

  // Mock User Data
  const userInfo = {
    username: 'admin',
    email: 'admin@fincorp.co',
    role: 'System Admin',
    lastLogin: '2025/02/09 08:30'
  };

  // --- Handlers ---
  const handleSaveDefaults = () => {
    alert(t.defaultsSaved || 'Default values saved successfully.');
  };

  const toggleModule = (moduleId) => {
    setExpandedModules(prev => 
      prev.includes(moduleId) ? prev.filter(id => id !== moduleId) : [...prev, moduleId]
    );
  };

  const handleDefaultValueChange = (key, value) => {
    setDefaultValues(prev => ({ ...prev, [key]: value }));
  };

  // --- Renderers ---

  const renderPersonalInfo = () => (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center gap-5 mb-6 pb-6 border-b border-slate-100">
        <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-inner">
          <User size={40} strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">{userInfo.username}</h2>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="purple">{userInfo.role}</Badge>
            <span className="text-[10px] text-slate-400 px-2 border-l border-slate-200 h-3 flex items-center">
              ID: #89204
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <InputField 
          label={t.usernameLabel} value={userInfo.username} disabled 
          icon={User} isRtl={isRtl} className="bg-slate-50 text-slate-500 border-slate-200"
        />
        <InputField 
          label={t.emailLabel} value={userInfo.email} disabled 
          icon={Mail} isRtl={isRtl} className="bg-slate-50 text-slate-500 border-slate-200 dir-ltr"
        />
        <InputField 
          label={isRtl ? "آخرین زمان ورود" : "Last Login"} value={userInfo.lastLogin} disabled 
          isRtl={isRtl} className="bg-slate-50 text-slate-500 border-slate-200 dir-ltr"
        />
        <InputField 
          label={isRtl ? "واحد سازمانی" : "Department"} value={isRtl ? "مدیریت محصول" : "Product Management"} disabled 
          isRtl={isRtl} className="bg-slate-50 text-slate-500 border-slate-200"
        />
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-start justify-between">
           <div className="flex gap-3">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg border border-amber-100">
                 <Key size={18}/>
              </div>
              <div>
                 <h3 className="text-sm font-bold text-slate-800">{t.changePass}</h3>
                 <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-md">{t.changePassDesc}</p>
              </div>
           </div>
           {passMode === 'view' && (
             <Button variant="outline" size="sm" onClick={() => setPassMode('edit')}>
               {t.edit || 'Change'}
             </Button>
           )}
        </div>

        {passMode === 'edit' && (
          <div className="p-4 bg-slate-50/50 space-y-4">
            <InputField label={t.currentPass} type="password" placeholder="••••••••" isRtl={isRtl} className="bg-white"/>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label={t.newPasswordLabel} type="password" placeholder="••••••••" isRtl={isRtl} className="bg-white"/>
              <InputField label={t.confirmPasswordLabel} type="password" placeholder="••••••••" isRtl={isRtl} className="bg-white"/>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setPassMode('view')}>{t.btn_cancel}</Button>
              <Button variant="primary" onClick={() => { alert(t.resetSuccess); setPassMode('view'); }}>
                {t.updatePassword}
              </Button>
            </div>
          </div>
        )}
      </div>
      
      <Callout 
         variant="success" 
         icon={Shield} 
         title="Two-Factor Authentication (2FA)" 
         className="opacity-80 grayscale"
      >
         Managed by System Administrator (Enforced)
      </Callout>
    </div>
  );

  const renderPreferences = () => (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="grid grid-cols-1 gap-4">
        {/* Language */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <label className="text-[13px] font-bold text-slate-800 mb-3 flex items-center gap-2">
            <Globe size={16} className="text-blue-500" /> {t.langSettings}
          </label>
          <div className="grid grid-cols-2 gap-3">
             <button onClick={() => onLanguageChange('fa')} className={`relative overflow-hidden p-3 rounded-lg border transition-all text-right group ${isRtl ? 'border-blue-500 bg-blue-50/50' : 'border-slate-100 bg-slate-50 hover:border-slate-300'}`}>
               <div className="font-bold text-slate-800 text-xs mb-0.5">فارسی</div>
               <div className="text-[10px] text-slate-500">Persian (Iran)</div>
               {isRtl && <CheckCircle2 size={12} className="absolute top-1 left-1 text-blue-600"/>}
             </button>
             <button onClick={() => onLanguageChange('en')} className={`relative overflow-hidden p-3 rounded-lg border transition-all text-left group ${!isRtl ? 'border-blue-500 bg-blue-50/50' : 'border-slate-100 bg-slate-50 hover:border-slate-300'}`}>
               <div className="font-bold text-slate-800 text-xs mb-0.5">English</div>
               <div className="text-[10px] text-slate-500">United States</div>
               {!isRtl && <CheckCircle2 size={12} className="absolute top-1 right-1 text-blue-600"/>}
             </button>
          </div>
        </div>

        {/* Theme */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <label className="text-[13px] font-bold text-slate-800 mb-3 flex items-center gap-2">
            <Type size={16} className="text-orange-500" /> {t.theme}
          </label>
          <div className="grid grid-cols-2 gap-3">
             <button onClick={() => setTheme('light')} className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all gap-1.5 ${theme === 'light' ? 'border-orange-500 bg-orange-50/30 text-orange-700' : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-300'}`}>
               <Sun size={20} strokeWidth={1.5} />
               <span className="font-bold text-xs">{t.themeLight}</span>
             </button>
             <button onClick={() => setTheme('dark')} className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all gap-1.5 ${theme === 'dark' ? 'border-slate-700 bg-slate-800 text-white' : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-300'}`}>
               <Moon size={20} strokeWidth={1.5} />
               <span className="font-bold text-xs">{t.themeDark}</span>
             </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDefaults = () => (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <Callout 
         title={t.defaultValues} 
         icon={Database} 
         className="mb-4"
         action={
            <Button variant="primary" icon={Save} onClick={handleSaveDefaults} size="sm" className="shadow-md shadow-indigo-200">
               {t.saveDefaults}
            </Button>
         }
      >
         {t.defaultValuesDesc}
      </Callout>

      <div className="space-y-2">
        {DEFAULT_VALUES_SCHEMA.map(moduleDef => {
          const isExpanded = expandedModules.includes(moduleDef.moduleId);
          const ModuleIcon = moduleDef.icon || Settings;
          
          return (
            <Accordion 
               key={moduleDef.moduleId}
               title={moduleDef.label[isRtl ? 'fa' : 'en']}
               icon={ModuleIcon}
               isOpen={isExpanded}
               onToggle={() => toggleModule(moduleDef.moduleId)}
               isRtl={isRtl}
            >
               {moduleDef.groups.map(group => (
                  <div key={group.groupId} className="mb-4 last:mb-0">
                     <div className="flex items-center gap-2 mb-3">
                        <div className="h-px bg-slate-200 flex-1"></div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider bg-white px-2">
                        {group.label[isRtl ? 'fa' : 'en']}
                        </h4>
                        <div className="h-px bg-slate-200 flex-1"></div>
                     </div>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {group.fields.map(field => {
                        const fieldLabel = field.label[isRtl ? 'fa' : 'en'];
                        const fieldKey = `${moduleDef.moduleId}.${group.groupId}.${field.key}`;
                        
                        if (field.type === 'select') {
                           return (
                              <SelectField 
                              key={fieldKey}
                              label={fieldLabel} isRtl={isRtl}
                              value={defaultValues[fieldKey] || ''}
                              onChange={(e) => handleDefaultValueChange(fieldKey, e.target.value)}
                              >
                              <option value="">- {isRtl ? 'انتخاب کنید' : 'Select'} -</option>
                              {field.options.map(opt => (
                                 <option key={opt.value} value={opt.value}>
                                    {opt.label[isRtl ? 'fa' : 'en']}
                                 </option>
                              ))}
                              </SelectField>
                           );
                        } else if (field.type === 'toggle') {
                           return (
                              <div key={fieldKey} className="flex items-end h-full pb-2">
                                 <Toggle label={fieldLabel} checked={defaultValues[fieldKey] || false} onChange={(val) => handleDefaultValueChange(fieldKey, val)} />
                              </div>
                           );
                        }
                        return null;
                        })}
                     </div>
                  </div>
               ))}
            </Accordion>
          );
        })}
      </div>
    </div>
  );

  const tabs = [
    { id: 'personal', icon: User, label: t.personalInfo },
    { id: 'security', icon: Shield, label: t.security },
    { id: 'prefs', icon: Settings, label: t.preferences },
    { id: 'defaults', icon: Database, label: t.defaultValues },
  ];

  return (
    <div className={`flex flex-col h-full bg-slate-50/50 p-4 md:p-6 overflow-hidden ${isRtl ? 'font-vazir' : 'font-sans'}`}>
      <div className="mb-6 shrink-0 flex items-center justify-between">
         <div>
            <h1 className="text-xl font-black text-slate-900">{t.profileTitle}</h1>
            <p className="text-xs font-medium text-slate-500 mt-1">{t.profileSubtitle}</p>
         </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0 overflow-hidden">
        <div className="w-full md:w-64 shrink-0">
            <SideMenu 
               title={t.profileTitle || 'Profile Settings'} 
               items={tabs} 
               activeId={activeTab} 
               onChange={setActiveTab} 
               isRtl={isRtl} 
            />
        </div>
        
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-y-auto custom-scrollbar">
          {activeTab === 'personal' && renderPersonalInfo()}
          {activeTab === 'security' && renderSecurity()}
          {activeTab === 'prefs' && renderPreferences()}
          {activeTab === 'defaults' && renderDefaults()}
        </div>
      </div>
    </div>
  );
};

window.UserProfile = UserProfile;

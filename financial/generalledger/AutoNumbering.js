/* Filename: financial/generalledger/AutoNumbering.js */
import React, { useState, useEffect } from 'react';
import { 
  Save, Settings, FileText, CheckCircle, Layers, Filter, Hash, HelpCircle 
} from 'lucide-react';

const localTranslations = {
  en: {
    title: 'Auto Numbering Settings',
    subtitle: 'Configure dynamic numbering formats for system documents',
    globalFiltersTitle: 'Global System Context',
    tabVouchers: 'Journal Vouchers',
    tabTreasury: 'Treasury (Coming Soon)',
    save: 'Save Settings',
    prefix: 'Prefix',
    suffix: 'Suffix',
    startNumber: 'Start Number',
    length: 'Number Length (Digits)',
    preview: 'Format Preview',
    currentNumber: 'Current Issued Number',
    currentNumberHelp: 'Shows the highest number already issued. Changing the start number below this value may cause conflicts.',
    successSave: 'Numbering settings saved successfully.',
    errorSave: 'Error saving settings.',
    configFor: 'Configuration for',
    voucherEntity: 'Accounting Vouchers'
  },
  fa: {
    title: 'تنظیمات شماره‌گذاری اتوماتیک',
    subtitle: 'پیکربندی ساختار و فرمت شماره‌گذاری اسناد و فرم‌های سیستم',
    globalFiltersTitle: 'فیلترهای عمومی سیستم',
    tabVouchers: 'شماره‌گذاری اسناد حسابداری',
    tabTreasury: 'خزانه‌داری (به زودی)',
    save: 'ذخیره تنظیمات',
    prefix: 'پیشوند',
    suffix: 'پسوند',
    startNumber: 'شماره شروع',
    length: 'طول شماره (تعداد ارقام)',
    preview: 'پیش‌نمایش فرمت',
    currentNumber: 'آخرین شماره صادر شده',
    currentNumberHelp: 'نشان‌دهنده آخرین شماره‌ای است که توسط سیستم صادر شده است. تنظیم شماره شروع کمتر از این مقدار ممکن است باعث تداخل شود.',
    successSave: 'تنظیمات شماره‌گذاری با موفقیت ذخیره شد.',
    errorSave: 'خطا در ذخیره تنظیمات.',
    configFor: 'پیکربندی برای',
    voucherEntity: 'اسناد حسابداری دفتر کل'
  }
};

const Tabs = ({ tabs, activeTab, onChange }) => (
  <div className="flex items-center gap-1 border-b border-slate-200 mb-4 overflow-x-auto no-scrollbar px-2">
    {tabs.map(tab => (
      <button
        key={tab.id}
        onClick={() => { if(!tab.disabled) onChange(tab.id); }}
        disabled={tab.disabled}
        className={`
          px-4 py-2 text-[13px] font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-2
          ${activeTab === tab.id 
            ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50' 
            : tab.disabled 
               ? 'border-transparent text-slate-300 cursor-not-allowed'
               : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}
        `}
      >
        {tab.icon && <tab.icon size={16} />}
        {tab.label}
      </button>
    ))}
  </div>
);

const AutoNumbering = ({ language = 'fa' }) => {
  const t = localTranslations[language];
  const isRtl = language === 'fa';
  
  const UI = window.UI || {};
  const { Button, InputField, Badge } = UI;
  const supabase = window.supabase;

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('vouchers');
  
  const [fiscalYears, setFiscalYears] = useState([]);
  const [ledgers, setLedgers] = useState([]);
  const [contextVals, setContextVals] = useState({ fiscal_year_id: '', ledger_id: '' });

  const [config, setConfig] = useState({
    id: null,
    prefix: '',
    suffix: '',
    start_number: 1,
    number_length: 5,
    current_number: 0
  });

  useEffect(() => {
    fetchLookups();
  }, []);

  useEffect(() => {
    if (contextVals.fiscal_year_id && contextVals.ledger_id && activeTab === 'vouchers') {
      fetchConfig();
    }
  }, [contextVals, activeTab]);

  const fetchLookups = async () => {
    if (!supabase) return;
    try {
      const [fyRes, ledRes] = await Promise.all([
        supabase.schema('gl').from('fiscal_years').select('id, code, title, status').eq('is_active', true).order('code', { ascending: false }),
        supabase.schema('gl').from('ledgers').select('id, code, title').eq('is_active', true).order('title')
      ]);
      
      if (fyRes.data) setFiscalYears(fyRes.data);
      if (ledRes.data) setLedgers(ledRes.data);

      setContextVals(prev => {
        if (!prev.fiscal_year_id && !prev.ledger_id) {
          return {
            fiscal_year_id: fyRes.data?.[0]?.id || '',
            ledger_id: ledRes.data?.[0]?.id || ''
          };
        }
        return prev;
      });
    } catch (error) {
      console.error('Error fetching lookups:', error);
    }
  };

  const fetchConfig = async () => {
    if (!supabase) return;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(contextVals.fiscal_year_id) || !uuidRegex.test(contextVals.ledger_id)) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.schema('gl')
        .from('auto_numbering')
        .select('*')
        .eq('fiscal_period_id', contextVals.fiscal_year_id)
        .eq('ledger_id', contextVals.ledger_id)
        .eq('entity_name', 'voucher')
        .single();
      
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is not found (which is fine, we use defaults)

      if (data) {
        setConfig({
          id: data.id,
          prefix: data.prefix || '',
          suffix: data.suffix || '',
          start_number: data.start_number || 1,
          number_length: data.number_length || 5,
          current_number: data.current_number || 0
        });
      } else {
        setConfig({
          id: null,
          prefix: '',
          suffix: '',
          start_number: 1,
          number_length: 5,
          current_number: 0
        });
      }
    } catch (error) {
      console.error('Error fetching config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const payload = {
        ledger_id: contextVals.ledger_id,
        fiscal_period_id: contextVals.fiscal_year_id,
        entity_name: 'voucher',
        prefix: config.prefix,
        suffix: config.suffix,
        start_number: parseInt(config.start_number) || 1,
        number_length: parseInt(config.number_length) || 5,
        is_active: true
      };

      if (config.id) {
        const { error } = await supabase.schema('gl')
          .from('auto_numbering')
          .update(payload)
          .eq('id', config.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.schema('gl')
          .from('auto_numbering')
          .insert([payload])
          .select()
          .single();
        if (error) throw error;
        setConfig(prev => ({ ...prev, id: data.id }));
      }
      
      alert(t.successSave);
    } catch (error) {
      console.error('Error saving config:', error);
      alert(t.errorSave + '\n' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const generatePreview = () => {
    const num = Math.max(config.current_number > 0 ? config.current_number + 1 : config.start_number, 1);
    const numStr = String(num).padStart(config.number_length || 5, '0');
    return `${config.prefix || ''}${numStr}${config.suffix || ''}`;
  };

  const tabs = [
    { id: 'vouchers', label: t.tabVouchers, icon: FileText },
    { id: 'treasury', label: t.tabTreasury, icon: Layers, disabled: true }
  ];

  return (
    <div className={`h-full flex flex-col p-4 md:p-6 bg-slate-50/50`}>
      <div className="mb-4 bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-2 text-indigo-800 font-bold text-sm">
          <Filter size={18} className="text-indigo-500"/>
          <span>{t.globalFiltersTitle}:</span>
        </div>
        <div className="flex gap-3">
          <select value={contextVals.fiscal_year_id} onChange={e => setContextVals({...contextVals, fiscal_year_id: e.target.value})} className="bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg px-3 py-1.5 text-xs font-bold outline-none cursor-pointer focus:ring-2 focus:ring-indigo-200 transition-all">
            {fiscalYears.map(f => <option key={f.id} value={f.id}>{f.title}</option>)}
          </select>
          <select value={contextVals.ledger_id} onChange={e => setContextVals({...contextVals, ledger_id: e.target.value})} className="bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg px-3 py-1.5 text-xs font-bold outline-none cursor-pointer focus:ring-2 focus:ring-indigo-200 transition-all">
            {ledgers.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
          </select>
        </div>
      </div>

      <div className="mb-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200">
            <Settings size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800">{t.title}</h1>
            <p className="text-xs text-slate-500 font-medium mt-1">{t.subtitle}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
         <div className="pt-2 px-2 border-b border-slate-100 bg-slate-50/50">
            <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
         </div>

         <div className="flex-1 overflow-y-auto p-6 md:p-8 flex justify-center">
            {activeTab === 'vouchers' && (
               <div className="w-full max-w-2xl bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden flex flex-col">
                  <div className="bg-indigo-50/50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <Hash size={18} className="text-indigo-600" />
                        <span className="font-bold text-slate-700">{t.configFor}:</span>
                        <Badge variant="info" className="text-sm px-3">{t.voucherEntity}</Badge>
                     </div>
                  </div>

                  <div className="p-6 space-y-8 flex-1">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField 
                           label={t.prefix} 
                           value={config.prefix} 
                           onChange={e => setConfig({...config, prefix: e.target.value})} 
                           isRtl={isRtl} 
                           dir="ltr"
                           placeholder="e.g. ACC-"
                        />
                        <InputField 
                           label={t.suffix} 
                           value={config.suffix} 
                           onChange={e => setConfig({...config, suffix: e.target.value})} 
                           isRtl={isRtl} 
                           dir="ltr"
                           placeholder="e.g. -1403"
                        />
                        <InputField 
                           type="number"
                           label={t.startNumber} 
                           value={config.start_number} 
                           onChange={e => setConfig({...config, start_number: e.target.value})} 
                           isRtl={isRtl} 
                           dir="ltr"
                           min="1"
                        />
                        <InputField 
                           type="number"
                           label={t.length} 
                           value={config.number_length} 
                           onChange={e => setConfig({...config, number_length: e.target.value})} 
                           isRtl={isRtl} 
                           dir="ltr"
                           min="3"
                           max="10"
                        />
                     </div>

                     <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 flex flex-col items-center justify-center gap-3">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.preview}</span>
                        <div className="text-3xl font-black text-indigo-700 font-mono tracking-widest bg-white px-6 py-3 rounded-xl border border-indigo-100 shadow-inner">
                           {generatePreview()}
                        </div>
                     </div>

                     <div className="flex items-start gap-3 p-4 bg-yellow-50 text-yellow-800 rounded-lg border border-yellow-200">
                        <HelpCircle size={20} className="shrink-0 mt-0.5 text-yellow-600" />
                        <div>
                           <div className="font-bold text-sm mb-1">{t.currentNumber}: <span className="font-mono bg-white px-2 py-0.5 rounded border border-yellow-300 mx-1">{config.current_number}</span></div>
                           <p className="text-xs text-yellow-700 leading-relaxed">{t.currentNumberHelp}</p>
                        </div>
                     </div>
                  </div>

                  <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-end shrink-0">
                     <Button 
                        variant="primary" 
                        icon={Save} 
                        onClick={handleSave} 
                        disabled={loading}
                     >
                        {loading ? '...' : t.save}
                     </Button>
                  </div>
               </div>
            )}
         </div>
      </div>
    </div>
  );
};

window.AutoNumbering = AutoNumbering;
export default AutoNumbering;
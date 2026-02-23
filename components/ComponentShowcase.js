/* Filename: components/ComponentShowcase.js */
import React, { useState } from 'react';
import { Settings, User, Mail, Shield, Check, X, Filter } from 'lucide-react';

export default function ComponentShowcase({ t, isRtl }) {
  const UI = window.UI || {};
  const { 
    Button, InputField, SelectField, Toggle, Badge, ToggleChip, 
    Modal, Callout, GlobalContextFilter 
  } = UI;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toggleVal, setToggleVal] = useState(true);
  const [chipVal, setChipVal] = useState(true);
  
  // State for testing Global Context Filter
  const [contextComplete, setContextComplete] = useState(false);
  const [contextVals, setContextVals] = useState({ year: '', ledger: '', branch: '' });

  return (
    <div className={`p-6 space-y-8 bg-slate-50 min-h-screen ${isRtl ? 'font-vazir' : 'font-sans'}`}>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-800">UI Components Showcase</h1>
        <p className="text-slate-500">Enterprise Design System Components</p>
      </div>

      <section>
        <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">1. Global Context Filter (Gatekeeper)</h2>
        <div className="bg-slate-200/50 p-6 rounded-xl border border-slate-300 border-dashed relative">
          <GlobalContextFilter
            isRtl={isRtl}
            title={isRtl ? 'فیلترهای عمومی سیستم' : 'Global System Context'}
            subtitle={isRtl ? 'لطفا قبل از ورود به فرم، سال مالی، دفتر کل و شعبه را انتخاب کنید.' : 'Please select fiscal year, ledger, and branch to proceed.'}
            isComplete={contextComplete}
            values={contextVals}
            onChange={(name, val) => {
              if(name === 'RESET') setContextComplete(false);
              else setContextVals(prev => ({...prev, [name]: val}));
            }}
            onConfirm={() => setContextComplete(true)}
            fields={[
              { name: 'year', label: isRtl ? 'سال مالی' : 'Fiscal Year', options: [{value:'1402', label:'1402'}, {value:'1403', label:'1403'}] },
              { name: 'ledger', label: isRtl ? 'دفتر کل' : 'Ledger', options: [{value:'main', label:'Main Ledger'}, {value:'ifrs', label:'IFRS Ledger'}] },
              { name: 'branch', label: isRtl ? 'شعبه' : 'Branch', options: [{value:'hq', label:'Headquarters'}, {value:'west', label:'West Branch'}] }
            ]}
          />
          {contextComplete && (
            <div className="mt-4 p-8 text-center bg-white rounded-xl border border-slate-200 shadow-sm animate-in fade-in">
               <h3 className="text-xl font-bold text-slate-700">{isRtl ? 'گرید و محتوای اصلی صفحه' : 'Main Page Content (DataGrid)'}</h3>
               <p className="text-slate-500 mt-2">{isRtl ? 'این بخش تنها پس از انتخاب فیلترهای عمومی و تایید نمایش داده می‌شود.' : 'This is only visible after context is set.'}</p>
            </div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">2. Buttons</h2>
          <div className="flex flex-wrap gap-3 p-4 bg-white rounded-xl border border-slate-200">
            <Button variant="primary" icon={Check}>Primary</Button>
            <Button variant="secondary" icon={Settings}>Secondary</Button>
            <Button variant="danger" icon={X}>Danger</Button>
            <Button variant="ghost" icon={User}>Ghost</Button>
            <Button variant="outline" icon={Filter}>Outline</Button>
            <Button variant="success" icon={Shield}>Success</Button>
          </div>
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">3. Badges & Chips</h2>
          <div className="flex flex-wrap items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 h-[88px]">
            <Badge variant="success">Success</Badge>
            <Badge variant="danger">Danger</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="info">Info</Badge>
            <Badge variant="indigo">Indigo</Badge>
            <ToggleChip label="Toggle Chip" checked={chipVal} onClick={() => setChipVal(!chipVal)} />
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">4. Form Inputs & Toggles</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-white rounded-xl border border-slate-200">
           <InputField label="Text Input" icon={Mail} placeholder="Enter text..." isRtl={isRtl} />
           <SelectField label="Select Dropdown" isRtl={isRtl}>
             <option>Option 1</option>
             <option>Option 2</option>
           </SelectField>
           <div className="flex items-center pt-5">
             <Toggle label="Active Status Toggle" checked={toggleVal} onChange={setToggleVal} />
           </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">5. Callouts & Feedback</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <Callout variant="info" title="Information" icon={Shield}>This is an informational callout providing user guidance.</Callout>
           <Callout variant="warning" title="Warning" icon={Shield}>Please be careful before proceeding with this action.</Callout>
           <Callout variant="success" title="Success" icon={Check}>Your changes have been saved successfully.</Callout>
           <Callout variant="danger" title="Error" icon={X}>Failed to connect to the database. Please try again.</Callout>
        </div>
      </section>
    </div>
  );
}
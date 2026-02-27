/* Filename: financial/generalledger/VoucherAttachments.js */
import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Download, Paperclip, UploadCloud, X, File, Loader } from 'lucide-react';

const VoucherAttachments = ({ voucherId, onClose, isRtl = true }) => {
  const supabase = window.supabase;
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (voucherId) {
      fetchAttachments();
    }
  }, [voucherId]);

  const fetchAttachments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.schema('gl')
        .from('voucher_attachments')
        .select('*')
        .eq('voucher_id', voucherId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setAttachments(data || []);
    } catch (error) {
      console.error('Error fetching attachments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      // 1. Upload to Supabase Storage (Bucket must exist: 'attachments')
      const fileExt = file.name.split('.').pop();
      const fileName = `${voucherId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('attachments')
        .getPublicUrl(fileName);

      // 3. Save to Database
      const attachmentData = {
        voucher_id: voucherId,
        file_name: file.name,
        file_url: publicUrl,
        file_type: file.type || fileExt,
        file_size: file.size,
      };

      const { error: dbError } = await supabase.schema('gl')
        .from('voucher_attachments')
        .insert([attachmentData]);

      if (dbError) throw dbError;

      fetchAttachments();
    } catch (error) {
      console.error('Upload error:', error);
      alert(isRtl ? 'خطا در آپلود فایل. مطمئن شوید باکت attachments در سوپابیس ایجاد شده است.' : 'Error uploading file.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id, fileUrl) => {
    if (!window.confirm(isRtl ? 'آیا از حذف این فایل اطمینان دارید؟' : 'Delete this attachment?')) return;
    
    setLoading(true);
    try {
      // Extract path from URL to delete from storage
      const urlParts = fileUrl.split('/attachments/');
      if (urlParts.length > 1) {
          const filePath = urlParts[1];
          await supabase.storage.from('attachments').remove([filePath]);
      }

      // Delete from DB
      const { error } = await supabase.schema('gl')
        .from('voucher_attachments')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      fetchAttachments();
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes, decimals = 2) => {
      if (!+bytes) return '0 Bytes';
      const k = 1024;
      const dm = decimals < 0 ? 0 : decimals;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  return (
    <div className={`flex flex-col gap-4 p-4 ${isRtl ? 'dir-rtl' : 'dir-ltr'}`}>
      <div className="flex flex-col gap-2">
         <input 
            type="file" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
         />
         <div 
            className="border-2 border-dashed border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 rounded-xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors"
            onClick={() => fileInputRef.current?.click()}
         >
            {uploading ? (
               <Loader size={32} className="text-indigo-500 animate-spin" />
            ) : (
               <UploadCloud size={32} className="text-indigo-400" />
            )}
            <div className="text-sm font-bold text-indigo-800">
               {uploading ? (isRtl ? 'در حال آپلود...' : 'Uploading...') : (isRtl ? 'برای آپلود فایل جدید کلیک کنید' : 'Click to upload a new file')}
            </div>
            <p className="text-xs text-slate-500">
               {isRtl ? 'فاکتورها، رسیدها و اسناد پشتیبان (حداکثر ۱۰ مگابایت)' : 'Invoices, receipts, and supporting documents (Max 10MB)'}
            </p>
         </div>
      </div>

      <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto custom-scrollbar">
         {loading && !uploading && <div className="text-center text-slate-400 text-sm py-4">{isRtl ? 'در حال بارگذاری...' : 'Loading...'}</div>}
         
         {!loading && attachments.length === 0 && (
             <div className="text-center text-slate-400 text-sm py-8 bg-slate-50 rounded-lg border border-slate-100 flex flex-col items-center gap-2">
                 <Paperclip size={24} className="text-slate-300" />
                 <span>{isRtl ? 'هیچ سندی ضمیمه نشده است.' : 'No attachments found.'}</span>
             </div>
         )}

         {attachments.map(att => (
             <div key={att.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-indigo-300 transition-colors">
                 <div className="flex items-center gap-3 overflow-hidden">
                     <div className="p-2 bg-slate-100 rounded-md shrink-0">
                         <File size={20} className="text-slate-500" />
                     </div>
                     <div className="flex flex-col overflow-hidden">
                         <span className="text-xs font-bold text-slate-700 truncate dir-ltr text-left" title={att.file_name}>{att.file_name}</span>
                         <span className="text-[10px] text-slate-500">{formatBytes(att.file_size)} • {new Date(att.created_at).toLocaleDateString('fa-IR')}</span>
                     </div>
                 </div>
                 <div className="flex items-center gap-1 shrink-0">
                     <a href={att.file_url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-colors" title={isRtl ? 'دانلود' : 'Download'}>
                         <Download size={16} />
                     </a>
                     <button onClick={() => handleDelete(att.id, att.file_url)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title={isRtl ? 'حذف' : 'Delete'}>
                         <Trash2 size={16} />
                     </button>
                 </div>
             </div>
         ))}
      </div>
    </div>
  );
};

window.VoucherAttachments = VoucherAttachments;
export default VoucherAttachments;
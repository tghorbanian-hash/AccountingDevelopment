/* Filename: components/PageDocumentation.js */
import React, { useState, useEffect, useRef } from 'react';
import { 
  Book, FileText, UploadCloud, Trash2, Download, 
  File, X, AlertCircle 
} from 'lucide-react';

const PageDocumentation = ({ 
  isOpen, onClose, pageKey, docType, 
  isAdmin, t, isRtl 
}) => {
  // دسترسی ایمن به آبجکت UI سراسری
  const UI = window.UI || {};
  const { Modal, Button, Callout, Badge } = UI;
  const supabase = window.supabase;

  // استیت‌های داخلی
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentDoc, setCurrentDoc] = useState(null);
  const fileInputRef = useRef(null);

  // اگر کامپوننت‌های UI هنوز لود نشده‌اند، رندر نکن تا ارور ندهد
  if (!Modal || !Button) return null;

  // تعیین عنوان بر اساس نوع سند
  const title = docType === 'dev' 
    ? (isRtl ? 'مستندات فنی (توسعه‌دهنده)' : 'Developer Documentation')
    : (isRtl ? 'راهنمای کاربری' : 'User Guide');

  // بازخوانی اطلاعات هنگام باز شدن مودال
  useEffect(() => {
    if (isOpen && pageKey) {
      fetchDocument();
    }
  }, [isOpen, pageKey, docType]);

  const fetchDocument = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      // استفاده از maybeSingle برای جلوگیری از ارور در صورت نبود رکورد
      const { data, error } = await supabase
        .schema('gen')
        .from('page_documents')
        .select('*')
        .eq('page_key', pageKey)
        .eq('doc_type', docType)
        .maybeSingle();

      if (error) {
        console.error("Error fetching doc:", error);
      } else {
        setCurrentDoc(data);
      }
    } catch (err) {
      console.error("System Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // محدودیت حجم (۱۰ مگابایت)
    if (file.size > 10 * 1024 * 1024) {
      alert(isRtl ? 'حجم فایل نباید بیشتر از ۱۰ مگابایت باشد.' : 'File size must be less than 10MB.');
      return;
    }

    setUploading(true);
    try {
      // ایجاد نام یکتا برای فایل
      const fileExt = file.name.split('.').pop();
      // پاکسازی نام فایل از کاراکترهای خاص
      const safePageKey = pageKey.replace(/[^a-zA-Z0-9]/g, '_');
      const fileNameInStorage = `${safePageKey}_${docType}_${Date.now()}.${fileExt}`;
      
      // ۱. آپلود فایل در Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documentation')
        .upload(fileNameInStorage, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // ۲. آماده‌سازی داده‌ها برای دیتابیس
      const docData = {
        page_key: pageKey,
        doc_type: docType,
        file_path: fileNameInStorage,
        file_name: file.name,
        content_type: file.type,
        updated_at: new Date().toISOString() // استفاده از فرمت استاندارد زمان
      };

      // ۳. آپدیت یا اینسرت در دیتابیس
      if (currentDoc && currentDoc.id) {
        // اگر قبلاً فایلی بوده، فایل قبلی را از استوریج پاک کن (اختیاری ولی تمیزتر است)
        if (currentDoc.file_path) {
           await supabase.storage.from('documentation').remove([currentDoc.file_path]);
        }
        
        const { error: updateError } = await supabase
          .schema('gen')
          .from('page_documents')
          .update(docData)
          .eq('id', currentDoc.id);
          
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .schema('gen')
          .from('page_documents')
          .insert([docData]);

        if (insertError) throw insertError;
      }

      await fetchDocument();
      alert(isRtl ? 'فایل با موفقیت آپلود شد.' : 'File uploaded successfully.');

    } catch (err) {
      console.error("Upload process error:", err);
      alert(isRtl ? 'خطا در آپلود فایل. لطفاً کنسول را چک کنید.' : 'Error uploading file. Check console.');
    } finally {
      setUploading(false);
      // پاک کردن اینپوت فایل
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    if (!confirm(isRtl ? 'آیا از حذف این سند اطمینان دارید؟' : 'Are you sure you want to delete this document?')) return;

    setUploading(true);
    try {
      // ۱. حذف از Storage
      if (currentDoc.file_path) {
        const { error: storageError } = await supabase.storage
          .from('documentation')
          .remove([currentDoc.file_path]);
        
        if (storageError) console.warn("Storage delete warning:", storageError);
      }

      // ۲. حذف از دیتابیس
      const { error: dbError } = await supabase
        .schema('gen')
        .from('page_documents')
        .delete()
        .eq('id', currentDoc.id);

      if (dbError) throw dbError;

      setCurrentDoc(null);
    } catch (err) {
      console.error(err);
      alert(isRtl ? 'خطا در حذف سند.' : 'Error deleting document.');
    } finally {
      setUploading(false);
    }
  };

  const getDownloadUrl = (path) => {
    if (!path) return '#';
    const { data } = supabase.storage.from('documentation').getPublicUrl(path);
    return data.publicUrl;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
           {docType === 'dev' ? <FileText className="text-amber-600" size={20}/> : <Book className="text-indigo-600" size={20}/>}
           <span>{title}</span>
           {Badge && <Badge variant="neutral" className="text-[10px] font-mono ltr">{pageKey}</Badge>}
        </div>
      }
      footer={
        <Button variant="outline" onClick={onClose}>
          {isRtl ? 'بستن' : 'Close'}
        </Button>
      }
    >
      <div className="space-y-6 min-h-[200px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-2">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
             <span className="text-xs">{isRtl ? 'در حال دریافت اطلاعات...' : 'Loading...'}</span>
          </div>
        ) : (
          <>
            {/* نمایش وضعیت سند */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col items-center justify-center">
              {currentDoc ? (
                <div className="w-full animate-in fade-in duration-300">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-white rounded-lg border border-slate-200 flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                       <File size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-slate-800 truncate dir-ltr text-right" title={currentDoc.file_name}>
                        {currentDoc.file_name}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        {new Date(currentDoc.updated_at).toLocaleString(isRtl ? 'fa-IR' : 'en-US')}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <a 
                      href={getDownloadUrl(currentDoc.file_path)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={`flex-1 flex items-center justify-center gap-2 h-9 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded transition-colors shadow-sm shadow-indigo-200`}
                    >
                      <Download size={14} />
                      {isRtl ? 'دانلود / مشاهده' : 'Download / View'}
                    </a>
                    
                    {isAdmin && (
                      <button 
                        onClick={handleDelete}
                        disabled={uploading}
                        className="w-9 h-9 flex items-center justify-center rounded border border-red-200 text-red-600 hover:bg-red-50 transition-colors shrink-0"
                        title={isRtl ? 'حذف سند' : 'Delete Document'}
                      >
                        {uploading ? <div className="animate-spin h-3 w-3 border-b-2 border-red-600 rounded-full"></div> : <Trash2 size={16} />}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                    <Book size={32} opacity={0.5} />
                  </div>
                  <p className="text-sm text-slate-500 mb-1">
                    {isRtl ? 'سندی برای این صفحه بارگذاری نشده است.' : 'No documentation uploaded for this page.'}
                  </p>
                </div>
              )}
            </div>

            {/* بخش آپلود (فقط برای ادمین) */}
            {isAdmin && (
              <div className="border-t border-slate-100 pt-4 animate-in slide-in-from-bottom-2">
                <div className="flex items-center gap-2 mb-3">
                   <UploadCloud size={16} className="text-slate-400" />
                   <span className="text-xs font-bold text-slate-600">
                     {currentDoc 
                       ? (isRtl ? 'جایگزینی فایل سند' : 'Replace Document File')
                       : (isRtl ? 'آپلود فایل سند جدید' : 'Upload New Document')}
                   </span>
                </div>
                
                <div className="flex gap-2 items-center">
                   <input 
                      type="file" 
                      ref={fileInputRef}
                      className="block w-full text-xs text-slate-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-xs file:font-semibold
                        file:bg-indigo-50 file:text-indigo-700
                        file:cursor-pointer hover:file:bg-indigo-100
                        cursor-pointer
                      "
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt"
                      disabled={uploading}
                   />
                   <Button 
                      variant="primary" 
                      size="sm"
                      onClick={() => fileInputRef.current && handleFileUpload({ target: fileInputRef.current })}
                      disabled={uploading}
                      className="shrink-0 h-9"
                   >
                      {uploading ? '...' : (isRtl ? 'آپلود' : 'Upload')}
                   </Button>
                </div>
                <div className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                  <AlertCircle size={10} />
                  {isRtl ? 'فرمت‌های مجاز: PDF, Word, تصویر (حداکثر ۱۰ مگابایت)' : 'Allowed: PDF, Word, Images (Max 10MB)'}
                </div>
              </div>
            )}

            {!isAdmin && !currentDoc && (
               <Callout variant="info" className="text-xs">
                  {isRtl 
                    ? 'برای دسترسی به راهنما لطفا با مدیر سیستم تماس بگیرید.' 
                    : 'Please contact system administrator for documentation.'}
               </Callout>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};

export default PageDocumentation;

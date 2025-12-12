import React, { useRef, useState } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (base64: string, mimeType: string) => void;
  isProcessing: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isProcessing }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('pdf') && !file.type.includes('image')) {
      setError("Please upload a PDF or an Image file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError("File size exceeds 10MB.");
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove Data URI prefix to get raw base64
      const base64 = result.split(',')[1];
      onFileSelect(base64, file.type);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-full max-w-xl mx-auto p-6">
      <div 
        className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer
        ${isProcessing ? 'border-blue-300 bg-blue-50 opacity-75' : 'border-slate-300 hover:border-blue-500 hover:bg-slate-50'}
        `}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept=".pdf,image/png,image/jpeg,image/webp"
          onChange={handleFileChange}
          disabled={isProcessing}
        />
        
        <div className="flex flex-col items-center gap-4">
          <div className="bg-blue-100 p-4 rounded-full text-blue-600">
            {isProcessing ? (
               <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            ) : (
              <Upload size={32} />
            )}
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-slate-800">
              {isProcessing ? "Analyzing Document..." : "Upload Bank Statement"}
            </h3>
            <p className="text-slate-500 mt-2 text-sm">
              Supports PDF, PNG, JPG (Max 10MB). <br/>
              Our AI extracts data securely in your browser.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
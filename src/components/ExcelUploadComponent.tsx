import { createSignal, onMount, For } from 'solid-js';
import { FileSpreadsheet, Upload, Check, FileCheck, AlertTriangle } from 'lucide-solid';

// Define the type for verification rules
export type VerificationRule = (file: File) => boolean | string;

type ExcelUploadProps = {
  styles?: string;
  primaryColor?: string;
  hoverColor?: string;
  successColor?: string;
  dragActiveColor?: string;
  onUpload?: (file: File) => void;
  // Custom labels
  title?: string;
  dragDropText?: string;
  orText?: string;
  selectButtonText?: string;
  fileSelectedText?: string;
  uploadButtonText?: string;
  // Verification
  verificationRules?: VerificationRule[];
};

export default function ExcelUploadComponent(props: ExcelUploadProps = {}) {
  const [fileName, setFileName] = createSignal<string>('');
  const [isDragging, setIsDragging] = createSignal<boolean>(false);
  const [selectedFile, setSelectedFile] = createSignal<File | null>(null);
  const [verificationErrors, setVerificationErrors] = createSignal<string[]>([]);
  const [isVerified, setIsVerified] = createSignal<boolean>(false);
  const [isVerifying, setIsVerifying] = createSignal<boolean>(false);
  
  let containerRef: HTMLDivElement | undefined;
  let fileInputRef: HTMLInputElement | undefined;
  
  // Default colors if not provided
  const primaryColor = () => props.primaryColor || 'text-green-600';
  const primaryBgColor = () => props.primaryColor?.replace('text-', 'bg-') || 'bg-green-600';
  const hoverBgColor = () => props.hoverColor?.replace('text-', 'bg-') || 'bg-green-700';
  const successColor = () => props.successColor || 'text-green-700';
  const successBgColor = () => props.successColor?.replace('text-', 'bg-').replace('700', '50') || 'bg-green-50';
  const successIconColor = () => props.successColor?.replace('700', '600') || 'text-green-600';
  const dragBorderColor = () => props.dragActiveColor?.replace('text-', 'border-') || 'border-green-500';
  const dragBgColor = () => props.dragActiveColor?.replace('text-', 'bg-').replace('500', '50') || 'bg-green-50';
  const errorColor = () => 'text-red-700';
  const errorBgColor = () => 'bg-red-50';
  
  // Default labels if not provided
  const title = () => props.title || 'Excel File Upload';
  const dragDropText = () => props.dragDropText || 'Drag and drop your Excel file here';
  const orText = () => props.orText || 'or';
  const selectButtonText = () => props.selectButtonText || 'Select File';
  const fileSelectedText = () => props.fileSelectedText || 'File selected:';
  const uploadButtonText = () => props.uploadButtonText || 'Verify & Upload';

  const handleFileChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      setFileName(file.name);
      setSelectedFile(file);
      setIsVerified(false);
      setVerificationErrors([]);
    }
  };

  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      // Check if it's an Excel file
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setFileName(file.name);
        setSelectedFile(file);
        setIsVerified(false);
        setVerificationErrors([]);
        // Update the file input as well
        if (fileInputRef) {
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          fileInputRef.files = dataTransfer.files;
        }
      }
    }
  };
  
  const verifyFile = () => {
    const file = selectedFile();
    if (!file) return;
    
    setIsVerifying(true);
    setVerificationErrors([]);
    
    // Run all verification rules
    if (props.verificationRules && props.verificationRules.length > 0) {
      const errors: string[] = [];
      
      // Execute each rule
      props.verificationRules.forEach(rule => {
        const result = rule(file);
        if (result !== true) {
          // If the result is a string or anything other than true, it's considered an error
          errors.push(typeof result === 'string' ? result : 'Verification failed');
        }
      });
      
      setVerificationErrors(errors);
      setIsVerified(errors.length === 0);
    } else {
      // If no rules provided, file is automatically verified
      setIsVerified(true);
    }
    
    setIsVerifying(false);
  };
  
  const handleUpload = () => {
    // First verify if not already verified
    if (!isVerified()) {
      verifyFile();
      
      // If verification failed, don't proceed with upload
      if (verificationErrors().length > 0) {
        return;
      }
    }
    
    const file = selectedFile();
    if (file && props.onUpload) {
      props.onUpload(file);
    }
  };
  
  onMount(() => {
    // Apply styles if provided by the web component
    if (props.styles && containerRef) {
      // Create a style element with the tailwind styles
      const styleEl = document.createElement('style');
      styleEl.textContent = props.styles;
      
      // Find the closest shadow root or document
      const root = containerRef.getRootNode() as ShadowRoot | Document;
      
      // If we're in a shadow DOM (web component context)
      if (root instanceof ShadowRoot) {
        // Add styles to the shadow root
        root.prepend(styleEl);
      }
    }
  });
  
  return (
    <div ref={containerRef} class="excel-upload-component">
      <div class="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md">
        <div class="flex items-center justify-center mb-4">
          <FileSpreadsheet class={`h-6 w-6 ${primaryColor()} mr-2`} />
          <h2 class={`text-xl font-bold ${primaryColor()}`}>{title()}</h2>
        </div>
        
        <div class="space-y-4">
          <div 
            class={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center ${
              isDragging() ? `${dragBorderColor()} ${dragBgColor()}` : 'border-gray-300'
            }`}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload class={`h-12 w-12 ${primaryColor()} mb-2`} />
            <p class="text-sm font-medium text-gray-700 mb-1">
              {dragDropText()}
            </p>
            <p class="text-xs text-gray-500 mb-3">{orText()}</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileChange}
              class="hidden"
              id="file-upload"
            />
            <label 
              for="file-upload"
              class={`py-2 px-4 text-sm font-medium text-white ${primaryBgColor()} rounded-md hover:${hoverBgColor()} cursor-pointer`}
            >
              {selectButtonText()}
            </label>
          </div>
          
          {fileName() && (
            <div class="space-y-3">
              <div class={`p-3 ${successBgColor()} ${successColor()} rounded-md text-sm flex items-center`}>
                <Check class={`h-5 w-5 mr-2 ${successIconColor()}`} />
                <span class="font-medium">{fileSelectedText()}</span> {fileName()}
              </div>
              
              {/* Verification Errors Section */}
              {verificationErrors().length > 0 && (
                <div class={`p-3 ${errorBgColor} ${errorColor()} rounded-md text-sm`}>
                  <div class="flex items-center mb-2">
                    <AlertTriangle class="h-5 w-5 mr-2" />
                    <span class="font-medium">Verification Issues:</span>
                  </div>
                  <ul class="list-disc pl-5 space-y-1">
                    <For each={verificationErrors()}>
                      {(error) => (
                        <li>{error}</li>
                      )}
                    </For>
                  </ul>
                </div>
              )}
              
              {/* Verification Success Message */}
              {isVerified() && (
                <div class={`p-3 ${successBgColor()} ${successColor()} rounded-md text-sm flex items-center`}>
                  <Check class={`h-5 w-5 mr-2 ${successIconColor()}`} />
                  <span class="font-medium">File verified successfully</span>
                </div>
              )}
              
              <button
                onClick={handleUpload}
                disabled={isVerifying()}
                class={`w-full py-2 px-4 flex items-center justify-center text-sm font-medium text-white 
                  ${isVerifying() ? 'bg-gray-400' : primaryBgColor()} 
                  rounded-md 
                  ${isVerifying() ? '' : `hover:${hoverBgColor()}`} 
                  transition-colors duration-200`}
              >
                <FileCheck class="h-5 w-5 mr-2" />
                {isVerifying() ? 'Verifying...' : uploadButtonText()}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
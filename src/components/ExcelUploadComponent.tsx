import * as XLSX from 'xlsx';
import { createSignal, createEffect, onMount, For } from 'solid-js';
import { FileSpreadsheet, Upload, Check, FileCheck, AlertTriangle, CheckCircle, XCircle, Loader2 } from 'lucide-solid';
import { parseExcel } from '../utils/parseExcel';
import { DropdownComponent } from './DropdownComponent';
import type { DropdownOption } from '../types';

export type ExcelUploadProps = {
  styles?: string;
  primaryColor?: string;
  hoverColor?: string;
  successColor?: string;
  dragActiveColor?: string;
  onUpload?: (file: File, dropdownValue?: string | number) => void;
  // Custom labels
  title?: string;
  dragDropText?: string;
  orText?: string;
  selectButtonText?: string;
  fileSelectedText?: string;
  verifyButtonText?: string;
  uploadButtonText?: string;
  // Success dialog texts
  successTitle?: string;
  successMessage?: string;
  uploadAnotherButtonText?: string;
  // Verification
  verificationRules?: VerificationRule[];
  // Dropdown
  dropdownOptions?: DropdownOption[];
  dropdownPlaceholder?: string;
  dropdownLabel?: string;
  dropdownRequired?: boolean;
};

/**
 * Result of a verification rule execution
 */
export interface VerificationResult {
  ok: boolean;          // true = rule passed
  message?: string;     // short headline
  details?: string[];   // extra lines, shown when ok === true
}

/**
 * Verification rule function type
 * @param ctx - Context object containing the workbook, xlsx library, and file
 * @returns A VerificationResult object
 */
export type VerificationRule = (
  ctx: { workbook: XLSX.WorkBook; xlsx: typeof XLSX; file: File }
) => VerificationResult;


// Helper functions for colors
const getColorHelpers = (props: ExcelUploadProps) => ({
  primaryColor: () => props.primaryColor || 'text-[#005DA9]',
  primaryBgColor: () => props.primaryColor?.replace('text-', 'bg-') || 'bg-[#005DA9]',
  hoverBgColor: () => props.hoverColor?.replace('text-', 'bg-') || 'bg-[#004080]',
  successColor: () => props.successColor || 'text-green-700',
  successBgColor: () => props.successColor?.replace('text-', 'bg-').replace('700', '50') || 'bg-green-50',
  successIconColor: () => props.successColor?.replace('700', '600') || 'text-green-600',
  dragBorderColor: () => props.dragActiveColor?.replace('text-', 'border-') || 'border-[#005DA9]',
  dragBgColor: () => props.dragActiveColor?.replace('text-', 'bg-').replace('500', '50') || 'bg-[#005DA9]/10',
  errorColor: () => 'text-red-700',
  errorBgColor: () => 'bg-red-50',
});

// Helper functions for text labels
const getTextHelpers = (props: ExcelUploadProps) => ({
  title: () => props.title || 'Excel File Upload',
  dragDropText: () => props.dragDropText || 'Drag and drop your Excel file here',
  orText: () => props.orText || 'or',
  selectButtonText: () => props.selectButtonText || 'Select File',
  fileSelectedText: () => props.fileSelectedText || 'File selected:',
  verifyButtonText: () => props.verifyButtonText || 'Verify File',
  uploadButtonText: () => props.uploadButtonText || 'Upload File',
  successTitle: () => props.successTitle || 'Upload Successful!',
  successMessage: () => props.successMessage || 'has been uploaded successfully.',
  uploadAnotherButtonText: () => props.uploadAnotherButtonText || 'Upload Another File',
});

export function ExcelUploadComponent(props: ExcelUploadProps = {}) {
  const [fileName, setFileName] = createSignal<string>('');
  const [isDragging, setIsDragging] = createSignal<boolean>(false);
  const [selectedFile, setSelectedFile] = createSignal<File | null>(null);
  const [verificationErrors, setVerificationErrors] = createSignal<string[]>([]);
  const [isVerified, setIsVerified] = createSignal<boolean>(false);
  const [isVerifying, setIsVerifying] = createSignal<boolean>(false);
  const [rowCount, setRowCount] = createSignal<number>(0);
  const [_parsedWorkbook, setParsedWorkbook] = createSignal<XLSX.WorkBook | null>(null);
  const [verificationInfo, setVerificationInfo] = createSignal<string[]>([]);
  const [uploadStatus, setUploadStatus] = createSignal<string>('');
  const [isUploading, setIsUploading] = createSignal<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = createSignal<boolean>(false);
  const [showSuccessDialog, setShowSuccessDialog] = createSignal<boolean>(false);
  const [selectedDropdownValue, setSelectedDropdownValue] = createSignal<string | number | undefined>(undefined);
  
  let containerRef: HTMLDivElement | undefined;
  let fileInputRef: HTMLInputElement | undefined;
  
  const colors = getColorHelpers(props);
  const text = getTextHelpers(props);

  // Keep verification rules in a reactive signal so late property assignments (e.g., from host pages)
  // are picked up by the component logic.
  const [rules, setRules] = createSignal<VerificationRule[]>(props.verificationRules || []);
  createEffect(() => {
    console.log('verificationRules prop changed:', props.verificationRules);
    setRules(props.verificationRules || []);
  });

  const handleFileChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      setFileName(file.name);
      setSelectedFile(file);
      setIsVerified(false);
      setVerificationErrors([]);
      setVerificationInfo([]);
      setUploadStatus('');
      setUploadSuccess(false);
      setIsUploading(false);
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
        setVerificationInfo([]);
        setUploadStatus('');
        setUploadSuccess(false);
        setIsUploading(false);
        // Update the file input as well
        if (fileInputRef) {
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          fileInputRef.files = dataTransfer.files;
        }
      }
    }
  };
  
  const verifyFile = async () => {
    const file = selectedFile();
    if (!file) return;

    setIsVerifying(true);
    setVerificationErrors([]);

    try {
      // Parse the Excel file
      const workbook = await parseExcel(file);
      setParsedWorkbook(workbook);

      // Calculate total rows
      let totalRows = 0;
      for (const sheetName in workbook.Sheets) {
        if (workbook.Sheets.hasOwnProperty(sheetName)) {
          const sheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          if (json.length > 1) { // Skip empty sheets
            totalRows += json.length - 1; // Subtract 1 for header
          }
        }
      }
      setRowCount(totalRows);

      // Run all verification rules
      console.log('Verification rules:', rules());
      if (rules().length > 0) {
        const results = rules().map(rule => rule({ workbook, xlsx: XLSX, file }));

        // Collect errors
        const errors = results
          .filter(r => !r.ok)
          .map(r => r.message ?? 'Verification failed');

        // Collect success details
        const successDetails = results
          .filter(r => r.ok && r.details?.length)
          .flatMap(r => r.details ?? []);

        setVerificationErrors(errors);
        setVerificationInfo(successDetails);
        setIsVerified(errors.length === 0);
      } else {
        // If no rules provided, file is automatically verified
        setIsVerified(true);
      }
    } catch (error) {
      console.error('Error verifying file:', error);
      setVerificationErrors(['Failed to verify file']);
      setIsVerified(false);
    } finally {
      setIsVerifying(false);
    }
  };
  
  const handleUploadAnother = () => {
    // Reset all state to initial values
    setFileName('');
    setSelectedFile(null);
    setIsVerified(false);
    setVerificationErrors([]);
    setVerificationInfo([]);
    setUploadStatus('');
    setUploadSuccess(false);
    setIsUploading(false);
    setShowSuccessDialog(false);
    setRowCount(0);
    setParsedWorkbook(null);
    setSelectedDropdownValue(undefined);
    
    // Clear the file input
    if (fileInputRef) {
      fileInputRef.value = '';
    }
  };

  const handleUpload = async () => {
    const file = selectedFile();
    
    // Check if dropdown is required and has value
    if (props.dropdownRequired && props.dropdownOptions && props.dropdownOptions.length > 0 && !selectedDropdownValue()) {
      setUploadStatus('Please select an option from the dropdown');
      return;
    }
    
    if (file && props.onUpload && isVerified()) {
      setIsUploading(true);
      setUploadSuccess(false);
      setUploadStatus(`Uploading ${file.name}...`);
      
      try {
        // Call the onUpload handler with dropdown value
        await props.onUpload(file, selectedDropdownValue());
        
        // Show success dialog immediately
        setUploadSuccess(true);
        setUploadStatus(`Successfully uploaded ${file.name}!`);
        setShowSuccessDialog(true);
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setUploadStatus(`Upload failed: ${errorMessage}`);
        setUploadSuccess(false);
      } finally {
        setIsUploading(false);
      }
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

  const renderHeader = () => (
    <div class="flex items-center justify-center mb-4">
      <FileSpreadsheet class={`h-6 w-6 ${colors.primaryColor()} mr-2`} />
      <h2 class={`text-xl font-bold ${colors.primaryColor()}`}>{getTextHelpers(props).title()}</h2>
    </div>
  );

  const renderDragArea = () => (
    <div 
      class={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center ${
        isDragging() ? `${colors.dragBorderColor()} ${colors.dragBgColor()}` : 'border-gray-300'
      }`}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Upload class={`h-12 w-12 ${colors.primaryColor()} mb-2`} />
      <p class="text-sm font-medium text-gray-700 mb-1">
        {getTextHelpers(props).dragDropText()}
      </p>
      <p class="text-xs text-gray-500 mb-3">{getTextHelpers(props).orText()}</p>
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
        class={`py-2 px-4 text-sm font-medium text-white ${colors.primaryBgColor()} rounded-md hover:${colors.hoverBgColor()} cursor-pointer`}
      >
        {getTextHelpers(props).selectButtonText()}
      </label>
    </div>
  );

  const renderFileStatus = () => fileName() && (
    <div class="space-y-3">
      <div class={`p-3 ${colors.successBgColor()} ${colors.successColor()} rounded-md text-sm flex items-center`}>
        <Check class={`h-5 w-5 mr-2 ${colors.successIconColor()}`} />
        <span class="font-medium">{getTextHelpers(props).fileSelectedText()}</span> {fileName()}
      </div>
      
      {/* Verification Errors Section */}
      {verificationErrors().length > 0 && (
        <div class={`p-3 ${colors.errorBgColor} ${colors.errorColor()} rounded-md text-sm`}>
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
        <div class={`p-3 ${colors.successBgColor()} ${colors.successColor()} rounded-md text-sm`}>
          <div class="flex items-center mb-2">
            <FileCheck class={`h-5 w-5 mr-2 ${colors.successIconColor()}`} />
            <span class="font-medium">File verified successfully – {rowCount()} rows</span>
          </div>
          {verificationInfo().length > 0 && (
            <ul class="list-disc pl-7 space-y-1">
              <For each={verificationInfo()}>
                {(line) => <li>{line}</li>}
              </For>
            </ul>
          )}
        </div>
      )}
      
      {/* Verify Button - shown when file is selected but not verified */}
      {!isVerified() && (
        <button
          onClick={verifyFile}
          disabled={isVerifying()}
          class={`w-full py-2 px-4 flex items-center justify-center text-sm font-medium text-white 
            ${isVerifying() ? 'bg-gray-400' : colors.primaryBgColor()} 
            rounded-md 
            ${isVerifying() ? '' : `hover:${colors.hoverBgColor()}`} 
            transition-colors duration-200
            cursor-pointer`}
        >
          <Check class="h-5 w-5 mr-2" />
          {isVerifying() ? 'Verifying...' : getTextHelpers(props).verifyButtonText()}
        </button>
      )}
      
      {/* Upload Button - shown only after successful verification */}
      {isVerified() && (
        <>
          {/* Show message if dropdown is required but not selected */}
          {props.dropdownRequired && props.dropdownOptions && props.dropdownOptions.length > 0 && !selectedDropdownValue() && (
            <div class="p-2 bg-amber-50 text-amber-700 rounded-md text-sm flex items-center">
              <AlertTriangle class="h-4 w-4 mr-2 flex-shrink-0" />
              <span>Please select {props.dropdownLabel?.toLowerCase() || 'an option'} before uploading</span>
            </div>
          )}
          
          <button
            onClick={handleUpload}
            disabled={isUploading() || (props.dropdownRequired && props.dropdownOptions && props.dropdownOptions.length > 0 && !selectedDropdownValue())}
            class={`w-full py-2 px-4 flex items-center justify-center text-sm font-medium text-white 
              ${isUploading() || (props.dropdownRequired && props.dropdownOptions && props.dropdownOptions.length > 0 && !selectedDropdownValue()) 
                ? 'bg-gray-400 cursor-not-allowed' 
                : `${colors.primaryBgColor()} hover:${colors.hoverBgColor()} cursor-pointer`} 
              rounded-md 
              transition-colors duration-200`}
          >
            <Upload class="h-5 w-5 mr-2" />
            {isUploading() ? 'Uploading...' : getTextHelpers(props).uploadButtonText()}
          </button>
        </>
      )}
      
      {/* Upload Status - shown when there's a status message */}
      {uploadStatus() && (
        <div class={`p-3 rounded-md text-sm flex items-center mt-3 ${
          uploadSuccess() 
            ? `${colors.successBgColor()} ${colors.successColor()}` 
            : isUploading() 
              ? 'bg-blue-50 text-blue-700' 
              : 'bg-red-50 text-red-700'
        }`}>
          {uploadSuccess() ? (
            <CheckCircle class="h-4 w-4 mr-2 flex-shrink-0" />
          ) : isUploading() ? (
            <Loader2 class="h-4 w-4 mr-2 flex-shrink-0 animate-spin" />
          ) : (
            <XCircle class="h-4 w-4 mr-2 flex-shrink-0" />
          )}
          <span>{uploadStatus()}</span>
        </div>
      )}
    </div>
  );

  const renderSuccessDialog = () => (
    <div class="text-center space-y-6 animate-in fade-in duration-500">
      <div class="flex justify-center">
        <div class="relative">
          <CheckCircle class={`h-20 w-20 ${colors.successColor()} animate-in zoom-in duration-700 delay-200`} />
          <div class="absolute inset-0 rounded-full animate-ping bg-green-200 opacity-20"></div>
        </div>
      </div>
      
      <div class="space-y-2">
        <h2 class={`text-2xl font-bold ${colors.successColor()}`}>{text.successTitle()}</h2>
        <p class="text-gray-600">
          Your file <span class="font-medium">{fileName()}</span> {text.successMessage()}
        </p>
      </div>
      
      <button
        onClick={handleUploadAnother}
        class={`w-full py-3 px-6 flex items-center justify-center text-sm font-medium text-white 
          ${colors.primaryBgColor()} 
          rounded-md 
          hover:${colors.hoverBgColor()} 
          transition-colors duration-200
          cursor-pointer`}
      >
        <Upload class="h-5 w-5 mr-2" />
        {text.uploadAnotherButtonText()}
      </button>
    </div>
  );
  
  return (
    <div ref={containerRef} class="excel-upload-component flex justify-center items-center">
      <div class="p-8 max-w-lg w-full bg-white rounded-2xl drop-shadow-2xl border border-[#005DA9]/20 overflow-visible">
        {showSuccessDialog() ? (
          renderSuccessDialog()
        ) : (
          <div class="space-y-4 overflow-visible">
            {renderHeader()}
            {renderDragArea()}
            
            {/* Dropdown Section - Always visible when options are defined */}
            {props.dropdownOptions && props.dropdownOptions.length > 0 && (
              <DropdownComponent
                options={props.dropdownOptions}
                placeholder={props.dropdownPlaceholder}
                label={props.dropdownLabel}
                required={props.dropdownRequired}
                value={selectedDropdownValue()}
                onChange={setSelectedDropdownValue}
                primaryColor={colors.primaryColor()}
                hoverColor={colors.hoverBgColor()}
              />
            )}
            
            {renderFileStatus()}
          </div>
        )}
      </div>
    </div>
  );
}
import { createSignal, onMount } from 'solid-js';

type ExcelUploadProps = {
  styles?: string;
};

export default function ExcelUploadComponent(props: ExcelUploadProps = {}) {
  const [fileName, setFileName] = createSignal<string>('');
  let containerRef: HTMLDivElement | undefined;
  
  const handleFileChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      setFileName(file.name);
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
          <h2 class="text-xl font-bold text-blue-600">Excel File Upload</h2>
        </div>
        
        <div class="space-y-4">
          <div class="flex flex-col">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Select Excel File
            </label>
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileChange}
              class="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
            />
          </div>
          
          {fileName() && (
            <div class="mt-2 p-2 bg-green-50 text-green-700 rounded-md text-sm">
              File selected: {fileName()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
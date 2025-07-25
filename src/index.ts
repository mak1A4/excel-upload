import { customElement } from 'solid-element';
import { ExcelUploadComponent, VerificationRule, ExcelUploadProps} from './components/ExcelUploadComponent';
import { DropdownOption } from './types';
import styles from './styles.css';

// Central definition of web component properties
const webComponentProps = {
  // Complex props
  verificationRules: [],
  onUpload: undefined,
  // Basic props with defaults
  title: 'Excel File Upload',
  primaryColor: 'text-[#005DA9]',
  hoverColor: 'text-[#004080]',
  successColor: 'text-green-700',
  dragActiveColor: 'text-[#005DA9]',
  dragDropText: '',
  orText: '',
  selectButtonText: '',
  fileSelectedText: '',
  verifyButtonText: '',
  uploadButtonText: '',
  successTitle: '',
  successMessage: '',
  uploadAnotherButtonText: '',
  // Dropdown props
  dropdownOptions: [],
  dropdownPlaceholder: '',
  dropdownLabel: '',
  dropdownRequired: false,
} as const;

// Helper function to map props (excluding styles which is internal)
function mapPropsToComponent(props: any): ExcelUploadProps {
  const mappedProps: any = { styles };
  
  // Automatically map all defined props
  Object.keys(webComponentProps).forEach(key => {
    if (key in props) {
      mappedProps[key] = props[key];
    }
  });
  
  return mappedProps;
}

// Register the web component with injected styles and default props
customElement(
  'excel-upload',
  webComponentProps,
  (props) => {
    return ExcelUploadComponent(mapPropsToComponent(props));
  },
);

// Export the component for direct usage
export { ExcelUploadComponent, VerificationRule, DropdownOption }; 
import { customElement } from 'solid-element';
import ExcelUploadComponent from './components/ExcelUploadComponent';
import styles from './styles.css';

// Register the web component with injected styles
customElement('excel-upload', {}, (props) => {
  return ExcelUploadComponent({ ...props, styles });
});

// Export the component for direct usage
export { ExcelUploadComponent }; 
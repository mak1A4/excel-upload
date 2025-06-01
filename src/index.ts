import { customElement } from 'solid-element';
import ExcelUploadComponent from './components/ExcelUploadComponent';
import styles from './styles.css';

// Register the web component with injected styles
customElement('excel-upload', {title: ""}, (props) => {
  return ExcelUploadComponent({
    styles,
    title: props.title,
   });
});

// Export the component for direct usage
export { ExcelUploadComponent }; 
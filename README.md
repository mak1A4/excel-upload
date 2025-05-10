# Excel Upload Web Component

A reusable Excel file upload web component built with SolidJS and TailwindCSS.

## Installation

```bash
npm install excel-upload
# or
pnpm add excel-upload
# or
yarn add excel-upload
```

## Usage

### As a Web Component

```html
<script type="module">
  import 'excel-upload';
</script>

<excel-upload></excel-upload>
```

### As a SolidJS Component

```jsx
import { ExcelUploadComponent } from 'excel-upload';

function App() {
  return (
    <div>
      <ExcelUploadComponent />
    </div>
  );
}
```

## Development

1. Clone this repository
2. Install dependencies: `pnpm install`
3. Start the development server: `pnpm dev`
4. Open your browser at: `http://localhost:8000`

## Building

```bash
pnpm build
```

## License

ISC 
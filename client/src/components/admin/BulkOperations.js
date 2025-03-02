import React, { useState } from 'react';
import { useNotification } from '../../context/NotificationContext';
import * as XLSX from 'xlsx-js-style';

const BulkOperations = ({ onImport, templateFields, entityName }) => {
  const [importing, setImporting] = useState(false);
  const { showNotification } = useNotification();

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setImporting(true);
      const data = await readExcelFile(file);
      
      // Validate data structure
      const isValid = validateData(data);
      if (!isValid) {
        showNotification('error', 'Invalid file format. Please use the template.');
        return;
      }

      await onImport(data);
      showNotification('success', `${entityName} data imported successfully`);
    } catch (error) {
      showNotification('error', `Failed to import ${entityName} data`);
      console.error(error);
    } finally {
      setImporting(false);
      event.target.value = null; // Reset file input
    }
  };

  const readExcelFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const workbook = XLSX.read(e.target.result, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json(worksheet);
          resolve(data);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsBinaryString(file);
    });
  };

  const validateData = (data) => {
    if (!Array.isArray(data) || data.length === 0) return false;
    
    // Check if all required fields are present
    const requiredFields = templateFields.filter(field => field.required);
    return data.every(row => 
      requiredFields.every(field => 
        row.hasOwnProperty(field.header)
      )
    );
  };

  const downloadTemplate = () => {
    // Create template worksheet
    const ws = XLSX.utils.json_to_sheet([
      templateFields.reduce((acc, field) => {
        acc[field.header] = field.example || '';
        return acc;
      }, {})
    ]);

    // Add validation rules as notes
    const validationNotes = templateFields.map(field => ({
      ref: XLSX.utils.encode_cell({ r: 0, c: templateFields.indexOf(field) }),
      text: `${field.header}${field.required ? ' (Required)' : ''}\n${field.description || ''}`
    }));

    ws['!notes'] = validationNotes.reduce((acc, note) => {
      acc[note.ref] = { t: note.text };
      return acc;
    }, {});

    // Create workbook and download
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, `${entityName.toLowerCase()}_template.xlsx`);
  };

  return (
    <div className="bulk-operations">
      <div className="bulk-import">
        <h3>Bulk Import {entityName}s</h3>
        <div className="import-controls">
          <button 
            className="template-btn" 
            onClick={downloadTemplate}
          >
            Download Template
          </button>
          <div className="file-upload">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              disabled={importing}
              id="file-upload"
            />
            <label htmlFor="file-upload" className={importing ? 'disabled' : ''}>
              {importing ? 'Importing...' : 'Choose File'}
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkOperations; 
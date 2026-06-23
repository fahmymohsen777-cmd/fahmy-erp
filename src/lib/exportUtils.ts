import * as XLSX from 'xlsx';
import { formatCurrency, formatDate } from './utils';

/**
 * Utility to export an array of JSON objects to an Excel file
 */
export function exportToExcel(data: any[], filename: string) {
  if (!data || data.length === 0) {
    alert('لا توجد بيانات للتصدير');
    return;
  }
  
  // Create a new workbook
  const wb = XLSX.utils.book_new();
  // Convert JSON data to worksheet
  const ws = XLSX.utils.json_to_sheet(data);

  // Auto size columns (approximate)
  const colWidths = Object.keys(data[0]).map(k => ({ wch: Math.max(k.length, 15) }));
  ws['!cols'] = colWidths;

  // Append worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  
  // Write to file
  XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
}

/**
 * Utility to print a specific component or general data to PDF
 * It opens a print window configured for Arabic RTL formatting
 */
export function printToPDF(title: string, columns: { header: string; key: string; format?: 'currency' | 'date' }[], data: any[]) {
  if (!data || data.length === 0) {
    alert('لا توجد بيانات للطباعة');
    return;
  }

  const printWindow = window.open('', '', 'width=900,height=650');
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
        body {
          font-family: 'Inter', system-ui, sans-serif;
          margin: 0;
          padding: 2rem;
          color: #111;
          background: #fff;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          border-bottom: 2px solid #f59e0b;
          padding-bottom: 1rem;
        }
        .header h1 {
          margin: 0;
          font-size: 1.8rem;
          color: #f97316;
        }
        .date {
          color: #555;
          font-size: 0.9rem;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 2rem;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 0.75rem;
          text-align: right;
          font-size: 0.9rem;
        }
        th {
          background-color: #f9fafb;
          font-weight: 600;
          color: #333;
        }
        tr:nth-child(even) {
          background-color: #fafafa;
        }
        @media print {
          @page { margin: 1cm; size: A4 landscape; }
          body { -webkit-print-color-adjust: exact; padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${title}</h1>
        <div class="date">تاريخ الطباعة: ${new Date().toLocaleDateString('ar-EG')}</div>
      </div>
      <table>
        <thead>
          <tr>
            ${columns.map(col => `<th>${col.header}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map(row => `
            <tr>
              ${columns.map(col => {
                let val = row[col.key];
                if (col.format === 'currency') val = formatCurrency(Number(val || 0));
                if (col.format === 'date') val = formatDate(val);
                return `<td>${val ?? ''}</td>`;
              }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
      <script>
        window.onload = () => {
          window.print();
          // Optional: setTimeout(() => window.close(), 500);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

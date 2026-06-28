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

/**
 * Utility to print a real invoice for a single order
 */
export function printOrderInvoice(order: any) {
  const printWindow = window.open('', '', 'width=800,height=800');
  if (!printWindow) return;

  // Calculate totals
  const totalQty = order.items?.reduce((s: number, i: any) => s + Number(i.quantity), 0) || 0;
  const subTotal = order.total_amount;
  const oldDebt = order.customer?.balance?.outstanding_balance || 0; // If available, otherwise omit or pass separately
  
  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>فاتورة مبيعات - ${order.order_number}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
        body {
          font-family: 'Cairo', sans-serif;
          margin: 0;
          padding: 20px;
          color: #000;
          background: #fff;
        }
        .invoice-container {
          max-width: 800px;
          margin: 0 auto;
          border: 1px solid #ddd;
          padding: 2rem;
          border-radius: 8px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #000;
          padding-bottom: 1rem;
          margin-bottom: 2rem;
        }
        .header-logo {
          font-size: 2rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .header-info {
          text-align: left;
        }
        .title {
          text-align: center;
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 2rem;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 2rem;
        }
        .details-box {
          background: #f9fafb;
          padding: 1rem;
          border-radius: 6px;
          border: 1px solid #eee;
        }
        .details-box h3 {
          margin: 0 0 10px 0;
          font-size: 1.1rem;
          border-bottom: 1px solid #ddd;
          padding-bottom: 5px;
        }
        .details-box p {
          margin: 5px 0;
          font-size: 0.95rem;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 2rem;
        }
        th, td {
          border: 1px solid #000;
          padding: 10px;
          text-align: right;
        }
        th {
          background: #f3f4f6;
          font-weight: 700;
        }
        .totals-box {
          width: 50%;
          margin-right: auto;
        }
        .totals-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          font-size: 1.1rem;
          border-bottom: 1px dashed #ddd;
        }
        .totals-row.grand-total {
          font-weight: 800;
          font-size: 1.3rem;
          border-bottom: none;
          border-top: 2px solid #000;
          margin-top: 5px;
          padding-top: 10px;
        }
        .footer {
          margin-top: 4rem;
          text-align: center;
          font-size: 0.9rem;
          color: #555;
          border-top: 1px solid #ddd;
          padding-top: 1rem;
        }
        @media print {
          body { padding: 0; background: #fff; -webkit-print-color-adjust: exact; }
          .invoice-container { border: none; padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <div class="header">
          <div class="header-logo">
            <span>نظام إدارة التوزيع</span>
          </div>
          <div class="header-info">
            <p style="margin: 2px 0;">التاريخ: ${formatDate(order.created_at || new Date())}</p>
            <p style="margin: 2px 0;">تاريخ التوصيل: ${formatDate(order.delivery_date)}</p>
          </div>
        </div>

        <div class="title">فاتورة مبيعات - رقم ${order.order_number || order.id?.slice(0,6).toUpperCase()}</div>

        <div class="details-grid" style="grid-template-columns: 1fr;">
          <div class="details-box">
            <h3>بيانات العميل</h3>
            <p><strong>اسم الكافيه:</strong> ${order.customer?.cafe_name || 'غير محدد'}</p>
            <p><strong>اسم المالك:</strong> ${order.customer?.owner_name || 'غير محدد'}</p>
            <p><strong>العنوان:</strong> ${order.customer?.address || 'غير محدد'}</p>
            <p><strong>رقم الهاتف:</strong> ${order.customer?.phone || 'غير محدد'}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 50px;">م</th>
              <th>الصنف (نوع الفحم)</th>
              <th style="width: 100px;">الكمية (شيكارة)</th>
              <th style="width: 150px;">السعر</th>
              <th style="width: 150px;">المجموع</th>
            </tr>
          </thead>
          <tbody>
            ${(order.items || []).map((item: any, idx: number) => `
              <tr>
                <td style="text-align: center;">${idx + 1}</td>
                <td>فحم ${item.charcoal_type === 'citrus' ? 'موالح' : item.charcoal_type === 'mango' ? 'مانجو' : item.charcoal_type === 'guava' ? 'جوافة' : item.charcoal_type === 'mixed' ? 'مختلط' : item.charcoal_type}</td>
                <td style="text-align: center;">${item.quantity}</td>
                <td>${formatCurrency(Number(item.price_per_unit || 0))}</td>
                <td style="font-weight: 600;">${formatCurrency(Number(item.total_price || (item.quantity * (item.price_per_unit || 0))))}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals-box">
          <div class="totals-row">
            <span>إجمالي الكمية:</span>
            <span>${totalQty} شيكارة</span>
          </div>
          <div class="totals-row grand-total">
            <span>إجمالي الفاتورة:</span>
            <span>${formatCurrency(subTotal)}</span>
          </div>
        </div>

        <div class="footer">
          <p>توقيع العميل: .......................................</p>
          <p style="margin-top: 20px;">شكراً لتعاملكم معنا - نظام فحم لإدارة التوزيع</p>
        </div>
      </div>
      <script>
        window.onload = () => {
          setTimeout(() => {
            window.print();
          }, 300);
        };
      </script>
    </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
}

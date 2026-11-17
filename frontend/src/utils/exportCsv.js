/**
 * Utility to export JavaScript array of objects to downloadable CSV file.
 * Completely lightweight, zero external libraries.
 */
export const exportToCsv = (filename, data, headers) => {
  if (!data || !data.length) {
    alert('No data available to export.');
    return;
  }

  // Determine headers
  const columnKeys = headers ? Object.keys(headers) : Object.keys(data[0]);
  const columnTitles = headers ? Object.values(headers) : columnKeys;

  // Build CSV content
  const csvRows = [];
  csvRows.push(columnTitles.map((t) => `"${String(t).replace(/"/g, '""')}"`).join(','));

  data.forEach((item) => {
    const row = columnKeys.map((key) => {
      const val = key.split('.').reduce((acc, part) => acc && acc[part], item);
      const formatted = val === null || val === undefined ? '' : String(val);
      return `"${formatted.replace(/"/g, '""')}"`;
    });
    csvRows.push(row.join(','));
  });

  const csvString = '\uFEFF' + csvRows.join('\r\n'); // BOM for Excel UTF-8 support
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};


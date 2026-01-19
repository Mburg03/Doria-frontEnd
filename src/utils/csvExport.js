/**
 * Utility to export data to CSV and trigger download
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Desired name for the file
 * @param {Array} headers - Optional array of { key: string, label: string }
 */
export const exportToCSV = (data, filename = 'export.csv', headers = null) => {
    if (!data || !data.length) return;

    // Use headers or auto-generate from keys
    const headerKeys = headers ? headers.map(h => h.key) : Object.keys(data[0]);
    const headerLabels = headers ? headers.map(h => h.label) : headerKeys;

    const csvRows = [];

    // 1. Add BOM for Excel UTF-8 compatibility
    csvRows.push('\ufeff');

    // 2. Add Header
    csvRows.push(headerLabels.join(','));

    // 3. Add Rows
    for (const row of data) {
        const values = headerKeys.map(key => {
            let val = row[key];
            if (val === null || val === undefined) val = '';

            // Escape for CSV (quotes and commas)
            const escaped = String(val).replace(/"/g, '""');
            return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
    }

    // 4. Create Blob and Download
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

const { Parser } = require('json2csv');
const { parse } = require('csv-parse/sync');

/**
 * Converts an array of vendor objects to a CSV string.
 * @param {Array} vendors
 * @returns {string} CSV content
 */
function vendorsToCSV(vendors) {
  const fields = [
    { label: 'ID', value: 'id' },
    { label: 'Name', value: 'name' },
    { label: 'Category', value: 'category' },
    { label: 'Data Sensitivity', value: 'dataSensitivity' },
    { label: 'Has Compliance Cert', value: (row) => row.hasCompliance ? 'Yes' : 'No' },
    { label: 'Breach History', value: (row) => row.hasBreachHistory ? 'Yes' : 'No' },
    { label: 'Approved by IT', value: (row) => row.approvedByIT ? 'Yes' : 'No' },
    { label: 'Risk Score', value: 'riskScore' },
    { label: 'Risk Level', value: 'riskLevel' },
    { label: 'Shadow / Unapproved', value: (row) => row.isShadow ? 'Yes' : 'No' },
    { label: 'Notes', value: 'notes' },
    { label: 'Created At', value: 'createdAt' },
  ];

  const parser = new Parser({ fields });
  return parser.parse(vendors);
}

/**
 * Parses CSV buffer/string into vendor-compatible objects.
 * @param {Buffer|string} csvContent
 * @returns {Array} Array of parsed vendor rows
 */
function parseVendorCSV(csvContent) {
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  return records.map((row) => {
    const yes = (val) => val && val.toLowerCase() === 'yes';

    return {
      name: row['name'] || row['Name'] || '',
      category: row['category'] || row['Category'] || 'Other',
      dataSensitivity: row['dataSensitivity'] || row['Data Sensitivity'] || 'Low',
      hasCompliance: yes(row['hasCompliance'] || row['Has Compliance Cert']),
      hasBreachHistory: yes(row['hasBreachHistory'] || row['Breach History']),
      approvedByIT: yes(row['approvedByIT'] || row['Approved by IT']),
      notes: row['notes'] || row['Notes'] || null,
    };
  }).filter((v) => v.name); // skip rows with no name
}

module.exports = { vendorsToCSV, parseVendorCSV };

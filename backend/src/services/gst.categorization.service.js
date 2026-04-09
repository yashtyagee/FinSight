/**
 * GST Categorization Service
 * Automatically determines:
 * - CGST + SGST (intra-state) vs IGST (inter-state)
 * - B2B vs B2C
 * - Splits tax amounts accordingly
 */

// Indian state codes from GSTIN first 2 digits
const STATE_CODES = {
  '01': 'Jammu & Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab',
  '04': 'Chandigarh',      '05': 'Uttarakhand',      '06': 'Haryana',
  '07': 'Delhi',           '08': 'Rajasthan',         '09': 'Uttar Pradesh',
  '10': 'Bihar',           '11': 'Sikkim',            '12': 'Arunachal Pradesh',
  '13': 'Nagaland',        '14': 'Manipur',           '15': 'Mizoram',
  '16': 'Tripura',         '17': 'Meghalaya',         '18': 'Assam',
  '19': 'West Bengal',     '20': 'Jharkhand',         '21': 'Odisha',
  '22': 'Chhattisgarh',    '23': 'Madhya Pradesh',    '24': 'Gujarat',
  '25': 'Daman & Diu',     '26': 'Dadra & Nagar Haveli', '27': 'Maharashtra',
  '28': 'Andhra Pradesh',  '29': 'Karnataka',         '30': 'Goa',
  '31': 'Lakshadweep',     '32': 'Kerala',            '33': 'Tamil Nadu',
  '34': 'Puducherry',      '35': 'Andaman & Nicobar', '36': 'Telangana',
  '37': 'Andhra Pradesh (New)', '38': 'Ladakh',
  '96': 'Foreign',         '97': 'Other Territory',   '99': 'Centre Jurisdiction',
};

/**
 * Extracts the 2-digit state code from a valid GSTIN.
 * GSTIN Format: [2-digit state][10-digit PAN][1-digit entity][Z][1-digit checksum]
 */
const getStateCodeFromGSTIN = (gstin) => {
  if (!gstin || typeof gstin !== 'string') return null;
  const cleaned = gstin.trim().toUpperCase().replace(/\s/g, '');
  if (cleaned.length >= 2) {
    const code = cleaned.substring(0, 2);
    return STATE_CODES[code] ? code : null;
  }
  return null;
};

const getStateName = (code) => STATE_CODES[code] || 'Unknown';

/**
 * Validates GSTIN format with regex.
 */
const isValidGSTIN = (gstin) => {
  if (!gstin) return false;
  const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;
  return regex.test(gstin.trim());
};

/**
 * Main categorization function.
 * 
 * @param {object} invoiceData - Extracted invoice fields
 * @param {string} companyGSTIN - The buyer's (company using FinSight) GSTIN
 * @returns {object} GST classification result
 */
const categorizeGST = (invoiceData, companyGSTIN = null) => {
  const vendorGSTIN    = invoiceData.gstin;
  const totalTax       = parseFloat(invoiceData.tax || 0);
  const totalAmount    = parseFloat(invoiceData.amount || 0);
  const taxableValue   = parseFloat(invoiceData.taxable_value || (totalAmount - totalTax));

  // ── B2B vs B2C ────────────────────────────────────────────────────────────
  // B2B: vendor has valid GSTIN (they are a registered business)
  const isB2B = isValidGSTIN(vendorGSTIN);
  const transactionType = isB2B ? 'B2B' : 'B2C';

  // ── CGST+SGST vs IGST ────────────────────────────────────────────────────
  const vendorStateCode  = getStateCodeFromGSTIN(vendorGSTIN);
  const buyerStateCode   = getStateCodeFromGSTIN(companyGSTIN);

  let gstType, cgst, sgst, igst;
  let reason = '';

  if (vendorStateCode && buyerStateCode) {
    if (vendorStateCode === buyerStateCode) {
      // Intra-state supply → CGST + SGST (split equally)
      gstType = 'CGST_SGST';
      cgst    = parseFloat((totalTax / 2).toFixed(2));
      sgst    = parseFloat((totalTax - cgst).toFixed(2)); // handles rounding
      igst    = 0;
      reason  = `Same state (${getStateName(vendorStateCode)}) → Intra-state supply`;
    } else {
      // Inter-state supply → IGST
      gstType = 'IGST';
      cgst    = 0;
      sgst    = 0;
      igst    = totalTax;
      reason  = `Different states (Vendor: ${getStateName(vendorStateCode)}, Buyer: ${getStateName(buyerStateCode)}) → Inter-state supply`;
    }
  } else if (!vendorStateCode && !buyerStateCode) {
    // Neither GSTIN available → can't determine, default CGST+SGST as local
    gstType = 'CGST_SGST';
    cgst    = parseFloat((totalTax / 2).toFixed(2));
    sgst    = parseFloat((totalTax - cgst).toFixed(2));
    igst    = 0;
    reason  = 'No GSTINs available — defaulted to intra-state';
  } else {
    // Only one GSTIN available — assume local/intra-state
    gstType = 'CGST_SGST';
    cgst    = parseFloat((totalTax / 2).toFixed(2));
    sgst    = parseFloat((totalTax - cgst).toFixed(2));
    igst    = 0;
    reason  = 'Partial GSTIN data — assumed intra-state';
  }

  return {
    transaction_type:  transactionType,
    gst_type:          gstType,
    taxable_value:     parseFloat(taxableValue.toFixed(2)),
    cgst_amount:       cgst,
    sgst_amount:       sgst,
    igst_amount:       igst,
    vendor_state:      vendorStateCode ? getStateName(vendorStateCode) : null,
    vendor_state_code: vendorStateCode,
    buyer_state:       buyerStateCode  ? getStateName(buyerStateCode)  : null,
    buyer_state_code:  buyerStateCode,
    buyer_gstin:       companyGSTIN    || null,
    is_valid_vendor_gstin: isB2B,
    gst_reason:        reason,
  };
};

module.exports = { categorizeGST, getStateCodeFromGSTIN, isValidGSTIN, STATE_CODES };

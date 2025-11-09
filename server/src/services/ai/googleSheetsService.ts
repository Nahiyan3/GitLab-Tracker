// Google Sheets Service - handles downloading Google Sheets as Excel
import axios from 'axios';

class GoogleSheetsService {
  /**
   * Extract spreadsheet ID from Google Sheets URL
   * @param url - Google Sheets URL
   * @returns Spreadsheet ID
   */
  extractSpreadsheetId(url: string): string {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) {
      throw new Error('Invalid Google Sheets URL');
    }
    return match[1];
  }

  /**
   * Download Google Sheets as Excel (XLSX)
   * @param spreadsheetUrl - Full Google Sheets URL
   * @returns Base64 encoded Excel file
   */
  async downloadAsExcel(spreadsheetUrl: string): Promise<string> {
    try {
      const spreadsheetId = this.extractSpreadsheetId(spreadsheetUrl);
      
      // Google Sheets export URL for Excel format
      const exportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=xlsx`;
      
      console.log(`📥 Downloading Google Sheet: ${spreadsheetId}`);
      
      const response = await axios.get(exportUrl, {
        responseType: 'arraybuffer',
        timeout: 30000, // 30 seconds timeout
      });

      // Convert to base64
      const base64 = Buffer.from(response.data).toString('base64');
      
      console.log(`✅ Successfully downloaded Google Sheet (${(base64.length / 1024).toFixed(2)} KB)`);
      
      return base64;
    } catch (error: any) {
      console.error('❌ Failed to download Google Sheet:', error.message);
      throw new Error(`Failed to download Google Sheet: ${error.message}`);
    }
  }
}

export default new GoogleSheetsService();

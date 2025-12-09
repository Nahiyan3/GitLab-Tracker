// Gemini AI Service - handles interactions with Google Gemini API
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as XLSX from 'xlsx';
import { getLatestSnapshotByProjectName } from '../../db/queries';

class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private initialized: boolean = false;

  /**
   * Initialize the Gemini AI service (lazy initialization)
   */
  private initialize() {
    if (this.initialized) return;
    
    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) {
      console.warn('⚠️ GEMINI_API_KEY is not set in environment variables');
    } else {
      this.genAI = new GoogleGenerativeAI(apiKey);
      console.log('✅ Gemini AI service initialized');
    }
    this.initialized = true;
  }

  /**
   * Send a text prompt to Gemini and get response with retry logic
   */
  async generateTextResponse(prompt: string, maxRetries: number = 3): Promise<string> {
    this.initialize(); // Ensure initialization
    
    if (!this.genAI) {
      throw new Error('Gemini API key not configured');
    }

    let lastError: any;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}/${maxRetries} to call Gemini API...`);
        const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const result = await model.generateContent(prompt);
        const response = result.response;
        console.log('✅ Gemini API call successful');
        return response.text();
      } catch (error: any) {
        lastError = error;
        console.error(`❌ Gemini API error (attempt ${attempt}/${maxRetries}):`, error.message);
        
        // If it's a fetch error and we have retries left, wait and retry
        if (attempt < maxRetries && (error.message.includes('fetch failed') || error.message.includes('ECONNRESET'))) {
          const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
          console.log(`⏳ Waiting ${waitTime/1000}s before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else if (attempt === maxRetries) {
          // Last attempt failed
          break;
        }
      }
    }
    
    throw new Error(`Failed to generate response after ${maxRetries} attempts: ${lastError.message}`);
  }

  /**
   * Send a prompt with a file (XLSX, PDF, etc.) to Gemini and get response
   * @param prompt - The text prompt
   * @param fileBase64 - Base64 encoded file content
   * @param mimeType - MIME type of the file
   */
  async generateResponseWithFile(
    prompt: string,
    fileBase64: string,
    mimeType: string
  ): Promise<string> {
    this.initialize(); // Ensure initialization
    
    if (!this.genAI) {
      throw new Error('Gemini API key not configured');
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const filePart = {
        inlineData: {
          data: fileBase64,
          mimeType: mimeType,
        },
      };

      const result = await model.generateContent([prompt, filePart]);
      const response = result.response;
      return response.text();
    } catch (error: any) {
      console.error('❌ Gemini API error with file:', error.message);
      throw new Error(`Failed to generate response with file: ${error.message}`);
    }
  }

  /**
   * Extract project name from Excel sheets
   * @param sheets - Parsed Excel sheets data
   * @returns Project name if found, null otherwise
   */
  private extractProjectNameFromExcel(sheets: { [key: string]: any[] }): string | null {
    // Search for project name in all sheets
    for (const sheetName in sheets) {
      const sheetData = sheets[sheetName];
      for (const row of sheetData) {
        // Look for common field names that might contain project name
        if (row['Project Name'] || row['project_name'] || row['ProjectName'] || 
            row['Project'] || row['project'] || row['Name'] || row['name']) {
          const projectName = row['Project Name'] || row['project_name'] || row['ProjectName'] || 
                              row['Project'] || row['project'] || row['Name'] || row['name'];
          return projectName;
        }
      }
    }
    return null;
  }

  /**
   * Fetch project snapshot data by project name
   * @param projectName - Name of the project
   * @returns Project snapshot data or null if not found
   */
  private async fetchProjectSnapshot(projectName: string): Promise<any | null> {
    console.log(`🔍 Found project name in Excel: ${projectName}`);
    try {
      const projectSnapshot = await getLatestSnapshotByProjectName(projectName);
      if (projectSnapshot) {
        console.log(`✅ Found project snapshot for: ${projectName}`);
        return projectSnapshot;
      } else {
        console.log(`⚠️ No snapshot found for project: ${projectName}`);
        return null;
      }
    } catch (error: any) {
      console.error(`❌ Error fetching snapshot for ${projectName}:`, error.message);
      return null;
    }
  }

  /**
   * Build enhanced prompt with Excel data and optional project snapshot
   * @param userPrompt - Original user prompt
   * @param sheets - Parsed Excel sheets
   * @param projectSnapshot - Optional project snapshot data
   * @returns Enhanced prompt string
   */
  private buildEnhancedPrompt(
    userPrompt: string,
    sheets: { [key: string]: any[] },
    projectSnapshot: any | null
  ): string {
    const excelDataString = JSON.stringify(sheets, null, 2);
    let enhancedPrompt = `${userPrompt}\n\n## Excel Data (JSON format):\n\`\`\`json\n${excelDataString}\n\`\`\``;

    if (projectSnapshot) {
      const snapshotDataString = JSON.stringify({
        project_info: {
          name: projectSnapshot.project_name,
          full_path: projectSnapshot.full_path,
          last_activity_at: projectSnapshot.last_activity_at,
          snapshot_date: projectSnapshot.snapshot_date
        },
        gitlab_metrics: {
          open_issues: projectSnapshot.open_issues || 0,
          open_mrs: projectSnapshot.open_mrs || 0,
          open_milestones: projectSnapshot.open_milestones_count || 0
        },
        sonarcloud_metrics: {
          security: {
            high: projectSnapshot.sonar_security_high || 0,
            blocker: projectSnapshot.sonar_security_blocker || 0
          },
          reliability: {
            high: projectSnapshot.sonar_reliability_high || 0,
            blocker: projectSnapshot.sonar_reliability_blocker || 0
          },
          maintainability: {
            high: projectSnapshot.sonar_maintainability_high || 0,
            blocker: projectSnapshot.sonar_maintainability_blocker || 0
          }
        }
      }, null, 2);

      enhancedPrompt += `\n\n## Project Snapshot Data from Tracking System:\n\`\`\`json\n${snapshotDataString}\n\`\`\`\n\n**Note:** This snapshot data includes the latest GitLab metrics (open issues, MRs, milestones) and SonarCloud quality metrics (security, reliability, maintainability issues) for the project "${projectSnapshot.project_name}".`;
    }

    return enhancedPrompt;
  }

  /**
   * Parse Excel file and send to Gemini as JSON with project snapshot data
   * @param prompt - The text prompt
   * @param excelBase64 - Base64 encoded Excel file content
   */
  async generateResponseWithExcel(
    prompt: string,
    excelBase64: string
  ): Promise<string> {
    this.initialize(); // Ensure initialization
    
    if (!this.genAI) {
      throw new Error('Gemini API key not configured');
    }

    try {
      // Convert base64 to buffer and parse Excel
      const buffer = Buffer.from(excelBase64, 'base64');
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      
      // Convert all sheets to JSON
      const sheets: { [key: string]: any[] } = {};
      workbook.SheetNames.forEach((sheetName) => {
        const worksheet = workbook.Sheets[sheetName];
        sheets[sheetName] = XLSX.utils.sheet_to_json(worksheet);
      });

      // Extract project name from Excel
      const projectName = this.extractProjectNameFromExcel(sheets);
      
      // Fetch project snapshot if project name found
      let projectSnapshot: any = null;
      if (projectName) {
        projectSnapshot = await this.fetchProjectSnapshot(projectName);
      } else {
        console.log('⚠️ No project name found in Excel data');
      }

      // Build enhanced prompt with Excel data and optional snapshot
      const enhancedPrompt = this.buildEnhancedPrompt(prompt, sheets, projectSnapshot);

      // Send to Gemini
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent(enhancedPrompt);
      const response = result.response;
      return response.text();
    } catch (error: any) {
      console.error('❌ Gemini API error with Excel:', error.message);
      throw new Error(`Failed to generate response with Excel: ${error.message}`);
    }
  }

  /**
   * @deprecated Use generateResponseWithFile instead
   * Send a prompt with a PDF file to Gemini and get response
   */
  async generateResponseWithPDF(
    prompt: string,
    pdfBase64: string,
    mimeType: string = 'application/pdf'
  ): Promise<string> {
    return this.generateResponseWithFile(prompt, pdfBase64, mimeType);
  }

  /**
   * Check if Gemini service is configured
   */
  isConfigured(): boolean {
    return !!this.genAI;
  }
}

export default new GeminiService();

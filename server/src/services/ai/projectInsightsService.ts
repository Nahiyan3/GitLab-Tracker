// Project Insights Service - generates AI-powered project insights
import geminiService from './geminiService';
import googleSheetsService from './googleSheetsService';
import { getLatestSnapshotByProjectName } from '../../db/queries';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

class ProjectInsightsService {
  private readonly GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1wBgQiFn5LC_atxVukKXu8-mSwCJt0UyX1ynLIUNe-i4/edit?resourcekey=&gid=1029653865#gid=1029653865';
  private readonly PROMPT_FILE_PATH = path.join(__dirname, '../../prompts/project-insights-prompt.txt');

  /**
   * Load the prompt template from file
   */
  private async loadPrompt(): Promise<string> {
    try {
      const prompt = fs.readFileSync(this.PROMPT_FILE_PATH, 'utf-8');
      return prompt;
    } catch (error: any) {
      console.error('❌ Failed to load prompt file:', error.message);
      throw new Error('Prompt file not found. Please create the prompt file.');
    }
  }

  /**
   * Extract project row from Excel sheets by project name
   * @param sheets - Parsed Excel sheets
   * @param projectName - Name of the project to find
   * @returns Project row data or null if not found
   */
  private extractProjectRow(
    sheets: { [key: string]: any[] },
    projectName: string
  ): any | null {
    for (const sheetName in sheets) {
      const sheetData = sheets[sheetName];
      for (const row of sheetData) {
        // Check various possible project name fields
        const rowProjectName = 
          row['Project Name'] || 
          row['project_name'] || 
          row['ProjectName'] || 
          row['Project'] || 
          row['project'] || 
          row['Name'] || 
          row['name'];

        if (rowProjectName && rowProjectName.toLowerCase() === projectName.toLowerCase()) {
          console.log(`✅ Found project row for: ${projectName}`);
          return { sheetName, data: row };
        }
      }
    }
    console.log(`⚠️ No project row found for: ${projectName}`);
    return null;
  }

  /**
   * Build comprehensive prompt with project data
   * @param basePrompt - Base prompt template
   * @param projectName - Name of the project
   * @param projectRow - Project row from Excel
   * @param projectSnapshot - Latest project snapshot with metrics
   * @returns Complete prompt for Gemini
   */
  private buildInsightsPrompt(
    basePrompt: string,
    projectName: string,
    projectRow: any,
    projectSnapshot: any
  ): string {
    let prompt = `${basePrompt}\n\n`;
    prompt += `## Project: ${projectName}\n\n`;

    // Add form data
    if (projectRow) {
      prompt += `### User Form Responses (Google Sheet Data):\n\`\`\`json\n${JSON.stringify(projectRow.data, null, 2)}\n\`\`\`\n\n`;
    }

    // Add API metrics
    if (projectSnapshot) {
      const apiMetrics = {
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
          security_high: projectSnapshot.sonar_security_high || 0,
          security_blocker: projectSnapshot.sonar_security_blocker || 0,
          reliability_high: projectSnapshot.sonar_reliability_high || 0,
          reliability_blocker: projectSnapshot.sonar_reliability_blocker || 0,
          maintainability_high: projectSnapshot.sonar_maintainability_high || 0,
          maintainability_blocker: projectSnapshot.sonar_maintainability_blocker || 0
        }
      };

      prompt += `### API Metrics (GitLab + SonarCloud):\n\`\`\`json\n${JSON.stringify(apiMetrics, null, 2)}\n\`\`\`\n\n`;
    }

    prompt += `\nPlease calculate all scores, provide detailed analysis, and identify specific areas needing improvement with actionable recommendations.`;

    return prompt;
  }

  /**
   * Generate project insights
   * @param projectName - Name of the project
   * @returns AI-generated insights
   */
  async generateInsights(projectName: string): Promise<string> {
    try {
      console.log(`🔍 Generating insights for project: ${projectName}`);

      // Step 1: Load prompt template
      const basePrompt = await this.loadPrompt();

      // Step 2: Download Google Sheet as Excel
      console.log('📥 Downloading Google Sheet...');
      const excelBase64 = await googleSheetsService.downloadAsExcel(this.GOOGLE_SHEET_URL);

      // Step 3: Parse Excel
      const buffer = Buffer.from(excelBase64, 'base64');
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheets: { [key: string]: any[] } = {};
      workbook.SheetNames.forEach((sheetName) => {
        const worksheet = workbook.Sheets[sheetName];
        sheets[sheetName] = XLSX.utils.sheet_to_json(worksheet);
      });

      // Step 4: Extract project row
      const projectRow = this.extractProjectRow(sheets, projectName);
      if (!projectRow) {
        throw new Error(`Project "${projectName}" not found in Google Sheet`);
      }

      // Step 5: Fetch project snapshot from database
      console.log('🔍 Fetching project snapshot...');
      const projectSnapshot = await getLatestSnapshotByProjectName(projectName);
      if (!projectSnapshot) {
        console.log('⚠️ No project snapshot found, continuing with form data only');
      }

      // Step 6: Build comprehensive prompt
      const enhancedPrompt = this.buildInsightsPrompt(
        basePrompt,
        projectName,
        projectRow,
        projectSnapshot
      );

      // Step 7: Send to Gemini
      console.log('🤖 Sending to Gemini AI...');
      const insights = await geminiService.generateTextResponse(enhancedPrompt);

      console.log('✅ Project insights generated successfully');
      return insights;
    } catch (error: any) {
      console.error('❌ Failed to generate project insights:', error.message);
      throw error;
    }
  }
}

export default new ProjectInsightsService();

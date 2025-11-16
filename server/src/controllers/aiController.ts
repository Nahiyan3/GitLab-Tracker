// AI Controller - handles AI-related requests
import { Request, Response } from 'express';
import geminiService from '../services/ai/geminiService';
import projectInsightsService from '../services/ai/projectInsightsService';
import { parseAndCorrectInsights } from '../services/ai/insightsParser';
import { saveProjectInsights, getLatestProjectInsights, getProjectInsightsHistoryById, getAllLatestProjectInsights } from '../db/queries';

class AIController {
  /**
   * Test Gemini connection
   */
  testConnection = async (req: Request, res: Response) => {
    try {
      if (!geminiService.isConfigured()) {
        return res.status(500).json({ 
          error: 'Gemini API key not configured. Please set GEMINI_API_KEY in environment variables.' 
        });
      }

      res.json({ 
        connected: true, 
        message: 'Gemini AI service is configured and ready' 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * Generate response from text prompt
   */
  generateText = async (req: Request, res: Response) => {
    try {
      const { prompt } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      const response = await geminiService.generateTextResponse(prompt);
      res.json({ response });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * Generate response from prompt + file (PDF or Excel)
   */
  generateWithPDF = async (req: Request, res: Response) => {
    try {
      const { prompt, fileData, mimeType } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      if (!fileData) {
        return res.status(400).json({ error: 'File data is required' });
      }

      // Check if it's an Excel file
      const isExcel = mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                      mimeType === 'application/vnd.ms-excel';

      let response: string;
      
      if (isExcel) {
        // Parse Excel and send as JSON
        response = await geminiService.generateResponseWithExcel(prompt, fileData);
      } else {
        // Send other files (PDF) directly
        response = await geminiService.generateResponseWithFile(prompt, fileData, mimeType);
      }

      res.json({ response });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * Generate project insights automatically
   */
  generateProjectInsights = async (req: Request, res: Response) => {
    try {
      const { projectName } = req.body;

      if (!projectName) {
        return res.status(400).json({ error: 'Project name is required' });
      }

      console.log(`📊 Generating insights for project: ${projectName}`);
      
      // Step 1: Generate raw AI insights
      const rawInsights = await projectInsightsService.generateInsights(projectName);
      
      // Step 2: Parse and correct scores from detailed_calculations
      console.log('🔍 Parsing and correcting scores...');
      const correctedInsights = parseAndCorrectInsights(rawInsights);
      
      // Step 3: Save corrected insights to database
      console.log('💾 Saving corrected insights to database...');
      await saveProjectInsights(projectName, correctedInsights);
      
      console.log('✅ Insights generated, corrected, and saved successfully');

      res.json({ 
        projectName,
        insights: rawInsights,  // Return raw for backward compatibility
        correctedInsights,      // Also return corrected version
        saved: true
      });
    } catch (error: any) {
      console.error('❌ Project insights error:', error.message);
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * Get latest saved insights for a project
   */
  getProjectInsights = async (req: Request, res: Response) => {
    try {
      const { projectName } = req.params;

      if (!projectName) {
        return res.status(400).json({ error: 'Project name is required' });
      }

      console.log(`📖 Fetching insights for project: ${projectName}`);
      const savedInsights = await getLatestProjectInsights(projectName);

      if (!savedInsights) {
        return res.status(404).json({ 
          error: 'No insights found for this project',
          message: 'Generate insights first using POST /api/ai/project-insights'
        });
      }

      res.json({ 
        projectName: savedInsights.project_name,
        insights: savedInsights.insights_data,
        scores: {
          final_user_score: savedInsights.final_user_score,
          api_score: savedInsights.api_score,
          combined_score: savedInsights.combined_score
        },
        created_at: savedInsights.created_at
      });
    } catch (error: any) {
      console.error('❌ Failed to get project insights:', error.message);
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * Get insights history for a project by project ID
   */
  getProjectInsightsHistoryById = async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;

      if (!projectId) {
        return res.status(400).json({ error: 'Project ID is required' });
      }

      console.log(`📊 Fetching insights history for project ID: ${projectId}`);
      const insightsHistory = await getProjectInsightsHistoryById(parseInt(projectId));

      if (!insightsHistory || insightsHistory.length === 0) {
        return res.json({ 
          history: [],
          message: 'No insights history found for this project'
        });
      }

      res.json({ 
        projectId: parseInt(projectId),
        history: insightsHistory
      });
    } catch (error: any) {
      console.error('❌ Failed to get project insights history:', error.message);
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * Get all latest project insights with full metrics
   */
  getAllProjectInsights = async (req: Request, res: Response) => {
    try {
      console.log('📊 Fetching all latest project insights...');
      const allInsights = await getAllLatestProjectInsights();

      if (!allInsights || allInsights.length === 0) {
        return res.json({ 
          projects: [],
          message: 'No project insights found'
        });
      }

      // Transform data to extract section scores from insights_data
      const formattedInsights = allInsights.map((project: any) => {
        const insightsData = project.insights_data;
        const sectionScores: any = {};

        // Extract section scores from section_scores array
        if (insightsData.section_scores && Array.isArray(insightsData.section_scores)) {
          insightsData.section_scores.forEach((section: any) => {
            const sectionName = section.name.toLowerCase().replace(/\s+/g, '');
            sectionScores[sectionName] = section.score;
          });
        }

        return {
          id: project.id,
          uuid: project.uuid,
          name: project.name,
          group: project.full_path?.split('/')[0] || 'Unknown',
          metrics: {
            codeReview: sectionScores.codereview || 0,
            technicalDebt: sectionScores.technicaldebt || 0,
            testQuality: sectionScores.testquality || 0,
            documentation: sectionScores.documentation || 0,
            deployment: sectionScores.deployment || 0,
            dependencies: sectionScores.dependencies || 0,
            teamMorale: sectionScores.teammorale || sectionScores.teamvelocity || sectionScores.teamvelocitymorale || 0,
            apiScore: project.api_score || 0,
            combinedScore: project.combined_score || 0,
          },
          created_at: project.created_at
        };
      });

      res.json({ 
        projects: formattedInsights,
        count: formattedInsights.length
      });
    } catch (error: any) {
      console.error('❌ Failed to get all project insights:', error.message);
      res.status(500).json({ error: error.message });
    }
  };
}

export default new AIController();

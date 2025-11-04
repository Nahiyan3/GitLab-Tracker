// AI Controller - handles AI-related requests
import { Request, Response } from 'express';
import geminiService from '../services/ai/geminiService';

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
   * Generate response from prompt + PDF file
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

      // fileData should be base64 encoded string
      const response = await geminiService.generateResponseWithPDF(
        prompt,
        fileData,
        mimeType || 'application/pdf'
      );

      res.json({ response });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };
}

export default new AIController();

// Gemini AI Service - handles interactions with Google Gemini API
import { GoogleGenerativeAI } from '@google/generative-ai';

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
   * Send a text prompt to Gemini and get response
   */
  async generateTextResponse(prompt: string): Promise<string> {
    this.initialize(); // Ensure initialization
    
    if (!this.genAI) {
      throw new Error('Gemini API key not configured');
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
      const result = await model.generateContent(prompt);
      const response = result.response;
      return response.text();
    } catch (error: any) {
      console.error('❌ Gemini API error:', error.message);
      throw new Error(`Failed to generate response: ${error.message}`);
    }
  }

  /**
   * Send a prompt with a PDF file to Gemini and get response
   * @param prompt - The text prompt
   * @param pdfBase64 - Base64 encoded PDF file content
   * @param mimeType - MIME type of the file (default: application/pdf)
   */
  async generateResponseWithPDF(
    prompt: string,
    pdfBase64: string,
    mimeType: string = 'application/pdf'
  ): Promise<string> {
    this.initialize(); // Ensure initialization
    
    if (!this.genAI) {
      throw new Error('Gemini API key not configured');
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

      const imagePart = {
        inlineData: {
          data: pdfBase64,
          mimeType: mimeType,
        },
      };

      const result = await model.generateContent([prompt, imagePart]);
      const response = result.response;
      return response.text();
    } catch (error: any) {
      console.error('❌ Gemini API error with PDF:', error.message);
      throw new Error(`Failed to generate response with PDF: ${error.message}`);
    }
  }

  /**
   * Check if Gemini service is configured
   */
  isConfigured(): boolean {
    return !!this.genAI;
  }
}

export default new GeminiService();

// Parse and correct AI insights by extracting verified scores from detailed_calculations

/**
 * Extract section score from detailed_calculations text
 */
const extractSectionScore = (detailedCalc: string, sectionName: string): number | null => {
  // Look for the section and then find "Section Score" followed by the calculation
  const sectionRegex = new RegExp(`${sectionName}[\\s\\S]*?Section Score[\\s\\S]*?([^\\n]+)`, 'i');
  const sectionMatch = detailedCalc.match(sectionRegex);
  
  if (sectionMatch) {
    const calculationLine = sectionMatch[1];
    console.log(`[Parser] ${sectionName} calculation line:`, calculationLine);
    
    // Try format 1: "... -> **2.99** (rounded to 2 decimals)"
    const boldMatch = calculationLine.match(/\*\*([\d.]+)\*\*/);
    if (boldMatch) {
      const score = parseFloat(boldMatch[1]);
      console.log(`[Parser] Extracted ${sectionName} score (from bold):`, score);
      return score;
    }
    
    // Try format 2: Extract all numbers after = signs, take the last one (final result)
    const numbers = calculationLine.match(/=\s*([\d.]+)/g);
    if (numbers && numbers.length > 0) {
      const lastNumber = numbers[numbers.length - 1].match(/([\d.]+)/);
      if (lastNumber) {
        const score = parseFloat(lastNumber[1]);
        console.log(`[Parser] Extracted ${sectionName} score (from = sign):`, score);
        return score;
      }
    }
    
    // Try format 3: Get the first number directly (fallback)
    const directNumber = calculationLine.match(/([\d.]+)/);
    if (directNumber) {
      const score = parseFloat(directNumber[1]);
      console.log(`[Parser] Extracted ${sectionName} score (direct fallback):`, score);
      return score;
    }
  }
  
  console.log(`[Parser] Could not extract ${sectionName} score`);
  return null;
};

/**
 * Clean JSON string by removing control characters and fixing common issues
 */
const cleanJsonString = (jsonStr: string): string => {
  // Remove actual control characters (but keep normal whitespace)
  let cleaned = jsonStr.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
  
  // The JSON might have literal \n in it - just remove them since they're in the structure
  // Real newlines in strings should already be properly escaped by Gemini
  
  return cleaned;
};

/**
 * Parse and correct insights data by extracting verified scores from detailed_calculations
 */
export const parseAndCorrectInsights = (rawResponse: string): any => {
  try {
    // Extract JSON from markdown code block
    const jsonMatch = rawResponse.match(/```json\n([\s\S]*?)\n```/);
    let jsonString = jsonMatch ? jsonMatch[1] : rawResponse;
    
    console.log('[Parser] Raw JSON first 200 chars:', jsonString.substring(0, 200));
    
    // Clean the JSON string
    jsonString = cleanJsonString(jsonString);
    
    console.log('[Parser] Cleaned JSON first 200 chars:', jsonString.substring(0, 200));
    console.log('[Parser] Attempting to parse JSON (length:', jsonString.length, ')');
    
    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch (parseError: any) {
      // If parsing fails, try to fix common issues
      console.warn('[Parser] Initial parse failed:', parseError.message);
      console.warn('[Parser] Attempting repairs...');
      
      // Log a sample of what we're trying to parse
      console.log('[Parser] Sample:', jsonString.substring(0, 500));
      
      // Try to fix trailing commas
      jsonString = jsonString.replace(/,(\s*[}\]])/g, '$1');
      
      // Try to fix missing commas between properties
      jsonString = jsonString.replace(/"\s*\n\s*"/g, '",\n"');
      
      console.log('[Parser] After repairs, first 200 chars:', jsonString.substring(0, 200));
      
      // Try again
      parsed = JSON.parse(jsonString);
    }
    
    if (!parsed.detailed_calculations) {
      console.warn('[Parser] No detailed_calculations found - returning raw parsed data');
      return parsed;
    }
    
    const detailedCalc = parsed.detailed_calculations;
    console.log('[Parser] Starting score correction from detailed_calculations');
    
    // Correct section scores
    if (parsed.section_scores && Array.isArray(parsed.section_scores)) {
      parsed.section_scores = parsed.section_scores.map((section: any) => {
        let correctedScore = section.score;
        const sectionName = section.name.toLowerCase();
        
        // Match section name to extraction pattern
        if (sectionName.includes('code review')) {
          correctedScore = extractSectionScore(detailedCalc, 'Code Review') ?? section.score;
        } else if (sectionName.includes('technical debt')) {
          correctedScore = extractSectionScore(detailedCalc, 'Technical Debt') ?? section.score;
        } else if (sectionName.includes('test')) {
          correctedScore = extractSectionScore(detailedCalc, 'Test Quality') ?? 
                          extractSectionScore(detailedCalc, 'Test') ?? section.score;
        } else if (sectionName.includes('documentation')) {
          correctedScore = extractSectionScore(detailedCalc, 'Documentation') ?? section.score;
        } else if (sectionName.includes('deployment')) {
          correctedScore = extractSectionScore(detailedCalc, 'Deployment') ?? section.score;
        } else if (sectionName.includes('dependencies')) {
          correctedScore = extractSectionScore(detailedCalc, 'Dependencies') ?? section.score;
        } else if (sectionName.includes('morale') || sectionName.includes('velocity')) {
          correctedScore = extractSectionScore(detailedCalc, 'Team Velocity & Morale') ?? 
                          extractSectionScore(detailedCalc, 'Team Morale') ?? section.score;
        }
        
        return {
          ...section,
          score: correctedScore
        };
      });
    }
    
    // Extract correct Final User Score
    // Try format 1: "Final User Score = ... = result"
    let finalUserRegex = /Final User Score[:\s]*=([^\n]+)/i;
    let finalUserMatch = detailedCalc.match(finalUserRegex);
    if (finalUserMatch) {
      const calculationLine = finalUserMatch[1];
      console.log('[Parser] Final User Score calculation line:', calculationLine);
      
      // Extract all numbers after = signs, take the last one (final result)
      const numbers = calculationLine.match(/=\s*([\d.]+)/g);
      if (numbers && numbers.length > 0) {
        const lastNumber = numbers[numbers.length - 1].match(/([\d.]+)/);
        if (lastNumber) {
          parsed.final_user_score = parseFloat(lastNumber[1]);
          console.log('[Parser] Corrected Final User Score:', parsed.final_user_score);
        }
      } else {
        // Try to find number in parentheses at the end (rounded to X decimals)
        const roundedMatch = calculationLine.match(/([\d.]+)\s*\(rounded/i);
        if (roundedMatch) {
          parsed.final_user_score = parseFloat(roundedMatch[1]);
          console.log('[Parser] Corrected Final User Score (from rounded notation):', parsed.final_user_score);
        }
      }
    }
    
    // Try format 2: "**Final User Score:** 2.27" (on separate line after calculation)
    if (!parsed.final_user_score || parsed.final_user_score < 1 || parsed.final_user_score > 5) {
      const finalUserBoldRegex = /\*\*Final User Score:\*\*\s*([\d.]+)/i;
      const finalUserBoldMatch = detailedCalc.match(finalUserBoldRegex);
      if (finalUserBoldMatch) {
        parsed.final_user_score = parseFloat(finalUserBoldMatch[1]);
        console.log('[Parser] Corrected Final User Score (from bold format):', parsed.final_user_score);
      }
    }
    
    // Extract correct API Score
    const apiScoreRegex = /API\s+Score[:\s]*=([^\n]+)/i;
    const apiScoreMatch = detailedCalc.match(apiScoreRegex);
    if (apiScoreMatch) {
      const calculationLine = apiScoreMatch[1];
      console.log('[Parser] API Score calculation line:', calculationLine);
      
      // Extract all numbers after = signs, take the last one (final result)
      const numbers = calculationLine.match(/=\s*([\d.]+)/g);
      if (numbers && numbers.length > 0) {
        const lastNumber = numbers[numbers.length - 1].match(/([\d.]+)/);
        if (lastNumber) {
          if (!parsed.api_scores) parsed.api_scores = {};
          parsed.api_scores.api_score = parseFloat(lastNumber[1]);
          console.log('[Parser] Corrected API Score:', parsed.api_scores.api_score);
        }
      } else {
        // Try to find number in parentheses at the end (rounded to X decimals)
        const roundedMatch = calculationLine.match(/([\d.]+)\s*\(rounded/i);
        if (roundedMatch) {
          if (!parsed.api_scores) parsed.api_scores = {};
          parsed.api_scores.api_score = parseFloat(roundedMatch[1]);
          console.log('[Parser] Corrected API Score (from rounded notation):', parsed.api_scores.api_score);
        }
      }
    }
    
    // Extract correct Combined Score
    // Try format 1: "Combined Score = ... = result"
    let combinedRegex = /Combined Score[:\s]*=([^\n]+)/i;
    let combinedMatch = detailedCalc.match(combinedRegex);
    if (combinedMatch) {
      const calculationLine = combinedMatch[1];
      console.log('[Parser] Combined Score calculation line:', calculationLine);
      
      // Extract all numbers after = signs, take the last one (final result)
      const numbers = calculationLine.match(/=\s*([\d.]+)/g);
      if (numbers && numbers.length > 0) {
        const lastNumber = numbers[numbers.length - 1].match(/([\d.]+)/);
        if (lastNumber) {
          parsed.combined_score = parseFloat(lastNumber[1]);
          console.log('[Parser] Corrected Combined Score:', parsed.combined_score);
        }
      } else {
        // Try to find number in parentheses at the end (rounded to X decimals)
        const roundedMatch = calculationLine.match(/([\d.]+)\s*\(rounded/i);
        if (roundedMatch) {
          parsed.combined_score = parseFloat(roundedMatch[1]);
          console.log('[Parser] Corrected Combined Score (from rounded notation):', parsed.combined_score);
        }
      }
    }
    
    // Try format 2: "**Combined Score:** 2.60" (on separate line after calculation)
    if (!parsed.combined_score || parsed.combined_score < 1 || parsed.combined_score > 5) {
      const combinedBoldRegex = /\*\*Combined Score:\*\*\s*([\d.]+)/i;
      const combinedBoldMatch = detailedCalc.match(combinedBoldRegex);
      if (combinedBoldMatch) {
        parsed.combined_score = parseFloat(combinedBoldMatch[1]);
        console.log('[Parser] Corrected Combined Score (from bold format):', parsed.combined_score);
      }
    }
    
    console.log('[Parser] Score correction complete');
    console.log('='.repeat(60));
    console.log('[Parser] FINAL EXTRACTED SCORES:');
    console.log('[Parser] Final User Score:', parsed.final_user_score);
    console.log('[Parser] API Score:', parsed.api_scores?.api_score);
    console.log('[Parser] Combined Score:', parsed.combined_score);
    console.log('='.repeat(60));
    
    return parsed;
    
  } catch (error: any) {
    console.error('[Parser] Failed to parse and correct insights:', error.message);
    
    // Log the problematic part of the JSON
    if (error.message.includes('position')) {
      const position = parseInt(error.message.match(/position (\d+)/)?.[1] || '0');
      const jsonMatch = rawResponse.match(/```json\n([\s\S]*?)\n```/);
      const jsonString = jsonMatch ? jsonMatch[1] : rawResponse;
      
      const start = Math.max(0, position - 100);
      const end = Math.min(jsonString.length, position + 100);
      console.error('[Parser] Context around error position:');
      console.error('...', jsonString.substring(start, end), '...');
      console.error('     ', ' '.repeat(Math.min(100, position - start)) + '^');
    }
    
    throw new Error(`Failed to parse insights: ${error.message}`);
  }
};

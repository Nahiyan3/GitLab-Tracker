// Parse and correct AI insights by extracting verified scores from detailed_calculations

/**
 * Extract section score from detailed_calculations text
 */
const extractSectionScore = (detailedCalc: string, sectionName: string): number | null => {
  // Look for the section and then find "Section Score" followed by the calculation
  const sectionRegex = new RegExp(`${sectionName}[\\s\\S]*?Section Score\\s*[=:]([^\\n]+)`, 'i');
  const sectionMatch = detailedCalc.match(sectionRegex);
  
  if (sectionMatch) {
    const calculationLine = sectionMatch[1];
    console.log(`[Parser] ${sectionName} calculation line:`, calculationLine);
    
    // Extract all numbers after = signs, take the last one (final result)
    const numbers = calculationLine.match(/=\s*([\d.]+)/g);
    if (numbers && numbers.length > 0) {
      const lastNumber = numbers[numbers.length - 1].match(/([\d.]+)/);
      if (lastNumber) {
        const score = parseFloat(lastNumber[1]);
        console.log(`[Parser] Extracted ${sectionName} score:`, score);
        return score;
      }
    }
    
    // If no = signs, try to get the first number directly
    const directNumber = calculationLine.match(/([\d.]+)/);
    if (directNumber) {
      const score = parseFloat(directNumber[1]);
      console.log(`[Parser] Extracted ${sectionName} score (direct):`, score);
      return score;
    }
  }
  
  console.log(`[Parser] Could not extract ${sectionName} score`);
  return null;
};

/**
 * Parse and correct insights data by extracting verified scores from detailed_calculations
 */
export const parseAndCorrectInsights = (rawResponse: string): any => {
  try {
    // Extract JSON from markdown code block
    const jsonMatch = rawResponse.match(/```json\n([\s\S]*?)\n```/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[1] : rawResponse);
    
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
    const finalUserRegex = /Final User Score[^=]*=([^\n]+)/i;
    const finalUserMatch = detailedCalc.match(finalUserRegex);
    if (finalUserMatch) {
      const numbers = finalUserMatch[1].match(/=\s*([\d.]+)/g);
      if (numbers && numbers.length > 0) {
        const lastNumber = numbers[numbers.length - 1].match(/([\d.]+)/);
        if (lastNumber) {
          parsed.final_user_score = parseFloat(lastNumber[1]);
          console.log('[Parser] Corrected Final User Score:', parsed.final_user_score);
        }
      }
    }
    
    // Extract correct API Score
    const apiScoreRegex = /^API\s+Score\s*=\s*\([^)]+\)[^=]*=([^\n]+)/im;
    const apiScoreMatch = detailedCalc.match(apiScoreRegex);
    if (apiScoreMatch) {
      const numbers = apiScoreMatch[1].match(/=\s*([\d.]+)/g);
      if (numbers && numbers.length > 0) {
        const lastNumber = numbers[numbers.length - 1].match(/([\d.]+)/);
        if (lastNumber) {
          if (!parsed.api_scores) parsed.api_scores = {};
          parsed.api_scores.api_score = parseFloat(lastNumber[1]);
          console.log('[Parser] Corrected API Score:', parsed.api_scores.api_score);
        }
      }
    }
    
    // Extract correct Combined Score
    const combinedRegex = /Combined Score[^=]*=([^\n]+)/i;
    const combinedMatch = detailedCalc.match(combinedRegex);
    if (combinedMatch) {
      const numbers = combinedMatch[1].match(/=\s*([\d.]+)/g);
      if (numbers && numbers.length > 0) {
        const lastNumber = numbers[numbers.length - 1].match(/([\d.]+)/);
        if (lastNumber) {
          parsed.combined_score = parseFloat(lastNumber[1]);
          console.log('[Parser] Corrected Combined Score:', parsed.combined_score);
        }
      }
    }
    
    console.log('[Parser] Score correction complete');
    return parsed;
    
  } catch (error: any) {
    console.error('[Parser] Failed to parse and correct insights:', error.message);
    throw new Error(`Failed to parse insights: ${error.message}`);
  }
};

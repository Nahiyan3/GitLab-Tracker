import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, ArrowLeft, Loader2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SectionScore {
  name: string;
  score: number;
  analysis?: string;
}

interface InsightData {
  section_scores?: SectionScore[];
  final_user_score?: number;
  api_scores?: {
    sonarcloud_score?: number;
    gitlab_score?: number;
    api_score?: number;
  };
  combined_score?: number;
  interpretation?: string;
  areas_needing_improvement?: Array<{
    area: string;
    current_score: number;
    issues: string[];
    recommendations: string[];
  }>;
  summary?: string;
  detailed_calculations?: string;
}

const ProjectInsight = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [projectName, setProjectName] = useState<string>("");
  const [rawInsights, setRawInsights] = useState<string>("");
  const [parsedInsights, setParsedInsights] = useState<InsightData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Fetch project name and automatically generate insights
  useEffect(() => {
    const fetchProjectNameAndGenerateInsights = async () => {
      try {
        const projects = await api.get('/projects/db');
        const project = projects.find((p: any) => p.id === parseInt(id || ''));
        if (project) {
          setProjectName(project.name);
          // Automatically generate insights after setting project name
          await generateInsightsForProject(project.name);
        }
      } catch (error: any) {
        console.error('Failed to fetch project:', error);
        setError('Failed to load project');
      }
    };

    if (id) {
      fetchProjectNameAndGenerateInsights();
    }
  }, [id]);

  const generateInsightsForProject = async (name: string) => {
    if (!name) {
      toast({
        title: "Error",
        description: "Project name not found",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post('/ai/project-insights', {
        projectName: name
      });

      setRawInsights(response.insights);
      
      // Try to parse JSON from the response
      try {
        let parsed: any = null;
        
        // First, try to extract JSON from markdown code block
        const jsonMatch = response.insights.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[1]);
        } else {
          // Try parsing the whole response as JSON
          parsed = JSON.parse(response.insights);
        }

        // Parse scores from detailed_calculations (the source of truth)
        if (parsed && parsed.detailed_calculations) {
          const detailedCalc = parsed.detailed_calculations;
          console.log('Detailed Calculations:', detailedCalc);
          
          // Extract section scores from detailed calculations
          const extractSectionScore = (sectionName: string): number => {
            // Look for the section and then find "Section Score" followed by the calculation
            // Handle both "Section Score:" and "Section Score ="
            const sectionRegex = new RegExp(`${sectionName}[\\s\\S]*?Section Score\\s*[=:]([^\\n]+)`, 'i');
            const sectionMatch = detailedCalc.match(sectionRegex);
            
            if (sectionMatch) {
              const calculationLine = sectionMatch[1];
              console.log(`${sectionName} calculation line:`, calculationLine);
              
              // Extract all numbers after = signs, take the last one
              const numbers = calculationLine.match(/=\s*([\d.]+)/g);
              if (numbers && numbers.length > 0) {
                const lastNumber = numbers[numbers.length - 1].match(/([\d.]+)/);
                if (lastNumber) {
                  console.log(`Extracted ${sectionName} score:`, lastNumber[1]);
                  return parseFloat(lastNumber[1]);
                }
              }
              
              // If no = signs, try to get the first number directly
              const directNumber = calculationLine.match(/([\d.]+)/);
              if (directNumber) {
                console.log(`Extracted ${sectionName} score (direct):`, directNumber[1]);
                return parseFloat(directNumber[1]);
              }
            }
            
            console.log(`Could not extract ${sectionName} score`);
            return 0;
          };

          // Extract Final User Score - get the last number after all = signs
          // Handle emojis and different formats
          const finalUserRegex = /Final User Score[^=]*=([^\\n]+)/i;
          const finalUserMatch = detailedCalc.match(finalUserRegex);
          if (finalUserMatch) {
            const calculationLine = finalUserMatch[1];
            console.log('Final User Score calculation line:', calculationLine);
            const numbers = calculationLine.match(/=\s*([\d.]+)/g);
            if (numbers && numbers.length > 0) {
              const lastNumber = numbers[numbers.length - 1].match(/([\d.]+)/);
              if (lastNumber) {
                parsed.final_user_score = parseFloat(lastNumber[1]);
                console.log('Extracted Final User Score:', lastNumber[1]);
              }
            } else {
              // Try direct number
              const directNumber = calculationLine.match(/([\d.]+)/);
              if (directNumber) {
                parsed.final_user_score = parseFloat(directNumber[1]);
                console.log('Extracted Final User Score (direct):', directNumber[1]);
              }
            }
          } else {
            console.log('Could not match Final User Score pattern');
          }

          // Extract API Score - get the last number after all = signs
          const apiScoreRegex = /API Score[^=]*=([^\\n]+)/i;
          const apiScoreMatch = detailedCalc.match(apiScoreRegex);
          if (apiScoreMatch) {
            const calculationLine = apiScoreMatch[1];
            console.log('API Score calculation line:', calculationLine);
            const numbers = calculationLine.match(/=\s*([\d.]+)/g);
            if (numbers && numbers.length > 0) {
              const lastNumber = numbers[numbers.length - 1].match(/([\d.]+)/);
              if (lastNumber) {
                if (!parsed.api_scores) parsed.api_scores = {};
                parsed.api_scores.api_score = parseFloat(lastNumber[1]);
                console.log('Extracted API Score:', lastNumber[1]);
              }
            } else {
              // Try direct number
              const directNumber = calculationLine.match(/([\d.]+)/);
              if (directNumber) {
                if (!parsed.api_scores) parsed.api_scores = {};
                parsed.api_scores.api_score = parseFloat(directNumber[1]);
                console.log('Extracted API Score (direct):', directNumber[1]);
              }
            }
          } else {
            console.log('Could not match API Score pattern');
          }

          // Extract Combined Score - get the last number after all = signs
          const combinedRegex = /Combined Score[^=]*=([^\\n]+)/i;
          const combinedMatch = detailedCalc.match(combinedRegex);
          if (combinedMatch) {
            const calculationLine = combinedMatch[1];
            console.log('Combined Score calculation line:', calculationLine);
            const numbers = calculationLine.match(/=\s*([\d.]+)/g);
            if (numbers && numbers.length > 0) {
              const lastNumber = numbers[numbers.length - 1].match(/([\d.]+)/);
              if (lastNumber) {
                parsed.combined_score = parseFloat(lastNumber[1]);
                console.log('Extracted Combined Score:', lastNumber[1]);
              }
            } else {
              // Try direct number
              const directNumber = calculationLine.match(/([\d.]+)/);
              if (directNumber) {
                parsed.combined_score = parseFloat(directNumber[1]);
                console.log('Extracted Combined Score (direct):', directNumber[1]);
              }
            }
          } else {
            console.log('Could not match Combined Score pattern');
          }

          // Override section_scores with values from detailed_calculations
          if (parsed.section_scores) {
            if (!Array.isArray(parsed.section_scores)) {
              // Transform object to array first
              parsed.section_scores = Object.entries(parsed.section_scores).map(([name, data]: [string, any]) => ({
                name: name.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
                score: 0, // Will be overridden below
                analysis: typeof data === 'object' ? (data.analysis || '') : ''
              }));
            }
            
            // Now override scores with values from detailed_calculations
            parsed.section_scores = parsed.section_scores.map((section: any) => {
              const sectionName = section.name;
              let calculatedScore = 0;
              
              // Map section names to their calculation names
              if (sectionName.toLowerCase().includes('code review')) {
                calculatedScore = extractSectionScore('Code Review');
              } else if (sectionName.toLowerCase().includes('technical debt')) {
                calculatedScore = extractSectionScore('Technical Debt');
              } else if (sectionName.toLowerCase().includes('test quality')) {
                calculatedScore = extractSectionScore('Test Quality');
              } else if (sectionName.toLowerCase().includes('documentation')) {
                calculatedScore = extractSectionScore('Documentation');
              } else if (sectionName.toLowerCase().includes('deployment')) {
                calculatedScore = extractSectionScore('Deployment');
              } else if (sectionName.toLowerCase().includes('dependencies')) {
                calculatedScore = extractSectionScore('Dependencies');
              } else if (sectionName.toLowerCase().includes('team morale') || sectionName.toLowerCase().includes('morale') || sectionName.toLowerCase().includes('velocity')) {
                // Try both possible names from the prompt
                calculatedScore = extractSectionScore('Team Velocity & Morale') || extractSectionScore('Team Morale');
              }
              
              console.log(`${sectionName}: original=${section.score}, calculated=${calculatedScore}`);
              
              return {
                ...section,
                score: calculatedScore || section.score // Use calculated score, fallback to original
              };
            });
          }
        }

        setParsedInsights(parsed);
      } catch (parseError) {
        console.error('Parse error:', parseError);
        console.log('Could not parse as JSON, showing raw response');
        setParsedInsights(null);
      }

      toast({
        title: "Success",
        description: "Project insights generated successfully",
      });
    } catch (error: any) {
      setError(error.message || "Failed to generate insights");
      toast({
        title: "Error",
        description: error.message || "Failed to generate insights",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = async () => {
    await generateInsightsForProject(projectName);
  };

  const getScoreColor = (score: number) => {
    if (score >= 4) return "text-green-600";
    if (score >= 3) return "text-blue-600";
    if (score >= 2) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadge = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score >= 4) return "default";
    if (score >= 3) return "secondary";
    if (score >= 2) return "outline";
    return "destructive";
  };

  const getStatusType = (score: number): "good" | "warning" | "critical" => {
    if (score >= 4) return "good";
    if (score >= 2) return "warning";
    return "critical";
  };

  const toggleSection = (sectionName: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionName)) {
      newExpanded.delete(sectionName);
    } else {
      newExpanded.add(sectionName);
    }
    setExpandedSections(newExpanded);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Project Insights
              </h1>
              {projectName && (
                <p className="text-sm text-muted-foreground mt-1">
                  {projectName}
                </p>
              )}
            </div>
          </div>
          <Button
            onClick={generateInsights}
            disabled={loading || !projectName}
            size="sm"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Generate Insights
              </>
            )}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!rawInsights && !loading && (
          <Card className="p-12 text-center">
            <h2 className="text-xl font-semibold mb-2">No Insights Generated Yet</h2>
            <p className="text-muted-foreground mb-6">
              Click "Generate Insights" to analyze this project using AI
            </p>
          </Card>
        )}

        {parsedInsights && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {parsedInsights.final_user_score !== undefined && (
                <Card className="p-6">
                  <div className="text-sm font-medium text-muted-foreground mb-2">User Score</div>
                  <div className={`text-4xl font-bold ${getScoreColor(parsedInsights.final_user_score)}`}>
                    {parsedInsights.final_user_score.toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Form-based metrics</div>
                </Card>
              )}
              {parsedInsights.api_scores?.api_score !== undefined && (
                <Card className="p-6">
                  <div className="text-sm font-medium text-muted-foreground mb-2">API Score</div>
                  <div className={`text-4xl font-bold ${getScoreColor(parsedInsights.api_scores.api_score)}`}>
                    {parsedInsights.api_scores.api_score.toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">GitLab + SonarCloud</div>
                </Card>
              )}
              {parsedInsights.combined_score !== undefined && (
                <Card className="p-6">
                  <div className="text-sm font-medium text-muted-foreground mb-2">Combined Score</div>
                  <div className={`text-4xl font-bold ${getScoreColor(parsedInsights.combined_score)}`}>
                    {parsedInsights.combined_score.toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">70% User + 30% API</div>
                </Card>
              )}
              {parsedInsights.interpretation && (
                <Card className="p-6">
                  <div className="text-sm font-medium text-muted-foreground mb-2">Status</div>
                  <div className="text-lg font-semibold text-foreground mt-2">
                    {parsedInsights.interpretation}
                  </div>
                </Card>
              )}
            </div>

            {/* Insights Table */}
            {parsedInsights.section_scores && parsedInsights.section_scores.length > 0 && (
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50 sticky top-0 z-10">
                      <tr className="border-b">
                        <th className="text-left p-4 font-semibold text-sm w-[200px]">Section</th>
                        <th className="text-left p-4 font-semibold text-sm w-[120px]">Score</th>
                        <th className="text-left p-4 font-semibold text-sm">Analysis</th>
                        <th className="text-left p-4 font-semibold text-sm">Recommendations</th>
                        <th className="w-12"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedInsights.section_scores.map((section, idx) => {
                        const isExpanded = expandedSections.has(section.name);
                        const statusType = getStatusType(section.score);
                        const improvement = parsedInsights.areas_needing_improvement?.find(
                          area => area.area.toLowerCase().includes(section.name.toLowerCase())
                        );

                        return (
                          <tr key={idx} className="border-b hover:bg-muted/30 transition-colors">
                            <td className="p-4">
                              <div className="font-medium">{section.name}</div>
                            </td>
                            <td className="p-4">
                              <Badge
                                variant={getScoreBadge(section.score)}
                                className="font-mono"
                              >
                                {section.score.toFixed(2)}
                              </Badge>
                            </td>
                            <td className="p-4">
                              <div className="text-sm text-muted-foreground">
                                {section.analysis || (improvement?.issues && improvement.issues.length > 0 ? improvement.issues.join('. ') : '')}
                              </div>
                            </td>
                            <td className="p-4">
                              {improvement?.recommendations && improvement.recommendations.length > 0 ? (
                                <ul className="text-sm space-y-1">
                                  {(isExpanded 
                                    ? improvement.recommendations 
                                    : improvement.recommendations.slice(0, 2)
                                  ).map((rec, recIdx) => (
                                    <li key={recIdx} className="text-muted-foreground">• {rec}</li>
                                  ))}
                                  {improvement.recommendations.length > 2 && !isExpanded && (
                                    <li className="text-xs text-blue-600 cursor-pointer" onClick={() => toggleSection(section.name)}>
                                      +{improvement.recommendations.length - 2} more...
                                    </li>
                                  )}
                                </ul>
                              ) : (
                                <span className="text-sm text-muted-foreground">Performing well</span>
                              )}
                            </td>
                            <td className="p-4">
                              {improvement && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleSection(section.name)}
                                >
                                  {isExpanded ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* Detailed Calculations */}
            {parsedInsights.detailed_calculations && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Detailed Calculations</h2>
                <pre className="whitespace-pre-wrap bg-muted p-4 rounded-lg text-xs overflow-x-auto font-mono">
                  {parsedInsights.detailed_calculations}
                </pre>
              </Card>
            )}
          </div>
        )}

        {/* Raw Response (if parsing failed) */}
        {rawInsights && !parsedInsights && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">AI Response</h2>
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                {rawInsights}
              </pre>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ProjectInsight;

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { RefreshCw, Activity } from "lucide-react";
import { format } from "date-fns";

interface HealthScoreTrendsProps {
  data: any[];
  loading: boolean;
}

export const HealthScoreTrendsCard = ({ data, loading }: HealthScoreTrendsProps) => {
  // Format data for display - show date only on X-axis, but keep full timestamp for uniqueness
  const formattedData = data.map(item => ({
    ...item,
    timestamp: item.date, // Keep full timestamp for data point uniqueness
    date: format(new Date(item.date), 'MMM dd'), // Display just the date on X-axis
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Health Score Trends (0-5)</CardTitle>
        <p className="text-sm text-muted-foreground">
          Track health scores across all 6 metrics over time
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[400px] flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : data.length === 0 ? (
          <div className="h-[400px] flex flex-col items-center justify-center text-muted-foreground">
            <Activity className="h-12 w-12 mb-4 opacity-50" />
            <p>No health score history available</p>
            <p className="text-sm">Refresh metrics to start tracking</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                domain={[0, 5]} 
                ticks={[0, 1, 2, 3, 4, 5]}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend 
                wrapperStyle={{
                  paddingTop: '20px',
                  fontSize: '12px',
                }}
              />
              
              {/* Issue Health */}
              <Line 
                type="monotone" 
                dataKey="issue_health" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Issue Health"
              />
              
              {/* MR Health */}
              <Line 
                type="monotone" 
                dataKey="mr_health" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={{ r: 4 }}
                name="MR Health"
              />
              
              {/* Commit Health */}
              <Line 
                type="monotone" 
                dataKey="commit_health" 
                stroke="#ffc658" 
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Commit Health"
              />
              
              {/* Reliability Health (SonarQube) */}
              <Line 
                type="monotone" 
                dataKey="reliability_health" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Reliability"
              />
              
              {/* Maintainability Health (SonarQube) */}
              <Line 
                type="monotone" 
                dataKey="maintainability_health" 
                stroke="#ec4899" 
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Maintainability"
              />
              
              {/* Security Health (SonarQube) */}
              <Line 
                type="monotone" 
                dataKey="security_health" 
                stroke="#ef4444" 
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Security"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

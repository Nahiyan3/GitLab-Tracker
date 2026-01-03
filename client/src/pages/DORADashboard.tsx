import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, Rocket, Clock, AlertTriangle, Wrench, Calendar } from 'lucide-react';
import { api } from '../lib/api';

interface DoraTrendDataPoint {
  period: string;
  deployment_frequency: number;
  avg_lead_time_hours: number;
  failure_rate_percent: number;
  avg_restore_time_hours: number;
  total_deployments: number;
  total_changes: number;
  failed_deployments: number;
  total_incidents: number;
}

interface DoraTrendSummary {
  current: number;
  avg: number;
  trend: 'up' | 'down' | 'stable';
  change_percent: number;
}

interface DoraTrendResponse {
  granularity: 'weekly' | 'monthly' | 'yearly';
  data: DoraTrendDataPoint[];
  summary: {
    deployment_frequency: DoraTrendSummary;
    lead_time: DoraTrendSummary;
    failure_rate: DoraTrendSummary;
    restore_time: DoraTrendSummary;
  };
}

const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  cyan: '#06b6d4',
};

const DORADashboard = () => {
  const { id } = useParams<{ id: string }>();
  const [granularity, setGranularity] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [trendData, setTrendData] = useState<DoraTrendResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTrendData();
  }, [id, granularity]);

  const fetchTrendData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/projects/${id}/dora/trends?granularity=${granularity}&periods=12`);
      if (response.success) {
        setTrendData(response.data);
      }
    } catch (err) {
      console.error('Error fetching DORA trends:', err);
      setError('Failed to load DORA metrics');
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable', isPositive: boolean = true) => {
    if (trend === 'stable') return <Minus className="w-4 h-4 text-gray-500" />;
    if ((trend === 'up' && isPositive) || (trend === 'down' && !isPositive)) {
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    }
    return <TrendingDown className="w-4 h-4 text-red-600" />;
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable', isPositive: boolean = true) => {
    if (trend === 'stable') return 'text-gray-600';
    if ((trend === 'up' && isPositive) || (trend === 'down' && !isPositive)) {
      return 'text-green-600';
    }
    return 'text-red-600';
  };

  const getPerformanceRating = (metric: string, value: number): { rating: string; color: string } => {
    switch (metric) {
      case 'deployment_frequency':
        if (value >= 30) return { rating: 'Elite', color: 'text-purple-600' };
        if (value >= 7) return { rating: 'High', color: 'text-blue-600' };
        if (value >= 1) return { rating: 'Medium', color: 'text-yellow-600' };
        return { rating: 'Low', color: 'text-gray-600' };
      
      case 'lead_time':
        if (value <= 24) return { rating: 'Elite', color: 'text-purple-600' };
        if (value <= 168) return { rating: 'High', color: 'text-blue-600' };
        if (value <= 720) return { rating: 'Medium', color: 'text-yellow-600' };
        return { rating: 'Low', color: 'text-gray-600' };
      
      case 'failure_rate':
        if (value <= 5) return { rating: 'Elite', color: 'text-purple-600' };
        if (value <= 10) return { rating: 'High', color: 'text-blue-600' };
        if (value <= 15) return { rating: 'Medium', color: 'text-yellow-600' };
        return { rating: 'Low', color: 'text-gray-600' };
      
      case 'restore_time':
        if (value <= 1) return { rating: 'Elite', color: 'text-purple-600' };
        if (value <= 24) return { rating: 'High', color: 'text-blue-600' };
        if (value <= 168) return { rating: 'Medium', color: 'text-yellow-600' };
        return { rating: 'Low', color: 'text-gray-600' };
      
      default:
        return { rating: 'Unknown', color: 'text-gray-600' };
    }
  };

  const formatPeriodLabel = (period: string) => {
    if (granularity === 'weekly') {
      return period.replace('W', 'Week ');
    }
    return period;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading DORA metrics...</p>
        </div>
      </div>
    );
  }

  if (error || !trendData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error || 'No data available'}</p>
          <Button onClick={fetchTrendData} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const { summary, data } = trendData;

  // Prepare data for failure rate pie chart
  const latestData = data[data.length - 1];
  const failureChartData = [
    { name: 'Successful', value: latestData.total_deployments - latestData.failed_deployments },
    { name: 'Failed', value: latestData.failed_deployments },
  ];

  const deploymentPerf = getPerformanceRating('deployment_frequency', summary.deployment_frequency.current);
  const leadTimePerf = getPerformanceRating('lead_time', summary.lead_time.current);
  const failureRatePerf = getPerformanceRating('failure_rate', summary.failure_rate.current);
  const restoreTimePerf = getPerformanceRating('restore_time', summary.restore_time.current);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Rocket className="w-8 h-8 text-blue-600" />
            DORA Metrics Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Track your team's software delivery performance
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-gray-500" />
          <Select value={granularity} onValueChange={(value: any) => setGranularity(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Deployment Frequency Card */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Deployment Frequency
              </CardTitle>
              {getTrendIcon(summary.deployment_frequency.trend, true)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-3xl font-bold">{summary.deployment_frequency.current}</div>
              <div className="text-sm text-gray-600">
                per {granularity === 'weekly' ? 'week' : granularity === 'monthly' ? 'month' : 'year'}
              </div>
              <div className={`text-sm font-medium ${getTrendColor(summary.deployment_frequency.trend, true)}`}>
                {Math.abs(summary.deployment_frequency.change_percent).toFixed(1)}% from previous period
              </div>
              <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${deploymentPerf.color} bg-opacity-10`}>
                {deploymentPerf.rating}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lead Time Card */}
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Lead Time for Changes
              </CardTitle>
              {getTrendIcon(summary.lead_time.trend, false)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-3xl font-bold">{summary.lead_time.current.toFixed(1)}</div>
              <div className="text-sm text-gray-600">hours avg</div>
              <div className={`text-sm font-medium ${getTrendColor(summary.lead_time.trend, false)}`}>
                {Math.abs(summary.lead_time.change_percent).toFixed(1)}% from previous period
              </div>
              <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${leadTimePerf.color} bg-opacity-10`}>
                {leadTimePerf.rating}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Change Failure Rate Card */}
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Change Failure Rate
              </CardTitle>
              {getTrendIcon(summary.failure_rate.trend, false)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-3xl font-bold">{summary.failure_rate.current.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">failure rate</div>
              <div className={`text-sm font-medium ${getTrendColor(summary.failure_rate.trend, false)}`}>
                {Math.abs(summary.failure_rate.change_percent).toFixed(1)}% from previous period
              </div>
              <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${failureRatePerf.color} bg-opacity-10`}>
                {failureRatePerf.rating}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Time to Restore Card */}
        <Card className="border-l-4 border-l-cyan-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Time to Restore Service
              </CardTitle>
              {getTrendIcon(summary.restore_time.trend, false)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-3xl font-bold">{summary.restore_time.current.toFixed(1)}</div>
              <div className="text-sm text-gray-600">hours avg</div>
              <div className={`text-sm font-medium ${getTrendColor(summary.restore_time.trend, false)}`}>
                {Math.abs(summary.restore_time.change_percent).toFixed(1)}% from previous period
              </div>
              <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${restoreTimePerf.color} bg-opacity-10`}>
                {restoreTimePerf.rating}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="deployment" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="deployment">Deployment Frequency</TabsTrigger>
          <TabsTrigger value="leadtime">Lead Time</TabsTrigger>
          <TabsTrigger value="failure">Failure Rate</TabsTrigger>
          <TabsTrigger value="restore">Time to Restore</TabsTrigger>
        </TabsList>

        {/* Deployment Frequency Chart */}
        <TabsContent value="deployment">
          <Card>
            <CardHeader>
              <CardTitle>Deployment Frequency Trend</CardTitle>
              <CardDescription>
                Number of deployments per {granularity === 'weekly' ? 'week' : granularity === 'monthly' ? 'month' : 'year'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data}>
                    <defs>
                      <linearGradient id="colorDeployment" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="period" 
                      tickFormatter={formatPeriodLabel}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={formatPeriodLabel}
                      formatter={(value: number) => [value, 'Deployments']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="deployment_frequency" 
                      stroke={COLORS.primary} 
                      fillOpacity={1} 
                      fill="url(#colorDeployment)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-sm text-gray-600">Current</div>
                  <div className="text-2xl font-bold">{summary.deployment_frequency.current}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Average</div>
                  <div className="text-2xl font-bold">{summary.deployment_frequency.avg.toFixed(1)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Total ({data.length} periods)</div>
                  <div className="text-2xl font-bold">
                    {data.reduce((sum, d) => sum + d.total_deployments, 0)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lead Time Chart */}
        <TabsContent value="leadtime">
          <Card>
            <CardHeader>
              <CardTitle>Lead Time for Changes Trend</CardTitle>
              <CardDescription>
                Average time from commit to production (in hours)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="period" 
                      tickFormatter={formatPeriodLabel}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={formatPeriodLabel}
                      formatter={(value: number) => [value.toFixed(2) + ' hrs', 'Lead Time']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="avg_lead_time_hours" 
                      stroke={COLORS.purple} 
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-sm text-gray-600">Current</div>
                  <div className="text-2xl font-bold">{summary.lead_time.current.toFixed(1)} hrs</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Average</div>
                  <div className="text-2xl font-bold">{summary.lead_time.avg.toFixed(1)} hrs</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Total Changes</div>
                  <div className="text-2xl font-bold">
                    {data.reduce((sum, d) => sum + d.total_changes, 0)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Change Failure Rate Chart */}
        <TabsContent value="failure">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Change Failure Rate Trend</CardTitle>
                <CardDescription>
                  Percentage of deployments causing failures
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="period" 
                        tickFormatter={formatPeriodLabel}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis unit="%" />
                      <Tooltip 
                        labelFormatter={formatPeriodLabel}
                        formatter={(value: number) => [value.toFixed(2) + '%', 'Failure Rate']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="failure_rate_percent" 
                        stroke={COLORS.warning} 
                        strokeWidth={3}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current Period Breakdown</CardTitle>
                <CardDescription>
                  Success vs. failure distribution
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={failureChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {failureChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? COLORS.success : COLORS.danger} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 text-center">
                  <div className="text-sm text-gray-600">Total Deployments</div>
                  <div className="text-2xl font-bold">{latestData.total_deployments}</div>
                  <div className="text-sm text-gray-600 mt-2">
                    {latestData.failed_deployments} failures ({latestData.failure_rate_percent.toFixed(1)}%)
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Time to Restore Chart */}
        <TabsContent value="restore">
          <Card>
            <CardHeader>
              <CardTitle>Time to Restore Service Trend</CardTitle>
              <CardDescription>
                Average time to recover from incidents (in hours)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="period" 
                      tickFormatter={formatPeriodLabel}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis unit=" hrs" />
                    <Tooltip 
                      labelFormatter={formatPeriodLabel}
                      formatter={(value: number) => [value.toFixed(2) + ' hrs', 'Restore Time']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="avg_restore_time_hours" 
                      stroke={COLORS.cyan} 
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-sm text-gray-600">Current</div>
                  <div className="text-2xl font-bold">{summary.restore_time.current.toFixed(1)} hrs</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Average</div>
                  <div className="text-2xl font-bold">{summary.restore_time.avg.toFixed(1)} hrs</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Total Incidents</div>
                  <div className="text-2xl font-bold">
                    {data.reduce((sum, d) => sum + d.total_incidents, 0)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>DORA Performance Summary</CardTitle>
          <CardDescription>
            Overall software delivery performance based on DORA metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Rocket className="w-5 h-5 text-blue-600" />
                <div className="font-semibold">Deployment Frequency</div>
              </div>
              <div className={`text-2xl font-bold ${deploymentPerf.color}`}>
                {deploymentPerf.rating}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {summary.deployment_frequency.current} per {granularity === 'weekly' ? 'week' : granularity === 'monthly' ? 'month' : 'year'}
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-purple-600" />
                <div className="font-semibold">Lead Time</div>
              </div>
              <div className={`text-2xl font-bold ${leadTimePerf.color}`}>
                {leadTimePerf.rating}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {summary.lead_time.current.toFixed(1)} hours avg
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <div className="font-semibold">Change Failure Rate</div>
              </div>
              <div className={`text-2xl font-bold ${failureRatePerf.color}`}>
                {failureRatePerf.rating}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {summary.failure_rate.current.toFixed(1)}% failure rate
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Wrench className="w-5 h-5 text-cyan-600" />
                <div className="font-semibold">Time to Restore</div>
              </div>
              <div className={`text-2xl font-bold ${restoreTimePerf.color}`}>
                {restoreTimePerf.rating}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {summary.restore_time.current.toFixed(1)} hours avg
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DORADashboard;

'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/app/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DollarSign, Activity, Zap, AlertCircle } from 'lucide-react';

interface UsageData {
  totalCost: number;
  totals: {
    sessions: number;
    tokensIn: number;
    tokensOut: number;
    totalCost: number;
  };
  providerBreakdown: Array<{
    provider: string;
    sessions: number;
    tokensIn: number;
    tokensOut: number;
    totalTokens: number;
    cost: number;
  }>;
  topAgents: Array<{
    agentId: string;
    agentName: string;
    sessions: number;
    totalTokens: number;
    cost: number;
  }>;
}

export default function AnalyticsPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Set default date range (last 30 days)
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);

    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      if (new Date(startDate) > new Date(endDate)) {
        setError('Start date cannot be after end date');
        setUsageData(null);
        return;
      }
      loadUsageData();
    }
  }, [startDate, endDate]);

  const loadUsageData = async () => {
    if (!startDate || !endDate) return;

    setIsLoading(true);
    setError('');

    const response = await apiClient.get<UsageData>(
      `/usage?startDate=${startDate}&endDate=${endDate}`
    );

    if (response.error) {
      setError(response.error);
    } else if (response.data) {
      setUsageData(response.data);
    }

    setIsLoading(false);
  };

  const handleRefresh = () => {
    loadUsageData();
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          Analytics
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-2">
          Track usage, costs, and performance metrics
        </p>
      </div>

      {/* Date Range Selector */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Date Range</CardTitle>
          <CardDescription>Select the period to analyze</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleRefresh} 
              disabled={isLoading || !!(startDate && endDate && new Date(startDate) > new Date(endDate))}
            >
              {isLoading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {usageData?.totals?.sessions?.toLocaleString() || 0}
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                  Conversation sessions
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
            <Zap className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {((usageData?.totals?.tokensIn ?? 0) + (usageData?.totals?.tokensOut ?? 0)).toLocaleString()}
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                  Input + output tokens
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  ${(usageData?.totalCost || 0).toFixed(4)}
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                  Total spend
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Provider Breakdown */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Provider Breakdown</CardTitle>
          <CardDescription>
            Usage and costs by AI provider
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !usageData ? (
            <div className="text-center py-8 text-zinc-600 dark:text-zinc-400">
              No usage data for the selected period
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead className="text-right">Sessions</TableHead>
                  <TableHead className="text-right">Tokens In</TableHead>
                  <TableHead className="text-right">Tokens Out</TableHead>
                  <TableHead className="text-right">Total Tokens</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usageData.providerBreakdown.map((provider) => (
                  <TableRow key={provider.provider}>
                    <TableCell>
                      <Badge variant="outline">{provider.provider}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {provider.sessions.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {provider.tokensIn.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {provider.tokensOut.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {provider.totalTokens.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${provider.cost.toFixed(6)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Top Agents by Cost */}
      <Card>
        <CardHeader>
          <CardTitle>Top Agents by Cost</CardTitle>
          <CardDescription>
            Agents ranked by total spend
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !usageData || usageData.topAgents.length === 0 ? (
            <div className="text-center py-8 text-zinc-600 dark:text-zinc-400">
              No agent usage data for the selected period
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead className="text-right">Sessions</TableHead>
                  <TableHead className="text-right">Total Tokens</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usageData.topAgents.map((agent) => (
                  <TableRow key={agent.agentId}>
                    <TableCell className="font-medium">
                      {agent.agentName}
                    </TableCell>
                    <TableCell className="text-right">
                      {agent.sessions.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {agent.totalTokens.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${agent.cost.toFixed(6)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

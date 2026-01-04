'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '../lib/api-client';
import { Agent } from '../lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Bot, MessageSquare, DollarSign, TrendingUp } from 'lucide-react';

interface DashboardStats {
  totalAgents: number;
  totalSessions: number;
  totalCost: number;
  tokensUsed: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setIsLoading(true);

    // Fetch agents
    const agentsResponse = await apiClient.get<Agent[]>('/agents');
    
    // Fetch usage for last 30 days
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const usageResponse = await apiClient.get<{
      totals: {
        sessions: number;
        tokensIn: number;
        tokensOut: number;
        totalCost: number;
      };
      totalCost: number;
    }>(`/usage?startDate=${startDate}&endDate=${endDate}`);

    setStats({
      totalAgents: agentsResponse.data?.length || 0,
      totalSessions: usageResponse.data?.totals?.sessions || 0,
      totalCost: usageResponse.data?.totals?.totalCost || 0,
      tokensUsed: (usageResponse.data?.totals?.tokensIn || 0) + (usageResponse.data?.totals?.tokensOut || 0),
    });

    setIsLoading(false);
  };

  const statCards = [
    {
      title: 'Total Agents',
      value: stats?.totalAgents || 0,
      icon: Bot,
      description: 'Active AI agents',
      color: 'text-blue-600',
    },
    {
      title: 'Total Sessions',
      value: stats?.totalSessions || 0,
      icon: MessageSquare,
      description: 'Last 30 days',
      color: 'text-green-600',
    },
    {
      title: 'Total Cost',
      value: `$${(stats?.totalCost || 0).toFixed(4)}`,
      icon: DollarSign,
      description: 'Last 30 days',
      color: 'text-purple-600',
    },
    {
      title: 'Tokens Used',
      value: (stats?.tokensUsed || 0).toLocaleString(),
      icon: TrendingUp,
      description: 'Last 30 days',
      color: 'text-orange-600',
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          Dashboard
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-2">
          Welcome to your VocalBridge dashboard
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                      {stat.description}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

    </div>
  );
}

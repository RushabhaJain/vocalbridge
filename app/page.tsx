import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, MessageSquare, BarChart3, Shield, Zap, Globe } from "lucide-react";

export default function Home() {
  const features = [
    {
      icon: Bot,
      title: "Multi-Tenant Architecture",
      description: "Complete tenant isolation with API key authentication for secure, scalable deployments.",
    },
    {
      icon: MessageSquare,
      title: "Unified Conversation API",
      description: "Vendor-agnostic API for managing conversations across multiple AI providers.",
    },
    {
      icon: Shield,
      title: "Reliability Built-In",
      description: "Automatic retries, timeouts, and fallback between providers for maximum uptime.",
    },
    {
      icon: BarChart3,
      title: "Usage Metering",
      description: "Real-time cost calculation and usage tracking with detailed analytics.",
    },
    {
      icon: Zap,
      title: "Provider Abstraction",
      description: "Extensible adapter pattern supporting multiple AI providers with ease.",
    },
    {
      icon: Globe,
      title: "Production Ready",
      description: "Structured logging, error handling, and idempotency for production workloads.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">
            VocalBridge
          </h1>
          <p className="text-xl md:text-2xl text-zinc-600 dark:text-zinc-400 mb-8">
            Multi-Tenant AI Agent Gateway Platform
          </p>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-8 max-w-2xl mx-auto">
            Build, manage, and scale AI agents with unified conversation APIs, 
            provider abstraction, and real-time usage metering.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="text-lg px-8">
                Get Started
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline" className="text-lg px-8">
                View Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="border-zinc-200 dark:border-zinc-800">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Start Section */}
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">Quick Start</CardTitle>
            <CardDescription className="text-base">
              Get up and running in minutes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Install Dependencies</h3>
                  <code className="block bg-zinc-100 dark:bg-zinc-800 p-3 rounded text-sm">
                    npm install
                  </code>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Setup Database</h3>
                  <code className="block bg-zinc-100 dark:bg-zinc-800 p-3 rounded text-sm">
                    npm run db:push && npm run db:seed
                  </code>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Start Development Server</h3>
                  <code className="block bg-zinc-100 dark:bg-zinc-800 p-3 rounded text-sm">
                    npm run dev
                  </code>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Access Dashboard</h3>
                  <p className="text-zinc-600 dark:text-zinc-400">
                    Navigate to{" "}
                    <Link href="/login" className="text-blue-600 dark:text-blue-400 hover:underline">
                      /login
                    </Link>{" "}
                    and use the API key from the seed output
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                For complete documentation, see the{" "}
                <a 
                  href="https://github.com/yourusername/vocalbridge" 
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  README.md
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

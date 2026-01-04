'use client';

import { useEffect, useState, useRef } from 'react';
import { apiClient } from '@/app/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Send, Bot, User, AlertCircle, Loader2 } from 'lucide-react';

import { Agent, ConversationMessage as Message, Session, SendMessageResponse } from '@/app/lib/types';

export default function ChatPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoadingAgents, setIsLoadingAgents] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadAgents();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadAgents = async () => {
    setIsLoadingAgents(true);
    const response = await apiClient.get<Agent[]>('/agents');

    if (response.data) {
      setAgents(response.data || []);
      if (response.data.length > 0) {
        setSelectedAgentId(response.data[0].id);
      }
    }

    setIsLoadingAgents(false);
  };

  const startSession = async () => {
    if (!selectedAgentId || !customerId) {
      setError('Please select an agent and enter a customer ID');
      return;
    }

    setError('');
    const response = await apiClient.post<{ sessionId: string }>('/sessions', {
      agentId: selectedAgentId,
      customerId,
    });

    if (response.error) {
      setError(response.error);
    } else if (response.data) {
      setSession({
        id: response.data.sessionId,
        agentId: selectedAgentId,
        customerId,
        messages: [],
      } as Session);
      setMessages([]);
    }
  };

  const sendMessage = async () => {
    if (!session || !inputMessage.trim()) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsSending(true);
    setError('');

    // Add user message to UI immediately
    const tempUserMessage: Message = {
      role: 'user',
      content: userMessage,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);

    // Send message to API
    const idempotencyKey = `msg-${session.id}-${Date.now()}`;
    const response = await apiClient.post<SendMessageResponse>('/messages', {
      sessionId: session.id,
      message: userMessage,
      idempotencyKey,
    });

    if (response.error) {
      setError(response.error);
      // Remove temp message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id));
    } else if (response.data) {
      // Create assistant message object from response
      const assistantMsg: Message = {
        role: 'assistant',
        content: response.data.assistantMessage,
        createdAt: new Date().toISOString(),
        metadata: {
          provider: response.data.provider,
          tokensIn: response.data.tokensIn,
          tokensOut: response.data.tokensOut,
          cost: response.data.cost,
        },
      };

      // Update messages: keep existing, keep current user message (maybe update ID), add assistant message
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== tempUserMessage.id);
        return [
          ...filtered,
          { ...tempUserMessage, id: `user-${Date.now()}` },
          assistantMsg,
        ];
      });
    }

    setIsSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const selectedAgent = agents.find((a) => a.id === selectedAgentId);

  return (
    <div className="p-8 h-screen flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          Chat
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-2">
          Test your agents with interactive conversations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
        {/* Configuration Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>Select agent and start a session</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="agent">Agent</Label>
              {isLoadingAgents ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {selectedAgent && (
              <div className="space-y-2 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                <div className="text-sm">
                  <span className="font-medium">Primary:</span>{' '}
                  <Badge variant="outline" className="ml-1">
                    {selectedAgent.primaryProvider}
                  </Badge>
                </div>
                {selectedAgent.fallbackProvider && (
                  <div className="text-sm">
                    <span className="font-medium">Fallback:</span>{' '}
                    <Badge variant="secondary" className="ml-1">
                      {selectedAgent.fallbackProvider}
                    </Badge>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="customerId">Customer ID</Label>
              <Input
                id="customerId"
                placeholder="customer-123"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                disabled={!!session}
              />
            </div>

            {!session ? (
              <Button
                onClick={startSession}
                className="w-full"
                disabled={!selectedAgentId || !customerId}
              >
                Start Session
              </Button>
            ) : (
              <div className="space-y-2">
                <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">
                    Session Active
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                    ID: {session.id.substring(0, 8)}...
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSession(null);
                    setMessages([]);
                    setCustomerId('');
                  }}
                >
                  End Session
                </Button>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Chat Panel */}
        <Card className="lg:col-span-2 flex flex-col">
          <CardHeader>
            <CardTitle>Conversation</CardTitle>
            <CardDescription>
              {session
                ? `Chatting with ${selectedAgent?.name}`
                : 'Start a session to begin chatting'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col min-h-0">
            <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-zinc-400">
                  <p>No messages yet. Send a message to start the conversation.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => {
                    if (!message) return null;
                    return (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {message.role === 'assistant' && (
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                            <Bot className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                          </div>
                        )}
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            message.role === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          {message.metadata && (
                            <div className="mt-2 pt-2 border-t border-zinc-200 dark:border-zinc-700 text-xs opacity-70">
                              <div className="flex gap-3">
                                <span>Provider: {message.metadata.provider}</span>
                                <span>Tokens: {(message.metadata.tokensIn || 0) + (message.metadata.tokensOut || 0)}</span>
                                <span>Cost: ${message.metadata.cost?.toFixed(6)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                        {message.role === 'user' && (
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                            <User className="h-4 w-4 text-zinc-600 dark:text-zinc-300" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {isSending && (
                    <div className="flex gap-3 justify-start">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                      </div>
                      <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-3">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            <div className="mt-4 flex gap-2">
              <Input
                placeholder={session ? "Type your message..." : "Start a session first"}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={!session || isSending}
              />
              <Button
                onClick={sendMessage}
                disabled={!session || !inputMessage.trim() || isSending}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

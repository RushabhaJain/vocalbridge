'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/app/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Pencil, Trash2, AlertCircle } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  primaryProvider: string;
  fallbackProvider: string | null;
  systemPrompt: string;
  enabledTools: string[];
  createdAt: string;
}

interface AgentFormData {
  name: string;
  primaryProvider: string;
  fallbackProvider: string;
  systemPrompt: string;
  enabledTools: string;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [formData, setFormData] = useState<AgentFormData>({
    name: '',
    primaryProvider: 'vendorA',
    fallbackProvider: '',
    systemPrompt: '',
    enabledTools: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    setIsLoading(true);
    setError('');

    const response = await apiClient.get<Agent[]>('/agents');

    if (response.error) {
      setError(response.error);
    } else {
      setAgents(response.data || []);
    }

    setIsLoading(false);
  };

  const handleCreate = async () => {
    setIsSaving(true);
    setError('');

    const enabledTools = formData.enabledTools
      ? formData.enabledTools.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    const response = await apiClient.post('/agents', {
      name: formData.name,
      primaryProvider: formData.primaryProvider,
      fallbackProvider: formData.fallbackProvider || null,
      systemPrompt: formData.systemPrompt,
      enabledTools,
    });

    if (response.error) {
      setError(response.error);
    } else {
      setIsCreateDialogOpen(false);
      resetForm();
      loadAgents();
    }

    setIsSaving(false);
  };

  const handleEdit = async () => {
    if (!selectedAgent) return;

    setIsSaving(true);
    setError('');

    const enabledTools = formData.enabledTools
      ? formData.enabledTools.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    const response = await apiClient.put(`/agents/${selectedAgent.id}`, {
      name: formData.name,
      primaryProvider: formData.primaryProvider,
      fallbackProvider: formData.fallbackProvider || null,
      systemPrompt: formData.systemPrompt,
      enabledTools,
    });

    if (response.error) {
      setError(response.error);
    } else {
      setIsEditDialogOpen(false);
      setSelectedAgent(null);
      resetForm();
      loadAgents();
    }

    setIsSaving(false);
  };

  const handleDelete = async () => {
    if (!selectedAgent) return;

    setIsSaving(true);
    setError('');

    const response = await apiClient.delete(`/agents/${selectedAgent.id}`);

    if (response.error) {
      setError(response.error);
    } else {
      setIsDeleteDialogOpen(false);
      setSelectedAgent(null);
      loadAgents();
    }

    setIsSaving(false);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (agent: Agent) => {
    setSelectedAgent(agent);
    setFormData({
      name: agent.name,
      primaryProvider: agent.primaryProvider,
      fallbackProvider: agent.fallbackProvider || '',
      systemPrompt: agent.systemPrompt,
      enabledTools: agent.enabledTools.join(', '),
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (agent: Agent) => {
    setSelectedAgent(agent);
    setIsDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      primaryProvider: 'vendorA',
      fallbackProvider: '',
      systemPrompt: '',
      enabledTools: '',
    });
    setError('');
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            Agents
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">
            Manage your AI agents and their configurations
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Create Agent
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Your Agents</CardTitle>
          <CardDescription>
            {agents.length} agent{agents.length !== 1 ? 's' : ''} configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : agents.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                No agents yet. Create your first agent to get started.
              </p>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Create Agent
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Primary Provider</TableHead>
                  <TableHead>Fallback Provider</TableHead>
                  <TableHead>Tools</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agents.map((agent) => (
                  <TableRow key={agent.id}>
                    <TableCell className="font-medium">{agent.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{agent.primaryProvider}</Badge>
                    </TableCell>
                    <TableCell>
                      {agent.fallbackProvider ? (
                        <Badge variant="secondary">{agent.fallbackProvider}</Badge>
                      ) : (
                        <span className="text-zinc-400">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {agent.enabledTools.length > 0 ? (
                        <div className="flex gap-1 flex-wrap">
                          {agent.enabledTools.map((tool) => (
                            <Badge key={tool} variant="secondary" className="text-xs">
                              {tool}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-zinc-400">None</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(agent)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(agent)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Agent</DialogTitle>
            <DialogDescription>
              Configure a new AI agent with custom settings
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Support Bot"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primaryProvider">Primary Provider</Label>
                <Select
                  value={formData.primaryProvider}
                  onValueChange={(value) =>
                    setFormData({ ...formData, primaryProvider: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vendorA">Vendor A</SelectItem>
                    <SelectItem value="vendorB">Vendor B</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fallbackProvider">Fallback Provider (Optional)</Label>
                <Select
                  value={formData.fallbackProvider}
                  onValueChange={(value) =>
                    setFormData({ ...formData, fallbackProvider: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vendorA">Vendor A</SelectItem>
                    <SelectItem value="vendorB">Vendor B</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="systemPrompt">System Prompt</Label>
              <Textarea
                id="systemPrompt"
                placeholder="You are a helpful assistant..."
                rows={4}
                value={formData.systemPrompt}
                onChange={(e) =>
                  setFormData({ ...formData, systemPrompt: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="enabledTools">Enabled Tools (comma-separated)</Label>
              <Input
                id="enabledTools"
                placeholder="search, calculator, weather"
                value={formData.enabledTools}
                onChange={(e) =>
                  setFormData({ ...formData, enabledTools: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isSaving}>
              {isSaving ? 'Creating...' : 'Create Agent'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Agent</DialogTitle>
            <DialogDescription>
              Update agent configuration
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-primaryProvider">Primary Provider</Label>
                <Select
                  value={formData.primaryProvider}
                  onValueChange={(value) =>
                    setFormData({ ...formData, primaryProvider: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vendorA">Vendor A</SelectItem>
                    <SelectItem value="vendorB">Vendor B</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-fallbackProvider">Fallback Provider</Label>
                <Select
                  value={formData.fallbackProvider}
                  onValueChange={(value) =>
                    setFormData({ ...formData, fallbackProvider: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    <SelectItem value="vendorA">Vendor A</SelectItem>
                    <SelectItem value="vendorB">Vendor B</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-systemPrompt">System Prompt</Label>
              <Textarea
                id="edit-systemPrompt"
                rows={4}
                value={formData.systemPrompt}
                onChange={(e) =>
                  setFormData({ ...formData, systemPrompt: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-enabledTools">Enabled Tools</Label>
              <Input
                id="edit-enabledTools"
                value={formData.enabledTools}
                onChange={(e) =>
                  setFormData({ ...formData, enabledTools: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Agent</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedAgent?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSaving}
            >
              {isSaving ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

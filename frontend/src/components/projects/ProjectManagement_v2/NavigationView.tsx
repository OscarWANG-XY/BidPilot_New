// NavigationView.tsx
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardContent, CardFooter, CardDescription, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, ChevronRight, FileText, Users, Calendar } from 'lucide-react';
import { NavigationViewProps } from '@/components/projects/ProjectManagement_v2/types';
import PhaseIndicator from './PhaseIndicator';
import StatusBadge from './StatusBadge';

export const NavigationView: React.FC<NavigationViewProps> = ({ phases, activeTab, setActiveTab }) => {
  return (
    <div>
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="mb-6">
          <PhaseIndicator phases={phases} currentPhaseId={activeTab} />
        </div>
        
        <TabsList className="mb-4 w-full flex justify-between overflow-x-auto">
          {phases.map(phase => (
            <TabsTrigger 
              key={phase.id} 
              value={phase.id}
              className="flex items-center space-x-1"
            >
              <span>{phase.name}</span>
              <StatusBadge status={phase.status} />
            </TabsTrigger>
          ))}
        </TabsList>
        
        {phases.map(phase => (
          <TabsContent key={phase.id} value={phase.id} className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>{phase.name}</CardTitle>
                  <StatusBadge status={phase.status} />
                </div>
                <CardDescription>{phase.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Accordion type="multiple"  className="w-full">   {/* "single" collapsible */}
                  <AccordionItem value="tasks">
                    <AccordionTrigger>
                      <div className="flex items-center">
                        <CheckCircle2 className="mr-2 h-5 w-5" />
                        任务列表
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        {phase.tasks.map(task => (
                          <div key={task.id} className="flex items-center justify-between p-2 border rounded">
                            <div className="flex items-center">
                              <StatusBadge status={task.status} />
                              <span className="ml-2">{task.name}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <Calendar className="mr-1 h-4 w-4" />
                              {task.date}
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="documents">
                    <AccordionTrigger>
                      <div className="flex items-center">
                        <FileText className="mr-2 h-5 w-5" />
                        文档资料
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        {phase.documents.map(doc => (
                          <div key={doc.id} className="flex items-center p-2 border rounded">
                            <FileText className="mr-2 h-4 w-4 text-blue-500" />
                            <a href={doc.url} className="text-blue-500 hover:underline">{doc.name}</a>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="team">
                    <AccordionTrigger>
                      <div className="flex items-center">
                        <Users className="mr-2 h-5 w-5" />
                        团队成员
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        {phase.team.map(member => (
                          <div key={member.id} className="flex items-center justify-between p-2 border rounded">
                            <span>{member.name}</span>
                            <Badge variant="outline">{member.role}</Badge>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
              <CardFooter className="flex justify-between">
                {phases.findIndex(p => p.id === phase.id) > 0 && (
                  <button 
                    className="flex items-center text-sm text-gray-500 hover:text-gray-800"
                    onClick={() => {
                      const prevIndex = phases.findIndex(p => p.id === phase.id) - 1;
                      if (prevIndex >= 0) setActiveTab(phases[prevIndex].id);
                    }}
                  >
                    <ChevronRight className="mr-1 h-4 w-4 rotate-180" />
                    上一阶段
                  </button>
                )}
                {phases.findIndex(p => p.id === phase.id) < phases.length - 1 && (
                  <button 
                    className="flex items-center text-sm text-blue-500 hover:text-blue-700 ml-auto"
                    onClick={() => {
                      const nextIndex = phases.findIndex(p => p.id === phase.id) + 1;
                      if (nextIndex < phases.length) setActiveTab(phases[nextIndex].id);
                    }}
                  >
                    下一阶段
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </button>
                )}
              </CardFooter>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default NavigationView;
// ScrollView.tsx
import React from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, FileText, Users, Calendar } from 'lucide-react';
import { ScrollViewProps } from '@/components/projects/ProjectManagement_v2/types';
import PhaseIndicator from './PhaseIndicator';
import StatusBadge from './StatusBadge';

export const ScrollView: React.FC<ScrollViewProps> = ({ phases, activeTab }) => {
  return (
    <div className="space-y-8">
      <div className="mb-6">
        <PhaseIndicator phases={phases} currentPhaseId={activeTab} />
      </div>
      
      {phases.map((phase, index) => (
        <div key={phase.id} id={phase.id} className="scroll-mt-4">
          <Card className={`border-l-4 ${
            phase.status === 'completed' ? 'border-l-green-500' : 
            phase.status === 'in-progress' ? 'border-l-blue-500' : 
            'border-l-gray-300'
          }`}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <span className="bg-gray-200 text-gray-800 rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">
                    {index + 1}
                  </span>
                  {phase.name}
                </CardTitle>
                <StatusBadge status={phase.status} />
              </div>
              <CardDescription>{phase.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Accordion type="multiple" className="w-full">   {/* "single" collapsible */}
                <AccordionItem value="tasks">
                  <AccordionTrigger>
                    <div className="flex items-center">
                      <CheckCircle2 className="mr-2 h-5 w-5" />
                      任务列表 ({phase.tasks.length})
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
                      文档资料 ({phase.documents.length})
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
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
                      团队成员 ({phase.team.length})
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
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
          </Card>
        </div>
      ))}
    </div>
  );
};

export default ScrollView;
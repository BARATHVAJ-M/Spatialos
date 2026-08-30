import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ActionsService {
  constructor(private prisma: PrismaService) {}

  async executeAction(actionId: string, context: any) {
    const action = await this.prisma.actionDefinition.findUnique({
      where: { id: actionId },
    });

    if (!action) throw new NotFoundException('Action not found');

    // In a real system, we'd trigger the webhook here using the action.targetUrl
    console.log(`[ACTION BROKER] Executing action ${action.name} (Type: ${action.serviceType})`);
    console.log(`[ACTION BROKER] Context: `, context);

    // Simulated response for AR Engine
    return {
      status: 'SUCCESS',
      uiFeedback: {
        type: 'REPLACE_NODE',
        nodeId: context?.nodeId || 'unknown_node',
        newLayout: {
          type: 'TEXT',
          text: 'Action Executed Successfully',
          style: 'HEADER'
        }
      }
    };
  }
}


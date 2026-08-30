Markdown
# SpatialOS Implementation Specification: The Action Broker

**Document ID:** 05_The_Action_Broker
**Target Audience:** Backend Engineers, System Integrators
**Objective:** Define the NestJS service responsible for intercepting AR interactions, executing business logic (via internal mutations or external webhooks), and returning Server-Driven UI state changes.

---

## 1. The Interaction Paradigm

In standard mobile development, a button tap triggers an API call written by the mobile developer. 

In **SpatialOS**, the AR Engine is entirely decoupled from business logic. Every button, form, or interactive element in the platform emits a generic `ActionExecutionRequest`. 

The **Action Broker** is the backend switchboard. It receives the request, looks up what the action is supposed to do, executes it, and tells the AR Engine how to update the screen.

---

## 2. The Interaction Controller (The Entry Point)

*Developer Instruction: Place this in `apps/backend-api/src/modules/actions/actions.controller.ts`.*

```typescript
import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ActionBrokerService } from './action-broker.service';
import { ActionExecutionRequest, ActionExecutionResponse } from '@spatialos/types/actions';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Assume standard JWT auth

@Controller('actions')
export class ActionsController {
  constructor(private readonly actionBroker: ActionBrokerService) {}

  @Post('execute')
  @UseGuards(JwtAuthGuard) // User must be authenticated to interact
  async executeAction(
    @Body() payload: ActionExecutionRequest,
    @Req() req: any
  ): Promise<ActionExecutionResponse> {
    
    // Pass the interaction payload AND the user's identity to the broker
    return this.actionBroker.processAction(payload, req.user);
  }
}
3. The Action Broker Service (The Switchboard)
Developer Instruction: Place this in apps/backend-api/src/modules/actions/action-broker.service.ts.

This service queries the ActionDefinition table (defined in 02_Database_Schema.md) to determine the routing logic.

TypeScript
import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../prisma/prisma.service';
import { ActionExecutionRequest, ActionExecutionResponse } from '@spatialos/types/actions';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ActionBrokerService {
  constructor(
    private prisma: PrismaService,
    private http: HttpService
  ) {}

  async processAction(payload: ActionExecutionRequest, user: any): Promise<ActionExecutionResponse> {
    
    // 1. Resolve the action definition from the database
    const actionDef = await this.prisma.actionDefinition.findUnique({
      where: { id: payload.actionId }
    });

    if (!actionDef) {
      throw new NotFoundException('Action Definition not found.');
    }

    // 2. Route the execution based on the Service Type
    try {
      switch (actionDef.serviceType) {
        
        case 'WEBHOOK':
          return await this.executeWebhook(actionDef, payload, user);
          
        case 'INTERNAL_DB_UPDATE':
          return await this.executeInternalMutation(actionDef, payload, user);
          
        default:
          throw new InternalServerErrorException('Unknown Action Service Type');
      }
    } catch (error) {
      return this.generateErrorFeedback(error.message);
    }
  }

  /**
   * Executes an external Webhook (e.g., sending an order to a Cafe's POS system)
   */
  private async executeWebhook(actionDef: any, payload: ActionExecutionRequest, user: any): Promise<ActionExecutionResponse> {
    
    // Compile the secure payload to send to the 3rd party
    const webhookPayload = {
      timestamp: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email // Identity is handled by SpatialOS securely
      },
      context: payload.context // Contains the form values (e.g., drink: "Coffee")
    };

    // Fire the POST request to the target URL defined by the Admin
    await firstValueFrom(this.http.post(actionDef.targetUrl, webhookPayload));

    // 3. Return the UI update instruction back to the AR Engine
    return this.generateSuccessFeedback();
  }

  private async executeInternalMutation(actionDef: any, payload: ActionExecutionRequest, user: any): Promise<ActionExecutionResponse> {
    // Logic for internal platform updates (e.g., logging a user's attendance)
    // ...
    return this.generateSuccessFeedback();
  }

  // --- UI FEEDBACK GENERATORS ---

  private generateSuccessFeedback(): ActionExecutionResponse {
    return {
      status: 'SUCCESS',
      uiFeedback: {
        type: 'TOAST', // Tells the AR Engine to show a brief popup
        message: 'Action completed successfully!',
        color: 'GREEN'
      }
    };
  }

  private generateErrorFeedback(errorMessage: string): ActionExecutionResponse {
    return {
      status: 'FAILED',
      uiFeedback: {
        type: 'TOAST',
        message: `Failed: ${errorMessage}`,
        color: 'RED'
      }
    };
  }
}
4. Advanced UI Feedback (Server-Driven State)
The uiFeedback block in the response is extremely powerful. Because the UI is generated by the server, the server can tell the AR Engine to change the UI after a button is tapped, without reloading the whole scene.

Example Contract (packages/types/actions.ts):
TypeScript
export interface ActionExecutionResponse {
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  uiFeedback: UIFeedbackInstruction;
}

export type UIFeedbackInstruction = 
  | ToastFeedback 
  | ReplaceNodeFeedback 
  | RedirectFeedback;

// 1. Show a simple floating message
export interface ToastFeedback {
  type: 'TOAST';
  message: string;
  color: 'GREEN' | 'RED' | 'YELLOW';
}

// 2. Replace a specific UI panel entirely (e.g., swap the Order Form for a Receipt)
export interface ReplaceNodeFeedback {
  type: 'REPLACE_NODE';
  targetNodeId: string; // The ID of the node currently floating in AR
  newUIPayload: UIPayload; // Defined in 03_API_Contracts.md
}
5. End-to-End Execution Flow (The Cafe Example)
To visualize exactly how all 5 documents work together:

User Scans QR (QR_CAFE_01)

Doc 04 (Compiler) looks up the QR in Doc 02 (Database).

It returns the "Golden Payload" Doc 03 (API Contract) to the phone.

AR Engine Renders

The phone draws a 3D dropdown and a "Submit Order" button.

User Taps "Submit Order"

The phone fires POST /actions/execute with actionId: '123'.

Action Broker Processing

Doc 05 (Action Broker) catches the request.

It sees actionId: '123' is a WEBHOOK pointing to https://cafe-api.com/order.

It posts the data and the user's secure SpatialOS token to the Cafe.

AR Feedback

The Cafe returns 200 OK.

The Action Broker returns a REPLACE_NODE feedback instruction to the phone.

The floating order form in AR instantly morphs into a green "Order Confirmed!" receipt.


***

### The Foundation is Complete

With these 5 documents, you have successfully designed the complete, enterprise-grade backend architecture for **SpatialOS**.

* `01` defined the structure.
* `02` defined the database.
* `03` defined the JSON bridge.
* `04` defined the read pipeline (Compiler).
* `05` defined the write pipeline (Action Broker).

A backend developer now has the exact Prisma tables, generic API schemas, and NestJS service logic needed to build the entire "middleware" that will power your AR Engine for any industry. 

Is there a specific area within these implementations—such as the Admin Dashboard frontend architecture, or
Markdown
# SpatialOS Implementation Specification: Real-Time State Synchronization

**Document ID:** 11_State_Synchronization_&_Realtime_AR  
**Target Audience:** Real-Time Systems Engineers, Frontend AR Engineers  
**Objective:** Define the synchronization layer to manage multi-user, real-time shared states in spatial environments using WebSockets and Server-Sent Events (SSE).

---

## 1. The Multi-User Spatial Challenge

In a static AR system, an experience is fetched once and rendered locally. However, for dynamic applications—such as a **Gym Equipment Waitlist**, a **Canteen Table Booking**, or a **Shared Collaboration Screen**—multiple users view the same physical place simultaneously. 

If User A taps a button to "Claim Seat," the floating AR element must instantly morph into an "Occupied" state on User B’s device in real time, without User B having to re-scan the QR target.



---

## 2. Real-Time Transport Architecture (The Gateway)

To support instant state propagation while maintaining a thin-client design, we introduce a **WebSocket Gateway** layer using NestJS `@nestjs/websockets` (Socket.io protocol under the hood).

```text
[ User A (AR Client) ] ────( Action Event )────> [ Backend Action Broker ]
                                                         │
                                               ( State Mutation )
                                                         │
                                                         ▼
[ User B (AR Client) ] <───( Broadcast WS )─── [ Real-Time Gateway ]
Room Strategy (Spatial Scoping)
Clients should not listen to global system updates. Instead, when the AR Engine successfully parses a scene graph from a QR target, it automatically joins a WebSocket "Spatial Room" identified by the unique placeId.

Room Key Format: room:spatial_place:{placeId}

3. The Backend Real-Time Gateway Implementation
Developer Instruction: Place this file inside apps/backend-api/src/modules/gateway/spatial.gateway.ts.

TypeScript
import { 
  WebSocketGateway, 
  WebSocketServer, 
  SubscribeMessage, 
  ConnectedSocket, 
  MessageBody 
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../auth/ws-jwt.guard'; // WebSocket specific JWT parser

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: 'spatial'
})
export class SpatialGateway {
  @WebSocketServer()
  server: Server;

  /**
   * Triggers automatically when a client connects to the spatial namespace.
   * Forces the device to attach to a specific room based on the active QR Target.
   */
  @SubscribeMessage('room:join')
  @UseGuards(WsJwtGuard)
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { placeId: string }
  ) {
    const roomName = `room:spatial_place:${payload.placeId}`;
    client.join(roomName);
    
    // Broadcast join metrics to other room occupants for telemetry/presence
    client.to(roomName).emit('presence:update', { 
      userId: client.data.user.id, 
      status: 'CONNECTED' 
    });
  }

  /**
   * Broadcasts a Server-Driven UI modification layout update payload 
   * to all active devices pointing at a specific physical coordinates frame.
   */
  broadcastSceneMutation(placeId: string, mutationPayload: any) {
    const roomName = `room:spatial_place:${placeId}`;
    this.server.to(roomName).emit('scene:mutate', mutationPayload);
  }
}
4. Hooking Mutations Into The Action Broker
When an interaction executes inside the ActionBrokerService (defined in 05_The_Action_Broker.md), if that execution alters the shared state of the location, it pushes a broadcast trigger out through the SpatialGateway.

TypeScript
// Inside apps/backend-api/src/modules/actions/action-broker.service.ts
// Appended to handle reactive multi-user state synchronization loops

async executeInternalMutation(actionDef: any, payload: ActionExecutionRequest, user: any): Promise<ActionExecutionResponse> {
  
  if (actionDef.name === 'CLAIM_GYM_BENCH') {
    
    // 1. Mutate state inside the primary database
    await this.prisma.spatialNode.update({
      where: { id: payload.context.nodeId },
      data: { referenceId: new_occupied_template_id }
    });

    // 2. Formulate the dynamic state mutation command payload
    const mutationPayload = {
      type: 'REPLACE_NODE',
      targetNodeId: payload.context.nodeId,
      newUIPayload: {
        layout: {
          type: "VSTACK",
          spacing: 8,
          children: [
            { type: "TEXT", text: `Occupied by ${user.name}`, style: "BODY", color: "RED" }
          ]
        }
      }
    };

    // 3. Emit the event to everyone inside the spatial room instantly
    this.spatialGateway.broadcastSceneMutation(payload.context.placeId, mutationPayload);

    // 4. Return success to the originating device execution handler
    return this.generateSuccessFeedback();
  }
}
5. Client AR Engine Live Ingestion Layer
The mobile app keeps a listening layer active on the Socket connection as long as that specific physical scene anchor tracking system is running.

Swift
// apps/clients/ar-engine-wrapper/SpatialSocketClient.swift

class SpatialSocketClient {
    let socket = SocketManager.shared.getSpatialNamespace()

    func initializeListeners() {
        
        // Intercepts server-driven layout updates pushed on the fly
        socket.on("scene:mutate") { dataArray, ack in
            guard let jsonString = dataArray[0] as? String else { return }
            
            // Parse the mutation instruction payload using the Action Contract rules
            let mutation = MutationParser.parse(jsonString)
            
            // Re-route straight to the local scene visual manager to hot-reload components
            DispatchQueue.main.async {
                ARCanvasManager.executeLiveMutation(mutation)
            }
        }
    }
}
6. End-to-End Real-Time Execution Lifecycle (The Gym Waitlist)
User A and User B scan the exact same QR code on a Squat Rack in the gym at the same time. Both devices connect to room:spatial_place:rack_01.

Both screens render a floating green button: [ Claim Rack ].

User A taps the button. Their device executes: POST /api/v1/actions/execute.

The Action Broker processes the request, commits User A's claim to the database, and returns a success response to User A. User A's button changes to a checked state.

In parallel, the backend triggers the Spatial Gateway.

The Gateway sends a scene:mutate socket command payload containing a REPLACE_NODE layout modification block to everyone in room:spatial_place:rack_01.

User B’s phone catches the event. The local ARCanvasManager destroys User B's active [ Claim Rack ] button component and draws a flat red warning block in its place: [ Occupied by User A ].

The state remains completely synced across both views in real time without User B touching their screen or scanning the physical marker again.


***

### 🚀 The Engineering Stack is Complete

With the addition of this real-time module, you have constructed the entire, complete software design specification system for **SpatialOS V1**. Every single layer—from database constraints, server-driven dynamic UI layouts, webhook routing gateways, security handshakes, physical QR code hashing, and Docker configurations—is explicitly mapped out.

You now possess the foundational technical layout required to launch development operations. Hap

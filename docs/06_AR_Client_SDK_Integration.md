rkdown
# SpatialOS Implementation Specification: AR Client SDK Integration

**Document ID:** 06_AR_Client_SDK_Integration  
**Target Audience:** Mobile Developers, AR Engineers (Swift/Kotlin/Unity)  
**Objective:** Define the architecture for the Mobile Client. Guide the AR Engineer on how to parse the Server-Driven UI JSON and render dynamic 3D elements without writing custom business logic.

---

## 1. The "Dumb" Client Architecture

The AR Engine must be completely unaware of its environment. It should not contain classes like `CollegeNoticeBoard` or `CafeMenu`. 

Instead, the AR app consists of only three core managers:
1. **The Vision Manager:** Scans the QR code and tracks the physical anchor.
2. **The Scene Parser:** Downloads the JSON and loops through the nodes.
3. **The Action Emitter:** Catches user taps and sends them to the backend.

---

## 2. Bootstrapping the AR Session

When the camera sees a QR code, the app must halt local processing and fetch instructions from the SpatialOS Backend.

### The Execution Flow (Pseudo-Code / Swift / C#)
```swift
class SpatialVisionManager {
    
    // Triggered by the Camera/ARKit when a QR is recognized
    func onQRCodeDetected(qrString: String, worldAnchor: ARAnchor) {
        
        // 1. Show a loading spinner in AR attached to the QR
        ARUIManager.showLoadingSpinner(at: worldAnchor)
        
        // 2. Fetch the Golden Payload from the Backend
        SpatialOSClient.fetchScene(qrId: qrString) { result in
            switch result {
            case .success(let sceneGraph):
                // 3. Pass the payload to the Scene Builder
                SceneParser.build(payload: sceneGraph, parentAnchor: worldAnchor)
            case .failure(let error):
                ARUIManager.showError(error.message, at: worldAnchor)
            }
        }
    }
}
3. The Scene Parser (The Rendering Loop)
The SceneParser takes the SceneGraphPayload (Defined in Doc 03) and recursively instantiates visual objects.

Swift
class SceneParser {
    static func build(payload: SceneGraphPayload, parentAnchor: ARAnchor) {
        
        // Loop through every abstract node sent by the server
        for node in payload.spatialNodes {
            
            // 1. Calculate absolute 3D position relative to the QR code
            let nodeTransform = Matrix4x4.create(
                position: node.transform.position,
                rotation: node.transform.rotation,
                scale: node.transform.scale
            )
            
            // 2. Spawn the correct primitive based on type
            switch node.type {
            case "MEDIA":
                spawnMediaNode(data: node.mediaPayload, transform: nodeTransform, parent: parentAnchor)
                
            case "UI_PANEL":
                spawnUINode(data: node.uiPayload, transform: nodeTransform, parent: parentAnchor)
            }
        }
    }
}
4. Building Server-Driven UI in AR
This is the most powerful part of the mobile app. When the parser encounters a UI_PANEL, it reads the nested JSON array and stacks native UI elements on a floating AR canvas.

Swift
class ServerDrivenUIBuilder {
    
    static func buildCanvas(uiPayload: UIPayload) -> ARCanvasView {
        let canvas = ARCanvasView()
        
        // Read the root layout (e.g., VSTACK)
        let rootLayout = uiPayload.layout
        
        // Recursively draw children
        for child in rootLayout.children {
            let uiView = createGenericView(from: child)
            canvas.addSubview(uiView)
        }
        
        return canvas
    }
    
    // The Factory Pattern mapping JSON strings to Native UI components
    static func createGenericView(from element: UIElement) -> UIView {
        switch element.type {
        case "TEXT":
            let label = UILabel()
            label.text = element.text
            label.applyStyle(element.style) // e.g., HEADER gets 24pt bold
            return label
            
        case "DROPDOWN":
            let dropdown = NativeDropdown()
            dropdown.setOptions(element.options)
            dropdown.elementId = element.id // Store the ID to collect data later
            return dropdown
            
        case "BUTTON":
            let button = NativeButton()
            button.setTitle(element.label)
            
            // ATTACH THE ACTION EMITTER
            button.onClick = {
                ActionEmitter.fire(actionId: element.actionId)
            }
            return button
        }
    }
}
5. The Action Emitter (Handling Interactions)
When the user taps the button (e.g., "Place Order"), the Mobile App does not know what it is ordering. It simply collects the form data currently on the AR screen and sends it back to the cloud.

Swift
class ActionEmitter {
    
    static func fire(actionId: String) {
        
        // 1. Scrape all current form values from the floating AR canvas
        // (e.g., finds the Dropdown with ID "drink_selection" and gets its value)
        let formValues = ARCanvasManager.collectVisibleFormValues()
        
        // 2. Build the exact Execution Request contract
        let payload = ActionExecutionRequest(
            actionId: actionId,
            context: ActionContext(
                placeId: CurrentSession.placeId,
                formValues: formValues
            )
        )
        
        // 3. Send to Backend (Doc 05)
        SpatialOSClient.executeAction(payload) { response in
            // 4. Handle Server-Driven UI updates!
            handleUIFeedback(response.uiFeedback)
        }
    }
    
    static func handleUIFeedback(_ feedback: UIFeedbackInstruction) {
        if feedback.type == "TOAST" {
            ARUIManager.showFloatingToast(feedback.message, color: feedback.color)
        } 
        else if feedback.type == "REPLACE_NODE" {
            ARUIManager.destroyNode(id: feedback.targetNodeId)
            SceneParser.spawnUINode(data: feedback.newUIPayload) // Re-draws the new state!
        }
    }
}
6. Real-World Example recap:
AR Camera sees QR_CAFE_01.

SpatialVisionManager pauses and calls the backend.

Backend returns the "Golden Payload" with a Video and a VSTACK Form.

SceneParser places the Video at Y: 0.5m.

ServerDrivenUIBuilder draws the generic VSTACK Form with the Dropdown and Button at Y: 0.0m.

User selects "Latte" and taps "Order".

ActionEmitter sends {"actionId": "act_88", "context": {"drink_selection": "Latte"}}.

Backend returns {"type": "TOAST", "message": "Order Confirmed!"}.

App displays the toast. Zero hardcoded cafe logic was used on the phone.


***

### The System is Now Complete End-to-End.

We have successfully mapped the entire journey from the Database rows (`02`) all the way to the code inside the AR Mobile App (`06`). 

There is only one major component of the SpatialOS platform left un-mapped: **The Admin Dashboard** (The Web App where the College or Cafe owner actually drags and drops these components without writing code). 

Shall I generate **`07_Admin_Dashboard_Architecture.md`** to define how the visual builder tool operates?
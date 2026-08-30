AR-ENGINE/
│
├── CORE
│   ├── Engine Core
│   ├── Configuration
│   ├── Lifecycle
│   ├── Module Manager
│   └── Error System
│
├── DEVICE
│   ├── Camera
│   ├── Sensors
│   ├── Device Capability
│   └── Permission
│
├── DETECTION
│   ├── QR
│   ├── Image
│   ├── Marker
│   ├── Plane
│   └── Object
│
├── SPATIAL
│   ├── Localization
│   ├── World Tracking
│   ├── Anchors
│   ├── Coordinates
│   └── Spatial Identity
│
├── SCENE
│   ├── Scene Manager
│   ├── Scene Graph
│   ├── Object Hierarchy
│   └── Scene State
│
├── OBJECTS
│   ├── Spatial Object
│   ├── Plane
│   ├── Image
│   ├── Video
│   ├── Text
│   ├── 3D Object
│   ├── Button
│   ├── Form
│   └── Mini App
│
├── CONTENT
│   ├── Asset Manager
│   ├── Image
│   ├── Video
│   ├── Text
│   └── 3D Assets
│
├── RENDERING
│   ├── Renderer
│   ├── Materials
│   ├── Lighting
│   ├── Depth
│   ├── Occlusion
│   └── Performance
│
├── INTERACTION
│   ├── Input
│   ├── Gesture
│   ├── Hit Testing
│   ├── Action
│   └── Event System
│
├── MINI-APPS
│   ├── Runtime
│   ├── Registry
│   ├── Lifecycle
│   ├── State
│   ├── Permissions
│   └── API
│
├── SERVICES
│   ├── Navigation
│   ├── Information
│   ├── Booking
│   ├── Ordering
│   ├── Communication
│   └── Live Data
│
├── AI
│   ├── Context
│   ├── Spatial Context
│   ├── Object Context
│   └── AI Provider
│
├── NETWORK
│   ├── API
│   ├── Repository Interfaces
│   ├── Synchronization
│   └── Offline Handling
│
├── CACHE
│   ├── Memory Cache
│   ├── Disk Cache
│   ├── Asset Cache
│   └── Cache Policy
│
├── STATE
│   ├── Engine State
│   ├── Tracking State
│   ├── Scene State
│   ├── Object State
│   └── App State
│
├── SECURITY
│   ├── Permissions
│   ├── Authentication
│   ├── Authorization
│   └── Mini App Isolation
│
├── ANALYTICS
│   ├── Events
│   ├── Usage
│   └── Errors
│
├── PERFORMANCE
│   ├── FPS
│   ├── Memory
│   ├── CPU
│   ├── GPU
│   └── Resource Optimization
│
└── DEBUG
    ├── Tracking Debugger
    ├── Anchor Debugger
    ├── Scene Debugger
    ├── Object Debugger
    └── Performance Monitor

    s. Before writing any code, you should define the entire AR Engine as a platform architecture. Then you can implement each module one by one without redesigning the engine later.

For your SpatialOS, I would define the engine like this:

SpatialOS AR Engine — Complete V1/V2 Architecture

The engine's job is:

Detect a physical location → establish spatial position → create spatial objects → track them in the real world → allow interaction → connect objects to information/services → maintain the experience while the user moves.

Your QR is only one possible bootstrap/localization mechanism, not the AR engine itself.

1. Overall Architecture
                         SPATIALOS AR ENGINE
                                │
        ┌───────────────────────┼────────────────────────┐
        │                       │                        │
   INPUT / DETECTION       SPATIAL WORLD            EXPERIENCE
        │                       │                        │
   QR Detection            World Tracking          Scene Manager
   Image Detection         Plane Detection         Object System
   Object Detection        Anchors                 Hierarchy
   Device Sensors          Coordinate System       Lifecycle
        │                       │                        │
        └───────────────────────┼────────────────────────┘
                                │
                         SPATIAL OBJECTS
                                │
        ┌──────────┬──────────┬─┴──────────┬──────────┐
        │          │          │            │          │
      Plane      Image      Video        Text       3D
        │          │          │            │          │
        └──────────┴──────────┴────────────┴──────────┘
                                │
                         INTERACTION ENGINE
                                │
        ┌────────────┬──────────┼───────────┬──────────┐
        │            │          │           │          │
      Button       Form      Gesture      Touch      Action
                                │
                                ▼
                         MINI APP ENGINE
                                │
                    ┌───────────┼───────────┐
                    │           │           │
                  Cafe        Booking     Services
                                │
                                ▼
                         SPATIAL SERVICES
                                │
        ┌──────────┬──────────┼───────────┬──────────┐
        │          │          │           │          │
    Navigation  Information  AI        Live Data  Location
                                │
                                ▼
                       APPLICATION BRIDGE
                                │
                         SpatialOS User App
                                │
                                ▼
                            Backend

This is the whole engine, not individual implementation details.

2. Engine Core

The Core is the foundation.

Responsibilities
Engine initialization
Engine configuration
Device capability detection
Runtime lifecycle
Scene lifecycle
Error management
Logging
Performance management
Resource management
Module management

It should know what modules exist, but it should not contain business logic.

3. Device Capability Layer

The engine must understand what the user's device supports.

Handles
Camera
AR capability
Motion sensors
Gyroscope
Accelerometer
Camera resolution
Tracking capability
Plane detection capability
Image tracking capability
Device orientation
Performance capability

Example:

Device
 ├── Camera
 ├── Motion Sensors
 ├── AR Capability
 ├── Tracking Capability
 └── Rendering Capability

This allows the engine to decide what experience is possible on that device.

4. Detection Engine

This answers:

"What physical thing/location did the user identify?"

It should support multiple detection mechanisms.

Detection modules
Detection Engine
│
├── QR Detection
├── Image Detection
├── Marker Detection
├── Plane Detection
├── Surface Detection
├── Object Detection
└── Environment Detection
QR Detection

For your current system:

QR → identify Spatial Location

But QR should not continuously control the AR object's position.

It should establish the initial spatial reference.

5. Spatial Localization Engine

This is extremely important for your goal.

It answers:

"Where exactly is this experience in the real world?"

Responsibilities:

Initial localization
World coordinate establishment
Spatial reference
Coordinate conversion
Position tracking
Rotation tracking
Scale
Relative positioning
World origin
Spatial alignment

Your QR can provide:

QR
 ↓
Initial Spatial Pose
 ↓
World Reference

After that:

QR disappears
      ↓
World Tracking
      ↓
AR object remains in place

This is the foundation of your "QR only as trigger" idea.

6. World Tracking Engine

This maintains the object's relationship with the physical environment.

Handles:

Camera movement
Device movement
Rotation
Translation
Tracking state
Tracking quality
World stability
Relocalization
Lost tracking
Tracking recovery

This is what changes your system from:

"content floating on camera"

into:

"content existing in the physical world."

7. Plane Detection Engine

Your Plane is a major part of your architecture.

It should support:

Plane
│
├── Width
├── Height
├── Position
├── Rotation
├── Scale
├── Border
├── Orientation
└── Children

A Plane is not merely visual decoration.

It is a spatial parent/container.

Example:

Plane
│
├── Image
├── Image
├── Text
├── Video
└── Mini App

If the Plane moves:

Plane moves
     ↓
All children move

If Plane scales:

Plane scales
     ↓
All children scale
8. Anchor System

The Anchor System maintains stable spatial references.

Types can include:

Anchor System
│
├── QR Anchor
├── World Anchor
├── Plane Anchor
├── Image Anchor
├── Object Anchor
└── Custom Spatial Anchor

For your V1:

QR Anchor
     ↓
World Anchor
     ↓
Plane
     ↓
Content
9. Coordinate System

The engine needs one consistent spatial coordinate system.

It manages:

X
Y
Z
Position
Rotation
Scale
Local coordinates
World coordinates
Parent coordinates
Child coordinates
Coordinate conversion

Example:

World
 │
 └── Plane
      │
      ├── Image
      ├── Video
      └── Text

Each child should have a position relative to its parent.

10. Spatial Object Engine

This is the heart of your engine.

Everything that appears in AR should be an object.

SpatialObject
│
├── PlaneObject
├── ImageObject
├── VideoObject
├── TextObject
├── 3DObject
├── ButtonObject
├── FormObject
├── MapObject
├── AnimationObject
└── MiniAppObject

Every object should have common concepts:

ID
Position
Rotation
Scale
Visibility
Parent
Children
Lifecycle
Interaction state
11. Content Engine

Your current content types belong here.

V1
Content Engine
│
├── Image
├── Video
└── Text

Later:

├── Audio
├── 3D Model
├── Animation
├── Document
├── Map
└── Live Data

The Content Engine handles the content itself.

The Spatial Object Engine handles where it exists.

That separation is important.

12. Scene Graph / Hierarchy Engine

This manages relationships between objects.

Example:

Scene
│
├── Plane A
│    ├── Image A
│    ├── Text A
│    └── Video A
│
├── Plane B
│    ├── Image B
│    └── MiniApp A
│
└── 3D Object

It manages:

Parent-child relationships
Object creation
Object removal
Object ordering
Transform inheritance
Visibility inheritance
Scene state
13. Scene Manager

The Scene Manager controls the complete AR scene.

Responsibilities:

Load scene
Create scene
Update scene
Destroy scene
Save scene state
Restore scene
Add objects
Remove objects
Synchronize scene
Handle scene lifecycle

Conceptually:

Backend Scene Data
       ↓
Scene Manager
       ↓
Scene Graph
       ↓
Spatial Objects
       ↓
AR World
14. Rendering Engine

This is responsible for actually displaying the objects.

Handles:

Image rendering
Video rendering
Text rendering
Plane rendering
3D rendering
Transparency
Materials
Lighting
Depth
Occlusion
Rendering order
Resolution
Frame performance

Important:

Rendering ≠ spatial tracking.

Keep those concepts separate.

15. Interaction Engine

This changes SpatialOS from a viewer into an interactive platform.

It handles:

Input
Tap
Double tap
Long press
Drag
Pinch
Rotate
Swipe
Interactive objects
Button
Form
Card
Menu
Link
Object
Mini App

Example:

[ORDER NOW]
      ↓
Interaction Engine
      ↓
Action
      ↓
Mini App / Backend
16. Action Engine

The Interaction Engine detects interaction.

The Action Engine decides:

"What should happen?"

Actions could include:

Open
Close
Navigate
Play
Pause
Submit
Book
Order
Call
Open Mini App
Fetch information
Trigger AI
Update content

This prevents buttons from directly containing business logic.

17. Mini App Engine

This is one of the most important future components.

It allows SpatialOS to host small applications inside spatial experiences.

Mini App Engine
│
├── Mini App Runtime
├── Mini App Registry
├── Mini App Lifecycle
├── Mini App State
├── Mini App Actions
├── Mini App Permissions
└── Mini App API

Example:

Cafe Mini App
│
├── Menu
├── Order
├── Token
└── Status

Another location could have:

Hospital Mini App
│
├── Appointment
├── Doctor
└── Navigation

Same engine.

Different experience.

18. Spatial Service Engine

This connects spatial experiences to real-world services.

Spatial Services
│
├── Navigation
├── Location
├── Information
├── Booking
├── Ordering
├── Communication
├── Notifications
└── Live Data

This is where SpatialOS becomes more than an AR viewer.

19. Navigation Engine

Responsible for:

Destination selection
Path calculation
Direction indicators
Indoor navigation
Outdoor navigation
Floor transitions
Destination anchors
Route state

Example:

User
 ↓
"Find CSE Department"
 ↓
Navigation Engine
 ↓
Spatial Route
 ↓
AR Direction
20. Information Engine

The physical environment can expose contextual information.

Example:

Machine
 ↓
Information Engine
 ↓
Machine specifications
Maintenance
Instructions
Videos
Status

It should provide information based on what/where the user is interacting with.

21. Real-Time Data Engine

For information that changes continuously.

Examples:

Queue number
Restaurant availability
Train status
Event status
Room availability
Product availability
Machine status
Notifications

Architecture concept:

Live Backend Data
       ↓
Real-Time Data Engine
       ↓
Spatial Object
       ↓
User
22. AI Context Engine

Don't make AI simply a chatbot.

The AI should receive spatial context.

Example:

User
 ↓
"What is this?"
 ↓
AI Context Engine
 ↓
Current Spatial Object
 ↓
Location
 ↓
Object Metadata
 ↓
Relevant Information
 ↓
AI Response

Eventually:

"What is this machine used for?"

can be answered specifically about the machine the user is looking at.

23. Spatial Identity System

Every physical location/object needs an identity.

For example:

Spatial Location
    ID: COLLEGE-CSE-001

Spatial Object
    ID: MACHINE-102

Plane
    ID: PLANE-001

This lets your backend know:

what this physical thing represents.

QR is simply one way to discover that identity.

24. Content & Asset Management

Handles:

Image assets
Video assets
3D assets
Metadata
Versions
Loading
Caching
Resource lifecycle

It should also prevent things such as:

DB record deleted
but
physical asset still exists

Your existing backend architecture work becomes important here.

25. Cache / Resource Manager

Handles:

Asset caching
Memory management
Disk caching
Cache invalidation
Resource loading
Resource unloading
Large video handling

Especially important for your:

10 MB images
50 MB videos
26. Network / Backend Integration Layer

The AR engine should not directly depend on your NestJS implementation.

Instead:

AR Engine
     ↓
Application API Interface
     ↓
SpatialOS User App
     ↓
Backend

The engine should consume abstractions/contracts.

For example:

ISpatialRepository
IContentProvider
ISceneProvider
IMiniAppProvider
INavigationProvider

That keeps the engine reusable.

27. State Management

The engine needs state for:

Engine State
Scene State
Tracking State
Anchor State
Object State
Interaction State
Mini App State
Network State

Example:

TRACKING
TRACKING_LOST
RELOCALIZING
TRACKING_RECOVERED

The application can respond appropriately.

28. Error & Recovery Engine

Very important for a production AR engine.

It should handle:

Camera failure
AR unavailable
QR not detected
Tracking lost
Anchor lost
Network failure
Content failure
Video failure
Asset missing
Scene loading failure
Backend failure
Permission failure

And importantly:

failure in one object should not destroy the entire scene.

29. Performance Engine

Handles:

FPS monitoring
Memory usage
CPU usage
GPU usage
Object limits
Texture management
Video optimization
Asset loading
Rendering optimization
Background resource cleanup

This becomes especially important when a Plane contains:

10 images
5 videos
20 text objects
3 mini apps
30. Security / Permission Layer

The engine should control what a spatial experience is allowed to do.

Examples:

Camera
Location
Microphone
Network
Storage
Mini App permissions

Mini Apps should not automatically receive unrestricted access to the device.

31. Analytics / Telemetry

Later you can track:

Scene opened
QR scanned
Object viewed
Video played
Button clicked
Mini App opened
Navigation started
Service completed
Error occurred
Tracking lost

This helps organizations understand how their spatial experiences are being used.

32. Developer / Debug Layer

For building and testing the engine.

Include:

Debug Mode
│
├── FPS
├── Tracking State
├── Anchor State
├── Plane Boundaries
├── World Origin
├── Coordinate System
├── Object IDs
├── Scene Graph
├── Memory
└── Performance

This will save you a huge amount of time while developing the engine.

33. Engine Module Structure

Putting everything together:

AR-ENGINE/
│
├── CORE
│   ├── Engine Core
│   ├── Configuration
│   ├── Lifecycle
│   ├── Module Manager
│   └── Error System
│
├── DEVICE
│   ├── Camera
│   ├── Sensors
│   ├── Device Capability
│   └── Permission
│
├── DETECTION
│   ├── QR
│   ├── Image
│   ├── Marker
│   ├── Plane
│   └── Object
│
├── SPATIAL
│   ├── Localization
│   ├── World Tracking
│   ├── Anchors
│   ├── Coordinates
│   └── Spatial Identity
│
├── SCENE
│   ├── Scene Manager
│   ├── Scene Graph
│   ├── Object Hierarchy
│   └── Scene State
│
├── OBJECTS
│   ├── Spatial Object
│   ├── Plane
│   ├── Image
│   ├── Video
│   ├── Text
│   ├── 3D Object
│   ├── Button
│   ├── Form
│   └── Mini App
│
├── CONTENT
│   ├── Asset Manager
│   ├── Image
│   ├── Video
│   ├── Text
│   └── 3D Assets
│
├── RENDERING
│   ├── Renderer
│   ├── Materials
│   ├── Lighting
│   ├── Depth
│   ├── Occlusion
│   └── Performance
│
├── INTERACTION
│   ├── Input
│   ├── Gesture
│   ├── Hit Testing
│   ├── Action
│   └── Event System
│
├── MINI-APPS
│   ├── Runtime
│   ├── Registry
│   ├── Lifecycle
│   ├── State
│   ├── Permissions
│   └── API
│
├── SERVICES
│   ├── Navigation
│   ├── Information
│   ├── Booking
│   ├── Ordering
│   ├── Communication
│   └── Live Data
│
├── AI
│   ├── Context
│   ├── Spatial Context
│   ├── Object Context
│   └── AI Provider
│
├── NETWORK
│   ├── API
│   ├── Repository Interfaces
│   ├── Synchronization
│   └── Offline Handling
│
├── CACHE
│   ├── Memory Cache
│   ├── Disk Cache
│   ├── Asset Cache
│   └── Cache Policy
│
├── STATE
│   ├── Engine State
│   ├── Tracking State
│   ├── Scene State
│   ├── Object State
│   └── App State
│
├── SECURITY
│   ├── Permissions
│   ├── Authentication
│   ├── Authorization
│   └── Mini App Isolation
│
├── ANALYTICS
│   ├── Events
│   ├── Usage
│   └── Errors
│
├── PERFORMANCE
│   ├── FPS
│   ├── Memory
│   ├── CPU
│   ├── GPU
│   └── Resource Optimization
│
└── DEBUG
    ├── Tracking Debugger
    ├── Anchor Debugger
    ├── Scene Debugger
    ├── Object Debugger
    └── Performance Monitor
34. How the Complete Engine Fits Together

Your ultimate flow becomes:

             PHYSICAL WORLD
                   │
                   ▼
             Detection Engine
                   │
             QR / Image / etc.
                   │
                   ▼
          Spatial Localization
                   │
                   ▼
             World Tracking
                   │
                   ▼
              Anchor System
                   │
                   ▼
             Scene Manager
                   │
                   ▼
             Spatial Objects
                   │
        ┌──────────┼──────────┐
        ▼          ▼          ▼
      Plane      3D Obj     Content
        │
   ┌────┼─────┬────────┐
   ▼    ▼     ▼        ▼
 Image Text  Video   Mini App
                       │
                       ▼
                Interaction Engine
                       │
                       ▼
                  Action Engine
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
       Service        AI       Real-time Data
          │            │            │
          └────────────┼────────────┘
                       ▼
                  SpatialOS
The most important architectural principle

Don't build:

QR AR App → then add features → then add mini apps → then add navigation → then rewrite everything.

Build the engine around this concept from the beginning:

Detection identifies a place. Spatial tracking establishes the world. Spatial objects represent things. Scenes organize them. Interaction makes them usable. Services make them useful. Mini Apps make them functional. AI makes them intelligent.

Then your current V1 can simply activate a small subset:

V1
│
├── QR Detection
├── Spatial Localization
├── World Tracking
├── Anchors
├── Plane
├── Image
├── Video
├── Text
├── Scene Graph
├── Basic Interaction
├── Asset Management
├── Cache
├── Error Recovery
└── Backend Integration

And later:

V2+
│
├── 3D Objects
├── Advanced Plane Detection
├── Navigation
├── Buttons
├── Forms
├── Mini Apps
├── Real-time Data
├── AI
├── Object Recognition
└── Advanced Spatial Computing

This is the architecture I would freeze first. Then you can implement it module-by-module inside your AR-ENGINE folder without mixing the AR engine's responsibilities with your SpatialOS backend, Admin App, or individual Mini Apps.

Yes — the structure I gave is the architecture, but it is not yet enough for development.

Before you start implementing AR-ENGINE, you should define the responsibility and boundaries of every module and every important component inside it. Otherwise, while coding, you may start putting tracking logic inside Scene Manager, storage logic inside objects, business logic inside Mini Apps, etc.

Think of it as:

Architecture
    ↓
Module
    ↓
Component
    ↓
Responsibility
    ↓
Interfaces / Contracts
    ↓
Implementation

You don't need to define every individual class now, but you should define every module and its major components.

AR-ENGINE — Development-Level Definition
1. CORE
CORE/
├── engine/
├── config/
├── lifecycle/
├── module/
├── error/
├── logging/
└── events/
1.1 Engine

Purpose: The main entry point of your AR Engine.

It controls:

Engine initialization
Starting AR
Stopping AR
Connecting modules
Creating the runtime
Managing global engine state
Coordinating major subsystems

Conceptually:

Application
    ↓
AREngine
    ↓
Initialize
    ↓
Detection + Tracking + Scene + Rendering

It should coordinate, not contain the actual implementation of QR detection, rendering, etc.

1.2 Config

Contains engine configuration.

Config
├── tracking configuration
├── detection configuration
├── rendering configuration
├── performance configuration
├── cache configuration
└── debug configuration

Examples:

Maximum objects
Tracking mode
Detection modes
Target FPS
Cache limits
Debug enabled/disabled
Asset loading policies

Important: Don't hardcode these values throughout the engine.

1.3 Lifecycle

Controls engine state.

Example:

CREATED
   ↓
INITIALIZING
   ↓
READY
   ↓
RUNNING
   ↓
PAUSED
   ↓
RESUMED
   ↓
STOPPED
   ↓
DESTROYED

It manages:

Initialization
Pause
Resume
Shutdown
Resource release
Module startup/shutdown ordering

For example, when the app goes into background:

Lifecycle
   ↓
Pause AR
   ↓
Pause rendering
   ↓
Pause tracking
   ↓
Release temporary resources
1.4 Module Manager

Controls all engine modules.

ModuleManager
│
├── Detection
├── Tracking
├── Anchor
├── Scene
├── Rendering
├── Interaction
├── Content
└── Cache

It handles:

Module registration
Module initialization
Module dependencies
Module startup
Module shutdown
Module availability

This prevents your engine from becoming one giant class.

1.5 Error System

Centralized error definitions and recovery.

Error
├── EngineError
├── DetectionError
├── TrackingError
├── AnchorError
├── SceneError
├── RenderingError
├── ContentError
├── NetworkError
└── MiniAppError

It should distinguish:

"No QR detected"
        ≠
"Camera failed"
        ≠
"Server unavailable"
        ≠
"Video missing"
        ≠
"Tracking lost"

It also defines:

Error severity
Error codes
Recoverable/non-recoverable
Retry behavior
Error events
1.6 Logging

Centralized technical logging.

DEBUG
INFO
WARNING
ERROR
CRITICAL

Example:

[INFO] QR detected
[INFO] World anchor created
[WARNING] Tracking quality reduced
[ERROR] Video asset failed

Never scatter random print() statements throughout the engine.

1.7 Event System

Allows modules to communicate without tightly coupling them.

Example:

QRDetected
      ↓
Localization
      ↓
WorldAnchorCreated
      ↓
SceneLoaded
      ↓
ObjectCreated

Other events:

TrackingLost
TrackingRecovered
PlaneDetected
ObjectTapped
SceneLoaded
SceneDestroyed
MiniAppOpened
AssetLoaded
AssetFailed

This becomes extremely important as the engine grows.

2. DEVICE
DEVICE/
├── camera/
├── sensors/
├── capabilities/
├── permissions/
└── orientation/
Camera

Controls access to camera.

Does not decide what the camera detects.

Sensors

Provides:

Gyroscope
Accelerometer
Motion data
Capabilities

Answers:

"What can this device actually do?"

Example:

AR supported? YES
Plane detection? YES
Image tracking? YES
Depth? NO
Permissions

Handles:

Camera permission
Location
Microphone
Storage if needed
Orientation

Handles:

Portrait
Landscape
Device rotation
3. DETECTION
DETECTION/
├── detection_manager/
├── qr/
├── image/
├── marker/
├── plane/
└── object/
Detection Manager

Unified interface for all detectors.

DetectionManager
       │
 ┌─────┼──────┐
 QR   Image   Plane
QR Detector

Only answers:

"Is there a recognized QR?"

It should not create AR objects itself.

Image Detector

Recognizes known physical images.

Plane Detector

Detects:

Horizontal surfaces
Vertical surfaces
Plane boundaries
Plane orientation
Object Detector

Future capability for recognizing real-world objects.

4. SPATIAL
SPATIAL/
├── localization/
├── tracking/
├── coordinates/
├── anchors/
├── world/
└── identity/

This is arguably the most important part of your AR engine.

Localization

Answers:

"Where should this experience begin?"

QR can provide the initial reference.

Tracking

Answers:

"Where is the device/object now?"

It continuously updates spatial position.

Coordinates

Manages:

World coordinates
Local coordinates
Parent coordinates
Child coordinates
Anchors

Maintains stable references.

QR Anchor
World Anchor
Plane Anchor
World

Represents the tracked physical environment.

Spatial Identity

Maps:

Physical location
       ↓
Spatial ID
       ↓
Backend content
5. SCENE
SCENE/
├── scene_manager/
├── scene_graph/
├── hierarchy/
├── transforms/
└── state/
Scene Manager

Loads/unloads scenes.

Scene Graph

Stores all objects.

Example:

Scene
│
├── Plane
│   ├── Image
│   ├── Text
│   └── Video
│
└── MiniApp
Hierarchy

Maintains parent-child relationships.

Transform

Controls:

Position
Rotation
Scale

Most importantly:

Plane transform
       ↓
Child transforms
Scene State

Tracks:

Loading
Loaded
Active
Updating
Paused
Destroyed
6. OBJECT SYSTEM
OBJECTS/
├── base/
├── plane/
├── image/
├── video/
├── text/
├── object3d/
├── button/
├── form/
└── mini_app/

Every object derives conceptually from:

SpatialObject

Common properties:

id
position
rotation
scale
parent
children
visibility
state

Then:

ImageObject
VideoObject
TextObject
PlaneObject

add their own capabilities.

7. CONTENT
CONTENT/
├── content_manager/
├── image/
├── video/
├── text/
├── 3d/
├── asset/
└── loader/

This answers:

"What content does the object contain?"

Don't mix this with spatial positioning.

For example:

ImageObject
   ↓
Spatial position

ImageContent
   ↓
Actual image

That's a very useful separation.

8. RENDERING
RENDERING/
├── renderer/
├── materials/
├── textures/
├── lighting/
├── depth/
├── occlusion/
└── optimization/

Responsible only for turning spatial objects into visible AR output.

It should not decide:

Which QR to use
Which cafe to book
Which API to call
9. INTERACTION
INTERACTION/
├── input/
├── gesture/
├── hit_test/
├── interaction_manager/
├── actions/
└── events/
Input

Touch/user input.

Gesture
Tap
Drag
Pinch
Rotate
Long press
Hit Test

Determines:

"Which spatial object did the user touch?"

Interaction Manager

Coordinates interaction.

Actions

Converts interaction into an action.

Tap
 ↓
Object
 ↓
Action
 ↓
Open Mini App
10. MINI APP
MINI_APPS/
├── runtime/
├── registry/
├── lifecycle/
├── state/
├── permissions/
├── api/
└── communication/

This is where your future Cafe Mini App belongs.

The important rule:

Mini Apps should not directly control the AR renderer.

Instead:

Mini App
   ↓
Mini App API
   ↓
AR Engine

This keeps your engine clean.

11. SERVICES
SERVICES/
├── navigation/
├── information/
├── booking/
├── ordering/
├── communication/
└── live_data/

These represent real-world capabilities.

Example:

Cafe Mini App
      ↓
Ordering Service
      ↓
Backend

The AR engine doesn't need to know how a coffee order is stored in PostgreSQL.

12. AI
AI/
├── context/
├── spatial_context/
├── object_context/
├── provider/
└── actions/

AI receives context such as:

Current location
Current object
Object metadata
Available services
User request

Then produces an answer/action.

13. NETWORK
NETWORK/
├── client/
├── contracts/
├── repositories/
├── synchronization/
├── retry/
└── offline/

This is where your abstraction principle becomes extremely important.

Don't do:

Scene → directly → PostgreSQL API

Instead:

Scene
 ↓
ISceneProvider
 ↓
SpatialOS API

The engine should not care whether the backend is:

NestJS
FastAPI
Firebase
another server
14. CACHE
CACHE/
├── memory/
├── disk/
├── asset/
├── policy/
└── invalidation/

Responsible for:

Image caching
Video caching
Scene caching
Metadata caching
Expiration
Cleanup
15. PERFORMANCE
PERFORMANCE/
├── fps/
├── memory/
├── cpu/
├── gpu/
├── assets/
└── profiling/

Measures:

FPS
Memory
CPU
GPU
Load time
Render time
Asset size

It should also provide optimization hooks.

16. SECURITY
SECURITY/
├── permissions/
├── authentication/
├── authorization/
├── validation/
└── mini_app/

Especially:

Mini App
   ↓
Permission check
   ↓
Allowed API?
   ↓
Execute
17. ANALYTICS
ANALYTICS/
├── events/
├── session/
├── usage/
└── errors/

Examples:

QR scanned
Scene loaded
Video played
Object clicked
Mini App opened
Order completed
18. DEBUG
DEBUG/
├── tracking/
├── anchors/
├── scene/
├── objects/
├── performance/
└── logging/

This is for you as the engine developer, not normal users.

You should be able to see:

Tracking: GOOD
Anchor: WORLD_001
Plane: PLANE_001
Objects: 7
FPS: 58
Memory: 420 MB
The Important Part: Contracts Between Them

This is where your earlier idea about abstraction becomes very important.

Don't just create folders.

Define boundaries.

For example:

QR Detector
     ↓
IDetectionProvider
     ↓
Localization
Localization
     ↓
ISpatialProvider
     ↓
Anchor Manager
Scene Manager
     ↓
ISceneProvider
     ↓
Backend Adapter
Mini App
     ↓
IMiniAppAPI
     ↓
AR Engine
Content
     ↓
IAssetProvider
     ↓
Storage / Network / Cache

So your engine becomes:

┌─────────────────────────────────────┐
│              AR ENGINE              │
│                                     │
│  Core                               │
│   │                                 │
│   ├── Detection                     │
│   ├── Spatial                       │
│   ├── Scene                         │
│   ├── Objects                       │
│   ├── Content                       │
│   ├── Rendering                     │
│   ├── Interaction                   │
│   ├── Mini Apps                     │
│   ├── Services                      │
│   ├── AI                            │
│   ├── Cache                         │
│   ├── Network                       │
│   ├── Security                      │
│   └── Performance                   │
│                                     │
└─────────────────────────────────────┘
              │
       Interfaces / Contracts
              │
              ▼
        SpatialOS App
              │
              ▼
        SpatialOS Backend
So, is your original structure enough?

For architecture planning: yes.

For development: no.

You should now define the second level exactly like above: each major module → its components → responsibility → interface boundary.

But don't go down to individual classes yet. That's the next stage.

The best order for you is:

Level 1: Complete architecture ✅
Level 2: Module/component definitions ← you are here
Level 3: Interfaces/contracts
Level 4: Data models
Level 5: Module dependencies
Level 6: Implementation
Level 7: Integration with SpatialOS
Level 8: Testing and hardening

That approach will prevent your AR engine from turning into another tightly coupled application as you add planes, 3D objects, navigation, mini apps, AI, and services later

The important idea

Your architecture should become:

Level 1 → What exists

CORE → DEVICE → DETECTION → ...

Level 2 → What each thing means

CORE → Engine Core → purpose, ownership, state, lifecycle, dependencies, errors...

Level 3 → How they communicate

Engine Core ↔ Module Manager ↔ Detection Contract ↔ Spatial Contract...

Level 4 → What data they exchange

DetectionResult, SpatialPose, Anchor, SpatialObject, etc.

Level 5 → Who can depend on whom

This separation is important. Don't start defining interfaces while the responsibilities are still unclear. Otherwise you'll end up designing interfaces around accidental implementation details.

And one rule I would make absolute for your SpatialOS engine:

Every module must have an owner, every responsibility must have exactly one owner, and no module may directly reach into another module's internal implementation.

Below is the generic Service Template Architecture for all future SpatialOS services. This is not a UI design or implementation. It defines the standard contract, editable configuration model, nested options, business logic, lifecycle, and working principles that every developer-created service must follow.

SpatialOS Service Template Standard
1. Core Principle

A service is developed by a developer.

The dashboard does not create arbitrary services from scratch.

Instead:

DEVELOPER
    ↓
Develops Service Template
    ↓
Registers Service Definition
    ↓
Backend exposes Service
    ↓
Dashboard detects Service
    ↓
Admin deploys an instance
    ↓
Admin edits allowed fields
    ↓
Service attaches to Experience
    ↓
Experience is published
    ↓
User interacts with Service in AR

The developer controls:

Service behavior
Business logic
Supported fields
Validation
Interaction types
Actions
Data contracts

The admin controls only:

Content
Text
Images
Videos
Links
Lists
Selected options
Service-specific configuration

The admin must never modify service code or internal business logic.

2. Universal Service Template

Every service must follow this common structure:

SERVICE TEMPLATE
│
├── 1. Identity
├── 2. Metadata
├── 3. Capabilities
├── 4. Configuration Schema
├── 5. Content Schema
├── 6. Interaction Schema
├── 7. Action Schema
├── 8. Child / Detail Views
├── 9. Data Source Schema
├── 10. Validation Rules
├── 11. Default Configuration
├── 12. State Model
├── 13. Lifecycle
├── 14. Permissions
├── 15. Rendering Contract
├── 16. API Contract
├── 17. Error Handling
└── 18. Versioning

Every service follows this skeleton, but each service defines different fields.

3. Service Definition

Each developer-created service should conceptually contain:

ServiceDefinition
│
├── serviceId
├── name
├── version
├── description
├── category
├── icon
├── capabilities
├── configurationSchema
├── contentSchema
├── interactionSchema
├── actionSchema
├── validationRules
├── defaultConfiguration
└── lifecycleDefinition

Example:

serviceId: classroom-service
name: Classroom
version: 1.0.0
category: education

The dashboard reads the definition and automatically knows:

What fields to show
Which fields are editable
What data type each field uses
What validation is required
Which options can be added
Which actions are supported
4. Editable Field Types

All services should use a common field system.

FIELD TYPES
│
├── Text
├── Rich Text
├── Number
├── Boolean
├── Image
├── Video
├── Asset Reference
├── Link
├── Date
├── Time
├── DateTime
├── Select
├── Multi Select
├── List
├── Card
├── Object
├── Nested Object
├── Repeater
├── Schedule
├── Service Reference
└── Experience Reference

Example:

Staff Name
→ Text

Profile Image
→ Asset Reference

Profile Link
→ Link

Subjects
→ List

Current Class
→ Object

Timetable
→ Asset Reference

The service decides which fields exist.

5. Field Contract

Every editable field should define:

FIELD
│
├── id
├── label
├── type
├── description
├── required
├── editable
├── defaultValue
├── validation
├── visibilityCondition
├── allowedValues
├── minimum
├── maximum
└── nestedSchema

Example:

id: complaintLink

label: Complaint Form Link

type: LINK

required: true

editable: true

validation:
  - valid URL
  - HTTPS preferred

Another example:

id: staffMembers

type: REPEATER

nestedSchema:
    name
    designation
    photo
    department
    profileDetails
6. Common Service Content Model

Every service should be able to contain two layers:

SERVICE
│
├── PRIMARY CONTENT
│
└── INTERACTIVE CONTENT
Primary Content

Immediately visible in AR.

Examples:

Title
Short description
Image
Video
Current information
Important status
Interactive Content

Appears when the user interacts.

Examples:

Cards
Buttons
Details
Lists
Links
Forms
Timetables
Profiles

This matches your intended pattern:

First show important information. Then allow the user to explore deeper information through options.

7. Universal Interaction Model

Every service can define interactions like:

INTERACTION
│
├── None
├── Tap
├── Open Detail
├── Open Card
├── Open List
├── Open Link
├── Open Form
├── Expand
├── Collapse
├── Navigate
└── Execute Action

Example:

Tap "Faculty"

→ Open Faculty Cards

Tap Faculty Card

→ Open Faculty Details

The interaction should be defined by the service.

Not hardcoded inside the AR renderer.

8. Action Model

Every interactive element should have an action.

ACTION
│
├── OPEN_DETAIL
├── OPEN_CARD
├── OPEN_LIST
├── OPEN_LINK
├── OPEN_FORM
├── NAVIGATE
├── SUBMIT
├── CALL_SERVICE_API
└── CUSTOM_SERVICE_ACTION

Example:

Complaint Box

Button:
"Submit Complaint"

Action:
OPEN_LINK

The admin edits:

https://example.com/complaint

But the service logic remains unchanged.

9. Service Instance Model

A template is not the same as an instance.

SERVICE TEMPLATE
Notice Board
Version 1.0
        │
        ├───────────────┐
        ↓               ↓
INSTANCE A          INSTANCE B

Main Entrance       Classroom 101

Different Data      Different Data
Same Logic          Same Logic

Example:

Template:
Notice Board

Instances:

IT Department Notices

CSE Department Notices

College Event Notices

Each has independent configuration.

10. Service Configuration Structure

Every deployed service instance should conceptually contain:

SERVICE INSTANCE
│
├── instanceId
├── serviceId
├── serviceVersion
├── name
├── status
├── configuration
├── content
├── interactions
├── data
├── experienceId
├── createdAt
├── updatedAt
└── version

Example:

instance:
    Main Entrance

service:
    Department Entrance

configuration:
    showAchievements: true
    showStaff: true

content:
    welcomeText
    introductionVideo

data:
    staff
    achievements
    symposium
11. Common Service Lifecycle

Every service follows:

REGISTERED
    ↓
AVAILABLE
    ↓
DEPLOYED
    ↓
DRAFT
    ↓
CONFIGURED
    ↓
VALIDATED
    ↓
READY
    ↓
PUBLISHED
    ↓
ACTIVE

Possible failure states:

INVALID
FAILED
DISABLED
ARCHIVED

Admin flow:

Select Service
      ↓
Deploy Instance
      ↓
Configure Fields
      ↓
Save Draft
      ↓
Validate
      ↓
Attach to Experience
      ↓
Publish
      ↓
User Sees Service
12. Your College Service Templates
Service 1 — Spatial Spot

This is the original SpatialOS concept.

Purpose:

Place simple digital content in physical space.

Supports:

Image
Video
Text
Plane

Editable fields:

Title
Text
Image
Video
Plane Size
Plane Layout
Visibility

Spatial configuration remains owned by the Experience/AR system.

The service controls content only.

Service 2 — Notice Board
Primary View

Show:

Board Title
Current / Featured Notice
Optional Image
Optional Video
Interactive Options
Announcements
Events
Academic Notices
Important Updates

Each option is editable.

Example configuration:

Notice Board
│
├── Title
├── Featured Content
│
├── Categories
│     ├── Academic
│     ├── Events
│     ├── Placement
│     └── General
│
└── Announcements
      ├── Title
      ├── Description
      ├── Date
      ├── Image
      ├── Link
      └── Priority

Business principle:

Admin adds notices
        ↓
Service stores structured entries
        ↓
Primary view selects important/current content
        ↓
User taps category
        ↓
Detailed notice cards open
Service 3 — Student Corner

Purpose:

Showcase student activities and achievements.

Primary content:

Featured Student Content
Title
Image or Video
Short Description

Interactive sections:

Arts
Achievements
Events
Projects
Student Showcase

Reusable card structure:

Showcase Item
│
├── Title
├── Category
├── Image / Video
├── Description
├── Author / Student
├── Date
└── Optional Link

Admin can add unlimited items.

Service 4 — Complaint Box

Primary content:

Complaint Box

Short explanation

Interaction:

Submit Complaint

Editable configuration:

Title
Description
Complaint Link
Button Label
Optional Anonymous Notice

Business logic:

User taps Complaint Box
        ↓
Service displays information
        ↓
User taps Submit
        ↓
Configured Link / Form opens

The service should validate that a valid destination exists before publishing.

If the link is missing:

Service cannot be published.
Service 5 — Classroom

Primary view:

Current Class

Subject
Faculty
Time

Next Class

Subject
Faculty
Time

Interactive options:

View Timetable
Tasks / Assignments

Configuration:

Classroom Name
Section
Current Schedule Source
Next Schedule Source
Timetable
Tasks

Timetable can be:

Structured timetable data
OR
Timetable image/PDF/link

For V1, your intended format can support:

Timetable Image

Tasks:

Task
│
├── Title
├── Description
├── Due Date
├── Priority
└── Status

Business logic:

Current Time
      ↓
Compare Against Timetable
      ↓
Determine Current Class
      ↓
Determine Next Class
      ↓
Render Primary View

The service should calculate this dynamically rather than requiring the admin to manually update "Current Class".

Service 6 — Department Entrance

Primary content:

Department Name

Short Introduction

Image or Video

Interactive options:

Faculty
Symposium
Academic Excellence
Achievements
Projects
Placements
Announcements

Each option can be enabled or disabled.

Structure:

DEPARTMENT ENTRANCE
│
├── Primary Introduction
│
├── Faculty
│
├── Symposium
│
├── Academic Excellence
│
├── Achievements
│
├── Projects
│
└── Placements

Every section should have its own editable data schema.

Example:

Achievement
│
├── Title
├── Description
├── Image / Video
├── Date
└── Detail Content

Faculty:

Faculty Member
│
├── Name
├── Photo
├── Designation
├── Department
├── Specialization
├── Subjects
└── Details
Service 7 — Staff Room

Purpose:

Show all staff information in one location.

Primary content:

Staff Room
Total Faculty
Short Information

Interactive:

Faculty List

Each staff card:

Photo
Name
Designation

Detail view:

Name
Photo
Designation
Department
Subjects
Current Status / Availability
Optional Timetable
Contact Information if allowed

Admin should be able to:

Add Staff
Edit Staff
Remove Staff
Reorder Staff
Update Details
Service 8 — Staff Table

This is an individual staff service.

One instance = one staff member.

Primary:

Name
Designation
Photo
Short Introduction

Options:

Profile
Subjects
Timetable
Availability

Configuration:

Staff ID
Name
Photo
Designation
Department
Subjects
Timetable
Profile Details

The same StaffProfile data structure should ideally be reusable by:

Staff Room
Staff Table
Department Entrance

Do not duplicate the same staff data independently.

Use references.

Staff Table
      │
      ▼
Staff Profile ID

This avoids updating the same faculty member in three places.

Service 9 — HOD Room

Primary:

HOD Name
Photo
Designation

Department Information

Interactive options:

About HOD
Department Vision
Achievements
Important Information
Department Highlights
Complaint / Feedback

Editable fields:

HOD Profile
Department Description
Message
Achievements
Highlights
Feedback Link

Recommended addition:

Message from HOD

Example:

Welcome Message
Department Vision
Important Announcement
13. Reusable Nested Templates

Do not create everything separately.

Define reusable data templates.

REUSABLE DATA
│
├── Person
├── Staff Profile
├── Achievement
├── Announcement
├── Event
├── Project
├── Media Item
├── Link
├── Task
├── Timetable Entry
└── Showcase Item

Then services reuse them.

Example:

Department Entrance
        │
        └── StaffProfile[]

Staff Room
        │
        └── StaffProfile[]

Staff Table
        │
        └── StaffProfile

This is very important for maintainability.

14. Nested Option Structure

Your deeper interactions should use a common hierarchy:

SERVICE
│
├── PRIMARY VIEW
│
└── OPTIONS
      │
      ├── OPTION
      │     │
      │     └── DETAIL VIEW
      │
      ├── OPTION
      │     │
      │     └── LIST / CARDS
      │
      └── OPTION
            │
            └── ACTION

Example:

Department Entrance
│
├── Intro
│
├── Faculty
│     └── Faculty Cards
│             └── Faculty Detail
│
├── Symposium
│     └── Event Cards
│             └── Event Detail
│
└── Achievements
      └── Achievement Cards
              └── Achievement Detail

Everything remains configurable.

15. Generic Editing Principle

The dashboard should not have separate hardcoded editing logic for every service.

Instead:

SERVICE DEFINITION
        ↓
CONFIGURATION SCHEMA
        ↓
DASHBOARD FORM GENERATOR
        ↓
ADMIN EDITS DATA
        ↓
VALIDATION
        ↓
SAVE INSTANCE CONFIG

Example:

Developer defines:

field:
    id: complaintLink
    type: LINK
    required: true

Dashboard automatically provides:

Complaint Link

[________________________]

Another:

field:
    id: staff
    type: REPEATER

Dashboard automatically supports:

Staff

[ Add Staff ]

Staff 1
[ Edit ] [ Delete ]

Staff 2
[ Edit ] [ Delete ]

This is the correct generic architecture.

16. Service Business Logic Boundary

The system should separate:

SERVICE LOGIC

from:

SERVICE CONTENT

Example:

Classroom

Logic:

Calculate current class
Calculate next class

Content:

Timetable
Subjects
Faculty
Times

Admin edits content.

Developer controls calculation logic.

Complaint Box

Logic:

Validate configured destination
Open configured destination

Content:

Title
Description
Complaint URL
Notice Board

Logic:

Sort announcements
Apply schedule
Determine active notices
Open selected item

Content:

Notices
Images
Videos
Text
Links
17. Service Validation Before Publish

Every service should expose:

validate(instance)

Validation checks:

Required fields
Correct data types
Valid references
Existing assets
Valid links
Service-specific rules

Example:

Complaint Box

complaintLink = null

Result:

INVALID

Complaint link is required.

Publishing is blocked.

18. Final Service Architecture
DEVELOPER
│
▼
SERVICE TEMPLATE
│
├── Identity
├── Version
├── Metadata
├── Capabilities
│
├── Configuration Schema
│     ├── Common Fields
│     └── Service-Specific Fields
│
├── Content Schema
│
├── Interaction Schema
│
├── Action Schema
│
├── Reusable Data Models
│
├── Business Logic
│
├── Validation
│
├── State
│
└── Lifecycle
        │
        ▼
SERVICE REGISTRY
        │
        ▼
ADMIN DEPLOYS INSTANCE
        │
        ▼
INSTANCE CONFIGURATION
        │
        ├── Editable Content
        ├── Assets
        ├── Links
        ├── Lists
        ├── Cards
        ├── Options
        └── Service-specific Data
        │
        ▼
VALIDATE
        │
        ▼
ATTACH TO EXPERIENCE
        │
        ▼
PUBLISH
        │
        ▼
SPATIALOS USER APP
        │
        ▼
PRIMARY AR VIEW
        │
        ▼
USER INTERACTION
        │
        ├── Cards
        ├── Details
        ├── Lists
        ├── Links
        ├── Forms
        └── Actions
Final rule

Every future service—whether it is for a college, hospital, mall, cafe, office, museum, railway station, factory, or any other physical place—should follow this same model:

Developer defines behavior and schema → dashboard generates editable configuration → admin manages content and data → service instance attaches to an experience → publishing makes it available in the physical location.

This gives SpatialOS one generic service architecture while allowing every service to have completely different fields, interactions, business logic, cards, links, forms, lists, media, and deeper detail layers.
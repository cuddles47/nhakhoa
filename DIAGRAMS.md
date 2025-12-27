# Architecture Diagrams

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (React)                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   │
│  │   Features   │   │  Components  │   │    Hooks     │   │
│  │              │   │              │   │              │   │
│  │  • Auth      │   │  • Button    │   │  • useAuth   │   │
│  │  • Patients  │   │  • Modal     │   │  • usePage   │   │
│  │  • Visits    │   │  • Spinner   │   │  • useSearch │   │
│  │  • Images    │   │  • Badge     │   │              │   │
│  └──────┬───────┘   └──────────────┘   └──────┬───────┘   │
│         │                                       │           │
│         └───────────────┬───────────────────────┘           │
│                         ↓                                   │
│                  ┌──────────────┐                           │
│                  │   Services   │                           │
│                  │              │                           │
│                  │  • authSvc   │                           │
│                  │  • patientSvc│                           │
│                  │  • visitSvc  │                           │
│                  │  • imageSvc  │                           │
│                  └──────┬───────┘                           │
│                         │                                   │
│                         ↓                                   │
│                  ┌──────────────┐                           │
│                  │  API Client  │                           │
│                  │  (Axios)     │                           │
│                  └──────┬───────┘                           │
└─────────────────────────┼───────────────────────────────────┘
                          │
                          │ HTTP/REST + JWT
                          │
┌─────────────────────────┼───────────────────────────────────┐
│                         ↓                                   │
│                  ┌──────────────┐                           │
│                  │   Express    │                           │
│                  │   Middleware │                           │
│                  │              │                           │
│                  │  • CORS      │                           │
│                  │  • Auth JWT  │                           │
│                  │  • Validate  │                           │
│                  └──────┬───────┘                           │
│                         ↓                                   │
│                  ┌──────────────┐                           │
│                  │ Controllers  │                           │
│                  │              │                           │
│                  │  • Auth      │                           │
│                  │  • Patient   │                           │
│                  │  • Visit     │                           │
│                  │  • Image     │                           │
│                  └──────┬───────┘                           │
│                         │                                   │
│          ┌──────────────┴──────────────┐                   │
│          ↓                              ↓                   │
│   ┌──────────────┐             ┌──────────────┐            │
│   │  PostgreSQL  │             │    MinIO     │            │
│   │  (Database)  │             │  (S3 Storage)│            │
│   └──────────────┘             └──────────────┘            │
│                                                              │
│                    Backend (Node.js)                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Frontend Data Flow

```
┌─────────────┐
│   User      │
│  Action     │
└──────┬──────┘
       │
       ↓
┌──────────────────────────────────────────────┐
│           Component (UI Layer)                │
│  • Handles user interaction                  │
│  • Renders UI based on state                 │
│  • NO business logic                         │
└──────┬───────────────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────────────┐
│         Custom Hook (Logic Layer)            │
│  • React Query (useQuery/useMutation)        │
│  • Business logic                            │
│  • State management                          │
│  • Calls service layer                       │
└──────┬───────────────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────────────┐
│         Service (API Layer)                  │
│  • Makes HTTP requests                       │
│  • Handles request/response formatting       │
│  • Error handling                            │
│  • NO React dependencies                     │
└──────┬───────────────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────────────┐
│         API Client (HTTP Layer)              │
│  • Axios instance                            │
│  • Interceptors (auth, errors)               │
│  • Base URL configuration                    │
└──────┬───────────────────────────────────────┘
       │
       ↓
    Backend
```

**Example:**
```jsx
// 1. User clicks button
<Button onClick={handleCreate} />

// 2. Component calls hook
const createPatient = useCreatePatient();
handleCreate = () => createPatient.mutate(data);

// 3. Hook calls service
mutationFn: (data) => patientService.createPatient(data)

// 4. Service makes HTTP request
async createPatient(data) {
  return await apiClient.post('/patients', data);
}

// 5. API Client adds auth & makes request
apiClient.interceptors.request.use((config) => {
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

---

## Component Hierarchy

```
App
├── AuthProvider (Context)
│   └── Router
│       ├── LoginPage
│       │   └── LoginForm
│       │       ├── Input
│       │       └── Button
│       │
│       ├── PatientListPage
│       │   ├── SearchBox
│       │   ├── PatientCard[]
│       │   │   ├── StatusBadge
│       │   │   └── Button
│       │   └── Pagination
│       │
│       ├── PatientDetailPage ⭐
│       │   ├── LoadingSpinner (if loading)
│       │   ├── EmptyState (if error/notfound)
│       │   ├── PatientInfo
│       │   ├── VisitList
│       │   │   └── VisitCard[]
│       │   │       └── StatusBadge
│       │   └── Modal
│       │       └── PatientForm
│       │           ├── Input
│       │           └── Button
│       │
│       └── VisitDetailPage
│           ├── VisitStepFlow ⭐
│           │   ├── StepIndicator
│           │   ├── StepContent
│           │   │   └── ImageUploader ⭐
│           │   │       ├── ImageGrid
│           │   │       └── Button
│           │   └── Navigation
│           │       └── Button[]
│           │
│           └── ImageCompare ⭐
│               ├── PositionSelector
│               ├── ZoomControls
│               └── ImageViewer
```

⭐ = Example implementations provided

---

## Feature Module Structure

```
features/
│
├── auth/
│   ├── components/
│   │   └── LoginForm.jsx
│   ├── hooks/
│   │   └── useAuth.jsx          # Context + login/logout
│   └── pages/
│       └── LoginPage.jsx
│
├── patients/
│   ├── components/
│   │   └── PatientCard.jsx
│   ├── hooks/
│   │   └── usePatients.js       # CRUD hooks
│   │       ├── usePatients()     → GET list
│   │       ├── usePatient(id)    → GET single
│   │       ├── useCreatePatient() → POST
│   │       ├── useUpdatePatient() → PUT
│   │       └── useDeletePatient() → DELETE
│   └── pages/
│       ├── PatientListPage.jsx
│       └── PatientDetailPage.jsx ⭐
│
├── visits/
│   ├── components/
│   │   └── VisitStepFlow.jsx ⭐
│   ├── hooks/
│   │   └── useVisits.js
│   └── pages/
│       └── VisitDetailPage.jsx
│
└── images/
    ├── components/
    │   ├── ImageUploader.jsx ⭐
    │   └── ImageCompare.jsx ⭐
    └── hooks/
        └── useImages.js
```

---

## State Management Strategy

```
┌─────────────────────────────────────────────────────┐
│                  Application State                   │
└─────────────────────────────────────────────────────┘

┌──────────────────────────┐  ┌──────────────────────┐
│      Server State        │  │      UI State        │
│  (React Query)           │  │  (useState)          │
├──────────────────────────┤  ├──────────────────────┤
│ • Patients data          │  │ • Modal open/close   │
│ • Visits data            │  │ • Form input values  │
│ • Images data            │  │ • Tab selection      │
│ • User profile           │  │ • Dropdown state     │
│                          │  │ • Loading buttons    │
│ ✅ Cached automatically  │  │                      │
│ ✅ Auto-refetch          │  │ ✅ Local to component│
│ ✅ Optimistic updates    │  │ ✅ Lifted when shared│
└──────────────────────────┘  └──────────────────────┘

       ┌──────────────────────────┐
       │     Global State         │
       │  (React Context)         │
       ├──────────────────────────┤
       │ • Authentication state   │
       │ • User info              │
       │ • Theme preference       │
       │                          │
       │ ✅ Used sparingly        │
       │ ✅ Only for truly global │
       └──────────────────────────┘
```

---

## React Query Cache Flow

```
Component mounts
      ↓
useQuery() hook executes
      ↓
Check React Query cache
      ↓
   ┌──────────┐
   │ In cache?│
   └────┬─────┘
        │
   ┌────┴────┐
   │         │
  Yes       No
   │         │
   ↓         ↓
Return    Fetch from
cached    API
data      │
   │      ↓
   │   Store in
   │   cache
   │      │
   └──────┴───→ Return data
              to component

Background:
• Auto-refetch on window focus
• Auto-refetch on network reconnect
• Stale-while-revalidate pattern
• Automatic garbage collection
```

---

## Authentication Flow

```
1. User Login
   ┌──────────┐
   │ Username │
   │ Password │
   └────┬─────┘
        ↓
   [Submit] Button
        ↓
   useAuth().login()
        ↓
   authService.login()
        ↓
   POST /api/auth/login
        ↓
   Backend validates
        ↓
   Generate JWT token
        ↓
   Return { user, token }
        ↓
   Store in localStorage
        ↓
   Redirect to /patients


2. Authenticated Request
   Component needs data
        ↓
   usePatients() hook
        ↓
   patientService.getPatients()
        ↓
   apiClient.get('/patients')
        ↓
   Request Interceptor
        ↓
   Add: Authorization: Bearer <token>
        ↓
   Send to backend
        ↓
   Backend auth middleware
        ↓
   Verify JWT token
        ↓
   Return data


3. Token Expired
   Request to backend
        ↓
   Backend returns 401
        ↓
   Response Interceptor
        ↓
   Clear localStorage
        ↓
   Redirect to /login
```

---

## Image Upload Flow

```
User uploads image
      ↓
ImageUploader component
      ↓
File validation (type, size)
      ↓
Create preview (FileReader)
      ↓
Store in local state
      ↓
User clicks "Upload"
      ↓
useUploadImage() mutation
      ↓
imageService.uploadImage()
      ↓
Convert to FormData
      ↓
POST /api/images/:visitId/upload
      ↓
Backend (Multer middleware)
      ↓
Upload to MinIO
      ↓
Generate presigned URL
      ↓
Save metadata to PostgreSQL
      ↓
Return image record
      ↓
React Query invalidates cache
      ↓
Auto-refetch images
      ↓
UI updates with new image
```

---

## Error Handling Flow

```
API Request
    ↓
Try to fetch
    ↓
┌───────┐
│ Error?│
└───┬───┘
    │
   Yes
    ↓
axios.catch()
    ↓
Response Interceptor
    │
    ├─→ 401 Unauthorized
    │   └─→ Redirect to /login
    │
    ├─→ 4xx Client Error
    │   └─→ Show toast error
    │       └─→ Return error to component
    │
    └─→ 5xx Server Error
        └─→ Show toast error
            └─→ Return error to component
                ↓
          Component receives error
                ↓
          Show <EmptyState icon="⚠️" />
          or inline error message
```

---

## Component Best Practices Flow

```
Component receives props
      ↓
Destructure props
      ↓
Call hooks (React Query, state)
      ↓
┌──────────────────┐
│ Check all states │
└────────┬─────────┘
         │
    ┌────┴────┐
    │         │
Loading?   Error?
    │         │
   Yes       Yes
    │         │
    ↓         ↓
 <Loading>  <Error>
            State
    
    ↓
  No data?
    │
   Yes
    │
    ↓
 <Empty>
  State
    
    ↓
  Has data
    │
    ↓
 Render
 Success
  View
    │
    ├─→ Extract sub-components
    ├─→ Pass callbacks as props
    ├─→ Keep component < 200 lines
    └─→ Single responsibility
```

---

## File Naming Conventions

```
Components:     PascalCase.jsx     (Button.jsx, Modal.jsx)
Hooks:          camelCase.js       (useAuth.js, usePatients.js)
Services:       camelCase.js       (authService.js)
Utils:          camelCase.js       (formatters.js)
Constants:      camelCase.js       (index.js)
Pages:          PascalCase.jsx     (PatientDetailPage.jsx)
CSS:            PascalCase.css     (Button.css)
```

---

## Summary

This architecture provides:

✅ **Clear separation** - 4 distinct layers (UI → Hooks → Services → API)  
✅ **Scalable structure** - Feature-based organization  
✅ **State management** - React Query for server state  
✅ **Error handling** - Multiple levels of error catching  
✅ **Type safety** - Service contracts (ready for TypeScript)  
✅ **Best practices** - Industry-standard patterns  

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed explanations.

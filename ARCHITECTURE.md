# Dental Orthodontic Web App - Architecture Documentation

## 📋 Table of Contents

1. [Overview](#overview)
2. [Folder Structure](#folder-structure)
3. [Core Principles](#core-principles)
4. [Architecture Patterns](#architecture-patterns)
5. [Component Library](#component-library)
6. [Service Layer](#service-layer)
7. [Custom Hooks](#custom-hooks)
8. [Example Components](#example-components)
9. [Design Decisions](#design-decisions)
10. [Best Practices](#best-practices)
11. [Getting Started](#getting-started)

---

## 🎯 Overview

This is a **production-ready, feature-based frontend architecture** for a dental orthodontic management system used by doctors (non-technical users). The architecture emphasizes:

- ✅ **Clean separation of concerns** (UI, business logic, API calls)
- ✅ **Highly reusable components**
- ✅ **Feature-based organization**
- ✅ **Type-safe service layer**
- ✅ **Proper loading/error/empty states**
- ✅ **Simple, intuitive UX for doctors**

### Technology Stack

**Frontend:**
- React 18.2 (Functional components + Hooks)
- React Router 6.20 (Client-side routing)
- React Query (TanStack Query) - Server state management
- React Hook Form - Form validation (optional)
- Axios - HTTP client
- React Hot Toast - Notifications
- Vite - Build tool

**Backend:**
- Node.js + Express
- PostgreSQL + MinIO
- JWT Authentication

---

## 📁 Folder Structure

```
frontend/src/
├── components/              # Shared reusable components
│   ├── ui/                 # Base UI components (Button, Modal, etc.)
│   │   ├── Button.jsx
│   │   ├── Modal.jsx
│   │   ├── LoadingSpinner.jsx
│   │   ├── EmptyState.jsx
│   │   ├── StatusBadge.jsx
│   │   ├── SearchBox.jsx
│   │   ├── Pagination.jsx
│   │   └── *.css
│   └── layout/             # Layout components
│       └── Sidebar.jsx
│
├── features/               # Feature modules (domain-driven)
│   ├── auth/
│   │   ├── components/    # Auth-specific components
│   │   │   └── LoginForm.jsx
│   │   ├── hooks/         # Auth-specific hooks
│   │   │   └── useAuth.jsx
│   │   └── pages/         # Auth pages
│   │       └── LoginPage.jsx
│   │
│   ├── patients/
│   │   ├── components/    # Patient-specific components
│   │   │   └── PatientCard.jsx
│   │   ├── hooks/         # Patient hooks (CRUD operations)
│   │   │   └── usePatients.js
│   │   └── pages/         # Patient pages
│   │       ├── PatientListPage.jsx
│   │       └── PatientDetailPage.jsx
│   │
│   ├── visits/
│   │   ├── components/
│   │   │   └── VisitStepFlow.jsx
│   │   ├── hooks/
│   │   │   └── useVisits.js
│   │   └── pages/
│   │       └── VisitDetailPage.jsx
│   │
│   └── images/
│       ├── components/
│       │   ├── ImageUploader.jsx
│       │   └── ImageCompare.jsx
│       └── hooks/
│           └── useImages.js
│
├── hooks/                  # Shared custom hooks
│   ├── usePagination.js
│   ├── useSearch.js
│   └── useFileUpload.js
│
├── services/               # API service layer
│   ├── apiClient.js       # Axios instance with interceptors
│   ├── authService.js     # Auth API calls
│   ├── patientService.js  # Patient API calls
│   ├── visitService.js    # Visit API calls
│   └── imageService.js    # Image API calls
│
├── utils/                  # Utility functions
│   ├── formatters.js      # Date, number formatting
│   └── validators.js      # Input validation
│
├── constants/              # App constants
│   └── index.js           # Status codes, query keys, etc.
│
├── App.jsx                 # Root component
└── main.jsx                # Entry point
```

### Why Feature-Based?

**Traditional (Technical Grouping):**
```
src/
├── components/  (100+ files mixed together)
├── hooks/       (all hooks together)
├── pages/       (all pages together)
```

**Feature-Based (Domain Grouping):**
```
src/features/
├── patients/    (everything patient-related)
├── visits/      (everything visit-related)
├── images/      (everything image-related)
```

**Benefits:**
- ✅ Easy to locate related code
- ✅ Natural separation of concerns
- ✅ Scalable to large codebases
- ✅ Easy to delete/refactor entire features
- ✅ Better code ownership

---

## 🎯 Core Principles

### 1. Separation of Concerns

**❌ Bad (God Component):**
```jsx
function PatientList() {
  // Mixed: API calls, business logic, UI all together
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    fetch('/api/patients').then(res => res.json()).then(setPatients);
  }, []);
  
  return <div>...</div>;
}
```

**✅ Good (Separated Concerns):**
```jsx
// Service layer handles API
// Hook handles React Query integration
// Component only handles UI
function PatientList() {
  const { data, isLoading } = usePatients({ page: 1, limit: 10 });
  
  if (isLoading) return <LoadingSpinner />;
  return <div>...</div>;
}
```

### 2. Composability

Build small, focused components that compose together:

```jsx
<Modal>
  <PatientForm>
    <Input />
    <Button />
  </PatientForm>
</Modal>
```

### 3. DRY (Don't Repeat Yourself)

Extract repeated patterns into reusable hooks/components.

### 4. Single Responsibility

Each file should have ONE clear purpose.

---

## 🏗️ Architecture Patterns

### 1. Service Layer Pattern

**Purpose:** Abstract API calls from components

**File:** `src/services/patientService.js`

```javascript
class PatientService {
  async getPatients({ page, limit, search }) {
    const response = await apiClient.get('/patients', {
      params: { page, limit, search }
    });
    return response.data;
  }
  
  async createPatient(patientData) {
    const response = await apiClient.post('/patients', patientData);
    return response.data;
  }
}

export default new PatientService();
```

**Benefits:**
- ✅ Centralized API logic
- ✅ Easy to test
- ✅ Easy to mock for development
- ✅ Type-safe contracts

### 2. Custom Hooks Pattern

**Purpose:** Encapsulate business logic and state management

**File:** `src/features/patients/hooks/usePatients.js`

```javascript
export const usePatients = ({ page, limit, search }) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.PATIENTS, { page, limit, search }],
    queryFn: () => patientService.getPatients({ page, limit, search }),
    keepPreviousData: true
  });
};

export const useCreatePatient = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data) => patientService.createPatient(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PATIENTS });
      toast.success('Tạo bệnh nhân thành công');
    }
  });
};
```

**Benefits:**
- ✅ Reusable across components
- ✅ Automatic caching and refetching (React Query)
- ✅ Built-in loading/error states
- ✅ Optimistic updates

### 3. Presentational vs Container Pattern

**Presentational (Dumb) Component:**
```jsx
function PatientCard({ patient, onEdit, onDelete }) {
  return (
    <div className="card">
      <h3>{patient.name}</h3>
      <Button onClick={() => onEdit(patient)}>Edit</Button>
    </div>
  );
}
```

**Container (Smart) Component:**
```jsx
function PatientListContainer() {
  const { data, isLoading } = usePatients();
  const updatePatient = useUpdatePatient();
  
  const handleEdit = (patient) => {
    updatePatient.mutate({ id: patient.id, data: {...} });
  };
  
  return <PatientCard patient={data} onEdit={handleEdit} />;
}
```

---

## 🧩 Component Library

### Base UI Components

#### 1. Button

**Usage:**
```jsx
<Button variant="primary" size="md" loading={isSubmitting}>
  Submit
</Button>
```

**Props:**
- `variant`: primary | secondary | danger | success | ghost
- `size`: sm | md | lg
- `loading`: boolean
- `disabled`: boolean

#### 2. Modal

**Usage:**
```jsx
<Modal 
  isOpen={isOpen} 
  onClose={handleClose}
  title="Edit Patient"
  size="md"
  footer={<Button onClick={handleSave}>Save</Button>}
>
  <PatientForm />
</Modal>
```

**Props:**
- `isOpen`: boolean
- `onClose`: function
- `title`: string
- `size`: sm | md | lg | xl
- `footer`: ReactNode
- `closeOnOverlayClick`: boolean

#### 3. LoadingSpinner

**Usage:**
```jsx
<LoadingSpinner size="lg" text="Loading..." />
```

#### 4. EmptyState

**Usage:**
```jsx
<EmptyState
  icon="📋"
  title="No patients found"
  message="Create your first patient"
  action={<Button onClick={handleCreate}>Create</Button>}
/>
```

#### 5. StatusBadge

**Usage:**
```jsx
<StatusBadge status="completed" label="Hoàn thành" />
```

#### 6. SearchBox

**Usage:**
```jsx
<SearchBox 
  placeholder="Search patients..."
  onSearch={handleSearch}
  debounceMs={300}
/>
```

#### 7. Pagination

**Usage:**
```jsx
<Pagination
  currentPage={page}
  totalPages={totalPages}
  onPageChange={setPage}
  pageSize={pageSize}
  onPageSizeChange={setPageSize}
  totalItems={totalItems}
/>
```

---

## 🔧 Service Layer

### API Client

**File:** `src/services/apiClient.js`

Features:
- Axios instance with base URL
- Request interceptor (adds JWT token)
- Response interceptor (handles 401 errors)
- Automatic redirect to login on unauthorized

### Service Classes

Each service handles one domain:

1. **authService** - Login, logout, profile
2. **patientService** - Patient CRUD
3. **visitService** - Visit CRUD
4. **imageService** - Image upload, validation

**Pattern:**
```javascript
class ServiceName {
  async methodName(params) {
    const response = await apiClient.request(...);
    return response.data;
  }
}

export default new ServiceName();
```

---

## 🪝 Custom Hooks

### Shared Hooks

#### usePagination
```javascript
const { page, pageSize, setPage, setPageSize } = usePagination(1, 10);
```

#### useSearch
```javascript
const { query, debouncedQuery, setQuery } = useSearch('');
```

### Domain-Specific Hooks

#### usePatients (Query)
```javascript
const { data, isLoading, error } = usePatients({ page, limit, search });
```

#### useCreatePatient (Mutation)
```javascript
const createPatient = useCreatePatient();
createPatient.mutate(patientData);
```

#### useUpdatePatient (Mutation)
```javascript
const updatePatient = useUpdatePatient();
updatePatient.mutate({ id, data });
```

**Pattern:**
- Queries: `use[Resource]`, `use[Resource]s`
- Mutations: `useCreate[Resource]`, `useUpdate[Resource]`, `useDelete[Resource]`

---

## 🎨 Example Components

### 1. ImageUploader

**Purpose:** Upload 9 dental images in 3×3 grid

**Features:**
- Drag & drop support
- Preview before upload
- File validation (type, size)
- Separate RAW and Stained categories
- Shows existing images

**Usage:**
```jsx
<ImageUploader
  visitId={visitId}
  category={IMAGE_CATEGORY.RAW}
  onUploadComplete={handleUpload}
  existingImages={images}
/>
```

### 2. ImageCompare

**Purpose:** Compare RAW vs Stained images side-by-side

**Features:**
- Position selector (9 positions)
- Zoom in/out
- Before/After slider
- Side-by-side fallback

**Usage:**
```jsx
<ImageCompare
  rawImages={rawImages}
  stainedImages={stainedImages}
/>
```

### 3. VisitStepFlow

**Purpose:** Multi-step wizard for visit workflow

**Features:**
- 5 steps: Upload → Validate → Process → Label → Complete
- Step navigation
- Progress indicator
- Step validation

**Usage:**
```jsx
<VisitStepFlow
  visitId={visitId}
  onComplete={handleComplete}
/>
```

---

## 🎯 Design Decisions

### 1. Why React Query over Redux?

**Reasoning:**
- Server state ≠ Client state
- React Query handles:
  - ✅ Caching automatically
  - ✅ Background refetching
  - ✅ Stale data management
  - ✅ Loading/error states
  - ✅ Request deduplication
- Redux is overkill for this app
- Less boilerplate, more productivity

### 2. Why Feature-Based Structure?

**Reasoning:**
- ✅ Scalable (20+ features)
- ✅ Easy to navigate
- ✅ Natural code ownership
- ✅ Delete features easily
- ✅ Reduced cognitive load

### 3. Why Service Classes?

**Reasoning:**
- ✅ Centralized API logic
- ✅ Easy to test/mock
- ✅ Type-safe contracts
- ✅ Separation from React

### 4. Why Custom CSS over UI Libraries?

**Reasoning:**
- ✅ Full control over design
- ✅ No learning curve for doctors
- ✅ Smaller bundle size
- ✅ No breaking changes from 3rd party

**Alternative:** Could use Radix UI (headless) or shadcn/ui

### 5. Why JWT over Sessions?

**Reasoning:**
- ✅ Stateless authentication
- ✅ Scalable (no server-side storage)
- ✅ Works with mobile apps
- ✅ Easy to implement

### 6. Why No TypeScript (Yet)?

**Reasoning:**
- Start with JavaScript for rapid prototyping
- Add TypeScript incrementally:
  1. Add JSDoc comments
  2. Enable `checkJs` in tsconfig
  3. Gradually convert to .ts/.tsx

**Future:** Migrate to TypeScript for production

---

## ✅ Best Practices

### 1. Component Design

**✅ Do:**
- Keep components small (<200 lines)
- Extract logic to custom hooks
- Use prop destructuring
- Handle loading/error/empty states

**❌ Don't:**
- Mix API calls with UI
- Create "god components"
- Inline large JSX blocks
- Forget accessibility

### 2. State Management

**✅ Do:**
- Use React Query for server state
- Use local state for UI state
- Lift state when needed
- Use context sparingly

**❌ Don't:**
- Store server data in local state
- Over-use useEffect
- Create unnecessary global state

### 3. API Calls

**✅ Do:**
- Use service layer
- Use React Query hooks
- Handle errors gracefully
- Show toast notifications

**❌ Don't:**
- Call APIs directly in components
- Ignore error states
- Forget loading indicators

### 4. Styling

**✅ Do:**
- Use CSS modules or separate files
- Follow BEM naming
- Use CSS variables
- Keep styles close to components

**❌ Don't:**
- Use inline styles extensively
- Create global style pollution
- Hardcode colors/sizes

### 5. Performance

**✅ Do:**
- Use React.memo for expensive renders
- Implement virtual scrolling for large lists
- Optimize images
- Code-split large features

**❌ Don't:**
- Re-render unnecessarily
- Load all data upfront
- Forget to cleanup effects

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Environment Setup

Create `.env`:
```
VITE_API_URL=http://localhost:3000/api
```

### 3. Start Development Server

```bash
npm run dev
```

### 4. Build for Production

```bash
npm run build
```

### 5. Project Structure Template

When creating a new feature:

```
src/features/[feature-name]/
├── components/         # Feature-specific components
│   └── ComponentName.jsx
├── hooks/             # Feature-specific hooks
│   └── useFeature.js
├── pages/             # Feature pages
│   └── FeaturePage.jsx
└── utils/             # Feature utilities (optional)
```

### 6. Code Examples

**Creating a new feature hook:**
```javascript
// src/features/[feature]/hooks/useFeature.js
import { useQuery } from '@tanstack/react-query';
import featureService from '../../../services/featureService';

export const useFeature = (id) => {
  return useQuery({
    queryKey: ['feature', id],
    queryFn: () => featureService.getFeature(id),
    enabled: !!id
  });
};
```

**Creating a new page:**
```javascript
// src/features/[feature]/pages/FeaturePage.jsx
import { useFeature } from '../hooks/useFeature';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

function FeaturePage() {
  const { data, isLoading, error } = useFeature(id);
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState />;
  if (!data) return <EmptyState />;
  
  return <div>...</div>;
}
```

---

## 📝 Summary

This architecture provides:

✅ **Clean separation** of UI, business logic, and API calls  
✅ **Highly reusable** components and hooks  
✅ **Feature-based** organization for scalability  
✅ **Type-safe** service layer  
✅ **Production-ready** patterns and best practices  
✅ **Simple UX** for non-technical doctors  

**Next Steps:**
1. Add TypeScript for type safety
2. Add tests (Vitest + React Testing Library)
3. Add Storybook for component documentation
4. Implement real-time updates (WebSocket)
5. Add analytics and monitoring

---

**Questions or Issues?** Review this documentation and example code in:
- `src/features/patients/pages/PatientDetailPage.jsx` (Complete page example)
- `src/features/images/components/ImageUploader.jsx` (Complex component)
- `src/features/visits/components/VisitStepFlow.jsx` (Multi-step flow)

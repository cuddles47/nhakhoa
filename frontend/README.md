# 🦷 Dental Orthodontic Web App - Fresh Architecture

A **production-ready, feature-based frontend architecture** for dental orthodontic management used by doctors.

## 🎯 Goals Achieved

✅ Clean, maintainable, scalable frontend  
✅ Highly reusable components  
✅ Clear separation: UI, business logic, API calls  
✅ Simple UX for doctors  
✅ No Redux (React Query instead)  
✅ No god components  
✅ Feature-based architecture  
✅ All screens handle loading/error/empty states  

---

## 📦 What's Included

### 1. **Folder Structure**

```
frontend/src/
├── components/ui/          # Reusable UI components
├── features/               # Feature modules (auth, patients, visits, images)
├── hooks/                  # Shared custom hooks
├── services/               # API service layer
├── utils/                  # Utility functions
└── constants/              # App constants
```

Full details: [ARCHITECTURE.md](../ARCHITECTURE.md)

### 2. **Core Reusable Components**

- **Button** - Multi-variant button with loading state
- **Modal** - Flexible modal dialog with sizes
- **LoadingSpinner** - Loading indicators (sm/md/lg)
- **EmptyState** - Empty state with icon/action
- **StatusBadge** - Color-coded status badges
- **SearchBox** - Debounced search input
- **Pagination** - Full pagination with page size selector

### 3. **Example Components**

- **ImageUploader** - 3×3 grid dental image uploader with drag-drop
- **ImageCompare** - Before/after comparison with slider
- **VisitStepFlow** - Multi-step wizard (Upload → Validate → Process → Label → Complete)

### 4. **Complete Page Example**

- **PatientDetailPage** - Shows all best practices:
  - React Query for data fetching
  - Loading/error/empty states
  - Extracted forms as sub-components
  - Modal interactions
  - CRUD operations

### 5. **Service Layer**

- `apiClient.js` - Axios with interceptors
- `authService.js` - Login, logout, profile
- `patientService.js` - Patient CRUD
- `visitService.js` - Visit CRUD
- `imageService.js` - Image upload, validation

### 6. **Custom Hooks**

**Shared:**
- `usePagination()` - Pagination state
- `useSearch()` - Search with debouncing

**Domain-specific:**
- `useAuth()` - Authentication
- `usePatients()`, `useCreatePatient()`, `useUpdatePatient()`, `useDeletePatient()`
- `useVisits()`, `useCreateVisit()`, `useUpdateVisit()`, `useDeleteVisit()`
- `useVisitImages()`, `useUploadImage()`, `useUpdateValidation()`, `useDeleteImage()`

### 7. **Backend Updates**

- ✅ JWT authentication added
- ✅ Auth middleware for protected routes
- ✅ Token generation on login

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 15
- Docker (for MinIO)

### Installation

```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies (if JWT not installed)
cd ../backend
npm install
```

### Environment Setup

**Backend:** Create `backend/.env`
```env
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

**Frontend:** Create `frontend/.env`
```env
VITE_API_URL=http://localhost:3000/api
```

### Run Development Servers

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
cd frontend
npm run dev
```

Visit: `http://localhost:5173`

---

## 📚 Documentation

Comprehensive architecture documentation: **[ARCHITECTURE.md](../ARCHITECTURE.md)**

Covers:
- Folder structure explained
- Core principles
- Architecture patterns
- Component usage guide
- Service layer design
- Custom hooks guide
- Design decisions
- Best practices

---

## 🎨 Component Usage Examples

### Button
```jsx
import { Button } from '@/components/ui';

<Button variant="primary" size="md" loading={isSubmitting}>
  Submit
</Button>
```

### Modal
```jsx
import { Modal, Button } from '@/components/ui';

<Modal 
  isOpen={isOpen} 
  onClose={() => setIsOpen(false)}
  title="Edit Patient"
  footer={
    <>
      <Button variant="ghost" onClick={handleCancel}>Cancel</Button>
      <Button variant="primary" onClick={handleSave}>Save</Button>
    </>
  }
>
  <PatientForm />
</Modal>
```

### ImageUploader
```jsx
import ImageUploader from '@/features/images/components/ImageUploader';
import { IMAGE_CATEGORY } from '@/constants';

<ImageUploader
  visitId={visitId}
  category={IMAGE_CATEGORY.RAW}
  onUploadComplete={handleUpload}
  existingImages={existingImages}
/>
```

### Using Hooks
```jsx
import { usePatients, useCreatePatient } from '@/features/patients/hooks/usePatients';
import { usePagination } from '@/hooks/usePagination';

function PatientListPage() {
  const { page, pageSize, setPage } = usePagination(1, 10);
  const { data, isLoading } = usePatients({ page, limit: pageSize });
  const createPatient = useCreatePatient();
  
  const handleCreate = (patientData) => {
    createPatient.mutate(patientData);
  };
  
  // ... render
}
```

---

## 🏗️ Architecture Highlights

### 1. Feature-Based Organization

```
features/
├── patients/     # Everything patient-related
│   ├── components/
│   ├── hooks/
│   └── pages/
├── visits/       # Everything visit-related
└── images/       # Everything image-related
```

**Benefits:**
- Easy to find related code
- Natural separation of concerns
- Scalable to 50+ features
- Easy to delete entire features

### 2. Service Layer Pattern

**Separation:**
```
Components → Hooks → Services → API
```

**Example:**
```jsx
// Service (API calls)
class PatientService {
  async getPatients({ page, limit }) {
    return await apiClient.get('/patients', { params });
  }
}

// Hook (React Query integration)
export const usePatients = ({ page, limit }) => {
  return useQuery({
    queryKey: ['patients', { page, limit }],
    queryFn: () => patientService.getPatients({ page, limit })
  });
};

// Component (UI only)
function PatientList() {
  const { data, isLoading } = usePatients({ page: 1, limit: 10 });
  if (isLoading) return <LoadingSpinner />;
  return <div>{/* render */}</div>;
}
```

### 3. React Query for Server State

**Benefits:**
- ✅ Automatic caching
- ✅ Background refetching
- ✅ Built-in loading/error states
- ✅ Optimistic updates
- ✅ Request deduplication
- ✅ No Redux boilerplate

### 4. Every Screen Handles All States

```jsx
function MyPage() {
  const { data, isLoading, error } = useResource();
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState />;
  if (!data || data.length === 0) return <EmptyState />;
  
  return <SuccessView data={data} />;
}
```

---

## 📝 Code Quality Rules

### Component Rules

✅ **Do:**
- Keep components < 200 lines
- Extract logic to hooks
- Handle all states (loading/error/empty)
- Use prop destructuring

❌ **Don't:**
- Mix API calls with UI
- Create "god components"
- Forget accessibility

### State Management Rules

✅ **Do:**
- React Query for server state
- Local state for UI state
- Context sparingly

❌ **Don't:**
- Store server data in useState
- Over-use useEffect
- Create unnecessary global state

### API Rules

✅ **Do:**
- Use service layer
- Use React Query hooks
- Show toast notifications

❌ **Don't:**
- Call APIs directly in components
- Ignore error handling

---

## 🔐 Authentication

JWT-based authentication is now implemented:

**Login Flow:**
1. User submits credentials
2. Backend validates and returns JWT token
3. Token stored in localStorage
4. Axios interceptor adds token to all requests
5. On 401, redirect to login

**Usage:**
```jsx
import { useAuth } from '@/features/auth/hooks/useAuth';

function LoginPage() {
  const { login, isLoggingIn, loginError } = useAuth();
  
  const handleSubmit = (credentials) => {
    login(credentials); // Auto-redirects on success
  };
}
```

**Protected Routes:**
```jsx
// Backend middleware
const { authenticate } = require('./middleware/auth');

router.get('/patients', authenticate, PatientController.index);
```

---

## 🧪 Testing (TODO)

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e
```

Recommended:
- Vitest for unit tests
- React Testing Library for components
- Playwright for E2E

---

## 📦 Build for Production

```bash
cd frontend
npm run build
```

Output: `frontend/dist/`

---

## 🛠️ Development Workflow

### Adding a New Feature

1. **Create feature folder:**
   ```
   src/features/[feature-name]/
   ├── components/
   ├── hooks/
   └── pages/
   ```

2. **Create service:**
   ```javascript
   // src/services/featureService.js
   class FeatureService {
     async getItems() { /* ... */ }
   }
   export default new FeatureService();
   ```

3. **Create hooks:**
   ```javascript
   // src/features/[feature]/hooks/useFeature.js
   export const useFeature = () => {
     return useQuery({
       queryKey: ['feature'],
       queryFn: () => featureService.getItems()
     });
   };
   ```

4. **Create page:**
   ```jsx
   // src/features/[feature]/pages/FeaturePage.jsx
   function FeaturePage() {
     const { data, isLoading } = useFeature();
     // Handle states...
   }
   ```

---

## 🎓 Learning Resources

**React Query:**
- [Official Docs](https://tanstack.com/query/latest)
- [Why React Query?](https://tkdodo.eu/blog/practical-react-query)

**Feature-Based Architecture:**
- [Bulletproof React](https://github.com/alan2207/bulletproof-react)
- [Feature-Sliced Design](https://feature-sliced.design/)

**Best Practices:**
- [React.dev](https://react.dev)
- [Kent C. Dodds Blog](https://kentcdodds.com/blog)

---

## 🤝 Contributing

When contributing:
1. Follow the feature-based structure
2. Keep components small and focused
3. Write tests for business logic
4. Handle all states (loading/error/empty)
5. Use TypeScript (when migrated)

---

## 📄 License

MIT

---

## 🙋 Support

For questions or issues:
1. Check [ARCHITECTURE.md](../ARCHITECTURE.md)
2. Review example code in `src/features/patients/pages/PatientDetailPage.jsx`
3. Look at component usage in `src/features/images/components/`

---

**Built with ❤️ for dentists and orthodontists**

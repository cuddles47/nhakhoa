# 🚀 Quick Start Guide

## Prerequisites

- Node.js 18+
- PostgreSQL 15
- Docker (for MinIO)

---

## Setup (5 minutes)

### 1. Install Dependencies

```bash
# Frontend
cd frontend
npm install

# Backend (if needed)
cd ../backend
npm install
```

### 2. Configure Environment

**Backend `.env`:**
```bash
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

**Frontend `.env`:**
```bash
VITE_API_URL=http://localhost:3000/api
```

### 3. Start Services

```bash
# Terminal 1: Database & MinIO
docker-compose up -d

# Terminal 2: Backend
cd backend
npm start

# Terminal 3: Frontend
cd frontend
npm run dev
```

### 4. Access App

Open: http://localhost:5173

---

## Project Structure

```
frontend/src/
├── components/ui/          # Reusable UI components
├── features/               # Feature modules
│   ├── auth/
│   ├── patients/
│   ├── visits/
│   └── images/
├── hooks/                  # Shared hooks
├── services/               # API layer
└── utils/                  # Utilities
```

---

## Common Tasks

### Create a New Component

```bash
# 1. Create file
touch src/components/ui/MyComponent.jsx
touch src/components/ui/MyComponent.css

# 2. Implement component
# 3. Export in src/components/ui/index.js
```

### Create a New Feature

```bash
# 1. Create structure
mkdir -p src/features/myfeature/{components,hooks,pages}

# 2. Create service
touch src/services/myfeatureService.js

# 3. Create hooks
touch src/features/myfeature/hooks/useMyFeature.js

# 4. Create page
touch src/features/myfeature/pages/MyFeaturePage.jsx
```

### Use Existing Components

```jsx
import { Button, Modal, LoadingSpinner } from '@/components/ui';

function MyComponent() {
  return (
    <>
      <Button variant="primary">Click me</Button>
      <LoadingSpinner size="md" />
    </>
  );
}
```

### Use Hooks

```jsx
import { usePatients, useCreatePatient } from '@/features/patients/hooks/usePatients';

function PatientList() {
  const { data, isLoading, error } = usePatients({ page: 1, limit: 10 });
  const createPatient = useCreatePatient();
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState />;
  
  return (
    <div>
      {data.patients.map(patient => (
        <div key={patient.id}>{patient.name}</div>
      ))}
    </div>
  );
}
```

---

## Key Files to Review

1. **[PatientDetailPage.jsx](frontend/src/features/patients/pages/PatientDetailPage.jsx)**  
   → Complete page example with all best practices

2. **[ImageUploader.jsx](frontend/src/features/images/components/ImageUploader.jsx)**  
   → Complex component example

3. **[usePatients.js](frontend/src/features/patients/hooks/usePatients.js)**  
   → Hook pattern examples

4. **[ARCHITECTURE.md](ARCHITECTURE.md)**  
   → Full documentation

---

## Component Library

| Component | Import | Usage |
|-----------|--------|-------|
| Button | `import { Button } from '@/components/ui'` | `<Button variant="primary">Text</Button>` |
| Modal | `import { Modal } from '@/components/ui'` | `<Modal isOpen={true} title="Title">...</Modal>` |
| LoadingSpinner | `import { LoadingSpinner } from '@/components/ui'` | `<LoadingSpinner size="lg" />` |
| EmptyState | `import { EmptyState } from '@/components/ui'` | `<EmptyState title="No data" />` |

---

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 5173 (frontend)
lsof -ti:5173 | xargs kill -9

# Kill process on port 3000 (backend)
lsof -ti:3000 | xargs kill -9
```

### Module Not Found

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Database Connection Error

```bash
# Restart Docker containers
docker-compose down
docker-compose up -d
```

---

## Build for Production

```bash
cd frontend
npm run build
# Output: frontend/dist/
```

---

## Need Help?

1. Read [ARCHITECTURE.md](ARCHITECTURE.md)
2. Review [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)
3. Check example code in `src/features/patients/pages/PatientDetailPage.jsx`

---

**Happy coding! 🚀**

# 🦷 Hướng Dẫn Context - Ứng Dụng Quản Lý Nha Khoa

> **Mục đích:** Giúp các chatbot/AI assistant nhanh chóng nắm bắt context của dự án này.

---

## 📋 Tổng Quan Dự Án

### Dự án là gì?
- **Tên:** Ứng dụng web quản lý nha khoa chỉnh nha (Dental Orthodontic Management System)
- **Người dùng:** Bác sĩ nha khoa (người dùng không chuyên về công nghệ)
- **Mục đích:** Quản lý bệnh nhân, lượt khám, và hình ảnh nha khoa (9 vị trí răng)

### Quy Trình Làm Việc
1. **Đăng nhập** → Bác sĩ đăng nhập vào hệ thống
2. **Quản lý bệnh nhân** → Thêm/sửa/xóa thông tin bệnh nhân
3. **Tạo lượt khám** → Mỗi bệnh nhân có nhiều lượt khám
4. **Upload hình ảnh** → Upload ảnh RAW cho 9 vị trí răng (3×3 grid)
5. **Process hình ảnh** → Gọi Python service để:
   - Detect răng và bracket (khí cụ nha khoa)
   - Đánh bounding box tự động
   - Tạo 4 subbox cho 4 phần răng quanh bracket
6. **Đánh annotation** → Bác sĩ xem ảnh processed (có box) và đối chiếu với ảnh stained để đánh nhãn
7. **Ghi nhãn & hoàn thành** → Hoàn tất lượt khám

---

## 🛠️ Tech Stack

### Frontend
- **React 18.2** - UI framework
- **React Router 6.20** - Routing
- **React Query (TanStack Query)** - Server state management ⭐
- **Axios** - HTTP client
- **Vite** - Build tool
- **React Hot Toast** - Notifications
- **Custom CSS** - Không dùng UI library

### Backend
- **Node.js + Express** - API server
- **PostgreSQL** - Database
- **MinIO** - Object storage (S3-compatible)
- **JWT** - Authentication

### Deployment
- **Docker + Docker Compose** - Containerization

---

## 📁 Cấu Trúc Thư Mục Quan Trọng

```
nhakhoa/
├── frontend/src/
│   ├── components/ui/          # 7 component UI tái sử dụng ⭐
│   ├── features/               # Các module chức năng ⭐
│   │   ├── auth/              # Đăng nhập
│   │   ├── patients/          # Quản lý bệnh nhân
│   │   ├── visits/            # Quản lý lượt khám
│   │   └── images/            # Upload & so sánh hình ảnh
│   ├── hooks/                  # Custom hooks dùng chung
│   ├── services/               # API service layer ⭐
│   └── utils/                  # Utility functions
│
├── backend/src/
│   ├── controllers/           # API controllers
│   ├── models/                # Database models
│   ├── middleware/            # Auth, validation
│   ├── routes/                # API routes
│   └── services/              # Business logic
│
└── [Tài liệu]
    ├── ARCHITECTURE.md        # Kiến trúc chi tiết (500+ dòng) ⭐⭐⭐
    ├── IMPLEMENTATION_SUMMARY.md  # Tổng kết deliverables
    ├── DIAGRAMS.md            # Sơ đồ kiến trúc
    ├── QUICK_START.md         # Hướng dẫn cài đặt
    ├── CHECKLIST.md           # Danh sách hoàn thành
    └── GUIDELINE_VI.md        # File này
```

---

## 🎯 Kiến Trúc Tổng Quan

### Nguyên Tắc Phân Tách (Separation of Concerns)

```
Component (UI)  →  Hook (Logic)  →  Service (API)  →  Backend
```

**Ví dụ:**
```jsx
// ❌ SAI: Trộn lẫn API call trong component
function PatientList() {
  const [data, setData] = useState([]);
  useEffect(() => {
    axios.get('/api/patients').then(res => setData(res.data));
  }, []);
  return <div>{/* render */}</div>;
}

// ✅ ĐÚNG: Phân tách rõ ràng
function PatientList() {
  const { data, isLoading } = usePatients(); // Hook
  if (isLoading) return <LoadingSpinner />;
  return <div>{/* render */}</div>;
}

// Hook sử dụng Service
export const usePatients = () => {
  return useQuery({
    queryKey: ['patients'],
    queryFn: () => patientService.getPatients() // Service
  });
};

// Service gọi API
class PatientService {
  async getPatients() {
    return await apiClient.get('/patients');
  }
}
```

### Feature-Based Structure (Quan Trọng!)

Không nhóm theo loại file (components/, hooks/, ...) mà nhóm theo **chức năng**:

```
features/
├── patients/
│   ├── components/   # Component riêng của patients
│   ├── hooks/        # Hooks riêng của patients
│   └── pages/        # Pages riêng của patients
├── visits/
└── images/
```

**Lợi ích:**
- Dễ tìm code liên quan
- Dễ xóa/thêm chức năng
- Scale tốt cho dự án lớn

---

## 📦 Các Component & Hook Quan Trọng

### UI Components (7 cái - Tái sử dụng)
1. **Button** - Nút bấm với loading state
2. **Modal** - Hộp thoại
3. **LoadingSpinner** - Loading indicator
4. **EmptyState** - Trạng thái trống
5. **StatusBadge** - Badge trạng thái
6. **SearchBox** - Tìm kiếm với debounce
7. **Pagination** - Phân trang

### Example Components (3 cái - Tham khảo)
1. **ImageUploader** - Upload 9 hình răng (3×3 grid) ⭐
2. **ImageCompare** - Xem ảnh processed (có bounding box) và đối chiếu với stained để đánh annotation
3. **VisitStepFlow** - Wizard 5 bước (Upload → Validate → Process → Label → Complete)

### Example Page (1 cái - Học best practices)
- **PatientDetailPage** - Trang chi tiết bệnh nhân với đầy đủ CRUD ⭐⭐⭐

### Custom Hooks
- **useAuth** - Đăng nhập/đăng xuất
- **usePatients** - CRUD bệnh nhân (5 hooks)
- **useVisits** - CRUD lượt khám (6 hooks)
- **useImages** - CRUD hình ảnh (4 hooks)
- **usePagination** - Quản lý phân trang
- **useSearch** - Tìm kiếm với debounce

### Services
- **authService** - API login/logout
- **patientService** - API bệnh nhân
- **visitService** - API lượt khám
- **imageService** - API upload hình ảnh

---

## ✅ Quy Tắc & Best Practices

### 1. Component Rules
- ✅ Giữ component < 200 dòng
- ✅ Xử lý đầy đủ: loading, error, empty states
- ✅ Không gọi API trực tiếp trong component
- ✅ Tách logic vào custom hooks
- ❌ Không tạo "god component"

### 2. State Management
- ✅ **Server state** → React Query
- ✅ **UI state** → useState (local)
- ✅ **Global state** → Context (dùng ít)
- ❌ KHÔNG dùng Redux

### 3. Naming Convention
- **Components:** PascalCase (Button.jsx, Modal.jsx)
- **Hooks:** camelCase (useAuth.js, usePatients.js)
- **Services:** camelCase (authService.js)
- **Files:** Tên file = tên class/function

### 4. Xử Lý States
```jsx
// Pattern chuẩn cho mọi page/component
function MyPage() {
  const { data, isLoading, error } = useMyData();
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <EmptyState icon="⚠️" title="Lỗi" />;
  if (!data) return <EmptyState icon="📭" title="Không có dữ liệu" />;
  
  return <div>{/* render data */}</div>;
}
```

---

## 📖 Tài Liệu Tham Khảo

### Đọc Đầu Tiên (Bắt buộc)
1. **[ARCHITECTURE.md](ARCHITECTURE.md)** ⭐⭐⭐
   - 500+ dòng giải thích chi tiết
   - Lý do thiết kế
   - Best practices
   - Component usage

2. **[PatientDetailPage.jsx](frontend/src/features/patients/pages/PatientDetailPage.jsx)** ⭐⭐⭐
   - Ví dụ hoàn chỉnh nhất
   - Có đầy đủ pattern
   - 380 dòng code mẫu

### Tham Khảo Thêm
3. **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Tổng kết deliverables
4. **[DIAGRAMS.md](DIAGRAMS.md)** - Sơ đồ trực quan
5. **[QUICK_START.md](QUICK_START.md)** - Hướng dẫn setup
6. **[frontend/README.md](frontend/README.md)** - Usage guide

---

## 🔥 Các File Quan Trọng Nhất

Khi cần tham khảo code, xem các file này:

### Backend
1. `backend/src/controllers/AuthController.js` - Login logic
2. `backend/src/middleware/auth.js` - JWT authentication
3. `backend/src/models/Patient.js` - Patient model
4. `backend/src/routes/api.js` - API routes

### Frontend - Services
5. `frontend/src/services/apiClient.js` - Axios setup
6. `frontend/src/services/patientService.js` - Patient API

### Frontend - Hooks
7. `frontend/src/features/auth/hooks/useAuth.jsx` - Auth context
8. `frontend/src/features/patients/hooks/usePatients.js` - Patient hooks

### Frontend - Components
9. `frontend/src/components/ui/Button.jsx` - Button component
10. `frontend/src/features/images/components/ImageUploader.jsx` - Upload component ⭐

### Frontend - Pages
11. `frontend/src/features/patients/pages/PatientDetailPage.jsx` - Complete page example ⭐⭐⭐

---

## 💬 Khi Người Dùng Yêu Cầu

### "Tạo component mới"
- Xem: UI components trong `components/ui/`
- Pattern: Function component + props + CSS file riêng
- Xử lý: loading, error, empty states

### "Tạo page mới"
- Tham khảo: `PatientDetailPage.jsx`
- Sử dụng: custom hooks + React Query
- Cấu trúc: loading → error → empty → success

### "Tạo API endpoint mới"
1. Controller: `backend/src/controllers/`
2. Route: `backend/src/routes/api.js`
3. Service: `frontend/src/services/`
4. Hook: `frontend/src/features/[feature]/hooks/`

### "Fix bug"
- Kiểm tra: console errors, network tab
- Xem: error handling trong service layer
- Debug: React Query DevTools

### "Thêm chức năng mới"
1. Tạo folder trong `features/[new-feature]/`
2. Tạo: components/, hooks/, pages/
3. Tham khảo: patients/ hoặc visits/ structure

---

## 🎓 Design Decisions (Lý do thiết kế)

### Tại sao React Query thay vì Redux?
- ✅ Server state ≠ Client state
- ✅ Auto caching, refetching
- ✅ Ít boilerplate hơn
- ✅ Loading/error states tự động

### Tại sao Feature-Based thay vì Technical Grouping?
- ✅ Scale tốt (50+ features)
- ✅ Dễ navigate
- ✅ Ownership rõ ràng
- ✅ Dễ xóa features

### Tại sao Custom CSS thay vì UI Library?
- ✅ Control hoàn toàn
- ✅ Bundle size nhỏ
- ✅ Không phụ thuộc 3rd party

### Tại sao JWT thay vì Session?
- ✅ Stateless
- ✅ Scalable
- ✅ Works với mobile app

---

## 📊 Thống Kê Code

| Loại | Số Files | Số Dòng | Trạng Thái |
|------|----------|---------|------------|
| UI Components | 14 | ~800 | ✅ Hoàn thành |
| Feature Components | 6 | ~900 | ✅ Hoàn thành |
| Services | 5 | ~300 | ✅ Hoàn thành |
| Hooks | 8 | ~500 | ✅ Hoàn thành |
| Pages | 1 | ~380 | ✅ Hoàn thành |
| Documentation | 6 | ~2500 | ✅ Hoàn thành |
| **TỔNG** | **40+** | **~5380** | **✅ Production-ready** |

---

## 🚀 Quick Start

```bash
# 1. Clone repo
git clone [repo-url]

# 2. Setup backend
cd backend
npm install
cp .env.example .env
npm run dev

# 3. Setup frontend
cd frontend
npm install
npm run dev

# 4. Truy cập
http://localhost:5173
```

---

## 🖼️ Workflow Xử Lý Hình Ảnh Chi Tiết

### Bước 1: Upload Ảnh RAW
- Bác sĩ upload ảnh RAW cho 9 vị trí răng (3×3 grid)
- Mỗi vị trí: Trên trái, Trên giữa, Trên phải, Giữa trái, ...
- File validation: type (jpg/png), size

### Bước 2: Process Ảnh (Python Service)
- Bác sĩ bấm nút "Process"
- Backend gọi Python service (AI/ML) để:
  - **Detect răng:** Tìm vị trí răng trong ảnh
  - **Detect bracket:** Tìm khí cụ nha khoa (mắc cài)
  - **Draw bounding box:** Vẽ khung xung quanh răng và bracket
  - **Tạo 4 subbox:** Chia thành 4 phần răng quanh bracket:
    - Subbox 1: Phần trên của bracket
    - Subbox 2: Phần phải của bracket
    - Subbox 3: Phần dưới của bracket
    - Subbox 4: Phần trái của bracket
- Trả về: Ảnh processed có bounding box và 4 subbox

### Bước 3: Upload Ảnh Stained (Nhuộm Răng)
- Bác sĩ upload ảnh đã nhuộm răng (để hiện mảng bám)
- Cùng 9 vị trí như ảnh RAW

### Bước 4: Annotation (Đánh Nhãn)
- Bác sĩ xem song song:
  - **Ảnh processed:** Có bounding box và 4 subbox
  - **Ảnh stained:** Hiển thị mảng bám (plaque)
- Đối chiếu giữa 2 ảnh để:
  - Đánh nhãn mức độ mảng bám cho từng subbox
  - Ghi chú thêm thông tin nếu cần
- Component: `ImageCompare` giúp xem 2 ảnh song song

### Bước 5: Hoàn Thành
- Lưu tất cả annotation vào database
- Cập nhật trạng thái lượt khám: "completed"

### Dữ Liệu Lưu Trong Database
```javascript
// Image record
{
  visit_id: 123,
  position: 1, // 1-9
  category: 'RAW' | 'STAINED' | 'PROCESSED',
  file_url: 's3://...',
  bounding_box: { x, y, width, height }, // Nếu là PROCESSED
  subboxes: [ // Nếu là PROCESSED
    { id: 1, x, y, width, height, annotation: '...' },
    { id: 2, x, y, width, height, annotation: '...' },
    { id: 3, x, y, width, height, annotation: '...' },
    { id: 4, x, y, width, height, annotation: '...' }
  ]
}
```

---

## ⚠️ Lưu Ý Quan Trọng

### Khi Code
1. **LUÔN** tham khảo `PatientDetailPage.jsx` trước khi code page mới
2. **LUÔN** xử lý loading/error/empty states
3. **KHÔNG** gọi API trực tiếp trong component
4. **KHÔNG** tạo component > 200 dòng
5. **KHÔNG** dùng Redux

### Khi Debug
1. Check React Query DevTools
2. Check Network tab
3. Check console errors
4. Check service layer error handling

### Khi Review Code
1. Component có < 200 dòng?
2. Có xử lý loading/error/empty?
3. Logic đã tách vào hooks?
4. API calls ở service layer?
5. Có reuse components từ `ui/`?

---

## 🎯 Context Nhanh Cho Chatbot

> Nếu bạn là chatbot mới vào dự án, đây là những điều cần nhớ:

1. **Dự án:** Web app quản lý nha khoa cho bác sĩ
2. **Tech:** React + React Query (KHÔNG Redux) + Node.js + PostgreSQL + Python service (xử lý ảnh)
3. **Kiến trúc:** Feature-based, phân tách rõ UI → Hook → Service → API
4. **Component:** 7 UI components + 3 example components
5. **Tham khảo:** `PatientDetailPage.jsx` là ví dụ hoàn chỉnh nhất
6. **Tài liệu:** `ARCHITECTURE.md` có tất cả mọi thứ (500+ dòng)
7. **Quy tắc:** Component < 200 dòng, xử lý đủ states, không gọi API trực tiếp
8. **Workflow xử lý ảnh:** Upload RAW → Process (Python service detect răng/bracket/4 subbox) → Annotation (đối chiếu với stained)
9. **Files quan trọng:**
   - Backend: `AuthController.js`, `middleware/auth.js`
   - Frontend Services: `apiClient.js`, `patientService.js`
   - Frontend Hooks: `useAuth.jsx`, `usePatients.js`
   - Frontend Components: `PatientDetailPage.jsx` ⭐

---

## 📞 Câu Hỏi Thường Gặp

**Q: Tạo component mới ở đâu?**
- UI component chung → `components/ui/`
- Component riêng feature → `features/[feature]/components/`

**Q: Tạo API endpoint mới ở đâu?**
- Controller → `backend/src/controllers/`
- Route → `backend/src/routes/api.js`

**Q: Fetch data như thế nào?**
- Tạo service trong `services/`
- Tạo hook với React Query trong `features/[feature]/hooks/`
- Component dùng hook

**Q: Có dùng TypeScript không?**
- Hiện tại: JavaScript
- Tương lai: Có thể migrate

**Q: Có dùng UI library không?**
- KHÔNG. Dùng custom CSS.

**Q: Tại sao không có Redux?**
- React Query đã đủ cho server state
- Ít boilerplate, dễ maintain

---

## ✨ Điểm Đặc Biệt Của Dự Án

1. **Production-ready** - Không phải demo, sẵn sàng deploy
2. **Well-documented** - 2500+ dòng documentation
3. **Best practices** - Theo chuẩn industry
4. **Reusable** - 7 components + 8 hooks sẵn dùng
5. **Complete example** - PatientDetailPage.jsx có đầy đủ patterns
6. **Doctor-friendly** - UX đơn giản cho người không tech
7. **Scalable** - Grow từ 5 đến 500 features

---

**Made with ❤️ for AI assistants and future developers**

**Phiên bản:** 1.0  
**Cập nhật lần cuối:** Tháng 12, 2024

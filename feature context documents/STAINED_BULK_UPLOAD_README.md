# Stained Image Bulk Upload Feature

## Tổng quan

Tính năng upload hàng loạt ảnh nhuộm răng cho phép người dùng upload **nhiều bệnh nhân cùng lúc** - giống như bulk upload RAW images. Hệ thống tự động parse filename để map ảnh vào đúng bệnh nhân và lần khám.

**✨ Tính năng mới: Upload linh hoạt**
- ✅ Có thể upload ảnh nhuộm **TRƯỚC** hoặc **SAU** khi upload ảnh RAW
- ✅ Nếu chưa có lần khám, hệ thống tự động tạo visit mới
- ✅ Nếu visit chưa có ảnh RAW → hiển thị warning nhưng vẫn cho upload

## Workflow

```
1. Drag & Drop folder ảnh nhuộm (có thể chứa ảnh của nhiều bệnh nhân)
   ↓
2. System parse filenames → group theo Patient ID + Date
   ↓
3. Auto-validate: 
   - Tìm patient (bắt buộc phải tồn tại)
   - Tìm visit theo date → nếu không có sẽ tạo mới
   - Check RAW images → nếu chưa có sẽ warning
   ↓
4. Preview các nhóm với status:
   - ✅ Green = Valid (có thể upload)
   - 🆕 Blue = Visit mới (sẽ tạo tự động)
   - ⚠️ Yellow = Warning (chưa có RAW)
   - ❌ Red = Error (không tìm thấy patient)
   ↓
5. Upload tất cả nhóm hợp lệ (sequential)
   ↓
6. Hiển thị kết quả + warnings chi tiết
```

**Khác với implementation cũ:**
- ❌ KHÔNG cần chọn từng patient → visit
- ❌ KHÔNG bắt buộc phải có RAW images trước
- ✅ Upload cả folder nhiều bệnh nhân cùng lúc
- ✅ Auto-matching theo filename
- ✅ Auto-create visit nếu chưa tồn tại
- ✅ Giống workflow của RAW bulk upload (không cần annotation file)

## Yêu cầu Filename

Ảnh nhuộm phải tuân theo định dạng filename:

```
Pattern: Patient_XXXX_DD-MM-YYYY_Position.ext

Ví dụ:
- Patient_0061_28-10-2025_Top-right.jpg
- Patient_0062_25-11-2025_Central-middle.jpg
- Patient_0063_15-12-2025_Bottom_left.png
```

### Position Names (9 vị trí)

Hỗ trợ nhiều biến thể tên vị trí:

| Vị trí chuẩn | Các tên chấp nhận |
|--------------|-------------------|
| upper_right | top-right, Top_Right, upper-right, trenphai |
| upper_center | top-center, upper-middle, top_middle, trengiua |
| upper_left | top-left, upper-left, trentrai |
| middle_right | central-right, center_right, giuaphai |
| middle_center | center, central-middle, giua |
| middle_left | central-left, center_left, giuatrai |
| lower_right | bottom-right, duoiphai |
| lower_center | bottom-center, lower-middle, duoigiua |
| lower_left | bottom-left, duoitrai |

## Backend API

### 1. Upload Stained Images

```http
POST /api/bulk-upload/stained
Content-Type: multipart/form-data

Body (Option 1 - Existing visit):
  - visitId: number
  - images: File[] (max 9 files)

Body (Option 2 - Auto-create visit):
  - patientId: number
  - visitDate: string (format: YYYY-MM-DD)
  - images: File[] (max 9 files)

Response:
{
  "success": true,
  "message": "Upload thành công 6 ảnh mới, thay thế 3 ảnh cũ",
  "data": {
    "visitId": 123,
    "imagesCreated": 6,
    "imagesReplaced": 3,
    "totalProcessed": 9,
    "images": [...],
    "validation": {
      "warnings": [
        "Visit này chưa có ảnh RAW. Bạn có thể upload ảnh RAW sau.",
        "Thiếu 2 vị trí: Trên trái, Dưới phải"
      ],
      "positionAnalysis": {
        "complete": false,
        "missing": ["upper_left", "lower_right"],
        "uploadedCount": 7,
        "missingCount": 2
      }
    }
  }
}
```

### 2. Get Upload Status

```http
GET /api/visits/:visitId/stained-upload-status

Response:
{
  "success": true,
  "data": {
    "visitId": 123,
    "hasRawImages": true,
    "rawImageCount": 9,
    "stainedImageCount": 7,
    "coverage": [
      { "index": 1, "type": "upper_right", "label": "Trên phải", "hasImage": true },
      { "index": 2, "type": "upper_center", "label": "Trên giữa", "hasImage": true },
      ...
    ],
    "complete": false
  }
}
```

### 3. Get Available Visits

```http
GET /api/patients/:patientId/available-visits

Response:
{
  "success": true,
  "data": [
    {
      "id": 123,
      "visit_date": "2025-10-28",
      "rawImageCount": 9,
      "stainedImageCount": 7,
      "hasRawImages": true,
      "hasStainedImages": true,
      "stainedComplete": false
    }
  ]
}
```

## Frontend Component

### StainedBulkUpload.jsx

Component với single-step workflow (giống BulkUpload cho RAW):

**Main Features:**
- **Drag & drop zone** - Upload cả folder ảnh
- **Auto filename parsing** - Extract Patient ID, Date, Position
- **Auto grouping** - Group theo `Patient_ID + Date`
- **Auto validation** - Tự tìm patient, visit, check RAW images
- **Preview cards** - Hiện từng nhóm với status (valid/error)
- **Batch upload** - Upload từng nhóm sequential với progress bar
- **Result summary** - Hiện kết quả chi tiết từng nhóm

**UI Flow:**

1. **Empty State** - Drag-drop zone với hướng dẫn format filename
2. **After File Selection:**
   - Parse filenames
   - Group by patient + date
   - Validate each group (API calls)
   - Display cards:
     - ✅ Green card: Valid group (patient found, visit found, has RAW)
     - ❌ Red card: Invalid (với error message cụ thể)
3. **Upload Button** - "Upload N nhóm hợp lệ"
4. **Progress Bar** - Hiện % khi đang upload
5. **Result Screen** - Summary + detail từng nhóm

## Validation Rules

### Backend Validation (stainedImageValidator.js)

1. **Visit phải có RAW images**
   - Reject nếu visit chưa có ảnh RAW
   - Message: "Visit này chưa có ảnh RAW. Vui lòng upload ảnh RAW trước."

2. **Filename parsing**
   - Parse theo pattern: `Patient_XXXX_DD-MM-YYYY_Position.ext`
   - Normalize position names (case-insensitive, remove separators)
   - Reject file nếu không parse được

3. **Position detection**
   - Detect missing positions (so với 9 vị trí chuẩn)
   - Warning (không block) nếu thiếu vị trí

4. **Duplicate handling**
   - Trong batch upload: keep last image cho mỗi vị trí
   - Với existing images: replace (UPDATE record)

### Frontend Validation

1. **File type**: JPG, JPEG, PNG only
2. **Filename format**: Real-time validation khi chọn file
3. **Visual feedback**:
   - Green badge: Valid files
   - Red badge: Error files
   - Yellow badge: Missing positions
   - Detail panels cho từng loại

## Upload Behavior

### Replace Existing Images

Nếu visit đã có ảnh nhuộm ở vị trí đó:
- UPDATE image record với URL mới
- Keep image_id (không tạo mới)
- Update `original_filename` và `updated_at`
- TODO: Delete old file from MinIO

### Create New Images

Nếu vị trí chưa có ảnh nhuộm:
- INSERT new image record
- Set `image_category = 'stained'`
- Set `validation_status = 'pending'`
- Set `has_annotations = false` (stained images không có annotations)

## Progress Tracking

Upload sử dụng axios `onUploadProgress`:

```javascript
await apiClient.post('/api/bulk-upload/stained', formData, {
  onUploadProgress: (progressEvent) => {
    const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
    setUploadProgress(progress);
  }
});
```

## Toast Notifications

- ✅ Success: "Upload thành công X ảnh mới, thay thế Y ảnh cũ"
- ⚠️ Warning: "Thiếu N vị trí: [danh sách vị trí]"
- ⚠️ Warning: "Vị trí trùng lặp: [vị trí] (M ảnh)"
- ⚠️ Warning: "Visit đã có N ảnh nhuộm. Các ảnh trùng vị trí sẽ được thay thế."
- ❌ Error: "M file không hợp lệ"
- ❌ Error: "Visit này chưa có ảnh RAW"

## Use Cases

### 1. Upload ảnh nhuộm sau khi đã có ảnh RAW (workflow thông thường)

```
Bước 1: Upload folder RAW images → tạo patients & visits
Bước 2: Upload folder stained images → map vào visits đã có
Result: ✅ Không có warning, upload thành công
```

### 2. Upload ảnh nhuộm TRƯỚC khi có ảnh RAW (new feature)

```
Bước 1: Tạo patients (manual hoặc qua API)
Bước 2: Upload folder stained images → auto-create visits
Result: ⚠️ Warning "Visit này chưa có ảnh RAW", nhưng vẫn upload thành công
Bước 3: Upload folder RAW images sau → map vào visits đã có
```

### 3. Upload ảnh nhuộm cho lần khám mới (chưa tồn tại)

```
Scenario: Patient đã tồn tại, nhưng visit ngày 25-11-2025 chưa có
Action: Upload file Patient_0061_25-11-2025_Top-right.jpg
Result: 
  - Frontend validation: "🆕 Sẽ tạo lần khám mới ngày 25/11/2025"
  - Backend: Auto-create visit with status='pending'
  - Upload thành công, warning "chưa có ảnh RAW"
```

## Validation Rules

| Điều kiện | Kết quả | Status | Thông báo |
|-----------|---------|--------|-----------|
| Không tìm thấy patient | ❌ Reject | Error | "Không tìm thấy bệnh nhân #XXXX" |
| Patient tồn tại, visit chưa có | ✅ Valid | Success + Info | "🆕 Sẽ tạo lần khám mới ngày DD/MM/YYYY" |
| Visit tồn tại, chưa có RAW | ✅ Valid | Success + Warning | "⚠️ Lần khám chưa có ảnh RAW" |
| Visit tồn tại, đã có RAW | ✅ Valid | Success | - |
| Filename parse lỗi | ❌ Reject | Error | "Không thể parse filename" |
| Thiếu vị trí (< 9 ảnh) | ✅ Valid | Success + Warning | "Thiếu X vị trí: ..." |
| Trùng vị trí trong batch | ✅ Valid | Success + Warning | "Vị trí X có 2 ảnh, sẽ lấy ảnh cuối" |

## Navigation

Sau khi upload thành công:
```javascript
setTimeout(() => {
  navigate(`/visits/${selectedVisit.id}/images`);
}, 2000);
```

Redirect đến ImageUpload page để xem kết quả.

## Testing

### Manual Testing Steps

1. **Test valid upload**
   - Upload stained images to visit with RAW images
   - Verify: Upload success, no warnings

2. **Test upload without RAW (new)**
   - Upload stained images before RAW
   - Verify: Warning "⚠️ Lần khám chưa có ảnh RAW"
   - Check: Images uploaded successfully

3. **Test auto-create visit (new)**
   - Upload stained for date that doesn't have visit yet
   - Verify: Badge "🆕 Lần khám mới (tạo tự động)"
   - Check DB: Visit created with status='pending'

4. **Test partial upload**
   - Upload only 5 stained images
   - Verify: Warning "Thiếu 4 vị trí: [list]"
   - Check database: 5 records created

5. **Test replace existing**
   - Upload stained images to visit already has stained
   - Verify: Message "thay thế X ảnh cũ"
   - Check database: image records updated, not duplicated

4. **Test invalid filenames**
   - Upload files with wrong naming pattern
   - Verify: Red badge "X file lỗi"
   - Detail panel shows error messages

5. **Test duplicate positions**
   - Upload 2 files with same position name
   - Verify: Warning "Vị trí trùng lặp: [position] (2 ảnh)"
   - Only last file uploaded

6. **Test visit without RAW**
   - Try to select visit with no RAW images
   - Verify: Toast error "Bệnh nhân này chưa có lần khám nào có ảnh RAW"

### Backend Testing

Run validator tests:
```bash
node backend/src/services/test_stainedValidator.js
```

## File Structure

```
backend/
├── src/
│   ├── controllers/
│   │   └── BulkUploadController.js  (+ 3 new methods)
│   ├── services/
│   │   ├── stainedImageValidator.js  (NEW)
│   │   └── test_stainedValidator.js  (NEW)
│   └── routes/
│       └── api.js  (+ 3 new routes)

frontend/
├── src/
│   ├── components/
│   │   ├── StainedBulkUpload.jsx  (NEW - 650+ lines)
│   │   └── Sidebar.jsx  (+ menu item)
│   └── App.jsx  (+ route)
```

## Future Enhancements

1. **Chunked upload**
   - Current: Single multipart request
   - Future: Stream upload for better progress tracking
   - Use presigned URLs for direct MinIO upload

2. **Delete old MinIO files**
   - Current: TODO comment in replace logic
   - Future: Implement cleanup when replacing images

3. **Batch validation endpoint**
   - Pre-validate files before upload
   - Return detailed errors for each file

4. **Auto-detect patient from filenames**
   - Skip patient selection step if all files match one patient
   - Direct to visit selection

5. **Image comparison view**
   - Side-by-side RAW vs Stained
   - Before/after slider

## Notes

- Stained images **không có annotations** (notes)
- File upload limit: 10MB per file
- Max files per upload: 9 (one per position)
- Position names are case-insensitive
- Validation is flexible (thiếu vị trí chỉ warning, không block)
- Upload progress shown as percentage
- Auto-redirect after successful upload

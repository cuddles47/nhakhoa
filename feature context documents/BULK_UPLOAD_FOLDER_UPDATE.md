# Bulk Upload RAW Images - Folder Input Update

## Thay đổi

### Trước đây
- User phải chọn **nhiều files riêng lẻ** (x ảnh)
- User phải **upload file annotation JSON riêng**
- Không có báo cáo thiếu ảnh chi tiết

### Bây giờ
- User chỉ cần chọn **1 FOLDER** chứa:
  - Tất cả ảnh RAW (JPG/PNG)
  - File annotation JSON (_annotations.coco.json)
- Hệ thống **tự động phát hiện** file annotation trong folder
- **Báo cáo chi tiết** patient nào thiếu ảnh, thiếu bao nhiêu, thiếu góc nào

## Cách sử dụng

### 1. Chuẩn bị folder

```
my_dental_images/
├── Patient_0001_15-01-2026_upper_right.jpg
├── Patient_0001_15-01-2026_upper_center.jpg
├── Patient_0001_15-01-2026_upper_left.jpg
├── Patient_0001_15-01-2026_middle_right.jpg
├── Patient_0001_15-01-2026_middle_center.jpg
├── Patient_0001_15-01-2026_middle_left.jpg
├── Patient_0001_15-01-2026_lower_right.jpg
├── Patient_0001_15-01-2026_lower_center.jpg
├── Patient_0001_15-01-2026_lower_left.jpg
├── Patient_0002_16-01-2026_upper_right.jpg
├── ... (more images)
└── _annotations.coco.json          <-- Annotation file
```

### 2. Upload folder

1. Vào trang **Bulk Upload**
2. Click vào drop zone hoặc kéo thả **FOLDER** vào
3. Hệ thống sẽ:
   - Parse tất cả ảnh theo filename pattern
   - Tự động tìm file annotation `.json`
   - Group theo Patient ID + Date
   - Phân tích missing images

### 3. Xem báo cáo missing images

Sau khi upload folder, hệ thống sẽ hiển thị:

#### Toast notification chi tiết:
```
⚠️ Phát hiện 2 bệnh nhân thiếu ảnh:

• Patient #0001 (15/01/2026):
  - Có: 7/9 ảnh
  - Thiếu 2: Trên trái, Dưới phải

• Patient #0003 (17/01/2026):
  - Có: 6/9 ảnh
  - Thiếu 3: Trên giữa, Giữa phải, Dưới trái
```

#### Visual warning trong preview cards:
- Mỗi patient card hiển thị `⚠️ Thiếu X/9 ảnh` nếu không đủ
- Badge màu vàng cảnh báo

### 4. Gán bệnh nhân và upload

- Gán từng group vào bệnh nhân (existing hoặc tạo mới)
- Click **Upload** để hoàn tất

## Validation Rules

### Expected: 9 positions per patient

| Position | Vietnamese Label | Example Filename Variations |
|----------|------------------|----------------------------|
| upper_right | Trên phải | upper_right, top_right, Top-right |
| upper_center | Trên giữa | upper_center, top_center, Top-center |
| upper_left | Trên trái | upper_left, top_left, Top-left |
| middle_right | Giữa phải | middle_right, central_right, Center-right |
| middle_center | Giữa | middle_center, center, Central-middle |
| middle_left | Giữa trái | middle_left, central_left, Center-left |
| lower_right | Dưới phải | lower_right, bottom_right, Bottom-right |
| lower_center | Dưới giữa | lower_center, bottom_center, Bottom-center |
| lower_left | Dưới trái | lower_left, bottom_left, Bottom-left |

### Missing Images Analysis

System compares:
- **Expected**: 9 positions × N patients
- **Actual**: Uploaded images grouped by patient
- **Missing**: Positions not found in upload

Report includes:
- Patient ID
- Visit date
- Total uploaded (X/9)
- Missing count
- Missing position names (Vietnamese labels)

## Annotation File Detection

System searches for files with:
- `.json` extension
- Filename containing "annotation" or "_annotations.coco"
- COCO format structure: `{ images: [], annotations: [], categories: [] }`

**Auto-detected examples:**
- `_annotations.coco.json` ✓
- `annotations.json` ✓
- `dental_annotations.json` ✓
- `data.json` (if COCO format) ✓

## Technical Implementation

### Frontend Changes

**File: `/projects/nhakhoa/frontend/src/components/BulkUpload.jsx`**

1. **Folder Input**
```jsx
<input
  type="file"
  webkitdirectory="true"
  directory="true"
  multiple
  onChange={handleFileSelect}
/>
```

2. **Auto-detect Annotation**
```javascript
const handleFiles = async (fileList) => {
  const allFiles = Array.from(fileList)
  let foundAnnotationFile = null
  
  for (const file of allFiles) {
    if (file.name.endsWith('.json') || file.name.includes('annotation')) {
      foundAnnotationFile = file
      break
    }
  }
  
  if (foundAnnotationFile) {
    await processAnnotationFile(foundAnnotationFile, groupedData)
  }
}
```

3. **Missing Images Analysis**
```javascript
const analyzeMissingImages = (cocoData, groupedData) => {
  const expectedPositions = [
    'upper_right', 'upper_center', 'upper_left',
    'middle_right', 'middle_center', 'middle_left',
    'lower_right', 'lower_center', 'lower_left'
  ]
  
  groupedData.forEach(group => {
    const uploadedPositions = group.images.map(img => img.position)
    const missingPositions = expectedPositions.filter(
      pos => !uploadedPositions.includes(pos)
    )
    
    if (missingPositions.length > 0) {
      // Report missing...
    }
  })
}
```

### UI Updates

1. **Drop zone text**: "Kéo thả FOLDER vào đây"
2. **Annotation status card**: 
   - Green if detected ✓
   - Orange if missing ⚠️
3. **Preview cards**: Show "⚠️ Thiếu X/9 ảnh" badge
4. **Toast notifications**: Detailed missing report (10s duration)

## Browser Support

### webkitdirectory attribute

| Browser | Support |
|---------|---------|
| Chrome | ✓ Full |
| Edge | ✓ Full |
| Firefox | ✓ Full |
| Safari | ✓ Full |
| Opera | ✓ Full |

**Note**: `webkitdirectory` is widely supported despite the "webkit" prefix. It's the standard way to enable folder selection in HTML5.

## Testing Checklist

### ✅ Basic Upload
- [ ] Select folder with images + annotation
- [ ] System auto-detects annotation file
- [ ] Images grouped correctly by patient+date
- [ ] Preview shows correct count

### ✅ Missing Images
- [ ] Upload folder with 7/9 images for one patient
- [ ] Toast shows detailed missing report
- [ ] Preview card shows "⚠️ Thiếu 2/9 ảnh"
- [ ] Missing positions labeled correctly in Vietnamese

### ✅ Multiple Patients
- [ ] Upload folder with 3 patients
- [ ] Patient 1: 9/9 images ✓
- [ ] Patient 2: 7/9 images ⚠️
- [ ] Patient 3: 6/9 images ⚠️
- [ ] Report shows only patients 2 & 3 with missing details

### ✅ No Annotation
- [ ] Upload folder without .json file
- [ ] System shows warning: "⚠️ Không tìm thấy file annotation"
- [ ] Annotation status card stays orange

### ✅ Complete Upload
- [ ] All patients have 9/9 images
- [ ] Toast: "✓ Tất cả bệnh nhân đều có đủ 9 ảnh!"
- [ ] No warning badges on preview cards

## Migration Notes

**Backward Compatibility**: ❌ Breaking change
- Old workflow (select multiple files + separate annotation) NO LONGER SUPPORTED
- Users must now upload entire folder

**Why this change?**
1. **Better UX**: Single action (select folder) vs multiple steps
2. **Automatic validation**: Immediate feedback on missing images
3. **Scalability**: Easier to handle 100+ patient folders
4. **Error prevention**: No chance of forgetting annotation file

## Future Enhancements

### Potential improvements:
1. **Drag folder directly** - Currently need to use file picker
2. **Zip file upload** - Alternative to folder (better for large datasets)
3. **Missing images auto-fill** - Suggest placeholder or previous visit images
4. **Position map visualization** - 3x3 grid showing which positions are missing
5. **Batch validation API** - Pre-validate folder before full upload

## Related Files

- Frontend: `/projects/nhakhoa/frontend/src/components/BulkUpload.jsx`
- Backend: `/projects/nhakhoa/backend/src/controllers/BulkUploadController.js`
- Stained Upload: `/projects/nhakhoa/STAINED_BULK_UPLOAD_README.md`

---

**Last Updated**: January 11, 2026
**Version**: 2.0 - Folder Input with Missing Images Analysis

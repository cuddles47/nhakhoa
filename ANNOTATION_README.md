# Annotation Feature - Quick Start

## What's New
Interactive plaque annotation on processed dental images with click-to-toggle functionality.

## How to Use

### 1. Process Images
- Upload 9 raw images to a visit
- Click **"Xử lý ảnh"** button
- Wait for processing to complete

### 2. Open Lightbox
- Click any processed image in the grid
- Split-screen view opens:
  - **Left**: Processed image with bounding boxes
  - **Right**: Stained image for comparison

### 3. Annotate Subboxes
- **Hover** over a subbox (corner) to see details
- **Click** to toggle plaque status:
  - 1st click: ⚪ → 🔴 (mark as has plaque)
  - 2nd click: 🔴 → 🟢 (mark as no plaque)
  - 3rd click: 🟢 → 🔴 (back to has plaque)
- Changes save automatically

### 4. Navigate
- Click **< >** buttons to switch images
- Or press **← →** arrow keys
- Press **ESC** to close lightbox

### 5. Track Progress
- **Stats box** (top-left) shows:
  - Total subboxes
  - How many annotated
  - Plaque detected count
  - Completion percentage

## Color Coding
- ⚪ **Gray**: Not yet annotated
- 🔴 **Red**: Has plaque (plaque_status = 1)
- 🟢 **Green**: No plaque (plaque_status = 0)

## API Endpoints (for developers)

```bash
# Get annotations for an image
GET /api/images/:imageId/annotations

# Update single subbox
PUT /api/annotations/:annotationId/plaque
Body: { "plaque_status": 1, "user_id": 1 }

# Batch update multiple subboxes
POST /api/images/:imageId/annotations/batch
Body: { "annotations": [{...}], "user_id": 1 }

# Get visit statistics
GET /api/visits/:visitId/annotations/stats
```

## Files Modified

### New Files
- `backend/src/controllers/AnnotationController.js` - API logic
- `frontend/src/services/annotationService.js` - HTTP client
- `frontend/src/components/AnnotationCanvas.jsx` - Canvas rendering
- `ANNOTATION_GUIDE.md` - Full documentation
- `ANNOTATION_IMPLEMENTATION.md` - Implementation details

### Updated Files
- `backend/src/routes/api.js` - Added 4 routes
- `frontend/src/features/images/components/ProcessedImageViewer.jsx` - Integration

### Database
- `init-db/98-add-plaque-annotations.sql` - Already applied ✅

## Testing

```bash
# Start all services
cd backend && npm start &
cd frontend && npm run dev &
cd image-processing-service && python app.py &

# Then test in browser:
1. Login as doctor
2. Create patient → Create visit
3. Upload 9 raw images
4. Click "Xử lý ảnh"
5. After processing, click an image
6. Try clicking subboxes
7. Check stats update
8. Navigate between images
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Boxes not showing | Check annotations loaded in DevTools console |
| Click not working | Ensure you're logged in |
| Stats not updating | Check network tab for API errors |
| Navigation broken | Verify imageId is set in lightboxImage state |

## Documentation
- 📖 Full guide: `ANNOTATION_GUIDE.md`
- 🛠️ Implementation: `ANNOTATION_IMPLEMENTATION.md`
- 🏗️ Architecture: `ARCHITECTURE.md`

## Next Steps
1. Test the complete workflow
2. Consider AI-assisted annotation (future)
3. Add export/reporting features (future)
4. Mobile optimization (future)

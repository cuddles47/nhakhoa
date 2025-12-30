# Annotation Feature Guide

## Overview
The annotation feature allows doctors to mark plaque status on dental images by clicking on subboxes (4 corners per tooth).

## Features

### 1. Interactive Canvas Overlay
- **Visual Display**: Bounding boxes show teeth with 4 subboxes (corners) each
- **Color Coding**:
  - 🟢 Green: No plaque (plaque_status = 0)
  - 🔴 Red: Has plaque (plaque_status = 1)
  - ⚪ Gray: Not yet annotated (plaque_status = null)

### 2. Click to Annotate
- **Click on any subbox** to toggle its plaque status
- **Toggle sequence**: null → 1 (red) → 0 (green) → 1 (red) → ...
- **Auto-save**: Changes are saved immediately to the database
- **Audit trail**: Every change is recorded in `annotation_history` table

### 3. Hover Tooltip
- Shows current plaque status
- Displays who annotated it (annotated_by.name)
- Indicates "Click to toggle"

### 4. Progress Tracking
- **Annotation Stats Box** (top-left of lightbox):
  - Total subboxes: Number of subboxes in the image
  - Annotated: How many have been marked
  - Has plaque: Count of subboxes with plaque
  - Completion percentage: Progress indicator

### 5. Image Navigation
- **Left/Right arrows** on screen edges
- **Keyboard shortcuts**: ← (previous), → (next)
- **Wrap-around**: Navigate circularly through 9 images
- **Auto-load**: Annotations reload when switching images

## Workflow

### Step 1: Process Images
1. Upload 9 raw images to a visit
2. Click "Xử lý ảnh" button
3. Wait for Python service to generate bounding boxes and subboxes
4. View mode switches to "Processed"

### Step 2: View in Lightbox
1. Click any processed image in the 3×3 grid
2. Lightbox opens with **split-screen**:
   - Left: Processed image with annotation overlay
   - Right: Corresponding stained image for comparison

### Step 3: Annotate Subboxes
1. Hover over a subbox to see tooltip
2. Click to mark as "has plaque" (red)
3. Click again to mark as "no plaque" (green)
4. Click again to cycle back to "has plaque"
5. Stats box updates in real-time

### Step 4: Navigate Between Images
1. Use arrow buttons (< >) to move between images
2. Or press keyboard arrow keys
3. Annotations are automatically loaded for each image

## Database Schema

### image_annotations Table
```sql
plaque_status INTEGER,        -- 0 = no plaque, 1 = has plaque, NULL = not annotated
annotated_by INTEGER,          -- FK to users table
annotated_at TIMESTAMP,        -- When annotation was made
```

### annotation_history Table (Audit Trail)
```sql
id SERIAL PRIMARY KEY,
annotation_id INTEGER,         -- FK to image_annotations
user_id INTEGER,               -- Who made the change
old_value INTEGER,             -- Previous plaque_status
new_value INTEGER,             -- New plaque_status
changed_at TIMESTAMP DEFAULT NOW()
```

## API Endpoints

### GET /api/images/:imageId/annotations
Returns teeth array with subboxes and progress stats:
```json
{
  "success": true,
  "data": {
    "teeth": [
      {
        "annotation_id": 123,
        "category_name": "1",
        "bbox": [x, y, width, height],
        "subboxes": [
          {
            "subbox_id": 456,
            "region": "top_left",
            "bbox": [x, y, w, h],
            "plaque_status": 1,
            "annotated_by": {
              "id": 1,
              "name": "Dr. Smith"
            },
            "annotated_at": "2024-01-15T10:30:00Z"
          }
        ]
      }
    ],
    "progress": {
      "total": 40,
      "annotated": 15,
      "not_annotated": 25,
      "plaque_detected": 8,
      "percentage": 37.5
    }
  }
}
```

### PUT /api/annotations/:annotationId/plaque
Update single subbox plaque status:
```json
{
  "plaque_status": 1,  // 0, 1, or null
  "user_id": 1
}
```

### POST /api/images/:imageId/annotations/batch
Batch update multiple subboxes (for performance):
```json
{
  "annotations": [
    { "id": 456, "plaque_status": 1 },
    { "id": 457, "plaque_status": 0 }
  ],
  "user_id": 1
}
```

### GET /api/visits/:visitId/annotations/stats
Aggregate statistics across all images in a visit:
```json
{
  "success": true,
  "data": {
    "visit_id": 789,
    "total_images": 9,
    "total_teeth": 80,
    "total_subboxes": 320,
    "annotated": 150,
    "plaque_detected": 60,
    "no_plaque": 90,
    "plaque_percentage": 40.0
  }
}
```

## Components

### AnnotationCanvas.jsx
- **Purpose**: Render bounding boxes and subboxes on canvas
- **Props**:
  - `imageUrl`: URL of the processed image
  - `teeth`: Array of teeth with subboxes
  - `onSubboxClick`: Callback when a subbox is clicked
- **Features**:
  - Canvas-based rendering for accurate bbox display
  - Click detection with coordinate mapping
  - Hover highlighting with gold border
  - Tooltip with annotation details

### ProcessedImageViewer.jsx (Enhanced)
- **New State**:
  - `annotations`: Array of teeth with subboxes
  - `annotationStats`: Progress statistics
  - `currentUser`: Logged-in user for annotation tracking
- **New Functions**:
  - `loadAnnotationsForImage(imageId)`: Fetch annotations from API
  - `handleSubboxClick(subbox, tooth)`: Toggle plaque status
  - `navigateImage(direction)`: Switch between images with annotation reload
- **Integration**: Shows AnnotationCanvas when in processed view mode with annotations loaded

## Current Status

✅ **Completed:**
- Database migration with plaque_status columns
- Backend API (4 endpoints)
- Frontend service (annotationService.js)
- AnnotationCanvas component with interactive clicking
- ProcessedImageViewer integration
- Real-time stats display
- Image navigation with arrow keys
- Audit trail (annotation_history)

⏳ **Future Enhancements:**
1. **AI-Assisted Mode**: Auto-detect plaque and pre-fill suggestions
2. **Keyboard Shortcuts**: 
   - Press `1` for "has plaque"
   - Press `0` for "no plaque"
   - Press `Space` to skip
3. **Batch Operations**:
   - "Mark all as no plaque"
   - "Copy annotations from previous visit"
4. **Export Reports**:
   - Generate PDF with annotated images
   - Export CSV with statistics
5. **Multi-User Collaboration**:
   - Show who's currently viewing/annotating
   - Lock mechanism to prevent conflicts

## Testing Guide

### Manual Testing Steps:
1. Start backend and frontend servers
2. Login as a doctor user
3. Create a patient and visit
4. Upload 9 raw images
5. Click "Xử lý ảnh" and wait for processing
6. Click a processed image to open lightbox
7. Verify:
   - [ ] Bounding boxes are visible
   - [ ] Subboxes are colored gray initially
   - [ ] Hover shows tooltip
   - [ ] Click toggles color (gray → red → green → red)
   - [ ] Stats box updates after each click
   - [ ] Arrow buttons switch images
   - [ ] Keyboard arrows work
   - [ ] Annotations persist after closing/reopening lightbox

### API Testing with curl:
```bash
# Get annotations for image
curl http://localhost:3000/api/images/123/annotations

# Update single subbox
curl -X PUT http://localhost:3000/api/annotations/456/plaque \
  -H "Content-Type: application/json" \
  -d '{"plaque_status": 1, "user_id": 1}'

# Batch update
curl -X POST http://localhost:3000/api/images/123/annotations/batch \
  -H "Content-Type: application/json" \
  -d '{"annotations": [{"id": 456, "plaque_status": 1}], "user_id": 1}'

# Get visit stats
curl http://localhost:3000/api/visits/789/annotations/stats
```

## Troubleshooting

### Issue: Bounding boxes not showing
- Check: `annotations` state is populated
- Verify: `viewMode === 'processed'`
- Console log: `console.log('Annotations:', annotations)`

### Issue: Click not working
- Check: `currentUser` is set (logged in)
- Verify: `onSubboxClick` callback is passed to AnnotationCanvas
- Console log: Click coordinates and found subbox

### Issue: Stats not updating
- Check: `loadAnnotationsForImage()` is called after update
- Verify: API returns updated data
- Console log: `annotationStats` state

### Issue: Navigation breaks annotations
- Check: `navigateImage()` calls `loadAnnotationsForImage(nextImage.id)`
- Verify: `lightboxImage.imageId` is set correctly
- Console log: Image ID before and after navigation

-- =====================================================
-- Fix Category ID Mapping
-- Cập nhật category_id theo COCO category mapping chuẩn:
--   Teeth: category_id 1-20 (name: 11-15, 21-25, 31-35, 41-45)
--   Brace: category_id 21
-- 
-- YOLO class = category_id (giữ nguyên)
--   Teeth: class 1-20
--   Brace: class 21
-- =====================================================

-- Bảng mapping COCO category
-- category_id | name
-- 1           | 11
-- 2           | 12
-- 3           | 13
-- 4           | 14
-- 5           | 15
-- 6           | 21
-- 7           | 22
-- 8           | 23
-- 9           | 24
-- 10          | 25
-- 11          | 31
-- 12          | 32
-- 13          | 33
-- 14          | 34
-- 15          | 35
-- 16          | 41
-- 17          | 42
-- 18          | 43
-- 19          | 44
-- 20          | 45
-- 21          | brace

-- =====================================================
-- UPDATE PARENT ANNOTATIONS (teeth and brace)
-- category_name → category_id
-- =====================================================

-- Teeth: Update category_id based on category_name
UPDATE image_annotations SET category_id = 1 WHERE category_name = '11' AND parent_annotation_id IS NULL;
UPDATE image_annotations SET category_id = 2 WHERE category_name = '12' AND parent_annotation_id IS NULL;
UPDATE image_annotations SET category_id = 3 WHERE category_name = '13' AND parent_annotation_id IS NULL;
UPDATE image_annotations SET category_id = 4 WHERE category_name = '14' AND parent_annotation_id IS NULL;
UPDATE image_annotations SET category_id = 5 WHERE category_name = '15' AND parent_annotation_id IS NULL;
UPDATE image_annotations SET category_id = 6 WHERE category_name = '21' AND parent_annotation_id IS NULL;
UPDATE image_annotations SET category_id = 7 WHERE category_name = '22' AND parent_annotation_id IS NULL;
UPDATE image_annotations SET category_id = 8 WHERE category_name = '23' AND parent_annotation_id IS NULL;
UPDATE image_annotations SET category_id = 9 WHERE category_name = '24' AND parent_annotation_id IS NULL;
UPDATE image_annotations SET category_id = 10 WHERE category_name = '25' AND parent_annotation_id IS NULL;
UPDATE image_annotations SET category_id = 11 WHERE category_name = '31' AND parent_annotation_id IS NULL;
UPDATE image_annotations SET category_id = 12 WHERE category_name = '32' AND parent_annotation_id IS NULL;
UPDATE image_annotations SET category_id = 13 WHERE category_name = '33' AND parent_annotation_id IS NULL;
UPDATE image_annotations SET category_id = 14 WHERE category_name = '34' AND parent_annotation_id IS NULL;
UPDATE image_annotations SET category_id = 15 WHERE category_name = '35' AND parent_annotation_id IS NULL;
UPDATE image_annotations SET category_id = 16 WHERE category_name = '41' AND parent_annotation_id IS NULL;
UPDATE image_annotations SET category_id = 17 WHERE category_name = '42' AND parent_annotation_id IS NULL;
UPDATE image_annotations SET category_id = 18 WHERE category_name = '43' AND parent_annotation_id IS NULL;
UPDATE image_annotations SET category_id = 19 WHERE category_name = '44' AND parent_annotation_id IS NULL;
UPDATE image_annotations SET category_id = 20 WHERE category_name = '45' AND parent_annotation_id IS NULL;

-- Brace: Update category_id to 21
UPDATE image_annotations SET category_id = 21 WHERE LOWER(category_name) IN ('brace', 'bracket') AND parent_annotation_id IS NULL;

-- =====================================================
-- Verification queries (run to check)
-- =====================================================
-- SELECT category_name, category_id, COUNT(*) 
-- FROM image_annotations 
-- WHERE parent_annotation_id IS NULL 
-- GROUP BY category_name, category_id 
-- ORDER BY category_id;

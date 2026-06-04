-- AceTalks — dev seed data
-- Run AFTER schema.sql. Creates one test communicator with a 3×3 home board.
-- Replace 'YOUR_CLERK_USER_ID' with your actual Clerk user ID from the dashboard.

DO $$
DECLARE
  v_owner_id   text := 'YOUR_CLERK_USER_ID';  -- replace before running
  v_comm_id    uuid;
  v_board_id   uuid;
BEGIN

-- Test communicator (adult)
INSERT INTO communicators (owner_id, display_name, age_group, primary_language, grid_size)
VALUES (v_owner_id, 'Test User', 'adult', 'en', '3x3')
RETURNING id INTO v_comm_id;

-- Home board
INSERT INTO boards (communicator_id, name, is_home, obf_json)
VALUES (
  v_comm_id,
  'Home',
  true,
  jsonb_build_object(
    'format', 'open-board-0.1',
    'id', gen_random_uuid()::text,
    'name', 'Home',
    'buttons', '[]'::jsonb,
    'grid', jsonb_build_object('rows', 3, 'columns', 3, 'order', '[]'::jsonb)
  )
)
RETURNING id INTO v_board_id;

-- Seed tiles: 3×3 grid with basic vocabulary
INSERT INTO tiles (board_id, label_translations, row_index, col_index, bg_color)
VALUES
  (v_board_id, '{"en":"Water","es":"Agua","th":"น้ำ"}',       0, 0, '#D8EDE6'),
  (v_board_id, '{"en":"Food","es":"Comida","th":"อาหาร"}',    0, 1, '#FEE9E0'),
  (v_board_id, '{"en":"Help","es":"Ayuda","th":"ช่วย"}',       0, 2, '#FEF3DC'),
  (v_board_id, '{"en":"Yes","es":"Sí","th":"ใช่"}',            1, 0, '#D8EDE6'),
  (v_board_id, '{"en":"No","es":"No","th":"ไม่"}',             1, 1, '#FEE9E0'),
  (v_board_id, '{"en":"More","es":"Más","th":"อีก"}',          1, 2, '#D8EDE6'),
  (v_board_id, '{"en":"Stop","es":"Para","th":"หยุด"}',        2, 0, '#FEE9E0'),
  (v_board_id, '{"en":"Go","es":"Ve","th":"ไป"}',              2, 1, '#D8EDE6'),
  (v_board_id, '{"en":"Home","es":"Casa","th":"บ้าน"}',        2, 2, '#FEF3DC');

RAISE NOTICE 'Seed complete. communicator_id=%, board_id=%', v_comm_id, v_board_id;
END $$;

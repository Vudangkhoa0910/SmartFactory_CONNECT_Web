-- Insert seed data for rooms
INSERT INTO rooms (room_code, room_name, capacity, location, facilities, description) 
VALUES
  ('A', 'Phòng Họp A', 8, 'Tầng 1 - Khu A', 
   '["projector", "whiteboard", "air_conditioner", "wifi"]'::jsonb,
   'Phòng họp nhỏ, phù hợp cho team meeting 6-8 người'),
  ('B', 'Phòng Họp B', 12, 'Tầng 1 - Khu B', 
   '["projector", "whiteboard", "video_conference", "air_conditioner", "wifi"]'::jsonb,
   'Phòng họp vừa, có thiết bị video conference'),
  ('C', 'Phòng Họp C', 20, 'Tầng 2 - Khu C', 
   '["projector", "whiteboard", "video_conference", "sound_system", "air_conditioner", "wifi"]'::jsonb,
   'Phòng họp lớn, phù hợp cho workshop và training'),
  ('D', 'Phòng Họp D', 6, 'Tầng 2 - Khu D', 
   '["whiteboard", "air_conditioner", "wifi"]'::jsonb,
   'Phòng họp mini, thích hợp cho thảo luận nhóm nhỏ'),
  ('E', 'Phòng Họp E', 30, 'Tầng 3 - Hội trường', 
   '["projector", "whiteboard", "video_conference", "sound_system", "microphone", "air_conditioner", "wifi"]'::jsonb,
   'Hội trường lớn, dùng cho sự kiện công ty và presentation')
ON CONFLICT (room_code) DO NOTHING;

-- Insert 5 meeting rooms
INSERT INTO rooms (room_code, room_name, capacity, location, facilities, description) VALUES
('A', 'Phong Hop A', 8, 'Tang 1 - Khu A', '["projector", "whiteboard", "air_conditioner", "wifi"]'::jsonb, 'Phong hop nho'),
('B', 'Phong Hop B', 12, 'Tang 1 - Khu B', '["projector", "whiteboard", "video_conference", "air_conditioner", "wifi"]'::jsonb, 'Phong hop vua'),
('C', 'Phong Hop C', 20, 'Tang 2 - Khu C', '["projector", "whiteboard", "video_conference", "sound_system", "air_conditioner", "wifi"]'::jsonb, 'Phong hop lon'),
('D', 'Phong Hop D', 6, 'Tang 2 - Khu D', '["whiteboard", "air_conditioner", "wifi"]'::jsonb, 'Phong hop mini'),
('E', 'Phong Hop E', 30, 'Tang 3 - Hoi truong', '["projector", "whiteboard", "video_conference", "sound_system", "microphone", "air_conditioner", "wifi"]'::jsonb, 'Hoi truong lon')
ON CONFLICT (room_code) DO NOTHING;

-- Enable realtime for profiles and user_roles tables so users can see approval changes in real-time
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;
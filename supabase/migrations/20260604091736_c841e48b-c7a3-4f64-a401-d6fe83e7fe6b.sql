
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_hospital(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.user_hospital_in_referral_chain(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_patient_code() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.prevent_profile_hospital_change() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_first_user_admin() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

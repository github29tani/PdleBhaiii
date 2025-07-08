-- Function to update creator earnings
create or replace function public.update_creator_earnings(
  p_creator_id uuid,
  p_amount numeric
)
returns void
language plpgsql
security definer
as $$
begin
  -- Update creator total earnings
  update profiles
  set total_earnings = coalesce(total_earnings, 0.0) + p_amount
  where id = p_creator_id;
end;
$$;

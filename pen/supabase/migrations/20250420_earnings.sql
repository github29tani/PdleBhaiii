-- Create functions for handling earnings
create or replace function public.increment_note_stats(
  note_id uuid,
  view_increment integer default 0,
  download_increment integer default 0,
  ad_click_increment integer default 0,
  earning_increment numeric default 0.0
)
returns void
language plpgsql
security definer
as $$
declare
  creator_id uuid;
begin
  -- Get the creator ID from the note
  select uploader_id into creator_id from notes where id = note_id;
  
  -- Update note stats
  update notes
  set 
    views = coalesce(views, 0) + view_increment,
    downloads = coalesce(downloads, 0) + download_increment,
    ad_clicks = coalesce(ad_clicks, 0) + ad_click_increment,
    earnings = coalesce(earnings, 0.0) + earning_increment
  where id = note_id;
  
  -- Update creator total earnings
  update profiles
  set total_earnings = coalesce(total_earnings, 0.0) + earning_increment
  where id = creator_id;
  
  -- Record earnings history if there's any earning
  if earning_increment > 0 then
    insert into creator_earnings_history (
      creator_id,
      amount,
      type,
      created_at
    ) values (
      creator_id,
      earning_increment,
      case 
        when ad_click_increment > 0 then 'ad_revenue'
        else 'support_tip'
      end,
      now()
    );
  end if;
end;
$$;

-- Function to record ad click
create or replace function public.record_ad_click(
  p_note_id uuid,
  p_earning numeric default 0.10
)
returns void
language plpgsql
security definer
as $$
begin
  perform increment_note_stats(
    note_id := p_note_id,
    ad_click_increment := 1,
    earning_increment := p_earning
  );
end;
$$;

-- Function to record view
create or replace function public.record_view(
  p_note_id uuid
)
returns void
language plpgsql
security definer
as $$
begin
  perform increment_note_stats(
    note_id := p_note_id,
    view_increment := 1
  );
end;
$$;

-- Function to record support tip
create or replace function public.record_support_tip(
  p_note_id uuid,
  p_amount numeric
)
returns void
language plpgsql
security definer
as $$
begin
  perform increment_note_stats(
    note_id := p_note_id,
    earning_increment := p_amount
  );
end;
$$;

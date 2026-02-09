-- Migration: populate check_ins.child_id from appointment on insert

create function public.set_checkin_child_id()
returns trigger as $$
begin
  if new.child_id is null and new.appointment_id is not null then
    select child_id into new.child_id from public.appointments where id = new.appointment_id;
  end if;
  return new;
end;
$$ language plpgsql;

-- Create trigger to run before insert on check_ins
create trigger trg_set_checkin_child_id
before insert on public.check_ins
for each row execute function public.set_checkin_child_id();

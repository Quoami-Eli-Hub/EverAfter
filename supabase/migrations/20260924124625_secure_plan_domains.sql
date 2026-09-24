-- Domain writes go through owner-authorized server actions and verified DNS checks.
revoke insert,update,delete,truncate,references,trigger on public.custom_domains from public,anon,authenticated;

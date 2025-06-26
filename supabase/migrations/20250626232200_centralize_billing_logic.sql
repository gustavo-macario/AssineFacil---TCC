
CREATE OR REPLACE FUNCTION get_next_billing_date(
  initial_date date,
  renewal_period_text text
)
RETURNS date
LANGUAGE plpgsql
AS $$
DECLARE
  today_date date := date_trunc('day', now());
  next_date date := initial_date;
BEGIN
  
  IF next_date < today_date THEN
    LOOP
      
      EXIT WHEN next_date >= today_date;


      CASE lower(renewal_period_text)
        WHEN 'diario' THEN
          RETURN today_date;
        WHEN 'semanal' THEN
          next_date := next_date + interval '1 week';
        WHEN 'mensal' THEN
          next_date := next_date + interval '1 month';
        WHEN 'trimestral' THEN
          next_date := next_date + interval '3 months';
        WHEN 'anual' THEN
          next_date := next_date + interval '1 year';
        ELSE
          next_date := next_date + interval '1 month';
      END CASE;
    END LOOP;
  END IF;

  RETURN next_date;
END;
$$;
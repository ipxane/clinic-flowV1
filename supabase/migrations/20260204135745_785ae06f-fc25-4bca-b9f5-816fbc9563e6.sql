-- Add new enum value for recurring annual holidays
ALTER TYPE holiday_type ADD VALUE 'recurring_annual';

-- Add recurring holiday columns (month/day only, no year)
ALTER TABLE holidays ADD COLUMN recurring_start_month integer;
ALTER TABLE holidays ADD COLUMN recurring_start_day integer;
ALTER TABLE holidays ADD COLUMN recurring_end_month integer;
ALTER TABLE holidays ADD COLUMN recurring_end_day integer;
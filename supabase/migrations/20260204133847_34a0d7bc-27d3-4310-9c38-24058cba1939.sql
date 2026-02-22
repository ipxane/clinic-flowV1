-- Add new enum value for long holiday
ALTER TYPE holiday_type ADD VALUE 'long_holiday';

-- Add date range columns for long holidays
ALTER TABLE holidays ADD COLUMN start_date date;
ALTER TABLE holidays ADD COLUMN end_date date;
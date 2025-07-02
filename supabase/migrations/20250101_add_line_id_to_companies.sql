-- Add line_id column to companies table
ALTER TABLE companies ADD COLUMN line_id TEXT;

-- Add index for faster lookups
CREATE INDEX idx_companies_line_id ON companies(line_id);

-- Add comment
COMMENT ON COLUMN companies.line_id IS 'LINE公式アカウントの友達ID'; 
-- Create carts table
-- Requirements: BR-6, BR-8, BR-13, NFR-12

CREATE TABLE IF NOT EXISTS carts (
  -- Primary key with UUID type
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User identification (either user_id OR session_id, not both)
  user_id UUID,
  session_id TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT carts_user_or_session CHECK (
    (user_id IS NOT NULL AND session_id IS NULL) OR
    (user_id IS NULL AND session_id IS NOT NULL)
  )
);

-- Add comment to table
COMMENT ON TABLE carts IS 'Shopping carts for authenticated and anonymous users';

-- Add comments to columns
COMMENT ON COLUMN carts.id IS 'Unique cart identifier (UUID)';
COMMENT ON COLUMN carts.user_id IS 'Authenticated user ID (NULL for anonymous carts)';
COMMENT ON COLUMN carts.session_id IS 'Session ID for anonymous users (NULL for authenticated carts)';
COMMENT ON COLUMN carts.created_at IS 'Timestamp when cart was created';
COMMENT ON COLUMN carts.updated_at IS 'Timestamp when cart was last updated';

-- Create partial index on user_id for fast authenticated user cart lookup
-- Only indexes rows where user_id is not NULL
CREATE INDEX idx_carts_user_id 
ON carts(user_id) 
WHERE user_id IS NOT NULL;

-- Create partial index on session_id for fast anonymous cart lookup
-- Only indexes rows where session_id is not NULL
CREATE INDEX idx_carts_session_id 
ON carts(session_id) 
WHERE session_id IS NOT NULL;

-- Create trigger to call the function before updates
-- Reuses the update_updated_at_column() function from products migration
CREATE TRIGGER update_carts_updated_at
BEFORE UPDATE ON carts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add comments to indexes
COMMENT ON INDEX idx_carts_user_id IS 'Partial index for fast authenticated user cart lookup';
COMMENT ON INDEX idx_carts_session_id IS 'Partial index for fast anonymous cart lookup';

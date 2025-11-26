-- Add prev_board_state column to solutions table
ALTER TABLE solutions 
  ADD COLUMN prev_board_state JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Add state column to solutions table with allowed values
ALTER TABLE solutions 
  ADD COLUMN state TEXT NOT NULL DEFAULT 'GREETING' CHECK (state IN ('GREETING', 'REQUIREMENTS', 'DESIGNING', 'DEEP_DIVE', 'CONCLUSION'));


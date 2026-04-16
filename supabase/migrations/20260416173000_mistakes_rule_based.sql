-- Add rule and examples arrays to support rule-based tracking
ALTER TABLE public.user_mistakes
  ADD COLUMN IF NOT EXISTS rule TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS examples JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Optional: Since we are migrating from old structure to new structure
-- we could theoretically run an UPDATE to extract the first example if it exists,
-- but the slate wipe is safer as agreed in the plan.
UPDATE public.user_mistakes
SET 
  rule = CASE WHEN rule = '' THEN context ELSE rule END,
  examples = jsonb_build_array(
    jsonb_build_object(
      'originalText', original_text,
      'suggestion', suggestion,
      'date', created_at
    )
  )
WHERE jsonb_array_length(examples) = 0;

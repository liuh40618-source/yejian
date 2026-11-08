-- Renames the Pokémon-named template ids to the Chinese-market names the gallery now ships, and moves
-- resumes saved on a template that no longer exists onto the default one.
--
-- `resume.data` is the whole document as JSON, and the template sits at `metadata.template` inside it.
-- Rows whose value matches neither list are left alone: a template added after this migration, or a
-- document written by an older client, is not this migration's business.
--
-- The two renames that collide with a new id are ordered so the rename always wins: no shipped template
-- ever had the name "campus-fresh" and friends, so writing them in one pass is safe.

UPDATE "resume"
SET "data" = jsonb_set(
	"data",
	'{metadata,template}',
	to_jsonb(
		CASE "data" #>> '{metadata,template}'
			-- Renamed: same design, Chinese-market name.
			WHEN 'bronzor' THEN 'general-single'
			WHEN 'lapras' THEN 'senior-formal'
			WHEN 'meowth' THEN 'asia-standard'
			WHEN 'onyx' THEN 'minimal-photo'
			WHEN 'persian' THEN 'center-classic'
			WHEN 'porygon' THEN 'form-grid'
			WHEN 'rhyhorn' THEN 'whitespace-clean'
			WHEN 'scizor' THEN 'heading-accent'
			WHEN 'smeargle' THEN 'editorial'
			-- Removed: no equivalent design survived, so the default one takes over.
			WHEN 'azurill' THEN 'general-single'
			WHEN 'chikorita' THEN 'general-single'
			WHEN 'ditgar' THEN 'general-single'
			WHEN 'ditto' THEN 'general-single'
			WHEN 'gengar' THEN 'general-single'
			WHEN 'glalie' THEN 'general-single'
			WHEN 'kakuna' THEN 'general-single'
			WHEN 'leafish' THEN 'general-single'
			WHEN 'pikachu' THEN 'general-single'
			ELSE "data" #>> '{metadata,template}'
		END
	)
)
WHERE "data" #>> '{metadata,template}' IN (
	'bronzor', 'lapras', 'meowth', 'onyx', 'persian', 'porygon', 'rhyhorn', 'scizor', 'smeargle',
	'azurill', 'chikorita', 'ditgar', 'ditto', 'gengar', 'glalie', 'kakuna', 'leafish', 'pikachu'
);

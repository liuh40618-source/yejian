import { count } from "drizzle-orm";
import { db } from "@reactive-resume/db/client";
import * as schema from "@reactive-resume/db/schema";

const CACHE_DURATION_MS = 6 * 60 * 60 * 1000; // 6 hours
// No invented fallbacks: if the database cannot be read the homepage shows no totals rather than someone else's.
const LAST_KNOWN = { users: 0, resumes: 0 } as const;

// ponytail: file-based disk cache replaced with module-level memo; LAST_KNOWN fallbacks cover restarts
const memCache = new Map<string, { value: number; cachedAt: number }>();

const getCached = (key: string) => {
	const entry = memCache.get(key);
	if (!entry || Date.now() - entry.cachedAt >= CACHE_DURATION_MS) return null;
	return entry;
};

const getCachedCount = async (
	key: string,
	lastKnown: number,
	fetcher: () => Promise<number | null>,
): Promise<number> => {
	const cached = getCached(key);
	if (cached !== null) return cached.value;

	try {
		const value = await fetcher();
		if (value !== null) {
			memCache.set(key, { value, cachedAt: Date.now() });
			return value;
		}
	} catch {
		// Ignore errors, use last known value
	}

	return lastKnown;
};

const getCountFromDatabase = async (table: typeof schema.user | typeof schema.resume): Promise<number | null> => {
	const [result] = await db.select({ count: count() }).from(table);
	return result?.count ?? null;
};

export const statisticsService = {
	getTotals: async () => {
		const [users, resumes] = await Promise.all([
			getCachedCount("users", LAST_KNOWN.users, () => getCountFromDatabase(schema.user)),
			getCachedCount("resumes", LAST_KNOWN.resumes, () => getCountFromDatabase(schema.resume)),
		]);
		const usersCache = getCached("users");
		const resumesCache = getCached("resumes");

		return {
			users,
			resumes,
			// Use the older count's timestamp so the pair never looks fresher than either total.
			cachedAt:
				usersCache?.value === users && resumesCache?.value === resumes
					? Math.min(usersCache.cachedAt, resumesCache.cachedAt)
					: null,
		};
	},
};

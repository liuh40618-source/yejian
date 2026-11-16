import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { Link, useRouteContext } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@reactive-resume/ui/components/alert";
import { Button } from "@reactive-resume/ui/components/button";
import { Icon } from "@reactive-resume/ui/components/icon";
import { toast } from "@reactive-resume/ui/components/toast";

// Set while a guest is on sign-up or sign-in, so the app can confirm the move once they're back in an account. It
// survives provider redirects and two-step verification, which leave this page.
const TRANSFER_KEY = "guest-transfer";
const TRANSFER_MAX_AGE_MS = 60 * 60 * 1000;

// A guest who has read the notice once shouldn't meet it again on every page: it asks for a decision, and repeating
// it turns advice into an alarm. A new session says it again.
const DISMISSED_KEY = "guest-notice-dismissed";

const readDismissed = () => {
	try {
		return window.sessionStorage.getItem(DISMISSED_KEY) === "1";
	} catch {
		return false;
	}
};

const readTransfer = () => {
	try {
		return Number(window.sessionStorage.getItem(TRANSFER_KEY)) || 0;
	} catch {
		return 0;
	}
};
const writeTransfer = (startedAt: number | null) => {
	try {
		if (startedAt) window.sessionStorage.setItem(TRANSFER_KEY, String(startedAt));
		else window.sessionStorage.removeItem(TRANSFER_KEY);
	} catch {
		// A convenience only: without storage there's just no confirmation.
	}
};

/**
 * A guest's work ends with the session, so the app says so once and offers a way to keep it. It reads as advice,
 * not a warning: the sentence leads with what an account keeps, and the notice can be dismissed.
 */
export function GuestBanner() {
	const { session } = useRouteContext({ strict: false });
	const isAnonymous = session?.user.isAnonymous;
	const [dismissed, setDismissed] = useState(readDismissed);

	useEffect(() => {
		if (isAnonymous === undefined) return;
		const startedAt = readTransfer();
		if (!startedAt) return;
		// Back as a guest means they didn't sign up or in; nothing moved.
		writeTransfer(null);
		if (!isAnonymous && Date.now() - startedAt < TRANSFER_MAX_AGE_MS)
			toast.add({ type: "success", description: t`Your guest documents and applications are in this account.` });
	}, [isAnonymous]);

	if (!isAnonymous || dismissed) return null;

	const dismiss = () => {
		setDismissed(true);
		try {
			window.sessionStorage.setItem(DISMISSED_KEY, "1");
		} catch {
			// Without storage the notice returns on the next page: better than never saying it.
		}
	};

	return (
		<div className="px-4 pt-4">
			<Alert variant="info">
				<Icon name="info" />
				<AlertTitle>
					<Trans>You're using a guest account</Trans>
				</AlertTitle>
				<AlertDescription>
					<p>
						<Trans>
							Create an account to keep your resumes, cover letters and applications. A guest session ends with the
							browser.
						</Trans>
					</p>
					<div className="mt-2 flex flex-wrap gap-2">
						<Button size="sm" nativeButton={false} render={<Link to="/auth/register" />}>
							<Trans>Create account</Trans>
						</Button>
						<Button variant="ghost" size="sm" nativeButton={false} render={<Link to="/auth/login" />}>
							<Trans>Sign in</Trans>
						</Button>
					</div>
				</AlertDescription>
				<button
					type="button"
					data-slot="alert-action"
					aria-label={t`Dismiss`}
					onClick={dismiss}
					className="absolute end-1.5 top-1.5 grid size-6 place-items-center rounded text-current/70 transition-colors hover:bg-current/10 hover:text-current"
				>
					<Icon name="x" size={14} />
				</button>
			</Alert>
		</div>
	);
}

/**
 * On sign-up and sign-in from a guest session: what moves to the account and what doesn't. It matches the account
 * link in `@reactive-resume/auth` (documents, their history, applications, the application profile, saved answers and
 * Career knowledge move, except facts the account already holds and a profile when it has its own; assistant
 * conversations are deleted with the guest).
 */
export function GuestTransferNote() {
	useEffect(() => writeTransfer(Date.now()), []);

	return (
		<Alert variant="info">
			<Icon name="info" />
			<AlertDescription>
				<Trans>
					Your guest resumes, cover letters, applications and Career knowledge move to this account, except facts it
					already has and the guest's Career profile if it has its own. Assistant conversations don't.
				</Trans>
			</AlertDescription>
		</Alert>
	);
}

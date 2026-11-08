import { verifyEmail } from "./auth";

const VerifyEmailPreview = (props: { url: string; locale: string }) => verifyEmail(props).react;

export default Object.assign(VerifyEmailPreview, {
	PreviewProps: { url: "https://localhost:3000/auth/verify-email?token=example-token", locale: "en-US" },
} satisfies { PreviewProps: Parameters<typeof verifyEmail>[0] });

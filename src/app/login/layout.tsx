import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to NextRep or create your account to start training and tracking recovery."
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}

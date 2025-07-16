import { SignIn } from "@clerk/nextjs";
import { AuthLayout } from "@/modules/auth/components/AuthLayout";

export default function SignInPage() {
  return (
    <AuthLayout>
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-none",
            formButtonPrimary: 
              "bg-gray-900 hover:bg-gray-800 text-white",
          },
          variables: {
            colorPrimary: "#111827",
            colorTextOnPrimaryBackground: "#ffffff",
          },
        }}
      />
    </AuthLayout>
  );
}
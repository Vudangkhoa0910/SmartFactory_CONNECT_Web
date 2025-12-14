import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignUpForm from "../../components/auth/SignUpForm";

export default function SignUp() {
  return (
    <>
      <PageMeta
        title="Đăng ký | SmartFactory CONNECT"
        description="Đăng ký tài khoản mới - SmartFactory CONNECT"
      />
      <AuthLayout>
        <SignUpForm />
      </AuthLayout>
    </>
  );
}

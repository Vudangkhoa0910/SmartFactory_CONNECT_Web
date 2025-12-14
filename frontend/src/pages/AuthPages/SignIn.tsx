import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="Đăng nhập | SmartFactory CONNECT"
        description="Đăng nhập vào hệ thống quản lý nhà máy thông minh SmartFactory CONNECT"
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}

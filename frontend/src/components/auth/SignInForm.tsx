import { useState } from "react";
// Đảm bảo bạn đang dùng react-router-dom, không phải react-router
import { Link } from "react-router";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import Button from "../ui/button/Button";

// --- Helper Components (Thành phần phụ trợ) ---

const GoogleIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* SVG paths for Google icon */}
    <path
      d="M18.7511 10.1944C18.7511 9.47495 18.6915 8.94995 18.5626 8.40552H10.1797V11.6527H15.1003C15.0011 12.4597 14.4654 13.675 13.2749 14.4916L13.2582 14.6003L15.9087 16.6126L16.0924 16.6305C17.7788 15.1041 18.7511 12.8583 18.7511 10.1944Z"
      fill="#4285F4"
    />
    <path
      d="M10.1788 18.75C12.5895 18.75 14.6133 17.9722 16.0915 16.6305L13.274 14.4916C12.5201 15.0068 11.5081 15.3666 10.1788 15.3666C7.81773 15.3666 5.81379 13.8402 5.09944 11.7305L4.99473 11.7392L2.23868 13.8295L2.20264 13.9277C3.67087 16.786 6.68674 18.75 10.1788 18.75Z"
      fill="#34A853"
    />
    <path
      d="M5.10014 11.7305C4.91165 11.186 4.80257 10.6027 4.80257 9.99992C4.80257 9.3971 4.91165 8.81379 5.09022 8.26935L5.08523 8.1534L2.29464 6.02954L2.20333 6.0721C1.5982 7.25823 1.25098 8.5902 1.25098 9.99992C1.25098 11.4096 1.5982 12.7415 2.20333 13.9277L5.10014 11.7305Z"
      fill="#FBBC05"
    />
    <path
      d="M10.1789 4.63331C11.8554 4.63331 12.9864 5.34303 13.6312 5.93612L16.1511 3.525C14.6035 2.11528 12.5895 1.25 10.1789 1.25C6.68676 1.25 3.67088 3.21387 2.20264 6.07218L5.08953 8.26943C5.81381 6.15972 7.81776 4.63331 10.1789 4.63331Z"
      fill="#EB4335"
    />
  </svg>
);

const SocialSignInButtons = () => (
  // Bọc trong một div để sau này dễ thêm các nút khác
  <div>
    <button className="inline-flex items-center justify-center w-full gap-3 py-2.5 text-sm font-medium text-gray-700 transition-colors bg-white border border-gray-200 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-white/90 dark:hover:bg-gray-700">
      <GoogleIcon />
      Sign in with Google
    </button>
  </div>
);

const OrSeparator = () => (
  <div className="relative py-4">
    <div className="absolute inset-0 flex items-center">
      <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
    </div>
    <div className="relative flex justify-center text-sm">
      <span className="px-3 text-gray-400 bg-white dark:bg-gray-900">
        Or continue with
      </span>
    </div>
  </div>
);

// --- Main Component (Thành phần chính) ---

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  return (
    <div className="flex flex-col flex-1 bg-white dark:bg-gray-900">
      <div className="w-full max-w-md px-4 pt-10 mx-auto sm:px-0">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon className="size-5" />
          Back to dashboard
        </Link>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md px-4 py-8 mx-auto sm:px-0">
        <div>
          <div className="mb-6 text-center sm:mb-8">
            <h1 className="mb-2 text-2xl font-bold text-gray-800 sm:text-3xl dark:text-white/90">
              Welcome Back!
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Sign in to continue to your account.
            </p>
          </div>

          {/* --- Đây là phần đã được sắp xếp lại --- */}
          <div className="space-y-4">
            <SocialSignInButtons />
            <OrSeparator />
          </div>

          <form>
            <div className="space-y-5">
              <div>
                <Label htmlFor="email">
                  Username or ID <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com/ID
                "
                />
              </div>
              <div>
                <Label htmlFor="password">
                  Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button" // Thêm type="button" để không submit form
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute z-20 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                  >
                    {showPassword ? (
                      <EyeIcon className="text-gray-500 size-5 dark:text-gray-400" />
                    ) : (
                      <EyeCloseIcon className="text-gray-500 size-5 dark:text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Checkbox
                    id="keep-logged-in"
                    checked={isChecked}
                    onChange={setIsChecked}
                  />
                  <Label htmlFor="keep-logged-in" className="!mb-0 font-normal">
                    Keep me logged in
                  </Label>
                </div>
                <Link
                  to="/reset-password"
                  className="text-sm font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-500"
                >
                  Forgot password?
                </Link>
              </div>
              <div>
                <Button className="w-full" size="sm">
                  Sign in
                </Button>
              </div>
            </div>
          </form>

          <div className="mt-6">
            <p className="text-sm text-center text-gray-600 dark:text-gray-400">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
              >
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

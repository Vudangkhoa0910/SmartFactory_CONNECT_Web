import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import Button from "../ui/button/Button";
import { useAuth } from "../../contexts/AuthContext";

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [credentials, setCredentials] = useState({
    login: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Login accepts either email or employee_code as 'login'
      const loginData = credentials.login.includes('@') 
        ? { email: credentials.login, password: credentials.password }
        : { employee_code: credentials.login, password: credentials.password };
        
      const user = await login(loginData);
      
      // Redirect based on permissions
      if (user.permissions.has_web_access) {
        navigate('/');
      } else {
        setError('Your account does not have web dashboard access');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 bg-white dark:bg-gray-900">
      <div className="w-full max-w-md px-4 pt-10 mx-auto sm:px-0">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon className="size-5" />
          Back to home
        </Link>
      </div>
      
      <div className="flex flex-col justify-center flex-1 w-full max-w-md px-4 py-8 mx-auto sm:px-0">
        <div>
          <div className="mb-6 text-center sm:mb-8">
            <h1 className="mb-2 text-2xl font-bold text-gray-800 sm:text-3xl dark:text-white/90">
              SmartFactory CONNECT
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Sign in to access your dashboard
            </p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-5">
              <div>
                <Label htmlFor="login">
                  Email or Employee Code <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="login"
                  type="text"
                  placeholder="admin@smartfactory.com or ADMIN001"
                  value={credentials.login}
                  onChange={(e) => setCredentials({ ...credentials, login: e.target.value })}
                  required
                  disabled={loading}
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
                    value={credentials.password}
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute z-20 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    disabled={loading}
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
                    checked={rememberMe}
                    onChange={setRememberMe}
                  />
                  <Label htmlFor="keep-logged-in" className="!mb-0 font-normal">
                    Remember me
                  </Label>
                </div>
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400"
                >
                  Forgot password?
                </Link>
              </div>
              
              <div>
                <Button 
                  type="submit" 
                  className="w-full bg-red-600 hover:bg-red-700" 
                  size="sm"
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : 'Sign in'}
                </Button>
              </div>
            </div>
          </form>

          {/* Demo credentials hint */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Demo Accounts:
            </p>
            <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Admin (Level 1): <code className="px-1 bg-white dark:bg-gray-900 rounded">admin@smartfactory.com</code> / admin123</li>
              <li>• Manager (Level 2): <code className="px-1 bg-white dark:bg-gray-900 rounded">PROD001</code> / Manager123!</li>
              <li>• Supervisor (Level 3): <code className="px-1 bg-white dark:bg-gray-900 rounded">SUP001</code> / Manager123!</li>
              <li className="pt-2 text-gray-500 italic">Mobile Only (No Web Access):</li>
              <li>• Team Leader (Level 5): <code className="px-1 bg-white dark:bg-gray-900 rounded">TL001</code></li>
              <li>• Operator (Level 6): <code className="px-1 bg-white dark:bg-gray-900 rounded">OP001</code></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

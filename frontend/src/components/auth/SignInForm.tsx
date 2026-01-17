import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import Button from "../ui/button/Button";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";

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
  const { t, initFromUser } = useLanguage();

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
      
      // Initialize language from user preference
      if (user.preferred_language) {
        initFromUser(user.preferred_language);
      }
      
      // Redirect based on permissions
      if (user.permissions.has_web_access) {
        navigate('/');
      } else {
        setError(t('auth.no_web_access'));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || t('auth.login_failed'));
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
          {t('button.back_to_home')}
        </Link>
      </div>
      
      <div className="flex flex-col justify-center flex-1 w-full max-w-md px-4 py-8 mx-auto sm:px-0">
        <div>
          <div className="mb-6 text-center sm:mb-8">
            <h1 className="mb-2 text-2xl font-bold text-gray-800 sm:text-3xl dark:text-white/90">
              {t('app.name')}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('auth.sign_in_subtitle')}
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
                  {t('auth.email_or_employee_code')} <span className="text-red-500">*</span>
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
                  {t('auth.password')} <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t('auth.enter_password')}
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
                    {t('auth.remember_me')}
                  </Label>
                </div>
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400"
                >
                  {t('auth.forgot_password')}
                </Link>
              </div>
              
              <div>
                <Button 
                  type="submit" 
                  className="w-full bg-red-600 hover:bg-red-700" 
                  size="sm"
                  disabled={loading}
                >
                  {loading ? t('auth.signing_in') : t('auth.sign_in')}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

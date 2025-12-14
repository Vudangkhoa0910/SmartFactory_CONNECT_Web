import React from "react";
import GridShape from "../../components/common/GridShape";
import { Link } from "react-router";
import ThemeTogglerTwo from "../../components/common/ThemeTogglerTwo";
import { LanguageSwitcher } from "../../components/common/LanguageSwitcher";
import { useTranslation } from "../../contexts/LanguageContext";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  
  return (
    <div className="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
      <div className="relative flex flex-col justify-center w-full h-screen lg:flex-row dark:bg-gray-900 sm:p-0">
        {children}
        <div className="items-center hidden w-full h-full lg:w-1/2 bg-brand-950 dark:bg-gray-950 lg:grid">
          <div className="relative flex items-center justify-center z-1">
            {/* <!-- ===== Common Grid Shape Start ===== --> */}
            <GridShape />
            <div className="flex flex-col items-center max-w-md px-4">
              <Link to="/" className="flex items-center justify-center mb-8">
                <img
                  src="/images/logo/denso.svg"
                  alt="DENSO Logo"
                  className="h-20 w-auto"
                />
              </Link>
              <p className="text-center text-white/80 dark:text-white/60 text-lg">
                {t('app.platform')}
              </p>
            </div>
          </div>
        </div>
        {/* Language Switcher & Theme Toggler */}
        <div className="fixed z-50 bottom-6 right-6 flex items-center gap-3">
          <LanguageSwitcher />
          <div className="hidden sm:block">
            <ThemeTogglerTwo />
          </div>
        </div>
      </div>
    </div>
  );
}

import PageBreadcrumb from "../components/common/PageBreadCrumb";
import UserMetaCard from "../components/UserProfile/UserMetaCard";
import UserInfoCard from "../components/UserProfile/UserInfoCard";
import UserAddressCard from "../components/UserProfile/UserAddressCard";
import PageMeta from "../components/common/PageMeta";
import { useTranslation } from "../contexts/LanguageContext";

export default function UserProfiles() {
  const { t } = useTranslation();
  
  return (
    <div className="p-4">
      <PageMeta
        title={`${t('page.profile')} | SmartFactory CONNECT`}
        description={t('profile.title')}
      />
      <PageBreadcrumb pageTitle={t('page.profile')} />
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-900 dark:text-white lg:mb-7">
          {t('profile.title')}
        </h3>
        <div className="space-y-6">
          <UserMetaCard />
          <UserInfoCard />
          <UserAddressCard />
        </div>
      </div>
    </div>
  );
}

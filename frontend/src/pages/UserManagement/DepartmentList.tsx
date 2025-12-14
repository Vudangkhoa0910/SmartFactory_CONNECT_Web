import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useTranslation } from "../../contexts/LanguageContext";
import api from "../../services/api";
import PageBreadCrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";

interface Department {
  id: number;
  code: string;
  name: string;
  description: string | null;
  parent_id: number | null;
  manager_id: number | null;
  is_active: boolean;
  created_at: string;
  parent_name: string | null;
  manager_name: string | null;
  manager_code: string | null;
  employee_count: string | number;
}

export default function DepartmentList() {
  const { canManageUsers } = useAuth();
  const { t } = useTranslation();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!canManageUsers()) {
      window.location.href = "/";
      return;
    }
    
    fetchDepartments();
  }, [canManageUsers]);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await api.get("/departments");
      setDepartments(response.data.data);
    } catch (error) {
      console.error("Failed to fetch departments:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDepartmentStatus = async (deptId: number, currentStatus: boolean) => {
    try {
      await api.put(`/departments/${deptId}`, { is_active: !currentStatus });
      fetchDepartments();
    } catch (error) {
      console.error("Failed to update department status:", error);
    }
  };

  // Filter departments
  const filteredDepartments = departments.filter((dept) => {
    return (
      dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dept.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <>
      <PageMeta 
        title={`${t('page.department_management')} | SmartFactory CONNECT`}
        description={t('department.title')}
      />
      <div className="p-4 mx-auto w-full max-w-screen-2xl">
        <PageBreadCrumb pageTitle={t('page.department_management')} />

        {/* Header & Filters */}
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {t('department.title')}
          </h2>
          <button className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-300 transition-colors">
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            {t('department.create')}
          </button>
        </div>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            placeholder={t('search.placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:outline-none"
          />
        </div>

        {/* Department Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-xs uppercase text-gray-700 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3">{t('department.code')}</th>
                    <th className="px-6 py-3">{t('department.name')}</th>
                    <th className="px-6 py-3">{t('department.description')}</th>
                    <th className="px-6 py-3">{t('department.manager')}</th>
                    <th className="px-6 py-3">{t('department.employee_count')}</th>
                    <th className="px-6 py-3">{t('label.status')}</th>
                    <th className="px-6 py-3">{t('label.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDepartments.map((dept) => (
                    <tr
                      key={dept.id}
                      className="border-b border-gray-100 bg-white hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {dept.code}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {dept.name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs truncate text-gray-700">
                          {dept.description || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {dept.manager_name ? (
                          <div>
                            <div className="font-medium text-gray-900">
                              {dept.manager_name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {dept.manager_code}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">{t('label.none')}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">
                          {dept.employee_count || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {dept.is_active ? (
                          <span className="inline-flex rounded-full bg-red-600 px-2 py-1 text-xs font-medium text-white">
                            {t('status.active')}
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                            {t('status.inactive')}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              toggleDepartmentStatus(dept.id, dept.is_active)
                            }
                            className="text-red-600 hover:text-red-700 hover:underline"
                          >
                            {dept.is_active ? t('status.inactive') : t('status.active')}
                          </button>
                          <span className="text-gray-300">|</span>
                          <button className="text-gray-600 hover:text-red-600 hover:underline">
                            {t('button.edit')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-2xl font-bold text-gray-900">
              {departments.length}
            </div>
            <div className="text-sm text-gray-500">{t('department.list')}</div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-2xl font-bold text-red-600">
              {departments.filter((d) => d.is_active).length}
            </div>
            <div className="text-sm text-gray-500">{t('status.active')}</div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-2xl font-bold text-red-600">
              {departments.reduce((sum, d) => sum + (Number(d.employee_count) || 0), 0)}
            </div>
            <div className="text-sm text-gray-500">{t('user.list')}</div>
          </div>
        </div>
      </div>
    </>
  );
}

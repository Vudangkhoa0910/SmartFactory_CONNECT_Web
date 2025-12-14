import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useTranslation } from "../../contexts/LanguageContext";
import api from "../../services/api";
import UserAvatar from "../../components/common/UserAvatar";
import PageBreadCrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";

interface User {
  id: number;
  employee_code: string;
  email: string;
  full_name: string;
  phone: string;
  role: string;
  level: number;
  department_id: number | null;
  department_name: string | null;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
}

interface Department {
  id: number;
  name: string;
  code: string;
}

const ROLES = [
  { value: "admin", key: "role.admin", level: 1 },
  { value: "factory_manager", key: "role.factory_manager", level: 2 },
  { value: "production_manager", key: "role.production_manager", level: 3 },
  { value: "supervisor", key: "role.supervisor", level: 4 },
  { value: "team_leader", key: "role.team_leader", level: 5 },
  { value: "operator", key: "role.operator", level: 6 },
  { value: "technician", key: "role.technician", level: 7 },
  { value: "qc_inspector", key: "role.qc_inspector", level: 8 },
  { value: "maintenance_manager", key: "role.maintenance_manager", level: 9 },
  { value: "maintenance_staff", key: "role.maintenance_staff", level: 9 },
  { value: "viewer", key: "role.viewer", level: 10 },
];

export default function UserManagement() {
  const { canManageUsers } = useAuth();
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");

  useEffect(() => {
    if (!canManageUsers()) {
      window.location.href = "/";
      return;
    }
    
    fetchUsers();
    fetchDepartments();
  }, [canManageUsers]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get("/users");
      setUsers(response.data.data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get("/departments");
      setDepartments(response.data.data);
    } catch (error) {
      console.error("Failed to fetch departments:", error);
    }
  };

  const toggleUserStatus = async (userId: number, currentStatus: boolean) => {
    try {
      await api.put(`/users/${userId}`, { is_active: !currentStatus });
      fetchUsers();
    } catch (error) {
      console.error("Failed to update user status:", error);
    }
  };

  const formatRole = (role: string) => {
    const roleObj = ROLES.find(r => r.value === role);
    return roleObj ? t(roleObj.key) : role;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return t('profile.never');
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.employee_code.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesDepartment =
      departmentFilter === "all" ||
      (user.department_id && user.department_id.toString() === departmentFilter);

    return matchesSearch && matchesRole && matchesDepartment;
  });

  return (
    <>
      <PageMeta 
        title={`${t('page.user_management')} | SmartFactory CONNECT`}
        description={t('user.title')}
      />
      <div className="p-4 mx-auto w-full max-w-screen-2xl">
        <PageBreadCrumb pageTitle={t('page.user_management')} />

        {/* Header & Filters */}
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {t('user.title')}
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
            {t('user.create')}
          </button>
        </div>

        {/* Filters */}
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div>
            <input
              type="text"
              placeholder={t('filter.search_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:outline-none"
            />
          </div>
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:outline-none"
            >
              <option value="all">{t('filter.all_roles')}</option>
              {ROLES.map((role) => (
                <option key={role.value} value={role.value}>
                  {t(role.key)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:outline-none"
            >
              <option value="all">{t('filter.all_departments')}</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id.toString()}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* User Table */}
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
                    <th className="px-6 py-3">{t('user.name')}</th>
                    <th className="px-6 py-3">{t('user.role')}</th>
                    <th className="px-6 py-3">{t('user.department')}</th>
                    <th className="px-6 py-3">{t('profile.last_login')}</th>
                    <th className="px-6 py-3">{t('label.status')}</th>
                    <th className="px-6 py-3">{t('label.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-gray-100 bg-white hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <UserAvatar fullName={user.full_name} size="sm" />
                          <div>
                            <div className="font-medium text-gray-900">
                              {user.full_name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {user.email}
                            </div>
                            <div className="text-xs text-gray-400">
                              {user.employee_code}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                          {formatRole(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {user.department_name ? (
                          <span className="text-gray-700">
                            {user.department_name}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">{formatDate(user.last_login)}</td>
                      <td className="px-6 py-4">
                        {user.is_active ? (
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
                              toggleUserStatus(user.id, user.is_active)
                            }
                            className="text-red-600 hover:text-red-700 hover:underline"
                          >
                            {user.is_active ? t('status.inactive') : t('status.active')}
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
              {users.length}
            </div>
            <div className="text-sm text-gray-500">{t('user.list')}</div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-2xl font-bold text-red-600">
              {users.filter((u) => u.is_active).length}
            </div>
            <div className="text-sm text-gray-500">{t('status.active')}</div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-2xl font-bold text-gray-400">
              {users.filter((u) => !u.is_active).length}
            </div>
            <div className="text-sm text-gray-500">{t('status.inactive')}</div>
          </div>
        </div>
      </div>
    </>
  );
}

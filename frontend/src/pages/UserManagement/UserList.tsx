import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useTranslation } from "../../contexts/LanguageContext";
import api from "../../services/api";
import UserAvatar from "../../components/common/UserAvatar";
import PageBreadCrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { ChevronDown, ChevronUp, Users, Crown, Pencil, Trash2 } from "lucide-react";
import { toast } from "react-toastify";

interface User {
  id: string;
  employee_code: string;
  email: string;
  full_name: string;
  phone: string;
  role: string;
  level: number;
  department_id: string | null;
  department_name: string | null;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
}

interface Department {
  id: string;
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
  const [collapsedDepartments, setCollapsedDepartments] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    employee_code: "",
    email: "",
    full_name: "",
    phone: "",
    password: "",
    role: "operator",
    department_id: ""
  });
  const [editUser, setEditUser] = useState({
    full_name: "",
    email: "",
    phone: "",
    role: "operator",
    department_id: ""
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
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

  // Filter and group users by department
  const usersByDepartment = useMemo(() => {
    // Filter users
    const filtered = users.filter((user) => {
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

    // Group by department
    const grouped: Record<string, User[]> = {};

    filtered.forEach(user => {
      const deptKey = user.department_name || 'Chưa phân bổ';
      if (!grouped[deptKey]) {
        grouped[deptKey] = [];
      }
      grouped[deptKey].push(user);
    });

    // Sort users within each department by level (lower level = higher authority)
    Object.keys(grouped).forEach(deptKey => {
      grouped[deptKey].sort((a, b) => a.level - b.level);
    });

    return grouped;
  }, [users, searchTerm, roleFilter, departmentFilter]);

  const toggleDepartment = (deptId: string) => {
    setCollapsedDepartments(prev => {
      const next = new Set(prev);
      if (next.has(deptId)) {
        next.delete(deptId);
      } else {
        next.add(deptId);
      }
      return next;
    });
  };

  // Check if user is department leader (level <= 4: admin, factory_manager, production_manager, supervisor)
  const isDepartmentLeader = (user: User) => {
    return user.level <= 4;
  };

  const handleCreateUser = async () => {
    try {
      await api.post("/users", {
        ...newUser,
        department_id: newUser.department_id || null
      });
      setShowCreateModal(false);
      setNewUser({
        employee_code: "",
        email: "",
        full_name: "",
        phone: "",
        password: "",
        role: "operator",
        department_id: ""
      });
      toast.success(t('message.create_success'));
      fetchUsers();
    } catch (error: any) {
      console.error("Failed to create user:", error);
      toast.error(error.response?.data?.message || t('message.create_error'));
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      await api.put(`/users/${selectedUser.id}`, {
        full_name: editUser.full_name,
        email: editUser.email,
        phone: editUser.phone || null,
        role: editUser.role,
        department_id: editUser.department_id || null
      });
      setShowEditModal(false);
      setSelectedUser(null);
      toast.success(t('message.update_success'));
      fetchUsers();
    } catch (error: any) {
      console.error("Failed to update user:", error);
      toast.error(error.response?.data?.message || t('message.update_error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (user: User) => {
    setDeletingUser(user);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    setSubmitting(true);
    try {
      await api.delete(`/users/${deletingUser.id}`);
      toast.success(t('message.delete_success'));
      setShowDeleteModal(false);
      setDeletingUser(null);
      setShowEditModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      console.error("Failed to delete user:", error);
      toast.error(error.response?.data?.message || t('message.delete_error'));
    } finally {
      setSubmitting(false);
    }
  };

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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('user.title')}
          </h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-300 transition-colors"
          >
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
              className="w-full rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2 text-sm text-gray-900 dark:text-neutral-200 focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:outline-none"
            />
          </div>
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2 text-sm text-gray-900 dark:text-neutral-200 focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:outline-none"
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
              className="w-full rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2 text-sm text-gray-900 dark:text-neutral-200 focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:outline-none"
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

        {/* Users Grouped by Department */}
        {loading ? (
          <div className="flex items-center justify-center py-12 bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800">
            <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(usersByDepartment).map(([deptName, deptUsers]) => {
              const deptId = deptUsers[0]?.department_id || "0";
              const isCollapsed = collapsedDepartments.has(deptId);

              return (
                <div key={deptName} className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-sm overflow-hidden">
                  {/* Department Header */}
                  <button
                    onClick={() => toggleDepartment(deptId)}
                    className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-red-50 to-white dark:from-red-900/20 dark:to-neutral-900 hover:from-red-100 dark:hover:from-red-900/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg">
                        <Users className="w-5 h-5 text-red-600" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{deptName}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{deptUsers.length} nhân viên</p>
                      </div>
                    </div>
                    {isCollapsed ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  {/* Department Users */}
                  {!isCollapsed && (
                    <div className="divide-y divide-gray-100 dark:divide-neutral-800">
                      {deptUsers.map((user, index) => {
                        const isLeader = isDepartmentLeader(user);
                        const isFirstUser = index === 0;

                        return (
                          <div
                            key={user.id}
                            className={`px-6 py-4 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors ${isLeader ? 'bg-red-50/30 dark:bg-red-900/10' : ''
                              }`}
                          >
                            <div className="flex items-center justify-between gap-4">
                              {/* User Info */}
                              <div className="flex items-center gap-4 flex-1 min-w-0">
                                <UserAvatar fullName={user.full_name} size={isLeader ? "md" : "sm"} />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <div className={`font-semibold truncate ${isLeader ? 'text-base text-gray-900 dark:text-white' : 'text-sm text-gray-800 dark:text-gray-200'
                                      }`}>
                                      {user.full_name}
                                    </div>
                                    {isFirstUser && isLeader && (
                                      <Crown className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {user.email}
                                  </div>
                                  <div className="text-xs text-gray-400 dark:text-gray-500">
                                    {user.employee_code}
                                  </div>
                                </div>
                              </div>

                              {/* Role Badge */}
                              <div className="flex-shrink-0">
                                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${isLeader
                                  ? 'bg-red-600 text-white'
                                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                  }`}>
                                  {formatRole(user.role)}
                                </span>
                              </div>

                              {/* Last Login */}
                              <div className="hidden md:block flex-shrink-0 w-32 text-xs text-gray-500 dark:text-gray-400">
                                {formatDate(user.last_login)}
                              </div>

                              {/* Status */}
                              <div className="flex-shrink-0">
                                {user.is_active ? (
                                  <span className="inline-flex rounded-full bg-green-100 dark:bg-green-900/30 px-2 py-1 text-xs font-medium text-green-700 dark:text-green-300">
                                    {t('status.active')}
                                  </span>
                                ) : (
                                  <span className="inline-flex rounded-full bg-gray-100 dark:bg-neutral-700 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-300">
                                    {t('status.inactive')}
                                  </span>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <button
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setEditUser({
                                      full_name: user.full_name,
                                      email: user.email,
                                      phone: user.phone || "",
                                      role: user.role,
                                      department_id: user.department_id?.toString() || ""
                                    });
                                    setShowEditModal(true);
                                  }}
                                  className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-900/20"
                                  title={t('button.edit')}
                                >
                                  <Pencil size={16} />
                                </button>
                                <button
                                  onClick={() => toggleUserStatus(user.id, user.is_active)}
                                  className={`px-2 py-1 text-xs font-medium rounded-lg transition-colors ${user.is_active
                                    ? 'text-orange-600 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-900/20'
                                    : 'text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20'
                                    }`}
                                >
                                  {user.is_active ? t('button.deactivate') : t('button.activate')}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Stats */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {users.length}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{t('user.list')}</div>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm">
            <div className="text-2xl font-bold text-red-600">
              {users.filter((u) => u.is_active).length}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{t('status.active')}</div>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm">
            <div className="text-2xl font-bold text-gray-400">
              {users.filter((u) => !u.is_active).length}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{t('status.inactive')}</div>
          </div>
        </div>

        {/* Create User Modal */}
        {
          showCreateModal && (
            <div
              className="fixed inset-0 bg-gray-400/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowCreateModal(false)}
            >
              <div
                className="bg-white rounded-xl shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Thêm người dùng mới</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mã nhân viên</label>
                      <input
                        type="text"
                        value={newUser.employee_code}
                        onChange={(e) => setNewUser({ ...newUser, employee_code: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên</label>
                      <input
                        type="text"
                        value={newUser.full_name}
                        onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                      <input
                        type="tel"
                        value={newUser.phone}
                        onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
                      <input
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Chức vụ</label>
                      <select
                        value={newUser.role}
                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      >
                        {ROLES.map((role) => (
                          <option key={role.value} value={role.value}>
                            {t(role.key)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phòng ban</label>
                      <select
                        value={newUser.department_id}
                        onChange={(e) => setNewUser({ ...newUser, department_id: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      >
                        <option value="">Chưa phân bổ</option>
                        {departments.map((dept) => (
                          <option key={dept.id} value={dept.id.toString()}>
                            {dept.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleCreateUser}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                    >
                      Tạo mới
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        }

        {/* Edit User Modal */}
        {
          showEditModal && selectedUser && (
            <div
              className="fixed inset-0 bg-gray-400/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => {
                setShowEditModal(false);
                setSelectedUser(null);
              }}
            >
              <div
                className="bg-white rounded-xl shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Chỉnh sửa người dùng</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Mã nhân viên: <span className="font-semibold text-gray-700">{selectedUser.employee_code}</span>
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên</label>
                      <input
                        type="text"
                        value={editUser.full_name}
                        onChange={(e) => setEditUser({ ...editUser, full_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={editUser.email}
                        onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                      <input
                        type="tel"
                        value={editUser.phone}
                        onChange={(e) => setEditUser({ ...editUser, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Chức vụ</label>
                      <select
                        value={editUser.role}
                        onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      >
                        {ROLES.map((role) => (
                          <option key={role.value} value={role.value}>
                            {t(role.key)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phòng ban</label>
                      <select
                        value={editUser.department_id}
                        onChange={(e) => setEditUser({ ...editUser, department_id: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      >
                        <option value="">Chưa phân bổ</option>
                        {departments.map((dept) => (
                          <option key={dept.id} value={dept.id.toString()}>
                            {dept.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-between mt-6 pt-4 border-t border-gray-200">
                    {/* Delete button */}
                    <button
                      onClick={() => {
                        setShowEditModal(false);
                        handleDeleteClick(selectedUser);
                      }}
                      className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Trash2 size={16} />
                      {t('button.delete')}
                    </button>

                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setShowEditModal(false);
                          setSelectedUser(null);
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                      >
                        {t('button.cancel')}
                      </button>
                      <button
                        onClick={handleUpdateUser}
                        disabled={submitting}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? t('button.saving') : t('button.update')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        }

        {/* Delete Confirmation Modal */}
        {showDeleteModal && deletingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-md mx-4">
              <div className="p-6">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                  <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-center text-gray-900 dark:text-white mb-2">
                  {t('user.delete_confirm')}
                </h3>
                <p className="text-sm text-center text-gray-600 dark:text-gray-400 mb-6">
                  {t('user.delete_warning')} <strong>{deletingUser.full_name}</strong>?
                </p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeletingUser(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                  >
                    {t('button.cancel')}
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    disabled={submitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? t('button.deleting') : t('button.delete')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div >
    </>
  );
}

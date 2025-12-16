import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useTranslation } from "../../contexts/LanguageContext";
import api from "../../services/api";
import PageBreadCrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { useSpeechToText } from "../../hooks/useSpeechToText";
import { useSocketRefresh } from "../../hooks/useSocket";
import { Mic, Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "react-toastify";

interface Department {
  id: string;
  code: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  manager_id: string | null;
  is_active: boolean;
  created_at: string;
  parent_name: string | null;
  manager_name: string | null;
  manager_code: string | null;
  employee_count: string | number;
}

interface User {
  id: string;
  full_name: string;
  employee_code: string;
}

interface DepartmentFormData {
  code: string;
  name: string;
  description: string;
  parent_id: string;
  manager_id: string;
}

const initialFormData: DepartmentFormData = {
  code: "",
  name: "",
  description: "",
  parent_id: "",
  manager_id: "",
};

export default function DepartmentList() {
  const { canManageUsers } = useAuth();
  const { t } = useTranslation();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [deletingDepartment, setDeletingDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState<DepartmentFormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);

  const { isListening, startListening, isSupported } = useSpeechToText({
    onResult: (text) => {
      const cleanText = text.trim().replace(/\.$/, '');
      setSearchTerm((prev) => (prev ? `${prev} ${cleanText}` : cleanText));
    },
  });

  // Fetch departments
  const fetchDepartments = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const response = await api.get("/departments");
      setDepartments(response.data.data);
    } catch (error) {
      console.error("Failed to fetch departments:", error);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  // Fetch users for manager dropdown
  const fetchUsers = useCallback(async () => {
    try {
      const response = await api.get("/users?limit=1000");
      setUsers(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  }, []);

  useEffect(() => {
    if (!canManageUsers()) {
      window.location.href = "/";
      return;
    }
    fetchDepartments(true);
    fetchUsers();
  }, [canManageUsers, fetchDepartments, fetchUsers]);

  // WebSocket: Auto-refresh
  const silentRefresh = useCallback(() => {
    fetchDepartments(false);
  }, [fetchDepartments]);

  useSocketRefresh(
    ['department_created', 'department_updated', 'department_deleted'] as any,
    silentRefresh,
    ['departments']
  );

  // Toggle department status
  const toggleDepartmentStatus = async (dept: Department) => {
    try {
      await api.put(`/departments/${dept.id}`, { is_active: !dept.is_active });
      toast.success(dept.is_active ? t('department.deactivated') : t('department.activated'));
      fetchDepartments(false);
    } catch (error) {
      console.error("Failed to update department status:", error);
      toast.error(t('error.generic'));
    }
  };

  // Open create modal
  const handleCreate = () => {
    setEditingDepartment(null);
    setFormData(initialFormData);
    setIsModalOpen(true);
  };

  // Open edit modal
  const handleEdit = (dept: Department) => {
    setEditingDepartment(dept);
    setFormData({
      code: dept.code,
      name: dept.name,
      description: dept.description || "",
      parent_id: dept.parent_id || "",
      manager_id: dept.manager_id || "",
    });
    setIsModalOpen(true);
  };

  // Open delete confirmation
  const handleDeleteClick = (dept: Department) => {
    setDeletingDepartment(dept);
    setIsDeleteModalOpen(true);
  };

  // Submit form (create or update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code.trim() || !formData.name.trim()) {
      toast.error(t('validation.required_fields'));
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        code: formData.code.trim(),
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        parent_id: formData.parent_id || null,
        manager_id: formData.manager_id || null,
      };

      if (editingDepartment) {
        await api.put(`/departments/${editingDepartment.id}`, payload);
        toast.success(t('department.updated'));
      } else {
        await api.post("/departments", payload);
        toast.success(t('department.created'));
      }

      setIsModalOpen(false);
      fetchDepartments(false);
    } catch (error: any) {
      console.error("Failed to save department:", error);
      toast.error(error.response?.data?.message || t('error.generic'));
    } finally {
      setSubmitting(false);
    }
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!deletingDepartment) return;

    setSubmitting(true);
    try {
      await api.delete(`/departments/${deletingDepartment.id}`);
      toast.success(t('department.deleted'));
      setIsDeleteModalOpen(false);
      setDeletingDepartment(null);
      fetchDepartments(false);
    } catch (error: any) {
      console.error("Failed to delete department:", error);
      toast.error(error.response?.data?.message || t('error.generic'));
    } finally {
      setSubmitting(false);
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('department.title')}
          </h2>
          <button
            onClick={handleCreate}
            className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-300 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('department.create')}
          </button>
        </div>

        {/* Search */}
        <div className="mb-4 relative max-w-md">
          <input
            type="text"
            placeholder={t('search.placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 pl-4 ${isSupported ? 'pr-10' : 'pr-4'} py-2 text-sm text-gray-900 dark:text-neutral-200 focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:outline-none`}
          />
          {isSupported && (
            <button
              onClick={startListening}
              className={`absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors ${isListening ? "text-red-500 animate-pulse" : ""
                }`}
              title="Click to speak"
            >
              <Mic size={16} />
            </button>
          )}
        </div>

        {/* Department Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
                <thead className="bg-gray-50 dark:bg-neutral-800 text-xs uppercase text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-neutral-800">
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
                      className="border-b border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                        {dept.code}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {dept.name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs truncate text-gray-700 dark:text-gray-300">
                          {dept.description || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {dept.manager_name ? (
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {dept.manager_name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {dept.manager_code}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">{t('label.none')}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {dept.employee_count || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {dept.is_active ? (
                          <span className="inline-flex rounded-full bg-red-600 px-2 py-1 text-xs font-medium text-white">
                            {t('status.active')}
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-gray-100 dark:bg-neutral-700 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-300">
                            {t('status.inactive')}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(dept)}
                            className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-900/20"
                            title={t('button.edit')}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => toggleDepartmentStatus(dept)}
                            className={`px-2 py-1 text-xs font-medium rounded-lg transition-colors ${dept.is_active
                              ? 'text-orange-600 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-900/20'
                              : 'text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20'
                              }`}
                          >
                            {dept.is_active ? t('button.deactivate') : t('button.activate')}
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
          <div className="rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {departments.length}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{t('department.list')}</div>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm">
            <div className="text-2xl font-bold text-red-600 dark:text-red-500">
              {departments.filter((d) => d.is_active).length}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{t('status.active')}</div>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm">
            <div className="text-2xl font-bold text-red-600 dark:text-red-500">
              {departments.reduce((sum, d) => sum + (Number(d.employee_count) || 0), 0)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{t('user.list')}</div>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-neutral-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingDepartment ? t('department.edit') : t('department.create')}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('department.code')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:outline-none"
                  placeholder="VD: PROD, QA, MA..."
                  disabled={!!editingDepartment}
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('department.name')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:outline-none"
                  placeholder={t('department.name')}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('department.description')}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:outline-none resize-none"
                  placeholder={t('department.description')}
                />
              </div>

              {/* Parent Department */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('department.parent')}
                </label>
                <select
                  value={formData.parent_id}
                  onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:outline-none"
                >
                  <option value="">{t('label.none')}</option>
                  {departments
                    .filter(d => d.id !== editingDepartment?.id)
                    .map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))
                  }
                </select>
              </div>

              {/* Manager */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('department.manager')}
                </label>
                <select
                  value={formData.manager_id}
                  onChange={(e) => setFormData({ ...formData, manager_id: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:outline-none"
                >
                  <option value="">{t('label.none')}</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.full_name} ({u.employee_code})</option>
                  ))}
                </select>
              </div>

              {/* Buttons */}
              <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-neutral-800">
                {/* Delete button - only show in edit mode */}
                {editingDepartment ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      handleDeleteClick(editingDepartment);
                    }}
                    className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Trash2 size={16} />
                    {t('button.delete')}
                  </button>
                ) : (
                  <div></div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                  >
                    {t('button.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? t('button.saving') : (editingDepartment ? t('button.update') : t('button.create'))}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && deletingDepartment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-center text-gray-900 dark:text-white mb-2">
                {t('department.delete_confirm')}
              </h3>
              <p className="text-sm text-center text-gray-600 dark:text-gray-400 mb-6">
                {t('department.delete_warning')} <strong>{deletingDepartment.name}</strong>?
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setDeletingDepartment(null);
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
    </>
  );
}

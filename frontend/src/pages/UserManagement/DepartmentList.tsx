import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";
import PageBreadCrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";

interface Department {
  id: number;
  name: string;
  code: string;
  description: string | null;
  manager_id: number | null;
  manager?: {
    id: number;
    full_name: string;
    employee_code: string;
  };
  is_active: boolean;
  created_at: string;
  _count?: {
    users: number;
  };
}

export default function DepartmentList() {
  const { canManageUsers } = useAuth();
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
      await api.patch(`/departments/${deptId}`, { is_active: !currentStatus });
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
        title="Department Management | SmartFactory CONNECT" 
        description="Quản lý phòng ban"
      />
      <div className="mx-auto w-full max-w-screen-2xl">
        <PageBreadCrumb pageTitle="Department Management" />

        {/* Header & Filters */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Quản lý phòng ban
          </h2>
          <button className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 focus:outline-none focus:ring-4 focus:ring-brand-300 dark:focus:ring-brand-800">
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
            Thêm phòng ban
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc mã phòng ban..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-brand-500 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>

        {/* Department Table */}
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Đang tải...</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-800 dark:text-gray-400">
                  <tr>
                    <th className="px-6 py-3">Mã</th>
                    <th className="px-6 py-3">Tên phòng ban</th>
                    <th className="px-6 py-3">Mô tả</th>
                    <th className="px-6 py-3">Quản lý</th>
                    <th className="px-6 py-3">Số nhân viên</th>
                    <th className="px-6 py-3">Trạng thái</th>
                    <th className="px-6 py-3">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDepartments.map((dept) => (
                    <tr
                      key={dept.id}
                      className="border-b border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800"
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
                        {dept.manager ? (
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {dept.manager.full_name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {dept.manager.employee_code}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">Chưa có</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {dept._count?.users || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {dept.is_active ? (
                          <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-300">
                            Hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                            Vô hiệu
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              toggleDepartmentStatus(dept.id, dept.is_active)
                            }
                            className="text-brand-600 hover:underline dark:text-brand-500"
                          >
                            {dept.is_active ? "Vô hiệu" : "Kích hoạt"}
                          </button>
                          <span className="text-gray-300">|</span>
                          <button className="text-gray-600 hover:underline dark:text-gray-400">
                            Chỉnh sửa
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
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {departments.length}
            </div>
            <div className="text-sm text-gray-500">Tổng phòng ban</div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <div className="text-2xl font-bold text-green-600">
              {departments.filter((d) => d.is_active).length}
            </div>
            <div className="text-sm text-gray-500">Đang hoạt động</div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <div className="text-2xl font-bold text-brand-600">
              {departments.reduce((sum, d) => sum + (d._count?.users || 0), 0)}
            </div>
            <div className="text-sm text-gray-500">Tổng nhân viên</div>
          </div>
        </div>
      </div>
    </>
  );
}

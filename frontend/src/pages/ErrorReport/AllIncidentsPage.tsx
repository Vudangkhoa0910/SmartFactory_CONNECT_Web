import React, { useState, useMemo } from "react";
import {
  LayoutGrid,
  List,
  Plus,
  Search,
  ChevronsUpDown,
  MoreHorizontal,
  Box,
  CheckCircle,
  PauseCircle,
  PlayCircle,
  XCircle,
  FileClock,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";

/* ============================================================
   1. TYPES & DỮ LIỆU
============================================================ */

type Status =
  | "Mới"
  | "Đã tiếp nhận"
  | "Đang xử lý"
  | "Tạm dừng"
  | "Hoàn thành"
  | "Đã đóng";
type Priority = "Critical" | "High" | "Normal" | "Low";

interface Incident {
  id: string;
  title: string;
  priority: Priority;
  status: Status;
  assignedTo: string;
  location: string;
  createdAt: Date;
}

const ALL_INCIDENTS_DATA: Incident[] = [
  {
    id: "INC-101",
    title: "Hỏng cảm biến nhiệt lò hơi số 2",
    priority: "Critical",
    status: "Đang xử lý",
    assignedTo: "Tổ MA",
    location: "Xưởng A, Line 3",
    createdAt: new Date(Date.now() - 1 * 3600000),
  },
  {
    id: "INC-102",
    title: "Cần thay thế vòng bi máy dập A",
    priority: "High",
    status: "Tạm dừng",
    assignedTo: "Tổ MA",
    location: "Xưởng B, Line 1",
    createdAt: new Date(Date.now() - 5 * 3600000),
  },
  {
    id: "INC-103",
    title: "Lỗi phần mềm điều khiển PLC",
    priority: "High",
    status: "Đã tiếp nhận",
    assignedTo: "",
    location: "Xưởng A, Line 2",
    createdAt: new Date(Date.now() - 10 * 3600000),
  },
  {
    id: "INC-104",
    title: "Yêu cầu bảo trì định kỳ máy cắt",
    priority: "Normal",
    status: "Mới",
    assignedTo: "",
    location: "Xưởng C",
    createdAt: new Date(Date.now() - 24 * 3600000),
  },
  {
    id: "INC-105",
    title: "Sửa chữa hệ thống băng tải",
    priority: "High",
    status: "Hoàn thành",
    assignedTo: "Tổ Cơ điện",
    location: "Kho vận",
    createdAt: new Date(Date.now() - 48 * 3600000),
  },
  {
    id: "INC-106",
    title: "Rò rỉ dầu thủy lực máy nén",
    priority: "Critical",
    status: "Đang xử lý",
    assignedTo: "Tổ MA",
    location: "Xưởng B, Line 2",
    createdAt: new Date(Date.now() - 2 * 3600000),
  },
  {
    id: "INC-107",
    title: "Kiểm tra hệ thống PCCC",
    priority: "Normal",
    status: "Đã đóng",
    assignedTo: "Đội An toàn",
    location: "Toàn nhà máy",
    createdAt: new Date(Date.now() - 120 * 3600000),
  },
];

const KANBAN_COLUMNS: Status[] = [
  "Mới",
  "Đã tiếp nhận",
  "Đang xử lý",
  "Tạm dừng",
  "Hoàn thành",
  "Đã đóng",
];

/* ============================================================
    BADGE PRIORITY
============================================================ */

const PriorityBadge = ({ priority }: { priority: Priority }) => {
  const styles: Record<Priority, string> = {
    Critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
    High: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
    Normal: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
    Low: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100",
  };
  return (
    <span
      className={`px-2 py-0.5 text-xs font-semibold rounded-full ${styles[priority]}`}
    >
      {priority}
    </span>
  );
};

/* ============================================================
    BADGE STATUS
============================================================ */

const StatusBadge = ({ status }: { status: Status }) => {
  const styles: Record<Status, string> = {
    Mới: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    "Đã tiếp nhận":
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    "Đang xử lý": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    "Tạm dừng":
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    "Hoàn thành":
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    "Đã đóng":
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 line-through",
  };
  return (
    <span
      className={`px-2 py-1 text-xs font-medium rounded-md inline-flex items-center gap-1.5 ${styles[status]}`}
    >
      {status}
    </span>
  );
};

/* ============================================================
    KANBAN CARD
============================================================ */

function KanbanCard({ incident }: { incident: Incident }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: incident.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      className="bg-white dark:bg-slate-800 p-3 rounded-md shadow-sm border border-slate-200 dark:border-slate-700"
    >
      <div className="flex justify-between items-start mb-2">
        <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">
          {incident.title}
        </p>
        <PriorityBadge priority={incident.priority} />
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
        {incident.location}
      </p>

      {incident.assignedTo && (
        <div className="text-xs text-slate-600 dark:text-slate-300 font-medium bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded w-fit">
          👤 {incident.assignedTo}
        </div>
      )}
    </div>
  );
}

/* ============================================================
    KANBAN COLUMN
============================================================ */

function KanbanColumn({
  title,
  incidents,
}: {
  title: Status;
  incidents: Incident[];
}) {
  const columnIcons: Record<Status, React.ReactElement> = {
    Mới: <Box size={16} className="text-gray-500" />,
    "Đã tiếp nhận": <FileClock size={16} className="text-yellow-500" />,
    "Đang xử lý": <PlayCircle size={16} className="text-red-500" />,
    "Tạm dừng": <PauseCircle size={16} className="text-purple-500" />,
    "Hoàn thành": <CheckCircle size={16} className="text-green-500" />,
    "Đã đóng": <XCircle size={16} className="text-slate-500" />,
  };

  return (
    <div className="flex-shrink-0 w-72 bg-slate-100 dark:bg-slate-900 rounded-lg">
      <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
        <div className="flex items-center gap-2">
          {columnIcons[title]}
          <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-200">
            {title}
          </h3>
        </div>
        <span className="text-xs font-bold text-slate-500 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 rounded-full px-2 py-0.5">
          {incidents.length}
        </span>
      </div>

      <SortableContext
        items={incidents.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="p-2 space-y-2 h-[calc(100vh-250px)] overflow-y-auto">
          {incidents.map((incident) => (
            <KanbanCard key={incident.id} incident={incident} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

/* ============================================================
    TABLE CONFIG
============================================================ */

const columnHelper = createColumnHelper<Incident>();

const columns = [
  columnHelper.accessor("id", {
    header: "ID",
    cell: (info) => (
      <span className="font-mono text-xs">{info.getValue()}</span>
    ),
  }),

  columnHelper.accessor("title", {
    header: "Tiêu đề",
    cell: (info) => <span className="font-semibold">{info.getValue()}</span>,
  }),

  columnHelper.accessor("status", {
    header: "Trạng thái",
    cell: (info) => <StatusBadge status={info.getValue()} />,
  }),

  columnHelper.accessor("priority", {
    header: "Ưu tiên",
    cell: (info) => <PriorityBadge priority={info.getValue()} />,
  }),

  columnHelper.accessor("assignedTo", {
    header: "Phòng ban xử lý",
    cell: (info) => info.getValue() || "N/A",
  }),

  columnHelper.accessor("location", {
    header: "Vị trí",
  }),

  columnHelper.accessor("createdAt", {
    header: "Ngày tạo",
    cell: (info) => info.getValue().toLocaleDateString("vi-VN"),
  }),

  columnHelper.display({
    id: "actions",
    cell: () => (
      <button className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700">
        <MoreHorizontal size={16} />
      </button>
    ),
  }),
];

/* ============================================================
    LIST VIEW TABLE
============================================================ */

function ListView({ data }: { data: Incident[] }) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">
      <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
        <thead className="text-xs text-slate-700 dark:text-slate-200 uppercase bg-slate-50 dark:bg-slate-800">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="p-4">
                  <div
                    className={`flex items-center gap-2 cursor-pointer ${
                      header.column.getCanSort() ? "select-none" : ""
                    }`}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}

                    {{
                      asc: (
                        <ChevronsUpDown size={14} className="text-red-500" />
                      ),
                      desc: (
                        <ChevronsUpDown size={14} className="text-red-500" />
                      ),
                    }[header.column.getIsSorted() as string] ??
                      (header.column.getCanSort() ? (
                        <ChevronsUpDown size={14} className="opacity-30" />
                      ) : null)}
                  </div>
                </th>
              ))}
            </tr>
          ))}
        </thead>

        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="bg-white dark:bg-slate-900 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="p-4 align-middle">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ============================================================
    MAIN PAGE
============================================================ */

export default function AllIncidentsPage() {
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [incidents, setIncidents] = useState<Incident[]>(ALL_INCIDENTS_DATA);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const activeIncident = incidents.find((i) => i.id === active.id);
      const overContainerId = over.id;

      let newStatus: Status | undefined;
      KANBAN_COLUMNS.forEach((col) => {
        const itemsInCol = incidents.filter((i) => i.status === col);
        if (
          itemsInCol.some((i) => i.id === overContainerId) ||
          col === overContainerId
        ) {
          newStatus = col;
        }
      });

      if (activeIncident && newStatus && activeIncident.status !== newStatus) {
        setIncidents((prev) =>
          prev.map((i) =>
            i.id === active.id ? { ...i, status: newStatus as Status } : i
          )
        );
      } else {
        setIncidents((items) => {
          const oldIndex = items.findIndex((i) => i.id === active.id);
          const newIndex = items.findIndex((i) => i.id === over.id);
          return arrayMove(items, oldIndex, newIndex);
        });
      }
    }
  };

  const kanbanData = useMemo(() => {
    return KANBAN_COLUMNS.reduce((acc, status) => {
      acc[status] = incidents.filter((i) => i.status === status);
      return acc;
    }, {} as Record<Status, Incident[]>);
  }, [incidents]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 sm:p-6 md:p-8 font-sans">
      <div className="max-w-full mx-auto">
        {/* TOOLBAR */}
        <header className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                Quản lý Sự cố
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                Theo dõi, điều phối và tra cứu toàn bộ sự cố.
              </p>
            </div>

            <div className="flex items-center gap-2 mt-4 md:mt-0">
              {/* SEARCH BOX */}
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Tìm kiếm sự cố..."
                  className="pl-10 pr-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md 
                  bg-white dark:bg-slate-800
                  text-slate-700 dark:text-slate-200 
                  focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              {/* VIEW MODE TOGGLE */}
              <div className="bg-slate-200 dark:bg-slate-700 p-1 rounded-md flex items-center">
                <button
                  onClick={() => setViewMode("kanban")}
                  className={`px-3 py-1 text-sm font-semibold rounded flex items-center gap-1.5
                    ${
                      viewMode === "kanban"
                        ? "bg-white dark:bg-slate-900 text-red-600 shadow-sm"
                        : "text-slate-600 dark:text-slate-300"
                    }`}
                >
                  <LayoutGrid size={16} /> Kanban
                </button>

                <button
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-1 text-sm font-semibold rounded flex items-center gap-1.5
                    ${
                      viewMode === "list"
                        ? "bg-white dark:bg-slate-900 text-red-600 shadow-sm"
                        : "text-slate-600 dark:text-slate-300"
                    }`}
                >
                  <List size={16} /> Danh sách
                </button>
              </div>

              {/* CREATE BUTTON */}
              <button
                className="flex items-center gap-2 px-4 py-2
                bg-red-600 text-white rounded-md hover:bg-red-700
                text-sm font-semibold shadow-sm transition-colors"
              >
                <Plus size={16} /> Tạo sự cố
              </button>
            </div>
          </div>
        </header>

        {/* MAIN VIEW */}
        <main>
          {viewMode === "kanban" ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <div className="flex gap-4 overflow-x-auto pb-4">
                {KANBAN_COLUMNS.map((status) => (
                  <KanbanColumn
                    key={status}
                    title={status}
                    incidents={kanbanData[status]}
                  />
                ))}
              </div>
            </DndContext>
          ) : (
            <ListView data={incidents} />
          )}
        </main>
      </div>
    </div>
  );
}

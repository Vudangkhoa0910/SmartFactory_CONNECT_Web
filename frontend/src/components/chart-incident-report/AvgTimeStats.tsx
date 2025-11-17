export default function AvgTimeStats() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="rounded-2xl p-5 bg-white border dark:bg-gray-900 dark:border-gray-800">
        <p className="text-sm text-gray-500">Thời gian phản hồi TB</p>
        <h3 className="text-2xl font-bold mt-2 text-gray-900 dark:text-white">
          12 phút
        </h3>
      </div>

      <div className="rounded-2xl p-5 bg-white border dark:bg-gray-900 dark:border-gray-800">
        <p className="text-sm text-gray-500">Thời gian xử lý TB</p>
        <h3 className="text-2xl font-bold mt-2 text-gray-900 dark:text-white">
          48 phút
        </h3>
      </div>
    </div>
  );
}

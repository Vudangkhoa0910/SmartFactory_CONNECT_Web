interface Props {
  item: any;
  onDelete: (id: string) => void;
}

export default function NewsCard({ item, onDelete }: Props) {
  return (
    <div className="border p-4 rounded-xl flex justify-between dark:border-gray-600">
      <div>
        <h3 className="font-semibold">{item.title}</h3>
        <p className="text-sm opacity-70">{item.excerpt}</p>
      </div>

      <button
        onClick={() => onDelete(item.id)}
        className="text-red-600 hover:text-red-800"
      >
        Xoá
      </button>
    </div>
  );
}

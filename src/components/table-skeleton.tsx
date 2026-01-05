type ColumnSkeleton = {
  /** 列类型 */
  type?: "text" | "icon" | "action";
  /** grid-template-columns 的宽度 */
  width: string;
  /** 文本行数（仅 text 生效） */
  lines?: number;
};

interface TableSkeletonProps {
  rows?: number;
  columns: ColumnSkeleton[];
  showHeader?: boolean;
}

function SkeletonCell({type = "text", lines = 1,}: {
  type?: "text" | "icon" | "action";
  lines?: number;
}) {
  if (type === "icon") {
    return (
      <div className="flex justify-center">
        <div className="w-6 h-6 bg-gray-200 rounded-full" />
      </div>
    );
  }

  if (type === "action") {
    return (
      <div className="flex justify-end">
        <div className="h-6 w-12 bg-gray-200 rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`h-3 bg-gray-200 rounded ${
            i === lines - 1 ? "w-2/3" : "w-full"
          }`}
        />
      ))}
    </div>
  );
}

export default function TableSkeleton({rows = 6, columns, showHeader = true}: TableSkeletonProps) {
  const gridTemplate = columns.map(c => c.width).join(" ");

  return (
    <div className="p-3 space-y-4 animate-pulse">
      {/* 表格 */}
      <div className="bg-white rounded-lg overflow-hidden">
        {/* 表头 */}
        {showHeader && (
          <div
            className="grid px-3 py-2 border-b"
            style={{ gridTemplateColumns: gridTemplate }}
          >
            {columns.map((_, i) => (
              <div key={i} className="h-3 w-16 bg-gray-200 rounded" />
            ))}
          </div>
        )}

        {/* 行骨架 */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="grid px-3 py-3 border-b items-center"
            style={{ gridTemplateColumns: gridTemplate }}
          >
            {columns.map((col, colIndex) => (
              <SkeletonCell key={colIndex} {...col} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

"use client"

import * as React from "react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type Row,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"
import { toast } from "sonner"
import { z } from "zod"

import { useIsMobile } from "@/hooks/use-mobile"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { GripVerticalIcon, CircleCheckIcon, LoaderIcon, EllipsisVerticalIcon, Columns3Icon, ChevronDownIcon, ChevronsLeftIcon, ChevronLeftIcon, ChevronRightIcon, ChevronsRightIcon } from "lucide-react"
import { updateShiftSummary } from "@/lib/actions/clock"

export const shiftSchema = z.object({
  id: z.string(),
  clock_in: z.string(),
  clock_out: z.string().nullable(),
  total_active_time: z.string().nullable(),
  total_break_time: z.string().nullable(),
  status: z.string(),
  summary: z.string().nullable(),
})

type ShiftRecord = z.infer<typeof shiftSchema>

function formatPostgresInterval(intervalStr: string | null): string {
  if (!intervalStr) return "00:00:00"
  // Format can be: "08:30:00" or similar
  const parts = intervalStr.split(":")
  if (parts.length < 2) return intervalStr
  const hrs = parseInt(parts[0], 10) || 0
  const mins = parseInt(parts[1], 10) || 0
  
  if (hrs > 0) {
    return `${hrs}h ${mins}m`
  }
  return `${mins}m`
}

function DragHandle({ id }: { id: string }) {
  const { attributes, listeners } = useSortable({
    id,
  })

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="size-7 text-muted-foreground hover:bg-transparent cursor-grab active:cursor-grabbing"
    >
      <GripVerticalIcon className="size-3 text-muted-foreground" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  )
}

const columns: ColumnDef<ShiftRecord>[] = [
  {
    id: "drag",
    header: () => null,
    cell: ({ row }) => <DragHandle id={row.original.id} />,
  },
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "clock_in",
    header: "Shift Date",
    cell: ({ row }) => {
      return <TableCellViewer item={row.original} />
    },
    enableHiding: false,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status
      return (
        <Badge
          variant="outline"
          className={`px-1.5 font-medium gap-1.5 ${
            status === "completed"
              ? "border border-green-500/30 text-green-600 dark:text-green-400 bg-transparent"
              : status === "on_break"
              ? "border-l-2 border-l-amber-500 text-amber-400 bg-amber-950/20"
              : "border-l-2 border-l-blue-500 text-blue-400 bg-blue-950/20"
          }`}
        >
          {status === "completed" ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="none" className="size-3.5 fill-green-500 dark:fill-green-400"><path d="M17 3.34a10 10 0 1 1 -14.995 8.984l-.005 -.324l.005 -.324a10 10 0 0 1 14.995 -8.336zm-1.293 5.953a1 1 0 0 0 -1.32 -.083l-.094 .083l-3.293 3.292l-1.293 -1.292l-.094 -.083a1 1 0 0 0 -1.403 1.403l.083 .094l2 2l.094 .083a1 1 0 0 0 1.226 0l.094 -.083l4 -4l.083 -.094a1 1 0 0 0 -.083 -1.32z"></path></svg>
          ) : (
            <LoaderIcon className="size-3 animate-spin" />
          )}
          <span className="capitalize">{status.replace("_", " ")}</span>
        </Badge>
      )
    },
  },
  {
    accessorKey: "total_active_time",
    header: "Active Time",
    cell: ({ row }) => (
      <span className="text-sm text-ink-muted">
        {row.original.status === "completed"
          ? formatPostgresInterval(row.original.total_active_time)
          : "Active Shift"}
      </span>
    ),
  },
  {
    accessorKey: "total_break_time",
    header: "Break Time",
    cell: ({ row }) => (
      <span className="text-sm text-ink-muted">
        {row.original.status === "completed"
          ? formatPostgresInterval(row.original.total_break_time)
          : "N/A"}
      </span>
    ),
  },
  {
    accessorKey: "summary",
    header: "Summary/Recap",
    cell: ({ row }) => (
      <div className="max-w-[200px] truncate text-sm text-ink-muted">
        {row.original.summary || "No summary provided."}
      </div>
    ),
  },
  {
    id: "actions",
    cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex size-8 text-muted-foreground data-[state=open]:bg-muted"
            size="icon"
          >
            <EllipsisVerticalIcon className="size-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-32 bg-surface-2 border border-hairline text-ink">
          <DropdownMenuItem className="cursor-pointer">Edit</DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer">Share</DropdownMenuItem>
          <DropdownMenuSeparator className="bg-hairline" />
          <DropdownMenuItem variant="destructive" className="cursor-pointer text-red-400">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]

function DraggableRow({ row }: { row: Row<ShiftRecord> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  })

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80 bg-surface-1 border-b border-hairline hover:bg-surface-2"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  )
}

export function DataTable({
  data: initialData,
}: {
  data: ShiftRecord[]
}) {
  const [data, setData] = React.useState(() => initialData)
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [activeTab, setActiveTab] = React.useState("all")
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })

  React.useEffect(() => {
    setData(initialData)
  }, [initialData])

  const filteredData = React.useMemo(() => {
    if (activeTab === "completed") {
      return data.filter((s) => s.status === "completed")
    }
    if (activeTab === "active") {
      return data.filter((s) => s.status !== "completed")
    }
    return data
  }, [data, activeTab])

  const completedCount = React.useMemo(() => {
    return data.filter((s) => s.status === "completed").length
  }, [data])

  const activeCount = React.useMemo(() => {
    return data.filter((s) => s.status !== "completed").length
  }, [data])

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => filteredData?.map(({ id }) => id) || [],
    [filteredData]
  )

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      setData((prevData) => {
        const oldIndex = prevData.findIndex((item) => item.id === active.id)
        const newIndex = prevData.findIndex((item) => item.id === over.id)
        return arrayMove(prevData, oldIndex, newIndex)
      })
    }
  }

  const sortableId = React.useId()
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )

  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className="w-full flex-col justify-start gap-6 mt-4"
    >
      <div className="flex items-center justify-between px-4 lg:px-6">
        <Label htmlFor="view-selector" className="sr-only">
          View
        </Label>
        <Select value={activeTab} onValueChange={setActiveTab}>
          <SelectTrigger
            className="flex w-fit @4xl/main:hidden text-ink border-hairline bg-surface-2"
            size="sm"
            id="view-selector"
          >
            <SelectValue placeholder="Select a view" />
          </SelectTrigger>
          <SelectContent className="bg-surface-2 border border-hairline text-ink">
            <SelectGroup>
              <SelectItem value="all">All Shifts</SelectItem>
              <SelectItem value="completed">Completed Shifts</SelectItem>
              <SelectItem value="active">Active Shifts</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <TabsList className="hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex bg-surface-2 text-ink-subtle">
          <TabsTrigger value="all">All Shifts</TabsTrigger>
          <TabsTrigger value="completed">
            Completed <Badge variant="secondary" className="bg-green-950 text-green-400 ml-1.5">{completedCount}</Badge>
          </TabsTrigger>
          <TabsTrigger value="active">
            Active Shifts <Badge variant="secondary" className="bg-blue-950 text-blue-400 ml-1.5">{activeCount}</Badge>
          </TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="text-ink border-hairline bg-surface-2 hover:bg-surface-3 cursor-pointer">
                <Columns3Icon className="size-4 mr-1.5" />
                Columns
                <ChevronDownIcon className="size-4 ml-1.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32 bg-surface-2 border border-hairline text-ink">
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== "undefined" &&
                    column.getCanHide()
                )
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize cursor-pointer"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id.replace("_", " ")}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <TabsContent
        value={activeTab}
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6 mt-4"
      >
        <div className="overflow-hidden rounded-lg border border-hairline bg-surface-1">
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
            id={sortableId}
          >
            <Table>
              <TableHeader className="bg-surface-2 border-b border-hairline">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="border-b border-hairline hover:bg-transparent">
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id} colSpan={header.colSpan} className="text-ink font-semibold">
                          {header.isPlaceholder
                             ? null
                             : flexRender(
                                 header.column.columnDef.header,
                                 header.getContext()
                               )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody className="**:data-[slot=table-cell]:first:w-8">
                {table.getRowModel().rows?.length ? (
                  <SortableContext
                    items={dataIds}
                    strategy={verticalListSortingStrategy}
                  >
                    {table.getRowModel().rows.map((row) => (
                      <DraggableRow key={row.id} row={row} />
                    ))}
                  </SortableContext>
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center text-ink-muted"
                    >
                      No shifts found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
        </div>
        <div className="flex items-center justify-between px-4">
          <div className="hidden flex-1 text-sm text-ink-subtle lg:flex">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} shift(s) selected.
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium text-ink-muted">
                Rows per page
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value))
                }}
              >
                <SelectTrigger size="sm" className="w-20 text-ink border-hairline bg-surface-2" id="rows-per-page">
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />
                </SelectTrigger>
                <SelectContent side="top" className="bg-surface-2 border border-hairline text-ink">
                  <SelectGroup>
                    {[10, 20, 30, 40, 50].map((pageSize) => (
                      <SelectItem key={pageSize} value={`${pageSize}`}>
                        {pageSize}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium text-ink-muted">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount() || 1}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 text-ink border-hairline bg-surface-2 hover:bg-surface-3 cursor-pointer"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <ChevronsLeftIcon className="size-4" />
              </Button>
              <Button
                variant="outline"
                className="size-8 text-ink border-hairline bg-surface-2 hover:bg-surface-3 cursor-pointer"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <ChevronLeftIcon className="size-4" />
              </Button>
              <Button
                variant="outline"
                className="size-8 text-ink border-hairline bg-surface-2 hover:bg-surface-3 cursor-pointer"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <ChevronRightIcon className="size-4" />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex text-ink border-hairline bg-surface-2 hover:bg-surface-3 cursor-pointer"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <ChevronsRightIcon className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}

function TableCellViewer({ item }: { item: ShiftRecord }) {
  const isMobile = useIsMobile()
  const [summary, setSummary] = React.useState(item.summary || "")
  const [isPending, startTransition] = React.useTransition()

  const formattedDate = new Date(item.clock_in).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const res = await updateShiftSummary(item.id, summary)
      if (res?.error) {
        toast.error(`Error: ${res.error}`)
      } else {
        toast.success("Shift summary updated successfully")
      }
    })
  }

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button variant="link" className="w-fit px-0 text-left text-primary hover:text-primary-hover hover:underline cursor-pointer">
          {new Date(item.clock_in).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </Button>
      </DrawerTrigger>
      <DrawerContent className="bg-surface-1 border border-hairline text-ink h-full max-h-[85vh] md:max-h-full md:w-[400px]">
        <DrawerHeader className="gap-1 border-b border-hairline">
          <DrawerTitle className="text-ink">Shift Details</DrawerTitle>
          <DrawerDescription className="text-ink-muted">
            {formattedDate}
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-6 overflow-y-auto px-6 py-4 text-sm flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold text-ink-subtle uppercase">Clock In</Label>
              <div className="text-ink mt-1 font-mono text-xs">
                {new Date(item.clock_in).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" })}
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold text-ink-subtle uppercase">Clock Out</Label>
              <div className="text-ink mt-1 font-mono text-xs">
                {item.clock_out
                  ? new Date(item.clock_out).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" })
                  : "Active Shift"}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold text-ink-subtle uppercase">Active Work Time</Label>
              <div className="text-ink mt-1 font-mono">
                {formatPostgresInterval(item.total_active_time)}
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold text-ink-subtle uppercase">Break Time</Label>
              <div className="text-ink mt-1 font-mono">
                {formatPostgresInterval(item.total_break_time)}
              </div>
            </div>
          </div>

          <hr className="border-hairline" />

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 flex-1">
            <div className="flex flex-col gap-3">
              <Label htmlFor="summary-input" className="text-ink font-semibold">Shift Recap / Summary</Label>
              <textarea
                id="summary-input"
                className="w-full min-h-[120px] bg-surface-2 text-ink p-sm rounded-md border border-hairline focus:outline-2 focus:outline-primary-focus focus:border-transparent placeholder:text-ink-tertiary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="List key tasks completed, tickets resolved..."
              />
            </div>
            <div className="mt-auto pt-4 border-t border-hairline flex gap-2 justify-end">
              <Button type="submit" disabled={isPending} className="bg-primary hover:bg-primary-hover text-ink cursor-pointer">
                {isPending ? "Saving..." : "Save Changes"}
              </Button>
              <DrawerClose asChild>
                <Button variant="outline" className="border-hairline text-ink hover:bg-surface-2 hover:text-ink cursor-pointer">
                  Close
                </Button>
              </DrawerClose>
            </div>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

'use client'

import * as React from 'react'
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
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table'
import {
  Plus,
  X,
  Loader2,
  UserCheck,
  UserX,
  Edit2,
  ShieldCheck,
  Shield,
  Search,
  Columns3,
  ChevronDown,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Trash2,
} from 'lucide-react'
import { createUser, toggleUserStatus, updateUserPayRate, deleteUser } from '@/lib/actions/admin'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface UserProfile {
  id: string
  legal_full_name: string
  email: string
  role: string
  status: string
  pay_rate: number | null
  timezone: string | null
  whop_username: string | null
  discord_username: string | null
  created_at: string
}

interface AdminUsersClientProps {
  users: UserProfile[]
  currentUserId: string
}

interface PayRateCellProps {
  user: UserProfile
  onSave: (rate: number) => Promise<void>
  isPending: boolean
}

function PayRateCell({
  user,
  onSave,
  isPending,
}: PayRateCellProps) {
  const [val, setVal] = React.useState(String(user.pay_rate ?? 0))
  const [isOpen, setIsOpen] = React.useState(false)

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open) {
      setVal(String(user.pay_rate ?? 0))
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          className="flex items-center gap-1 text-sm text-ink-muted hover:text-ink cursor-pointer bg-transparent border-0 p-0 focus:outline-hidden"
        >
          <Edit2 className="h-3 w-3" />
          ${Number(user.pay_rate ?? 0).toFixed(2)}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3 bg-surface-1 border border-hairline text-ink" align="start" onClick={(e) => e.stopPropagation()}>
        <div className="space-y-xs">
          <div className="font-semibold text-caption text-ink-subtle uppercase tracking-wider">
            Edit Monthly Pay
          </div>
          <div className="flex items-center gap-xs">
            <span className="text-ink-subtle text-sm">$</span>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={val}
              onChange={(e) => setVal(e.target.value)}
              className="flex-1 bg-surface-2 text-ink h-8"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-xs">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-xs h-7 px-2.5 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={isPending}
              onClick={async () => {
                const rate = parseFloat(val)
                if (!isNaN(rate) && rate >= 0) {
                  await onSave(rate)
                  setIsOpen(false)
                }
              }}
              className="text-xs h-7 px-2.5 bg-primary text-primary-foreground hover:bg-primary-hover cursor-pointer"
            >
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save'}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default function AdminUsersClient({ users: initialUsers, currentUserId }: AdminUsersClientProps) {
  "use no memo";
  const [data, setData] = React.useState(() => initialUsers)
  const [isPending, startTransition] = React.useTransition()
  const [showCreateModal, setShowCreateModal] = React.useState(false)
  const [userToDelete, setUserToDelete] = React.useState<UserProfile | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [globalSearch, setGlobalSearch] = React.useState('')

  // Create form state
  const [newEmail, setNewEmail] = React.useState('')
  const [newPassword, setNewPassword] = React.useState('')
  const [newName, setNewName] = React.useState('')
  const [newRole, setNewRole] = React.useState<'moderator' | 'admin' | 'manager'>('moderator')
  const [newPayRate, setNewPayRate] = React.useState('')
  const [createError, setCreateError] = React.useState<string | null>(null)

  // Sync data on prop change
  React.useEffect(() => {
    setData(initialUsers)
  }, [initialUsers])

  const openCreateModal = () => {
    setNewEmail(''); setNewPassword(''); setNewName(''); setNewRole('moderator'); setNewPayRate(''); setCreateError(null)
    setShowCreateModal(true)
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError(null)
    const payRate = parseFloat(newPayRate)
    if (isNaN(payRate) || payRate < 0) { setCreateError('Enter a valid pay rate (0 or higher).'); return }
    startTransition(async () => {
      const res = await createUser({ email: newEmail, password: newPassword, legal_full_name: newName, role: newRole, pay_rate: payRate })
      if (res?.error) setCreateError(res.error)
      else setShowCreateModal(false)
    })
  }

  const handleToggleStatus = React.useCallback((userId: string, currentStatus: string) => {
    startTransition(async () => {
      const res = await toggleUserStatus(userId, currentStatus)
      if (res?.error) setError(res.error)
    })
  }, [])

  const handleDelete = React.useCallback(() => {
    if (!userToDelete) return
    startTransition(async () => {
      const res = await deleteUser(userToDelete.id)
      if (res?.error) {
        setError(res.error)
      } else {
        setUserToDelete(null)
      }
    })
  }, [userToDelete])

  // Filtered dataset for local search
  const filteredData = React.useMemo(() => {
    if (!globalSearch.trim()) return data
    const query = globalSearch.toLowerCase()
    return data.filter(
      (u) =>
        u.legal_full_name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        (u.discord_username || '').toLowerCase().includes(query)
    )
  }, [data, globalSearch])

  // TanStack table configs
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })

  const columns = React.useMemo<ColumnDef<UserProfile>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={
                table.getIsAllPageRowsSelected() ||
                (table.getIsSomePageRowsSelected() && 'indeterminate')
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
        accessorKey: 'legal_full_name',
        header: 'Name',
        cell: ({ row }) => {
          const user = row.original
          return (
            <div className="flex items-center gap-sm">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold ${
                user.role === 'admin'
                  ? 'bg-primary/20 text-primary'
                  : user.role === 'manager'
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'bg-surface-3 text-ink-subtle'
              }`}>
                {user.legal_full_name.charAt(0).toUpperCase()}
              </div>
              <span className="font-medium text-ink text-sm">{user.legal_full_name}</span>
            </div>
          )
        },
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => <span className="text-sm text-ink-muted">{row.original.email}</span>,
      },
      {
        accessorKey: 'role',
        header: 'Role',
        cell: ({ row }) => {
          const user = row.original
          return (
            <Badge variant="outline" className={`gap-1 text-xs border ${
              user.role === 'admin'
                ? 'bg-primary/10 text-primary border-primary/20'
                : user.role === 'manager'
                ? 'bg-purple-950/20 text-purple-400 border-purple-900/30'
                : 'bg-surface-2 text-ink-muted border-hairline'
            }`}>
              {user.role === 'admin' ? <ShieldCheck className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
              {user.role}
            </Badge>
          )
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const user = row.original
          return (
            <Badge variant="outline" className={`text-xs border ${
              user.status === 'active'
                ? 'bg-semantic-success/10 text-semantic-success border-semantic-success/20'
                : 'bg-red-950/20 text-red-400 border-red-900/30'
            }`}>
              {user.status}
            </Badge>
          )
        },
      },
      {
        accessorKey: 'pay_rate',
        header: 'Monthly Pay',
        cell: ({ row }) => {
          const user = row.original
          return (
            <PayRateCell
              user={user}
              onSave={async (rate) => {
                startTransition(async () => {
                  const res = await updateUserPayRate(user.id, rate)
                  if (res?.error) setError(res.error)
                })
              }}
              isPending={isPending}
            />
          )
        },
      },
      {
        id: 'handles',
        header: 'Handles',
        cell: ({ row }) => {
          const user = row.original
          return (
            <div className="text-xs text-ink-subtle space-y-0.5">
              {user.discord_username && <div>Discord: {user.discord_username}</div>}
              {user.whop_username && <div>Whop: {user.whop_username}</div>}
              {!user.discord_username && !user.whop_username && <span className="text-ink-tertiary italic">—</span>}
            </div>
          )
        },
      },
      {
        id: 'actions',
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const user = row.original
          return (
            <div className="text-right flex items-center justify-end gap-2">
              <button
                disabled={isPending}
                onClick={() => handleToggleStatus(user.id, user.status)}
                title={user.status === 'active' ? 'Deactivate user' : 'Activate user'}
                className={`inline-flex items-center gap-1 px-sm py-1 rounded-md border text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 ${
                  user.status === 'active'
                    ? 'bg-red-950/10 hover:bg-red-950/20 text-red-400 border-red-900/30'
                    : 'bg-semantic-success/10 hover:bg-semantic-success/20 text-semantic-success border-semantic-success/30'
                }`}
              >
                {user.status === 'active' ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                {user.status === 'active' ? 'Deactivate' : 'Activate'}
              </button>
              {user.id !== currentUserId && (
                <button
                  disabled={isPending}
                  onClick={() => setUserToDelete(user)}
                  title="Delete user permanently"
                  className="inline-flex items-center gap-1 px-sm py-1 rounded-md border border-red-900/30 bg-red-950/15 hover:bg-red-950/25 text-red-400 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              )}
            </div>
          )
        },
      },
    ],
    [isPending, handleToggleStatus, currentUserId]
  )

  // eslint-disable-next-line react-compiler/react-compiler
  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      pagination,
    },
    getRowId: (row) => row.id,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  const labelClass = 'text-caption font-medium text-ink-subtle uppercase tracking-wider block mb-xxs'

  return (
    <div className="space-y-md">
      {error && (
        <div className="p-sm text-body-sm text-red-400 bg-red-950/20 border border-red-900/50 rounded-md">{error}</div>
      )}

      {/* Tanstack Table Layout in standard Card container */}
      <div className="bg-surface-1 border border-hairline rounded-2xl py-6 shadow-sm flex flex-col gap-4">
        {/* Header Block inside Card */}
        <div className="px-4 lg:px-6 pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-md">
          <div>
            <h3 className="text-lg font-semibold text-ink">User Management</h3>
            <p className="text-sm text-ink-muted mt-0.5">Create, manage, and provision moderator accounts</p>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-xs bg-primary hover:bg-primary-hover text-primary-foreground px-md py-2 rounded-md font-medium text-button transition-colors cursor-pointer shadow-md shrink-0 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" /> Create User
          </button>
        </div>

        {/* Toolbar Block */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-md px-4 lg:px-6">
          <div className="relative w-full sm:w-72">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
            <input
              type="text"
              placeholder="Search users..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="w-full h-10 bg-surface-2 text-ink text-body pl-10 pr-sm py-2 rounded-md border border-hairline focus:outline-2 focus:outline-primary-focus placeholder:text-ink-subtle transition-colors"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="text-ink border-hairline bg-surface-2 hover:bg-surface-3 cursor-pointer shrink-0 w-full sm:w-auto h-10 justify-center">
                <Columns3 className="size-4 mr-1.5" />
                Columns
                <ChevronDown className="size-4 ml-1.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36 bg-surface-2 border border-hairline text-ink">
              {table
                .getAllColumns()
                .filter((column) => typeof column.accessorFn !== 'undefined' && column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize cursor-pointer"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id.replace('_', ' ')}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="px-4 lg:px-6 mt-2">
          <div className="overflow-hidden rounded-lg border border-hairline bg-surface-1">
            <Table>
              <TableHeader className="bg-surface-2 border-b border-hairline">
                {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b border-hairline hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-ink font-semibold">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className={`border-b border-hairline bg-surface-1 hover:bg-surface-2 transition-colors ${
                    row.original.status === 'deactivated' ? 'opacity-50' : ''
                  }`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-ink-muted">
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        </div>
        </div>

        {/* Pagination Section matching Shift history */}
        <div className="flex items-center justify-between px-6 pt-2">
          <div className="hidden flex-1 text-sm text-ink-subtle lg:flex">
            {table.getFilteredSelectedRowModel().rows.length} of{' '}
            {table.getFilteredRowModel().rows.length} user(s) selected.
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium text-ink-muted">
                Rows per page
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => table.setPageSize(Number(value))}
              >
                <SelectTrigger size="sm" className="w-20 text-ink border-hairline bg-surface-2" id="rows-per-page">
                  <SelectValue placeholder={table.getState().pagination.pageSize} />
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
              Page {table.getState().pagination.pageIndex + 1} of{' '}
              {table.getPageCount() || 1}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 text-ink border-hairline bg-surface-2 hover:bg-surface-3 cursor-pointer"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronsLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                className="size-8 text-ink border-hairline bg-surface-2 hover:bg-surface-3 cursor-pointer"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                className="size-8 text-ink border-hairline bg-surface-2 hover:bg-surface-3 cursor-pointer"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <ChevronRight className="size-4" />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex text-ink border-hairline bg-surface-2 hover:bg-surface-3 cursor-pointer"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <ChevronsRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-semantic-overlay flex items-center justify-center p-md">
          <div className="bg-surface-1 border border-hairline rounded-lg w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-lg py-md border-b border-hairline">
              <h3 className="text-subhead font-medium text-ink">Create New User</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-ink-subtle hover:text-ink p-1 rounded-md transition-colors cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-lg space-y-md">
              {createError && (
                <div className="p-sm text-body-sm text-red-400 bg-red-950/20 border border-red-900/50 rounded-md">{createError}</div>
              )}
              <div>
                <label className={labelClass} htmlFor="newName">Legal Full Name</label>
                <Input id="newName" type="text" required value={newName} onChange={(e) => setNewName(e.target.value)} className="bg-surface-2 border-hairline text-ink" placeholder="John Doe" />
              </div>
              <div>
                <label className={labelClass} htmlFor="newEmail">Email Address</label>
                <Input id="newEmail" type="email" required value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="bg-surface-2 border-hairline text-ink" placeholder="user@example.com" />
              </div>
              <div>
                <label className={labelClass} htmlFor="newPassword">Initial Password</label>
                <Input id="newPassword" type="password" minLength={6} required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="bg-surface-2 border-hairline text-ink" placeholder="Min. 6 characters" />
              </div>
              <div className="grid grid-cols-2 gap-md">
                <div>
                  <label className={labelClass} htmlFor="newRole">Role</label>
                  <Select value={newRole} onValueChange={(value) => setNewRole(value as 'moderator' | 'admin' | 'manager')}>
                    <SelectTrigger id="newRole" className="w-full text-ink border-hairline bg-surface-2 mt-1">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent className="bg-surface-2 border border-hairline text-ink">
                      <SelectItem value="moderator">Moderator</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className={labelClass} htmlFor="newPayRate">Monthly Pay ($)</label>
                  <Input id="newPayRate" type="number" step="0.01" min="0" required value={newPayRate} onChange={(e) => setNewPayRate(e.target.value)} className="bg-surface-2 border-hairline text-ink" placeholder="0.00" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-sm pt-md border-t border-hairline">
                <button type="button" onClick={() => setShowCreateModal(false)} disabled={isPending}
                  className="bg-surface-2 hover:bg-surface-3 text-ink px-lg py-2 rounded-md font-medium border border-hairline text-button transition-colors cursor-pointer disabled:opacity-50">
                  Cancel
                </button>
                <button type="submit" disabled={isPending}
                  className="inline-flex items-center gap-xs bg-primary hover:bg-primary-hover text-primary-foreground px-lg py-2 rounded-md font-medium text-button transition-colors cursor-pointer disabled:opacity-50">
                  {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {userToDelete && (
        <Dialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
          <DialogContent className="sm:max-w-md bg-surface-1 border border-hairline text-ink">
            <DialogHeader>
              <DialogTitle className="text-headline font-semibold flex items-center gap-2 text-red-400">
                <Trash2 className="h-5 w-5" />
                Delete User
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-md py-sm">
              <p className="text-sm text-ink-muted leading-relaxed">
                Are you sure you want to permanently delete <strong className="text-ink">{userToDelete.legal_full_name}</strong> (<span className="text-ink-subtle">{userToDelete.email}</span>)?
              </p>
              <div className="p-sm bg-red-950/10 border border-red-900/30 rounded-lg text-xs text-red-400 leading-normal">
                This action is destructive and irreversible. It will cascade delete all associated profiles, shifts, availability, schedules, pay records, and notifications.
              </div>
            </div>
            <div className="flex items-center justify-end gap-sm pt-md border-t border-hairline">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                disabled={isPending}
                className="bg-surface-2 hover:bg-surface-3 text-ink px-lg py-2 rounded-md font-medium border border-hairline text-button transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="inline-flex items-center gap-xs bg-red-950/20 hover:bg-red-950/30 text-red-400 px-lg py-2 rounded-md font-medium text-button border border-red-900/40 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete Permanently
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

// Wrapper dropdown imports to prevent errors
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

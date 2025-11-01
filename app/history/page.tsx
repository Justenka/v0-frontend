"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Search,
  History,
  Users,
  DollarSign,
  UserPlus,
  UserMinus,
  Edit,
  Trash2,
  CheckCircle,
  Shield,
} from "lucide-react"
import { mockActivities, mockGroups } from "@/lib/mock-data"
import { useAuth } from "@/contexts/auth-context"
import type { Activity, ActivityType } from "@/types/activity"
import { formatDistanceToNow } from "date-fns"
import { lt } from "date-fns/locale"

const activityIcons: Record<ActivityType, any> = {
  group_created: Users,
  member_added: UserPlus,
  member_removed: UserMinus,
  expense_added: DollarSign,
  expense_edited: Edit,
  expense_deleted: Trash2,
  payment_registered: CheckCircle,
  settlement: CheckCircle,
  permission_changed: Shield,
}

const activityColors: Record<ActivityType, string> = {
  group_created: "bg-blue-100 text-blue-600",
  member_added: "bg-green-100 text-green-600",
  member_removed: "bg-red-100 text-red-600",
  expense_added: "bg-purple-100 text-purple-600",
  expense_edited: "bg-yellow-100 text-yellow-600",
  expense_deleted: "bg-red-100 text-red-600",
  payment_registered: "bg-green-100 text-green-600",
  settlement: "bg-green-100 text-green-600",
  permission_changed: "bg-orange-100 text-orange-600",
}

export default function HistoryPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [filterGroup, setFilterGroup] = useState<string>("all")
  const [filterType, setFilterType] = useState<string>("all")

  if (!user) {
    router.push("/login")
    return null
  }

  // Filter activities
  const filteredActivities = mockActivities.filter((activity) => {
    const matchesSearch =
      activity.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.userName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesGroup = filterGroup === "all" || activity.groupId === filterGroup
    const matchesType = filterType === "all" || activity.type === filterType
    return matchesSearch && matchesGroup && matchesType
  })

  // Sort by timestamp (newest first)
  const sortedActivities = [...filteredActivities].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

  // Group activities by date
  const groupedActivities = sortedActivities.reduce(
    (acc, activity) => {
      const date = activity.timestamp.toLocaleDateString("lt-LT", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
      if (!acc[date]) {
        acc[date] = []
      }
      acc[date].push(activity)
      return acc
    },
    {} as Record<string, Activity[]>,
  )

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const getGroupName = (groupId?: string) => {
    if (!groupId) return "Sistema"
    const group = mockGroups.find((g) => g.id.toString() === groupId)
    return group?.title || "Nežinoma grupė"
  }

  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <History className="h-8 w-8 text-gray-700" />
          <h1 className="text-3xl font-bold">Sistemos istorija</h1>
        </div>
        <p className="text-gray-600">Peržiūrėkite visą veiklą sistemoje</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Ieškoti veiklos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterGroup} onValueChange={setFilterGroup}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Visos grupės" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Visos grupės</SelectItem>
            {mockGroups.map((group) => (
              <SelectItem key={group.id} value={group.id.toString()}>
                {group.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Visi tipai" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Visi tipai</SelectItem>
            <SelectItem value="group_created">Grupės sukūrimas</SelectItem>
            <SelectItem value="member_added">Narys pridėtas</SelectItem>
            <SelectItem value="member_removed">Narys pašalintas</SelectItem>
            <SelectItem value="expense_added">Išlaida pridėta</SelectItem>
            <SelectItem value="expense_edited">Išlaida redaguota</SelectItem>
            <SelectItem value="expense_deleted">Išlaida ištrinta</SelectItem>
            <SelectItem value="payment_registered">Mokėjimas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-600 mb-4">Rasta {sortedActivities.length} įrašų</p>

      {/* Activity Timeline */}
      <div className="space-y-8">
        {Object.entries(groupedActivities).length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <History className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">Veiklos įrašų nerasta</p>
            </CardContent>
          </Card>
        ) : (
          Object.entries(groupedActivities).map(([date, activities]) => (
            <div key={date}>
              <h3 className="text-sm font-semibold text-gray-500 mb-3 sticky top-0 bg-gray-50 py-2">{date}</h3>
              <div className="space-y-3">
                {activities.map((activity) => {
                  const Icon = activityIcons[activity.type]
                  const colorClass = activityColors[activity.type]

                  return (
                    <Card key={activity.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className={`p-2 rounded-full ${colorClass} shrink-0`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src="/placeholder.svg" alt={activity.userName} />
                                  <AvatarFallback className="text-xs">{getInitials(activity.userName)}</AvatarFallback>
                                </Avatar>
                                <span className="font-medium text-sm">{activity.userName}</span>
                                {activity.groupId && (
                                  <>
                                    <span className="text-gray-400">•</span>
                                    <Badge variant="outline" className="text-xs">
                                      {getGroupName(activity.groupId)}
                                    </Badge>
                                  </>
                                )}
                              </div>
                              <span className="text-xs text-gray-500 shrink-0">
                                {formatDistanceToNow(activity.timestamp, { addSuffix: true, locale: lt })}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">{activity.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

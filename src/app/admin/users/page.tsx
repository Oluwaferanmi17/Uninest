"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { formatRelativeTime } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  university?: string;
  businessName?: string;
  _count: {
    listings: number;
    bookingsAsStudent: number;
    bookingsAsHost: number;
  };
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState<string>("ALL");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session && (session.user as any).role !== "ADMIN") {
      router.push("/");
    }
  }, [session, status, router]);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await fetch("/api/admin/users");
        if (response.ok) {
          const data = await response.json();
          setUsers(data.users || []);
        }
      } catch (error) {
        console.error("Failed to fetch users");
      } finally {
        setLoading(false);
      }
    }

    if (session && (session.user as any).role === "ADMIN") {
      fetchUsers();
    }
  }, [session]);

  if (status === "loading" || loading) {
    return <PageLoader />;
  }

  const filteredUsers = users.filter((u) => filterRole === "ALL" || u.role === filterRole);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Users</h1>
          <p className="text-gray-500 mt-2">View and manage platform users</p>
        </div>
        
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="ALL">All Roles</option>
          <option value="STUDENT">Students</option>
          <option value="HOST">Hosts</option>
          <option value="ADMIN">Admins</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Name & Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Context</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4 text-right">Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-900">{user.name}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{user.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === "ADMIN"
                          ? "bg-purple-100 text-purple-800"
                          : user.role === "HOST"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {user.role === "STUDENT" ? user.university || "N/A" : user.businessName || "N/A"}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {formatRelativeTime(user.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {user.role === "HOST" ? (
                      <span className="text-gray-600 font-medium">
                        {user._count.listings} Listings
                      </span>
                    ) : user.role === "STUDENT" ? (
                      <span className="text-gray-600 font-medium">
                        {user._count.bookingsAsStudent} Bookings
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No users found matching the selected role.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

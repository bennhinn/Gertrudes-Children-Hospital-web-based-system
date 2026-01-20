'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import useSWR from 'swr';
import { useState } from 'react';

const fetcher = (url: string) => fetch(url).then((res) => {
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
});

interface User {
    id: string;
    email: string;
    full_name: string;
    role: string;
    created_at: string;
    phone?: string;
}

export default function UsersPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [viewUser, setViewUser] = useState<User | null>(null);
    const [editUser, setEditUser] = useState<User | null>(null);
    const [editForm, setEditForm] = useState({ full_name: '', email: '', phone: '', role: '' });
    const [isSaving, setIsSaving] = useState(false);
    const { data: users, error, isLoading, mutate } = useSWR<User[]>('/api/admin/users', fetcher);

    const filteredUsers = users?.filter((user) => {
        const matchesSearch = user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        return matchesSearch && matchesRole;
    }) || [];

    const getRoleBadgeColor = (role: string) => {
        const colors: Record<string, string> = {
            admin: 'bg-red-100 text-red-800',
            doctor: 'bg-blue-100 text-blue-800',
            caregiver: 'bg-green-100 text-green-800',
            receptionist: 'bg-purple-100 text-purple-800',
            lab_tech: 'bg-yellow-100 text-yellow-800',
            pharmacist: 'bg-cyan-100 text-cyan-800',
            supplier: 'bg-orange-100 text-orange-800',
        };
        return colors[role] || 'bg-slate-100 text-slate-800';
    };

    const handleView = (user: User) => {
        setViewUser(user);
    };

    const handleEdit = (user: User) => {
        setEditUser(user);
        setEditForm({
            full_name: user.full_name || '',
            email: user.email || '',
            phone: user.phone || '',
            role: user.role || '',
        });
    };

    const handleSaveEdit = async () => {
        if (!editUser) return;
        
        setIsSaving(true);
        try {
            const response = await fetch(`/api/admin/users/${editUser.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm),
            });

            if (!response.ok) throw new Error('Failed to update user');

            await mutate();
            setEditUser(null);
        } catch (error) {
            console.error('Error updating user:', error);
            alert('Failed to update user. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-100">
                <div className="text-center">
                    <p className="text-red-500 text-lg font-medium">Error loading users</p>
                    <p className="text-slate-500 mt-2">Please try refreshing the page</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">User Management</h1>
                    <p className="mt-1 text-slate-600">View and manage all system users</p>
                </div>
            </div>

            {/* Filters */}
            <Card className="border-none shadow-lg">
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <Input
                                placeholder="Search by name or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Roles</option>
                            <option value="admin">Admin</option>
                            <option value="doctor">Doctor</option>
                            <option value="caregiver">Caregiver</option>
                            <option value="receptionist">Receptionist</option>
                            <option value="lab_tech">Lab Technician</option>
                            <option value="pharmacist">Pharmacist</option>
                            <option value="supplier">Supplier</option>
                        </select>
                    </div>
                </CardContent>
            </Card>

            {/* Users Table */}
            <Card className="border-none shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Users ({filteredUsers.length})</span>
                        <Button onClick={() => mutate()} variant="secondary" size="sm">
                            Refresh
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <p className="text-slate-500 text-center py-8">No users found</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-200">
                                        <th className="text-left py-3 px-4 font-medium text-slate-600">Name</th>
                                        <th className="text-left py-3 px-4 font-medium text-slate-600">Email</th>
                                        <th className="text-left py-3 px-4 font-medium text-slate-600">Role</th>
                                        <th className="text-left py-3 px-4 font-medium text-slate-600">Joined</th>
                                        <th className="text-left py-3 px-4 font-medium text-slate-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map((user) => (
                                        <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-purple-600 text-white font-medium">
                                                        {user.full_name?.[0]?.toUpperCase() || '?'}
                                                    </div>
                                                    <span className="font-medium text-slate-800">{user.full_name || 'Unknown'}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-slate-600">{user.email}</td>
                                            <td className="py-4 px-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                                                    {user.role?.replace('_', ' ') || 'Unknown'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-slate-600">
                                                {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-2">
                                                    <Button variant="secondary" size="sm" onClick={() => handleView(user)}>View</Button>
                                                    <Button variant="secondary" size="sm" onClick={() => handleEdit(user)}>Edit</Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* View User Modal */}
            {viewUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setViewUser(null)}>
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-200">
                            <h2 className="text-xl font-bold text-slate-800">User Details</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center justify-center">
                                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-purple-600 text-white text-2xl font-medium">
                                    {viewUser.full_name?.[0]?.toUpperCase() || '?'}
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-xs text-slate-500 font-medium">Full Name</p>
                                    <p className="text-sm font-medium text-slate-800 mt-1">{viewUser.full_name || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-medium">Email</p>
                                    <p className="text-sm font-medium text-slate-800 mt-1">{viewUser.email}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-medium">Phone</p>
                                    <p className="text-sm font-medium text-slate-800 mt-1">{viewUser.phone || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-medium">Role</p>
                                    <div className="mt-1">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(viewUser.role)}`}>
                                            {viewUser.role?.replace('_', ' ') || 'Unknown'}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-medium">Member Since</p>
                                    <p className="text-sm font-medium text-slate-800 mt-1">
                                        {viewUser.created_at ? new Date(viewUser.created_at).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        }) : 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-medium">User ID</p>
                                    <p className="text-sm font-mono text-slate-600 mt-1">{viewUser.id}</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-200 flex justify-end">
                            <Button onClick={() => setViewUser(null)}>Close</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {editUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setEditUser(null)}>
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-200">
                            <h2 className="text-xl font-bold text-slate-800">Edit User</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label htmlFor="edit-name" className="block text-sm font-medium text-slate-700 mb-1">
                                    Full Name
                                </label>
                                <Input
                                    id="edit-name"
                                    value={editForm.full_name}
                                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                                    placeholder="Enter full name"
                                />
                            </div>
                            <div>
                                <label htmlFor="edit-email" className="block text-sm font-medium text-slate-700 mb-1">
                                    Email
                                </label>
                                <Input
                                    id="edit-email"
                                    type="email"
                                    value={editForm.email}
                                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                    placeholder="Enter email"
                                />
                            </div>
                            <div>
                                <label htmlFor="edit-phone" className="block text-sm font-medium text-slate-700 mb-1">
                                    Phone
                                </label>
                                <Input
                                    id="edit-phone"
                                    type="tel"
                                    value={editForm.phone}
                                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                    placeholder="Enter phone number"
                                />
                            </div>
                            <div>
                                <label htmlFor="edit-role" className="block text-sm font-medium text-slate-700 mb-1">
                                    Role
                                </label>
                                <select
                                    id="edit-role"
                                    value={editForm.role}
                                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="admin">Admin</option>
                                    <option value="doctor">Doctor</option>
                                    <option value="caregiver">Caregiver</option>
                                    <option value="receptionist">Receptionist</option>
                                    <option value="lab_tech">Lab Technician</option>
                                    <option value="pharmacist">Pharmacist</option>
                                    <option value="supplier">Supplier</option>
                                </select>
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-200 flex justify-end gap-2">
                            <Button variant="secondary" onClick={() => setEditUser(null)} disabled={isSaving}>
                                Cancel
                            </Button>
                            <Button onClick={handleSaveEdit} disabled={isSaving}>
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
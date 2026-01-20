'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal, ModalHeader, ModalTitle, ModalContent, ModalFooter } from '@/components/ui/modal';
import { Label } from '@/components/ui/label';
import useSWR from 'swr';
import { useState } from 'react';

const fetcher = (url: string) => fetch(url).then((res) => {
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
});

interface StaffMember {
    id: string;
    user_id: string;
    specialization?: string;
    license_number?: string;
    department?: string;
    profile: {
        full_name: string;
        email: string;
        phone?: string;
    };
    role: string;
}

export default function StaffPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('all');
    const [viewStaff, setViewStaff] = useState<StaffMember | null>(null);
    const [editStaff, setEditStaff] = useState<StaffMember | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    const [editForm, setEditForm] = useState({
        full_name: '',
        phone: '',
        role: '',
        specialization: '',
        license_number: ''
    });

    const [addForm, setAddForm] = useState({
        email: '',
        password: '',
        full_name: '',
        phone: '',
        role: 'doctor',
        specialization: '',
        license_number: ''
    });

    const { data: staff, error, isLoading, mutate } = useSWR<StaffMember[]>('/api/admin/staff', fetcher);

    const filteredStaff = staff?.filter((member) => {
        const matchesSearch = member.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.profile?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.specialization?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDepartment = departmentFilter === 'all' || member.role === departmentFilter;
        return matchesSearch && matchesDepartment;
    }) || [];

    const getRoleBadgeColor = (role: string) => {
        const colors: Record<string, string> = {
            doctor: 'bg-blue-100 text-blue-800',
            receptionist: 'bg-purple-100 text-purple-800',
            lab_tech: 'bg-yellow-100 text-yellow-800',
            pharmacist: 'bg-cyan-100 text-cyan-800',
            supplier: 'bg-orange-100 text-orange-800',
        };
        return colors[role] || 'bg-slate-100 text-slate-800';
    };

    const getRoleIcon = (role: string) => {
        const icons: Record<string, string> = {
            doctor: '👨‍⚕️',
            receptionist: '💼',
            lab_tech: '🔬',
            pharmacist: '💊',
            supplier: '📦',
        };
        return icons[role] || '👤';
    };

    const handleView = (member: StaffMember) => {
        setViewStaff(member);
    };

    const handleEdit = (member: StaffMember) => {
        setEditStaff(member);
        setEditForm({
            full_name: member.profile?.full_name || '',
            phone: member.profile?.phone || '',
            role: member.role || '',
            specialization: member.specialization || '',
            license_number: member.license_number || ''
        });
    };

    const handleSaveEdit = async () => {
        if (!editStaff) return;
        
        setIsSaving(true);
        try {
            const response = await fetch(`/api/admin/staff/${editStaff.user_id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm),
            });

            if (!response.ok) throw new Error('Failed to update staff member');

            await mutate();
            setEditStaff(null);
        } catch (error) {
            console.error('Error updating staff:', error);
            alert('Failed to update staff member. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddStaff = async () => {
        setIsSaving(true);
        try {
            const response = await fetch('/api/admin/staff', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(addForm),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to add staff member');
            }

            await mutate();
            setShowAddModal(false);
            setAddForm({
                email: '',
                password: '',
                full_name: '',
                phone: '',
                role: 'doctor',
                specialization: '',
                license_number: ''
            });
        } catch (error) {
            console.error('Error adding staff:', error);
            alert(error instanceof Error ? error.message : 'Failed to add staff member. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-100">
                <div className="text-center">
                    <p className="text-red-500 text-lg font-medium">Error loading staff</p>
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
                    <h1 className="text-3xl font-bold text-slate-800">Staff Management</h1>
                    <p className="mt-1 text-slate-600">Manage doctors, nurses, and other staff members</p>
                </div>
                <Button 
                    className="bg-linear-to-r from-blue-500 to-purple-600 text-white"
                    onClick={() => setShowAddModal(true)}
                >
                    + Add Staff Member
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                {['doctor', 'receptionist', 'lab_tech', 'pharmacist'].map((role) => {
                    const count = staff?.filter(s => s.role === role).length || 0;
                    return (
                        <Card key={role} className="border-none shadow-md">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{getRoleIcon(role)}</span>
                                    <div>
                                        <p className="text-2xl font-bold text-slate-800">{count}</p>
                                        <p className="text-sm text-slate-500 capitalize">{role.replace('_', ' ')}s</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Filters */}
            <Card className="border-none shadow-lg">
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <Input
                                placeholder="Search by name, email, or specialization..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <select
                            value={departmentFilter}
                            onChange={(e) => setDepartmentFilter(e.target.value)}
                            className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Departments</option>
                            <option value="doctor">Doctors</option>
                            <option value="receptionist">Receptionists</option>
                            <option value="lab_tech">Lab Technicians</option>
                            <option value="pharmacist">Pharmacists</option>
                            <option value="supplier">Suppliers</option>
                        </select>
                    </div>
                </CardContent>
            </Card>

            {/* Staff Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                    [...Array(6)].map((_, i) => (
                        <Card key={i} className="border-none shadow-lg">
                            <CardContent className="p-6">
                                <div className="animate-pulse space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="h-16 w-16 rounded-full bg-slate-200" />
                                        <div className="space-y-2">
                                            <div className="h-4 w-32 bg-slate-200 rounded" />
                                            <div className="h-3 w-24 bg-slate-200 rounded" />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : filteredStaff.length === 0 ? (
                    <div className="col-span-full">
                        <Card className="border-none shadow-lg">
                            <CardContent className="p-8 text-center">
                                <p className="text-slate-500">No staff members found</p>
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    filteredStaff.map((member) => (
                        <Card key={member.id} className="border-none shadow-lg hover:shadow-xl transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-purple-600 text-white text-2xl font-bold">
                                        {member.profile?.full_name?.[0]?.toUpperCase() || '?'}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-slate-800">{member.profile?.full_name || 'Unknown'}</h3>
                                        <p className="text-sm text-slate-500">{member.profile?.email}</p>
                                        <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(member.role)}`}>
                                            {getRoleIcon(member.role)} {member.role?.replace('_', ' ')}
                                        </span>
                                        {member.specialization && (
                                            <p className="mt-2 text-sm text-slate-600">
                                                <span className="font-medium">Specialization:</span> {member.specialization}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
                                    <Button variant="secondary" size="sm" className="flex-1" onClick={() => handleView(member)}>
                                        View Profile
                                    </Button>
                                    <Button variant="secondary" size="sm" className="flex-1" onClick={() => handleEdit(member)}>
                                        Edit
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* View Staff Modal */}
            <Modal isOpen={!!viewStaff} onClose={() => setViewStaff(null)}>
                <ModalHeader>
                    <ModalTitle>Staff Profile</ModalTitle>
                </ModalHeader>
                <ModalContent>
                    {viewStaff && (
                        <>
                            <div className="flex items-center justify-center">
                                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-purple-600 text-white text-2xl font-medium">
                                    {viewStaff.profile?.full_name?.[0]?.toUpperCase() || '?'}
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-xs text-slate-500 font-medium">Full Name</p>
                                    <p className="text-sm font-medium text-slate-800 mt-1">{viewStaff.profile?.full_name || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-medium">Email</p>
                                    <p className="text-sm font-medium text-slate-800 mt-1">{viewStaff.profile?.email || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-medium">Phone</p>
                                    <p className="text-sm font-medium text-slate-800 mt-1">{viewStaff.profile?.phone || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-medium">Role</p>
                                    <div className="mt-1">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(viewStaff.role)}`}>
                                            {getRoleIcon(viewStaff.role)} {viewStaff.role?.replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>
                                {viewStaff.specialization && (
                                    <div>
                                        <p className="text-xs text-slate-500 font-medium">Specialization</p>
                                        <p className="text-sm font-medium text-slate-800 mt-1">{viewStaff.specialization}</p>
                                    </div>
                                )}
                                {viewStaff.license_number && (
                                    <div>
                                        <p className="text-xs text-slate-500 font-medium">License Number</p>
                                        <p className="text-sm font-medium text-slate-800 mt-1">{viewStaff.license_number}</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-xs text-slate-500 font-medium">User ID</p>
                                    <p className="text-sm font-mono text-slate-600 mt-1">{viewStaff.user_id}</p>
                                </div>
                            </div>
                        </>
                    )}
                </ModalContent>
                <ModalFooter>
                    <Button onClick={() => setViewStaff(null)}>Close</Button>
                </ModalFooter>
            </Modal>

            {/* Edit Staff Modal */}
            <Modal isOpen={!!editStaff} onClose={() => setEditStaff(null)}>
                <ModalHeader>
                    <ModalTitle>Edit Staff Member</ModalTitle>
                </ModalHeader>
                <ModalContent>
                    <div>
                        <Label htmlFor="edit-name">Full Name</Label>
                        <Input
                            id="edit-name"
                            value={editForm.full_name}
                            onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                            placeholder="Enter full name"
                        />
                    </div>
                    <div>
                        <Label htmlFor="edit-phone">Phone</Label>
                        <Input
                            id="edit-phone"
                            type="tel"
                            value={editForm.phone}
                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                            placeholder="Enter phone number"
                        />
                    </div>
                    <div>
                        <Label htmlFor="edit-role">Role</Label>
                        <select
                            id="edit-role"
                            value={editForm.role}
                            onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="doctor">Doctor</option>
                            <option value="receptionist">Receptionist</option>
                            <option value="lab_tech">Lab Technician</option>
                            <option value="pharmacist">Pharmacist</option>
                            <option value="supplier">Supplier</option>
                        </select>
                    </div>
                    {editForm.role === 'doctor' && (
                        <>
                            <div>
                                <Label htmlFor="edit-specialization">Specialization</Label>
                                <Input
                                    id="edit-specialization"
                                    value={editForm.specialization}
                                    onChange={(e) => setEditForm({ ...editForm, specialization: e.target.value })}
                                    placeholder="e.g., Cardiology"
                                />
                            </div>
                            <div>
                                <Label htmlFor="edit-license">License Number</Label>
                                <Input
                                    id="edit-license"
                                    value={editForm.license_number}
                                    onChange={(e) => setEditForm({ ...editForm, license_number: e.target.value })}
                                    placeholder="Enter license number"
                                />
                            </div>
                        </>
                    )}
                </ModalContent>
                <ModalFooter>
                    <Button variant="secondary" onClick={() => setEditStaff(null)} disabled={isSaving}>
                        Cancel
                    </Button>
                    <Button onClick={handleSaveEdit} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </ModalFooter>
            </Modal>

            {/* Add Staff Modal */}
            <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)}>
                <ModalHeader>
                    <ModalTitle>Add New Staff Member</ModalTitle>
                </ModalHeader>
                <ModalContent>
                    <div>
                        <Label htmlFor="add-email">Email *</Label>
                        <Input
                            id="add-email"
                            type="email"
                            value={addForm.email}
                            onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                            placeholder="Enter email address"
                        />
                    </div>
                    <div>
                        <Label htmlFor="add-password">Password *</Label>
                        <Input
                            id="add-password"
                            type="password"
                            value={addForm.password}
                            onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                            placeholder="Enter password"
                        />
                    </div>
                    <div>
                        <Label htmlFor="add-name">Full Name *</Label>
                        <Input
                            id="add-name"
                            value={addForm.full_name}
                            onChange={(e) => setAddForm({ ...addForm, full_name: e.target.value })}
                            placeholder="Enter full name"
                        />
                    </div>
                    <div>
                        <Label htmlFor="add-phone">Phone</Label>
                        <Input
                            id="add-phone"
                            type="tel"
                            value={addForm.phone}
                            onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                            placeholder="Enter phone number"
                        />
                    </div>
                    <div>
                        <Label htmlFor="add-role">Role *</Label>
                        <select
                            id="add-role"
                            value={addForm.role}
                            onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="doctor">Doctor</option>
                            <option value="receptionist">Receptionist</option>
                            <option value="lab_tech">Lab Technician</option>
                            <option value="pharmacist">Pharmacist</option>
                            <option value="supplier">Supplier</option>
                        </select>
                    </div>
                    {addForm.role === 'doctor' && (
                        <>
                            <div>
                                <Label htmlFor="add-specialization">Specialization</Label>
                                <Input
                                    id="add-specialization"
                                    value={addForm.specialization}
                                    onChange={(e) => setAddForm({ ...addForm, specialization: e.target.value })}
                                    placeholder="e.g., Cardiology"
                                />
                            </div>
                            <div>
                                <Label htmlFor="add-license">License Number</Label>
                                <Input
                                    id="add-license"
                                    value={addForm.license_number}
                                    onChange={(e) => setAddForm({ ...addForm, license_number: e.target.value })}
                                    placeholder="Enter license number"
                                />
                            </div>
                        </>
                    )}
                </ModalContent>
                <ModalFooter>
                    <Button variant="secondary" onClick={() => setShowAddModal(false)} disabled={isSaving}>
                        Cancel
                    </Button>
                    <Button onClick={handleAddStaff} disabled={isSaving}>
                        {isSaving ? 'Adding...' : 'Add Staff Member'}
                    </Button>
                </ModalFooter>
            </Modal>
        </div>
    );
}
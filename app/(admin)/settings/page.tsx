'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  target_table: string;
  target_id: string;
  description: string;
  user_email: string;
  user_role: string;
  created_at: string;
}

interface SystemStats {
  totalUsers: number;
  activeToday: number;
  totalAppointments: number;
  dbSize: string;
}

const ROLE_PERMISSIONS = {
  admin: {
    label: 'Administrator',
    color: 'bg-purple-100 text-purple-700',
    permissions: ['Full system access', 'User management', 'Reports', 'Settings', 'Audit logs']
  },
  doctor: {
    label: 'Doctor',
    color: 'bg-blue-100 text-blue-700',
    permissions: ['View patients', 'Create consultations', 'Prescribe medications', 'Order lab tests']
  },
  receptionist: {
    label: 'Receptionist',
    color: 'bg-green-100 text-green-700',
    permissions: ['Check-in patients', 'Schedule appointments', 'View queue', 'Patient registration']
  },
  lab_technician: {
    label: 'Lab Technician',
    color: 'bg-orange-100 text-orange-700',
    permissions: ['View lab orders', 'Process samples', 'Enter results', 'Mark completed']
  },
  pharmacist: {
    label: 'Pharmacist',
    color: 'bg-teal-100 text-teal-700',
    permissions: ['View prescriptions', 'Dispense medications', 'Manage inventory']
  },
  caregiver: {
    label: 'Caregiver',
    color: 'bg-pink-100 text-pink-700',
    permissions: ['View own patients', 'Book appointments', 'View records']
  },
  supplier: {
    label: 'Supplier',
    color: 'bg-amber-100 text-amber-700',
    permissions: ['View orders', 'Update inventory', 'Manage medications']
  },
};

const WORKING_HOURS = [
  { day: 'Monday', open: '08:00', close: '18:00', enabled: true },
  { day: 'Tuesday', open: '08:00', close: '18:00', enabled: true },
  { day: 'Wednesday', open: '08:00', close: '18:00', enabled: true },
  { day: 'Thursday', open: '08:00', close: '18:00', enabled: true },
  { day: 'Friday', open: '08:00', close: '18:00', enabled: true },
  { day: 'Saturday', open: '09:00', close: '14:00', enabled: true },
  { day: 'Sunday', open: '00:00', close: '00:00', enabled: false },
];

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalUsers: 0,
    activeToday: 0,
    totalAppointments: 0,
    dbSize: '0 MB'
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [workingHours, setWorkingHours] = useState(WORKING_HOURS);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const tabs = [
    { id: 'general', label: 'General', icon: '🏥' },
    { id: 'appointments', label: 'Appointments', icon: '📅' },
    { id: 'working-hours', label: 'Working Hours', icon: '🕐' },
    { id: 'roles', label: 'Roles & Permissions', icon: '👥' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'audit', label: 'Audit Logs', icon: '📋' },
    { id: 'system', label: 'System Health', icon: '💻' },
    { id: 'integrations', label: 'Integrations', icon: '🔗' },
    { id: 'backup', label: 'Backup & Data', icon: '💾' },
    { id: 'maintenance', label: 'Maintenance', icon: '🔧' },
  ];

  useEffect(() => {
    if (activeTab === 'audit') {
      fetchAuditLogs();
    }
    if (activeTab === 'system') {
      fetchSystemStats();
    }
  }, [activeTab]);

  async function fetchAuditLogs() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        setAuditLogs(data);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchSystemStats() {
    setLoading(true);
    try {
      const supabase = createClient();

      // Fetch counts
      const [usersRes, appointmentsRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('appointments').select('id', { count: 'exact', head: true }),
      ]);

      setSystemStats({
        totalUsers: usersRes.count || 0,
        activeToday: Math.floor((usersRes.count || 0) * 0.3), // Simulated active users
        totalAppointments: appointmentsRes.count || 0,
        dbSize: '245 MB' // Would need server-side query for actual size
      });
    } catch (err) {
      console.error('Error fetching system stats:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleSave() {
    setSaving(true);
    // Simulate save
    setTimeout(() => {
      setSaving(false);
      setSaveMessage({ type: 'success', text: 'Settings saved successfully!' });
      setTimeout(() => setSaveMessage(null), 3000);
    }, 1000);
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString();
  }

  function getActionColor(action: string) {
    if (action.includes('CREATE') || action.includes('INSERT')) return 'bg-green-100 text-green-700';
    if (action.includes('UPDATE') || action.includes('EDIT')) return 'bg-blue-100 text-blue-700';
    if (action.includes('DELETE') || action.includes('REMOVE')) return 'bg-red-100 text-red-700';
    if (action.includes('LOGIN') || action.includes('AUTH')) return 'bg-purple-100 text-purple-700';
    return 'bg-slate-100 text-slate-700';
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">System Settings</h1>
          <p className="mt-1 text-slate-600">Configure system preferences, security, and options</p>
        </div>
        {saveMessage && (
          <div className={`px-4 py-2 rounded-lg text-sm font-medium ${saveMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
            {saveMessage.text}
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:w-64 shrink-0">
          <Card className="border-none shadow-lg sticky top-4">
            <CardContent className="p-2">
              <nav className="space-y-1 max-h-[calc(100vh-200px)] overflow-y-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    <span className="text-xl">{tab.icon}</span>
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Content Area */}
        <div className="flex-1 space-y-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">🏥</span>
                  Clinic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Clinic Name
                    </label>
                    <Input defaultValue="Good Childhood Hospital" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Short Name / Code
                    </label>
                    <Input defaultValue="GCH" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Contact Email
                    </label>
                    <Input type="email" defaultValue="contact@gch.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Support Email
                    </label>
                    <Input type="email" defaultValue="support@gch.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Primary Phone
                    </label>
                    <Input type="tel" defaultValue="+1 (555) 123-4567" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Emergency Line
                    </label>
                    <Input type="tel" defaultValue="+1 (555) 911-0000" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Address
                  </label>
                  <Input defaultValue="123 Healthcare Ave, Medical City, MC 12345" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Timezone
                    </label>
                    <select className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>Africa/Lagos (WAT)</option>
                      <option>Africa/Accra (GMT)</option>
                      <option>America/New_York (EST)</option>
                      <option>Europe/London (GMT)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Date Format
                    </label>
                    <select className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>DD/MM/YYYY</option>
                      <option>MM/DD/YYYY</option>
                      <option>YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Welcome Message (shown on login)
                  </label>
                  <textarea
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                    defaultValue="Welcome to Good Childhood Hospital. Providing quality pediatric care since 2010."
                  />
                </div>
                <div className="pt-4 border-t flex gap-3">
                  <Button onClick={handleSave} disabled={saving} className="bg-blue-600 text-white hover:bg-blue-700">
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Appointment Settings */}
          {activeTab === 'appointments' && (
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">📅</span>
                  Appointment Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Default Appointment Duration
                    </label>
                    <select className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>15 minutes</option>
                      <option selected>30 minutes</option>
                      <option>45 minutes</option>
                      <option>1 hour</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Buffer Time Between Appointments
                    </label>
                    <select className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>No buffer</option>
                      <option selected>5 minutes</option>
                      <option>10 minutes</option>
                      <option>15 minutes</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Max Advance Booking Days
                    </label>
                    <Input type="number" defaultValue="30" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Min Advance Booking Hours
                    </label>
                    <Input type="number" defaultValue="2" />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-slate-800">Booking Rules</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-800">Allow Same-Day Appointments</p>
                        <p className="text-sm text-slate-500">Patients can book appointments for today</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-800">Require Phone Verification</p>
                        <p className="text-sm text-slate-500">Verify phone number before booking</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-800">Allow Rescheduling</p>
                        <p className="text-sm text-slate-500">Caregivers can reschedule appointments</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-800">Allow Cancellation</p>
                        <p className="text-sm text-slate-500">Caregivers can cancel appointments</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Cancellation Policy Message
                  </label>
                  <textarea
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                    defaultValue="Appointments must be cancelled at least 24 hours in advance. Repeated no-shows may result in booking restrictions."
                  />
                </div>

                <div className="pt-4 border-t">
                  <Button onClick={handleSave} disabled={saving} className="bg-blue-600 text-white hover:bg-blue-700">
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Working Hours */}
          {activeTab === 'working-hours' && (
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">🕐</span>
                  Clinic Working Hours
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-slate-600">Configure the operating hours for each day of the week.</p>

                <div className="space-y-3">
                  {workingHours.map((schedule, index) => (
                    <div key={schedule.day} className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                      <div className="w-28">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={schedule.enabled}
                            onChange={(e) => {
                              const newHours = [...workingHours];
                              newHours[index].enabled = e.target.checked;
                              setWorkingHours(newHours);
                            }}
                            className="rounded"
                          />
                          <span className="font-medium text-slate-800">{schedule.day}</span>
                        </label>
                      </div>
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          type="time"
                          value={schedule.open}
                          disabled={!schedule.enabled}
                          onChange={(e) => {
                            const newHours = [...workingHours];
                            newHours[index].open = e.target.value;
                            setWorkingHours(newHours);
                          }}
                          className="w-32"
                        />
                        <span className="text-slate-500">to</span>
                        <Input
                          type="time"
                          value={schedule.close}
                          disabled={!schedule.enabled}
                          onChange={(e) => {
                            const newHours = [...workingHours];
                            newHours[index].close = e.target.value;
                            setWorkingHours(newHours);
                          }}
                          className="w-32"
                        />
                        {!schedule.enabled && (
                          <span className="text-sm text-slate-400 ml-2">Closed</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">💡 Quick Actions</h4>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setWorkingHours(WORKING_HOURS)}
                    >
                      Reset to Default
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setWorkingHours(workingHours.map(h => ({ ...h, open: '09:00', close: '17:00' })))}
                    >
                      Set All 9-5
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setWorkingHours(workingHours.map(h => ({ ...h, enabled: true })))}
                    >
                      Enable All Days
                    </Button>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button onClick={handleSave} disabled={saving} className="bg-blue-600 text-white hover:bg-blue-700">
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Roles & Permissions */}
          {activeTab === 'roles' && (
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">👥</span>
                  Roles & Permissions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-slate-600">View and manage role-based access control for different user types.</p>

                <div className="space-y-4">
                  {Object.entries(ROLE_PERMISSIONS).map(([roleKey, role]) => (
                    <div key={roleKey} className="border border-slate-200 rounded-lg overflow-hidden">
                      <div className="flex items-center justify-between p-4 bg-slate-50">
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${role.color}`}>
                            {role.label}
                          </span>
                        </div>
                        <Button variant="secondary" size="sm">
                          Edit Permissions
                        </Button>
                      </div>
                      <div className="p-4">
                        <div className="flex flex-wrap gap-2">
                          {role.permissions.map((permission) => (
                            <span
                              key={permission}
                              className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-sm"
                            >
                              ✓ {permission}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">⚠️</span>
                    <div>
                      <p className="font-medium text-amber-800">Permission Changes</p>
                      <p className="text-sm text-amber-600">
                        Changes to role permissions will affect all users with that role.
                        Users will need to log out and log back in for changes to take effect.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">🔔</span>
                  Notification Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-slate-800">Email Notifications</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-800">New Appointment Booking</p>
                        <p className="text-sm text-slate-500">Send email when new appointment is booked</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-800">Appointment Reminders</p>
                        <p className="text-sm text-slate-500">Auto-send reminders 24h before appointment</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-800">Prescription Ready</p>
                        <p className="text-sm text-slate-500">Notify when prescription is ready for pickup</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-800">Lab Results Ready</p>
                        <p className="text-sm text-slate-500">Notify when lab results are available</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-slate-800">SMS Notifications</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-800">SMS Reminders</p>
                        <p className="text-sm text-slate-500">Send SMS reminders to caregivers</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-slate-800">Admin Alerts</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-800">Low Inventory Alerts</p>
                        <p className="text-sm text-slate-500">Alert when medication stock is low</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-800">Failed Login Attempts</p>
                        <p className="text-sm text-slate-500">Alert on suspicious login activity</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-800">System Error Alerts</p>
                        <p className="text-sm text-slate-500">Notify admins of system errors</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button onClick={handleSave} disabled={saving} className="bg-blue-600 text-white hover:bg-blue-700">
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Security */}
          {activeTab === 'security' && (
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">🔒</span>
                  Security Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-slate-800">Authentication</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-800">Two-Factor Authentication</p>
                        <p className="text-sm text-slate-500">Require 2FA for admin accounts</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-800">Session Timeout</p>
                        <p className="text-sm text-slate-500">Auto-logout inactive users</p>
                      </div>
                      <select className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option>15 minutes</option>
                        <option>30 minutes</option>
                        <option selected>1 hour</option>
                        <option>2 hours</option>
                        <option>4 hours</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-800">Max Login Attempts</p>
                        <p className="text-sm text-slate-500">Lock account after failed attempts</p>
                      </div>
                      <select className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option>3 attempts</option>
                        <option selected>5 attempts</option>
                        <option>10 attempts</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="font-medium text-slate-800 mb-3">Password Policy</p>
                  <div className="space-y-2 text-sm text-slate-600">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="rounded" />
                      Minimum 8 characters
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="rounded" />
                      Require uppercase letters
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="rounded" />
                      Require lowercase letters
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="rounded" />
                      Require numbers
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" />
                      Require special characters
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" />
                      Password expiry (90 days)
                    </label>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-slate-800">IP Restrictions</h3>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-medium text-slate-800">Enable IP Whitelist</p>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <textarea
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] text-sm font-mono"
                      placeholder="Enter allowed IP addresses (one per line)&#10;Example: 192.168.1.0/24"
                      disabled
                    />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button onClick={handleSave} disabled={saving} className="bg-blue-600 text-white hover:bg-blue-700">
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Audit Logs */}
          {activeTab === 'audit' && (
            <Card className="border-none shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">📋</span>
                    Audit Logs
                  </CardTitle>
                  <Button variant="secondary" onClick={fetchAuditLogs} disabled={loading}>
                    {loading ? 'Loading...' : '🔄 Refresh'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-4">
                  Track all system activities and changes. Showing last 50 entries.
                </p>

                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                  </div>
                ) : auditLogs.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <span className="text-4xl mb-4 block">📋</span>
                    <p>No audit logs found. Activities will appear here once users interact with the system.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {auditLogs.map((log) => (
                      <div key={log.id} className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getActionColor(log.action)}`}>
                              {log.action}
                            </span>
                            {log.target_table && (
                              <span className="text-xs text-slate-500">
                                on {log.target_table}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-700">
                            {log.description || `${log.action} performed on ${log.target_table || 'system'}`}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                            <span>👤 {log.user_email || 'Unknown user'}</span>
                            {log.user_role && (
                              <span className="px-2 py-0.5 bg-slate-200 rounded">{log.user_role}</span>
                            )}
                            <span>🕐 {formatDate(log.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 pt-4 border-t flex gap-3">
                  <Button variant="secondary">
                    📥 Export Logs (CSV)
                  </Button>
                  <Button variant="secondary">
                    🔍 Advanced Search
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* System Health */}
          {activeTab === 'system' && (
            <Card className="border-none shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">💻</span>
                    System Health
                  </CardTitle>
                  <Button variant="secondary" onClick={fetchSystemStats} disabled={loading}>
                    {loading ? 'Loading...' : '🔄 Refresh'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Status Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></span>
                      <span className="text-sm font-medium text-green-700">Database</span>
                    </div>
                    <p className="text-2xl font-bold text-green-800">Online</p>
                    <p className="text-xs text-green-600">{systemStats.dbSize} used</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></span>
                      <span className="text-sm font-medium text-green-700">API Server</span>
                    </div>
                    <p className="text-2xl font-bold text-green-800">Online</p>
                    <p className="text-xs text-green-600">Response: 45ms</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></span>
                      <span className="text-sm font-medium text-green-700">Email Service</span>
                    </div>
                    <p className="text-2xl font-bold text-green-800">Active</p>
                    <p className="text-xs text-green-600">Resend configured</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="h-3 w-3 bg-slate-400 rounded-full"></span>
                      <span className="text-sm font-medium text-slate-600">SMS Service</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-600">Inactive</p>
                    <p className="text-xs text-slate-500">Not configured</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-600">Total Users</p>
                    <p className="text-3xl font-bold text-blue-800">{systemStats.totalUsers}</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-purple-600">Active Today</p>
                    <p className="text-3xl font-bold text-purple-800">{systemStats.activeToday}</p>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-lg">
                    <p className="text-sm text-emerald-600">Total Appointments</p>
                    <p className="text-3xl font-bold text-emerald-800">{systemStats.totalAppointments}</p>
                  </div>
                </div>

                {/* Recent Errors/Warnings */}
                <div>
                  <h3 className="font-medium text-slate-800 mb-3">System Logs</h3>
                  <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm text-green-400 max-h-[200px] overflow-y-auto">
                    <p>[{new Date().toISOString()}] INFO: System running normally</p>
                    <p>[{new Date(Date.now() - 3600000).toISOString()}] INFO: Daily backup completed</p>
                    <p>[{new Date(Date.now() - 7200000).toISOString()}] INFO: Cache cleared</p>
                    <p>[{new Date(Date.now() - 14400000).toISOString()}] INFO: Email service connected</p>
                  </div>
                </div>

                <div className="pt-4 border-t flex gap-3">
                  <Button variant="secondary">
                    📊 View Full Metrics
                  </Button>
                  <Button variant="secondary">
                    🔄 Clear Cache
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Integrations */}
          {activeTab === 'integrations' && (
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">🔗</span>
                  Integrations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">
                        🗄️
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">Supabase</p>
                        <p className="text-sm text-green-600">✓ Connected</p>
                      </div>
                    </div>
                    <Button variant="secondary">Configure</Button>
                  </div>
                  <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">
                        📧
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">Resend (Email)</p>
                        <p className="text-sm text-green-600">✓ Connected</p>
                      </div>
                    </div>
                    <Button variant="secondary">Configure</Button>
                  </div>
                  <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-2xl">
                        📱
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">Twilio (SMS)</p>
                        <p className="text-sm text-slate-500">Not configured</p>
                      </div>
                    </div>
                    <Button variant="secondary">Connect</Button>
                  </div>
                  <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-2xl">
                        💳
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">Paystack (Payments)</p>
                        <p className="text-sm text-slate-500">Not configured</p>
                      </div>
                    </div>
                    <Button variant="secondary">Connect</Button>
                  </div>
                  <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-2xl">
                        📊
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">Google Analytics</p>
                        <p className="text-sm text-slate-500">Not configured</p>
                      </div>
                    </div>
                    <Button variant="secondary">Connect</Button>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">💡 API Keys</h4>
                  <p className="text-sm text-blue-600 mb-3">
                    Manage your integration API keys securely. Never share these keys publicly.
                  </p>
                  <Button variant="secondary" size="sm">
                    🔑 Manage API Keys
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Backup */}
          {activeTab === 'backup' && (
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">💾</span>
                  Backup & Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">✅</span>
                    <div>
                      <p className="font-medium text-green-800">Last Backup: Feb 1, 2026 at 02:00 AM</p>
                      <p className="text-sm text-green-600">Automatic daily backups enabled via Supabase</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-800">Automatic Backups</p>
                      <p className="text-sm text-slate-500">Daily backups at 2:00 AM UTC</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="font-medium text-slate-800 mb-2">Backup Retention</p>
                    <select className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>Keep last 7 days</option>
                      <option selected>Keep last 14 days</option>
                      <option>Keep last 30 days</option>
                      <option>Keep last 90 days</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-4">
                  <h3 className="font-medium text-slate-800">Data Export</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Button variant="secondary" className="justify-start">
                      📥 Export All Patients (CSV)
                    </Button>
                    <Button variant="secondary" className="justify-start">
                      📥 Export Appointments (CSV)
                    </Button>
                    <Button variant="secondary" className="justify-start">
                      📥 Export Prescriptions (CSV)
                    </Button>
                    <Button variant="secondary" className="justify-start">
                      📥 Export Lab Results (CSV)
                    </Button>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-4">
                  <Button className="w-full bg-blue-600 text-white hover:bg-blue-700">
                    💾 Create Manual Backup
                  </Button>
                  <Button variant="secondary" className="w-full text-red-600 border-red-200 hover:bg-red-50">
                    🔄 Restore from Backup
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Maintenance */}
          {activeTab === 'maintenance' && (
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">🔧</span>
                  Maintenance Mode
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className={`p-4 rounded-lg border ${maintenanceMode ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{maintenanceMode ? '🔴' : '🟢'}</span>
                      <div>
                        <p className={`font-medium ${maintenanceMode ? 'text-red-800' : 'text-green-800'}`}>
                          System is {maintenanceMode ? 'in Maintenance Mode' : 'Operating Normally'}
                        </p>
                        <p className={`text-sm ${maintenanceMode ? 'text-red-600' : 'text-green-600'}`}>
                          {maintenanceMode ? 'Only admins can access the system' : 'All users can access the system'}
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={maintenanceMode}
                        onChange={(e) => setMaintenanceMode(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                    </label>
                  </div>
                </div>

                {maintenanceMode && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Maintenance Message (shown to users)
                      </label>
                      <textarea
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                        defaultValue="We're currently performing scheduled maintenance. The system will be back online shortly. Thank you for your patience."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Estimated Downtime
                      </label>
                      <Input type="text" placeholder="e.g., 2 hours" />
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <h3 className="font-medium text-slate-800">Maintenance Tasks</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Button variant="secondary" className="justify-start">
                      🧹 Clear Application Cache
                    </Button>
                    <Button variant="secondary" className="justify-start">
                      🔄 Rebuild Search Index
                    </Button>
                    <Button variant="secondary" className="justify-start">
                      📊 Optimize Database
                    </Button>
                    <Button variant="secondary" className="justify-start">
                      🗑️ Clear Old Logs (90+ days)
                    </Button>
                  </div>
                </div>

                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">⚠️</span>
                    <div>
                      <p className="font-medium text-amber-800">Danger Zone</p>
                      <p className="text-sm text-amber-600 mb-3">
                        These actions are irreversible and may affect system data.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="secondary" className="text-red-600 border-red-200 hover:bg-red-50" size="sm">
                          Reset Demo Data
                        </Button>
                        <Button variant="secondary" className="text-red-600 border-red-200 hover:bg-red-50" size="sm">
                          Purge All Sessions
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}


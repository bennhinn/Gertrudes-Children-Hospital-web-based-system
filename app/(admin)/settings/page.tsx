'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'integrations', label: 'Integrations', icon: '🔗' },
    { id: 'backup', label: 'Backup & Data', icon: '💾' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800">System Settings</h1>
        <p className="mt-1 text-slate-600">Configure system preferences and options</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:w-64 shrink-0">
          <Card className="border-none shadow-lg">
            <CardContent className="p-2">
              <nav className="space-y-1">
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
        <div className="flex-1">
          {activeTab === 'general' && (
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Clinic Name
                  </label>
                  <Input defaultValue="Good Childhood Hospital" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Contact Email
                  </label>
                  <Input type="email" defaultValue="contact@gch.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Contact Phone
                  </label>
                  <Input type="tel" defaultValue="+1 (555) 123-4567" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Address
                  </label>
                  <Input defaultValue="123 Healthcare Ave, Medical City, MC 12345" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Timezone
                  </label>
                  <select className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>America/New_York (EST)</option>
                    <option>America/Los_Angeles (PST)</option>
                    <option>America/Chicago (CST)</option>
                    <option>Europe/London (GMT)</option>
                  </select>
                </div>
                <div className="pt-4 border-t">
                  <Button className="bg-blue-600 text-white hover:bg-blue-700">
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-800">Email Notifications</p>
                      <p className="text-sm text-slate-500">Receive email alerts for new appointments</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-800">SMS Notifications</p>
                      <p className="text-sm text-slate-500">Send SMS reminders to caregivers</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-800">Push Notifications</p>
                      <p className="text-sm text-slate-500">Browser push notifications</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-800">Appointment Reminders</p>
                      <p className="text-sm text-slate-500">Auto-send reminders before appointments</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <Button className="bg-blue-600 text-white hover:bg-blue-700">
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-800">Two-Factor Authentication</p>
                      <p className="text-sm text-slate-500">Require 2FA for all admin accounts</p>
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
                      <option>30 minutes</option>
                      <option>1 hour</option>
                      <option>2 hours</option>
                      <option>4 hours</option>
                    </select>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="font-medium text-slate-800 mb-2">Password Policy</p>
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
                        Require numbers
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" />
                        Require special characters
                      </label>
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <Button className="bg-blue-600 text-white hover:bg-blue-700">
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'integrations' && (
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>Integrations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">
                        📧
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">Email Service (SMTP)</p>
                        <p className="text-sm text-green-600">Connected</p>
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
                        <p className="font-medium text-slate-800">SMS Provider (Twilio)</p>
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
                        <p className="font-medium text-slate-800">Payment Gateway (Stripe)</p>
                        <p className="text-sm text-slate-500">Not configured</p>
                      </div>
                    </div>
                    <Button variant="secondary">Connect</Button>
                  </div>
                  <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">
                        🗄️
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">Database (Supabase)</p>
                        <p className="text-sm text-green-600">Connected</p>
                      </div>
                    </div>
                    <Button variant="secondary">Configure</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'backup' && (
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>Backup & Data</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">✅</span>
                    <div>
                      <p className="font-medium text-green-800">Last Backup: Jan 14, 2026 at 02:00 AM</p>
                      <p className="text-sm text-green-600">Automatic daily backups enabled</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-800">Automatic Backups</p>
                      <p className="text-sm text-slate-500">Daily backups at 2:00 AM</p>
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
                      <option>Keep last 14 days</option>
                      <option>Keep last 30 days</option>
                      <option>Keep last 90 days</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-4">
                  <Button className="w-full bg-blue-600 text-white hover:bg-blue-700">
                    💾 Create Manual Backup
                  </Button>
                  <Button variant="secondary" className="w-full">
                    📥 Download Latest Backup
                  </Button>
                  <Button variant="secondary" className="w-full text-red-600 border-red-200 hover:bg-red-50">
                    🔄 Restore from Backup
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}


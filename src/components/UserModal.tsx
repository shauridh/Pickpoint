import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User as UserIcon, Shield, MapPin, Eye, EyeOff } from 'lucide-react';
import { User } from '@/types';
import { addUser, updateUser, getLocations } from '@/services/storage.service';

interface UserModalProps {
  editUser?: User;
  onClose: () => void;
}

const UserModal: React.FC<UserModalProps> = ({ editUser, onClose }) => {
  const [locations, setLocations] = useState<any[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff' as 'admin' | 'staff',
    locationId: '',
    isActive: true,
  });

  useEffect(() => {
    const loadedLocations = getLocations();
    setLocations(loadedLocations);

    if (editUser) {
      setFormData({
        name: editUser.name,
        email: editUser.email,
        password: '', // Don't show existing password
        role: editUser.role,
        locationId: editUser.locationId || '',
        isActive: editUser.isActive,
      });
    }
  }, [editUser]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      alert('Nama harus diisi');
      return;
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      alert('Email tidak valid');
      return;
    }

    if (!editUser && !formData.password.trim()) {
      alert('Password harus diisi untuk user baru');
      return;
    }

    if (formData.password && formData.password.length < 6) {
      alert('Password minimal 6 karakter');
      return;
    }

    if (formData.role === 'staff' && !formData.locationId) {
      alert('Lokasi harus dipilih untuk staff');
      return;
    }

    if (editUser) {
      const updatedUser: User = {
        ...editUser,
        name: formData.name,
        email: formData.email,
        role: formData.role,
        locationId: formData.role === 'staff' ? formData.locationId : undefined,
        isActive: formData.isActive,
      };

      // Only update password if a new one is provided
      if (formData.password.trim()) {
        updatedUser.password = formData.password;
      }

      updateUser(updatedUser);
    } else {
      const newUser: Omit<User, 'id' | 'createdAt'> = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        locationId: formData.role === 'staff' ? formData.locationId : undefined,
        isActive: formData.isActive,
      };

      addUser(newUser);
    }

    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

        <div className="inline-block w-full max-w-lg my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-xl shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600">
            <h3 className="text-lg font-semibold text-white">
              {editUser ? 'Edit User' : 'Tambah User Baru'}
            </h3>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Nama Lengkap *
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Masukkan nama lengkap"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="user@example.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Password {editUser ? '(kosongkan jika tidak diubah)' : '*'}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-12 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={editUser ? 'Biarkan kosong untuk tidak mengubah' : 'Minimal 6 karakter'}
                  required={!editUser}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {!editUser && (
                <p className="text-xs text-gray-500 mt-1">Minimal 6 karakter</p>
              )}
            </div>

            {/* Role */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Role *
              </label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                  required
                >
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            {/* Location (only for staff) */}
            {formData.role === 'staff' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Lokasi Penugasan *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <select
                    name="locationId"
                    value={formData.locationId}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                    required
                  >
                    <option value="">Pilih lokasi</option>
                    {locations.map(location => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Staff hanya dapat mengakses data dari lokasi yang ditugaskan
                </p>
              </div>
            )}

            {/* Status */}
            <div className="flex items-center">
              <input
                type="checkbox"
                name="isActive"
                id="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                User Aktif
              </label>
            </div>

            {/* Info Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                <strong>Catatan:</strong> {formData.role === 'admin' 
                  ? 'Admin memiliki akses penuh ke semua fitur dan lokasi.' 
                  : 'Staff hanya dapat mengakses data dari lokasi yang ditugaskan.'}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
              >
                {editUser ? 'Update' : 'Simpan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserModal;

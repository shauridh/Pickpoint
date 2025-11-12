import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { mockUsers } from '../services/api';
import { Package } from 'lucide-react';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        const user = mockUsers.find(u => u.email === email);
        if (user && password === 'password') { 
            login(user);
        } else {
            setError('Email atau password salah. Coba: admin@pickpoint.com atau petugas@pickpoint.com dengan password "password".');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md m-4">
                 <div className="flex justify-center items-center mb-6">
                    <Package className="h-10 w-10 text-primary-600 mr-2" />
                    <h1 className="text-4xl font-bold text-primary-600">Pickpoint</h1>
                </div>
                <div className="bg-white rounded-lg shadow-lg">
                    <div className="p-4 border-b">
                         <p className="text-center text-gray-500">Silakan login untuk melanjutkan</p>
                    </div>
                    <div className="p-6">
                        {error && (
                            <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
                               {error}
                            </div>
                        )}
                        
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div>
                                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                                    Email
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full px-3 py-2 mt-1 bg-white placeholder-gray-400 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                    placeholder="you@example.com"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="password"
                                    className="text-sm font-medium text-gray-700"
                                >
                                    Password
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full px-3 py-2 mt-1 bg-white placeholder-gray-400 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                    placeholder="********"
                                />
                            </div>
                            
                            <div>
                                <button
                                    type="submit"
                                    className="flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                                >
                                    Login
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
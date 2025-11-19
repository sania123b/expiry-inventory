import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import './Login.css';

const Login = ({ onLogin }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        role: 'customer'
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const validateForm = () => {
        if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            setError('Please enter a valid email address');
            return false;
        }
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) return;

        setLoading(true);

        try {
            console.log('Attempting login with:', formData);
            
            // Log token before login attempt
            console.log('Current token before login:', localStorage.getItem('token'));
            
            // Clear any existing tokens before login attempt
            localStorage.removeItem('token');
            localStorage.removeItem('userInfo');
            
            // Use axios directly instead of axiosInstance to avoid token interceptors during login
            const response = await axios.post(`${API_BASE_URL}/user/login`, formData);
            console.log('Login response:', response.data);

            const { token, user } = response.data;
            
            // Store token and user info in localStorage
            localStorage.setItem('token', token);
            localStorage.setItem('userInfo', JSON.stringify(user));
            
            // Log the saved token to verify it was stored correctly
            console.log('Saved token to localStorage:', token.substring(0, 20) + '...');
            
            // Call the onLogin prop with user data and token 
            if (onLogin && typeof onLogin === 'function') {
                console.log('Calling onLogin callback with user:', user);
                onLogin(user, token);
            } else {
                console.log('No onLogin callback provided');
            }

            // Redirect based on user type
            if (user.userType === 'shopkeeper') {
                navigate('/shop');
            } else if (user.userType === 'customer') {
                navigate('/customer/home');
            } else if (user.userType === 'admin') {
                navigate('/admin/dashboard');
            } else {
                navigate('/');
            }
        } catch (error) {
            console.error('Login error:', error);
            if (error.response) {
                setError(error.response.data.message || 'Login failed. Please try again.');
            } else if (error.request) {
                setError('No response from server. Please check your connection.');
            } else {
                setError('An error occurred. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h2>Login</h2>
                {error && <div className="error-message">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email:</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="Enter your email"
                        />
                    </div>
                    <div className="form-group">
                        <label>Password:</label>
                        <div className="password-input">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                placeholder="Enter your password"
                            />
                            <button
                                type="button"
                                className="toggle-password"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? "Hide" : "Show"}
                            </button>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Role:</label>
                        <select name="role" value={formData.role} onChange={handleChange}>
                            <option value="customer">Customer</option>
                            <option value="shopkeeper">Shopkeeper</option>
                        </select>
                    </div>
                    <button type="submit" disabled={loading}>
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
                <p className="signup-link">
                    Don't have an account? <a href="/signup">Sign Up</a>
                </p>
            </div>
        </div>
    );
};

export default Login; 
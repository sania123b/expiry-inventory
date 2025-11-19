// Signup.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaUserAlt, FaEnvelope, FaPhone, FaStore, FaMapMarkerAlt, FaEye, FaEyeSlash } from 'react-icons/fa';
import { RiLockPasswordFill } from 'react-icons/ri';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import './Signup.css';

const Signup = () => {
    const navigate = useNavigate();
    const [userType, setUserType] = useState('customer');
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        storeName: '',
        address: '',
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);

    // Password eye toggle
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData({ ...formData, [id]: value });

        if (errors[id]) {
            setErrors({ ...errors, [id]: '' });
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.firstName.trim()) newErrors.firstName = 'First name required';
        if (!formData.lastName.trim()) newErrors.lastName = 'Last name required';

        if (!formData.email.trim()) {
            newErrors.email = 'Email required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Invalid email';
        }

        if (!formData.password) {
            newErrors.password = 'Password required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Min 6 characters';
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        if (!formData.phone) {
            newErrors.phone = 'Phone required';
        } else if (!/^\d{10}$/.test(formData.phone)) {
            newErrors.phone = 'Phone must be 10 digits';
        }

        if (!formData.address.trim()) newErrors.address = 'Address required';

        if (userType === 'shopkeeper' && !formData.storeName.trim()) {
            newErrors.storeName = 'Store name required';
        }

        return newErrors;
    };

    const handleSignup = async (e) => {
        e.preventDefault();

        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setLoading(true);

        try {
            const userData = {
                name: `${formData.firstName} ${formData.lastName}`.trim(),
                email: formData.email.toLowerCase(),
                password: formData.password,
                role: userType,
                phone: formData.phone,
                address: formData.address
            };

            if (userType === 'shopkeeper') userData.storeName = formData.storeName;

            const response = await axios.post(`${API_BASE_URL}/user/register`, userData);

            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('userType', response.data.user.role);
                localStorage.setItem('userInfo', JSON.stringify(response.data.user));
            }

            setShowSuccessMessage(true);

            setTimeout(() => {
                navigate('/login');
            }, 1800);

        } catch (error) {
            const msg =
                error.response?.data?.message ||
                'Registration failed. Try again.';
            setErrors({ general: msg });
        }

        setLoading(false);
    };

    return (
        <div className="signup">
            {showSuccessMessage && (
                <div className="success-message">Registration successful! Redirecting...</div>
            )}

            <form onSubmit={handleSignup}>
                <div className="container">
                    <h1>Create an Account</h1>

                    <div className="user-type-selector">
                        <label>
                            <input
                                type="radio"
                                value="customer"
                                checked={userType === 'customer'}
                                onChange={() => setUserType('customer')}
                            />
                            Customer
                        </label>

                        <label>
                            <input
                                type="radio"
                                value="shopkeeper"
                                checked={userType === 'shopkeeper'}
                                onChange={() => setUserType('shopkeeper')}
                            />
                            Shopkeeper
                        </label>
                    </div>

                    {errors.general && <div className="error-message">{errors.general}</div>}

                    <div className="form-row">
                        <div className="inputbox">
                            <label>First Name</label>
                            <input id="firstName" value={formData.firstName} onChange={handleChange} />
                            <FaUserAlt className="icon" />
                            {errors.firstName && <span className="error">{errors.firstName}</span>}
                        </div>

                        <div className="inputbox">
                            <label>Last Name</label>
                            <input id="lastName" value={formData.lastName} onChange={handleChange} />
                            <FaUserAlt className="icon" />
                            {errors.lastName && <span className="error">{errors.lastName}</span>}
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="inputbox">
                            <label>Email</label>
                            <input id="email" value={formData.email} onChange={handleChange} />
                            <FaEnvelope className="icon" />
                            {errors.email && <span className="error">{errors.email}</span>}
                        </div>

                        <div className="inputbox">
                            <label>Phone</label>
                            <input id="phone" value={formData.phone} onChange={handleChange} />
                            <FaPhone className="icon" />
                            {errors.phone && <span className="error">{errors.phone}</span>}
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="inputbox">
                            <label>Password</label>
                            <div className="password-field">
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                            <RiLockPasswordFill className="icon" />
                            {errors.password && <span className="error">{errors.password}</span>}
                        </div>

                        <div className="inputbox">
                            <label>Confirm Password</label>
                            <div className="password-field">
                                <input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                            <RiLockPasswordFill className="icon" />
                            {errors.confirmPassword && <span className="error">{errors.confirmPassword}</span>}
                        </div>
                    </div>

                    <div className="inputbox">
                        <label>Address</label>
                        <input id="address" value={formData.address} onChange={handleChange} />
                        <FaMapMarkerAlt className="icon" />
                        {errors.address && <span className="error">{errors.address}</span>}
                    </div>

                    {userType === 'shopkeeper' && (
                        <div className="inputbox">
                            <label>Store Name</label>
                            <input id="storeName" value={formData.storeName} onChange={handleChange} />
                            <FaStore className="icon" />
                            {errors.storeName && <span className="error">{errors.storeName}</span>}
                        </div>
                    )}

                    <div className="button">
                        <button type="submit" disabled={loading}>
                            {loading ? 'Signing Up...' : 'Sign Up'}
                        </button>
                    </div>

                    <div className="login-link">
                        Already have an account? <Link to="/login">Login</Link>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default Signup;

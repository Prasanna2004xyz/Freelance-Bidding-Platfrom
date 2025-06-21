import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, Briefcase, Users } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { RegisterData } from '../types';

interface RegisterForm extends RegisterData {
  confirmPassword: string;
}

export function Register() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'client' | 'freelancer'>(
    (searchParams.get('role') as 'client' | 'freelancer') || 'freelancer'
  );
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
    setValue,
  } = useForm<RegisterForm>({
    defaultValues: {
      role: selectedRole,
    },
    mode: 'onChange',
  });

  const password = watch('password');

  const handleRoleSelect = (role: 'client' | 'freelancer') => {
    setSelectedRole(role);
    setValue('role', role);
  };

  // Keyboard support for role selection
  const handleRoleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, role: 'client' | 'freelancer') => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleRoleSelect(role);
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      handleRoleSelect(role === 'client' ? 'freelancer' : 'client');
    }
  };

  const onSubmit = async (data: RegisterForm) => {
    try {
      setLoading(true);
      setFormError(null);
      const { confirmPassword, ...registerData } = data;
      await registerUser(registerData);
      navigate('/dashboard');
    } catch (error: any) {
      setFormError(error?.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold gradient-text mb-2">
              Join FreelanceHub
            </h1>
            <p className="text-silver-400">
              Create your account and start your journey
            </p>
          </div>

          {/* Role Selection */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-silver-200 mb-3">
              I want to:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={selectedRole === 'freelancer' ? 'primary' : 'secondary'}
                onClick={() => handleRoleSelect('freelancer')}
                className={`flex flex-col items-center p-4 h-auto focus:ring-2 focus:ring-blue-500 transition ${selectedRole === 'freelancer' ? 'ring-2 ring-blue-500' : ''}`}
                tabIndex={0}
                aria-pressed={selectedRole === 'freelancer'}
                aria-label="Select Freelancer role"
                onKeyDown={e => handleRoleKeyDown(e, 'freelancer')}
              >
                <Briefcase className="w-6 h-6 mb-2 inline-block mr-2" />
                <span>Find Work</span>
                <br />
                <span className="text-xs opacity-80">As a Freelancer</span>
              </Button>
              <Button
                type="button"
                variant={selectedRole === 'client' ? 'primary' : 'secondary'}
                onClick={() => handleRoleSelect('client')}
                className={`flex flex-col items-center p-4 h-auto focus:ring-2 focus:ring-blue-500 transition ${selectedRole === 'client' ? 'ring-2 ring-blue-500' : ''}`}
                tabIndex={0}
                aria-pressed={selectedRole === 'client'}
                aria-label="Select Client role"
                onKeyDown={e => handleRoleKeyDown(e, 'client')}
              >
                <Users className="w-6 h-6 mb-2 inline-block mr-2" />
                <span>Hire Talent</span>
                <br />
                <span className="text-xs opacity-80">As a Client</span>
              </Button>
            </div>
          </div>

          {formError && (
            <div className="mb-4 text-red-400 text-sm text-center" aria-live="polite">{formError}</div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <input type="hidden" value={selectedRole} {...register('role')} />

            <Input
              label="Full Name"
              type="text"
              icon={<User className="w-4 h-4" />}
              placeholder="Enter your full name"
              error={errors.name?.message}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'name-error' : undefined}
              {...register('name', {
                required: 'Name is required',
                minLength: {
                  value: 2,
                  message: 'Name must be at least 2 characters',
                },
              })}
            />
            {errors.name && (
              <div id="name-error" className="text-red-400 text-xs mt-1" aria-live="polite">{errors.name.message}</div>
            )}

            <Input
              label="Email"
              type="email"
              icon={<Mail className="w-4 h-4" />}
              placeholder="Enter your email"
              error={errors.email?.message}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Invalid email address',
                },
              })}
            />
            {errors.email && (
              <div id="email-error" className="text-red-400 text-xs mt-1" aria-live="polite">{errors.email.message}</div>
            )}

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                icon={<Lock className="w-4 h-4" />}
                placeholder="Create a password"
                error={errors.password?.message}
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'password-error' : undefined}
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters',
                  },
                })}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-8 p-2"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              {errors.password && (
                <div id="password-error" className="text-red-400 text-xs mt-1" aria-live="polite">{errors.password.message}</div>
              )}
            </div>

            <div className="relative">
              <Input
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                icon={<Lock className="w-4 h-4" />}
                placeholder="Confirm your password"
                error={errors.confirmPassword?.message}
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) =>
                    value === password || 'Passwords do not match',
                })}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-8 p-2"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              {errors.confirmPassword && (
                <div id="confirm-password-error" className="text-red-400 text-xs mt-1" aria-live="polite">{errors.confirmPassword.message}</div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              loading={loading}
              disabled={!isValid || loading}
            >
              Create Account
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-silver-400">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-400 hover:text-blue-300 transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';

interface LoginForm {
  email: string;
  password: string;
}

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setFocus,
  } = useForm<LoginForm>({ mode: 'onChange' });

  React.useEffect(() => {
    setFocus('email');
  }, [setFocus]);

  const onSubmit = async (data: LoginForm) => {
    try {
      setLoading(true);
      setFormError(null);
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (error: any) {
      setFormError(error?.response?.data?.message || 'Invalid email or password.');
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
        <Card className="p-8" variant="elevated">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-16 h-16 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <Lock className="w-8 h-8 text-blue-400" />
            </motion.div>
            <h1 className="text-3xl font-bold gradient-text mb-2">
              Welcome Back
            </h1>
            <p className="text-silver-400">
              Sign in to your FreelanceHub account
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {formError && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="error-state p-3 rounded-lg text-sm text-center" 
                aria-live="polite"
              >
                {formError}
              </motion.div>
            )}
            
            <Input
              label="Email Address"
              type="email"
              icon={<Mail className="w-4 h-4" />}
              placeholder="Enter your email address"
              error={errors.email?.message}
              helperText="We'll never share your email with anyone else"
              required
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'login-email-error' : undefined}
              autoFocus
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Please enter a valid email address',
                },
              })}
            />

            <Input
              label="Password"
              type="password"
              icon={<Lock className="w-4 h-4" />}
              placeholder="Enter your password"
              error={errors.password?.message}
              showPasswordToggle
              required
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'login-password-error' : undefined}
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters',
                },
              })}
            />

            <Button
              type="submit"
              className="w-full"
              loading={loading}
              disabled={!isValid || loading}
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="right"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-8 text-center space-y-4">
            <p className="text-silver-400">
              Don't have an account?{' '}
              <Link 
                to="/register" 
                className="text-blue-400 hover:text-blue-300 transition-colors font-medium hover:underline"
              >
                Sign up for free
              </Link>
            </p>
            
            <div className="border-t border-silver-200/10 pt-4">
              <Link 
                to="/forgot-password" 
                className="text-sm text-silver-400 hover:text-silver-300 transition-colors"
              >
                Forgot your password?
              </Link>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Plus, X, DollarSign, Calendar, FileText, ChevronDown, Check, Code, Palette, PenTool, Megaphone, BarChart3, Headphones, Users, Building2, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { jobsApi } from '../services/api';
import toast from 'react-hot-toast';

interface JobFormData {
  title: string;
  description: string;
  budgetMin: number;
  budgetMax: number;
  budgetType: 'fixed' | 'hourly';
  deadline: string;
  category: string;
  experienceLevel: 'entry' | 'intermediate' | 'expert';
  projectLength: 'less_than_1_month' | '1_to_3_months' | '3_to_6_months' | 'more_than_6_months';
}

const POPULAR_SKILLS = [
  'React', 'Node.js', 'Python', 'JavaScript', 'TypeScript',
  'Vue.js', 'Angular', 'PHP', 'Laravel', 'WordPress',
  'Graphic Design', 'UI/UX Design', 'Content Writing', 'SEO',
  'Digital Marketing', 'Data Analysis', 'Machine Learning'
];

const CATEGORIES = [
  'Web Development',
  'Mobile Development',
  'Design & Creative',
  'Writing & Translation',
  'Digital Marketing',
  'Data Science',
  'Admin Support',
  'Customer Service',
  'Sales & Marketing',
  'Engineering & Architecture'
];

// Custom Dropdown Component
interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface CustomDropdownProps {
  label: string;
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

function CustomDropdown({ 
  label, 
  options, 
  value, 
  onChange, 
  placeholder = "Select an option", 
  error, 
  required = false,
  disabled = false 
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(option => option.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(!isOpen);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'ArrowDown' && isOpen) {
      e.preventDefault();
      const currentIndex = options.findIndex(option => option.value === value);
      const nextIndex = (currentIndex + 1) % options.length;
      onChange(options[nextIndex].value);
    } else if (e.key === 'ArrowUp' && isOpen) {
      e.preventDefault();
      const currentIndex = options.findIndex(option => option.value === value);
      const prevIndex = currentIndex <= 0 ? options.length - 1 : currentIndex - 1;
      onChange(options[prevIndex].value);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-silver-200 mb-2">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      
      <div
        className={`relative w-full px-3 py-2 glass-card text-silver-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 rounded-lg cursor-pointer ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-black/30'
        } ${error ? 'border-red-500' : 'border-gray-600'}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={label}
        aria-invalid={!!error}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-h-[20px]">
            {selectedOption?.icon && (
              <span className="text-gray-400">{selectedOption.icon}</span>
            )}
            <span className={selectedOption ? 'text-silver-100' : 'text-gray-400'}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </div>
          <ChevronDown 
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`} 
          />
        </div>
      </div>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute z-50 w-full mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto"
        >
          {options.map((option) => (
            <div
              key={option.value}
              className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${
                option.value === value 
                  ? 'bg-blue-600/20 text-blue-400' 
                  : 'hover:bg-gray-800 text-silver-100'
              }`}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onChange(option.value);
                  setIsOpen(false);
                }
              }}
              tabIndex={0}
              role="option"
              aria-selected={option.value === value}
            >
              {option.icon && (
                <span className="text-gray-400">{option.icon}</span>
              )}
              <span className="flex-1">{option.label}</span>
              {option.value === value && (
                <Check className="w-4 h-4 text-blue-400" />
              )}
            </div>
          ))}
        </motion.div>
      )}

      {error && (
        <p className="text-sm text-red-400 mt-1 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

export function PostJob() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const skillInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<JobFormData>({ mode: 'onChange' });

  const budgetType = watch('budgetType');

  const handleAddSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (!trimmed) return;
    
    // Case-insensitive duplicate check
    const normalizedSkill = trimmed.toLowerCase();
    const exists = skills.some(s => s.toLowerCase() === normalizedSkill);
    
    if (exists) {
      toast.error('Skill already added');
      setSkillInput('');
      return;
    }
    
    // Validate skill length
    if (trimmed.length < 2) {
      toast.error('Skill must be at least 2 characters');
      return;
    }
    
    if (trimmed.length > 50) {
      toast.error('Skill must be less than 50 characters');
      return;
    }
    
    setSkills([...skills, trimmed]);
    setSkillInput('');
    toast.success('Skill added');
    
    // Focus back to input for better UX
    setTimeout(() => skillInputRef.current?.focus(), 100);
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
    toast('Skill removed', { icon: '🗑️' });
  };

  const handleSkillInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill(skillInput);
    }
    
    // Allow comma to add skill
    if (e.key === ',') {
      e.preventDefault();
      const skillWithoutComma = skillInput.replace(/,/g, '');
      handleAddSkill(skillWithoutComma);
    }
  };

  const handleSkillInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSkillInput(value);
    
    // Auto-add if user types a comma
    if (value.includes(',')) {
      const skillWithoutComma = value.replace(/,/g, '').trim();
      if (skillWithoutComma) {
        handleAddSkill(skillWithoutComma);
      }
    }
  };

  const onSubmit = async (data: JobFormData) => {
    if (skills.length === 0) {
      toast.error('Please add at least one skill requirement');
      setFormError('Please add at least one skill requirement.');
      return;
    }

    try {
      setLoading(true);
      setFormError(null);
      
      const jobData = {
        ...data,
        skills,
        budget: {
          min: data.budgetMin,
          max: data.budgetMax,
          type: data.budgetType
        },
        deadline: new Date(data.deadline)
      };

      const response = await jobsApi.createJob(jobData);
      
      if (response.success && response.data) {
        toast.success('Job posted successfully!');
        
        // Navigate to My Jobs page with the new job data for optimistic UI updates
        navigate('/my-jobs', { 
          state: { 
            newJob: response.data,
            fromPostJob: true,
            message: 'Job posted successfully!'
          } 
        });
      } else {
        throw new Error('Failed to create job');
      }
    } catch (error: unknown) {
      const e = error as { response?: { data?: { message?: string } } };
      const errorMessage = e.response?.data?.message || 'Failed to post job. Please try again.';
      setFormError(errorMessage);
      toast.error(errorMessage);
      console.error('Job posting error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'client') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-silver-100 mb-2">Access Denied</h2>
          <p className="text-silver-400">Only clients can post jobs.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
            <Plus className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-silver-100">Post a Job</h1>
            <p className="text-silver-400">Find the perfect freelancer for your project</p>
          </div>
        </div>
      </motion.div>

      {formError && (
        <div className="mb-4 text-red-400 text-sm text-center" aria-live="polite">{formError}</div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Information */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-silver-100 mb-6">Basic Information</h2>
          
          <div className="space-y-6">
            <Input
              label="Job Title"
              placeholder="e.g. Build a responsive React website"
              error={errors.title?.message}
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? 'job-title-error' : undefined}
              {...register('title', { 
                required: 'Job title is required',
                minLength: { value: 10, message: 'Title must be at least 10 characters' }
              })}
            />
            {errors.title && (
              <div id="job-title-error" className="text-red-400 text-xs mt-1" aria-live="polite">{errors.title.message}</div>
            )}

            <div>
              <label htmlFor="job-description" className="block text-sm font-medium text-silver-200 mb-2">
                Job Description
              </label>
              <textarea
                id="job-description"
                className="w-full px-3 py-2 glass-card text-silver-100 placeholder-silver-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 rounded-lg resize-none"
                rows={6}
                placeholder="Describe your project in detail. Include requirements, deliverables, and any specific instructions..."
                aria-invalid={!!errors.description}
                aria-describedby={errors.description ? 'job-description-error' : undefined}
                {...register('description', { 
                  required: 'Job description is required',
                  minLength: { value: 30, message: 'Description must be at least 30 characters' }
                })}
              />
              {errors.description && (
                <div id="job-description-error" className="text-red-400 text-xs mt-1" aria-live="polite">{errors.description.message}</div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CustomDropdown
                label="Category"
                options={[
                  { value: 'Web Development', label: 'Web Development', icon: <Code className="w-4 h-4" /> },
                  { value: 'Mobile Development', label: 'Mobile Development', icon: <Code className="w-4 h-4" /> },
                  { value: 'Design & Creative', label: 'Design & Creative', icon: <Palette className="w-4 h-4" /> },
                  { value: 'Writing & Translation', label: 'Writing & Translation', icon: <PenTool className="w-4 h-4" /> },
                  { value: 'Digital Marketing', label: 'Digital Marketing', icon: <Megaphone className="w-4 h-4" /> },
                  { value: 'Data Science', label: 'Data Science', icon: <BarChart3 className="w-4 h-4" /> },
                  { value: 'Admin Support', label: 'Admin Support', icon: <Headphones className="w-4 h-4" /> },
                  { value: 'Customer Service', label: 'Customer Service', icon: <Users className="w-4 h-4" /> },
                  { value: 'Sales & Marketing', label: 'Sales & Marketing', icon: <Megaphone className="w-4 h-4" /> },
                  { value: 'Engineering & Architecture', label: 'Engineering & Architecture', icon: <Building2 className="w-4 h-4" /> }
                ]}
                value={watch('category')}
                onChange={(value) => {
                  // Update the form value
                  const event = { target: { value } };
                  register('category').onChange(event);
                }}
                placeholder="Select a category"
                error={errors.category?.message}
                required
              />

              <CustomDropdown
                label="Experience Level"
                options={[
                  { value: 'entry', label: 'Entry Level', icon: <Users className="w-4 h-4" /> },
                  { value: 'intermediate', label: 'Intermediate', icon: <Code className="w-4 h-4" /> },
                  { value: 'expert', label: 'Expert', icon: <Building2 className="w-4 h-4" /> }
                ]}
                value={watch('experienceLevel')}
                onChange={(value) => {
                  const event = { target: { value } };
                  register('experienceLevel').onChange(event);
                }}
                placeholder="Select experience level"
                error={errors.experienceLevel?.message}
                required
              />
            </div>
          </div>
        </Card>

        {/* Skills Required */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-silver-100 mb-6">Skills Required</h2>
          
          {/* Selected Skills */}
          {skills.length > 0 ? (
            <div className="mb-4">
              <p className="text-sm text-silver-400 mb-3">Selected skills ({skills.length}):</p>
              <div className="flex flex-wrap gap-2" aria-label="Selected skills">
                {skills.map((skill) => (
                  <div
                    key={skill}
                    className="flex items-center gap-2 cursor-pointer hover:bg-red-600/20 hover:text-red-400 transition-all duration-200 px-3 py-2 text-base rounded-full bg-blue-600/20 text-blue-400 border border-blue-600/30 hover:border-red-600/30 group"
                    tabIndex={0}
                    aria-label={`Remove skill ${skill}`}
                    onClick={() => handleRemoveSkill(skill)}
                    onKeyDown={(e: React.KeyboardEvent) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleRemoveSkill(skill);
                      }
                    }}
                  >
                    <span className="font-medium">{skill}</span>
                    <X className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mb-4 p-3 bg-yellow-600/10 border border-yellow-600/20 rounded-lg">
              <p className="text-sm text-yellow-400">
                💡 Add at least one skill requirement to help freelancers find your job
              </p>
            </div>
          )}

          {/* Add Skill */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-silver-200 mb-2">
              Add Skills
            </label>
            <div className="flex space-x-2">
              <Input
                ref={skillInputRef}
                placeholder="Type a skill and press Enter or click Add..."
                value={skillInput}
                onChange={handleSkillInputChange}
                onKeyDown={handleSkillInputKeyDown}
                aria-label="Add skill input"
                className="flex-1"
              />
              <Button
                type="button"
                onClick={() => handleAddSkill(skillInput)}
                disabled={!skillInput.trim()}
                aria-label="Add skill"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                Add
              </Button>
            </div>
            <p className="text-xs text-silver-400 mt-1">
              Press Enter to add, or click on popular skills below
            </p>
          </div>

          {/* Popular Skills */}
          <div>
            <p className="text-sm text-silver-400 mb-3">Popular skills:</p>
            <div className="flex flex-wrap gap-2">
              {POPULAR_SKILLS.map((skill) => {
                const isSelected = skills.includes(skill);
                return (
                  <div
                    key={skill}
                    className={`cursor-pointer transition-all duration-200 px-3 py-1 text-base rounded-full font-medium border ${
                      isSelected 
                        ? 'bg-blue-600/20 text-blue-400 border-blue-600/30 hover:bg-red-600/20 hover:text-red-400 hover:border-red-600/30' 
                        : 'bg-silver-600/20 text-silver-200 border-silver-600/30 hover:bg-blue-600/20 hover:text-blue-400 hover:border-blue-600/30'
                    }`}
                    onClick={() => {
                      if (isSelected) {
                        handleRemoveSkill(skill);
                      } else {
                        handleAddSkill(skill);
                      }
                    }}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (isSelected) {
                          handleRemoveSkill(skill);
                        } else {
                          handleAddSkill(skill);
                        }
                      }
                    }}
                    aria-label={isSelected ? `Remove skill ${skill}` : `Add skill ${skill}`}
                  >
                    <div className="flex items-center gap-1">
                      {skill}
                      {isSelected && <X className="w-3 h-3" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Budget & Timeline */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-silver-100 mb-6">Budget & Timeline</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-silver-200 mb-3">
                Budget Type
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center space-x-3 p-4 glass-card rounded-lg cursor-pointer hover:bg-black/30 transition-colors">
                  <input
                    type="radio"
                    value="fixed"
                    {...register('budgetType', { required: 'Budget type is required' })}
                    className="text-blue-500"
                  />
                  <div>
                    <div className="font-medium text-silver-100">Fixed Price</div>
                    <div className="text-sm text-silver-400">One-time payment for the entire project</div>
                  </div>
                </label>
                
                <label className="flex items-center space-x-3 p-4 glass-card rounded-lg cursor-pointer hover:bg-black/30 transition-colors">
                  <input
                    type="radio"
                    value="hourly"
                    {...register('budgetType', { required: 'Budget type is required' })}
                    className="text-blue-500"
                  />
                  <div>
                    <div className="font-medium text-silver-100">Hourly Rate</div>
                    <div className="text-sm text-silver-400">Pay per hour of work</div>
                  </div>
                </label>
              </div>
              {errors.budgetType && (
                <p className="text-sm text-red-400 mt-1">{errors.budgetType.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label={`Minimum ${budgetType === 'hourly' ? 'Hourly Rate' : 'Budget'}`}
                type="number"
                min="1"
                step="1"
                icon={<DollarSign className="w-4 h-4" />}
                placeholder="0"
                error={errors.budgetMin?.message}
                {...register('budgetMin', { 
                  required: 'Minimum budget is required',
                  min: { value: 1, message: 'Budget must be at least $1' }
                })}
              />

              <Input
                label={`Maximum ${budgetType === 'hourly' ? 'Hourly Rate' : 'Budget'}`}
                type="number"
                min="1"
                step="1"
                icon={<DollarSign className="w-4 h-4" />}
                placeholder="0"
                error={errors.budgetMax?.message}
                {...register('budgetMax', { 
                  required: 'Maximum budget is required',
                  min: { value: 1, message: 'Budget must be at least $1' }
                })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Project Deadline"
                type="date"
                icon={<Calendar className="w-4 h-4" />}
                error={errors.deadline?.message}
                {...register('deadline', { required: 'Deadline is required' })}
              />

              <CustomDropdown
                label="Project Length"
                options={[
                  { value: 'less_than_1_month', label: 'Less than 1 month', icon: <Clock className="w-4 h-4" /> },
                  { value: '1_to_3_months', label: '1 to 3 months', icon: <Clock className="w-4 h-4" /> },
                  { value: '3_to_6_months', label: '3 to 6 months', icon: <Clock className="w-4 h-4" /> },
                  { value: 'more_than_6_months', label: 'More than 6 months', icon: <Clock className="w-4 h-4" /> }
                ]}
                value={watch('projectLength')}
                onChange={(value) => {
                  const event = { target: { value } };
                  register('projectLength').onChange(event);
                }}
                placeholder="Select project length"
                error={errors.projectLength?.message}
                required
              />
            </div>
          </div>
        </Card>

        {/* Submit */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/dashboard')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={loading}
            className="px-8"
          >
            Post Job
          </Button>
        </div>
      </form>
    </div>
  );
}
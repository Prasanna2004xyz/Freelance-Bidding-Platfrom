import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { JobFilters as JobFiltersType } from '../../types';
import toast from 'react-hot-toast';

interface JobFiltersProps {
  filters: JobFiltersType;
  onFiltersChange: (filters: JobFiltersType) => void;
  onClearFilters: () => void;
}

const POPULAR_SKILLS = [
  'React', 'Node.js', 'Python', 'JavaScript', 'TypeScript',
  'Vue.js', 'Angular', 'PHP', 'Laravel', 'WordPress',
  'Graphic Design', 'UI/UX Design', 'Content Writing', 'SEO',
  'Digital Marketing', 'Data Analysis', 'Machine Learning'
];

const BUDGET_RANGES = [
  { label: 'Under $500', min: 0, max: 500 },
  { label: '$500 - $1,000', min: 500, max: 1000 },
  { label: '$1,000 - $5,000', min: 1000, max: 5000 },
  { label: '$5,000+', min: 5000, max: null },
];

export function JobFilters({ filters, onFiltersChange, onClearFilters }: JobFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [skillInput, setSkillInput] = useState('');

  const handleSearchChange = (search: string) => {
    onFiltersChange({ ...filters, search });
  };

  const handleSkillAdd = (skill: string) => {
    const trimmed = skill.trim();
    if (!trimmed) return;
    
    // Case-insensitive duplicate check
    const normalizedSkill = trimmed.toLowerCase();
    const exists = filters.skills?.some(s => s.toLowerCase() === normalizedSkill);
    
    if (exists) {
      toast.error('Skill already added');
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
    
    onFiltersChange({
      ...filters,
      skills: [...(filters.skills || []), trimmed]
    });
    setSkillInput('');
  };

  const handleSkillRemove = (skill: string) => {
    onFiltersChange({
      ...filters,
      skills: filters.skills?.filter(s => s !== skill) || []
    });
  };

  const handleSkillInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSkillAdd(skillInput);
    }
    
    // Allow comma to add skill
    if (e.key === ',') {
      e.preventDefault();
      const skillWithoutComma = skillInput.replace(/,/g, '');
      handleSkillAdd(skillWithoutComma);
    }
  };

  const handleSkillInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSkillInput(value);
    
    // Auto-add if user types a comma
    if (value.includes(',')) {
      const skillWithoutComma = value.replace(/,/g, '').trim();
      if (skillWithoutComma) {
        handleSkillAdd(skillWithoutComma);
      }
    }
  };

  const handleBudgetRangeSelect = (range: typeof BUDGET_RANGES[0]) => {
    onFiltersChange({
      ...filters,
      budgetMin: range.min,
      budgetMax: range.max
    });
  };

  const handleBudgetTypeChange = (budgetType: 'fixed' | 'hourly') => {
    onFiltersChange({
      ...filters,
      budgetType: filters.budgetType === budgetType ? undefined : budgetType
    });
  };

  const handleDatePostedChange = (datePosted: 'today' | 'week' | 'month') => {
    onFiltersChange({
      ...filters,
      datePosted: filters.datePosted === datePosted ? undefined : datePosted
    });
  };

  const hasActiveFilters = filters.skills?.length || filters.budgetMin || filters.budgetMax || 
                          filters.budgetType || filters.datePosted;

  return (
    <Card className="p-6 mb-6">
      <div className="space-y-6">
        {/* Search */}
        <div className="relative">
          <Input
            placeholder="Search jobs..."
            value={filters.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            icon={<Search className="w-4 h-4" />}
            className="pr-12"
          />
          {filters.search && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSearchChange('')}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Quick Filters */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center space-x-2"
          >
            <Filter className="w-4 h-4" />
            <span>Advanced Filters</span>
          </Button>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              onClick={onClearFilters}
              className="text-red-400 hover:text-red-300"
            >
              Clear All
            </Button>
          )}
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-6 pt-4 border-t border-silver-200/10"
          >
            {/* Skills */}
            <div>
              <label className="block text-sm font-medium text-silver-200 mb-3">
                Skills
              </label>
              
              {/* Selected Skills */}
              {filters.skills && filters.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {filters.skills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="info"
                      className="cursor-pointer hover:bg-red-600/20 hover:text-red-400 transition-colors"
                      onClick={() => handleSkillRemove(skill)}
                    >
                      {skill} <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              )}

              {/* Skill Input */}
              <div className="flex space-x-2 mb-3">
                <Input
                  placeholder="Add skill..."
                  value={skillInput}
                  onChange={handleSkillInputChange}
                  onKeyDown={handleSkillInputKeyDown}
                />
                <Button
                  onClick={() => handleSkillAdd(skillInput)}
                  disabled={!skillInput.trim()}
                >
                  Add
                </Button>
              </div>

              {/* Popular Skills */}
              <div className="flex flex-wrap gap-2">
                {POPULAR_SKILLS.filter(skill => !filters.skills?.includes(skill)).map((skill) => (
                  <Badge
                    key={skill}
                    variant="default"
                    className="cursor-pointer hover:bg-blue-600/20 hover:text-blue-400 transition-colors"
                    onClick={() => handleSkillAdd(skill)}
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Budget Range */}
            <div>
              <label className="block text-sm font-medium text-silver-200 mb-3">
                Budget Range
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {BUDGET_RANGES.map((range) => (
                  <Button
                    key={range.label}
                    variant={
                      filters.budgetMin === range.min && filters.budgetMax === range.max
                        ? 'primary'
                        : 'secondary'
                    }
                    size="sm"
                    onClick={() => handleBudgetRangeSelect(range)}
                  >
                    {range.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Budget Type */}
            <div>
              <label className="block text-sm font-medium text-silver-200 mb-3">
                Budget Type
              </label>
              <div className="flex space-x-2">
                <Button
                  variant={filters.budgetType === 'fixed' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => handleBudgetTypeChange('fixed')}
                >
                  Fixed Price
                </Button>
                <Button
                  variant={filters.budgetType === 'hourly' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => handleBudgetTypeChange('hourly')}
                >
                  Hourly Rate
                </Button>
              </div>
            </div>

            {/* Date Posted */}
            <div>
              <label className="block text-sm font-medium text-silver-200 mb-3">
                Date Posted
              </label>
              <div className="flex space-x-2">
                <Button
                  variant={filters.datePosted === 'today' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => handleDatePostedChange('today')}
                >
                  Today
                </Button>
                <Button
                  variant={filters.datePosted === 'week' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => handleDatePostedChange('week')}
                >
                  This Week
                </Button>
                <Button
                  variant={filters.datePosted === 'month' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => handleDatePostedChange('month')}
                >
                  This Month
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </Card>
  );
}
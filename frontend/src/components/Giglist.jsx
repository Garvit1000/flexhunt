import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, Search, Filter, Badge, X } from 'lucide-react';
import { useGigs } from './useGigs';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { GigCard } from './GigCard';

const GIG_CATEGORIES = [
  { id: 'programming', name: 'Programming & Tech', icon: '💻' },
  { id: 'graphics', name: 'Graphics & Design', icon: '🎨' },
  { id: 'digital-marketing', name: 'Digital Marketing', icon: '📱' },
  { id: 'writing', name: 'Writing & Translation', icon: '✍️' },
  { id: 'video', name: 'Video & Animation', icon: '🎥' },
  { id: 'ai-services', name: 'AI Services', icon: '🤖' },
  { id: 'music', name: 'Music & Audio', icon: '🎵' },
  { id: 'business', name: 'Business', icon: '💼' },
  { id: 'consulting', name: 'Consulting', icon: '👥' }
];

const CategoryFilter = ({ selectedCategory, onSelectCategory }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-800">Categories</h3>
        </div>
        {selectedCategory && (
          <button
            onClick={() => onSelectCategory(null)}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center space-x-1"
          >
            <X className="w-4 h-4" />
            <span>Clear</span>
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {GIG_CATEGORIES.map((category) => (
          <button
            key={category.id}
            onClick={() => onSelectCategory(category.id === selectedCategory ? null : category.id)}
            className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-all duration-200 transform hover:scale-105 ${
              category.id === selectedCategory
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
            }`}
          >
            <span className="text-xl">{category.icon}</span>
            <span className="text-sm font-medium">{category.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const SkillsFilter = ({ allSkills, selectedSkills, onToggleSkill }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const displaySkills = isExpanded ? allSkills : allSkills.slice(0, 8);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Badge className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-800">Skills</h3>
        </div>
        {selectedSkills.length > 0 && (
          <button
            onClick={() => onToggleSkill(null)}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center space-x-1"
          >
            <X className="w-4 h-4" />
            <span>Clear all</span>
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {displaySkills.map((skill) => (
          <button
            key={skill}
            onClick={() => onToggleSkill(skill)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
              selectedSkills.includes(skill)
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
            }`}
          >
            {skill}
          </button>
        ))}
        {allSkills.length > 8 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            {isExpanded ? 'Show less' : `+${allSkills.length - 8} more`}
          </button>
        )}
      </div>
    </div>
  );
};

const SearchBar = ({ value, onChange }) => {
  return (
    <div className="relative group">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors duration-200" />
      <Input
        type="text"
        placeholder="Search for gigs..."
        value={value}
        onChange={onChange}
        className="pl-10 h-12 text-lg border-2 focus:border-blue-600 transition-colors duration-200"
      />
    </div>
  );
};

const LoadingState = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center space-y-4">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
      <p className="text-gray-600 animate-pulse">Loading gigs...</p>
    </div>
  </div>
);

const EmptyState = () => (
  <Card className="p-12 text-center transform hover:scale-105 transition-transform duration-200">
    <CardContent className="space-y-4">
      <AlertCircle className="w-12 h-12 text-gray-400 mx-auto animate-bounce" />
      <div>
        <p className="text-xl font-semibold text-gray-800">No gigs found</p>
        <p className="text-gray-600 mt-2">Try adjusting your search or filters</p>
      </div>
    </CardContent>
  </Card>
);

const ActiveFilters = ({ selectedCategory, selectedSkills, onClearCategory, onRemoveSkill }) => {
  if (!selectedCategory && selectedSkills.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <span className="text-sm text-gray-600">Active filters:</span>
      {selectedCategory && (
        <button
          onClick={onClearCategory}
          className="flex items-center space-x-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm hover:bg-blue-200 transition-colors duration-200"
        >
          <span>{GIG_CATEGORIES.find(cat => cat.id === selectedCategory)?.name}</span>
          <X className="w-4 h-4" />
        </button>
      )}
      {selectedSkills.map(skill => (
        <button
          key={skill}
          onClick={() => onRemoveSkill(skill)}
          className="flex items-center space-x-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm hover:bg-blue-200 transition-colors duration-200"
        >
          <span>{skill}</span>
          <X className="w-4 h-4" />
        </button>
      ))}
    </div>
  );
};

const GigList = () => {
  const { gigs, loading, error } = useGigs();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [animate, setAnimate] = useState(false);

  const allSkills = [...new Set(gigs.flatMap(gig => gig.skills || []))];

  const filteredGigs = gigs.filter(gig => {
    const matchesSearch = searchTerm === '' || 
      gig.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gig.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSkills = selectedSkills.length === 0 ||
      selectedSkills.every(skill => gig.skills?.includes(skill));
    
    const matchesCategory = !selectedCategory || gig.category === selectedCategory;
    
    return matchesSearch && matchesSkills && matchesCategory;
  });

  const toggleSkill = (skill) => {
    if (skill === null) {
      setSelectedSkills([]);
    } else {
      setSelectedSkills(prev =>
        prev.includes(skill)
          ? prev.filter(s => s !== skill)
          : [...prev, skill]
      );
    }
    setAnimate(true);
  };

  useEffect(() => {
    if (animate) {
      const timer = setTimeout(() => setAnimate(false), 300);
      return () => clearTimeout(timer);
    }
  }, [animate]);

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto my-8">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Failed to load gigs: {error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="grid gap-6">
        <SearchBar 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <CategoryFilter 
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        {allSkills.length > 0 && (
          <SkillsFilter
            allSkills={allSkills}
            selectedSkills={selectedSkills}
            onToggleSkill={toggleSkill}
          />
        )}

        <ActiveFilters
          selectedCategory={selectedCategory}
          selectedSkills={selectedSkills}
          onClearCategory={() => setSelectedCategory(null)}
          onRemoveSkill={toggleSkill}
        />
      </div>

      {filteredGigs.length === 0 ? (
        <EmptyState />
      ) : (
        <div>
          <p className="text-gray-600 mb-6">
            {filteredGigs.length} gig{filteredGigs.length === 1 ? '' : 's'} found
          </p>
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${
            animate ? 'animate-pulse' : ''
          }`}>
            {filteredGigs.map((gig) => (
              <GigCard 
                key={gig.id} 
                {...gig}
                categoryName={GIG_CATEGORIES.find(cat => cat.id === gig.category)?.name}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export { GIG_CATEGORIES, GigList };
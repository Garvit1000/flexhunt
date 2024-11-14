import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GIG_CATEGORIES } from '../components/Giglist';
import { useAuth } from '../components/AuthContext';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
const CreateGig = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth(); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deliveryTime: '',
    startingPrice: '',
    projectLinks: [''],
    skills: [''],
    image: '',
    category: '',
    provider: currentUser?.displayName || currentUser?.email || '',
    providerId: currentUser?.uid || '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCategoryChange = (value) => {
    setFormData(prev => ({
      ...prev,
      category: value
    }));
  };

  const handleArrayInputChange = (index, field, value) => {
    setFormData(prev => {
      const newArray = [...prev[field]];
      newArray[index] = value;
      return {
        ...prev,
        [field]: newArray
      };
    });
  };

  const addArrayField = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayField = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      if (!formData.title || !formData.description || !formData.startingPrice || !formData.category) {
        throw new Error('Please fill in all required fields');
      }

      if (!currentUser) {
        throw new Error('You must be logged in to create a gig');
      }

      const gigData = {
        ...formData,
        rating: 0,
        reviews: 0,
        createdAt: new Date().toISOString(),
        projectLinks: formData.projectLinks.filter(link => link.trim() !== ''),
        skills: formData.skills.filter(skill => skill.trim() !== ''),
        startingPrice: parseFloat(formData.startingPrice),
        provider: currentUser.displayName || currentUser.email,
        providerId: currentUser.uid,
        providerEmail: currentUser.email,
      };

      const db = getFirestore();
      const gigsRef = collection(db, 'gigs');
      const docRef = await addDoc(gigsRef, gigData);

      navigate('/gigs');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto my-8">
    <CardHeader>
      <CardTitle>Create a New Gig</CardTitle>
    </CardHeader>
    <CardContent>
      {!currentUser ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Please log in to create a gig</AlertDescription>
        </Alert>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2 relative">
            <Label htmlFor="category">Category *</Label>
            <Select
              value={formData.category}
              onValueChange={handleCategoryChange}
              required
            >
              <SelectTrigger className="w-full bg-white">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent className="z-50 bg-white shadow-lg border border-gray-200 rounded-md">
                {GIG_CATEGORIES.map((category) => (
                  <SelectItem 
                    key={category.id} 
                    value={category.id}
                    className="hover:bg-gray-100 cursor-pointer py-2 px-4"
                  >
                    <span className="flex items-center space-x-2">
                      <span className="text-lg">{category.icon}</span>
                      <span>{category.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

            <div className="space-y-2">
              <Label htmlFor="title">Gig Title *</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="I will..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe your gig in detail..."
                required
                className="h-32"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deliveryTime">Delivery Time *</Label>
                <Input
                  id="deliveryTime"
                  name="deliveryTime"
                  value={formData.deliveryTime}
                  onChange={handleInputChange}
                  placeholder="e.g., 2 days"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startingPrice">Starting Price ($) *</Label>
                <Input
                  id="startingPrice"
                  name="startingPrice"
                  type="number"
                  value={formData.startingPrice}
                  onChange={handleInputChange}
                  placeholder="29.99"
                  required
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Project Links</Label>
              {formData.projectLinks.map((link, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={link}
                    onChange={(e) => handleArrayInputChange(index, 'projectLinks', e.target.value)}
                    placeholder="https://..."
                  />
                  {formData.projectLinks.length > 1 && (
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={() => removeArrayField('projectLinks', index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => addArrayField('projectLinks')}
                className="mt-2"
              >
                Add Project Link
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Skills</Label>
              {formData.skills.map((skill, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={skill}
                    onChange={(e) => handleArrayInputChange(index, 'skills', e.target.value)}
                    placeholder="e.g., React, Node.js"
                  />
                  {formData.skills.length > 1 && (
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={() => removeArrayField('skills', index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => addArrayField('skills')}
                className="mt-2"
              >
                Add Skill
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Image URL *</Label>
              <Input
                id="image"
                name="image"
                value={formData.image}
                onChange={handleInputChange}
                placeholder="https://..."
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Gig'}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

export default CreateGig;
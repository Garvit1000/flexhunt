import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFirestore, doc, updateDoc, getDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

const EditGigForm = ({ gigId, isOpen, onClose, onUpdate }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        deliveryTime: '',
        startingPrice: '',
        category: '',
        skills: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchGigData = async () => {
            if (!gigId) return;
            
            try {
                const db = getFirestore();
                const gigDoc = await getDoc(doc(db, 'gigs', gigId));
                
                if (gigDoc.exists()) {
                    const data = gigDoc.data();
                    setFormData({
                        title: data.title || '',
                        description: data.description || '',
                        deliveryTime: data.deliveryTime || '',
                        startingPrice: data.startingPrice || '',
                        category: data.category || '',
                        skills: (data.skills || []).join(', '),
                    });
                }
            } catch (err) {
                setError('Failed to load gig data');
                console.error('Error fetching gig:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchGigData();
    }, [gigId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            const db = getFirestore();
            const gigRef = doc(db, 'gigs', gigId);

            const updatedData = {
                ...formData,
                startingPrice: parseFloat(formData.startingPrice),
                skills: formData.skills.split(',').map(skill => skill.trim()).filter(Boolean),
                updatedAt: new Date().toISOString()
            };

            await updateDoc(gigRef, updatedData);
            onUpdate && onUpdate(updatedData);
            onClose();
        } catch (err) {
            setError('Failed to update gig. Please try again.');
            console.error('Error updating gig:', err);
        } finally {
            setSaving(false);
        }
    };

    const categories = [
        "Development",
        "Design",
        "Writing",
        "Marketing",
        "Business",
        "Lifestyle",
        "Music",
        "Other"
    ];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg bg-white border shadow-lg">
                <DialogHeader className="bg-white">
                    <DialogTitle className="text-xl font-semibold">Edit Gig</DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="flex items-center justify-center p-4 bg-white">
                        <Loader2 className="h-6 w-4 animate-spin" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4 bg-white relative">
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                className="bg-white"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                required
                                rows={4}
                                className="bg-white"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="deliveryTime">Delivery Time</Label>
                                <Input
                                    id="deliveryTime"
                                    name="deliveryTime"
                                    value={formData.deliveryTime}
                                    onChange={handleChange}
                                    required
                                    placeholder="e.g. 2-3 days"
                                    className="bg-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="startingPrice">Starting Price ($)</Label>
                                <Input
                                    id="startingPrice"
                                    name="startingPrice"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.startingPrice}
                                    onChange={handleChange}
                                    required
                                    className="bg-white"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Select 
                                value={formData.category} 
                                onValueChange={(value) => 
                                    handleChange({ target: { name: 'category', value }})
                                }
                            >
                                <SelectTrigger className="bg-white">
                                    <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                <SelectContent className="bg-white z-50" position="popper" sideOffset={5}>
                                    {categories.map((category) => (
                                        <SelectItem 
                                            key={category} 
                                            value={category}
                                            className="cursor-pointer hover:bg-gray-100"
                                        >
                                            {category}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="skills">
                                Skills (comma-separated)
                            </Label>
                            <Input
                                id="skills"
                                name="skills"
                                value={formData.skills}
                                onChange={handleChange}
                                placeholder="e.g. JavaScript, React, Node.js"
                                className="bg-white"
                            />
                        </div>

                        <DialogFooter className="bg-white pt-4 mt-4 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                className="bg-white"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={saving}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save Changes'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default EditGigForm;
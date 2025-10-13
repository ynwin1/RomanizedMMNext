import React, { useState } from 'react';
import {Action} from "@/app/(pages)/[locale]/(admin)/admin/dashboard/page";
import {IArtist} from "@/app/model/Artist";
import {ArtistType} from "@/app/lib/types";

interface ArtistFormProps {
    mode: Action.ADD | Action.EDIT;
    initialData?: Partial<IArtist>;
    onCancel?: () => void;
}

export default function ArtistForm({ mode, initialData, onCancel }: ArtistFormProps) {
    const [formData, setFormData] = useState<Partial<IArtist>>(initialData || {
        name: '',
        slug: '',
        imageLink: '',
        bannerLink: '',
        biography: '',
        biographyMy: '',
        unknownFact: '',
        type: ArtistType.Singer,
        members: [{ name: '', imageLink: '', slug: '' }],
        origin: [],
        labels: [],
        musicGenre: [],
        songs: [],
        socials: {},
        likes: 0,
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (field: keyof IArtist, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleArrayChange = (field: keyof IArtist, value: string) => {
        const items = value.split(',').map(item => item.trim()).filter(Boolean);
        setFormData(prev => ({ ...prev, [field]: items }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSubmit(formData);
        } finally {
            setIsSubmitting(false);
        }
    };

    const onSubmit = async (data: Partial<IArtist>) => {
        console.log(`Submitting Artist Data for Action: ${data}`);
        switch (mode) {
            case Action.ADD:
                // Call API to add artist
                console.log('Adding artist:', data);
                break;
            case Action.EDIT:
                // Call API to update artist
                console.log('Updating artist:', data);
                break;
            default:
                throw new Error('Invalid action');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information Section */}
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <span className="text-2xl mr-2">ℹ️</span>
                    Basic Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.name || ''}
                            onChange={(e) => handleChange('name', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="Enter artist name"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Slug <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.slug || ''}
                            onChange={(e) => handleChange('slug', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="artist-name-url-slug"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={formData.type || ''}
                        onChange={(e) => handleChange('type', e.target.value as ArtistType)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
                        required
                    >
                        <option value="">Select artist type</option>
                        {Object.values(ArtistType).map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Media Links Section */}
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <span className="text-2xl mr-2">🖼️</span>
                    Media Links
                </h3>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Image Link <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="url"
                        value={formData.imageLink || ''}
                        onChange={(e) => handleChange('imageLink', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        placeholder="https://example.com/artist-image.jpg"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Banner Link
                    </label>
                    <input
                        type="url"
                        value={formData.bannerLink || ''}
                        onChange={(e) => handleChange('bannerLink', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        placeholder="https://example.com/artist-banner.jpg"
                    />
                </div>
            </div>

            {/* Biography Section */}
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <span className="text-2xl mr-2">📝</span>
                    Biography & Details
                </h3>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Biography
                    </label>
                    <textarea
                        value={formData.biography || ''}
                        onChange={(e) => handleChange('biography', e.target.value)}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                        placeholder="Enter artist biography..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        My Biography
                    </label>
                    <textarea
                        value={formData.biographyMy || ''}
                        onChange={(e) => handleChange('biographyMy', e.target.value)}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                        placeholder="Enter personal biography..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Unknown Fact
                    </label>
                    <textarea
                        value={formData.unknownFact || ''}
                        onChange={(e) => handleChange('unknownFact', e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                        placeholder="Enter an interesting unknown fact..."
                    />
                </div>
            </div>

            {/* Categories Section */}
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <span className="text-2xl mr-2">🏷️</span>
                    Categories & Tags
                </h3>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Music Genres <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={formData.musicGenre?.join(', ') || ''}
                        onChange={(e) => handleArrayChange('musicGenre', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        placeholder="Pop, Rock, R&B"
                        required
                    />
                    <p className="text-xs text-gray-500 mt-1">Separate genres with commas</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Origin
                    </label>
                    <input
                        type="text"
                        value={formData.origin?.join(', ') || ''}
                        onChange={(e) => handleArrayChange('origin', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        placeholder="Yangon, Myanmar"
                    />
                    <p className="text-xs text-gray-500 mt-1">Separate locations with commas</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Labels
                    </label>
                    <input
                        type="text"
                        value={formData.labels?.join(', ') || ''}
                        onChange={(e) => handleArrayChange('labels', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        placeholder="Atlantic Records, Warner Music"
                    />
                    <p className="text-xs text-gray-500 mt-1">Separate labels with commas</p>
                </div>
            </div>

            {/* Social Media Section */}
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <span className="text-2xl mr-2">🔗</span>
                    Social Media Links
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Facebook
                        </label>
                        <input
                            type="url"
                            placeholder="https://facebook.com/artist"
                            value={formData.socials?.facebook || ''}
                            onChange={(e) => handleChange('socials', { ...formData.socials, facebook: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Instagram
                        </label>
                        <input
                            type="url"
                            placeholder="https://instagram.com/artist"
                            value={formData.socials?.instagram || ''}
                            onChange={(e) => handleChange('socials', { ...formData.socials, instagram: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            YouTube
                        </label>
                        <input
                            type="url"
                            placeholder="https://youtube.com/@artist"
                            value={formData.socials?.youtube || ''}
                            onChange={(e) => handleChange('socials', { ...formData.socials, youtube: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Spotify
                        </label>
                        <input
                            type="url"
                            placeholder="https://open.spotify.com/artist/..."
                            value={formData.socials?.spotify || ''}
                            onChange={(e) => handleChange('socials', { ...formData.socials, spotify: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Apple Music
                        </label>
                        <input
                            type="url"
                            placeholder="https://music.apple.com/artist/..."
                            value={formData.socials?.appleMusic || ''}
                            onChange={(e) => handleChange('socials', { ...formData.socials, appleMusic: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                        isSubmitting
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'
                    } text-white`}
                >
                    {isSubmitting ? (
                        <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Saving...
            </span>
                    ) : (
                        mode === Action.ADD ? '✓ Add Artist' : '✓ Update Artist'
                    )}
                </button>

                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-3 rounded-lg font-medium bg-gray-200 hover:bg-gray-300 text-gray-700 transition-all duration-200"
                    >
                        Cancel
                    </button>
                )}
            </div>
        </form>
    );
}
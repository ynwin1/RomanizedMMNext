"use client"
import React, { useState } from 'react';
import {ISong} from "@/app/model/Song";
import {Action} from "@/app/(pages)/[locale]/(admin)/admin/dashboard/page";

interface SongFormProps {
    mode: Action.ADD | Action.EDIT;
    initialData?: Partial<ISong>;
    onCancel?: () => void;
}

const onSubmit = async (data: Partial<ISong>) => {
    // Prepare Song Object To Save Via API
    console.log('Submitting:', data);
};

export default function SongForm({ mode, initialData, onCancel }: SongFormProps) {
    const [formData, setFormData] = useState<Partial<ISong>>(initialData || {
        mmid: 0,
        songName: '',
        artistName: [{ name: '', slug: '' }],
        albumName: '',
        genre: '',
        spotifyTrackId: '',
        spotifyLink: '',
        appleMusicLink: '',
        youtubeLink: [],
        imageLink: '',
        about: '',
        whenToListen: '',
        lyrics: '',
        romanized: '',
        burmese: '',
        meaning: '',
        isRequested: false,
        requestedBy: '',
        songStoryEn: '',
        songStoryMy: '',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (field: keyof ISong, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleArrayChange = (field: keyof ISong, value: string) => {
        const items = value.split(',').map(item => item.trim()).filter(Boolean);
        setFormData(prev => ({ ...prev, [field]: items }));
    };

    const handleArtistChange = (index: number, field: 'name' | 'slug', value: string) => {
        const updatedArtists = [...(formData.artistName || [])];
        updatedArtists[index] = { ...updatedArtists[index], [field]: value };
        setFormData((prev) => ({
            ...prev,
            artistName: updatedArtists as any // Type assertion to handle tuple type
        }));
    };

    const addArtist = () => {
        setFormData((prev) => ({
            ...prev,
            artistName: [...(prev.artistName || []), { name: '', slug: '' }] as any
        }));
    };

    const removeArtist = (index: number) => {
        if ((formData.artistName?.length || 0) <= 1) {
            alert('At least one artist is required');
            return;
        }
        const updatedArtists = formData.artistName?.filter((_, i) => i !== index) || [];
        setFormData(prev => ({ ...prev, artistName: updatedArtists as any }));
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
                            MMID <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            value={formData.mmid || ''}
                            onChange={(e) => handleChange('mmid', parseInt(e.target.value))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="Enter unique song ID"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Song Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.songName || ''}
                            onChange={(e) => handleChange('songName', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="Enter song name"
                            required
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Album Name
                        </label>
                        <input
                            type="text"
                            value={formData.albumName || ''}
                            onChange={(e) => handleChange('albumName', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="Enter album name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Genre <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.genre || ''}
                            onChange={(e) => handleChange('genre', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="Pop, Rock, R&B, etc."
                            required
                        />
                    </div>
                </div>
            </div>

            {/* Artist Information Section */}
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                        <span className="text-2xl mr-2">🎤</span>
                        Artist Information
                    </h3>
                    <button
                        type="button"
                        onClick={addArtist}
                        className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-all"
                    >
                        + Add Artist
                    </button>
                </div>

                {formData.artistName?.map((artist, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg border border-gray-200 space-y-3">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-600">Artist {index + 1}</span>
                            {(formData.artistName?.length || 0) > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeArtist(index)}
                                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                                >
                                    ✕ Remove
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={artist.name || ''}
                                    onChange={(e) => handleArtistChange(index, 'name', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    placeholder="Artist name"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Slug
                                </label>
                                <input
                                    type="text"
                                    value={artist.slug || ''}
                                    onChange={(e) => handleArtistChange(index, 'slug', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    placeholder="artist-slug"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Media Links Section */}
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <span className="text-2xl mr-2">🔗</span>
                    Media Links
                </h3>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Image Link
                    </label>
                    <input
                        type="url"
                        value={formData.imageLink || ''}
                        onChange={(e) => handleChange('imageLink', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        placeholder="https://example.com/song-cover.jpg"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Spotify Track ID
                        </label>
                        <input
                            type="text"
                            value={formData.spotifyTrackId || ''}
                            onChange={(e) => handleChange('spotifyTrackId', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="Track ID from Spotify"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Spotify Link
                        </label>
                        <input
                            type="url"
                            value={formData.spotifyLink || ''}
                            onChange={(e) => handleChange('spotifyLink', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="https://open.spotify.com/track/..."
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Apple Music Link
                        </label>
                        <input
                            type="url"
                            value={formData.appleMusicLink || ''}
                            onChange={(e) => handleChange('appleMusicLink', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="https://music.apple.com/..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            YouTube Links (comma-separated)
                        </label>
                        <input
                            type="text"
                            value={formData.youtubeLink?.join(', ') || ''}
                            onChange={(e) => handleArrayChange('youtubeLink', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="https://youtube.com/watch?v=..."
                        />
                    </div>
                </div>
            </div>

            {/* Song Content Section */}
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <span className="text-2xl mr-2">📝</span>
                    Song Content
                </h3>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        About <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={formData.about || ''}
                        onChange={(e) => handleChange('about', e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                        placeholder="Brief description about the song..."
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        When To Listen <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={formData.whenToListen || ''}
                        onChange={(e) => handleChange('whenToListen', e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                        placeholder="Best time or mood to listen to this song..."
                        required
                    />
                </div>
            </div>

            {/* Lyrics Section */}
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <span className="text-2xl mr-2">🎵</span>
                    Lyrics
                </h3>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Lyrics <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={formData.lyrics || ''}
                        onChange={(e) => handleChange('lyrics', e.target.value)}
                        rows={6}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none font-mono text-sm"
                        placeholder="Enter full lyrics..."
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Romanized <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={formData.romanized || ''}
                        onChange={(e) => handleChange('romanized', e.target.value)}
                        rows={6}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none font-mono text-sm"
                        placeholder="Romanized lyrics..."
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Burmese <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={formData.burmese || ''}
                        onChange={(e) => handleChange('burmese', e.target.value)}
                        rows={6}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none text-sm"
                        placeholder="ဗမာစာ..."
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Meaning <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={formData.meaning || ''}
                        onChange={(e) => handleChange('meaning', e.target.value)}
                        rows={6}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none text-sm"
                        placeholder="English translation/meaning..."
                        required
                    />
                </div>
            </div>

            {/* Request Information Section */}
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <span className="text-2xl mr-2">💬</span>
                    Request Information
                </h3>

                <div className="flex items-center mb-4">
                    <input
                        type="checkbox"
                        id="isRequested"
                        checked={formData.isRequested || false}
                        onChange={(e) => handleChange('isRequested', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="isRequested" className="ml-2 text-sm font-medium text-gray-700">
                        This song was requested by a user
                    </label>
                </div>

                {formData.isRequested && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Requested By
                        </label>
                        <input
                            type="text"
                            value={formData.requestedBy || ''}
                            onChange={(e) => handleChange('requestedBy', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="Name of the person who requested"
                        />
                    </div>
                )}
            </div>

            {/* Song Story Section */}
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <span className="text-2xl mr-2">📖</span>
                    Song Story (Optional)
                </h3>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Story (English)
                    </label>
                    <textarea
                        value={formData.songStoryEn || ''}
                        onChange={(e) => handleChange('songStoryEn', e.target.value)}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                        placeholder="Story about the song in English..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Story (Burmese)
                    </label>
                    <textarea
                        value={formData.songStoryMy || ''}
                        onChange={(e) => handleChange('songStoryMy', e.target.value)}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                        placeholder="သီချင်းအကြောင်း ဗမာစာဖြင့်..."
                    />
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
                        mode === Action.ADD ? '✓ Add Song' : '✓ Update Song'
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
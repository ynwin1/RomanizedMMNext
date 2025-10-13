// Exception to use client as it is a protected admin page with interactivity
"use client"
import { useState } from 'react';
import ArtistForm from "@/app/components/admin/ArtistForm";
import SongForm from "@/app/components/admin/SongForm";

enum Category {
    SONG = 'song',
    ARTIST = 'artist',
    REQUESTS = 'requests'
}

export enum Action {
    ADD = 'add',
    EDIT = 'edit'
}

// Mock types for demonstration
type ISong = { id: string; title: string };
type IArtist = { id: string; name: string };

type SelectedType = {
    type: Category,
    data: ISong | IArtist
}

export default function AdminDashboard() {
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [selectedAction, setSelectedAction] = useState<Action | null>(null);
    const [selectedItem, setSelectedItem] = useState<SelectedType | null>(null);

    const handleCategoryClick = (category: Category) => {
        setSelectedCategory(category);
        console.log(`Selected Category: ${category}`);
        setSelectedAction(null);
        setSelectedItem(null);
    };

    const handleActionClick = (action: Action) => {
        setSelectedAction(action);
        setSelectedItem(null);
    };

    const handleItemSelect = (item: SelectedType) => {
        setSelectedItem(item);
    };

    const renderForm = () => {
        if (selectedAction === Action.ADD) {
            return (
                <div className="bg-transparent rounded-lg shadow-md p-6 mt-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4 capitalize">
                        Add {selectedCategory}
                    </h3>
                    {selectedCategory === Category.ARTIST && (
                        <div className="text-gray-600">
                            <ArtistForm mode={Action.ADD} />
                        </div>
                    )}
                    {selectedCategory === Category.SONG && (
                        <div className="text-gray-600">
                            <SongForm mode={Action.ADD} />
                        </div>
                    )}
                </div>
            );
        }

        if (selectedAction === Action.EDIT && selectedItem) {
            return (
                <div className="bg-white rounded-lg shadow-md p-6 mt-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4 capitalize">
                        Edit {selectedCategory}
                    </h3>
                    <div className="text-gray-600">
                        Edit form will render here
                    </div>
                </div>
            );
        }

        return null;
    };

    const renderSelectionBar = () => {
        if (selectedAction === Action.EDIT) {
            return (
                <div className="bg-white rounded-lg shadow-md p-6 mt-6">
                    <h3 className="text-lg font-medium text-gray-700 mb-3">
                        Select a {selectedCategory} to edit
                    </h3>
                    <input
                        type="text"
                        placeholder={`Search ${selectedCategory}s...`}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                    <div className="mt-4 text-sm text-gray-500">
                        Selection list will appear here
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
                    <p className="text-gray-600">Manage your songs and artists</p>
                </div>

                {/* Category Selection */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-700 mb-4">Select Category</h2>
                    <div className="flex gap-3">
                        <button
                            onClick={() => handleCategoryClick(Category.SONG)}
                            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                                selectedCategory === Category.SONG
                                    ? 'bg-blue-600 text-white shadow-lg scale-105'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            <span className="text-2xl mb-1 block">🎵</span>
                            Song
                        </button>
                        <button
                            onClick={() => handleCategoryClick(Category.ARTIST)}
                            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                                selectedCategory === Category.ARTIST
                                    ? 'bg-blue-600 text-white shadow-lg scale-105'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            <span className="text-2xl mb-1 block">🎤</span>
                            Artist
                        </button>
                    </div>
                </div>

                {/* Action Selection */}
                {selectedCategory && (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6 animate-fadeIn">
                        <h2 className="text-lg font-semibold text-gray-700 mb-4">Choose Action</h2>
                        <div className="flex gap-3">
                            <button
                                onClick={() => handleActionClick(Action.ADD)}
                                className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                                    selectedAction === Action.ADD
                                        ? 'bg-green-600 text-white shadow-lg'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                <span className="text-xl mr-2">➕</span>
                                Add New
                            </button>
                            <button
                                onClick={() => handleActionClick(Action.EDIT)}
                                className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                                    selectedAction === Action.EDIT
                                        ? 'bg-amber-600 text-white shadow-lg'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                <span className="text-xl mr-2">✏️</span>
                                Edit Existing
                            </button>
                        </div>
                    </div>
                )}

                {/* Selection Bar and Form */}
                <div className="animate-fadeIn">
                    {renderSelectionBar()}
                    {renderForm()}
                </div>
            </div>

            <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
        </div>
    );
}
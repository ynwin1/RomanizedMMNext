// Exception to use client as it is a protected admin page with interactivity
"use client"
import { useState } from 'react';
import ArtistForm from "@/app/components/admin/ArtistForm";
import SongForm from "@/app/components/admin/SongForm";
import {ISong} from "@/app/model/Song";
import {IArtist} from "@/app/model/Artist";
import DynamicSearchBar from "@/app/components/admin/DynamicSearchBar";

export enum Category {
    SONG = 'song',
    ARTIST = 'artist',
    REQUESTS = 'requests'
}

export enum Action {
    ADD = 'add',
    EDIT = 'edit'
}

export default function AdminDashboard() {
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [selectedAction, setSelectedAction] = useState<Action | null>(null);
    const [selectedItem, setSelectedItem] = useState<Partial<ISong> | Partial<IArtist> | null | undefined>(null);

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

    const handleItemSelect = (item: Partial<ISong> | Partial<IArtist>) => {
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
                    {selectedCategory === Category.ARTIST && (
                        <div className="text-gray-600">
                            <ArtistForm mode={Action.EDIT} initialData={selectedItem as Partial<IArtist>}/>
                        </div>
                    )}
                    {selectedCategory === Category.SONG && (
                        <div className="text-gray-600">
                            <SongForm mode={Action.EDIT} initialData={selectedItem as Partial<ISong> }/>
                        </div>
                    )}
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
                        {`Select ${selectedCategory} to edit`}
                    </h3>
                    {selectedCategory === Category.ARTIST ?
                        <DynamicSearchBar category={Category.ARTIST} onSelect={handleItemSelect} />
                        :
                        <DynamicSearchBar category={Category.SONG} onSelect={handleItemSelect} />
                    }
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

                {/* Back to Home Button */}
                <button>
                    <a
                        href="/"
                        className="inline-block mb-6 px-5 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
                    >
                        Back to Home
                    </a>
                </button>

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
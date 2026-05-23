import { Route, Routes, useNavigate } from "react-router-dom";
import "./style.css";
import { Navbar } from "./components/layout/Navbar";

import Home from "./pages/Home";
import Catalog from "./pages/Catalog";
import Movies from "./pages/Movies";
import Series from "./pages/Series";
import Search from "./pages/Search";

import MovieDetails from "./components/MovieDetails";
import SeriesDetails from "./components/SeriesDetails";

// Google-only login — no separate register page needed.
import LoginCard from "./components/LoginCard";

import Profile from "./pages/Profile";
import Users from "./pages/Users";
import UserProfile from "./pages/UserProfile";
import { useEffect } from "react";
import { navigationRef } from "./utils/navigation";
import { Toaster } from "sonner";
import PersonDetails from "./components/PersonDetails";
import Celebrities from "./pages/Celebrities";
import Footer from "./pages/Footer";
import AnimeDetails from "./components/AnimeDetails";
import Anime from "./pages/Anime";
import Watchlist from "./pages/Watchlist";
import Favorites from "./pages/Favorites";
import BottomNav from "./components/layout/BottomNav";
import Franchises from "./pages/Franchises";
import RegisterCard from "./components/RegisterCard";
import Discover from "./pages/Discover";

function App() {
    const navigate = useNavigate();

    useEffect(() => {
        // The API layer uses this shared ref so it can redirect after auth expiry
        // without importing router hooks into non-React modules.
        navigationRef.navigate = navigate;
    }, [navigate]);

    return (
        <div className="flex flex-col min-h-screen bg-white dark:bg-black text-black dark:text-white">
            <Toaster richColors position="top-center" />
            <Navbar />
            <main className="flex-1">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/catalog" element={<Catalog />} />
                    <Route path="/search" element={<Search />} />
                    <Route path="/discover" element={<Discover />} />

                    <Route path="/login" element={<LoginCard />} />
                    <Route path="/signup" element={<RegisterCard />} />

                    <Route path="/profile" element={<Profile />} />
                    <Route path="/profile/watchlist/:groupId" element={<Watchlist />} />
                    <Route path="/profile/favorites" element={<Favorites />} />

                    {/* Users routes */}
                    <Route path="/users" element={<Users />} />
                    <Route path="/users/:username" element={<UserProfile />} />
                    <Route path="/users/:username/:type" element={<Users />} />

                    <Route path="/movies" element={<Movies />} />
                    <Route path="/movies/:id" element={<MovieDetails />} />

                    <Route path="/series" element={<Series />} />
                    <Route path="/series/:id" element={<SeriesDetails />} />

                    <Route path="/celebrities" element={<Celebrities />} />
                    <Route path="/celebrities/:id" element={<PersonDetails />} />

                    <Route path="/anime" element={<Anime />} />
                    <Route path="/anime/:id" element={<AnimeDetails />} />

                    <Route path="/franchises" element={<Franchises />} />
                    <Route path="/franchises/:id" element={<Franchises />} />
                </Routes>
            </main>
            <BottomNav />
            <Footer />
        </div>
    );
}

export default App;

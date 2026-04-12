import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";
import "./style.css";
import { Navbar } from "./components/Navbar";
import { useServerDownStatus } from "./components/context/ServerDownContext";
import ServerErrorPage from "./pages/ServerErrorPage";

import Home from "./pages/Home";
import Catalog from "./pages/Catalog";
import Movies from "./pages/Movies";
import Series from "./pages/Series";

import MovieDetails from "./components/MovieDetails";
import SeriesDetails from "./components/SeriesDetails";

import LoginCard from "./components/LoginCard";
import RegisterCard from "./components/RegisterCard";
import Profile from "./pages/Profile";
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

function App() {
  const { errorState } = useServerDownStatus();
  const navigate = useNavigate();

  useEffect(() => {
    navigationRef.navigate = navigate;
  }, [navigate]);

  return (
    <div className="flex flex-col min-h-screen">
      <Toaster richColors position="top-center" />
      <Navbar />
      <main className="flex-1">
        <Routes>
          {errorState && (
            <Route path="*" element={<ServerErrorPage error={errorState} />} />
          )}

          {!errorState && (
            <>
              <Route path="/" element={<Home />} />

              {/* Unified catalog entry point */}
              <Route path="/catalog" element={<Catalog />} />

              <Route path="/movies" element={<Movies />} />
              <Route path="/series" element={<Series />} />

              <Route path="/profile" element={<Profile />} />
              <Route path="/login" element={<LoginCard />} />
              <Route path="/signup" element={<RegisterCard />} />

              <Route path="/profile/watchlist/:groupId" element={<Watchlist />} />
              <Route path="/profile/favorites" element={<Favorites />} />

              <Route path="/movies/:id" element={<MovieDetails />} />
              <Route path="/series/:id" element={<SeriesDetails />} />

              <Route path="/celebrities" element={<Celebrities />} />
              <Route path="/celebrities/:id" element={<PersonDetails />} />

              <Route path="/anime" element={<Anime />} />
              <Route path="/anime/:id" element={<AnimeDetails />} />
            </>
          )}
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
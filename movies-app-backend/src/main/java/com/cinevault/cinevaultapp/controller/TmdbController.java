package com.cinevault.cinevaultapp.controller;

import com.cinevault.cinevaultapp.dto.*;
import com.cinevault.cinevaultapp.enums.MediaTypeEnum;
import com.cinevault.cinevaultapp.service.TmdbServices;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * REST controller for handling TMDB (The Movie Database) API operations.
 * Provides endpoints for retrieving movies, TV shows, people, and related media information.
 *
 * @author karthicknathan
 * @since Feb 06, 2026
 *
 * @version 1.0
 */
@RestController
@RequestMapping("/api/tmdb")
public class TmdbController {

    private final TmdbServices tmdbServices;

    /**
     * Constructs a new {@code TmdbController} with the specified TMDB service.
     *
     * @param tmdbService - The {@code TmdbServices} instance for handling TMDB operations.
     */
    public TmdbController(TmdbServices tmdbService) {
        this.tmdbServices = tmdbService;
    }

    /**
     * Retrieves trending movies and TV series for the current day.
     *
     * @param page - The page number for pagination (defaults to 1).
     *
     * @return - A {@code PagedResponseDto} containing trending movies and series.
     */
    @GetMapping("/trending")
    public PagedResponseDto<MovieDto> getTrendingMoviesAndSeries(@RequestParam(defaultValue = "1") int page) {
        return tmdbServices.getTrendingMoviesAndSeries(page);
    }

    /**
     * Retrieves popular movies and TV series.
     *
     * @param page - The page number for pagination (defaults to 1).
     *
     * @return - A {@code PagedResponseDto} containing popular movies and series.
     */
    @GetMapping("/popular")
    public PagedResponseDto<MovieDto> getPopularMoviesAndSeries(@RequestParam(defaultValue = "1") int page) {
        return tmdbServices.getPopularAll(page);
    }

    /**
     * Searches for movies and TV shows based on a query string.
     *
     * @param query - The search query string.
     * @param page - The page number for pagination (defaults to 1).
     *
     * @return - A {@code PagedResponseDto} containing search results.
     */
    @GetMapping("/search")
    public PagedResponseDto<MovieDto> search(@RequestParam String query, @RequestParam(defaultValue = "1") int page) {
        return tmdbServices.searchMovies(query, page);
    }

    /**
     * Retrieves detailed information for a specific media item.
     *
     * @param type - The {@code MediaTypeEnum} indicating movie or TV show.
     * @param id - The unique identifier of the media item.
     *
     * @return - A {@code MovieDto} containing detailed media information.
     */
    @GetMapping("/details")
    public MovieDto getDetails(@RequestParam MediaTypeEnum type, @RequestParam Long id) {
        return tmdbServices.getMediaDetails(type, id);
    }

    /**
     * Retrieves top-rated TV shows.
     *
     * @param page - The page number for pagination (defaults to 1).
     *
     * @return - A {@code PagedResponseDto} containing top-rated TV shows.
     */
    @GetMapping("/tv/top-rated")
    public PagedResponseDto<MovieDto> getTopRatedTv(@RequestParam(defaultValue = "1") int page) {
        return tmdbServices.getTopRatedTv(page);
    }

    /**
     * Retrieves top-rated movies.
     *
     * @param page - The page number for pagination (defaults to 1).
     *
     * @return - A {@code PagedResponseDto} containing top-rated movies.
     */
    @GetMapping("/movie/top-rated")
    public PagedResponseDto<MovieDto> getTopRatedMovie(@RequestParam(defaultValue = "1") int page) {
        return tmdbServices.getTopRatedMovie(page);
    }

    /**
     * Retrieves full series details including all seasons and episodes.
     * Filters out season 0 (specials) and calculates average ratings per season.
     *
     * @param id - The unique identifier of the TV series.
     *
     * @return - A {@code TvDetailsDto} containing complete series information with all seasons.
     */
    @GetMapping("/series/{id}/seasons")
    public TvDetailsDto getFullSeriesDetails(@PathVariable Long id) {
        // Fetch main series details.
        TvDetailsDto show = tmdbServices.getTvDetails(MediaTypeEnum.TV, id);
        if (show.getSeasons() != null) {
            // Filter out season 0 (specials).
            List<SeasonDto> allSeasons = show.getSeasons().stream()
                    .filter(s -> s.getSeason_number() != 0)
                    .map(s -> {
                        // Fetch episodes for each season (cached in service).
                        SeasonDto seasonDetails = tmdbServices.getSeasonDetails(id, s.getSeason_number());

                        // Optional: calculate average rating per season.
                        if (seasonDetails.getEpisodes() != null && !seasonDetails.getEpisodes().isEmpty()) {
                            double avg = seasonDetails.getEpisodes().stream()
                                    .mapToDouble(e -> e.getVote_average() != null ? e.getVote_average() : 0)
                                    .average()
                                    .orElse(0);
                            seasonDetails.setVote_average(avg);
                        }
                        return seasonDetails;
                    })
                    .collect(Collectors.toList());
            show.setSeasons(allSeasons);
        }
        return show;
    }

    /**
     * Retrieves cast and crew credits for a specific media item.
     *
     * @param type - The {@code MediaTypeEnum} indicating movie or TV show.
     * @param id - The unique identifier of the media item.
     *
     * @return - A {@code CreditsDto} containing cast and crew information.
     */
    @GetMapping("/credits")
    public CreditsDto getCredits(@RequestParam MediaTypeEnum type, @RequestParam Long id) {
        return tmdbServices.getCredits(type, id);
    }

    /**
     * Retrieves detailed information for a specific person.
     *
     * @param id - The unique identifier of the person.
     *
     * @return - A {@code PersonDto} containing person details and their credits.
     */
    @GetMapping("/person/{id}")
    public PersonDto getPerson(@PathVariable Long id) {
        return tmdbServices.getPersonDetails(id);
    }

    /**
     * Retrieves a list of popular people (actors, directors, etc.).
     *
     * @param page - The page number for pagination (defaults to 1).
     *
     * @return - A {@code PagedResponseDto} containing popular people.
     */
    @GetMapping("/person/popular")
    public PagedResponseDto<PersonDto> getPopularPeople(@RequestParam(defaultValue = "1") int page) {
        return tmdbServices.getPopularPeople(page);
    }

    /**
     * Retrieves paginated reviews for a specific movie or TV show.
     *
     * Handles both:
     *   GET /api/tmdb/movie/{id}/reviews
     *   GET /api/tmdb/tv/{id}/reviews
     *
     * @param mediaTypePath - "movie" or "tv" from the URL path variable.
     * @param id            - The unique identifier of the media item.
     * @param page          - The page number for pagination (defaults to 1).
     * @return              - A ReviewsDto containing paginated reviews.
     */
    @GetMapping("/{mediaType}/{id}/reviews")
    public ReviewsDto getReviews(
            @PathVariable("mediaType") String mediaTypePath,
            @PathVariable Long id,
            @RequestParam(defaultValue = "1") int page) {
        MediaTypeEnum type = mediaTypePath.equalsIgnoreCase("movie")
                ? MediaTypeEnum.MOVIE
                : MediaTypeEnum.TV;
        return tmdbServices.getReviews(type, id, page);
    }

    /**
     * Returns all movies in a specific collection by its TMDB ID.
     */
    @GetMapping("/collection/{id}")
    public CollectionDto getCollection(@PathVariable Long id) {
        return tmdbServices.getCollection(id);
    }

    /**
     * Searches for collections/franchises by name with pagination.
     * Frontend calls this both for the default browsing view
     * (using broad terms like "collection") and for user searches.
     */
    @GetMapping("/collections/search")
    public PagedResponseDto<CollectionDto> searchCollections(@RequestParam String query,
            @RequestParam(defaultValue = "1") int page) {
        return tmdbServices.searchCollections(query, page);
    }

    /**
     * Discover endpoint — powers the genre/filter browse page.
     * All filter params are optional; omitting them returns all results
     * sorted by popularity.
     */
    @GetMapping("/discover")
    public PagedResponseDto<MovieDto> discover(@RequestParam(required = false) String mediaType,
            @RequestParam(required = false) Long genreId,
            @RequestParam(required = false) Integer year,
            @RequestParam(defaultValue = "popularity.desc") String sortBy,
            @RequestParam(required = false) Double minRating,
            @RequestParam(defaultValue = "1") int page) {
        return tmdbServices.discover(mediaType, genreId, year, sortBy, minRating, page);
    }

    /**
     * Watch providers for a movie or TV show.
     * Returns the full TMDB providers response — frontend picks the
     * user's region (default IN for India).
     */
    @GetMapping("/{mediaType}/{id}/watch-providers")
    public Map<String, Object> getWatchProviders(@PathVariable String mediaType, @PathVariable Long id) {
        // Validate mediaType to prevent path traversal.
        if (!mediaType.equals("movie") && !mediaType.equals("tv")) {
            throw new IllegalArgumentException("Invalid mediaType: " + mediaType);
        }
        return tmdbServices.getWatchProviders(mediaType, id);
    }
}
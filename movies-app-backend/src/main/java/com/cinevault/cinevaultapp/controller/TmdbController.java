package com.cinevault.cinevaultapp.controller;

import com.cinevault.cinevaultapp.dto.*;
import com.cinevault.cinevaultapp.enums.MediaTypeEnum;
import com.cinevault.cinevaultapp.service.TmdbServices;
import org.springframework.web.bind.annotation.*;

import java.util.List;
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
@CrossOrigin(origins = "*")
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
    public PagedResponseDto<MovieDto> trendingMoviesAndSeries(@RequestParam(defaultValue = "1") int page) {
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
    public PagedResponseDto<MovieDto> popularMoviesAndSeries(@RequestParam(defaultValue = "1") int page) {
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
    public MovieDto getDetails(
            @RequestParam MediaTypeEnum type,
            @RequestParam Long id) {
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
    public PagedResponseDto<MovieDto> topRatedTv(@RequestParam(defaultValue = "1") int page) {
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
    public PagedResponseDto<MovieDto> topRatedMovie(@RequestParam(defaultValue = "1") int page) {
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
        // Fetch main series details
        TvDetailsDto show = tmdbServices.getTvDetails(MediaTypeEnum.TV, id);
        if (show.getSeasons() != null) {
            // Filter out season 0 (specials)
            List<SeasonDto> allSeasons = show.getSeasons().stream()
                    .filter(s -> s.getSeason_number() != 0)
                    .map(s -> {
                        // Fetch episodes for each season (cached with @Cacheable in service)
                        SeasonDto seasonDetails = tmdbServices.getSeasonDetails(id, s.getSeason_number());

                        // Optional: calculate average rating per season
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
    public CreditsDto credits(@RequestParam MediaTypeEnum type,  @RequestParam Long id) {
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
    public PagedResponseDto<PersonDto> popularPeople(
            @RequestParam(defaultValue = "1") int page
    ) {
        return tmdbServices.getPopularPeople(page);
    }
}
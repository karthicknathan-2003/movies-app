package com.cinevault.cinevaultapp.controller;

import com.cinevault.cinevaultapp.dto.*;
import com.cinevault.cinevaultapp.service.JikanService;
import com.cinevault.cinevaultapp.service.TmdbServices;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller for anime-specific endpoints.
 * Exposes routes for searching, trending, popular, and detailed anime data.
 *
 * @author karthicknathan
 * @since Mar 15, 2026
 *
 * @version 1.0
 */
@RestController
@RequestMapping("/api/tmdb/anime")
@CrossOrigin(origins = "*")
public class AnimeController {

    @Autowired
    private TmdbServices tmdbServices;

    @Autowired
    private JikanService jikanService;

    /**
     * Searches for anime titles matching the given query.
     *
     * GET /api/anime/search?query=naruto&page=1
     *
     * @param query - The search term.
     * @param page  - Page number (default: 1).
     *
     * @return - Paged list of matching anime titles.
     */
    @GetMapping("/search")
    public ResponseEntity<PagedResponseDto<MovieDto>> searchAnime(
            @RequestParam String query,
            @RequestParam(defaultValue = "1") int page) {
        return ResponseEntity.ok(tmdbServices.searchAnime(query, page));
    }

    /**
     * Retrieves trending anime for the current day.
     *
     * GET /api/anime/trending?page=1
     *
     * @param page - Page number (default: 1).
     *
     * @return - Paged list of trending anime.
     */
    @GetMapping("/trending")
    public ResponseEntity<PagedResponseDto<MovieDto>> getTrendingAnime(
            @RequestParam(defaultValue = "1") int page) {
        return ResponseEntity.ok(tmdbServices.getTrendingAnime(page));
    }

    /**
     * Retrieves popular anime sorted by popularity.
     *
     * GET /api/anime/popular?page=1
     *
     * @param page - Page number (default: 1).
     *
     * @return - Paged list of popular anime.
     */
    @GetMapping("/popular")
    public ResponseEntity<PagedResponseDto<MovieDto>> getPopularAnime(
            @RequestParam(defaultValue = "1") int page) {
        return ResponseEntity.ok(tmdbServices.getPopularAnime(page));
    }

    /**
     * Retrieves full details for a specific anime including all season and episode data.
     * Requires numberOfSeasons to fetch all seasons via append_to_response.
     *
     * GET /api/anime/{id}?numberOfSeasons=3
     *
     * @param id              - The TMDB ID of the anime.
     * @param numberOfSeasons - Total seasons to fetch (default: 1).
     *
     * @return - Full MovieDto with seasons and episodes populated.
     */
    @GetMapping("/{id}")
    public ResponseEntity<MovieDto> getAnimeDetails(
            @PathVariable Long id,
            @RequestParam(defaultValue = "1") int numberOfSeasons) {
        return ResponseEntity.ok(tmdbServices.getAnimeDetails(id, numberOfSeasons));
    }

    /**
     * Retrieves full season and episode data for a specific anime.
     * Handles the two-step TMDB fetch internally — the client just passes the ID.
     *
     * GET /api/tmdb/anime/{id}/seasons
     *
     * @param id - The TMDB ID of the anime.
     *
     * @return - TvDetailsDto with all seasons and episodes populated.
     */
    @GetMapping("/{id}/seasons")
    public ResponseEntity<TvDetailsDto> getAnimeSeasons(@PathVariable Long id) {
        return ResponseEntity.ok(tmdbServices.getAnimeSeasons(id));
    }

    /**
     * Retrieves top-rated anime sorted by vote average descending.
     *
     * GET /api/tmdb/anime/top-rated?page=1
     *
     * @param page - Page number (default: 1).
     *
     * @return - Paged list of top-rated anime titles.
     */
    @GetMapping("/top-rated")
    public ResponseEntity<PagedResponseDto<MovieDto>> getTopRatedAnime(
            @RequestParam(defaultValue = "1") int page) {
        return ResponseEntity.ok(tmdbServices.getTopRatedAnime(page));
    }

    /**
     * Returns Jikan reviews for an anime, normalised into the shared
     * {@code ReviewsDto} format used by TMDB movie and TV reviews.
     *
     * Flow:
     *   1. Call TMDB /tv/{tmdbId}/external_ids to get the MAL ID.
     *      (Cached in TmdbServices so repeat calls are free.)
     *   2. Call Jikan /anime/{malId}/reviews with the resolved MAL ID.
     *      (Cached in JikanService per malId + page.)
     *   3. Return the normalised ReviewsDto — same shape as TMDB reviews.
     *
     * Route: GET /api/anime/{id}/reviews?page=1
     *
     * @param id   - TMDB ID of the anime (the same id used in all other /api/anime routes).
     * @param page - Jikan page number (defaults to 1; 20 reviews per page).
     * @return     - A {@code ReviewsDto} normalised from Jikan's review shape.
     */
    @GetMapping("/{id}/reviews")
    public ResponseEntity<ReviewsDto> getAnimeReviews(
            @PathVariable Long id,
            @RequestParam(defaultValue = "1") int page) {
        // Step 1 — resolve TMDB ID to MAL ID via TMDB's external_ids endpoint.
        JikanReviewsResponse.ExternalIdsDto externalIdDto = tmdbServices.getExternalIds(id);
        if (externalIdDto == null || externalIdDto.getMal_id() == null) {
            // TMDB doesn't know the MAL ID for this entry — return empty results
            // rather than a 404 so the frontend shows the "no reviews" empty state.
            ReviewsDto empty = new ReviewsDto();
            empty.setPage(1);
            empty.setResults(new java.util.ArrayList<>());
            empty.setTotal_pages(1);
            empty.setTotal_results(0);
            return ResponseEntity.ok(empty);
        }
        // Step 2 — fetch and map Jikan reviews using the resolved MAL ID.
        ReviewsDto reviews = jikanService.getAnimeReviews(externalIdDto.getMal_id(), page);
        return ResponseEntity.ok(reviews);
    }
}
package com.cinevault.cinevaultapp.service;

import com.cinevault.cinevaultapp.dto.JikanAnimeDto;
import com.cinevault.cinevaultapp.dto.JikanEpisodeDto;
import com.cinevault.cinevaultapp.dto.JikanReviewsResponse;
import com.cinevault.cinevaultapp.dto.ReviewsDto;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service class for interacting with the Jikan v4 API (unofficial MyAnimeList REST API).
 * Used to retrieve accurate season and episode structure for anime titles,
 * supplementing TMDB data which often combines multi-season anime into a single entry.
 *
 * @author karthicknathan
 * @since Apr 05, 2026
 * @version 1.0
 */
@Service
public class JikanService {

    private final WebClient jikanClient;

    @Value("${jikan.base-url}")
    private String jikanBaseUrl;

    /**
     * Creates a Jikan client wrapper used for anime-related lookups.
     *
     * @param builder - The shared {@code WebClient.Builder} used to build the client.
     */
    public JikanService(WebClient.Builder builder) {
        this.jikanClient = builder
                .baseUrl(jikanBaseUrl)
                .build();
    }

    // Internal paged wrapper DTOs
    @Data
    private static class JikanPagedAnime {
        private List<JikanAnimeDto> data;
    }

    @Data
    private static class JikanPagedEpisodes {
        private List<JikanEpisodeDto> data;

        @JsonProperty("last_visible_page")
        private int lastVisiblePage;
    }

    @Data
    private static class RelationEntry {
        private String relation;
        private List<RelationItem> entry;
    }

    @Data
    private static class RelationItem {
        @JsonProperty("mal_id")
        private Long malId;
        private String type;
    }

    @Data
    private static class RelationsResponse {
        private List<RelationEntry> data;
    }

    //  Public methods
    /**
     * Searches Jikan for an anime by name and returns the best-matching MAL ID.
     * Picks the first TV-type result whose title closely matches the query.
     *
     * @param name - The anime title to search for.
     *
     * @return - The MAL ID of the best match, or null if nothing found.
     */
    @Cacheable(value = "jikanSearch", key = "#name")
    public Long searchMalId(String name) {
        JikanPagedAnime result = jikanClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/anime")
                        .queryParam("q", name)
                        .queryParam("type", "tv")
                        .queryParam("limit", 5)
                        .build())
                .retrieve()
                .bodyToMono(JikanPagedAnime.class)
                .block();

        if (result == null || result.getData() == null || result.getData().isEmpty()) return null;

        // Prefer an exact title match; fall back to first result.
        return result.getData().stream()
                .filter(a -> a.getTitle() != null &&
                        a.getTitle().equalsIgnoreCase(name))
                .map(JikanAnimeDto::getMalId)
                .findFirst()
                .orElse(result.getData().get(0).getMalId());
    }

    /**
     * Fetches all episodes for a given MAL ID, handling Jikan's pagination
     * (each page returns up to 100 episodes).
     *
     * @param malId - The MAL ID of the anime.
     *
     * @return - Flat list of all JikanEpisodeDtos for this entry.
     */
    @Cacheable(value = "jikanEpisodes", key = "#malId")
    public List<JikanEpisodeDto> fetchAllEpisodes(Long malId) {
        List<JikanEpisodeDto> allJikanEpisodeDtoList = new ArrayList<>();
        int page = 1;
        JikanPagedEpisodes res = null;
        while (true) {
            final int currentPage = page;
            res = jikanClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/anime/{malId}/episodes")
                            .queryParam("page", currentPage)
                            .build(malId))
                    .retrieve()
                    .bodyToMono(JikanPagedEpisodes.class)
                    .block();

            if (res == null || res.getData() == null || res.getData().isEmpty()) break;
            allJikanEpisodeDtoList.addAll(res.getData());

            if (page >= res.getLastVisiblePage()) break;
            page++;

            // Jikan rate limit — 3 requests/second, add a small delay between pages.
            try {
                Thread.sleep(400);
            } catch (InterruptedException ignored) {}
        }

        return allJikanEpisodeDtoList;
    }

    /**
     * Finds all sequel season MAL IDs for a given MAL ID using Jikan's relations endpoint.
     *
     * @param malId - The MAL ID of the first season.
     *
     * @return - Ordered list of MAL IDs for all sequel seasons.
     */
    @Cacheable(value = "jikanRelations", key = "#malId")
    public List<Long> fetchSequelMalIds(Long malId) {
        RelationsResponse res = jikanClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/anime/{malId}/relations")
                        .build(malId))
                .retrieve()
                .bodyToMono(RelationsResponse.class)
                .block();

        if (res == null || res.getData() == null) return List.of();

        return res.getData().stream()
                .filter(r -> "Sequel".equalsIgnoreCase(r.getRelation()))
                .flatMap(r -> r.getEntry().stream())
                .filter(e -> "anime".equalsIgnoreCase(e.getType()))
                .map(RelationItem::getMalId)
                .collect(Collectors.toList());
    }

    /**
     * Fetches anime reviews from Jikan v4 for a given MAL ID, then maps
     * the Jikan-specific shape into the shared {@code ReviewsDto} so the
     * frontend consumes anime reviews through the same contract as TMDB reviews.
     *
     * Field mapping:
     *   Jikan review.review          → ReviewsDto.Review.content
     *   Jikan review.score  (1–10)   → ReviewsDto.Review.author_details.rating
     *   Jikan user.username          → ReviewsDto.Review.author + author_details.username
     *   Jikan user.images.jpg        → ReviewsDto.Review.author_details.avatar_path
     *   Jikan review.date            → ReviewsDto.Review.created_at + updated_at
     *   Jikan review.url             → ReviewsDto.Review.url
     *   Jikan review.mal_id          → ReviewsDto.Review.id  (stable key for React)
     *
     * @param malId - MyAnimeList ID of the anime.
     * @param page  - 1-based page number (Jikan returns 20 reviews per page).
     * @return      - A {@code ReviewsDto} shaped identically to TMDB reviews.
     */
    @Cacheable(value = "animeReviews", key = "#malId + '-' + #page")
    public ReviewsDto getAnimeReviews(Long malId, int page) {
        JikanReviewsResponse raw = jikanClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/anime/{malId}/reviews")
                        .queryParam("page", page)
                        .build(malId))
                .retrieve()
                .bodyToMono(JikanReviewsResponse.class)
                .block();

        ReviewsDto dto = new ReviewsDto();
        if (raw == null || raw.getData() == null) {
            dto.setPage(page);
            dto.setResults(new ArrayList<>());
            dto.setTotal_pages(1);
            dto.setTotal_results(0);
            return dto;
        }

        List<ReviewsDto.Review> mapped = raw.getData().stream().map(jr -> {
            ReviewsDto.Review review = new ReviewsDto.Review();
            // Use the Jikan review's mal_id as the record ID — stable across pages.
            // Fall back to a random UUID only if mal_id is somehow missing.
            review.setId(jr.getMal_id() != null
                    ? jr.getMal_id().toString()
                    : UUID.randomUUID().toString());

            String username = (jr.getUser() != null && jr.getUser().getUsername() != null)
                    ? jr.getUser().getUsername()
                    : "Anonymous";
            review.setAuthor(username);

            ReviewsDto.AuthorDetails details = new ReviewsDto.AuthorDetails();
            details.setUsername(username);

            // Jikan serves absolute CDN URLs — stored as-is.
            // The frontend UnifiedAvatar detects absolute URLs and uses them directly.
            if (jr.getUser() != null
                    && jr.getUser().getImages() != null
                    && jr.getUser().getImages().getJpg() != null) {
                details.setAvatar_path(jr.getUser().getImages().getJpg().getImage_url());
            }

            // Score is already on a 1–10 scale matching TMDB's rating scale.
            if (jr.getScore() != null) {
                details.setRating(jr.getScore().doubleValue());
            }
            review.setAuthor_details(details);

            review.setContent(jr.getReview());

            // Jikan has no separate updated_at — reuse the creation date.
            review.setCreated_at(jr.getDate());
            review.setUpdated_at(jr.getDate());
            review.setUrl(jr.getUrl());

            return review;
        }).toList();

        dto.setPage(page);
        dto.setResults(mapped);
        dto.setTotal_pages(raw.getPagination() != null
                ? raw.getPagination().getLast_visible_page()
                : 1);
        dto.setTotal_results(mapped.size());

        return dto;
    }
}

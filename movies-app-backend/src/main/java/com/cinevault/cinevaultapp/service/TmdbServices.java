package com.cinevault.cinevaultapp.service;

import com.cinevault.cinevaultapp.dto.*;
import com.cinevault.cinevaultapp.enums.MediaTypeEnum;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.util.*;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

/**
 * Service class for interacting with The Movie Database (TMDB) API.
 * Provides methods to fetch movies, TV shows, person details, and related media information.
 * All methods utilize caching to improve performance and reduce API calls.
 *
 * @author karthicknathan
 * @since Feb 04, 2026
 *
 * @version 1.0
 */
@Service
public class TmdbServices {

    private static final String ANIME_GENRE_ID = "16";
    private static final String ANIME_ORIGIN_COUNTRY = "JP";

    private final WebClient webClient;
    @Autowired
    private JikanService jikanService;

    @Value("${tmdb.api-key}")
    private String apiKey;

    /**
     * Constructs a new TmdbServices instance with the specified WebClient.
     *
     * @param webClient    - The WebClient used for making HTTP requests to TMDB API.
     */
    public TmdbServices(WebClient webClient) {
        this.webClient = webClient;
    }

    /**
     * Retrieves trending movies and TV series for the current day.
     * Results are cached based on the page number.
     *
     * @param page - The page number for pagination (1-based).
     *
     * @return - A PagedResponseDto containing a list of trending movies and series.
     */
    @Cacheable(value = "trendingMoviesAndSeries", key = "#page")
    public PagedResponseDto<MovieDto> getTrendingMoviesAndSeries(int page) {
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/trending/all/day")
                        .queryParam("api_key", apiKey)
                        .queryParam("page", page)
                        .build())
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<PagedResponseDto<MovieDto>>() {})
                .block();
    }

    /**
     * Searches for movies and TV shows based on a query string.
     * Results are cached based on the query and page number.
     *
     * @param query - The search query string.
     * @param page  - The page number for pagination (1-based).
     *
     * @return - A PagedResponseDto containing search results matching the query.
     */
    @Cacheable(value = "searchMulti", key = "#query + '-' + #page")
    public PagedResponseDto<MovieDto> searchMovies(String query, int page) {
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/search/multi")
                        .queryParam("api_key", apiKey)
                        .queryParam("query", query)
                        .queryParam("page", page)
                        .build())
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<PagedResponseDto<MovieDto>>() {})
                .block();
    }

    /**
     * Retrieves detailed information for a specific media item (movie or TV show).
     * Results are cached based on media type and ID.
     *
     * @param type - The type of media (MOVIE or TV).
     * @param id   - The unique identifier of the media item.
     *
     * @return - A MovieDto containing detailed information about the media.
     */
    @Cacheable(value = "mediaDetails", key = "#type + '-' + #id")
    public MovieDto getMediaDetails(MediaTypeEnum type, Long id) {
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/" + type.path() + "/{id}")
                        .queryParam("api_key", apiKey)
                        .build(id))
                .retrieve()
                .bodyToMono(MovieDto.class)
                .block();
    }

    /**
     * Retrieves detailed information for a specific TV show.
     *
     * @param type - The type of media (should be TV).
     * @param id   - The unique identifier of the TV show.
     *
     * @return - A TvDetailsDto containing detailed information about the TV show.
     */
    @Cacheable(value = "tvDetails", key = "#type + '-' + #id")
    public TvDetailsDto getTvDetails(MediaTypeEnum type, Long id) {
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/" + type.path() + "/{id}")
                        .queryParam("api_key", apiKey)
                        .build(id))
                .retrieve()
                .bodyToMono(TvDetailsDto.class)
                .block();
    }

    /**
     * Retrieves a list of top-rated TV shows.
     * Results are cached based on the page number.
     *
     * @param page - The page number for pagination (1-based).
     *
     * @return - A PagedResponseDto containing top-rated TV shows.
     */
    @Cacheable(value = "topRatedTv", key = "#page")
    public PagedResponseDto<MovieDto> getTopRatedTv(int page) {
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/tv/top_rated")
                        .queryParam("api_key", apiKey)
                        .queryParam("page", page)
                        .build())
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<PagedResponseDto<MovieDto>>() {})
                .block();
    }

    /**
     * Retrieves a list of top-rated movies.
     * Results are cached based on the page number.
     *
     * @param page - The page number for pagination (1-based).
     *
     * @return - A PagedResponseDto containing top-rated movies.
     */
    @Cacheable(value = "topRatedMovie", key = "#page")
    public PagedResponseDto<MovieDto> getTopRatedMovie(int page) {
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/movie/top_rated")
                        .queryParam("api_key", apiKey)
                        .queryParam("page", page)
                        .build())
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<PagedResponseDto<MovieDto>>() {})
                .block();
    }

    /**
     * Retrieves detailed information for a specific season of a TV show.
     * Results are cached based on the TV show ID and season number.
     *
     * @param id           - The unique identifier of the TV show.
     * @param seasonNumber - The season number to retrieve.
     *
     * @return - A SeasonDto containing details about the specified season.
     */
    @Cacheable(value = "tvSeasons", key = "#id + '-' + #seasonNumber")
    public SeasonDto getSeasonDetails(Long id, int seasonNumber) {
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/tv/{id}/season/{seasonNumber}")
                        .queryParam("api_key", apiKey)
                        .build(id, seasonNumber))
                .retrieve()
                .bodyToMono(SeasonDto.class)
                .block();
    }

    /**
     * Retrieves popular movies and TV shows combined.
     * Fetches popular movies and popular TV shows separately, then merges the results.
     * Results are cached based on the page number.
     *
     * @param page - The page number for pagination (1-based).
     *
     * @return - A PagedResponseDto containing merged popular movies and TV shows.
     */
    @Cacheable(value = "popular", key = "#page")
    public PagedResponseDto<MovieDto> getPopularAll(int page) {
        PagedResponseDto<MovieDto> movies = webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/movie/popular")
                        .queryParam("api_key", apiKey)
                        .queryParam("page", page)
                        .build())
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<PagedResponseDto<MovieDto>>() {})
                .block();

        PagedResponseDto<MovieDto> tvShows = webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/tv/popular")
                        .queryParam("api_key", apiKey)
                        .queryParam("page", page)
                        .build())
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<PagedResponseDto<MovieDto>>() {})
                .block();

        if (movies != null && movies.getResults() != null) {
            movies.getResults().addAll(tvShows != null ? tvShows.getResults() : new ArrayList<>());
        }
        return movies;
    }

    /**
     * Retrieves cast and crew credits for a specific media item.
     * Results are cached based on media type and ID.
     *
     * @param type - The type of media (MOVIE or TV).
     * @param id   - The unique identifier of the media item.
     *
     * @return - A CreditsDto containing cast and crew information.
     */
    @Cacheable(value = "credits", key = "#type + '-' + #id")
    public CreditsDto getCredits(MediaTypeEnum type, Long id) {
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/" + type.path() + "/{id}/credits")
                        .queryParam("api_key", apiKey)
                        .build(id))
                .retrieve()
                .bodyToMono(CreditsDto.class)
                .block();
    }

    /**
     * Retrieves detailed information for a specific person (actor, director, etc.).
     * Includes combined credits (all movies and TV shows the person has worked on).
     * Results are cached based on the person ID.
     *
     * @param id - The unique identifier of the person.
     *
     * @return - A PersonDto containing detailed information about the person and their credits.
     */
    @Cacheable(value = "personDetails", key = "#id")
    public PersonDto getPersonDetails(Long id) {
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/person/{id}")
                        .queryParam("api_key", apiKey)
                        .queryParam("append_to_response", "combined_credits")
                        .build(id))
                .retrieve()
                .bodyToMono(PersonDto.class)
                .block();
    }

    /**
     * Retrieves a list of popular people (actors, directors, etc.).
     * Results are cached based on the page number.
     *
     * @param page - The page number for pagination (1-based).
     *
     * @return - A PagedResponseDto containing popular people.
     */
    @Cacheable(value = "popularPeople", key = "#page")
    public PagedResponseDto<PersonDto> getPopularPeople(int page) {
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/person/popular")
                        .queryParam("api_key", apiKey)
                        .queryParam("page", page)
                        .build())
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<PagedResponseDto<PersonDto>>() {})
                .block();
    }

    /**
     * Searches specifically for anime titles using genre and origin country filters.
     * Targets Japanese Animation (genre 16) from Japan.
     *
     * @param query - The search query string.
     * @param page  - The page number for pagination (1-based).
     *
     * @return - A PagedResponseDto containing anime search results.
     */
    @Cacheable(value = "searchAnime", key = "#query + '-' + #page")
    public PagedResponseDto<MovieDto> searchAnime(String query, int page) {
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/search/tv")
                        .queryParam("api_key", apiKey)
                        .queryParam("query", query)
                        .queryParam("page", page)
                        .queryParam("with_genres", ANIME_GENRE_ID)
                        .queryParam("with_origin_country", ANIME_ORIGIN_COUNTRY)
                        .build())
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<PagedResponseDto<MovieDto>>() {})
                .block();
    }

    /**
     * Retrieves trending anime for the current day.
     * Fetches trending TV content and filters to Japanese Animation only.
     *
     * @param page - The page number for pagination (1-based).
     *
     * @return - A PagedResponseDto containing trending anime titles.
     */
    @Cacheable(value = "trendingAnime", key = "#page")
    public PagedResponseDto<MovieDto> getTrendingAnime(int page) {
        PagedResponseDto<MovieDto> trending = webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/trending/tv/day")
                        .queryParam("api_key", apiKey)
                        .queryParam("page", page)
                        .build())
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<PagedResponseDto<MovieDto>>() {})
                .block();

        return filterAnime(trending);
    }

    /**
     * Retrieves popular anime using the discover endpoint with anime-specific filters.
     *
     * @param page - The page number for pagination (1-based).
     *
     * @return - A PagedResponseDto containing popular anime titles.
     */
    @Cacheable(value = "popularAnime", key = "#page")
    public PagedResponseDto<MovieDto> getPopularAnime(int page) {
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/discover/tv")
                        .queryParam("api_key", apiKey)
                        .queryParam("page", page)
                        .queryParam("with_genres", ANIME_GENRE_ID)
                        .queryParam("with_origin_country", ANIME_ORIGIN_COUNTRY)
                        .queryParam("sort_by", "popularity.desc")
                        .build())
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<PagedResponseDto<MovieDto>>() {})
                .block();
    }

    /**
     * Retrieves a specific anime with all its season details appended.
     * Uses append_to_response to fetch all seasons in a single API call.
     *
     * @param id              - The unique TMDB identifier of the anime (TV show).
     * @param numberOfSeasons - The total number of seasons to fetch.
     *
     * @return - A MovieDto with full season and episode data populated.
     */
    @Cacheable(value = "animeDetails", key = "#id")
    public MovieDto getAnimeDetails(Long id, int numberOfSeasons) {
        String appendSeasons = IntStream.rangeClosed(1, numberOfSeasons)
                .mapToObj(i -> "season/" + i)
                .collect(Collectors.joining(","));

        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/tv/{id}")
                        .queryParam("api_key", apiKey)
                        .queryParam("append_to_response", appendSeasons)
                        .build(id))
                .retrieve()
                .bodyToMono(MovieDto.class)
                .block();
    }

    /**
     * Filters a paged response to retain only anime entries.
     * An entry is considered anime if it belongs to genre 16 (Animation)
     * and originates from Japan.
     *
     * @param response - The original PagedResponseDto to filter.
     *
     * @return - A filtered PagedResponseDto containing only anime titles.
     */
    private PagedResponseDto<MovieDto> filterAnime(PagedResponseDto<MovieDto> response) {
        if (response == null || response.getResults() == null) return response;

        List<MovieDto> animeOnly = response.getResults().stream()
                .filter(item -> item.getGenres() != null &&
                        item.getGenres().stream()
                                .anyMatch(g -> ANIME_GENRE_ID.equals(String.valueOf(g.getId()))))
                .collect(Collectors.toList());

        response.setResults(animeOnly);
        return response;
    }

    /**
     * Retrieves top-rated anime using the discover endpoint sorted by vote average.
     * Applies the same genre and origin country filters used by {@link #getPopularAnime}
     * but sorts by vote average descending instead of popularity.
     * A minimum vote count threshold is applied to suppress low-signal titles.
     * Results are cached based on the page number.
     *
     * @param page - The page number for pagination (1-based).
     *
     * @return - A PagedResponseDto containing top-rated anime titles.
     */
    @Cacheable(value = "topRatedAnime", key = "#page")
    public PagedResponseDto<MovieDto> getTopRatedAnime(int page) {
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/discover/tv")
                        .queryParam("api_key", apiKey)
                        .queryParam("page", page)
                        .queryParam("with_genres", ANIME_GENRE_ID)
                        .queryParam("with_origin_country", ANIME_ORIGIN_COUNTRY)
                        .queryParam("sort_by", "vote_average.desc")
                        .queryParam("vote_count.gte", 200)
                        .build())
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<PagedResponseDto<MovieDto>>() {})
                .block();
    }

    /**
     * Retrieves a specific anime with accurate season and episode structure.
     * TMDB often combines multi-season anime into a single season entry.
     * This method uses Jikan (MAL) to fetch correct per-season episode lists,
     * then maps them back into the TvDetailsDto shape the frontend expects.
     *
     * Strategy:
     *   1. Fetch base metadata from TMDB (poster, backdrop, overview, etc.)
     *   2. Search Jikan for the MAL ID using the anime's name.
     *   3. Walk the Jikan sequel chain to collect all season MAL IDs.
     *   4. Fetch episodes per MAL entry and build one SeasonDto per season.
     *   5. Return TMDB metadata + Jikan-derived seasons merged into TvDetailsDto.
     *
     * Falls back to TMDB-only behaviour if Jikan lookup fails.
     *
     * @param id - The unique TMDB identifier of the anime (TV show).
     *
     * @return - A TvDetailsDto with accurate seasons and episodes populated.
     */
    @Cacheable(value = "animeSeasons", key = "#id")
    public TvDetailsDto getAnimeSeasons(Long id) {
        // Step 1 — fetch base metadata from TMDB.
        TvDetailsDto base = webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/tv/{id}")
                        .queryParam("api_key", apiKey)
                        .build(id))
                .retrieve()
                .bodyToMono(TvDetailsDto.class)
                .block();

        if (base == null) return null;

        try {
            // Step 2 — find the MAL ID by searching Jikan with the anime's name.
            Long firstMalId = jikanService.searchMalId(base.getName());
            if (firstMalId == null) return fallbackToTmdb(base, id);

            // Step 3 — collect all season MAL IDs: first entry + all sequels.
            List<Long> allMalIds = new ArrayList<>();
            allMalIds.add(firstMalId);
            allMalIds.addAll(jikanService.fetchSequelMalIds(firstMalId));

            // Step 4 — fetch episodes per MAL entry, build one SeasonDto per season.
            List<SeasonDto> seasons = new ArrayList<>();
            for (int i = 0; i < allMalIds.size(); i++) {
                Long malId = allMalIds.get(i);
                List<JikanEpisodeDto> jikanEps = jikanService.fetchAllEpisodes(malId);
                if (jikanEps.isEmpty()) continue;

                List<EpisodeDto> episodes = jikanEps.stream()
                        .map(ep -> {
                            EpisodeDto dto = new EpisodeDto();
                            dto.setEpisode_number(ep.getMalId() != null ? ep.getMalId() : 0);
                            dto.setName(ep.getTitle() != null ? ep.getTitle() : "Episode " + ep.getMalId());
                            dto.setAir_date(ep.getAired());
                            // Jikan scores are 0–5; multiply by 2 to normalize to 0–10.
                            dto.setVote_average(ep.getScore() != null ? ep.getScore() * 2 : 0.0);
                            dto.setOverview("");
                            dto.setStill_path(null);
                            return dto;
                        })
                        .collect(Collectors.toList());

                SeasonDto season = new SeasonDto();
                season.setSeason_number(i + 1);
                season.setName("Season " + (i + 1));
                season.setEpisodes(episodes);
                season.setPoster_path(base.getPoster_path());
                // TMDB vote_average is already on a 0–10 scale — no conversion needed.
                season.setVote_average(base.getVote_average() != null ? base.getVote_average() : 0.0);
                seasons.add(season);
            }

            if (seasons.isEmpty()) return fallbackToTmdb(base, id);

            // Step 5 — attach Jikan-derived seasons to TMDB base metadata.
            base.setSeasons(seasons);
            base.setNumber_of_seasons(seasons.size());
            return base;

        } catch (Exception e) {
            // Any Jikan failure — fall back to TMDB-only data silently.
            System.err.println("Jikan lookup failed for TMDB ID " + id + ": " + e.getMessage());
            return fallbackToTmdb(base, id);
        }
    }

    /**
     * Fallback — fetches season and episode data from TMDB directly.
     * Used when Jikan lookup fails or returns no results.
     *
     * @param base - The already-fetched TMDB base TvDetailsDto.
     * @param id   - The TMDB ID (used for per-season fetches).
     *
     * @return - TvDetailsDto with TMDB seasons and episodes populated.
     */
    private TvDetailsDto fallbackToTmdb(TvDetailsDto base, Long id) {
        if (base.getSeasons() == null) return base;

        List<Integer> regularSeasonNumbers = base.getSeasons().stream()
                .map(SeasonDto::getSeason_number)
                .filter(n -> n > 0)
                .distinct()
                .sorted()
                .collect(Collectors.toList());

        List<SeasonDto> seasonsWithEpisodes = regularSeasonNumbers.stream()
                .map(seasonNumber -> {
                    SeasonDto season = webClient.get()
                            .uri(uriBuilder -> uriBuilder
                                    .path("/tv/{id}/season/{seasonNumber}")
                                    .queryParam("api_key", apiKey)
                                    .build(id, seasonNumber))
                            .retrieve()
                            .bodyToMono(SeasonDto.class)
                            .block();

                    if (season != null && season.getSeason_number() == 0) {
                        season.setSeason_number(seasonNumber);
                    }
                    return season;
                })
                .filter(season -> season != null && season.getSeason_number() > 0)
                .collect(Collectors.toList());

        base.setSeasons(seasonsWithEpisodes);
        return base;
    }

    /**
     * Retrieves paginated reviews for a specific movie or TV show.
     * Results are cached based on media type, ID, and page number.
     *
     * @param type  - The type of media (MOVIE or TV).
     * @param id    - The unique identifier of the media item.
     * @param page  - The page number for pagination (1-based).
     * @return      - A ReviewsDto containing paginated reviews.
     */
    @Cacheable(value = "reviews", key = "#type + '-' + #id + '-' + #page")
    public ReviewsDto getReviews(MediaTypeEnum type, Long id, int page) {
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/" + type.path() + "/{id}/reviews")
                        .queryParam("api_key", apiKey)
                        .queryParam("page", page)
                        .build(id))
                .retrieve()
                .bodyToMono(ReviewsDto.class)
                .block();
    }


    /**
     * Retrieves external IDs for a TV series from TMDB, including the MAL ID.
     * Cached per TMDB series ID so repeat lookups for the same anime are free.
     *
     * @param tmdbId - The TMDB TV series ID.
     * @return       - An {@code ExternalIdsDto} containing the MAL ID (may be null).
     */
    @Cacheable(value = "externalIds", key = "#tmdbId")
    public JikanReviewsResponse.ExternalIdsDto getExternalIds(Long tmdbId) {
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/tv/{id}/external_ids")
                        .queryParam("api_key", apiKey)
                        .build(tmdbId))
                .retrieve()
                .bodyToMono(JikanReviewsResponse.ExternalIdsDto.class)
                .block();
    }

    /**
     * Fetches all movies belonging to a specific collection by its ID.
     * This is the only valid way to get a single collection from TMDB —
     * there is no "get all collections" endpoint on their API.
     */
    @Cacheable(value = "collection", key = "#id")
    public CollectionDto getCollection(Long id) {
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/collection/{id}")
                        .queryParam("api_key", apiKey)
                        .build(id))
                .retrieve()
                .bodyToMono(CollectionDto.class)
                .retryWhen(Retry.fixedDelay(2, Duration.ofSeconds(1)))
                .block();
    }

    /**
     * Searches TMDB for collections matching a query string.
     * Then fetches full collection details for each result,
     * calculates average popularity based on all movies in the collection,
     * sorts collections by popularity in descending order,
     * and returns the paginated response.
     */
    @Cacheable(value = "searchCollections", key = "#query + '-' + #page")
    public PagedResponseDto<CollectionDto> searchCollections(String query, int page) {
        PagedResponseDto<CollectionDto> resultList = webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/search/collection")
                        .queryParam("api_key", apiKey)
                        .queryParam("query", query)
                        .queryParam("page", page)
                        .build())
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<PagedResponseDto<CollectionDto>>() {})
                .retryWhen(Retry.fixedDelay(2, Duration.ofSeconds(1)))
                .block();
        if (resultList == null || resultList.getResults() == null || resultList.getResults().isEmpty()) {
            return new PagedResponseDto<>();
        }
        System.out.println("Total Results for Query '" + query + "' = "
                + resultList.getResults().size() + " on page " + page);
        List<CollectionDto> enrichedCollections = resultList.getResults()
                .stream()
                .map(searchResult -> {
                    try {
                        // Fetch complete collection details
                        CollectionDto fullCollection = getCollection(searchResult.getId());
                        if (fullCollection == null) {
                            return null;
                        }
                        List<MovieDto> movies = fullCollection.getParts();
                        if (movies == null || movies.isEmpty()) {
                            fullCollection.setPopularity(0.0);
                            return fullCollection;
                        }
                        double averagePopularity = movies.stream()
                                .mapToDouble(MovieDto::getPopularity)
                                .average()
                                .orElse(0.0);
                        fullCollection.setPopularity(averagePopularity);
                        System.out.println("Collection: " + fullCollection.getName()
                                + " | Popularity: " + averagePopularity);
                        return fullCollection;
                    } catch (Exception e) {
                        System.err.println("Failed to fetch collection ID "
                                + searchResult.getId() + ": " + e.getMessage());
                        return null;
                    }
                })
                .filter(Objects::nonNull)
                .sorted(Comparator.comparing(
                        CollectionDto::getPopularity,
                        Comparator.nullsLast(Comparator.reverseOrder())
                ))
                .toList();
        resultList.setResults(enrichedCollections);
        return resultList;
    }

    /**
     * Discovers movies or TV shows using TMDB's powerful filter engine.
     * Supports filtering by genre, year, minimum rating, and sort order.
     *
     * @param mediaType  - "movie" or "tv"
     * @param genreId    - TMDB genre ID (nullable — omits filter if null)
     * @param year       - release/air year (nullable)
     * @param sortBy     - TMDB sort field e.g. "popularity.desc"
     * @param minRating  - minimum vote_average (nullable)
     * @param page       - page number (1-based)
     */
    @Cacheable(value = "discover", key = "#mediaType + '-' + #genreId + '-' + #year + '-' + #sortBy + '-' + #minRating + '-' + #page")
    public PagedResponseDto<MovieDto> discover(
            String mediaType, Long genreId, Integer year,
            String sortBy, Double minRating, int page) {
        String discoverParam = "/discover/";
        if(mediaType != null && !mediaType.isEmpty()) {
            discoverParam+= mediaType;
        }
        String finalDiscoverParam = discoverParam;
        return webClient.get()
                .uri(uriBuilder -> {
                    uriBuilder
                            .path(finalDiscoverParam)
                            .queryParam("api_key", apiKey)
                            .queryParam("sort_by", sortBy != null ? sortBy : "popularity.desc")
                            .queryParam("page", page)
                            .queryParam("vote_count.gte", 50); // exclude obscure titles

                    // Only add optional filters when provided — omitting them
                    // is different from passing null on TMDB's API.
                    if (genreId != null)
                        uriBuilder.queryParam("with_genres", genreId);
                    if (year != null) {
                        if ("movie".equals(mediaType))
                            uriBuilder.queryParam("primary_release_year", year);
                        else
                            uriBuilder.queryParam("first_air_date_year", year);
                    }
                    if (minRating != null)
                        uriBuilder.queryParam("vote_average.gte", minRating);

                    return uriBuilder.build();
                })
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<PagedResponseDto<MovieDto>>() {})
                .retryWhen(Retry.fixedDelay(2, Duration.ofSeconds(1)))
                .block();
    }

    /**
     * Fetches streaming/rental/purchase providers for a specific title.
     * Returns a region-keyed map — each region has flatrate, rent, buy arrays.
     * Results cached per type + ID since providers rarely change.
     *
     * @param mediaType - "movie" or "tv"
     * @param id        - TMDB title ID
     */
    @Cacheable(value = "watchProviders", key = "#mediaType + '-' + #id")
    public Map<String, Object> getWatchProviders(String mediaType, Long id) {
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/" + mediaType + "/{id}/watch/providers")
                        .queryParam("api_key", apiKey)
                        .build(id))
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .retryWhen(Retry.fixedDelay(1, Duration.ofSeconds(1)))
                .block();
    }
}
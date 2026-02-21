package com.cinevault.cinevaultapp.service;

import com.cinevault.cinevaultapp.dto.*;
import com.cinevault.cinevaultapp.enums.MediaTypeEnum;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.ArrayList;

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

    private final WebClient webClient;

    @Value("${tmdb.api-key}")
    private String apiKey;

    /**
     * Constructs a new TmdbServices instance with the specified WebClient.
     *
     * @param webClient - The WebClient used for making HTTP requests to TMDB API.
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
     * @param page - The page number for pagination (1-based).
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
     * @param id - The unique identifier of the media item.
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
     * @param id - The unique identifier of the TV show.
     *
     * @return - A TvDetailsDto containing detailed information about the TV show.
     */
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
     * @param id - The unique identifier of the TV show.
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
        // merge results
        if(movies != null && movies.getResults() != null){
            movies.getResults().addAll(tvShows != null ? tvShows.getResults() : new ArrayList<>());
        }
        return movies;
    }

    /**
     * Retrieves cast and crew credits for a specific media item.
     * Results are cached based on media type and ID.
     *
     * @param type - The type of media (MOVIE or TV).
     * @param id - The unique identifier of the media item.
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
                .bodyToMono(
                        new ParameterizedTypeReference<PagedResponseDto<PersonDto>>() {}
                )
                .block();
    }
}
package com.cinevault.cinevaultapp.dto;

import lombok.Data;
import java.util.List;

/**
 * Data Transfer Object for movie and TV show information from TMDB API.
 * Contains fields for both movie-specific and TV-specific data, allowing a single DTO
 * to represent either media type.
 *
 * @author karthicknathan
 * @since Feb 04, 2026
 *
 * @version 1.0
 */
@Data
public class MovieDto {

    /**
     * The unique identifier of the media item.
     */
    private Long id;

    /**
     * The type of media - either "movie" or "tv".
     */
    private String media_type;

    /**
     * A brief overview or synopsis of the media.
     */
    private String overview;

    /**
     * The path to the poster image.
     */
    private String poster_path;

    /**
     * The path to the backdrop image.
     */
    private String backdrop_path;

    /**
     * The average user rating.
     */
    private Double vote_average;

    /**
     * The total number of votes received.
     */
    private Integer vote_count;

    /**
     * The popularity score of the media.
     */
    private Double popularity;

    /**
     * The original language of the media.
     */
    private String original_language;

    /**
     * The title of the movie (movie-specific field).
     */
    private String title;

    /**
     * The original title of the movie (movie-specific field).
     */
    private String original_title;

    /**
     * The release date of the movie (movie-specific field).
     */
    private String release_date;

    /**
     * The runtime of the movie in minutes (movie-specific field).
     */
    private Integer runtime;

    /**
     * The name of the TV series (TV-specific field).
     */
    private String name;

    /**
     * The original name of the TV series (TV-specific field).
     */
    private String original_name;

    /**
     * The date of the first episode aired (TV-specific field).
     */
    private String first_air_date;

    /**
     * The date of the last episode aired (TV-specific field).
     */
    private String last_air_date;

    /**
     * The total number of seasons (TV-specific field).
     */
    private Integer number_of_seasons;

    /**
     * The total number of episodes (TV-specific field).
     */
    private Integer number_of_episodes;

    /**
     * The typical episode runtime in minutes (TV-specific field).
     */
    private List<Integer> episode_run_time;

    /**
     * List of seasons for TV series.
     */
    private List<Season> seasons;

    /**
     * List of genres associated with the media.
     */
    private List<Genre> genres;

    /**
     * Inner class representing a season of a TV series.
     */
    @Data
    public static class Season {
        /**
         * The season number.
         */
        private Integer season_number;

        /**
         * The name of the season.
         */
        private String name;

        /**
         * A brief overview of the season.
         */
        private String overview;

        /**
         * The path to the season's poster image.
         */
        private String poster_path;

        /**
         * The air date of the season.
         */
        private String air_date;

        /**
         * The number of episodes in the season.
         */
        private Integer episode_count;

        /**
         * List of episodes in the season.
         */
        private List<Episode> episodes;
    }

    /**
     * Inner class representing an episode of a TV series.
     */
    @Data
    public static class Episode {
        /**
         * The episode number within the season.
         */
        private Integer episode_number;

        /**
         * The name of the episode.
         */
        private String name;

        /**
         * A brief overview of the episode.
         */
        private String overview;

        /**
         * The path to the episode's still image.
         */
        private String still_path;

        /**
         * The air date of the episode.
         */
        private String air_date;

        /**
         * The runtime of the episode in minutes.
         */
        private Integer runtime;

        /**
         * The average user rating for the episode.
         */
        private Double vote_average;
    }

    /**
     * Inner class representing a genre.
     */
    @Data
    public static class Genre{
        /**
         * The unique identifier of the genre.
         */
        private Long id;

        /**
         * The name of the genre.
         */
        private String name;
    }

    /**
     * Checks if this DTO represents a movie.
     *
     * @return - True if this is a movie, false otherwise.
     */
    public boolean isMovie() {
        return title != null;
    }

    /**
     * Checks if this DTO represents a TV show.
     *
     * @return - True if this is a TV show, false otherwise.
     */
    public boolean isTv() {
        return name != null;
    }
}
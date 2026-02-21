package com.cinevault.cinevaultapp.dto;

import lombok.Data;
import java.util.List;

/**
 * Data Transfer Object for person (actor, director, crew member) information from TMDB API.
 * Contains biographical details and combined credits (both cast and crew roles).
 *
 * @author karthicknathan
 * @since Feb 06, 2026
 *
 * @version 1.0
 */
@Data
public class PersonDto {
    /**
     * The unique identifier of the person.
     */
    private Long id;

    /**
     * The name of the person.
     */
    private String name;

    /**
     * The biographical information of the person.
     */
    private String biography;

    /**
     * The path to the person's profile image.
     */
    private String profile_path;

    /**
     * The person's birth date.
     */
    private String birthday;

    /**
     * The person's death date (if applicable).
     */
    private String deathday;

    /**
     * The person's place of birth.
     */
    private String place_of_birth;

    /**
     * The popularity score of the person.
     */
    private Double popularity;

    /**
     * The department the person is primarily known for (e.g., "Acting", "Directing").
     */
    private String known_for_department;

    /**
     * Combined movie and TV credits for the person.
     */
    private MovieCredits combined_credits;

    /**
     * Inner class representing combined movie and TV credits.
     */
    @Data
    public static class MovieCredits {
        /**
         * List of cast roles the person has performed.
         */
        private List<Cast> cast;

        /**
         * List of crew positions the person has held.
         */
        private List<Crew> crew;
    }

    /**
     * Inner class representing a cast role.
     */
    @Data
    public static class Cast {
        /**
         * The unique identifier of the media item.
         */
        private Long id;

        /**
         * The title of the movie (for movie credits).
         */
        private String title;

        /**
         * The name of the TV show (for TV credits).
         */
        private String name;

        /**
         * The character name played by the person.
         */
        private String character;

        /**
         * The path to the media's poster image.
         */
        private String poster_path;

        /**
         * The type of media - either "movie" or "tv".
         */
        private String media_type;

        /**
         * The release date (for movies).
         */
        private String release_date;

        /**
         * The first air date (for TV shows).
         */
        private String first_air_date;

        /**
         * The average user rating of the media.
         */
        private Double vote_average;
    }

    /**
     * Inner class representing a crew position.
     */
    @Data
    public static class Crew {
        /**
         * The unique identifier of the media item.
         */
        private Long id;

        /**
         * The title of the movie (for movie credits).
         */
        private String title;

        /**
         * The name of the TV show (for TV credits).
         */
        private String name;

        /**
         * The job title or position held.
         */
        private String job;

        /**
         * The department the job belongs to (e.g., "Production", "Camera").
         */
        private String department;

        /**
         * The path to the media's poster image.
         */
        private String poster_path;

        /**
         * The type of media - either "movie" or "tv".
         */
        private String media_type;

        /**
         * The average user rating of the media.
         */
        private Double vote_average;
    }
}
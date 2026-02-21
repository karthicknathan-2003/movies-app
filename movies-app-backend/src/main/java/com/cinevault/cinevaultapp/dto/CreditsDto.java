package com.cinevault.cinevaultapp.dto;

import lombok.Data;

import java.util.List;

/**
 * Data Transfer Object for cast and crew credits from TMDB API.
 * Contains information about people involved in a movie or TV show production.
 *
 * @author karthicknathan
 * @since Feb 04, 2026
 *
 * @version 1.0
 */
@Data
public class CreditsDto {
    /**
     * List of cast members (actors) in the production.
     */
    private List<Cast> cast;

    /**
     * List of crew members (directors, producers, etc.) in the production.
     */
    private List<Crew> crew;

    /**
     * Inner class representing a cast member.
     */
    @Data
    public static class Cast {
        /**
         * The unique identifier of the cast member.
         */
        private Long id;

        /**
         * The name of the cast member.
         */
        private String name;

        /**
         * The character name played by the cast member.
         */
        private String character;

        /**
         * The path to the cast member's profile image.
         */
        private String profile_path;
    }

    /**
     * Inner class representing a crew member.
     */
    @Data
    public static class Crew {
        /**
         * The unique identifier of the crew member.
         */
        private Long id;

        /**
         * The name of the crew member.
         */
        private String name;

        /**
         * The job title or position held by the crew member.
         */
        private String job;

        /**
         * The department the crew member belongs to (e.g., "Production", "Camera").
         */
        private String department;
    }
}
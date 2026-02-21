package com.cinevault.cinevaultapp.enums;

/**
 * Enum representing different types of media in the application.
 * Used to differentiate between movies and TV shows when interacting with TMDB API.
 *
 * @author karthicknathan
 * @since Feb 04, 2026
 *
 * @version 1.0
 */
public enum MediaTypeEnum {
    /**
     * Represents a movie media type.
     */
    MOVIE("movie"),
    /**
     * Represents a TV show media type.
     */
    TV("tv");

    private final String stringValue;

    /**
     * Constructs a {@code MediaTypeEnum} with the specified string value.
     *
     * @param stringValue - The string representation used in API paths.
     */
    MediaTypeEnum(String stringValue) {
        this.stringValue = stringValue;
    }

    /**
     * Returns the path string used for TMDB API requests.
     *
     * @return - The string value representing the media type in API paths.
     */
    public String path() {
        return stringValue;
    }
}
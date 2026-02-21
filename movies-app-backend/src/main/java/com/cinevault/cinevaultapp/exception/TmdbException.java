package com.cinevault.cinevaultapp.exception;

/**
 * Custom exception for TMDB API-related errors.
 * Thrown when interactions with The Movie Database API fail or return unexpected results.
 *
 * @author karthicknathan
 * @since Feb 04, 2026
 *
 * @version 1.0
 */
public class TmdbException extends RuntimeException {
    /**
     * Constructs a new {@code TmdbException} with the specified error message.
     *
     * @param message - The detail message explaining the cause of the exception.
     */
    public TmdbException(String message) {
        super(message);
    }
}
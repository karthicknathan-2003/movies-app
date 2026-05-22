package com.cinevault.cinevaultapp.exception;

import com.cinevault.cinevaultapp.dto.ErrorResponseDto;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Global exception handler for the CineVault application.
 * Handles exceptions thrown across all controllers and provides standardized error responses.
 *
 * @author karthicknathan
 * @since Feb 04, 2026
 *
 * @version 1.0
 */
@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger LOGGER = Logger.getLogger(GlobalExceptionHandler.class.getName());

    /**
     * Handles {@code TmdbException} thrown when TMDB API interactions fail.
     * Returns a BAD_GATEWAY status with the exception message.
     *
     * @param ex - The {@code TmdbException} that was thrown.
     *
     * @return - A {@code ResponseEntity} containing an {@code ErrorResponseDto} with HTTP 502 status.
     */
    @ExceptionHandler(TmdbException.class)
    public ResponseEntity<?> handleTmdb(TmdbException ex) {
        LOGGER.log(Level.SEVERE, "TMDB exception handled: " + ex.getMessage(), ex);
        return ResponseEntity
                .status(HttpStatus.BAD_GATEWAY)
                .body(new ErrorResponseDto(ex.getMessage()));
    }

    /**
     * Handles all other uncaught exceptions.
     * Returns a generic error message with INTERNAL_SERVER_ERROR status.
     *
     * @param e - The {@code Exception} that was thrown.
     *
     * @return - A {@code ResponseEntity} containing an {@code ErrorResponseDto} with HTTP 500 status.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleAll(Exception e) {
        // Log full stack trace for root-cause analysis while returning a safe response to clients.
        LOGGER.log(Level.SEVERE, "Unhandled exception caught by global handler", e);
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponseDto("Something went wrong"));
    }
}

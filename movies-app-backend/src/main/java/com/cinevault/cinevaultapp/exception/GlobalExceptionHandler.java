package com.cinevault.cinevaultapp.exception;

import com.cinevault.cinevaultapp.dto.ErrorResponseDto;
import org.springframework.security.access.AccessDeniedException;
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
        // Keep unexpected failures generic while preserving detailed logs for debugging.
        LOGGER.log(Level.SEVERE, "Unhandled exception caught by global handler", e);
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponseDto("Something went wrong"));
    }

    /**
     * Handles invalid client input so the frontend receives the original
     * validation message instead of a generic server error.
     *
     * @param ex - The {@code IllegalArgumentException} thrown during validation.
     *
     * @return - A {@code ResponseEntity} containing an {@code ErrorResponseDto} with HTTP 400 status.
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<?> handleBadRequest(IllegalArgumentException ex) {
        LOGGER.log(Level.WARNING, "Validation exception handled: " + ex.getMessage(), ex);
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponseDto(ex.getMessage()));
    }

    /**
     * Handles authorization failures where a user tries to access or change
     * another user's data.
     *
     * @param ex - The {@code AccessDeniedException} that was thrown.
     *
     * @return - A {@code ResponseEntity} containing an {@code ErrorResponseDto} with HTTP 403 status.
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<?> handleForbidden(AccessDeniedException ex) {
        LOGGER.log(Level.WARNING, "Access denied: " + ex.getMessage(), ex);
        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(new ErrorResponseDto(ex.getMessage()));
    }

    /**
     * Handles user-facing runtime failures so the frontend can display the
     * original backend message instead of a generic fallback.
     *
     * @param ex - The {@code RuntimeException} that was thrown.
     *
     * @return - A {@code ResponseEntity} containing an {@code ErrorResponseDto} with HTTP 400 status.
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<?> handleRuntime(RuntimeException ex) {
        LOGGER.log(Level.WARNING, "Runtime exception handled: " + ex.getMessage(), ex);
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponseDto(ex.getMessage()));
    }
}

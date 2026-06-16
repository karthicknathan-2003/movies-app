package com.cinevault.cinevaultapp.dto;
import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * Data Transfer Object for authentication responses.
 * Contains the user identity returned after successful login.
 * The JWT itself is now sent in an HttpOnly cookie instead of browser-readable storage.
 *
 * @author karthicknathan
 * @since Feb 04, 2026
 *
 * @version 1.0
 */
@Data
@AllArgsConstructor
public class AuthResponseDto {
    /**
     * The authenticated user's username.
     */
    private String userName;

    private String fullName;

    /**
     * The JWT token field is intentionally optional because authenticated browser
     * flows now use the HttpOnly cookie instead of exposing the token to JavaScript.
     */
    private String token;
}
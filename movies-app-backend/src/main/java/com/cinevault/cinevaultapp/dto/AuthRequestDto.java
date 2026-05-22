package com.cinevault.cinevaultapp.dto;

import lombok.Data;

/**
 * Data Transfer Object for authentication requests.
 * Used for both user registration and login operations.
 *
 * @author karthicknathan
 * @since Feb 04, 2026
 *
 * @version 1.0
 */
@Data
public class AuthRequestDto {
    /**
     * The user's first name (used during registration).
     */
    private String firstName;

    /**
     * The user's last name (used during registration).
     */
    private String lastName;

    /**
     * The unique username for authentication.
     */
    private String userName;

    /**
     * The user's password in plain text (will be encrypted before storage).
     */
    private String password;

    /**
     * The Google ID token (JWT) returned by the Google Sign-In button.
     * Backend verifies this against Google's public keys.
     */
    private String credential;
}
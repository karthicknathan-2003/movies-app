package com.cinevault.cinevaultapp.dto;
import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * Data Transfer Object for authentication responses.
 * Contains the username and JWT token returned after successful login.
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
     * The JWT token for subsequent authenticated requests.
     */
    private String token;
}
package com.cinevault.cinevaultapp.controller;

import com.cinevault.cinevaultapp.dto.AuthRequestDto;
import com.cinevault.cinevaultapp.dto.AuthResponseDto;
import com.cinevault.cinevaultapp.dto.UserProfileDto;
import com.cinevault.cinevaultapp.service.AuthServices;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for handling authentication-related operations.
 * Provides endpoints for user registration and login.
 *
 * @author karthicknathan
 * @since Feb 04, 2026
 *
 * @version 1.0
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthServices authService;

    /**
     * Registers a new user in the system.
     *
     * @param dto - The {@code AuthRequestDto} containing user registration details.
     *
     * @return - A {@code ResponseEntity} with success message if registration is successful.
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody AuthRequestDto dto) {
        authService.register(dto);
        return ResponseEntity.ok("User registered successfully");
    }

    /**
     * Authenticates a user and generates a JWT token.
     *
     * @param dto - The {@code AuthRequestDto} containing login credentials.
     *
     * @return - An {@code AuthResponseDto} containing the username and JWT token.
     */
    @PostMapping("/login")
    public AuthResponseDto login(@RequestBody AuthRequestDto dto) {
        return authService.login(dto);
    }

    /**
     * Exchanges a Google ID token for an application JWT.
     *
     * @param request - contains the Google credential (ID token) from the frontend.
     * @return - {@code AuthResponseDto} with the userName and app JWT.
     */
    @PostMapping("/google")
    public ResponseEntity<AuthResponseDto> googleLogin(@RequestBody AuthRequestDto request) {
        AuthResponseDto response = authService.authenticateWithGoogle(request.getCredential());
        return ResponseEntity.ok(response);
    }
}
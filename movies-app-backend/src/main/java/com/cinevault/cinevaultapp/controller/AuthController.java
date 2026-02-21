package com.cinevault.cinevaultapp.controller;

import com.cinevault.cinevaultapp.dto.AuthRequestDto;
import com.cinevault.cinevaultapp.dto.AuthResponseDto;
import com.cinevault.cinevaultapp.service.AuthServices;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
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
@CrossOrigin(origins = "*")
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
}
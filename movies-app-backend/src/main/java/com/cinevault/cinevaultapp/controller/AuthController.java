package com.cinevault.cinevaultapp.controller;

import com.cinevault.cinevaultapp.dto.AuthRequestDto;
import com.cinevault.cinevaultapp.dto.AuthResponseDto;
import com.cinevault.cinevaultapp.security.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import com.cinevault.cinevaultapp.service.AuthServices;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
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
public class AuthController {
    private static final String HTTPS = "https";

    @Autowired
    private AuthServices authService;

    @Autowired
    private JwtUtil jwtUtil;

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
    public ResponseEntity<AuthResponseDto> login(@RequestBody AuthRequestDto dto,
                                                 HttpServletRequest request) {
        AuthResponseDto response = authService.login(dto);
        return ResponseEntity.ok()
                // The JWT now travels in an HttpOnly cookie instead of browser-readable storage.
                .header(HttpHeaders.SET_COOKIE,
                        jwtUtil.createAuthCookie(response.getToken(), isSecureRequest(request)))
                .body(new AuthResponseDto(response.getUserName(), response.getFullName(), null));
    }

    /**
     * Exchanges a Google ID token for an application JWT.
     *
     * @param request - contains the Google credential (ID token) from the frontend.
     * @return - {@code AuthResponseDto} with the userName and app JWT.
     */
    @PostMapping("/google")
    public ResponseEntity<AuthResponseDto> googleLogin(@RequestBody AuthRequestDto request,
                                                       HttpServletRequest httpRequest) {
        AuthResponseDto response = authService.authenticateWithGoogle(request.getCredential());
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE,
                        jwtUtil.createAuthCookie(response.getToken(), isSecureRequest(httpRequest)))
                .body(new AuthResponseDto(response.getUserName(), response.getFullName(), null));
    }

    /**
     * Clears the auth cookie so the browser no longer sends the JWT on later requests.
     *
     * @return - Empty success response after expiring the auth cookie.
     */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, jwtUtil.clearAuthCookie(isSecureRequest(request)))
                .build();
    }

    /**
     * Determines whether the original client request was made over HTTPS.
     *
     * <p>In many cloud environments, HTTPS/TLS is terminated by a reverse proxy,
     * load balancer, or ingress gateway before the request reaches the application.
     * These components typically forward the original protocol using standard
     * forwarding headers such as "X-Forwarded-Proto".<p/>
     *
     * <p>This check ensures cookies can be marked as Secure when the client
     * accessed the application via HTTPS, even if the backend itself receives
     * the request over plain HTTP.<p/>
     *
     * @param request The incoming HTTP request.
     *
     * @return True if the original client request used HTTPS; otherwise false.
     */
    private boolean isSecureRequest(HttpServletRequest request) {
        // Render and similar platforms forward the original protocol in this header after TLS termination.
        String forwardedProto = request.getHeader("X-Forwarded-Proto");
        return request.isSecure() || HTTPS.equalsIgnoreCase(forwardedProto);
    }
}
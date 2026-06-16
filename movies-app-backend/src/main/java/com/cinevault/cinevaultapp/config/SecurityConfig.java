package com.cinevault.cinevaultapp.config;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Security configuration class for the CineVault application.
 * Configures Spring Security settings including authentication, authorization,
 * CORS, CSRF protection, and JWT filter integration.
 *
 * @author karthicknathan
 * @since Feb 04, 2026
 *
 * @version 1.0
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private JwtFilter jwtFilter;

    /**
     * Creates a password encoder bean for encrypting user passwords.
     * Uses BCrypt hashing algorithm for secure password storage.
     *
     * @return - A {@code PasswordEncoder} instance using BCrypt.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Configures the security filter chain for HTTP requests.
     * Sets up authorization rules, CORS, CSRF protection, and JWT authentication filter.
     * Public endpoints include TMDB and authentication APIs, while watchlist endpoints require authentication.
     *
     * @param http - The {@code HttpSecurity} object to configure.
     *
     * @return - The configured {@code SecurityFilterChain}.
     *
     * @throws Exception - If an error occurs during configuration.
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.cors(cors -> {})
                .csrf(csrf -> csrf.disable())
                .exceptionHandling(exceptionHandling -> exceptionHandling
                        // Return a stable 401 payload when an authenticated endpoint is hit without a valid session.
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType("application/json");
                            response.getWriter().write("""
                                    {
                                      "error": "UNAUTHORIZED",
                                      "message": "Session expired. Please login again."
                                    }
                                    """);
                        })
                )
                .authorizeHttpRequests(auth -> auth
                        // TMDB proxy and all auth endpoints (login, register, google) are public.
                        .requestMatchers("/api/tmdb/**", "/api/auth/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/reviews/**").permitAll()
                        .requestMatchers("/api/watchlist/**").authenticated()
                        .requestMatchers("/api/notifications/**").authenticated()
                        .requestMatchers("/api/reviews/**").authenticated()
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
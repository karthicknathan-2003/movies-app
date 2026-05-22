package com.cinevault.cinevaultapp.config;

import com.cinevault.cinevaultapp.security.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.logging.Logger;

/**
 * JWT authentication filter that validates JWT tokens on each request.
 * Extracts and validates the JWT token from the Authorization header,
 * then sets the authentication context if the token is valid.
 *
 * @author karthicknathan
 * @since Feb 04, 2026
 *
 * @version 1.0
 */
@Component
public class JwtFilter extends OncePerRequestFilter {
    private static final Logger LOGGER = Logger.getLogger(JwtFilter.class.getName());

    @Autowired
    private JwtUtil jwtUtil;

    /**
     * Filters incoming HTTP requests to validate JWT tokens.
     * Extracts the token from the Authorization header, validates it,
     * and sets the security context if valid. Returns an error response if the token is expired.
     *
     * @param request - The {@code HttpServletRequest} being processed.
     * @param response - The {@code HttpServletResponse} to send back.
     * @param filterChain - The {@code FilterChain} to continue processing the request.
     *
     * @throws ServletException - If a servlet-specific error occurs.
     * @throws IOException - If an I/O error occurs during request processing.
     */
    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                if (jwtUtil.validateToken(token)) {
                    String username = jwtUtil.extractUsername(token);
                    LOGGER.fine(() -> "JWT validated successfully for user=" + username
                            + " path=" + request.getRequestURI());
                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    username,
                                    null,
                                    List.of()
                            );
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            } catch (io.jsonwebtoken.ExpiredJwtException e) {
                // Return a stable JSON shape so frontend can handle forced logout uniformly.
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json");
                response.getWriter().write("""
                        {
                          "error": "TOKEN_EXPIRED",
                          "message": "Session expired. Please login again."
                        }
                        """);
                LOGGER.warning(() -> "Expired JWT for path=" + request.getRequestURI());
                return; // stop filter chain
            }
        }
        // Continue with remaining filters regardless of public/authenticated route.
        filterChain.doFilter(request, response);
    }
}

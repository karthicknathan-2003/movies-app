package com.cinevault.cinevaultapp.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

/**
 * Utility class for handling JWT (JSON Web Token) operations.
 * Provides methods for token generation, validation, and username extraction.
 * Uses HS512 signature algorithm for token signing.
 *
 * @author karthicknathan
 * @since Feb 04, 2026
 *
 * @version 1.0
 */
@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private long expiration;

    /**
     * Generates a signing key from the secret string.
     * The key is created using HMAC-SHA algorithm with the secret encoded in UTF-8.
     *
     * @return - The signing key used for JWT token generation and validation.
     */
    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Generates a JWT token for the specified username.
     * The token includes the username as subject, issue time, and expiration time.
     *
     * @param username - The username to include in the token.
     *
     * @return - A signed JWT token string.
     */
    public String generateToken(String username) {
        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSigningKey(), SignatureAlgorithm.HS512)
                .compact();
    }

    /**
     * Extracts the username from a JWT token.
     * Parses and validates the token signature before extracting the subject claim.
     *
     * @param token - The JWT token string to parse.
     *
     * @return - The username stored in the token's subject claim.
     */
    public String extractUsername(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())   // SAME KEY
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    /**
     * Validates the JWT token by verifying its signature and expiration.
     *
     * @param token - The JWT token string to validate.
     * @return - True if the token is valid, false otherwise.
     *
     * @throws io.jsonwebtoken.ExpiredJwtException - If the token has expired (re-thrown for filter handling).
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token);
            return true;
        } catch (io.jsonwebtoken.ExpiredJwtException e) {
            throw e; // let filter handle
        } catch (Exception e) {
            return false;
        }
    }

    /*
     * Utility method to generate a JWT secret key.
     * Used for generating the initial secret key for the application.
     * This method is commented out and should only be used during initial setup.
     *
     * @param args - Command line arguments (not used).
     *
    public static void main(String[] args) {
        byte[] key = Keys.secretKeyFor(SignatureAlgorithm.HS512).getEncoded();
        System.out.println(Base64.getEncoder().encodeToString(key));
    }*/
}
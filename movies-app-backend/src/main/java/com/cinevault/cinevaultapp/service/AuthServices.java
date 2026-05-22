package com.cinevault.cinevaultapp.service;

import com.cinevault.cinevaultapp.dto.AuthRequestDto;
import com.cinevault.cinevaultapp.dto.AuthResponseDto;
import com.cinevault.cinevaultapp.dto.UserProfileDto;
import com.cinevault.cinevaultapp.entity.UserEntity;
import com.cinevault.cinevaultapp.repository.IUserRepository;
import com.cinevault.cinevaultapp.security.JwtUtil;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;

/**
 * Service class for handling authentication operations.
 * Provides methods for user registration, login, and user retrieval.
 *
 * @author karthicknathan
 * @since Feb 04, 2026
 *
 * @version 1.0
 */
@Service
public class AuthServices {

    @Value("${google.client-id}")
    private String googleClientId;

    @Autowired
    private IUserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    /**
     * Registers a new user in the system.
     * Validates that the username is unique and encodes the password before saving.
     *
     * @param dto - The authentication request containing user registration details.
     *
     * @throws RuntimeException - If the username already exists.
     */
    public void register(AuthRequestDto dto) {
        if (userRepository.existsByUserName(dto.getUserName())) {
            throw new RuntimeException("Username already exists");
        }
        UserEntity userEntity = new UserEntity();
        userEntity.setFirstName(dto.getFirstName());
        userEntity.setLastName(dto.getLastName());
        userEntity.setUserName(dto.getUserName());
        userEntity.setPassword(passwordEncoder.encode(dto.getPassword()));

        userRepository.save(userEntity);
    }

    /**
     * Authenticates a user and generates a JWT token.
     * Validates the username and password before generating the authentication
     * token.
     *
     * @param dto - The authentication request containing username and password.
     * @return - An {@code AuthResponseDto} containing the username and JWT token.
     *
     * @throws RuntimeException - If the credentials are invalid.
     */
    public AuthResponseDto login(AuthRequestDto dto) {
        UserEntity userEntity = userRepository.findByUserName(dto.getUserName())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!passwordEncoder.matches(dto.getPassword(), userEntity.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        String token = jwtUtil.generateToken(userEntity.getUserName());
        String fullName = userEntity.getFullName();
        return new AuthResponseDto(userEntity.getUserName(), fullName, token);
    }

    /**
     * Retrieves a user by their username.
     *
     * @param username - The username of the user to retrieve.
     * @return - The {@code UserEntity} corresponding to the given username.
     *
     * @throws RuntimeException - If the user is not found.
     */
    public UserEntity getUser(String username) {
        return userRepository.findByUserName(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    /**
     * Verifies the Google ID token and returns an application JWT.
     *
     * @param idTokenString - The raw Google ID token from the frontend.
     * @return - {@link AuthResponseDto} containing the userName and app JWT.
     * @throws RuntimeException if the token is invalid or verification fails.
     */
    public AuthResponseDto authenticateWithGoogle(String idTokenString) {
        GoogleIdToken.Payload payload = verifyGoogleToken(idTokenString);
        String googleSub = payload.getSubject(); // unique Google user ID
        String email = payload.getEmail();
        String firstName = (String) payload.get("given_name");
        String lastName = (String) payload.get("family_name");
        String avatarUrl = (String) payload.get("picture");
        // Use email as the display userName; fall back to sub if email is absent.
        String userName = email != null ? email : googleSub;

        // Auto-provision the user on first sign-in — no registration step needed.
        userRepository.findByUserName(userName).orElseGet(() -> {
            UserEntity newUser = new UserEntity();
            newUser.setUserName(userName);
            newUser.setFirstName(firstName != null ? firstName : "");
            newUser.setLastName(lastName != null ? lastName : "");
            newUser.setAvatarUrl(avatarUrl);
            // Password is empty — this account is Google-only.
            newUser.setPassword("");
            return userRepository.save(newUser);
        });

        String appJwt = jwtUtil.generateToken(userName);
        return new AuthResponseDto(userName, firstName + " " + lastName, appJwt);
    }

    /**
     * Calls Google's verification endpoint and returns the validated payload.
     *
     * @param idTokenString - Raw Google ID token.
     * @return - Verified {@link GoogleIdToken.Payload}.
     * @throws RuntimeException if verification fails.
     */
    private GoogleIdToken.Payload verifyGoogleToken(String idTokenString) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(),
                    GsonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(idTokenString);
            if (idToken == null) {
                throw new RuntimeException("Invalid Google ID token");
            }
            return idToken.getPayload();
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Google token verification failed: " + e.getMessage(), e);
        }
    }
}
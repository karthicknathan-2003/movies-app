package com.cinevault.cinevaultapp.service;

import com.cinevault.cinevaultapp.dto.AuthRequestDto;
import com.cinevault.cinevaultapp.dto.AuthResponseDto;
import com.cinevault.cinevaultapp.entity.UserEntity;
import com.cinevault.cinevaultapp.repository.IUserRepository;
import com.cinevault.cinevaultapp.security.JwtUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Service class for handling authentication operations.
 * Provides methods for user registration, login, and user retrieval.
 *
 * @author karthicknathan
 * @since Feb 04, 2026
 */
@Service
public class AuthServices {

    @Value("${spring.security.oauth2.client.registration.google.client-id}")
    private String googleClientId;

    private final IUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    /**
     * Constructor for {@link AuthServices}.
     */
    public AuthServices(IUserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

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
     *
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
     *
     * @return - The {@code UserEntity} corresponding to the given username.
     *
     * @throws RuntimeException - If the user is not found.
     */
    public UserEntity getUser(String username) {
        return userRepository.findByUserName(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}